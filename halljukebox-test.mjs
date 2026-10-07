// ===== THE JUKEBOX IN THE HALL (build 582; parts/staging/99t-jukebox.js). Matt: "id love to have this juke box option in game".
// Checked: the 🎵 button opens the jukebox (the hall theme + the five title songs); a tap plays that song in the build phase; J moves to the next one with a NOW PLAYING card; a wave plays its
// battle music and the pick comes back after; the pick is remembered across a reload.
import { chromium } from "playwright"; import { serve } from "./serve.mjs";
const server=await serve(8878,{dist:process.env.DIST||"./dist"});
const results=[]; const check=(n,ok,d)=>{ results.push(!!ok); console.log((ok?"PASS ":"FAIL ")+n+(d?"  -> "+d:"")); };
const browser=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader","--autoplay-policy=no-user-gesture-required"]}); const errors=[];
const ctx=await browser.newContext({viewport:{width:1300,height:800}}); const p=await ctx.newPage(); p.on("pageerror",e=>errors.push(String(e)));
await ctx.addInitScript(()=>{ try{ localStorage.setItem("dd_cine_seen",JSON.stringify(["prologue","tavern","garden","feast","castle","lantern","torchline","ending"])); localStorage.setItem("dd_talent_card","1"); }catch(e){} });
const go=async()=>{ await p.goto("http://127.0.0.1:8878/?nogate",{timeout:120000}); await p.waitForFunction(()=>window.__dd&&window.__jukebox&&window.__mus&&window.__dd.heroModel(),null,{timeout:120000}); await p.click('#playbtn'); await p.waitForFunction(()=>window.__mus.state().track==="build"||window.__dd.S.phase==='build',null,{timeout:20000}); };
await go(); try{ await p.evaluate(()=>{ try{ window.__trainer.skip(); }catch(e){} }); }catch(e){}
const waitTrack=async t=>{ for(let i=0;i<60;i++){ const s=await p.evaluate(()=>window.__mus.state()); if(s.playing&&s.track===t) return s; await p.waitForTimeout(250); } return await p.evaluate(()=>window.__mus.state()); };
const A=await p.evaluate(()=>{ document.getElementById('musbtn').click(); const pop=document.getElementById('jbpop'); return { open:pop.classList.contains('on'), rows:pop.querySelectorAll('.s').length, text:pop.textContent }; });
check("the 🎵 button opens the jukebox: the hall theme and the five title songs",A.open&&A.rows===6&&/Hall Theme/.test(A.text)&&/Country/.test(A.text),JSON.stringify(A).slice(0,200));
await p.evaluate(()=>document.querySelector('#jbpop .s[data-k="title4"]').click()); const B=await waitTrack('title4'); const Bj=await p.evaluate(()=>window.__jukebox.info());
check("a tap on the country song plays it in the build phase",B.playing&&B.track==='title4'&&Bj.pick==='title4',JSON.stringify({track:B.track,pick:Bj.pick}));
await p.evaluate(()=>window.__jukebox.close()); await p.keyboard.press('KeyJ'); const C=await waitTrack('title5'); const Cj=await p.evaluate(()=>window.__jukebox.info());
check("J: the next song (the sea chanty), with the NOW PLAYING card",C.track==='title5'&&Cj.card&&Cj.pick==='title5',JSON.stringify({track:C.track,card:Cj.card}));
await p.evaluate(()=>{ const d=window.__dd; d.startWave(); for(let i=0;i<4;i++) d.spawn('goblin','S'); }); const D=await waitTrack('wave');
check("a wave plays its battle music",D.track==='wave',JSON.stringify({track:D.track}));
await p.evaluate(async()=>{ const d=window.__dd; for(let i=0;i<1500&&d.S.phase==='wave';i++){ d.step(1/60,1); for(const e of d.enemies) if(!e.dead) d.kill(e); if(i%60===0) await new Promise(r=>setTimeout(r,0)); } }); const E=await waitTrack('title5');
check("the hall held: your pick comes back",E.track==='title5',JSON.stringify({track:E.track,phase:await p.evaluate(()=>window.__dd.S.phase)}));
await go(); const F=await waitTrack('title5'); check("remembered across a reload",F.track==='title5',JSON.stringify({track:F.track}));
check("no page errors",errors.length===0,JSON.stringify(errors.slice(0,3)));
await browser.close(); server.close(); console.log(results.filter(Boolean).length+"/"+results.length+" passed"); process.exit(results.every(Boolean)?0:1);
