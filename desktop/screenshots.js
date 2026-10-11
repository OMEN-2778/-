// Takes the README screenshots: loads the built game off-screen, drives it into a few
// representative moments and saves PNGs to ../docs/screenshots.
//   node_modules/electron/dist/electron screenshots.js          all scenes
//   node_modules/electron/dist/electron screenshots.js 03 08    only these
// Action scenes save three frames (-a/-b/-c) a second apart; keep the cleanest one.
const { app, BrowserWindow } = require('electron');
const fs = require('fs');
const path = require('path');

const out = path.join(__dirname, '..', 'docs', 'screenshots');
const only = process.argv.slice(2).filter(a => /^\d\d$/.test(a));
const want = id => !only.length || only.includes(id);
const wait = ms => new Promise(r => setTimeout(r, ms));
app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');

app.whenReady().then(async () => {
  fs.mkdirSync(out, { recursive: true });
  const win = new BrowserWindow({ width: 1280, height: 720, useContentSize: true, show: false, webPreferences: { offscreen: true, backgroundThrottling: false } });
  win.webContents.setFrameRate(60);
  win.webContents.setAudioMuted(true);
  await win.loadFile(path.join(__dirname, 'app', 'index.html'));
  const js = code => win.webContents.executeJavaScript(`try { ${code} } catch (e) { console.log('PAGE ERROR', e.message, e.stack); } 0`, true).catch(e => console.log('JS ERROR', e.message));
  const shot = async name => { const img = await win.webContents.capturePage(); fs.writeFileSync(path.join(out, name + '.png'), img.toPNG()); console.log('saved', name); };
  const burst = async name => { for (const k of 'abc') { await shot(name + '-' + k); await wait(1100); } };
  // a build made of picks, applied the same way the game applies them
  const build = ids => `G.history = ${JSON.stringify(ids.map(x => (Array.isArray(x) ? { id: x[0], m: x[1] } : { id: x, m: 1 })))}; rebuildBuild(); player.hp = player.maxHp;`;
  // start a run and let a small bot aim at the nearest enemy and hold fire
  const begin = `hideScreen('menu'); hideScreen('pick'); hideScreen('pause'); G.paused = false; newRun(); G.pendingToast = null; window.__near = false;
    clearInterval(window.__bot); window.__bot = setInterval(() => {
      if (G.state !== 'play') { mouse.down = false; return; }
      const e = enemies.filter(e => !e.dead && e.spawnT >= 1).sort((a, b) => dist(a, player) - dist(b, player))[0];
      if (e) { mouse.x = (e.x - cam.x) * S; mouse.y = (e.y - 6 - cam.y) * S; }
      mouse.down = true; player.inv = Math.max(player.inv, .3);
      // boss and elite scenes: stand where the big one is in frame
      const big = window.__near && enemies.find(e => !e.dead && (e.type === 'boss' || e.elite));
      if (big) { player.x = clamp(big.x - 85, 20, arena.w - 20); player.y = clamp(big.y + 62, 30, arena.h - 20); player.vx = player.vy = 0; }
    }, 40);`;

  if (want('01')) { await wait(3500); await shot('01-title'); }

  if (want('02')) {   // floor 3 with a colourful rune build
    await js(`${begin} startLevel(2); ${build(['multi', 'chain', 'fire', 'pierce', ['orbit', 2.2], 'crit', 'rate', 'leech', 'halo'])} player.hp = 5; updateHearts(); G.leechN = 17;`);
    await wait(8000); await burst('02-combat');
  }
  if (want('03')) {   // an evolved form that plays differently: 星屑漩涡
    await js(`${begin} startLevel(4); ${build(['minigun', 'evo1', 'evo2', 'evoB', 'multi', 'frost', 'pierce', 'still'])} player.hp = 4; updateHearts();`);
    await wait(7000); await burst('03-evolved');
  }
  if (want('04')) {   // the level-3 fork on the rune screen
    await js(`${begin} startLevel(5); ${build(['laser', 'evo1', 'evo2', 'power', 'rate'])}
      { const orig = rollUpgrades; let n = 0; rollUpgrades = (c, m) => { let r; do { r = orig(c, m); } while (!r.some(x => x.u.id === 'evoA') && ++n < 800); return r; }; openPick('normal'); rollUpgrades = orig; }`);
    await wait(2200); await shot('04-evolve-cards');
  }
  if (want('05') || want('06') || want('07')) {   // boss, then the pause menu and the great magics on top of it
    await js(`${begin} ${build(['laser', 'evo1', 'evo2', 'evoA', ['power', 2.2], 'multi', 'chain', 'crit', 'vital', 'swift', 'ntriple', 'rush', 'keys'])} startLevel(7); window.__near = true;`);
    await wait(8500); if (want('05')) await burst('05-boss');
    await js(`G.ult = makeUlt('moon'); setPause(true);`);
    await wait(1200); if (want('06')) await shot('06-pause');
    await js(`setPause(false); hideScreen('pause'); openPick('ult');`);
    await wait(2600); if (want('07')) await shot('07-great-magic');
  }
  if (want('08')) {   // endless corridor: an elite floor (the elite gets extra health so it survives the photo)
    await js(`${begin} ${build(['ray', 'evo1', 'evo2', 'evoB', 'multi', 'fire', 'rate'])} G.ult = makeUlt('phantom'); startEndless(3); window.__near = true;`);
    await wait(3500);
    await js(`for (const e of enemies) if (e.elite) { e.maxHp *= 40; e.hp = e.maxHp * .72; }`);
    await wait(6500); await burst('08-endless-elite');
  }
  app.quit();
}).catch(e => { console.log('FATAL', e); app.quit(); });
