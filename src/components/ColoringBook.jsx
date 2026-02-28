import React, { useRef, useState, useEffect, useCallback } from 'react';
import { playBoop, playWinSound } from '../utils/audio';

// Importing images from assets
import img1 from '../assets/coloring-images/1d876e8ec8dce297f4e59d09b98c897b.jpg';
import img2 from '../assets/coloring-images/3.jpg';
import img3 from '../assets/coloring-images/Coloring-Page-Of-Lightning-McQueen-As-a-Monster-Truck-791x1024.jpg';
import img4 from '../assets/coloring-images/Coloring-for-kids-cars-3-53853.jpg.jpeg';
import img5 from '../assets/coloring-images/Free-Cars-Coloring-Sheet.jpg';
import img6 from '../assets/coloring-images/Free-Printable-Cars-Coloring-Pages.jpg';
import img7 from '../assets/coloring-images/disney-mater-the-tow-truck-cars-coloring-pages.png';
import img8 from '../assets/coloring-images/download.png';

const images = [
  { id: 'mcqueen1', src: img1 },
  { id: 'mcqueen2', src: img2 },
  { id: 'mcqueen-monster', src: img3 },
  { id: 'cars-3', src: img4 },
  { id: 'free-sheet', src: img5 },
  { id: 'printable', src: img6 },
  { id: 'mater', src: img7 },
  { id: 'cars-all', src: img8 },
];

const colors = [
  '#e63946', '#f4a261', '#ffb703', '#2a9d8f', '#457b9d',
  '#264653', '#8338ec', '#ff006e', '#3a86ff', '#ffffff', '#000000'
];

// Flood fill algorithm using canvas pixel manipulation
const floodFill = (ctx, startX, startY, fillColor) => {
  const canvas = ctx.canvas;
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  const width = canvas.width;
  const height = canvas.height;

  // Get target color at start position
  const startIdx = (startY * width + startX) * 4;
  const targetR = data[startIdx];
  const targetG = data[startIdx + 1];
  const targetB = data[startIdx + 2];
  const targetA = data[startIdx + 3];

  // Parse fill color
  const temp = document.createElement('canvas').getContext('2d');
  temp.fillStyle = fillColor;
  temp.fillRect(0, 0, 1, 1);
  const fillData = temp.getImageData(0, 0, 1, 1).data;
  const fillR = fillData[0], fillG = fillData[1], fillB = fillData[2], fillA = fillData[3];

  // Don't fill if same color
  if (targetR === fillR && targetG === fillG && targetB === fillB && targetA === fillA) return;

  const tolerance = 30;
  const colorMatch = (idx) => {
    return Math.abs(data[idx] - targetR) <= tolerance &&
           Math.abs(data[idx + 1] - targetG) <= tolerance &&
           Math.abs(data[idx + 2] - targetB) <= tolerance &&
           Math.abs(data[idx + 3] - targetA) <= tolerance;
  };

  const stack = [[startX, startY]];
  const visited = new Set();

  while (stack.length > 0) {
    const [x, y] = stack.pop();
    const key = y * width + x;
    if (x < 0 || x >= width || y < 0 || y >= height || visited.has(key)) continue;

    const idx = key * 4;
    if (!colorMatch(idx)) continue;

    visited.add(key);
    data[idx] = fillR;
    data[idx + 1] = fillG;
    data[idx + 2] = fillB;
    data[idx + 3] = fillA;

    stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
  }

  ctx.putImageData(imageData, 0, 0);
};

export default function ColoringBook({ onBack, lang, t }) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [selectedColor, setSelectedColor] = useState(colors[0]);
  const [brushSize, setBrushSize] = useState(15);
  const [imgIdx, setImgIdx] = useState(0);
  const [isDrawing, setIsDrawing] = useState(false);
  const [undoStack, setUndoStack] = useState([]);
  const [drawMode, setDrawMode] = useState('draw'); // 'draw' or 'fill'

  // Storage for drawings per image
  const [savedDrawings, setSavedDrawings] = useState({});

  const currentImage = images[imgIdx];

  useEffect(() => {
    if (!containerRef.current || !canvasRef.current) return;

    const resizeObserver = new ResizeObserver(() => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (canvas && container) {
        // Save current content to a temporary canvas if we're resizing
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = canvas.width;
        tempCanvas.height = canvas.height;
        tempCanvas.getContext('2d').drawImage(canvas, 0, 0);

        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;

        const ctx = canvas.getContext('2d');
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        // Restore content scaled to new size
        if (tempCanvas.width > 0 && tempCanvas.height > 0) {
           ctx.drawImage(tempCanvas, 0, 0, tempCanvas.width, tempCanvas.height, 0, 0, canvas.width, canvas.height);
        }
        
        // Also restore from saved drawing if it exists and temp was empty
        if (savedDrawings[currentImage.id]) {
          const img = new Image();
          img.src = savedDrawings[currentImage.id];
          img.onload = () => {
            ctx.drawImage(img, 0, 0, img.width, img.height, 0, 0, canvas.width, canvas.height);
          };
        }
      }
    });

    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, [imgIdx]);

  const saveCurrentDrawing = () => {
    if (canvasRef.current) {
      const dataUrl = canvasRef.current.toDataURL();
      setSavedDrawings(prev => ({
        ...prev,
        [currentImage.id]: dataUrl
      }));
    }
  };

  // Save canvas state to undo stack (max 20 entries)
  const pushToUndoStack = useCallback(() => {
    if (canvasRef.current) {
      const dataUrl = canvasRef.current.toDataURL();
      setUndoStack(prev => {
        const newStack = [...prev, dataUrl];
        if (newStack.length > 20) {
          newStack.shift();
        }
        return newStack;
      });
    }
  }, []);

  const handleUndo = useCallback(() => {
    if (undoStack.length === 0) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const lastState = undoStack[undoStack.length - 1];

    setUndoStack(prev => prev.slice(0, -1));

    const img = new Image();
    img.src = lastState;
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      saveCurrentDrawing();
    };
    playBoop();
  }, [undoStack]);

  const getCoordinates = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;
    if (e.touches && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    return {
      offsetX: clientX - rect.left,
      offsetY: clientY - rect.top
    };
  };

  const handleCanvasDown = (e) => {
    if (drawMode === 'fill') {
      // Fill mode: save to undo, then flood fill
      pushToUndoStack();
      const { offsetX, offsetY } = getCoordinates(e);
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      // Scale coordinates to actual canvas pixel coordinates
      const scaleX = canvas.width / canvas.getBoundingClientRect().width;
      const scaleY = canvas.height / canvas.getBoundingClientRect().height;
      const pixelX = Math.floor(offsetX * scaleX);
      const pixelY = Math.floor(offsetY * scaleY);
      floodFill(ctx, pixelX, pixelY, selectedColor);
      saveCurrentDrawing();
      playBoop();
    } else {
      // Draw mode: save to undo stack, then start drawing
      pushToUndoStack();
      const { offsetX, offsetY } = getCoordinates(e);
      const ctx = canvasRef.current.getContext('2d');
      ctx.beginPath();
      ctx.moveTo(offsetX, offsetY);
      ctx.strokeStyle = selectedColor;
      ctx.lineWidth = brushSize;
      setIsDrawing(true);
    }
  };

  const draw = (e) => {
    if (!isDrawing || drawMode === 'fill') return;
    const { offsetX, offsetY } = getCoordinates(e);
    const ctx = canvasRef.current.getContext('2d');
    ctx.lineTo(offsetX, offsetY);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (isDrawing) {
      setIsDrawing(false);
      saveCurrentDrawing();
    }
  };

  const handleImageSelect = (idx) => {
    if (idx === imgIdx) return;
    saveCurrentDrawing();
    playBoop();
    setImgIdx(idx);
    setUndoStack([]); // Clear undo stack when switching images
  };

  const clearCanvas = () => {
    pushToUndoStack();
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setSavedDrawings(prev => ({
      ...prev,
      [currentImage.id]: null
    }));
    playBoop();
  };

  return (
    <div className="game-screen animate-slide-up" style={{ 
      textAlign: 'center', 
      flex: 1, 
      display: 'flex', 
      flexDirection: 'column', 
      gap: '8px', 
      minHeight: '400px', 
      height: '100%',
      justifyContent: 'space-between'
    }}>
      {/* Top toolbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 5px', alignItems: 'center', minHeight: '40px', flexWrap: 'wrap', gap: '8px' }}>
        <button onClick={onBack} style={{ background: 'rgba(0,0,0,0.5)', fontSize: '0.8rem', color: 'white', padding: '0.5rem 0.8rem', zIndex: 100, borderRadius: '10px' }}>{t.back}</button>
        <h2 style={{ margin: 0, fontSize: 'clamp(1rem, 4vw, 1.4rem)', color: 'var(--lightning-yellow)' }}>{t.coloringTitle}</h2>
        <div style={{ display: 'flex', gap: '5px', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
          <button
            onClick={handleUndo}
            disabled={undoStack.length === 0}
            style={{
              fontSize: '0.75rem',
              background: 'var(--vibrant-blue)',
              color: 'white',
              padding: '0.5rem 0.7rem',
              borderRadius: '8px'
            }}
          >
            {t.undo}
          </button>
          <button
            onClick={() => { setDrawMode('draw'); playBoop(); }}
            style={{
              fontSize: '0.75rem',
              background: drawMode === 'draw' ? '#2a9d8f' : 'rgba(255,255,255,0.1)',
              color: 'white',
              padding: '0.5rem 0.7rem',
              borderRadius: '8px',
              border: drawMode === 'draw' ? '2px solid white' : '1px solid rgba(255,255,255,0.2)'
            }}
          >
            {t.draw}
          </button>
          <button
            onClick={() => { setDrawMode('fill'); playBoop(); }}
            style={{
              fontSize: '0.75rem',
              background: drawMode === 'fill' ? '#8338ec' : 'rgba(255,255,255,0.1)',
              color: 'white',
              padding: '0.5rem 0.7rem',
              borderRadius: '8px',
              border: drawMode === 'fill' ? '2px solid white' : '1px solid rgba(255,255,255,0.2)'
            }}
          >
            {t.fill}
          </button>
          <button onClick={clearCanvas} style={{ fontSize: '0.75rem', background: 'var(--mcqueen-red)', color: 'white', padding: '0.5rem 0.7rem', borderRadius: '8px' }}>{t.clear}</button>
        </div>
      </div>

      {/* Canvas area */}
      <div
        ref={containerRef}
        style={{
          flex: 1,
          position: 'relative',
          margin: '0 auto',
          width: '100%',
          maxWidth: '750px',
          minHeight: '200px',
          backgroundColor: 'white',
          borderRadius: '20px',
          overflow: 'hidden',
          boxShadow: '0 8px 30px rgba(0,0,0,0.6)',
          touchAction: 'none',
          border: '4px solid #333'
        }}>
        {/* The target coloring image */}
        <img
          src={currentImage.src}
          key={currentImage.id}
          alt="Coloring page"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            position: 'absolute',
            top: 0,
            left: 0,
            pointerEvents: 'none',
            zIndex: 1,
            display: 'block'
          }}
        />

        {/* The drawing canvas */}
        <canvas
          ref={canvasRef}
          onMouseDown={handleCanvasDown}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseOut={stopDrawing}
          onTouchStart={handleCanvasDown}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            mixBlendMode: 'multiply',
            zIndex: 2,
            cursor: drawMode === 'fill' ? 'crosshair' : 'crosshair'
          }}
        />
      </div>

      {/* Image thumbnail selector strip */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        gap: '10px',
        padding: '8px 12px',
        overflowX: 'auto',
        background: 'rgba(0,0,0,0.35)',
        borderRadius: '15px',
        margin: '5px 0'
      }}>
        {images.map((image, idx) => (
          <div
            key={image.id}
            onClick={() => handleImageSelect(idx)}
            style={{
              width: '55px',
              height: '45px',
              borderRadius: '8px',
              overflow: 'hidden',
              cursor: 'pointer',
              border: idx === imgIdx ? '3px solid var(--lightning-yellow)' : '2px solid transparent',
              flexShrink: 0,
              background: 'white',
              transition: 'all 0.2s'
            }}
          >
            <img
              src={image.src}
              alt={image.id}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                display: 'block'
              }}
            />
          </div>
        ))}
      </div>

      {/* Color Palette */}
      <div style={{
        padding: '10px',
        background: 'rgba(0,0,0,0.4)',
        borderRadius: '25px',
        margin: '0 0 5px'
      }}>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '8px' }}>
          {colors.map(color => (
            <button
              key={color}
              onClick={() => { setSelectedColor(color); playBoop(); }}
              style={{
                width: 'clamp(28px, 7vw, 36px)',
                height: 'clamp(28px, 7vw, 36px)',
                background: color,
                border: selectedColor === color ? '3px solid white' : '1px solid rgba(255,255,255,0.3)',
                borderRadius: '50%',
                transform: selectedColor === color ? 'scale(1.15)' : 'scale(1)',
                padding: 0,
                boxShadow: selectedColor === color ? '0 0 10px white' : 'none'
              }}
            />
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', padding: '6px 15px', background: 'rgba(255,255,255,0.1)', borderRadius: '20px', width: 'fit-content', margin: '0 auto' }}>
          <div
            onClick={() => setBrushSize(8)}
            style={{ width: '8px', height: '8px', background: 'white', borderRadius: '50%', cursor: 'pointer', border: brushSize === 8 ? '2px solid var(--mcqueen-red)' : 'none' }}
          ></div>
          <div
            onClick={() => setBrushSize(20)}
            style={{ width: '16px', height: '16px', background: 'white', borderRadius: '50%', cursor: 'pointer', border: brushSize === 20 ? '2px solid var(--mcqueen-red)' : 'none' }}
          ></div>
          <div
            onClick={() => setBrushSize(40)}
            style={{ width: '26px', height: '26px', background: 'white', borderRadius: '50%', cursor: 'pointer', border: brushSize === 40 ? '2px solid var(--mcqueen-red)' : 'none' }}
          ></div>
        </div>
      </div>
    </div>
  );
}
