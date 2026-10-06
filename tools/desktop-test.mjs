// Steam pipeline phase 1: drives the packed Windows app (../rootgate-desktop/Rootgate-win32-x64/Rootgate.exe, from tools/build-desktop.sh).
// Run 1 (--net=safe: only the font/player-script GETs reach the internet, never the live services) on a fresh test profile:
// the game comes up at its real address from the packed files, title music without a click, PLAY, a wave, the hideout files,
// video byte ranges, /api answered at home. Run 2 on the SAME profile with the internet cut (--net=off): the save from run 1 is
// still there, the game still loads and plays, the fonts come from the app's cache.
//   node tools/desktop-test.mjs
import { _electron as electron } from 'playwright'; import fs from 'fs'; import os from 'os'; import path from 'path'; import { fileURLToPath } from 'url';
const EXE = path.resolve(process.env.EXE || fileURLToPath(new URL('../../rootgate-desktop/Rootgate-win32-x64/Rootgate.exe', import.meta.url)));
const PROFILE = fs.mkdtempSync(path.join(os.tmpdir(), 'rootgate-desktop-test-'));
const SHOTS = process.env.SHOTS || '';
const results = []; const check = (n, ok, d) => { results.push(!!ok); console.log((ok ? 'PASS ' : 'FAIL ') + n + (d ? '  -> ' + d : '')); };
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function launch(net){
  const app = await electron.launch({ executablePath:EXE, args:['--profile=' + PROFILE, '--net=' + net], timeout:60000 });
  const page = await app.firstWindow(); const errors = [];
  page.on('pageerror', e => errors.push(String(e && e.message || e)));
  await page.waitForFunction(() => window.__dd && window.__dd.heroModel && window.__dd.heroModel() && window.__mus, null, { timeout:90000 });
  return { app, page, errors };
}

// ---- run 1: online (safe), fresh profile
{
  const { app, page, errors } = await launch('safe');
  const info = await page.evaluate(async () => ({ href:location.href, build:+(((await (await fetch('/')).text()).match(/const BUILD=([0-9]+)/)||[])[1]),
    standalone:(() => { const s = document.getElementById('standalone'); return s ? getComputedStyle(s).display : 'none'; })() }));
  check('the app opens the game at its real address, from the packed files', info.href.startsWith('https://rootgate.52bulls.workers.dev/'), info.href);
  check('it is the current build', info.build === +fs.readFileSync(new URL('../parts/game.js', import.meta.url), 'utf8').match(/const BUILD=(\d+)/)[1], 'BUILD ' + info.build);
  check('the "standalone web build" note stays hidden, as on the website', info.standalone === 'none', info.standalone);
  const userData = await app.evaluate(({ app }) => app.getPath('userData'));
  check('saves live in the profile folder, outside the install folder', path.resolve(userData) === path.resolve(PROFILE) && !path.resolve(userData).startsWith(path.dirname(EXE)), userData);
  const net = await page.evaluate(async () => {
    const r = await fetch('/assets/cine-tavern.mp4', { headers:{ Range:'bytes=0-99' } }); const b = await r.arrayBuffer();
    const api = await fetch('/api/play', { method:'POST', body:'{}' });
    const ho = await fetch('/hideout/'); const hv = await fetch('/hideout/vendor/three.min.js', { method:'HEAD' });
    const miss = await fetch('/assets/no-such-file.glb');
    return { range:r.status, len:b.byteLength, cr:r.headers.get('content-range'), api:api.status, hideout:ho.status, hideoutHtml:(await ho.text()).length, vendor:hv.status, miss:miss.status };
  });
  check('videos answer byte ranges (the cinematics can seek)', net.range === 206 && net.len === 100 && /^bytes 0-99\/\d+$/.test(net.cr || ''), JSON.stringify(net));
  check('the who-played log is answered inside the app, never posted', net.api === 204, 'status ' + net.api);
  check('the hideout is packed in', net.hideout === 200 && net.hideoutHtml > 1000 && net.vendor === 200, JSON.stringify(net));
  check('a missing file is a plain 404', net.miss === 404, 'status ' + net.miss);
  let fonts = false; for (let i = 0; i < 40 && !fonts; i++) { fonts = await page.evaluate(() => document.fonts.check('700 24px "Cinzel Decorative"')); if (!fonts) await sleep(250); }
  check('the title font loads', fonts);
  let mus = null; for (let i = 0; i < 60; i++) { mus = await page.evaluate(() => window.__mus.state()); if (mus.playing && mus.track === 'title') break; await sleep(250); }
  check('title music starts on its own, no click needed', mus.playing && mus.track === 'title' && mus.ctx === 'running', JSON.stringify({ playing:mus.playing, track:mus.track, ctx:mus.ctx }));
  if (SHOTS) await page.screenshot({ path:path.join(SHOTS, 'desktop-title.png') });
  await page.evaluate(() => { try { localStorage.setItem('dd_cine_seen', JSON.stringify(['prologue','tavern','garden','feast','castle','lantern','torchline','ending'])); } catch (e) {} });
  await page.click('#playbtn');
  await page.waitForFunction(() => window.__dd.S.phase === 'build', null, { timeout:30000 }).catch(() => {});
  const w = await page.evaluate(async () => { const d = window.__dd; d.startWave(); for (let i = 0; i < 30; i++) { d.step(1/60, 10); await new Promise(r => setTimeout(r, 30)); } return { phase:d.S.phase, wave:d.S.wave, enemies:d.enemies.length }; });
  check('PLAY works and a wave runs', w.phase === 'wave' && w.enemies > 0, JSON.stringify(w));
  if (SHOTS) { await sleep(1500); await page.screenshot({ path:path.join(SHOTS, 'desktop-wave.png') }); }
  await page.evaluate(() => { localStorage.setItem('rootgate_desktop_test', 'kept-' + 42); });
  const real = errors.filter(e => !/Failed to fetch|NetworkError|net::/i.test(e));
  check('no page errors (online)', real.length === 0, real.slice(0, 3).join(' | '));
  await app.close();
}

// ---- run 2: no internet, same profile
{
  const { app, page, errors } = await launch('off');
  const kept = await page.evaluate(() => localStorage.getItem('rootgate_desktop_test'));
  check('the save survives closing and reopening the app', kept === 'kept-42', String(kept));
  const fonts = await page.evaluate(async () => { await document.fonts.ready; for (let i = 0; i < 20 && !document.fonts.check('700 24px "Cinzel Decorative"'); i++) await new Promise(r => setTimeout(r, 250)); return document.fonts.check('700 24px "Cinzel Decorative"'); });
  check('offline: the title font comes from the app\'s own cache', fonts);
  await page.click('#playbtn');
  await page.waitForFunction(() => window.__dd.S.phase === 'build', null, { timeout:30000 }).catch(() => {});
  const w = await page.evaluate(async () => { const d = window.__dd; d.startWave(); for (let i = 0; i < 30; i++) { d.step(1/60, 10); await new Promise(r => setTimeout(r, 30)); } return { phase:d.S.phase, enemies:d.enemies.length, heroModel:!!d.heroModel() }; });
  check('offline: the game loads, PLAY works and a wave runs', w.phase === 'wave' && w.enemies > 0 && w.heroModel, JSON.stringify(w));
  const real = errors.filter(e => !/Failed to fetch|NetworkError|net::|Load failed/i.test(e));
  check('offline: no page errors besides the network being down', real.length === 0, real.slice(0, 3).join(' | '));
  await app.close();
}
try { fs.rmSync(PROFILE, { recursive:true, force:true }); } catch (e) {}
console.log(results.filter(Boolean).length + '/' + results.length + ' passed');
process.exit(results.every(Boolean) ? 0 : 1);
