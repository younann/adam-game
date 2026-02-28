# Celebration Animations & Fullscreen Mode - Design

## Feature 1: Confetti Celebration Component

### New file: `src/components/Confetti.jsx`
- React component rendering ~30 confetti `<div>` pieces when mounted
- Each piece: random color (red, yellow, blue, green, purple, orange), random size (8-14px), random X position, random rotation, random fall duration (1.5-3s)
- Absolutely positioned to fill parent container
- CSS `@keyframes confettiFall` - falls from top to bottom while rotating and swaying
- Auto-unmounts after 3 seconds via setTimeout cleanup
- `pointer-events: none` so it doesn't block gameplay

### New CSS in `src/index.css`
- `@keyframes confettiFall` animation
- `.confetti-container` and `.confetti-piece` styles

### Integration points (wherever `playWinSound()` fires)
- `CountingGame.jsx` - level complete
- `SignMatcher.jsx` - correct answer, all shapes done
- `MemoryMatch.jsx` - all pairs matched
- `LetterRacing.jsx` - game over score display
- `PaintShop.jsx` - drive-away triggered
- `ColoringBook.jsx` - no win moment, skip

### Pattern
Each game adds `{showConfetti && <Confetti />}` with state set to `true` alongside existing `playWinSound()` calls.

## Feature 2: Fullscreen Toggle

### Modified: `src/App.jsx` (MainMenu)
- Fullscreen toggle button next to EN/AR buttons
- Uses Fullscreen API: `document.documentElement.requestFullscreen()`
- Listens for `fullscreenchange` event to sync icon state
- Conditionally rendered only if `document.fullscreenEnabled` is true
- Expand icon when not fullscreen, compress icon when fullscreen

### Modified: `src/utils/translations.js`
- Add `fullscreen` / `exitFullscreen` translation keys

### Decisions
- Pure CSS confetti (no libraries)
- Triggers on every win moment
- Fullscreen button on main menu only
- Hidden on unsupported devices (e.g. iPhone Safari)
