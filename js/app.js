/* ============================================
   app.js — Photobooth Main Logic
   ============================================ */

'use strict';

/* ---- State ---- */
const state = {
  stream: null,
  facingMode: 'user',
  mirrored: true,
  currentFilter: 'none',
  currentFrame: 'none',
  currentLayout: '1x1',
  timerSeconds: 5,
  isCounting: false,
  isCapturing: false,
  captureQueue: [],     // for multi-shot layouts
  gallery: [],          // session gallery data URLs
  frameAnimId: null,
};

/* ---- DOM Refs ---- */
const video         = document.getElementById('video');
const frameOverlay  = document.getElementById('frameOverlay');
const countdownEl   = document.getElementById('countdown');
const flashEl       = document.getElementById('flash');
const placeholder   = document.getElementById('cameraPlaceholder');
const captureBtn    = document.getElementById('captureBtn');
const switchBtn     = document.getElementById('switchCameraBtn');
const mirrorBtn     = document.getElementById('mirrorBtn');
const startCameraBtn= document.getElementById('startCameraBtn');
const resultPanel   = document.getElementById('resultPanel');
const resultCanvas  = document.getElementById('resultCanvas');
const downloadBtn   = document.getElementById('downloadBtn');
const retakeBtn     = document.getElementById('retakeBtn');
const addToGalleryBtn=document.getElementById('addToGalleryBtn');
const galleryWrapper= document.getElementById('galleryWrapper');
const galleryEl     = document.getElementById('gallery');
const downloadAllBtn= document.getElementById('downloadAllBtn');
const clearGalleryBtn=document.getElementById('clearGalleryBtn');
const resultMeta    = document.getElementById('resultMeta');
const compositeCanvas=document.getElementById('compositeCanvas');
const cameraWrapper = document.getElementById('cameraWrapper');

/* ---- Layout config ---- */
const LAYOUTS = {
  '1x1':   { shots: 1, cols: 1, rows: 1, gap: 0, padding: 0 },
  '2x2':   { shots: 4, cols: 2, rows: 2, gap: 12, padding: 20 },
  'strip': { shots: 3, cols: 1, rows: 3, gap: 10, padding: 16 },
};

/* ================================================
   CAMERA
   ================================================ */
async function startCamera(facingMode = 'user') {
  try {
    if (state.stream) {
      state.stream.getTracks().forEach(t => t.stop());
    }
    const constraints = {
      video: {
        facingMode,
        width: { ideal: 1280 },
        height: { ideal: 960 },
      },
      audio: false,
    };
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    state.stream = stream;
    state.facingMode = facingMode;
    video.srcObject = stream;
    await video.play();

    placeholder.style.display = 'none';
    video.style.display = 'block';
    captureBtn.disabled = false;

    // Start frame overlay loop
    startFrameOverlay();
  } catch (err) {
    alert('Tidak bisa mengakses kamera: ' + err.message +
          '\nPastikan izin kamera sudah diberikan.');
  }
}

startCameraBtn.addEventListener('click', () => startCamera(state.facingMode));

switchBtn.addEventListener('click', async () => {
  if (!state.stream) return;
  const next = state.facingMode === 'user' ? 'environment' : 'user';
  await startCamera(next);
});

mirrorBtn.addEventListener('click', () => {
  state.mirrored = !state.mirrored;
  cameraWrapper.classList.toggle('mirrored', state.mirrored);
});

/* ---- Frame overlay on live preview ---- */
function startFrameOverlay() {
  if (state.frameAnimId) cancelAnimationFrame(state.frameAnimId);

  function drawLoop() {
    const vw = video.videoWidth;
    const vh = video.videoHeight;
    if (vw > 0 && vh > 0) {
      frameOverlay.width = frameOverlay.clientWidth;
      frameOverlay.height = frameOverlay.clientHeight;
      const ctx = frameOverlay.getContext('2d');
      ctx.clearRect(0, 0, frameOverlay.width, frameOverlay.height);
      if (state.currentFrame !== 'none') {
        FrameRenderers[state.currentFrame]?.(ctx, frameOverlay.width, frameOverlay.height);
      }
    }
    state.frameAnimId = requestAnimationFrame(drawLoop);
  }
  drawLoop();
}

/* Apply CSS filter to video live preview */
function applyVideoFilter() {
  video.style.filter = state.currentFilter;
}

/* ================================================
   PICKER INTERACTIONS
   ================================================ */
function setupPicker(containerId, dataAttr, callback) {
  const container = document.getElementById(containerId);
  container.addEventListener('click', e => {
    const btn = e.target.closest(`[${dataAttr}]`);
    if (!btn) return;
    container.querySelectorAll('.active').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    callback(btn.getAttribute(dataAttr));
  });
}

setupPicker('filterPicker', 'data-filter', val => {
  state.currentFilter = val;
  applyVideoFilter();
});

setupPicker('framePicker', 'data-frame', val => {
  state.currentFrame = val;
});

setupPicker('layoutPicker', 'data-layout', val => {
  state.currentLayout = val;
});

setupPicker('timerPicker', 'data-timer', val => {
  state.timerSeconds = parseInt(val);
});

/* ================================================
   COUNTDOWN + CAPTURE
   ================================================ */
captureBtn.addEventListener('click', () => {
  if (state.isCounting || state.isCapturing) return;
  startCapture();
});

async function startCapture() {
  const layout = LAYOUTS[state.currentLayout];
  state.captureQueue = [];
  state.isCapturing = true;
  captureBtn.disabled = true;

  for (let i = 0; i < layout.shots; i++) {
    if (layout.shots > 1) {
      // Small pause between shots
      if (i > 0) await sleep(800);
    }
    await runCountdown(state.timerSeconds);
    const dataUrl = captureFrame();
    state.captureQueue.push(dataUrl);
  }

  state.isCapturing = false;
  captureBtn.disabled = false;
  await buildResult(state.captureQueue);
}

function runCountdown(seconds) {
  return new Promise(resolve => {
    state.isCounting = true;
    countdownEl.classList.add('visible');
    let n = seconds;

    const tick = setInterval(() => {
      countdownEl.textContent = n;
      if (n <= 0) {
        clearInterval(tick);
        countdownEl.classList.remove('visible');
        countdownEl.textContent = '';
        state.isCounting = false;
        resolve();
      }
      n--;
    }, 1000);
    countdownEl.textContent = n;
    n--;
  });
}

function captureFrame() {
  // Flash effect
  flashEl.classList.add('flash');
  setTimeout(() => flashEl.classList.remove('flash'), 150);

  // Play shutter sound (optional, no server needed)
  playShutter();

  const vw = video.videoWidth;
  const vh = video.videoHeight;
  compositeCanvas.width = vw;
  compositeCanvas.height = vh;
  const ctx = compositeCanvas.getContext('2d');

  // Apply filter
  ctx.filter = state.currentFilter;

  // Mirror if needed
  if (state.mirrored) {
    ctx.save();
    ctx.translate(vw, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, vw, vh);
    ctx.restore();
  } else {
    ctx.drawImage(video, 0, 0, vw, vh);
  }

  // Reset filter before drawing frame
  ctx.filter = 'none';

  // Draw frame on top
  if (state.currentFrame !== 'none') {
    FrameRenderers[state.currentFrame]?.(ctx, vw, vh);
  }

  return compositeCanvas.toDataURL('image/png');
}

/* ================================================
   BUILD FINAL RESULT
   ================================================ */
async function buildResult(shots) {
  const layout = LAYOUTS[state.currentLayout];
  const firstImg = await loadImage(shots[0]);
  const shotW = firstImg.width;
  const shotH = firstImg.height;

  const { cols, rows, gap, padding } = layout;
  const canvasW = cols * shotW + (cols - 1) * gap + padding * 2;
  const canvasH = rows * shotH + (rows - 1) * gap + padding * 2;

  resultCanvas.width = canvasW;
  resultCanvas.height = canvasH;
  const ctx = resultCanvas.getContext('2d');

  // Background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvasW, canvasH);

  // Draw shots
  for (let i = 0; i < shots.length; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = padding + col * (shotW + gap);
    const y = padding + row * (shotH + gap);
    const img = await loadImage(shots[i]);
    ctx.drawImage(img, x, y, shotW, shotH);
  }

  // Strip: add date/watermark at bottom
  if (state.currentLayout === 'strip') {
    const now = new Date();
    const dateStr = now.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
    ctx.font = `${Math.round(canvasW * 0.025)}px Poppins, sans-serif`;
    ctx.fillStyle = '#999';
    ctx.textAlign = 'center';
    ctx.fillText('📸 photobooth  •  ' + dateStr, canvasW / 2, canvasH - padding * 0.3);
  }

  showResultPanel(resultCanvas.toDataURL('image/png'));
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/* ================================================
   RESULT PANEL
   ================================================ */
function showResultPanel(dataUrl) {
  resultPanel.style.display = 'block';
  resultPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });

  const now = new Date();
  resultMeta.textContent = now.toLocaleString('id-ID') + '  •  ' + state.currentLayout + '  •  ' + state.currentFrame;
  downloadBtn.onclick = () => downloadImage(dataUrl, 'photobooth-' + Date.now() + '.png');
  addToGalleryBtn.onclick = () => addToGallery(dataUrl);
}

retakeBtn.addEventListener('click', () => {
  resultPanel.style.display = 'none';
});

function downloadImage(dataUrl, filename) {
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = filename;
  a.click();
}

/* ================================================
   SESSION GALLERY
   ================================================ */
function addToGallery(dataUrl) {
  state.gallery.push(dataUrl);
  renderGallery();
  galleryWrapper.style.display = 'block';
  addToGalleryBtn.textContent = '✓ tersimpan';
  setTimeout(() => addToGalleryBtn.textContent = '+ simpan ke galeri', 1500);
}

function renderGallery() {
  galleryEl.innerHTML = '';
  state.gallery.forEach((url, idx) => {
    const item = document.createElement('div');
    item.className = 'gallery-item';

    const img = document.createElement('img');
    img.src = url;
    img.alt = 'foto ' + (idx + 1);
    img.addEventListener('click', () => downloadImage(url, 'photobooth-' + (idx + 1) + '.png'));

    const del = document.createElement('button');
    del.className = 'gallery-del';
    del.textContent = '✕';
    del.addEventListener('click', e => {
      e.stopPropagation();
      state.gallery.splice(idx, 1);
      renderGallery();
      if (state.gallery.length === 0) galleryWrapper.style.display = 'none';
    });

    item.appendChild(img);
    item.appendChild(del);
    galleryEl.appendChild(item);
  });
}

downloadAllBtn.addEventListener('click', async () => {
  if (state.gallery.length === 0) return;
  for (let i = 0; i < state.gallery.length; i++) {
    await sleep(200 * i);
    downloadImage(state.gallery[i], 'photobooth-' + (i + 1) + '.png');
  }
});

clearGalleryBtn.addEventListener('click', () => {
  if (confirm('Hapus semua foto dari galeri sesi ini?')) {
    state.gallery = [];
    renderGallery();
    galleryWrapper.style.display = 'none';
  }
});

/* ================================================
   SOUND
   ================================================ */
function playShutter() {
  try {
    const ctx = new AudioContext();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    oscillator.frequency.setValueAtTime(880, ctx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.1);
    gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
    oscillator.start();
    oscillator.stop(ctx.currentTime + 0.15);
  } catch (e) { /* silent fail */ }
}

/* ================================================
   UTILS
   ================================================ */
function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

/* ================================================
   INIT
   ================================================ */
// Auto-mirror for front camera
cameraWrapper.classList.add('mirrored');

// Resize frame overlay on window resize
window.addEventListener('resize', () => {
  if (state.stream) startFrameOverlay();
});
