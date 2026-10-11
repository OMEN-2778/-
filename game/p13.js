
/* ================= healing runes ================= */
// still: stand 3s without attacking · halo: pink ring every 10s · rush: hearts picked up right after a hit heal twice
// luck: more heart drops · keys: two letters every 7s, hold both within 1s
const HEAL_COLS = ['#ffffff', '#ffc2dc', '#ff7ab0'];
UPGRADES.push(
  { id: 'still', kind: 'special', name: '静心冥想', max: 1, w: 3, desc: () => `原地站立且不攻击 ${E('3 秒')}，回复 1 点生命（可反复触发）`, apply() { spell.still = 1; } },
  { id: 'halo', kind: 'special', name: '粉色光晕', max: 1, w: 3, desc: () => `每 ${E('10 秒')}在附近随机出现粉色光晕，持续 3 秒，走进去回复 1 点生命`, apply() { spell.halo = 1; } },
  { id: 'rush', kind: 'special', name: '劫后余生', max: 1, w: 3, desc: () => `受伤后 ${E('1 秒')}内拾取爱心，额外回复 1 点生命`, apply() { spell.rush = 1; } },
  { id: 'luck', kind: 'special', name: '心之眷顾', max: 2, w: 3, desc: () => `怪物掉落爱心的概率 ${E('+2.5%')}（基础 3%）`, apply() { spell.luck++; } },
  { id: 'keys', kind: 'special', name: '灵犀咒印', max: 1, w: 3, desc: () => `每 ${E('7 秒')}右下角出现键盘上相邻的两个字母，${E('1.5 秒')}内按下这两个键，回复 1 点生命`, apply() { spell.keys = 1; } },
);
Object.assign(ICONS, {
  still: ['....kkkk....', '...kwwwwk...', '...kwaawk...', '....kaak....', '..kkwaawkk..', '.kwaaaaaawk.', 'kwaaaaaaaawk', '.kkaaaaaakk.', '...kk..kk...', '............', '.a.a.a.a.a..', '............'],
  halo: ['...aaaaaa...', '.aa......aa.', 'a..........a', 'a..kk..kk..a', 'a.kwak.kaak.', 'a.kwaaaaaak.', '.a.kaaaaak.a', '.a..kaaak..a', '..a..kak..a.', '...aa.k.aa..', '.....aa.....', '............'],
  rush: ['.........w..', '........www.', '.........w..', '.kkk...kkk..', 'kwaak.kaaak.', 'kwaaakaaaak.', 'kaaaaaaaaak.', '.kaaaaaaak..', '..kaaaaak...', '...kaaak....', '....kak.....', '.....k......'],
  luck: ['............', '.kk.kk......', 'kwakaak.....', 'kaaaaak.....', '.kaaak......', '..kak.kk.kk.', '...k.kwakaak', '.....kaaaaak', '......kaaak.', '.......kak..', '........k...', '............'],
  keys: ['kkkkk..kkkkk', 'kwwwk..kwwwk', 'kwawk..kwawk', 'kwaak..kaawk', 'kwwwk..kwwwk', 'kkkkk..kkkkk', '............', '.....aa.....', '....aaaa....', '.....aa.....', '............', '............'],
});
for (const id of ['still', 'halo', 'rush', 'luck', 'keys']) ELEM_COL[id] = '#ff7ab0';

const HEAL = { stillT: 0, haloT: 0, halos: [], keyT: 0, keyQ: null };
function healPlayer(n = 1, x = player.x, y = player.y) {
  if (player.hp >= player.maxHp || player.dead || !canHeal()) return false;
  player.hp = Math.min(player.maxHp, player.hp + n); updateHearts(true);
  addText(player.x, player.y - 22, '+' + n, '#ff8aa0', 1.2); sfx.heart();
  for (let i = 0; i < 12; i++) addPart(x, y, 6, rand(-50, 50), rand(-40, 40), rand(30, 80), .55, HEAL_COLS, 1, { add: true, g: 100 });
  return true;
}
function healRunesReset() {
  HEAL.stillT = 0; HEAL.haloT = 0; HEAL.halos = []; HEAL.keyT = 0;
  keyPromptEnd(false, true);
}
function heartDropChance() { return .03 + .025 * (spell.luck || 0); }

function updateHealRunes(dt) {
  const p = player;
  if (G.escapeT > 0) G.escapeT -= dt;
  tryLeech(); updateLeechHud();
  if (p.dead) return;
  // ---- still: any movement, dash or attack resets the meditation ----
  if (spell.still) {
    const busy = p.moving || p.dashT > 0 || mouse.down || p.charge > 0 || mouse.rdown || keys.has('e');
    if (busy || p.hp >= p.maxHp) HEAL.stillT = 0;
    else {
      HEAL.stillT += dt;
      if (Math.random() < dt * 10) { const a = rand(TAU); addPart(p.x + Math.cos(a) * 12, p.y + Math.sin(a) * 7, 0, -Math.cos(a) * 14, -Math.sin(a) * 8, rand(10, 30), .5, HEAL_COLS, 1, { add: true }); }
      if (HEAL.stillT >= 3) { HEAL.stillT = 0; healPlayer(1); fx.push({ k: 'ring', x: p.x, y: p.y, r0: 4, r1: 30, t: 0, max: .5, col: '#ff7ab0', w: 1 }); }
    }
  }
  // ---- halo: a pink ring somewhere on screen, 3s to reach it ----
  if (spell.halo) {
    HEAL.haloT += dt;
    if (HEAL.haloT >= 10) { HEAL.haloT = 0; spawnHalo(); }
  }
  for (const h of HEAL.halos) {
    h.t += dt;
    if (!h.used && h.t > .25 && Math.hypot(p.x - h.x, (p.y - h.y) / .62) < h.r + 2 && healPlayer(1, h.x, h.y)) {
      h.used = true; h.t = Math.max(h.t, h.max - .3);
      fx.push({ k: 'ring', x: h.x, y: h.y, r0: h.r, r1: h.r * 2, t: 0, max: .45, col: '#ff7ab0', w: 2 });
      AU.tone(990, .25, 'sine', .06, 1480);
    }
    if (Math.random() < dt * 14) { const a = rand(TAU), r = rand(h.r); addPart(h.x + Math.cos(a) * r, h.y + Math.sin(a) * r * .62, 0, 0, 0, rand(20, 45), .7, HEAL_COLS, 1, { add: true }); }
  }
  HEAL.halos = HEAL.halos.filter(h => h.t < h.max);
  // ---- keys: two neighbouring letters, press both (any order) within 1.5s ----
  if (spell.keys) {
    const q = HEAL.keyQ;
    if (q) {
      q.t += dt;
      $('keyq-bar').style.transform = `scaleX(${Math.max(0, 1 - q.t / q.max)})`;
      q.k.forEach((k, i) => { if (!q.hit[i] && (keys.has(k) || pressed.has(k))) { q.hit[i] = true; $('keyq').children[i].classList.add('down'); AU.tone(i ? 1568 : 1318, .06, 'square', .03); } });
      if (q.hit[0] && q.hit[1]) keyPromptEnd(true);
      else if (q.t >= q.max) keyPromptEnd(false);
    } else {
      HEAL.keyT += dt;
      if (HEAL.keyT >= 7) { HEAL.keyT = 0; keyPromptStart(); }
    }
  }
}
function spawnHalo() {
  const r = 20;
  let x, y;
  for (let i = 0; i < 40; i++) {
    x = clamp(cam.x + rand(30, VW - 30), 24, arena.w - 24); y = clamp(cam.y + rand(30, VH - 30), 30, arena.h - 24);
    if (Math.hypot(x - player.x, y - player.y) > 60 && !pillars.some(p => Math.hypot(p.x - x, p.y - y) < 30)) break;
  }
  HEAL.halos.push({ x, y, r, t: 0, max: 3, used: false });
  AU.tone(1320, .3, 'sine', .05, 1760); AU.tone(1760, .4, 'triangle', .03, null, .08);
}
// neighbours on a QWERTY row; Q W E R A S D M already do something in the game, so they never show up
const KEY_BUSY = 'qwerasdm';
const KEY_PAIRS = ['qwertyuiop', 'asdfghjkl', 'zxcvbnm'].flatMap(row => [...row].slice(1).map((c, i) => row[i] + c)).filter(p => !KEY_BUSY.includes(p[0]) && !KEY_BUSY.includes(p[1]));
function keyPromptStart() {
  const pair = KEY_PAIRS[Math.floor(Math.random() * KEY_PAIRS.length)], [a, b] = Math.random() < .5 ? [pair[0], pair[1]] : [pair[1], pair[0]];
  HEAL.keyQ = { k: [a, b], hit: [false, false], t: 0, max: 1.5 };
  const el = $('keyq');
  el.children[0].textContent = a.toUpperCase(); el.children[1].textContent = b.toUpperCase();
  el.children[0].classList.remove('down'); el.children[1].classList.remove('down');
  el.className = ''; void el.offsetWidth; el.className = 'on';
  AU.tone(1760, .08, 'square', .03); AU.tone(2200, .1, 'square', .03, null, .06);
}
function keyPromptEnd(ok, silent) {
  const el = $('keyq'); if (!el) return;
  if (!HEAL.keyQ) { if (silent) el.className = ''; return; }
  HEAL.keyQ = null;
  if (silent) { el.className = ''; return; }
  el.className = ok ? 'on ok' : 'on miss';
  setTimeout(() => { if (!HEAL.keyQ) el.className = ''; }, ok ? 650 : 450);
  if (ok) { if (!healPlayer(1)) AU.tone(1320, .2, 'triangle', .05); AU.tone(1046, .12, 'square', .04); AU.tone(1568, .2, 'square', .04, null, .07); }
}
// a letter that belongs to the prompt never triggers its normal action (E nova, M mute)
function keyPromptOwns(k) { return !!(HEAL.keyQ && HEAL.keyQ.k.includes(k)); }

function drawHealGround() {
  const p = player;
  for (const h of HEAL.halos) {
    const left = 1 - h.t / h.max, inA = Math.min(1, h.t / .25), out = h.used ? left / .1 : h.t > h.max - .4 ? (h.max - h.t) / .4 : 1;
    const a = clamp(inA * out, 0, 1), pulse = 1 + Math.sin(G.t * 8) * .06, r = h.r * pulse * (h.used ? 1 + (1 - left) : 1);
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = .3 * a; ctx.drawImage(glowTex('#ff7ab0'), h.x - r * 1.6, h.y - r * 1.1, r * 3.2, r * 2.2);
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = .42 * a; ctx.fillStyle = '#ff5fa2'; pixDisc(h.x, h.y, r, .62);
    ctx.globalAlpha = .3 * a; ctx.fillStyle = '#ffd1e6'; pixDisc(h.x, h.y, r * (.35 + .25 * Math.sin(G.t * 6) ** 2), .62);
    ctx.globalAlpha = a; ctx.fillStyle = '#ff2f86'; pixRing(h.x, h.y, r, .62, 2);
    ctx.globalAlpha = .5 * a * (1 - (G.t * 1.5 % 1)); pixRing(h.x, h.y, r + 2 + (G.t * 1.5 % 1) * 8, .62, 1);
    // countdown arc: shrinks as the halo fades
    if (!h.used) {
      ctx.fillStyle = '#ffffff';
      for (let b = 0; b < TAU * left; b += .22) ctx.fillRect(Math.round(h.x + Math.cos(b - Math.PI / 2) * (r + 4)), Math.round(h.y + Math.sin(b - Math.PI / 2) * (r + 4) * .62), 1, 1);
      ctx.globalAlpha = a; drawSpr(SPR.heart, h.x, h.y - 6 + Math.sin(G.t * 5) * 1.5);
    }
    ctx.globalAlpha = 1;
  }
  // last stand: a golden ward while the 3s of invulnerability lasts
  if (G.escapeT > 0 && !p.dead) {
    const k = Math.min(1, G.escapeT / .4), r = 15 + Math.sin(G.t * 9) * 1.5;
    ctx.globalAlpha = .22 * k; ctx.fillStyle = '#ffd166'; pixDisc(p.x, p.y, r, .62);
    ctx.globalAlpha = .9 * k; ctx.fillStyle = '#fff3c4'; pixRing(p.x, p.y, r, .62, 1);
    ctx.fillStyle = '#ffd166';
    for (let i = 0; i < 6; i++) { const b = G.t * 2.5 + i / 6 * TAU; ctx.fillRect(Math.round(p.x + Math.cos(b) * (r + 4)) - 1, Math.round(p.y + Math.sin(b) * (r + 4) * .62) - 1, 2, 2); }
    ctx.globalAlpha = 1;
  }
  if (spell.still && HEAL.stillT > .35 && !p.dead) {
    const k = HEAL.stillT / 3;
    ctx.globalAlpha = .4; ctx.fillStyle = '#ff5fa2'; pixRing(p.x, p.y, 13, .62, 1);
    ctx.globalAlpha = 1; ctx.fillStyle = '#ff2f86';
    for (let b = 0; b < TAU * k; b += .12) ctx.fillRect(Math.round(p.x + Math.cos(b - Math.PI / 2) * 13), Math.round(p.y + Math.sin(b - Math.PI / 2) * 13 * .62), 1, 1);
    ctx.globalAlpha = 1;
  }
}

/* ================= last stand: once per run, survive a killing blow ================= */
// G.escapeUsed is only reset by newRun(), so reaching the endless corridor does not refill it
function lastStand() {
  if (G.escapeUsed) return false;
  const p = player;
  G.escapeUsed = true; G.escapeT = 3;
  p.hp = 1; p.inv = 3; updateHearts(true); updateEscapeBadge();
  G.hitstop = .18; G.tsTarget = .25; setTimeout(() => { G.tsTarget = 1; }, 700);
  addShake(.8, true);
  for (const b of eprojs) if (Math.hypot(b.x - p.x, b.y - p.y) < 150) { b.dead = true; addPart(b.x, b.y, 6, 0, 0, 20, .4, ['#ffffff', '#ffd166'], 1, { add: true }); }
  for (const e of enemies) {
    if (e.dead || e.type === 'boss' || e.spawnT < 1) continue;
    const d = dist(e, p); if (d < 90) { const a = angTo(p, e); e.kvx = Math.cos(a) * 240; e.kvy = Math.sin(a) * 240; }
  }
  for (let i = 0; i < 4; i++) fx.push({ k: 'ring', x: p.x, y: p.y, r0: 6, r1: 70 + i * 40, t: -i * .07, max: .6 + i * .08, col: i % 2 ? '#ffffff' : '#ffd166', w: 2 });
  fx.push({ k: 'flash', x: p.x, y: p.y - 6, r: 90, t: 0, max: .3, col: '#fff3c4' });
  for (let i = 0; i < 46; i++) { const a = rand(TAU), s = rand(60, 200); addPart(p.x, p.y - 8, 6, Math.cos(a) * s, Math.sin(a) * s * .7, rand(20, 110), rand(.5, 1.1), ['#ffffff', '#fff3c4', '#ffd166'], rand(1, 2), { add: true, drag: 1.8 }); }
  addText(p.x, p.y - 34, '死里逃生！', '#ffd166', 1.6);
  AU.tone(392, .5, 'triangle', .12, 784); AU.tone(784, .7, 'sine', .08, 1568, .12); AU.tone(1175, .9, 'triangle', .05, null, .25);
  maybeSay(player, ['差一点就完了……', '还不能倒下！'], 1, { force: true });
  return true;
}
function updateEscapeBadge() { const el = $('escape'); if (el) el.classList.toggle('used', !!G.escapeUsed); }

// toMenu() runs once while the scripts are still loading; from here on it may touch the parts defined after it
G.booted = true;
