import React, { useEffect, useState } from 'react';

const COLORS = ['#e63946', '#ffb703', '#457b9d', '#2a9d8f', '#8338ec', '#f4a261'];

function randomBetween(min, max) {
  return Math.random() * (max - min) + min;
}

export default function Confetti({ onDone }) {
  const [pieces] = useState(() =>
    Array.from({ length: 30 }, (_, i) => ({
      id: i,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      left: `${randomBetween(5, 95)}%`,
      size: randomBetween(8, 14),
      delay: `${randomBetween(0, 0.5)}s`,
      duration: `${randomBetween(1.5, 3)}s`,
      rotation: Math.floor(randomBetween(0, 360)),
      shape: Math.random() > 0.5 ? 'square' : 'rect',
    }))
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      if (onDone) onDone();
    }, 3000);
    return () => clearTimeout(timer);
  }, [onDone]);

  return (
    <div className="confetti-container">
      {pieces.map((p) => (
        <div
          key={p.id}
          className="confetti-piece"
          style={{
            left: p.left,
            width: p.shape === 'rect' ? `${p.size * 0.6}px` : `${p.size}px`,
            height: `${p.size}px`,
            background: p.color,
            animationDelay: p.delay,
            animationDuration: p.duration,
            transform: `rotate(${p.rotation}deg)`,
          }}
        />
      ))}
    </div>
  );
}
