import React, { useState, useEffect } from 'react';
import { playBoop, playWinSound } from '../utils/audio';
import Confetti from './Confetti';
import { renderPersonalizedText } from '../App';

const CAR_TYPES = [
  { type: 'car', width: 100, height: 50, emoji: '🚗' },
  { type: 'truck', width: 130, height: 55, emoji: '🚛' },
  { type: 'sports', width: 80, height: 45, emoji: '🏎️' },
];

const getLevels = (t) => [
  { id: 1, target: 3, speed: 2000, title: t.lapsTitle || "Warm Up Laps" },
  { id: 2, target: 5, speed: 1500, title: t.lapsTitle2 || "Piston Cup Heat" },
  { id: 3, target: 8, speed: 1000, title: t.lapsTitle3 || "Radiator Springs Race" },
  { id: 4, target: 10, speed: 800, title: t.lapsTitle4 || "World Grand Prix" },
  { id: 5, target: 5, speed: 1200, title: t.lapsTitle5 || "Color Cup Challenge", filterColor: '#e63946', filterColorName: t.red || 'Red' },
  { id: 6, target: 8, speed: 700, title: t.lapsTitle6 || "Turbo Championship", filterColor: '#457b9d', filterColorName: t.blue || 'Blue' },
];

export default function CountingGame({ onBack, lang, t }) {
  const [levelIdx, setLevelIdx] = useState(0);
  const [count, setCount] = useState(0);
  const [cars, setCars] = useState([]);
  const [gameStatus, setGameStatus] = useState('playing'); // playing, won
  const [wobbleId, setWobbleId] = useState(null);
  const [showConfetti, setShowConfetti] = useState(false);

  const levels = getLevels(t);
  const currentLevel = levels[levelIdx];

  useEffect(() => {
    if (gameStatus !== 'playing') return;

    const interval = setInterval(() => {
      const carType = CAR_TYPES[Math.floor(Math.random() * CAR_TYPES.length)];
      const newCar = {
        id: Date.now(),
        x: -100,
        y: Math.random() * 70 + 10, // Avoid edge
        color: ['#e63946', '#ffb703', '#457b9d', '#2a9d8f'][Math.floor(Math.random() * 4)],
        speed: Math.random() * 2 + 2,
        type: carType.type,
        width: carType.width,
        height: carType.height,
        emoji: carType.emoji,
      };
      setCars(prev => [...prev.slice(-10), newCar]);
    }, currentLevel.speed);

    return () => clearInterval(interval);
  }, [levelIdx, gameStatus]);

  useEffect(() => {
    const animation = setInterval(() => {
      setCars(prev => {
        if (prev.length === 0) return prev; // Don't trigger re-render when empty
        return prev.map(car => ({ ...car, x: car.x + car.speed })).filter(car => car.x < 1200);
      });
    }, 16);
    return () => clearInterval(animation);
  }, []);

  const handleCarClick = (id) => {
    if (gameStatus !== 'playing') return;

    // Check if this is a color-filter level and the car color doesn't match
    if (currentLevel.filterColor) {
      const clickedCar = cars.find(car => car.id === id);
      if (clickedCar && clickedCar.color !== currentLevel.filterColor) {
        // Wrong color: wobble, remove car, play boop, but do NOT increment count
        setWobbleId(id);
        setTimeout(() => setWobbleId(null), 500);
        setCars(prev => prev.filter(car => car.id !== id));
        playBoop();
        return;
      }
    }

    setCars(prev => prev.filter(car => car.id !== id));
    playBoop();
    const newCount = count + 1;
    setCount(newCount);

    if (newCount >= currentLevel.target) {
      setGameStatus('won');
      playWinSound();
      setShowConfetti(true);
    }
  };

  const nextLevel = () => {
    if (levelIdx < levels.length - 1) {
      setLevelIdx(prev => prev + 1);
      setCount(0);
      setCars([]);
      setGameStatus('playing');
      setShowConfetti(false);
    } else {
      onBack();
    }
  };

  return (
    <div className="game-screen animate-slide-up" style={{ textAlign: 'center', width: '100%', position: 'relative', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', width: '100%', padding: '0 5px', gap: '10px' }}>
        <button onClick={onBack} style={{ background: 'rgba(0,0,0,0.5)', fontSize: '0.9rem', color: 'white', padding: '0.6rem 1.2rem', minWidth: '80px' }}>{t.back}</button>
        <h2 style={{ fontSize: 'clamp(1rem, 4.5vw, 1.8rem)', color: 'var(--lightning-yellow)', margin: 0, flex: 1 }}>{currentLevel.title}</h2>
        <div style={{ minWidth: '80px' }}></div> {/* Spacer */}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <div style={{ width: 'clamp(150px, 60vw, 300px)', height: '14px', background: 'rgba(255,255,255,0.1)', borderRadius: '10px', border: '3px solid white', overflow: 'hidden', boxShadow: '0 4px 10px rgba(0,0,0,0.3)' }}>
            <div style={{ width: `${(count / currentLevel.target) * 100}%`, height: '100%', background: 'linear-gradient(90deg, var(--mcqueen-red), #ff6b6b)', transition: 'width 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)' }}></div>
          </div>
          <span style={{ fontSize: '1.2rem', color: 'white', fontWeight: 'bold', textShadow: '2px 2px 4px rgba(0,0,0,0.5)' }}>{t.laps}: {count} / {currentLevel.target}</span>
      </div>

      {currentLevel.filterColor && (
        <p style={{ fontWeight: 'bold', fontSize: '1.2rem', color: 'white', margin: '0 0 1rem', background: 'rgba(0,0,0,0.3)', padding: '5px 15px', borderRadius: '10px', width: 'fit-content', margin: '0 auto 1rem' }}>
          {t.countOnlyThe} <span style={{ color: currentLevel.filterColor, textShadow: '1px 1px 2px black' }}>{currentLevel.filterColorName}</span> {t.cars}!
        </p>
      )}

      <div className="track-container" style={{ 
        flex: 1,
        minHeight: '280px',
        maxHeight: '450px',
        background: '#1a1a1a', 
        borderRadius: '25px', 
        position: 'relative', 
        overflow: 'hidden', 
        border: '6px solid #333',
        boxShadow: 'inset 0 0 50px rgba(0,0,0,0.8), 0 10px 30px rgba(0,0,0,0.5)',
        touchAction: 'none'
      }}>
        <div style={{ position: 'absolute', top: '33%', width: '100%', borderTop: '2px dashed rgba(255,255,255,0.1)' }}></div>
        <div style={{ position: 'absolute', top: '66%', width: '100%', borderTop: '2px dashed rgba(255,255,255,0.1)' }}></div>

        {cars.map(car => (
          <div
            key={car.id}
            onClick={() => handleCarClick(car.id)}
            className={`racing-car${car.id === wobbleId ? ' wobble' : ''}`}
            style={{
              position: 'absolute',
              left: `${car.x}px`,
              top: `${car.y}%`,
              width: `${(car.width || 100) * 0.8}px`,
              height: `${(car.height || 50) * 0.8}px`,
              background: car.color,
              borderRadius: '8px',
              border: '3px solid white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.4rem',
              boxShadow: '0 4px 8px rgba(0,0,0,0.5)',
              transform: 'scale(1)',
              cursor: 'pointer'
            }}
          >
            {car.emoji || '🏎️'}
          </div>
        ))}

        {gameStatus === 'won' && (
          <div style={{ 
            position: 'absolute', 
            top: 0, left: 0, width: '100%', height: '100%', 
            background: 'rgba(0,0,0,0.9)', 
            display: 'flex', 
            flexDirection: 'column', 
            justifyContent: 'center', 
            alignItems: 'center',
            zIndex: 10,
            padding: '1rem'
          }}>
            <h1 className="animate-zoom" style={{ color: 'var(--lightning-yellow)', fontSize: 'clamp(1.8rem, 8vw, 3rem)', textAlign: 'center' }}>{t.levelClear}</h1>
            <p style={{ fontSize: 'clamp(1rem, 4vw, 1.3rem)', margin: '0.5rem', textAlign: 'center' }}>{renderPersonalizedText(t.kaChow, lang)}</p>
            <button 
              onClick={nextLevel}
              style={{ background: 'var(--mcqueen-red)', color: 'white', fontSize: '1.4rem', marginTop: '1rem' }}
            >
              {levelIdx < levels.length - 1 ? t.nextLevel : t.winnersCircle}
            </button>
          </div>
        )}
      </div>
      {showConfetti && <Confetti onDone={() => setShowConfetti(false)} />}
    </div>
  );
}
