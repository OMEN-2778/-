
/* ================= main menu: a side-scrolling walk through the valley ================= */
let MS = null;
function ridgeLayer(TW, H, base, amps, cols, snow) {
  const [c, x] = makeCanvas(TW, H), ph = [rand(TAU), rand(TAU), rand(TAU)];
  const yAt = i => base - (amps[0] * Math.sin(TAU * i / TW + ph[0]) + amps[1] * Math.sin(TAU * 3 * i / TW + ph[1]) + amps[2] * Math.sin(TAU * 7 * i / TW + ph[2]));
  const peak = base - amps[0] * .55;
  for (let i = 0; i < TW; i++) {
    const y = Math.round(yAt(i)), lit = yAt(i + 1) > yAt(i);
    x.fillStyle = lit ? cols[1] : cols[0]; x.fillRect(i, y, 1, Math.ceil(H * .66) - y);
    if (snow && y < peak) { x.fillStyle = cols[2]; x.fillRect(i, y, 1, Math.round((peak - y) * .7) + 1); }
  }
  // aerial haze toward the foot of the range
  const g = x.createLinearGradient(0, base - amps[0], 0, H * .66);
  g.addColorStop(0, 'rgba(225,240,255,0)'); g.addColorStop(1, 'rgba(225,240,255,.55)');
  x.globalCompositeOperation = 'source-atop'; x.fillStyle = g; x.fillRect(0, 0, TW, H);
  return c;
}
function forestLayer(TW, H, y0) {
  const [c, x] = makeCanvas(TW, H), P = ['#163a26', '#24533a', '#2f6b45', '#4a8f56'];
  const tree = (tx, h, round) => {
    if (round) { blobShade(x, Math.round(tx), Math.round(y0 - h * .55), [[0, 0, h * .42], [-h * .28, h * .12, h * .3], [h * .28, h * .1, h * .3]], P); return; }
    for (let k = 0; k < h; k++) {
      const half = Math.round((k / h) * h * .32 + (k % 5 < 2 ? 1 : 0));
      x.fillStyle = P[0]; x.fillRect(Math.round(tx - half - 1), Math.round(y0 - h + k), half * 2 + 2, 1);
      x.fillStyle = P[2]; x.fillRect(Math.round(tx - half), Math.round(y0 - h + k), half * 2, 1);
      x.fillStyle = P[3]; x.fillRect(Math.round(tx - half), Math.round(y0 - h + k), Math.max(1, Math.round(half * .7)), 1);
    }
  };
  const list = [];
  for (let tx = 0; tx < TW; tx += randi(5, 9)) list.push([tx, rand(H * .07, H * .15), Math.random() < .4]);
  list.sort((a, b) => a[1] - b[1]);
  for (const [tx, h, r] of list) { tree(tx, h, r); if (tx < 30) tree(tx + TW, h, r); if (tx > TW - 30) tree(tx - TW, h, r); }
  x.fillStyle = P[0]; x.fillRect(0, Math.round(y0 - 1), TW, 6);
  x.fillStyle = P[1]; x.fillRect(0, Math.round(y0 - 2), TW, 2);
  return c;
}
function groundLayer(TW, H) {
  const [c, x] = makeCanvas(TW, H), top = Math.round(H * .70), r0 = Math.round(H * .79), r1 = Math.round(H * .89);
  const bay = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5], n = makeNoise(TW + 40, H, 14);
  const G = ['#3f8f3f', '#55a748', '#6fbf55', '#8fd168'];
  for (let y = top; y < H; y++) for (let i = 0; i < TW; i++) {
    if (y >= r0 && y < r1) continue;
    const t = n(i % TW, y) * .8 + (bay[(y & 3) * 4 + (i & 3)] / 16 - .5) * .15;
    x.fillStyle = G[t < .32 ? 0 : t < .55 ? 1 : t < .74 ? 2 : 3]; x.fillRect(i, y, 1, 1);
  }
  x.fillStyle = '#2c6532'; x.fillRect(0, top, TW, 2); x.fillStyle = '#8fd168'; x.fillRect(0, top + 2, TW, 1);
  // the dirt road
  for (let y = r0; y < r1; y++) { x.fillStyle = y === r0 ? '#e8c98e' : y < r0 + 2 ? '#dcb97c' : y > r1 - 2 ? '#a78450' : '#c9a46a'; x.fillRect(0, y, TW, 1); }
  for (let k = 0; k < 2; k++) { const ry = r0 + 3 + k * 4; for (let i = 0; i < TW; i += randi(3, 9)) { x.fillStyle = '#b08a52'; x.fillRect(i, ry, randi(2, 6), 1); } }
  for (let i = 0; i < 70; i++) { const px = randi(0, TW - 3), py = randi(r0 + 1, r1 - 2); x.fillStyle = '#8f7a5a'; x.fillRect(px, py, 2, 1); x.fillStyle = '#efe0bc'; x.fillRect(px, py, 1, 1); }
  for (let i = 0; i < 90; i++) { const px = randi(0, TW), py = randi(top + 4, H); if (py >= r0 - 1 && py <= r1) continue; x.fillStyle = pick(['#ffffff', '#ffe066', '#ffc4e1', '#c99bff']); x.fillRect(px, py, 1, 1); }
  return c;
}
function buildMenuScene() {
  const H = Math.ceil(VH) + 2, TW = 512;
  MS = { H, VWb: VW, TW,
    far: ridgeLayer(TW, H, H * .42, [H * .09, H * .04, H * .015], ['#7f9fcb', '#a3bfe4', '#f4f8ff'], true),
    near: ridgeLayer(TW, H, H * .52, [H * .05, H * .03, H * .012], ['#5b8c86', '#7aab98', null], false),
    forest: forestLayer(TW, H, H * .61), ground: groundLayer(TW, H),
    clouds: Array.from({ length: 7 }, () => ({ x: rand(0, VW + 100), y: rand(H * .04, H * .3), s: rand(.6, 1.4), sp: rand(2, 6), v: randi(0, 2) })),
    birds: Array.from({ length: 6 }, (_, i) => ({ x: rand(0, VW), y: rand(H * .1, H * .35), sp: rand(18, 30), ph: rand(TAU), g: i < 3 })),
    flies: Array.from({ length: 5 }, () => ({ x: rand(0, VW), y: rand(H * .72, H * .95), ph: rand(TAU), col: pick(['#ffffff', '#ffe066', '#9fd8ff', '#ffb0d0']) })),
    tufts: Array.from({ length: 140 }, () => { const band = Math.random() < .5; return { x: rand(0, TW), y: band ? rand(H * .71, H * .785) : rand(H * .895, H * .98), h: randi(3, 7), fl: Math.random() < .2 ? pick(['#ffffff', '#ffe066', '#ffc4e1']) : null }; }),
    petals: Array.from({ length: 26 }, () => ({ x: rand(0, VW), y: rand(0, H), ph: rand(TAU), c: pick(['#ffffff', '#ffd6ea', '#fff3b0']) })),
    cloudSpr: [0, 1, 2].map(v => { const [c, x] = makeCanvas(70, 30); blobShade(x, 35, 18, v === 0 ? [[0, 0, 10], [-12, 3, 8], [12, 3, 8], [-22, 6, 5], [22, 6, 5]] : v === 1 ? [[0, 0, 8], [-9, 3, 6], [9, 2, 7], [16, 5, 4]] : [[0, 0, 12], [-14, 4, 9], [14, 4, 9], [-6, -6, 7], [7, -5, 7]], ['#b9d4ee', '#d9ebfa', '#ffffff', '#ffffff']); return c; }),
  };
  const [sc, sx] = makeCanvas(Math.ceil(VW) + 2, H), bay = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
  const sky = ['#3d8fe0', '#5aa6ec', '#7bbcf2', '#9fd0f6', '#c4e4fa', '#e2f3fd'];
  for (let y = 0; y < H * .62; y++) for (let i = 0; i < sc.width; i++) {
    const f = y / (H * .62) * (sky.length - 1) + (bay[(y & 3) * 4 + (i & 3)] / 16 - .5) * .9;
    sx.fillStyle = sky[clamp(Math.round(f), 0, sky.length - 1)]; sx.fillRect(i, y, 1, 1);
  }
  MS.sky = sc;
}
function drawTiled(img, off, TW, y0 = 0, h = null, dy = null) {
  const o = ((off % TW) + TW) % TW, H_ = h ?? img.height;
  for (let x = -o; x < VW; x += TW) ctx.drawImage(img, 0, y0, TW, H_, x, dy ?? y0, TW, H_);
}
function renderMenuScene() {
  if (!MS || MS.VWb !== VW || MS.H !== Math.ceil(VH) + 2) buildMenuScene();
  const t = G.t, H = MS.H, TW = MS.TW;
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = '#3d8fe0'; ctx.fillRect(0, 0, W, H * S);
  ctx.setTransform(S, 0, 0, S, 0, 0);
  ctx.drawImage(MS.sky, 0, 0);
  // sun
  const sxp = VW * .8, syp = H * .15;
  ctx.globalCompositeOperation = 'lighter'; ctx.imageSmoothingEnabled = true;
  ctx.globalAlpha = .6; ctx.drawImage(glowTex('#fff6c8'), sxp - 60, syp - 60, 120, 120);
  ctx.save(); ctx.translate(sxp, syp); ctx.rotate(t * .05); ctx.globalAlpha = .08; ctx.fillStyle = '#fff6c8';
  for (let i = 0; i < 10; i++) { ctx.rotate(TAU / 10); ctx.fillRect(0, -3, 140, 6); }
  ctx.restore(); ctx.imageSmoothingEnabled = false; ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
  ctx.fillStyle = '#fffbe6'; pixDisc(sxp, syp, 9, 1); ctx.fillStyle = '#ffffff'; pixDisc(sxp - 2, syp - 2, 5, 1);
  // clouds drift
  for (const c of MS.clouds) {
    c.x -= c.sp * (1 / 60); if (c.x < -80) { c.x = VW + 60; c.y = rand(H * .04, H * .3); }
    const sp = MS.cloudSpr[c.v]; ctx.drawImage(sp, Math.round(c.x), Math.round(c.y), Math.round(70 * c.s), Math.round(30 * c.s));
  }
  // birds flapping across the sky
  for (const b of MS.birds) {
    b.x -= b.sp / 60; if (b.x < -10) { b.x = VW + rand(10, 80); b.y = rand(H * .08, H * .35); }
    const up = Math.sin(t * 9 + b.ph) > 0, bx = Math.round(b.x), by = Math.round(b.y + Math.sin(t * 1.5 + b.ph) * 3);
    ctx.fillStyle = '#2a3550';
    if (up) { ctx.fillRect(bx - 3, by - 2, 1, 1); ctx.fillRect(bx - 2, by - 1, 2, 1); ctx.fillRect(bx, by, 1, 1); ctx.fillRect(bx + 1, by - 1, 2, 1); ctx.fillRect(bx + 3, by - 2, 1, 1); }
    else { ctx.fillRect(bx - 3, by, 2, 1); ctx.fillRect(bx - 1, by, 3, 1); ctx.fillRect(bx + 2, by, 2, 1); ctx.fillRect(bx - 2, by + 1, 1, 1); ctx.fillRect(bx + 2, by + 1, 1, 1); }
  }
  // parallax ranges, forest, lake, ground
  drawTiled(MS.far, t * 4, TW);
  drawTiled(MS.near, t * 8, TW);
  const fy = Math.round(H * .61), ly0 = fy + 4, ly1 = Math.round(H * .70);
  const lg = ctx.createLinearGradient(0, ly0, 0, ly1); lg.addColorStop(0, '#78b8e6'); lg.addColorStop(1, '#3f86c4');
  ctx.fillStyle = lg; ctx.fillRect(0, ly0, VW, ly1 - ly0);
  ctx.globalAlpha = .35;
  for (let r = 0; r < ly1 - ly0; r++) {
    const src = fy - 2 - Math.round(r * 1.6), off = Math.sin(r * .8 + t * 2.2) * 1.2;
    if (src < 0) break;
    drawTiled(MS.forest, t * 14 - off, TW, src, 1, ly0 + r);
  }
  ctx.globalAlpha = 1;
  ctx.fillStyle = '#ffffff';
  for (let i = 0; i < 18; i++) { const sx = ((i * 53 - t * 14) % VW + VW) % VW, sy = ly0 + 2 + (i * 7) % (ly1 - ly0 - 3); if (Math.sin(t * 3 + i) > .2) ctx.fillRect(Math.round(sx), sy, 2 + (i % 3), 1); }
  drawTiled(MS.forest, t * 14, TW);
  drawTiled(MS.ground, t * 30, TW);
  // roadside grass swaying in the breeze
  const off = (t * 30) % TW, T = ['#357a36', '#5fae4a', '#a6de72'];
  for (const tf of MS.tufts) {
    let x = tf.x - off; if (x < -4) x += TW; if (x > VW + 4) continue;
    const [s] = windAt(x * 2, tf.y, t);
    for (let k = 0; k < tf.h; k++) { ctx.fillStyle = k === tf.h - 1 ? T[2] : k > tf.h / 2 ? T[1] : T[0]; const o = Math.round(s * (k / tf.h) ** 1.4 * tf.h / 3.5); ctx.fillRect(Math.round(x) + o, Math.round(tf.y) - k, 1, 1); ctx.fillRect(Math.round(x) + 2 + o, Math.round(tf.y) - k + 1, 1, 1); }
    if (tf.fl) { const o = Math.round(s * tf.h / 3.2); ctx.fillStyle = tf.fl; ctx.fillRect(Math.round(x) + o - 1, Math.round(tf.y) - tf.h - 1, 3, 1); ctx.fillRect(Math.round(x) + o, Math.round(tf.y) - tf.h - 2, 1, 3); }
  }
  // the mage, strolling along
  const mx = VW * .24, my = H * .855, fr = Math.floor(t * 7) % 2, bob = fr ? -1 : 0;
  ctx.globalAlpha = .3; ctx.fillStyle = '#3b2a1c'; pixDisc(mx + 2, my + 1, 11, .3); ctx.globalAlpha = 1;
  ctx.save(); ctx.translate(Math.round(mx), Math.round(my + bob)); ctx.scale(2, 2); ctx.drawImage(SPR.mage[fr].c, -6, -17); ctx.restore();
  const ox = mx + 14, oy = my - 22 + bob + Math.sin(t * 3) * 1.5;
  ctx.globalCompositeOperation = 'lighter'; ctx.imageSmoothingEnabled = true; ctx.globalAlpha = .7; ctx.drawImage(glowTex('#8fe6ff'), ox - 12, oy - 12, 24, 24); ctx.imageSmoothingEnabled = false; ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
  ctx.fillStyle = '#160f24'; ctx.fillRect(Math.round(ox - 2), Math.round(oy - 3), 4, 6); ctx.fillStyle = '#8fe6ff'; ctx.fillRect(Math.round(ox - 1), Math.round(oy - 3), 2, 6); ctx.fillRect(Math.round(ox - 2), Math.round(oy - 1), 4, 2);
  for (let i = 0; i < 6; i++) { const q = ((t * 1.3 + i / 6) % 1); ctx.globalAlpha = 1 - q; ctx.fillStyle = i % 2 ? '#ffffff' : '#8fe6ff'; ctx.fillRect(Math.round(ox - q * 26), Math.round(oy + Math.sin(i * 2 + t * 4) * 3 - q * 4), 1, 1); }
  ctx.globalAlpha = 1;
  if (fr === 0 && Math.random() < .2) addPart(mx - 4, my, 0, rand(-30, -10), 0, rand(5, 15), .4, ['#e8c98e', '#c9a46a'], 1, { g: 60 });
  for (const p of parts) { ctx.fillStyle = p.cols[0]; ctx.globalAlpha = p.life / p.max; ctx.fillRect(Math.round(p.x), Math.round(p.y - p.z), 1, 1); }
  ctx.globalAlpha = 1;
  // butterflies and drifting petals
  for (const b of MS.flies) {
    b.ph += 1 / 60; const x = Math.round(((b.x - t * 6 + Math.sin(b.ph) * 20) % (VW + 20) + VW + 20) % (VW + 20) - 10), y = Math.round(b.y + Math.sin(b.ph * 1.7) * 8);
    const open = Math.sin(t * 22 + b.ph * 5) > 0; ctx.fillStyle = b.col;
    if (open) { ctx.fillRect(x - 2, y - 1, 2, 2); ctx.fillRect(x + 1, y - 1, 2, 2); } else { ctx.fillRect(x - 1, y - 2, 1, 2); ctx.fillRect(x + 1, y - 2, 1, 2); }
    ctx.fillStyle = '#2a1a10'; ctx.fillRect(x, y - 1, 1, 2);
  }
  for (const p of MS.petals) {
    p.ph += 1 / 60; p.x -= (14 + Math.sin(p.ph) * 6) / 60; p.y += (6 + Math.cos(p.ph * 1.3) * 4) / 60;
    if (p.x < -4) p.x = VW + 4; if (p.y > H) { p.y = -4; p.x = rand(0, VW + 40); }
    ctx.fillStyle = p.c; ctx.fillRect(Math.round(p.x), Math.round(p.y), Math.sin(p.ph * 4) > .2 ? 2 : 1, 1);
  }
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalCompositeOperation = 'screen';
  const g = ctx.createRadialGradient(W * .8, H * S * .15, 0, W * .8, H * S * .15, Math.hypot(W, H * S) * .7);
  g.addColorStop(0, 'rgba(255,240,190,.25)'); g.addColorStop(1, 'rgba(255,240,190,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H * S);
  ctx.globalCompositeOperation = 'source-over';
}
function drawIris(sx, sy) {
  if (G.iris <= .001) return;
  const R = Math.hypot(W, H) * (1 - easeInOut(G.iris));
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = '#0f1d14'; ctx.beginPath(); ctx.rect(0, 0, W, H); ctx.arc(sx, sy, Math.max(0, R), 0, TAU, true); ctx.fill();
}

/* ================= speech bubbles: silly banter that never interrupts play ================= */
let bubbles = [], quipT = 5, sayCd = 0;
const QUIPS = {
  slime: ['受死吧！', '咕噜咕噜！', '我是果冻，不是史莱姆！', '弹弹弹~', '让我抱一下嘛！'],
  mini: ['我也要打！', '哥哥等等我！', '咕叽！'],
  bat: ['吸你一口！', '现在几点了？', '冲鸭！', '吱吱吱！'],
  skel: ['看箭！', '我的骨头好冷', '别动，我在瞄准', '缺钙中…'],
  shroom: ['别过来…不对，快过来！', '蘑菇也有尊严！', '我今天有点膨胀'],
  knight: ['铁壁防御！', '我的盾比你的脸还硬', '头盔有点闷'],
  wraith: ['看不见我~', '呜呜呜~', '我只是路过的幽灵'],
  boss: ['渺小的人类！', '我看见你了~', '我眼里只有你', '交出星辰之力！'],
  reply: ['反弹！', '你说啥？听不见~', '先吃我一发！', '就这？', '麻烦排好队', '魔法是物理学的一种', '退！退！退！'],
  replyBoss: ['眼睛这么大，近视吗？', '你滴眼药水了吗？', '反弹！', '我要把你做成眼球汤', '我妈喊我回家吃饭'],
  fuse: ['我要爆炸啦！！', '三、二、一——', '抱紧我！'],
  stun: ['头好晕…', '这墙谁放的？！', '眼冒金星…'],
  charge: ['冲锋！', '让开让开！'], chargeReply: ['斗牛士在此！', '冷静一点！', '闪~'],
  hurt: ['嗷！', '不疼…不疼…', '这下真生气了！', '我的发型！'],
  nova: ['统统退下！', '清场时间到~', '新星，爆发！'],
  heal: ['还能再战五百年', '回血了，舒服~'],
  start: ['今天也要努力割草！', '开工开工！', '让我看看这里有什么'],
};
function say(who, text, o = {}) {
  if (!who || (who !== player && (who.dead || who.spawnT < 1 || who.ghost))) return false;
  if (!o.force && (G.state !== 'play' || sayCd > 0 || bubbles.length >= 3)) return false;
  if (bubbles.some(b => b.who === who && b.t < b.max - .3)) return false;
  bubbles.push({ who, text, t: 0, max: o.max || 2.3, x: who.x, y: who.y, kind: who === player ? 'hero' : who.type === 'boss' ? 'boss' : 'foe' });
  sayCd = o.cd ?? 1.4;
  if (o.reply && Math.random() < (o.replyChance ?? .5)) later(.9, () => !player.dead && say(player, pick(o.reply), { force: true, cd: .8 }));
  return true;
}
function maybeSay(who, list, chance, o = {}) { return Math.random() < chance && say(who, pick(list), o); }
function bubbleAnchor(w) { return w === player ? [player.x, player.y - 22] : w.type === 'boss' ? [w.x, w.y - w.z - 46] : [w.x, w.y - (w.z || 0) - w.h - 6]; }
function updateBubbles(dt) {
  sayCd -= dt;
  for (const b of bubbles) { b.t += dt; if (!b.who.dead) [b.x, b.y] = bubbleAnchor(b.who); }
  bubbles = bubbles.filter(b => b.t < b.max);
  if (G.state !== 'play') return;
  quipT -= dt;
  if (quipT <= 0) {
    quipT = rand(6, 11);
    const vis = enemies.filter(e => !e.dead && e.spawnT >= 1 && !e.ghost && e.x > cam.x + 10 && e.x < cam.x + VW - 10 && e.y > cam.y + 30 && e.y < cam.y + VH - 10);
    if (vis.length) { const e = pick(vis); say(e, pick(QUIPS[e.type]), { reply: e.type === 'boss' ? QUIPS.replyBoss : QUIPS.reply, replyChance: e.type === 'boss' ? .8 : .45 }); }
  }
}
function drawBubbles(camX, camY) {
  if (!bubbles.length) return;
  const fs = Math.max(12, Math.round(4.2 * S)), u = Math.max(2, Math.round(S * .7));
  ctx.font = `700 ${fs}px "Noto Sans SC", "Microsoft YaHei", sans-serif`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  for (const b of bubbles) {
    const p = b.t / b.max, pop = b.t < .2 ? easeOutBack(b.t / .2) : 1, fade = p > .85 ? 1 - (p - .85) / .15 : 1;
    const sx = (b.x - camX) * S, sy = (b.y - camY) * S;
    const tw = ctx.measureText(b.text).width, pw = Math.round(tw + fs * 1.3), ph = Math.round(fs * 2);
    const bx = clamp(sx, pw / 2 + 10, W - pw / 2 - 10), by = clamp(sy - ph / 2 - u * 4, ph / 2 + 10, H - ph / 2 - 10);
    const fill = b.kind === 'hero' ? '#fff8dc' : b.kind === 'boss' ? '#2a1240' : '#ffffff', line = b.kind === 'boss' ? '#ff4d6d' : '#160f24', txt = b.kind === 'boss' ? '#ffb3c6' : '#1d1a12';
    ctx.save(); ctx.globalAlpha = fade;
    ctx.translate(bx, by + ph / 2); ctx.scale(pop, pop); ctx.rotate(b.kind === 'foe' ? Math.sin(b.t * 7) * .025 : 0); ctx.translate(0, -ph / 2);
    const x0 = Math.round(-pw / 2), y0 = Math.round(-ph / 2);
    ctx.fillStyle = 'rgba(0,0,0,.28)'; ctx.fillRect(x0 + u * 2, y0 + u * 2, pw, ph);
    ctx.fillStyle = line; ctx.fillRect(x0, y0 + u, pw, ph - 2 * u); ctx.fillRect(x0 + u, y0, pw - 2 * u, ph);
    ctx.fillStyle = fill; ctx.fillRect(x0 + u, y0 + u * 2, pw - 2 * u, ph - 4 * u); ctx.fillRect(x0 + u * 2, y0 + u, pw - 4 * u, ph - 2 * u);
    // stepped tail pointing at the speaker
    const tx = clamp(Math.round((sx - bx) / pop), x0 + u * 4, x0 + pw - u * 6);
    for (let k = 0; k < 3; k++) { ctx.fillStyle = line; ctx.fillRect(tx - u * (2 - k) - u, y0 + ph - u + k * u, u * (5 - k * 2) + u * 2, u); ctx.fillStyle = fill; ctx.fillRect(tx - u * (2 - k), y0 + ph - u * 2 + k * u, u * (5 - k * 2), u); }
    ctx.fillStyle = txt; ctx.fillText(b.text, 0, Math.round(u * .2));
    ctx.restore();
  }
  ctx.globalAlpha = 1;
}
