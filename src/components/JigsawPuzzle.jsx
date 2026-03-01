import React, { useState, useRef, useEffect, useCallback } from 'react';
import { playBoop, playWinSound } from '../utils/audio';
import Confetti from './Confetti';
import { renderPersonalizedText } from '../App';
import car1 from '../assets/cars/770c1752bd3dc58917586f5272de4068.jpg';
import car2 from '../assets/cars/cars_3_characters-2.avif';
import car3 from '../assets/cars/cars_3_characters-9.avif';
import car4 from '../assets/cars/images.jpeg';
import car5 from '../assets/cars/images12.jpeg';
import car6 from '../assets/cars/images2.jpeg';

const PUZZLE_IMAGES = [car1, car2, car3, car4, car5, car6];

const DIFFICULTIES = {
  easy: 2,
  medium: 3,
  hard: 4,
};

function shuffleArray(arr) {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function sliceImage(img, gridSize) {
  const pieceW = Math.floor(img.naturalWidth / gridSize);
  const pieceH = Math.floor(img.naturalHeight / gridSize);
  const pieces = [];

  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      const canvas = document.createElement('canvas');
      canvas.width = pieceW;
      canvas.height = pieceH;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, col * pieceW, row * pieceH, pieceW, pieceH, 0, 0, pieceW, pieceH);
      pieces.push({
        id: `${row}-${col}`,
        row,
        col,
        dataUrl: canvas.toDataURL('image/jpeg', 0.85),
        placed: false,
      });
    }
  }
  return pieces;
}

export default function JigsawPuzzle({ onBack, lang, t }) {
  const [gamePhase, setGamePhase] = useState('select');
  const [selectedImageIdx, setSelectedImageIdx] = useState(0);
  const [difficulty, setDifficulty] = useState('easy');
  const [pieces, setPieces] = useState([]);
  const [shuffledPieces, setShuffledPieces] = useState([]);
  const [dragPiece, setDragPiece] = useState(null); // { id, x, y }
  const [hoverCellId, setHoverCellId] = useState(null);
  const [showConfetti, setShowConfetti] = useState(false);

  const cellRefs = useRef({});
  const dragRef = useRef(null);
  const handleDropRef = useRef(null);
  const findCellRef = useRef(null);

  const gridSize = DIFFICULTIES[difficulty];
  const placedCount = pieces.filter((p) => p.placed).length;
  const totalPieces = pieces.length;

  // Start game: load image and slice it
  const startGame = useCallback(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const sliced = sliceImage(img, DIFFICULTIES[difficulty]);
      setPieces(sliced);
      setShuffledPieces(shuffleArray(sliced.map((p) => p.id)));
      setGamePhase('playing');
    };
    img.src = PUZZLE_IMAGES[selectedImageIdx];
  }, [selectedImageIdx, difficulty]);

  // Find which cell the coords are over (with tolerance)
  const findTargetCell = useCallback((x, y) => {
    const tolerance = 8;
    for (const [cellId, el] of Object.entries(cellRefs.current)) {
      if (!el) continue;
      const rect = el.getBoundingClientRect();
      if (
        x >= rect.left - tolerance &&
        x <= rect.right + tolerance &&
        y >= rect.top - tolerance &&
        y <= rect.bottom + tolerance
      ) {
        return cellId;
      }
    }
    return null;
  }, []);

  useEffect(() => {
    findCellRef.current = findTargetCell;
  }, [findTargetCell]);

  // Handle drop
  const handleDrop = useCallback((pieceId, x, y) => {
    const cellId = findTargetCell(x, y);
    setDragPiece(null);
    setHoverCellId(null);

    if (!cellId) return;

    if (cellId === pieceId) {
      playBoop();
      setPieces((prev) => {
        const updated = prev.map((p) => (p.id === pieceId ? { ...p, placed: true } : p));
        const newPlacedCount = updated.filter((p) => p.placed).length;
        if (newPlacedCount === updated.length) {
          setTimeout(() => {
            playWinSound();
            setShowConfetti(true);
            setGamePhase('complete');
          }, 300);
        }
        return updated;
      });
      setShuffledPieces((prev) => prev.filter((id) => id !== pieceId));
    } else {
      // Wrong cell — wobble the piece
      const el = document.getElementById(`tray-piece-${pieceId}`);
      if (el) {
        el.classList.add('wobble');
        el.style.border = '3px solid #e63946';
        setTimeout(() => {
          el.classList.remove('wobble');
          el.style.border = '3px solid rgba(255,255,255,0.5)';
        }, 600);
      }
    }
  }, [findTargetCell]);

  // Keep refs in sync
  useEffect(() => {
    dragRef.current = dragPiece;
  }, [dragPiece]);
  useEffect(() => {
    handleDropRef.current = handleDrop;
  }, [handleDrop]);

  // Drag handlers
  const handleMouseDown = useCallback((e, pieceId) => {
    e.preventDefault();
    setDragPiece({ id: pieceId, x: e.clientX, y: e.clientY });
  }, []);

  const handleTouchStart = useCallback((e, pieceId) => {
    e.preventDefault();
    const touch = e.touches[0];
    setDragPiece({ id: pieceId, x: touch.clientX, y: touch.clientY });
  }, []);

  // Window-level move/end listeners
  useEffect(() => {
    if (!dragPiece) return;

    const onMouseMove = (e) => {
      setDragPiece((prev) => (prev ? { ...prev, x: e.clientX, y: e.clientY } : null));
      const cell = findCellRef.current?.(e.clientX, e.clientY);
      setHoverCellId(cell);
    };
    const onMouseUp = (e) => {
      const d = dragRef.current;
      if (d) handleDropRef.current(d.id, e.clientX, e.clientY);
    };
    const onTouchMove = (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      setDragPiece((prev) => (prev ? { ...prev, x: touch.clientX, y: touch.clientY } : null));
      const cell = findCellRef.current?.(touch.clientX, touch.clientY);
      setHoverCellId(cell);
    };
    const onTouchEnd = (e) => {
      const d = dragRef.current;
      if (d) {
        // Use changedTouches for accurate final position
        const touch = e.changedTouches?.[0];
        const x = touch ? touch.clientX : d.x;
        const y = touch ? touch.clientY : d.y;
        handleDropRef.current(d.id, x, y);
      }
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend', onTouchEnd);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, [!!dragPiece]);

  const handlePlayAgain = () => {
    setGamePhase('select');
    setPieces([]);
    setShuffledPieces([]);
    setDragPiece(null);
    setHoverCellId(null);
    setShowConfetti(false);
  };

  const handleNextImage = () => {
    setSelectedImageIdx((prev) => (prev + 1) % PUZZLE_IMAGES.length);
    setGamePhase('select');
    setPieces([]);
    setShuffledPieces([]);
    setDragPiece(null);
    setHoverCellId(null);
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
            {t.jigsawGameTitle}
          </h2>
          <div style={{ minWidth: '80px' }} />
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: '1.5rem' }}>
          <p style={{ fontSize: 'clamp(1rem, 4vw, 1.4rem)', color: 'white', margin: 0 }}>
            {t.jigsawChoose}
          </p>

          <div style={{ display: 'flex', gap: '0.8rem', flexWrap: 'wrap', justifyContent: 'center', maxWidth: '450px' }}>
            {PUZZLE_IMAGES.map((src, idx) => (
              <div
                key={idx}
                onClick={() => setSelectedImageIdx(idx)}
                style={{
                  width: 'clamp(70px, 20vw, 100px)',
                  height: 'clamp(70px, 20vw, 100px)',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  border: selectedImageIdx === idx ? '4px solid var(--lightning-yellow)' : '3px solid rgba(255,255,255,0.3)',
                  boxShadow: selectedImageIdx === idx ? '0 0 15px rgba(255,183,3,0.5)' : '0 4px 10px rgba(0,0,0,0.3)',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  transform: selectedImageIdx === idx ? 'scale(1.08)' : 'scale(1)',
                }}
              >
                <img src={src} alt={`Car ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '0.8rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            {Object.keys(DIFFICULTIES).map((diff) => {
              const label = diff === 'easy' ? t.jigsawEasy : diff === 'medium' ? t.jigsawMedium : t.jigsawHard;
              const grid = DIFFICULTIES[diff];
              return (
                <button
                  key={diff}
                  onClick={() => setDifficulty(diff)}
                  style={{
                    background: difficulty === diff ? '#f97316' : 'rgba(255,255,255,0.1)',
                    color: 'white',
                    border: difficulty === diff ? '3px solid white' : '2px solid rgba(255,255,255,0.3)',
                    padding: '0.6rem 1.2rem',
                    borderRadius: '12px',
                    fontSize: 'clamp(0.85rem, 3.5vw, 1.1rem)',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    boxShadow: difficulty === diff ? '0 4px 15px rgba(249,115,22,0.4)' : 'none',
                  }}
                >
                  {label} ({grid}x{grid})
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
            START
          </button>
        </div>
      </div>
    );
  }

  // ─── Playing / Complete Screen ───
  const boardSize = `clamp(220px, ${gridSize <= 3 ? '70vw' : '80vw'}, ${gridSize <= 3 ? '360px' : '400px'})`;

  return (
    <div className="game-screen animate-slide-up" style={{ textAlign: 'center', width: '100%', position: 'relative', flex: 1, display: 'flex', flexDirection: 'column', userSelect: 'none', touchAction: 'none' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', width: '100%', padding: '0 5px', gap: '10px' }}>
        <button onClick={handlePlayAgain} style={{ background: 'rgba(0,0,0,0.5)', fontSize: '0.9rem', color: 'white', padding: '0.6rem 1.2rem', minWidth: '80px' }}>
          {t.back}
        </button>
        <h2 style={{ fontSize: 'clamp(1rem, 4.5vw, 1.5rem)', color: 'var(--lightning-yellow)', margin: 0, flex: 1 }}>
          {t.jigsawGameTitle}
        </h2>
        <span style={{
          background: 'rgba(0,0,0,0.4)',
          padding: '0.4rem 0.8rem',
          borderRadius: '10px',
          color: 'white',
          fontSize: 'clamp(0.75rem, 3vw, 0.9rem)',
          fontWeight: 'bold',
          border: '2px solid #f97316',
          minWidth: '80px',
          textAlign: 'center',
        }}>
          {difficulty === 'easy' ? t.jigsawEasy : difficulty === 'medium' ? t.jigsawMedium : t.jigsawHard}
        </span>
      </div>

      {/* Puzzle Board */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
            gridTemplateRows: `repeat(${gridSize}, 1fr)`,
            direction: 'ltr',
            width: boardSize,
            height: boardSize,
            gap: '2px',
            background: 'rgba(0,0,0,0.3)',
            borderRadius: '12px',
            padding: '4px',
            border: '3px solid rgba(255,255,255,0.3)',
            boxShadow: '0 8px 25px rgba(0,0,0,0.4)',
          }}
        >
          {pieces.map((piece) => {
            const isHovered = dragPiece && hoverCellId === piece.id;
            const isCorrectHover = isHovered && dragPiece.id === piece.id;
            const isWrongHover = isHovered && dragPiece.id !== piece.id;

            return (
              <div
                key={piece.id}
                ref={(el) => { cellRefs.current[piece.id] = el; }}
                style={{
                  background: piece.placed
                    ? 'transparent'
                    : isCorrectHover
                      ? 'rgba(42, 157, 143, 0.25)'
                      : isWrongHover
                        ? 'rgba(230, 57, 70, 0.15)'
                        : 'rgba(255,255,255,0.03)',
                  border: piece.placed
                    ? 'none'
                    : isCorrectHover
                      ? '2px solid rgba(42, 157, 143, 0.8)'
                      : isWrongHover
                        ? '2px solid rgba(230, 57, 70, 0.5)'
                        : '2px dashed rgba(255,255,255,0.15)',
                  borderRadius: '4px',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  overflow: 'hidden',
                  aspectRatio: '1',
                  position: 'relative',
                  transition: 'background 0.15s, border 0.15s',
                }}
              >
                {piece.placed ? (
                  <img
                    src={piece.dataUrl}
                    alt=""
                    style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '3px' }}
                  />
                ) : (
                  /* Ghost image hint */
                  <img
                    src={piece.dataUrl}
                    alt=""
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      borderRadius: '3px',
                      opacity: 0.15,
                      filter: 'grayscale(0.5)',
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Progress bar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.8rem',
          marginTop: '0.8rem',
          width: boardSize,
          maxWidth: '100%',
        }}>
          <div style={{
            flex: 1,
            height: '14px',
            background: 'rgba(255,255,255,0.1)',
            borderRadius: '10px',
            border: '2px solid rgba(255,255,255,0.3)',
            overflow: 'hidden',
          }}>
            <div style={{
              width: `${totalPieces > 0 ? (placedCount / totalPieces) * 100 : 0}%`,
              height: '100%',
              background: 'linear-gradient(90deg, #f97316, var(--lightning-yellow))',
              borderRadius: '8px',
              transition: 'width 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
            }} />
          </div>
          <span dir="ltr" style={{
            color: 'white',
            fontSize: 'clamp(0.75rem, 3vw, 0.9rem)',
            fontWeight: 'bold',
            whiteSpace: 'nowrap',
          }}>
            {placedCount}/{totalPieces} {t.jigsawPieces}
          </span>
        </div>
      </div>

      {/* Piece Tray */}
      <div style={{
        display: 'flex',
        gap: '0.6rem',
        padding: '0.8rem',
        overflowX: 'auto',
        overflowY: 'hidden',
        justifyContent: shuffledPieces.length <= 6 ? 'center' : 'flex-start',
        alignItems: 'center',
        background: 'rgba(0,0,0,0.3)',
        borderRadius: '12px',
        border: '2px solid rgba(255,255,255,0.15)',
        minHeight: 'clamp(70px, 18vw, 100px)',
        marginTop: '0.5rem',
        WebkitOverflowScrolling: 'touch',
      }}>
        {shuffledPieces.map((pieceId) => {
          const piece = pieces.find((p) => p.id === pieceId);
          if (!piece || piece.placed) return null;
          const pieceSize = `clamp(55px, ${gridSize <= 3 ? '16vw' : '14vw'}, ${gridSize <= 3 ? '85px' : '75px'})`;
          return (
            <div
              key={piece.id}
              id={`tray-piece-${piece.id}`}
              onMouseDown={(e) => handleMouseDown(e, piece.id)}
              onTouchStart={(e) => handleTouchStart(e, piece.id)}
              style={{
                width: pieceSize,
                height: pieceSize,
                minWidth: pieceSize,
                borderRadius: '8px',
                overflow: 'hidden',
                border: '3px solid rgba(255,255,255,0.5)',
                boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
                cursor: dragPiece?.id === piece.id ? 'grabbing' : 'grab',
                opacity: dragPiece?.id === piece.id ? 0.3 : 1,
                transition: dragPiece?.id === piece.id ? 'none' : 'opacity 0.2s, transform 0.2s',
                touchAction: 'none',
                flexShrink: 0,
              }}
            >
              <img
                src={piece.dataUrl}
                alt=""
                draggable={false}
                style={{ width: '100%', height: '100%', objectFit: 'cover', pointerEvents: 'none' }}
              />
            </div>
          );
        })}
        {shuffledPieces.length === 0 && gamePhase === 'playing' && (
          <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '1rem' }}>
            {t.jigsawComplete}
          </span>
        )}
      </div>

      {/* Floating dragged piece */}
      {dragPiece && (() => {
        const piece = pieces.find((p) => p.id === dragPiece.id);
        if (!piece) return null;
        const size = gridSize <= 3 ? 80 : 65;
        return (
          <div style={{
            position: 'fixed',
            left: dragPiece.x - size / 2,
            top: dragPiece.y - size / 2,
            width: size,
            height: size,
            borderRadius: '8px',
            overflow: 'hidden',
            border: '3px solid white',
            boxShadow: '0 12px 30px rgba(0,0,0,0.6)',
            transform: 'scale(1.15)',
            pointerEvents: 'none',
            zIndex: 2000,
            opacity: 0.9,
          }}>
            <img src={piece.dataUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
        );
      })()}

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
            {t.jigsawComplete}
          </h1>
          <p style={{
            fontSize: 'clamp(1rem, 4vw, 1.3rem)',
            color: 'white',
            margin: '0.5rem 0 1.5rem',
            textAlign: 'center',
          }}>
            {renderPersonalizedText(t.greatJob, lang)}
          </p>
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
              {t.jigsawPlayAgain}
            </button>
            <button
              onClick={handleNextImage}
              style={{
                background: '#f97316',
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
              {t.jigsawNextImage}
            </button>
          </div>
        </div>
      )}

      {showConfetti && <Confetti onDone={() => setShowConfetti(false)} />}
    </div>
  );
}
