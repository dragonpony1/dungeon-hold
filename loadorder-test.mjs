// ===== LOAD ORDER: three tiers, then lazy. 'first' (the hero, the crystal, the sword in hand) goes out at once and
// nothing else is even requested until all three have finished; 'soon' (mark-I defenses and their shots, the wave-one
// goblin, the raven, the portal) comes next; 'later' (the other mobs, the smith) waits for the soon tier to land. Upgrade
// marks, familiars and armor stands are never requested at start at all: a mark is fetched when a defense first reaches
// it, with the next one prefetched. Some sixty startup requests used to leave the hero near the end of a ~6-connection
// queue -- 'build 21 · hero model: loading…' for minutes on a phone, the sword arriving after wave one. Serves dist/
// (DIST env, or ./dist) and records the real request order and completion times; also pins the build line showing the
// real build number as soon as the script runs. -- fetchBytes/tierDone in game.js, 50-defmodels.js and the other loaders
import { chromium } from "playwright"; import { serve } from "./serve.mjs";
import fs from "fs"; import path from "path"; import { execSync } from "child_process";
const results=[]; const check=(n,ok,d)=>{ results.push(ok); console.log((ok?"PASS ":"FAIL ")+n+(d?"  -> "+d:"")); };
const SP=path.dirname(new URL(import.meta.url).pathname); const DIST=process.env.DIST||SP+"/dist";
if(!fs.existsSync(DIST+"/index.html")){ console.log("building "+DIST+" first"); execSync("DIST="+DIST+" EXTRA=./parts/staging node assemble.mjs",{cwd:SP,stdio:"inherit"}); }
const PORT=8901, BASE="http://127.0.0.1:"+PORT;
const server=await serve(PORT,{dist:DIST});
const browser=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]});
const page=await browser.newPage(); const errors=[]; page.on("pageerror",e=>errors.push(String(e)));
const t0=Date.now(); const started=[], finished=[]; const sleep=ms=>new Promise(r=>setTimeout(r,ms));
page.on("request",r=>{ const u=r.url().replace(BASE,''); if(/\.glb\.txt$/.test(u)) started.push({u,t:Date.now()-t0}); });
page.on("requestfinished",r=>{ const u=r.url().replace(BASE,''); if(/\.glb\.txt$/.test(u)) finished.push({u,t:Date.now()-t0}); });
const name=u=>u.replace(/^\/assets\//,'').replace(/\.[0-9a-f]{8}\.glb\.txt$/,'');
const isFirst=u=>/^(gnome|knight|witch|fighter|squire|ninja|crystal|sword-[a-z]+)$/.test(name(u));
const isSoon=u=>/^(goblin|ballista-1|hedge|cannon-1|mushroom-1|totem-1|frost-1|snare-1|aura-[a-z]+|acorn|ballista-bolt|raven|hideout-portal)$/.test(name(u));
const isLater=u=>/^(orc|ogre|bandit|trollmob|trollboss|drake|smith)$/.test(name(u));
const isLazy=u=>/^(armor-stand-|fam-|(ballista|cannon|mushroom|totem|frost|snare)-[234]$)/.test(name(u));

await page.goto(BASE+"/?silent",{timeout:120000,waitUntil:'commit'});
check("the build-line markup no longer carries the old 'build 21' placeholder",!/id="buildline">[^<]*build 21/.test(fs.readFileSync(DIST+"/index.html","utf8")));
await page.waitForFunction(()=>window.__dd,null,{timeout:60000});
const early=await page.evaluate(()=>document.getElementById('buildline').textContent);
check("the build line shows the real build number as soon as the script runs, before any model has landed",/^build \d{3,}( · hideout build \d+)? · hero model: loading/.test(early),early);
await page.waitForFunction(()=>!/loading…/.test(document.getElementById('buildline').textContent),null,{timeout:90000}).catch(()=>{});
check("the hero model landed",/hero: /.test(await page.evaluate(()=>document.getElementById('buildline').textContent)));

// let the whole startup stream settle: no new request for 3s (or 90s cap)
for(let i=0,last=-1,quiet=0;i<360&&quiet<12;i++){ await sleep(250); if(started.length===last) quiet++; else { quiet=0; last=started.length; } }
const firstThree=started.slice(0,3);
check("the first three requests are the hero, the crystal and the sword in hand, in some order",firstThree.length===3&&firstThree.every(s=>isFirst(s.u))&&firstThree.some(s=>/crystal/.test(s.u))&&firstThree.some(s=>/sword-/.test(s.u)),JSON.stringify(firstThree.map(s=>name(s.u))));
const firstDone=Math.max(...firstThree.map(s=>(finished.find(f=>f.u===s.u)||{t:Infinity}).t));
const firstOther=started.find(s=>!isFirst(s.u));
check("nothing else is even requested until all three have finished downloading",!!firstOther&&firstDone<Infinity&&firstOther.t>=firstDone,JSON.stringify({firstDone,firstOther:firstOther&&{n:name(firstOther.u),t:firstOther.t}}));
const soonStarted=started.filter(s=>isSoon(s.u)), laterStarted=started.filter(s=>isLater(s.u));
check("the soon tier (mark-I defenses, the goblin, the raven, the portal) is what comes next",soonStarted.length>=12&&firstOther&&isSoon(firstOther.u),soonStarted.map(s=>name(s.u)).join(' '));
const soonDone=Math.max(...soonStarted.map(s=>(finished.find(f=>f.u===s.u)||{t:Infinity}).t));
check("the later tier (the other mobs, the smith) waits for the whole soon tier to land",laterStarted.length>=5&&soonDone<Infinity&&laterStarted.every(s=>s.t>=soonDone),JSON.stringify({soonDone,firstLater:laterStarted[0]&&{n:name(laterStarted[0].u),t:laterStarted[0].t}}));
const lazyAtStart=started.filter(s=>isLazy(s.u));
check("upgrade marks, familiars and armor stands are not requested at start at all",lazyAtStart.length===0,lazyAtStart.map(s=>name(s.u)).join(' '));
check("the startup stream is far shorter than the ~60 models it used to be",started.length<=30,String(started.length)+" requests: "+started.map(s=>name(s.u)).join(' '));

// a placed ballista prefetches Mark II; upgrading it fetches Mark III
await page.evaluate(()=>{ window.__freeze=true; window.__dd.start(); window.__dd.step(1/60,3); window.__dd.S.mana=99999; });
const placed=await page.evaluate(()=>{ const d=window.__dd; const before=d.defs.length; const h=d.hero; for(let dz=2;dz<=12&&d.defs.length===before;dz++) for(let dx=-6;dx<=6&&d.defs.length===before;dx++){ try{ d.placeDefAt('harpoon',h.x+dx,h.z+dz,0); }catch(e){} }
  const nd=d.defs[d.defs.length-1]; if(d.defs.length===before) return null; d.step(1/60,3); return {x:nd.x,z:nd.z,lvl:nd.lvl,asked:window.__defglb.asked()}; });
check("a ballista could be placed for the test",!!placed&&placed.lvl===1,JSON.stringify(placed));
await sleep(300);
check("placing it asks for Mark II (prefetched so the first upgrade lands dressed), not Marks III/IV",!!placed&&placed.asked.includes('harpoon:1')&&!placed.asked.includes('harpoon:2')&&started.some(s=>name(s.u)==='ballista-2')&&!started.some(s=>name(s.u)==='ballista-3'),JSON.stringify(placed&&placed.asked));
const up=await page.evaluate(p=>{ const d=window.__dd; d.setHero(p.x+1,p.z); d.upgradeDef(); d.step(1/60,3); const nd=d.defs.find(x=>x.x===p.x&&x.z===p.z); return {lvl:nd&&nd.lvl,asked:window.__defglb.asked()}; },placed||{x:0,z:0});
await sleep(300);
check("upgrading it to Mark II asks for Mark III next",up.lvl===2&&up.asked.includes('harpoon:2')&&started.some(s=>name(s.u)==='ballista-3'),JSON.stringify(up));
await page.waitForFunction(()=>{ const l=window.__defglb.list(); return l.harpoon&&l.harpoon[1]; },null,{timeout:30000}).catch(()=>{});
check("...and the Mark II model actually lands and registers",await page.evaluate(()=>{ const l=window.__defglb.list(); return !!(l.harpoon&&l.harpoon[1]); }));
check("the build line still reads the real build",/^build \d{3,}( · hideout build \d+)? · hero: /.test(await page.evaluate(()=>document.getElementById('buildline').textContent)));
const realErrors=errors.filter(e=>!/Failed to load resource|favicon/i.test(e));
check("no page errors",realErrors.length===0,realErrors.slice(0,3).join(" | "));
await browser.close(); server.close();
console.log(results.filter(Boolean).length+"/"+results.length+" passed");
process.exit(results.some(r=>!r)?1:0);
