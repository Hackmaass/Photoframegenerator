/**
 * HH Goa 2026 — Main Application Controller
 * Manages state, file uploads, UI transitions, and user interactions
 */

import { generateFrame, generateCard, downloadCanvas } from './generator.js';
import { generateTitle, generateRandomTitle } from './titles.js';

// ============================================================
// STATE
// ============================================================

const state = {
  mode: 'frame', // 'frame' | 'card'
  phase: 'upload', // 'upload' | 'generating' | 'ready'
  image: null, // HTMLImageElement
  name: '',
  stack: '',
  role: '',
  title: '',
  isDownloaded: false,
};

// ============================================================
// DOM REFS
// ============================================================

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

let els = {};

function cacheElements() {
  els = {
    uploadSection: $('#uploadSection'),
    uploadZone: $('#uploadZone'),
    uploadInput: $('#uploadInput'),
    uploadProgress: $('#uploadProgress'),
    progressBar: $('#progressBar'),
    progressText: $('#progressText'),
    errorCard: $('#errorCard'),
    errorMessage: $('#errorMessage'),
    generator: $('#generator'),
    previewWrapper: $('#previewWrapper'),
    previewCanvas: $('#previewCanvas'),
    previewLabel: $('#previewLabel'),
    modeFrame: $('#modeFrame'),
    modeCard: $('#modeCard'),
    inputName: $('#inputName'),
    inputStack: $('#inputStack'),
    inputRole: $('#inputRole'),
    cardOnlyFields: $('#cardOnlyFields'),
    titleValue: $('#titleValue'),
    titleShuffle: $('#titleShuffle'),
    btnDownload: $('#btnDownload'),
    btnDownloadText: $('#btnDownloadText'),
    btnShare: $('#btnShare'),
    btnChangePhoto: $('#btnChangePhoto'),
    changePhotoInput: $('#changePhotoInput'),
  };
}

// ============================================================
// INIT
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
  cacheElements();
  bindEvents();
  // Generate an initial title
  state.title = generateRandomTitle();
  els.titleValue.textContent = state.title;
});

// ============================================================
// EVENT BINDINGS
// ============================================================

function bindEvents() {
  // Upload zone interactions
  els.uploadZone.addEventListener('click', () => els.uploadInput.click());
  els.uploadZone.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      els.uploadInput.click();
    }
  });
  els.uploadInput.addEventListener('change', handleFileSelect);
  
  // Drag and drop
  els.uploadZone.addEventListener('dragover', handleDragOver);
  els.uploadZone.addEventListener('dragleave', handleDragLeave);
  els.uploadZone.addEventListener('drop', handleDrop);
  
  // Prevent default drag behaviors on body
  ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(evt => {
    document.body.addEventListener(evt, (e) => {
      e.preventDefault();
    });
  });
  
  // Mode toggle
  els.modeFrame.addEventListener('click', () => setMode('frame'));
  els.modeCard.addEventListener('click', () => setMode('card'));
  
  // Input changes (live preview)
  els.inputName.addEventListener('input', debounce(handleInputChange, 200));
  els.inputStack.addEventListener('input', debounce(handleInputChange, 200));
  els.inputRole.addEventListener('input', debounce(handleInputChange, 200));
  
  // Title shuffle
  els.titleShuffle.addEventListener('click', handleShuffleTitle);
  
  // Actions
  els.btnDownload.addEventListener('click', handleDownload);
  els.btnShare.addEventListener('click', handleShare);
  
  // Change photo
  els.btnChangePhoto.addEventListener('click', () => els.changePhotoInput.click());
  els.changePhotoInput.addEventListener('change', handleFileSelect);
  
  // Error retry
  const retryBtn = $('#btnRetry');
  if (retryBtn) {
    retryBtn.addEventListener('click', handleRetry);
  }
}

// ============================================================
// FILE HANDLING
// ============================================================

function handleDragOver(e) {
  e.preventDefault();
  e.stopPropagation();
  els.uploadZone.classList.add('drag-over');
}

function handleDragLeave(e) {
  e.preventDefault();
  e.stopPropagation();
  els.uploadZone.classList.remove('drag-over');
}

function handleDrop(e) {
  e.preventDefault();
  e.stopPropagation();
  els.uploadZone.classList.remove('drag-over');
  
  const files = e.dataTransfer.files;
  if (files.length > 0) {
    processFile(files[0]);
  }
}

function handleFileSelect(e) {
  const files = e.target.files;
  if (files.length > 0) {
    processFile(files[0]);
  }
  // Reset input so same file can be re-selected
  e.target.value = '';
}

async function processFile(file) {
  // Validate file type
  const validTypes = ['image/jpeg', 'image/png', 'image/heic', 'image/heif', 'image/webp'];
  const ext = file.name.toLowerCase().split('.').pop();
  const isHEIC = ext === 'heic' || ext === 'heif' || file.type === 'image/heic' || file.type === 'image/heif';
  
  if (!validTypes.includes(file.type) && !isHEIC) {
    showError('Unsupported file format. Please upload a JPG, PNG, or HEIC image.');
    return;
  }
  
  // Validate file size (max 25MB)
  if (file.size > 25 * 1024 * 1024) {
    showError('Image is too large. Please upload an image under 25MB.');
    return;
  }
  
  // Show progress
  showProgress();
  
  try {
    let imageFile = file;
    
    // Handle HEIC conversion
    if (isHEIC) {
      updateProgress(10, 'Converting HEIC...');
      try {
        if (typeof heic2any !== 'undefined') {
          const blob = await heic2any({ blob: file, toType: 'image/png', quality: 0.95 });
          imageFile = Array.isArray(blob) ? blob[0] : blob;
        } else {
          // Try loading directly (Safari supports HEIC natively)
          imageFile = file;
        }
      } catch {
        showError('Could not convert HEIC image. Please convert to JPG or PNG and try again.');
        return;
      }
    }
    
    updateProgress(40, 'Loading image...');
    
    // Load as image element
    const img = await loadImageFromFile(imageFile);
    
    updateProgress(80, 'Preparing...');
    
    state.image = img;
    
    updateProgress(100, 'Ready!');
    
    // Small delay for satisfying animation
    await new Promise(r => setTimeout(r, 300));
    
    // Transition to generator
    showGenerator();
    
  } catch (err) {
    console.error('Image load error:', err);
    showError('Failed to load image. Please try a different file.');
  }
}

function loadImageFromFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Image decode failed'));
      img.src = e.target.result;
    };
    reader.onerror = () => reject(new Error('File read failed'));
    reader.readAsDataURL(file);
  });
}

// ============================================================
// UI STATE TRANSITIONS
// ============================================================

function showProgress() {
  els.uploadSection.style.display = 'none';
  els.errorCard.classList.remove('active');
  els.uploadProgress.classList.add('active');
  els.generator.classList.remove('active');
  state.phase = 'generating';
}

function updateProgress(percent, text) {
  els.progressBar.style.width = percent + '%';
  if (text) els.progressText.textContent = text;
}

function showGenerator() {
  els.uploadSection.style.display = 'none';
  els.uploadProgress.classList.remove('active');
  els.errorCard.classList.remove('active');
  els.generator.classList.add('active');
  state.phase = 'ready';
  state.isDownloaded = false;
  
  // Reset download button
  els.btnDownload.classList.remove('downloaded');
  els.btnDownloadText.textContent = 'Download PNG';
  
  // Render preview
  renderPreview();
}

function showError(message) {
  els.uploadSection.style.display = 'none';
  els.uploadProgress.classList.remove('active');
  els.generator.classList.remove('active');
  els.errorMessage.textContent = message;
  els.errorCard.classList.add('active');
}

function handleRetry() {
  els.errorCard.classList.remove('active');
  els.uploadSection.style.display = 'block';
  els.uploadSection.style.animation = 'fadeInUp 0.3s var(--ease-out) both';
  state.phase = 'upload';
}

// ============================================================
// MODE & INPUT HANDLING
// ============================================================

function setMode(mode) {
  state.mode = mode;
  
  // Update toggle buttons
  els.modeFrame.classList.toggle('active', mode === 'frame');
  els.modeCard.classList.toggle('active', mode === 'card');
  
  // Show/hide card-only fields
  els.cardOnlyFields.classList.toggle('visible', mode === 'card');
  
  // Update preview aspect ratio
  els.previewWrapper.classList.toggle('card-mode', mode === 'card');
  
  // Update label
  els.previewLabel.textContent = mode === 'frame' ? 'LIVE PREVIEW · 1080×1080' : 'LIVE PREVIEW · 1080×1350';
  
  // Re-render
  if (state.image) {
    state.isDownloaded = false;
    els.btnDownload.classList.remove('downloaded');
    els.btnDownloadText.textContent = 'Download PNG';
    renderPreview();
  }
}

function handleInputChange() {
  state.name = els.inputName.value;
  state.stack = els.inputStack.value;
  state.role = els.inputRole.value;
  
  // Auto-generate title based on name
  if (state.name.length > 0) {
    state.title = generateTitle(state.name);
    els.titleValue.textContent = state.title;
  }
  
  state.isDownloaded = false;
  els.btnDownload.classList.remove('downloaded');
  els.btnDownloadText.textContent = 'Download PNG';
  
  if (state.image) {
    renderPreview();
  }
}

function handleShuffleTitle() {
  state.title = generateRandomTitle();
  els.titleValue.textContent = state.title;
  
  // Animate the title
  els.titleValue.style.animation = 'none';
  els.titleValue.offsetHeight; // Force reflow
  els.titleValue.style.animation = 'fadeIn 0.2s ease-out';
  
  if (state.image) {
    renderPreview();
  }
}

// ============================================================
// RENDERING
// ============================================================

async function renderPreview() {
  const canvas = els.previewCanvas;
  const opts = {
    name: state.name,
    stack: state.stack,
    role: state.role,
    title: state.title,
  };
  
  try {
    if (state.mode === 'frame') {
      await generateFrame(canvas, state.image, opts);
    } else {
      await generateCard(canvas, state.image, opts);
    }
  } catch (err) {
    console.error('Render error:', err);
  }
}

// ============================================================
// ACTIONS
// ============================================================

function handleDownload() {
  if (!state.image) return;
  
  const canvas = els.previewCanvas;
  const filename = state.mode === 'frame' 
    ? `hh-goa-2026-frame${state.name ? '-' + state.name.toLowerCase().replace(/\s+/g, '-') : ''}.png`
    : `hh-goa-2026-builder-id${state.name ? '-' + state.name.toLowerCase().replace(/\s+/g, '-') : ''}.png`;
  
  downloadCanvas(canvas, filename);
  
  // Update button state
  state.isDownloaded = true;
  els.btnDownload.classList.add('downloaded');
  els.btnDownloadText.textContent = 'Downloaded ✓';
  
  // Pulse animation
  els.btnDownload.style.animation = 'successPulse 0.6s ease-out';
  setTimeout(() => {
    els.btnDownload.style.animation = '';
  }, 600);
}

function handleShare() {
  const name = state.name || 'Builder';
  const title = state.title || '';
  
  const captions = [
    `Just minted my HH Goa 2026 Builder ID 🏗️🌴\n\n${title ? `Builder Class: ${title}\n\n` : ''}See you on the sand.\n\n#FrameInGoa #HackerHouseGoa`,
    `Locked in for HH Goa 2026 🔥\n\n${title ? `They call me the "${title}" 😤\n\n` : ''}28-31 Oct · Goa, India\n\n#FrameInGoa #HackerHouseGoa`,
    `Builder mode: ACTIVATED 🚀\n\nHeading to Goa for Hacker House 2026.\n${title ? `\nBuilder Class: ${title} ⚡\n` : ''}\n#FrameInGoa #HackerHouseGoa`,
    `My HH Goa 2026 Builder Frame is ready 🌊\n\n${title ? `"${title}" reporting for duty.\n\n` : ''}Less noise. More signal.\n\n#FrameInGoa #HackerHouseGoa`,
  ];
  
  const caption = captions[Math.floor(Math.random() * captions.length)];
  const tweetUrl = `https://x.com/intent/tweet?text=${encodeURIComponent(caption)}`;
  
  window.open(tweetUrl, '_blank', 'noopener,noreferrer');
}

// ============================================================
// UTILITIES
// ============================================================

function debounce(fn, delay) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

// ============================================================
// SCROLL REVEAL (IntersectionObserver)
// ============================================================

function initScrollReveal() {
  const targets = document.querySelectorAll('.reveal-on-scroll');
  if (!targets.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          observer.unobserve(entry.target); // animate once
        }
      });
    },
    { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
  );

  targets.forEach((el) => observer.observe(el));
}

// Fire after DOM ready (scroll reveal is independent of the generator)
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initScrollReveal);
} else {
  initScrollReveal();
}
