import React, { useState, useMemo, useRef, useCallback } from 'react';
import { playBoop, playWinSound } from '../utils/audio';
import Confetti from './Confetti';
import { renderPersonalizedText } from '../App';

function shuffleArray(arr) {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export default function SignMatcher({ onBack, lang, t }) {
  const shapes = [
    { id: 'stop', name: t.octagon, sign: 'STOP', color: '#e63946', borderRadius: '30%' },
    { id: 'yield', name: t.triangle, sign: 'YIELD', color: '#ffb703', clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' },
    { id: 'go', name: t.circle, sign: 'GO', color: '#2a9d8f', borderRadius: '50%' },
    { id: 'speed', name: t.rectangle, sign: 'SPEED', color: '#457b9d', borderRadius: '10%' },
    { id: 'warning', name: t.diamond, sign: '⚠️', color: '#f4a261', clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)' },
    { id: 'special', name: t.star, sign: '★', color: '#8338ec', clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)' },
  ];

  const [currentIdx, setCurrentIdx] = useState(0);
  const [matched, setMatched] = useState(false);
  const [score, setScore] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [gameComplete, setGameComplete] = useState(false);
  const [shuffleKey, setShuffleKey] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const [dragState, setDragState] = useState(null);
  const [wrongId, setWrongId] = useState(null);

  const targetRef = useRef(null);

  const shuffledShapes = useMemo(() => shuffleArray(shapes), [shuffleKey, t]);

  const currentShape = shapes[currentIdx];

  const isOverTarget = useCallback((x, y) => {
    if (!targetRef.current) return false;
    const rect = targetRef.current.getBoundingClientRect();
    return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
  }, []);

  const handleDrop = useCallback((shapeId, x, y) => {
    if (matched || gameComplete) return;

    if (!isOverTarget(x, y)) {
      setDragState(null);
      return;
    }

    if (shapeId === currentShape.id) {
      setDragState(null);
      setMatched(true);
      setScore((prev) => prev + (attempts === 0 ? 2 : 1));
      if (currentIdx < shapes.length - 1) {
        playWinSound();
        setShowConfetti(true);
        setTimeout(() => {
          setMatched(false);
          setAttempts(0);
          setCurrentIdx((prev) => prev + 1);
          setShuffleKey((prev) => prev + 1);
          setShowConfetti(false);
        }, 1500);
      } else {
        setGameComplete(true);
        playWinSound();
        setShowConfetti(true);
      }
    } else {
      setDragState(null);
      setAttempts((prev) => prev + 1);
      playBoop();
      setWrongId(shapeId);
      setTimeout(() => setWrongId(null), 500);
    }
  }, [matched, gameComplete, currentShape, currentIdx, shapes.length, attempts, isOverTarget]);

  // Touch handlers
  const handleTouchStart = useCallback((e, shapeId) => {
    if (matched || gameComplete) return;
    e.preventDefault();
    const touch = e.touches[0];
    setDragState({
      shapeId,
      currentX: touch.clientX,
      currentY: touch.clientY,
    });
  }, [matched, gameComplete]);

  const handleTouchMove = useCallback((e) => {
    if (!dragState) return;
    e.preventDefault();
    const touch = e.touches[0];
    setDragState((prev) => ({
      ...prev,
      currentX: touch.clientX,
      currentY: touch.clientY,
    }));
  }, [dragState]);

  const handleTouchEnd = useCallback(() => {
    if (!dragState) return;
    handleDrop(dragState.shapeId, dragState.currentX, dragState.currentY);
  }, [dragState, handleDrop]);

  // Mouse handlers (for desktop testing)
  const handleMouseDown = useCallback((e, shapeId) => {
    if (matched || gameComplete) return;
    e.preventDefault();
    setDragState({
      shapeId,
      currentX: e.clientX,
      currentY: e.clientY,
    });
  }, [matched, gameComplete]);

  const handleMouseMove = useCallback((e) => {
    if (!dragState) return;
    setDragState((prev) => ({
      ...prev,
      currentX: e.clientX,
      currentY: e.clientY,
    }));
  }, [dragState]);

  const handleMouseUp = useCallback(() => {
    if (!dragState) return;
    handleDrop(dragState.shapeId, dragState.currentX, dragState.currentY);
  }, [dragState, handleDrop]);

  const handlePlayAgain = () => {
    setCurrentIdx(0);
    setScore(0);
    setAttempts(0);
    setGameComplete(false);
    setMatched(false);
    setShuffleKey((prev) => prev + 1);
    setShowConfetti(false);
    setDragState(null);
    setWrongId(null);
  };

  const draggedShape = dragState ? shapes.find((s) => s.id === dragState.shapeId) || shuffledShapes.find((s) => s.id === dragState.shapeId) : null;

  const isOverDropZone = dragState ? isOverTarget(dragState.currentX, dragState.currentY) : false;

  return (
    <div
      className="game-screen animate-slide-up"
      style={{ textAlign: 'center', width: '100%', position: 'relative', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', userSelect: 'none' }}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', width: '100%', padding: '0 5px', gap: '10px' }}>
        <button onClick={onBack} style={{ background: 'rgba(0,0,0,0.5)', fontSize: '0.9rem', color: 'white', padding: '0.6rem 1.2rem', minWidth: '80px' }}>{t.back}</button>
        <h2 style={{ fontSize: 'clamp(1rem, 4.5vw, 1.8rem)', color: 'var(--lightning-yellow)', margin: 0, flex: 1 }}>{t.signMatcherTitle}</h2>
        <div style={{ minWidth: '80px' }}></div>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
        {/* Round and Score Display */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', marginBottom: '1rem', fontSize: 'clamp(0.9rem, 4vw, 1.1rem)', color: 'white' }}>
          <span style={{ background: 'rgba(0,0,0,0.3)', padding: '4px 12px', borderRadius: '10px' }}>{t.signLevel} {currentIdx + 1} {t.signOf} {shapes.length}</span>
          <span style={{ background: 'rgba(0,0,0,0.3)', padding: '4px 12px', borderRadius: '10px' }}>{t.signScore}: {score}</span>
        </div>

        {/* Fuel Gauge Progress */}
        <div style={{ width: 'clamp(150px, 40vw, 220px)', height: '16px', background: 'rgba(255,255,255,0.1)', margin: '0 auto 1.5rem', borderRadius: '15px', border: '3px solid white', overflow: 'hidden', position: 'relative', boxShadow: '0 4px 10px rgba(0,0,0,0.3)' }}>
            <div style={{ width: `${((gameComplete ? shapes.length : currentIdx) / shapes.length) * 100}%`, height: '100%', background: 'var(--vibrant-blue)', transition: 'width 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)' }}></div>
        </div>

        <div style={{ marginBottom: '2rem' }}>
          <p style={{ fontSize: '1.4rem', marginBottom: '1.2rem', color: 'white' }}>
            {t.dragThe || t.findThe} <strong style={{ color: currentShape.color, textShadow: '1px 1px 2px black' }}>{currentShape.name}</strong>
          </p>
          {/* Drop target zone */}
          <div
            ref={targetRef}
            style={{
              width: 'clamp(110px, 35vw, 160px)',
              height: 'clamp(110px, 35vw, 160px)',
              background: isOverDropZone ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.05)',
              border: isOverDropZone ? '4px dashed var(--lightning-yellow)' : '4px dashed rgba(255,255,255,0.5)',
              margin: '0 auto',
              borderRadius: currentShape.borderRadius || '0',
              clipPath: currentShape.clipPath || 'none',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              fontSize: matched ? '5rem' : '2rem',
              color: 'white',
              boxShadow: matched ? '0 0 30px var(--lightning-yellow)' : isOverDropZone ? '0 0 20px rgba(255,183,3,0.3)' : 'none',
              transition: 'all 0.3s'
            }}
          >
            {matched ? '🌟' : '?'}
          </div>
        </div>

        {/* Draggable shapes */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '1.2rem', flexWrap: 'wrap', padding: '0 10px', maxWidth: '450px' }}>
          {shuffledShapes.map((s) => (
            <div
              key={s.id}
              onTouchStart={(e) => handleTouchStart(e, s.id)}
              onMouseDown={(e) => handleMouseDown(e, s.id)}
              className={wrongId === s.id ? 'wobble' : ''}
              style={{
                width: 'clamp(75px, 22vw, 95px)',
                height: 'clamp(75px, 22vw, 95px)',
                background: s.color,
                borderRadius: s.borderRadius || '0',
                clipPath: s.clipPath || 'none',
                cursor: 'grab',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                color: 'white',
                fontWeight: 'bold',
                fontSize: '0.85rem',
                transition: dragState?.shapeId === s.id ? 'none' : 'all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                boxShadow: '0 8px 15px rgba(0,0,0,0.4)',
                opacity: dragState?.shapeId === s.id ? 0.3 : 1,
                touchAction: 'none',
                border: '3px solid rgba(255,255,255,0.5)',
              }}
            >
              {s.sign}
            </div>
          ))}
        </div>
      </div>

      {matched && !gameComplete && (
        <div className="animate-zoom" style={{ marginTop: '1.5rem', color: 'var(--lightning-yellow)', fontSize: 'clamp(1.2rem, 5vw, 1.8rem)' }}>
          {renderPersonalizedText(t.greatJob, lang)}
        </div>
      )}

      {gameComplete && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.85)',
          display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
          zIndex: 1000, padding: '2rem'
        }}>
          <h1 className="animate-zoom" style={{ color: 'var(--lightning-yellow)', fontSize: 'clamp(1.5rem, 6vw, 2.5rem)', marginBottom: '1rem', textAlign: 'center' }}>
            {t.signComplete}
          </h1>
          <p style={{ color: 'white', fontSize: 'clamp(1.2rem, 4vw, 1.8rem)', marginBottom: '1rem' }}>
            {t.signScore}: {score} / {shapes.length * 2}
          </p>
          <p style={{ color: 'var(--lightning-yellow)', fontSize: 'clamp(1rem, 4vw, 1.5rem)', marginBottom: '2rem' }}>
            {renderPersonalizedText(t.greatJob, lang)}
          </p>
          <button
            onClick={handlePlayAgain}
            style={{
              background: 'var(--vibrant-blue)', color: 'white', border: 'none',
              padding: '1rem 2rem', fontSize: 'clamp(1rem, 4vw, 1.5rem)',
              borderRadius: '15px', cursor: 'pointer', fontWeight: 'bold',
              boxShadow: '0 5px 15px rgba(0,0,0,0.4)', touchAction: 'manipulation'
            }}
          >
            {t.playAgain}
          </button>
        </div>
      )}

      {/* Floating dragged shape following finger/cursor */}
      {dragState && draggedShape && (
        <div
          style={{
            position: 'fixed',
            left: dragState.currentX - 45,
            top: dragState.currentY - 45,
            width: '90px',
            height: '90px',
            background: draggedShape.color,
            borderRadius: draggedShape.borderRadius || '0',
            clipPath: draggedShape.clipPath || 'none',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            color: 'white',
            fontWeight: 'bold',
            fontSize: '0.85rem',
            border: '3px solid white',
            boxShadow: '0 12px 30px rgba(0,0,0,0.6)',
            transform: 'scale(1.15)',
            pointerEvents: 'none',
            zIndex: 2000,
            opacity: 0.9,
          }}
        >
          {draggedShape.sign}
        </div>
      )}

      {showConfetti && <Confetti onDone={() => setShowConfetti(false)} />}
    </div>
  );
}
