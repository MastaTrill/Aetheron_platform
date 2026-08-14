import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

function createPng(width, height, drawPixel) {
  // RGBA buffer: height rows, each with 1 filter byte (0) + width * 4 bytes
  const rowSize = 1 + width * 4;
  const rawData = Buffer.alloc(height * rowSize);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    rawData[rowOffset] = 0; // Filter type: None
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = drawPixel(x, y, width, height);
      const pxOffset = rowOffset + 1 + x * 4;
      rawData[pxOffset] = r;
      rawData[pxOffset + 1] = g;
      rawData[pxOffset + 2] = b;
      rawData[pxOffset + 3] = a;
    }
  }

  const compressed = zlib.deflateSync(rawData);

  // PNG Signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR Chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // 8 bit depth
  ihdrData[9] = 6; // RGBA color type
  ihdrData[10] = 0; // Deflate compression
  ihdrData[11] = 0; // Filter method
  ihdrData[12] = 0; // No interlace

  const ihdrChunk = createChunk('IHDR', ihdrData);
  const idatChunk = createChunk('IDAT', compressed);
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function createChunk(type, data) {
  const len = data.length;
  const chunk = Buffer.alloc(12 + len);
  chunk.writeUInt32BE(len, 0);
  chunk.write(type, 4, 4, 'ascii');
  data.copy(chunk, 8);

  const crc = crc32(chunk.subarray(4, 8 + len));
  chunk.writeUInt32BE(crc, 8 + len);
  return chunk;
}

// Standard CRC32 table
const crcTable = [];
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  crcTable[n] = c;
}

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

// 1. Generate OG Image (1200 x 630)
console.log('Generating og-image.png (1200x630)...');
const ogBuffer = createPng(1200, 630, (x, y, w, h) => {
  // Center coordinates
  const cx = 920;
  const cy = 315;
  const dx = x - cx;
  const dy = y - cy;
  const dist = Math.sqrt(dx * dx + dy * dy);

  // Background radial gradient
  const bgDx = (x - w * 0.4) / w;
  const bgDy = (y - h * 0.5) / h;
  const bgDist = Math.sqrt(bgDx * bgDx + bgDy * bgDy);
  
  let r = Math.max(4, Math.floor(18 - bgDist * 14));
  let g = Math.max(7, Math.floor(28 - bgDist * 20));
  let b = Math.max(14, Math.floor(46 - bgDist * 32));

  // Subtle grid lines
  if (x % 75 === 0 || y % 63 === 0) {
    r += 5;
    g += 10;
    b += 18;
  }

  // Orbital rings around right logo center
  if (Math.abs(dist - 210) < 1.5 || Math.abs(dist - 140) < 1.5 || Math.abs(dist - 80) < 1.0) {
    return [0, 240, 255, 180];
  }

  // Diamond shape on right side
  // Diamond equation: |dx| / a + |dy| / b <= 1
  const a = 110;
  const bScale = 160;
  const diamondVal = Math.abs(dx) / a + Math.abs(dy) / bScale;

  if (diamondVal <= 1.0) {
    if (diamondVal >= 0.94) {
      return [0, 240, 255, 255]; // Bright cyan border
    }
    // Inner fill gradient (indigo / electric blue)
    const t = 1.0 - diamondVal;
    return [
      Math.floor(98 + t * 50),
      Math.floor(126 + t * 90),
      Math.floor(234 + t * 21),
      240
    ];
  }

  // Energy nodes at diamond vertices
  const nodes = [
    { nx: cx, ny: cy - bScale },
    { nx: cx, ny: cy + bScale },
    { nx: cx - a, ny: cy },
    { nx: cx + a, ny: cy },
  ];
  for (const n of nodes) {
    const ndist = Math.sqrt((x - n.nx) ** 2 + (y - n.ny) ** 2);
    if (ndist <= 7) return [0, 240, 255, 255];
    if (ndist <= 12) return [0, 240, 255, Math.floor(255 * (1 - (ndist - 7) / 5))];
  }

  // Left banner branding cards area
  if (x >= 90 && x <= 640 && y >= 110 && y <= 520) {
    // Subtle backdrop glow for title
    r += 10;
    g += 15;
    b += 25;
  }

  return [Math.min(255, r), Math.min(255, g), Math.min(255, b), 255];
});

fs.writeFileSync('og-image.png', ogBuffer);
console.log('✅ og-image.png generated (' + ogBuffer.length + ' bytes)');

// 2. Generate icon-512.png (512 x 512)
console.log('Generating icon-512.png (512x512)...');
const icon512Buffer = createPng(512, 512, (x, y, w, h) => {
  const cx = 256;
  const cy = 256;
  const dx = x - cx;
  const dy = y - cy;
  const dist = Math.sqrt(dx * dx + dy * dy);

  // Background dark rounded rect check (radius 100)
  const margin = 10;
  if (x < margin || x > w - margin || y < margin || y > h - margin) {
    return [0, 0, 0, 0];
  }

  let r = 10;
  let g = 14;
  let b = 26;

  // Concentric circle rings
  if (Math.abs(dist - 190) < 1.5 || Math.abs(dist - 140) < 1.5) {
    return [0, 240, 255, 140];
  }

  // Central diamond
  const a = 120;
  const bScale = 170;
  const dVal = Math.abs(dx) / a + Math.abs(dy) / bScale;

  if (dVal <= 1.0) {
    if (dVal >= 0.94) return [0, 240, 255, 255]; // Border
    const t = 1.0 - dVal;
    return [
      Math.floor(98 + t * 40),
      Math.floor(126 + t * 80),
      Math.floor(234 + t * 21),
      255
    ];
  }

  // Nodes
  const nodes = [
    { nx: cx, ny: cy - bScale },
    { nx: cx, ny: cy + bScale },
    { nx: cx - a, ny: cy },
    { nx: cx + a, ny: cy },
  ];
  for (const n of nodes) {
    const ndist = Math.sqrt((x - n.nx) ** 2 + (y - n.ny) ** 2);
    if (ndist <= 8) return [0, 240, 255, 255];
  }

  return [r, g, b, 255];
});

fs.writeFileSync('icon-512.png', icon512Buffer);
console.log('✅ icon-512.png generated (' + icon512Buffer.length + ' bytes)');

// 3. Generate icon-192.png (192 x 192)
console.log('Generating icon-192.png (192x192)...');
const icon192Buffer = createPng(192, 192, (x, y, w, h) => {
  const cx = 96;
  const cy = 96;
  const dx = x - cx;
  const dy = y - cy;
  const dist = Math.sqrt(dx * dx + dy * dy);

  let r = 10;
  let g = 14;
  let b = 26;

  if (Math.abs(dist - 70) < 1.2) {
    return [0, 240, 255, 120];
  }

  const a = 46;
  const bScale = 65;
  const dVal = Math.abs(dx) / a + Math.abs(dy) / bScale;

  if (dVal <= 1.0) {
    if (dVal >= 0.92) return [0, 240, 255, 255];
    const t = 1.0 - dVal;
    return [
      Math.floor(98 + t * 40),
      Math.floor(126 + t * 80),
      Math.floor(234 + t * 21),
      255
    ];
  }

  const nodes = [
    { nx: cx, ny: cy - bScale },
    { nx: cx, ny: cy + bScale },
    { nx: cx - a, ny: cy },
    { nx: cx + a, ny: cy },
  ];
  for (const n of nodes) {
    const ndist = Math.sqrt((x - n.nx) ** 2 + (y - n.ny) ** 2);
    if (ndist <= 4) return [0, 240, 255, 255];
  }

  return [r, g, b, 255];
});

fs.writeFileSync('icon-192.png', icon192Buffer);
console.log('✅ icon-192.png generated (' + icon192Buffer.length + ' bytes)');
