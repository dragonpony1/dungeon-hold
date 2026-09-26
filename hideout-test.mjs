// ===== THE HIDEOUT, THROUGH THE PORTAL (59-hideout.js + the assembler's embedHideout): the real E path at the crystal
// archway, the carry-gear prompt and the dd_gear_bag contract (read-modify-write, ADDED to, other fields kept, the
// bag emptied and that emptiness persisted), the overlay iframe actually running the hideout's own page with its
// assets resolving relative to hideout/ (no site-root leaks), both ways back out (its BACK TO THE HALL button, and
// the horn), the title-screen button, a fresh load coming back up from ddMeta (the return trip of the full-navigation
// variant), and the hideout page standalone. Folder build only -- it serves dist/ (DIST env, or ./dist), building it
// first if it's missing. -- parts/staging/59-hideout.js, assemble.mjs, parts/hideout/
import { chromium } from "playwright"; import { serve } from "./serve.mjs";
import fs from "fs"; import path from "path"; import { execSync } from "child_process";
const results=[]; const check=(n,ok,d)=>{ results.push(ok); console.log((ok?"PASS ":"FAIL ")+n+(d?"  -> "+d:"")); };
const SP=path.dirname(new URL(import.meta.url).pathname); const DIST=process.env.DIST||SP+"/dist";
if(!fs.existsSync(DIST+"/hideout/index.html")){ console.log("building "+DIST+" first"); execSync("DIST="+DIST+" EXTRA=./parts/staging node assemble.mjs",{cwd:SP,stdio:"inherit"}); }
const PORT=8896, BASE="http://127.0.0.1:"+PORT;
const server=await serve(PORT,{dist:DIST});
const browser=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]});
const ctx=await browser.newContext();   // one context: localStorage is shared across its pages, which is exactly what the return trip relies on
const errors=[], responses=[];
async function newGamePage(){ const p=await ctx.newPage(); p.on("pageerror",e=>errors.push(String(e))); p.on("response",r=>responses.push({url:r.url(),status:r.status()}));
  await p.goto(BASE+"/?silent&nogate",{timeout:90000}); await p.waitForFunction(()=>window.__dd&&window.__portal&&window.__hideout&&window.__meta,null,{timeout:60000}); return p; }
async function frameOf(page,part){ for(let i=0;i<200;i++){ const f=page.frames().find(f=>f.url().includes(part)); if(f) return f; await new Promise(r=>setTimeout(r,50)); } return null; }
const sleep=ms=>new Promise(r=>setTimeout(r,ms));

// ==== A: the portal, the prompt, the carry-gear handoff, the overlay, both ways out ====
const page=await newGamePage();
await page.evaluate(()=>{ window.__freeze=true; window.__dd.start(); });
await page.waitForFunction(()=>window.__portal.loaded(),null,{timeout:60000});
await page.evaluate(()=>window.__dd.step(1/60,40));
check("the archway is up in the build phase",await page.evaluate(()=>window.__portal.state())==='shown',await page.evaluate(()=>window.__portal.state()));

// seed the hideout's bag with existing counts AND a field of its own, to prove read-modify-write keeps both
await page.evaluate(()=>localStorage.setItem('dd_gear_bag',JSON.stringify({common:3,rare:1,someday:'kept'})));
const bagged=await page.evaluate(()=>{ const out=[]; for(const r of [0,0,2,3]){ const it=window.__dd.rollItem(r); it.rarity=r; out.push(window.__meta.onPickup(it)); } return {ok:out.every(Boolean),n:window.__meta.bag().length}; });
check("four unequipped pieces bagged for real via Meta.onPickup (2 common, 1 rare, 1 epic)",bagged.ok&&bagged.n===4,JSON.stringify(bagged));

await page.evaluate(()=>{ window.__dd.setHero(30,30); window.__dd.step(1/60,2); });
check("far from the archway: not near, no portal prompt",!(await page.evaluate(()=>window.__hideout.near()))&&!/portal/i.test(await page.evaluate(()=>document.getElementById('prompt').textContent)));
const ppos=await page.evaluate(()=>window.__portal.pos());
await page.evaluate(p=>{ window.__dd.setHero(p.x+.6,p.z+.6); window.__dd.step(1/60,3); },ppos);
check("beside the archway: near",await page.evaluate(()=>window.__hideout.near()));
const prompt=await page.evaluate(()=>document.getElementById('prompt').textContent);
check("the E prompt names the portal and the hideout",/portal/i.test(prompt)&&/hideout/i.test(prompt),prompt);

const heroBefore=await page.evaluate(()=>({x:+window.__dd.hero.x.toFixed(2),z:+window.__dd.hero.z.toFixed(2)}));
await page.keyboard.press('KeyE');   // the game's own keydown -> upgrade() chain, not a direct call
await page.waitForFunction(()=>window.__hideout.isOpen(),null,{timeout:5000}).catch(()=>{});
check("a real E press with gear in the bag walks straight through: no prompt at the door, the overlay opens",await page.evaluate(()=>window.__hideout.isOpen()&&!document.getElementById('hideoutAsk')));
const gearBag=await page.evaluate(()=>JSON.parse(localStorage.getItem('dd_gear_bag')));
check("dd_gear_bag was ADDED to, not replaced: common 3+2=5, rare 1+1=2, epic 0+1=1, the rest 0",
  gearBag.common===5&&gearBag.rare===2&&gearBag.epic===1&&gearBag.uncommon===0&&gearBag.legendary===0,JSON.stringify(gearBag));
check("a field the hideout side owns survived the read-modify-write",gearBag.someday==='kept',JSON.stringify(gearBag));
check("the pieces left the bag for good (carried, no duplicates)",await page.evaluate(()=>window.__meta.bag().length===0));
check("...and that emptiness is already persisted in ddMeta",await page.evaluate(()=>JSON.parse(localStorage.getItem('ddMeta')).bag.length===0));
check("lastCarry reports what went through (4 scrapped, none carried whole: nothing was locked)",JSON.stringify(await page.evaluate(()=>window.__hideout.lastCarry()))==='{"n":4,"counts":{"common":2,"uncommon":0,"rare":1,"epic":1,"legendary":0},"carried":[]}',JSON.stringify(await page.evaluate(()=>window.__hideout.lastCarry())));

const frameSrc=await page.evaluate(()=>document.getElementById('hideoutFrame')&&document.getElementById('hideoutFrame').src);
check("the overlay is an iframe on hideout/index.html?embed=1 (same origin)",!!frameSrc&&frameSrc===BASE+"/hideout/index.html?embed=1",frameSrc);
const frame=await frameOf(page,'hideout/index.html');
check("the hideout frame exists",!!frame);
if(frame){
  await frame.waitForFunction(()=>window.THREE&&typeof THREE.GLTFLoader==='function'&&document.getElementById('leaveBtn'),null,{timeout:60000}).catch(()=>{});
  check("the hideout page ran its own Three.js + GLTFLoader inside the frame",await frame.evaluate(()=>!!window.THREE&&typeof THREE.GLTFLoader==='function'));
  check("the derived page knows it's embedded and has its API base hook",await frame.evaluate(()=>typeof HIDEOUT_API_BASE==='string'&&HIDEOUT_EMBEDDED===true&&HIDEOUT_API_BASE===''));
  check("embedded: the BACK TO THE HALL button is on its entry overlay",await frame.evaluate(()=>{ const b=document.getElementById('leaveBtn'); return !!b&&getComputedStyle(b).display!=='none'; }));
  check("the hideout's own save loaded (the room's starter items are in its hotbar)",await frame.evaluate(()=>!!document.querySelector('#inv .slot')));
  // the brief's own acceptance step: open the Cauldron Cart in there and see the Common Gear number match what was carried
  // the Cart (hideout-wip ca52e25) salvages every rarity: five pills in its header, one per rarity in rank order, each a <b> count
  const cauldron=await frame.evaluate(()=>{ openCauldron(); return {pills:[...document.querySelectorAll('#cauldronBag b')].map(b=>+b.textContent),rows:[...document.querySelectorAll('#cauldronRows .crow')].map(r=>r.dataset.id),bag:JSON.parse(JSON.stringify(BAG))}; });
  check("the Cauldron Cart's header shows the carried gear per rarity: 5 common (3 seeded + 2 carried), 0, 2 rare, 1 epic, 0",JSON.stringify(cauldron.pills)==='[5,0,2,1,0]',JSON.stringify(cauldron.pills));
  check("...with a salvage row for every rarity, epic included",['sv_common','sv_uncommon','sv_rare','sv_epic','sv_legendary'].every(id=>cauldron.rows.includes(id)),cauldron.rows.join(' '));
  check("the hideout's BAG mirrors every key the game wrote, epic included",cauldron.bag.common===5&&cauldron.bag.rare===2&&cauldron.bag.epic===1&&cauldron.bag.uncommon===0&&cauldron.bag.legendary===0,JSON.stringify(cauldron.bag));
  const crafted=await frame.evaluate(()=>{ craftRecipe('sv_common',false); return {pills:[...document.querySelectorAll('#cauldronBag b')].map(b=>+b.textContent),common:BAG.common,stored:JSON.parse(localStorage.getItem('dd_gear_bag')).common,sludge:SAVE.commonSludge}; });
  check("salvaging once spends 5 common gear for real: BAG and the header read 0, dd_gear_bag.common is 0 in storage, one Common Sludge made",crafted.common===0&&crafted.pills[0]===0&&crafted.stored===0&&crafted.sludge>=1,JSON.stringify(crafted));
  check("...and the other rarities are untouched by it",JSON.stringify(crafted.pills.slice(1))==='[0,2,1,0]',JSON.stringify(crafted.pills));
  await frame.evaluate(()=>closeCauldron());
  for(let i=0;i<200&&!responses.some(r=>/\/hideout\/assets\/hideout\/floor\.glb\.txt$/.test(r.url));i++) await sleep(50);
  const floor=responses.find(r=>/\/hideout\/assets\/hideout\/floor\.glb\.txt$/.test(r.url));
  check("its models load from hideout/assets/ as base64 .glb.txt with a 200 (paths made relative, models converted by the build)",!!floor&&floor.status===200,JSON.stringify(floor));
  const three=responses.find(r=>/\/hideout\/vendor\/three\.min\.js$/.test(r.url));
  check("its own three.min.js came from hideout/vendor/",!!three&&three.status===200,JSON.stringify(three));
  const leaks=responses.filter(r=>new RegExp("^"+BASE+"/(assets/hideout|vendor)/").test(r.url));
  check("no request leaked to the site root (/assets/hideout, /vendor)",leaks.length===0,leaks.map(l=>l.url).slice(0,3).join(" "));
  await frame.click('#leaveBtn');
  await page.waitForFunction(()=>!window.__hideout.isOpen(),null,{timeout:5000}).catch(()=>{});
  check("BACK TO THE HALL drops the overlay (postMessage hideout:exit)",!(await page.evaluate(()=>window.__hideout.isOpen())));
  const heroAfter=await page.evaluate(()=>({x:+window.__dd.hero.x.toFixed(2),z:+window.__dd.hero.z.toFixed(2)}));
  check("the hero is exactly where they stood -- nothing reloaded",heroAfter.x===heroBefore.x&&heroAfter.z===heroBefore.z,JSON.stringify({heroBefore,heroAfter}));
  check("the game is still in its build phase underneath",await page.evaluate(()=>window.__dd.S.phase==='build'));
}
// the reason the contract says ADD, never overwrite: after the Cart used the gear up, a fresh carry lands on top of 0
await page.evaluate(()=>{ const it=window.__dd.rollItem(0); it.rarity=0; window.__meta.onPickup(it); window.__dd.step(1/60,2); });
await page.keyboard.press('KeyE');
await page.waitForFunction(()=>window.__hideout.isOpen(),null,{timeout:5000}).catch(()=>{});
const gearBag2=await page.evaluate(()=>JSON.parse(localStorage.getItem('dd_gear_bag')));
check("a later carry adds to what the Cart left (0+1=1), rather than resurrecting the 5 already crafted away",gearBag2.common===1&&gearBag2.rare===2&&gearBag2.epic===1&&gearBag2.someday==='kept',JSON.stringify(gearBag2));
await page.evaluate(()=>window.__hideout.close());
// an empty bag: E goes straight through, no prompt; then the horn pulls you back out
await page.evaluate(()=>window.__dd.step(1/60,2));
await page.keyboard.press('KeyE');
await page.waitForFunction(()=>window.__hideout.isOpen(),null,{timeout:5000}).catch(()=>{});
check("with nothing to carry, E steps straight through",await page.evaluate(()=>window.__hideout.isOpen()));
await page.evaluate(()=>window.__dd.startWave());
await page.waitForFunction(()=>!window.__hideout.isOpen(),null,{timeout:5000}).catch(()=>{});
check("the horn closes the hideout automatically",!(await page.evaluate(()=>window.__hideout.isOpen()))&&await page.evaluate(()=>window.__dd.S.phase==='wave'));
check("during the wave the archway is gone, so the portal isn't usable",!(await page.evaluate(()=>{ window.__dd.step(1/60,20); return window.__hideout.near(); })));
check("opens counted (carry, the later carry, the empty-bag walk-through)",await page.evaluate(()=>window.__hideout.opens())===3,String(await page.evaluate(()=>window.__hideout.opens())));

// ==== B: the return trip of the full-navigation variant -- a fresh load comes back up from ddMeta ====
const goldBefore=await page.evaluate(()=>{ window.__meta.addGold(1234,'test'); window.__meta.save(); return window.__meta.gold(); });
await page.close();
const page2=await newGamePage();
const restored=await page2.evaluate(()=>({gold:window.__meta.gold(),bag:window.__meta.bag().length,gearBag:JSON.parse(localStorage.getItem('dd_gear_bag'))}));
check("a fresh load restores gold from ddMeta (what the hideout's '/' return relies on)",restored.gold===goldBefore,JSON.stringify({goldBefore,restored}));
check("...and the emptied bag stayed empty, dd_gear_bag intact",restored.bag===0&&restored.gearBag.common===1&&restored.gearBag.someday==='kept',JSON.stringify(restored.gearBag));

// ==== C: the title screen's own way in, outside a run ====
check("a THE HIDEOUT button sits on the title screen",await page2.evaluate(()=>{ const b=document.getElementById('hideoutbtn'); return !!b&&b.textContent.includes('HIDEOUT')&&window.__dd.S.phase==='start'; }));
await page2.click('#hideoutbtn');
await page2.waitForFunction(()=>window.__hideout.isOpen(),null,{timeout:5000}).catch(()=>{});
check("it opens the hideout from the title screen",await page2.evaluate(()=>window.__hideout.isOpen()));
await sleep(600);
check("...and the phase watcher leaves a title-screen visit alone",await page2.evaluate(()=>window.__hideout.isOpen()&&window.__dd.S.phase==='start'));
await page2.evaluate(()=>window.__hideout.close());
check("closed by the game side, back on the title screen",await page2.evaluate(()=>!window.__hideout.isOpen()&&!document.getElementById('start').classList.contains('hide')));
await page2.close();

// ==== D: the hideout page standalone (a plain tab on it, or the Worker deployment) ====
const page3=await ctx.newPage(); page3.on("pageerror",e=>errors.push(String(e)));
await page3.goto(BASE+"/hideout/index.html",{timeout:90000});
await page3.waitForFunction(()=>window.THREE&&document.getElementById('start'),null,{timeout:60000});
check("standalone: the page runs",await page3.evaluate(()=>!!window.THREE&&HIDEOUT_EMBEDDED===false));
check("standalone: no BACK TO THE HALL button (its own crystal portal is the way out, to ../)",await page3.evaluate(()=>!document.getElementById('leaveBtn')));
await page3.close();

const realErrors=errors.filter(e=>!/Failed to load resource|favicon/i.test(e));
// the hideout page carries its own build number (hideout build 9+: <meta name="hideout-build">); the assembler stamps it into the game so the status line shows both builds without opening the overlay
{ const meta=(fs.readFileSync(DIST+"/hideout/index.html","utf8").match(/<meta name="hideout-build" content="(\d+)"/)||[])[1];
  const p=await newGamePage(); const got=await p.evaluate(()=>({build:window.__hideout.build(),line:document.getElementById("buildline").textContent})); await p.close();
  check("the embedded hideout page declares its build number in a meta tag",!!meta&&+meta>=9,String(meta));
  check("the game knows the embedded hideout's build (stamped by assemble.mjs from that meta tag)",String(got.build)===meta,JSON.stringify(got));
  check("the status line reads 'build N · hideout build M · …' so both builds show at a glance",new RegExp("^build \\d{3,} · hideout build "+meta+" · ").test(got.line),got.line); }
check("no page errors (game or hideout)",realErrors.length===0,realErrors.slice(0,5).join(" | "));
await browser.close(); server.close();
console.log(results.filter(Boolean).length+"/"+results.length+" passed");
process.exit(results.some(r=>!r)?1:0);
