
/* ================= weapon form evolution ================= */
// Every form levels up twice, then branches: A sharpens the way it already deals damage, B rewrites how it attacks.
const EVO = {
  laser: {
    l1: { name: '聚能', desc: () => `射线伤害 ${E('×2')}` },
    l2: { name: '扩束', desc: () => `射线宽度 ${E('×2')}` },
    A: { name: '极光聚能', desc: () => `蓄力上限延长到 ${E('5 秒')}，满蓄力伤害从 1200% 提升到 ${E('3000%')}；按住蓄力的前 ${E('4 秒')}无敌` },
    B: { name: '恒星引擎', desc: () => `射线${E('自动蓄力')}，蓄满后自动朝光标发射，无需按键（按左键可提前发射）；蓄力时${E('移速不再降低')}` },
  },
  minigun: {
    l1: { name: '星屑淬炼', desc: () => `单发伤害 50% → ${E('80%')}` },
    l2: { name: '高速轴承', desc: () => `预热速度 ${E('×2')}，满转速射速 ×1.7 → ${E('×2.2')}` },
    A: { name: '银河洪流', desc: () => `满转速射速再提高到 ${E('×2.7')}；转速越高散布越窄，满转速时每颗星屑额外${E('贯穿 2 个敌人')}` },
    B: { name: '星屑漩涡', desc: () => `不再向前射击：${E('无需按键')}，始终满转速，自动向${E('四周旋转喷射')}星屑，弹体数越多旋臂越多` },
  },
  shotgun: {
    l1: { name: '重型弹丸', desc: () => `弹丸伤害 ${E('+50%')}` },
    l2: { name: '加长枪膛', desc: () => `射程 ${E('+50%')}，弹丸数 ${E('×1.4')}` },
    A: { name: '超新星霰弹', desc: () => `弹丸离你越近伤害越高，贴脸最高 ${E('×2.5')}；射速 ${E('+30%')}` },
    B: { name: '星爆冲击波', desc: () => `不再发射弹丸：向前方扇形释放${E('冲击波')}，瞬间命中范围内所有敌人（每个受到 弹体数 ×200% 伤害），强力击退并${E('抹除扇形内的敌方子弹')}` },
  },
  boomer: {
    l1: { name: '锋刃', desc: () => `月刃伤害 150% → ${E('225%')}，体积 ${E('+30%')}` },
    l2: { name: '回旋斩', desc: () => `月刃${E('返程时伤害翻倍')}` },
    A: { name: '满月轮舞', desc: () => `月刃回到手中后会${E('再掷出一次')}，第二轮体积与伤害 ${E('+30%')}` },
    B: { name: '月轮护卫', desc: () => `月刃不再投掷，而是${E('常驻环绕')}在身边（数量 = 弹体数 + 2），接触敌人持续切割；${E('按住左键月轮向外扩张')}，松开收回` },
  },
  sing: {
    l1: { name: '深渊引力', desc: () => `吸附范围 ${E('+40%')}` },
    l2: { name: '坍缩', desc: () => `消散爆炸伤害 ${E('×1.6')}` },
    A: { name: '吞噬奇点', desc: () => `奇点存在时间 ${E('+50%')}；范围内每死去一个敌人，奇点体积与爆炸伤害 ${E('+8%')}（最高 +200%）` },
    B: { name: '事件视界', desc: () => `${E('按住左键')}凝聚一个跟随光标移动的奇点，持续吸附撕裂；${E('松开时坍缩爆炸')}，按住越久爆炸越强（最高 ×5），6 秒后自动坍缩` },
  },
  meteor: {
    l1: { name: '巨陨', desc: () => `陨石爆炸范围 ${E('+30%')}` },
    l2: { name: '熔岩', desc: () => `陨石落点留下${E('熔岩')}，2 秒内持续灼烧踩上去的敌人` },
    A: { name: '流星雨', desc: () => `每第 ${E('3')} 次施法变为流星雨：在光标周围额外落下 ${E('8 颗')}小陨石（每颗 60% 伤害）` },
    B: { name: '星辰天罚', desc: () => `${E('无需瞄准、无需按键')}：陨石自动砸向你身边的敌人（优先精英与首领），射速 ${E('+25%')}` },
  },
  wing: {
    l1: { name: '丰羽', desc: () => `冲刺时每侧星弹 5 → ${E('8')} 颗` },
    l2: { name: '疾风', desc: () => `冲刺冷却再 ${E('−30%')}` },
    A: { name: '流星翼', desc: () => `冲刺距离 ${E('+40%')}，冲刺路径上撞到的敌人受到 ${E('300%')} 伤害并被击飞` },
    B: { name: '星翼残影', desc: () => `每次冲刺在起点留下一道${E('残影炮台')}，存在 3 秒，自动朝附近敌人连射星弹（继承全部符文）` },
  },
  ray: {
    l1: { name: '炽光', desc: () => `射线伤害 60% → ${E('90%')}` },
    l2: { name: '长虹', desc: () => `每道射线多贯穿 ${E('2')} 个敌人，射程 ${E('+30%')}` },
    A: { name: '光蚀聚焦', desc: () => `连续命中同一个敌人时伤害递增，每次 ${E('+15%')}，最高 ${E('+150%')}（1 秒没命中则重置）` },
    B: { name: '棱镜折射', desc: () => `射线击中最后一个敌人后${E('折射成 2 道')}，弹向附近的其他敌人（70% 伤害），每道还能${E('再折射一次')}` },
  },
};
function evoLv(f) { return spell.form === f ? spell.formLv || 0 : 0; }
function evoBr(f, b) { return spell.form === f && spell.formBr === b; }
function evoInfo(k) { return spell.form && EVO[spell.form] ? EVO[spell.form][k] : null; }
const EVO_ROMAN = ['', 'I', 'II', 'III'];
function evoCard(id, k, lv, req, apply) {
  return { id, kind: 'evo', max: 1, w: k === 'B' ? 0 : 15, req,
    get name() { const i = evoInfo(k); return i ? `${FORMS[spell.form].name} · ${i.name}` : '形态进化'; },
    desc: () => { const i = evoInfo(k); return i ? i.desc() : ''; },
    evoLabel: `进化 ${EVO_ROMAN[lv]}${k === 'A' ? ' · 分支一' : k === 'B' ? ' · 分支二' : ''}`, apply };
}
UPGRADES.push(
  evoCard('evo1', 'l1', 1, () => spell.form && (spell.formLv || 0) === 0, () => { if (spell.form) spell.formLv = Math.max(spell.formLv || 0, 1); }),
  evoCard('evo2', 'l2', 2, () => spell.form && spell.formLv === 1, () => { if (spell.form) { spell.formLv = Math.max(spell.formLv || 0, 2); if (spell.form === 'wing') player.dashCdMax *= .7; } }),
  evoCard('evoA', 'A', 3, () => spell.form && spell.formLv === 2, () => { if (spell.form) { spell.formLv = 3; spell.formBr = 'A'; } }),
  evoCard('evoB', 'B', 3, () => spell.form && spell.formLv === 2, () => { if (spell.form) { spell.formLv = 3; spell.formBr = 'B'; } }),
);
RAR.evo = { label: 'EVOLVE', col: '#ff7a3d', m: 1 };

/* ---------- hit / damage modifiers used by the core combat code ---------- */
function evoHitMul(p) {
  let m = 1;
  if (p.boomer && p.back && evoLv('boomer') >= 2) m *= 2;
  if (p.pb) m *= lerp(2.5, 1, clamp(p.t / (p.life0 * .7), 0, 1));
  return m;
}
function rayFocus(e) {
  if (!evoBr('ray', 'A')) return 1;
  if (G.t - (e.focusT || -9) > 1) e.focus = 0;
  e.focusT = G.t; e.focus = (e.focus || 0) + 1;
  return 1 + Math.min(1.5, .15 * (e.focus - 1));
}
// 棱镜折射: the ray bends from its last target to the nearest fresh enemies
function rayRefract(from, dmg, hitSet, depth) {
  const cols = ELEM[elemOf()], near = enemies.filter(e => !e.dead && e.spawnT >= 1 && !e.ghost && !hitSet.has(e) && dist(e, from) < 130).sort((a, b) => dist(a, from) - dist(b, from)).slice(0, 2);
  for (const e of near) {
    hitSet.add(e);
    const a = angTo(from, e);
    hitEnemy(e, { x: e.x - Math.cos(a) * 6, y: e.y - Math.sin(a) * 6, vx: Math.cos(a) * 300, vy: Math.sin(a) * 300, dmg, elem: elemOf(), gen: 1, hit: hitSet, kb: .6 });
    fx.push({ k: 'beam', segs: [[from.x, from.y - 6, e.x, e.y - 6]], w: .9, t: 0, max: .12, cols });
    if (depth > 1) rayRefract(e, dmg, hitSet, depth - 1);
  }
}
function singBoomMul(p) {
  let m = evoLv('sing') >= 2 ? 1.6 : 1;
  m *= 1 + Math.min(2, (p.feed || 0) * .08);
  if (p.held) m *= 1 + Math.min(4, (p.holdT || 0) * .8);
  return m;
}
function evoOnKill(e) {
  if (!evoBr('sing', 'A')) return;
  for (const p of projs) if (p.sing && !p.dead && Math.hypot(e.x - p.x, e.y - p.y) < 26 * spell.size * (1 + Math.min(2, (p.feed || 0) * .08)) * 1.4) {
    p.feed = (p.feed || 0) + 1;
    for (let i = 0; i < 4; i++) addPart(e.x, e.y - 4, 4, (p.x - e.x) * 3, (p.y - e.y) * 3, 10, .3, ['#ffffff', '#b58cff'], 1, { add: true });
  }
}

/* ---------- forms that take over the primary attack ---------- */
const EV = { blades: [], bladeR: 24, turrets: [], waves: [], held: null, meteorN: 0, spiralA: 0 };
function evoReset() { EV.blades = []; EV.bladeR = 24; EV.turrets = []; EV.waves = []; EV.held = null; EV.spiralA = 0; }
// returns true when an evolved form handles the primary attack itself this frame
function evoPrimary(dt, canFire) {
  const p = player;
  if (evoBr('minigun', 'B')) {
    p.spin = 1;
    if (canFire && p.fireCd <= 0) {
      const n = Math.max(2, spell.count), dmg = evoLv('minigun') >= 1 ? .8 : .5;
      EV.spiralA += .37 + Math.hypot(p.vx, p.vy) / 800;
      for (let i = 0; i < n; i++) spawnProj(p.x, p.y - 4, EV.spiralA + i / n * TAU, { dmgMul: dmg * .75, sizeMul: .75, spdMul: 1.1 });
      afterCast();
      if (AU.gate('spiral', 60)) sfx.shoot();
      p.fireCd += 1 / fireRate(); if (p.fireCd < 0) p.fireCd = 0;
    }
    return true;
  }
  if (evoBr('boomer', 'B')) {
    const want = canFire && mouse.down ? 78 : 26;
    EV.bladeR = damp(EV.bladeR, want, canFire && mouse.down ? 3 : 6, dt);
    return true;
  }
  if (evoBr('sing', 'B')) {
    if (canFire && mouse.down) {
      if (!EV.held || EV.held.dead) {
        const [hx, hy] = handPos(p.aim);
        spawnProj(hx, hy, p.aim, { dmgMul: .6, sizeMul: 2.2, spdMul: .2, lifeMul: 99, sing: true, held: true });
        EV.held = projs[projs.length - 1]; if (EV.held) EV.held.holdT = 0;
        afterCast(); AU.tone(220, .5, 'sine', .08, 110);
      }
      EV.held.holdT += dt;
      if (EV.held.holdT >= 6) { EV.held.held = false; EV.held.life = 0; EV.held = null; }
    } else if (EV.held) {
      if (!EV.held.dead) EV.held.life = 0;
      EV.held = null;
    }
    return true;
  }
  if (evoBr('meteor', 'B')) {
    if (canFire && p.fireCd <= 0) {
      const live = enemies.filter(e => !e.dead && e.spawnT >= 1 && !e.ghost && dist(e, p) < 280);
      if (live.length) {
        const pri = live.filter(e => e.type === 'boss' || e.elite);
        const t = (pri.length ? pri : live).sort((a, b) => dist(a, p) - dist(b, p))[0];
        castMeteor(1, t.x, t.y); afterCast();
        p.fireCd += 1 / fireRate(); if (p.fireCd < 0) p.fireCd = 0;
      }
    }
    return true;
  }
  return false;
}

/* 星爆冲击波: an instant cone that hits everything in front and erases bullets */
function castWave(a, mul) {
  const p = player, R = 95 * (evoLv('shotgun') >= 2 ? 1.5 : 1) * Math.sqrt(spell.speed / 230), half = .87;
  const dmg = spell.dmg * 2 * spell.count * mul * (evoLv('shotgun') >= 1 ? 1.5 : 1) * slowBonus(), hs = new Set();
  for (const e of enemies) {
    if (e.dead || e.spawnT < 1 || e.ghost) continue;
    const d = dist(e, p); if (d > R + e.r) continue;
    const da = Math.abs(angDiff(a, angTo(p, e))); if (da > half && d > e.r + 6) continue;
    hs.add(e);
    hitEnemy(e, { x: p.x, y: p.y, vx: e.x - p.x || 1, vy: e.y - p.y, dmg, elem: elemOf(), gen: 0, hit: hs, kb: 4 });
  }
  for (const b of eprojs) {
    if (b.friendly || b.dead) continue;
    const d = Math.hypot(b.x - p.x, b.y - p.y);
    if (d < R && Math.abs(angDiff(a, Math.atan2(b.y - p.y, b.x - p.x))) < half) { b.dead = true; addPart(b.x, b.y, 6, 0, 0, 20, .3, ['#ffffff', '#ffd166'], 1, { add: true }); }
  }
  EV.waves.push({ x: p.x, y: p.y - 4, a, R, half, t: 0, max: .32 });
  p.vx -= Math.cos(a) * 60; p.vy -= Math.sin(a) * 60;
  addShake(.25); cam.kx -= Math.cos(a) * 5; cam.ky -= Math.sin(a) * 5;
  AU.noise(.3, .25, 1200, 200, 1); AU.tone(120, .25, 'square', .1, 50);
}

/* 流星雨 and the lava pools */
function meteorShower() {
  for (let i = 0; i < 8; i++) {
    const off = rand(TAU), r = rand(18, 70);
    meteors.push({ x: clamp(mouse.wx + Math.cos(off) * r, 6, arena.w - 6), y: clamp(mouse.wy + Math.sin(off) * r * .7, 6, arena.h - 6), t: -.15 - i * .06, max: .4, R: 16 * Math.sqrt(spell.size), dmg: spell.dmg * 2.4 * slowBonus(), el: elemOf(), bounces: 0, small: true });
  }
  AU.tone(1500, .4, 'sine', .05, 400);
}
function meteorLava(m) {
  const n = 6;
  for (let i = 0; i < n; i++) { const a = i / n * TAU + rand(.3), r = m.R * rand(.15, .55); flames.push({ x: m.x + Math.cos(a) * r, y: m.y + Math.sin(a) * r * .62, t: 0, max: 2, hit: new Map(), lava: true }); }
  flames.push({ x: m.x, y: m.y, t: 0, max: 2, hit: new Map(), lava: true });
}

/* dash hooks: 流星翼 contact damage, 星翼残影 turrets */
function evoOnDash() {
  player.dashHit = new Set();
  if (evoBr('wing', 'B')) EV.turrets.push({ x: player.x, y: player.y, t: 0, max: 3, cd: .15 });
}

function updateEvo(dt) {
  const p = player;
  if (!spell.form) { if (EV.blades.length || EV.turrets.length) evoReset(); return; }
  // 流星翼
  if (evoBr('wing', 'A') && p.dashT > 0 && p.dashHit) {
    for (const e of enemies) {
      if (e.dead || e.spawnT < 1 || e.ghost || p.dashHit.has(e) || dist(e, p) > e.r + 9) continue;
      p.dashHit.add(e);
      damageEnemy(e, spell.dmg * 3 * slowBonus(), p.x, p.y, { kb: 220, dir: angTo(p, e), crit: true });
      sparkBurst(e.x, e.y - 4, ['#ffffff', '#ff9ec7', '#c94f8a'], 8);
    }
  }
  // 星翼残影
  for (const t of EV.turrets) {
    t.t += dt; t.cd -= dt;
    if (t.cd <= 0) {
      let best = null, bd = 210;
      for (const e of enemies) { if (e.dead || e.spawnT < 1 || e.ghost) continue; const d = Math.hypot(e.x - t.x, e.y - t.y); if (d < bd) { bd = d; best = e; } }
      if (best) { t.cd = .2; const a = Math.atan2(best.y - t.y, best.x - t.x); for (let i = 0; i < spell.count; i++) spawnProj(t.x, t.y - 6, a + (spell.count > 1 ? (i / (spell.count - 1) - .5) * .4 : 0), { dmgMul: .8 }); if (AU.gate('turret', 70)) AU.tone(1300, .04, 'triangle', .03, 1700); }
      else t.cd = .1;
    }
  }
  EV.turrets = EV.turrets.filter(t => t.t < t.max);
  // 月轮护卫
  if (evoBr('boomer', 'B')) {
    const n = spell.count + 2, spd = 2.6 + spell.rate * .25, dmg = spell.dmg * (evoLv('boomer') >= 1 ? 2.25 : 1.5) * slowBonus();
    while (EV.blades.length < n) EV.blades.push({ a: 0, x: p.x, y: p.y });
    EV.blades.length = n;
    const base = (EV.bladeA = (EV.bladeA || 0) + dt * spd);
    const r = EV.bladeR * Math.sqrt(spell.size), br = 5 * Math.sqrt(spell.size) * (evoLv('boomer') >= 1 ? 1.3 : 1);
    EV.blades.forEach((b, i) => {
      b.a = base + i / n * TAU; b.x = p.x + Math.cos(b.a) * r; b.y = p.y - 4 + Math.sin(b.a) * r * .75;
      for (const e of enemies) {
        if (e.dead || e.spawnT < 1 || e.ghost) continue;
        if (Math.hypot(e.x - b.x, e.y - 4 - b.y) > e.r + br) continue;
        if (G.t < (e.bladeT || 0)) continue;
        e.bladeT = G.t + .2;
        hitEnemy(e, { x: b.x, y: b.y, vx: Math.cos(b.a + Math.PI / 2), vy: Math.sin(b.a + Math.PI / 2), dmg, elem: elemOf(), gen: 0, hit: new Set([e]), kb: .5 }, { chainChance: .25 });
        if (AU.gate('blade', 45)) AU.tone(rand(1700, 2000), .03, 'square', .025);
      }
    });
  } else if (EV.blades.length) EV.blades = [];
  for (const w of EV.waves) w.t += dt;
  EV.waves = EV.waves.filter(w => w.t < w.max);
}

/* held singularity follows the cursor */
function evoHeldSing(p, dt) {
  const dx = mouse.wx - p.x, dy = mouse.wy - p.y, d = Math.hypot(dx, dy) || 1, sp = Math.min(d * 4, 150);
  p.vx = damp(p.vx, dx / d * sp, 6, dt); p.vy = damp(p.vy, dy / d * sp, 6, dt);
  p.life = Math.max(p.life, 1);
  p.r = 2.4 * spell.size * 2.2 * (1 + Math.min(1, (p.holdT || 0) * .15));
}

function drawEvoAir() {
  const p = player;
  // 极光聚能: shield while the first 4s of charge last
  if (evoBr('laser', 'A') && p.charge > 0 && (p.chargeHeld || 0) < 4 && !p.dead) {
    const k = 1 - (p.chargeHeld || 0) / 4;
    ctx.globalAlpha = .35 + .3 * k; ctx.fillStyle = '#fff3c4'; pixRing(p.x, p.y - 6, 14 + Math.sin(G.t * 12), .9, 1);
    ctx.globalAlpha = .12; pixDisc(p.x, p.y - 6, 13, .9); ctx.globalAlpha = 1;
  }
  for (const t of EV.turrets) {
    const a = t.t < .15 ? t.t / .15 : t.t > t.max - .4 ? (t.max - t.t) / .4 : 1;
    ctx.save(); ctx.globalAlpha = .6 * a; ctx.globalCompositeOperation = 'lighter';
    ctx.drawImage(glowTex('#ff9ec7'), t.x - 14, t.y - 22, 28, 28);
    ctx.translate(snap(t.x), snap(t.y)); ctx.drawImage(SPR.mageGhost, -6, -17); ctx.restore();
  }
  if (EV.blades.length) {
    const c = ELEM[elemOf()], r = 4 * Math.sqrt(spell.size) * (evoLv('boomer') >= 1 ? 1.3 : 1);
    for (const b of EV.blades) {
      ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = .5; ctx.drawImage(glowTex(c[1]), b.x - r * 3, b.y - r * 3, r * 6, r * 6);
      ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
      ctx.save(); ctx.translate(snap(b.x), snap(b.y)); ctx.rotate(G.t * 16 + b.a);
      ctx.fillStyle = c[2]; ctx.fillRect(-r * 1.6, -1.5, r * 3.2, 3); ctx.fillRect(-1.5, -r * 1.6, 3, r * 3.2);
      ctx.fillStyle = c[1]; ctx.fillRect(-r * 1.3, -.5, r * 2.6, 1); ctx.fillRect(-.5, -r * 1.3, 1, r * 2.6);
      ctx.fillStyle = c[0]; ctx.fillRect(-1, -1, 2, 2); ctx.restore();
    }
  }
  for (const w of EV.waves) {
    const k = w.t / w.max, rr = w.R * easeOutCubic(Math.min(1, k * 1.4));
    ctx.globalAlpha = 1 - k;
    for (let ring = 0; ring < 3; ring++) {
      const R = rr * (1 - ring * .18); ctx.fillStyle = ring ? '#ffd166' : '#ffffff';
      for (let b = -w.half; b <= w.half; b += .06) ctx.fillRect(Math.round(w.x + Math.cos(w.a + b) * R), Math.round(w.y + Math.sin(w.a + b) * R * .8), ring ? 1 : 2, ring ? 1 : 2);
    }
    ctx.globalAlpha = 1;
  }
}

/* ================= no healing while the star demon rages ================= */
function canHeal() { return !(G.ult && G.ult.active === 'demon'); }

/* ================= 汲魂: every heal raises the bar by 2 ================= */
function leechKill() {
  if (!spell.leech) return;
  G.leechN = Math.min((G.leechN || 0) + 1, G.leechNeed || 25);
  tryLeech();
}
function tryLeech() {
  if (!spell.leech || (G.leechN || 0) < (G.leechNeed || 25) || player.hp >= player.maxHp || !canHeal() || player.dead) return;
  G.leechN = 0; G.leechNeed = (G.leechNeed || 25) + 2;
  healPlayer(1);
  addText(player.x, player.y - 32, '汲魂', '#ff8aa0', .9);
}
let leechShown = '';
function updateLeechHud() {
  const el = $('leech'); if (!el) return;
  const on = !!spell.leech && G.state !== 'menu';
  const key = on ? `${G.leechN}/${G.leechNeed}/${canHeal()}` : '';
  if (key === leechShown) return; leechShown = key;
  el.hidden = !on; if (!on) return;
  const need = G.leechNeed || 25, n = G.leechN || 0;
  $('leech-t').textContent = !canHeal() ? '汲魂 · 星魔化身中无法回复' : n >= need ? `汲魂 · 已就绪，受伤后立即回复` : `汲魂 · 击杀 ${need} 个敌人回复 1 颗心`;
  $('leech-n').textContent = `${n}/${need}`;
  $('leech-b').style.width = (n / need * 100) + '%';
  el.classList.toggle('ready', n >= need);
}

/* ================= frost: frozen enemies soak enemy bullets ================= */
function frostHit(e) {
  if (e.type === 'boss' || e.elite) { e.slowT = 1 + spell.frost; return; }
  if (e.frozen > 0 || G.t < (e.frostImm || 0)) return;
  e.frozen = .6 + .4 * spell.frost; e.frostImm = G.t + e.frozen + 1;
  for (let i = 0; i < 6; i++) addPart(e.x, e.y - 4, 6, rand(-30, 30), rand(-20, 20), rand(20, 60), .45, ['#ffffff', '#c6f6ff', '#5fb0ff'], 1, { add: true, g: 120 });
}
function frostBlock(b) {
  for (const e of enemies) {
    if (!(e.frozen > 0) || e.dead || e.spawnT < 1) continue;
    if (Math.hypot(b.x - e.x, b.y - (e.y - 6)) > e.r + b.r + 3) continue;
    b.dead = true;
    for (let i = 0; i < 6; i++) addPart(b.x, b.y - 6, 6, rand(-50, 50), rand(-40, 40), rand(20, 60), .35, ['#ffffff', '#c6f6ff', '#5fb0ff'], 1, { add: true, g: 150 });
    damageEnemy(e, spell.dmg, b.x, b.y, { tcol: '#c6f6ff', kb: 10, fixed: true });
    if (AU.gate('iceblock', 50)) AU.tone(2200, .06, 'triangle', .04, 1400);
    return true;
  }
  return false;
}

/* ================= weaker effects option ================= */
// ctx.globalAlpha is wrapped so a whole block of effect drawing can be dimmed without touching every draw call
const GA_DESC = Object.getOwnPropertyDescriptor(CanvasRenderingContext2D.prototype, 'globalAlpha');
let FX_MUL = 1;
Object.defineProperty(ctx, 'globalAlpha', { configurable: true, get() { return GA_DESC.get.call(this) / FX_MUL; }, set(v) { GA_DESC.set.call(this, v * FX_MUL); } });
G.weakFx = false;
try { G.weakFx = localStorage.getItem('sv-weakfx') === '1'; } catch (e) {}
function fxDim(on) { const a = ctx.globalAlpha; FX_MUL = on && G.weakFx ? .5 : 1; ctx.globalAlpha = on ? 1 : a; }
function setWeakFx(on) { G.weakFx = on; try { localStorage.setItem('sv-weakfx', on ? '1' : '0'); } catch (e) {} }

/* ================= pause menu: the whole build ================= */
function tierOfPick(u, m) { return u.kind === 'stat' ? (m >= 2 ? 'epic' : m >= 1.4 ? 'rare' : 'common') : u.kind; }
function buildEntries() {
  const out = [], seen = new Map();
  if (G.ult) {
    const U = ULTS[G.ult.id];
    out.push({ ico: ultIcon(G.ult.id), name: U.name, tag: '大魔法', col: '#ff7a3d', desc: U.desc });
  }
  if (spell.form) {
    const f = spell.form, u = UPGRADES.find(x => x.id === f), lv = spell.formLv || 0, ev = EVO[f];
    const lines = [u.desc(1)];
    if (lv >= 1) lines.push(`进化 I · ${ev.l1.name}：${ev.l1.desc()}`);
    if (lv >= 2) lines.push(`进化 II · ${ev.l2.name}：${ev.l2.desc()}`);
    if (lv >= 3) { const b = ev[spell.formBr]; lines.push(`进化 III · ${b.name}：${b.desc()}`); }
    out.push({ ico: iconCanvas(u, 'form'), name: FORMS[f].name, tag: lv ? `武器形态 · Lv.${lv}` : '武器形态', col: RAR.form.col, desc: lines.join('<br>') });
  }
  for (const h of G.history) {
    const u = UPGRADES.find(x => x.id === h.id);
    if (!u || u.kind === 'form' || u.kind === 'evo') continue;
    const tier = tierOfPick(u, h.m), key = u.id + '|' + tier;
    if (seen.has(key)) { seen.get(key).n++; continue; }
    const it = { ico: iconCanvas(u, tier), name: u.name, tag: RAR[tier].label, col: RAR[tier].col, desc: u.desc(h.m, 0), n: 1, kind: u.kind };
    seen.set(key, it); out.push(it);
  }
  return out;
}
function renderBuildList() {
  const list = $('build-list'); if (!list) return;
  const items = buildEntries();
  $('build-n').textContent = items.length ? `${G.history.length} 张` : '';
  list.innerHTML = items.length ? '' : '<p class="build-empty">还没有获得任何强化</p>';
  for (const it of items) {
    const el = document.createElement('div'); el.className = 'bc'; el.style.setProperty('--rc', it.col);
    const c = it.ico; c.className = 'bc-ico'; el.appendChild(c);
    el.insertAdjacentHTML('beforeend', `<div class="bc-body"><div class="bc-top"><b>${it.name}${it.n > 1 ? ` <span class="bc-n">×${it.n}</span>` : ''}</b><em>${it.tag}</em></div><p>${it.desc}</p></div>`);
    list.appendChild(el);
  }
  $('weakfx-cb').checked = !!G.weakFx;
}
$('weakfx-cb').addEventListener('change', e => setWeakFx(e.target.checked));
