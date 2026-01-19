const fs = require('fs');
const path = require('path');

const iconDir = path.join(__dirname, '../resources/icons');

if (!fs.existsSync(iconDir)) {
  fs.mkdirSync(iconDir, { recursive: true });
}

function generateSVG(size, state = 'idle') {
  const colors = {
    idle: '#8b5cf6',
    recording: '#22c55e',
    processing: '#f59e0b',
  };
  
  const color = colors[state] || colors.idle;
  
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#8b5cf6;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#22c55e;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" rx="${size * 0.2}" fill="url(#grad)"/>
  <g transform="translate(${size * 0.25}, ${size * 0.2})">
    <path d="M${size * 0.25} ${size * 0.1}c${size * 0.1} 0 ${size * 0.17} ${size * 0.07} ${size * 0.17} ${size * 0.17}v${size * 0.17}c0 ${size * 0.1}-${size * 0.07} ${size * 0.17}-${size * 0.17} ${size * 0.17}s-${size * 0.17}-${size * 0.07}-${size * 0.17}-${size * 0.17}v-${size * 0.17}c0-${size * 0.1} ${size * 0.07}-${size * 0.17} ${size * 0.17}-${size * 0.17}z" fill="white"/>
    <path d="M${size * 0.08} ${size * 0.35}c0 ${size * 0.1} ${size * 0.07} ${size * 0.17} ${size * 0.17} ${size * 0.17}s${size * 0.17}-${size * 0.07} ${size * 0.17}-${size * 0.17}h${size * 0.08}c0 ${size * 0.12}-${size * 0.08} ${size * 0.22}-${size * 0.2} ${size * 0.24}v${size * 0.08}h-${size * 0.1}v-${size * 0.08}c-${size * 0.12}-${size * 0.02}-${size * 0.2}-${size * 0.12}-${size * 0.2}-${size * 0.24}h${size * 0.08}z" fill="white"/>
  </g>
</svg>`;
}

function generateTrayIcon(state) {
  const size = 22;
  const colors = {
    idle: '#8b5cf6',
    recording: '#22c55e', 
    processing: '#f59e0b',
  };
  
  const color = colors[state];
  
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <circle cx="${size/2}" cy="${size/2}" r="${size/2 - 1}" fill="${color}"/>
  <g transform="translate(${size * 0.3}, ${size * 0.25})" fill="white">
    <rect x="${size * 0.13}" y="0" width="${size * 0.18}" height="${size * 0.32}" rx="${size * 0.09}"/>
    <path d="M0 ${size * 0.23}c0 ${size * 0.09} ${size * 0.09} ${size * 0.18} ${size * 0.22} ${size * 0.18}s${size * 0.22}-${size * 0.09} ${size * 0.22}-${size * 0.18}h-${size * 0.08}c0 ${size * 0.06}-${size * 0.06} ${size * 0.1}-${size * 0.14} ${size * 0.1}s-${size * 0.14}-${size * 0.04}-${size * 0.14}-${size * 0.1}H0z"/>
    <rect x="${size * 0.17}" y="${size * 0.36}" width="${size * 0.1}" height="${size * 0.09}"/>
  </g>
</svg>`;
}

fs.writeFileSync(path.join(iconDir, 'icon.svg'), generateSVG(512));
fs.writeFileSync(path.join(iconDir, 'icon.png'), generateSVG(512));
fs.writeFileSync(path.join(iconDir, 'tray-icon.svg'), generateTrayIcon('idle'));
fs.writeFileSync(path.join(iconDir, 'tray-icon-recording.svg'), generateTrayIcon('recording'));
fs.writeFileSync(path.join(iconDir, 'tray-icon-processing.svg'), generateTrayIcon('processing'));

console.log('Icons generated successfully!');
console.log('Note: For production, convert icon.svg to icon.png (512x512), icon.icns (macOS), and icon.ico (Windows)');
console.log('You can use tools like:');
console.log('  - ImageMagick: convert icon.svg icon.png');
console.log('  - png2icns (macOS): png2icns icon.icns icon.png');
console.log('  - Online converters for .ico files');
