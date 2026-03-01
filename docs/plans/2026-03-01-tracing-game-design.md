# Tracing/Handwriting Game Design

## Overview
Canvas-based tracing game where kids follow dotted paths to learn letters, numbers, and shapes. Forgiving tolerance, Cars-themed, bilingual EN/AR.

## Content
- **Letters**: A-Z (English), 28 Arabic letters
- **Numbers**: 0-9
- **Shapes**: circle, square, triangle, star, diamond, heart

## Interaction
- Dashed outline path displayed on canvas
- Child traces with finger/mouse along the path
- ~30px tolerance zone - forgiving, fun-focused
- Progress tracked as percentage of path covered
- ~80% coverage = completion

## Game Flow
1. Category selection: Letters / Numbers / Shapes (3 big buttons)
2. Tracing screen: dashed outline, start arrow, progress bar, color trail
3. Completion: confetti, "KA-CHOW!" sound, 3 stars, personalized message
4. Navigation: Next button advances sequentially, Back returns to categories

## UI
- Cars theme: red/yellow/blue, racing metaphors
- Header: back button, item label ("Trace the letter A"), position (3 of 26)
- Canvas: large centered, gray dashed path, bold colored stroke, green start marker
- Bottom: Clear button, Next button (post-completion), stroke color picker
- Completion overlay: confetti + "GREAT JOB, ADAM!" + 3 stars

## Technical
- Single file: `TracingGame.jsx`
- Canvas-based drawing (matches ColoringBook.jsx pattern)
- Touch + mouse support
- Path data: normalized 0-1 coordinates, scaled at runtime
- Letters as multi-stroke polylines (1-3 strokes each)
- No external dependencies

## Architecture: Approach 1 (Canvas-Based)
Chosen over SVG and segmented-reveal for best touch performance, consistency with existing ColoringBook, and smooth drawing experience.
