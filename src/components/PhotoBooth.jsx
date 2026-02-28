import React, { useState, useRef, useEffect, useCallback } from 'react';
import { playBoop, playWinSound } from '../utils/audio';
import Confetti from './Confetti';

import mcqueen from '../assets/cars/770c1752bd3dc58917586f5272de4068.jpg';
import flo from '../assets/cars/images2.jpeg';
import sheriff from '../assets/cars/images21.jpeg';
import red from '../assets/cars/images33.jpeg';
import sterling from '../assets/cars/images12.jpeg';

const STICKERS = [
  { id: 'mcqueen', src: mcqueen, label: 'McQueen' },
  { id: 'flo', src: flo, label: 'Flo' },
  { id: 'sheriff', src: sheriff, label: 'Sheriff' },
  { id: 'red', src: red, label: 'Red' },
  { id: 'sterling', src: sterling, label: 'Sterling' },
];

export default function PhotoBooth({ onBack, lang, t }) {
  const [phase, setPhase] = useState('camera'); // camera | edit
  const [photoData, setPhotoData] = useState(null);
  const [stickers, setStickers] = useState([]);
  const [dragIdx, setDragIdx] = useState(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [cameraError, setCameraError] = useState(false);

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const photoContainerRef = useRef(null);
  const dragRef = useRef(null);
  const dragOffsetRef = useRef({ dx: 0, dy: 0 });

  // Start camera
  useEffect(() => {
    if (phase !== 'camera') return;

    let cancelled = false;

    async function startCamera() {
      try {
        // Try rear camera first
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        });
        if (cancelled) { stream.getTracks().forEach((t) => t.stop()); return; }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch {
        try {
          // Fallback to front camera
          const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
            audio: false,
          });
          if (cancelled) { stream.getTracks().forEach((t) => t.stop()); return; }
          streamRef.current = stream;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        } catch {
          setCameraError(true);
        }
      }
    }

    startCamera();

    return () => {
      cancelled = true;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
    };
  }, [phase]);

  // Stop camera when leaving
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  const takePhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    setPhotoData(dataUrl);

    // Stop camera
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }

    playBoop();
    setPhase('edit');
    setStickers([]);
  };

  const retake = () => {
    setPhotoData(null);
    setStickers([]);
    setPhase('camera');
    setCameraError(false);
  };

  // Add sticker to photo
  const addSticker = (stickerDef) => {
    playBoop();
    setStickers((prev) => [
      ...prev,
      {
        id: Date.now(),
        src: stickerDef.src,
        // Place in center of photo area
        x: 0.3 + Math.random() * 0.2, // 30-50% from left (as fraction)
        y: 0.3 + Math.random() * 0.2, // 30-50% from top
      },
    ]);
  };

  // Remove sticker on double tap
  const removeSticker = (stickerId) => {
    playBoop();
    setStickers((prev) => prev.filter((s) => s.id !== stickerId));
  };

  // Keep dragIdx ref in sync
  useEffect(() => {
    dragRef.current = dragIdx;
  }, [dragIdx]);

  // Get coordinates relative to photo container as fractions (0-1)
  const getRelativePos = useCallback((clientX, clientY) => {
    if (!photoContainerRef.current) return { x: 0.5, y: 0.5 };
    const rect = photoContainerRef.current.getBoundingClientRect();
    return {
      x: (clientX - rect.left - dragOffsetRef.current.dx) / rect.width,
      y: (clientY - rect.top - dragOffsetRef.current.dy) / rect.height,
    };
  }, []);

  // Drag start — touch
  const handleStickerTouchStart = useCallback((e, idx) => {
    e.stopPropagation();
    const touch = e.touches[0];
    if (!photoContainerRef.current) return;
    const rect = photoContainerRef.current.getBoundingClientRect();
    const sticker = stickers[idx];
    // Offset from sticker center so it doesn't jump
    const stickerPxX = sticker.x * rect.width;
    const stickerPxY = sticker.y * rect.height;
    dragOffsetRef.current = {
      dx: (touch.clientX - rect.left) - stickerPxX,
      dy: (touch.clientY - rect.top) - stickerPxY,
    };
    setDragIdx(idx);
  }, [stickers]);

  // Drag start — mouse
  const handleStickerMouseDown = useCallback((e, idx) => {
    e.preventDefault();
    e.stopPropagation();
    if (!photoContainerRef.current) return;
    const rect = photoContainerRef.current.getBoundingClientRect();
    const sticker = stickers[idx];
    const stickerPxX = sticker.x * rect.width;
    const stickerPxY = sticker.y * rect.height;
    dragOffsetRef.current = {
      dx: (e.clientX - rect.left) - stickerPxX,
      dy: (e.clientY - rect.top) - stickerPxY,
    };
    setDragIdx(idx);
  }, [stickers]);

  // Window listeners for drag move/end
  useEffect(() => {
    if (dragIdx === null) return;

    const onMove = (clientX, clientY) => {
      const pos = getRelativePos(clientX, clientY);
      setStickers((prev) =>
        prev.map((s, i) => (i === dragRef.current ? { ...s, x: pos.x, y: pos.y } : s))
      );
    };

    const onMouseMove = (e) => onMove(e.clientX, e.clientY);
    const onTouchMove = (e) => {
      e.preventDefault();
      onMove(e.touches[0].clientX, e.touches[0].clientY);
    };
    const onEnd = () => setDragIdx(null);

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onEnd);
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend', onEnd);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onEnd);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onEnd);
    };
  }, [dragIdx !== null, getRelativePos]);

  // Save composite image
  const savePhoto = useCallback(() => {
    if (!photoData || !photoContainerRef.current) return;

    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');

      // Draw photo
      ctx.drawImage(img, 0, 0);

      // Draw stickers
      const stickerSize = Math.min(img.width, img.height) * 0.25;
      let loadedCount = 0;

      if (stickers.length === 0) {
        downloadCanvas(canvas);
        return;
      }

      stickers.forEach((sticker) => {
        const sImg = new Image();
        sImg.crossOrigin = 'anonymous';
        sImg.onload = () => {
          const aspect = sImg.width / sImg.height;
          const w = stickerSize;
          const h = w / aspect;
          const sx = sticker.x * img.width - w / 2;
          const sy = sticker.y * img.height - h / 2;
          ctx.drawImage(sImg, sx, sy, w, h);
          loadedCount++;
          if (loadedCount === stickers.length) {
            downloadCanvas(canvas);
          }
        };
        sImg.src = sticker.src;
      });
    };
    img.src = photoData;

    playWinSound();
    setShowConfetti(true);
  }, [photoData, stickers]);

  const downloadCanvas = (canvas) => {
    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `adam-with-cars-${Date.now()}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 'image/jpeg', 0.92);
  };

  // ---- CAMERA PHASE ----
  if (phase === 'camera') {
    return (
      <div className="game-screen animate-slide-up" style={{ textAlign: 'center', width: '100%', position: 'relative', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', width: '100%', padding: '0 5px', gap: '10px' }}>
          <button onClick={onBack} style={{ background: 'rgba(0,0,0,0.5)', fontSize: '0.9rem', color: 'white', padding: '0.6rem 1.2rem', minWidth: '80px' }}>{t.back}</button>
          <h2 style={{ fontSize: 'clamp(1rem, 4.5vw, 1.8rem)', color: 'var(--lightning-yellow)', margin: 0, flex: 1 }}>{t.photoTitle}</h2>
          <div style={{ minWidth: '80px' }}></div>
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: '1rem' }}>
          {cameraError ? (
            <div style={{ color: 'white', fontSize: '1.2rem', padding: '2rem', textAlign: 'center' }}>
              <p style={{ fontSize: '3rem', marginBottom: '1rem' }}>📷</p>
              <p>{t.cameraError}</p>
            </div>
          ) : (
            <div style={{
              width: '100%',
              maxWidth: '500px',
              aspectRatio: '4/3',
              borderRadius: '20px',
              overflow: 'hidden',
              border: '4px solid white',
              boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
              background: '#000',
            }}>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>
          )}
        </div>

        {!cameraError && (
          <button
            onClick={takePhoto}
            style={{
              margin: '1rem auto',
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: 'white',
              border: '6px solid var(--mcqueen-red)',
              boxShadow: '0 0 0 4px white, 0 8px 20px rgba(0,0,0,0.4)',
              cursor: 'pointer',
              padding: 0,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              fontSize: '2rem',
            }}
          >
            📸
          </button>
        )}
      </div>
    );
  }

  // ---- EDIT PHASE ----
  return (
    <div className="game-screen animate-slide-up" style={{ textAlign: 'center', width: '100%', position: 'relative', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', userSelect: 'none' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem', width: '100%', padding: '0 5px', gap: '10px' }}>
        <button onClick={onBack} style={{ background: 'rgba(0,0,0,0.5)', fontSize: '0.9rem', color: 'white', padding: '0.6rem 1.2rem', minWidth: '80px' }}>{t.back}</button>
        <h2 style={{ fontSize: 'clamp(1rem, 4.5vw, 1.6rem)', color: 'var(--lightning-yellow)', margin: 0, flex: 1 }}>{t.photoAddStickers}</h2>
        <div style={{ minWidth: '80px' }}></div>
      </div>

      {/* Photo with stickers */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
        <div
          ref={photoContainerRef}
          style={{
            position: 'relative',
            width: '100%',
            maxWidth: '500px',
            aspectRatio: '4/3',
            borderRadius: '20px',
            overflow: 'hidden',
            border: '4px solid white',
            boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
            background: '#000',
            touchAction: 'none',
          }}
        >
          <img
            src={photoData}
            alt="Your photo"
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            draggable={false}
          />

          {/* Stickers on photo */}
          {stickers.map((sticker, idx) => (
            <img
              key={sticker.id}
              src={sticker.src}
              alt="sticker"
              draggable={false}
              onTouchStart={(e) => handleStickerTouchStart(e, idx)}
              onMouseDown={(e) => handleStickerMouseDown(e, idx)}
              onDoubleClick={() => removeSticker(sticker.id)}
              style={{
                position: 'absolute',
                left: `${sticker.x * 100}%`,
                top: `${sticker.y * 100}%`,
                transform: 'translate(-50%, -50%)',
                width: '25%',
                cursor: dragIdx === idx ? 'grabbing' : 'grab',
                filter: 'drop-shadow(3px 3px 6px rgba(0,0,0,0.6))',
                zIndex: dragIdx === idx ? 100 : 10,
                transition: dragIdx === idx ? 'none' : 'left 0.05s, top 0.05s',
                pointerEvents: 'auto',
              }}
            />
          ))}
        </div>
      </div>

      {/* Sticker tray */}
      <div style={{ marginTop: '0.8rem' }}>
        <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 'clamp(0.75rem, 3vw, 0.9rem)', marginBottom: '0.5rem' }}>{t.photoTapToAdd}</p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.6rem', flexWrap: 'wrap', padding: '0 10px' }}>
          {STICKERS.map((s) => (
            <div
              key={s.id}
              onClick={() => addSticker(s)}
              style={{
                width: 'clamp(55px, 14vw, 75px)',
                height: 'clamp(55px, 14vw, 75px)',
                borderRadius: '15px',
                background: 'rgba(255,255,255,0.1)',
                border: '2px solid rgba(255,255,255,0.3)',
                cursor: 'pointer',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                overflow: 'hidden',
                transition: 'all 0.2s',
                boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
              }}
            >
              <img src={s.src} alt={s.label} style={{ width: '90%', height: '90%', objectFit: 'contain' }} draggable={false} />
            </div>
          ))}
        </div>
      </div>

      {/* Action buttons */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '0.8rem', flexWrap: 'wrap' }}>
        <button
          onClick={retake}
          style={{ background: 'rgba(255,255,255,0.15)', color: 'white', fontSize: 'clamp(0.9rem, 3.5vw, 1.1rem)', padding: '0.7rem 1.5rem', border: '2px solid rgba(255,255,255,0.3)' }}
        >
          {t.photoRetake}
        </button>
        <button
          onClick={savePhoto}
          style={{ background: 'var(--mcqueen-red)', color: 'white', fontSize: 'clamp(0.9rem, 3.5vw, 1.1rem)', padding: '0.7rem 1.5rem' }}
        >
          {t.photoSave}
        </button>
      </div>

      {showConfetti && <Confetti onDone={() => setShowConfetti(false)} />}
    </div>
  );
}
