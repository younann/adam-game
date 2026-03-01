import React, { useState, useEffect, useCallback, useRef } from 'react';
import { playBoop, playWinSound } from '../utils/audio';
import Confetti from './Confetti';
import { renderPersonalizedText } from '../App';

const DIFFICULTIES = {
  easy: { grid: 5, collectibles: 3, color: '#2a9d8f' },
  medium: { grid: 8, collectibles: 5, color: '#f97316' },
  hard: { grid: 10, collectibles: 8, color: '#e63946' },
};

function shuffleArray(arr) {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Generate maze using recursive backtracking (DFS)
function generateMaze(rows, cols, numCollectibles) {
  // Initialize grid — every cell has all 4 walls
  const grid = [];
  for (let r = 0; r < rows; r++) {
    grid[r] = [];
    for (let c = 0; c < cols; c++) {
      grid[r][c] = {
        walls: { top: true, right: true, bottom: true, left: true },
        visited: false,
        hasCollectible: false,
        collectibleType: null,
        collected: false,
      };
    }
  }

  // Recursive backtracking
  const directions = [
    { dr: -1, dc: 0, wall: 'top', opposite: 'bottom' },
    { dr: 1, dc: 0, wall: 'bottom', opposite: 'top' },
    { dr: 0, dc: -1, wall: 'left', opposite: 'right' },
    { dr: 0, dc: 1, wall: 'right', opposite: 'left' },
  ];

  const stack = [];
  const startR = 0, startC = 0;
  grid[startR][startC].visited = true;
  stack.push({ r: startR, c: startC });

  while (stack.length > 0) {
    const { r, c } = stack[stack.length - 1];
    const neighbors = [];

    for (const d of directions) {
      const nr = r + d.dr;
      const nc = c + d.dc;
      if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && !grid[nr][nc].visited) {
        neighbors.push({ nr, nc, wall: d.wall, opposite: d.opposite });
      }
    }

    if (neighbors.length === 0) {
      stack.pop();
    } else {
      const { nr, nc, wall, opposite } = neighbors[Math.floor(Math.random() * neighbors.length)];
      grid[r][c].walls[wall] = false;
      grid[nr][nc].walls[opposite] = false;
      grid[nr][nc].visited = true;
      stack.push({ r: nr, c: nc });
    }
  }

  // Place collectibles on random cells (not start or finish)
  const candidates = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if ((r === 0 && c === 0) || (r === rows - 1 && c === cols - 1)) continue;
      candidates.push({ r, c });
    }
  }

  const shuffled = shuffleArray(candidates);
  const toPlace = Math.min(numCollectibles, shuffled.length);
  for (let i = 0; i < toPlace; i++) {
    const { r, c } = shuffled[i];
    grid[r][c].hasCollectible = true;
    grid[r][c].collectibleType = i % 2 === 0 ? 'gas' : 'trophy';
  }

  return grid;
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function MazeRunner({ onBack, lang, t }) {
  const [gamePhase, setGamePhase] = useState('select'); // select | playing | complete
  const [difficulty, setDifficulty] = useState('easy');
  const [maze, setMaze] = useState([]);
  const [playerPos, setPlayerPos] = useState({ row: 0, col: 0 });
  const [moves, setMoves] = useState(0);
  const [time, setTime] = useState(0);
  const [collected, setCollected] = useState(0);
  const [totalCollectibles, setTotalCollectibles] = useState(0);
  const [score, setScore] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const timerRef = useRef(null);

  const config = DIFFICULTIES[difficulty];
  const gridSize = config.grid;

  const startGame = useCallback(() => {
    const newMaze = generateMaze(config.grid, config.grid, config.collectibles);
    setMaze(newMaze);
    setPlayerPos({ row: 0, col: 0 });
    setMoves(0);
    setTime(0);
    setCollected(0);
    setTotalCollectibles(config.collectibles);
    setScore(0);
    setShowConfetti(false);
    setGamePhase('playing');
  }, [config]);

  // Timer
  useEffect(() => {
    if (gamePhase === 'playing') {
      timerRef.current = setInterval(() => {
        setTime((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gamePhase]);

  // Keyboard controls
  useEffect(() => {
    if (gamePhase !== 'playing') return;
    const handleKey = (e) => {
      const keyMap = {
        ArrowUp: 'up',
        ArrowDown: 'down',
        ArrowLeft: 'left',
        ArrowRight: 'right',
      };
      const dir = keyMap[e.key];
      if (dir) {
        e.preventDefault();
        movePlayer(dir);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  });

  const movePlayer = useCallback((direction) => {
    if (gamePhase !== 'playing') return;

    setPlayerPos((prev) => {
      const { row, col } = prev;
      const cell = maze[row]?.[col];
      if (!cell) return prev;

      // Check if wall blocks movement
      if (cell.walls[direction === 'up' ? 'top' : direction === 'down' ? 'bottom' : direction === 'left' ? 'left' : 'right']) {
        return prev;
      }

      const dr = direction === 'up' ? -1 : direction === 'down' ? 1 : 0;
      const dc = direction === 'left' ? -1 : direction === 'right' ? 1 : 0;
      const newRow = row + dr;
      const newCol = col + dc;

      if (newRow < 0 || newRow >= gridSize || newCol < 0 || newCol >= gridSize) return prev;

      playBoop();
      setMoves((m) => m + 1);

      // Check collectible
      const targetCell = maze[newRow][newCol];
      if (targetCell.hasCollectible && !targetCell.collected) {
        targetCell.collected = true;
        setCollected((c) => c + 1);
        setMaze([...maze]);
      }

      // Check win
      if (newRow === gridSize - 1 && newCol === gridSize - 1) {
        // Calculate score
        const timeBonus = Math.max(0, (300 - time) * 2);
        const collectedCount = maze.flat().filter((c) => c.hasCollectible && c.collected).length + (targetCell.hasCollectible && !targetCell.collected ? 1 : 0);
        const finalScore = 1000 + timeBonus + collectedCount * 50;
        setScore(finalScore);

        if (timerRef.current) clearInterval(timerRef.current);
        setTimeout(() => {
          playWinSound();
          setShowConfetti(true);
          setGamePhase('complete');
        }, 200);
      }

      return { row: newRow, col: newCol };
    });
  }, [gamePhase, maze, gridSize, time]);

  const handlePlayAgain = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    startGame();
  };

  const handleChangeDifficulty = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setGamePhase('select');
    setMaze([]);
    setShowConfetti(false);
  };

  // ─── Selection Screen ───
  if (gamePhase === 'select') {
    return (
      <div className="game-screen animate-slide-up" style={{ textAlign: 'center', width: '100%', position: 'relative', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', width: '100%', padding: '0 5px', gap: '10px' }}>
          <button onClick={onBack} style={{ background: 'rgba(0,0,0,0.5)', fontSize: '0.9rem', color: 'white', padding: '0.6rem 1.2rem', minWidth: '80px' }}>
            {t.back}
          </button>
          <h2 style={{ fontSize: 'clamp(1rem, 4.5vw, 1.8rem)', color: 'var(--lightning-yellow)', margin: 0, flex: 1 }}>
            {t.mazeGameTitle}
          </h2>
          <div style={{ minWidth: '80px' }} />
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: '1.5rem' }}>
          <p style={{ fontSize: 'clamp(1rem, 4vw, 1.4rem)', color: 'white', margin: 0 }}>
            {t.mazeGoal}
          </p>

          <div style={{ fontSize: '4rem', lineHeight: 1 }}>🏎️</div>

          <div style={{ display: 'flex', gap: '0.8rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            {Object.entries(DIFFICULTIES).map(([diff, cfg]) => {
              const label = diff === 'easy' ? t.mazeEasy : diff === 'medium' ? t.mazeMedium : t.mazeHard;
              return (
                <button
                  key={diff}
                  onClick={() => setDifficulty(diff)}
                  style={{
                    background: difficulty === diff ? cfg.color : 'rgba(255,255,255,0.1)',
                    color: 'white',
                    border: difficulty === diff ? '3px solid white' : '2px solid rgba(255,255,255,0.3)',
                    padding: '0.6rem 1.2rem',
                    borderRadius: '12px',
                    fontSize: 'clamp(0.85rem, 3.5vw, 1.1rem)',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    boxShadow: difficulty === diff ? `0 4px 15px ${cfg.color}66` : 'none',
                  }}
                >
                  {label} ({cfg.grid}x{cfg.grid})
                </button>
              );
            })}
          </div>

          <button
            onClick={startGame}
            style={{
              background: 'var(--mcqueen-red)',
              color: 'white',
              border: 'none',
              padding: '1rem 2.5rem',
              fontSize: 'clamp(1rem, 4vw, 1.4rem)',
              borderRadius: '15px',
              fontWeight: 'bold',
              cursor: 'pointer',
              boxShadow: '0 6px 20px rgba(0,0,0,0.4)',
              borderBottom: '5px solid #b32631',
            }}
          >
            {t.mazeStart}
          </button>
        </div>
      </div>
    );
  }

  // ─── Playing / Complete ───
  const cellSize = `clamp(${gridSize <= 5 ? '45px' : gridSize <= 8 ? '32px' : '26px'}, ${gridSize <= 5 ? '13vw' : gridSize <= 8 ? '9vw' : '7.5vw'}, ${gridSize <= 5 ? '60px' : gridSize <= 8 ? '45px' : '38px'})`;
  const wallWidth = gridSize <= 5 ? 3 : 2;
  const wallColor = 'rgba(255,255,255,0.8)';
  const diffLabel = difficulty === 'easy' ? t.mazeEasy : difficulty === 'medium' ? t.mazeMedium : t.mazeHard;

  return (
    <div className="game-screen animate-slide-up" style={{ textAlign: 'center', width: '100%', position: 'relative', flex: 1, display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem', width: '100%', padding: '0 5px', gap: '10px' }}>
        <button onClick={handleChangeDifficulty} style={{ background: 'rgba(0,0,0,0.5)', fontSize: '0.9rem', color: 'white', padding: '0.6rem 1.2rem', minWidth: '80px' }}>
          {t.back}
        </button>
        <h2 style={{ fontSize: 'clamp(0.9rem, 4vw, 1.5rem)', color: 'var(--lightning-yellow)', margin: 0, flex: 1 }}>
          {t.mazeGameTitle}
        </h2>
        <span style={{
          background: 'rgba(0,0,0,0.4)',
          padding: '0.4rem 0.8rem',
          borderRadius: '10px',
          color: 'white',
          fontSize: 'clamp(0.7rem, 2.5vw, 0.85rem)',
          fontWeight: 'bold',
          border: `2px solid ${config.color}`,
          minWidth: '70px',
          textAlign: 'center',
        }}>
          {diffLabel}
        </span>
      </div>

      {/* Stats bar */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        gap: '0.6rem',
        marginBottom: '0.4rem',
        flexWrap: 'wrap',
      }}>
        <span style={{
          fontSize: 'clamp(0.75rem, 2.8vw, 0.9rem)',
          color: 'white',
          fontWeight: 'bold',
          background: 'rgba(0,0,0,0.4)',
          padding: '0.3rem 0.8rem',
          borderRadius: '10px',
          border: '2px solid var(--vibrant-blue)',
        }}>
          {t.mazeTime}: <span dir="ltr">{formatTime(time)}</span>
        </span>
        <span style={{
          fontSize: 'clamp(0.75rem, 2.8vw, 0.9rem)',
          color: 'white',
          fontWeight: 'bold',
          background: 'rgba(0,0,0,0.4)',
          padding: '0.3rem 0.8rem',
          borderRadius: '10px',
          border: '2px solid var(--mcqueen-red)',
        }}>
          {t.mazeMoves}: <span dir="ltr">{moves}</span>
        </span>
        <span style={{
          fontSize: 'clamp(0.75rem, 2.8vw, 0.9rem)',
          color: 'white',
          fontWeight: 'bold',
          background: 'rgba(0,0,0,0.4)',
          padding: '0.3rem 0.8rem',
          borderRadius: '10px',
          border: '2px solid var(--lightning-yellow)',
        }}>
          ⛽ <span dir="ltr">{collected}/{totalCollectibles}</span>
        </span>
      </div>

      {/* Maze Grid */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${gridSize}, ${cellSize})`,
            gridTemplateRows: `repeat(${gridSize}, ${cellSize})`,
            direction: 'ltr',
            background: 'rgba(0,0,0,0.3)',
            borderRadius: '12px',
            padding: '4px',
            border: '3px solid rgba(255,255,255,0.3)',
            boxShadow: '0 8px 25px rgba(0,0,0,0.4)',
          }}
        >
          {maze.map((row, r) =>
            row.map((cell, c) => {
              const isPlayer = playerPos.row === r && playerPos.col === c;
              const isFinish = r === gridSize - 1 && c === gridSize - 1;
              const showCollectible = cell.hasCollectible && !cell.collected && !isPlayer;

              return (
                <div
                  key={`${r}-${c}`}
                  style={{
                    width: cellSize,
                    height: cellSize,
                    boxSizing: 'border-box',
                    borderTop: cell.walls.top ? `${wallWidth}px solid ${wallColor}` : `${wallWidth}px solid transparent`,
                    borderRight: cell.walls.right ? `${wallWidth}px solid ${wallColor}` : `${wallWidth}px solid transparent`,
                    borderBottom: cell.walls.bottom ? `${wallWidth}px solid ${wallColor}` : `${wallWidth}px solid transparent`,
                    borderLeft: cell.walls.left ? `${wallWidth}px solid ${wallColor}` : `${wallWidth}px solid transparent`,
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    background: isPlayer
                      ? 'rgba(255,183,3,0.25)'
                      : isFinish
                        ? 'rgba(42,157,143,0.15)'
                        : 'transparent',
                    position: 'relative',
                    fontSize: gridSize <= 5 ? 'clamp(1.2rem, 5vw, 1.8rem)' : gridSize <= 8 ? 'clamp(0.8rem, 3.5vw, 1.2rem)' : 'clamp(0.7rem, 2.8vw, 1rem)',
                    transition: 'background 0.15s',
                  }}
                >
                  {isPlayer && '🏎️'}
                  {!isPlayer && isFinish && '🏁'}
                  {showCollectible && (cell.collectibleType === 'gas' ? '⛽' : '🏆')}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* D-Pad Controls */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '0.3rem',
        padding: '0.5rem 0',
        marginTop: '0.3rem',
      }}>
        <button
          onClick={() => movePlayer('up')}
          style={dpadBtnStyle}
          aria-label="Move Up"
        >
          ⬆️
        </button>
        <div style={{ display: 'flex', gap: '0.3rem', alignItems: 'center' }}>
          <button
            onClick={() => movePlayer('left')}
            style={dpadBtnStyle}
            aria-label="Move Left"
          >
            ⬅️
          </button>
          <div style={{
            width: 'clamp(44px, 12vw, 56px)',
            height: 'clamp(44px, 12vw, 56px)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            fontSize: 'clamp(1.2rem, 4vw, 1.6rem)',
            background: 'rgba(0,0,0,0.3)',
            borderRadius: '12px',
          }}>
            🏎️
          </div>
          <button
            onClick={() => movePlayer('right')}
            style={dpadBtnStyle}
            aria-label="Move Right"
          >
            ➡️
          </button>
        </div>
        <button
          onClick={() => movePlayer('down')}
          style={dpadBtnStyle}
          aria-label="Move Down"
        >
          ⬇️
        </button>
      </div>

      {/* Win Overlay */}
      {gamePhase === 'complete' && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'rgba(0,0,0,0.9)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 10,
          padding: '1rem',
          borderRadius: '20px',
        }}>
          <h1 className="animate-zoom" style={{
            color: 'var(--lightning-yellow)',
            fontSize: 'clamp(1.8rem, 8vw, 3rem)',
            textAlign: 'center',
            marginBottom: '0.5rem',
          }}>
            {t.mazeComplete}
          </h1>
          <p style={{
            fontSize: 'clamp(1rem, 4vw, 1.3rem)',
            color: 'white',
            margin: '0.5rem 0',
            textAlign: 'center',
          }}>
            {renderPersonalizedText(t.greatJob, lang)}
          </p>

          {/* Stats */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.4rem',
            margin: '1rem 0',
            background: 'rgba(255,255,255,0.05)',
            padding: '1rem 1.5rem',
            borderRadius: '15px',
            border: '2px solid rgba(255,255,255,0.15)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '2rem', color: 'white', fontSize: 'clamp(0.9rem, 3.5vw, 1.1rem)' }}>
              <span>{t.mazeTime}:</span>
              <span dir="ltr" style={{ fontWeight: 'bold' }}>{formatTime(time)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '2rem', color: 'white', fontSize: 'clamp(0.9rem, 3.5vw, 1.1rem)' }}>
              <span>{t.mazeMoves}:</span>
              <span dir="ltr" style={{ fontWeight: 'bold' }}>{moves}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '2rem', color: 'white', fontSize: 'clamp(0.9rem, 3.5vw, 1.1rem)' }}>
              <span>{t.mazeCollected}:</span>
              <span dir="ltr" style={{ fontWeight: 'bold' }}>{collected}/{totalCollectibles}</span>
            </div>
            <div style={{ height: '1px', background: 'rgba(255,255,255,0.15)', margin: '0.3rem 0' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '2rem', color: 'var(--lightning-yellow)', fontSize: 'clamp(1rem, 4vw, 1.3rem)', fontWeight: 'bold' }}>
              <span>{t.mazeScore}:</span>
              <span dir="ltr">{score}</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
            <button
              onClick={handlePlayAgain}
              style={{
                background: 'var(--mcqueen-red)',
                color: 'white',
                fontSize: 'clamp(1rem, 4vw, 1.3rem)',
                padding: '0.8rem 1.8rem',
                borderRadius: '15px',
                border: 'none',
                fontWeight: 'bold',
                cursor: 'pointer',
                boxShadow: '0 5px 15px rgba(0,0,0,0.4)',
              }}
            >
              {t.mazePlayAgain}
            </button>
            <button
              onClick={handleChangeDifficulty}
              style={{
                background: config.color,
                color: 'white',
                fontSize: 'clamp(1rem, 4vw, 1.3rem)',
                padding: '0.8rem 1.8rem',
                borderRadius: '15px',
                border: 'none',
                fontWeight: 'bold',
                cursor: 'pointer',
                boxShadow: '0 5px 15px rgba(0,0,0,0.4)',
              }}
            >
              {t.mazeNewMaze}
            </button>
          </div>
        </div>
      )}

      {showConfetti && <Confetti onDone={() => setShowConfetti(false)} />}
    </div>
  );
}

const dpadBtnStyle = {
  width: 'clamp(44px, 12vw, 56px)',
  height: 'clamp(44px, 12vw, 56px)',
  fontSize: 'clamp(1.2rem, 4vw, 1.6rem)',
  background: 'rgba(255,255,255,0.1)',
  border: '2px solid rgba(255,255,255,0.3)',
  borderRadius: '12px',
  cursor: 'pointer',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  color: 'white',
  touchAction: 'manipulation',
  userSelect: 'none',
  boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
  padding: 0,
};
