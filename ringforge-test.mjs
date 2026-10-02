// ===== THE FAMILIAR RINGS COME OUT OF THE FORGE (hideout build 81). Matt: "the rings can come out of the forge right? since they are named?"
// Checked: the hideout knows both as named trinkets with their pictures and 3D models; the forge's trinket proc can roll each; a forged one, handed to the game, is the game's Beast Mode / Malamute (the 2nd familiar
// slot opens when it is worn); no page errors.
import { chromium } from "playwright"; import { serve } from "./serve.mjs";
const server=await serve(9011,{dist:process.env.DIST||"./dist"});
const results=[]; const check=(n,ok,d)=>{ results.push(ok); console.log((ok?"PASS ":"FAIL ")+n+(d?"  -> "+d:"")); };
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const browser=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]}); const errors=[];
const page=await (await browser.newContext({viewport:{width:1100,height:700}})).newPage(); page.on("pageerror",e=>errors.push(String(e)));
await page.addInitScript(()=>{ try{ localStorage.setItem("ddMapsCleared","9"); localStorage.setItem("ddSound","off"); localStorage.setItem("dd_talent_card","1"); }catch(e){} });
await page.goto("http://127.0.0.1:9011/?silent&nogate",{timeout:120000}); await page.waitForFunction(()=>window.__dd&&window.__hideout&&window.__tworings&&window.__dd.heroModel(),null,{timeout:120000});
await page.evaluate(()=>{ const d=window.__dd; try{ window.__trainer.skip(); }catch(e){} d.start(); d.step(1/60,3); d.setHero(30,30); window.__hideout.open(); });
let f=null; for(let i=0;i<600&&!f;i++){ f=page.frames().find(x=>x.url().includes("hideout/index.html")); if(!f) await sleep(50); }
await f.waitForFunction(()=>typeof namedRecord==="function"&&typeof NAMED_MYTHICS!=="undefined"&&typeof pieceFromForged==="function",null,{timeout:120000});
const H=await f.evaluate(async()=>{ const out={ build:HIDEOUT_BUILD }; for(const id of ['beast_mode','malamute']){ const N=NAMED_MYTHICS[id]; let rec=null; for(let i=0;i<800&&!rec;i++){ const r=namedRecord('trinket'); if(r.named===id) rec=r; }
    const piece=rec?pieceFromForged(rec):null; out[id]={ entry:!!N&&N.type==='trinket', art:N?await fetch(N.art).then(r=>r.status):0, glb:await fetch(NAMED_3D_DIR+id+'.glb.txt').then(r=>r.status).catch(()=>0), has3d:NAMED_3D.has(id), rolled:!!rec, rec, name:piece&&piece.name }; } return out; });
check("the hideout knows both rings as named trinkets, with their pictures and 3D models",H.build>=81&&['beast_mode','malamute'].every(k=>H[k].entry&&H[k].art===200&&H[k].glb===200&&H[k].has3d),JSON.stringify({b:H.beast_mode&&{...H.beast_mode,rec:undefined},m:H.malamute&&{...H.malamute,rec:undefined}}));
check("the forge's trinket proc can roll each of them",H.beast_mode.rolled&&H.malamute.rolled&&H.beast_mode.name==='Beast Mode'&&H.malamute.name==='Malamute',JSON.stringify({b:H.beast_mode.name,m:H.malamute.name}));
const G=await page.evaluate(rec=>{ const it=window.__mythic.normalize(rec); if(!it) return { it:null }; const M=window.__meta; M.giveItem(it); M.equip(it.id); return { named:it.named, slot:it.slot, ringOn:window.__tworings.ringOn() }; },H.malamute.rec);
check("a forged ring, handed to the game, is the game's own -- worn, the 2nd familiar slot opens",G.named==='malamute'&&G.slot==='charm'&&G.ringOn,JSON.stringify(G));
check("no page errors",errors.length===0,JSON.stringify(errors.slice(0,3)));
await browser.close(); server.close(); console.log(results.filter(Boolean).length+"/"+results.length+" passed"); process.exit(results.every(Boolean)?0:1);
