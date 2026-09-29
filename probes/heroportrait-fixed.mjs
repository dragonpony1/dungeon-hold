// portrait for one hero's title card, framed exactly like the Knight's: the Knight is set up the way probes/heroportraits.mjs
// does it (chase camera), the camera's offset from him is recorded, and the chosen hero gets that same camera. The chase camera of
// a BOW hero sits over the shoulder (84-aim.js), which is why the old archer portrait caught only the floor.
// node probes/heroportrait-fixed.mjs <id> [out.png]
import { chromium } from "playwright"; import { serve } from "../serve.mjs"; import fs from "fs";
const ID = process.argv[2] || "troll", OUT = process.argv[3] || "parts/assets/hero-" + ID + ".png";
const server = await serve(8942, { dist: "./dist" });
const browser = await chromium.launch({ args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] }); const page = await browser.newPage({ viewport: { width: 640, height: 640 } }); const errs = []; page.on("pageerror", e => errs.push(String(e)));
await page.goto("http://127.0.0.1:8942/?silent&nogate", { timeout: 120000 }); await page.waitForFunction(() => window.__dd && window.__heroes, null, { timeout: 120000 });
await page.evaluate(() => { try { localStorage.setItem("ddMapsCleared", "5"); } catch (e) { } });
await page.goto("http://127.0.0.1:8942/?silent&nogate&map=1", { timeout: 120000 }); await page.waitForFunction(() => window.__dd && window.__heroes && window.__dd.heroModel(), null, { timeout: 120000 });
await page.evaluate(() => { window.__meta.reset(); window.__dd.resetGear(); window.__dd.start(); window.__freeze = true; window.__dd.step(1 / 60, 5); document.getElementById("hud").style.display = "none"; });
const setUp = async id => { await page.evaluate(id => window.__heroes.select(id), id);
  await page.waitForFunction(id => { const m = window.__dd.heroModel(); return m && window.__heroes.pick() === id && m.visible; }, id, { timeout: 120000 });
  await page.evaluate(async () => { const d = window.__dd; d.setHero(0, 54, 0); d.hero.y = 0; d.setCam(Math.PI * .82, .1, 3.1); d.setHeroYaw(Math.PI); for (let i = 0; i < 70; i++) { d.step(1 / 60, 1); await new Promise(r => setTimeout(r, 0)); } }); };
await setUp("knight");
const rel = await page.evaluate(() => { const d = window.__dd, h = d.hero; return { p: [d.camera.position.x - h.x, d.camera.position.y - h.y, d.camera.position.z - h.z], q: d.camera.quaternion.toArray() }; });
await setUp(ID);
const out = await page.evaluate(rel => { const d = window.__dd, h = d.hero; const cam = d.camera.clone(); cam.position.set(h.x + rel.p[0], h.y + rel.p[1], h.z + rel.p[2]); cam.quaternion.fromArray(rel.q); cam.updateMatrixWorld(true);
  d.renderer.render(d.scene, cam); const c = d.renderer.domElement; const W = c.width, H = c.height; const cw = Math.round(W * .42), ch = Math.round(H * .74), cx = Math.round((W - cw) / 2), cy = Math.round(H * .16);
  const o = document.createElement("canvas"); o.width = 150; o.height = 190; o.getContext("2d").drawImage(c, cx, cy, cw, ch, 0, 0, 150, 190); return { png: o.toDataURL("image/png"), label: d.heroModel().label }; }, rel);
fs.writeFileSync(OUT, Buffer.from(out.png.split(",")[1], "base64")); console.log(ID, out.label, "->", OUT, "camera from the knight:", JSON.stringify(rel.p.map(v => +v.toFixed(2))), "errors:", errs.join(" | ") || "none");
await browser.close(); server.close(); process.exit(0);
