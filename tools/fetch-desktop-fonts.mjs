// Steam pipeline: packs Google's two title fonts (Cinzel, Cinzel Decorative -- SIL Open Font License) into the desktop app,
// so even a first launch with no internet shows them. Run once (Matt OK'd it 2026-10-06); the files are committed in desktop/fonts/
// and build-desktop.sh copies them in. Each file is stored under the sha1 of the exact address the page asks for -- the same
// key desktop/main.js uses -- as <key>.bin + <key>.type.   node tools/fetch-desktop-fonts.mjs
import fs from 'fs'; import crypto from 'crypto'; import { fileURLToPath } from 'url';
const OUT = fileURLToPath(new URL('../desktop/fonts/', import.meta.url));
const CSS = ['https://fonts.googleapis.com/css2?family=Cinzel+Decorative:wght@700&display=swap',
             'https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700;800&display=swap'];
// the stylesheet Google sends depends on the browser; ask as the app's own Chromium does, so it lists .woff2 files
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36';
fs.mkdirSync(OUT, { recursive:true });
const key = u => crypto.createHash('sha1').update(u).digest('hex');
let n = 0, bytes = 0;
async function keep(u){
  const r = await fetch(u, { headers:{ 'user-agent':UA } }); if (!r.ok) throw new Error(u + ' -> ' + r.status);
  const buf = Buffer.from(await r.arrayBuffer()), k = key(u);
  fs.writeFileSync(OUT + k + '.bin', buf); fs.writeFileSync(OUT + k + '.type', r.headers.get('content-type') || 'application/octet-stream');
  n++; bytes += buf.length; return buf;
}
for (const c of CSS) {
  const css = (await keep(c)).toString('utf8');
  for (const m of css.matchAll(/url\((https:\/\/fonts\.gstatic\.com\/[^)]+)\)/g)) await keep(m[1]);
}
console.log(`packed ${n} files, ${(bytes / 1024).toFixed(0)} KB, into desktop/fonts/`);
