# Celebration Animations & Fullscreen Mode Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add confetti rain animations on every win moment and a fullscreen toggle button on the main menu.

**Architecture:** A reusable `<Confetti />` component renders 30 CSS-animated pieces when mounted, auto-cleans after 3s. Each game adds `showConfetti` state toggled alongside existing `playWinSound()` calls. Fullscreen uses the browser Fullscreen API with a toggle button next to the EN/AR language buttons, hidden on unsupported devices.

**Tech Stack:** React, CSS keyframes, Fullscreen API

---

### Task 1: Create Confetti component

**Files:**
- Create: `src/components/Confetti.jsx`

**Step 1: Create the Confetti component**

```jsx
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
```

**Step 2: Verify file was created**

Run: `ls src/components/Confetti.jsx`
Expected: file listed

---

### Task 2: Add confetti CSS animations

**Files:**
- Modify: `src/index.css` (append after line 309, before the final closing)

**Step 1: Add confetti styles to index.css**

Append the following CSS at the end of `src/index.css`:

```css
/* Confetti celebration */
.confetti-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 9999;
  overflow: hidden;
}

.confetti-piece {
  position: absolute;
  top: -20px;
  border-radius: 3px;
  animation: confettiFall linear forwards;
}

@keyframes confettiFall {
  0% {
    transform: translateY(0) rotate(0deg) scale(1);
    opacity: 1;
  }
  75% {
    opacity: 1;
  }
  100% {
    transform: translateY(100vh) rotate(720deg) scale(0.5);
    opacity: 0;
  }
}
```

**Step 2: Verify CSS was added**

Run: `grep -c "confettiFall" src/index.css`
Expected: count > 0

---

### Task 3: Add confetti to CountingGame

**Files:**
- Modify: `src/components/CountingGame.jsx`

**Step 1: Add import at top (after line 2)**

```jsx
import Confetti from './Confetti';
```

**Step 2: Add state (after line 25, with the other useState calls)**

```jsx
const [showConfetti, setShowConfetti] = useState(false);
```

**Step 3: Trigger confetti on win (line 82, alongside playWinSound)**

Change:
```jsx
      setGameStatus('won');
      playWinSound();
```
To:
```jsx
      setGameStatus('won');
      playWinSound();
      setShowConfetti(true);
```

**Step 4: Reset confetti on next level (inside nextLevel function, around line 89)**

Add `setShowConfetti(false);` inside the `nextLevel` function where state is reset.

**Step 5: Render Confetti in JSX**

Add right before the closing `</div>` of the root game-screen div (before line 184):

```jsx
{showConfetti && <Confetti onDone={() => setShowConfetti(false)} />}
```

---

### Task 4: Add confetti to MemoryMatch

**Files:**
- Modify: `src/components/MemoryMatch.jsx`

**Step 1: Add import (after line 2)**

```jsx
import Confetti from './Confetti';
```

**Step 2: Add state (after line 40)**

```jsx
const [showConfetti, setShowConfetti] = useState(false);
```

**Step 3: Trigger confetti on all matched (line 76, alongside playWinSound)**

Change:
```jsx
        if (newMatchedPairs === CAR_IMAGES.length) {
          playWinSound();
        }
```
To:
```jsx
        if (newMatchedPairs === CAR_IMAGES.length) {
          playWinSound();
          setShowConfetti(true);
        }
```

**Step 4: Reset confetti on play again (inside handlePlayAgain, after line 99)**

Add `setShowConfetti(false);` inside `handlePlayAgain`.

**Step 5: Render Confetti**

Add right before the closing `</div>` of the root game-screen div (before line 323):

```jsx
{showConfetti && <Confetti onDone={() => setShowConfetti(false)} />}
```

---

### Task 5: Add confetti to SignMatcher

**Files:**
- Modify: `src/components/SignMatcher.jsx`

**Step 1: Add import (after line 2)**

```jsx
import Confetti from './Confetti';
```

**Step 2: Add state (after line 29)**

```jsx
const [showConfetti, setShowConfetti] = useState(false);
```

**Step 3: Trigger confetti on correct match (line 41) and game complete (line 50)**

For the correct-but-not-final match (line 41):
```jsx
        playWinSound();
        setShowConfetti(true);
```

For game complete (line 49-50):
```jsx
        setGameComplete(true);
        playWinSound();
        setShowConfetti(true);
```

**Step 4: Reset confetti on round advance**

Inside the setTimeout on line 42-47, add `setShowConfetti(false);` when advancing to next round.

**Step 5: Reset on play again**

Add `setShowConfetti(false);` inside `handlePlayAgain`.

**Step 6: Render Confetti**

Add right before the closing `</div>` of the root game-screen div (before line 176):

```jsx
{showConfetti && <Confetti onDone={() => setShowConfetti(false)} />}
```

---

### Task 6: Add confetti to LetterRacing

**Files:**
- Modify: `src/components/LetterRacing.jsx`

**Step 1: Add import (after line 2)**

```jsx
import Confetti from './Confetti';
```

**Step 2: Add state (after line 45)**

```jsx
const [showConfetti, setShowConfetti] = useState(false);
```

**Step 3: Trigger confetti on game over (line 64-65)**

Change:
```jsx
          setGameStatus('gameover');
          playWinSound();
```
To:
```jsx
          setGameStatus('gameover');
          playWinSound();
          setShowConfetti(true);
```

**Step 4: Reset on play again**

Add `setShowConfetti(false);` inside `handlePlayAgain` (around line 136).

**Step 5: Render Confetti**

Add right before the `<style>` tag (before line 351):

```jsx
{showConfetti && <Confetti onDone={() => setShowConfetti(false)} />}
```

---

### Task 7: Add confetti to PaintShop

**Files:**
- Modify: `src/components/PaintShop.jsx`

**Step 1: Add import (after line 2)**

```jsx
import Confetti from './Confetti';
```

**Step 2: Add state (after line 24)**

```jsx
const [showConfetti, setShowConfetti] = useState(false);
```

**Step 3: Trigger confetti on drive-away (line 154, alongside playWinSound)**

Change:
```jsx
          playWinSound();
```
To:
```jsx
          playWinSound();
          setShowConfetti(true);
```

**Step 4: Reset confetti when car resets (inside the setTimeout around line 156)**

Add `setShowConfetti(false);` inside the setTimeout that resets the car state.

**Step 5: Render Confetti**

Add right before the closing `</div>` of the root game-screen div (before line 176):

```jsx
{showConfetti && <Confetti onDone={() => setShowConfetti(false)} />}
```

---

### Task 8: Add fullscreen toggle to MainMenu

**Files:**
- Modify: `src/App.jsx`

**Step 1: Add fullscreen state and handler to App component (inside MainMenu, after line 30)**

```jsx
const [isFullscreen, setIsFullscreen] = useState(!!document.fullscreenElement);

const toggleFullscreen = () => {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch(() => {});
  } else {
    document.exitFullscreen().catch(() => {});
  }
};

React.useEffect(() => {
  const handler = () => setIsFullscreen(!!document.fullscreenElement);
  document.addEventListener('fullscreenchange', handler);
  return () => document.removeEventListener('fullscreenchange', handler);
}, []);

const fullscreenSupported = document.fullscreenEnabled;
```

**Step 2: Add fullscreen button next to EN/AR buttons (inside the button group div, after line 68)**

Add after the AR button, inside the same flex container:

```jsx
{fullscreenSupported && (
  <button
    onClick={toggleFullscreen}
    className="mode-btn"
    style={{
      padding: '6px 10px',
      fontSize: '1rem',
      background: isFullscreen ? 'var(--mcqueen-red)' : 'rgba(255,255,255,0.1)',
      minWidth: '45px',
      border: isFullscreen ? '2px solid white' : '1px solid rgba(255,255,255,0.2)',
      lineHeight: 1,
    }}
    title={isFullscreen ? (t.exitFullscreen || 'Exit Fullscreen') : (t.fullscreen || 'Fullscreen')}
  >
    {isFullscreen ? '⊡' : '⛶'}
  </button>
)}
```

---

### Task 9: Add fullscreen translations

**Files:**
- Modify: `src/utils/translations.js`

**Step 1: Add English translations (after line 85, before the closing brace)**

```js
    fullscreen: "Fullscreen",
    exitFullscreen: "Exit Fullscreen",
```

**Step 2: Add Arabic translations (after line 170, before the closing brace)**

```js
    fullscreen: "ملء الشاشة",
    exitFullscreen: "خروج من ملء الشاشة",
```

---

### Task 10: Smoke test

**Step 1: Start the dev server**

Run: `cd /Users/younan.nwesre/Desktop/personal/kidsgame && npm run dev`

**Step 2: Manual verification checklist**

- [ ] Main menu shows fullscreen button (⛶) next to EN/AR
- [ ] Clicking fullscreen button expands to full screen, icon changes to ⊡
- [ ] Pressing ESC exits fullscreen, button reverts
- [ ] Play Racing Dash — complete a level — confetti rains down
- [ ] Play Memory Match — match all pairs — confetti appears
- [ ] Play Sign Matcher — match a sign correctly — confetti appears
- [ ] Play Letter Racing — timer runs out — confetti on game over
- [ ] Play Paint Shop — click DONE — confetti during drive-away
- [ ] Confetti doesn't block clicking buttons underneath
- [ ] Confetti disappears after ~3 seconds
- [ ] Switch to Arabic — fullscreen button still visible and works
- [ ] No console errors

**Step 3: Build check**

Run: `npm run build`
Expected: Build succeeds with no errors

---

### Task 11: Commit

Run:
```bash
git add src/components/Confetti.jsx src/index.css src/components/CountingGame.jsx src/components/MemoryMatch.jsx src/components/SignMatcher.jsx src/components/LetterRacing.jsx src/components/PaintShop.jsx src/App.jsx src/utils/translations.js docs/plans/
git commit -m "feat: add confetti celebrations on wins and fullscreen toggle on menu"
```
