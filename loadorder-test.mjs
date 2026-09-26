// ===== LOAD ORDER: the hero and the crystal come down first, and everything else waits for them. Some sixty models are
// requested the moment the page runs and a browser keeps ~6 connections per host, so the hero used to sit near the end
// of that queue -- 'build 21 · hero model: loading…' for minutes on a phone. Serves dist/ (DIST env, or ./dist) and
// records the real request order and completion times; also pins the build line showing the real build number from
// the first frame, never the head.html placeholder. -- fetchBytes/firstLoadsDone in game.js, 70-hero2.js, 55-crystal.js
import { chromium } from "playwright"; import { serve } from "./serve.mjs";
import fs from "fs"; import path from "path"; import { execSync } from "child_process";
const results=[]; const check=(n,ok,d)=>{ results.push(ok); console.log((ok?"PASS ":"FAIL ")+n+(d?"  -> "+d:"")); };
const SP=path.dirname(new URL(import.meta.url).pathname); const DIST=process.env.DIST||SP+"/dist";
if(!fs.existsSync(DIST+"/index.html")){ console.log("building "+DIST+" first"); execSync("DIST="+DIST+" EXTRA=./parts/staging node assemble.mjs",{cwd:SP,stdio:"inherit"}); }
const PORT=8901, BASE="http://127.0.0.1:"+PORT;
const server=await serve(PORT,{dist:DIST});
const browser=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]});
const page=await browser.newPage(); const errors=[]; page.on("pageerror",e=>errors.push(String(e)));
const t0=Date.now(); const started=[], finished=[];
page.on("request",r=>{ const u=r.url().replace(BASE,''); if(/\.glb\.txt$/.test(u)) started.push({u,t:Date.now()-t0}); });
page.on("requestfinished",r=>{ const u=r.url().replace(BASE,''); if(/\.glb\.txt$/.test(u)) finished.push({u,t:Date.now()-t0}); });
await page.goto(BASE+"/?silent",{timeout:120000,waitUntil:'commit'});
check("the build-line markup no longer carries the old 'build 21' placeholder",!/id="buildline">[^<]*build 21/.test(fs.readFileSync(DIST+"/index.html","utf8")));
await page.waitForFunction(()=>window.__dd,null,{timeout:60000});
const early=await page.evaluate(()=>document.getElementById('buildline').textContent);
check("the build line shows the real build number as soon as the script runs, before any model has landed",/^build \d{3,} · hero model: loading/.test(early),early);
await page.waitForFunction(()=>!/loading…/.test(document.getElementById('buildline').textContent),null,{timeout:90000}).catch(()=>{});
const heroLine=await page.evaluate(()=>document.getElementById('buildline').textContent);
check("the hero model landed",/hero: /.test(heroLine),heroLine);
// let the rest of the queue start
await page.waitForFunction(()=>true); for(let i=0;i<40&&started.length<10;i++) await new Promise(r=>setTimeout(r,250));
const firstTwo=started.slice(0,2).map(s=>s.u);
const isHero=u=>/\/assets\/(gnome|knight|witch|fighter|squire|ninja)[.-]/.test(u), isCrystal=u=>/\/assets\/crystal\./.test(u);
check("the first two model requests are the hero and the crystal, in some order",firstTwo.length===2&&firstTwo.some(isHero)&&firstTwo.some(isCrystal),JSON.stringify(firstTwo));
const heroDone=finished.find(f=>isHero(f.u)), crystalDone=finished.find(f=>isCrystal(f.u));
const firstOther=started.find(s=>!isHero(s.u)&&!isCrystal(s.u));
check("no other model was even requested until both had finished downloading",!!heroDone&&!!crystalDone&&!!firstOther&&firstOther.t>=Math.max(heroDone.t,crystalDone.t),JSON.stringify({heroDone,crystalDone,firstOther}));
check("...and the rest of the queue did then start (the gate opens, nothing stays held)",started.length>=10,String(started.length));
const realErrors=errors.filter(e=>!/Failed to load resource|favicon/i.test(e));
check("no page errors",realErrors.length===0,realErrors.slice(0,3).join(" | "));
await browser.close(); server.close();
console.log(results.filter(Boolean).length+"/"+results.length+" passed");
process.exit(results.some(r=>!r)?1:0);
