import React, { useState, useEffect, useCallback, useRef } from 'react';
import { playBoop, playWinSound } from '../utils/audio';
import Confetti from './Confetti';
import { renderPersonalizedText } from '../App';

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const CAR_COLORS = ['#e63946', '#457b9d', '#ffb703', '#2a9d8f'];
const INITIAL_TIME = 30;

function randomLetter() {
  return LETTERS[Math.floor(Math.random() * LETTERS.length)];
}

function pickRandomColor() {
  return CAR_COLORS[Math.floor(Math.random() * CAR_COLORS.length)];
}

function generateWave(targetLetter) {
  const count = Math.floor(Math.random() * 2) + 3; // 3 or 4 cars
  const letters = new Set();
  letters.add(targetLetter);

  while (letters.size < count) {
    const l = randomLetter();
    if (l !== targetLetter) letters.add(l);
  }

  const shuffled = Array.from(letters).sort(() => Math.random() - 0.5);

  return shuffled.map((letter, i) => ({
    id: Date.now() + i,
    letter,
    x: -120 - i * 180,
    y: Math.random() * 60 + 10,
    color: pickRandomColor(),
    speed: Math.random() * 1.5 + 2.5,
    isWrong: false,
  }));
}

export default function LetterRacing({ onBack, lang, t }) {
  const [targetLetter, setTargetLetter] = useState(() => randomLetter());
  const [cars, setCars] = useState(() => generateWave(randomLetter()));
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(INITIAL_TIME);
  const [gameStatus, setGameStatus] = useState('playing');
  const [showConfetti, setShowConfetti] = useState(false);
  const waveTimerRef = useRef(null);
  const animFrameRef = useRef(null);

  // Initialize first wave with the correct target
  useEffect(() => {
    const firstTarget = randomLetter();
    setTargetLetter(firstTarget);
    setCars(generateWave(firstTarget));
  }, []);

  // Countdown timer
  useEffect(() => {
    if (gameStatus !== 'playing') return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          setGameStatus('gameover');
          playWinSound();
          setShowConfetti(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameStatus]);

  // Car spawning — add new wave cars periodically
  useEffect(() => {
    if (gameStatus !== 'playing') return;

    waveTimerRef.current = setInterval(() => {
      setCars(prev => {
        // Only spawn if most cars from previous wave are gone
        const activeCars = prev.filter(c => c.x < 900);
        if (activeCars.length <= 1) {
          return [...prev, ...generateWave(targetLetter)];
        }
        return prev;
      });
    }, 1200);

    return () => clearInterval(waveTimerRef.current);
  }, [gameStatus, targetLetter]);

  // Car animation loop
  useEffect(() => {
    const animate = setInterval(() => {
      setCars(prev =>
        prev
          .map(car => ({
            ...car,
            x: car.x + car.speed + (score * 0.1),
            // Clear wobble after it has been set for a bit
            isWrong: car.isWrong && (Date.now() - car.wrongTime < 400),
          }))
          .filter(car => car.x < 1100)
      );
    }, 30);

    return () => clearInterval(animate);
  }, [score]);

  const startNewRound = useCallback(() => {
    const newTarget = randomLetter();
    setTargetLetter(newTarget);
    setCars(generateWave(newTarget));
  }, []);

  const handleCarClick = useCallback((carId, letter) => {
    if (gameStatus !== 'playing') return;

    if (letter === targetLetter) {
      playBoop();
      setScore(prev => prev + 1);
      startNewRound();
    } else {
      // Wrong letter — wobble
      setCars(prev =>
        prev.map(car =>
          car.id === carId
            ? { ...car, isWrong: true, wrongTime: Date.now() }
            : car
        )
      );
    }
  }, [gameStatus, targetLetter, startNewRound]);

  const handlePlayAgain = () => {
    const newTarget = randomLetter();
    setTargetLetter(newTarget);
    setCars(generateWave(newTarget));
    setScore(0);
    setTimeLeft(INITIAL_TIME);
    setGameStatus('playing');
    setShowConfetti(false);
  };

  const isAr = lang === 'ar';

  return (
    <div className="game-screen animate-slide-up" style={{ 
      textAlign: 'center', 
      width: '100%', 
      position: 'relative', 
      flex: 1, 
      display: 'flex', 
      flexDirection: 'column', 
      justifyContent: 'space-between',
      minHeight: '400px' 
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1rem',
        width: '100%',
        padding: '0 5px',
        gap: '10px'
      }}>
        <button
          onClick={onBack}
          style={{
            background: 'rgba(0,0,0,0.5)',
            fontSize: '0.9rem',
            color: 'white',
            padding: '0.6rem 1.2rem',
            minWidth: '80px'
          }}
        >
          {t.back}
        </button>
        <h2 style={{
          fontSize: 'clamp(1rem, 4.5vw, 1.8rem)',
          color: 'var(--lightning-yellow)',
          margin: 0,
          flex: 1
        }}>
          {t.letterTitle}
        </h2>
        <div style={{ minWidth: '80px' }}></div>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', width: '100%' }}>
        {/* Score and Timer */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '2rem',
          marginBottom: '0.8rem',
          flexWrap: 'wrap',
        }}>
          <span style={{
            fontSize: 'clamp(1rem, 4.5vw, 1.3rem)',
            color: 'white',
            fontWeight: 'bold',
            background: 'rgba(0,0,0,0.3)',
            padding: '5px 15px',
            borderRadius: '12px'
          }}>
            {t.letterScore}: {score}
          </span>
          <span style={{
            fontSize: 'clamp(1rem, 4.5vw, 1.3rem)',
            color: timeLeft <= 10 ? 'var(--mcqueen-red)' : 'white',
            fontWeight: 'bold',
            transition: 'color 0.3s',
            background: 'rgba(0,0,0,0.3)',
            padding: '5px 15px',
            borderRadius: '12px'
          }}>
            {t.letterTime}: {timeLeft}s
          </span>
        </div>

        {/* Target letter prompt */}
        <div style={{
          marginBottom: '0.8rem',
          fontSize: 'clamp(1.1rem, 5vw, 1.6rem)',
          color: 'white',
        }}>
          {t.letterFind}:{' '}
          <span style={{
            color: 'var(--lightning-yellow)',
            fontSize: 'clamp(2.2rem, 9vw, 3.2rem)',
            fontWeight: 'bold',
            textShadow: '3px 3px 0px rgba(0,0,0,0.5)',
            display: 'inline-block',
            animation: 'namePop 2s infinite ease-in-out',
            marginLeft: '10px'
          }}>
            {targetLetter}
          </span>
        </div>

        {/* Track area */}
        <div style={{
          width: '100%',
          flex: 1,
          minHeight: '260px',
          maxHeight: '380px',
          background: '#1a1a1a',
          borderRadius: '25px',
          position: 'relative',
          overflow: 'hidden',
          border: '6px solid #333',
          boxShadow: 'inset 0 0 50px rgba(0,0,0,0.8), 0 10px 30px rgba(0,0,0,0.5)',
          touchAction: 'none',
        }}>
          {/* Dashed lane lines */}
          <div style={{ position: 'absolute', top: '25%', width: '100%', borderTop: '2px dashed rgba(255,255,255,0.1)' }}></div>
          <div style={{ position: 'absolute', top: '50%', width: '100%', borderTop: '2px dashed rgba(255,255,255,0.1)' }}></div>
          <div style={{ position: 'absolute', top: '75%', width: '100%', borderTop: '2px dashed rgba(255,255,255,0.1)' }}></div>

          {/* Cars */}
          {cars.map(car => (
            <div
              key={car.id}
              onClick={() => handleCarClick(car.id, car.letter)}
              className="letter-car"
              style={{
                position: 'absolute',
                left: `${car.x}px`,
                top: `${car.y}%`,
                width: '100px',
                height: '60px',
                background: car.color,
                borderRadius: '12px',
                border: '3px solid white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '2.5rem',
                fontWeight: 'bold',
                color: 'white',
                boxShadow: '0 5px 15px rgba(0,0,0,0.5)',
                cursor: 'pointer',
                userSelect: 'none',
                textShadow: '2px 2px 0px rgba(0,0,0,0.4)',
                animation: car.isWrong ? 'wobble 0.4s ease' : 'none',
                transition: 'transform 0.1s',
              }}
            >
              <span style={{ transform: isAr ? 'scaleX(-1)' : 'none' }}>{car.letter}</span>
            </div>
          ))}

          {/* Game over overlay */}
          {gameStatus === 'gameover' && (
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
            }}>
              <h1 className="animate-zoom" style={{
                color: 'var(--lightning-yellow)',
                fontSize: 'clamp(1.8rem, 8vw, 2.5rem)',
                textAlign: 'center',
                marginBottom: '0.5rem',
              }}>
                {t.letterGameOver}
              </h1>
              <p style={{
                fontSize: 'clamp(1.1rem, 5vw, 1.5rem)',
                color: 'white',
                marginBottom: '0.3rem',
              }}>
                {t.letterFinalScore}: {score}
              </p>
              <p style={{
                fontSize: 'clamp(1rem, 4vw, 1.2rem)',
                margin: '0.5rem',
                textAlign: 'center',
                color: 'white'
              }}>
                {renderPersonalizedText(t.greatJob, lang)}
              </p>
              <button
                onClick={handlePlayAgain}
                style={{
                  background: 'var(--mcqueen-red)',
                  color: 'white',
                  fontSize: '1.2rem',
                  marginTop: '1rem',
                }}
              >
                {t.playAgain}
              </button>
            </div>
          )}
        </div>
      </div>

      {showConfetti && <Confetti onDone={() => setShowConfetti(false)} />}
      <style>{`
        @keyframes wobble {
          0% { transform: translateX(0); }
          15% { transform: translateX(-8px) rotate(-3deg); }
          30% { transform: translateX(6px) rotate(2deg); }
          45% { transform: translateX(-5px) rotate(-2deg); }
          60% { transform: translateX(4px) rotate(1deg); }
          75% { transform: translateX(-2px); }
          100% { transform: translateX(0); }
        }
        .letter-car {
          transition: transform 0.1s;
        }
        .letter-car:active {
          transform: scale(1.15) !important;
        }
      `}</style>
    </div>
  );
}
