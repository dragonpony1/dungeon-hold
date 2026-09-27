// ===== INPUT MODE (build 167): Matt's wife on an iPad with a keyboard and a mouse -- "it was stuck in touchscreen controls". An iPad
// loads as touch; now the input actually in use decides (game.js setTouchMode): a mouse moving or clicking switches to mouse &
// keyboard (click swings, the tutorial says "click"), a finger on the screen switches back. A touch-emulating page stands in for the
// iPad; Playwright's mouse sends pointerType 'mouse', its touchscreen pointerType 'touch'.
import { chromium, webkit } from "playwright"; import { serve } from "./serve.mjs";
const results = []; const check = (n, ok, d) => { results.push(ok); console.log((ok ? "PASS " : "FAIL ") + n + (d ? "  -> " + d : "")); };
const server = await serve(8807);
async function run(engine, label) {
  const browser = engine === "webkit" ? await webkit.launch() : await chromium.launch({ args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
  const ctx = await browser.newContext({ hasTouch: true, isMobile: engine !== "webkit", viewport: { width: 1180, height: 820 } });
  const page = await ctx.newPage(); const errors = []; page.on("pageerror", e => errors.push(String(e)));
  await page.goto("http://127.0.0.1:8807/?silent&nogate&tutorial", { timeout: 90000 }); await page.waitForFunction(() => window.__dd, null, { timeout: 60000 });
  const s0 = await page.evaluate(() => ({ touch: document.body.classList.contains("touch"), ess: document.getElementById("essentials").textContent }));
  if (!s0.touch) { console.log("SKIP " + label + ": this engine's emulation doesn't load as touch (pointer:coarse)"); await browser.close(); return; }
  check(label + ": an iPad-like page loads in touch mode (joystick and buttons, the touch wording)", s0.touch && /joystick/.test(s0.ess), JSON.stringify(s0));
  await page.evaluate(() => { window.__dd.start(); window.__dd.step(1 / 60, 5); });
  await page.mouse.move(500, 400); await page.mouse.move(540, 420);
  const s1 = await page.evaluate(() => ({ touch: document.body.classList.contains("touch"), ess: document.getElementById("essentials").textContent, btns: getComputedStyle(document.getElementById("btns")).display }));
  check(label + ": moving a mouse switches to mouse & keyboard (touch buttons hidden, the keyboard wording)", !s1.touch && /W A S D/.test(s1.ess) && s1.btns === "none", JSON.stringify(s1));
  await page.mouse.click(600, 420); const sw = await page.evaluate(() => { const h = window.__dd.hero; const t = h.swingT; window.__dd.step(1 / 60, 2); return { swingT: t }; });
  check(label + ": a mouse click on the hall swings the sword (it used to be thrown away on an iPad)", sw.swingT >= 0, JSON.stringify(sw));
  await page.touchscreen.tap(300, 300);
  const s2 = await page.evaluate(() => ({ touch: document.body.classList.contains("touch"), ess: document.getElementById("essentials").textContent }));
  check(label + ": a finger on the screen switches back to touch", s2.touch && /joystick/.test(s2.ess), JSON.stringify(s2));
  check(label + ": no page errors", errors.length === 0, errors.join(" | ").slice(0, 300));
  await browser.close();
}
await run("chromium", "Chrome engine");
await run("webkit", "Safari engine");
server.close();
const bad = results.filter(x => !x).length; console.log(`\n${results.length - bad}/${results.length} passed`); process.exit(bad ? 1 : 0);
