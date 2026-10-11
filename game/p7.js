
/* ================= level-clear ritual: the circle answers ================= */
const RITUAL_ORBS = 36;
function startRitual(last) { G.ritual = { t: -.9, orbs: [], sent: 0, arrived: 0, acc: 0, last, burst: false, done: false }; }
function updateRitual(dt) {
  const R = G.ritual; if (!R) return;
  R.t += dt;
  const cx = arena.w / 2, cy = arena.h / 2, col = arena.theme.rune;
  if (R.t >= 0 && !R.awake) {
    R.awake = true; G.cine = true;
    AU.tone(220, 1.2, 'sine', .12, 440); AU.tone(330, 1.2, 'sine', .08, 660); AU.noise(1.2, .08, 3000, 8000, 2);
    fx.push({ k: 'ring', x: cx, y: cy, r0: 10, r1: 80, t: 0, max: .7, col: '#ffffff', w: 2 });
  }
  G.camFocus = R.t > 0 && R.t < 1.45 ? { x: cx, y: cy - 10 } : null;
  if (R.t > 0 && !R.burst) for (let i = 0; i < 3; i++) { const a = rand(TAU), r = rand(38, 56); addPart(cx + Math.cos(a) * r, cy + Math.sin(a) * r * .62, 0, 0, 0, rand(30, 80), rand(.5, 1), ['#ffffff', col], 1, { add: true }); }
  if (R.t > .9 && R.sent < RITUAL_ORBS) {
    R.acc += dt;
    while (R.acc > .03 && R.sent < RITUAL_ORBS) {
      R.acc -= .03; R.sent++;
      const a = rand(TAU), r = rand(40, 54);
      R.orbs.push({ sx: cx + Math.cos(a) * r, sy: cy + Math.sin(a) * r * .62, t: 0, dur: rand(.8, 1.15), h: rand(50, 110), side: rand(-70, 70), trail: [], col: pick(['#ffffff', col, '#8fe6ff', '#ffe58a']) });
      if (AU.gate('rlaunch', 60)) AU.tone(rand(700, 1000), .08, 'sine', .03, 1400);
    }
  }
  for (const o of R.orbs) {
    if (o.done) continue;
    o.t += dt;
    const p = clamp(o.t / o.dur, 0, 1), e = easeInOut(p);
    const ex = player.x, ey = player.y - 8, mx = (o.sx + ex) / 2 + o.side, my = Math.min(o.sy, ey) - o.h;
    o.x = (1 - e) * (1 - e) * o.sx + 2 * (1 - e) * e * mx + e * e * ex;
    o.y = (1 - e) * (1 - e) * o.sy + 2 * (1 - e) * e * my + e * e * ey;
    o.trail.push(o.x, o.y); if (o.trail.length > 18) o.trail.splice(0, 2);
    if (p >= 1) {
      o.done = true; R.arrived++; G.pglow = 1;
      for (let i = 0; i < 4; i++) addPart(ex, ey, 0, rand(-40, 40), rand(-40, 40), 0, .3, ['#ffffff', o.col], 1, { add: true, drag: 5 });
      if (AU.gate('rarrive', 40)) AU.tone(500 + R.arrived * 22, .07, 'triangle', .05);
    }
  }
  if (!R.burst && R.sent >= RITUAL_ORBS && R.arrived >= RITUAL_ORBS) {
    R.burst = true; R.burstT = R.t;
    const x = player.x, y = player.y;
    fx.push({ k: 'ring', x, y, r0: 4, r1: 70, t: 0, max: .6, col: '#ffffff', w: 2 });
    fx.push({ k: 'ring', x, y, r0: 2, r1: 46, t: 0, max: .45, col, w: 2 });
    fx.push({ k: 'flash', x, y, r: 90, t: 0, max: .45, col });
    for (let i = 0; i < 40; i++) { const a = rand(TAU), s = rand(40, 150); addPart(x, y - 6, 6, Math.cos(a) * s, Math.sin(a) * s * .7, rand(40, 140), rand(.5, 1), ['#ffffff', col, '#ffe58a'], rand(1, 2), { add: true, g: 120, drag: 2 }); }
    player.sqx = .7; player.sqy = 1.4; addShake(.35); G.hitstop = .05;
    sfx.pick(); AU.tone(523, .8, 'triangle', .1); AU.tone(784, .8, 'triangle', .08); AU.tone(1046, .9, 'triangle', .07);
  }
  if (R.burst && R.t - R.burstT > .85 && !R.done) {
    R.done = true; G.cine = false; G.camFocus = null;
    if (R.last) startFinale();
    else if (G.level === 2 && player.dashMax < 2) {
      startComic(INTERLUDE, () => { unlockDash(); openPick(); }, { hint: '按任意键继续', key: 'interlude' });
    } else if (G.endless && G.loop % 6 === 0) startTrialEvent(() => openPick());
    else if (G.level === 5) startGhostEvent();
    else openPick();
  }
}
function drawRitualGround() {
  const R = G.ritual; if (!R || R.t < 0) return;
  const k = clamp(R.t / .8, 0, 1) * (R.burst ? clamp(1 - (R.t - R.burstT) / .8, 0, 1) : 1);
  if (k <= 0) return;
  const cx = arena.w / 2, cy = arena.h / 2, col = arena.theme.rune;
  ctx.globalCompositeOperation = 'lighter';
  ctx.imageSmoothingEnabled = true;
  ctx.globalAlpha = .55 * k; ctx.drawImage(glowTex(col), cx - 80, cy - 50, 160, 100);
  ctx.imageSmoothingEnabled = false;
  ctx.globalAlpha = k; ctx.fillStyle = col;
  pixRing(cx, cy, 44, .62, 1); pixRing(cx, cy, 56, .62, 1);
  ctx.fillStyle = '#ffffff';
  for (let i = 0; i < 24; i++) { const a = i / 24 * TAU + G.t * .9; ctx.fillRect(Math.round(cx + Math.cos(a) * 50 - 1), Math.round(cy + Math.sin(a) * 50 * .62 - 1), 2, 2); }
  ctx.fillStyle = col;
  const pts = []; for (let i = 0; i < 6; i++) { const a = i / 6 * TAU - G.t * .5; pts.push([cx + Math.cos(a) * 40, cy + Math.sin(a) * 40 * .62]); }
  for (let i = 0; i < 6; i++) { const A = pts[i], B = pts[(i + 2) % 6]; pixLine(A[0], A[1], B[0], B[1]); }
  // pillar of light rising from the circle
  const tex = tintOf(shaftBase, col), hgt = 160 * easeOutCubic(k), wv = 26 + Math.sin(G.t * 9) * 3;
  ctx.imageSmoothingEnabled = true;
  ctx.globalAlpha = .55 * k; ctx.drawImage(tex, cx - wv / 2, cy - hgt, wv, hgt + 10);
  ctx.globalAlpha = .8 * k; ctx.drawImage(tex, cx - wv / 5, cy - hgt, wv / 2.5, hgt + 10);
  ctx.imageSmoothingEnabled = false;
  ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
}
function drawRitualAir() {
  const R = G.ritual; if (!R) return;
  ctx.globalCompositeOperation = 'lighter';
  for (const o of R.orbs) {
    if (o.done) continue;
    for (let i = 0; i < o.trail.length; i += 2) { const q = i / o.trail.length; ctx.globalAlpha = .6 * q; ctx.fillStyle = q > .6 ? o.col : arena.theme.rune; const s = q > .7 ? 2 : 1; ctx.fillRect(Math.round(o.trail[i] - s / 2), Math.round(o.trail[i + 1] - s / 2), s, s); }
    ctx.globalAlpha = .7; ctx.drawImage(glowTex(o.col), o.x - 8, o.y - 8, 16, 16);
    ctx.globalAlpha = 1; ctx.fillStyle = '#ffffff'; ctx.fillRect(Math.round(o.x - 1), Math.round(o.y - 1), 2, 2);
  }
  G.pglow = Math.max(0, (G.pglow || 0) - .03);
  if (G.pglow > 0 || (R.t > .9 && !R.done)) {
    const g = .35 + G.pglow * .5, r = 16 + G.pglow * 10;
    ctx.globalAlpha = g; ctx.drawImage(glowTex(arena.theme.rune), player.x - r, player.y - 8 - r, r * 2, r * 2);
  }
  ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
}

/* ================= intro comic ================= */
const COMIC = [
  { text: '传说，星尘山谷的深处，沉睡着一座由坠星化成的古老法阵。', draw: (c, t) => comicNight(c, t) },
  { text: '这一天，一位英俊得有些过分的年轻法师，循着星光来到了山谷。', draw: (c, t) => comicHero(c, t) },
  { text: '他找到了它。沉睡千年的法阵，回应了他的魔力。', draw: (c, t) => comicCircle(c, t) },
  { text: '「穿越八片山谷，经受历练——星辰之力，便归你所有。」', draw: (c, t) => comicTrial(c, t) },
];

/* ---- panel painting helpers (160x100 art pixels) ---- */
const bandCache = {};
function cBands(c, cols, y0, y1) {
  // dithered sky gradient, painted once and reused every frame
  const key = cols.join() + y0 + ',' + y1;
  if (!bandCache[key]) {
    const [bc, b] = makeCanvas(CW_, CH_), n = cols.length, bay = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
    for (let y = y0; y < y1; y++) for (let x = 0; x < CW_; x++) {
      const f = (y - y0) / (y1 - y0) * (n - 1) + (bay[(y & 3) * 4 + (x & 3)] / 16 - .5) * .9;
      b.fillStyle = cols[clamp(Math.round(f), 0, n - 1)]; b.fillRect(x, y, 1, 1);
    }
    bandCache[key] = bc;
  }
  c.drawImage(bandCache[key], 0, 0);
}
function cRidge(c, base, amp, freq, ph, col) { c.fillStyle = col; for (let x = 0; x < CW_; x++) { const y = Math.round(base + Math.sin(x * freq + ph) * amp + Math.sin(x * freq * 2.7 + ph * 2) * amp * .4); c.fillRect(x, y, 1, CH_ - y); } }
function cGrass(c, y0, cols, t, seed = 1) {
  c.fillStyle = cols[0]; c.fillRect(0, y0, CW_, CH_ - y0);
  for (let x = 0; x < CW_; x += 2) {
    const hgt = 3 + ((x * 7 + seed * 13) % 5), sw = Math.sin(t * 2.2 + x * .09) * 1.4 + (Math.sin(x * .03 - t * 1.5) > .7 ? 1.5 : 0);
    for (let k = 0; k < hgt; k++) { c.fillStyle = k === hgt - 1 ? cols[2] : cols[1]; c.fillRect(x + Math.round(sw * (k / hgt) ** 1.4), y0 - k, 1, 1); }
  }
}
function cGlow(c, x, y, r, col, a) { c.globalCompositeOperation = 'lighter'; c.globalAlpha = a; c.imageSmoothingEnabled = true; c.drawImage(glowTex(col), x - r, y - r, r * 2, r * 2); c.imageSmoothingEnabled = false; c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1; }
function cRing(c, x, y, r, sq, col, k = 1) { c.fillStyle = col; const step = 1 / r; for (let a = 0; a < TAU * k; a += step) c.fillRect(Math.round(x + Math.cos(a - Math.PI / 2) * r), Math.round(y + Math.sin(a - Math.PI / 2) * r * sq), 1, 1); }
function cSpr(c, img, x, y, s, flip) { c.save(); c.translate(Math.round(x), Math.round(y)); c.scale(flip ? -s : s, s); c.drawImage(img, -img.width / 2, -img.height); c.restore(); }
function cStar4(c, x, y, s, col) { c.fillStyle = col; c.fillRect(x, y - s, 1, s * 2 + 1); c.fillRect(x - s, y, s * 2 + 1, 1); if (s > 1) c.fillRect(x - 1, y - 1, 3, 3); }

/* ---- panel 1: night valley, a star falls ---- */
function comicNight(c, t) {
  cBands(c, ['#120f2e', '#1d1846', '#2b2560', '#43397a', '#6a4f8f'], 0, 70);
  for (let i = 0; i < 46; i++) { const x = (i * 37) % CW_, y = (i * 23) % 60, tw = Math.sin(t * 3 + i * 1.7); if (tw > -.3) { c.fillStyle = tw > .7 ? '#ffffff' : '#9f97d8'; c.fillRect(x, y, 1, 1); } }
  c.fillStyle = '#fff3c4'; c.fillRect(128, 10, 6, 6); c.fillStyle = '#1d1846'; c.fillRect(131, 9, 5, 5);
  cRidge(c, 52, 6, .05, 1, '#2a2350'); cRidge(c, 62, 5, .08, 3, '#1c2a3a');
  const land = { x: 98, y: 76 }, p = clamp((t - .3) / 1.1, 0, 1);
  if (p > 0 && p < 1) {
    const sx = lerp(20, land.x, easeInOut(p)), sy = lerp(-6, land.y, easeInOut(p));
    for (let k = 0; k < 14; k++) { const q = k / 14; c.globalAlpha = 1 - q; c.fillStyle = q < .3 ? '#ffffff' : '#ffe58a'; c.fillRect(Math.round(sx - (land.x - 20) / 60 * k), Math.round(sy - (land.y + 6) / 60 * k), 2, 1); }
    c.globalAlpha = 1; cGlow(c, sx, sy, 12, '#ffe58a', .9); c.fillStyle = '#fff'; c.fillRect(Math.round(sx), Math.round(sy), 2, 2);
  }
  cGrass(c, 80, ['#13241c', '#1f3a2a', '#3c6a46'], t);
  if (t > 1.4) {
    const k = clamp((t - 1.4) / .5, 0, 1), pulse = .7 + Math.sin(t * 4) * .3;
    cGlow(c, land.x, land.y, 40 * k, '#ffe58a', .8 * pulse);
    c.globalCompositeOperation = 'lighter'; c.globalAlpha = .35 * k * pulse; c.fillStyle = '#ffe58a';
    for (let i = 0; i < 8; i++) { const a = i / 8 * TAU + t * .3; for (let r = 6; r < 26 * k; r += 2) c.fillRect(Math.round(land.x + Math.cos(a) * r), Math.round(land.y + Math.sin(a) * r * .5), 1, 1); }
    c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1;
    if (t - 1.4 < .2) { c.globalAlpha = 1 - (t - 1.4) / .2; c.fillStyle = '#ffffff'; c.fillRect(0, 0, CW_, CH_); c.globalAlpha = 1; }
  }
}

/* ---- panel 2: the handsome mage ---- */
function comicHero(c, t) {
  // shoujo-style rotating sun rays
  c.fillStyle = '#ffcf7a'; c.fillRect(0, 0, CW_, CH_);
  c.save(); c.translate(80, 46); c.rotate(t * .25); c.fillStyle = '#ffe3a8';
  for (let i = 0; i < 12; i++) { c.rotate(TAU / 12); c.beginPath(); c.moveTo(0, 0); c.lineTo(140, -14); c.lineTo(140, 14); c.closePath(); c.fill(); }
  c.restore();
  for (let i = 0; i < 10; i++) { const x = (i * 53 + t * 30) % 180 - 10, y = (i * 29) % 90 + Math.sin(t * 2 + i) * 4; c.fillStyle = i % 2 ? '#ffffff' : '#ffc4e1'; c.fillRect(Math.round(x), Math.round(y), 2, 1); }
  const intro = easeOutBack(clamp(t / .5, 0, 1));
  drawHeroPortrait(c, 58, 104 - 74 * intro, t);
  // the obligatory sparkle
  const sp = (t * .9) % 2.2;
  if (t > .7 && sp < .45) { const s = Math.round(Math.sin(sp / .45 * Math.PI) * 4); cStar4(c, 100, 32, s, '#ffffff'); cGlow(c, 100, 32, 10, '#ffffff', .6); }
  if (t > .9) { c.font = '8px "Press Start 2P", monospace'; c.fillStyle = '#ffffff'; const b = Math.sin(t * 6) > 0 ? 0 : 1; c.fillText('✦', 116, 22 + b); c.fillText('✦', 26, 70 - b); }
}
function drawHeroPortrait(c, ox, oy, t) {
  const K = '#160f24', P = '#5a36a0', PL = '#8e66db', Y = '#ffd166', Hh = '#eae4ff', HS = '#a99ccf', Sk = '#f6cfaa', SS = '#d99b7c', B = '#4aa8ff', R = '#3550c7', RL = '#5d84f0', RD = '#232c78';
  const px = (x, y, w, h, col) => { c.fillStyle = col; c.fillRect(Math.round(ox + x), Math.round(oy + y), w, h); };
  const wind = Math.sin(t * 2.4);
  // cape / shoulders
  px(2, 58, 50, 20, K); px(3, 59, 48, 19, R); px(3, 59, 14, 19, RL); px(40, 59, 11, 19, RD);
  px(14, 52, 6, 9, K); px(15, 53, 4, 7, RL); px(34, 52, 6, 9, K); px(35, 53, 4, 7, R);   // high collar
  px(25, 60, 4, 4, K); px(26, 61, 2, 2, Y);                                             // clasp
  // flowing hair behind (left side streams in the wind)
  for (let i = 0; i < 6; i++) { const len = 10 + i * 2, sway = Math.round(wind * (1 + i * .4)); px(9 - i + sway, 26 + i * 4, 4, len, K); px(10 - i + sway, 27 + i * 4, 2, len - 1, i % 2 ? HS : Hh); }
  // neck
  px(22, 48, 10, 8, K); px(23, 48, 8, 7, SS);
  // face
  px(15, 25, 24, 22, K); px(16, 25, 22, 21, Sk); px(18, 46, 18, 3, K); px(19, 46, 16, 2, Sk); px(22, 48, 10, 2, K); px(23, 48, 8, 1, Sk);
  px(33, 27, 5, 18, SS);
  // eyes: confident, with a blink every few seconds
  const blink = (t % 3.4) > 3.25;
  px(18, 30, 7, 1, K); px(29, 30, 7, 1, K);                          // brows, slanted
  px(18, 29, 3, 1, K); px(33, 29, 3, 1, K);
  if (blink) { px(19, 34, 5, 1, K); px(29, 34, 5, 1, K); }
  else {
    px(19, 33, 5, 3, K); px(20, 33, 3, 2, B); px(20, 33, 1, 1, '#ffffff');
    px(29, 33, 5, 3, K); px(30, 33, 3, 2, B); px(30, 33, 1, 1, '#ffffff');
  }
  px(26, 36, 1, 3, SS); px(25, 39, 2, 1, SS);                         // nose
  px(23, 42, 7, 1, '#9c4a4a'); px(29, 41, 2, 1, '#9c4a4a');           // smirk
  // bangs
  for (let i = 0; i < 8; i++) { const x = 15 + i * 3, d = 3 + ((i * 5) % 4); px(x, 22, 4, d + 2, K); px(x + 1, 22, 2, d + 1, i % 3 ? Hh : HS); }
  px(13, 22, 4, 14, K); px(14, 22, 2, 13, Hh); px(38, 22, 3, 10, K); px(38, 22, 2, 9, HS);
  // hat: brim + cone bending back
  px(4, 18, 46, 6, K); px(5, 19, 44, 4, P); px(5, 19, 44, 1, PL);
  for (let y = 0; y < 18; y++) {
    const q = y / 18, l = Math.round(lerp(34, 14, q ** .8)), r = Math.round(lerp(40, 40, q)) + Math.round(wind * (1 - q) * 1.5);
    px(l - 1, y, r - l + 2, 1, K); px(l, y, r - l, 1, P); px(l, y, 2, 1, PL);
  }
  px(14, 14, 27, 3, Y); px(25, 13, 3, 5, '#ffffff'); px(24, 14, 5, 3, Y);
}

/* ---- panel 3: he finds the circle ---- */
function comicCircle(c, t) {
  cBands(c, ['#8fd3ff', '#b3e2ff', '#d6f0ff', '#f2fbff'], 0, 50);
  c.fillStyle = '#ffffff'; for (let i = 0; i < 3; i++) { const x = ((i * 70 + t * 6) % 200) - 30, y = 8 + i * 9; c.fillRect(Math.round(x), y, 22, 4); c.fillRect(Math.round(x) + 5, y - 3, 12, 3); }
  cRidge(c, 40, 4, .06, 2, '#8fb8c8'); cRidge(c, 48, 4, .09, 5, '#6fa36a');
  cGrass(c, 56, ['#4f9e48', '#62b04f', '#a6de72'], t, 3);
  const cx = 96, cy = 74, k = clamp((t - .6) / 1.2, 0, 1);
  // marble stones and two pillars
  for (let a = 0; a < TAU; a += .38) { c.fillStyle = '#aab2c4'; c.fillRect(Math.round(cx + Math.cos(a) * 30 - 2), Math.round(cy + Math.sin(a) * 11 - 1), 4, 3); c.fillStyle = '#eef1f7'; c.fillRect(Math.round(cx + Math.cos(a) * 30 - 2), Math.round(cy + Math.sin(a) * 11 - 1), 3, 1); }
  const pil = SPR.pillar.meadow[1].c; c.drawImage(pil, 52, 38); c.drawImage(SPR.pillar.meadow[2].c, 132, 42);
  if (k > 0) {
    cGlow(c, cx, cy, 34 * k, '#ffe58a', .7 * k);
    c.globalCompositeOperation = 'lighter';
    cRing(c, cx, cy, 30, .37, '#ffe58a', k); cRing(c, cx, cy, 22, .37, '#ffffff', k);
    if (k >= 1) {
      const h = clamp((t - 1.8) / .6, 0, 1) * 80;
      c.globalAlpha = .45 + Math.sin(t * 8) * .1; c.fillStyle = '#fff1c4'; c.fillRect(cx - 6, cy - h, 12, h); c.globalAlpha = .8; c.fillStyle = '#ffffff'; c.fillRect(cx - 2, cy - h, 4, h);
      c.globalAlpha = 1;
      for (let i = 0; i < 6; i++) { const yy = cy - ((t * 30 + i * 13) % 60); c.fillStyle = '#ffe58a'; c.fillRect(cx + Math.round(Math.sin(t * 3 + i) * 10), Math.round(yy), 1, 1); }
    }
    c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1;
  }
  // the hero walks in from the left, then stops and looks
  const walk = clamp(t / .9, 0, 1), hx = lerp(-10, 40, easeOutCubic(walk));
  const fr = walk < 1 ? Math.floor(t * 8) % 2 : 3;
  c.globalAlpha = .3; c.fillStyle = '#1f4a2a'; c.fillRect(Math.round(hx) - 6, 84, 14, 2); c.globalAlpha = 1;
  cSpr(c, SPR.mage[fr].c, hx, 85, 2, false);
  if (t > 1 && t < 2.2) { const b = easeOutBack(clamp((t - 1) / .25, 0, 1)); c.fillStyle = '#ffffff'; c.fillRect(Math.round(hx) + 8, Math.round(48 - 6 * b), 3, 7); c.fillRect(Math.round(hx) + 8, 50, 3, 2); c.fillStyle = '#160f24'; c.fillRect(Math.round(hx) + 9, Math.round(49 - 6 * b), 1, 5); c.fillRect(Math.round(hx) + 9, 50, 1, 1); }
}

/* ---- panel 4: the trial begins ---- */
function comicTrial(c, t) {
  c.fillStyle = '#1c1238'; c.fillRect(0, 0, CW_, CH_);
  // radial speed lines
  c.save(); c.translate(80, 60); c.fillStyle = '#2e2058';
  for (let i = 0; i < 28; i++) { const a = i / 28 * TAU + Math.sin(t * 7 + i) * .02; c.save(); c.rotate(a); c.fillRect(20 + ((t * 80 + i * 17) % 30), -1, 70, 2); c.restore(); }
  c.restore();
  const cx = 80, cy = 82, pulse = .75 + Math.sin(t * 5) * .25;
  // monsters close in from the dark
  const mon = (sp, x, y, s, flip, eyes) => { const img = tintOf(sp, '#0a0614'); cSpr(c, img, x, y, s, flip); c.fillStyle = '#ff4d6d'; for (const [ex, ey] of eyes) if (Math.sin(t * 3 + ex) > -.8) { c.fillRect(Math.round(x + ex * s), Math.round(y + ey * s), 2, 1); } };
  const close = easeOutCubic(clamp(t / 2, 0, 1)) * 10;
  mon(SPR.slime[0], 18 + close, 92, 2, false, [[-2, -5], [2, -5]]);
  mon(SPR.skel, 142 - close, 92, 2, true, [[-2, -12], [1, -12]]);
  mon(SPR.bat[Math.floor(t * 10) % 2], 30 + close, 30 + Math.sin(t * 4) * 3, 2, false, [[-2, -4], [1, -4]]);
  mon(SPR.bat[Math.floor(t * 10 + 1) % 2], 132 - close, 24 + Math.cos(t * 4) * 3, 2, true, [[-2, -4], [1, -4]]);
  // circle under the hero, aura, orbiting runes
  cGlow(c, cx, cy, 34, '#ffe58a', .5 * pulse);
  c.globalCompositeOperation = 'lighter'; cRing(c, cx, cy, 26, .35, '#ffe58a'); cRing(c, cx, cy, 18, .35, '#ffffff'); c.globalCompositeOperation = 'source-over';
  cGlow(c, cx, cy - 16, 26, '#8fe6ff', .55 * pulse);
  cSpr(c, SPR.mage[3].c, cx, cy + 1, 2, false);
  for (let i = 0; i < 6; i++) { const a = t * 2.4 + i / 6 * TAU, x = cx + Math.cos(a) * 22, y = cy - 18 + Math.sin(a) * 8; c.fillStyle = Math.sin(a) > 0 ? '#ffffff' : '#ffe58a'; c.fillRect(Math.round(x) - 1, Math.round(y) - 1, 2, 2); }
  if (t > 1.6) { const k = clamp((t - 1.6) / .25, 0, 1); c.globalAlpha = (1 - k) * .9; c.fillStyle = '#ffffff'; c.fillRect(0, 0, CW_, CH_); c.globalAlpha = 1; }
}
