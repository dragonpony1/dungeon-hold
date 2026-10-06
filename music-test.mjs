import { chromium } from "playwright"; import http from "http"; import fs from "fs";
import { serve } from "./serve.mjs"; const SP=process.env.SP; const server=await serve(8841);
const results=[]; const check=(n,ok,d)=>{ results.push(ok); console.log((ok?"PASS ":"FAIL ")+n+(d?"  -> "+d:"")); };
const browser=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader","--autoplay-policy=no-user-gesture-required"]}); const page=await browser.newPage({viewport:{width:960,height:600}}); const errors=[]; page.on("pageerror",e=>errors.push(String(e))); page.on("console",m=>{ if(m.type()==="error"||m.type()==="warning") errors.push(m.text().slice(0,200)); });
await page.addInitScript(()=>{ try{ localStorage.setItem("dd_cine_seen",JSON.stringify(["prologue","tavern","garden","feast","castle","lantern","torchline","ending"])); }catch(e){} });   // the story scenes (96s*) would hold the hall on its first visit
await page.goto("http://127.0.0.1:8841/"); await page.waitForFunction(()=>window.__dd&&window.__dd.heroModel&&window.__dd.heroModel()&&window.__mus,null,{timeout:40000});
const s0=await page.evaluate(()=>window.__mus.state());
check("both tracks are embedded; on the start screen the title track is the one asked for (build 561), nothing from the hall",s0.tracks.includes("build")&&s0.tracks.includes("wave")&&(/^title/.test(s0.mode||"")||s0.mode==="none")&&s0.track!=="build"&&s0.track!=="wave",JSON.stringify(s0));
// enter the hall like a player: click the play button (a real gesture), the build theme should decode and start
await page.click("#playbtn"); await page.waitForFunction(()=>window.__mus.state().playing&&window.__mus.state().track==="build",null,{timeout:15000}).catch(()=>{});   // build 561: the title track plays before PLAY, so wait for the hall's own
const s1=await page.evaluate(()=>window.__mus.state());
check("hall theme (the uploaded mp3) plays during the build phase",s1.playing&&s1.track==="build"&&s1.mode==="build"&&s1.decoded.includes("build"),JSON.stringify(s1));
check("audio context is running",s1.ctx==="running","ctx "+s1.ctx);
const dur=await page.evaluate(()=>{ const a=window.__dd; return null; });
// wave: the track stops and the procedural battle loop takes over (its step counter advances)
const s2=await page.evaluate(async()=>{ const d=window.__dd; d.startWave(); d.step(1/60,30); await new Promise(r=>setTimeout(r,1500)); return {mus:window.__mus.state(),m:d.music()}; });
check("battle: the combat track takes over (procedural loop silent)",s2.mus.playing&&s2.mus.track==="wave"&&s2.m.mode==="wave"&&s2.m.step===0,JSON.stringify(s2));
// hall held: back to the mp3
const s3=await page.evaluate(async()=>{ const d=window.__dd; for(const e of d.enemies) d.kill(e); d.S.t+=0; for(let i=0;i<1500&&d.S.phase==="wave";i++){ d.step(1/60,1); for(const e of d.enemies) if(!e.dead) d.kill(e); } await new Promise(r=>setTimeout(r,300)); return {phase:d.S.phase,mus:window.__mus.state(),m:d.music()}; });
check("hall held: the mp3 comes back",s3.phase==="build"&&s3.mus.playing&&s3.mus.track==="build",JSON.stringify(s3));
// N toggles it off and on; M (sound off) silences everything
const s4=await page.evaluate(async()=>{ const d=window.__dd; window.dispatchEvent(new KeyboardEvent("keydown",{code:"KeyN"})); await new Promise(r=>setTimeout(r,200)); const off=window.__mus.state(); window.dispatchEvent(new KeyboardEvent("keydown",{code:"KeyN"})); await new Promise(r=>setTimeout(r,600)); const on=window.__mus.state(); d.mute(); await new Promise(r=>setTimeout(r,200)); const muted=window.__mus.state(); return {off,on,muted}; });
check("N stops and restarts the track",!s4.off.playing&&s4.on.playing&&s4.on.track==="build",JSON.stringify({off:s4.off.playing,on:s4.on.playing}));
check("sound off silences the track",!s4.muted.playing,JSON.stringify(s4.muted));
// the ogre's laugh: fetched as a wav, decoded and played when he arrives
const s5=await page.evaluate(async()=>{ const d=window.__dd; d.setSound?0:0; window.__dd.mute(); document.getElementById("sndbtn").click(); await new Promise(r=>setTimeout(r,300)); for(let i=0;i<150&&!(window.__mus.state().sampleBytes.includes("roar")&&d.mobModel("ogre"));i++) await new Promise(r=>setTimeout(r,100)); const before=window.__mus.state(); const og=d.spawn("ogre","N"); og.x=d.hero.x+5; og.z=d.hero.z; d.step(1/60,2); let shouted=false; for(let i=0;i<60&&!(window.__mus.state().samples.includes("roar"));i++){ if(og.shoutT>0) shouted=true; await new Promise(r=>setTimeout(r,100)); } const after=window.__mus.state(); d.kill(og); return {fetched:before.sampleBytes,decoded:after.samples,shout:shouted||og.shoutT>0}; });
check("ogre arrival plays the laugh sample",s5.fetched.includes("roar")&&s5.decoded.includes("roar"),JSON.stringify(s5));
// the START WAVE horn (build 140): a real sample, fetched at load, decoded and played on the first horn; the beep stays the fallback
const s6=await page.evaluate(async()=>{ for(let i=0;i<100&&!window.__mus.state().sampleBytes.includes("horn");i++) await new Promise(r=>setTimeout(r,100)); const before=window.__mus.state(); const ok=window.__mus.play("horn",.5); await new Promise(r=>setTimeout(r,800)); const after=window.__mus.state(); return {fetched:before.sampleBytes,ok,decoded:after.samples}; });
check("the START WAVE horn is a real sample (assets/sfx-horn.mp3): fetched at load, decoded and played on the first call",s6.fetched.includes("horn")&&s6.ok===true&&s6.decoded.includes("horn"),JSON.stringify(s6));
const s7=await page.evaluate(async()=>{ for(let i=0;i<100&&!window.__mus.state().sampleBytes.includes("place");i++) await new Promise(r=>setTimeout(r,100)); const ok=window.__mus.play("place",.5); await new Promise(r=>setTimeout(r,500)); return {ok,decoded:window.__mus.state().samples}; });
check("a defense set down plays the player's placement clip (assets/sfx-place.mp3, one hit)",s7.ok===true&&s7.decoded.includes("place"),JSON.stringify(s7));
const s8=await page.evaluate(async()=>{ const d=window.__dd; for(let i=0;i<100&&!window.__mus.state().sampleBytes.includes("ballista");i++) await new Promise(r=>setTimeout(r,100)); d.S.mana=999; const h=d.hero; let b=null; for(let dz=3;dz<=12&&!b;dz++) for(let dx=-6;dx<=6&&!b;dx++){ try{ b=d.placeDefAt('harpoon',h.x+dx,h.z+dz,0); }catch(e){} }
  if(!b) b=d.defs.find(x=>x.kind==='harpoon'); if(!b) return {placed:false}; const n0=b.shotN||0; const c0=window.__mus.ballistaClips(); let clipAt=null; const g=d.spawn('goblin','N'); g.hp=g.max=1e6; g.spd=0; const place=()=>{ g.x=b.x+Math.sin(b.rot||0)*4; g.z=b.z+Math.cos(b.rot||0)*4; }; place();   /* straight down the ballista's arc, four tiles out, held there */
  for(let i=0;i<900&&(b.shotN||0)-n0<8;i++){ const before=window.__mus.ballistaClips(); place(); d.step(1/60,1); if(window.__mus.ballistaClips()>before&&clipAt===null) clipAt=b.shotN; await (i%30===0?new Promise(r=>setTimeout(r,0)):null); }
  const shots=(b.shotN||0)-n0, clips=window.__mus.ballistaClips()-c0; d.kill(g); return {placed:true,shots,clips,clipAt,decoded:window.__mus.state().samples}; });
check("a ballista plays the player's shot clip (assets/sfx-ballista.mp3) on every fourth bolt, the synth on the rest",s8.placed&&s8.shots>=8&&s8.clips===Math.floor(s8.shots/4)&&s8.clipAt!==null&&s8.clipAt%4===0,JSON.stringify(s8));
{ const fsm=await import("fs"); const dist=process.env.DIST||new URL("./dist",import.meta.url).pathname; const f=dist+"/assets/sfx-horn.mp3"; const size=fsm.existsSync(f)?fsm.statSync(f).size:0; check("the horn file ships with the dist, one blast (about 67 KB, not the 745 KB three-blast take)",size>40000&&size<120000,String(size)); }
// build 143, the sound menu: the music and effects channels exist on the running context and follow the sliders' values
const mix=await page.evaluate(async()=>{ const S=window.__sound; const b0=S.buses(); S.set('music',.25); S.set('sfx',.6); await new Promise(r=>setTimeout(r,400)); const b1=S.buses(); return {b0,b1,saved:JSON.parse(localStorage.getItem('dd_audio')),playing:window.__mus.state().playing}; });
check("the sound menu's two channels are live on the running audio: music 0.25 and effects 0.6 after setting them, saved in dd_audio",!!mix.b0&&Math.abs(mix.b1.music-.25)<.03&&Math.abs(mix.b1.sfx-.6)<.03&&mix.saved.music===.25&&mix.saved.sfx===.6,JSON.stringify(mix));
const realErrors=errors.filter(e=>!/Failed to load resource|favicon/i.test(e));
check("no page errors",realErrors.length===0,realErrors.slice(0,3).join(" | "));
await browser.close(); server.close(); console.log(results.filter(Boolean).length+"/"+results.length+" passed");
