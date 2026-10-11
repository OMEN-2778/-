
/* ================= HUD: nameplate, skill slots, route, combo, toast ================= */
G.seen = {}; G.combo = 0; G.comboT = 0; G.comboBest = 0;
const DASH_ICON = ['............', '.......kk...', '..b...kaak..', '.....kaaak..', 'bbb..kaak...', '....kaaak...', '.b.kaaaak...', '..kaaaaaakk.', '..kawwwwaak.', '..kkkkkkkkk.', '............', '............'];
function paintIcon(cv2, rows, col) {
  const sp = spr(rows, { a: col, w: '#ffffff', k: '#160f24', b: '#5a8a6a' }), x = cv2.getContext('2d');
  x.imageSmoothingEnabled = false; x.clearRect(0, 0, 14, 14); x.drawImage(sp.c, 1, 1);
}
function initHUD() {
  paintIcon($('slot-dash').querySelector('.ico'), DASH_ICON, '#8fe6ff');
  paintIcon($('slot-nova').querySelector('.ico'), ICONS.nova, '#c4a6ff');
  paintIcon($('toast-ico'), DASH_ICON, '#8fe6ff');
}
function buildRoute() {
  const r = $('route'); r.innerHTML = '';
  if (G.endless) {
    const pos = (G.loop - 1) % 6;
    for (let k = 0; k < 6; k++) {
      if (k) { const l = document.createElement('i'); l.className = 'link' + (k <= pos ? ' done' : ''); r.appendChild(l); }
      const n = document.createElement('i'); n.className = 'node' + (k < pos ? ' done' : k === pos ? ' cur' : '') + (k === 5 ? ' boss' : ''); r.appendChild(n);
    }
    $('route-name').innerHTML = `ENDLESS ${G.loop}<em>${curLevel().name}</em>`;
    $('form-name').textContent = ''; hudCache = {};
    return;
  }
  for (let k = 0; k < LEVELS.length; k++) {
    if (k) { const l = document.createElement('i'); l.className = 'link' + (k <= G.level ? ' done' : ''); r.appendChild(l); }
    const n = document.createElement('i');
    n.className = 'node' + (k < G.level ? ' done' : k === G.level ? ' cur' : '') + (k === LEVELS.length - 1 ? ' boss' : '');
    r.appendChild(n);
  }
  $('route-name').innerHTML = `FLOOR ${G.level + 1}/${LEVELS.length}<em>${LEVELS[G.level].name}</em>`;
  $('form-name').textContent = '';
  hudCache = {};
}
function hudHurt() { const p = $('plate'); p.classList.remove('hurt'); void p.offsetWidth; p.classList.add('hurt'); }
let faceT = 0;
function drawHudFace(dt) {
  faceT += dt; if (faceT < .08) return; faceT = 0;
  const c = $('hud-face').getContext('2d'); c.imageSmoothingEnabled = false; c.clearRect(0, 0, 36, 36);
  drawHeroPortrait(c, -9, -14, G.t);
}
let toastTO = null;
function toast(title, desc, delay = 0) {
  setTimeout(() => {
    $('toast-t').textContent = title; $('toast-d').textContent = desc;
    $('toast').classList.add('on');
    AU.tone(880, .15, 'triangle', .07); AU.tone(1320, .3, 'triangle', .06, null, .1);
    clearTimeout(toastTO); toastTO = setTimeout(() => $('toast').classList.remove('on'), 5200);
  }, delay);
}
const COMBO_WORDS = [[10, '不错！'], [25, '横扫！'], [50, '狂澜！'], [100, '无双！'], [200, '星辰陨落！'], [400, '神话！']];
function comboKill() {
  G.combo++; G.comboT = 2.8; G.comboPop = true; G.comboBest = Math.max(G.comboBest, G.combo);
  if (G.combo === 50) say(player, '停不下来了！', { force: true });
  if (G.combo === 150) say(player, '我是不是太强了？', { force: true });
  for (const [n, w] of COMBO_WORDS) if (G.combo === n) {
    const el = $('combo-word'); el.textContent = w; el.classList.remove('show'); void el.offsetWidth; el.classList.add('show');
    AU.tone(660, .12, 'square', .05); AU.tone(990, .2, 'square', .05, null, .07); AU.tone(1320, .3, 'triangle', .05, null, .14);
  }
}
function updateCombo(dt) { if (G.comboT > 0) { G.comboT -= dt; if (G.comboT <= 0) G.combo = 0; } }
let slotPrev = {};
function setSlot(id, p, ready) {
  const el = $(id);
  setStyle(el, '--p', p.toFixed(3));
  if (ready && slotPrev[id] === false) { el.classList.remove('flash'); void el.offsetWidth; el.classList.add('flash'); }
  if (slotPrev[id] !== ready) el.classList.toggle('ready', ready);
  slotPrev[id] = ready;
}
function updateHUD() {
  if (G.state === 'menu' || G.state === 'comic') return;
  const L = curLevel(), g = L.goal;
  let label, fill;
  if (g.type === 'kill') { label = `击杀怪物<b>${Math.min(G.kills, g.n)}/${g.n}</b>`; fill = G.kills / g.n; }
  else if (g.type === 'survive') { label = `坚守阵地<b>${Math.max(0, Math.ceil(g.t - G.levelT))}s</b>`; fill = G.levelT / g.t; }
  else if (g.type === 'elite') { label = G.boss ? `击败${EDEF[G.boss.type].name}<b>${Math.max(0, Math.ceil(G.boss.hp / G.boss.maxHp * 100))}%</b>` : G.eliteSpawned ? '精英已被击败' : '精英正在逼近…'; fill = G.boss ? 1 - G.boss.hp / G.boss.maxHp : G.eliteSpawned ? 1 : 0; }
  else { label = G.boss && G.boss.dead ? '深渊之眼已被击败' : G.boss ? `击败深渊之眼<b>${Math.max(0, Math.ceil(G.boss.hp / G.boss.maxHp * 100))}%</b>` : '天空裂开了一道缝隙…'; fill = G.boss ? 1 - G.boss.hp / G.boss.maxHp : 0; }
  if (hudCache['obj-label'] !== label && g.type === 'kill' && hudCache['obj-label']) { const q = $('quest'); q.classList.remove('bump'); void q.offsetWidth; q.classList.add('bump'); }
  setText('obj-label', label);
  setStyle($('obj-fill'), 'width', (clamp(fill, 0, 1) * 100).toFixed(1) + '%');
  const runes = Object.values(G.ups).reduce((a, b) => a + b, 0);
  setText('rune-count', 'RUNES ' + runes);
  // dash: charges, then a shared cooldown
  const p = player;
  setSlot('slot-dash', p.dashCharges > 0 ? 1 : clamp(1 - p.dashCd / p.dashCdMax, 0, 1), p.dashCharges > 0);
  const pipKey = p.dashMax + ':' + p.dashCharges;
  if (hudCache.pips !== pipKey) {
    hudCache.pips = pipKey;
    $('dash-pips').innerHTML = p.dashMax > 1 ? Array.from({ length: p.dashMax }, (_, k) => `<i class="${k < p.dashCharges ? 'on' : ''}"></i>`).join('') : '';
  }
  setSlot('slot-nova', clamp(1 - p.novaCd / p.novaCdMax, 0, 1), p.novaCd <= 0);
  const fp = $('slot-form');
  if (spell.form) {
    if (fp.hidden || hudCache.formId !== spell.form) { fp.hidden = false; hudCache.formId = spell.form; paintIcon(fp.querySelector('.ico'), ICONS[spell.form], FORMS[spell.form].col); }
    setText('form-name', spell.formBr ? EVO[spell.form][spell.formBr].name : FORMS[spell.form].name + (spell.formLv ? ' +' + spell.formLv : '')); setStyle(fp, '--c', FORMS[spell.form].col);
    const v = spell.form === 'laser' ? p.charge : spell.form === 'minigun' ? .3 + p.spin * .7 : 1;
    setSlot('slot-form', v, v >= 1);
  } else fp.hidden = true;
  $('plate').classList.toggle('low', p.hp <= 2 && !p.dead);
  drawHudFace(1 / 60);
  // combo
  const cb = $('combo'), on = G.combo >= 5 && G.state === 'play';
  if (hudCache.comboOn !== on) { hudCache.comboOn = on; cb.classList.toggle('on', on); }
  if (on) {
    setText('combo-num', 'x' + G.combo);
    if (G.comboPop) { G.comboPop = false; const n = $('combo-num'); n.classList.remove('pop'); void n.offsetWidth; n.classList.add('pop'); }
    const tier = G.combo >= 100 ? 't4' : G.combo >= 50 ? 't3' : G.combo >= 25 ? 't2' : '';
    if (hudCache.tier !== tier) { cb.classList.remove('t2', 't3', 't4'); if (tier) cb.classList.add(tier); hudCache.tier = tier; }
    setStyle($('combo-bar'), 'width', (clamp(G.comboT / 2.8, 0, 1) * 100).toFixed(1) + '%');
  }
  if (G.boss) { const w = (Math.max(0, G.boss.hp) / G.boss.maxHp * 100).toFixed(1) + '%'; setStyle($('boss-fill'), 'width', w); setStyle($('boss-lag'), 'width', w); }
  ultHUD();
  updateHearts(true);
}
function unlockDash() {
  player.dashMax = 2; player.dashCharges = 2; player.dashCd = 0;
  G.pendingToast = ['领悟 · 风步', '冲刺可以连续施展两次，第二段还能转向，两段用完才进入冷却。'];
}

/* ================= comics (intro, interlude, boss) ================= */
let comic = null;
const CW_ = 160, CH_ = 100;
function startComic(pages, onDone, o = {}) {
  const grid = $('comic-grid'); grid.innerHTML = '';
  const panels = pages.map((p, i) => {
    const el = document.createElement('div'); el.className = 'panel'; el.style.setProperty('--tilt', (i % 2 ? .8 : -.8) + 'deg');
    const [cv2, c] = makeCanvas(CW_, CH_);
    const cap = document.createElement('div'); cap.className = 'cap';
    el.appendChild(cv2); el.appendChild(cap); grid.appendChild(el);
    return { el, c, cap, t: 0, shown: false };
  });
  comic = { pages, i: -1, panels, typed: 0, hold: 0, ready: false, onDone, hint: o.hint || '按任意键继续', key: o.key };
  const hint = document.querySelector('.comic-hint'); hint.textContent = '点击或按任意键加速'; hint.classList.remove('ready');
  G.state = 'comic';
  showScreen('comic');
  setTimeout(() => comic && comic.i < 0 && nextPanel(), 450);
}
function nextPanel() {
  if (!comic || comic.i >= comic.pages.length - 1) return;
  comic.i++; comic.typed = 0; comic.hold = 0;
  const P = comic.panels[comic.i];
  P.shown = true; P.t = 0; P.el.classList.add('in', 'cur');
  comic.panels.forEach((q, j) => j !== comic.i && q.el.classList.remove('cur'));
  if (innerWidth < 640) P.el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  AU.noise(.25, .1, 1500, 4000, 1.5); AU.tone(300 + comic.i * 90, .12, 'triangle', .06, 600 + comic.i * 120);
}
function comicInput() {
  if (!comic || comic.i < 0) return;
  const P = comic.panels[comic.i], txt = comic.pages[comic.i].text;
  if (comic.typed < txt.length) { comic.typed = txt.length; P.t = Math.max(P.t, 2.4); P.el.classList.add('instant'); }
  else if (comic.i < comic.pages.length - 1) nextPanel();
  else if (comic.ready) finishComic();
}
function updateComic(dt) {
  if (!comic) return;
  for (let j = 0; j < comic.panels.length; j++) {
    const P = comic.panels[j]; if (!P.shown) continue;
    P.t += dt;
    const c = P.c; c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
    comic.pages[j].draw(c, P.t);
  }
  if (comic.i < 0) return;
  const P = comic.panels[comic.i], txt = comic.pages[comic.i].text;
  if (P.t > .35 && comic.typed < txt.length) {
    const before = Math.floor(comic.typed);
    comic.typed = Math.min(txt.length, comic.typed + dt * 20);
    if (Math.floor(comic.typed) > before && AU.gate('type', 45)) AU.tone(rand(1100, 1400), .02, 'square', .015);
  }
  const shown = txt.slice(0, Math.floor(comic.typed));
  if (P.cap.dataset.n !== String(shown.length)) { P.cap.dataset.n = shown.length; P.cap.innerHTML = shown + (shown.length < txt.length ? '<i class="caret"></i>' : ''); }
  if (comic.typed >= txt.length) {
    comic.hold += dt;
    const lastPanel = comic.i === comic.pages.length - 1;
    if (!lastPanel && comic.hold > 1.5) nextPanel();
    if (lastPanel && !comic.ready && comic.hold > .35) {
      comic.ready = true;
      const h = document.querySelector('.comic-hint'); h.textContent = comic.hint; h.classList.add('ready');
      AU.tone(660, .2, 'triangle', .06); AU.tone(990, .3, 'triangle', .05, null, .08);
    }
  }
}
function finishComic() {
  if (!comic) return;
  const cb = comic.onDone; if (comic.key) G.seen[comic.key] = true;
  comic = null;
  hideScreen('comic');
  cb();
}
$('comic').addEventListener('pointerdown', e => { e.preventDefault(); AU.unlock(); comicInput(); });

/* ---- shared comic art bits ---- */
function cGhost(c, x, y, s, a) { c.globalAlpha = a; c.globalCompositeOperation = 'lighter'; cSpr(c, SPR.mageGhost, x, y, s, false); c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1; }
function cEye(c, x, y, s, lx, ly, open = 1) {
  const A = bossArt; c.save(); c.translate(Math.round(x), Math.round(y)); c.scale(s, s);
  c.drawImage(A.body.c, -A.body.w / 2, -A.body.h / 2);
  c.beginPath(); c.rect(-14, -13 * open, 28, 26 * open); c.clip();
  c.drawImage(A.sclera.c, -A.sclera.w / 2, -A.sclera.h / 2);
  c.drawImage(A.iris.c, lx - A.iris.w / 2, ly - A.iris.h / 2);
  c.fillStyle = '#12060c'; c.fillRect(lx - 1, ly - 4, 2, 8);
  c.restore();
}
function cTentacles(c, x, y, t, len, reach = 0) {
  for (let i = 0; i < 7; i++) {
    const b = Math.PI * (.15 + .7 * i / 6), bx = x + Math.cos(b) * 26, by = y + Math.sin(b) * 18;
    for (let s = 0; s < len; s++) {
      const w = Math.sin(t * 2.4 + i * 1.3 + s * .5) * s * .9;
      c.fillStyle = s % 2 ? '#3c2b5c' : '#5a36a0';
      const sz = Math.max(1, 6 - s * .35);
      c.fillRect(Math.round(bx + Math.cos(b) * s * 3 * (1 - reach * .4) + w - sz / 2), Math.round(by + s * (4 + reach * 2) - sz / 2), Math.ceil(sz), Math.ceil(sz));
    }
  }
}

/* ---- interlude after floor 3: the wind step ---- */
const INTERLUDE = [
  { text: '激战之中，盾卫的冲锋迎面撞来——他的身体，比意识先一步动了。', draw: (c, t) => comicDodge(c, t) },
  { text: '领悟 · 风步：冲刺可以连续施展两次，第二段还能转向！', draw: (c, t) => comicDoubleDash(c, t) },
];
function comicDodge(c, t) {
  cBands(c, ['#f7d08a', '#f3c070', '#e9a85a', '#d98c4a'], 0, 56);
  cRidge(c, 46, 4, .06, 1, '#c79a5a');
  cGrass(c, 62, ['#a6a243', '#c2b855', '#ecd98a'], t, 5);
  const T = (t % 2.6) / 2.6;
  // knight charges in from the right with speed lines
  const kx = lerp(170, 92, easeOutCubic(clamp(T * 2.2, 0, 1)));
  c.fillStyle = '#ffffff'; for (let i = 0; i < 6; i++) { const y = 54 + i * 6, len = 18 + (i * 7) % 14; c.globalAlpha = .7; c.fillRect(Math.round(kx + 18 + ((t * 120 + i * 23) % 20)), y, len, 1); }
  c.globalAlpha = 1;
  cSpr(c, SPR.knight.c, kx, 92, 3, true);
  c.fillStyle = '#160f24'; c.fillRect(Math.round(kx - 30), 56, 6, 30); c.fillStyle = '#9aa6bf'; c.fillRect(Math.round(kx - 29), 57, 4, 28); c.fillStyle = '#ffd166'; c.fillRect(Math.round(kx - 28), 66, 2, 8);
  // the hero blinks out of the way, leaving afterimages
  const d = clamp((T - .25) * 4, 0, 1), hx = lerp(70, 34, easeOutCubic(d)), hy = lerp(92, 66, easeOutCubic(d));
  for (let k = 1; k <= 4; k++) { const q = clamp(d - k * .12, 0, 1); if (d > k * .12) cGhost(c, lerp(70, 34, easeOutCubic(q)), lerp(92, 66, easeOutCubic(q)), 2, .45 - k * .08); }
  cSpr(c, SPR.mage[d > 0 && d < 1 ? 0 : 3].c, hx, hy, 2, false);
  if (T > .2 && T < .5) { const b = easeOutBack(clamp((T - .2) / .08, 0, 1)); c.fillStyle = '#ff4d6d'; c.fillRect(Math.round(kx - 8), Math.round(40 - 4 * b), 3, 8); c.fillRect(Math.round(kx - 8), 50, 3, 2); }
  if (d >= 1) { c.font = '8px "Press Start 2P", monospace'; c.fillStyle = '#160f24'; c.fillText('SWISH', 18, 46); c.fillStyle = '#ffffff'; c.fillText('SWISH', 17, 45); }
}
function comicDoubleDash(c, t) {
  c.fillStyle = '#123a3a'; c.fillRect(0, 0, CW_, CH_);
  c.save(); c.translate(80, 55); c.fillStyle = '#1b4d4a';
  for (let i = 0; i < 24; i++) { c.save(); c.rotate(i / 24 * TAU + t * .1); c.fillRect(16 + ((t * 60 + i * 13) % 26), -1, 80, 2); c.restore(); }
  c.restore();
  const T = (t % 2.8) / 2.8;
  const A = [22, 84], B = [78, 40], C = [138, 82];
  const seg = (P, Q, q) => [lerp(P[0], Q[0], q), lerp(P[1], Q[1], q)];
  const p1 = clamp(T / .3, 0, 1), p2 = clamp((T - .38) / .3, 0, 1);
  // wind trails
  c.globalCompositeOperation = 'lighter';
  const trail = (P, Q, q) => { for (let k = 0; k <= 30 * q; k++) { const [x, y] = seg(P, Q, k / 30); c.fillStyle = k % 3 ? '#8fe6ff' : '#ffffff'; c.fillRect(Math.round(x), Math.round(y - 8 + Math.sin(k * .8 + t * 10) * 2), 2, 1); } };
  trail(A, B, p1); if (p2 > 0) trail(B, C, p2);
  c.globalCompositeOperation = 'source-over';
  for (let k = 1; k <= 3; k++) { const q = clamp(p1 - k * .2, 0, 1); if (p1 > k * .2) { const [x, y] = seg(A, B, q); cGhost(c, x, y, 2, .3); } }
  for (let k = 1; k <= 3; k++) { const q = clamp(p2 - k * .2, 0, 1); if (p2 > k * .2) { const [x, y] = seg(B, C, q); cGhost(c, x, y, 2, .3); } }
  // pivot rune where the dash turns
  if (p1 >= 1) { cGlow(c, B[0], B[1] - 8, 16, '#8fe6ff', .7); c.globalCompositeOperation = 'lighter'; cRing(c, B[0], B[1] - 2, 10, .4, '#8fe6ff'); c.globalCompositeOperation = 'source-over'; }
  const [hx, hy] = p2 > 0 ? seg(B, C, easeOutCubic(p2)) : seg(A, B, easeOutCubic(p1));
  cGlow(c, hx, hy - 2, 10, '#8fe6ff', .6);
  cSpr(c, SPR.mage[p2 >= 1 ? 3 : 0].c, hx, hy, 2, p2 > 0 && p2 < 1 ? false : false);
  // big x2
  const pop = p2 >= 1 ? easeOutBack(clamp((T - .7) / .12, 0, 1)) : 0;
  if (pop > 0) {
    c.save(); c.translate(124, 26); c.scale(pop, pop); c.rotate(-.12);
    c.font = '16px "Press Start 2P", monospace'; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillStyle = '#160f24'; c.fillText('x2', 2, 2); c.fillStyle = '#8fe6ff'; c.fillText('x2', 0, 0);
    c.restore();
  }
}

/* ---- before the boss ---- */
const BOSSCOMIC = [
  { text: '穿越七片山谷之后，星辰之力已在他体内奔涌不息。', draw: (c, t) => comicPower(c, t) },
  { text: '就在这时，暮色中的天空，被撕开了一道裂缝——', draw: (c, t) => comicRift(c, t) },
  { text: '「那份力量……归我了。」深渊之眼伸出触手，要夺走他攒下的一切魔力！', draw: (c, t) => comicDrain(c, t) },
  { text: '「想要？那就自己来拿。」——大战，一触即发！', draw: (c, t) => comicVersus(c, t) },
];
function comicPower(c, t) {
  cBands(c, ['#3a2058', '#6a2f6a', '#b2486a', '#ee7a5a', '#ffb070'], 0, 70);
  const sun = 62; c.fillStyle = '#ffe0a0'; for (let y = -12; y <= 0; y++) { const h = Math.round(Math.sqrt(144 - y * y)); c.fillRect(80 - h, sun + y, h * 2, 1); }
  cRidge(c, 60, 5, .07, 2, '#4a2a4a'); cRidge(c, 70, 4, .1, 4, '#2c1f30');
  c.fillStyle = '#1c1420'; c.fillRect(0, 78, CW_, 22); c.fillStyle = '#2e2230'; c.fillRect(46, 76, 68, 4);
  const pulse = .7 + Math.sin(t * 4) * .3;
  cGlow(c, 80, 60, 30 + pulse * 6, '#ffe58a', .65);
  const cols = ['#5fb8ff', '#ff8fc4', '#ffd166', '#a6de72', '#c99bff', '#ff9d3d', '#ffffff'];
  for (let i = 0; i < 7; i++) { const a = t * 1.6 + i / 7 * TAU, x = 80 + Math.cos(a) * 22, y = 62 + Math.sin(a) * 8; cGlow(c, x, y, 5, cols[i], .9); c.fillStyle = '#ffffff'; c.fillRect(Math.round(x), Math.round(y), 1, 1); }
  cSpr(c, SPR.mage[3].c, 80, 78, 2, false);
}
function comicRift(c, t) {
  cBands(c, ['#1c1238', '#2e1a52', '#4c2a6a', '#6a3a6a'], 0, 80);
  for (let i = 0; i < 30; i++) { c.fillStyle = Math.sin(t * 3 + i) > .5 ? '#ffffff' : '#7a6aa8'; c.fillRect((i * 41) % CW_, (i * 17) % 60, 1, 1); }
  const k = easeOutCubic(clamp((t - .3) / 1, 0, 1));
  // jagged rift
  const pts = []; for (let i = 0; i <= 12; i++) pts.push([lerp(80 - 70 * k, 80 + 70 * k, i / 12), 34 + (i % 2 ? -5 : 5) * k + Math.sin(i * 2.1) * 2]);
  const open = 4 + 10 * clamp((t - 1) / .8, 0, 1);
  cGlow(c, 80, 34, 30 + 30 * k, '#ff7ac8', .6 * k);
  c.fillStyle = '#0a0614';
  for (let i = 0; i < 12; i++) { const [x0, y0] = pts[i], [x1, y1] = pts[i + 1]; for (let x = Math.round(x0); x < x1; x++) { const y = lerp(y0, y1, (x - x0) / (x1 - x0 || 1)), h = open * (1 - Math.abs(x - 80) / 75) * k; c.fillRect(x, Math.round(y - h / 2), 1, Math.max(1, Math.round(h))); } }
  c.fillStyle = '#ffd0f0';
  for (let i = 0; i < 12; i++) { const [x0, y0] = pts[i], [x1, y1] = pts[i + 1]; for (let s = 0; s <= 1; s += .1) { c.fillRect(Math.round(lerp(x0, x1, s)), Math.round(lerp(y0, y1, s) - open * (1 - Math.abs(lerp(x0, x1, s) - 80) / 75) * k / 2 - 1), 1, 1); } }
  if (t > 1.2) { const o = clamp((t - 1.2) / .5, 0, 1); cEye(c, 80, 34, .5, Math.sin(t) * 2, 2, o * .8); }
  for (let i = 0; i < 10; i++) { const y = (t * 30 + i * 11) % 60 + 40, x = 30 + (i * 37) % 100; c.fillStyle = '#4c2a6a'; c.fillRect(x, Math.round(y), 2, 2); }
  c.fillStyle = '#1c1420'; c.fillRect(0, 84, CW_, 16);
  const img = tintOf(SPR.mage[3], '#0a0614'); cSpr(c, img, 80, 86, 1, false);
}
function comicDrain(c, t) {
  c.fillStyle = '#20102c'; c.fillRect(0, 0, CW_, CH_);
  cGlow(c, 80, 26, 60, '#ff4d6d', .35 + Math.sin(t * 3) * .1);
  const reach = clamp(t / 1.2, 0, 1);
  cTentacles(c, 80, 30, t, 10, reach);
  cEye(c, 80, 26, 1.1, clamp(Math.sin(t * .7) * 2, -2, 2), 4, 1);
  // power siphoned up from the hero
  c.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 26; i++) { const q = ((t * .7 + i / 26) % 1), x = 80 + Math.sin(q * 9 + i) * (1 - q) * 18, y = lerp(80, 40, q); c.fillStyle = ['#5fb8ff', '#ffd166', '#ff8fc4', '#a6de72'][i % 4]; c.fillRect(Math.round(x), Math.round(y), 2, 2); }
  c.globalCompositeOperation = 'source-over';
  c.fillStyle = '#140a1c'; c.fillRect(0, 90, CW_, 10);
  cGlow(c, 80, 82, 14, '#ffe58a', .5);
  cSpr(c, SPR.mage[3].c, 80 + Math.sin(t * 30) * .6, 91, 2, false);
  c.fillStyle = '#8fe6ff'; c.fillRect(94, 66, 2, 3); c.fillRect(95, 69, 1, 1);
}
function comicVersus(c, t) {
  // split diagonally: hero side gold, boss side violet
  c.fillStyle = '#ffcf7a'; c.fillRect(0, 0, CW_, CH_);
  c.fillStyle = '#2a1240'; c.beginPath(); c.moveTo(96, 0); c.lineTo(CW_, 0); c.lineTo(CW_, CH_); c.lineTo(64, CH_); c.closePath(); c.fill();
  c.save(); c.translate(36, 50); c.rotate(t * .3); c.fillStyle = '#ffe3a8';
  for (let i = 0; i < 8; i++) { c.rotate(TAU / 8); c.beginPath(); c.moveTo(0, 0); c.lineTo(90, -9); c.lineTo(90, 9); c.closePath(); c.fill(); }
  c.restore();
  c.save(); c.beginPath(); c.moveTo(96, 0); c.lineTo(CW_, 0); c.lineTo(CW_, CH_); c.lineTo(64, CH_); c.closePath(); c.clip();
  cGlow(c, 124, 40, 44, '#ff4d6d', .5); cTentacles(c, 124, 44, t, 8, .3); cEye(c, 124, 40, 1, -3, 1, 1);
  c.restore();
  c.save(); c.beginPath(); c.moveTo(0, 0); c.lineTo(96, 0); c.lineTo(64, CH_); c.lineTo(0, CH_); c.closePath(); c.clip();
  drawHeroPortrait(c, 8, 30, t);
  cGlow(c, 58, 52, 12, '#8fe6ff', .8);
  c.restore();
  // lightning seam
  c.fillStyle = '#ffffff';
  let x = 96; for (let y = 0; y < CH_; y += 4) { const nx = lerp(96, 64, (y + 4) / CH_) + (Math.random() - .5) * 6; for (let s = 0; s < 4; s++) c.fillRect(Math.round(lerp(x, nx, s / 4)), y + s, 2, 1); x = nx; }
  const pop = easeOutBack(clamp((t - .3) / .3, 0, 1));
  if (pop > 0) {
    c.save(); c.translate(80 + (Math.random() - .5) * 1.5, 50); c.scale(pop, pop); c.rotate(-.1);
    c.font = '20px "Press Start 2P", monospace'; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillStyle = '#160f24'; c.fillText('VS', 2, 2); c.fillStyle = '#fff3c4'; c.fillText('VS', 0, 0);
    c.restore();
  }
  if (t < .2) { c.globalAlpha = 1 - t / .2; c.fillStyle = '#ffffff'; c.fillRect(0, 0, CW_, CH_); c.globalAlpha = 1; }
}

initHUD();
