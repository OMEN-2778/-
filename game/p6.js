
/* ================= upgrades ================= */
const pc = v => Math.round(v * 100) + '%';
const E = v => `<em>${v}</em>`;
const UPGRADES = [
  // ---- stat runes: rarity is rolled per card and scales the numbers ----
  { id: 'power', kind: 'stat', name: '奥术强化', max: 8, w: 12, desc: m => `法术伤害 ${E('+' + pc(.7 * m))}`, apply(m) { spell.dmg *= 1 + .7 * m; } },
  { id: 'multi', kind: 'stat', name: '多重施法', max: 4, w: 10, desc: m => `每次施法额外射出 ${E(Math.round(2 * m))} 发弹体`, apply(m) { spell.count += Math.round(2 * m); } },
  { id: 'rate', kind: 'stat', name: '急速吟唱', max: 6, w: 10, desc: m => `施法速度 ${E('+' + pc(.45 * m))}`, apply(m) { spell.rate *= 1 + .45 * m; } },
  { id: 'pierce', kind: 'stat', name: '贯穿', max: 4, w: 8, desc: m => `弹体额外穿透 ${E(Math.round(2 * m))} 个敌人`, apply(m) { spell.pierce += Math.round(2 * m); } },
  { id: 'bounce', kind: 'stat', name: '弹跳符文', max: 3, w: 8, desc: m => `弹体命中敌人或撞墙后${E('弹向最近的敌人')}，可弹射 ${E(Math.round(2 * m))} 次，射程 +15%`, apply(m) { spell.bounce += Math.round(2 * m); spell.life *= 1.15; } },
  { id: 'crit', kind: 'stat', name: '致命星辉', max: 4, w: 9, desc: m => `暴击率 ${E('+' + pc(.15 * m))}，暴击伤害 ${E('+' + pc(.5 * m))}`, apply(m) { spell.crit += .15 * m; spell.critMul += .5 * m; } },
  { id: 'size', kind: 'stat', name: '膨胀', max: 3, w: 8, desc: m => `弹体体积 ${E('+' + pc(.45 * m))}，伤害 ${E('+' + pc(.25 * m))}`, apply(m) { spell.size *= 1 + .45 * m; spell.dmg *= 1 + .25 * m; } },
  { id: 'velocity', kind: 'stat', name: '疾矢', max: 3, w: 7, desc: m => `弹速 ${E('+' + pc(.35 * m))}，射程 +20%`, apply(m) { spell.speed *= 1 + .35 * m; spell.life *= 1.2; } },
  { id: 'split', kind: 'stat', name: '碎裂', max: 3, w: 8, desc: m => `命中后炸出碎片，碎片数 ${E('+' + (m > 1.6 ? 4 : 2))}`, apply(m) { spell.split += m > 1.6 ? 2 : 1; } },
  { id: 'home', kind: 'stat', name: '追魂', max: 3, w: 7, desc: m => `弹体自动追踪附近敌人，转向强度 ${E('+' + pc(m))}`, apply(m) { spell.homing += m; } },
  { id: 'explode', kind: 'stat', name: '爆裂', max: 3, w: 8, desc: m => `弹体消散时爆炸，爆炸半径 ${E('+' + Math.round(9 * m))}，伤害提升`, apply(m) { spell.explode += m; } },
  { id: 'fire', kind: 'stat', name: '炎之附魔', max: 3, w: 8, desc: m => `命中点燃敌人，每 ${E('0.25 秒')}灼烧 ${E(pc(.45 * m))} 法术伤害`, apply(m) { spell.burn += m; } },
  { id: 'frost', kind: 'stat', name: '霜之附魔', max: 3, w: 7, desc: m => `命中将敌人${E('完全冻结')}，冻结时间 ${E('+' + (.4 * m).toFixed(1) + ' 秒')}（首领与精英改为减速）。被冻住的敌人会替你挡下敌方子弹，每挡一颗受到 ${E('100%')} 法术伤害`, apply(m) { spell.frost += m; } },
  { id: 'chain', kind: 'stat', name: '雷霆连锁', max: 3, w: 6, desc: m => `命中后电弧跳向 ${E(Math.round(m) * 2)} 个额外敌人`, apply(m) { spell.chain += Math.round(m); } },
  { id: 'orbit', kind: 'stat', name: '星环', max: 3, w: 6, desc: m => `获得 ${E(m > 1.2 ? 2 : 1)} 颗环绕你旋转的法球`, apply(m) { spell.orbit += m > 1.2 ? 2 : 1; } },
  { id: 'vital', kind: 'stat', name: '生命之泉', max: 5, w: 7, desc: m => `最大生命 ${E('+' + 2 * Math.round(m))}，并回满生命`, apply(m) { player.maxHp += 2 * Math.round(m); player.hp = player.maxHp; } },
  { id: 'swift', kind: 'stat', name: '风行', max: 3, w: 6, desc: m => `移速 ${E('+' + pc(.15 * m))}，冲刺冷却 ${E('-' + pc(.2 * m))}`, apply(m) { player.speed *= 1 + .15 * m; player.dashCdMax *= 1 - .2 * m; } },
  { id: 'slow', kind: 'stat', name: '厚积薄发', max: 3, w: 8, desc: m => `施法越慢伤害越高：以你现在的施法速度，伤害约 ${E('+' + pc(.35 * m * clamp(3 / effRate(), .2, 4)))}`, apply(m) { spell.slow += .35 * m; } },
  { id: 'novaN', kind: 'stat', name: '新星共鸣', max: 3, w: 5, desc: m => `奥术新星弹体 ${E('+' + Math.round(8 * m))}，冷却 ${E('-' + pc(.15 * m))}`, apply(m) { spell.novaN += Math.round(8 * m); player.novaCdMax *= 1 - .15 * m; } },
  // ---- special runes: fixed, big swings ----
  { id: 'storm', kind: 'special', name: '弹幕风暴', max: 2, w: 3, desc: () => `弹体数量直接 ${E('×2')}`, apply() { spell.count *= 2; } },
  { id: 'ruin', kind: 'special', name: '毁灭之力', max: 2, w: 3, desc: () => `法术伤害直接 ${E('×2')}`, apply() { spell.dmg *= 2; } },
  { id: 'echo', kind: 'special', name: '回响咏唱', max: 2, w: 3, desc: () => `每次施法有 ${E('30%')} 概率立即再施放一次`, apply() { spell.echo++; } },
  { id: 'fourth', kind: 'special', name: '第四式', max: 1, w: 3, desc: () => `每第 ${E('4')} 次施法，额外向四周释放一圈星弹`, apply() { spell.fourth = 1; } },
  { id: 'corpse', kind: 'special', name: '尸爆', max: 3, w: 3, desc: (m, l) => l ? `尸爆范围与伤害提升` : `敌人死亡时爆炸，炸伤周围敌人，${E('可以连锁')}`, apply() { spell.corpse++; } },
  { id: 'glass', kind: 'special', name: '玻璃大炮', max: 1, w: 2, desc: () => `法术伤害 ${E('×2.5')}，最大生命 −1`, apply() { spell.dmg *= 2.5; player.maxHp = Math.max(1, player.maxHp - 1); player.hp = Math.min(player.hp, player.maxHp); } },
  { id: 'leech', kind: 'special', name: '汲魂', max: 1, w: 3, desc: () => `每击杀 ${E(G.leechNeed || 25)} 个敌人回复 1 点生命，每次回复后所需击杀数 ${E('+2')}`, apply() { spell.leech = 1; } },
  { id: 'dashfire', kind: 'special', name: '烈焰步', max: 1, w: 3, desc: () => `冲刺路径留下持续灼烧的火焰`, apply() { spell.dashfire = 1; } },
  // ---- weapon forms: replace how the primary spell fires, keep every rune ----
  { id: 'laser', kind: 'form', name: '棱光射线', max: 1, w: 3, desc: () => `按住蓄力，松开射出贯穿一切的射线，蓄力越久越粗，满蓄力造成 ${E('1200%')} 伤害。弹体数变为射线数，反弹会折射射线`, apply() { spell.form = 'laser'; } },
  { id: 'minigun', kind: 'form', name: '星屑风暴', max: 1, w: 3, desc: () => `施法速度 ${E('×3')}，按住越久射得越快（最高再 ×1.7）。单发伤害 50%，弹道散开`, apply() { spell.form = 'minigun'; } },
  { id: 'shotgun', kind: 'form', name: '星爆散射', max: 1, w: 3, desc: () => `每次施法射出 ${E('5 倍')} 弹体，呈宽扇形，近身击退极强。射速降低，射程缩短`, apply() { spell.form = 'shotgun'; } },
  { id: 'boomer', kind: 'form', name: '回旋月刃', max: 1, w: 3, desc: () => `弹体变为月刃：${E('无限穿透')}，飞出后折返，伤害 150%，撞墙必定反弹`, apply() { spell.form = 'boomer'; } },
  { id: 'sing', kind: 'form', name: '引力奇点', max: 1, w: 3, desc: () => `射出缓慢的奇点，吸附并持续撕裂周围敌人，持续伤害 80%，消散时爆炸造成 ${E('500%')} 伤害`, apply() { spell.form = 'sing'; } },
  { id: 'wing', kind: 'form', name: '星翼冲锋', max: 1, w: 3, desc: () => `保留普通攻击，冲刺时向两侧各射出一排 ${E('5 颗')} 星弹（伤害 160%，继承全部符文），冲刺冷却 ${E('−25%')}`, apply() { spell.form = 'wing'; player.dashCdMax *= .75; } },
  { id: 'ray', kind: 'form', name: '流光速射', max: 1, w: 3, desc: () => `快速射出细小的射线，射速 ${E('×2')}，每道贯穿 ${E('2')} 个敌人（贯穿符文可增加），伤害 60%`, apply() { spell.form = 'ray'; } },
  { id: 'meteor', kind: 'form', name: '星陨术', max: 1, w: 3, desc: () => `在光标处召唤陨石，范围伤害 ${E('400%')}。弹体数变为陨石数，爆裂会扩大范围`, apply() { spell.form = 'meteor'; } },
  // ---- nova mods: rare, big ----
  { id: 'nfreeze', kind: 'nova', name: '新星 · 霜冻', max: 1, w: 2.5, desc: () => `E 冻结周围敌人 2.8 秒，冻结期间受到伤害 ${E('+50%')}`, apply() { spell.novaFreeze = 1; } },
  { id: 'nvortex', kind: 'nova', name: '新星 · 黑洞', max: 1, w: 2.5, desc: () => `E 同时在光标处生成黑洞，吸附敌人 2.4 秒后爆炸，造成 ${E('500%')} 伤害`, apply() { spell.novaVortex = 1; } },
  { id: 'ntriple', kind: 'nova', name: '新星 · 三重', max: 1, w: 2.5, desc: () => `E 连续释放 ${E('3')} 次`, apply() { spell.novaTriple = 1; } },
  { id: 'nhome', kind: 'nova', name: '新星 · 万箭', max: 1, w: 2.5, desc: () => `E 的弹体数量 ${E('×2')}，并全部追踪敌人`, apply() { spell.novaHome = 1; } },
  { id: 'ntime', kind: 'nova', name: '新星 · 时滞', max: 1, w: 2.5, desc: () => `E 让敌人与敌方弹幕减速 ${E('70%')}，持续 4.5 秒`, apply() { spell.novaTime = 1; } },
  { id: 'necho', kind: 'nova', name: '新星 · 回响', max: 1, w: 2.5, desc: () => `E 冷却 ${E('-50%')}，每次击杀再缩短 0.3 秒`, apply() { spell.novaEcho = 1; } },
];
const RAR = {
  common: { label: 'COMMON', col: '#9fb3d9', m: 1 },
  rare: { label: 'RARE', col: '#b58cff', m: 1.5 },
  epic: { label: 'EPIC', col: '#ffd166', m: 2.2 },
  special: { label: 'SPECIAL', col: '#ff7ac8', m: 1 },
  form: { label: 'LEGEND · FORM', col: '#ff7a3d', m: 1 },
  nova: { label: 'NOVA', col: '#5fe3ff', m: 1 },
};
// 12x12 icons: a = card color, w = white, k = outline, b = dim
const ICONS = {
  multi: ['............', '........ww..', '......waa...', '...aaaa.....', '............', '..aaaaaaww..', '............', '...aaaa.....', '......waa...', '........ww..', '............', '............'],
  rate: ['...kkkkkk...', '...kaaaak...', '....kwwk....', '.....kk.....', '.....ka.....', '....kaak....', '...kaaaak...', '...kkkkkk...', '..........w.', '.....ww..w..', '..ww........', '............'],
  power: ['.....kk.....', '....kwak....', '...kwaaak...', '..kwaaaaak..', '.kwaaaaaaak.', 'kaaaawwaaaak', '.kaaaaaaaak.', '..kaaaaaak..', '...kaaaak...', '....kaak....', '.....kk.....', '............'],
  pierce: ['............', '.....kk.....', '.....kk.....', 'wwwwaaaaaaw.', 'wwwwaaaaaaaw', 'wwwwaaaaaaw.', '.....kk.....', '.....kk.....', '............', '............', '............', '............'],
  bounce: ['k...........', 'k..a........', 'k.a.a.......', 'ka...a......', 'kw....a.....', 'k......a....', 'k.......a...', 'k........aw.', 'k.........w.', 'k...........', 'kkkkkkkkkkkk', '............'],
  split: ['w....a....w.', '.a...a...a..', '..a..a..a...', '...a.w.a....', '....kwk.....', 'aawwwwwwwaa.', '....kwk.....', '...a.w.a....', '..a..a..a...', '.a...a...a..', 'w....a....w.', '............'],
  home: ['............', '.......kkk..', '......kwwak.', '......kwaak.', '.......kkk..', '.....a......', '....a.......', '...a........', '..a.........', '.a..........', 'w...........', '............'],
  explode: ['.....w......', '..w..a..w...', '...a.a.a....', '....aaa.....', 'waaaawaaaaw.', '....aaa.....', '...a.a.a....', '..w..a..w...', '.....w......', '............', '............', '............'],
  fire: ['.....a......', '....aa......', '....aaa.....', '...aaaa..a..', '..aaawaa.aa.', '..aawwwaaaa.', '.aawwwwwaaa.', '.aawwwwwaaa.', '..aawwwaaa..', '...aaaaaa...', '............', '............'],
  frost: ['.....w......', '..w..a..w...', '...a.a.a....', '.a..aaa..a..', 'waaaawwaaaaw', '.a..aaa..a..', '...a.a.a....', '..w..a..w...', '.....w......', '............', '............', '............'],
  chain: ['.......aaw..', '......aaw...', '.....aaw....', '....aaaaaa..', '.......aa...', '......aa....', '.....aa.....', '....aw......', '...aw.......', '..w.........', '............', '............'],
  crit: ['.....w......', '.....a......', '....aaa.....', 'waaaawaaaaw.', '..aaaaaaa...', '...aaaaa....', '..aa...aa...', '.a.......a..', '............', '............', '............', '............'],
  size: ['....kkkk....', '..kkaaaakk..', '.kaawwaaaak.', '.kawwaaaaak.', 'kaawaaaaaaak', 'kaaaaaaaaaak', 'kaaaaaaaaaak', 'kaaaaaaaaaak', '.kaaaaaaaak.', '.kaaaaaaaak.', '..kkaaaakk..', '....kkkk....'],
  velocity: ['............', '..........w.', '.......aaaww', 'bbbb.aaaaaaw', '.......aaaww', '..........w.', 'bbbbbb......', '............', '...bbb......', '............', '............', '............'],
  orbit: ['....aaaa....', '..aa....aa..', '.a........a.', '.a...kk...a.', 'a...kwak...w', 'a...kaak...w', '.a...kk...a.', '.a........a.', '..aa....aa..', '....aaaa....', '............', '............'],
  vital: ['.kkk...kkk..', 'kwaak.kaaak.', 'kwaaakaaaak.', 'kaaaaaaaaak.', '.kaaaaaaak..', '..kaaaaak...', '...kaaak....', '....kak.....', '.....k......', '............', '............', '............'],
  swift: ['..........a.', '........aa..', 'bbbb...aa...', '......aaaa..', '.bbbb...aa..', '.......aa...', 'bbb...aa....', '.....aaaaaa.', '.......aa...', '......aa....', '.....a......', '............'],
  nova: ['.a...w...a..', '..a..a..a...', '...a...a....', '.....a......', 'wa..aaa..aw.', '.....a......', '...a...a....', '..a..a..a...', '.a...w...a..', '............', '............', '............'],
  dashfire: ['............', '........aa..', '.......awa..', '..a...awwa..', '.aa..aawwa..', '.awaaawwwa..', 'awwwwwwwwa..', 'aaaaaaaaaa..', 'bbbb..bbbb..', '............', '............', '............'],
  laser: ['............', '............', '.kk.........', 'kwak.......w', 'kwaaaaaaaaaw', 'kwwwwwwwwwww', 'kwaaaaaaaaaw', 'kwak.......w', '.kk.........', '............', '............', '............'],
  minigun: ['............', '.a..a..a..w.', '............', '..a..a..a..w', '............', '.a..a..a..w.', '............', '..a..a..a..w', '............', '.a..a..a..w.', '............', '............'],
  shotgun: ['.........w..', '......a...w.', '...a....a..w', 'kk..a.a..a..', 'kwaaaaw.a..w', 'kk..a.a..a..', '...a....a..w', '......a...w.', '.........w..', '............', '............', '............'],
  boomer: ['....aa......', '...awa......', '..awa.......', '..aw........', '..aw.....w..', '..awa...aw..', '...awaaawa..', '....aaaaa...', '............', '............', '............', '............'],
  sing: ['...aaaaa....', '..a.....a...', '.a..kkk..a..', 'a..kkkkk..w.', 'a..kkwkk..a.', 'a..kkkkk..a.', '.w..kkk..a..', '..a.....a...', '...aaaaa....', '............', '............', '............'],
  meteor: ['w...........', '.a..........', '..a.a.......', '...a.a......', '....aakk....', '.....kaak...', '....kawaak..', '....kaaaak..', '.....kaak...', '......kk....', '............', '............'],
  corpse: ['...kkkkk....', '..kwwwwwk...', '.kwwwwwwwk..', '.kwkkwkkwk..', '.kwkkwkkwk..', '.kwwwkwwwk..', '..kwwwwwk...', '..kwkwkwk...', '...kkkkk....', 'a....a....a.', '.a..aaa..a..', '............'],
  glass: ['.....k......', '....kwk.....', '...kwaak....', '..kwa.aak...', '.kwaa.aaak..', '..kaa.aak...', '...kaa.k....', '....kak.....', '.....k......', '............', '............', '............'],
  echo: ['............', '..aa....ww..', '.a..a..w..w.', 'a....aw....w', 'a....aw....w', '.a..a..w..w.', '..aa....ww..', '............', '............', '............', '............', '............'],
  fourth: ['.....w......', '....a.a.....', '...a...a....', '.wa..k..aw..', '...a...a....', '....a.a.....', '.....w......', '............', '............', '............', '............', '............'],
};
ICONS.wing = ['............', 'a.a.a.......', '............', '.....kk.....', '....kwak....', 'wwwwwwaaaaa.', '....kwak....', '.....kk.....', '............', 'a.a.a.......', '............', '............'];
ICONS.ray = ['............', 'kk..........', 'kwaaaaaw....', 'kk..........', '.....kk.....', '.....kwaaaaw', '.....kk.....', 'kk..........', 'kwaaaaaw....', 'kk..........', '............', '............'];
const ICON_OF = { slow: 'rate', novaN: 'nova', storm: 'multi', ruin: 'power', leech: 'vital', nfreeze: 'frost', nvortex: 'sing', ntriple: 'nova', nhome: 'home', ntime: 'rate', necho: 'echo' };
const ELEM_COL = { fire: '#ff8a3d', dashfire: '#ff8a3d', frost: '#9fe6ff', chain: '#fff27a', vital: '#ff4d6d' };
function iconCanvas(u, tier) {
  const col = ELEM_COL[u.id] || RAR[tier].col;
  const sp = spr(ICONS[u.kind === 'evo' ? spell.form : ICON_OF[u.id] || u.id], { a: col, w: '#ffffff', k: '#160f24', b: '#5a5280' });
  const [c, x] = makeCanvas(14, 14); x.drawImage(sp.c, 1, 1); return c;
}
function rollTier(bonus = 0) { const r = Math.random(), ep = .1 + diffIdx() * .02 + bonus; return r < ep ? 'epic' : r < ep + .3 ? 'rare' : 'common'; }
function rollUpgrades(count = 3, mode = 'normal') {
  const avail = UPGRADES.filter(u => (G.ups[u.id] || 0) < u.max && !(u.kind === 'form' && spell.form) && !(FORM_EXCLUDE[spell.form] || []).includes(u.id) && (!u.req || u.req()) && u.id !== 'evoB');
  const out = [];
  if (mode === 'first') {
    // the first pick of a run always offers exactly one weapon form; skipped forms keep turning up later
    const forms = avail.filter(u => u.kind === 'form');
    if (forms.length) out.push(forms[Math.floor(Math.random() * forms.length)]);
    for (let i = avail.length - 1; i >= 0; i--) if (avail[i].kind === 'form') avail.splice(i, 1);
  }
  while (out.length < count && avail.length) {
    let tot = 0; for (const u of avail) tot += u.w;
    let r = Math.random() * tot, idx = 0;
    for (let i = 0; i < avail.length; i++) { r -= avail[i].w; if (r <= 0) { idx = i; break; } }
    out.push(avail.splice(idx, 1)[0]);
  }
  // the third evolution is a fork: whenever one branch is dealt, the other one comes with it
  const ia = out.findIndex(u => u.id === 'evoA');
  if (ia >= 0) { const evB = UPGRADES.find(u => u.id === 'evoB'); if (out.length < 2) out.push(evB); else out[ia === out.length - 1 ? 0 : out.length - 1] = evB; }
  for (let i = out.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [out[i], out[j]] = [out[j], out[i]]; }
  return out.map(u => ({ u, tier: u.kind === 'stat' ? rollTier(mode === 'ghost' ? .12 : 0) : u.kind }));
}
// Runes that do nothing under a form (it already pierces everything) never show up
const FORM_EXCLUDE = { laser: ['pierce'], boomer: ['pierce'], sing: ['pierce'], meteor: ['pierce'] };
// How a rune behaves under each form, shown on the card
const FORM_NOTES = {
  laser: { echo: '每次射线必定再释放一次（满威力）', fourth: '每次射线必定再释放一次（满威力，可与回响叠加）', home: '射线自动校准瞄向附近敌人', velocity: '射线更长', rate: '蓄力更快', bounce: '射线在墙面折射', multi: '射线条数增加', storm: '射线条数翻倍', size: '射线更粗', split: '射线末端炸出碎片', explode: '被射线命中的敌人爆炸' },
  ray: { pierce: '每道射线多贯穿敌人', bounce: '射线在墙面折射', home: '射线自动校准瞄准', multi: '射线条数增加', storm: '射线条数翻倍', velocity: '射线更长', explode: '被射线击中的敌人爆炸', split: '射线末端炸出碎片' },
  wing: { multi: '两侧每次多射出星弹', storm: '两侧星弹数量翻倍', swift: '冲刺更频繁，射出更多星弹', rate: '只影响普通攻击' },
  minigun: { rate: '与 ×3 射速叠乘' },
  shotgun: { multi: '每发弹体再 ×5', storm: '每发弹体再 ×5' },
  boomer: { bounce: '撞墙后继续弹射，用完才折返', split: '每次投掷的前 3 次命中都会碎裂', explode: '每次投掷的前 4 次命中都会爆炸', home: '飞出途中追踪敌人' },
  sing: { bounce: '碰墙反弹，否则停在墙边', home: '缓慢飘向敌人', chain: '持续伤害每跳有 20% 概率触发连锁', crit: '持续伤害也能暴击', split: '消散时向四周炸出碎片', explode: '消散爆炸范围更大' },
  meteor: { bounce: '落地后弹跳再砸一次（70% 伤害）', home: '陨石自动砸向光标附近的敌人', velocity: '陨石下落更快', multi: '陨石数量增加', storm: '陨石数量翻倍', explode: '陨石爆炸范围更大', split: '落地时向四周炸出碎片' },
};
let pickLock = false, pickChoices = [], pickMode = 'normal';
const PICK_TEXT = {
  normal: ['选择一道符文', '新的力量将刻进你的法术　·　按 <kbd>1</kbd> <kbd>2</kbd> <kbd>3</kbd> 快速选择'],
  first: ['选择一道符文', '其中必定有一张武器形态，它会彻底改变施法方式　·　按 <kbd>1</kbd> <kbd>2</kbd> <kbd>3</kbd> 快速选择'],
  ult1: ['星神的铭刻', '你的大魔法已被改写　·　点击接受'],
  forms: ['选择你的武器形态', '它将彻底改变你的施法方式，之前和之后的符文都会生效　·　按 <kbd>1</kbd> <kbd>2</kbd> <kbd>3</kbd> 快速选择'],
  ult: ['最终的大魔法', '六选一　·　选择后将进入无尽的深渊回廊　·　按 <kbd>1</kbd>–<kbd>6</kbd> 快速选择'],
  ghost: ['亡魂的馈赠', '九件遗物，只能带走一件　·　滚动鼠标查看全部　·　按 <kbd>1</kbd>–<kbd>9</kbd> 快速选择'],
};
function openPick(mode) {
  pickMode = mode || ((G.level === 0 || (G.endless && G.loop === 1)) && !spell.form ? 'first' : 'normal');
  G.state = 'pick'; document.body.classList.remove('playing');
  pickChoices = [];
  $('pick').classList.toggle('grid9', pickMode === 'ghost' || pickMode === 'ult');
  $('reroll-btn').hidden = pickMode === 'ult' || pickMode === 'ult1';
  $('pick-title').textContent = PICK_TEXT[pickMode][0]; $('pick-sub').innerHTML = PICK_TEXT[pickMode][1];
  dealCards();
  showScreen('pick');
}
function dealCards() {
  if (pickMode === 'ult' || pickMode === 'ult1') { dealUltCards(); return; }
  pickChoices = rollUpgrades(pickMode === 'ghost' ? 9 : 3, pickMode === 'first' ? 'first' : pickMode); pickLock = false;
  const box = $('cards'); box.innerHTML = ''; box.scrollTop = 0;
  const stagger = pickMode === 'ghost' ? 70 : 120;
  pickChoices.forEach(({ u, tier }, i) => {
    const lv = G.ups[u.id] || 0, R = RAR[tier];
    const b = document.createElement('button');
    b.className = 'card ' + tier; b.id = 'card-' + i;
    b.innerHTML = `<span class="key">${i + 1}</span><span class="rar">${R.label}</span>`;
    b.appendChild(iconCanvas(u, tier));
    const fn = spell.form && FORM_NOTES[spell.form][u.id];
    const note = u.kind === 'form' ? '<small>替换施法方式 · 保留全部符文</small>' : u.kind === 'evo' ? `<small>${u.evoLabel}</small>` : u.kind === 'nova' ? '<small>强化右键 / E 技能</small>' : fn ? `<small class="fnote">${FORMS[spell.form].name}：${fn}</small>` : '';
    b.insertAdjacentHTML('beforeend', `<h3>${u.name}</h3><p>${u.desc(R.m, lv)}</p>${note}<div class="lv">${u.max > 1 ? Array.from({ length: u.max }, (_, k) => `<i class="${k < lv ? 'on' : k === lv ? 'new' : ''}"></i>`).join('') : ''}</div>`);
    b.addEventListener('mouseenter', () => { if (b.classList.contains('in')) sfx.hover(); });
    b.addEventListener('click', () => choose(i));
    box.appendChild(b);
    setTimeout(() => {
      b.classList.add('in'); AU.tone(500 + (i % 3) * 160 + Math.floor(i / 3) * 60, .08, 'triangle', .06);
      if (tier === 'form' || tier === 'evo' || tier === 'epic' || tier === 'nova') { AU.tone(1320, .3, 'triangle', .06, null, .05); AU.noise(.4, .05, 7000, 3000, 2); }
    }, 260 + i * stagger);
  });
  updateRerollBtn();
}
function updateRerollBtn() {
  $('reroll-n').textContent = G.rerolls;
  $('reroll-btn').disabled = G.rerolls <= 0 || pickLock;
}
function reroll() {
  if (pickLock || G.state !== 'pick' || G.rerolls <= 0) return;
  G.rerolls--; pickLock = true; updateRerollBtn();
  for (let i = 0; i < 6; i++) AU.noise(.04, .08, 3000 + i * 400, null, 3, i * .05);
  AU.tone(520, .1, 'square', .05, 780, .3);
  [...$('cards').children].forEach(el => el.classList.add('out'));
  setTimeout(dealCards, 340);
}
function choose(i) {
  if (pickLock || G.state !== 'pick') return;
  if (pickMode === 'ult' || pickMode === 'ult1') { chooseUlt(i); return; }
  const c = pickChoices[i]; if (!c) return;
  pickLock = true; updateRerollBtn();
  c.u.apply(RAR[c.tier].m); G.ups[c.u.id] = (G.ups[c.u.id] || 0) + 1; G.history.push({ id: c.u.id, m: RAR[c.tier].m });
  sfx.pick();
  [...$('cards').children].forEach((el, k) => el.classList.add(k === i ? 'picked' : 'out'));
  updateHearts();
  const mode = pickMode;
  setTimeout(() => {
    hideScreen('pick');
    if (mode === 'ghost') { G.state = 'npc'; ghostFarewell(goNextLevel); } else goNextLevel();
  }, 750);
}
function goNextLevel() {
  if (G.endless) { transition(() => startEndless(G.loop + 1)); return; }
  const next = G.level + 1;
  if (next === LEVELS.length - 1) startComic(BOSSCOMIC, () => transition(() => startLevel(next)), { hint: '按任意键迎战', key: 'boss' });
  else transition(() => startLevel(next));
}

/* ================= flow ================= */
function showScreen(id) { const el = $(id); el._want = true; el.hidden = false; void el.offsetWidth; setTimeout(() => { if (el._want) el.classList.remove('fade'); }, 20); }
function hideScreen(id) { const el = $(id); el._want = false; el.classList.add('fade'); setTimeout(() => { if (!el._want) el.hidden = true; }, 460); }
function transition(cb) { G.irisTarget = 1; G.irisCb = cb; }
let bannerTO = null;
function showBanner(t1, t2, t3, cls = '') {
  const b = $('banner');
  b.querySelector('.t1').textContent = t1; b.querySelector('.t2').textContent = t2; b.querySelector('.t3').textContent = t3;
  b.querySelector('.t3').style.display = t3 ? '' : 'none';
  b.className = ''; void b.offsetWidth; b.className = 'show ' + cls;
  clearTimeout(bannerTO); bannerTO = setTimeout(() => b.className = '', 3000);
}
function newRun() {
  player = newPlayer(); spell = newSpell();
  G.ups = {}; G.rerolls = 5; G.npc = null; G.endless = false; G.loop = 0; G.history = []; G.ult = null; G.timeStop = 0; G.lastVariant = null; G.lastElite = null; G.castN = 0; G.leechN = 0; G.totalKills = 0; G.dmg = 0; G.runT = 0; G.ts = G.tsTarget = 1; G.escapeUsed = false; G.escapeT = 0; G.leechNeed = 25;
  rollBgm(); evoReset(); updateEscapeBadge();
  startLevel(0);
  $('hints').style.opacity = 1; setTimeout(() => $('hints').style.opacity = 0, 14000);
}
function startLevel(i) {
  G.level = i;
  const L = curLevel();
  arena = buildArena(L.themeObj || THEMES[L.theme], L.w || 1000, L.h || 700, L.pillars);
  enemies = []; projs = []; eprojs = []; parts = []; fx = []; spawns = []; pickups = []; flames = []; ghosts = []; motes = []; texts = []; meteors = []; vortices = [];
  G.later = []; G.timeField = 0; player.charge = 0;
  Object.assign(player, { x: arena.w / 2, y: arena.h / 2 + 24, vx: 0, vy: 0, inv: 1.2, dead: false, dashT: 0, fireCd: 0 });
  G.kills = 0; G.levelT = 0; G.spawnAcc = 0; G.surgeT = 9; G.state = 'play'; G.boss = null; G.tsTarget = 1;
  G.ritual = null; G.cine = false; G.camFocus = null; endlessOnLevelStart(); healRunesReset(); evoReset(); ultCancel(); G.combo = 0; G.comboT = 0; G.menuScene = false;
  bubbles = []; quipT = rand(5, 8); sayCd = 0;
  later(2.4, () => maybeSay(player, QUIPS.start, .7, { force: true }));
  buildRoute();
  if (G.pendingToast) { toast(G.pendingToast[0], G.pendingToast[1], 2800); G.pendingToast = null; }
  cam.x = player.x - VW / 2; cam.y = player.y - VH / 2;
  document.body.classList.add('playing');
  $('hud').classList.add('on'); $('boss').classList.add('hide');
  const g = L.goal;
  const goal = g.type === 'kill' ? `击杀 ${g.n} 只怪物` : g.type === 'survive' ? `坚守 ${g.t} 秒` : g.type === 'elite' ? '击败精英首领' : '击败地窟的主宰';
  const newcomer = G.endless ? null : Object.keys(L.pool).find(k => !LEVELS.slice(0, i).some(l => l.pool[k]));
  if (G.endless) showBanner(`ENDLESS · ${G.loop}`, L.name, goal + (L.desc ? '　·　' + L.desc : ''));
  else showBanner(`FLOOR ${i + 1} / ${LEVELS.length}`, L.name, goal + (newcomer ? '　·　' + INTRO[newcomer] : ''));
  updateHearts();
  for (let k = 0; k < 18; k++) { const b = rand(TAU); addPart(player.x, player.y, 2, Math.cos(b) * 70, Math.sin(b) * 45, rand(20, 70), .7, ['#ffffff', '#7ae7ff', '#9b6bff'], 1, { add: true, drag: 3 }); }
  fx.push({ k: 'ring', x: player.x, y: player.y, r0: 2, r1: 40, t: 0, max: .6, col: '#7ae7ff', w: 1 });
}
function levelClear() {
  if (G.state !== 'play') return;
  G.state = 'clear'; G.clearT = 0;
  for (const e of enemies) e.purge = G.t + rand(.05, .7);
  for (const b of eprojs) { b.dead = true; addPart(b.x, b.y, 6, 0, 0, 20, .4, ['#ffffff', '#b58cff'], 1, { add: true }); }
  spawns = [];
  playClearJingle(); addShake(.3); healRunesReset();
  // endless: every 5 floors cleared grants one more reroll
  if (G.endless && G.loop % 5 === 0) { G.rerolls++; toast('刷新机会 +1', `已通过 ${G.loop} 个无尽关卡，三选一时可多刷新一次`, 1400); }
  const last = !G.endless && G.level === LEVELS.length - 1;
  ultCancel();
  if (G.ult && G.ult.id === 'star') G.ult.charge = Math.min(1, G.ult.charge + .5);
  showBanner('', last ? '深渊之眼陨落' : '净化完成', last ? '' : '中央的法阵正在回应你的魔力', 'clear');
  G.tsTarget = .4; setTimeout(() => { G.tsTarget = 1; }, 500);
  setTimeout(() => {
    if (player.hp < player.maxHp && canHeal()) { player.hp++; updateHearts(true); addText(player.x, player.y - 22, '+1', '#ff8aa0', 1.2); sfx.heart(); }
  }, 900);
  startRitual(last);
}
function playerDie() {
  const p = player; p.dead = true; G.state = 'dead'; G.tsTarget = .25; addShake(1, true);
  for (let i = 0; i < 50; i++) { const b = rand(TAU), s = rand(30, 160); addPart(p.x, p.y - 6, 6, Math.cos(b) * s, Math.sin(b) * s, rand(40, 140), rand(.6, 1.4), ['#ffffff', '#7ae7ff', '#5d84f0', '#5a36a0'], rand(1, 2), { g: 200, drag: 1.5 }); }
  fx.push({ k: 'ring', x: p.x, y: p.y, r0: 2, r1: 80, t: 0, max: .8, col: '#ffffff', w: 2 });
  AU.tone(400, 1.2, 'triangle', .14, 60);
  setTimeout(() => endRun(false), 1700);
}
function endRun(win) {
  healRunesReset();
  G.state = win ? 'win' : 'over'; G.tsTarget = 1;
  document.body.classList.remove('playing');
  $('hud').classList.remove('on');
  $('over-title').textContent = win ? '星尘归位' : '倒在了山谷';
  const m = Math.floor(G.runT / 60), s = Math.floor(G.runT % 60);
  $('over-stats').innerHTML = `<span>抵达层数</span><b>${G.endless ? '无尽 ' + G.loop : (G.level + 1) + ' / ' + LEVELS.length}</b><span>击杀数</span><b>${G.totalKills}</b><span>总伤害</span><b>${Math.round(G.dmg)}</b><span>用时</span><b>${m}:${String(s).padStart(2, '0')}</b>`;
  $('over-build').innerHTML = Object.keys(G.ups).map(id => { const u = UPGRADES.find(x => x.id === id); return `<span>${u.name}${G.ups[id] > 1 ? ' ×' + G.ups[id] : ''}</span>`; }).join('') || '<span>未获得符文</span>';
  const box = document.querySelector('.over-box'); box.style.animation = 'none'; void box.offsetWidth; box.style.animation = '';
  showScreen('over');
  if (win) [523, 659, 784, 1046, 784, 1046, 1318].forEach((f, i) => AU.tone(f, .4, 'triangle', .1, null, i * .14));
}
function toMenu() {
  G.state = 'menu'; G.paused = false; G.menuScene = true; if (G.booted) { healRunesReset(); rollBgm('title'); }
  player = newPlayer(); spell = newSpell();
  arena = buildArena(THEMES[0], 720, 480, 6);
  enemies = []; projs = []; eprojs = []; parts = []; fx = []; spawns = []; pickups = []; flames = []; ghosts = []; motes = []; texts = [];
  player.x = arena.w / 2; player.y = arena.h / 2 + 10;
  document.body.classList.remove('playing'); $('hud').classList.remove('on');
  showScreen('menu');
}
function setPause(on) {
  if (on && G.state !== 'play' && G.state !== 'clear') return;
  G.paused = on; if (on) { renderBuildList(); showScreen('pause'); document.body.classList.remove('playing'); } else { hideScreen('pause'); document.body.classList.add('playing'); }
}

/* ================= HUD ================= */
let heartImgs = null, lastHearts = '';
function updateHearts(pop) {
  if (!player) return;
  if (!heartImgs) heartImgs = [heartURL(true), heartURL(false)];
  const box = $('hearts');
  const key = player.hp + '/' + player.maxHp;
  if (key === lastHearts) return;
  const prev = lastHearts ? +lastHearts.split('/')[0] : player.hp;
  lastHearts = key;
  while (box.children.length < player.maxHp) { const im = document.createElement('img'); im.alt = ''; box.appendChild(im); }
  while (box.children.length > player.maxHp) box.lastChild.remove();
  [...box.children].forEach((im, i) => {
    const full = i < player.hp;
    im.src = heartImgs[full ? 0 : 1]; im.classList.toggle('lost', !full);
    if (pop && ((i === player.hp && prev > player.hp) || (i === player.hp - 1 && prev < player.hp))) { im.classList.add('pop'); setTimeout(() => im.classList.remove('pop'), 180); }
  });
}
let hudCache = {};
function setText(id, v) { if (hudCache[id] !== v) { hudCache[id] = v; $(id).innerHTML = v; } }
function setStyle(el, prop, v) { const k = el.id + prop; if (hudCache[k] !== v) { hudCache[k] = v; el.style.setProperty(prop, v); } }
/* ================= camera + loop ================= */
function updateCamera(dt) {
  let tx, ty;
  if (G.camFocus) { tx = G.camFocus.x - VW / 2; ty = G.camFocus.y - VH / 2; }
  else if (G.state === 'menu' || G.state === 'comic') { tx = arena.w / 2 + Math.sin(G.t * .15) * 60 - VW / 2; ty = arena.h / 2 + Math.cos(G.t * .11) * 30 - VH / 2 - 10; }
  else {
    const lead = player.dead ? 0 : .18;
    tx = player.x + (mouse.wx - player.x) * lead - VW / 2; ty = player.y - 8 + (mouse.wy - player.y) * lead - VH / 2;
  }
  const fit = (t, size, view, lo, hi) => size + lo + hi > view ? clamp(t, -lo, size + hi - view) : size / 2 - view / 2;
  tx = fit(tx, arena.w, VW, 60, 60); ty = fit(ty, arena.h, VH, 80, 56);
  const ck = G.state === 'menu' || G.state === 'comic' ? 2 : G.ritual ? 3.2 : 7;
  cam.x = damp(cam.x, tx, ck, dt); cam.y = damp(cam.y, ty, ck, dt);
  cam.kx = damp(cam.kx, 0, 12, dt); cam.ky = damp(cam.ky, 0, 12, dt);
  cam.shake = Math.max(0, cam.shake - dt * 2.4);
  cam.load *= Math.exp(-2.2 * dt);
  mouse.wx = cam.x + mouse.x / S; mouse.wy = cam.y + mouse.y / S;
}
function step(dt) {
  G.t += dt;
  if (G.state === 'menu' || G.state === 'comic') { updateParts(dt); player.staffA += dt * .6; return; }
  if (G.state === 'clear') updateRitual(dt);
  if (G.npc) updateNpc(dt);
  updateDialog(dt);
  if (G.state === 'play' || G.state === 'clear' || G.state === 'dead' || G.state === 'npc') updatePlayer(dt);
  if (G.state === 'play') { if (!(G.timeStop > 0)) levelUpdate(dt); G.runT += dt; updateCombo(dt); ultUpdate(dt); updateStrikes(dt); updateHealRunes(dt); updateEvo(dt); }
  if (G.later.length) { for (const l of G.later) l.t -= dt; const due = G.later.filter(l => l.t <= 0); G.later = G.later.filter(l => l.t > 0); for (const l of due) l.fn(); }
  G.timeField = Math.max(0, G.timeField - dt);
  updateMeteors(dt); updateVortices(dt);
  updateSpawns(dt); updateEnemies(dt); updateProjs(dt); updateEprojs(dt); updatePickups(dt); updateParts(dt); updateBubbles(dt);
}
let last = performance.now();
function frame(now) {
  requestAnimationFrame(frame);
  const rdt = Math.min(.05, (now - last) / 1000); last = now;
  G.ts = damp(G.ts, G.tsTarget, 7, rdt);
  if (G.iris !== G.irisTarget) {
    const s = rdt / .5;
    G.iris = G.iris < G.irisTarget ? Math.min(G.irisTarget, G.iris + s) : Math.max(G.irisTarget, G.iris - s);
    if (G.iris >= 1 && G.irisCb) { const cb = G.irisCb; G.irisCb = null; cb(); G.irisTarget = 0; }
  }
  if (!G.paused) {
    if (pressed.has('m') && !keyPromptOwns('m')) AU.setMuted(!AU.muted);
    if (G.state === 'pick') { for (let k = 1; k <= 9; k++) if (pressed.has(String(k))) choose(k - 1); if (pressed.has('r')) reroll(); }
    if (dlg && pressed.size) dialogInput();
    if (G.state === 'comic') { if (pressed.size) comicInput(); updateComic(rdt); }
    if (G.hitstop > 0) G.hitstop -= rdt; else step(rdt * G.ts);
    updateCamera(rdt);
  }
  if (pressed.has('escape')) setPause(!G.paused);
  bgmUpdate();
  render(); updateHUD();
  pressed.clear();
}

/* ================= boot ================= */
$('start-btn').addEventListener('click', () => { AU.unlock(); sfx.pick(); hideScreen('menu'); playIntro(); });
function playIntro() { startComic(COMIC, () => transition(newRun), { hint: '按任意键开始游戏', key: 'intro' }); }
$('again-btn').addEventListener('click', () => { AU.unlock(); hideScreen('over'); transition(() => { toMenu(); hideScreen('menu'); playIntro(); }); });
$('resume-btn').addEventListener('click', () => setPause(false));
$('pause-btn').addEventListener('click', () => setPause(true));
$('quit-btn').addEventListener('click', () => { hideScreen('pause'); G.paused = false; transition(() => { hideScreen('over'); toMenu(); }); });
$('mute').addEventListener('click', () => { AU.unlock(); AU.setMuted(!AU.muted); });
addEventListener('resize', resize);
buildSprites(); buildBossArt();
resize();
toMenu();
requestAnimationFrame(t => { last = t; requestAnimationFrame(frame); });
