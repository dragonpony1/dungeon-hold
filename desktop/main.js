/* Rootgate desktop shell (Steam pipeline, phase 1 -- see STEAM-PIPELINE-CHECKLIST.md).
   One window around the game. The page is loaded from the game's real address, https://rootgate.52bulls.workers.dev/,
   but every request for that address is answered from the files packed inside the app (game/), so it plays with no
   internet and the game's own code -- co-op, the hideout, share links, the music -- behaves exactly as on the website,
   with no desktop-only branches in it. Everything else (the co-op broker and relay, the hideout's shared gear) goes out
   to the network as usual; Google's fonts and the trailer's player script are kept in a small cache once seen so
   they are there next time offline too.
   Saves (the page's localStorage) live in %APPDATA%\Rootgate, outside the install folder, so updates never touch them.
   /api/* (the website's who-played log) is answered here and never posted from the app. */
'use strict';
const { app, BrowserWindow, Menu, protocol, net, shell, session } = require('electron');
const path = require('path'), fs = require('fs'), crypto = require('crypto');

const HOST = 'rootgate.52bulls.workers.dev';
const START = 'https://' + HOST + '/';
const GAME = path.join(__dirname, 'game');
const CACHED_HOSTS = new Set(['fonts.googleapis.com', 'fonts.gstatic.com', 'cdn.jsdelivr.net']);

app.setName('Rootgate');
// test switches (tools/desktop-test.mjs): --profile=<dir> keeps a test save apart from the player's; --net=off answers every outside
// address with a network error (no internet), --net=safe lets only the font/script GETs out -- tests never reach the live services
const ARG = k => (process.argv.find(a => a.startsWith('--' + k + '=')) || '').slice(k.length + 3);
if (ARG('profile')) app.setPath('userData', ARG('profile'));
const NET = ARG('net');
app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');

const MIME = { '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.mjs':'text/javascript; charset=utf-8',
  '.css':'text/css; charset=utf-8', '.json':'application/json', '.txt':'text/plain; charset=utf-8',
  '.png':'image/png', '.jpg':'image/jpeg', '.jpeg':'image/jpeg', '.webp':'image/webp', '.gif':'image/gif', '.svg':'image/svg+xml', '.ico':'image/x-icon',
  '.mp3':'audio/mpeg', '.ogg':'audio/ogg', '.wav':'audio/wav', '.m4a':'audio/mp4',
  '.mp4':'video/mp4', '.m4s':'video/iso.segment', '.webm':'video/webm', '.m3u8':'application/vnd.apple.mpegurl',
  '.glb':'model/gltf-binary', '.gltf':'model/gltf+json', '.bin':'application/octet-stream', '.wasm':'application/wasm',
  '.woff':'font/woff', '.woff2':'font/woff2', '.ttf':'font/ttf' };

function notFound(){ return new Response('not found', { status:404, headers:{ 'content-type':'text/plain' } }); }

// a file from game/, with Range support (the cinematics and trailer videos seek)
function serveFile(req, u){
  let rel = decodeURIComponent(u.pathname);
  if (rel.endsWith('/')) rel += 'index.html';
  const file = path.normalize(path.join(GAME, rel));
  if (!file.startsWith(GAME + path.sep)) return notFound();
  let st; try { st = fs.statSync(file); } catch (e) { return notFound(); }
  if (st.isDirectory()) return Response.redirect(START.slice(0, -1) + rel + '/' + u.search, 301);
  const type = MIME[path.extname(file).toLowerCase()] || 'application/octet-stream';
  const size = st.size, range = req.headers.get('range');
  const m = range && /^bytes=(\d*)-(\d*)$/.exec(range.trim());
  if (m && (m[1] || m[2])) {
    let a, b;
    if (m[1] === '') { a = Math.max(0, size - (+m[2])); b = size - 1; }
    else { a = +m[1]; b = m[2] === '' ? size - 1 : Math.min(+m[2], size - 1); }
    if (a > b || a >= size) return new Response(null, { status:416, headers:{ 'content-range':'bytes */' + size } });
    return new Response(streamOf(file, a, b), { status:206, headers:{ 'content-type':type, 'content-length':String(b - a + 1),
      'content-range':`bytes ${a}-${b}/${size}`, 'accept-ranges':'bytes', 'cache-control':'no-cache' } });
  }
  return new Response(streamOf(file, 0, size - 1), { status:200, headers:{ 'content-type':type, 'content-length':String(size),
    'accept-ranges':'bytes', 'cache-control':'no-cache' } });
}
function streamOf(file, a, b){
  if (b < a) return new Uint8Array(0);
  const rs = fs.createReadStream(file, { start:a, end:b });
  return new ReadableStream({
    start(c){ rs.on('data', d => c.enqueue(new Uint8Array(d))); rs.on('end', () => c.close()); rs.on('error', e => c.error(e)); },
    cancel(){ rs.destroy(); }
  });
}

// fonts / the trailer's player script: network first, kept on disk, the copy used when offline
let CACHE = null;
async function cached(req){
  const key = crypto.createHash('sha1').update(req.url).digest('hex'), f = path.join(CACHE, key), meta = f + '.type';
  try {
    const r = await net.fetch(req.url, { bypassCustomProtocolHandlers:true });
    if (r.ok) {
      const buf = Buffer.from(await r.arrayBuffer()), type = r.headers.get('content-type') || 'application/octet-stream';
      try { fs.writeFileSync(f, buf); fs.writeFileSync(meta, type); } catch (e) {}
      return new Response(buf, { status:200, headers:{ 'content-type':type, 'access-control-allow-origin':'*' } });
    }
  } catch (e) {}
  try { return new Response(fs.readFileSync(f), { status:200, headers:{ 'content-type':fs.readFileSync(meta, 'utf8'), 'access-control-allow-origin':'*' } }); }
  catch (e) { return new Response('offline', { status:503 }); }
}


function createWindow(){
  const win = new BrowserWindow({
    width:1600, height:900, minWidth:1024, minHeight:640, show:false,
    backgroundColor:'#0b0a0c', autoHideMenuBar:true, title:'Rootgate',
    icon:path.join(__dirname, 'icon.png'),
    webPreferences:{ contextIsolation:true, nodeIntegration:false, backgroundThrottling:false }
  });
  Menu.setApplicationMenu(null);
  win.once('ready-to-show', () => { win.maximize(); win.show(); });
  // links meant for a browser (Discord, the website, share pages) open in the player's real browser
  win.webContents.setWindowOpenHandler(({ url }) => { if (/^https?:/i.test(url)) shell.openExternal(url); return { action:'deny' }; });
  win.webContents.on('will-navigate', (e, url) => { try { if (new URL(url).host !== HOST) { e.preventDefault(); shell.openExternal(url); } } catch (er) { e.preventDefault(); } });
  // F11 = full screen; Ctrl+Shift+I = developer tools only when started with --dev
  win.webContents.on('before-input-event', (e, inp) => {
    if (inp.type !== 'keyDown') return;
    if (inp.key === 'F11') { win.setFullScreen(!win.isFullScreen()); e.preventDefault(); }
    if (DEV && inp.control && inp.shift && inp.key.toLowerCase() === 'i') { win.webContents.toggleDevTools(); e.preventDefault(); }
  });
  win.loadURL(START + (EXTRA_QS ? '?' + EXTRA_QS : ''));
  return win;
}

const DEV = process.argv.includes('--dev');
const EXTRA_QS = ARG('qs');

app.whenReady().then(() => {
  CACHE = path.join(app.getPath('userData'), 'netcache'); try { fs.mkdirSync(CACHE, { recursive:true }); } catch (e) {}
  session.defaultSession.protocol.handle('https', req => {
    let u; try { u = new URL(req.url); } catch (e) { return notFound(); }
    if (u.host === HOST) {
      if (u.pathname.startsWith('/api/')) return new Response(null, { status:204 });
      if (req.method !== 'GET' && req.method !== 'HEAD') return new Response(null, { status:405 });
      return serveFile(req, u);
    }
    if (NET === 'off') return Response.error();
    if (req.method === 'GET' && CACHED_HOSTS.has(u.host)) return cached(req);
    if (NET === 'safe') return Response.error();
    return net.fetch(req, { bypassCustomProtocolHandlers:true });
  });
  createWindow();
});
app.on('window-all-closed', () => app.quit());
