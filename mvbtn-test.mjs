// ===== THE MUSIC VIDEO BUTTON ON THE TITLE (build 584; parts/staging/96s3b-mvbtn.js). Matt: "can we link it from the title screen? ive put it on youtube".
// Checked: the button sits under ▶ TRAILER without overlapping; a click opens the YouTube link in a new tab; the title music pauses meanwhile and picks up when the game gets focus back.
import { chromium } from "playwright"; import { serve } from "./serve.mjs";
const DIST=process.env.DIST||"./dist"; const server=await serve(8857,{dist:DIST});
const results=[]; const check=(n,ok,d)=>{ results.push(!!ok); console.log((ok?"PASS ":"FAIL ")+n+(d?"  -> "+d:"")); };
const browser=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader","--autoplay-policy=no-user-gesture-required"]}); const errors=[];
const ctx=await browser.newContext({viewport:{width:1280,height:720}});
await ctx.route("**/youtu.be/**",r=>r.fulfill({status:200,contentType:"text/html",body:"<title>yt</title>"}));
await ctx.route("**/api/**",r=>r.fulfill({status:200,contentType:"application/json",body:"{}"}));
await ctx.addInitScript(()=>{ try{ localStorage.setItem("dd_cine_seen",JSON.stringify(["prologue","tavern","garden","feast","castle","lantern","torchline","ending"])); }catch(e){} });
const p=await ctx.newPage(); p.on("pageerror",e=>errors.push(String(e)));
await p.goto("http://127.0.0.1:8857/"); await p.waitForFunction(()=>window.__mvbtn&&window.__titlemusic&&window.__mus,null,{timeout:60000});
await p.mouse.click(5,5); for(let i=0;i<80;i++){ const st=await p.evaluate(()=>window.__mus.state()); if(st.playing&&/^title/.test(st.track)) break; await p.waitForTimeout(250); }
const B=await p.evaluate(()=>{ const r=id=>{ const e=document.getElementById(id); if(!e) return null; const b=e.getBoundingClientRect(); return { x:b.left, y:b.top, r:b.right, b:b.bottom, vis:getComputedStyle(e).display!=='none' }; }; return { mv:r('mvbtn'), tr:r('trailerbtn'), cine:r('cinebtn'), text:(document.getElementById('mvbtn')||{}).textContent }; });
check("the 🎬 MUSIC VIDEO button is on the title, right under ▶ TRAILER, not overlapping it",B.mv&&B.mv.vis&&B.tr&&B.mv.y>=B.tr.b-1&&B.mv.y-B.tr.b<14&&Math.abs(B.mv.r-B.tr.r)<2&&/MUSIC VIDEO/.test(B.text),JSON.stringify(B));
await p.screenshot({path:(process.env.TEMP||".")+"/mvbtn-title.png"});
const before=await p.evaluate(()=>({ ac:window.__mvbtn.ac(), track:window.__mus.state().track }));
const [pop]=await Promise.all([ctx.waitForEvent("page",{timeout:10000}).catch(()=>null),p.click("#mvbtn")]);
const url=pop?pop.url():null;
check("a click opens the music video on YouTube in a new tab",url&&/youtu\.be\/JGscUjm0Ehg/.test(url),url);
const during=await p.evaluate(()=>({ ac:window.__mvbtn.ac(), paused:window.__mvbtn.paused(), phase:document.getElementById('start')&&getComputedStyle(document.getElementById('start')).display!=='none'?'start':'gone' }));
check("the title music pauses while the video is open (it was playing before)",before.ac==='running'&&/^title/.test(before.track)&&during.ac==='suspended'&&during.paused&&during.phase==='start',JSON.stringify({before,during}));
if(pop) await pop.close(); await p.bringToFront(); await p.evaluate(()=>window.dispatchEvent(new Event('focus'))); await p.waitForTimeout(400);
const after=await p.evaluate(()=>({ ac:window.__mvbtn.ac(), paused:window.__mvbtn.paused(), track:window.__mus.state().track }));
check("back in the game, the title music picks up again (same song)",after.ac==='running'&&!after.paused&&after.track===before.track,JSON.stringify(after));
check("no page errors",errors.length===0,JSON.stringify(errors.slice(0,3)));
await browser.close(); server.close(); console.log(results.filter(Boolean).length+"/"+results.length+" passed"); process.exit(results.every(Boolean)?0:1);
