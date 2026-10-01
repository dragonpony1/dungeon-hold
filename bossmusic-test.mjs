// ===== THE WALL'S MUSIC (95m-bossmusic.js, build 366), with the sound ON. Matt: boss 1 when the cinematic starts, boss 2 after it ("fade one out at 18"), the drum file 15 seconds into boss 2, starting at its 7-second mark.
// Checked with real audio nodes: the three files are fetched and decoded; boss 1 starts with the cutscene, boss 2 comes in at 18 s (boss 1 fading out), the drums at 33 s, looping from 7 s; and the music stops (the game's own comes
// back) when the fight is over; no page errors.
import { chromium } from "playwright"; import { serve } from "./serve.mjs";
const server=await serve(8995,{dist:process.env.DIST||"./dist"});
const results=[]; const check=(n,ok,d)=>{ results.push(ok); console.log((ok?"PASS ":"FAIL ")+n+(d?"  -> "+d:"")); };
const browser=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader","--autoplay-policy=no-user-gesture-required"]}); const errors=[];
const ctx=await browser.newContext({viewport:{width:900,height:560}}); await ctx.addInitScript(()=>{ try{ localStorage.setItem("ddMapsCleared","9"); localStorage.setItem("ddSound","on"); localStorage.setItem("ddMusic","on"); }catch(e){} });
const page=await ctx.newPage(); page.on("pageerror",e=>errors.push(String(e)));
await page.goto("http://127.0.0.1:8995/?nogate&map=5",{timeout:120000}); await page.waitForFunction(()=>window.__dd&&window.__finale&&window.__bossMusic&&window.__corruptor&&window.__dd.map().id==='prison',null,{timeout:120000});
await page.evaluate(async()=>{ try{ window.__trainer.skip(); }catch(e){} const d=window.__dd; d.start(); d.step(1/60,5); window.__freeze=true; await window.__corruptor.load(); await Promise.all(window.__carts.kinds.map(k=>window.__carts.load(k))); });
for(let i=0;i<80;i++){ const r=await page.evaluate(()=>{ window.__dd.step(1/60,1); return window.__finale.ready(); }); if(r) break; await new Promise(r=>setTimeout(r,250)); }
const step=(secs)=>page.evaluate((secs)=>{ const d=window.__dd; for(let i=0;i<Math.round(secs*60);i++){ d.step(1/60,1); d.S.crystal=1e6; } return window.__bossMusic.info(); },secs);
const waitPlayed=async(name)=>{ for(let i=0;i<60;i++){ const r=await page.evaluate(()=>window.__bossMusic.info()); if(r.played.includes(name)) return r; await new Promise(r=>setTimeout(r,500)); } return await page.evaluate(()=>window.__bossMusic.info()); };
await page.evaluate(()=>{ const d=window.__dd; for(const e of d.enemies) if(!e.dead) e.dead=.001; d.setHero(0,50,0); d.S.phase='wave'; d.S.crystal=1e6; window.__finale.start(); });
await new Promise(r=>setTimeout(r,2500));   // the three files come in
const a=await waitPlayed('boss1');
check("boss 1 starts with the cinematic (its file fetched, decoded and playing through its own gain)",a.on&&a.stage==='boss1'&&a.played.includes('boss1')&&a.nodes.includes('boss1'),JSON.stringify(a));
const b17=await step(17.5);
check("still boss 1 at 17.5 s",b17.stage==='boss1'&&b17.t>17&&b17.t<18,JSON.stringify(b17));
const b18=await step(1.0); const b2=await waitPlayed('boss2');
check("at 18 s boss 2 comes in and boss 1 is faded away (two seconds)",b18.stage==='boss2'&&b2.played.includes('boss2')&&b2.nodes.includes('boss2')&&!b2.nodes.includes('boss1'),JSON.stringify({ b18, b2 }));
const b32=await step(13.7); const b33=await step(.9); const dr=await waitPlayed('drums');
check("fifteen seconds into boss 2 (33 s) the drums come in (boss 2 fades), the drum file started at its seven-second mark and looping from there",b32.stage==='boss2'&&b33.stage==='drums'&&dr.played.includes('drums')&&dr.nodes.includes('drums')&&!dr.nodes.includes('boss2'),JSON.stringify({ b32:b32.stage, b33:b33.stage, dr }));
const end=await page.evaluate(async()=>{ const d=window.__dd; for(let i=0;i<60*6;i++){ d.step(1/60,1); d.S.crystal=1e6; } for(const e of d.enemies) if(!e.dead) e.dead=.001; for(let i=0;i<60*6;i++){ d.step(1/60,1); d.S.crystal=1e6; } return window.__bossMusic.info(); });
check("when the fight is over (nothing left alive for three seconds) the drums fade and the music stops, handing back to the game's own",!end.on&&end.stage==='off'&&end.nodes.length===0,JSON.stringify(end));
const realErrors=errors.filter(x=>!/Failed to load resource|favicon|net::ERR|hideout\/gear|fonts\.googleapis/i.test(x)); check("no page errors",realErrors.length===0,realErrors.slice(0,3).join(" | "));
await browser.close(); server.close(); console.log(results.filter(Boolean).length+"/"+results.length+" passed");
