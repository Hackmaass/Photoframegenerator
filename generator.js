/**
 * HH Goa 2026 — Canvas Rendering Engine
 * Generates Profile Frames and Builder ID Cards
 */

/**
 * Load a font and wait for it to be ready
 */
async function ensureFontsLoaded() {
  try {
    await document.fonts.ready;
    // Force-load the specific weights we need
    await Promise.all([
      document.fonts.load('700 48px "Imbue"'),
      document.fonts.load('600 16px "Victor Mono"'),
      document.fonts.load('500 24px "Imbue"'),
    ]);
  } catch (e) {
    // Fallback: wait a bit for fonts to load
    await new Promise(r => setTimeout(r, 500));
  }
}

/**
 * Load image from URL
 */
function loadImageFromUrl(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    // Use anonymous crossOrigin if loading from external, but local is fine here
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load image: ' + src));
    img.src = src;
  });
}

/**
 * Draw rounded rectangle
 */
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

/**
 * Draw circular image with optional border
 */
function drawCircularImage(ctx, img, x, y, radius, borderWidth, borderColor, dashPattern) {
  ctx.save();
  
  // Draw border
  if (borderWidth > 0) {
    ctx.beginPath();
    ctx.arc(x, y, radius + borderWidth, 0, Math.PI * 2);
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = borderWidth;
    if (dashPattern) {
      ctx.setLineDash(dashPattern);
    }
    ctx.stroke();
    ctx.setLineDash([]);
  }
  
  // Clip and draw image
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();
  
  // Smart crop: center the image
  const imgAspect = img.width / img.height;
  let sx, sy, sw, sh;
  if (imgAspect > 1) {
    sh = img.height;
    sw = img.height;
    sx = (img.width - sw) / 2;
    sy = 0;
  } else {
    sw = img.width;
    sh = img.width;
    sx = 0;
    sy = (img.height - sh) / 2;
  }
  
  ctx.drawImage(img, sx, sy, sw, sh, x - radius, y - radius, radius * 2, radius * 2);
  ctx.restore();
}

/**
 * Draw stamp-tooth pattern (top or bottom)
 */
function drawStampPattern(ctx, x, y, width, toothSize, color) {
  ctx.save();
  ctx.fillStyle = color;
  const count = Math.ceil(width / (toothSize * 2));
  for (let i = 0; i < count; i++) {
    const tx = x + i * toothSize * 2;
    ctx.beginPath();
    ctx.arc(tx + toothSize, y, toothSize * 0.5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

/**
 * Draw text with max width (truncate with ellipsis)
 */
function drawTruncatedText(ctx, text, x, y, maxWidth) {
  let measured = ctx.measureText(text);
  if (measured.width <= maxWidth) {
    ctx.fillText(text, x, y);
    return;
  }
  let truncated = text;
  while (truncated.length > 0 && ctx.measureText(truncated + '…').width > maxWidth) {
    truncated = truncated.slice(0, -1);
  }
  ctx.fillText(truncated + '…', x, y);
}

/**
 * Draw decorative corner elements
 */
function drawCornerAccents(ctx, w, h, color, size) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  const s = size;
  
  // Top-left
  ctx.beginPath();
  ctx.moveTo(s, 0); ctx.lineTo(0, 0); ctx.lineTo(0, s);
  ctx.stroke();
  
  // Top-right
  ctx.beginPath();
  ctx.moveTo(w - s, 0); ctx.lineTo(w, 0); ctx.lineTo(w, s);
  ctx.stroke();
  
  // Bottom-left
  ctx.beginPath();
  ctx.moveTo(s, h); ctx.lineTo(0, h); ctx.lineTo(0, h - s);
  ctx.stroke();
  
  // Bottom-right
  ctx.beginPath();
  ctx.moveTo(w - s, h); ctx.lineTo(w, h); ctx.lineTo(w, h - s);
  ctx.stroke();
  
  ctx.restore();
}

// ============================================================
// PROFILE FRAME GENERATOR
// ============================================================

/**
 * Generate a profile frame overlay
 * @param {HTMLCanvasElement} canvas 
 * @param {HTMLImageElement} img - Uploaded photo
 * @param {Object} opts - { name }
 */
export async function generateFrame(canvas, img, opts = {}) {
  await ensureFontsLoaded();
  
  const SIZE = 1080;
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext('2d');
  
  const theme = opts.theme || 'formal';
  let templatePath = '';
  if (theme === 'formal') {
    templatePath = 'assets/Profile/2.png';
  } else if (theme === 'goa') {
    templatePath = 'assets/Profile/4.png';
  }
  
  let templateImg = null;
  try {
    if (templatePath) {
      templateImg = await loadImageFromUrl(templatePath);
    }
  } catch (e) {
    console.warn('Could not load profile template:', e);
  }
  
  // Colors
  const GREEN = '#0B6839';
  const YELLOW = '#FEE101';
  const PINK = '#FF0080';
  const WHITE = '#FFFFFF';
  const OFFWHITE = '#FFFBE8';
  
  // --- Draw Photo (smart crop to square) ---
  const imgAspect = img.width / img.height;
  let sx, sy, sw, sh;
  if (imgAspect > 1) {
    sh = img.height;
    sw = img.height;
    sx = (img.width - sw) / 2;
    sy = 0;
  } else {
    sw = img.width;
    sh = img.width;
    sx = 0;
    sy = (img.height - sh) / 2;
  }
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, SIZE, SIZE);
  
  // --- Frame Border ---
  const BORDER = 40;
  
  // Outer frame (green with transparency)
  ctx.save();
  ctx.globalCompositeOperation = 'source-over';
  
  // Top strip
  ctx.fillStyle = GREEN;
  ctx.globalAlpha = 0.92;
  ctx.fillRect(0, 0, SIZE, BORDER);
  
  // Bottom strip (thicker for text)
  const BOTTOM_H = 120;
  ctx.fillRect(0, SIZE - BOTTOM_H, SIZE, BOTTOM_H);
  
  // Left strip
  ctx.fillRect(0, 0, BORDER, SIZE);
  
  // Right strip
  ctx.fillRect(SIZE - BORDER, 0, BORDER, SIZE);
  
  ctx.globalAlpha = 1.0;
  
  // Stamp-tooth pattern on top edge
  drawStampPattern(ctx, 0, BORDER, SIZE, 12, GREEN);
  
  // Stamp-tooth pattern on bottom inner edge
  drawStampPattern(ctx, 0, SIZE - BOTTOM_H, SIZE, 12, GREEN);
  
  // --- Corner Accents ---
  ctx.save();
  ctx.translate(BORDER - 5, BORDER - 5);
  drawCornerAccents(ctx, SIZE - 2 * BORDER + 10, SIZE - BORDER - BOTTOM_H + 10, YELLOW, 30);
  ctx.restore();
  
  // --- Diagonal corner badges ---
  // Top-left badge
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(160, 0);
  ctx.lineTo(0, 160);
  ctx.closePath();
  ctx.fillStyle = GREEN;
  ctx.globalAlpha = 0.9;
  ctx.fill();
  ctx.globalAlpha = 1;
  
  // HH text in corner
  ctx.save();
  ctx.translate(42, 56);
  ctx.rotate(-Math.PI / 4);
  ctx.font = '700 28px "Imbue", serif';
  ctx.fillStyle = YELLOW;
  ctx.textAlign = 'center';
  ctx.fillText('HH', 0, 0);
  ctx.restore();
  ctx.restore();
  
  // Top-right badge
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(SIZE, 0);
  ctx.lineTo(SIZE - 160, 0);
  ctx.lineTo(SIZE, 160);
  ctx.closePath();
  ctx.fillStyle = GREEN;
  ctx.globalAlpha = 0.9;
  ctx.fill();
  ctx.globalAlpha = 1;
  
  // GOA text in corner
  ctx.save();
  ctx.translate(SIZE - 42, 56);
  ctx.rotate(Math.PI / 4);
  ctx.font = '700 24px "Imbue", serif';
  ctx.fillStyle = YELLOW;
  ctx.textAlign = 'center';
  ctx.fillText('GOA', 0, 0);
  ctx.restore();
  ctx.restore();
  
  // --- Bottom Logo Area ---
  try {
    const hhLogo = await loadImageFromUrl('assets/Hacker%20house.png');
    const hlH = 26; // Reduced height slightly to fit text better
    const hlW = hhLogo.width * (hlH / hhLogo.height);
    ctx.drawImage(hhLogo, (SIZE - hlW) / 2, SIZE - BOTTOM_H + 16, hlW, hlH);
  } catch (e) {
    ctx.font = '700 36px "Imbue", serif';
    ctx.fillStyle = YELLOW;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('HACKER HOUSE', SIZE / 2, SIZE - BOTTOM_H + 28);
  }
  
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  // Builder Name
  const nameText = (opts.name || 'BUILDER').toUpperCase();
  ctx.font = '700 44px "Imbue", serif';
  ctx.fillStyle = YELLOW;
  ctx.globalAlpha = 1;
  ctx.fillText(nameText, SIZE / 2, SIZE - BOTTOM_H + 66);
  
  // Builder Title
  const titleText = (opts.title || 'HACKER').toUpperCase();
  ctx.font = '600 17px "Victor Mono", monospace';
  ctx.fillStyle = OFFWHITE;
  ctx.globalAlpha = 0.9;
  ctx.fillText(titleText, SIZE / 2, SIZE - BOTTOM_H + 100);
  ctx.globalAlpha = 1;
  
  // --- Pink accent line ---
  ctx.fillStyle = PINK;
  ctx.fillRect(BORDER, BORDER - 2, SIZE - 2 * BORDER, 3);
  
  // --- Subtle inner vignette ---
  const vignette = ctx.createRadialGradient(SIZE/2, SIZE/2, SIZE * 0.3, SIZE/2, SIZE/2, SIZE * 0.7);
  vignette.addColorStop(0, 'rgba(0,0,0,0)');
  vignette.addColorStop(1, 'rgba(0,0,0,0.15)');
  ctx.fillStyle = vignette;
  ctx.fillRect(BORDER, BORDER, SIZE - 2*BORDER, SIZE - BORDER - BOTTOM_H);
  
  // --- Palm leaf decorative emoji (fallback) or SVG ---
  try {
    const goaHindi = await loadImageFromUrl('assets/goa_hindi.svg');
    // Draw the goa hindi svg
    const ghW = 120;
    const ghH = goaHindi.height * (ghW / goaHindi.width);
    ctx.globalAlpha = 0.8;
    ctx.drawImage(goaHindi, SIZE - BORDER - ghW - 20, BORDER + 20, ghW, ghH);
    ctx.globalAlpha = 1;
  } catch (e) {
    ctx.font = '32px serif';
    ctx.globalAlpha = 0.7;
    ctx.fillText('🌴', SIZE - BORDER - 40, BORDER + 50);
    ctx.globalAlpha = 1;
  }
  
  // Draw Template
  if (templateImg) {
    ctx.clearRect(0, 0, SIZE, SIZE); // Clear the custom drawing
    
    // Draw template FIRST (so the opaque placeholder is below our photo)
    ctx.drawImage(templateImg, 0, 0, SIZE, SIZE);
    
    // Draw photo ON TOP of the placeholder
    // Both Formal and Goa Profile Frames have the same huge circular placeholder
    // Center: X=540, Y=500. Radius: ~420.
    drawCircularImage(ctx, img, 540, 500, 420, 0, '', null);
    
    // Overlay Hindi text so it sits on top of the photo
    try {
      const goaHindi = await loadImageFromUrl('assets/goa_hindi.svg');
      if (theme === 'formal') {
        ctx.filter = 'grayscale(100%)';
      }
      // Scaled and adjusted to perfectly align with the baked-in text behind the photo
      // Adjust the goa text from here.
      ctx.drawImage(goaHindi, 190, 704, 312, 275);
      
      if (theme === 'formal') {
        ctx.filter = 'none'; // reset filter
      }
    } catch (e) {
      console.warn('Could not load goa_hindi overlay:', e);
    }
  }
  
  ctx.restore();
}


// ============================================================
// BUILDER ID CARD GENERATOR
// ============================================================

/**
 * Generate a Builder ID Card
 * @param {HTMLCanvasElement} canvas
 * @param {HTMLImageElement} img - Uploaded photo
 * @param {Object} opts - { name, stack, role, title }
 */
export async function generateCard(canvas, img, opts = {}) {
  await ensureFontsLoaded();
  
  const W = 1080;
  const H = 1350;
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  
  // Colors
  const GREEN = '#0B6839';
  const GREEN_DARK = '#094e2b';
  const YELLOW = '#FEE101';
  const PINK = '#FF0080';
  const WHITE = '#FFFFFF';
  const OFFWHITE = '#FFFBE8';
  const GOLD = '#EDD723';
  
  const theme = opts.theme || 'formal';
  let templatePath = '';
  if (theme === 'formal') {
    templatePath = 'assets/ID/2.png';
  } else if (theme === 'goa') {
    templatePath = 'assets/ID/4.png';
  }
  
  let templateImg = null;
  try {
    if (templatePath) {
      templateImg = await loadImageFromUrl(templatePath);
    }
  } catch (e) {
    console.warn('Could not load ID template:', e);
  }
  
  const name = opts.name || 'Builder';
  const stack = opts.stack || 'Full Stack';
  const role = opts.role || 'Builder';
  const title = opts.title || 'Code Alchemist';
  
  // --- Background ---
  // Green gradient background
  const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
  bgGrad.addColorStop(0, GREEN);
  bgGrad.addColorStop(0.5, GREEN_DARK);
  bgGrad.addColorStop(1, GREEN);
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, W, H);
  
  // Subtle grid texture
  ctx.save();
  ctx.globalAlpha = 0.03;
  ctx.strokeStyle = WHITE;
  ctx.lineWidth = 1;
  for (let x = 0; x < W; x += 40) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, H);
    ctx.stroke();
  }
  for (let y = 0; y < H; y += 40) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
  }
  ctx.restore();
  
  // --- Card Body (offwhite inset) ---
  const MARGIN = 60;
  const CARD_Y = 80;
  const CARD_H = H - 160;
  const CARD_W = W - 2 * MARGIN;
  const CARD_R = 24;
  
  // Card shadow
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  roundRect(ctx, MARGIN + 10, CARD_Y + 12, CARD_W, CARD_H, CARD_R);
  ctx.fill();
  ctx.restore();
  
  // Card fill
  roundRect(ctx, MARGIN, CARD_Y, CARD_W, CARD_H, CARD_R);
  ctx.fillStyle = OFFWHITE;
  ctx.fill();
  
  // --- Header Strip (green) ---
  const HEADER_H = 200;
  // Clip to card shape for header
  ctx.save();
  roundRect(ctx, MARGIN, CARD_Y, CARD_W, CARD_H, CARD_R);
  ctx.clip();
  ctx.fillStyle = GREEN;
  ctx.fillRect(MARGIN, CARD_Y, CARD_W, HEADER_H);
  
  // Header label
  ctx.font = '700 14px "Victor Mono", monospace';
  ctx.fillStyle = YELLOW;
  ctx.globalAlpha = 0.7;
  ctx.textAlign = 'left';
  ctx.fillText('BUILDER ID CARD', MARGIN + 40, CARD_Y + 40);
  ctx.globalAlpha = 1;
  
  // HH GOA 2026 in header
  ctx.font = '700 14px "Victor Mono", monospace';
  ctx.fillStyle = YELLOW;
  ctx.textAlign = 'right';
  ctx.globalAlpha = 0.7;
  ctx.fillText('HH GOA 2026', W - MARGIN - 40, CARD_Y + 40);
  ctx.globalAlpha = 1;
  
  // Pink accent line under header
  ctx.fillStyle = PINK;
  ctx.fillRect(MARGIN, CARD_Y + HEADER_H - 4, CARD_W, 4);
  ctx.restore(); // End header clip
  
  // --- Photo Circle ---
  const photoRadius = 130;
  const photoCX = W / 2;
  const photoCY = CARD_Y + HEADER_H + 10;
  
  // Photo white border background
  ctx.beginPath();
  ctx.arc(photoCX, photoCY, photoRadius + 8, 0, Math.PI * 2);
  ctx.fillStyle = OFFWHITE;
  ctx.fill();
  
  // Dashed pink border
  drawCircularImage(ctx, img, photoCX, photoCY, photoRadius, 4, PINK, [10, 6]);
  
  // Palm tree badge
  ctx.save();
  const badgeX = photoCX + photoRadius - 10;
  const badgeY = photoCY - photoRadius + 10;
  ctx.beginPath();
  ctx.arc(badgeX, badgeY, 24, 0, Math.PI * 2);
  ctx.fillStyle = YELLOW;
  ctx.fill();
  // Shadow for badge
  ctx.shadowColor = 'rgba(0,0,0,0.2)';
  ctx.shadowBlur = 8;
  ctx.shadowOffsetX = 2;
  ctx.shadowOffsetY = 3;
  ctx.beginPath();
  ctx.arc(badgeX, badgeY, 24, 0, Math.PI * 2);
  ctx.fillStyle = YELLOW;
  ctx.fill();
  ctx.shadowColor = 'transparent';
  ctx.font = '22px serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('🌴', badgeX, badgeY);
  ctx.restore();
  
  // --- Builder Name ---
  const nameY = photoCY + photoRadius + 55;
  ctx.font = '700 54px "Imbue", serif';
  ctx.fillStyle = GREEN;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  drawTruncatedText(ctx, name.toUpperCase(), W / 2, nameY, CARD_W - 80);
  
  // --- Role ---
  const roleY = nameY + 40;
  ctx.font = '600 18px "Victor Mono", monospace';
  ctx.fillStyle = 'rgba(11,104,57,0.6)';
  ctx.textAlign = 'center';
  drawTruncatedText(ctx, role.toUpperCase(), W / 2, roleY, CARD_W - 80);
  
  // --- Stack Badges ---
  const stackY = roleY + 45;
  const stacks = stack.split(',').map(s => s.trim()).filter(s => s.length > 0).slice(0, 4);
  
  ctx.font = '700 14px "Victor Mono", monospace';
  ctx.textBaseline = 'middle';
  const badgeH = 32;
  const badgePadX = 20;
  const badgeGap = 10;
  
  // Calculate total width for centering
  let totalBadgeW = 0;
  const badgeWidths = [];
  for (const s of stacks) {
    const tw = ctx.measureText(s.toUpperCase()).width + badgePadX * 2;
    badgeWidths.push(tw);
    totalBadgeW += tw;
  }
  totalBadgeW += (stacks.length - 1) * badgeGap;
  
  let bx = (W - totalBadgeW) / 2;
  for (let i = 0; i < stacks.length; i++) {
    const bw = badgeWidths[i];
    
    // Badge bg
    roundRect(ctx, bx, stackY - badgeH / 2, bw, badgeH, badgeH / 2);
    ctx.fillStyle = GREEN;
    ctx.globalAlpha = 0.08;
    ctx.fill();
    ctx.globalAlpha = 1;
    
    // Badge border
    roundRect(ctx, bx, stackY - badgeH / 2, bw, badgeH, badgeH / 2);
    ctx.strokeStyle = GREEN;
    ctx.globalAlpha = 0.2;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.globalAlpha = 1;
    
    // Badge text
    ctx.fillStyle = GREEN;
    ctx.globalAlpha = 0.7;
    ctx.textAlign = 'center';
    ctx.fillText(stacks[i].toUpperCase(), bx + bw / 2, stackY + 1);
    ctx.globalAlpha = 1;
    
    bx += bw + badgeGap;
  }
  
  // --- Divider ---
  const divY = stackY + 40;
  ctx.strokeStyle = 'rgba(11,104,57,0.1)';
  ctx.lineWidth = 2;
  ctx.setLineDash([8, 6]);
  ctx.beginPath();
  ctx.moveTo(MARGIN + 60, divY);
  ctx.lineTo(W - MARGIN - 60, divY);
  ctx.stroke();
  ctx.setLineDash([]);
  
  // --- Builder Title (the fun one) ---
  const titleY = divY + 50;
  
  // Label
  ctx.font = '700 12px "Victor Mono", monospace';
  ctx.fillStyle = PINK;
  ctx.textAlign = 'center';
  ctx.fillText('BUILDER CLASS', W / 2, titleY - 18);
  
  // Title value
  ctx.font = '700 38px "Imbue", serif';
  ctx.fillStyle = PINK;
  ctx.textAlign = 'center';
  drawTruncatedText(ctx, `« ${title.toUpperCase()} »`, W / 2, titleY + 22, CARD_W - 80);
  
  // --- Footer Area ---
  const footerY = CARD_Y + CARD_H - 110;
  
  // Clip footer to card shape
  ctx.save();
  roundRect(ctx, MARGIN, CARD_Y, CARD_W, CARD_H, CARD_R);
  ctx.clip();
  
  // Footer bg strip
  ctx.fillStyle = GREEN;
  ctx.fillRect(MARGIN, footerY, CARD_W, 110);
  
  // Stamp pattern on footer top
  drawStampPattern(ctx, MARGIN, footerY, CARD_W, 10, GREEN);
  
  // Footer text
  try {
    const hhLogo = await loadImageFromUrl('assets/Hacker%20house.png');
    const hlH = 22;
    const hlW = hhLogo.width * (hlH / hhLogo.height);
    ctx.drawImage(hhLogo, (W - hlW) / 2, footerY + 28, hlW, hlH);
  } catch (e) {
    ctx.font = '700 30px "Imbue", serif';
    ctx.fillStyle = YELLOW;
    ctx.textAlign = 'center';
    ctx.fillText('HACKER HOUSE GOA', W / 2, footerY + 40);
  }
  
  ctx.font = '600 13px "Victor Mono", monospace';
  ctx.fillStyle = OFFWHITE;
  ctx.globalAlpha = 0.7;
  ctx.fillText('28 – 31 OCT 2026  ·  GOA, INDIA', W / 2, footerY + 68);
  ctx.globalAlpha = 1;
  
  // 2:47 pm Studio credit
  try {
    const studioLogo = await loadImageFromUrl('assets/2-47.svg');
    const slH = 20;
    const slW = studioLogo.width * (slH / studioLogo.height);
    
    ctx.font = '600 11px "Victor Mono", monospace';
    ctx.fillStyle = YELLOW;
    ctx.globalAlpha = 0.4;
    const textW = ctx.measureText('2:47 PM STUDIO').width;
    
    // ctx.fillText('2:47 PM STUDIO', W / 2, footerY + 92);
    // Draw the logo instead
    ctx.globalAlpha = 0.8;
    ctx.drawImage(studioLogo, (W - slW) / 2, footerY + 84, slW, slH);
    ctx.globalAlpha = 1;
  } catch (e) {
    ctx.font = '600 11px "Victor Mono", monospace';
    ctx.fillStyle = YELLOW;
    ctx.globalAlpha = 0.4;
    ctx.fillText('2:47 PM STUDIO', W / 2, footerY + 92);
    ctx.globalAlpha = 1;
  }
  
  ctx.restore(); // End footer clip
  
  // --- Outer corner accents ---
  ctx.save();
  ctx.translate(MARGIN - 10, CARD_Y - 10);
  drawCornerAccents(ctx, CARD_W + 20, CARD_H + 20, YELLOW, 20);
  ctx.restore();
  
  // Draw Template if it exists, covering the generated card
  if (templateImg) {
    ctx.clearRect(0, 0, W, H);
    
    // Draw template FIRST (opaque placeholder is below our photo)
    ctx.drawImage(templateImg, 0, 0, W, H);
    
    // Draw photo ON TOP of the placeholder
    // The original template is 1440px high, drawn to 1350px canvas (scale 0.9375).
    // Original circle center Y = 779, radius = 259.
    // Scaled Center Y = 730, Radius = 245.
    drawCircularImage(ctx, img, 540, 730, 245, 0, '', null);
    
    // Draw text over the template
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    
    const nameText = name.toUpperCase();
    const roleText = role.toUpperCase();
    const titleText = `« ${title.toUpperCase()} »`;
    const stacks = stack.split(',').map(s => s.trim()).filter(s => s.length > 0).slice(0, 4);
    
    if (theme === 'formal') {
      const roleY = 975;
      drawRoleBadge(ctx, roleText, 540, roleY, '#FACC15', '#0F172A', null);

      const nameY = 1050;
      ctx.font = '700 54px "Imbue", serif';
      ctx.fillStyle = '#000000'; // properly in black font
      drawTruncatedText(ctx, nameText, 540, nameY, W - 160);
      
      const stackY = 1125;
      drawStackBadges(ctx, stacks, 540, stackY, '#E2E8F0', '#0F172A');
      
      const titleY = 1200;
      ctx.font = '700 38px "Imbue", serif';
      ctx.fillStyle = PINK;
      drawTruncatedText(ctx, titleText, 540, titleY, W - 160);
      
    } else if (theme === 'goa') {
      const roleY = 975;
      drawRoleBadge(ctx, roleText, 540, roleY, '#FACC15', '#311042', null);

      const nameY = 1050;
      ctx.font = '700 54px "Imbue", serif';
      ctx.fillStyle = '#000000'; // properly in black font
      drawTruncatedText(ctx, nameText, 540, nameY, W - 160);
      
      const stackY = 1125;
      drawStackBadges(ctx, stacks, 540, stackY, 'rgba(255, 255, 255, 0.4)', '#311042');
      
      const titleY = 1200;
      ctx.font = '700 38px "Imbue", serif';
      ctx.fillStyle = PINK;
      drawTruncatedText(ctx, titleText, 540, titleY, W - 160);
    }
  }
}

function drawRoleBadge(ctx, text, x, y, bgColor, textColor, borderColor) {
  if (!text) return;
  ctx.save();
  ctx.font = '700 16px sans-serif';
  ctx.textBaseline = 'middle';
  
  const bw = ctx.measureText(text).width + 32;
  const bh = 36;
  const bx = x - bw / 2;
  const by = y - bh / 2;
  
  roundRect(ctx, bx, by, bw, bh, bh / 2);
  ctx.fillStyle = bgColor;
  ctx.fill();
  
  if (borderColor) {
    roundRect(ctx, bx, by, bw, bh, bh / 2);
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 1;
    ctx.stroke();
  }
  
  ctx.fillStyle = textColor;
  ctx.textAlign = 'center';
  ctx.fillText(text, x, y + 2);
  ctx.restore();
}

function drawStackBadges(ctx, stacks, centerX, y, bgColor, textColor) {
  if (!stacks.length) return;
  
  ctx.save();
  ctx.font = '700 14px sans-serif';
  ctx.textBaseline = 'middle';
  const badgeH = 28;
  const badgePadX = 16;
  const badgeGap = 8;
  
  let totalBadgeW = 0;
  const badgeWidths = [];
  for (const s of stacks) {
    const tw = ctx.measureText(s.toUpperCase()).width + badgePadX * 2;
    badgeWidths.push(tw);
    totalBadgeW += tw;
  }
  totalBadgeW += (stacks.length - 1) * badgeGap;
  
  let bx = centerX - totalBadgeW / 2;
  for (let i = 0; i < stacks.length; i++) {
    const bw = badgeWidths[i];
    
    // Badge bg
    roundRect(ctx, bx, y - badgeH / 2, bw, badgeH, badgeH / 2);
    ctx.fillStyle = bgColor;
    ctx.fill();
    
    // Badge text
    ctx.fillStyle = textColor;
    ctx.textAlign = 'center';
    ctx.fillText(stacks[i].toUpperCase(), bx + bw / 2, y + 1);
    
    bx += bw + badgeGap;
  }
  ctx.restore();
}

/**
 * Render to an offscreen canvas and return blob URL
 */
export async function renderToBlob(renderFn, img, opts) {
  const offscreen = document.createElement('canvas');
  await renderFn(offscreen, img, opts);
  return new Promise((resolve) => {
    offscreen.toBlob((blob) => {
      resolve(URL.createObjectURL(blob));
    }, 'image/png');
  });
}

/**
 * Download canvas as PNG
 */
export function downloadCanvas(canvas, filename) {
  const link = document.createElement('a');
  link.download = filename || 'hh-goa-2026.png';
  link.href = canvas.toDataURL('image/png');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
