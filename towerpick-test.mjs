// ===== TOWER PICK (build 165): Matt — "when you're trying to heal a tower mid wave it's very difficult to target a specific
// tower if there are several". E / 🔧 / X, the range outline, the tower card and a ring on the floor now all go to game.js's
// pickDef: among the towers within reach, a hurt one before a whole one, then the one the gnome faces, then the nearest.
// Two ballistas side by side, the gnome between and just short of them, turned to face one or the other.
import { chromium } from "playwright"; import { serve } from "./serve.mjs";
const results = []; const check = (n, ok, d) => { results.push(ok); console.log((ok ? "PASS " : "FAIL ") + n + (d ? "  -> " + d : "")); };
const server = await serve(8786);
const browser = await chromium.launch({ args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const page = await browser.newPage(); const errors = []; page.on("pageerror", e => errors.push(String(e)));
await page.goto("http://127.0.0.1:8786/?silent&nogate", { timeout: 90000 }); await page.waitForFunction(() => window.__dd, null, { timeout: 60000 });
const r = await page.evaluate(() => { const d = window.__dd; d.start(); d.step(1 / 60, 5); d.S.mana = 9999;
  d.placeDefAt("harpoon", -1.5, 14); const A = d.defs[d.defs.length - 1]; d.placeDefAt("harpoon", 1.5, 14); const B = d.defs[d.defs.length - 1]; A.pop = B.pop = 1;
  const face = x => Math.atan2(x, 2), at = yaw => { d.setHero(0, 12, yaw); d.step(1 / 60, 2); };
  const which = () => { let ring = null; d.scene.traverse(o => { if (o.isMesh && o.geometry && o.geometry.type === "RingGeometry" && o.visible && Math.abs(o.position.z - 14) < .01 && Math.abs(o.scale.x - 1.25) < .01) ring = o; });
    return ring ? (Math.abs(ring.position.x - A.x) < .01 ? "A" : Math.abs(ring.position.x - B.x) < .01 ? "B" : "?") + (ring.material.color.getHex() === 0x5ef0a0 ? " green" : " gold") : "none"; };
  const o = {}; at(face(A.x)); o.wholeA = which(); at(face(B.x)); o.wholeB = which();
  A.hp = 30; at(face(B.x)); o.hurtA_faceB = which(); B.hp = 60; at(face(B.x)); o.bothHurt_faceB = which(); at(face(A.x)); o.bothHurt_faceA = which();
  const m0 = d.S.mana; d.upgradeDef(); o.repair = { A: A.hp, Amax: A.max, B: B.hp, spent: m0 - d.S.mana }; return o; });
check("two whole towers: the one the gnome faces is picked, a gold ring under it (E would upgrade it)", r.wholeA === "A gold" && r.wholeB === "B gold", JSON.stringify(r));
check("a hurt tower is picked before a whole one, even facing the whole one (green ring: E repairs it)", r.hurtA_faceB === "A green");
check("two hurt towers: facing decides", r.bothHurt_faceB === "B green" && r.bothHurt_faceA === "A green");
check("E repairs exactly the ringed tower", r.repair.A === r.repair.Amax && r.repair.B === 60 && r.repair.spent > 0, JSON.stringify(r.repair));
check("no page errors", errors.length === 0, errors.join(" | ").slice(0, 300));
await browser.close(); server.close();
const bad = results.filter(x => !x).length; console.log(`\n${results.length - bad}/${results.length} passed`); process.exit(bad ? 1 : 0);
