# Tracing/Handwriting Game Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a canvas-based tracing game where kids follow dotted paths to learn letters (EN/AR), numbers, and shapes.

**Architecture:** Single `TracingGame.jsx` component with three modes (Letters/Numbers/Shapes). Canvas renders dashed path outlines; touch/mouse input draws colored strokes; path coverage tracked via segment proximity checks. Category selection screen → tracing screen → completion overlay with confetti.

**Tech Stack:** React 19, HTML Canvas API, existing audio utils (playBoop/playWinSound), existing Confetti component.

---

### Task 1: Add translations and wire up routing

**Files:**
- Modify: `src/utils/translations.js` — add tracing game translation keys
- Modify: `src/App.jsx` — import TracingGame, add menu button, add switch case

**Step 1: Add translation keys to both `en` and `ar` objects in `translations.js`**

Add before the closing `}` of each language object:

```js
// English (before line 130 closing brace)
// Tracing Game
tracingTitle: "✏️ TRACING",
tracingGameTitle: "Tracing Track",
tracingLetters: "LETTERS",
tracingNumbers: "NUMBERS",
tracingShapes: "SHAPES",
tracingTrace: "Trace the",
tracingLetter: "letter",
tracingNumber: "number",
tracingShape: "shape",
tracingProgress: "Progress",
tracingComplete: "PERFECT TRACE!",
tracingNext: "NEXT",
tracingClear: "CLEAR",
tracingOf: "of",

// Arabic (before line 259 closing brace)
tracingTitle: "✏️ التتبع",
tracingGameTitle: "مسار التتبع",
tracingLetters: "الحروف",
tracingNumbers: "الأرقام",
tracingShapes: "الأشكال",
tracingTrace: "تتبع",
tracingLetter: "الحرف",
tracingNumber: "الرقم",
tracingShape: "الشكل",
tracingProgress: "التقدم",
tracingComplete: "!تتبع ممتاز",
tracingNext: "التالي",
tracingClear: "مسح",
tracingOf: "من",
```

**Step 2: Add import and routing in `App.jsx`**

Add import at top (after MazeRunner import, line 11):
```js
import TracingGame from './components/TracingGame';
```

Add menu button in the `menu-options` grid (after maze button, around line 189):
```jsx
<button
  className="menu-btn"
  onClick={() => onStartGame('tracing')}
  style={{ background: '#e07c24', color: 'white', borderBottom: '6px solid #b5631d' }}
>
  {t.tracingTitle}
</button>
```

Add switch case in `renderGame()` (after maze case, around line 231):
```js
case 'tracing': return <TracingGame onBack={() => setGameState('menu')} lang={lang} t={t} />;
```

**Step 3: Create empty TracingGame.jsx placeholder**

Create `src/components/TracingGame.jsx` with a minimal component that just shows the back button and title, so the app compiles:

```jsx
import React from 'react';
export default function TracingGame({ onBack, lang, t }) {
  return (
    <div style={{ textAlign: 'center', padding: '2rem' }}>
      <h2 style={{ color: 'var(--lightning-yellow)' }}>{t.tracingGameTitle}</h2>
      <button className="mode-btn" onClick={onBack} style={{ marginTop: '1rem' }}>{t.back}</button>
    </div>
  );
}
```

**Step 4: Verify app compiles**

Run: `npm run dev` and verify the new menu button appears and navigates to the placeholder.

**Step 5: Commit**

```bash
git add src/utils/translations.js src/App.jsx src/components/TracingGame.jsx
git commit -m "feat: add tracing game routing and translations"
```

---

### Task 2: Build path data for all traceable items

**Files:**
- Modify: `src/components/TracingGame.jsx` — add path data constants

**Step 1: Define path data structure**

All paths use normalized coordinates (0-1 range). Each item is an object with `label`, `strokes` (array of arrays of {x, y} points). Multi-stroke items (like letter "A") have multiple arrays.

Add the complete path data for:
- `ENGLISH_LETTERS`: A-Z, each with 1-3 strokes of polyline points
- `ARABIC_LETTERS`: 28 Arabic letters with strokes
- `NUMBERS`: 0-9 with strokes
- `SHAPES`: circle, square, triangle, star, diamond, heart with strokes

Points should be spaced ~0.02-0.05 apart in normalized space for smooth curves. Shapes like circles use ~40 points around the arc.

**Step 2: Verify data loads**

Add a temporary console.log in the component to confirm path count:
```js
console.log('EN letters:', ENGLISH_LETTERS.length, 'AR letters:', ARABIC_LETTERS.length, 'Numbers:', NUMBERS.length, 'Shapes:', SHAPES.length);
```

**Step 3: Commit**

```bash
git add src/components/TracingGame.jsx
git commit -m "feat: add path data for letters, numbers, and shapes"
```

---

### Task 3: Build category selection screen

**Files:**
- Modify: `src/components/TracingGame.jsx` — add category selection UI

**Step 1: Add state management and category screen**

Replace the placeholder with full component structure:
- State: `mode` (null | 'letters' | 'numbers' | 'shapes'), `currentIndex`, `completed`, `strokeColor`
- When `mode` is null, show 3 category buttons (Letters, Numbers, Shapes)
- Category buttons styled like existing game buttons (big, colorful, Cars-themed)
- Back button returns to main menu (calls `onBack`)
- Include the header bar pattern from other games

**Step 2: Verify navigation**

Check that clicking Letters/Numbers/Shapes sets the mode, and back button works.

**Step 3: Commit**

```bash
git add src/components/TracingGame.jsx
git commit -m "feat: add tracing game category selection screen"
```

---

### Task 4: Build canvas tracing engine

**Files:**
- Modify: `src/components/TracingGame.jsx` — add canvas rendering and touch/mouse tracing

**Step 1: Add canvas rendering**

When a mode is selected, render:
- Header: back (to categories), item label ("Trace the letter A"), position indicator ("3 of 26")
- Canvas element (responsive, fills available space)
- Bottom bar: color picker dots, Clear button

Canvas setup:
- Use `useRef` for canvas ref
- On mount / item change: draw the dashed path outline in light gray (#ddd, lineWidth 3, setLineDash [10, 8])
- Mark the start point of the first stroke with a green filled circle (radius 8)
- Scale normalized path coordinates to canvas pixel coordinates

**Step 2: Add touch/mouse drawing**

Handle `onPointerDown`, `onPointerMove`, `onPointerUp` on the canvas:
- On pointer down: start drawing, record last point
- On pointer move (while down): draw a line from last point to current point in the selected stroke color (lineWidth 6, round caps)
- On pointer up: stop drawing
- Support touch via pointer events (works for both mouse and touch)
- Prevent default on touch to avoid scrolling

**Step 3: Add path coverage tracking**

- Divide each stroke into small segments (~every 15px in canvas space)
- Each segment has a boolean `covered` flag
- On each pointer move, check if the current point is within 30px of any uncovered segment
- If so, mark it as covered
- Calculate overall progress = covered segments / total segments
- Display progress bar in the header

**Step 4: Verify drawing works**

Test that you can draw on the canvas, see the dashed outline, and progress bar updates.

**Step 5: Commit**

```bash
git add src/components/TracingGame.jsx
git commit -m "feat: add canvas tracing engine with path coverage tracking"
```

---

### Task 5: Add completion flow and navigation

**Files:**
- Modify: `src/components/TracingGame.jsx` — add completion detection, confetti, next/clear

**Step 1: Add completion detection**

When progress >= 80%:
- Play `playWinSound()`
- Set `completed` state to true
- Show completion overlay with Confetti component
- Show personalized message: renderPersonalizedText(t.kaChow, lang) or t.tracingComplete
- Show 3 gold star emojis
- Show "Next" button

**Step 2: Add Clear button**

Clear button resets the canvas:
- Re-draw the dashed path outline
- Reset all segment coverage flags
- Reset progress to 0
- Play `playBoop()` on clear

**Step 3: Add Next button**

Next button advances to the next item:
- Increment `currentIndex`
- If at end of list, wrap to 0 or show a "completed all" message
- Reset canvas and coverage
- Play `playBoop()`

**Step 4: Add color picker**

Bottom bar with 6 color dots the child can tap to change their stroke color:
```js
const STROKE_COLORS = ['#e63946', '#457b9d', '#ffb703', '#2a9d8f', '#8338ec', '#ff006e'];
```
Active color has a white border ring.

**Step 5: Verify full flow**

Test: select category → trace → complete → confetti → next → clear → back to categories.

**Step 6: Commit**

```bash
git add src/components/TracingGame.jsx
git commit -m "feat: add completion flow, color picker, and navigation"
```

---

### Task 6: Polish and final testing

**Files:**
- Modify: `src/components/TracingGame.jsx` — final polish

**Step 1: Add start arrow indicator**

Draw a small arrow (triangle) at the start point of each stroke indicating direction. Use canvas `beginPath` + `moveTo` + `lineTo` with green fill.

**Step 2: Add animated progress feedback**

When a segment gets covered, briefly flash the covered area brighter. Use a subtle glow effect on the stroke near newly-covered segments.

**Step 3: Responsive canvas sizing**

Ensure canvas resizes properly:
- Use `ResizeObserver` or window resize listener
- Maintain aspect ratio
- Recalculate path scaling on resize
- Canvas dimensions: use container width, cap height at `min(containerWidth, window.innerHeight * 0.55)`

**Step 4: Arabic RTL support**

- Arabic letters render naturally (path data defines direction)
- UI text direction handled by existing RTL CSS
- Position indicator shows correctly in both directions

**Step 5: Full end-to-end test**

Test all categories, both languages, mobile touch + desktop mouse, clear/next/back flows, completion confetti.

**Step 6: Final commit**

```bash
git add src/components/TracingGame.jsx
git commit -m "feat: polish tracing game with animations and responsive layout"
```
