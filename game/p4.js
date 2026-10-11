
/* ================= enemies ================= */
const EDEF = {
  slime:  { name: '史莱姆', hp: 18, spd: 38, r: 6, h: 10, mass: 1.2, col: '#5fb8ff', col2: '#2f6fc0' },
  mini:   { name: '小史莱姆', hp: 9, spd: 44, r: 4, h: 7, mass: .7, col: '#bfe8ff', col2: '#2f6fc0' },
  bat:    { name: '血蝠', hp: 12, spd: 66, r: 5, h: 8, mass: .6, col: '#7a5aa0', col2: '#3c2b5c' },
  skel:   { name: '骷髅弓手', hp: 28, spd: 34, r: 5, h: 16, mass: 1, col: '#ece6d2', col2: '#a99f86' },
  shroom: { name: '爆裂菇', hp: 20, spd: 48, r: 5, h: 12, mass: .9, col: '#e2556a', col2: '#f1e3c4' },
  knight: { name: '盾卫', hp: 75, spd: 24, r: 7, h: 14, mass: 2.6, col: '#c3cde0', col2: '#4b5670' },
  wraith: { name: '幽魂术士', hp: 38, spd: 42, r: 6, h: 14, mass: 1, col: '#a688f0', col2: '#6c4bb8' },
  boss:   { name: '深渊之眼', hp: 12000, spd: 30, r: 20, h: 30, mass: 14, col: '#ff4d6d', col2: '#6c4bb8' },
};
function makeEnemy(type, x, y) {
  const d = EDEF[type], L = G.endless ? curLevel() : null;
  const hpMul = type === 'boss' ? 1 : diffMul() * (L ? L.hpMul : 1);
  const e = { type, x, y, z: 0, vx: 0, vy: 0, kvx: 0, kvy: 0, r: d.r, h: d.h, hp: d.hp * hpMul, maxHp: d.hp * hpMul, spd: d.spd * (1 + Math.min(.45, diffIdx() * .03)) * (L ? L.spdMul : 1),
    mass: d.mass, col: d.col, col2: d.col2, t: rand(0, 1), st: rand(.3, 1.2), state: 'idle', flash: 0, hitSq: 0, sx: 1, sy: 1, face: 1,
    facing: 0, burnT: 0, burnDps: 0, burnTick: 0, slowT: 0, spawnT: 0, dead: false, ghost: false, ph: rand(TAU), alpha: 1, sdir: Math.random() < .5 ? 1 : -1 };
  if (L && L.scale > 1 && !['kingslime', 'bonegen', 'storm', 'mirror', 'illusion'].includes(type)) { e.scale = L.scale; e.r *= L.scale; e.h *= L.scale; e.mass *= 3; }
  return e;
}
const AI = {
  slime(e, dt, d, a) {
    if (e.state !== 'hop') {
      e.vx = damp(e.vx, 0, 10, dt); e.vy = damp(e.vy, 0, 10, dt); e.z = 0; e.st -= dt;
      if (e.st < .18) { e.sx = damp(e.sx, 1.25, 20, dt); e.sy = damp(e.sy, .78, 20, dt); }
      if (e.st <= 0) { e.state = 'hop'; e.st = .5; const b = a + rand(-.35, .35); e.hx = Math.cos(b); e.hy = Math.sin(b); e.sx = .8; e.sy = 1.3; }
    } else {
      e.st -= dt; const p = 1 - e.st / .5;
      e.z = Math.sin(p * Math.PI) * 10;
      e.vx = e.hx * e.spd * 2.3; e.vy = e.hy * e.spd * 2.3;
      if (e.st <= 0) {
        e.state = 'idle'; e.st = rand(.35, .75); e.z = 0; e.sx = 1.4; e.sy = .65;
        for (let i = 0; i < 5; i++) addPart(e.x + rand(-4, 4), e.y, 0, rand(-30, 30), rand(-12, 12), rand(5, 20), .35, [e.col, e.col2], 1, { g: 80, drag: 4 });
        if (Math.random() < .5) decalSplat(e.x, e.y, e.col2, 3, 4);
      }
    }
  },
  mini(e, dt, d, a) { AI.slime(e, dt, d, a); },
  bat(e, dt, d, a) {
    e.z = 11 + Math.sin(e.t * 7 + e.ph) * 2.5;
    if (e.state === 'dive') {
      e.st -= dt; e.vx = e.dx * e.spd * 2.7; e.vy = e.dy * e.spd * 2.7;
      if (e.st <= 0) { e.state = 'fly'; e.st = rand(1.6, 2.8); }
    } else {
      const w = Math.sin(e.t * 3.2 + e.ph) * 1.1, pa = a + Math.PI / 2;
      e.vx = damp(e.vx, (Math.cos(a) + Math.cos(pa) * w) * e.spd, 6, dt);
      e.vy = damp(e.vy, (Math.sin(a) + Math.sin(pa) * w) * e.spd, 6, dt);
      e.st -= dt;
      if (e.st <= 0 && d < 120) { e.state = 'dive'; e.st = .42; maybeSay(e, ['冲鸭！', '吸你一口！'], .1, { reply: QUIPS.reply, replyChance: .4 }); e.dx = Math.cos(a); e.dy = Math.sin(a); e.sx = 1.3; e.sy = .75; if (AU.gate('squeak', 120)) AU.tone(2200, .08, 'square', .03, 2900); }
    }
  },
  skel(e, dt, d, a) {
    if (e.state === 'aim') {
      e.vx = damp(e.vx, 0, 12, dt); e.vy = damp(e.vy, 0, 12, dt);
      e.st -= dt; if (e.st > .28) e.aimA = a;
      if (e.st <= 0) {
        const s = 175;
        eprojs.push({ x: e.x + Math.cos(e.aimA) * 6, y: e.y + Math.sin(e.aimA) * 6, vx: Math.cos(e.aimA) * s, vy: Math.sin(e.aimA) * s, r: 2, kind: 'arrow', life: 2.4, t: 0 });
        sfx.arrow(); e.state = 'walk'; e.st = rand(1.7, 2.6); e.sx = 1.15; e.sy = .9;
      }
    } else {
      let mv = d < 95 ? -1 : d > 150 ? 1 : 0;
      if (Math.random() < dt * .4) e.sdir *= -1;
      const pa = a + Math.PI / 2;
      e.vx = damp(e.vx, (Math.cos(a) * mv + Math.cos(pa) * e.sdir * .6) * e.spd, 8, dt);
      e.vy = damp(e.vy, (Math.sin(a) * mv + Math.sin(pa) * e.sdir * .6) * e.spd, 8, dt);
      e.st -= dt;
      if (e.st <= 0 && d < 250) { e.state = 'aim'; e.st = .8; e.aimA = a; }
    }
  },
  shroom(e, dt, d, a) {
    if (e.state === 'fuse') {
      e.vx = damp(e.vx, 0, 14, dt); e.vy = damp(e.vy, 0, 14, dt);
      e.st -= dt; const p = 1 - e.st / .85;
      e.sx = 1 + p * .35 + Math.sin(e.t * 40) * .05 * p; e.sy = 1 + p * .25;
      if (Math.sin(e.t * (10 + p * 30)) > 0) { e.flash = .02; sfx.fuse(); }
      if (e.st <= 0) killEnemy(e, { fuse: true });
    } else {
      e.vx = damp(e.vx, Math.cos(a) * e.spd, 6, dt); e.vy = damp(e.vy, Math.sin(a) * e.spd, 6, dt);
      e.sy = 1 + Math.sin(e.t * 16) * .08; e.sx = 2 - e.sy;
      if (d < 26) { e.state = 'fuse'; e.st = .85; maybeSay(e, QUIPS.fuse, .4, { cd: .8 }); }
    }
  },
  knight(e, dt, d, a) {
    const turn = (want, rate) => { e.facing += clamp(angDiff(e.facing, want), -rate * dt, rate * dt); };
    if (e.state === 'wind') {
      e.vx = damp(e.vx, 0, 12, dt); e.vy = damp(e.vy, 0, 12, dt);
      turn(a, 5); e.st -= dt; e.shk = 1;
      if (e.st <= 0) { e.state = 'charge'; e.st = .55; e.cdx = Math.cos(e.facing); e.cdy = Math.sin(e.facing); e.shk = 0; AU.noise(.3, .1, 500, 200, 1); }
    } else if (e.state === 'charge') {
      e.st -= dt; e.vx = e.cdx * 170; e.vy = e.cdy * 170;
      if (Math.random() < .6) addPart(e.x + rand(-4, 4), e.y, 0, -e.cdx * 30 + rand(-15, 15), -e.cdy * 30 + rand(-8, 8), rand(5, 20), .4, ['#cdb98a', '#7da35a'], 1, { g: 60, drag: 3 });
      if (e.st <= 0 || e.bonk) {
        e.state = 'stun'; e.st = e.bonk ? 1.6 : 1.0;
        if (e.bonk) { addShake(.2); AU.noise(.25, .2, 300, 100); AU.tone(160, .2, 'square', .08, 60); addText(e.x, e.y - 22, '眩晕', '#ffd166', .9); maybeSay(e, QUIPS.stun, .5); }
        e.bonk = false;
      }
    } else if (e.state === 'stun') {
      e.vx = damp(e.vx, 0, 10, dt); e.vy = damp(e.vy, 0, 10, dt); e.st -= dt;
      if (e.st <= 0) { e.state = 'walk'; e.st = rand(2.2, 3.4); }
    } else {
      turn(a, 1.8);
      e.vx = damp(e.vx, Math.cos(a) * e.spd, 5, dt); e.vy = damp(e.vy, Math.sin(a) * e.spd, 5, dt);
      e.st -= dt;
      if (e.st <= 0 && d < 160) { e.state = 'wind'; e.st = .6; maybeSay(e, QUIPS.charge, .25, { reply: QUIPS.chargeReply, replyChance: .6 }); }
    }
  },
  wraith(e, dt, d, a) {
    e.z = 7 + Math.sin(e.t * 2.4 + e.ph) * 2.5;
    e.castT = (e.castT ?? rand(1.5, 3)) - dt; e.tpT = (e.tpT ?? rand(5, 8)) - dt;
    if (e.state === 'cast') {
      e.vx = damp(e.vx, 0, 8, dt); e.vy = damp(e.vy, 0, 8, dt); e.st -= dt;
      if (Math.random() < .7) { const b = rand(TAU); addPart(e.x + Math.cos(b) * 16, e.y + Math.sin(b) * 10, 10, -Math.cos(b) * 50, -Math.sin(b) * 30, 0, .3, ['#ffffff', '#a688f0'], 1, { add: true }); }
      if (e.st <= 0) {
        const n = 8, off = rand(TAU);
        for (let i = 0; i < n; i++) { const b = off + i / n * TAU; eprojs.push({ x: e.x, y: e.y, vx: Math.cos(b) * 62, vy: Math.sin(b) * 62, r: 3, kind: 'orb', life: 4, t: 0 }); }
        eprojs.push({ x: e.x, y: e.y, vx: Math.cos(a) * 95, vy: Math.sin(a) * 95, r: 3, kind: 'orb', life: 4, t: 0 });
        AU.tone(500, .3, 'sine', .08, 180); e.state = 'drift'; e.castT = rand(3, 4.2); e.sx = 1.3; e.sy = .8;
      }
    } else if (e.state === 'out') {
      e.st -= dt; e.alpha = Math.max(0, e.st / .3); e.ghost = true;
      if (e.st <= 0) {
        const b = rand(TAU), R = rand(80, 120);
        e.x = clamp(player.x + Math.cos(b) * R, 20, arena.w - 20); e.y = clamp(player.y + Math.sin(b) * R, 20, arena.h - 20);
        e.state = 'in'; e.st = .3;
        for (let i = 0; i < 12; i++) addPart(e.x, e.y, 8, rand(-40, 40), rand(-30, 30), rand(0, 30), .5, ['#ffffff', '#a688f0', '#6c4bb8'], 1, { add: true });
      }
    } else if (e.state === 'in') {
      e.st -= dt; e.alpha = 1 - Math.max(0, e.st / .3);
      if (e.st <= 0) { e.state = 'drift'; e.ghost = false; e.alpha = 1; e.tpT = rand(6, 9); }
    } else {
      const want = d < 90 ? -1 : d > 140 ? 1 : 0, pa = a + Math.PI / 2;
      e.vx = damp(e.vx, (Math.cos(a) * want + Math.cos(pa) * e.sdir * .7) * e.spd, 4, dt);
      e.vy = damp(e.vy, (Math.sin(a) * want + Math.sin(pa) * e.sdir * .7) * e.spd, 4, dt);
      if (e.castT <= 0 && d < 220) { e.state = 'cast'; e.st = .7; }
      else if (e.tpT <= 0) { maybeSay(e, ['看不见我~', '溜了溜了~'], .3); e.state = 'out'; e.st = .3; AU.tone(900, .25, 'sine', .05, 300); }
    }
  },
  boss(e, dt, d, a) {
    const p2 = e.hp < e.maxHp * .5;
    if (p2 && !e.p2) { e.p2 = true; sfx.roar(); addShake(.8, true); e.flash = .3; showBanner('', '深渊苏醒', '它的攻击变得更加狂暴'); say(e, '你激怒我了！！', { force: true, max: 2.6, reply: ['就等你这句话', '我好怕怕哦~'], replyChance: .9 }); }
    const sp = p2 ? 1.35 : 1;
    e.pt += dt * sp;
    if (e.pat !== 'slam') {
      e.z = damp(e.z, 18 + Math.sin(e.t * 1.6) * 3, 4, dt);
      if (!e.wp || Math.hypot(e.wp.x - e.x, e.wp.y - e.y) < 10 || Math.random() < dt * .3) e.wp = { x: clamp(arena.w / 2 + rand(-120, 120), 40, arena.w - 40), y: clamp(arena.h / 2 + rand(-80, 60), 50, arena.h - 40) };
      const b = angTo(e, e.wp);
      e.vx = damp(e.vx, Math.cos(b) * e.spd, 2, dt); e.vy = damp(e.vy, Math.sin(b) * e.spd, 2, dt);
    }
    const shoot = (b, s, r = 3.5) => eprojs.push({ x: e.x + Math.cos(b) * 14, y: e.y + Math.sin(b) * 10, vx: Math.cos(b) * s, vy: Math.sin(b) * s, r, kind: 'boss', life: 5, t: 0 });
    switch (e.pat) {
      case 'idle': if (e.pt > 1.0) {
        e.pat = e.order[e.pi++ % e.order.length]; e.pt = 0; e.acc = 0; e.vol = 0;
        if (e.pat === 'slam') maybeSay(e, ['压扁你！', '泰山压顶！'], .55, { force: true, reply: ['反弹！', '闪~', '你先减肥吧'], replyChance: .6 });
        if (e.pat === 'summon') maybeSay(e, ['小的们，上！', '摇人了！'], .6, { force: true, reply: ['打不过就叫人？'], replyChance: .5 });
      } break;
      case 'spiral': {
        e.acc += dt * sp;
        while (e.acc > .085) { e.acc -= .085; e.sa += .23; const arms = p2 ? 3 : 2; for (let i = 0; i < arms; i++) shoot(e.sa + i / arms * TAU, 78); if (AU.gate('bsh', 90)) AU.tone(420, .06, 'square', .03, 300); }
        if (e.pt > 3.2) { e.pat = 'idle'; e.pt = 0; }
        break;
      }
      case 'fan': {
        if (e.pt > .55 * (e.vol + 1) && e.vol < 3) {
          e.vol++; const n = p2 ? 9 : 7;
          for (let i = 0; i < n; i++) shoot(a + (i / (n - 1) - .5) * 1.1, 100);
          e.sx = 1.25; e.sy = .8; AU.tone(260, .15, 'sawtooth', .07, 120);
        }
        if (e.pt > 2.2) { e.pat = 'idle'; e.pt = 0; }
        break;
      }
      case 'summon': {
        if (!e.did) {
          e.did = true; AU.tone(200, .6, 'sine', .1, 600);
          const list = p2 ? ['bat', 'bat', 'shroom', 'wraith'] : ['bat', 'bat', 'shroom'];
          list.forEach((t, i) => { const b = i / list.length * TAU + rand(-.3, .3); queueSpawn(t, clamp(e.x + Math.cos(b) * 50, 20, arena.w - 20), clamp(e.y + Math.sin(b) * 40, 20, arena.h - 20)); });
        }
        if (e.pt > 1.4) { e.pat = 'idle'; e.pt = 0; e.did = false; }
        break;
      }
      case 'slam': {
        if (e.pt < .55) { e.z = damp(e.z, 70, 6, dt); e.vx = damp(e.vx, 0, 6, dt); e.vy = damp(e.vy, 0, 6, dt); e.tgt = { x: player.x, y: player.y }; }
        else if (e.pt < 1.45) {
          if (e.pt < 1.1) e.tgt = { x: damp(e.tgt.x, player.x, 3, dt), y: damp(e.tgt.y, player.y, 3, dt) };
          e.x = damp(e.x, e.tgt.x, 7, dt); e.y = damp(e.y, e.tgt.y, 7, dt); e.vx = e.vy = 0;
        } else if (!e.slammed) {
          e.z = damp(e.z, 0, 30, dt);
          if (e.z < 3) {
            e.slammed = true; e.z = 0; addShake(.9, true); G.hitstop = .06;
            explode(e.x, e.y, 30, 0, true, ['#ffffff', '#d08cff', '#6c4bb8']);
            if (Math.hypot(player.x - e.x, player.y - e.y) < 34) damagePlayer(1, e.x, e.y);
            const n = p2 ? 18 : 14; for (let i = 0; i < n; i++) shoot(i / n * TAU, 85, 3);
            fx.push({ k: 'ring', x: e.x, y: e.y, r0: 10, r1: 90, t: 0, max: .5, col: '#d08cff', w: 3 });
          }
        }
        if (e.pt > 2.3) { e.pat = 'idle'; e.pt = 0; e.slammed = false; e.tgt = null; }
        break;
      }
    }
  },
};
function updateEnemies(dt) {
  if (G.timeStop > 0) return;
  if (G.timeField > 0) dt *= .3;
  const purge = G.state === 'clear';
  for (const e of enemies) {
    if (e.dead) continue;
    e.t += dt; e.flash -= dt; e.hitSq = damp(e.hitSq, 0, 12, dt);
    e.sx = damp(e.sx, 1, 10, dt); e.sy = damp(e.sy, 1, 10, dt);
    if (purge) { if (G.t > e.purge) killEnemy(e, { silent: true }); continue; }
    if (e.spawnT < 1) { e.spawnT = Math.min(1, e.spawnT + dt / .4); continue; }
    const slow = e.slowT > 0 ? .5 : 1; e.slowT -= dt;
    if (e.burnT > 0) {
      e.burnT -= dt; e.burnTick -= dt;
      if (Math.random() < dt * 12) addPart(e.x + rand(-4, 4), e.y - rand(0, e.h), e.z + 2, rand(-5, 5), 0, rand(20, 40), rand(.3, .5), ['#fff4c2', '#ffb347', '#ff4d2e'], 1, { add: true });
      if (e.burnTick <= 0) { e.burnTick = .25; damageEnemy(e, e.burnDps, e.x, e.y, { tcol: '#ffb347', quiet: true }); if (e.dead) continue; }
    }
    if (e.frozen > 0) {
      e.frozen -= dt; e.x += e.kvx * dt; e.y += e.kvy * dt; e.kvx = damp(e.kvx, 0, 9, dt); e.kvy = damp(e.kvy, 0, 9, dt);
      collideWorld(e, e.r);
      if (e.frozen <= 0) for (let i = 0; i < 6; i++) addPart(e.x, e.y - 4, 4, rand(-40, 40), rand(-30, 30), rand(20, 60), .4, ['#ffffff', '#c6f6ff'], 1, { g: 200 });
      continue;
    }
    const d = dist(e, player), a = angTo(e, player);
    AI[e.type](e, dt * slow, d, a);
    const ex = e.x + (e.vx * slow + e.kvx) * dt, ey = e.y + (e.vy * slow + e.kvy) * dt;
    e.x = ex; e.y = ey;
    e.kvx = damp(e.kvx, 0, 9, dt); e.kvy = damp(e.kvy, 0, 9, dt);
    if (e.type !== 'boss') collideWorld(e, e.r); else { e.x = clamp(e.x, 24, arena.w - 24); e.y = clamp(e.y, 30, arena.h - 20); }
    if (e.state === 'charge' && Math.hypot(e.x - ex, e.y - ey) > 1.2) e.bonk = true;
    if (Math.abs(player.x - e.x) > 1) e.face = player.x > e.x ? 1 : -1;
    if (!e.ghost && e.z < 14 && d < e.r + player.r + 1) damagePlayer(1, e.x, e.y);
  }
  // soft separation
  const live = enemies.filter(e => !e.dead && e.spawnT >= 1);
  for (let i = 0; i < live.length; i++) for (let j = i + 1; j < live.length; j++) {
    const A = live[i], B = live[j], dx = B.x - A.x, dy = B.y - A.y, m = A.r + B.r, dd = dx * dx + dy * dy;
    if (dd < m * m && dd > .0001) {
      const D = Math.sqrt(dd), push = (m - D) * .5, nx = dx / D, ny = dy / D, wa = B.mass / (A.mass + B.mass);
      A.x -= nx * push * wa; A.y -= ny * push * wa; B.x += nx * push * (1 - wa); B.y += ny * push * (1 - wa);
    }
  }
  enemies = enemies.filter(e => !e.dead);
}
function killEnemy(e, o = {}) {
  if (e.dead) return;
  e.dead = true;
  const n = e.type === 'boss' ? 60 : 16;
  for (let i = 0; i < n; i++) { const b = rand(TAU), s = rand(30, 130); addPart(e.x, e.y - e.h / 2, e.z + 4, Math.cos(b) * s, Math.sin(b) * s * .7, rand(40, 120), rand(.4, .9), [i % 3 ? e.col : '#ffffff', e.col2], rand(1, 2), { g: 260, drag: 1.5 }); }
  for (let i = 0; i < 6; i++) { const b = rand(TAU); addPart(e.x, e.y - e.h / 2, e.z + 4, Math.cos(b) * 60, Math.sin(b) * 40, rand(10, 40), .25, ['#ffffff', e.col], 1, { add: true, drag: 6 }); }
  fx.push({ k: 'ring', x: e.x, y: e.y, r0: 2, r1: e.r * 2.5, t: 0, max: .25, col: '#ffffff', w: 1 });
  fx.push({ k: 'flash', x: e.x, y: e.y - 4, r: 30, t: 0, max: .15, col: e.col });
  decalSplat(e.x, e.y, e.col2, 12, 7);
  if (!o.silent) {
    sfx.kill(); addShake(.1); G.hitstop = Math.max(G.hitstop, .02); comboKill(); ultOnKill(e);
    G.kills++; G.totalKills++;
    if (Math.random() < heartDropChance() && e.type !== 'mini') dropHeart(e.x, e.y);
    if (spell.novaEcho) player.novaCd -= .3;
    leechKill(); evoOnKill(e);
    if (spell.corpse && e.type !== 'boss') { const x = e.x, y = e.y; later(.08, () => explode(x, y, 18 + spell.corpse * 7, spell.dmg * (.4 + .4 * spell.corpse), true, ['#ffffff', '#9fe6ff', '#5d84f0'])); }
  }
  if (e.type === 'slime' && !o.silent) for (const s of [-1, 1]) {
    const m = makeEnemy('mini', e.x + s * 5, e.y); m.spawnT = 1; m.kvx = s * 90; m.kvy = rand(-30, 30); m.st = .5; m.sx = 1.4; m.sy = .6; enemies.push(m); if (s > 0) later(.15, () => maybeSay(m, ['我们分家了！', '我还会回来的！'], .1));
  }
  if (e.type === 'shroom' && !o.silent) {
    if (o.fuse) explode(e.x, e.y, 40, 0, false, ['#fff4c2', '#ff8aa0', '#e2556a']);
    else explode(e.x, e.y, 32, 24, true, ['#fff4c2', '#ff8aa0', '#e2556a']);
  }
  if (e.type === 'boss') bossDeath(e);
  if (e.elite && !o.silent) eliteDeath(e);
}
function updateEprojs(dt) {
  if (G.timeStop > 0) return;
  if (G.timeField > 0) dt *= .3;
  for (const b of eprojs) {
    if (b.dead) continue;
    if (b.friendly) { updateFriendlyEproj(b, dt); continue; }
    if (b.home) { const a0 = Math.atan2(b.vy, b.vx), a1 = Math.atan2(player.y - 4 - b.y, player.x - b.x), sp = Math.hypot(b.vx, b.vy), na = a0 + clamp(angDiff(a0, a1), -1, 1) * b.home * dt; b.vx = Math.cos(na) * sp; b.vy = Math.sin(na) * sp; }
    b.t += dt; b.life -= dt;
    b.x += b.vx * dt; b.y += b.vy * dt;
    if (b.x < -4 || b.x > arena.w + 4 || b.y < -4 || b.y > arena.h + 4 || b.life <= 0) { b.dead = true; continue; }
    for (const p of pillars) if (Math.hypot(b.x - p.x, b.y - p.y) < p.r + b.r) { b.dead = true; addPart(b.x, b.y, 6, 0, 0, 20, .3, ['#ffffff', '#888'], 1); }
    if (!b.dead && spell.frost && frostBlock(b)) continue;
    if (!b.dead && Math.hypot(b.x - player.x, b.y - (player.y - 4)) < b.r + player.r + 1) {
      if (player.inv <= 0 && player.dashT <= 0) { damagePlayer(1, b.x - b.vx, b.y - b.vy); b.dead = true; }
    }
  }
  eprojs = eprojs.filter(b => !b.dead);
}

/* ================= spawning & levels ================= */
const LEVELS = [
  { name: '晨露草甸', theme: 0, goal: { type: 'kill', n: 40 }, pool: { slime: 4, mini: 4, bat: 3 }, rate: 2.4, cap: 24, pillars: 10 },
  { name: '风铃花海', theme: 1, goal: { type: 'survive', t: 45 }, pool: { slime: 3, mini: 4, bat: 4, shroom: 3 }, rate: 3.2, cap: 32, pillars: 9 },
  { name: '古神遗迹', theme: 0, goal: { type: 'kill', n: 80 }, pool: { mini: 3, slime: 3, bat: 3, shroom: 2, skel: 4 }, rate: 3.6, cap: 36, pillars: 14 },
  { name: '金穗原野', theme: 2, goal: { type: 'survive', t: 55 }, pool: { mini: 3, slime: 3, bat: 3, shroom: 3, skel: 3, knight: 3 }, rate: 4.2, cap: 40, pillars: 10 },
  { name: '蝶舞溪谷', theme: 1, goal: { type: 'kill', n: 130 }, pool: { mini: 3, bat: 4, shroom: 3, skel: 3, knight: 2, wraith: 3 }, rate: 4.8, cap: 44, pillars: 9 },
  { name: '落日麦浪', theme: 2, goal: { type: 'survive', t: 65 }, pool: { mini: 3, slime: 3, bat: 3, shroom: 4, skel: 3, knight: 3, wraith: 2 }, rate: 5.5, cap: 50, pillars: 10 },
  { name: '暮光高地', theme: 3, goal: { type: 'kill', n: 200 }, pool: { mini: 3, slime: 2, bat: 4, shroom: 3, skel: 3, knight: 3, wraith: 3 }, rate: 6, cap: 56, pillars: 9 },
  { name: '星坠之巅', theme: 3, goal: { type: 'boss' }, pool: {}, rate: 0, cap: 0, pillars: 5, w: 820, h: 580 },
];
const INTRO = { mini: '小史莱姆会成群出没', slime: '史莱姆死后会分裂', bat: '血蝠会突然俯冲', shroom: '爆裂菇靠近后会自爆，击杀它能炸伤周围怪物', skel: '骷髅弓手瞄准时会显示红线', knight: '盾卫正面格挡伤害，引诱它冲锋撞墙后攻击', wraith: '幽魂术士会瞬移并释放环形弹幕' };
function weighted(pool) { const ks = Object.keys(pool); let tot = 0; for (const k of ks) tot += pool[k]; let r = Math.random() * tot; for (const k of ks) { r -= pool[k]; if (r <= 0) return k; } return ks[0]; }
function queueSpawn(type, x, y) {
  if (x === undefined && G.endless && curLevel().far) {
    for (let i = 0; i < 40; i++) { x = rand(20, arena.w - 20); y = rand(24, arena.h - 20); if (Math.hypot(x - player.x, y - player.y) > 300) break; }
  }
  if (x === undefined) {
    for (let i = 0; i < 30; i++) {
      const a = rand(TAU), r = rand(120, 250);
      x = clamp(player.x + Math.cos(a) * r, 20, arena.w - 20); y = clamp(player.y + Math.sin(a) * r * .8, 24, arena.h - 20);
      if (Math.hypot(x - player.x, y - player.y) > 100 && !pillars.some(p => Math.hypot(p.x - x, p.y - y) < 18)) break;
    }
  }
  spawns.push({ type, x, y, t: 0, max: .85 });
  sfx.spawn();
}
function updateSpawns(dt) {
  if (G.timeStop > 0) return;
  for (const s of spawns) {
    s.t += dt;
    if (Math.random() < dt * 20) { const b = rand(TAU); addPart(s.x + Math.cos(b) * 10, s.y + Math.sin(b) * 6, 0, -Math.cos(b) * 14, -Math.sin(b) * 8, rand(20, 50), .4, ['#ffffff', arena.theme.rune], 1, { add: true }); }
    if (s.t >= s.max) {
      s.done = true;
      if (G.state !== 'play') continue;
      const e = makeEnemy(s.type, s.x, s.y); e.sx = .4; e.sy = 1.6; enemies.push(e);
      for (let i = 0; i < 10; i++) addPart(s.x, s.y, 2, rand(-40, 40), rand(-20, 20), rand(40, 90), .45, ['#ffffff', arena.theme.rune], 1, { add: true, g: 120 });
    }
  }
  spawns = spawns.filter(s => !s.done);
}
function levelUpdate(dt) {
  const L = curLevel();
  G.levelT += dt;
  if (L.goal.type !== 'boss') {
    if (L.goal.type === 'elite' && !G.eliteSpawned && G.levelT > 1.6) spawnElite(L.vparam);
    let alive = enemies.length + spawns.length;
    G.spawnAcc += dt * L.rate * (1 + G.levelT / 80);
    while (G.spawnAcc >= 1) { G.spawnAcc -= 1; if (alive < L.cap) { queueSpawn(weighted(L.pool)); alive++; } }
    G.surgeT -= dt;
    if (G.surgeT <= 0) {
      G.surgeT = rand(13, 17);
      const type = weighted(L.pool), swarm = type === 'mini' || type === 'bat', n = swarm ? randi(10, 14) : randi(6, 9), off = rand(TAU), R = rand(85, 110);
      for (let i = 0; i < n; i++) { const b = off + i / n * TAU; queueSpawn(type, clamp(player.x + Math.cos(b) * R, 16, arena.w - 16), clamp(player.y + Math.sin(b) * R * .8, 20, arena.h - 16)); }
    }
    if (L.goal.type === 'kill' && G.kills >= L.goal.n) levelClear();
    if (L.goal.type === 'survive' && G.levelT >= L.goal.t) levelClear();
  } else if (!G.boss && G.levelT > 1.6) {
    const b = makeEnemy('boss', arena.w / 2, arena.h / 2 - 50);
    Object.assign(b, { pat: 'idle', pt: -1.5, pi: 0, order: ['spiral', 'fan', 'summon', 'slam', 'fan', 'spiral', 'slam'], sa: 0, acc: 0, vol: 0, z: 18, sx: .3, sy: 2 });
    document.querySelector('.boss-name').textContent = '深渊之眼';
    enemies.push(b); G.boss = b; sfx.roar(); addShake(1, true);
    later(1, () => say(b, '把星辰之力交出来！', { force: true, max: 2.8, reply: ['想得美！', '眼睛这么大，近视吗？'], replyChance: 1 }));
    $('boss').classList.remove('hide');
    for (let i = 0; i < 40; i++) { const c = rand(TAU); addPart(b.x, b.y, 18, Math.cos(c) * 120, Math.sin(c) * 80, rand(0, 60), .8, ['#ffffff', '#ff4d6d', '#6c4bb8'], 2, { add: true, drag: 3 }); }
  }
}
function bossDeath(e) {
  G.tsTarget = .25; addShake(1.2, true);
  for (const b of eprojs) { b.dead = true; addPart(b.x, b.y, 6, 0, 0, 20, .4, ['#ffffff', '#ff8aa0'], 1, { add: true }); }
  for (const m of enemies) if (m !== e && !m.dead) killEnemy(m, { silent: true });
  spawns = [];
  let k = 0;
  const iv = setInterval(() => {
    explode(e.x + rand(-26, 26), e.y + rand(-20, 20), rand(18, 34), 0, true, ['#ffffff', '#ff8aa0', '#6c4bb8']);
    if (++k > 8) clearInterval(iv);
  }, 110);
  $('boss').classList.add('hide');
  setTimeout(() => { G.tsTarget = 1; levelClear(); }, 1100);
}
