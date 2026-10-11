// Assembles the game from ../game into app/index.html for the desktop build:
// concatenates the source parts, swaps Google Fonts for embedded offline fonts,
// and refreshes the browser version (../starfall-crypt.html) at the same time.
const fs = require('fs');
const path = require('path');

const root = __dirname;
const game = path.join(root, '..', 'game');
const parts = ['p2.js', 'p3.js', 'p4.js', 'p5.js', 'p6.js', 'p7.js', 'p8.js', 'p9.js', 'p10.js', 'p11.js', 'p12.js', 'p13.js', 'p14.js'];

const page = fs.readFileSync(path.join(game, 'p1.html'), 'utf8');
const js = parts.map(f => fs.readFileSync(path.join(game, f), 'utf8')).join('\n');
const body = `${page}\n<script>\n${js}\n</script>\n`;

// browser version (fonts still come from Google Fonts)
fs.writeFileSync(path.join(root, '..', 'starfall-crypt.html'), body);

// warn when the game uses characters the embedded font subset does not cover
const fontDir = path.join(root, 'fonts');
const have = new Set(fs.readFileSync(path.join(fontDir, 'chars.txt'), 'utf8'));
const missing = [...new Set([...body].filter(c => c.codePointAt(0) > 127 && !have.has(c)))];
if (missing.length) {
  fs.writeFileSync(path.join(fontDir, 'chars.txt'), [...have, ...missing].join(''), 'utf8');
  console.warn(`! ${missing.length} new characters added to chars.txt - run python subset-fonts.py, then rebuild`);
}

const fonts = JSON.parse(fs.readFileSync(path.join(fontDir, 'fonts.json'), 'utf8').replace(/^﻿/, ''));
const faces = fonts.filter(f => fs.existsSync(path.join(fontDir, f.file))).map(f => {
  const b64 = fs.readFileSync(path.join(fontDir, f.file)).toString('base64');
  return `@font-face{font-family:"${f.family}";font-style:normal;font-weight:${f.weight};font-display:block;src:url(data:font/woff2;base64,${b64}) format("woff2")${f.range ? `;unicode-range:${f.range}` : ''}}`;
}).join('\n');

const desktopBody = body
  .replace(/<link rel="preconnect"[^>]*>\n?/g, '')
  .replace(/<link rel="stylesheet" href="https:\/\/fonts\.googleapis\.com[^>]*>\n?/g, '');

const html = `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>
${faces}
</style>
</head>
<body>
${desktopBody}
</body>
</html>
`;
fs.mkdirSync(path.join(root, 'app'), { recursive: true });
fs.writeFileSync(path.join(root, 'app', 'index.html'), html);
fs.copyFileSync(path.join(root, 'build', 'icon.png'), path.join(root, 'app', 'icon.png'));
console.log(`app/index.html written (${(html.length / 1024).toFixed(0)} KB)`);
