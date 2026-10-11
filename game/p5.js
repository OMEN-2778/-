
/* ================= render helpers ================= */
const lightCv = document.createElement('canvas'), lctx = lightCv.getContext('2d');
function sizeLight() { lightCv.width = Math.ceil(VW / 2) + 3; lightCv.height = Math.ceil(VH / 2) + 3; buildVignette(); }
let vignette = null;
function buildVignette() {
  const [c, x] = makeCanvas(W, H);
  const g = x.createRadialGradient(W / 2, H / 2, Math.min(W, H) * .35, W / 2, H / 2, Math.max(W, H) * .75);
  g.addColorStop(0, 'rgba(8,24,14,0)'); g.addColorStop(1, 'rgba(8,24,14,.38)');
  x.fillStyle = g; x.fillRect(0, 0, W, H); vignette = c;
}
const texCache = {};
function glowTex(col) {
  if (texCache[col]) return texCache[col];
  const [c, x] = makeCanvas(64, 64), g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, col); g.addColorStop(.35, col + '88'); g.addColorStop(1, col + '00');
  x.fillStyle = g; x.fillRect(0, 0, 64, 64); return texCache[col] = c;
}
const holeTex = (() => {
  const [c, x] = makeCanvas(64, 64), g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(.5, 'rgba(0,0,0,.7)'); g.addColorStop(1, 'rgba(0,0,0,0)');
  x.fillStyle = g; x.fillRect(0, 0, 64, 64); return c;
})();
const shadowCache = {};
function shadowTex(w) {
  w = Math.max(4, Math.round(w)); if (shadowCache[w]) return shadowCache[w];
  const h = Math.max(2, Math.round(w / 2.6)), [c, x] = makeCanvas(w, h);
  x.fillStyle = '#0d2414';
  for (let j = 0; j < h; j++) { const t = (j + .5) / h * 2 - 1, half = Math.round(Math.sqrt(1 - t * t) * w / 2); x.fillRect(Math.round(w / 2 - half), j, half * 2, 1); }
  return shadowCache[w] = c;
}
function tintOf(sp, col) { sp._t = sp._t || {}; return sp._t[col] || (sp._t[col] = tinted(sp, col)); }
const snap = v => Math.round(v * S) / S;
function pixDisc(x, y, r, sq = .62) {
  const ry = Math.max(1, Math.round(r * sq));
  for (let j = -ry; j <= ry; j++) { const t = j / ry, half = Math.round(Math.sqrt(Math.max(0, 1 - t * t)) * r); ctx.fillRect(Math.round(x - half), Math.round(y + j), half * 2, 1); }
}
function pixRing(x, y, r, sq = .62, w = 1) {
  const step = 1 / Math.max(4, r);
  for (let a = 0; a < TAU; a += step) ctx.fillRect(Math.round(x + Math.cos(a) * r - w / 2), Math.round(y + Math.sin(a) * r * sq - w / 2), w, w);
}
function pixLine(x0, y0, x1, y1, w = 1) {
  const n = Math.ceil(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)));
  for (let i = 0; i <= n; i++) { const t = n ? i / n : 0; ctx.fillRect(Math.round(lerp(x0, x1, t) - w / 2), Math.round(lerp(y0, y1, t) - w / 2), w, w); }
}
function drawSpr(sp, x, y, o = {}) {
  const sx = (o.sx ?? 1) * (o.flip ? -1 : 1), sy = o.sy ?? 1;
  ctx.save();
  ctx.translate(snap(x), snap(y));
  ctx.scale(sx, sy);
  if (o.alpha !== undefined) ctx.globalAlpha = o.alpha;
  const img = o.white ? sp.wc : sp.c;
  const vis = o.vis ?? 1;
  if (vis < 1) ctx.drawImage(img, 0, 0, sp.w, Math.max(1, Math.round(sp.h * vis)), -sp.w / 2, -Math.round(sp.h * vis), sp.w, Math.max(1, Math.round(sp.h * vis)));
  else ctx.drawImage(img, -Math.floor(sp.w / 2), -sp.h);
  if (o.tint && vis >= 1) { ctx.globalAlpha = (o.alpha ?? 1) * o.tintA; ctx.drawImage(tintOf(sp, o.tint), -Math.floor(sp.w / 2), -sp.h); }
  ctx.restore();
}
function drawShadow(x, y, w, z = 0) {
  const k = clamp(1 - z / 60, .35, 1);
  const t = shadowTex(w * k * 1.1);
  ctx.globalAlpha = .36 * k; ctx.drawImage(t, Math.round(x + 1.5 + z * .12 - t.width / 2), Math.round(y + .5 - t.height / 2)); ctx.globalAlpha = 1;
}

/* ================= boss art ================= */
let bossArt = null;
function buildBossArt() {
  const disc = (r, fn) => { const s = r * 2 + 2, [c, x] = makeCanvas(s, s); for (let j = 0; j < s; j++) for (let i = 0; i < s; i++) { const dx = i - r - .5 + .5, dy = j - r - .5 + .5, d = Math.hypot(dx, dy); const col = fn(d, dx, dy, r); if (col) { x.fillStyle = col; x.fillRect(i, j, 1, 1); } } const [w, wx] = makeCanvas(s, s); wx.drawImage(c, 0, 0); wx.globalCompositeOperation = 'source-in'; wx.fillStyle = '#fff'; wx.fillRect(0, 0, s, s); return { c, wc: w, w: s, h: s }; };
  bossArt = {
    body: disc(18, (d, dx, dy, r) => d > r ? null : d > r - 1.2 ? '#160f24' : (dx + dy < -14 ? '#8e66db' : d > r - 4 ? '#3c2b5c' : (Math.sin(dx * .9) * Math.cos(dy * .7) > .85 ? '#b8304f' : '#5a36a0'))),
    sclera: disc(12, (d, dx, dy, r) => d > r ? null : d > r - 1 ? '#2a1d42' : dy > 6 ? '#c9b8e0' : dx + dy < -9 ? '#ffffff' : '#efe6f8'),
    iris: disc(6, (d, dx, dy, r) => d > r ? null : d > r - 1 ? '#5c0f25' : d < 2.5 ? '#ffd166' : '#ff4d6d'),
  };
}
function drawBoss(e) {
  const x = e.x, y = e.y - e.z - 18, A = bossArt;
  // tentacles
  for (let i = 0; i < 7; i++) {
    const b = Math.PI * (.15 + .7 * i / 6), bx = x + Math.cos(b) * 15, by = y + Math.sin(b) * 10;
    for (let s = 0; s < 8; s++) {
      const w = Math.sin(e.t * 2.4 + i * 1.3 + s * .55) * s * .9;
      ctx.fillStyle = s % 2 ? '#3c2b5c' : '#5a36a0';
      const sz = Math.max(1, 4 - s * .4);
      ctx.fillRect(Math.round(bx + Math.cos(b) * s * 2.2 + w - sz / 2), Math.round(by + s * 3 + Math.sin(b) * s - sz / 2), Math.ceil(sz), Math.ceil(sz));
    }
  }
  const fl = e.flash > 0;
  const sx = e.sx * (1 + e.hitSq * .1), sy = e.sy * (1 - e.hitSq * .08);
  ctx.save(); ctx.translate(snap(x), snap(y)); ctx.scale(sx, sy);
  ctx.drawImage(fl ? A.body.wc : A.body.c, -A.body.w / 2, -A.body.h / 2);
  // lid narrowing during slam windup or phase two pulse
  const open = e.pat === 'slam' && e.pt < 1.45 ? .55 : 1;
  ctx.save();
  ctx.beginPath(); ctx.rect(-14, -13 * open, 28, 26 * open); ctx.clip();
  ctx.drawImage(fl ? A.sclera.wc : A.sclera.c, -A.sclera.w / 2, -A.sclera.h / 2);
  const a = angTo(e, player), dd = Math.min(4.5, dist(e, player) / 25);
  const ix = Math.round(Math.cos(a) * dd), iy = Math.round(Math.sin(a) * dd * .8);
  ctx.drawImage(fl ? A.iris.wc : A.iris.c, ix - A.iris.w / 2, iy - A.iris.h / 2);
  ctx.fillStyle = '#12060c'; const pw = e.p2 ? 1 : 2; ctx.fillRect(ix - pw / 2, iy - 4, pw, 8);
  ctx.restore();
  ctx.restore();
}

/* ================= main render ================= */
function render() {
  if (G.menuScene) { renderMenuScene(); drawIris(W / 2, H / 2); return; }
  const th = arena.theme;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = th.bg; ctx.fillRect(0, 0, W, H);
  const tr = cam.shake * cam.shake, sh = Math.min(tr, 1) * 6;
  const camX = cam.x + cam.kx + Math.sin(G.t * 47.3) * sh * Math.sin(G.t * 13.1), camY = cam.y + cam.ky + Math.cos(G.t * 41.7) * sh * Math.sin(G.t * 17.9 + 1);
  const ox = Math.round(-camX * S), oy = Math.round(-camY * S);
  ctx.setTransform(S, 0, 0, S, ox, oy);
  ctx.drawImage(arena.floor, -arena.pad, -arena.pad);
  ctx.drawImage(arena.decal, -arena.pad, -arena.pad);
  drawTufts(camX - 8, camY - 4, camX + VW + 8, camY + VH + 12);

  /* ---- ground layer ---- */
  for (const s of spawns) {
    const p = s.t / s.max, r = 4 + easeOutCubic(Math.min(1, p * 1.4)) * 9;
    ctx.globalAlpha = .35 + .5 * p; ctx.fillStyle = th.rune; pixRing(s.x, s.y, r, .6);
    ctx.globalAlpha = .25 * p; pixDisc(s.x, s.y, r * p, .6);
    ctx.globalAlpha = .8; ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 3; i++) { const b = G.t * 4 + i / 3 * TAU; ctx.fillRect(Math.round(s.x + Math.cos(b) * r), Math.round(s.y + Math.sin(b) * r * .6), 1, 1); }
    ctx.globalAlpha = 1;
  }
  fxDim(true);
  for (const f of flames) { ctx.globalAlpha = .5 * (1 - f.t / f.max); ctx.fillStyle = f.lava ? '#ff4d2e' : '#ff6a2a'; pixDisc(f.x, f.y, f.lava ? 7 : 3, .6); if (f.lava) { ctx.fillStyle = '#ffb347'; pixDisc(f.x, f.y, 3, .6); } }
  for (const m of meteors) {
    const p = clamp(m.t / m.max, 0, 1), col = ELEM[m.el][1];
    ctx.globalAlpha = .25 + .55 * p; ctx.fillStyle = col; pixRing(m.x, m.y, m.R * (1.35 - .35 * p), .62, 1);
    ctx.globalAlpha = .18 * p; pixDisc(m.x, m.y, m.R * p, .62);
  }
  for (const v of vortices) {
    const k = Math.min(1, v.t / .25) * (v.t > v.max - .2 ? (v.max - v.t) / .2 : 1);
    ctx.globalAlpha = .55 * k; ctx.fillStyle = '#0b0614'; pixDisc(v.x, v.y, 26 * k, .62);
    ctx.fillStyle = '#b58cff';
    for (let i = 0; i < 3; i++) { const rr = v.R * (.3 + i * .3) * k; for (let a = 0; a < TAU; a += .35) { const b = a - v.t * (5 - i); ctx.fillRect(Math.round(v.x + Math.cos(b) * rr), Math.round(v.y + Math.sin(b) * rr * .62), 1, 1); } }
  }
  ctx.globalAlpha = 1;
  for (const f of fx) if (f.k === 'ring') {
    const p = easeOutCubic(f.t / f.max); ctx.globalAlpha = 1 - f.t / f.max; ctx.fillStyle = f.col; pixRing(f.x, f.y, lerp(f.r0, f.r1, p), .62, f.w);
  }
  ctx.globalAlpha = 1;
  fxDim(false);
  // telegraphs
  for (const e of enemies) {
    if (e.type === 'skel' && e.state === 'aim' && e.spawnT >= 1) {
      const p = 1 - e.st / .8, L = 40 + p * 130;
      ctx.globalAlpha = e.st < .28 ? (Math.sin(G.t * 60) > 0 ? .9 : .4) : .15 + p * .35;
      ctx.fillStyle = e.st < .28 ? '#ffffff' : '#ff4d6d';
      pixLine(e.x + Math.cos(e.aimA) * 6, e.y - 8 + Math.sin(e.aimA) * 6, e.x + Math.cos(e.aimA) * L, e.y - 8 + Math.sin(e.aimA) * L);
    }
    if (e.type === 'knight' && e.state === 'wind') {
      ctx.globalAlpha = .25 + .3 * Math.abs(Math.sin(G.t * 20)); ctx.fillStyle = '#ff4d6d';
      for (let k = 1; k < 7; k++) { const L = k * 14; pixDisc(e.x + Math.cos(e.facing) * L, e.y + Math.sin(e.facing) * L * .9, 2, .6); }
    }
    if (e.type === 'shroom' && e.state === 'fuse') {
      ctx.globalAlpha = .2 + .3 * (1 - e.st / .85); ctx.fillStyle = '#ff4d6d'; pixRing(e.x, e.y, 34, .62, 1);
    }
    if (e.type === 'boss' && e.pat === 'slam' && e.tgt && !e.slammed) {
      const p = clamp((e.pt - .55) / .9, 0, 1);
      ctx.globalAlpha = .3 + .4 * p; ctx.fillStyle = '#ff4d6d'; pixRing(e.tgt.x, e.tgt.y, 34, .62, 1);
      ctx.globalAlpha = .18 * p; pixDisc(e.tgt.x, e.tgt.y, 34 * p, .62);
    }
  }
  ctx.globalAlpha = 1;

  drawRitualGround(); drawStrikes(); drawHealGround(); ultRenderGround();

  /* ---- shadows ---- */
  if (!player.dead) drawShadow(player.x, player.y, 11, 0);
  for (const e of enemies) if (e.spawnT > 0) drawShadow(e.x, e.y, e.r * 2.4 * (e.type === 'boss' ? 1.4 : 1), e.z);
  for (const h of pickups) drawShadow(h.x, h.y, 6, h.z);
  for (const p of projs) drawShadow(p.x, p.y, p.r * 2 + 1, p.z);

  /* ---- depth-sorted sprites ---- */
  const list = [];
  for (const p of pillars) list.push({ y: p.y, d: () => { const sp = SPR.pillar[th.id][p.v]; ctx.drawImage(sp.c, Math.round(p.x - sp.w / 2), Math.round(p.y - sp.h + 4)); } });
  for (const t of arena.trees) if (t.x > camX - 40 && t.x < camX + VW + 40 && t.y > camY - 10 && t.y < camY + VH + 70) list.push({ y: t.y, d: () => drawTree(t) });
  for (const g of ghosts) list.push({ y: g.y - .1, d: () => { ctx.globalAlpha = .55 * (1 - g.t / .3); ctx.save(); ctx.translate(snap(g.x), snap(g.y)); ctx.scale(g.face, 1); ctx.globalCompositeOperation = 'lighter'; ctx.drawImage(SPR.mageGhost, -6, -17); ctx.restore(); ctx.globalAlpha = 1; } });
  if (!player.dead) list.push({ y: player.y, d: drawPlayer });
  for (const e of enemies) list.push({ y: e.y, d: () => drawEnemy(e) });
  if (G.npc) list.push({ y: G.npc.y, d: drawGhostNpc });
  for (const h of pickups) list.push({ y: h.y, d: () => { const b = Math.sin(h.t * 5) * 1.5; ctx.globalAlpha = h.t > 11 && Math.sin(h.t * 20) > 0 ? .4 : 1; drawSpr(SPR.heart, h.x, h.y - h.z - 2 + b); ctx.globalAlpha = 1; } });
  list.sort((a, b) => a.y - b.y);
  for (const it of list) if (it.y <= arena.h) it.d();
  ctx.drawImage(arena.front, -arena.pad, -arena.pad);
  for (const it of list) if (it.y > arena.h) it.d();
  drawFlies();

  fxDim(true);
  /* ---- projectiles (additive) ---- */
  ctx.globalCompositeOperation = 'lighter';
  for (const p of projs) {
    const c = ELEM[p.elem], zy = -p.z;
    for (let i = 0; i < p.trail.length; i += 2) {
      const k = i / p.trail.length, sz = Math.max(1, Math.round(p.r * 2 * k));
      ctx.globalAlpha = .55 * k; ctx.fillStyle = k > .6 ? c[1] : c[2];
      ctx.fillRect(Math.round(p.trail[i] - sz / 2), Math.round(p.trail[i + 1] + zy - sz / 2), sz, sz);
    }
    ctx.globalAlpha = .55; const g = p.r * 5; ctx.drawImage(glowTex(c[1]), p.x - g, p.y + zy - g, g * 2, g * 2);
    ctx.globalAlpha = 1;
  }
  // orbit orbs
  if (spell.orbit && !player.dead) for (let i = 0; i < spell.orbit; i++) {
    const a = player.orbA + i / spell.orbit * TAU, x = player.x + Math.cos(a) * 24, y = player.y + Math.sin(a) * 18 - 8;
    ctx.globalAlpha = .5; ctx.drawImage(glowTex('#b58cff'), x - 12, y - 12, 24, 24); ctx.globalAlpha = 1;
    ctx.fillStyle = '#d6c2ff'; ctx.fillRect(Math.round(x - 2), Math.round(y - 2), 4, 4); ctx.fillStyle = '#fff'; ctx.fillRect(Math.round(x - 1), Math.round(y - 1), 2, 2);
  }
  ctx.globalCompositeOperation = 'source-over';
  for (const p of projs) {
    const c = ELEM[p.elem], y = p.y - p.z, r = Math.max(1.5, p.r);
    if (p.sing) {
      ctx.fillStyle = '#d6c2ff'; pixDisc(p.x, y, r + 1, 1); ctx.fillStyle = '#0b0614'; pixDisc(p.x, y, r, 1);
      ctx.fillStyle = '#ffffff'; for (let i = 0; i < 4; i++) { const b = p.spin * .4 + i / 4 * TAU; ctx.fillRect(Math.round(p.x + Math.cos(b) * (r + 3)), Math.round(y + Math.sin(b) * (r + 3) * .7), 1, 1); }
      continue;
    }
    if (p.boomer) {
      ctx.save(); ctx.translate(snap(p.x), snap(y)); ctx.rotate(p.spin);
      ctx.fillStyle = c[2]; ctx.fillRect(-r * 1.6, -1.5, r * 3.2, 3); ctx.fillRect(-1.5, -r * 1.6, 3, r * 3.2);
      ctx.fillStyle = c[1]; ctx.fillRect(-r * 1.3, -.5, r * 2.6, 1); ctx.fillRect(-.5, -r * 1.3, 1, r * 2.6);
      ctx.fillStyle = c[0]; ctx.fillRect(-1, -1, 2, 2);
      ctx.restore(); continue;
    }
    ctx.fillStyle = c[1]; ctx.fillRect(Math.round(p.x - r), Math.round(y - r + 1), Math.round(r * 2), Math.round(r * 2 - 2)); ctx.fillRect(Math.round(p.x - r + 1), Math.round(y - r), Math.round(r * 2 - 2), Math.round(r * 2));
    ctx.fillStyle = c[0]; const cr = Math.max(1, Math.round(r * .9)); ctx.fillRect(Math.round(p.x - cr / 2), Math.round(y - cr / 2), cr, cr);
  }
  /* ---- particles ---- */
  for (const p of parts) {
    const k = 1 - p.life / p.max, col = p.cols[Math.min(p.cols.length - 1, Math.floor(k * p.cols.length))];
    if (p.add) ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = p.life / p.max < .3 ? p.life / p.max / .3 : 1;
    ctx.fillStyle = col; const s = p.size;
    ctx.fillRect(Math.round(p.x - s / 2), Math.round(p.y - p.z - s / 2), Math.ceil(s), Math.ceil(s));
    if (p.add) ctx.globalCompositeOperation = 'source-over';
  }
  ctx.globalAlpha = 1;
  /* ---- fx ---- */
  for (const f of fx) {
    const p = f.t / f.max;
    if (f.k === 'boom') {
      const r = f.R * easeOutCubic(Math.min(1, p * 1.6));
      if (p < .12) { ctx.fillStyle = '#ffffff'; pixDisc(f.x, f.y - 4, r * .8, .8); }
      else { ctx.globalAlpha = (1 - p) * .85; ctx.fillStyle = f.cols[1]; pixDisc(f.x, f.y - 4 - p * 6, r, .8); ctx.fillStyle = f.cols[0]; pixDisc(f.x, f.y - 4 - p * 8, r * (1 - p) * .7, .8); ctx.globalAlpha = 1; }
    } else if (f.k === 'arc') {
      ctx.fillStyle = Math.random() < .5 ? '#ffffff' : '#fff27a'; ctx.globalAlpha = 1 - p;
      for (let i = 0; i < f.pts.length - 2; i += 2) pixLine(f.pts[i], f.pts[i + 1], f.pts[i + 2], f.pts[i + 3]);
      ctx.globalAlpha = 1;
    } else if (f.k === 'beam') {
      const k = 1 - p, w = f.w * Math.sqrt(k) * (Math.random() < .3 ? .8 : 1);
      for (const s of f.segs) {
        const L = Math.hypot(s[2] - s[0], s[3] - s[1]), a = Math.atan2(s[3] - s[1], s[2] - s[0]);
        ctx.save(); ctx.translate(s[0], s[1]); ctx.rotate(a);
        ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = .35 * k; ctx.fillStyle = f.cols[2]; ctx.fillRect(0, -w * 2, L, w * 4);
        ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = Math.min(1, k * 1.6);
        ctx.fillStyle = f.cols[1]; ctx.fillRect(0, -w / 2, L, w);
        ctx.fillStyle = f.cols[0]; ctx.fillRect(0, -w / 5, L, Math.max(1, w * .4));
        ctx.restore();
      }
      ctx.globalAlpha = 1;
    } else if (f.k === 'flash') {
      ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = (1 - p) * .45;
      ctx.drawImage(glowTex(f.col), f.x - f.r, f.y - f.r - 4, f.r * 2, f.r * 2);
      ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
    }
  }
  for (const m of meteors) {
    if (m.t <= 0) continue;
    const p = m.t / m.max, x = m.hop ? lerp(m.sx, m.x, p) : m.x + (1 - p) * 50, y = m.hop ? lerp(m.sy, m.y, p) - Math.sin(p * Math.PI) * 26 : m.y - (1 - p) * 170, c = ELEM[m.el], r = (3 + spell.size) * (m.hop ? .8 : 1);
    ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = .7; ctx.drawImage(glowTex(c[1]), x - r * 5, y - r * 5, r * 10, r * 10); ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
    ctx.fillStyle = c[2]; pixDisc(x, y, r + 1, 1); ctx.fillStyle = c[1]; pixDisc(x - .5, y - .5, r, 1); ctx.fillStyle = '#ffffff'; pixDisc(x - 1, y - 1, r * .45, 1);
  }
  drawEvoAir();
  drawRitualAir(); ultRenderAir();
  fxDim(false);
  /* ---- drifting petals, cloud shadows, sun shafts ---- */
  for (const m of motes) { ctx.fillStyle = m.c; ctx.fillRect(Math.round(m.x), Math.round(m.y - m.z), Math.sin(m.ph * 3) > .2 ? 2 : 1, 1); }
  drawSkyLight(th);

  /* ---- lighting ---- */
  const lights = [], d0 = th.dark;
  if (!player.dead) lights.push([player.x, player.y - 6, 110, d0[3] ? 1 : .4, '#9b8cff']);
  for (const p of projs) lights.push([p.x, p.y - p.z, 30 * spell.size, .7, ELEM[p.elem][1]]);
  for (const b of eprojs) lights.push([b.x, b.y - 6, 20, .5, b.kind === 'arrow' ? '#ffffff' : b.kind === 'boss' ? '#ff4d6d' : '#b58cff']);
  for (const f of fx) if (f.k === 'beam') for (const s of f.segs) { const L = Math.hypot(s[2] - s[0], s[3] - s[1]); for (let d = 0; d < L; d += 45) lights.push([s[0] + (s[2] - s[0]) * d / L, s[1] + (s[3] - s[1]) * d / L, 70, 1 - f.t / f.max, f.cols[1]]); }
  for (const m of meteors) if (m.t > 0) lights.push([m.x, m.y, 40 + 60 * m.t / m.max, .8, ELEM[m.el][1]]);
  for (const v of vortices) lights.push([v.x, v.y, 120, .7, '#b58cff']);
  for (const p of projs) if (p.sing) lights.push([p.x, p.y, 90, .8, '#b58cff']);
  for (const f of fx) if (f.k === 'boom' || f.k === 'flash') lights.push([f.x, f.y, (f.R || f.r) * 3, 1 - f.t / f.max, f.cols ? f.cols[1] : f.col]);
  for (const s of spawns) lights.push([s.x, s.y, 30, .6, th.rune]);
  for (const f of flames) lights.push([f.x, f.y, 26, .5 * (1 - f.t / f.max), '#ff7a3d']);
  for (const e of enemies) if (e.type === 'wraith' || e.type === 'boss' || e.burnT > 0) lights.push([e.x, e.y - 8, e.type === 'boss' ? 120 : 30, .6 * e.alpha, e.type === 'boss' ? '#ff4d6d' : e.burnT > 0 ? '#ff7a3d' : '#a688f0']);
  if (spell.orbit && !player.dead) lights.push([player.x, player.y - 8, 50, .5, '#b58cff']);
  const L = lctx, d = d0;
  if (d[3] > 0) {
    // dusk: dim the world and let spells punch light into it
    L.setTransform(1, 0, 0, 1, 0, 0); L.globalCompositeOperation = 'source-over'; L.clearRect(0, 0, lightCv.width, lightCv.height);
    L.fillStyle = `rgba(${d[0]},${d[1]},${d[2]},${d[3]})`; L.fillRect(0, 0, lightCv.width, lightCv.height);
    L.globalCompositeOperation = 'destination-out';
    const lx0 = Math.floor(camX / 2), ly0 = Math.floor(camY / 2);
    for (const l of lights) { const r = l[2] / 2; L.globalAlpha = clamp(l[3], 0, 1); L.drawImage(holeTex, l[0] / 2 - lx0 - r, l[1] / 2 - ly0 - r, r * 2, r * 2); }
    L.globalAlpha = 1;
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.imageSmoothingEnabled = true;
    ctx.drawImage(lightCv, Math.round((lx0 * 2 - camX) * S), Math.round((ly0 * 2 - camY) * S), lightCv.width * 2 * S, lightCv.height * 2 * S);
    ctx.setTransform(S, 0, 0, S, ox, oy);
  }
  ctx.imageSmoothingEnabled = true;
  ctx.globalCompositeOperation = 'lighter';
  const glowK = d[3] ? .16 : .11;
  for (const l of lights) { ctx.globalAlpha = clamp(l[3], 0, 1) * glowK; const r = l[2] * .7; ctx.drawImage(glowTex(l[4]), l[0] - r, l[1] - r, r * 2, r * 2); }
  ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
  ctx.imageSmoothingEnabled = false;

  /* ---- enemy projectiles: drawn last so they are never hidden ---- */
  for (const b of eprojs) {
    if (b.kind === 'arrow' || b.kind === 'spike') {
      ctx.save(); ctx.translate(snap(b.x), snap(b.y - 8)); ctx.rotate(Math.atan2(b.vy, b.vx));
      ctx.fillStyle = '#160f24'; ctx.fillRect(-5, -1.5, 10, 3);
      ctx.fillStyle = '#ece6d2'; ctx.fillRect(-4, -.5, 7, 1); ctx.fillStyle = '#ff4d6d'; ctx.fillRect(3, -1, 2, 2);
      ctx.restore();
    } else {
      const pulse = Math.sin(b.t * 18) > 0, y = b.y - 6, r = b.r + (pulse ? .5 : 0);
      const col = b.rewrite || b.friendly ? '#8fe6ff' : EPCOL[b.kind] || '#b58cff';
      ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = .45; ctx.drawImage(glowTex(col), b.x - 10, y - 10, 20, 20); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = '#160f24'; pixDisc(b.x, y, r + 1, 1);
      ctx.fillStyle = col; pixDisc(b.x, y, r, 1);
      ctx.fillStyle = '#ffffff'; ctx.fillRect(Math.round(b.x - 1), Math.round(y - 1), 2, 2);
    }
  }


  /* ---- screen space ---- */
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  drawGrade(th);
  ultRenderScreen(camX, camY, ox, oy);
  ctx.drawImage(vignette, 0, 0);
  if (G.timeField > 0) { ctx.globalAlpha = .1 * Math.min(1, G.timeField); ctx.fillStyle = '#5fb0ff'; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1; }
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  for (const t of texts) {
    const p = t.t / t.max, pop = t.t < .14 ? easeOutBack(t.t / .14) : 1;
    const x = (t.x - camX) * S, y = (t.y - camY - easeOutCubic(p) * 14) * S;
    const fs = Math.round(4 * S * t.scale * pop * (DPR > 1 ? 1 : 1));
    if (fs < 2) continue;
    ctx.font = `${fs}px "Press Start 2P", monospace`;
    ctx.globalAlpha = p > .7 ? 1 - (p - .7) / .3 : 1;
    ctx.fillStyle = '#160f24'; ctx.fillText(t.txt, x + S * .6, y + S * .6);
    ctx.fillStyle = t.col; ctx.fillText(t.txt, x, y);
  }
  ctx.globalAlpha = 1;
  drawBubbles(camX, camY);
  if (G.state === 'play' || G.state === 'clear') drawCrosshair();
  drawIris((player.x - camX) * S, (player.y - 8 - camY) * S);
}
function drawCrosshair() {
  // a spinning purple vortex: black outline, violet arms, white core, always the top layer
  const x = Math.round(mouse.x), y = Math.round(mouse.y), u = Math.max(2, Math.round(S * .7));
  const R = (9 + Math.max(0, player.fireCd) * spell.rate * 4) * u, spin = G.t * 5;
  const arm = (size, col, grow) => {
    ctx.fillStyle = col;
    for (let k = 0; k < 3; k++) for (let t = .18; t <= 1; t += .07) {
      const a = spin + k * TAU / 3 + t * 3.4, r = t * R, s = Math.max(u, Math.round(size * (1.2 - t * .5))) + grow;
      ctx.fillRect(Math.round(x + Math.cos(a) * r - s / 2), Math.round(y + Math.sin(a) * r - s / 2), s, s);
    }
  };
  arm(u * 2, '#0b0614', u * 2);
  arm(u * 2, '#b026ff', 0);
  arm(u, '#f0c8ff', 0);
  ctx.fillStyle = '#0b0614'; ctx.fillRect(x - u * 2, y - u * 2, u * 4, u * 4);
  ctx.fillStyle = Math.sin(G.t * 10) > 0 ? '#ffffff' : '#e6a8ff'; ctx.fillRect(x - u, y - u, u * 2, u * 2);
}
function drawPlayer() {
  const p = player;
  const blink = p.inv > 0 && p.dashT <= 0 && Math.floor(p.inv * 14) % 2 === 0;
  const bob = p.moving ? -Math.abs(Math.sin(p.walkT * Math.PI)) * 1.5 : Math.sin(G.t * 2.5) * .5;
  const fr = p.moving ? p.frame : 3;
  const breathe = p.moving ? 0 : Math.sin(G.t * 2.5) * .03;
  // focus crystal behind body when aiming upward
  const ca = p.staffA, cx = p.x + Math.cos(ca) * 10, cy = p.y - 9 + Math.sin(ca) * 6 + Math.sin(G.t * 4) * 1;
  const behind = Math.sin(ca) < -.2;
  const crystal = () => {
    const c = ELEM[elemOf()];
    ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = .6; ctx.drawImage(glowTex(c[1]), cx - 10, cy - 10, 20, 20); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = '#160f24'; ctx.fillRect(Math.round(cx - 2), Math.round(cy - 3), 4, 6);
    ctx.fillStyle = c[1]; ctx.fillRect(Math.round(cx - 1), Math.round(cy - 3), 2, 6); ctx.fillRect(Math.round(cx - 2), Math.round(cy - 1), 4, 2);
    ctx.fillStyle = '#fff'; ctx.fillRect(Math.round(cx - 1), Math.round(cy - 2), 1, 2);
  };
  if (p.charge > 0) {
    const c = ELEM[elemOf()], full = p.charge >= 1, cc = Math.min(1, p.charge), over = Math.max(0, p.charge - 1) / 1.5;
    ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = .4 + .5 * cc;
    const gr = 8 + cc * 16 + over * 14 + (full ? Math.sin(G.t * 30) * 3 : 0); ctx.drawImage(glowTex(full ? '#ffffff' : c[1]), cx - gr, cy - gr, gr * 2, gr * 2);
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = .12 + .25 * cc; ctx.fillStyle = over > 0 ? '#ffd166' : full ? '#ffffff' : c[1];
    for (let d = 14; d < 150; d += 6) ctx.fillRect(Math.round(cx + Math.cos(p.aim) * d), Math.round(cy + Math.sin(p.aim) * d), 1, 1);
    ctx.globalAlpha = 1;
    const bw = 14, bx = Math.round(p.x - bw / 2), by = Math.round(p.y + 3);
    ctx.fillStyle = '#160f24'; ctx.fillRect(bx - 1, by - 1, bw + 2, 3); ctx.fillStyle = full ? '#ffffff' : c[1]; ctx.fillRect(bx, by, Math.round(bw * cc), 1);
    if (over > 0) { ctx.fillStyle = '#160f24'; ctx.fillRect(bx - 1, by + 2, bw + 2, 3); ctx.fillStyle = '#ffd166'; ctx.fillRect(bx, by + 3, Math.round(bw * over), 1); }
  }
  if (behind) crystal();
  ctx.globalAlpha = blink ? .35 : 1;
  drawSpr(SPR.mage[fr], p.x, p.y + bob * 0, { flip: p.face < 0, sx: p.sqx * (1 - breathe), sy: p.sqy * (1 + breathe), ...ultPlayerLook() });
  ctx.globalAlpha = 1;
  if (!behind) crystal();
}
function drawEnemy(e) {
  if (EDRAW[e.type]) { EDRAW[e.type](e); drawHpPip(e); return; }
  if (e.type === 'boss') { if (e.spawnT > 0) drawBoss(e); drawHpPip(e); return; }
  let sp, extraY = 0;
  switch (e.type) {
    case 'slime': sp = SPR.slime[0]; break;
    case 'mini': sp = SPR.slime[1]; break;
    case 'bat': sp = SPR.bat[Math.floor(e.t * (e.state === 'dive' ? 20 : 12)) % 2]; break;
    case 'skel': sp = SPR.skel; break;
    case 'shroom': sp = SPR.shroom; break;
    case 'knight': sp = SPR.knight; break;
    case 'wraith': sp = SPR.wraith; break;
  }
  const vis = e.spawnT < 1 ? easeOutCubic(e.spawnT) : 1;
  const sx = e.sx * (1 + e.hitSq * .3) * (e.scale || 1), sy = e.sy * (1 - e.hitSq * .22) * (e.scale || 1);
  let x = e.x, y = e.y - e.z;
  if (e.shk && !(e.frozen > 0)) x += Math.sin(G.t * 70) * .8;
  const tint = e.frozen > 0 ? '#c6f6ff' : e.burnT > 0 ? '#ff7a3d' : e.slowT > 0 ? '#7ad0ff' : null;
  const alpha = e.type === 'wraith' ? e.alpha * (.75 + .2 * Math.sin(e.t * 9)) : 1;
  // knight shield
  const shield = () => {
    if (e.type !== 'knight') return;
    const down = e.state === 'stun';
    const f = e.facing, sxp = x + Math.cos(f) * 8, syp = y - (down ? 2 : 7) + Math.sin(f) * 4;
    ctx.save(); ctx.translate(snap(sxp), snap(syp));
    const wv = Math.max(2, Math.round(Math.abs(Math.sin(f)) * 7 + 3));
    ctx.fillStyle = '#160f24'; ctx.fillRect(-wv / 2 - 1, -7, wv + 2, 13);
    ctx.fillStyle = e.flash > 0 ? '#fff' : down ? '#565f75' : '#9aa6bf'; ctx.fillRect(-wv / 2, -6, wv, 11);
    ctx.fillStyle = down ? '#8a7a40' : '#ffd166'; ctx.fillRect(-1, -3, 2, 5);
    ctx.restore();
  };
  const shieldBehind = e.type === 'knight' && Math.sin(e.facing) < 0;
  if (shieldBehind) shield();
  drawSpr(sp, x, y, { flip: e.face < 0, sx, sy, white: e.flash > 0, vis, alpha, tint, tintA: e.frozen > 0 ? .7 : .45 });
  if (!shieldBehind) shield();
  if (e.type === 'skel' && e.spawnT >= 1) {
    const a = e.state === 'aim' ? e.aimA : (e.face > 0 ? 0 : Math.PI), bx = x + Math.cos(a) * 6, by = y - 9 + Math.sin(a) * 4;
    ctx.save(); ctx.translate(snap(bx), snap(by)); ctx.rotate(a);
    ctx.fillStyle = '#7a5a3a'; ctx.fillRect(0, -5, 1, 1); ctx.fillRect(1, -4, 1, 8); ctx.fillRect(0, 4, 1, 1);
    ctx.fillStyle = '#ece6d2'; ctx.fillRect(0, -4, 1, 8);
    if (e.state === 'aim') { const pull = Math.min(1, (1 - e.st / .8) * 1.5) * 3; ctx.fillRect(-pull, -.5, 5 + pull, 1); }
    ctx.restore();
  }
  if (e.type === 'knight' && e.state === 'stun') {
    for (let i = 0; i < 3; i++) { const b = G.t * 5 + i / 3 * TAU; ctx.fillStyle = '#ffd166'; ctx.fillRect(Math.round(x + Math.cos(b) * 6), Math.round(y - 17 + Math.sin(b) * 2), 1, 1); }
  }
  if (e.type === 'knight' && e.state === 'wind') { ctx.fillStyle = '#ff4d6d'; ctx.fillRect(Math.round(x - 1), Math.round(y - 22), 2, 4); ctx.fillRect(Math.round(x - 1), Math.round(y - 17), 2, 1); }
  if (e.type === 'wraith' && e.state === 'cast') { ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = .7; const r = 8 + 6 * (1 - e.st / .7); ctx.drawImage(glowTex('#a688f0'), x - r, y - 8 - r, r * 2, r * 2); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; }
  drawHpPip(e);
}
function drawHpPip(e) {
  if (e.type === 'boss' || e.elite || e.hp >= e.maxHp || e.spawnT < 1) return;
  const w = Math.max(8, e.r * 2), x = Math.round(e.x - w / 2), y = Math.round(e.y - e.z - e.h - 5);
  ctx.fillStyle = '#160f24'; ctx.fillRect(x - 1, y - 1, w + 2, 3);
  ctx.fillStyle = '#ff4d6d'; ctx.fillRect(x, y, Math.max(1, Math.round(w * e.hp / e.maxHp)), 1);
}

/* ================= valley scenery ================= */
const cloudTex = (() => {
  const [c, x] = makeCanvas(200, 120);
  for (let i = 0; i < 8; i++) {
    const cx = rand(50, 150), cy = rand(40, 80), r = rand(24, 44), g = x.createRadialGradient(cx, cy, 0, cx, cy, r);
    g.addColorStop(0, 'rgba(10,38,32,.9)'); g.addColorStop(.6, 'rgba(10,38,32,.5)'); g.addColorStop(1, 'rgba(10,38,32,0)');
    x.fillStyle = g; x.fillRect(0, 0, 200, 120);
  }
  return c;
})();
const shaftBase = (() => {
  const [c, x] = makeCanvas(64, 256), g = x.createLinearGradient(0, 0, 64, 0);
  g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(.5, 'rgba(255,255,255,1)'); g.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = g; x.fillRect(0, 0, 64, 256);
  x.globalCompositeOperation = 'destination-in';
  const v = x.createLinearGradient(0, 0, 0, 256);
  v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(.2, 'rgba(0,0,0,1)'); v.addColorStop(.75, 'rgba(0,0,0,.55)'); v.addColorStop(1, 'rgba(0,0,0,0)');
  x.fillStyle = v; x.fillRect(0, 0, 64, 256);
  return { c, w: 64, h: 256 };
})();
function drawTufts(x0, y0, x1, y1) {
  const T = arena.theme.tuft, vis = [];
  for (const tf of arena.tufts) {
    if (tf.y < y0) continue; if (tf.y > y1) break; if (tf.x < x0 || tf.x > x1) continue;
    let [s, gu] = windAt(tf.x, tf.y, G.t);
    if (!player.dead) {
      const dx = tf.x - player.x, dy = (tf.y - player.y) * 1.6, d2 = dx * dx + dy * dy;
      if (d2 < 140) s += (dx >= 0 ? 1 : -1) * 3.2 * (1 - Math.sqrt(d2) / 12);
    }
    vis.push(tf, s, gu);
  }
  // one pass per colour keeps fillStyle switches low
  for (let pass = 0; pass < 3; pass++) {
    ctx.fillStyle = T[pass];
    for (let i = 0; i < vis.length; i += 3) {
      const tf = vis[i], s = vis[i + 1];
      for (let b = 0; b < tf.n; b++) {
        const bx = tf.x + b * 2 - tf.n + 1, hh = tf.h - (b & 1);
        for (let k = 0; k < hh; k++) {
          const lvl = k === hh - 1 ? 2 : k >= hh / 2 ? 1 : 0;
          if (lvl !== pass) continue;
          ctx.fillRect(bx + Math.round(s * Math.pow(k / hh, 1.4) * hh / 3.5), tf.y - k, 1, 1);
        }
      }
    }
  }
  // gust fronts catch the light on the blade tips; flowers ride on top
  ctx.fillStyle = T[3];
  for (let i = 0; i < vis.length; i += 3) { const tf = vis[i], s = vis[i + 1], gu = vis[i + 2]; if (gu > .3) ctx.fillRect(tf.x + Math.round(s * tf.h / 3.5), tf.y - tf.h + 1, 1, 1); }
  for (let i = 0; i < vis.length; i += 3) {
    const tf = vis[i]; if (!tf.fl) continue;
    const s = vis[i + 1], fx = tf.x + Math.round(s * tf.h / 3.2), fy = tf.y - tf.h - 1;
    ctx.fillStyle = tf.fl; ctx.fillRect(fx - 1, fy, 3, 1); ctx.fillRect(fx, fy - 1, 1, 3);
    ctx.fillStyle = tf.fl === '#ffe066' ? '#ffffff' : '#ffe066'; ctx.fillRect(fx, fy, 1, 1);
  }
}
function drawTree(t) {
  const sp = SPR.tree[arena.theme.id][t.v], [s] = windAt(t.x, t.y, G.t);
  const sw = s * .45 + Math.sin(G.t * 1.1 + t.ph) * .35;
  ctx.drawImage(sp.trunk, Math.round(t.x - 23), Math.round(t.y - 55));
  ctx.drawImage(sp.crown, snap(t.x - 23 + sw), snap(t.y - 55 + Math.abs(sw) * .15));
}
function drawFlies() {
  for (const b of arena.flies) {
    const open = Math.sin(b.t * 24) > 0, x = Math.round(b.x), y = Math.round(b.y - b.z);
    ctx.globalAlpha = .22; ctx.fillStyle = '#0d2414'; ctx.fillRect(x, Math.round(b.y), 2, 1); ctx.globalAlpha = 1;
    ctx.fillStyle = b.col;
    if (open) { ctx.fillRect(x - 2, y - 1, 2, 2); ctx.fillRect(x + 1, y - 1, 2, 2); } else { ctx.fillRect(x - 1, y - 2, 1, 2); ctx.fillRect(x + 1, y - 2, 1, 2); }
    ctx.fillStyle = '#2a1a10'; ctx.fillRect(x, y - 1, 1, 2);
  }
}
function drawSkyLight(th) {
  // drifting cloud shadows, then warm light shafts slanting down from the upper left
  ctx.imageSmoothingEnabled = true;
  ctx.globalAlpha = th.cloud;
  for (const c of arena.clouds) ctx.drawImage(cloudTex, c.x - 200 * c.s, c.y - 120 * c.s, 400 * c.s, 240 * c.s);
  ctx.globalCompositeOperation = 'lighter';
  const tex = tintOf(shaftBase, th.shaft);
  for (const s of arena.shafts) {
    ctx.globalAlpha = .07 + .045 * Math.sin(G.t * .35 + s.ph);
    ctx.save(); ctx.translate(s.x, -80); ctx.rotate(-.42); ctx.drawImage(tex, -s.w / 2, 0, s.w, arena.h + 300); ctx.restore();
  }
  ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
  ctx.imageSmoothingEnabled = false;
}
function drawGrade(th) {
  const wm = th.warm, cl = th.cool;
  ctx.globalCompositeOperation = 'screen';
  let g = ctx.createRadialGradient(0, 0, 0, 0, 0, Math.hypot(W, H) * .95);
  g.addColorStop(0, `rgba(${wm[0]},${wm[1]},${wm[2]},${wm[3]})`); g.addColorStop(1, `rgba(${wm[0]},${wm[1]},${wm[2]},0)`);
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  ctx.globalCompositeOperation = 'multiply';
  g = ctx.createLinearGradient(0, 0, W, H);
  g.addColorStop(.45, 'rgba(255,255,255,0)'); g.addColorStop(1, `rgba(${cl[0]},${cl[1]},${cl[2]},${cl[3] * 2.5})`);
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  ctx.globalCompositeOperation = 'source-over';
}
