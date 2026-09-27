// Pictures of the code-built set weapons, for designing them without a person at the screen.
//   node tools/weapon-shot.mjs --set storm --file parts/staging/86e-storm.js --out shots/ [--port 8961] [--dist dist-weapons]
//   node tools/weapon-shot.mjs --lineup chaos,necrotic,fire,void --out shots/        (just the product sheet for those sets)
// Serves the built game (default ./dist), opens it headless on the graphics card, injects the --file scripts after load
// (so a set file being worked on can be tried against a build that doesn't have it yet — its addSet overwrites any
// older copy), then writes:
//   <out>/<set>-bench.png  each weapon (sword, staff, polearm, bow) front-on and side-on, lit like the hall, on grey
//   <out>/<set>-hands.png  the Knight holding the sword and the polearm, the Witch the staff, the Troll the bow (idle)
// Errors on the page are printed; the exit code is 1 if a weapon failed to build or mount.
import { chromium } from "playwright"; import { serve } from "../serve.mjs"; import fs from "fs"; import path from "path";
const ROOT = path.resolve(path.dirname(decodeURIComponent(new URL(import.meta.url).pathname).replace(/^\/(?=[A-Za-z]:)/, "")), "..");
const A = process.argv.slice(2); const opt = (k, d) => { const i = A.indexOf("--" + k); return i >= 0 ? A[i + 1] : d; }; const opts = k => A.flatMap((a, i) => a === "--" + k ? [A[i + 1]] : []);
const sets = (opt("set") || opt("lineup") || "").split(",").filter(Boolean); const lineup = !!opt("lineup");
const files = opts("file").map(f => path.resolve(ROOT, f)); const out = path.resolve(ROOT, opt("out", "shots")); const port = +opt("port", 8960);
const dist = path.resolve(ROOT, opt("dist", "dist")); const handsOnly = A.includes("--hands-only"), benchOnly = A.includes("--bench-only") || lineup;
if (!sets.length) { console.log("usage: --set <key> [--file f.js] [--out dir]  or  --lineup k1,k2,..."); process.exit(2); }
fs.mkdirSync(out, { recursive: true });
const server = await serve(port, { dist });
const browser = await chromium.launch({ args: ["--use-angle=d3d11", "--enable-gpu", "--ignore-gpu-blocklist"] });
let bad = 0;
const HELPER = `window.__shot=(()=>{
  const V=(x,y,z)=>new THREE.Vector3(x,y,z);
  function sized(W,H){ const R=__dd.renderer; const s=R.getSize(new THREE.Vector2()), pr=R.getPixelRatio(); R.setPixelRatio(1); R.setSize(W,H,false); return ()=>{ R.setPixelRatio(pr); R.setSize(s.x,s.y,false); }; }
  function studio(){ const sc=new THREE.Scene(); sc.background=new THREE.Color(0x3a3f48); let n=0;
    __dd.scene.traverse(o=>{ if(o.isHemisphereLight||o.isAmbientLight){ sc.add(o.clone()); n++; } else if(o.isDirectionalLight){ const c=o.clone(); const d=o.getWorldPosition(V(0,0,0)).sub(o.target.getWorldPosition(V(0,0,0))); if(d.lengthSq()<1e-6) d.set(1,2,1.5); c.position.copy(d.normalize().multiplyScalar(10)); c.castShadow=false; sc.add(c); n++; } });
    if(!n){ sc.add(new THREE.HemisphereLight(0xffffff,0x444444,.9)); const d=new THREE.DirectionalLight(0xffffff,.8); d.position.set(3,6,5); sc.add(d); }
    const key=new THREE.DirectionalLight(0xffffff,.35); key.position.set(-2,3,6); sc.add(key); return sc; }
  const model=name=>new Promise(res=>{ let done=false; setTimeout(()=>{ if(!done) res(null); },4000); window.__weapons.model(name,o=>{ done=true; res(o); }); });
  async function product(names,W,H){ const restore=sized(W,H); const R=__dd.renderer; const views=[0,Math.PI/2];
    const cv=document.createElement('canvas'); cv.width=W*views.length*names.length; cv.height=H+26; const g=cv.getContext('2d'); g.fillStyle='#1d2026'; g.fillRect(0,0,cv.width,cv.height);
    const missing=[]; let col=0;
    for(const name of names){ const obj=await model(name); if(!obj){ missing.push(name); col+=views.length; continue; }
      window.__setweapons.kit.g.outline(obj); const box=new THREE.Box3().setFromObject(obj); const c=box.getCenter(V(0,0,0)), sz=box.getSize(V(0,0,0));
      const sc=studio(); sc.add(obj); const cam=new THREE.PerspectiveCamera(28,W/H,.01,50); const h=Math.max(sz.y,sz.x*H/W,sz.z*H/W)*1.12; const d=h/2/Math.tan(28/2*Math.PI/180);
      for(const ry of views){ obj.rotation.y=ry; obj.updateMatrixWorld(true); const b2=new THREE.Box3().setFromObject(obj), c2=b2.getCenter(V(0,0,0)); cam.position.set(c2.x,c2.y,c2.z+d+sz.z); cam.lookAt(c2); R.render(sc,cam); g.drawImage(R.domElement,col*W,26); col++; }
      g.fillStyle='#e8e8e8'; g.font='bold 15px sans-serif'; g.fillText(name,(col-views.length)*W+8,18); }
    restore(); return {png:cv.toDataURL('image/png'),missing}; }
  // framed on the hand and the weapon (a skinned hero's own bounds are its bind pose, useless here): the feet sit under the
  // hand, the head about as far above it as the hand is above the floor
  function hand(W,H,label){ const restore=sized(W,H); const R=__dd.renderer; const hero=__dd.hero; const wo=window.__weapons.mounted();
    const hp=wo&&wo.parent?wo.parent.getWorldPosition(V(0,0,0)):V(hero.x,(hero.y||0)+.8,hero.z); const fy=typeof baseFloor==='function'?baseFloor(hero.x,hero.z):(hero.y||0); const up=Math.max(.35,hp.y-fy);
    const box=new THREE.Box3(V(hero.x-up*.35,fy,hero.z-up*.35),V(hero.x+up*.35,fy+up*2.15,hero.z+up*.35)); if(wo) box.union(new THREE.Box3().setFromObject(wo)); const c=box.getCenter(V(0,0,0)), sz=box.getSize(V(0,0,0));
    const a=(hero.yaw||0)+.55, h=Math.max(sz.y,1)*1.35, d=h/2/Math.tan(32/2*Math.PI/180); const cam=new THREE.PerspectiveCamera(32,W/H,.05,200);
    cam.position.set(c.x+Math.sin(a)*d,c.y+sz.y*.12,c.z+Math.cos(a)*d); cam.lookAt(c.x,c.y+sz.y*.05,c.z);
    // anything standing between the camera and the hero (a portal, a pillar) steps aside for the picture
    const top=o=>{ while(o.parent&&o.parent!==__dd.scene) o=o.parent; return o; }; const mine=wo?top(wo):null; const hidden=[]; const rc=new THREE.Raycaster(); rc.camera=cam;   // (sprites need the camera to be hit-tested)
    for(const [fx,fy] of [[0,0],[0,.3],[0,-.3],[.2,0],[-.2,0]]){ const tgt=V(c.x,c.y+sz.y*fy,c.z).add(V(Math.cos(a),0,-Math.sin(a)).multiplyScalar(sz.x*fx)); const dir=tgt.clone().sub(cam.position); const dist=dir.length(); rc.set(cam.position,dir.normalize()); rc.far=dist-up*.6;
      for(const h of rc.intersectObjects(__dd.scene.children,true)){ const t=top(h.object); if(t===mine||t===__dd.scene||!t.visible) continue; t.visible=false; hidden.push(t); } }
    R.render(__dd.scene,cam); hidden.forEach(t=>t.visible=true);
    const cv=document.createElement('canvas'); cv.width=W; cv.height=H+26; const g=cv.getContext('2d'); g.fillStyle='#1d2026'; g.fillRect(0,0,W,26); g.drawImage(R.domElement,0,26); g.fillStyle='#e8e8e8'; g.font='bold 15px sans-serif'; g.fillText(label,8,18);
    restore(); return cv.toDataURL('image/png'); }
  return {product,hand};
})();`;
async function page(heroId) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  await ctx.addInitScript(h => { try { localStorage.setItem("ddMapsCleared", "1"); if (h) localStorage.setItem("ddHero", h); } catch (e) {} }, heroId || null);
  const p = await ctx.newPage(); const errs = [];
  p.on("pageerror", e => errs.push(String(e).slice(0, 300))); p.on("console", m => { if (m.type() === "error" && !/Failed to load resource/.test(m.text())) errs.push(m.text().slice(0, 300)); });
  await p.goto(`http://127.0.0.1:${port}/?silent&nogate`, { timeout: 60000 }); await p.waitForFunction(() => window.__dd && window.__weapons && window.__setweapons, null, { timeout: 60000 });
  // the game's modules run inside its own wrapper, so a file tried from outside gets the helpers it expects from the kit
  for (const f of files) await p.addScriptTag({ content: "(function(){ const {mat,basic,glow,M,G,PI,TAU,outline}=window.__setweapons.kit.g;\n" + fs.readFileSync(f, "utf8") + "\n})();\n//# sourceURL=" + path.basename(f) });
  await p.addScriptTag({ content: HELPER }); await p.evaluate(() => { window.__dd.start(); window.__dd.step(1 / 60, 10); });
  return { p, ctx, errs };
}
const save = (file, dataUrl) => { fs.writeFileSync(path.join(out, file), Buffer.from(dataUrl.split(",")[1], "base64")); console.log("wrote", path.join(out, file)); };
try {
  if (!handsOnly) {
    const { p, ctx, errs } = await page(null);
    if (opt("names")) {   // --names a,b,c : any registered weapon models, e.g. the older 'void' sword or 'staff-battle'
      const r = await p.evaluate(n => window.__shot.product(n, 220, 440), opt("names").split(",")); save("names-" + opt("names").replace(/[^a-z0-9,-]/gi, "").replace(/,/g, "_").slice(0, 60) + ".png", r.png); if (r.missing.length) { bad++; console.log("MISSING", r.missing.join(", ")); }
    } else if (lineup) {
      const names = sets.flatMap(k => ["sword", "staff", "polearm", "bow"].map(w => w + "-" + k));
      const r = await p.evaluate(n => window.__shot.product(n, 150, 300).then(x => x), names); save("lineup-" + sets.join("-") + ".png", r.png); if (r.missing.length) { bad++; console.log("MISSING", r.missing.join(", ")); }
    } else for (const k of sets) {
      const r = await p.evaluate(n => window.__shot.product(n, 260, 480), ["sword", "staff", "polearm", "bow"].map(w => w + "-" + k));
      save(k + "-bench.png", r.png); if (r.missing.length) { bad++; console.log("MISSING (not registered or failed to build):", r.missing.join(", ")); }
    }
    if (errs.length) { console.log("page errors:"); errs.forEach(e => console.log("  " + e)); }
    await ctx.close();
  }
  if (!benchOnly) for (const k of sets) {
    const shots = [];
    for (const [hero, w] of [["knight", "sword"], ["knight", "polearm"], ["witch", "staff"], ["troll", "bow"]]) {
      const { p, ctx, errs } = await page(hero);
      const ok = await p.waitForFunction(() => { window.__dd.step(1 / 60, 2); const s = window.__weapons.state(); return !!(s && s.mount); }, null, { timeout: 45000, polling: 250 }).then(() => true, () => false);
      if (!ok) { console.log("no hero mount for", hero); bad++; await ctx.close(); continue; }
      const name = w + "-" + k;
      const st = await p.evaluate(n => { window.__weapons.force(n); window.__dd.step(1 / 60, 30); return window.__weapons.state(); }, name);
      if (!st.mounted || !(st.staff || st.bow || /sword|polearm/.test(name))) { console.log("weapon not mounted", name, JSON.stringify(st).slice(0, 200)); bad++; }
      shots.push(await p.evaluate(([h, n]) => window.__shot.hand(420, 520, h + ": " + n), [hero, name]));
      if (errs.length) { console.log("page errors (" + hero + "):"); errs.forEach(e => console.log("  " + e)); }
      await ctx.close();
    }
    // stitch the hand shots side by side in a scratch page
    const ctx = await browser.newContext(); const p = await ctx.newPage();
    const png = await p.evaluate(async list => { const imgs = await Promise.all(list.map(u => new Promise(r => { const i = new Image(); i.onload = () => r(i); i.src = u; })));
      const c = document.createElement("canvas"); c.width = imgs.reduce((s, i) => s + i.width, 0); c.height = Math.max(...imgs.map(i => i.height)); const g = c.getContext("2d"); let x = 0; for (const i of imgs) { g.drawImage(i, x, 0); x += i.width; } return c.toDataURL("image/png"); }, shots);
    save(k + "-hands.png", png); await ctx.close();
  }
} finally { await browser.close(); server.close(); }
process.exit(bad ? 1 : 0);
