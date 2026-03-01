import React, { useState, useEffect, useCallback, useRef } from 'react';
import { playBoop, playWinSound } from '../utils/audio';
import Confetti from './Confetti';
import { renderPersonalizedText } from '../App';

// ─── Stroke color palette ───────────────────────────────────────────────────
const STROKE_COLORS = ['#e63946', '#457b9d', '#ffb703', '#2a9d8f', '#8338ec', '#ff006e'];

// ─── Helper: generate arc points ────────────────────────────────────────────
function arc(cx, cy, rx, ry, startAngle, endAngle, steps) {
  const pts = [];
  for (let i = 0; i <= steps; i++) {
    const a = startAngle + (endAngle - startAngle) * (i / steps);
    pts.push({ x: cx + rx * Math.cos(a), y: cy + ry * Math.sin(a) });
  }
  return pts;
}

function line(x1, y1, x2, y2, steps = 8) {
  const pts = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    pts.push({ x: x1 + (x2 - x1) * t, y: y1 + (y2 - y1) * t });
  }
  return pts;
}

// ─── ENGLISH LETTERS (A-Z) ──────────────────────────────────────────────────
const ENGLISH_LETTERS = [
  { label: 'A', strokes: [line(0.3, 0.8, 0.5, 0.2, 10), line(0.5, 0.2, 0.7, 0.8, 10), line(0.38, 0.55, 0.62, 0.55, 6)] },
  { label: 'B', strokes: [line(0.3, 0.2, 0.3, 0.8, 10), [...arc(0.3, 0.35, 0.22, 0.15, -Math.PI / 2, Math.PI / 2, 12)], [...arc(0.3, 0.65, 0.24, 0.15, -Math.PI / 2, Math.PI / 2, 12)]] },
  { label: 'C', strokes: [arc(0.5, 0.5, 0.25, 0.3, -Math.PI * 0.35, Math.PI * 0.35, 18).reverse()] },
  { label: 'D', strokes: [line(0.3, 0.2, 0.3, 0.8, 10), arc(0.3, 0.5, 0.3, 0.3, -Math.PI / 2, Math.PI / 2, 14)] },
  { label: 'E', strokes: [line(0.6, 0.2, 0.3, 0.2, 6), line(0.3, 0.2, 0.3, 0.8, 10), line(0.3, 0.8, 0.6, 0.8, 6), line(0.3, 0.5, 0.55, 0.5, 5)] },
  { label: 'F', strokes: [line(0.6, 0.2, 0.3, 0.2, 6), line(0.3, 0.2, 0.3, 0.8, 10), line(0.3, 0.5, 0.55, 0.5, 5)] },
  { label: 'G', strokes: [[...arc(0.5, 0.5, 0.25, 0.3, -Math.PI * 0.35, Math.PI * 0.3, 16).reverse(), { x: 0.5, y: 0.5 }, ...line(0.5, 0.5, 0.65, 0.5, 4).slice(1)]] },
  { label: 'H', strokes: [line(0.3, 0.2, 0.3, 0.8, 10), line(0.7, 0.2, 0.7, 0.8, 10), line(0.3, 0.5, 0.7, 0.5, 6)] },
  { label: 'I', strokes: [line(0.4, 0.2, 0.6, 0.2, 4), line(0.5, 0.2, 0.5, 0.8, 10), line(0.4, 0.8, 0.6, 0.8, 4)] },
  { label: 'J', strokes: [line(0.4, 0.2, 0.65, 0.2, 4), [...line(0.55, 0.2, 0.55, 0.65, 8), ...arc(0.45, 0.65, 0.1, 0.12, 0, Math.PI * 0.8, 6)]] },
  { label: 'K', strokes: [line(0.3, 0.2, 0.3, 0.8, 10), line(0.65, 0.2, 0.3, 0.5, 8), line(0.3, 0.5, 0.65, 0.8, 8)] },
  { label: 'L', strokes: [line(0.3, 0.2, 0.3, 0.8, 10), line(0.3, 0.8, 0.65, 0.8, 6)] },
  { label: 'M', strokes: [[...line(0.2, 0.8, 0.2, 0.2, 8), ...line(0.2, 0.2, 0.5, 0.55, 6).slice(1), ...line(0.5, 0.55, 0.8, 0.2, 6).slice(1), ...line(0.8, 0.2, 0.8, 0.8, 8).slice(1)]] },
  { label: 'N', strokes: [[...line(0.3, 0.8, 0.3, 0.2, 8), ...line(0.3, 0.2, 0.7, 0.8, 10).slice(1), ...line(0.7, 0.8, 0.7, 0.2, 8).slice(1)]] },
  { label: 'O', strokes: [arc(0.5, 0.5, 0.22, 0.28, 0, Math.PI * 2, 24)] },
  { label: 'P', strokes: [line(0.3, 0.8, 0.3, 0.2, 10), arc(0.3, 0.35, 0.24, 0.15, -Math.PI / 2, Math.PI / 2, 12)] },
  { label: 'Q', strokes: [arc(0.5, 0.48, 0.22, 0.26, 0, Math.PI * 2, 24), line(0.58, 0.62, 0.72, 0.82, 4)] },
  { label: 'R', strokes: [line(0.3, 0.8, 0.3, 0.2, 10), arc(0.3, 0.35, 0.24, 0.15, -Math.PI / 2, Math.PI / 2, 12), line(0.3, 0.5, 0.65, 0.8, 8)] },
  { label: 'S', strokes: [[...arc(0.5, 0.35, 0.18, 0.14, -Math.PI * 0.3, Math.PI * 1.15, 14).reverse(), ...arc(0.5, 0.64, 0.18, 0.14, -Math.PI * 0.15, Math.PI * 1.3, 14)]] },
  { label: 'T', strokes: [line(0.25, 0.2, 0.75, 0.2, 8), line(0.5, 0.2, 0.5, 0.8, 10)] },
  { label: 'U', strokes: [[...line(0.3, 0.2, 0.3, 0.6, 6), ...arc(0.5, 0.6, 0.2, 0.18, Math.PI, 0, 10), ...line(0.7, 0.6, 0.7, 0.2, 6).slice(1)]] },
  { label: 'V', strokes: [[...line(0.25, 0.2, 0.5, 0.8, 10), ...line(0.5, 0.8, 0.75, 0.2, 10).slice(1)]] },
  { label: 'W', strokes: [[...line(0.15, 0.2, 0.3, 0.8, 8), ...line(0.3, 0.8, 0.5, 0.45, 6).slice(1), ...line(0.5, 0.45, 0.7, 0.8, 6).slice(1), ...line(0.7, 0.8, 0.85, 0.2, 8).slice(1)]] },
  { label: 'X', strokes: [line(0.25, 0.2, 0.75, 0.8, 12), line(0.75, 0.2, 0.25, 0.8, 12)] },
  { label: 'Y', strokes: [line(0.25, 0.2, 0.5, 0.5, 8), line(0.75, 0.2, 0.5, 0.5, 8), line(0.5, 0.5, 0.5, 0.8, 6)] },
  { label: 'Z', strokes: [[...line(0.25, 0.2, 0.75, 0.2, 6), ...line(0.75, 0.2, 0.25, 0.8, 12).slice(1), ...line(0.25, 0.8, 0.75, 0.8, 6).slice(1)]] },
];

// ─── ARABIC LETTERS (28 letters) ────────────────────────────────────────────
const ARABIC_LETTERS = [
  { label: '\u0623', strokes: [line(0.5, 0.8, 0.5, 0.3, 10), [{ x: 0.52, y: 0.2 }, { x: 0.48, y: 0.18 }]] }, // أ alef
  { label: '\u0628', strokes: [[...line(0.8, 0.45, 0.5, 0.45, 6), ...arc(0.5, 0.4, 0.15, 0.12, Math.PI / 2, Math.PI, 6), ...line(0.35, 0.4, 0.35, 0.35, 3)], [{ x: 0.55, y: 0.6 }]] }, // ب ba
  { label: '\u062A', strokes: [[...line(0.8, 0.45, 0.5, 0.45, 6), ...arc(0.5, 0.4, 0.15, 0.12, Math.PI / 2, Math.PI, 6), ...line(0.35, 0.4, 0.35, 0.35, 3)], [{ x: 0.5, y: 0.28 }, { x: 0.6, y: 0.28 }]] }, // ت ta
  { label: '\u062B', strokes: [[...line(0.8, 0.5, 0.5, 0.5, 6), ...arc(0.5, 0.45, 0.15, 0.12, Math.PI / 2, Math.PI, 6)], [{ x: 0.5, y: 0.28 }, { x: 0.6, y: 0.28 }, { x: 0.55, y: 0.2 }]] }, // ث tha
  { label: '\u062C', strokes: [arc(0.5, 0.45, 0.2, 0.2, -Math.PI * 0.1, Math.PI * 1.3, 16), [{ x: 0.5, y: 0.5 }]] }, // ج jim
  { label: '\u062D', strokes: [arc(0.5, 0.45, 0.2, 0.2, -Math.PI * 0.1, Math.PI * 1.3, 16)] }, // ح ha
  { label: '\u062E', strokes: [arc(0.5, 0.45, 0.2, 0.2, -Math.PI * 0.1, Math.PI * 1.3, 16), [{ x: 0.5, y: 0.2 }]] }, // خ kha
  { label: '\u062F', strokes: [[...line(0.7, 0.35, 0.5, 0.35, 5), ...line(0.5, 0.35, 0.4, 0.55, 5)]] }, // د dal
  { label: '\u0630', strokes: [[...line(0.7, 0.35, 0.5, 0.35, 5), ...line(0.5, 0.35, 0.4, 0.55, 5)], [{ x: 0.55, y: 0.25 }]] }, // ذ dhal
  { label: '\u0631', strokes: [[...line(0.6, 0.35, 0.5, 0.45, 4), ...arc(0.45, 0.55, 0.1, 0.12, -Math.PI / 2, Math.PI * 0.6, 8)]] }, // ر ra
  { label: '\u0632', strokes: [[...line(0.6, 0.35, 0.5, 0.45, 4), ...arc(0.45, 0.55, 0.1, 0.12, -Math.PI / 2, Math.PI * 0.6, 8)], [{ x: 0.55, y: 0.25 }]] }, // ز zay
  { label: '\u0633', strokes: [[...line(0.85, 0.5, 0.65, 0.5, 4), ...arc(0.65, 0.45, 0.06, 0.05, Math.PI / 2, -Math.PI * 1.5, 8), ...arc(0.53, 0.45, 0.06, 0.05, Math.PI / 2, -Math.PI * 1.5, 8), ...arc(0.41, 0.45, 0.06, 0.05, Math.PI / 2, -Math.PI * 1.5, 8), ...line(0.35, 0.45, 0.25, 0.35, 4)]] }, // س sin
  { label: '\u0634', strokes: [[...line(0.85, 0.55, 0.65, 0.55, 4), ...arc(0.65, 0.5, 0.06, 0.05, Math.PI / 2, -Math.PI * 1.5, 8), ...arc(0.53, 0.5, 0.06, 0.05, Math.PI / 2, -Math.PI * 1.5, 8), ...arc(0.41, 0.5, 0.06, 0.05, Math.PI / 2, -Math.PI * 1.5, 8), ...line(0.35, 0.5, 0.25, 0.4, 4)], [{ x: 0.45, y: 0.3 }, { x: 0.55, y: 0.3 }, { x: 0.5, y: 0.22 }]] }, // ش shin
  { label: '\u0635', strokes: [[...arc(0.55, 0.45, 0.18, 0.16, -Math.PI * 0.15, Math.PI * 1.3, 14), ...line(0.42, 0.57, 0.25, 0.45, 5)]] }, // ص sad
  { label: '\u0636', strokes: [[...arc(0.55, 0.48, 0.18, 0.16, -Math.PI * 0.15, Math.PI * 1.3, 14), ...line(0.42, 0.6, 0.25, 0.48, 5)], [{ x: 0.55, y: 0.25 }]] }, // ض dad
  { label: '\u0637', strokes: [[...line(0.7, 0.65, 0.3, 0.65, 8)], [...arc(0.5, 0.45, 0.12, 0.2, 0, Math.PI * 2, 16)]] }, // ط ta
  { label: '\u0638', strokes: [[...line(0.7, 0.65, 0.3, 0.65, 8)], [...arc(0.5, 0.45, 0.12, 0.2, 0, Math.PI * 2, 16)], [{ x: 0.55, y: 0.22 }]] }, // ظ dha
  { label: '\u0639', strokes: [[...arc(0.55, 0.35, 0.12, 0.1, Math.PI, -Math.PI * 0.15, 10), ...arc(0.52, 0.55, 0.15, 0.12, -Math.PI * 0.6, Math.PI * 0.8, 10)]] }, // ع ain
  { label: '\u063A', strokes: [[...arc(0.55, 0.38, 0.12, 0.1, Math.PI, -Math.PI * 0.15, 10), ...arc(0.52, 0.58, 0.15, 0.12, -Math.PI * 0.6, Math.PI * 0.8, 10)], [{ x: 0.55, y: 0.2 }]] }, // غ ghain
  { label: '\u0641', strokes: [[...arc(0.55, 0.4, 0.15, 0.13, -Math.PI * 0.2, Math.PI * 1.2, 14), ...line(0.43, 0.5, 0.3, 0.4, 4)], [{ x: 0.58, y: 0.22 }]] }, // ف fa
  { label: '\u0642', strokes: [[...arc(0.55, 0.4, 0.15, 0.15, -Math.PI * 0.2, Math.PI * 1.3, 14), ...line(0.55, 0.55, 0.55, 0.7, 5)], [{ x: 0.52, y: 0.2 }, { x: 0.62, y: 0.2 }]] }, // ق qaf
  { label: '\u0643', strokes: [[...line(0.75, 0.65, 0.35, 0.65, 6), ...line(0.35, 0.65, 0.35, 0.35, 5)], [...arc(0.5, 0.5, 0.08, 0.08, 0, Math.PI * 1.8, 10)]] }, // ك kaf
  { label: '\u0644', strokes: [[...line(0.55, 0.2, 0.55, 0.55, 8), ...arc(0.45, 0.6, 0.1, 0.1, 0, Math.PI * 0.8, 6)]] }, // ل lam
  { label: '\u0645', strokes: [[...arc(0.5, 0.45, 0.15, 0.15, -Math.PI * 0.1, Math.PI * 1.4, 14), ...line(0.4, 0.57, 0.35, 0.7, 4)]] }, // م mim
  { label: '\u0646', strokes: [[...arc(0.5, 0.48, 0.18, 0.14, -Math.PI * 0.1, Math.PI * 1.15, 12)], [{ x: 0.52, y: 0.35 }]] }, // ن nun
  { label: '\u0647', strokes: [arc(0.5, 0.48, 0.14, 0.14, 0, Math.PI * 2, 16)] }, // ه ha
  { label: '\u0648', strokes: [[...arc(0.5, 0.45, 0.13, 0.13, -Math.PI * 0.3, Math.PI * 1.6, 14), ...line(0.43, 0.57, 0.4, 0.72, 4)]] }, // و waw
  { label: '\u064A', strokes: [[...arc(0.5, 0.4, 0.17, 0.13, -Math.PI * 0.1, Math.PI * 1.15, 12)], [{ x: 0.48, y: 0.62 }, { x: 0.58, y: 0.62 }]] }, // ي ya
];

// ─── NUMBERS 0-9 ────────────────────────────────────────────────────────────
const NUMBERS = [
  { label: '0', strokes: [arc(0.5, 0.5, 0.18, 0.28, 0, Math.PI * 2, 24)] },
  { label: '1', strokes: [[...line(0.45, 0.3, 0.5, 0.2, 3), ...line(0.5, 0.2, 0.5, 0.8, 10)]] },
  { label: '2', strokes: [[...arc(0.5, 0.35, 0.18, 0.14, Math.PI * 1.2, -Math.PI * 0.1, 12), ...line(0.67, 0.38, 0.32, 0.8, 10), ...line(0.32, 0.8, 0.7, 0.8, 6).slice(1)]] },
  { label: '3', strokes: [[...arc(0.5, 0.35, 0.16, 0.13, -Math.PI * 0.7, Math.PI * 0.5, 10), ...arc(0.5, 0.6, 0.16, 0.15, -Math.PI * 0.5, Math.PI * 0.7, 10)]] },
  { label: '4', strokes: [[...line(0.6, 0.2, 0.3, 0.55, 8), ...line(0.3, 0.55, 0.72, 0.55, 6)], line(0.6, 0.2, 0.6, 0.8, 10)] },
  { label: '5', strokes: [[...line(0.65, 0.2, 0.35, 0.2, 5), ...line(0.35, 0.2, 0.35, 0.45, 5), ...arc(0.5, 0.52, 0.17, 0.17, -Math.PI * 0.6, Math.PI * 0.7, 12)]] },
  { label: '6', strokes: [[...arc(0.5, 0.38, 0.16, 0.16, -Math.PI * 0.5, Math.PI * 0.1, 6).reverse(), ...arc(0.5, 0.58, 0.16, 0.16, -Math.PI * 0.8, Math.PI * 1.2, 16)]] },
  { label: '7', strokes: [[...line(0.3, 0.2, 0.7, 0.2, 6), ...line(0.7, 0.2, 0.45, 0.8, 10).slice(1)]] },
  { label: '8', strokes: [[...arc(0.5, 0.35, 0.14, 0.13, 0, Math.PI * 2, 14), ...arc(0.5, 0.62, 0.16, 0.15, Math.PI, -Math.PI, 14)]] },
  { label: '9', strokes: [[...arc(0.5, 0.38, 0.16, 0.16, Math.PI * 0.2, -Math.PI * 1.2, 16), ...line(0.66, 0.42, 0.5, 0.8, 8)]] },
];

// ─── SHAPES ─────────────────────────────────────────────────────────────────
const SHAPES = [
  { label: 'Circle', strokes: [arc(0.5, 0.5, 0.28, 0.28, 0, Math.PI * 2, 40)] },
  { label: 'Square', strokes: [[...line(0.25, 0.25, 0.75, 0.25, 8), ...line(0.75, 0.25, 0.75, 0.75, 8).slice(1), ...line(0.75, 0.75, 0.25, 0.75, 8).slice(1), ...line(0.25, 0.75, 0.25, 0.25, 8).slice(1)]] },
  { label: 'Triangle', strokes: [[...line(0.5, 0.2, 0.8, 0.8, 10), ...line(0.8, 0.8, 0.2, 0.8, 10).slice(1), ...line(0.2, 0.8, 0.5, 0.2, 10).slice(1)]] },
  {
    label: 'Star',
    strokes: [(() => {
      const pts = [];
      for (let i = 0; i < 10; i++) {
        const angle = -Math.PI / 2 + (i * Math.PI * 2) / 10;
        const r = i % 2 === 0 ? 0.3 : 0.13;
        pts.push({ x: 0.5 + r * Math.cos(angle), y: 0.5 + r * Math.sin(angle) });
      }
      pts.push({ ...pts[0] });
      return pts;
    })()],
  },
  { label: 'Diamond', strokes: [[...line(0.5, 0.18, 0.78, 0.5, 8), ...line(0.78, 0.5, 0.5, 0.82, 8).slice(1), ...line(0.5, 0.82, 0.22, 0.5, 8).slice(1), ...line(0.22, 0.5, 0.5, 0.18, 8).slice(1)]] },
  {
    label: 'Heart',
    strokes: [(() => {
      const pts = [];
      const steps = 40;
      for (let i = 0; i <= steps; i++) {
        const t = (i / steps) * Math.PI * 2;
        const hx = 16 * Math.pow(Math.sin(t), 3);
        const hy = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
        pts.push({ x: 0.5 + hx / 60, y: 0.48 + hy / 60 });
      }
      return pts;
    })()],
  },
];

// ─── SHAPE LABEL helper (for Arabic translations) ───────────────────────────
const SHAPE_LABELS_AR = {
  Circle: 'دائرة', Square: 'مربع', Triangle: 'مثلث',
  Star: 'نجمة', Diamond: 'معين', Heart: 'قلب',
};

// ─── Draw dashed outline on canvas ──────────────────────────────────────────
function drawDashedPath(ctx, item, cw, ch) {
  // White background
  ctx.clearRect(0, 0, cw, ch);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, cw, ch);

  // Draw each stroke as dashed path
  item.strokes.forEach((stroke) => {
    if (stroke.length < 2) {
      // Single point = dot (for Arabic dots)
      stroke.forEach((pt) => {
        ctx.beginPath();
        ctx.arc(pt.x * cw, pt.y * ch, 5, 0, Math.PI * 2);
        ctx.fillStyle = '#ccc';
        ctx.fill();
      });
      return;
    }
    ctx.beginPath();
    ctx.strokeStyle = '#ccc';
    ctx.lineWidth = 4;
    ctx.setLineDash([12, 8]);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.moveTo(stroke[0].x * cw, stroke[0].y * ch);
    for (let i = 1; i < stroke.length; i++) {
      ctx.lineTo(stroke[i].x * cw, stroke[i].y * ch);
    }
    ctx.stroke();
    ctx.setLineDash([]);
  });

  // Draw start point (green circle) at first point of first stroke
  const firstStroke = item.strokes[0];
  if (firstStroke && firstStroke.length >= 1) {
    const start = firstStroke[0];
    const sx = start.x * cw;
    const sy = start.y * ch;

    ctx.beginPath();
    ctx.arc(sx, sy, 10, 0, Math.PI * 2);
    ctx.fillStyle = '#2a9d8f';
    ctx.fill();

    // Direction arrow near start
    if (firstStroke.length >= 2) {
      const next = firstStroke[Math.min(2, firstStroke.length - 1)];
      const nx = next.x * cw;
      const ny = next.y * ch;
      const dx = nx - sx;
      const dy = ny - sy;
      const len = Math.sqrt(dx * dx + dy * dy) || 1;
      const ux = dx / len;
      const uy = dy / len;
      const tipX = sx + ux * 22;
      const tipY = sy + uy * 22;
      const perpX = -uy;
      const perpY = ux;

      ctx.beginPath();
      ctx.moveTo(tipX, tipY);
      ctx.lineTo(tipX - ux * 10 + perpX * 5, tipY - uy * 10 + perpY * 5);
      ctx.lineTo(tipX - ux * 10 - perpX * 5, tipY - uy * 10 - perpY * 5);
      ctx.closePath();
      ctx.fillStyle = '#2a9d8f';
      ctx.fill();
    }
  }
}

// ─── Generate checkpoints from path data ────────────────────────────────────
function generateCheckpoints(item, cw, ch, spacing = 20) {
  const checkpoints = [];
  item.strokes.forEach((stroke) => {
    if (stroke.length < 2) {
      // Dot checkpoints
      stroke.forEach((pt) => {
        checkpoints.push({ x: pt.x * cw, y: pt.y * ch, covered: false });
      });
      return;
    }
    let accumulated = 0;
    checkpoints.push({ x: stroke[0].x * cw, y: stroke[0].y * ch, covered: false });
    for (let i = 1; i < stroke.length; i++) {
      const dx = (stroke[i].x - stroke[i - 1].x) * cw;
      const dy = (stroke[i].y - stroke[i - 1].y) * ch;
      const segLen = Math.sqrt(dx * dx + dy * dy);
      accumulated += segLen;
      if (accumulated >= spacing) {
        checkpoints.push({ x: stroke[i].x * cw, y: stroke[i].y * ch, covered: false });
        accumulated = 0;
      }
    }
    // Always add last point
    const last = stroke[stroke.length - 1];
    const lx = last.x * cw;
    const ly = last.y * ch;
    const lastCp = checkpoints[checkpoints.length - 1];
    if (!lastCp || Math.abs(lastCp.x - lx) > 2 || Math.abs(lastCp.y - ly) > 2) {
      checkpoints.push({ x: lx, y: ly, covered: false });
    }
  });
  return checkpoints;
}

// ══════════════════════════════════════════════════════════════════════════════
// TracingGame Component
// ══════════════════════════════════════════════════════════════════════════════
export default function TracingGame({ onBack, lang, t }) {
  const [mode, setMode] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [strokeColor, setStrokeColor] = useState(STROKE_COLORS[0]);
  const [progress, setProgress] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);

  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const drawingRef = useRef(false);
  const lastPointRef = useRef(null);
  const checkpointsRef = useRef([]);
  const pathImageRef = useRef(null);

  // ── Current items list based on mode + lang ─────────────────────────────
  const getItems = useCallback(() => {
    if (mode === 'letters') return lang === 'ar' ? ARABIC_LETTERS : ENGLISH_LETTERS;
    if (mode === 'numbers') return NUMBERS;
    if (mode === 'shapes') return SHAPES;
    return [];
  }, [mode, lang]);

  // ── Get display label for current item ──────────────────────────────────
  const getItemLabel = useCallback((item) => {
    if (!item) return '';
    if (mode === 'shapes' && lang === 'ar') return SHAPE_LABELS_AR[item.label] || item.label;
    return item.label;
  }, [mode, lang]);

  // ── Get type label ──────────────────────────────────────────────────────
  const getTypeLabel = useCallback(() => {
    if (mode === 'letters') return t.tracingLetter;
    if (mode === 'numbers') return t.tracingNumber;
    if (mode === 'shapes') return t.tracingShape;
    return '';
  }, [mode, t]);

  // ── Setup canvas + draw path ────────────────────────────────────────────
  const setupCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container || !mode) return;

    const items = getItems();
    if (items.length === 0) return;
    const item = items[currentIndex % items.length];

    const rect = container.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const cw = rect.width;
    const ch = Math.min(cw, window.innerHeight * 0.5);

    canvas.style.width = cw + 'px';
    canvas.style.height = ch + 'px';
    canvas.width = cw * dpr;
    canvas.height = ch * dpr;

    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);

    // Draw the dashed path template
    drawDashedPath(ctx, item, cw, ch);

    // Save the background image for redrawing user strokes on top
    pathImageRef.current = ctx.getImageData(0, 0, canvas.width, canvas.height);

    // Generate checkpoints
    checkpointsRef.current = generateCheckpoints(item, cw, ch);
  }, [mode, currentIndex, getItems]);

  // ── Resize handler ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!mode) return;

    setupCanvas();

    const container = containerRef.current;
    if (!container) return;

    let resizeObserver;
    try {
      resizeObserver = new ResizeObserver(() => {
        if (!completed) {
          setupCanvas();
          setProgress(0);
        }
      });
      resizeObserver.observe(container);
    } catch (_e) {
      // Fallback for browsers without ResizeObserver
      const handleResize = () => {
        if (!completed) {
          setupCanvas();
          setProgress(0);
        }
      };
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
    return () => { if (resizeObserver) resizeObserver.disconnect(); };
  }, [mode, currentIndex, setupCanvas, completed]);

  // ── Completion check ────────────────────────────────────────────────────
  useEffect(() => {
    if (progress >= 80 && !completed && mode) {
      setCompleted(true);
      setShowConfetti(true);
      playWinSound();
    }
  }, [progress, completed, mode]);

  // ── Pointer handlers ────────────────────────────────────────────────────
  const getCanvasPoint = useCallback((e) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  }, []);

  const handlePointerDown = useCallback((e) => {
    if (completed) return;
    e.preventDefault();
    drawingRef.current = true;
    const pt = getCanvasPoint(e);
    lastPointRef.current = pt;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const ctx = canvas.getContext('2d');
    ctx.save();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, 4, 0, Math.PI * 2);
    ctx.fillStyle = strokeColor;
    ctx.fill();
    ctx.restore();
  }, [completed, getCanvasPoint, strokeColor]);

  const handlePointerMove = useCallback((e) => {
    if (!drawingRef.current || completed) return;
    e.preventDefault();
    const pt = getCanvasPoint(e);
    if (!pt) return;
    const last = lastPointRef.current;
    if (!last) { lastPointRef.current = pt; return; }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const ctx = canvas.getContext('2d');
    ctx.save();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.beginPath();
    ctx.moveTo(last.x, last.y);
    ctx.lineTo(pt.x, pt.y);
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 8;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
    ctx.restore();
    lastPointRef.current = pt;

    // Check proximity to checkpoints
    const cps = checkpointsRef.current;
    let changed = false;
    for (let i = 0; i < cps.length; i++) {
      if (!cps[i].covered) {
        const dx = cps[i].x - pt.x;
        const dy = cps[i].y - pt.y;
        if (dx * dx + dy * dy < 35 * 35) {
          cps[i].covered = true;
          changed = true;
        }
      }
    }
    if (changed) {
      const coveredCount = cps.filter((c) => c.covered).length;
      const newProgress = cps.length > 0 ? Math.round((coveredCount / cps.length) * 100) : 0;
      setProgress(newProgress);
    }
  }, [completed, getCanvasPoint, strokeColor]);

  const handlePointerUp = useCallback((e) => {
    e.preventDefault();
    drawingRef.current = false;
    lastPointRef.current = null;
  }, []);

  // ── Clear canvas ──────────────────────────────────────────────────────
  const handleClear = useCallback(() => {
    playBoop();
    setProgress(0);
    checkpointsRef.current.forEach((cp) => { cp.covered = false; });
    setupCanvas();
  }, [setupCanvas]);

  // ── Next item ─────────────────────────────────────────────────────────
  const handleNext = useCallback(() => {
    playBoop();
    const items = getItems();
    setCurrentIndex((prev) => (prev + 1) % items.length);
    setCompleted(false);
    setShowConfetti(false);
    setProgress(0);
  }, [getItems]);

  // ── Back to category selection ────────────────────────────────────────
  const handleBackToMenu = useCallback(() => {
    playBoop();
    setMode(null);
    setCurrentIndex(0);
    setCompleted(false);
    setShowConfetti(false);
    setProgress(0);
  }, []);

  // ── Select mode ───────────────────────────────────────────────────────
  const handleSelectMode = useCallback((m) => {
    playBoop();
    setMode(m);
    setCurrentIndex(0);
    setCompleted(false);
    setShowConfetti(false);
    setProgress(0);
  }, []);

  // ══════════════════════════════════════════════════════════════════════
  // RENDER: Category Selection
  // ══════════════════════════════════════════════════════════════════════
  if (!mode) {
    return (
      <div className="game-screen animate-slide-up" style={{ textAlign: 'center', padding: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
        <h2 style={{ color: 'var(--lightning-yellow)', fontSize: '2rem', margin: 0 }}>
          {t.tracingGameTitle}
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%', maxWidth: '340px' }}>
          <button
            className="menu-btn"
            onClick={() => handleSelectMode('letters')}
            style={{
              background: 'var(--mcqueen-red)',
              color: 'white',
              borderBottom: '6px solid #b32631',
              fontSize: '1.3rem',
              padding: '1rem 1.5rem',
            }}
          >
            {t.tracingLetters}
          </button>
          <button
            className="menu-btn"
            onClick={() => handleSelectMode('numbers')}
            style={{
              background: 'var(--vibrant-blue)',
              color: 'white',
              borderBottom: '6px solid #2d5a7a',
              fontSize: '1.3rem',
              padding: '1rem 1.5rem',
            }}
          >
            {t.tracingNumbers}
          </button>
          <button
            className="menu-btn"
            onClick={() => handleSelectMode('shapes')}
            style={{
              background: '#2a9d8f',
              color: 'white',
              borderBottom: '6px solid #1e7066',
              fontSize: '1.3rem',
              padding: '1rem 1.5rem',
            }}
          >
            {t.tracingShapes}
          </button>
        </div>

        <button
          className="mode-btn"
          onClick={onBack}
          style={{ marginTop: '0.5rem', fontSize: '1rem', padding: '0.6rem 2rem' }}
        >
          {t.back}
        </button>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════
  // RENDER: Tracing Screen
  // ══════════════════════════════════════════════════════════════════════
  const items = getItems();
  const item = items[currentIndex % items.length];
  const totalCount = items.length;

  return (
    <div className="game-screen animate-slide-up" style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '0.5rem', gap: '0.5rem', position: 'relative', overflow: 'hidden' }}>
      {/* ── Header bar ─────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', padding: '0.25rem 0' }}>
        <button
          className="mode-btn"
          onClick={handleBackToMenu}
          style={{ fontSize: '0.85rem', padding: '0.3rem 0.8rem', flexShrink: 0 }}
        >
          {t.back}
        </button>

        <div style={{ flex: 1, textAlign: 'center', minWidth: 0 }}>
          <span style={{ color: 'white', fontSize: '1rem', fontWeight: 'bold' }}>
            {t.tracingTrace} {getTypeLabel()}{' '}
            <span style={{ color: 'var(--lightning-yellow)', fontSize: '1.3rem' }}>
              {getItemLabel(item)}
            </span>
          </span>
        </div>

        <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem', flexShrink: 0 }}>
          {currentIndex + 1} {t.tracingOf} {totalCount}
        </span>
      </div>

      {/* ── Progress bar ───────────────────────────────────────────── */}
      <div style={{ height: '8px', background: 'rgba(255,255,255,0.15)', borderRadius: '4px', overflow: 'hidden' }}>
        <div style={{
          height: '100%',
          width: progress + '%',
          background: strokeColor,
          borderRadius: '4px',
          transition: 'width 0.15s ease',
        }} />
      </div>

      {/* ── Canvas area ────────────────────────────────────────────── */}
      <div
        ref={containerRef}
        style={{
          flex: 1,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'flex-start',
          overflow: 'hidden',
          borderRadius: '12px',
          background: 'white',
          boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
          minHeight: 0,
        }}
      >
        <canvas
          ref={canvasRef}
          style={{
            touchAction: 'none',
            cursor: 'crosshair',
            display: 'block',
          }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
        />
      </div>

      {/* ── Bottom toolbar ─────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem', padding: '0.4rem 0', flexWrap: 'wrap' }}>
        {/* Color picker */}
        {STROKE_COLORS.map((color) => (
          <button
            key={color}
            onClick={() => setStrokeColor(color)}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: color,
              border: strokeColor === color ? '3px solid white' : '2px solid rgba(255,255,255,0.3)',
              transform: strokeColor === color ? 'scale(1.2)' : 'scale(1)',
              transition: 'all 0.15s ease',
              cursor: 'pointer',
              boxShadow: strokeColor === color ? '0 2px 8px rgba(0,0,0,0.3)' : 'none',
              padding: 0,
            }}
            aria-label={color}
          />
        ))}

        {/* Clear button */}
        <button
          className="mode-btn"
          onClick={handleClear}
          style={{ marginLeft: '0.5rem', fontSize: '0.85rem', padding: '0.35rem 1rem' }}
        >
          {t.tracingClear}
        </button>
      </div>

      {/* ── Completion overlay ─────────────────────────────────────── */}
      {completed && (
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(0,0,0,0.7)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 50,
          borderRadius: '12px',
          gap: '1rem',
        }}>
          {showConfetti && <Confetti onDone={() => setShowConfetti(false)} />}

          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--lightning-yellow)', textAlign: 'center' }}>
            {t.tracingComplete}
          </div>

          <div style={{ fontSize: '1.2rem', color: 'white', textAlign: 'center' }}>
            {renderPersonalizedText(t.kaChow, lang)}
          </div>

          <div style={{ fontSize: '2.5rem' }}>
            {'\u2B50\u2B50\u2B50'}
          </div>

          <button
            className="menu-btn"
            onClick={handleNext}
            style={{
              background: 'var(--lightning-yellow)',
              color: 'var(--pavement-grey)',
              borderBottom: '6px solid #cc9202',
              fontSize: '1.3rem',
              padding: '0.8rem 2.5rem',
            }}
          >
            {t.tracingNext}
          </button>
        </div>
      )}
    </div>
  );
}
