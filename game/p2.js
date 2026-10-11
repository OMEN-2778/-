'use strict';
/* ================= core utils ================= */
const $ = id => document.getElementById(id);
const rand = (a, b) => b === undefined ? Math.random() * a : a + Math.random() * (b - a);
const randi = (a, b) => Math.floor(rand(a, b + 1));
const pick = arr => arr[Math.floor(Math.random() * arr.length)];
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const lerp = (a, b, t) => a + (b - a) * t;
const damp = (a, b, k, dt) => lerp(a, b, 1 - Math.exp(-k * dt));
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const angTo = (a, b) => Math.atan2(b.y - a.y, b.x - a.x);
const angDiff = (a, b) => { let d = b - a; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI; return d; };
const easeOutCubic = t => 1 - Math.pow(1 - t, 3);
const easeOutBack = t => { const c = 1.9; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); };
const easeInOut = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const TAU = Math.PI * 2;

const cv = $('game');
const ctx = cv.getContext('2d');
let DPR = 1, W = 0, H = 0, S = 3, VW = 0, VH = 0;
function resize() {
  DPR = Math.min(window.devicePixelRatio || 1, 2);
  W = Math.floor(innerWidth * DPR); H = Math.floor(innerHeight * DPR);
  cv.width = W; cv.height = H;
  // integer pixel scale so every art pixel is the same size
  S = Math.max(2, Math.round(Math.min(W / 400, H / 250)));
  VW = W / S; VH = H / S;
  ctx.imageSmoothingEnabled = false;
  if (typeof lightCv !== 'undefined') sizeLight();
}

/* ================= input ================= */
const keys = new Set();
const mouse = { x: 0, y: 0, down: false, rdown: false, wx: 0, wy: 0 };
const pressed = new Set(); // edge-triggered this frame
addEventListener('keydown', e => {
  const k = e.key.toLowerCase();
  if (!keys.has(k)) pressed.add(k);
  keys.add(k);
  if ([' ', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(k)) e.preventDefault();
  AU.unlock();
});
addEventListener('keyup', e => keys.delete(e.key.toLowerCase()));
addEventListener('blur', () => { keys.clear(); mouse.down = mouse.rdown = false; if (G.state === 'play') setPause(true); });
cv.addEventListener('pointermove', e => { mouse.x = e.clientX * DPR; mouse.y = e.clientY * DPR; });
cv.addEventListener('pointerdown', e => {
  mouse.x = e.clientX * DPR; mouse.y = e.clientY * DPR;
  if (e.button === 0) { mouse.down = true; pressed.add('lmb'); }
  if (e.button === 2) { mouse.rdown = true; pressed.add('rmb'); }
  AU.unlock();
});
addEventListener('pointerup', e => { if (e.button === 0) mouse.down = false; if (e.button === 2) mouse.rdown = false; });
cv.addEventListener('contextmenu', e => e.preventDefault());

/* ================= audio (tiny synth) ================= */
const AU = {
  ac: null, master: null, muted: false, last: {},
  unlock() {
    if (this.ac) { if (this.ac.state === 'suspended') this.ac.resume(); return; }
    try {
      this.ac = new (window.AudioContext || window.webkitAudioContext)();
      this.master = this.ac.createGain(); this.master.gain.value = this.muted ? 0 : .32;
      const comp = this.ac.createDynamicsCompressor();
      this.master.connect(comp); comp.connect(this.ac.destination);
      const len = this.ac.sampleRate * 1;
      this.nbuf = this.ac.createBuffer(1, len, this.ac.sampleRate);
      const d = this.nbuf.getChannelData(0); for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    } catch (e) { this.ac = null; }
  },
  gate(name, gap) { const t = performance.now(); if (this.last[name] && t - this.last[name] < gap) return false; this.last[name] = t; return true; },
  tone(f, dur, type = 'square', vol = .2, f2 = null, delay = 0) {
    if (!this.ac || this.muted) return;
    const t = this.ac.currentTime + delay, o = this.ac.createOscillator(), g = this.ac.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t);
    if (f2) o.frequency.exponentialRampToValueAtTime(Math.max(20, f2), t + dur);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + .005); g.gain.exponentialRampToValueAtTime(.0008, t + dur);
    o.connect(g); g.connect(this.master); o.start(t); o.stop(t + dur + .02);
  },
  noise(dur, vol = .2, ff = 1200, ff2 = null, q = 1, delay = 0) {
    if (!this.ac || this.muted) return;
    const t = this.ac.currentTime + delay, s = this.ac.createBufferSource(), f = this.ac.createBiquadFilter(), g = this.ac.createGain();
    s.buffer = this.nbuf; s.loop = true; f.type = 'bandpass'; f.Q.value = q; f.frequency.setValueAtTime(ff, t);
    if (ff2) f.frequency.exponentialRampToValueAtTime(ff2, t + dur);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.0008, t + dur);
    s.connect(f); f.connect(g); g.connect(this.master); s.start(t, Math.random() * .5); s.stop(t + dur + .02);
  },
  setMuted(m) { this.muted = m; if (this.master) this.master.gain.value = m ? 0 : .32; $('mute').textContent = m ? '×' : '♪'; }
};
const sfx = {
  shoot() { if (AU.gate('shoot', 45)) { AU.tone(rand(820, 980), .09, 'square', .05, 380); AU.noise(.05, .04, 4000); } },
  hit() { if (AU.gate('hit', 35)) { AU.noise(.07, .12, 1800, 600, 2); AU.tone(rand(180, 230), .06, 'triangle', .1, 90); } },
  block() { if (AU.gate('block', 70)) { AU.tone(1400, .08, 'square', .06, 1100); AU.tone(2100, .05, 'triangle', .05); } },
  kill() { if (AU.gate('kill', 40)) { AU.tone(rand(500, 600), .14, 'square', .07, 120); AU.noise(.12, .08, 900, 200); } },
  boom() { if (AU.gate('boom', 60)) { AU.noise(.45, .35, 400, 60, .8); AU.tone(110, .35, 'sine', .3, 35); } },
  dash() { AU.noise(.18, .13, 900, 3200, 1.5); },
  nova() { AU.tone(300, .5, 'sawtooth', .07, 1200); AU.noise(.4, .15, 2500, 400, 1); AU.tone(600, .5, 'sine', .12, 150); },
  hurt() { AU.tone(220, .25, 'sawtooth', .16, 60); AU.noise(.25, .2, 700, 150); },
  zap() { if (AU.gate('zap', 60)) { AU.noise(.12, .09, 5000, 2000, 3); AU.tone(1600, .08, 'square', .03, 700); } },
  arrow() { if (AU.gate('arrow', 60)) AU.noise(.12, .08, 3000, 1200, 4); },
  heart() { [660, 880, 1320].forEach((f, i) => AU.tone(f, .14, 'triangle', .12, null, i * .06)); },
  spawn() { if (AU.gate('spawn', 120)) AU.tone(140, .3, 'sine', .06, 320); },
  fuse() { if (AU.gate('fuse', 110)) AU.tone(900, .05, 'square', .04); },
  clear() { [523, 659, 784, 1046, 1318].forEach((f, i) => AU.tone(f, .5, 'triangle', .13, null, i * .09)); },
  pick() { [784, 988, 1175, 1568].forEach((f, i) => AU.tone(f, .25, 'square', .06, null, i * .05)); AU.noise(.5, .06, 6000, 2000, 2); },
  hover() { if (AU.gate('hover', 60)) AU.tone(1200, .04, 'square', .03); },
  roar() { AU.tone(70, 1.4, 'sawtooth', .22, 40); AU.noise(1.4, .2, 300, 90, .7); },
};

/* ================= sprites ================= */
const PAL = {
  k: '#160f24', p: '#5a36a0', P: '#8e66db', y: '#ffd166', s: '#f4c8a3', S: '#d79b7c', e: '#160f24', h: '#e9e3ff',
  r: '#3550c7', R: '#5d84f0', d: '#232c78', w: '#ece6d2', b: '#a99f86', g: '#5fd068', G: '#a6f08a', W: '#f2fff0', D: '#2e8c45',
  m: '#7d8aa3', M: '#c3cde0', n: '#4b5670', c: '#f1e3c4', C: '#c9b48e', v: '#6c4bb8', V: '#a688f0', x: '#7ae7ff', q: '#ff4d6d', u: '#b8304f',
  o: '#ff8a3d', a: '#3c2b5c', t: '#9b2f3d', T: '#e2556a', z: '#2a1d42'
};
function makeCanvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d'); x.imageSmoothingEnabled = false; return [c, x]; }
function spr(rows, pal = PAL) {
  const h = rows.length, w = Math.max(...rows.map(r => r.length));
  const [c, x] = makeCanvas(w, h), [wc, wx] = makeCanvas(w, h);
  for (let j = 0; j < h; j++) for (let i = 0; i < rows[j].length; i++) {
    const ch = rows[j][i]; if (ch === '.' || ch === ' ') continue;
    x.fillStyle = pal[ch] || '#f0f'; x.fillRect(i, j, 1, 1);
    wx.fillStyle = '#fff'; wx.fillRect(i, j, 1, 1);
  }
  return { c, wc, w, h };
}
function tinted(sp, color) {
  const [c, x] = makeCanvas(sp.w, sp.h);
  x.drawImage(sp.c, 0, 0); x.globalCompositeOperation = 'source-in'; x.fillStyle = color; x.fillRect(0, 0, sp.w, sp.h);
  return c;
}
const SLIME_PAL = { ...PAL, g: '#5fb8ff', G: '#bfe8ff', W: '#ffffff', D: '#2f6fc0' };
const MAGE_TOP = [
  '......kkk...',
  '.....kPPk...',
  '.....kPpk...',
  '....kPppk...',
  '....kPpppk..',
  '...kyyyyyk..',
  '.kkppppppppk',
  '..khssssshk.',
  '..khsesesk..',
  '...kssSSk...',
  '..kRrrrrrk..',
  '.kRRrrrrrdk.',
  '.ksRrrrrdsk.',
  '..kRrrrrdk..',
  '..kRrrrrdk..',
  '..kddddddk..',
];
const MAGE_FEET = ['...kk..kk...', '..kk....kk..', '...kkkkk....', '....kkkk....'];
const SPR = {};
function buildSprites() {
  SPR.mage = MAGE_FEET.map(f => spr([...MAGE_TOP, f]));
  SPR.mageGhost = tinted(SPR.mage[0], '#7ae7ff');
  SPR.slime = [spr([
    '.....kkkk.....',
    '...kkggggkk...',
    '..kgGGggggDk..',
    '.kgGWGggggggk.',
    '.kgGGgggggggk.',
    'kggggkggkgggDk',
    'kggggggggggDDk',
    'kgggggggggDDDk',
    '.kDDggggDDDDk.',
    '..kkkkkkkkkk..',
  ], SLIME_PAL), spr([
    '...kkkk...',
    '.kkgGggkk.',
    'kgGWgggggk',
    'kggkggkgDk',
    'kggggggDDk',
    '.kDDDDDDk.',
    '..kkkkkk..',
  ], SLIME_PAL)];
  SPR.bat = [spr([
    'k..............k',
    'kvk............kvk',
    'kvvk..k....k..kvvk',
    '.kvvkkvkkkkvkkvvk.',
    '..kvvvkvvvvkvvvk..',
    '...kkvqvvqvvkk....',
    '.....kvvvvvk......',
    '......kvkvk.......',
  ].map(r => r.slice(0, 18))), spr([
    '......k....k......',
    '.....kvkkkkvk.....',
    '...kkkvqvvqvkkk...',
    '.kkvvvvvvvvvvvvkk.',
    'kvvvk.kvvvvk.kvvvk',
    'kvk....kkkk....kvk',
    'k..............k..',
  ])];
  SPR.skel = spr([
    '....kkkk....',
    '...kwwwwk...',
    '..kwwwwwwk..',
    '..kwkkwkkw..',
    '..kwqkwqkk..',
    '..kwwwwwwk..',
    '...kwkwkk...',
    '....kwwk....',
    '..kkbwwbkk..',
    '.kw.kwwk.wk.',
    '.kb.kbbk.bk.',
    '....kwwk....',
    '...kwkkwk...',
    '...kw..wk...',
    '...kb..bk...',
    '..kkk..kkk..',
  ]);
  SPR.shroom = spr([
    '....kkkk....',
    '..kkttttkk..',
    '.ktTwttttwk.',
    'kttttttttttk',
    'ktwttTttwttk',
    'kuuuuuuuuuuk',
    '.kkkkkkkkkk.',
    '...kcccck...',
    '...kekekk...',
    '...kccCck...',
    '....kcCk....',
    '...kk..kk...',
  ]);
  SPR.knight = spr([
    '....kkkkk.....',
    '...kmMMmmk....',
    '..kmMmmmmnk...',
    '..kmkkkkknk...',
    '..kmkqkqknk...',
    '..kmmmmmmnk...',
    '.kkmmmmmmnkk..',
    'kmMmmmmmmmmnk.',
    'kmMmmyymmmmnk.',
    '.kkmmmmmmnkk..',
    '..kmmmmmmnk...',
    '..kmmmknnnk...',
    '..kmnk.knnk...',
    '..kkk...kkk...',
  ]);
  SPR.wraith = spr([
    '....kkkkk.....',
    '...kvVVvvk....',
    '..kvVvvvvvk...',
    '..kvkkkkkvk...',
    '..kvkxkxkvk...',
    '..kvkkkkkvk...',
    '.kvvvvvvvvvk..',
    'kvVvvvvvvvvvk.',
    'kvVvvvavvvvak.',
    '.kvvvvvvvvak..',
    '..kvvvvvvak...',
    '...kvvkvak....',
    '....kv..ka....',
    '.....k...k....',
  ]);
  SPR.heart = spr([
    '.kk.kk.',
    'kTqkqqk',
    'kTqqqqk',
    '.kqqquk',
    '..kquk.',
    '...kk..',
  ]);
  SPR.heartE = spr([
    '.kk.kk.',
    'kaakaak',
    'kaaaaak',
    '.kaaak.',
    '..kak..',
    '...k...',
  ]);
  // stone pillar: built procedurally for shading
  SPR.pillar = {}; SPR.tree = {};
  for (const th of THEMES) { SPR.pillar[th.id] = [0, 1, 2].map(v => buildPillar(th, v)); SPR.tree[th.id] = [buildTree(th, 0), buildTree(th, 1)]; }
}
function buildPillar(th, variant) {
  // variant 0: whole column, 1: whole with vines, 2: broken stump
  const w = 16, h = 40, [c, x] = makeCanvas(w, h), M = th.marble, o = M[0];
  // capital
  x.fillStyle = o; x.fillRect(0, 0, w, 7);
  x.fillStyle = M[3]; x.fillRect(1, 1, w - 2, 5);
  x.fillStyle = M[4]; x.fillRect(1, 1, w - 2, 1);
  x.fillStyle = M[2]; x.fillRect(1, 5, w - 2, 1); x.fillRect(3, 3, w - 6, 1);
  // shaft, lit from the upper left
  x.fillStyle = o; x.fillRect(2, 7, w - 4, h - 12);
  for (let i = 3; i < w - 3; i++) {
    const t = (i - 3) / (w - 7);
    x.fillStyle = t < .2 ? M[4] : t < .45 ? M[3] : t < .75 ? M[2] : M[1];
    x.fillRect(i, 7, 1, h - 13);
  }
  x.globalAlpha = .45; x.fillStyle = M[1];
  for (const fx of [5, 8, 11]) x.fillRect(fx, 8, 1, h - 15);
  x.globalAlpha = 1;
  // veins in the marble
  x.fillStyle = M[2];
  for (let k = 0; k < 3; k++) { let vx = randi(4, 11), vy = randi(10, 28); for (let s = 0; s < 6; s++) { x.fillRect(vx, vy, 1, 1); vx += randi(-1, 1); vy += 1; if (vx < 3 || vx > w - 4) break; } }
  // plinth
  x.fillStyle = o; x.fillRect(0, h - 6, w, 6);
  x.fillStyle = M[2]; x.fillRect(1, h - 5, w - 2, 4); x.fillStyle = M[3]; x.fillRect(1, h - 5, w - 2, 1); x.fillStyle = M[1]; x.fillRect(1, h - 2, w - 2, 1);
  if (variant === 1) {
    for (let k = 0; k < 26; k++) { const vy = randi(6, h - 4), vx = 3 + Math.round((Math.sin(vy * .5) + 1) * 4.5); x.fillStyle = Math.random() < .3 ? th.tuft[2] : th.tuft[0]; x.fillRect(vx, vy, 1, 1); if (Math.random() < .3) x.fillRect(vx + 1, vy, 1, 1); }
  }
  if (variant === 2) {
    // snap the column off with a jagged edge
    for (let i = 0; i < w; i++) {
      const cut = 14 + ((i * 7) % 5) + (i > 8 ? 2 : 0);
      x.clearRect(i, 0, 1, cut);
      if (i >= 2 && i < w - 2) { x.fillStyle = o; x.fillRect(i, cut, 1, 1); x.fillStyle = M[4]; x.fillRect(i, cut + 1, 1, 1); }
    }
  }
  return { c, w, h };
}
function blobShade(x, cx, cy, discs, P) {
  // pixel-shaded union of discs: P = [outline, dark, mid, light]; light comes from the upper left
  let minx = 1e9, miny = 1e9, maxx = -1e9, maxy = -1e9;
  for (const [dx, dy, r] of discs) { minx = Math.min(minx, dx - r); maxx = Math.max(maxx, dx + r); miny = Math.min(miny, dy - r); maxy = Math.max(maxy, dy + r); }
  const inside = (px, py) => { for (const [dx, dy, r] of discs) if ((px - dx) ** 2 + (py - dy) ** 2 <= r * r) return [dx, dy, r]; return null; };
  for (let py = Math.floor(miny) - 1; py <= maxy + 1; py++) for (let px = Math.floor(minx) - 1; px <= maxx + 1; px++) {
    const d = inside(px, py);
    if (!d) { if (inside(px + 1, py) || inside(px - 1, py) || inside(px, py + 1) || inside(px, py - 1)) { x.fillStyle = P[0]; x.fillRect(cx + px, cy + py, 1, 1); } continue; }
    const s = ((px - d[0]) + (py - d[1])) / d[2] + (Math.random() - .5) * .35;
    x.fillStyle = s < -.75 ? P[3] : s < .15 ? P[2] : P[1];
    x.fillRect(cx + px, cy + py, 1, 1);
  }
}
function buildTree(th, variant) {
  const W_ = 46, H_ = 56;
  const [trunk, tx] = makeCanvas(W_, H_), [crown, cx] = makeCanvas(W_, H_);
  tx.fillStyle = '#2a1a10'; tx.fillRect(19, 30, 8, 26);
  tx.fillStyle = th.trunk[0]; tx.fillRect(20, 30, 6, 25);
  tx.fillStyle = th.trunk[1]; tx.fillRect(20, 30, 2, 25);
  tx.fillStyle = '#2a1a10'; tx.fillRect(16, 53, 14, 3); tx.fillStyle = th.trunk[0]; tx.fillRect(17, 53, 12, 2);
  const discs = variant ? [[0, 0, 12], [-9, 5, 9], [9, 5, 9], [0, -9, 9], [-5, 10, 8], [6, 10, 8]] : [[0, 0, 14], [-11, 4, 9], [11, 3, 9], [-4, -10, 9], [6, -8, 8]];
  blobShade(cx, 23, 22, discs, th.leaf);
  // a few sunlit leaf clusters
  cx.fillStyle = th.leaf[3];
  for (let k = 0; k < 14; k++) { const a = rand(TAU), r = rand(3, 11); const px = Math.round(23 - 4 + Math.cos(a) * r), py = Math.round(22 - 5 + Math.sin(a) * r * .8); if (cx.getImageData(px, py, 1, 1).data[3]) cx.fillRect(px, py, 2, 1); }
  return { trunk, crown, w: W_, h: H_ };
}
function heartURL(full) { const s = full ? SPR.heart : SPR.heartE; const [c, x] = makeCanvas(s.w * 4, s.h * 4); x.drawImage(s.c, 0, 0, s.w * 4, s.h * 4); return c.toDataURL(); }
function hexRgb(h) { const n = parseInt(h.slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; }

/* ================= themes ================= */
// grass/dirt/tuft/bush/leaf ramps go dark -> light; marble = [outline, shade, mid, light, highlight]
const THEMES = [
  { id: 'meadow', bg: '#3c7f3a',
    grass: ['#3f8f3f', '#55a748', '#6fbf55', '#8fd168'], dirt: ['#a7834f', '#c39d63', '#8a6a3e'],
    tuft: ['#357a36', '#5fae4a', '#a6de72', '#e4f7a8'], bush: ['#1b3a20', '#2c6532', '#3f8a3e', '#66b152'],
    leaf: ['#1b3a20', '#2f6b35', '#4a9a42', '#7cc85c'], trunk: ['#6b4a2e', '#8c6440'],
    cliff: ['#f2dca6', '#dcbb80', '#bb9159', '#82603a'],
    marble: ['#4b5160', '#aab2c4', '#d6dce8', '#eef1f7', '#ffffff'],
    flowers: ['#ffffff', '#ffe066', '#ffc4e1'], petals: ['#ffffff', '#fff3b0', '#ffd6ea'],
    rune: '#ffe58a', dark: [0, 0, 0, 0], warm: [255, 236, 170, .2], cool: [20, 50, 80, .14], cloud: .17, shaft: '#fff1c4', flowerRate: .12 },
  { id: 'bloom', bg: '#357a42',
    grass: ['#3a8848', '#4fa155', '#69b85e', '#8ccd75'], dirt: ['#a58552', '#bf9c66', '#876a40'],
    tuft: ['#327a3c', '#57a854', '#9fd67a', '#e2f5b0'], bush: ['#1a3824', '#2a6236', '#3c8743', '#5fab55'],
    leaf: ['#1a3824', '#2c6838', '#469a4a', '#7ccc6a'], trunk: ['#6b4a2e', '#8c6440'],
    cliff: ['#f0d6b0', '#d8b48a', '#b48c62', '#7d5d3f'],
    marble: ['#504b60', '#b4abc6', '#ddd6ea', '#f3effa', '#ffffff'],
    flowers: ['#ff8fc4', '#c99bff', '#ffffff', '#ffd166', '#ff6f91'], petals: ['#ffb3d6', '#ffffff', '#e2c6ff'],
    rune: '#ffd0f0', dark: [0, 0, 0, 0], warm: [255, 226, 200, .2], cool: [40, 30, 90, .14], cloud: .15, shaft: '#ffe6f2', flowerRate: .38 },
  { id: 'golden', bg: '#8a8434',
    grass: ['#8a8a32', '#a6a243', '#c2b855', '#ddcb70'], dirt: ['#b38a52', '#cba06a', '#8f6b3f'],
    tuft: ['#7f7a2c', '#b0a445', '#e6d27e', '#fff0b8'], bush: ['#3a2c12', '#6b5520', '#977a2c', '#c7a447'],
    leaf: ['#4a240f', '#a3461c', '#d6732a', '#f5b04a'], trunk: ['#5e3f26', '#80593a'],
    cliff: ['#f5d9a0', '#e0b874', '#c08a4a', '#87582e'],
    marble: ['#5a4d44', '#bcae9c', '#e2d6c4', '#f6eee2', '#ffffff'],
    flowers: ['#ff9d3d', '#ffffff', '#ffd166'], petals: ['#f5b04a', '#e86a3a', '#ffd166'],
    rune: '#ffd27a', dark: [0, 0, 0, 0], warm: [255, 206, 130, .26], cool: [60, 40, 70, .16], cloud: .14, shaft: '#ffd99a', flowerRate: .06 },
  { id: 'dusk', bg: '#2c4a33',
    grass: ['#3a5b44', '#4c704c', '#628756', '#7f9f64'], dirt: ['#7d6550', '#977a5e', '#5f4b3c'],
    tuft: ['#34533d', '#557a4f', '#97b276', '#e8d4a8'], bush: ['#141c1f', '#263a34', '#375243', '#56704e'],
    leaf: ['#141c1f', '#2a3d38', '#40594a', '#7a8a5e'], trunk: ['#4a3426', '#6b4c36'],
    cliff: ['#e8b49a', '#c58e78', '#9a6a5c', '#5e4048'],
    marble: ['#45394d', '#a998b0', '#d6c4d6', '#f2e2ee', '#fff6fb'],
    flowers: ['#ffd1a6', '#c8a6ff', '#ffffff'], petals: ['#ffc89a', '#ffb0c8', '#ffe6b0'],
    rune: '#ffb0e0', dark: [46, 22, 58, .3], warm: [255, 150, 110, .3], cool: [60, 30, 100, .22], cloud: .14, shaft: '#ffb08a', flowerRate: .1 },
];
