// ===== TOUCH BUTTONS (build 159): Matt on his iPad — "the wrench doesn't work". The on-screen buttons were made in game.js
// holding swing/upgrade as they stood there, before the modules load and wrap them (the portal, the tavern stations, the
// raven, a co-op guest's relayed swing and repair), so a tap never reached any of that. They now call by name at the tap.
// A touch page walks to the hideout portal in the build phase and taps 🔧; the hideout must open, as E does on a keyboard.
import { chromium } from "playwright"; import { serve } from "./serve.mjs";
const results = []; const check = (n, ok, d) => { results.push(ok); console.log((ok ? "PASS " : "FAIL ") + n + (d ? "  -> " + d : "")); };
const server = await serve(8771);
const browser = await chromium.launch({ args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const ctx = await browser.newContext({ hasTouch: true, isMobile: true, viewport: { width: 1180, height: 820 } });
const page = await ctx.newPage(); const errors = []; page.on("pageerror", e => errors.push(String(e)));
await page.goto("http://127.0.0.1:8771/?silent&nogate", { timeout: 90000 }); await page.waitForFunction(() => window.__dd && window.__portal && window.__hideout, null, { timeout: 60000 });
const n = await page.evaluate(() => [...document.querySelectorAll("#btns .hb")].map(b => b.textContent).join(" "));
check("a touch page has its on-screen buttons, the wrench among them", /🔧/.test(n) && /⚔/.test(n), n);
await page.evaluate(() => { window.__dd.start(); window.__dd.step(1 / 60, 10); });
const shown = await page.waitForFunction(() => { window.__dd.step(1 / 60, 5); return window.__portal.loaded() && window.__portal.state() === "shown"; }, null, { timeout: 90000, polling: 200 }).then(() => true, () => false);
const at = await page.evaluate(() => { const q = window.__portal.pos(); window.__dd.setHero(q.x + .8, q.z + .8, 0); window.__dd.step(1 / 60, 20); return document.getElementById("prompt").textContent; });
check("standing at the portal in the build phase, the prompt offers it", shown && /portal/.test(at), at);
const box = await page.evaluate(() => { const b = [...document.querySelectorAll("#btns .hb")].find(x => x.textContent === "🔧"); const r = b.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; });
await page.touchscreen.tap(box.x, box.y); await page.waitForTimeout(1500);
check("tapping 🔧 there steps through the portal: the hideout opens", await page.evaluate(() => window.__hideout.isOpen()));
check("no page errors", errors.length === 0, errors.join(" | ").slice(0, 300));
await browser.close(); server.close();
const bad = results.filter(r => !r).length; console.log(`\n${results.length - bad}/${results.length} passed`); process.exit(bad ? 1 : 0);
