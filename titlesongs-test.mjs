// ===== THE TITLE SONG ROTATION (build 566; parts/staging/40b-titlemusic.js). Matt: "add this to the title screen song rotation. but start it when the lyrics start".
// Checked: two songs (Heartroot Rap, Guard the Heartroot), both shipped; each opening of the title plays the next one in turn; a song plays once through and the next follows; PLAY still hands over to the hall.
import { chromium } from "playwright"; import fs from "fs"; import { serve } from "./serve.mjs";
const DIST=process.env.DIST||"./dist"; const server=await serve(8854,{dist:DIST});
const results=[]; const check=(n,ok,d)=>{ results.push(!!ok); console.log((ok?"PASS ":"FAIL ")+n+(d?"  -> "+d:"")); };
const browser=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader","--autoplay-policy=no-user-gesture-required"]}); const errors=[];
const ctx=await browser.newContext({viewport:{width:960,height:600}});
await ctx.addInitScript(()=>{ try{ localStorage.setItem("dd_cine_seen",JSON.stringify(["prologue","tavern","garden","feast","castle","lantern","torchline","ending"])); }catch(e){} });
const sizes=["music-title.mp3","music-title2.mp3","music-title3.mp3","music-title4.mp3"].map(f=>fs.existsSync(DIST+"/assets/"+f)?fs.statSync(DIST+"/assets/"+f).size:0);
check("all four title songs ship with the build (each a couple of MB)",sizes.every(s=>s>1.5e6&&s<5e6),JSON.stringify(sizes));
async function visit(){ const p=await ctx.newPage(); p.on("pageerror",e=>errors.push(String(e))); await p.goto("http://127.0.0.1:8854/"); await p.waitForFunction(()=>window.__titlemusic&&window.__mus,null,{timeout:60000});
  await p.mouse.click(5,5); let s=null; for(let i=0;i<80;i++){ s=await p.evaluate(()=>({ song:window.__titlemusic.song(), st:window.__mus.state() })); if(s.st.playing&&/^title/.test(s.st.track)) break; await p.waitForTimeout(250); } return { p, s }; }
const v1=await visit(); const v2=await visit(); const v3=await visit();
const names=[v1,v2,v3].map(v=>v.s.st.track);
check("each time the title opens it plays the next song in turn",names[0]!==names[1]&&names[0]===names[2]&&names.every(n=>/^title[234]?$/.test(n)),JSON.stringify(names));
const O=await v1.p.evaluate(()=>window.__titlemusic.order());
check("build 567: the country one (title4) comes every other song, and the other three each get a turn between",O.length===6&&O.filter((x,i)=>i%2===0).every(x=>x==='title4')&&new Set(O.filter((x,i)=>i%2===1)).size===3&&names[0]==='title4'&&names[2]==='title4'&&names[1]!=='title4',JSON.stringify({O,names}));
// a song ends: the next one follows (jump the playing song to its last second)
const E=await v3.p.evaluate(async()=>{ const before=window.__mus.state().track; for(let i=0;i<20&&window.__titlemusic.looping();i++) await new Promise(r=>setTimeout(r,100)); const looped=window.__titlemusic.looping(); window.__titlemusic.finish(); for(let i=0;i<80;i++){ await new Promise(r=>setTimeout(r,250)); const st=window.__mus.state(); if(st.playing&&st.track!==before){ for(let k=0;k<20&&window.__titlemusic.looping();k++) await new Promise(r=>setTimeout(r,100)); return { before, after:st.track, looped, loop:window.__titlemusic.looping(), info:window.__titlemusic.info() }; } } return { before, looped, after:window.__mus.state().track, info:window.__titlemusic.info() }; });
check("when a song ends, the other one follows (and it too plays once through, not on a loop)",E.after&&E.after!==E.before&&/^title/.test(E.after)&&E.info.advanced===1&&E.looped===false&&E.loop===false,JSON.stringify(E));
await v3.p.click("#playbtn"); await v3.p.waitForFunction(()=>window.__mus.state().track==="build",null,{timeout:20000}).catch(()=>{});
const H=await v3.p.evaluate(()=>window.__mus.state().track);
check("PLAY hands over to the hall's music",H==="build",H);
check("no page errors",errors.length===0,JSON.stringify(errors.slice(0,3)));
await browser.close(); server.close(); console.log(results.filter(Boolean).length+"/"+results.length+" passed"); process.exit(results.every(Boolean)?0:1);
