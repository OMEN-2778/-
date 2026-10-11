
/* ================= the six great magics ================= */
const ULTS = {
  moon:    { name: '月光', col: '#9fd8ff', charge: '充能：击杀 45 个敌人',
    desc: '向前方发射一道巨大的月光，持续 4 秒，每次命中造成 999 伤害，贯穿一切且不衰减，可随鼠标缓慢转向。释放期间无敌，结束后有 0.5 秒硬直。',
    icon: ['....aaa.....', '...aaw......', '..aaw.......', '.aaw........', '.aaw........', '.aaw........', '.aaw........', '..aaw.....a.', '..aaaw..aa..', '...aaaaaa...', '.....aa.....', '............'] },
  sun:     { name: '太阳', col: '#ffd166', charge: '被动：无需释放',
    desc: '每 30 秒回复一颗心（最多回到 6 颗）。拥有 2 次复活机会：复活时释放巨大的闪光脉冲，秒杀场上所有敌人。每击杀 500 个敌人恢复一次复活机会。',
    icon: ['.....a......', '..a..a..a...', '...a...a....', '....aaa.....', 'aa.awwwa.aa.', '...awwwa....', '....aaa.....', '...a...a....', '..a..a..a...', '.....a......', '............', '............'] },
  hollow:  { name: '空洞', col: '#c4b5ff', charge: '充能：每 40 秒自动充满',
    desc: '时间停止 5 秒，敌人与敌方子弹全部冻结。时停中被你击中的敌人会被标记，时间恢复的瞬间每个标记都引爆一次 999 伤害的爆炸；碰到的敌方子弹会被改写，反向飞回。',
    icon: ['.kkkkkkkkk..', '.kaaaaaaak..', '..kawwwak...', '...kawak....', '....kak.....', '....kak.....', '...ka.ak....', '..ka...ak...', '.ka.....ak..', '.kkkkkkkkk..', '............', '............'] },
  star:    { name: '星芒', col: '#fff27a', charge: '充能：每通过一关充能 50%',
    desc: '进入绘制状态 10 秒：左键点击放置星星（最多 7 颗），星星之间连成光线，触碰光线的敌人持续受到伤害。绘制期间可以移动，暂停普通攻击。',
    icon: ['a..........a', '.a........a.', '..a..w...a..', '...aawaaa...', '....awwa....', 'aaaawwwwaaaa', '....awwa....', '...aawaaa...', '..a..w...a..', '.a........a.', 'a..........a', '............'] },
  phantom: { name: '幽灵', col: '#a8e8ff', charge: '充能：幽灵亲手击杀 35 个敌人',
    desc: '被动：身边常驻一只幽灵自动攻击，随它的击杀数升级（共 5 级），攻速和攻击方式逐渐增强。大招：与幽灵融合 12 秒，形态与攻击方式取决于幽灵等级。',
    icon: ['...kkkkk....', '..kaaaaak...', '.kaaaaaaak..', '.kakkakkak..', '.kawkawkak..', '.kaaaaaaak..', '.kaaaaaaak..', '.kaaaaaaak..', '.kaakaakak..', '..kk.kk.k...', '............', '............'] },
  demon:   { name: '星魔', col: '#ff4d6d', charge: '无冷却：每次释放消耗一颗心',
    desc: '消耗一颗心，化身星魔 15 秒：期间无敌，恶魔之触自动撕裂周围敌人，左键挥出巨爪，每次攻击造成 666 伤害。只剩一颗心时无法释放。',
    icon: ['k.........k.', 'ak.......ka.', 'aak.....kaa.', '.akkkkkkka..', '..kaaaaak...', '.kawaaawak..', '.kaaaaaaak..', '.kaakkkaak..', '..kaaaaak...', '...kkkkk....', '............', '............'] },
};
const ULT_IDS = Object.keys(ULTS);
const FAM_LV = [0, 60, 160, 320, 600];
function makeUlt(id) {
  const U = { id, charge: 1, active: null, t: 0, stun: 0, tick: 0 };
  if (id === 'sun') Object.assign(U, { revives: 2, regenT: 0, killN: 0, charge: 1 });
  if (id === 'phantom') Object.assign(U, { famKills: 0, fam: { x: player.x, y: player.y - 14, cd: 1, ph: 0 }, shots: [] });
  if (id === 'star') U.shards = [];
  return U;
}
function ultIcon(id, size = 14) {
  const u = ULTS[id], sp = spr(u.icon, { a: u.col, w: '#ffffff', k: '#160f24' }), [c, x] = makeCanvas(size, size);
  x.drawImage(sp.c, 1, 1); return c;
}
function famLevel() { const U = G.ult; let l = 1; for (let i = 0; i < FAM_LV.length; i++) if (U.famKills >= FAM_LV[i]) l = i + 1; return l; }
const ultDmg = {
  moon: () => 999,
  star: () => 6 * diffMul() + spell.dmg,
  fam: lv => (4 * diffMul() + spell.dmg * .9) * (1 + (lv - 1) * .3),
  demon: () => 666,
};

/* ---- hooks used by the rest of the game ---- */
function ultInvuln() { const U = G.ult; return !!(U && (U.active === 'moon' || U.active === 'demon' || U.active === 'phantom')); }
function ultStunned() { return !!(G.ult && G.ult.stun > 0); }
function ultBlocksFire() { const U = G.ult; return !!(U && (U.active === 'moon' || U.active === 'star' || U.active === 'demon' || U.stun > 0)); }
function ultSpeedMul() { const U = G.ult; if (!U) return 1; return U.active === 'moon' ? .35 : U.active === 'phantom' ? 1.3 : U.active === 'demon' ? 1.15 : 1; }
function ultPlayerLook() {
  const U = G.ult; if (!U) return {};
  if (U.active === 'demon') return { tint: '#3a0f2e', tintA: .6 };
  if (U.active === 'phantom') return { tint: '#a8e8ff', tintA: .55, alpha: .75 + Math.sin(G.t * 8) * .1 };
  return {};
}
function ultOnKill(e) {
  const U = G.ult; if (!U) return;
  if (U.id === 'moon' && !U.active) U.charge = Math.min(1, U.charge + 1 / 45);
  if (U.id === 'sun' && ++U.killN >= 500) { U.killN = 0; if (U.revives < 2) { U.revives++; addText(player.x, player.y - 26, '复活机会 +1', '#ffd166', 1.1); sfx.heart(); } }
  if (U.id === 'phantom' && e.lastSrc === 'fam') { const before = famLevel(); U.famKills++; if (!U.active) U.charge = Math.min(1, U.charge + 1 / 35); if (famLevel() > before) { addText(U.fam.x, U.fam.y - 14, '幽灵 Lv' + famLevel(), '#a8e8ff', 1.2); AU.tone(880, .2, 'triangle', .07, 1320); } }
}
function ultOnDamage(dmg, o) {
  // no great magic charges from damage any more (the star demon has no cooldown)
}
function sunRevive() {
  const U = G.ult; if (!U || U.id !== 'sun' || U.revives <= 0) return false;
  U.revives--; player.hp = Math.min(player.maxHp, 3); player.inv = 2.5; updateHearts(true);
  U.flash = 1; G.hitstop = .15; G.tsTarget = .3; setTimeout(() => { G.tsTarget = 1; }, 900);
  addShake(1, true);
  for (let i = 0; i < 5; i++) fx.push({ k: 'ring', x: player.x, y: player.y, r0: 6, r1: 120 + i * 60, t: -i * .08, max: .7 + i * .1, col: i % 2 ? '#ffffff' : '#ffd166', w: 3 });
  for (let i = 0; i < 70; i++) { const a = rand(TAU), s = rand(80, 260); addPart(player.x, player.y - 8, 6, Math.cos(a) * s, Math.sin(a) * s * .7, rand(20, 120), rand(.5, 1.2), ['#ffffff', '#fff3c4', '#ffd166', '#ff9d3d'], rand(1, 3), { add: true, drag: 1.5 }); }
  for (const b of eprojs) b.dead = true;
  for (const e of enemies) {
    if (e.dead || e.spawnT < 1) continue;
    if (e.elite || e.type === 'boss') damageEnemy(e, e.maxHp * .25, player.x, player.y, { resolve: true, src: 'ult' });
    else killEnemy(e);
  }
  AU.tone(523, 1.2, 'triangle', .14); AU.tone(784, 1.2, 'triangle', .1); AU.tone(1046, 1.4, 'sine', .1); AU.noise(1.2, .2, 8000, 2000, 1);
  say(player, '太阳永不熄灭！', { force: true });
  return true;
}
function ultCancel() {
  const U = G.ult; G.timeStop = 0;
  if (!U) return;
  U.active = null; U.stun = 0; U.draw = null; U.con = null; U.tent = []; U.slash = [];
  if (U.shots) U.shots = [];
  for (const e of enemies) e.pend = 0;
}

/* ---- activation ---- */
function ultActivate() {
  const U = G.ult; if (!U || U.active || U.stun > 0) return;
  if (U.id === 'sun') { addText(player.x, player.y - 26, '太阳之力是被动的', '#ffd166', .9); return; }
  if (U.charge < 1 && U.id !== 'demon') { if (AU.gate('ultno', 300)) AU.tone(180, .1, 'square', .04); return; }
  if (U.id === 'demon' && player.hp <= 1) { addText(player.x, player.y - 26, '至少需要两颗心', '#ff7a93', 1); AU.tone(160, .2, 'square', .05, 100); return; }
  if (U.id !== 'demon') U.charge = 0;
  U.t = 0; U.tick = 0;
  const p = player;
  if (U.id === 'moon') {
    U.active = 'moon'; U.t = 4; U.beamA = p.aim; p.inv = Math.max(p.inv, 4.2);
    fx.push({ k: 'ring', x: p.x, y: p.y, r0: 4, r1: 60, t: 0, max: .5, col: '#c6f6ff', w: 3 });
    AU.tone(220, 4, 'sine', .12, 330); AU.tone(660, 4, 'triangle', .05, 990); AU.noise(4, .08, 3000, 6000, 1);
    say(p, pick(['月光，照亮吧！', '以月之名！']), { force: true });
  }
  if (U.id === 'hollow') {
    U.active = 'hollow'; G.timeStop = 5;
    fx.push({ k: 'ring', x: p.x, y: p.y, r0: 4, r1: 300, t: 0, max: .7, col: '#ffffff', w: 2 });
    AU.noise(.8, .2, 200, 6000, 1); AU.tone(880, .8, 'sine', .1, 110);
    say(p, '时间，停下。', { force: true });
  }
  if (U.id === 'star') {
    U.active = 'star'; U.draw = { t: 10 }; U.con = { stars: [], life: 0, tick: 0 };
    AU.tone(988, .3, 'triangle', .07); AU.tone(1319, .5, 'triangle', .06, null, .1);
    addText(p.x, p.y - 26, '左键放置星星', '#fff27a', 1);
  }
  if (U.id === 'phantom') {
    U.active = 'phantom'; U.t = 12; p.inv = Math.max(p.inv, 12.2); U.tcd = 0; U.wail = 1.2;
    for (let i = 0; i < 30; i++) { const a = rand(TAU); addPart(U.fam.x, U.fam.y, 10, Math.cos(a) * 60, Math.sin(a) * 40, rand(0, 40), .6, ['#ffffff', '#a8e8ff'], 1, { add: true, drag: 3 }); }
    AU.tone(330, 1, 'sine', .1, 990); AU.noise(.8, .06, 4000, 9000, 2);
    say(p, '合体！', { force: true });
  }
  if (U.id === 'demon') {
    p.hp--; updateHearts(true); hudHurt();
    U.active = 'demon'; U.t = 15; U.tcd = 0; U.claw = 0; U.tent = []; U.slash = [];
    for (let i = 0; i < 26; i++) { const a = rand(TAU); addPart(p.x, p.y - 22, 6, Math.cos(a) * 70, Math.sin(a) * 50, rand(20, 60), .7, ['#ff4d6d', '#5a1838', '#160f24'], 2, { g: 120 }); }
    addShake(.5, true); AU.tone(80, 1.2, 'sawtooth', .18, 50); AU.noise(1, .2, 400, 120, .8);
    say(p, '借你一颗心，换你们全部！', { force: true });
  }
}

/* ---- per-frame update (play state) ---- */
function ultUpdate(dt) {
  const U = G.ult; if (!U) return;
  const p = player;
  if (pressed.has('q') && !keyPromptOwns('q')) ultActivate();
  if (U.stun > 0) U.stun -= dt;
  if (U.id === 'hollow' && !U.active) U.charge = Math.min(1, U.charge + dt / 40);
  if (U.chargedFlash === undefined) U.chargedFlash = U.charge >= 1;
  if (U.charge >= 1 && !U.chargedFlash && U.id !== 'sun') { U.chargedFlash = true; AU.tone(784, .15, 'triangle', .07); AU.tone(1175, .3, 'triangle', .06, null, .08); addText(p.x, p.y - 28, ULTS[U.id].name + ' 就绪', ULTS[U.id].col, 1); }
  if (U.charge < 1) U.chargedFlash = false;

  if (U.id === 'sun') {
    U.regenT += dt;
    if (U.regenT >= 30) { U.regenT = 0; if (p.hp < Math.min(p.maxHp, 6) && canHeal()) { p.hp++; updateHearts(true); sfx.heart(); for (let i = 0; i < 10; i++) addPart(p.x, p.y - 6, 6, rand(-40, 40), rand(-30, 30), rand(30, 70), .6, ['#ffffff', '#ffd166', '#ff8aa0'], 1, { add: true, g: 80 }); } }
    U.flash = Math.max(0, (U.flash || 0) - dt * 1.2);
  }
  if (U.id === 'star') {
    for (const s of U.shards) {
      s.t += dt; s.vz -= 300 * dt; s.z += s.vz * dt; if (s.z < 0) { s.z = 0; s.vz *= -.4; }
      s.x += s.vx * dt; s.y += s.vy * dt; s.vx = damp(s.vx, 0, 4, dt); s.vy = damp(s.vy, 0, 4, dt);
      const d = Math.hypot(s.x - p.x, s.y - p.y);
      if (d < 60 && s.t > .3) { const a = Math.atan2(p.y - s.y, p.x - s.x); s.vx = damp(s.vx, Math.cos(a) * 200, 10, dt); s.vy = damp(s.vy, Math.sin(a) * 200, 10, dt); }
      if (d < 8 && s.t > .3) { s.dead = true; if (U.active !== 'star') U.charge = Math.min(1, U.charge + 1 / 14); AU.tone(1500 + Math.random() * 400, .06, 'triangle', .04); }
      if (s.t > 16) s.dead = true;
    }
    U.shards = U.shards.filter(s => !s.dead);
  }
  if (U.id === 'phantom') updateFamiliar(dt);

  // active effects
  if (U.active === 'moon') {
    U.t -= dt;
    U.beamA += clamp(angDiff(U.beamA, p.aim), -1 * dt, 1 * dt);
    U.tick -= dt;
    const [hx, hy] = handPos(U.beamA), seg = [hx, hy - 6, hx + Math.cos(U.beamA) * 900, hy - 6 + Math.sin(U.beamA) * 900];
    if (U.tick <= 0) {
      U.tick = .1;
      for (const e of enemies) if (!e.dead && e.spawnT >= 1 && !e.ghost && segDist(e.x, e.y - 6, seg) < 14 + e.r) damageEnemy(e, ultDmg.moon(), p.x, p.y, { kb: 25, dir: U.beamA, src: 'ult', tcol: '#c6f6ff', quiet: true });
    }
    for (let i = 0; i < 4; i++) { const d = rand(10, 400); addPart(hx + Math.cos(U.beamA) * d, hy - 6 + Math.sin(U.beamA) * d + 6, 6, rand(-30, 30), rand(-30, 30), rand(10, 60), rand(.2, .5), ['#ffffff', '#c6f6ff', '#5fb8ff'], 1, { add: true, drag: 3 }); }
    addShake(.015, true);
    if (U.t <= 0) { U.active = null; U.stun = .5; p.inv = Math.max(p.inv, .6); fx.push({ k: 'ring', x: p.x, y: p.y, r0: 4, r1: 40, t: 0, max: .4, col: '#c6f6ff', w: 2 }); }
  }
  if (U.active === 'hollow' || G.timeStop > 0) {
    for (const b of eprojs) if (!b.rewrite && Math.hypot(b.x - p.x, b.y - 6 - (p.y - 6)) < b.r + p.r + 4) { b.rewrite = true; AU.tone(1800, .05, 'square', .03, 2400); for (let i = 0; i < 4; i++) addPart(b.x, b.y, 6, rand(-30, 30), rand(-30, 30), 0, .3, ['#ffffff', '#8fe6ff'], 1, { add: true }); }
    G.timeStop -= dt;
    if (G.timeStop <= 0) resolveTimeStop();
  }
  if (U.active === 'star' && U.draw) {
    U.draw.t -= dt;
    const S_ = U.con.stars;
    if (pressed.has('lmb') && S_.length < 7) {
      const x = clamp(mouse.wx, 4, arena.w - 4), y = clamp(mouse.wy, 4, arena.h - 4), last = S_[S_.length - 1];
      if (!last || Math.hypot(last.x - x, last.y - y) > 10) {
        S_.push({ x, y, t: 0 }); AU.tone([784, 880, 988, 1175, 1319, 1568, 1760][S_.length - 1], .25, 'triangle', .08); AU.noise(.2, .04, 8000, 4000, 2);
        fx.push({ k: 'ring', x, y, r0: 2, r1: 16, t: 0, max: .3, col: '#fff27a', w: 1 });
      }
    }
    // drawing ends when time runs out, when Q is pressed again, or shortly after the seventh star
    if (S_.length >= 7 && U.draw.endT === undefined) U.draw.endT = .5;
    if (U.draw.endT !== undefined) U.draw.endT -= dt;
    if (U.draw.t <= 0 || (pressed.has('q') && U.draw.t < 9.8) || U.draw.endT <= 0) {
      U.draw = null; U.active = null; U.con.life = 6;
      if (U.con.stars.length >= 2) { AU.tone(1319, .4, 'triangle', .07); AU.tone(1760, .6, 'sine', .05, null, .1); }
    }
  }
  if (U.con && (U.con.life > 0 || U.active === 'star')) {
    if (!U.active) U.con.life -= dt;
    U.con.tick -= dt;
    const segs = starSegs(U.con.stars);
    if (U.con.tick <= 0 && segs.length) {
      U.con.tick = .15;
      for (const e of enemies) { if (e.dead || e.spawnT < 1 || e.ghost) continue; for (const s of segs) if (segDist(e.x, e.y - 4, s) < 3 + e.r) { damageEnemy(e, ultDmg.star(), e.x, e.y - 10, { kb: 0, src: 'ult', tcol: '#fff27a', quiet: true }); if (Math.random() < .5) addPart(e.x, e.y - 4, 4, rand(-40, 40), rand(-40, 40), rand(10, 40), .3, ['#ffffff', '#fff27a'], 1, { add: true }); break; } }
    }
    if (!U.active && U.con.life <= 0) U.con = null;
  }
  if (U.active === 'phantom') {
    U.t -= dt; U.tcd -= dt;
    const lv = famLevel();
    if (U.tcd <= 0) {
      U.tcd = Math.max(.18, .5 - lv * .06);
      const n = 6 + lv * 2, off = G.t * 2;
      for (let i = 0; i < n; i++) famShot(p.x, p.y - 10, off + i / n * TAU, lv, lv >= 3, true);
      AU.tone(500 + lv * 60, .06, 'sine', .03, 900);
    }
    if (lv >= 5) { U.wail -= dt; if (U.wail <= 0) { U.wail = 1.4; fx.push({ k: 'ring', x: p.x, y: p.y, r0: 6, r1: 70, t: 0, max: .4, col: '#a8e8ff', w: 3 }); for (const e of enemies) if (!e.dead && e.spawnT >= 1 && dist(e, p) < 70 + e.r) damageEnemy(e, ultDmg.fam(lv) * 3, p.x, p.y, { kb: 120, dir: angTo(p, e), src: 'fam' }); AU.noise(.4, .12, 900, 300, 1); } }
    if (Math.random() < .6) addPart(p.x + rand(-6, 6), p.y - rand(0, 16), 6, rand(-10, 10), 0, rand(20, 50), .6, ['#ffffff', '#a8e8ff', '#5fb8ff'], 1, { add: true });
    if (U.t <= 0) { U.active = null; p.inv = Math.max(p.inv, .5); U.fam.x = p.x; U.fam.y = p.y - 14; AU.tone(990, .5, 'sine', .07, 330); }
  }
  if (U.active === 'demon') {
    U.t -= dt; U.tcd -= dt; U.claw -= dt; p.inv = Math.max(p.inv, .2);
    if (U.tcd <= 0) {
      U.tcd = .3;
      const near = enemies.filter(e => !e.dead && e.spawnT >= 1 && !e.ghost && dist(e, p) < 95 + e.r).sort((a, b) => dist(a, p) - dist(b, p)).slice(0, 3);
      for (const e of near) { U.tent.push({ tx: e.x, ty: e.y - 6, t: 0, max: .3, seed: rand(TAU) }); damageEnemy(e, ultDmg.demon(), p.x, p.y, { kb: 80, dir: angTo(p, e), src: 'ult', tcol: '#ff7a93' }); }
      if (near.length && AU.gate('tent', 90)) AU.noise(.15, .12, 500, 150, 1);
    }
    if (mouse.down && U.claw <= 0) {
      U.claw = .45; const a = p.aim; U.slash.push({ a, t: 0, max: .25 });
      for (const e of enemies) if (!e.dead && e.spawnT >= 1 && !e.ghost && dist(e, p) < 58 + e.r && Math.abs(angDiff(a, angTo(p, e))) < .95) damageEnemy(e, ultDmg.demon(), p.x, p.y, { kb: 140, dir: a, src: 'ult', crit: true });
      addShake(.12); AU.noise(.18, .18, 1200, 300, 1); AU.tone(140, .15, 'sawtooth', .08, 60);
    }
    for (const x of U.tent) x.t += dt; U.tent = U.tent.filter(x => x.t < x.max);
    for (const x of U.slash) x.t += dt; U.slash = U.slash.filter(x => x.t < x.max);
    if (Math.random() < .8) addPart(p.x + rand(-7, 7), p.y - rand(0, 8), 2, rand(-8, 8), 0, rand(30, 60), rand(.4, .8), ['#ff4d6d', '#9b2f5a', '#2a0a1c'], rand(1, 2), { drag: 1 });
    if (U.t <= 0) { U.active = null; AU.tone(200, .6, 'sawtooth', .06, 400); }
  }
}
function resolveTimeStop() {
  const U = G.ult; G.timeStop = 0; if (U && U.active === 'hollow') U.active = null;
  const p = player;
  // every enemy marked during the stop detonates for 999, on top of the damage it soaked up
  const marked = enemies.filter(e => e.pend > 0 && !e.dead);
  marked.forEach((e, i) => {
    const d = e.pend; e.pend = 0;
    damageEnemy(e, d, p.x, p.y, { resolve: true, kb: 120, dir: angTo(p, e), tcol: '#ffffff', crit: true });
    later(.04 * Math.min(i, 12), () => explode(e.x, e.y, 26, 999, true, ['#ffffff', '#c4b5ff', '#6a3ad6']));
  });
  for (const b of eprojs) if (b.rewrite) { b.vx *= -1.7; b.vy *= -1.7; b.friendly = true; b.life = 3; b.dmg = (6 + spell.dmg * .6) * diffMul(); }
  addShake(.6, true); G.hitstop = .08;
  if (U) U.shatter = 1;
  for (let i = 0; i < 40; i++) { const a = rand(TAU), s = rand(60, 220); addPart(p.x, p.y - 8, 6, Math.cos(a) * s, Math.sin(a) * s * .7, rand(0, 60), rand(.4, .9), ['#ffffff', '#d6d6e8', '#8a8aa8'], rand(1, 3), { drag: 2, g: 100 }); }
  AU.noise(.5, .25, 3000, 600, 1); AU.tone(110, .5, 'sine', .18, 880);
}
function updateFriendlyEproj(b, dt) {
  b.t += dt; b.life -= dt; b.x += b.vx * dt; b.y += b.vy * dt;
  if (b.life <= 0 || b.x < -4 || b.x > arena.w + 4 || b.y < -4 || b.y > arena.h + 4) { b.dead = true; return; }
  for (const e of enemies) if (!e.dead && e.spawnT >= 1 && !e.ghost && Math.hypot(e.x - b.x, e.y - b.y) < e.r + b.r + 1) { damageEnemy(e, b.dmg, b.x, b.y, { kb: 60, dir: Math.atan2(b.vy, b.vx), src: 'ult' }); b.dead = true; sparkBurst(b.x, b.y, ['#ffffff', '#8fe6ff', '#5fb8ff'], 6); return; }
}
function starSegs(S_) {
  const segs = [];
  for (let i = 1; i < S_.length; i++) segs.push([S_[i - 1].x, S_[i - 1].y, S_[i].x, S_[i].y]);
  if (S_.length >= 7) segs.push([S_[6].x, S_[6].y, S_[0].x, S_[0].y]);
  return segs;
}
function famShot(x, y, a, lv, home, fused) {
  const U = G.ult, sp = fused ? 150 : 170;
  U.shots.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: fused ? 1.1 : 1.3, dmg: ultDmg.fam(lv) * (fused ? .8 : 1), home, pierce: lv >= 5 ? 3 : 0, chain: lv >= 4, hit: new Set(), trail: [] });
}
function updateFamiliar(dt) {
  const U = G.ult, f = U.fam, p = player, lv = famLevel();
  f.ph += dt;
  if (U.active !== 'phantom') {
    const tx = p.x + Math.cos(f.ph * 1.6) * 20, ty = p.y - 16 + Math.sin(f.ph * 1.6) * 8;
    f.x = damp(f.x, tx, 6, dt); f.y = damp(f.y, ty, 6, dt);
    f.cd -= dt;
    if (f.cd <= 0 && G.state === 'play') {
      let best = null, bd = 180;
      for (const e of enemies) { if (e.dead || e.spawnT < 1 || e.ghost) continue; const d = Math.hypot(e.x - f.x, e.y - f.y); if (d < bd) { bd = d; best = e; } }
      if (best) {
        f.cd = [.9, .7, .6, .5, .45][lv - 1];
        const a = Math.atan2(best.y - 6 - f.y, best.x - f.x), n = [1, 2, 3, 3, 4][lv - 1];
        for (let i = 0; i < n; i++) famShot(f.x, f.y, a + (i - (n - 1) / 2) * .22, lv, lv >= 3, false);
        if (AU.gate('fam', 80)) AU.tone(1100 + lv * 80, .05, 'sine', .025, 1500);
      }
    }
  }
  for (const s of U.shots) {
    s.life -= dt;
    if (s.home) {
      let best = null, bd = 140;
      for (const e of enemies) { if (e.dead || e.spawnT < 1 || e.ghost || s.hit.has(e)) continue; const d = Math.hypot(e.x - s.x, e.y - s.y); if (d < bd) { bd = d; best = e; } }
      if (best) { const sp = Math.hypot(s.vx, s.vy), a0 = Math.atan2(s.vy, s.vx), a1 = Math.atan2(best.y - 6 - s.y, best.x - s.x), na = a0 + clamp(angDiff(a0, a1), -1, 1) * 7 * dt; s.vx = Math.cos(na) * sp; s.vy = Math.sin(na) * sp; }
    }
    s.trail.push(s.x, s.y); if (s.trail.length > 10) s.trail.splice(0, 2);
    s.x += s.vx * dt; s.y += s.vy * dt;
    for (const e of enemies) {
      if (e.dead || e.spawnT < 1 || e.ghost || s.hit.has(e)) continue;
      if (Math.hypot(e.x - s.x, e.y - 6 - s.y) < e.r + 3) {
        s.hit.add(e); damageEnemy(e, s.dmg, s.x, s.y, { kb: 30, dir: Math.atan2(s.vy, s.vx), src: 'fam', tcol: '#a8e8ff' });
        if (s.chain) chainZap(e, s.dmg * .5, 2, s.hit);
        if (s.pierce-- <= 0) { s.life = 0; break; }
      }
    }
  }
  U.shots = U.shots.filter(s => s.life > 0);
}

/* ---- rendering ---- */
function ultRenderGround() {
  const U = G.ult; if (!U) return;
  if (U.con && U.con.stars.length) {
    const fade = U.active === 'star' ? 1 : clamp(U.con.life / 1.5, 0, 1), segs = starSegs(U.con.stars);
    ctx.globalCompositeOperation = 'lighter';
    for (const s of segs) {
      const L = Math.hypot(s[2] - s[0], s[3] - s[1]);
      ctx.globalAlpha = .35 * fade; ctx.fillStyle = '#ffd166'; pixLine(s[0], s[1], s[2], s[3], 4);
      ctx.globalAlpha = .9 * fade; ctx.fillStyle = '#fff27a'; pixLine(s[0], s[1], s[2], s[3], 2);
      ctx.fillStyle = '#ffffff'; pixLine(s[0], s[1], s[2], s[3], 1);
      for (let k = 0; k < 3; k++) { const q = ((G.t * .8 + k / 3) % 1); ctx.fillRect(Math.round(lerp(s[0], s[2], q)) - 1, Math.round(lerp(s[1], s[3], q)) - 1, 3, 3); }
      ctx.globalAlpha = .25 * fade; const n = Math.ceil(L / 30); for (let k = 0; k <= n; k++) ctx.drawImage(glowTex('#fff27a'), lerp(s[0], s[2], k / n) - 12, lerp(s[1], s[3], k / n) - 12, 24, 24);
    }
    ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
  }
  if (U.active === 'moon') { ctx.globalAlpha = .25; ctx.fillStyle = '#c6f6ff'; const [hx, hy] = handPos(U.beamA); pixLine(hx, hy + 2, hx + Math.cos(U.beamA) * 600, hy + 2 + Math.sin(U.beamA) * 600, 8); ctx.globalAlpha = 1; }
  if (U.active === 'moon') {
    const p = player; ctx.fillStyle = '#c6f6ff';
    for (const [R, sp] of [[20, 1.2], [28, -.8]]) { ctx.globalAlpha = .6; for (let t = 0; t < TAU; t += .05) { const b = t + G.t * sp; if (Math.sin(b * 8) > -.5) ctx.fillRect(Math.round(p.x + Math.cos(b) * R), Math.round(p.y + Math.sin(b) * R * .62), 1, 1); } }
    ctx.globalAlpha = .45; for (let i = 0; i < 6; i++) { const b1 = i / 6 * TAU + G.t, b2 = b1 + TAU / 3; pixLine(p.x + Math.cos(b1) * 20, p.y + Math.sin(b1) * 12.4, p.x + Math.cos(b2) * 20, p.y + Math.sin(b2) * 12.4); }
    ctx.globalAlpha = 1;
  }
}
function ultRenderAir() {
  const U = G.ult; if (!U) return;
  const p = player;
  // sun halo
  if (U.id === 'sun' && !p.dead) {
    ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = .18 + (U.revives ? .1 : 0);
    ctx.save(); ctx.translate(p.x, p.y - 8); ctx.rotate(G.t * .6); ctx.fillStyle = '#ffd166';
    for (let i = 0; i < 8; i++) { ctx.rotate(TAU / 8); ctx.fillRect(10, -1, 6 + Math.sin(G.t * 3 + i) * 2, 2); }
    ctx.restore(); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  }
  // star shards
  if (U.shards) for (const s of U.shards) { const tw = Math.sin(G.t * 10 + s.x) > 0; ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = .6; ctx.drawImage(glowTex('#fff27a'), s.x - 6, s.y - s.z - 10, 12, 12); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; cStar4(ctx, Math.round(s.x), Math.round(s.y - s.z - 4), tw ? 2 : 1, '#fff27a'); }
  // star placement
  if (U.con) for (const s of U.con.stars) { s.t += 1 / 60; const sz = 2 + Math.round(Math.sin(G.t * 6 + s.x) + 1); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = .8; ctx.drawImage(glowTex('#fff27a'), s.x - 12, s.y - 12, 24, 24); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; cStar4(ctx, Math.round(s.x), Math.round(s.y), sz, '#ffffff'); }
  if (U.active === 'star' && U.con) {
    const S_ = U.con.stars, last = S_[S_.length - 1];
    ctx.globalAlpha = .5 + Math.sin(G.t * 8) * .2; cStar4(ctx, Math.round(mouse.wx), Math.round(mouse.wy), 2, '#fff27a');
    if (last) { ctx.globalAlpha = .3; ctx.fillStyle = '#fff27a'; const n = Math.hypot(mouse.wx - last.x, mouse.wy - last.y) / 4; for (let k = 0; k < n; k += 2) ctx.fillRect(Math.round(lerp(last.x, mouse.wx, k / n)), Math.round(lerp(last.y, mouse.wy, k / n)), 1, 1); }
    ctx.globalAlpha = 1;
  }
  // familiar and its shots
  if (U.id === 'phantom') {
    for (const s of U.shots) {
      ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < s.trail.length; i += 2) { ctx.globalAlpha = .5 * i / s.trail.length; ctx.fillStyle = '#a8e8ff'; ctx.fillRect(Math.round(s.trail[i]) - 1, Math.round(s.trail[i + 1]) - 1, 2, 2); }
      ctx.globalAlpha = .6; ctx.drawImage(glowTex('#a8e8ff'), s.x - 7, s.y - 7, 14, 14); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = '#ffffff'; ctx.fillRect(Math.round(s.x) - 1, Math.round(s.y) - 1, 3, 3);
    }
    if (U.active !== 'phantom' && !p.dead) {
      const f = U.fam, lv = famLevel();
      if (!GHOST_SPR) GHOST_SPR = spr(GHOST_ROWS, GHOST_PAL);
      ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = .4 + lv * .06; ctx.drawImage(glowTex(lv >= 4 ? '#c4b5ff' : '#a8e8ff'), f.x - 14, f.y - 18, 28, 28); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
      drawSpr(GHOST_SPR, f.x, f.y, { alpha: .85, sx: .7 + lv * .06, sy: .7 + lv * .06, flip: mouse.wx < f.x, tint: lv >= 4 ? '#c4b5ff' : null, tintA: .4 });
      ctx.fillStyle = '#ffd166'; for (let i = 0; i < lv; i++) ctx.fillRect(Math.round(f.x - lv * 1.5 + i * 3), Math.round(f.y - 15), 2, 2);
    }
  }
  // moonlight: a full moon rises behind the mage and pours a river of light forward
  if (U.active === 'moon') {
    const [hx, hy] = handPos(U.beamA), a = U.beamA, el = 4 - U.t, k = Math.min(1, el / .2) * Math.min(1, U.t / .3);
    const w = (14 + Math.sin(G.t * 40) * 2) * k, mx = p.x - Math.cos(a) * 14, my = p.y - 44 + Math.sin(G.t * 2) * 2;
    ctx.globalCompositeOperation = 'lighter'; ctx.imageSmoothingEnabled = true;
    ctx.globalAlpha = .7 * k; ctx.drawImage(glowTex('#c6f6ff'), mx - 50, my - 50, 100, 100);
    ctx.globalAlpha = .35 * k; ctx.drawImage(glowTex('#5fb8ff'), hx - 70, hy - 76, 140, 140);
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = '#c6f6ff';
    for (const [r, sp] of [[21, 1], [27, -.7]]) { ctx.globalAlpha = .55 * k; for (let t = 0; t < TAU; t += .09) { const b = t + G.t * sp; if (Math.sin(b * 6) > -.3) ctx.fillRect(Math.round(mx + Math.cos(b) * r), Math.round(my + Math.sin(b) * r), 1, 1); } }
    ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = k;
    ctx.fillStyle = '#8fb8d8'; pixDisc(mx, my, 15, 1);
    ctx.fillStyle = '#e8f6ff'; pixDisc(mx - 1, my - 1, 14, 1);
    ctx.fillStyle = '#ffffff'; pixDisc(mx - 5, my - 5, 6, 1);
    ctx.fillStyle = '#b8d8f0'; pixDisc(mx - 4, my + 3, 3, 1); pixDisc(mx + 5, my - 4, 2, 1); pixDisc(mx + 3, my + 7, 2, 1); pixDisc(mx + 8, my + 2, 1.5, 1);
    ctx.globalAlpha = 1;
    ctx.save(); ctx.translate(hx, hy - 6); ctx.rotate(a);
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = .16 * k; ctx.fillStyle = '#3a7fd0'; ctx.fillRect(0, -w * 2.4, 900, w * 4.8);
    ctx.globalAlpha = .35 * k; ctx.fillStyle = '#5fb8ff'; ctx.fillRect(0, -w * 1.4, 900, w * 2.8);
    ctx.globalAlpha = .9 * k; ctx.fillStyle = '#9fd8ff'; ctx.fillRect(0, -w, 900, w * 2);
    ctx.fillStyle = '#e8f6ff'; ctx.fillRect(0, -w * .55, 900, w * 1.1);
    ctx.fillStyle = '#ffffff'; ctx.fillRect(0, -w * .22, 900, w * .44);
    // flickering edges
    ctx.globalAlpha = .8 * k; for (let d = 0; d < 900; d += 6) if (Math.sin(d * .3 + G.t * 50) > .2) { ctx.fillRect(d, -w * 1.05, 4, 1); ctx.fillRect(d + 3, w * 1.05, 4, 1); }
    // shockwave rings racing down the beam
    for (let n = 0; n < 9; n++) {
      const d = (G.t * 480 + n * 100) % 900, ry = w * (1.5 + (d / 900) * .8), rx = w * .35;
      ctx.globalAlpha = .75 * k * (1 - d / 900); ctx.fillStyle = n % 2 ? '#ffffff' : '#c6f6ff';
      for (let t = 0; t < TAU; t += .16) ctx.fillRect(Math.round(d + Math.cos(t) * rx), Math.round(Math.sin(t) * ry), 2, 2);
    }
    // little crescents drifting along the light
    ctx.globalAlpha = .9 * k; ctx.fillStyle = '#ffffff';
    for (let n = 0; n < 16; n++) { const d = (G.t * 260 + n * 57) % 900, o = Math.sin(n * 2.3 + G.t * 3) * w * .8; ctx.fillRect(d, o, 3, 1); ctx.fillRect(d - 1, o + 1, 1, 2); ctx.fillRect(d, o + 3, 3, 1); }
    ctx.restore(); ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
    ctx.fillStyle = '#ffffff'; pixDisc(hx, hy - 6, 7 * k + Math.sin(G.t * 30), 1);
    // moon dust falling around the caster
    if (Math.random() < .9) addPart(p.x + rand(-60, 60), p.y + rand(-30, 30), rand(40, 80), rand(-6, 6), rand(-4, 4), -rand(20, 50), rand(.6, 1.2), ['#ffffff', '#c6f6ff', '#5fb8ff'], 1, { add: true });
  }
  // the hollow marks every enemy you hit while time stands still
  if (G.timeStop > 0) for (const e of enemies) {
    if (!(e.pend > 0) || e.dead) continue;
    const y = e.y - e.z - e.h - 6, r = 5 + Math.sin(G.t * 8) * 1;
    ctx.fillStyle = '#0b0614'; ctx.fillRect(Math.round(e.x - r - 1), Math.round(y - 1), 3, 3); ctx.fillRect(Math.round(e.x + r - 1), Math.round(y - 1), 3, 3); ctx.fillRect(Math.round(e.x - 1), Math.round(y - r - 1), 3, 3); ctx.fillRect(Math.round(e.x - 1), Math.round(y + r - 1), 3, 3);
    ctx.fillStyle = '#c084ff'; ctx.fillRect(Math.round(e.x - r), Math.round(y), 1, 1); ctx.fillRect(Math.round(e.x + r), Math.round(y), 1, 1); ctx.fillRect(Math.round(e.x), Math.round(y - r), 1, 1); ctx.fillRect(Math.round(e.x), Math.round(y + r), 1, 1);
    ctx.fillStyle = '#ffffff'; ctx.fillRect(Math.round(e.x), Math.round(y), 1, 1);
  }
  // star demon: horns, eyes, tentacles, claw slashes
  if (U.active === 'demon' && !p.dead) {
    ctx.fillStyle = '#160f24'; ctx.fillRect(Math.round(p.x - 6), Math.round(p.y - 22), 2, 4); ctx.fillRect(Math.round(p.x + 4), Math.round(p.y - 22), 2, 4);
    ctx.fillStyle = '#ff4d6d'; ctx.fillRect(Math.round(p.x - 5), Math.round(p.y - 24), 1, 3); ctx.fillRect(Math.round(p.x + 4), Math.round(p.y - 24), 1, 3);
    ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = .5 + Math.sin(G.t * 10) * .2; ctx.drawImage(glowTex('#ff4d6d'), p.x - 20, p.y - 30, 40, 40); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
    for (const x of U.tent) {
      const q = x.t / x.max, reach = q < .5 ? easeOutCubic(q * 2) : 1, fade = q > .6 ? 1 - (q - .6) / .4 : 1;
      const sx = p.x, sy = p.y - 8, n = 12;
      ctx.globalAlpha = fade;
      for (let i = 0; i <= n * reach; i++) {
        const s = i / n, w = Math.sin(s * Math.PI) * 10 * Math.sin(x.seed + G.t * 12);
        const nx = -(x.ty - sy), ny = x.tx - sx, nl = Math.hypot(nx, ny) || 1;
        const px = lerp(sx, x.tx, s) + nx / nl * w, py = lerp(sy, x.ty, s) + ny / nl * w, sz = Math.max(1, 4 - s * 3);
        ctx.fillStyle = '#160f24'; ctx.fillRect(Math.round(px - sz / 2 - 1), Math.round(py - sz / 2 - 1), Math.ceil(sz) + 2, Math.ceil(sz) + 2);
        ctx.fillStyle = s > .85 ? '#ff4d6d' : '#5a1838'; ctx.fillRect(Math.round(px - sz / 2), Math.round(py - sz / 2), Math.ceil(sz), Math.ceil(sz));
      }
      ctx.globalAlpha = 1;
    }
    for (const s of U.slash) {
      const q = s.t / s.max; ctx.globalAlpha = 1 - q;
      for (let k = 0; k < 3; k++) {
        const R = 30 + k * 9 + q * 10; ctx.fillStyle = k === 1 ? '#ffffff' : '#ff4d6d';
        for (let b = -.95; b <= .95; b += .06) ctx.fillRect(Math.round(p.x + Math.cos(s.a + b) * R), Math.round(p.y - 8 + Math.sin(s.a + b) * R * .8), 2, 2);
      }
      ctx.globalAlpha = 1;
    }
  }
}
function ultRenderScreen(camX, camY, ox, oy) {
  const U = G.ult;
  if (G.timeStop > 0 || (U && U.shatter > 0)) {
    if (G.timeStop > 0) {
      const k = Math.min(1, (5 - G.timeStop) / .25);
      ctx.globalAlpha = k; ctx.globalCompositeOperation = 'saturation'; ctx.fillStyle = 'hsl(0,0%,50%)'; ctx.fillRect(0, 0, W, H);
      ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = .12 * k; ctx.fillStyle = '#6a5acd'; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1;
      ctx.setTransform(S, 0, 0, S, ox, oy); if (!player.dead) drawPlayer(); ctx.setTransform(1, 0, 0, 1, 0, 0);
      // clock face
      const cx = W / 2, cy = H / 2, R = Math.min(W, H) * .32, u = Math.max(2, Math.round(S * .8));
      ctx.globalAlpha = .18 * k; ctx.fillStyle = '#ffffff';
      for (let a = 0; a < TAU; a += .02) ctx.fillRect(Math.round(cx + Math.cos(a) * R), Math.round(cy + Math.sin(a) * R), u, u);
      for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; for (let r = R * .86; r < R * .96; r += u) ctx.fillRect(Math.round(cx + Math.cos(a) * r), Math.round(cy + Math.sin(a) * r), u, u); }
      const hand = (5 - G.timeStop) / 5 * TAU - Math.PI / 2;
      for (let r = 0; r < R * .8; r += u) ctx.fillRect(Math.round(cx + Math.cos(hand) * r), Math.round(cy + Math.sin(hand) * r), u, u);
      ctx.globalAlpha = 1;
      // accumulated damage waits above each enemy
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = `${Math.round(4 * S)}px "Press Start 2P", monospace`;
      for (const e of enemies) if (e.pend > 0) { const x = (e.x - camX) * S, y = (e.y - e.z - e.h - 10 - camY) * S; ctx.fillStyle = '#160f24'; ctx.fillText(Math.round(e.pend), x + 2, y + 2); ctx.fillStyle = '#e8e8ff'; ctx.fillText(Math.round(e.pend), x, y); }
    }
    if (U && U.shatter > 0) { U.shatter -= 1 / 30; ctx.globalAlpha = Math.max(0, U.shatter) * .5; ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1; }
  }
  if (!U) return;
  if (U.active === 'star') { ctx.globalAlpha = .18; ctx.fillStyle = '#1a1850'; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = .5; ctx.fillStyle = '#ffffff'; for (let i = 0; i < 40; i++) if (Math.sin(G.t * 3 + i * 7) > 0) ctx.fillRect((i * 997) % W, (i * 613) % H, 2, 2); ctx.globalAlpha = 1; }
  if (U.active === 'moon' && U.t > 3.75) { ctx.globalAlpha = (U.t - 3.75) / .25 * .7; ctx.fillStyle = '#e8f6ff'; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1; }
  if (U.active === 'demon' || U.active === 'phantom' || U.active === 'moon') {
    const col = U.active === 'demon' ? '150,20,60' : U.active === 'phantom' ? '90,160,220' : '120,180,255';
    const g = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * .3, W / 2, H / 2, Math.max(W, H) * .7);
    g.addColorStop(0, `rgba(${col},0)`); g.addColorStop(1, `rgba(${col},${.35 + Math.sin(G.t * 4) * .08})`);
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  }
  if (U.id === 'sun' && U.flash > 0) { ctx.globalAlpha = Math.min(1, U.flash); ctx.fillStyle = U.flash > .6 ? '#ffffff' : '#ffe9a8'; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1; }
}

/* ---- HUD slot ---- */
function ultHUD() {
  const el = $('slot-ult'), U = G.ult;
  if (!U) { el.hidden = true; return; }
  if (el.hidden || hudCache.ultId !== U.id) {
    el.hidden = false; hudCache.ultId = U.id;
    const c = el.querySelector('.ico').getContext('2d'); c.imageSmoothingEnabled = false; c.clearRect(0, 0, 14, 14); c.drawImage(ultIcon(U.id), 0, 0);
    setStyle(el, '--c', ULTS[U.id].col);
  }
  let label = ULTS[U.id].name, p = U.charge, ready = U.charge >= 1 && !U.active;
  if (U.id === 'demon') { p = 1; ready = player.hp >= 2 && !U.active; }
  if (U.id === 'sun') { p = U.regenT / 30; ready = U.revives > 0; label = '太阳'; }
  if (U.id === 'phantom') label = `幽灵 Lv${famLevel()}`;
  if (U.active) { const dur = { moon: 4, phantom: 12, demon: 15 }[U.active]; p = U.active === 'hollow' ? G.timeStop / 5 : U.active === 'star' ? (U.draw ? U.draw.t / 10 : 0) : U.t / dur; label = ULTS[U.id].name + ' 发动中'; }
  setText('ult-name', label);
  setSlot('slot-ult', clamp(p, 0, 1), ready);
  el.classList.toggle('active', !!U.active);
  const pk = U.id === 'sun' ? 'sun' + U.revives : '';
  if (hudCache.ultPips !== pk) { hudCache.ultPips = pk; $('ult-pips').innerHTML = U.id === 'sun' ? Array.from({ length: 2 }, (_, k) => `<i class="${k < U.revives ? 'on' : ''}"></i>`).join('') : ''; }
}

/* ---- the six-card picker ---- */
function dealUltCards() {
  const ids = pickMode === 'ult1' ? [G.pendingUlt] : ULT_IDS;
  pickChoices = ids.map(id => ({ ult: id })); pickLock = false;
  const box = $('cards'); box.innerHTML = ''; box.scrollTop = 0;
  ids.forEach((id, i) => {
    const u = ULTS[id], b = document.createElement('button');
    b.className = 'card form ult';
    b.innerHTML = `<span class="key">${i + 1}</span><span class="rar">GREAT MAGIC</span>`;
    b.appendChild(ultIcon(id));
    b.insertAdjacentHTML('beforeend', `<h3>${u.name}</h3><p>${u.desc}</p><small class="fnote">${u.charge}</small>`);
    b.addEventListener('mouseenter', () => { if (b.classList.contains('in')) sfx.hover(); });
    b.addEventListener('click', () => choose(i));
    box.appendChild(b);
    setTimeout(() => { b.classList.add('in'); AU.tone(440 + i * 110, .15, 'triangle', .06); }, 300 + i * 110);
  });
}
function chooseUlt(i) {
  const c = pickChoices[i]; if (!c || pickLock) return;
  const id = c.ult, star = pickMode === 'ult1';
  pickLock = true;
  G.ult = makeUlt(id); G.pendingUlt = null;
  sfx.pick(); AU.tone(392, 1, 'sine', .1); AU.tone(587, 1, 'sine', .08); AU.tone(784, 1.2, 'sine', .07);
  [...$('cards').children].forEach((el, k) => el.classList.add(k === i ? 'picked' : 'out'));
  setTimeout(() => {
    hideScreen('pick');
    if (star) { setTimeout(() => openPick(), 500); return; }
    resetForEndless();
    G.pendingToast = ['深渊抽走了你所有的符文', `但「${ULTS[id].name}」与你同在，并且已经充满能量。按 Q 释放，通关仍能获得新的符文。`];
    transition(() => startEndless(1));
  }, 800);
}
// HUD slot markup is injected once
(() => {
  const s = document.createElement('div');
  s.className = 'slot form ult'; s.id = 'slot-ult'; s.hidden = true;
  s.innerHTML = '<canvas class="ico" width="14" height="14"></canvas><span class="slot-name" id="ult-name"></span><i class="sweep"></i><b class="key">Q</b><span class="pips" id="ult-pips"></span>';
  document.querySelector('.skills').appendChild(s);
})();
