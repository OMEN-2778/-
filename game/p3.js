
/* ================= game state ================= */
const G = { state: 'menu', t: 0, level: 0, kills: 0, totalKills: 0, levelT: 0, hitstop: 0, ts: 1, tsTarget: 1,
  iris: 0, irisTarget: 0, irisCb: null, clearT: 0, ups: {}, dmg: 0, runT: 0, spawnAcc: 0, surgeT: 0, boss: null, blockTxtT: 0, later: [], castN: 0, timeField: 0, leechN: 0 };
let player = null, spell = null, arena = null;
let enemies = [], projs = [], eprojs = [], parts = [], texts = [], pickups = [], fx = [], ghosts = [], flames = [], pillars = [], torches = [], spawns = [], motes = [], meteors = [], vortices = [];
const cam = { x: 0, y: 0, shake: 0, kx: 0, ky: 0, zoom: 1, load: 0 };
// Screen shake with diminishing returns: a few hits shake fully, but when many land in a
// short window (chain explosions, corpse bursts, singularities) each extra one adds less.
function addShake(v, force) {
  const k = force ? 1 : 1 / (1 + cam.load * 2.2);
  cam.load += v;
  cam.shake = Math.min(force ? 1.1 : .8, cam.shake + v * k * (1 - cam.shake * .45));
}

const ELEM = {
  arc: ['#ffffff', '#7ae7ff', '#9b6bff'],
  fire: ['#fff4c2', '#ffb347', '#ff4d2e'],
  ice: ['#ffffff', '#c6f6ff', '#5fb0ff'],
  bolt: ['#ffffff', '#fff27a', '#ffae00'],
};

/* ================= arena: sunny valley ================= */
function makeNoise(W_, H_, cell) {
  const gw = Math.ceil(W_ / cell) + 2, gh = Math.ceil(H_ / cell) + 2, g = new Float32Array(gw * gh);
  for (let i = 0; i < g.length; i++) g[i] = Math.random();
  return (x, y) => {
    const fx = x / cell, fy = y / cell, ix = Math.floor(fx), iy = Math.floor(fy), tx = fx - ix, ty = fy - iy;
    const sx = tx * tx * (3 - 2 * tx), sy = ty * ty * (3 - 2 * ty), i0 = iy * gw + ix;
    const a = g[i0], b = g[i0 + 1], c = g[i0 + gw], d = g[i0 + gw + 1];
    return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy;
  };
}
// wind: a gentle base sway plus gust fronts that roll across the valley
const WIND = { x: 1, y: .25 };
function windAt(x, y, t) {
  const base = Math.sin(t * 1.7 + x * .045 + y * .02) * .6;
  const g = Math.sin((x * .9 + y * .35) * .011 - t * 1.25);
  const gust = g > .55 ? ((g - .55) / .45) ** 2 : 0;
  return [base + gust * 2.6, gust];
}
function drawBush(x, cx, cy, r, P) {
  blobShade(x, cx, cy, [[0, 0, r], [-r * .7, r * .25, r * .7], [r * .7, r * .2, r * .7]], P);
}
function buildArena(theme, w, h, nPillars) {
  const pad = 96, CW = w + pad * 2, CH = h + pad * 2;
  const [fc, f] = makeCanvas(CW, CH), [dc] = makeCanvas(CW, CH), [frc, fr] = makeCanvas(CW, CH);
  // ---- dithered grass ground, painted per pixel ----
  const n1 = makeNoise(CW, CH, 30), n2 = makeNoise(CW, CH, 8), nd = makeNoise(CW, CH, 46);
  const GR = theme.grass.map(hexRgb), DR = theme.dirt.map(hexRgb);
  const bayer = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
  const img = f.createImageData(CW, CH), D = img.data;
  for (let y = 0; y < CH; y++) for (let x = 0; x < CW; x++) {
    const b = (bayer[(y & 3) * 4 + (x & 3)] / 16 - .5) * .11;
    const t = n1(x, y) * .78 + n2(x, y) * .22 + b;
    let col = GR[t < .3 ? 0 : t < .54 ? 1 : t < .74 ? 2 : 3];
    const dd = nd(x, y) + b * .8;
    if (dd > .82) col = DR[dd > .87 ? 1 : t < .5 ? 2 : 0];
    const k = (y * CW + x) * 4; D[k] = col[0]; D[k + 1] = col[1]; D[k + 2] = col[2]; D[k + 3] = 255;
  }
  f.putImageData(img, 0, 0);
  const isDirt = (x, y) => nd(x + pad, y + pad) > .8;
  f.save(); f.translate(pad, pad);
  // static blade strokes and pebbles for texture
  for (let i = 0; i < CW * CH / 380; i++) {
    const x = randi(-pad, w + pad), y = randi(-pad, h + pad); if (isDirt(x, y)) continue;
    f.fillStyle = theme.tuft[0]; f.fillRect(x, y, 1, 2); f.fillStyle = theme.tuft[2]; f.fillRect(x, y - 1, 1, 1);
  }
  for (let i = 0; i < 90; i++) {
    const x = randi(0, w), y = randi(0, h);
    f.fillStyle = 'rgba(20,40,20,.35)'; f.fillRect(x + 1, y + 1, 3, 1);
    f.fillStyle = '#9d9a88'; f.fillRect(x, y, 3, 1); f.fillStyle = '#d9d6c4'; f.fillRect(x, y, 1, 1);
  }
  // ancient marble paving ring in the middle
  const M = theme.marble, cx = Math.round(w / 2), cy = Math.round(h / 2);
  for (const R of [44, 52]) for (let a = 0; a < TAU; a += 6.5 / R) {
    if (Math.random() < .38) continue;
    const sx = Math.round(cx + Math.cos(a) * R - 3), sy = Math.round(cy + Math.sin(a) * R * .62 - 2);
    f.fillStyle = 'rgba(20,40,20,.3)'; f.fillRect(sx + 1, sy + 1, 6, 4);
    f.fillStyle = M[1]; f.fillRect(sx, sy, 6, 4); f.fillStyle = M[2]; f.fillRect(sx, sy, 5, 3); f.fillStyle = M[3]; f.fillRect(sx, sy, 5, 1);
    if (Math.random() < .3) { f.fillStyle = M[1]; f.fillRect(sx + randi(1, 4), sy + 1, 1, 2); }
  }
  // ---- cliff along the top edge ----
  const FACE = 30;
  const nc = makeNoise(CW, 64, 6);
  for (let x = -pad; x < w + pad; x++) {
    for (let j = 0; j < FACE; j++) {
      const band = Math.floor((j + nc(x + pad, j) * 5) / 6);
      const shade = j > FACE - 6 ? 3 : band % 2 ? 2 : 1;
      f.fillStyle = theme.cliff[shade]; f.fillRect(x, -FACE + j, 1, 1);
    }
    if (Math.random() < .06) { f.fillStyle = theme.cliff[3]; let yy = -FACE + randi(4, 12); for (let k = 0; k < randi(4, 10); k++) f.fillRect(x + randi(-1, 0), yy++, 1, 1); }
    if (Math.random() < .2) { f.fillStyle = theme.cliff[0]; f.fillRect(x, -FACE + randi(2, 20), 1, 1); }
    // grass lip with drips
    f.fillStyle = theme.bush[1]; f.fillRect(x, -FACE - 2, 1, 3);
    f.fillStyle = theme.tuft[1]; f.fillRect(x, -FACE - 3, 1, 2);
    if (Math.random() < .35) { f.fillStyle = theme.bush[1]; f.fillRect(x, -FACE + 1, 1, randi(1, 4)); }
  }
  for (let i = 0; i < 7; i++) { f.fillStyle = `rgba(20,40,25,${.28 - i * .04})`; f.fillRect(-pad, i, w + pad * 2, 1); }
  // ---- bushes framing the sides; the bottom row goes on the front layer ----
  for (let y = -6; y < h + 14; y += randi(9, 12)) { drawBush(f, -4 + randi(-2, 1), y, randi(8, 11), theme.bush); drawBush(f, w + 4 + randi(-1, 2), y, randi(8, 11), theme.bush); }
  fr.save(); fr.translate(pad, pad);
  for (let x = -10; x < w + 14; x += randi(10, 14)) drawBush(fr, x, h + 8 + randi(-1, 2), randi(9, 12), theme.bush);
  // ---- pillars (with long shadows to the lower right) ----
  pillars = [];
  let guard = 0;
  while (pillars.length < nPillars && guard++ < 600) {
    const p = { x: rand(50, w - 50), y: rand(50, h - 30), r: 8, v: Math.random() < .3 ? 2 : Math.random() < .5 ? 1 : 0 };
    if (Math.hypot(p.x - w / 2, (p.y - h / 2) / .62) < 90) continue;
    if (pillars.some(q => dist(p, q) < 120)) continue;
    pillars.push(p);
  }
  for (const p of pillars) {
    const L = p.v === 2 ? 14 : 28;
    f.fillStyle = 'rgba(15,45,25,.32)';
    for (let k = 0; k < L; k++) f.fillRect(Math.round(p.x - 6 + k * .9), Math.round(p.y + 1 + k * .35), 12, 1);
  }
  // ---- trees around the valley, shadows baked into the ground ----
  const trees = [];
  for (let x = -40; x < w + 60; x += randi(30, 44)) trees.push({ x: x + rand(-6, 6), y: -FACE - rand(10, 34) });
  for (let y = 10; y < h + 40; y += randi(36, 52)) { trees.push({ x: -rand(30, 64), y }); trees.push({ x: w + rand(30, 64), y }); }
  for (let x = -20; x < w + 40; x += randi(48, 70)) trees.push({ x: x + rand(-8, 8), y: h + rand(40, 70) });
  for (const t of trees) {
    t.v = randi(0, 1); t.ph = rand(TAU);
    f.fillStyle = 'rgba(15,45,25,.3)';
    for (let j = -4; j <= 4; j++) { const half = Math.round(Math.sqrt(1 - (j / 5) ** 2) * 15); f.fillRect(Math.round(t.x + 8 - half), Math.round(t.y + j), half * 2, 1); }
  }
  f.restore(); fr.restore();
  // ---- living grass: tufts that sway in the wind ----
  const tufts = [];
  for (let i = 0; i < w * h / 150; i++) {
    const x = randi(4, w - 4), y = randi(6, h - 2);
    if (isDirt(x, y) || pillars.some(p => Math.abs(p.x - x) < 9 && Math.abs(p.y - y) < 5)) continue;
    const fl = Math.random() < theme.flowerRate ? pick(theme.flowers) : null;
    tufts.push({ x, y, h: randi(3, 7), n: randi(2, 3), fl });
  }
  tufts.sort((a, b) => a.y - b.y);
  const clouds = Array.from({ length: 5 }, () => ({ x: rand(-300, w + 300), y: rand(-100, h + 100), s: rand(.9, 1.6) }));
  const shafts = Array.from({ length: 6 }, (_, i) => ({ x: (i + rand(.1, .9)) / 6 * (w + 300) - 150, w: rand(28, 70), ph: rand(TAU) }));
  const flies = Array.from({ length: 9 }, () => ({ x: rand(20, w - 20), y: rand(20, h - 20), z: 10, vx: 0, vy: 0, t: rand(10), col: pick(['#ffffff', '#ffe066', '#9fd8ff', '#ffb0d0']) }));
  torches = [];
  return { w, h, pad, theme, floor: fc, decal: dc, dx: dc.getContext('2d'), front: frc, tufts, trees, clouds, shafts, flies };
}
function updateAmbient(dt) {
  if (!arena) return;
  while (motes.length < 46) motes.push({ x: rand(-40, arena.w + 40), y: rand(-20, arena.h + 20), z: rand(4, 40), ph: rand(TAU), s: rand(.5, 1.2), c: pick(arena.theme.petals) });
  for (const m of motes) {
    const [, gust] = windAt(m.x, m.y, G.t);
    m.ph += dt * m.s * 2;
    m.x += (10 + gust * 40) * m.s * dt; m.y += (2.5 + Math.sin(m.ph) * 6) * dt; m.z = Math.max(2, m.z + Math.cos(m.ph * .7) * 4 * dt);
    if (m.x > arena.w + 60) { m.x = -60; m.y = rand(-20, arena.h + 20); }
  }
  for (const c of arena.clouds) { c.x += 7 * dt; c.y += 1.5 * dt; if (c.x > arena.w + 360) { c.x = -360; c.y = rand(-100, arena.h + 100); } }
  for (const b of arena.flies) {
    b.t += dt;
    if (!b.tx || Math.hypot(b.tx - b.x, b.ty - b.y) < 8 || Math.random() < dt * .3) { b.tx = clamp(b.x + rand(-90, 90), 10, arena.w - 10); b.ty = clamp(b.y + rand(-60, 60), 10, arena.h - 10); }
    let ax = b.tx - b.x, ay = b.ty - b.y;
    if (player && !player.dead) { const d = Math.hypot(b.x - player.x, b.y - player.y); if (d < 34) { ax = (b.x - player.x) * 5; ay = (b.y - player.y) * 5; } }
    const l = Math.hypot(ax, ay) || 1;
    b.vx = damp(b.vx, ax / l * 24, 2, dt); b.vy = damp(b.vy, ay / l * 18, 2, dt);
    b.x += b.vx * dt + Math.sin(b.t * 7) * 6 * dt; b.y += b.vy * dt + Math.cos(b.t * 5) * 5 * dt;
    b.z = 12 + Math.sin(b.t * 2.6) * 5;
  }
}

function decalSplat(x, y, col, n = 10, spread = 6) {
  const d = arena.dx, ox = arena.pad, oy = arena.pad;
  d.globalAlpha = .55;
  for (let i = 0; i < n; i++) { d.fillStyle = col; d.fillRect(Math.round(ox + x + rand(-spread, spread)), Math.round(oy + y + rand(-spread, spread) * .6), randi(1, 2), 1); }
  d.globalAlpha = 1;
}
function decalScorch(x, y, R) {
  const d = arena.dx, ox = arena.pad, oy = arena.pad;
  for (let i = 0; i < R * 3; i++) {
    const a = rand(TAU), r = Math.sqrt(Math.random()) * R;
    d.fillStyle = `rgba(10,6,14,${rand(.15, .35)})`; d.fillRect(Math.round(ox + x + Math.cos(a) * r), Math.round(oy + y + Math.sin(a) * r * .62), 1, 1);
  }
}
function collideWorld(o, r) {
  for (const p of pillars) {
    const dx = o.x - p.x, dy = o.y - p.y, d = Math.hypot(dx, dy), m = r + p.r;
    if (d < m && d > .001) { o.x = p.x + dx / d * m; o.y = p.y + dy / d * m; }
  }
  o.x = clamp(o.x, r, arena.w - r); o.y = clamp(o.y, r + 2, arena.h - r);
}

/* ================= player & spell ================= */
function newPlayer() {
  return { x: 0, y: 0, vx: 0, vy: 0, r: 4, hp: 6, maxHp: 6, face: 1, walkT: 0, frame: 0, moving: false,
    dashT: 0, dashCd: 0, dashDx: 1, dashDy: 0, inv: 0, fireCd: 0, novaCd: 0, sqx: 1, sqy: 1, aim: 0,
    stepT: 0, ghostT: 0, flameT: 0, speed: 82, dashCdMax: .85, dashMax: 1, dashCharges: 1, dashWin: 0, novaCdMax: 7, orbA: 0, dead: false, staffA: 0, charge: 0, spin: 0 };
}
function newSpell() {
  return { dmg: 10, rate: 4.2, speed: 230, life: .72, count: 1, spread: .17, pierce: 0, bounce: 0, size: 1, homing: 0,
    split: 0, explode: 0, burn: 0, frost: 0, chain: 0, crit: .05, orbit: 0, novaN: 12, dashfire: 0,
    slow: 0, form: null, critMul: 2, echo: 0, fourth: 0, corpse: 0, leech: 0, novaFreeze: 0, novaVortex: 0, novaTriple: 0, novaHome: 0, novaTime: 0, novaEcho: 0, formLv: 0, formBr: null, still: 0, halo: 0, rush: 0, luck: 0, keys: 0 };
}
function elemOf() { return spell.chain ? 'bolt' : spell.burn ? 'fire' : spell.frost ? 'ice' : 'arc'; }

function updatePlayer(dt) {
  const p = player;
  if (p.dead) return;
  let ix = 0, iy = 0;
  if (keys.has('a') || keys.has('arrowleft')) ix -= 1;
  if (keys.has('d') || keys.has('arrowright')) ix += 1;
  if (keys.has('w') || keys.has('arrowup')) iy -= 1;
  if (keys.has('s') || keys.has('arrowdown')) iy += 1;
  if (G.cine || ultStunned()) ix = iy = 0;
  const il = Math.hypot(ix, iy); if (il > 0) { ix /= il; iy /= il; }
  p.aim = Math.atan2(mouse.wy - p.y, mouse.wx - p.x);
  p.staffA = p.staffA + angDiff(p.staffA, p.aim) * (1 - Math.exp(-22 * dt));
  const fx_ = Math.cos(p.aim); if (Math.abs(fx_) > .15) p.face = fx_ > 0 ? 1 : -1;

  p.novaCd -= dt; p.fireCd -= dt; p.inv -= dt;
  // dash charges: chain them inside a short window, then the whole set recharges together
  if (p.dashCharges > 0 && p.dashCharges < p.dashMax) { p.dashWin -= dt; if (p.dashWin <= 0) { p.dashCharges = 0; p.dashCd = Math.max(.2, p.dashCdMax - .55); } }
  if (p.dashCharges === 0) { p.dashCd -= dt; if (p.dashCd <= 0) { p.dashCd = 0; p.dashCharges = p.dashMax; } }
  const canAct = G.state === 'play';
  if (canAct && (pressed.has(' ') || pressed.has('shift')) && p.dashCharges > 0) {
    let dx = ix, dy = iy; if (!il) { dx = Math.cos(p.aim); dy = Math.sin(p.aim); }
    const chained = p.dashCharges < p.dashMax;
    if (spell.form === 'wing') { p.wingN = evoLv('wing') >= 1 ? 8 : 5; p.wingT = 0; }
    p.dashCharges--; p.dashWin = .55; if (p.dashCharges === 0) p.dashCd = p.dashCdMax;
    p.dashDx = dx; p.dashDy = dy; p.dashT = evoBr('wing', 'A') ? .22 : .16; evoOnDash(); p.inv = Math.max(p.inv, .22);
    p.sqx = 1.35; p.sqy = .7; sfx.dash(); cam.kx -= dx * 3; cam.ky -= dy * 3;
    if (chained) { AU.tone(1500, .1, 'sine', .05, 2400); fx.push({ k: 'ring', x: p.x, y: p.y, r0: 2, r1: 16, t: 0, max: .25, col: '#8fe6ff', w: 1 }); }
    for (let i = 0; i < 10; i++) addPart(p.x, p.y, 1, rand(-30, 30) - dx * 60, rand(-30, 30) - dy * 60, rand(10, 40), rand(.3, .6), ['#ffffff', '#bfefff', '#5a7ab0'], 1, { g: 60, drag: 3 });
  }
  if (p.dashT > 0) {
    p.dashT -= dt;
    p.vx = p.dashDx * 300; p.vy = p.dashDy * 300;
    if (p.wingN > 0) { p.wingT -= dt; if (p.wingT <= 0) { p.wingT = .03; p.wingN--; wingVolley(); } }
    p.ghostT -= dt; if (p.ghostT <= 0) { p.ghostT = .022; ghosts.push({ x: p.x, y: p.y, f: p.frame, face: p.face, t: 0 }); }
    if (spell.dashfire) { p.flameT -= dt; if (p.flameT <= 0) { p.flameT = .028; flames.push({ x: p.x + rand(-2, 2), y: p.y + rand(-2, 2), t: 0, max: 1.8, hit: new Map() }); } }
  } else {
    const sp = p.speed * (G.state === 'play' || G.state === 'clear' ? 1 : 0) * (1 - (evoBr('laser', 'B') ? 0 : .45) * Math.min(1, p.charge)) * ultSpeedMul();
    p.vx = damp(p.vx, ix * sp, 16, dt); p.vy = damp(p.vy, iy * sp, 16, dt);
  }
  p.x += p.vx * dt; p.y += p.vy * dt;
  collideWorld(p, p.r);
  const spd = Math.hypot(p.vx, p.vy);
  p.moving = spd > 12;
  if (p.moving) {
    p.walkT += dt * (spd / 80) * 10;
    p.frame = Math.floor(p.walkT) % 2;
    p.stepT -= dt * spd / 80;
    if (p.stepT <= 0) { p.stepT = .3; for (let i = 0; i < 3; i++) addPart(p.x + rand(-2, 2), p.y, 0, -p.vx * .15 + rand(-10, 10), -p.vy * .15 + rand(-6, 6), rand(4, 12), rand(.25, .45), ['#cdb98a', '#7da35a'], 1, { g: 50, drag: 4 }); }
  } else { p.walkT = 0; p.frame = 3; }
  p.sqx = damp(p.sqx, 1, 14, dt); p.sqy = damp(p.sqy, 1, 14, dt);

  p.spin = (mouse.down || evoBr('minigun', 'B')) && canAct ? Math.min(1, p.spin + dt * (evoLv('minigun') >= 2 ? 1.6 : .8)) : damp(p.spin, 0, 3, dt);
  const canFire = canAct && !ultBlocksFire();
  if (spell.form === 'laser') {
    // 恒星引擎 charges on its own and fires when full; 极光聚能 keeps charging past full, up to 2.5x
    const auto = evoBr('laser', 'B'), cap = evoBr('laser', 'A') ? 2.5 : 1;
    let release = false;
    if (canFire && (auto || mouse.down)) {
      const was = p.charge;
      p.chargeHeld = (p.chargeHeld || 0) + dt;
      p.charge = Math.min(cap, p.charge + dt * (p.charge < 1 ? 1 / chargeTime() : 1.5 / Math.max(.5, 5 - chargeTime())));
      const [hx, hy] = handPos(p.aim);
      if (p.charge < cap && Math.random() < .8) { const a = rand(TAU); addPart(hx + Math.cos(a) * 14, hy - 8 + Math.sin(a) * 10, 0, -Math.cos(a) * 70, -Math.sin(a) * 50, 0, .2, ['#ffffff', ...ELEM[elemOf()].slice(1)], 1, { add: true }); }
      if (was < 1 && p.charge >= 1) { fx.push({ k: 'ring', x: hx, y: hy, r0: 2, r1: 14, t: 0, max: .25, col: '#ffffff', w: 1 }); AU.tone(1500, .1, 'square', .05, 1900); }
      if (cap > 1 && was < cap && p.charge >= cap) { fx.push({ k: 'ring', x: hx, y: hy, r0: 4, r1: 30, t: 0, max: .4, col: '#ffd166', w: 2 }); AU.tone(1900, .2, 'square', .05, 2600); }
      if (AU.gate('charge', 110) && p.charge < cap) AU.tone(200 + Math.min(1, p.charge) * 600 + Math.max(0, p.charge - 1) * 400, .1, 'sine', .04);
      if (auto && (p.charge >= 1 || (pressed.has('lmb') && p.charge > .2))) release = true;
    } else if (p.charge > 0) release = true;
    else p.chargeHeld = 0;
    if (release) {
      if (p.charge > .2 && canAct) { fireLaser(p.charge); afterCast(); const c = p.charge, extra = (spell.echo ? 1 : 0) + (spell.fourth ? 1 : 0); for (let k = 0; k < extra; k++) later(.16 * (k + 1), () => !player.dead && G.state === 'play' && fireLaser(c, 1)); }
      p.charge = 0; p.chargeHeld = 0;
    }
  } else if (evoPrimary(dt, canFire)) {
    // an evolved form runs the primary attack itself
  } else if (canFire && mouse.down && p.fireCd <= 0) { castPrimary(); p.fireCd += 1 / fireRate(); if (p.fireCd < 0) p.fireCd = 0; }
  if (p.fireCd < -.05) p.fireCd = 0;
  if (canAct && (pressed.has('rmb') || (pressed.has('e') && !keyPromptOwns('e'))) && p.novaCd <= 0) castNova();

  // orbit orbs
  p.orbA += dt * 3.4;
  if (spell.orbit && G.state === 'play') {
    for (let i = 0; i < spell.orbit; i++) {
      const a = p.orbA + i / spell.orbit * TAU, ox = p.x + Math.cos(a) * 24, oy = p.y + Math.sin(a) * 24 * .75;
      for (const e of enemies) {
        if (e.dead || e.spawnT < 1 || e.ghost) continue;
        if (Math.hypot(e.x - ox, e.y - oy) < e.r + 5) {
          e.orbCd = e.orbCd || 0;
          if (G.t > e.orbCd) { e.orbCd = G.t + .35; damageEnemy(e, spell.dmg * .9, ox, oy, { kb: 50, dir: Math.atan2(e.y - oy, e.x - ox) }); }
        }
      }
    }
  }
}

/* ---------- weapon forms ---------- */
const FORMS = {
  laser:   { name: '棱光射线', col: '#ff9f43' },
  minigun: { name: '星屑风暴', col: '#7ae7ff' },
  shotgun: { name: '星爆散射', col: '#ffd166' },
  boomer:  { name: '回旋月刃', col: '#c6f6ff' },
  sing:    { name: '引力奇点', col: '#b58cff' },
  meteor:  { name: '星陨术',   col: '#ff6a3d' },
  wing:    { name: '星翼冲锋', col: '#ff9ec7' },
  ray:     { name: '流光速射', col: '#8fe6ff' },
};
function later(t, fn) { G.later.push({ t, fn }); }
function fireRate() {
  let r = spell.rate;
  switch (spell.form) {
    case 'minigun': r *= 3 * (1 + player.spin * (evoBr('minigun', 'A') ? 1.7 : evoLv('minigun') >= 2 ? 1.2 : .7)); break;
    case 'shotgun': r *= .42 * (evoBr('shotgun', 'A') ? 1.3 : 1); break;
    case 'boomer': r *= .6; break;
    case 'sing': r *= .3; break;
    case 'ray': r *= 2; break;
    case 'meteor': r *= .5 * (evoBr('meteor', 'B') ? 1.25 : 1); break;
  }
  return r;
}
function chargeTime() { return clamp(3.4 / spell.rate, .28, 1.1); }
function handPos(a) { const p = player; return [p.x + Math.cos(a) * 9, p.y + Math.sin(a) * 9 * .8 - 1]; }

function castPrimary() {
  const p = player;
  if (spell.form === 'meteor') castMeteor(1); else if (spell.form === 'ray') castRays(p.aim, 1); else castBolts(p.aim, 1);
  afterCast();
  if (spell.echo && Math.random() < .3 * spell.echo) later(.13, () => {
    if (player.dead || G.state !== 'play') return;
    if (spell.form === 'meteor') castMeteor(.8); else if (spell.form === 'ray') castRays(player.aim, .8); else castBolts(player.aim, .8);
  });
}
function afterCast() {
  G.castN++;
  if (spell.fourth && spell.form !== 'laser' && G.castN % 4 === 0) later(.06, () => {
    if (player.dead) return;
    const n = 10 + spell.count * 2;
    for (let i = 0; i < n; i++) spawnProj(player.x, player.y - 3, i / n * TAU + player.orbA, { dmgMul: .9 });
    fx.push({ k: 'ring', x: player.x, y: player.y, r0: 3, r1: 34, t: 0, max: .3, col: '#ffd166', w: 1 });
    AU.tone(880, .12, 'triangle', .07, 1320);
  });
}
function castBolts(a, mul) {
  const p = player, f = spell.form, [hx, hy] = handPos(a);
  let n = spell.count;
  if (f === 'shotgun' && evoBr('shotgun', 'B')) { castWave(a, mul); return; }
  if (f === 'shotgun') {
    n = Math.round(n * 5 * (evoLv('shotgun') >= 2 ? 1.4 : 1)); const sp = Math.min(1.7, .55 + n * .05);
    for (let i = 0; i < n; i++) spawnProj(hx, hy, a + (i / (n - 1) - .5) * sp + rand(-.05, .05), { dmgMul: .85 * mul * (evoLv('shotgun') >= 1 ? 1.5 : 1), lifeMul: rand(.4, .62) * (evoLv('shotgun') >= 2 ? 1.5 : 1), spdMul: rand(.8, 1.15), kb: 2.2, pb: evoBr('shotgun', 'A') });
    addShake(.12); p.vx -= Math.cos(a) * 40; p.vy -= Math.sin(a) * 40;
  } else {
    const spT = n > 1 ? Math.min(1.1, spell.spread * (n - 1)) : 0;
    for (let i = 0; i < n; i++) {
      const aa = a - spT / 2 + (n > 1 ? i * spT / (n - 1) : 0) + (f === 'minigun' ? rand(-.2, .2) * (evoBr('minigun', 'A') ? 1 - .6 * p.spin : 1) : rand(-.025, .025));
      const o = { dmgMul: mul };
      if (f === 'minigun') { o.dmgMul *= evoLv('minigun') >= 1 ? .8 : .5; o.sizeMul = .75; o.spdMul = 1.25; if (evoBr('minigun', 'A') && p.spin > .9) o.pierceAdd = 2; }
      if (f === 'boomer') { o.dmgMul *= evoLv('boomer') >= 1 ? 2.25 : 1.5; o.sizeMul = evoLv('boomer') >= 1 ? 1.95 : 1.5; o.lifeMul = 1.5; o.boomer = true; }
      if (f === 'sing') { o.dmgMul *= .6; o.sizeMul = 2.2; o.spdMul = .32; o.lifeMul = 3.2 * (evoBr('sing', 'A') ? 1.5 : 1); o.sing = true; }
      spawnProj(hx, hy, aa, o);
    }
  }
  const c = ELEM[elemOf()];
  for (let i = 0; i < 5; i++) addPart(hx, hy, 8, Math.cos(a + rand(-.6, .6)) * rand(40, 110), Math.sin(a + rand(-.6, .6)) * rand(40, 110), rand(-10, 20), rand(.12, .25), c, 1, { add: true, drag: 7 });
  p.sqx = .9; p.sqy = 1.08;
  cam.kx -= Math.cos(a) * (f === 'shotgun' ? 4 : 1.2); cam.ky -= Math.sin(a) * (f === 'shotgun' ? 4 : 1.2);
  if (f === 'shotgun') { AU.noise(.2, .2, 900, 200, 1); AU.tone(160, .15, 'square', .08, 60); } else sfx.shoot();
}
function spawnProj(x, y, a, o) {
  if (projs.length > 700) return;
  const sp = spell.speed * (o.spdMul || 1), life = spell.life * (o.lifeMul || 1);
  const inf = o.boomer || o.sing;
  projs.push({ x, y, z: 8, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, dmg: spell.dmg * (o.dmgMul || 1) * slowBonus(),
    life, life0: life, r: 2.4 * spell.size * (o.sizeMul || 1), pierce: inf ? 1e9 : spell.pierce + (o.pierceAdd || 0), bounce: spell.bounce,
    gen: o.gen || 0, hit: o.hit ? new Set(o.hit) : new Set(), trail: [], elem: elemOf(), t: 0, dead: false,
    boomer: !!o.boomer, sing: !!o.sing, home: !!o.home, kb: o.kb || 1, tick: 0, spin: rand(TAU), pb: !!o.pb, held: !!o.held });
}

/* ---------- slow-cast bonus, quick rays, wing dash ---------- */
// casts per second for the current form (the laser counts its charge time)
function effRate() { return spell.form === 'laser' ? 1 / chargeTime() : fireRate(); }
// 厚积薄发: the slower you cast, the harder each cast hits
function slowBonus() { return spell.slow ? 1 + spell.slow * clamp(3 / effRate(), .2, 4) : 1; }
function castRays(a, mul) {
  const p = player, n = spell.count, el = elemOf(), cols = ELEM[el];
  const spT = n > 1 ? Math.min(.9, spell.spread * (n - 1)) : 0;
  const L = 260 * (evoLv('ray') >= 2 ? 1.3 : 1) * Math.sqrt(spell.speed / 230), maxHits = 2 + spell.pierce + (evoLv('ray') >= 2 ? 2 : 0), dmg = spell.dmg * (evoLv('ray') >= 1 ? .9 : .6) * mul * slowBonus();
  const w = 1.2 * Math.sqrt(spell.size);
  for (let i = 0; i < n; i++) {
    let aa = a - spT / 2 + (n > 1 ? i * spT / (n - 1) : 0) + rand(-.02, .02);
    if (spell.homing) {
      const cone = .08 + .1 * spell.homing, base = aa; let best = cone;
      for (const e of enemies) { if (e.dead || e.spawnT < 1 || e.ghost || dist(e, p) > L) continue; const d = Math.abs(angDiff(base, angTo(p, e))); if (d < best) { best = d; aa = angTo(p, e); } }
    }
    const [hx, hy] = handPos(aa), segs = traceBeam(hx, hy - 6, aa, L, spell.bounce);
    // enemies along the path, nearest first, up to maxHits
    const cand = []; let acc = 0;
    for (const s of segs) {
      const sdx = s[2] - s[0], sdy = s[3] - s[1], sl = Math.hypot(sdx, sdy) || 1;
      for (const e of enemies) {
        if (e.dead || e.spawnT < 1 || e.ghost || cand.some(c => c.e === e)) continue;
        if (segDist(e.x, e.y - 6, s) < w + e.r) cand.push({ e, d: acc + ((e.x - s[0]) * sdx + (e.y - 6 - s[1]) * sdy) / sl, ux: sdx / sl, uy: sdy / sl });
      }
      acc += sl;
    }
    cand.sort((x, y) => x.d - y.d);
    const hitSet = new Set(); let booms = 0, cut = null;
    for (const c of cand.slice(0, maxHits)) {
      hitSet.add(c.e);
      hitEnemy(c.e, { x: c.e.x - c.ux * 6, y: c.e.y - c.uy * 6, vx: c.ux * 300, vy: c.uy * 300, dmg: dmg * rayFocus(c.e), elem: el, gen: 0, hit: hitSet, kb: .6 });
      if (spell.explode && booms < 2) { booms++; explode(c.e.x, c.e.y, 10 + spell.explode * 6, dmg * .4, true, cols); }
      cut = c;
    }
    if (cut && evoBr('ray', 'B')) rayRefract(cut.e, dmg * .7, hitSet, 2);
    // the ray stops at its last target once it runs out of pierce
    let drawSegs = segs;
    if (cut && cand.length > maxHits) { let left = cut.d; drawSegs = []; for (const s of segs) { const sl = Math.hypot(s[2] - s[0], s[3] - s[1]); if (left <= sl) { const k = left / sl; drawSegs.push([s[0], s[1], s[0] + (s[2] - s[0]) * k, s[1] + (s[3] - s[1]) * k]); break; } drawSegs.push(s); left -= sl; } }
    const last = drawSegs[drawSegs.length - 1];
    if (spell.split && last) { const m = 1 + spell.split, back = Math.atan2(last[1] - last[3], last[0] - last[2]); for (let k = 0; k < m; k++) spawnProj(last[2], last[3] + 6, back + (k / Math.max(1, m - 1) - .5) * 2, { gen: 1, dmgMul: .5, sizeMul: .6, lifeMul: .4, hit: hitSet }); }
    fx.push({ k: 'beam', segs: drawSegs, w, t: 0, max: .1, cols });
  }
  p.sqx = .92; p.sqy = 1.06; cam.kx -= Math.cos(a) * .8; cam.ky -= Math.sin(a) * .8;
  if (AU.gate('ray', 40)) { AU.tone(rand(1500, 1800), .05, 'square', .035, 900); AU.noise(.04, .03, 6000); }
}
function wingVolley() {
  const p = player, base = Math.atan2(p.dashDy, p.dashDx), n = spell.count;
  for (const side of [-1, 1]) {
    const a = base + side * Math.PI / 2;
    for (let i = 0; i < n; i++) spawnProj(p.x, p.y - 3, a + (n > 1 ? (i / (n - 1) - .5) * .35 : 0), { dmgMul: 1.6 });
  }
  if (AU.gate('wing', 25)) AU.tone(rand(1000, 1200), .05, 'triangle', .04, 1600);
}

/* ---------- laser ---------- */
function traceBeam(x, y, a, L, b) {
  const segs = []; let dx = Math.cos(a), dy = Math.sin(a), guard = 0;
  while (L > .5 && guard++ < 12) {
    let t = L, ax = null;
    if (dx > 1e-6) { const tt = (arena.w - x) / dx; if (tt < t) { t = tt; ax = 'x'; } } else if (dx < -1e-6) { const tt = -x / dx; if (tt < t) { t = tt; ax = 'x'; } }
    if (dy > 1e-6) { const tt = (arena.h - y) / dy; if (tt < t) { t = tt; ax = 'y'; } } else if (dy < -1e-6) { const tt = -y / dy; if (tt < t) { t = tt; ax = 'y'; } }
    t = Math.max(t, .5);
    const nx = x + dx * t, ny = y + dy * t; segs.push([x, y, nx, ny]); L -= t; x = nx; y = ny;
    if (!ax || b <= 0) break;
    b--; if (ax === 'x') dx = -dx; else dy = -dy;
    sparkBurst(x, y, ELEM[elemOf()], 8);
  }
  return segs;
}
function segDist(px, py, s) {
  const [x0, y0, x1, y1] = s, dx = x1 - x0, dy = y1 - y0, l2 = dx * dx + dy * dy;
  const t = l2 ? clamp(((px - x0) * dx + (py - y0) * dy) / l2, 0, 1) : 0;
  return Math.hypot(px - x0 - dx * t, py - y0 - dy * t);
}
function fireLaser(c, mul = 1) {
  const p = player, a = p.aim, n = spell.count, el = elemOf(), cols = ELEM[el];
  const spT = n > 1 ? Math.min(1.0, spell.spread * 1.3 * (n - 1)) : 0;
  const cw = Math.min(1, c), w = (2.5 + 2 * spell.size) * (.35 + 1.65 * cw * cw) * (1 + (c - cw) * .35) * (evoLv('laser') >= 2 ? 2 : 1);
  const L = 720 * Math.sqrt(spell.speed / 230);
  const dmg = spell.dmg * 12 * c * mul * slowBonus() * (evoLv('laser') >= 1 ? 2 : 1);
  let booms = 0;
  for (let i = 0; i < n; i++) {
    let aa = a - spT / 2 + (n > 1 ? i * spT / (n - 1) : 0);
    if (spell.homing) {
      const cone = .1 + .12 * spell.homing, base = aa; let best = cone;
      for (const e of enemies) { if (e.dead || e.spawnT < 1 || e.ghost || dist(e, p) > L) continue; const d = Math.abs(angDiff(base, angTo(p, e))); if (d < best) { best = d; aa = angTo(p, e); } }
    }
    const [hx, hy] = handPos(aa);
    const segs = traceBeam(hx, hy - 6, aa, L, spell.bounce), hitSet = new Set();
    for (const s of segs) {
      const sdx = s[2] - s[0], sdy = s[3] - s[1], sl = Math.hypot(sdx, sdy) || 1;
      for (const e of enemies) {
        if (e.dead || e.spawnT < 1 || e.ghost || hitSet.has(e)) continue;
        if (segDist(e.x, e.y - 6, s) < w + e.r) {
          hitSet.add(e);
          const ps = { x: e.x - sdx / sl * 6, y: e.y - sdy / sl * 6, vx: sdx / sl * 300, vy: sdy / sl * 300, dmg, elem: el, gen: 0, hit: hitSet, kb: 2.5 };
          hitEnemy(e, ps);
          if (spell.explode && booms < 10) { booms++; const ex = e.x, ey = e.y; later(.03 * booms, () => explode(ex, ey, 14 + spell.explode * 9, dmg * .3, true, cols)); }
        }
      }
      for (let k = 0; k < sl; k += 10) if (Math.random() < .5) addPart(s[0] + sdx / sl * k, s[1] + sdy / sl * k + 6, 6, rand(-30, 30), rand(-30, 30), rand(10, 50), rand(.2, .45), cols, 1, { add: true, drag: 4 });
    }
    const last = segs[segs.length - 1];
    if (spell.split && last) { const m = 1 + spell.split * 2, back = Math.atan2(last[1] - last[3], last[0] - last[2]); for (let k = 0; k < m; k++) spawnProj(last[2], last[3] + 6, back + (k / Math.max(1, m - 1) - .5) * 2.2, { gen: 1, dmgMul: 1.2, sizeMul: .7, lifeMul: .5, hit: hitSet }); }
    fx.push({ k: 'beam', segs, w, t: 0, max: .3, cols });
  }
  p.vx -= Math.cos(a) * 130 * Math.min(c, 1.5); p.vy -= Math.sin(a) * 130 * Math.min(c, 1.5); p.sqx = 1.25; p.sqy = .8;
  addShake(.3 + .25 * c); cam.kx -= Math.cos(a) * 6; cam.ky -= Math.sin(a) * 6; G.hitstop = Math.max(G.hitstop, .035);
  AU.noise(.45, .3, 2600, 500, 1.2); AU.tone(180, .4, 'sawtooth', .12, 50); AU.tone(1400, .25, 'square', .05, 300);
}

/* ---------- meteor ---------- */
function castMeteor(mul, ax, ay) {
  const n = spell.count;
  for (let i = 0; i < n; i++) {
    const off = rand(TAU), r = i ? rand(14, 16 + n * 6) : 0;
    const x = clamp((ax ?? mouse.wx) + Math.cos(off) * r, 6, arena.w - 6), y = clamp((ay ?? mouse.wy) + Math.sin(off) * r * .7, 6, arena.h - 6);
    let tx = x, ty = y, tgt = null;
    if (spell.homing) {
      let bd = 30 + 25 * spell.homing;
      for (const e of enemies) { if (e.dead || e.spawnT < 1 || e.ghost || meteors.some(m => m.tgt === e)) continue; const d = Math.hypot(e.x - x, e.y - y); if (d < bd) { bd = d; tx = e.x; ty = e.y; tgt = e; } }
    }
    meteors.push({ x: tx, y: ty, tgt, t: -i * .07, max: clamp(.5 * 230 / spell.speed, .22, .5), R: (24 + spell.explode * 8) * Math.sqrt(spell.size) * (evoLv('meteor') >= 1 ? 1.3 : 1), dmg: spell.dmg * 4 * mul * slowBonus(), el: elemOf(), bounces: spell.bounce });
  }
  player.sqx = .85; player.sqy = 1.15;
  AU.tone(1200, .3, 'sine', .06, 300);
  if (evoBr('meteor', 'A') && ++EV.meteorN % 3 === 0) meteorShower();
}
function updateMeteors(dt) {
  for (const m of meteors) {
    m.t += dt;
    if (m.t > 0 && m.t < m.max && !m.hop) { const p = m.t / m.max; addPart(m.x + (1 - p) * 50, m.y - (1 - p) * 170, 0, rand(-10, 10), rand(-10, 10), 0, rand(.2, .4), ['#ffffff', ...ELEM[m.el].slice(1)], rand(1, 2), { add: true }); }
    if (m.t >= m.max && !m.done) {
      m.done = true;
      const cols = ELEM[m.el];
      fx.push({ k: 'boom', x: m.x, y: m.y, R: m.R, t: 0, max: .4, cols });
      fx.push({ k: 'ring', x: m.x, y: m.y, r0: m.R * .5, r1: m.R * 1.4, t: 0, max: .4, col: cols[1], w: 2 });
      fx.push({ k: 'flash', x: m.x, y: m.y, r: m.R * 1.8, t: 0, max: .22, col: cols[1] });
      for (let i = 0; i < 18; i++) { const a = rand(TAU), s = rand(40, 140); addPart(m.x, m.y, 2, Math.cos(a) * s, Math.sin(a) * s * .7, rand(40, 120), rand(.4, .8), [cols[0], cols[1], cols[2], '#3a2a3a'], rand(1, 2), { g: 260, drag: 2 }); }
      decalScorch(m.x, m.y, m.R * .8); addShake(m.small ? .08 : .22); sfx.boom();
      if (evoLv('meteor') >= 2 && !m.small) meteorLava(m);
      const hs = new Set();
      for (const e of enemies) {
        if (e.dead || e.spawnT < 1 || e.ghost) continue;
        if (Math.hypot(e.x - m.x, e.y - m.y) < m.R + e.r) { hs.add(e); hitEnemy(e, { x: m.x, y: m.y, vx: e.x - m.x || 1, vy: e.y - m.y, dmg: m.dmg, elem: m.el, gen: 0, hit: hs, kb: 2.5 }); }
      }
      if (spell.split && !m.hop) { const k = 1 + spell.split * 2; for (let i = 0; i < k; i++) spawnProj(m.x, m.y, i / k * TAU, { gen: 1, dmgMul: .6, sizeMul: .7, lifeMul: .5, hit: hs }); }
      if (m.bounces > 0) {
        let a = rand(TAU), best = 90;
        for (const e of enemies) { if (e.dead || e.spawnT < 1 || hs.has(e)) continue; const d = Math.hypot(e.x - m.x, e.y - m.y); if (d < best) { best = d; a = Math.atan2(e.y - m.y, e.x - m.x); } }
        const hx = clamp(m.x + Math.cos(a) * 34, 6, arena.w - 6), hy = clamp(m.y + Math.sin(a) * 34, 6, arena.h - 6);
        meteors.push({ x: hx, y: hy, sx: m.x, sy: m.y, hop: true, t: 0, max: .26, R: m.R * .85, dmg: m.dmg * .7, el: m.el, bounces: m.bounces - 1 });
      }
    }
  }
  meteors = meteors.filter(m => !m.done);
}

/* ---------- nova ---------- */
function novaBurst(x, y, m) {
  const n = spell.novaN * (spell.novaHome ? 2 : 1), off = rand(TAU);
  for (let i = 0; i < n; i++) spawnProj(x, y - 2, i / n * TAU + off, { dmgMul: 1.3 * m, lifeMul: .9 * (spell.novaHome ? 1.8 : 1), spdMul: .85, home: spell.novaHome });
  for (const b of eprojs) if (Math.hypot(b.x - x, b.y - y) < 75) { b.dead = true; addPart(b.x, b.y, 4, 0, 0, 0, .3, ['#ffffff', '#b58cff'], 2, { add: true }); }
  for (const e of enemies) { const d = Math.hypot(e.x - x, e.y - y); if (d < 60 && !e.dead) { const a = Math.atan2(e.y - y, e.x - x); e.kvx += Math.cos(a) * 160 / e.mass; e.kvy += Math.sin(a) * 160 / e.mass; } }
  fx.push({ k: 'ring', x, y, r0: 4, r1: 70, t: 0, max: .45, col: '#d6c2ff', w: 3 });
  fx.push({ k: 'ring', x, y, r0: 2, r1: 46, t: 0, max: .32, col: '#7ae7ff', w: 2 });
  fx.push({ k: 'flash', x, y, r: 60, t: 0, max: .25, col: '#b58cff' });
  for (let i = 0; i < 26; i++) { const a = rand(TAU), s = rand(60, 160); addPart(x, y, 4, Math.cos(a) * s, Math.sin(a) * s * .7, rand(0, 40), rand(.3, .6), ['#ffffff', '#d6c2ff', '#7a5bd6'], 1, { add: true, drag: 4 }); }
  addShake(.35); sfx.nova();
  if (x === player.x) maybeSay(player, QUIPS.nova, .25);
}
function castNova() {
  const p = player; p.novaCd = p.novaCdMax * (spell.novaEcho ? .5 : 1);
  p.sqx = 1.3; p.sqy = .75;
  novaBurst(p.x, p.y, 1);
  if (spell.novaTriple) { later(.25, () => !player.dead && novaBurst(player.x, player.y, .85)); later(.5, () => !player.dead && novaBurst(player.x, player.y, .85)); }
  if (spell.novaFreeze) {
    for (const e of enemies) if (!e.dead && e.type !== 'boss' && !e.elite && dist(e, p) < 120) { e.frozen = 2.8; for (let i = 0; i < 5; i++) addPart(e.x, e.y - 4, 6, rand(-30, 30), rand(-20, 20), rand(20, 60), .5, ['#ffffff', '#c6f6ff', '#5fb0ff'], 1, { add: true, g: 120 }); }
    fx.push({ k: 'ring', x: p.x, y: p.y, r0: 10, r1: 120, t: 0, max: .5, col: '#c6f6ff', w: 2 });
    AU.noise(.5, .15, 6000, 3000, 2);
  }
  if (spell.novaVortex) vortices.push({ x: clamp(mouse.wx, 10, arena.w - 10), y: clamp(mouse.wy, 10, arena.h - 10), t: 0, max: 2.4, R: 130, tick: 0 });
  if (spell.novaTime) { G.timeField = 4.5; AU.tone(600, .8, 'sine', .1, 150); fx.push({ k: 'ring', x: p.x, y: p.y, r0: 10, r1: 260, t: 0, max: .8, col: '#7ad0ff', w: 2 }); }
}
function updateVortices(dt) {
  for (const v of vortices) {
    v.t += dt; v.tick -= dt;
    const p = v.t / v.max;
    for (let i = 0; i < 3; i++) { const a = rand(TAU), r = rand(20, v.R); addPart(v.x + Math.cos(a) * r, v.y + Math.sin(a) * r * .62, 3, -Math.cos(a - 1.2) * r * 1.6, -Math.sin(a - 1.2) * r, 0, .35, ['#ffffff', '#b58cff', '#3c2b5c'], 1, { add: true }); }
    for (const e of enemies) {
      if (e.dead || e.spawnT < 1 || e.type === 'boss') continue;
      const dx = v.x - e.x, dy = v.y - e.y, d = Math.hypot(dx, dy);
      if (d < v.R && d > 2) { const pull = (1 - d / v.R) * 260 + 60; e.x += dx / d * Math.min(d, pull * dt); e.y += dy / d * Math.min(d, pull * dt); }
    }
    if (v.tick <= 0) { v.tick = .2; for (const e of enemies) if (!e.dead && Math.hypot(e.x - v.x, e.y - v.y) < 40) damageEnemy(e, spell.dmg * .7, v.x, v.y, { quiet: true, tcol: '#d6c2ff' }); }
    if (v.t >= v.max && !v.done) { v.done = true; explode(v.x, v.y, 70, spell.dmg * 5, true, ['#ffffff', '#d6c2ff', '#6c4bb8']); addShake(.5); }
  }
  vortices = vortices.filter(v => !v.done);
}

/* ================= player projectiles ================= */
function updateProjs(dt) {
  for (const p of projs) {
    if (p.dead) continue;
    p.t += dt; p.life -= dt; p.spin += dt * 18;
    const hs = spell.homing + (p.home ? 2.5 : 0);
    if (hs && p.t > .05 && !p.back) {
      let best = null, bd = 160;
      for (const e of enemies) { if (e.dead || e.spawnT < 1 || e.ghost || p.hit.has(e)) continue; const d = Math.hypot(e.x - p.x, e.y - p.y); if (d < bd) { bd = d; best = e; } }
      if (best) {
        const sp = Math.hypot(p.vx, p.vy), a = Math.atan2(p.vy, p.vx), want = Math.atan2(best.y - p.y, best.x - p.x);
        const na = a + clamp(angDiff(a, want), -1, 1) * (3 + hs * 2.5) * dt;
        p.vx = Math.cos(na) * sp; p.vy = Math.sin(na) * sp;
      }
    }
    if (p.boomer) {
      if (!p.back && p.t > p.life0 * .42) { p.back = true; p.hit.clear(); }
      if (p.back) {
        const a = Math.atan2(player.y - 4 - p.y, player.x - p.x), s = Math.max(Math.hypot(p.vx, p.vy), spell.speed * 1.3);
        p.vx = damp(p.vx, Math.cos(a) * s, 7, dt); p.vy = damp(p.vy, Math.sin(a) * s, 7, dt);
        p.life = Math.max(p.life, .1);
        if (Math.hypot(p.x - player.x, p.y - player.y + 4) < 9 || p.t > 5) {
          // 满月轮舞: caught blades are thrown once more, bigger
          if (evoBr('boomer', 'A') && !p.loops && p.t <= 5) { p.loops = 1; p.back = false; p.t = 0; p.life = p.life0; p.hit.clear(); p.dmg *= 1.3; p.r *= 1.3; p.vx = Math.cos(player.aim) * spell.speed; p.vy = Math.sin(player.aim) * spell.speed; }
          else { p.dead = true; continue; }
        }
      }
    }
    if (p.sing) {
      if (p.held && !p.release) evoHeldSing(p, dt); else { p.vx = damp(p.vx, 0, .7, dt); p.vy = damp(p.vy, 0, .7, dt); }
      p.tick -= dt;
      const R = 26 * spell.size * (1 + Math.min(2, (p.feed || 0) * .08)), PR = R * 1.7 * (evoLv('sing') >= 1 ? 1.4 : 1);
      if (Math.random() < .9) { const a = rand(TAU), r = rand(R * .4, R); addPart(p.x + Math.cos(a) * r, p.y + Math.sin(a) * r * .7, 8, -Math.cos(a - 1) * r * 2, -Math.sin(a - 1) * r * 1.4, 0, .3, ['#ffffff', '#b58cff', '#3c2b5c'], 1, { add: true }); }
      for (const e of enemies) {
        if (e.dead || e.spawnT < 1 || e.ghost || e.type === 'boss') continue;
        const dx = p.x - e.x, dy = p.y - e.y, d = Math.hypot(dx, dy);
        if (d < PR && d > 2) { const pull = 150 * (1 - d / PR) + 30; e.x += dx / d * Math.min(d, pull * dt); e.y += dy / d * Math.min(d, pull * dt); }
      }
      if (p.tick <= 0) {
        p.tick = .14;
        for (const e of enemies) if (!e.dead && e.spawnT >= 1 && !e.ghost && Math.hypot(e.x - p.x, e.y - p.y) < R + e.r) {
          hitEnemy(e, p, { dmgMul: .8, quiet: true, tcol: '#d6c2ff', kb: 0, chainChance: .2 });
        }
      }
    }
    p.trail.push(p.x, p.y); if (p.trail.length > 16) p.trail.splice(0, 2);
    p.x += p.vx * dt; p.y += p.vy * dt;
    let bounced = false;
    const hitWall = axis => {
      if (p.bounce > 0 || p.boomer) { if (axis === 'x') p.vx *= -1; else p.vy *= -1; bounced = true; return true; }
      if (p.sing) { p.vx = p.vy = 0; return true; }
      return false;
    };
    if (p.x < 0 || p.x > arena.w) { p.x = clamp(p.x, 0, arena.w); if (!hitWall('x')) { killProj(p, 'wall'); continue; } }
    if (p.y < 0 || p.y > arena.h) { p.y = clamp(p.y, 0, arena.h); if (!hitWall('y')) { killProj(p, 'wall'); continue; } }
    if (!p.sing) for (const pl of pillars) {
      const dx = p.x - pl.x, dy = p.y - pl.y, d = Math.hypot(dx, dy);
      if (d < pl.r + p.r) {
        if (p.bounce > 0 || p.boomer) { const nx = dx / d, ny = dy / d, dot = p.vx * nx + p.vy * ny; p.vx -= 2 * dot * nx; p.vy -= 2 * dot * ny; p.x = pl.x + nx * (pl.r + p.r + .5); p.y = pl.y + ny * (pl.r + p.r + .5); bounced = true; }
        else { killProj(p, 'wall'); break; }
      }
    }
    if (p.dead) continue;
    if (bounced) {
      if (p.bounce > 0) { p.bounce--; if (!p.boomer && !p.sing) ricochet(p, p); }
      else if (p.boomer && !p.back) { p.back = true; p.hit.clear(); } sparkBurst(p.x, p.y, ELEM[p.elem], 5); if (AU.gate('bnc', 50)) AU.tone(1300, .05, 'square', .03, 900); }
    if (!p.sing) for (const e of enemies) {
      if (e.dead || e.spawnT < 1 || e.ghost || p.hit.has(e)) continue;
      const rr = e.r + p.r;
      if ((e.x - p.x) ** 2 + (e.y - p.y) ** 2 < rr * rr) {
        p.hit.add(e); hitEnemy(e, p);
        if (p.pierce > 0) { p.pierce--; onPassHit(p, e); }
        else if (p.bounce > 0 && !p.boomer && ricochet(p, e)) { p.bounce--; onPassHit(p, e); break; }
        else { killProj(p, 'hit'); break; }
      }
    }
    if (!p.dead && p.life <= 0) killProj(p, 'life');
  }
  projs = projs.filter(p => !p.dead);
}
// 弹跳符文: after hitting an enemy (or a wall) the bolt flies on to the nearest enemy it has not hit yet
function ricochet(p, from) {
  let best = null, bd = 170;
  for (const e of enemies) { if (e.dead || e.spawnT < 1 || e.ghost || p.hit.has(e)) continue; const d = Math.hypot(e.x - from.x, e.y - from.y); if (d < bd) { bd = d; best = e; } }
  if (!best) return from !== p ? false : true;
  const sp = Math.max(Math.hypot(p.vx, p.vy), spell.speed * .8), a = Math.atan2(best.y - p.y, best.x - p.x);
  p.vx = Math.cos(a) * sp; p.vy = Math.sin(a) * sp; p.life = Math.max(p.life, p.life0 * .6);
  if (from !== p) { sparkBurst(p.x, p.y, ELEM[p.elem], 5); if (AU.gate('bnc', 50)) AU.tone(1500, .05, 'square', .03, 1000); }
  return true;
}
function killProj(p, why) {
  p.dead = true;
  const c = ELEM[p.elem];
  sparkBurst(p.x, p.y, c, why === 'life' ? 4 : 8);
  if (p.sing) { explode(p.x, p.y, (30 * spell.size + spell.explode * 8) * (1 + Math.min(2, (p.feed || 0) * .08)) * (p.held ? 1 + Math.min(1, (p.holdT || 0) * .2) : 1), p.dmg * 5 * singBoomMul(p), true, ['#ffffff', '#d6c2ff', '#6c4bb8']); addShake(.2); }
  if (spell.explode && !p.sing) explode(p.x, p.y, (14 + spell.explode * 9) * (p.gen ? .6 : 1), p.dmg * (.55 + .15 * spell.explode), true, c);
  if (spell.split && p.gen === 0 && !p.splitN && (why !== 'life' || p.sing)) splitProj(p, p.sing);
}
function splitProj(p, radial) {
  p.splitN = (p.splitN || 0) + 1;
  const n = 1 + spell.split * 2, base = Math.atan2(p.vy, p.vx);
  for (let i = 0; i < n; i++) spawnProj(p.x, p.y, radial ? i / n * TAU : base + (i / (n - 1 || 1) - .5) * 2.0 + rand(-.1, .1), { gen: 1, dmgMul: .5, sizeMul: .65, lifeMul: .45, hit: p.hit });
}
// A projectile hit an enemy and keeps flying (piercing bolts, boomerang blades).
// Shatter and burst trigger here too; otherwise they would only fire when the projectile dies.
function onPassHit(p, e) {
  if (spell.split && p.gen === 0 && (p.splitN || 0) < (p.boomer ? 3 : 1)) splitProj(p, false);
  if (spell.explode && (p.boomN || 0) < (p.boomer ? 4 : 2)) {
    p.boomN = (p.boomN || 0) + 1;
    explode(e.x, e.y, (12 + spell.explode * 8) * (p.gen ? .6 : 1), p.dmg * (.45 + .15 * spell.explode), true, ELEM[p.elem]);
  }
}

function sparkBurst(x, y, c, n) {
  for (let i = 0; i < n; i++) { const a = rand(TAU), s = rand(30, 110); addPart(x, y, 8, Math.cos(a) * s, Math.sin(a) * s, rand(0, 50), rand(.15, .35), c, 1, { add: true, drag: 5, g: 120 }); }
}
function hitEnemy(e, p, o = {}) {
  const base = p.dmg * (o.dmgMul || 1) * evoHitMul(p);
  let dmg = base; const crit = Math.random() < spell.crit;
  if (crit) dmg *= spell.critMul;
  const dir = Math.atan2(p.vy, p.vx);
  damageEnemy(e, dmg, p.x - Math.cos(dir) * 6, p.y - Math.sin(dir) * 6, { crit, kb: o.kb ?? 55 * Math.min(2, spell.size) * (p.kb || 1), dir, quiet: o.quiet && !crit, tcol: crit ? undefined : o.tcol });
  if (spell.burn) { e.burnT = 2.6; e.burnDps = spell.dmg * .45 * spell.burn; }
  if (spell.frost) frostHit(e);
  if (spell.chain && Math.random() < (o.chainChance ?? 1)) chainZap(e, base * .55, spell.chain * 2, p.hit);
}
function chainZap(from, dmg, n, hitSet) {
  const seen = new Set(hitSet); seen.add(from);
  let cur = from;
  for (let k = 0; k < n; k++) {
    let best = null, bd = 85;
    for (const e of enemies) { if (e.dead || seen.has(e) || e.spawnT < 1 || e.ghost) continue; const d = dist(e, cur); if (d < bd) { bd = d; best = e; } }
    if (!best) break;
    seen.add(best);
    const pts = [], segs = 6;
    for (let i = 0; i <= segs; i++) { const t = i / segs; pts.push(lerp(cur.x, best.x, t) + (i && i < segs ? rand(-5, 5) : 0), lerp(cur.y - 6, best.y - 6, t) + (i && i < segs ? rand(-5, 5) : 0)); }
    fx.push({ k: 'arc', pts, t: 0, max: .2 });
    damageEnemy(best, dmg, cur.x, cur.y, { kb: 20, dir: angTo(cur, best), elem: 'bolt' });
    cur = best;
  }
  sfx.zap();
}

function damageEnemy(e, dmg, sx, sy, o = {}) {
  if (e.dead || e.ghost || e.spawnT < 1) return;
  if (G.timeStop > 0 && !o.resolve) { e.pend = (e.pend || 0) + dmg; e.flash = .06; e.hitSq = .6; if (G.ult) ultOnDamage(dmg, o); return; }
  let blocked = false;
  if (e.type === 'knight' && e.state !== 'stun') {
    const from = Math.atan2(sy - e.y, sx - e.x);
    if (Math.abs(angDiff(e.facing, from)) < 1.15) { dmg *= .15; blocked = true; }
  }
  if (e.frozen > 0 && !o.fixed) dmg *= 1.5;
  e.hp -= dmg; G.dmg += dmg; e.lastSrc = o.src || 'p'; if (G.ult) ultOnDamage(dmg, o);
  e.flash = .1; e.hitSq = 1;
  const kb = (o.kb || 40) * (blocked ? .3 : 1);
  if (o.dir !== undefined) { e.kvx += Math.cos(o.dir) * kb / e.mass; e.kvy += Math.sin(o.dir) * kb / e.mass; }
  if (blocked) {
    for (let i = 0; i < 6; i++) { const a = e.facing + rand(-1, 1), s = rand(50, 120); addPart(e.x + Math.cos(e.facing) * 9, e.y + Math.sin(e.facing) * 6, 8, Math.cos(a) * s, Math.sin(a) * s, rand(20, 60), rand(.15, .3), ['#ffffff', '#fff27a', '#ffae00'], 1, { add: true, g: 200 }); }
    sfx.block();
    if (G.t > G.blockTxtT) { G.blockTxtT = G.t + .5; addText(e.x, e.y - 20, '格挡', '#c3cde0', .8); }
  } else if (!o.quiet) {
    sfx.hit();
    for (let i = 0; i < 4; i++) { const a = (o.dir ?? rand(TAU)) + rand(-.8, .8), s = rand(40, 100); addPart(e.x, e.y - 4, 6, Math.cos(a) * s, Math.sin(a) * s, rand(20, 70), rand(.2, .45), [e.col, e.col2], 1, { g: 220, drag: 2 }); }
  }
  addText(e.x + rand(-4, 4), e.y - e.h - 2, Math.max(1, Math.round(dmg)) + (o.crit ? '!' : ''), o.tcol || (o.crit ? '#ffd166' : blocked ? '#8a90a8' : '#ffffff'), o.crit ? 1.5 : o.quiet ? .75 : 1);
  if (e.hp <= 0) killEnemy(e);
}
function damagePlayer(n, srcx, srcy) {
  const p = player;
  if (ultInvuln() || p.inv > 0 || p.dashT > 0 || p.dead || G.state !== 'play') return;
  if (evoBr('laser', 'A') && p.charge > 0 && (p.chargeHeld || 0) < 4) return;
  p.hp -= n; p.inv = 1.0; p.hurtAt = G.t;
  const a = Math.atan2(p.y - srcy, p.x - srcx);
  p.vx += Math.cos(a) * 160; p.vy += Math.sin(a) * 160;
  addShake(.6, true); G.hitstop = .09;
  $('hurt').classList.add('on'); setTimeout(() => $('hurt').classList.remove('on'), 120);
  for (let i = 0; i < 14; i++) { const b = rand(TAU), s = rand(40, 120); addPart(p.x, p.y - 6, 6, Math.cos(b) * s, Math.sin(b) * s, rand(30, 80), rand(.3, .6), ['#ffffff', '#ff8aa0', '#c22c55'], 1, { g: 220 }); }
  sfx.hurt(); updateHearts(true); hudHurt();
  if (p.hp > 0) maybeSay(player, QUIPS.hurt, .35, { force: true, cd: .8 });
  if (p.hp <= 0 && !lastStand() && !sunRevive()) playerDie();
}

function explode(x, y, R, dmg, friendly, cols) {
  cols = cols || ['#fff4c2', '#ffb347', '#ff4d2e'];
  fx.push({ k: 'boom', x, y, R, t: 0, max: .38, cols });
  fx.push({ k: 'ring', x, y, r0: R * .4, r1: R * 1.15, t: 0, max: .32, col: cols[1], w: 2 });
  fx.push({ k: 'flash', x, y, r: R * 1.6, t: 0, max: .2, col: cols[1] });
  for (let i = 0; i < Math.min(26, 8 + R * .5); i++) { const a = rand(TAU), s = rand(20, 90) * R / 30; addPart(x, y, 4, Math.cos(a) * s, Math.sin(a) * s * .7, rand(10, 90), rand(.3, .7), [cols[0], cols[1], cols[2], '#3a2a3a'], rand(1, 2), { add: i % 2 === 0, g: 160, drag: 3 }); }
  decalScorch(x, y, R * .7);
  addShake(Math.min(.45, R / 70));
  sfx.boom();
  if (!friendly || dmg > 0) for (const e of enemies) {
    if (e.dead) continue;
    const d = dist(e, { x, y });
    if (d < R + e.r) damageEnemy(e, friendly ? dmg : 40, x, y, { kb: 90, dir: Math.atan2(e.y - y, e.x - x) });
  }
  if (!friendly && Math.hypot(player.x - x, player.y - y) < R * .85 + player.r) damagePlayer(1, x, y);
}

/* ================= pickups / particles / text ================= */
function addPart(x, y, z, vx, vy, vz, life, cols, size = 1, o = {}) {
  if (parts.length > 900) return;
  parts.push({ x, y, z, vx, vy, vz, life, max: life, cols, size, g: o.g ?? 0, drag: o.drag ?? 0, add: !!o.add });
}
function addText(x, y, txt, col, scale = 1) { if (texts.length > 140) return; texts.push({ x, y, txt: String(txt), col, scale, t: 0, max: .8, vx: rand(-12, 12) }); }
function dropHeart(x, y) { if (!canHeal()) return; pickups.push({ x, y, z: 0, vz: 90, t: 0, vx: rand(-30, 30), vy: rand(-30, 30) }); }
function updatePickups(dt) {
  for (const h of pickups) {
    h.t += dt; h.vz -= 300 * dt; h.z += h.vz * dt; if (h.z < 0) { h.z = 0; h.vz = -h.vz * .45; }
    h.x += h.vx * dt; h.y += h.vy * dt; h.vx = damp(h.vx, 0, 4, dt); h.vy = damp(h.vy, 0, 4, dt);
    const d = dist(h, player);
    if ((d < 46 || G.state === 'clear') && h.t > .4 && canHeal()) { const a = angTo(h, player), s = G.state === 'clear' ? 260 : 170; h.vx = damp(h.vx, Math.cos(a) * s, 10, dt); h.vy = damp(h.vy, Math.sin(a) * s, 10, dt); }
    if (d < 8 && h.t > .4 && !h.dead && canHeal()) {
      h.dead = true;
      // 劫后余生: a heart picked up within 1s of being hit heals one more
      const n = 1 + (spell.rush && G.t - (player.hurtAt ?? -9) <= 1 ? 1 : 0);
      if (player.hp < player.maxHp) { player.hp = Math.min(player.maxHp, player.hp + n); updateHearts(true); }
      if (n > 1) addText(player.x, player.y - 32, '劫后余生', '#ff7ab0', 1);
      addText(player.x, player.y - 22, '+' + n, '#ff8aa0', 1.2); sfx.heart(); maybeSay(player, QUIPS.heal, .5, { force: true });
      for (let i = 0; i < 10; i++) addPart(player.x, player.y, 6, rand(-50, 50), rand(-50, 50), rand(30, 80), .5, ['#ffffff', '#ff8aa0', '#ff4d6d'], 1, { add: true, g: 100 });
    }
    if (h.t > 14) h.dead = true;
  }
  pickups = pickups.filter(h => !h.dead);
}
function updateParts(dt) {
  for (const p of parts) {
    p.life -= dt;
    const k = Math.exp(-p.drag * dt);
    p.vx *= k; p.vy *= k;
    p.x += p.vx * dt; p.y += p.vy * dt;
    p.vz -= p.g * dt; p.z += p.vz * dt;
    if (p.z < 0 && p.g > 0) { p.z = 0; p.vz *= -.35; p.vx *= .6; p.vy *= .6; }
  }
  parts = parts.filter(p => p.life > 0);
  for (const t of texts) { t.t += dt; t.x += t.vx * dt; }
  texts = texts.filter(t => t.t < t.max);
  for (const g of ghosts) g.t += dt;
  ghosts = ghosts.filter(g => g.t < .3);
  for (const f of fx) f.t += dt;
  fx = fx.filter(f => f.t < f.max);
  for (const f of flames) {
    f.t += dt;
    if (Math.random() < dt * 14) addPart(f.x + rand(-2, 2), f.y, 1, rand(-6, 6), rand(-4, 4), rand(20, 50), rand(.3, .6), ['#fff4c2', '#ffb347', '#ff4d2e'], 1, { add: true });
    for (const e of enemies) {
      if (e.dead || e.spawnT < 1 || e.ghost) continue;
      if (Math.hypot(e.x - f.x, e.y - f.y) < e.r + (f.lava ? 9 : 5) && G.t > (f.hit.get(e) || 0)) { f.hit.set(e, G.t + .5); damageEnemy(e, spell.dmg * .6, f.x, f.y, {}); e.burnT = 2; e.burnDps = Math.max(e.burnDps || 0, spell.dmg * .4); }
    }
  }
  flames = flames.filter(f => f.t < f.max);
  updateAmbient(dt);
}
