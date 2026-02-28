# Sign Matcher Drag & Drop - Design

## Change
Replace tap-to-match with drag-and-drop in SignMatcher. Child drags a shape from the bottom grid onto the dashed target zone at top.

## Interaction Flow
1. Round shows "Find the Octagon" with dashed target zone at top
2. 6 draggable shapes at bottom in shuffled order
3. Child touches and drags a shape — it follows their finger
4. Drop on target zone: correct → match + confetti + next round. Wrong → wobble + snap back
5. Drop elsewhere → snap back silently
6. Scoring: 2 pts first try, 1 pt after failed attempt

## Technical Approach
- Touch events (onTouchStart/Move/End) + mouse fallback (onMouseDown/Move/Up)
- dragState tracks { shapeId, startX, startY, currentX, currentY }
- useRef on target zone for bounding rect hit detection
- Dragged shape renders at position:fixed following finger, scaled 1.15x
- Original shape in grid gets opacity:0.3 while dragging
- Zero dependencies

## What stays the same
- All 6 shapes, colors, clip-paths, signs
- Round-by-round progression
- Score system, confetti, progress bar, game complete overlay
- All translations
