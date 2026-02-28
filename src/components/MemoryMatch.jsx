import React, { useState, useCallback } from 'react';
import { playBoop, playWinSound } from '../utils/audio';
import { renderPersonalizedText } from '../App';

const EMOJIS = ['🏎️', '🏁', '⛽', '🔧', '🛞', '🚦', '🏆', '⚡'];

function shuffleArray(arr) {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function createDeck() {
  const pairs = [...EMOJIS, ...EMOJIS];
  const shuffled = shuffleArray(pairs);
  return shuffled.map((emoji, index) => ({
    id: index,
    emoji,
    isFlipped: false,
    isMatched: false,
  }));
}

export default function MemoryMatch({ onBack, lang, t }) {
  const [cards, setCards] = useState(() => createDeck());
  const [flippedIndices, setFlippedIndices] = useState([]);
  const [moves, setMoves] = useState(0);
  const [matchedPairs, setMatchedPairs] = useState(0);
  const [locked, setLocked] = useState(false);

  const isArabic = lang === 'ar';

  const handleCardClick = useCallback((index) => {
    if (locked) return;
    if (cards[index].isFlipped || cards[index].isMatched) return;
    if (flippedIndices.length >= 2) return;

    playBoop();

    const newCards = cards.map((card, i) =>
      i === index ? { ...card, isFlipped: true } : card
    );
    const newFlipped = [...flippedIndices, index];

    setCards(newCards);
    setFlippedIndices(newFlipped);

    if (newFlipped.length === 2) {
      const newMoves = moves + 1;
      setMoves(newMoves);

      const [first, second] = newFlipped;
      if (newCards[first].emoji === newCards[second].emoji) {
        // Match found
        const matched = newCards.map((card, i) =>
          i === first || i === second ? { ...card, isMatched: true } : card
        );
        setCards(matched);
        setFlippedIndices([]);

        const newMatchedPairs = matchedPairs + 1;
        setMatchedPairs(newMatchedPairs);

        if (newMatchedPairs === EMOJIS.length) {
          playWinSound();
        }
      } else {
        // No match — flip back after delay
        setLocked(true);
        setTimeout(() => {
          setCards((prev) =>
            prev.map((card, i) =>
              i === first || i === second ? { ...card, isFlipped: false } : card
            )
          );
          setFlippedIndices([]);
          setLocked(false);
        }, 800);
      }
    }
  }, [cards, flippedIndices, locked, moves, matchedPairs]);

  const handlePlayAgain = () => {
    setCards(createDeck());
    setFlippedIndices([]);
    setMoves(0);
    setMatchedPairs(0);
    setLocked(false);
  };

  const allMatched = matchedPairs === EMOJIS.length;

  return (
    <div className="game-screen animate-slide-up" style={{ textAlign: 'center', width: '100%', position: 'relative', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
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
          {t.memoryTitle}
        </h2>
        <div style={{ minWidth: '80px' }}></div>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
        {/* Stats bar */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '1.5rem',
          marginBottom: '1.5rem',
          flexWrap: 'wrap',
        }}>
          <span style={{
            fontSize: 'clamp(0.9rem, 3.5vw, 1.1rem)',
            color: 'white',
            fontWeight: 'bold',
            background: 'rgba(0,0,0,0.4)',
            padding: '0.5rem 1.2rem',
            borderRadius: '12px',
            border: '2px solid var(--vibrant-blue)',
            boxShadow: '0 4px 8px rgba(0,0,0,0.3)'
          }}>
            {t.memoryMoves}: {moves}
          </span>
          <span style={{
            fontSize: 'clamp(0.9rem, 3.5vw, 1.1rem)',
            color: 'white',
            fontWeight: 'bold',
            background: 'rgba(0,0,0,0.4)',
            padding: '0.5rem 1.2rem',
            borderRadius: '12px',
            border: '2px solid var(--mcqueen-red)',
            boxShadow: '0 4px 8px rgba(0,0,0,0.3)'
          }}>
            {t.memoryMatched}: {matchedPairs} / {EMOJIS.length}
          </span>
        </div>

      {/* Card grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '0.8rem',
        maxWidth: '400px',
        margin: '0 auto',
        padding: '0 10px',
        perspective: '800px',
      }}>
        {cards.map((card, index) => {
          const isFaceUp = card.isFlipped || card.isMatched;
          return (
            <div
              key={card.id}
              className={`memory-card${card.isMatched ? ' card-matched' : ''}`}
              onClick={() => handleCardClick(index)}
              style={{
                width: '100%',
                aspectRatio: '1',
                cursor: isFaceUp || locked ? 'default' : 'pointer',
                perspective: '600px',
              }}
            >
              <div style={{
                width: '100%',
                height: '100%',
                position: 'relative',
                transformStyle: 'preserve-3d',
                transition: 'transform 0.4s ease',
                transform: isFaceUp ? 'rotateY(180deg)' : 'rotateY(0deg)',
              }}>
                {/* Card back */}
                <div style={{
                  position: 'absolute',
                  width: '100%',
                  height: '100%',
                  backfaceVisibility: 'hidden',
                  background: '#333',
                  borderRadius: '12px',
                  border: '3px solid #555',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  fontSize: 'clamp(1.5rem, 6vw, 2.2rem)',
                  color: 'rgba(255,255,255,0.4)',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
                  userSelect: 'none',
                }}>
                  ?
                </div>
                {/* Card front */}
                <div style={{
                  position: 'absolute',
                  width: '100%',
                  height: '100%',
                  backfaceVisibility: 'hidden',
                  transform: 'rotateY(180deg)',
                  background: card.isMatched
                    ? 'linear-gradient(135deg, rgba(255,183,3,0.3), rgba(255,183,3,0.1))'
                    : 'rgba(255,255,255,0.1)',
                  borderRadius: '12px',
                  border: card.isMatched
                    ? '3px solid var(--lightning-yellow)'
                    : '3px solid var(--vibrant-blue)',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  fontSize: 'clamp(2rem, 8vw, 2.8rem)',
                  boxShadow: card.isMatched
                    ? '0 0 20px rgba(255,183,3,0.6), inset 0 0 15px rgba(255,183,3,0.2)'
                    : '0 4px 12px rgba(0,0,0,0.4)',
                  userSelect: 'none',
                }}>
                  {card.emoji}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>

      {/* Win overlay */}
      {allMatched && (
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
            {t.memoryComplete}
          </h1>
          <p style={{
            fontSize: 'clamp(1rem, 4vw, 1.3rem)',
            color: 'white',
            margin: '0.5rem 0',
            textAlign: 'center',
          }}>
            {renderPersonalizedText(t.greatJob, lang)}
          </p>
          <p style={{
            fontSize: 'clamp(1rem, 3.5vw, 1.2rem)',
            color: 'rgba(255,255,255,0.8)',
            margin: '0.3rem 0 1rem',
          }}>
            {t.memoryMoves}: {moves}
          </p>
          <button
            onClick={handlePlayAgain}
            style={{
              background: 'var(--mcqueen-red)',
              color: 'white',
              fontSize: '1.4rem',
              marginTop: '0.5rem',
              padding: '0.8rem 2rem',
            }}
          >
            {t.memoryPlayAgain}
          </button>
        </div>
      )}
    </div>
  );
}
