import React, { useState } from 'react';
import { playBoop, playWinSound } from '../utils/audio';
import Confetti from './Confetti';

export default function PaintShop({ onBack, lang, t }) {
  const colors = [
    { name: t.red, value: '#e63946' },
    { name: t.blue, value: '#457b9d' },
    { name: t.yellow, value: '#ffb703' },
    { name: t.green, value: '#2a9d8f' },
    { name: t.orange, value: '#f4a261' },
    { name: t.purple, value: '#8338ec' },
    { name: t.pink, value: '#ff006e' },
  ];

  const patterns = [
    { name: t.patternNone, id: 'solid' },
    { name: t.patternStripes, id: 'stripes' },
    { name: t.patternStars, id: 'stars' },
    { name: t.patternFlames, id: 'flames' },
  ];

  const [currentColor, setCurrentColor] = useState(colors[0]);
  const [currentPattern, setCurrentPattern] = useState(patterns[0]);
  const [isDriving, setIsDriving] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  return (
    <div className="game-screen animate-slide-up" style={{ textAlign: 'center', width: '100%', position: 'relative', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', width: '100%', padding: '0 5px' }}>
        <button onClick={onBack} style={{ background: 'rgba(0,0,0,0.5)', fontSize: '0.9rem', color: 'white', padding: '0.6rem 1.2rem', minWidth: '80px' }}>{t.back}</button>
        <h2 style={{ fontSize: 'clamp(1rem, 4.5vw, 1.8rem)', color: 'var(--lightning-yellow)', margin: 0, flex: 1 }}>{t.paintShopTitle}</h2>
        <div style={{ minWidth: '80px' }}></div>
      </div>
      
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}>
        <div className="car-preview" style={{
          width: 'clamp(200px, 60vw, 350px)',
          height: 'clamp(100px, 30vw, 180px)',
          background: currentColor.value,
          margin: '0 auto 1.5rem',
          borderRadius: lang === 'ar' ? '120px 60px 20px 20px' : '60px 120px 20px 20px',
          position: 'relative',
          border: '8px solid white',
          boxShadow: '0 15px 35px rgba(0,0,0,0.6)',
          transition: isDriving ? 'all 1.5s ease-in' : 'background 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
          ...(isDriving ? { transform: 'translateX(600px) scale(0.5)', opacity: 0 } : {})
        }}>
          {/* Pattern Overlay */}
          {currentPattern.id === 'stripes' && (
            <div style={{
              position: 'absolute',
              top: 0, left: 0, right: 0, bottom: 0,
              borderRadius: 'inherit',
              background: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.3) 10px, rgba(255,255,255,0.3) 20px)',
              pointerEvents: 'none',
              zIndex: 1
            }} />
          )}
          {currentPattern.id === 'stars' && (
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none', zIndex: 1 }}>
              <span style={{ position: 'absolute', top: '20%', left: '30%', fontSize: '1.5rem' }}>⭐</span>
              <span style={{ position: 'absolute', top: '50%', left: '55%', fontSize: '1.2rem' }}>⭐</span>
              <span style={{ position: 'absolute', top: '25%', left: '70%', fontSize: '1.3rem' }}>⭐</span>
              <span style={{ position: 'absolute', top: '55%', left: '35%', fontSize: '1rem' }}>⭐</span>
            </div>
          )}
          {currentPattern.id === 'flames' && (
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none', zIndex: 1 }}>
              <span style={{ position: 'absolute', bottom: '10%', left: lang === 'ar' ? 'auto' : '5%', right: lang === 'ar' ? '5%' : 'auto', fontSize: '2rem', filter: 'drop-shadow(0 2px 2px rgba(0,0,0,0.5))' }}>🔥</span>
              <span style={{ position: 'absolute', bottom: '25%', left: lang === 'ar' ? 'auto' : '15%', right: lang === 'ar' ? '15%' : 'auto', fontSize: '1.5rem', filter: 'drop-shadow(0 2px 2px rgba(0,0,0,0.5))' }}>🔥</span>
              <span style={{ position: 'absolute', bottom: '5%', left: lang === 'ar' ? 'auto' : '25%', right: lang === 'ar' ? '25%' : 'auto', fontSize: '1.2rem', filter: 'drop-shadow(0 2px 2px rgba(0,0,0,0.5))' }}>🔥</span>
            </div>
          )}
          {/* Windshield */}
          <div style={{
            position: 'absolute',
            top: '12%',
            left: lang === 'ar' ? '12%' : 'auto',
            right: lang === 'en' ? '12%' : 'auto',
            width: 'clamp(50px, 15vw, 85px)',
            height: 'clamp(25px, 8vw, 45px)',
            background: 'white',
            borderRadius: '30px',
            display: 'flex',
            justifyContent: 'space-around',
            alignItems: 'center',
            overflow: 'hidden',
            zIndex: 2,
            border: '2px solid rgba(0,0,0,0.1)'
          }}>
             <div style={{ width: '10px', height: '10px', background: 'black', borderRadius: '50%' }}></div>
             <div style={{ width: '10px', height: '10px', background: 'black', borderRadius: '50%' }}></div>
          </div>
          {/* Wheels */}
          <div style={{ position: 'absolute', bottom: '-15%', left: '12%', width: 'clamp(40px, 12vw, 65px)', height: 'clamp(40px, 12vw, 65px)', background: '#111', borderRadius: '50%', border: '5px solid #444', zIndex: 2, boxShadow: '0 5px 10px rgba(0,0,0,0.5)' }}></div>
          <div style={{ position: 'absolute', bottom: '-15%', right: '12%', width: 'clamp(40px, 12vw, 65px)', height: 'clamp(40px, 12vw, 65px)', background: '#111', borderRadius: '50%', border: '5px solid #444', zIndex: 2, boxShadow: '0 5px 10px rgba(0,0,0,0.5)' }}></div>
        </div>

        <h3 style={{ color: currentColor.value, fontSize: 'clamp(1.5rem, 7vw, 2.8rem)', marginBottom: '1.5rem', textShadow: '2px 2px 4px rgba(0,0,0,0.4)', transition: 'color 0.5s' }}>{currentColor.name}!</h3>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.8rem', flexWrap: 'wrap', padding: '0 10px', maxWidth: '500px' }}>
          {colors.map((c) => (
            <button
              key={c.name}
              onClick={() => {
                setCurrentColor(c);
                playBoop();
              }}
              style={{
                width: 'clamp(45px, 10vw, 65px)',
                height: 'clamp(45px, 10vw, 65px)',
                background: c.value,
                border: currentColor.name === c.name ? '4px solid white' : '2px solid rgba(255,255,255,0.2)',
                borderRadius: '50%',
                boxShadow: currentColor.name === c.name ? '0 0 15px white, 0 5px 10px rgba(0,0,0,0.3)' : '0 3px 6px rgba(0,0,0,0.2)',
                transform: currentColor.name === c.name ? 'scale(1.15)' : 'scale(1)',
                padding: 0
              }}
            />
          ))}
        </div>

        {/* Pattern Selector */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.6rem', flexWrap: 'wrap', padding: '0 10px', marginTop: '1.5rem' }}>
          {patterns.map((p) => (
            <button
              key={p.id}
              onClick={() => {
                setCurrentPattern(p);
                playBoop();
              }}
              style={{
                background: currentPattern.id === p.id ? 'var(--vibrant-blue)' : 'rgba(255,255,255,0.1)',
                color: 'white',
                border: currentPattern.id === p.id ? '3px solid white' : '1px solid rgba(255,255,255,0.2)',
                borderRadius: '999px',
                padding: '0.6rem 1.4rem',
                fontSize: 'clamp(0.8rem, 3.5vw, 1rem)',
                cursor: 'pointer',
                transform: currentPattern.id === p.id ? 'scale(1.1)' : 'scale(1)',
                transition: 'all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
              }}
            >
              {p.name}
            </button>
          ))}
        </div>
      </div>

      {/* Done Button */}
      <button
        onClick={() => {
          if (isDriving) return;
          setIsDriving(true);
          playWinSound();
          setShowConfetti(true);
          setTimeout(() => {
            setIsDriving(false);
            setShowConfetti(false);
            setCurrentColor(colors[0]);
            setCurrentPattern(patterns[0]);
          }, 1500);
        }}
        style={{
          marginTop: '1.5rem',
          background: '#2a9d8f',
          color: 'white',
          border: 'none',
          borderRadius: '12px',
          padding: '0.8rem 2.5rem',
          fontSize: 'clamp(1rem, 4vw, 1.5rem)',
          fontWeight: 'bold',
          cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
        }}
      >
        {t.paintDone}
      </button>
      {showConfetti && <Confetti onDone={() => setShowConfetti(false)} />}
    </div>
  );
}
