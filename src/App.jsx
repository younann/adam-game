import React, { useState, useEffect } from 'react';
import './index.css';
import CountingGame from './components/CountingGame';
import PaintShop from './components/PaintShop';
import SignMatcher from './components/SignMatcher';
import ColoringBook from './components/ColoringBook';
import MemoryMatch from './components/MemoryMatch';
import LetterRacing from './components/LetterRacing';
import { translations } from './utils/translations';

// Importing car assets for decoration
import mcqueenHero from './assets/cars/770c1752bd3dc58917586f5272de4068.jpg';

// Helper to render text with the popping ADAM name
export const renderPersonalizedText = (parts, lang) => {
  if (!Array.isArray(parts)) return parts;
  return parts.map((part, i) => {
    if (part === "{ADAM}") {
      return (
        <span key={i} className="name-pop" style={{ fontSize: '2.2rem',marginLeft: '15px',marginRight: '5px' }}>
          {lang === 'ar' ? 'آدم' : 'ADAM'}
        </span>
      );
    }
    return <span key={i}>{part}</span>;
  });
};

const MainMenu = ({ onStartGame, lang, setLang }) => {
  const t = translations[lang];
  const isAr = lang === 'ar';
  
  return (
    <div className="main-menu animate-zoom" style={{ textAlign: 'center', position: 'relative', zIndex: 2, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
      <div style={{ 
        position: 'absolute', 
        top: '-15px', 
        [isAr ? 'left' : 'right']: '-10px', 
        display: 'flex', 
        gap: '8px', 
        zIndex: 100 
      }}>
        <button 
          onClick={() => setLang('en')}
          className="mode-btn"
          style={{ 
            padding: '6px 10px', 
            fontSize: '0.8rem', 
            background: lang === 'en' ? 'var(--mcqueen-red)' : 'rgba(255,255,255,0.1)',
            minWidth: '45px',
            border: lang === 'en' ? '2px solid white' : '1px solid rgba(255,255,255,0.2)'
          }}
        >
          EN
        </button>
        <button 
          onClick={() => setLang('ar')}
          className="mode-btn"
          style={{ 
            padding: '6px 10px', 
            fontSize: '0.8rem', 
            background: lang === 'ar' ? 'var(--mcqueen-red)' : 'rgba(255,255,255,0.1)',
            minWidth: '45px',
            border: lang === 'ar' ? '2px solid white' : '1px solid rgba(255,255,255,0.2)'
          }}
        >
          AR
        </button>
      </div>

      <div style={{ marginBottom: '1.5rem' }}>
        <h1 className="main-title" style={{ color: 'var(--lightning-yellow)', marginBottom: '0.5rem', lineHeight: '1.1' }}>
          {t.title} <br/>
          <span className="main-subtitle" style={{ color: 'var(--mcqueen-red)' }}>{t.subtitle}</span>
        </h1>
        <p style={{ fontSize: '1.2rem', color: 'rgba(255,255,255,0.9)', marginBottom: '1.5rem',marginTop: '1.5rem' }}>
          {renderPersonalizedText(t.tagline, lang)}
        </p>
      </div>
      
      <div className="menu-options" style={{ 
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
        gap: '1rem', 
        width: '100%',
        maxWidth: '550px', 
        margin: '0 auto' 
      }}>
        <button 
          className="menu-btn"
          onClick={() => onStartGame('counting')}
          style={{ background: 'var(--mcqueen-red)', color: 'white', borderBottom: '6px solid #b32631' }}
        >
          {t.game1}
        </button>
        <button 
          className="menu-btn"
          onClick={() => onStartGame('colors')}
          style={{ background: 'var(--vibrant-blue)', color: 'white', borderBottom: '6px solid #2d5a7a' }}
        >
          {t.game2}
        </button>
        <button 
          className="menu-btn"
          onClick={() => onStartGame('shapes')}
          style={{ background: 'var(--lightning-yellow)', color: 'var(--pavement-grey)', borderBottom: '6px solid #cc9202' }}
        >
          {t.game3}
        </button>
        <button
          className="menu-btn"
          onClick={() => onStartGame('coloring')}
          style={{ background: '#2a9d8f', color: 'white', borderBottom: '6px solid #1e7066' }}
        >
          {t.game4}
        </button>
        <button
          className="menu-btn"
          onClick={() => onStartGame('memory')}
          style={{ background: '#8338ec', color: 'white', borderBottom: '6px solid #6a2dba' }}
        >
          {t.game5}
        </button>
        <button
          className="menu-btn"
          onClick={() => onStartGame('letters')}
          style={{ background: '#264653', color: 'white', borderBottom: '6px solid #1a3040' }}
        >
          {t.game6}
        </button>
      </div>

      <div style={{ marginTop: '25px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '20px' }}>
        <img 
          src={mcqueenHero} 
          alt="McQueen" 
          className="animate-zoom"
          style={{ 
            width: 'clamp(120px, 30vw, 180px)', 
            borderRadius: '15px', 
            border: '3px solid white', 
            boxShadow: '0 8px 20px rgba(0,0,0,0.5)',
            transform: isAr ? 'scaleX(-1)' : 'none'
          }} 
        />
      </div>
    </div>
  );
};

export default function App() {
  const [gameState, setGameState] = useState('menu');
  const [lang, setLang] = useState('ar');

  useEffect(() => {
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  }, [lang]);

  const t = translations[lang];

  const renderGame = () => {
    switch(gameState) {
      case 'counting': return <CountingGame onBack={() => setGameState('menu')} lang={lang} t={t} />;
      case 'colors': return <PaintShop onBack={() => setGameState('menu')} lang={lang} t={t} />;
      case 'shapes': return <SignMatcher onBack={() => setGameState('menu')} lang={lang} t={t} />;
      case 'coloring': return <ColoringBook onBack={() => setGameState('menu')} lang={lang} t={t} />;
      case 'memory': return <MemoryMatch onBack={() => setGameState('menu')} lang={lang} t={t} />;
      case 'letters': return <LetterRacing onBack={() => setGameState('menu')} lang={lang} t={t} />;
      default: return <MainMenu onStartGame={(game) => setGameState(game)} lang={lang} setLang={setLang} />;
    }
  };

  return (
    <div className="app-container">
      {/* Background Decorations - Enhanced visibility */}

      
      <div className="glass-card">
        {renderGame()}
      </div>
    </div>
  );
}
