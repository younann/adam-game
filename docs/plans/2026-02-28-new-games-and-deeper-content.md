# New Games + Deeper Existing Games — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add 2 new mini-games (Memory Match, Letter Racing) and deepen all 4 existing games with more levels, challenges, and variety.

**Architecture:** New games follow the same component pattern — a single JSX file in `src/components/`, receiving `{ onBack, lang, t }` props. Translations added to `translations.js`. New games wired into `App.jsx` menu grid (2x3). All state is local React state. No new dependencies.

**Tech Stack:** React 19, Vite, CSS-in-JS (inline styles matching existing pattern), Web Audio API

---

### Task 1: Add translations for all new content

**Files:**
- Modify: `src/utils/translations.js`

**Step 1:** Add all new translation keys for both new games + deepened existing games. Keys to add:

```js
// New games
game5: "🧠 MEMORY MATCH",           // ar: "🧠 لعبة الذاكرة"
game6: "🔤 LETTER RACING",          // ar: "🔤 سباق الحروف"

// Memory Match
memoryTitle: "Pit Crew Memory",      // ar: "ذاكرة طاقم الصيانة"
memoryMoves: "Moves",               // ar: "الحركات"
memoryMatched: "Matched",           // ar: "تطابق"
memoryComplete: "ALL MATCHED!",     // ar: "تم التطابق!"
memoryPlayAgain: "PLAY AGAIN",      // ar: "العب مرة أخرى"

// Letter Racing
letterTitle: "Letter Speedway",      // ar: "مضمار الحروف"
letterFind: "Find the letter",      // ar: "ابحث عن الحرف"
letterScore: "Score",               // ar: "النتيجة"
letterTime: "Time",                 // ar: "الوقت"
letterGameOver: "RACE OVER!",       // ar: "انتهى السباق!"
letterFinalScore: "Final Score",    // ar: "النتيجة النهائية"

// Deeper Racing Dash
countOnlyThe: "Count only the",     // ar: "أحصِ فقط"
cars: "cars",                       // ar: "السيارات"
lapsTitle5: "Color Cup Challenge",  // ar: "تحدي كأس الألوان"
lapsTitle6: "Turbo Championship",   // ar: "بطولة التوربو"

// Deeper Paint Shop
paintDone: "DONE!",                 // ar: "تم!"
purple: "Purple",                   // ar: "بنفسجي"
pink: "Pink",                       // ar: "زهري"
patternStripes: "Stripes",          // ar: "خطوط"
patternStars: "Stars",              // ar: "نجوم"
patternFlames: "Flames",            // ar: "نيران"
patternNone: "Solid",               // ar: "لون واحد"

// Deeper Sign Matcher
rectangle: "Rectangle",             // ar: "المستطيل"
diamond: "Diamond",                 // ar: "المعين"
star: "Star",                       // ar: "النجمة"
signLevel: "Round",                 // ar: "الجولة"

// Deeper Coloring Book
undo: "UNDO",                       // ar: "تراجع"
fill: "FILL",                       // ar: "ملء"
draw: "DRAW",                       // ar: "رسم"
```

**Step 2:** Commit: `feat: add translations for new games and deeper content`

---

### Task 2: Build Memory Match game

**Files:**
- Create: `src/components/MemoryMatch.jsx`

**Design:**
- 4x4 grid of face-down cards (8 pairs) with Cars-themed emojis
- Tap a card to flip it, tap a second to check for match
- Matched pairs stay face-up with a glow
- Track moves count and matched count
- Win screen when all 8 pairs found
- Cards: 🏎️ 🏁 ⛽ 🔧 🛞 🚦 🏆 ⚡

**Key behaviors:**
- Cards shuffle on mount using Fisher-Yates
- Max 2 cards flipped at once; if no match, flip back after 800ms
- Disabled clicking during the flip-back delay
- Win triggers `playWinSound()`, shows overlay with moves count
- "Play Again" reshuffles and resets

**Step 1:** Create the component with the full game logic (state: cards array, flipped indices, matched ids, moves count, game status).

**Step 2:** Commit: `feat: add Memory Match game component`

---

### Task 3: Build Letter Racing game

**Files:**
- Create: `src/components/LetterRacing.jsx`

**Design:**
- A target letter shown large at top ("Find: A")
- Letters fly across the screen on cars (like Racing Dash) — one correct, 2-3 wrong
- Tap the car with the correct letter to score
- Tapping wrong letter: car shakes, no point
- 30-second timer, score as many as possible
- After each correct tap, new target letter appears
- Uses uppercase A-Z, shows 3-4 cars at a time
- Game over screen shows final score

**Key behaviors:**
- Letters chosen randomly, guaranteed one correct per wave
- Cars spawn from left, move right (reuse racing pattern)
- Speed increases slightly as score goes up
- Timer counts down from 30, displayed prominently
- Cars have the letter displayed large inside them

**Step 1:** Create the component with full game logic (state: target letter, cars array, score, timeLeft, gameStatus).

**Step 2:** Commit: `feat: add Letter Racing game component`

---

### Task 4: Wire new games into App.jsx menu

**Files:**
- Modify: `src/App.jsx`

**Step 1:** Import both new components. Add two new cases to the `renderGame` switch. Add two new menu buttons to the grid. Change grid to 3x2 layout for 6 games.

**Step 2:** Commit: `feat: wire Memory Match and Letter Racing into main menu`

---

### Task 5: Deepen Racing Dash — color filter levels + more levels

**Files:**
- Modify: `src/components/CountingGame.jsx`

**Changes:**
- Add 2 new levels (5 and 6):
  - Level 5: "Color Cup Challenge" — count only RED cars (target: 5). Cars spawn in mixed colors. Only red ones count.
  - Level 6: "Turbo Championship" — count only BLUE cars (target: 8). Fastest speed.
- For color-filter levels, show instruction text: "Count only the RED cars!"
- Tapping a wrong-color car plays a wobble animation but doesn't increment count
- Add variety: car shapes (wider trucks for some, smaller sports cars)

**Step 1:** Add the two new levels to the levels array with a `filterColor` property. Modify `handleCarClick` to check color filter. Add instruction text when filterColor is set. Add wobble feedback for wrong-color taps.

**Step 2:** Commit: `feat: add color-filter challenge levels to Racing Dash`

---

### Task 6: Deepen Paint Shop — patterns + more colors + driving animation

**Files:**
- Modify: `src/components/PaintShop.jsx`

**Changes:**
- Add 2 more colors: Purple (#8338ec), Pink (#ff006e)
- Add pattern selector below colors: Solid, Stripes, Stars, Flames
- Patterns rendered as CSS overlays on the car preview (repeating-linear-gradient for stripes, emoji overlay for stars/flames)
- Add "DONE!" button that triggers a driving-away animation (car slides right and shrinks) then resets

**Step 1:** Add new colors and pattern state. Add pattern buttons UI. Apply pattern as overlay on car preview. Add done button with CSS transition animation.

**Step 2:** Commit: `feat: add patterns, more colors, and drive-away to Paint Shop`

---

### Task 7: Deepen Sign Matcher — more shapes + rounds + drag-and-drop mode

**Files:**
- Modify: `src/components/SignMatcher.jsx`

**Changes:**
- Add 3 more shapes: Rectangle (SPEED LIMIT, blue), Diamond (WARNING, orange), Star (SPECIAL, purple)
- Add round counter: "Round 1 of 6" — one round per shape, then celebration
- After completing all 6, show a final win screen with `playWinSound()`
- Track score (correct on first try = 2 points, needed hint = 1 point)

**Step 1:** Add new shapes to the array. Add round tracking state and final win condition. Add score tracking. Show round counter and final celebration screen.

**Step 2:** Commit: `feat: add more shapes, rounds, and scoring to Sign Matcher`

---

### Task 8: Deepen Coloring Book — undo, fill tool, more images

**Files:**
- Modify: `src/components/ColoringBook.jsx`

**Changes:**
- Add undo functionality: store canvas snapshots in array (max 20), pop on undo
- Add fill/draw mode toggle: "FILL" mode floods a region with color using canvas flood-fill, "DRAW" mode is current brush behavior
- Add 3 more coloring page images (we'll use simple SVG-based line art generated as data URIs so no external assets needed)
- Show image selector as thumbnail strip at bottom

**Step 1:** Add undo stack (save canvas toDataURL before each stroke, restore on undo). Add draw/fill mode toggle button. Add flood-fill algorithm for fill mode. Add image thumbnail selector strip. Add placeholder SVG images.

**Step 2:** Commit: `feat: add undo, fill tool, and more images to Coloring Book`

---

### Task 9: Add CSS for new games and animations

**Files:**
- Modify: `src/index.css`

**Changes:**
- Add `.memory-card` flip animation (3D transform)
- Add `.card-matched` glow animation
- Add `.wobble` animation for wrong-tap feedback
- Add `.drive-away` animation for Paint Shop
- Add `.letter-car` styling
- Grid adjustments for 6-button menu on mobile

**Step 1:** Add all new CSS keyframes and classes.

**Step 2:** Commit: `feat: add CSS animations for new and enhanced games`

---

### Task 10: Final integration test and polish

**Step 1:** Run `npm run dev` and manually verify:
- All 6 games accessible from menu
- Memory Match: cards flip, match, win screen works
- Letter Racing: letters spawn, timer counts, scoring works
- Racing Dash: levels 5-6 color filter works, wrong-tap wobble
- Paint Shop: new colors, patterns, drive-away animation
- Sign Matcher: 6 shapes, round counter, final celebration
- Coloring Book: undo, fill tool, image switcher
- Both EN and AR languages work for all new content
- Mobile layout works (3x2 grid)

**Step 2:** Fix any issues found.

**Step 3:** Commit: `chore: polish and integration fixes`
