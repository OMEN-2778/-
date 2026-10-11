
/* ================= the endless abyss ================= */
G.endless = false; G.loop = 0; G.endlessL = null; G.history = [];
let strikes = [];   // telegraphed ground hits: arrow rain, lightning, lobbed fireballs, landing marks
function curLevel() { return G.endless ? G.endlessL : LEVELS[G.level]; }
function diffIdx() { return G.endless ? Math.min(14, 2 + G.loop) : G.level; }
function diffMul() {
  // endless starts gentler than floor 1 (all runes are gone), then ramps faster than the main floors
  if (G.endless) { const k = G.loop - 1; return .5 + k * .3 + k * k * .09; }
  const k = G.level; return 1 + k * .3 + k * k * .07;
}
const EPCOL = { boss: '#ff4d6d', seed: '#a6de72', elec: '#fff27a', dark: '#c084ff', slime: '#5fb8ff' };

/* ---- new monsters + elites ---- */
Object.assign(EDEF, {
  hog:       { name: '滚刺球', hp: 30, spd: 30, r: 5, h: 10, mass: 1.4, col: '#8a5a3a', col2: '#e8c9a0' },
  imp:       { name: '火焰小鬼', hp: 24, spd: 44, r: 5, h: 13, mass: .8, col: '#e2556a', col2: '#7a2a44' },
  flower:    { name: '炮台花', hp: 40, spd: 0, r: 6, h: 14, mass: 99, col: '#c99bff', col2: '#4f9e48' },
  kingslime: { name: '史莱姆王', hp: 900, spd: 30, r: 16, h: 30, mass: 10, col: '#5fb8ff', col2: '#2f6fc0' },
  bonegen:   { name: '骷髅将军', hp: 800, spd: 28, r: 10, h: 40, mass: 8, col: '#ece6d2', col2: '#b8304f' },
  storm:     { name: '雷云', hp: 760, spd: 44, r: 14, h: 22, mass: 8, col: '#c6d4ea', col2: '#fff27a' },
  mirror:    { name: '镜像法师', hp: 700, spd: 42, r: 7, h: 28, mass: 4, col: '#6c4bb8', col2: '#ff4d6d' },
  illusion:  { name: '幻影', hp: 1, spd: 42, r: 6, h: 28, mass: 2, col: '#6c4bb8', col2: '#b58cff' },
});
Object.assign(INTRO, { hog: '滚刺球会高速滚动撞墙反弹', imp: '火焰小鬼会向你投掷火球', flower: '炮台花扎根不动，持续射出种子' });
Object.assign(QUIPS, {
  hog: ['滚滚滚~', '别挡路！', '我晕车了…'], imp: ['烤你！', '嘿嘿嘿~', '接住这个！'], flower: ['光合作用中', '我只是一朵花', '吃种子吧！'],
  kingslime: ['朕的子民！', '跪下！'], bonegen: ['弓箭手，放！', '为了亡灵军团！'], storm: ['轰隆隆！', '下雨收衣服啦！'], mirror: ['我才是真的你', '镜子里的我更帅'], illusion: ['猜猜我是谁？', '我是假的~'],
});
SPR.hog = spr(['....kkkk....', '..kkbkbkkk..', '.kbkBkbkBbk.', 'kbkbkbkbkbbk', 'kbbBbbbBbbbk', 'kbcckcbbbbbk', 'kccecccbbbbk', '.kcccccbbbk.', '..kkkkkkkk..'], { ...PAL, b: '#8a5a3a', B: '#c48a5a', c: '#e8c9a0', e: '#160f24' });
SPR.imp = spr(['.k........k.', '.kk......kk.', '..krrrrrrk..', '.krRrrrrrrk.', '.kryyrryyrk.', '.krrrrrrrrk.', '.krrwkkwrrk.', 'kd.krrrrk.dk', 'kdd.krrk.ddk', '.kddkrrkddk.', '....krrk....', '....k..k....'], { ...PAL, r: '#e2556a', R: '#ff8aa0', y: '#ffd166', w: '#ffffff', d: '#7a2a44' });
SPR.flower = spr(['...kk..kk...', '..kppkkppk..', '.kppppppppk.', 'kppkyyyykppk', 'kppyyeeyyppk', '.kpyyyyyypk.', '..kpkyykpk..', '...k.gg.k...', '....kggk....', '..kgkggkgk..', '.kggkggkggk.', '..kk.gg.kk..', '....kggk....', '...kkkkkk...'], { ...PAL, p: '#c99bff', y: '#ffd166', e: '#160f24', g: '#4f9e48' });
let STORM_SPR = null, MIRROR_SPR = null;
function eliteArt() {
  if (STORM_SPR) return;
  const [c, x] = makeCanvas(56, 32);
  blobShade(x, 28, 18, [[0, 0, 12], [-14, 3, 9], [14, 3, 9], [-24, 6, 5], [24, 6, 5], [-6, -6, 8], [8, -5, 8]], ['#1a2030', '#3a4660', '#5a6a86', '#8a9ab6']);
  const [w, wx] = makeCanvas(56, 32); wx.drawImage(c, 0, 0); wx.globalCompositeOperation = 'source-in'; wx.fillStyle = '#fff'; wx.fillRect(0, 0, 56, 32);
  STORM_SPR = { c, wc: w, w: 56, h: 32 };
  MIRROR_SPR = { c: tintOf(SPR.mage[3], '#3a1f5c'), wc: SPR.mage[3].wc, w: SPR.mage[3].w, h: SPR.mage[3].h };
}
Object.assign(AI, {
  hog(e, dt, d, a) {
    e.rot = e.rot || 0;
    if (e.state === 'roll') {
      e.st -= dt; e.vx = e.rdx * 165; e.vy = e.rdy * 165; e.rot += dt * 18 * (e.rdx >= 0 ? 1 : -1);
      if ((e.x < e.r + 3 && e.rdx < 0) || (e.x > arena.w - e.r - 3 && e.rdx > 0)) { e.rdx *= -1; addShake(.04); }
      if ((e.y < e.r + 4 && e.rdy < 0) || (e.y > arena.h - e.r - 3 && e.rdy > 0)) { e.rdy *= -1; addShake(.04); }
      if (Math.random() < .5) addPart(e.x, e.y, 0, rand(-20, 20), rand(-10, 10), rand(5, 15), .35, ['#cdb98a', '#7da35a'], 1, { g: 60 });
      if (e.st <= 0) {
        e.state = 'curl'; e.st = .9;
        if (Math.random() < .55) for (let i = 0; i < 8; i++) { const b = i / 8 * TAU; eprojs.push({ x: e.x, y: e.y, vx: Math.cos(b) * 110, vy: Math.sin(b) * 110, r: 2, kind: 'spike', life: 2, t: 0 }); }
      }
    } else if (e.state === 'curl') {
      e.vx = damp(e.vx, 0, 10, dt); e.vy = damp(e.vy, 0, 10, dt); e.st -= dt; e.rot = damp(e.rot, 0, 8, dt);
      if (e.st <= 0) { e.state = 'aim'; e.st = .6; }
    } else {
      e.vx = damp(e.vx, Math.cos(a) * e.spd, 4, dt); e.vy = damp(e.vy, Math.sin(a) * e.spd, 4, dt); e.st -= dt;
      if (e.st <= 0 && d < 260) { e.state = 'roll'; e.st = 1.4; e.rdx = Math.cos(a); e.rdy = Math.sin(a); e.sx = 1.3; e.sy = .8; maybeSay(e, QUIPS.hog, .08); }
    }
  },
  imp(e, dt, d, a) {
    e.z = 4 + Math.sin(e.t * 6 + e.ph) * 2;
    const want = d < 100 ? -1 : d > 150 ? 1 : 0, pa = a + Math.PI / 2;
    e.vx = damp(e.vx, (Math.cos(a) * want + Math.cos(pa) * e.sdir * .6) * e.spd, 5, dt);
    e.vy = damp(e.vy, (Math.sin(a) * want + Math.sin(pa) * e.sdir * .6) * e.spd, 5, dt);
    e.castT = (e.castT ?? rand(1, 2.5)) - dt;
    if (e.castT <= 0 && d < 260) {
      e.castT = rand(2.6, 3.4); e.sx = .8; e.sy = 1.3;
      strikes.push({ kind: 'lob', x: clamp(player.x + rand(-8, 8), 6, arena.w - 6), y: clamp(player.y + rand(-6, 6), 6, arena.h - 6), sx: e.x, sy: e.y - 10, t: 0, delay: 1.05, r: 20 });
      AU.noise(.3, .06, 600, 1600, 1);
    }
  },
  flower(e, dt, d, a) {
    e.vx = e.vy = 0; e.kvx = e.kvy = 0; e.st -= dt;
    e.sy = 1 + Math.sin(e.t * 3) * .05; e.sx = 2 - e.sy;
    if (e.st <= 0 && d < 280) {
      e.st = 2.3; e.sx = 1.3; e.sy = .75;
      for (let i = -1; i <= 1; i++) { const b = a + i * .32; eprojs.push({ x: e.x, y: e.y - 6, vx: Math.cos(b) * 95, vy: Math.sin(b) * 95, r: 2.5, kind: 'seed', life: 3.5, t: 0 }); }
      if (AU.gate('seed', 120)) AU.tone(700, .06, 'square', .03, 400);
    }
  },
  kingslime(e, dt, d, a) {
    e.hopN = e.hopN || 0;
    if (e.state === 'leap') {
      e.st -= dt; const p = 1 - e.st / e.dur;
      e.x = lerp(e.lx, e.tx, easeInOut(p)); e.y = lerp(e.ly, e.ty, easeInOut(p)); e.vx = e.vy = 0;
      e.z = Math.sin(p * Math.PI) * 70; e.sx = .85; e.sy = 1.2;
      if (e.st <= 0) {
        e.z = 0; e.state = 'rest'; e.st = 1.1; e.sx = 1.5; e.sy = .6; addShake(.45);
        fx.push({ k: 'ring', x: e.x, y: e.y, r0: 10, r1: 70, t: 0, max: .5, col: '#5fb8ff', w: 3 });
        for (let i = 0; i < 16; i++) { const b = i / 16 * TAU; eprojs.push({ x: e.x, y: e.y, vx: Math.cos(b) * 80, vy: Math.sin(b) * 80, r: 3, kind: 'slime', life: 4, t: 0 }); }
        for (let i = 0; i < 20; i++) addPart(e.x + rand(-20, 20), e.y, 0, rand(-60, 60), rand(-30, 30), rand(20, 60), .5, ['#bfe8ff', '#5fb8ff'], 2, { g: 200 });
        decalSplat(e.x, e.y, '#2f6fc0', 30, 22);
        if (Math.hypot(player.x - e.x, player.y - e.y) < 34) damagePlayer(1, e.x, e.y);
        AU.noise(.4, .3, 300, 80, .8); AU.tone(90, .3, 'sine', .25, 40);
        if (++e.hopN % 3 === 0) { for (let i = 0; i < 4; i++) { const b = i / 4 * TAU; queueSpawn('slime', clamp(e.x + Math.cos(b) * 40, 20, arena.w - 20), clamp(e.y + Math.sin(b) * 30, 20, arena.h - 20)); } maybeSay(e, ['朕的子民！', '都给朕上！'], .7, { force: true }); }
      }
    } else if (e.state === 'crouch') {
      e.st -= dt; e.vx = damp(e.vx, 0, 10, dt); e.vy = damp(e.vy, 0, 10, dt); e.sx = damp(e.sx, 1.35, 10, dt); e.sy = damp(e.sy, .7, 10, dt);
      if (e.st <= 0) {
        e.state = 'leap'; e.dur = e.st = 1.0; e.lx = e.x; e.ly = e.y;
        e.tx = clamp(player.x, 30, arena.w - 30); e.ty = clamp(player.y, 30, arena.h - 30);
        strikes.push({ kind: 'mark', x: e.tx, y: e.ty, t: 0, delay: 1.0, r: 34, col: '#5fb8ff' });
      }
    } else {
      e.vx = damp(e.vx, Math.cos(a) * e.spd, 3, dt); e.vy = damp(e.vy, Math.sin(a) * e.spd, 3, dt);
      e.st -= dt; if (e.st <= 0) { e.state = 'crouch'; e.st = e.hp < e.maxHp * .5 ? .35 : .5; }
    }
  },
  bonegen(e, dt, d, a) {
    e.vT = (e.vT ?? 2) - dt; e.rT = (e.rT ?? 4.5) - dt; e.sT = (e.sT ?? 8) - dt;
    if (e.state === 'volley') {
      e.vx = damp(e.vx, 0, 10, dt); e.vy = damp(e.vy, 0, 10, dt); e.st -= dt; if (e.st > .2) e.aimA = a;
      if (e.st <= 0) {
        const n = e.hp < e.maxHp * .5 ? 11 : 9;
        for (let i = 0; i < n; i++) { const b = e.aimA + (i / (n - 1) - .5) * 1.2; eprojs.push({ x: e.x, y: e.y - 6, vx: Math.cos(b) * 170, vy: Math.sin(b) * 170, r: 2, kind: 'arrow', life: 2.6, t: 0 }); }
        sfx.arrow(); e.state = 'walk'; e.sx = 1.2; e.sy = .85;
      }
    } else {
      const want = d < 120 ? -1 : d > 180 ? 1 : 0, pa = a + Math.PI / 2;
      e.vx = damp(e.vx, (Math.cos(a) * want + Math.cos(pa) * e.sdir * .5) * e.spd, 4, dt);
      e.vy = damp(e.vy, (Math.sin(a) * want + Math.sin(pa) * e.sdir * .5) * e.spd, 4, dt);
      if (e.vT <= 0 && d < 320) { e.state = 'volley'; e.st = .7; e.aimA = a; e.vT = rand(2.8, 3.6); }
    }
    if (e.rT <= 0) {
      e.rT = rand(6, 7.5);
      for (let i = 0; i < 8; i++) strikes.push({ kind: 'rain', x: clamp(i ? player.x + rand(-55, 55) : player.x, 8, arena.w - 8), y: clamp(i ? player.y + rand(-40, 40) : player.y, 8, arena.h - 8), t: 0, delay: 1.1 + i * .07, r: 13 });
      AU.tone(220, .4, 'sawtooth', .08, 330); say(e, '箭雨！', { force: true, cd: .5 });
    }
    if (e.sT <= 0) { e.sT = rand(10, 13); for (let i = 0; i < 3; i++) { const b = rand(TAU); queueSpawn('skel', clamp(e.x + Math.cos(b) * 50, 20, arena.w - 20), clamp(e.y + Math.sin(b) * 40, 20, arena.h - 20)); } }
  },
  storm(e, dt, d, a) {
    e.z = 30 + Math.sin(e.t * 1.5) * 4;
    e.orbA = (e.orbA ?? rand(TAU)) + dt * .55;
    const tx = clamp(player.x + Math.cos(e.orbA) * 110, 30, arena.w - 30), ty = clamp(player.y + Math.sin(e.orbA) * 80, 40, arena.h - 20), b = Math.atan2(ty - e.y, tx - e.x);
    e.vx = damp(e.vx, Math.cos(b) * e.spd, 2, dt); e.vy = damp(e.vy, Math.sin(b) * e.spd, 2, dt);
    e.lT = (e.lT ?? 2.5) - dt; e.oT = (e.oT ?? 5) - dt;
    const rage = e.hp < e.maxHp * .5;
    if (e.lT <= 0) {
      e.lT = rage ? 2 : 2.8;
      const n = rage ? 6 : 4;
      for (let i = 0; i < n; i++) strikes.push({ kind: 'bolt', x: clamp(i ? player.x + rand(-70, 70) : player.x, 8, arena.w - 8), y: clamp(i ? player.y + rand(-50, 50) : player.y, 8, arena.h - 8), t: 0, delay: .9 + i * .06, r: 15 });
      AU.noise(.5, .06, 5000, 2000, 3);
    }
    if (e.oT <= 0) { e.oT = 6; for (let i = 0; i < 4; i++) { const c = a + (i - 1.5) * .5; eprojs.push({ x: e.x, y: e.y, vx: Math.cos(c) * 55, vy: Math.sin(c) * 55, r: 3, kind: 'elec', life: 6, t: 0, home: .9 }); } }
  },
  mirror(e, dt, d, a) {
    e.tpT = (e.tpT ?? 3.5) - dt; e.cT = (e.cT ?? 1.5) - dt;
    if (e.state === 'out') {
      e.st -= dt; e.alpha = Math.max(0, e.st / .3); e.ghost = true;
      if (e.st <= 0) { const b = rand(TAU), R = rand(100, 140); e.x = clamp(player.x + Math.cos(b) * R, 20, arena.w - 20); e.y = clamp(player.y + Math.sin(b) * R, 24, arena.h - 20); e.state = 'in'; e.st = .3; }
    } else if (e.state === 'in') {
      e.st -= dt; e.alpha = 1 - Math.max(0, e.st / .3); if (e.st <= 0) { e.state = 'idle'; e.ghost = false; e.alpha = 1; }
    } else {
      const want = d < 90 ? -1 : d > 130 ? 1 : 0, pa = a + Math.PI / 2;
      e.vx = damp(e.vx, (Math.cos(a) * want + Math.cos(pa) * e.sdir * .7) * e.spd, 4, dt);
      e.vy = damp(e.vy, (Math.sin(a) * want + Math.sin(pa) * e.sdir * .7) * e.spd, 4, dt);
      if (e.cT <= 0) {
        e.cT = e.isIll ? 2.8 : 1.9;
        const n = e.isIll ? 3 : 5;
        for (let i = 0; i < n; i++) { const c = a + (i / (n - 1) - .5) * 1.6; eprojs.push({ x: e.x, y: e.y - 8, vx: Math.cos(c) * 85, vy: Math.sin(c) * 85, r: 3, kind: 'dark', life: 4.5, t: 0, home: 1.6 }); }
        AU.tone(400, .2, 'sine', .05, 800);
      }
      if (!e.isIll && e.tpT <= 0) { e.tpT = rand(3.5, 4.5); e.state = 'out'; e.st = .3; }
      if (!e.isIll && !e.split1 && e.hp < e.maxHp * .6) { e.split1 = true; spawnIllusions(e, 2); }
      if (!e.isIll && !e.split2 && e.hp < e.maxHp * .3) { e.split2 = true; spawnIllusions(e, 3); }
    }
  },
});
AI.illusion = AI.mirror;
function spawnIllusions(m, n) {
  for (let i = 0; i < n; i++) {
    const b = i / n * TAU + rand(.5), il = makeEnemy('illusion', clamp(m.x + Math.cos(b) * 50, 20, arena.w - 20), clamp(m.y + Math.sin(b) * 40, 24, arena.h - 20));
    il.isIll = true; il.hp = il.maxHp = m.maxHp * .06; il.spawnT = .3; enemies.push(il);
  }
  say(m, pick(['猜猜哪个是真的？', '我才是真的你']), { force: true });
  AU.tone(1200, .4, 'sine', .06, 400);
}
function spawnElite(type) {
  eliteArt();
  const e = makeEnemy(type, arena.w / 2, arena.h / 2 - 60);
  e.elite = true; e.sx = .4; e.sy = 1.6;
  enemies.push(e); G.boss = e; G.eliteSpawned = true; G.surgeT = 1e9;
  document.querySelector('.boss-name').textContent = EDEF[type].name;
  $('boss').classList.remove('hide');
  sfx.roar(); addShake(.6, true);
  for (let i = 0; i < 30; i++) { const c = rand(TAU); addPart(e.x, e.y, 10, Math.cos(c) * 110, Math.sin(c) * 70, rand(0, 60), .8, ['#ffffff', e.col, e.col2], 2, { add: true, drag: 3 }); }
  later(1, () => say(e, pick(QUIPS[type]), { force: true, reply: QUIPS.reply, replyChance: .7 }));
}
function eliteDeath(e) {
  $('boss').classList.add('hide'); G.boss = null;
  for (let i = 0; i < 3; i++) later(.12 * i, () => explode(e.x + rand(-16, 16), e.y + rand(-12, 12), rand(18, 28), 0, true, ['#ffffff', e.col, e.col2]));
  dropHeart(e.x, e.y);
  if (e.type === 'kingslime') for (let i = 0; i < 6; i++) { const m = makeEnemy('mini', e.x + rand(-14, 14), e.y + rand(-10, 10)); m.spawnT = 1; m.kvx = rand(-120, 120); m.kvy = rand(-80, 80); enemies.push(m); }
  for (const m of enemies) if (m.type === 'illusion' && !m.dead) killEnemy(m, { silent: true });
  if (curLevel().goal.type === 'elite') later(1, levelClear);
}

/* ---- endless floor generator ---- */
const ENDLESS_POOL = { mini: 3, slime: 3, bat: 3, shroom: 3, skel: 3, knight: 2, wraith: 2, hog: 2, imp: 2, flower: 2 };
const MONO_TYPES = ['slime', 'bat', 'shroom', 'skel', 'knight', 'wraith', 'hog', 'imp'];
const ELITES = ['kingslime', 'bonegen', 'storm', 'mirror'];
const VARIANTS = {
  normal: { name: '深渊回廊', desc: '' },
  mono: { name: '单一族群', desc: t => `这一层只有${EDEF[t].name}` },
  elite: { name: '精英来袭', desc: t => `击败${EDEF[t].name}` },
  far: { name: '远方来客', desc: '敌人只会在远处出现' },
  giants: { name: '巨人之境', desc: '敌人数量 ÷10，体型与血量 ×10' },
  horde: { name: '尸潮', desc: '敌人数量翻倍，但更加脆弱' },
  frenzy: { name: '狂暴', desc: '所有敌人移动速度 ×1.5' },
  night: { name: '永夜', desc: '黑暗笼罩了山谷' },
  barrage: { name: '弹幕地狱', desc: '只有远程敌人' },
  newblood: { name: '新面孔', desc: '山谷外的新魔物出现了' },
};
function makeEndlessLevel(k) {
  let v;
  if (k === 1) v = 'normal';
  else if (k % 3 === 0) v = 'elite';
  else v = pick(['normal', 'mono', 'far', 'giants', 'horde', 'frenzy', 'night', 'barrage', 'newblood'].filter(x => x !== G.lastVariant));
  G.lastVariant = v;
  const L = { theme: randi(0, 3), pillars: randi(6, 10), rate: Math.min(7, 3 + k * .3), cap: Math.min(64, 28 + k * 2.5), pool: { ...ENDLESS_POOL }, hpMul: 1, spdMul: 1, far: false, variant: v, vparam: null };
  if (k < 3) { delete L.pool.hog; delete L.pool.imp; delete L.pool.flower; }
  L.goal = Math.random() < .5 ? { type: 'kill', n: 45 + k * 12 } : { type: 'survive', t: Math.min(75, 45 + k * 2) };
  switch (v) {
    case 'mono': { const t = pick(MONO_TYPES); L.pool = { [t]: 1 }; L.vparam = t; L.rate *= 1.15; break; }
    case 'elite': { const t = pick(ELITES.filter(e => e !== G.lastElite)); G.lastElite = t; L.vparam = t; L.goal = { type: 'elite' }; L.pool = { mini: 2, bat: 2, slime: 1 }; L.rate = 1; L.cap = 8; break; }
    case 'far': L.far = true; break;
    case 'giants': L.rate = Math.max(.35, L.rate / 10); L.cap = Math.max(3, Math.round(L.cap / 10)); L.hpMul = 10; L.scale = 2; delete L.pool.mini; if (L.goal.type === 'kill') L.goal.n = Math.max(6, Math.round(L.goal.n / 10)); break;
    case 'horde': L.rate *= 2; L.cap = Math.min(96, Math.round(L.cap * 1.6)); L.hpMul = .5; if (L.goal.type === 'kill') L.goal.n *= 2; break;
    case 'frenzy': L.spdMul = 1.5; break;
    case 'night': L.themeObj = { ...THEMES[3], dark: [8, 6, 24, .72], cloud: .04, warm: [120, 140, 255, .1], shaft: '#8fa8ff' }; L.theme = 3; break;
    case 'barrage': L.pool = { skel: 3, wraith: 2, imp: 2, flower: 3 }; break;
    case 'newblood': L.pool = { hog: 3, imp: 3, flower: 2, mini: 2 }; break;
  }
  L.name = VARIANTS[v].name;
  const d = VARIANTS[v].desc; L.desc = typeof d === 'function' ? d(L.vparam) : d;
  return L;
}
function startEndless(k) {
  G.endless = true; G.loop = k; G.endlessL = makeEndlessLevel(k);
  startLevel(LEVELS.length);   // index past the main floors; everything reads curLevel()
}
function endlessOnLevelStart() { strikes = []; G.eliteSpawned = false; G.timeStop = 0; }

/* ---- the build is a list of picks, so it can be stolen, shuffled and rebuilt ---- */
function rebuildBuild() {
  const keepHp = player.hp;
  spell = newSpell();
  Object.assign(player, { maxHp: 6, speed: 82, dashCdMax: .85, novaCdMax: 7 });
  G.ups = {};
  for (const h of G.history) { const u = UPGRADES.find(x => x.id === h.id); if (!u) continue; u.apply(h.m); G.ups[h.id] = (G.ups[h.id] || 0) + 1; }
  player.hp = clamp(keepHp, 1, player.maxHp);
  hudCache = {}; updateHearts();
}
function resetForEndless() {
  G.history = []; rebuildBuild(); G.rerolls = 5;
  player.hp = Math.min(player.hp, player.maxHp);
}
function upName(h) { const u = UPGRADES.find(x => x.id === h.id); return u ? u.name : h.id; }

/* ---- every sixth endless floor: a demon, a clown or a star god ---- */
const NPC_DEFS = {
  demon: { name: '贪婪的恶魔', glow: '#ff4d6d', pal: { k: '#1a0a14', R: '#e8e0ff', M: '#9b2f5a', D: '#5a1838', y: '#ffd166', w: '#ffffff' },
    rows: ['..k........k..', '.kRk......kRk.', '.kRRkkkkkkRRk.', '..kMMMMMMMMk..', '.kMMMMMMMMMMk.', '.kMyyMMMMyyMk.', '.kMykMMMMkyMk.', '.kMMMMMMMMMMk.', '.kMMwkwkwkMMk.', '..kMMMMMMMMk..', '.kDDMMMMMMDDk.', 'kDDkMMMMMMkDDk', '.k..kMMMMk..k.', '....kk..kk....'],
    lines: ['嘿嘿嘿……能走到这里，你身上的力量可真不少。', '借我一点吧？不借也得借！'] },
  clown: { name: '疯狂的小丑', glow: '#ff9ec7', pal: { k: '#1d1430', y: '#ffd166', q: '#c99bff', w: '#ffffff', b: '#5fb8ff', r: '#ff4d6d', g: '#5fd068', p: '#ff9ec7' },
    rows: ['.....kyk......', '....kyyyk.....', '...kqyqyqk....', '..kqqqqqqqk...', '.kkkkkkkkkkk..', '..kwwwwwwwk...', '..kwbkwbkwk...', '..kwwrrwwwk...', '..krwwwwwrk...', '...krrrrrk....', '..kgggpgggk...', '.kpgpgpgpgpk..', '..kgggggggk...', '...kk...kk....'],
    lines: ['当当当当！欢迎来到小丑的魔术时间~', '你的符文太整齐啦，让我帮你洗一洗牌！'] },
  stargod: { name: '星神', glow: '#ffd166', pal: { k: '#1d1640', y: '#fff3c4', G: '#ffd166', w: '#fff8e8', b: '#5fb8ff', S: '#7a5bd6' },
    rows: ['......y.......', '...y..y..y....', '....kkkkkk....', '...kGGGGGGk...', '..kGwwwwwwGk..', '..kGwbwwbwGk..', '..kGwwwwwwGk..', '..kGGwwwwGGk..', '.kSSSGGGGSSSk.', 'kSSSSSSSSSSSSk', '.kSSSSyySSSSk.', '..kSSSSSSSSk..', '...kSSSSSSk...', '....kkkkkk....'],
    lines: ['孩子，星辰的意志变幻无常。', '你的大魔法，将由我重新铭刻。'] },
};
function trialAct(id) {
  if (id === 'demon') {
    const n = Math.min(G.history.length, 2 + Math.floor(G.loop / 12));
    if (!n) return '……你身上什么都没有？真是个穷光蛋，算了算了。';
    const taken = [];
    for (let i = 0; i < n; i++) { const j = randi(0, G.history.length - 1); taken.push(upName(G.history[j])); G.history.splice(j, 1); }
    rebuildBuild();
    return `恶魔夺走了：${taken.join('、')}。`;
  }
  if (id === 'clown') {
    const n = G.history.length;
    if (!n) return '咦？你什么符文都没有，那小丑就……表演个倒立吧！';
    G.history = []; rebuildBuild();
    const got = [];
    for (let i = 0; i < n; i++) { const c = rollUpgrades(1)[0]; if (!c) break; c.u.apply(RAR[c.tier].m); G.ups[c.u.id] = (G.ups[c.u.id] || 0) + 1; G.history.push({ id: c.u.id, m: RAR[c.tier].m }); got.push(c.u.name); }
    rebuildBuild();
    return `小丑把你的符文洗成了：${got.slice(0, 8).join('、')}${got.length > 8 ? ` 等 ${got.length} 个` : ''}。`;
  }
  const ids = Object.keys(ULTS).filter(x => !G.ult || x !== G.ult.id), nid = pick(ids);
  G.pendingUlt = nid;
  return `星神将你的大魔法改写为「${ULTS[nid].name}」。`;
}
function startTrialEvent(after) {
  const id = G.history.length < 2 ? 'stargod' : pick(['demon', 'clown', 'stargod']), D = NPC_DEFS[id];
  D.spr = D.spr || spr(D.rows, D.pal);
  G.state = 'npc'; G.cine = true;
  const x = clamp(player.x + 36, 20, arena.w - 20), y = clamp(player.y - 4, 30, arena.h - 20);
  const who = { spr: D.spr, name: D.name, col: D.glow };
  G.npc = { x, y, z: 8, h: 18, t: 0, alpha: 0, leaving: false, talked: false, spr: D.spr, glow: D.glow,
    onTalk: () => openDialog(D.lines, () => {
      const result = trialAct(id);
      AU.tone(id === 'demon' ? 140 : id === 'clown' ? 660 : 990, .6, id === 'demon' ? 'sawtooth' : 'triangle', .08, id === 'demon' ? 70 : 1320);
      addShake(.3, true);
      for (let i = 0; i < 30; i++) { const a = rand(TAU); addPart(player.x, player.y - 8, 6, Math.cos(a) * 80, Math.sin(a) * 60, rand(20, 80), .8, ['#ffffff', D.glow], 1, { add: true, drag: 2 }); }
      openDialog([result], () => {
        if (G.npc) G.npc.leaving = true;
        setTimeout(() => { G.cine = false; G.camFocus = null; if (G.pendingUlt) openPick('ult1'); else after(); }, 1100);
      }, who);
    }, who) };
  G.camFocus = { x: (player.x + x) / 2, y: player.y - 12 };
  AU.tone(330, .6, 'triangle', .08, 660); AU.noise(.8, .04, 6000, 9000, 2);
  for (let i = 0; i < 24; i++) { const a = rand(TAU); addPart(x, y, 10, Math.cos(a) * 40, Math.sin(a) * 30, rand(10, 50), rand(.5, 1), ['#ffffff', D.glow], 1, { add: true, drag: 2 }); }
}

/* ---- telegraphed strikes ---- */
function updateStrikes(dt) {
  if (G.timeStop > 0) return;
  for (const s of strikes) {
    s.t += dt;
    if (s.t >= s.delay && !s.done) {
      s.done = true;
      const hit = Math.hypot(player.x - s.x, player.y - s.y) < s.r + player.r;
      if (s.kind === 'rain') { for (let i = 0; i < 6; i++) addPart(s.x + rand(-6, 6), s.y + rand(-4, 4), 0, rand(-20, 20), rand(-10, 10), rand(10, 30), .3, ['#ece6d2', '#a99f86'], 1, { g: 200 }); if (hit) damagePlayer(1, s.x, s.y); if (AU.gate('rain', 40)) AU.noise(.08, .08, 3000, 1000, 3); }
      if (s.kind === 'bolt') { fx.push({ k: 'flash', x: s.x, y: s.y, r: 40, t: 0, max: .25, col: '#fff27a' }); decalScorch(s.x, s.y, 10); addShake(.12); if (hit) damagePlayer(1, s.x, s.y); if (AU.gate('bolt', 60)) { AU.noise(.3, .2, 4000, 800, 1); AU.tone(120, .2, 'square', .1, 50); } }
      if (s.kind === 'lob') { fx.push({ k: 'boom', x: s.x, y: s.y, R: s.r, t: 0, max: .35, cols: ['#fff4c2', '#ffb347', '#ff4d2e'] }); decalScorch(s.x, s.y, s.r * .7); addShake(.1); if (hit) damagePlayer(1, s.x, s.y); sfx.boom(); }
    }
  }
  strikes = strikes.filter(s => !s.done || s.t < s.delay + .3);
}
function drawStrikes() {
  for (const s of strikes) {
    const p = clamp(s.t / s.delay, 0, 1), col = s.col || (s.kind === 'bolt' ? '#fff27a' : s.kind === 'lob' ? '#ff7a3d' : '#ff4d6d');
    if (!s.done) {
      ctx.globalAlpha = .3 + .5 * p; ctx.fillStyle = col; pixRing(s.x, s.y, s.r, .62, 1);
      ctx.globalAlpha = .2 * p; pixDisc(s.x, s.y, s.r * p, .62); ctx.globalAlpha = 1;
      if (s.kind === 'lob') {
        const x = lerp(s.sx, s.x, p), y = lerp(s.sy, s.y, p) - Math.sin(p * Math.PI) * 55;
        ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = .7; ctx.drawImage(glowTex('#ff7a3d'), x - 10, y - 10, 20, 20); ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
        ctx.fillStyle = '#ff4d2e'; pixDisc(x, y, 3, 1); ctx.fillStyle = '#fff4c2'; ctx.fillRect(Math.round(x - 1), Math.round(y - 1), 2, 2);
      }
      if (s.kind === 'rain' && p > .7) { ctx.fillStyle = '#ece6d2'; for (let i = 0; i < 3; i++) { const yy = s.y - (1 - p) * 300 - i * 9; ctx.fillRect(Math.round(s.x - 3 + i * 3), Math.round(yy), 1, 6); } }
    } else if (s.kind === 'bolt') {
      const a = 1 - (s.t - s.delay) / .3;
      ctx.globalAlpha = clamp(a, 0, 1); ctx.fillStyle = '#ffffff';
      let x = s.x; for (let y = s.y - 220; y < s.y; y += 6) { const nx = s.x + (Math.random() - .5) * 10; pixLine(x, y, nx, y + 6, 2); x = nx; }
      ctx.fillStyle = '#fff27a'; pixDisc(s.x, s.y, 6, .62); ctx.globalAlpha = 1;
    }
  }
}

/* ---- drawing the new monsters and the elites ---- */
function basicDraw(e, sp, sc = 1, extra = {}) {
  const vis = e.spawnT < 1 ? easeOutCubic(e.spawnT) : 1, k = sc * (e.scale || 1);
  const sx = e.sx * (1 + e.hitSq * .3) * k, sy = e.sy * (1 - e.hitSq * .22) * k;
  const st = e.frozen > 0 ? '#c6f6ff' : e.burnT > 0 ? '#ff7a3d' : e.slowT > 0 ? '#7ad0ff' : null;
  drawSpr(sp, e.x, e.y - e.z, { flip: e.face < 0, sx, sy, white: e.flash > 0, vis, alpha: extra.alpha ?? 1, tint: st || extra.tint, tintA: st ? (e.frozen > 0 ? .7 : .45) : extra.tintA });
}
const EDRAW = {
  hog(e) {
    if (e.state !== 'roll' && Math.abs(e.rot || 0) < .05) { basicDraw(e, SPR.hog); return; }
    const sp = SPR.hog, k = e.scale || 1;
    ctx.save(); ctx.translate(snap(e.x), snap(e.y - sp.h / 2 * k)); ctx.rotate(e.rot); ctx.scale(k, k);
    ctx.drawImage(e.flash > 0 ? sp.wc : sp.c, -sp.w / 2, -sp.h / 2); ctx.restore();
  },
  imp(e) { basicDraw(e, SPR.imp); if (e.castT < .4) { ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = .6; ctx.drawImage(glowTex('#ff7a3d'), e.x - 8, e.y - e.z - 22, 16, 16); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; } },
  flower(e) { basicDraw(e, SPR.flower); },
  kingslime(e) {
    basicDraw(e, SPR.slime[0], 3);
    const top = e.y - e.z - 30 * e.sy * (1 - e.hitSq * .22) - 1;
    ctx.fillStyle = '#160f24'; ctx.fillRect(Math.round(e.x - 8), Math.round(top - 7), 16, 8);
    ctx.fillStyle = '#ffd166'; ctx.fillRect(Math.round(e.x - 7), Math.round(top - 3), 14, 3);
    for (const dx of [-7, -1, 5]) ctx.fillRect(Math.round(e.x + dx), Math.round(top - 6), 2, 3);
    ctx.fillStyle = '#ff4d6d'; ctx.fillRect(Math.round(e.x - 1), Math.round(top - 2), 2, 1);
  },
  bonegen(e) {
    if (e.state === 'volley') {
      ctx.globalAlpha = .2 + .3 * (1 - e.st / .7); ctx.fillStyle = '#ff4d6d';
      for (let i = 0; i < 5; i++) { const b = e.aimA + (i / 4 - .5) * 1.2; pixLine(e.x, e.y - 10, e.x + Math.cos(b) * 90, e.y - 10 + Math.sin(b) * 90); }
      ctx.globalAlpha = 1;
    }
    const k = 2.5, top = e.y - e.z - 16 * k;
    ctx.fillStyle = '#7a1a2e'; ctx.fillRect(Math.round(e.x - 9), Math.round(top + 16), 18, 22); ctx.fillStyle = '#b8304f'; ctx.fillRect(Math.round(e.x - 8), Math.round(top + 16), 6, 21);
    basicDraw(e, SPR.skel, k);
    ctx.fillStyle = '#160f24'; ctx.fillRect(Math.round(e.x - 7), Math.round(top - 4), 14, 6);
    ctx.fillStyle = '#ffd166'; ctx.fillRect(Math.round(e.x - 6), Math.round(top - 3), 12, 3); ctx.fillRect(Math.round(e.x - 6), Math.round(top - 6), 2, 3); ctx.fillRect(Math.round(e.x + 4), Math.round(top - 6), 2, 3); ctx.fillRect(Math.round(e.x - 1), Math.round(top - 7), 2, 4);
  },
  storm(e) {
    const y = e.y - e.z, sp = STORM_SPR;
    ctx.globalAlpha = .5; ctx.fillStyle = '#9fd8ff';
    for (let i = 0; i < 8; i++) { const rx = e.x - 20 + ((i * 7 + e.t * 40) % 40), ry = y + 6 + ((e.t * 120 + i * 13) % 26); ctx.fillRect(Math.round(rx), Math.round(ry), 1, 3); }
    ctx.globalAlpha = 1;
    if (Math.sin(e.t * 9) > .85) { ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = .6; ctx.drawImage(glowTex('#fff27a'), e.x - 30, y - 24, 60, 40); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; }
    const sx = e.sx * (1 + e.hitSq * .2), sy = e.sy * (1 - e.hitSq * .15);
    ctx.save(); ctx.translate(snap(e.x), snap(y)); ctx.scale(sx, sy); ctx.drawImage(e.flash > 0 ? sp.wc : sp.c, -sp.w / 2, -sp.h / 2 - 4); ctx.restore();
    ctx.fillStyle = '#fff27a';
    for (const dx of [-8, 4]) { ctx.fillRect(Math.round(e.x + dx), Math.round(y - 4), 4, 2); ctx.fillStyle = '#160f24'; ctx.fillRect(Math.round(e.x + dx + (dx < 0 ? 0 : 1)), Math.round(y - 6), 3, 1); ctx.fillStyle = '#fff27a'; }
  },
  mirror(e) {
    ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = .4 * e.alpha; ctx.drawImage(glowTex('#b58cff'), e.x - 18, e.y - e.z - 34, 36, 36); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
    basicDraw(e, MIRROR_SPR, 1.6, { alpha: e.alpha * (e.isIll ? .7 : 1) });
    if (e.alpha > .5) { ctx.fillStyle = '#ff4d6d'; ctx.fillRect(Math.round(e.x - 3), Math.round(e.y - e.z - 15), 2, 1); ctx.fillRect(Math.round(e.x + 1), Math.round(e.y - e.z - 15), 2, 1); }
  },
};
EDRAW.illusion = EDRAW.mirror;

/* ================= finale comic: the eye falls, the abyss pours in ================= */
const FINALE = [
  { text: '深渊之眼在星光中碎裂了——', draw: (c, t) => comicShatter(c, t) },
  { text: '可它撕开的裂口没有合拢。无数魔物，正从深渊中涌出！', draw: (c, t) => comicFlood(c, t) },
  { text: '就在这时，山谷的法阵燃起前所未有的光芒，献上了六道最终的大魔法。', draw: (c, t) => comicGift(c, t) },
  { text: '深渊的引力抽走了他所有的符文……没关系，从头再来就好。', draw: (c, t) => comicReset(c, t) },
];
function comicShatter(c, t) {
  c.fillStyle = '#1c1238'; c.fillRect(0, 0, CW_, CH_);
  const k = clamp((t - .9) / .8, 0, 1);
  cGlow(c, 80, 40, 40 + k * 40, '#ff7ac8', .5 + k * .3);
  if (k <= 0) {
    cEye(c, 80 + (Math.random() - .5) * 2, 40, 1, Math.sin(t * 8) * 2, 0, 1);
    c.fillStyle = '#ffffff'; for (let i = 0; i < 5; i++) { const a = i * 1.3; let x = 80, y = 40; for (let s = 0; s < t * 12; s++) { x += Math.cos(a + Math.sin(s)) * 1.5; y += Math.sin(a + Math.cos(s)) * 1.5; c.fillRect(Math.round(x), Math.round(y), 1, 1); } }
  } else {
    for (let i = 0; i < 24; i++) { const a = i / 24 * TAU, r = easeOutCubic(k) * (30 + (i % 5) * 10); c.fillStyle = i % 3 ? '#5a36a0' : i % 2 ? '#ff4d6d' : '#efe6f8'; c.fillRect(Math.round(80 + Math.cos(a) * r), Math.round(40 + Math.sin(a) * r * .8), 4 - (i % 3), 3); }
    if (k < .3) { c.globalAlpha = 1 - k / .3; c.fillStyle = '#ffffff'; c.fillRect(0, 0, CW_, CH_); c.globalAlpha = 1; }
  }
  c.fillStyle = '#140a1c'; c.fillRect(0, 88, CW_, 12);
  cGlow(c, 80, 72, 12, '#8fe6ff', .7); cSpr(c, SPR.mage[3].c, 80, 89, 2, false);
}
function comicFlood(c, t) {
  cBands(c, ['#1c1238', '#2e1a52', '#4c2a6a', '#6a3a6a'], 0, 80);
  c.fillStyle = '#0a0614';
  for (let x = 20; x < 140; x++) { const h = 10 * (1 - Math.abs(x - 80) / 60); c.fillRect(x, Math.round(26 + Math.sin(x * .4) * 2 - h / 2), 1, Math.max(1, Math.round(h))); }
  cGlow(c, 80, 26, 50, '#ff4d6d', .4);
  const types = [SPR.slime[0], SPR.bat[0], SPR.skel, SPR.imp, SPR.hog, SPR.shroom];
  for (let i = 0; i < 18; i++) {
    const q = ((t * .35 + i / 18) % 1), sx = 30 + (i * 37) % 100, x = sx + Math.sin(i + t) * 6 + (sx - 80) * q * .8, y = 28 + q * 60;
    if (q < .02) continue;
    cSpr(c, tintOf(types[i % types.length], '#0a0614'), x, y, 1, i % 2 === 0);
    c.fillStyle = '#ff4d6d'; c.fillRect(Math.round(x - 1), Math.round(y - 5), 1, 1); c.fillRect(Math.round(x + 1), Math.round(y - 5), 1, 1);
  }
  c.fillStyle = '#1c1420'; c.fillRect(0, 88, CW_, 12);
  cSpr(c, tintOf(SPR.mage[3], '#0a0614'), 80, 90, 1.5, false);
}
function comicGift(c, t) {
  cBands(c, ['#3a2058', '#6a2f6a', '#b2486a', '#ee7a5a'], 0, 64);
  cRidge(c, 56, 4, .07, 2, '#4a2a4a');
  c.fillStyle = '#2c1f30'; c.fillRect(0, 64, CW_, 36);
  const cx = 80, cy = 82, k = clamp(t / 1, 0, 1);
  cGlow(c, cx, cy, 40 * k, '#ffe58a', .8);
  c.globalCompositeOperation = 'lighter'; cRing(c, cx, cy, 30, .35, '#ffe58a', k); cRing(c, cx, cy, 22, .35, '#ffffff', k);
  c.globalAlpha = .5; c.fillStyle = '#fff1c4'; c.fillRect(cx - 8, cy - 80 * k, 16, 80 * k); c.globalAlpha = 1;
  c.globalCompositeOperation = 'source-over';
  const cols = ['#9fd8ff', '#ffd166', '#c4b5d9', '#fff27a', '#a8e8ff', '#ff4d6d'];
  for (let i = 0; i < 6; i++) {
    const rise = easeOutCubic(clamp((t - .6 - i * .12) / .8, 0, 1)); if (rise <= 0) continue;
    const a = t * .8 + i / 6 * TAU, x = cx + Math.cos(a) * 34 * rise, y = cy - 40 * rise + Math.sin(a) * 10;
    cGlow(c, x, y, 9, cols[i], .9); c.fillStyle = '#ffffff'; c.fillRect(Math.round(x) - 1, Math.round(y) - 1, 3, 3);
  }
  cSpr(c, SPR.mage[3].c, cx, cy + 4, 2, false);
}
function comicReset(c, t) {
  c.fillStyle = '#20102c'; c.fillRect(0, 0, CW_, CH_);
  c.fillStyle = '#0a0614'; for (let x = 30; x < 130; x++) { const h = 8 * (1 - Math.abs(x - 80) / 50); c.fillRect(x, Math.round(10 - h / 2), 1, Math.max(1, Math.round(h))); }
  c.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 30; i++) { const q = ((t * .6 + i / 30) % 1), x = 80 + Math.sin(i * 2.3) * 30 * (1 - q), y = lerp(70, 10, q); c.fillStyle = ['#5fb8ff', '#ffd166', '#ff8fc4', '#a6de72', '#c99bff'][i % 5]; c.fillRect(Math.round(x), Math.round(y), 2, 2); }
  c.globalCompositeOperation = 'source-over';
  c.fillStyle = '#140a1c'; c.fillRect(0, 90, CW_, 10);
  const p = .7 + Math.sin(t * 5) * .3;
  cGlow(c, 94, 66, 14 * p, '#ffffff', .9);
  cSpr(c, SPR.mage[3].c, 80, 91, 2, false);
  if (t > 1.2) { c.font = '8px "Press Start 2P", monospace'; c.fillStyle = '#160f24'; c.fillText('!', 101, 51); c.fillStyle = '#ffd166'; c.fillText('!', 100, 50); }
}
function startFinale() {
  const go = () => openPick('ult');
  startComic(FINALE, go, { hint: '按任意键接受大魔法', key: 'finale' });
}
