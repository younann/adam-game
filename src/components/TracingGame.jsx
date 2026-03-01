import React from 'react';
export default function TracingGame({ onBack, lang, t }) {
  return (
    <div style={{ textAlign: 'center', padding: '2rem' }}>
      <h2 style={{ color: 'var(--lightning-yellow)' }}>{t.tracingGameTitle}</h2>
      <button className="mode-btn" onClick={onBack} style={{ marginTop: '1rem' }}>{t.back}</button>
    </div>
  );
}
