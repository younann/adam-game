# Photo Booth - Take Photo with Pixar Cars - Design

## Feature
New "Photo Booth" game: kid opens camera, takes a selfie/photo, then places draggable Cars character stickers on the photo, and saves the composite image.

## Flow
1. Open Photo Booth from main menu (7th button)
2. Camera preview (rear camera, fallback to front)
3. Snap button captures frame
4. Photo displayed with sticker tray at bottom (5 car characters)
5. Tap sticker to add to photo, drag to reposition
6. Save button composites photo + stickers to canvas and downloads as PNG
7. Retake button goes back to camera

## Technical Approach
- getUserMedia for camera, draw video frame to canvas for capture
- Stickers: draggable images with touch/mouse on window (via useEffect + refs)
- Save: render photo + stickers onto single canvas, toBlob, download
- 5 stickers from existing car assets

## Files
- Create: src/components/PhotoBooth.jsx
- Modify: src/App.jsx (add 7th menu button + route)
- Modify: src/utils/translations.js (add translations)
