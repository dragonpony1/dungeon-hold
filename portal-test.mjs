import { chromium } from "playwright";
import { serve } from "./serve.mjs";
const results=[]; const check=(n,ok,d)=>{ results.push(ok); console.log((ok?"PASS ":"FAIL ")+n+(d?"  -> "+d:"")); };
const server = await serve(8893, { dist: process.env.DIST });
const browser = await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]});
const page = await browser.newPage({viewport:{width:1000,height:700}});
const errors=[]; page.on("pageerror", e => errors.push(String(e)));
await page.goto("http://127.0.0.1:8893/?silent&nogate", {timeout:30000});
await page.waitForFunction(() => window.__dd && window.__portal, null, {timeout:20000});

const hiddenAtStart = await page.evaluate(() => window.__portal.state());
check("portal starts hidden on the title screen", hiddenAtStart==='hidden', hiddenAtStart);

await page.evaluate(() => { window.__freeze=true; window.__dd.start(); });
// wait for the glb to actually load, then let it pop in
await page.waitForFunction(() => window.__portal.loaded(), null, {timeout:20000});
for(let i=0;i<60;i++) await page.evaluate(()=>window.__dd.step(1/60,1));
const shownState = await page.evaluate(() => window.__portal.state());
check("portal pops in and settles once build phase starts", shownState==='shown', shownState);

const pos = await page.evaluate(() => window.__portal.pos());
const ravenPos = await page.evaluate(() => window.__raven.pos());
check("portal sits at a distinct spot from the raven", Math.hypot(pos.x-ravenPos.x, pos.z-ravenPos.z) > 1, JSON.stringify({pos,ravenPos}));

await page.evaluate(() => window.__dd.setCam(0, .5, 20));
await page.waitForTimeout(200);
await page.screenshot({path:"/tmp/glbwork/portal-ingame.png"});

// now end the run / leave build phase, confirm it pops back out
await page.evaluate(() => { window.__dd.S.phase='lobby'; });
for(let i=0;i<60;i++) await page.evaluate(()=>window.__dd.step(1/60,1));
const hiddenAfter = await page.evaluate(() => window.__portal.state());
check("portal pops back out once the phase leaves build", hiddenAfter==='hidden', hiddenAfter);

const realErrors=errors.filter(e=>!/Failed to load resource|favicon/i.test(e));
check("no page errors", realErrors.length===0, realErrors.slice(0,5).join(" | "));

await browser.close(); server.close();
console.log(results.filter(Boolean).length+"/"+results.length+" passed");
process.exit(results.some(r=>!r)?1:0);
