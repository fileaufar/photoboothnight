/* ============================================
   frames.js — Canvas frame renderers
   Each function draws a frame onto a given
   CanvasRenderingContext2D at the specified size.
   To add your own custom frame, follow the
   template at the bottom of this file.
   ============================================ */

const FrameRenderers = {

  none: (ctx, w, h) => {
    // No frame drawn
  },

  classic: (ctx, w, h) => {
    const bw = Math.round(w * 0.04);
    // Outer white border
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = bw * 2;
    ctx.strokeRect(0, 0, w, h);
    // Inner thin grey line
    ctx.strokeStyle = '#cccccc';
    ctx.lineWidth = Math.max(2, bw * 0.4);
    ctx.strokeRect(bw, bw, w - bw * 2, h - bw * 2);
  },

  polaroid: (ctx, w, h) => {
    const pad = Math.round(w * 0.06);
    const bottom = Math.round(h * 0.18);
    // White background fill for border area
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, w, pad); // top
    ctx.fillRect(0, 0, pad, h); // left
    ctx.fillRect(w - pad, 0, pad, h); // right
    ctx.fillRect(0, h - bottom, w, bottom); // bottom (bigger)
    // Subtle shadow line inside
    ctx.strokeStyle = '#e8e8e8';
    ctx.lineWidth = 1;
    ctx.strokeRect(pad, pad, w - pad * 2, h - pad - bottom);
  },

  floral: (ctx, w, h) => {
    const bw = Math.round(w * 0.05);
    // Gradient border
    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, 'rgba(255,182,193,0.85)');
    grad.addColorStop(0.3, 'rgba(255,105,180,0.85)');
    grad.addColorStop(0.7, 'rgba(221,160,221,0.85)');
    grad.addColorStop(1, 'rgba(135,206,250,0.85)');
    ctx.strokeStyle = grad;
    ctx.lineWidth = bw * 2;
    ctx.strokeRect(0, 0, w, h);

    // Flower emojis at corners
    const flowers = ['🌸', '🌺', '🌼', '🌷'];
    const size = Math.round(w * 0.08);
    ctx.font = `${size}px serif`;
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';
    const off = size * 0.7;
    ctx.fillText(flowers[0], off, off);
    ctx.fillText(flowers[1], w - off, off);
    ctx.fillText(flowers[2], off, h - off);
    ctx.fillText(flowers[3], w - off, h - off);
  },

  retro: (ctx, w, h) => {
    const bw = Math.round(w * 0.05);
    // Outer orange
    ctx.fillStyle = '#ff9f43';
    ctx.fillRect(0, 0, w, bw);
    ctx.fillRect(0, h - bw, w, bw);
    ctx.fillRect(0, 0, bw, h);
    ctx.fillRect(w - bw, 0, bw, h);
    // Inner red line
    ctx.strokeStyle = '#c0392b';
    ctx.lineWidth = Math.max(2, bw * 0.4);
    ctx.strokeRect(bw, bw, w - bw * 2, h - bw * 2);
    // Corner squares
    ctx.fillStyle = '#c0392b';
    const cs = bw;
    ctx.fillRect(0, 0, cs, cs);
    ctx.fillRect(w - cs, 0, cs, cs);
    ctx.fillRect(0, h - cs, cs, cs);
    ctx.fillRect(w - cs, h - cs, cs, cs);
  },

  birthday: (ctx, w, h) => {
    const bw = Math.round(w * 0.055);
    // Colorful confetti border
    const colors = ['#f9ca24', '#f0932b', '#6ab04c', '#e056fd', '#22a6b3', '#ff7979'];
    const segCount = 30;
    const perim = 2 * (w + h);
    const segLen = perim / segCount;
    let traveled = 0;
    ctx.lineWidth = bw * 2;
    ctx.lineCap = 'round';

    for (let i = 0; i < segCount; i++) {
      ctx.strokeStyle = colors[i % colors.length];
      ctx.beginPath();
      const startPt = getPerimPoint(traveled, w, h);
      const endPt = getPerimPoint(traveled + segLen * 0.85, w, h);
      ctx.moveTo(startPt.x, startPt.y);
      ctx.lineTo(endPt.x, endPt.y);
      ctx.stroke();
      traveled += segLen;
    }

    // Balloons in top corners
    const balloonSize = Math.round(w * 0.06);
    ctx.font = `${balloonSize}px serif`;
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';
    ctx.fillText('🎈', balloonSize, balloonSize);
    ctx.fillText('🎈', w - balloonSize, balloonSize);
    ctx.fillText('🎉', balloonSize, h - balloonSize);
    ctx.fillText('🎂', w - balloonSize, h - balloonSize);
  },
};

/* Helper: get a point along the perimeter of a rect */
function getPerimPoint(dist, w, h) {
  const perim = 2 * (w + h);
  dist = ((dist % perim) + perim) % perim;
  if (dist < w) return { x: dist, y: 0 };
  dist -= w;
  if (dist < h) return { x: w, y: dist };
  dist -= h;
  if (dist < w) return { x: w - dist, y: h };
  dist -= w;
  return { x: 0, y: h - dist };
}

/* ============================================
   HOW TO ADD YOUR OWN CUSTOM FRAME:
   
   1. Add a new key to FrameRenderers above:
   
   myCustomFrame: (ctx, w, h) => {
     // use ctx.fillStyle, ctx.strokeStyle etc.
     // w = canvas width, h = canvas height
   },
   
   2. Add a button in index.html:
   <button class="frame-btn" data-frame="myCustomFrame">
     <div class="frame-thumb" style="background: ...;"></div>
     <span>my frame</span>
   </button>
   
   3. Push to GitHub → Vercel auto-deploys!
   ============================================ */
