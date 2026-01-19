const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const iconDir = path.join(__dirname, '../resources/icons');

if (!fs.existsSync(iconDir)) {
  fs.mkdirSync(iconDir, { recursive: true });
}

function generateAppIconSVG() {
  return `<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#8b5cf6;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#6366f1;stop-opacity:1" />
    </linearGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="4" stdDeviation="8" flood-color="#000" flood-opacity="0.3"/>
    </filter>
  </defs>
  <rect width="512" height="512" rx="102" fill="url(#bgGrad)"/>
  <g transform="translate(156, 100)" filter="url(#shadow)">
    <rect x="50" y="20" width="100" height="180" rx="50" fill="white"/>
    <path d="M0 160c0 83 67 150 150 150s150-67 150-150h-40c0 61-49 110-110 110s-110-49-110-110H0z" fill="white" opacity="0.9"/>
    <rect x="125" y="320" width="50" height="60" fill="white"/>
    <rect x="75" y="370" width="150" height="30" rx="15" fill="white"/>
  </g>
  <g transform="translate(350, 350)">
    <circle cx="50" cy="50" r="60" fill="#22c55e"/>
    <path d="M30 50h40M50 30v40" stroke="white" stroke-width="12" stroke-linecap="round"/>
  </g>
</svg>`;
}

function generateTrayIconSVG(state) {
  const colors = { idle: '#8b5cf6', recording: '#22c55e', processing: '#f59e0b' };
  const color = colors[state] || colors.idle;
  
  return `<svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
  <circle cx="16" cy="16" r="15" fill="${color}"/>
  <g transform="translate(8, 5)" fill="white">
    <rect x="5" y="2" width="6" height="12" rx="3"/>
    <path d="M0 11c0 5 4 9 8 9s8-4 8-9h-3c0 3-2 6-5 6s-5-3-5-6H0z"/>
    <rect x="6" y="21" width="4" height="4"/>
  </g>
</svg>`;
}

async function generateIcons() {
  console.log('🎨 Generating production icons...\n');
  
  const appSvg = generateAppIconSVG();
  const svgBuffer = Buffer.from(appSvg);
  
  fs.writeFileSync(path.join(iconDir, 'icon.svg'), appSvg);
  console.log('✓ icon.svg');
  
  await sharp(svgBuffer).resize(512, 512).png().toFile(path.join(iconDir, 'icon.png'));
  console.log('✓ icon.png (512x512)');
  
  await sharp(svgBuffer).resize(1024, 1024).png().toFile(path.join(iconDir, 'icon@2x.png'));
  console.log('✓ icon@2x.png (1024x1024)');
  
  await sharp(svgBuffer).resize(256, 256).png().toFile(path.join(iconDir, 'icon-256.png'));
  console.log('✓ icon-256.png');

  const icoSizes = [16, 24, 32, 48, 64, 128, 256];
  const icoBuffers = await Promise.all(
    icoSizes.map(size => sharp(svgBuffer).resize(size, size).png().toBuffer())
  );
  
  const icoBuffer = createICO(icoBuffers, icoSizes);
  fs.writeFileSync(path.join(iconDir, 'icon.ico'), icoBuffer);
  console.log('✓ icon.ico (Windows)');
  
  const icnsSizes = [16, 32, 64, 128, 256, 512, 1024];
  const icnsBuffers = {};
  for (const size of icnsSizes) {
    icnsBuffers[size] = await sharp(svgBuffer).resize(size, size).png().toBuffer();
  }
  const icnsBuffer = createICNS(icnsBuffers);
  fs.writeFileSync(path.join(iconDir, 'icon.icns'), icnsBuffer);
  console.log('✓ icon.icns (macOS)');
  
  for (const state of ['idle', 'recording', 'processing']) {
    const traySvg = generateTrayIconSVG(state);
    const trayBuffer = Buffer.from(traySvg);
    const suffix = state === 'idle' ? '' : `-${state}`;
    
    fs.writeFileSync(path.join(iconDir, `tray-icon${suffix}.svg`), traySvg);
    await sharp(trayBuffer).resize(32, 32).png().toFile(path.join(iconDir, `tray-icon${suffix}.png`));
    await sharp(trayBuffer).resize(64, 64).png().toFile(path.join(iconDir, `tray-icon${suffix}@2x.png`));
    console.log(`✓ tray-icon${suffix}.png + @2x`);
  }
  
  console.log('\n✅ All icons generated successfully!');
}

function createICO(buffers, sizes) {
  const headerSize = 6;
  const dirEntrySize = 16;
  const numImages = buffers.length;
  
  let dataOffset = headerSize + (dirEntrySize * numImages);
  const entries = [];
  const imageData = [];
  
  for (let i = 0; i < numImages; i++) {
    const size = sizes[i];
    const data = buffers[i];
    
    entries.push({
      width: size >= 256 ? 0 : size,
      height: size >= 256 ? 0 : size,
      colorCount: 0,
      reserved: 0,
      planes: 1,
      bitCount: 32,
      bytesInRes: data.length,
      imageOffset: dataOffset
    });
    
    imageData.push(data);
    dataOffset += data.length;
  }
  
  const totalSize = dataOffset;
  const buffer = Buffer.alloc(totalSize);
  
  buffer.writeUInt16LE(0, 0);
  buffer.writeUInt16LE(1, 2);
  buffer.writeUInt16LE(numImages, 4);
  
  let offset = headerSize;
  for (const entry of entries) {
    buffer.writeUInt8(entry.width, offset);
    buffer.writeUInt8(entry.height, offset + 1);
    buffer.writeUInt8(entry.colorCount, offset + 2);
    buffer.writeUInt8(entry.reserved, offset + 3);
    buffer.writeUInt16LE(entry.planes, offset + 4);
    buffer.writeUInt16LE(entry.bitCount, offset + 6);
    buffer.writeUInt32LE(entry.bytesInRes, offset + 8);
    buffer.writeUInt32LE(entry.imageOffset, offset + 12);
    offset += dirEntrySize;
  }
  
  for (const data of imageData) {
    data.copy(buffer, offset);
    offset += data.length;
  }
  
  return buffer;
}

function createICNS(buffers) {
  const types = {
    16: 'icp4',
    32: 'icp5',
    64: 'icp6',
    128: 'ic07',
    256: 'ic08',
    512: 'ic09',
    1024: 'ic10'
  };
  
  let totalSize = 8;
  const entries = [];
  
  for (const [size, type] of Object.entries(types)) {
    if (buffers[size]) {
      const data = buffers[size];
      entries.push({ type, data });
      totalSize += 8 + data.length;
    }
  }
  
  const buffer = Buffer.alloc(totalSize);
  buffer.write('icns', 0);
  buffer.writeUInt32BE(totalSize, 4);
  
  let offset = 8;
  for (const entry of entries) {
    buffer.write(entry.type, offset);
    buffer.writeUInt32BE(8 + entry.data.length, offset + 4);
    entry.data.copy(buffer, offset + 8);
    offset += 8 + entry.data.length;
  }
  
  return buffer;
}

generateIcons().catch(console.error);
