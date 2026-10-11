// Draws the app icon (a pixel wizard hat with a star) and writes build/icon.png, 256x256.
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const ART = [
  '................................',
  '................................',
  '...................kk...........',
  '..................kPPk..........',
  '.................kPPpk..........',
  '................kPPppk..........',
  '...............kPPpppk..........',
  '..............kPPppppk..........',
  '.............kPPpppppk..........',
  '............kPPppppppk..........',
  '...........kPPpppppppk..........',
  '..........kPPppppppppk..........',
  '.........kPPpppppppppk..........',
  '........kPPppppppppppk..........',
  '........kPpppppppppppk..........',
  '.......kyyyyyyyyyyyyyyk.........',
  '.......kyyyyyywwyyyyyyk.........',
  '.......kyyyyywwwwyyyyyk.........',
  '...kkkkkkkkkkkkkkkkkkkkkkkkk....',
  '..kPPPPPPPPPPPPPPPPPPPPPPPPPk...',
  '..kpppppppppppppppppppppppppk...',
  '...kkkkkkkkkkkkkkkkkkkkkkkkk....',
  '................................',
  '..........c.........c...........',
  '.........ccc.......ccc..........',
  '..........c.........c...........',
  '................................',
];
const PAL = { k: [22, 15, 36], P: [142, 102, 219], p: [90, 54, 160], y: [255, 209, 102], w: [255, 255, 255], c: [143, 230, 255] };
const N = 256, SCALE = 8, OX = 0, OY = 20;
const px = Buffer.alloc(N * N * 4);
// rounded green-gold tile behind the hat
for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
  const r = 40, dx = Math.max(0, Math.abs(x - 127.5) - (128 - r)), dy = Math.max(0, Math.abs(y - 127.5) - (128 - r));
  if (dx * dx + dy * dy > r * r) continue;
  const t = y / N, i = (y * N + x) * 4;
  px[i] = Math.round(31 + 40 * t); px[i + 1] = Math.round(84 + 40 * (1 - t)); px[i + 2] = Math.round(52 + 10 * t); px[i + 3] = 255;
  if (dx * dx + dy * dy > (r - 10) * (r - 10)) { px[i] = 201; px[i + 1] = 154; px[i + 2] = 69; }
}
ART.forEach((row, j) => [...row].forEach((ch, i) => {
  const col = PAL[ch]; if (!col) return;
  for (let yy = 0; yy < SCALE; yy++) for (let xx = 0; xx < SCALE; xx++) {
    const X = OX + i * SCALE + xx, Y = OY + j * SCALE + yy; if (X >= N || Y >= N) continue;
    const k = (Y * N + X) * 4; px[k] = col[0]; px[k + 1] = col[1]; px[k + 2] = col[2]; px[k + 3] = 255;
  }
}));
const raw = Buffer.alloc((N * 4 + 1) * N);
for (let y = 0; y < N; y++) { raw[y * (N * 4 + 1)] = 0; px.copy(raw, y * (N * 4 + 1) + 1, y * N * 4, (y + 1) * N * 4); }
const chunk = (type, data) => {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(zlib.crc32(td) >>> 0);
  return Buffer.concat([len, td, crc]);
};
const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(N, 0); ihdr.writeUInt32BE(N, 4); ihdr[8] = 8; ihdr[9] = 6;
const png = Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
fs.mkdirSync(path.join(__dirname, 'build'), { recursive: true });
fs.writeFileSync(path.join(__dirname, 'build', 'icon.png'), png);
console.log('build/icon.png written');
