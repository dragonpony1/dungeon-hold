// ===== THE JUKEBOX STRIP + NO-3D NOTICE (build 574; 40b-titlemusic.js, head.html). Matt: "a juke box player strip in the top that tells the title and alllows you to skip"; OJ's Chrome could not use WebGL and sat "stuck for ever loading".
// Checked: the strip names the song playing; ⏭ goes to the next in the rotation; 🔇 turns the music off and the strip says MUSIC OFF; a click on it turns it back on. A browser with 3D switched off gets the 3D GRAPHICS ARE OFF card.
import { chromium } from "playwright"; import { serve } from "./serve.mjs";
const server=await serve(8862,{dist:process.env.DIST||"./dist"});
const results=[]; const check=(n,ok,d)=>{ results.push(!!ok); console.log((ok?"PASS ":"FAIL ")+n+(d?"  -> "+d:"")); };
const browser=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader","--autoplay-policy=no-user-gesture-required"]}); const errors=[];
const ctx=await browser.newContext({viewport:{width:1300,height:800}}); const p=await ctx.newPage(); p.on("pageerror",e=>errors.push(String(e)));
await ctx.addInitScript(()=>{ try{ localStorage.setItem("dd_title_song","3"); }catch(e){} });   // the next is ORDER[4] = title3
await p.goto("http://127.0.0.1:8862/"); await p.waitForFunction(()=>window.__titlemusic&&window.__mus,null,{timeout:90000});
await p.mouse.click(700,500,{delay:10}).catch(()=>{});
const wait=async f=>{ for(let i=0;i<60;i++){ const r=await p.evaluate(f); if(r) return r; await p.waitForTimeout(250); } return null; };
await wait(()=>window.__mus.state().playing&&/^title/.test(window.__mus.state().track));
const strip=()=>p.evaluate(()=>{ const b=document.getElementById('jukebox'); return { text:b?b.textContent:'', off:b?b.classList.contains('off'):null, track:window.__mus.state().track, playing:window.__mus.state().playing }; });
const A=await strip(); const N=await p.evaluate(()=>window.__titlemusic.names);
check("the strip says NOW PLAYING and the song's name",/NOW PLAYING/.test(A.text)&&A.text.includes(N[A.track]),JSON.stringify(A));
const before=A.track; await p.click('#jukebox .sk'); for(let i=0;i<60;i++){ const s=await p.evaluate(()=>window.__mus.state()); if(s.playing&&s.track&&s.track!==before) break; await p.waitForTimeout(250); }
const B=await wait(async()=>{ const s=window.__mus.state(); return s.playing&&s.track?s.track:null; }); await p.waitForTimeout(800); const B2=await strip();
check("⏭ skips to the next song in the rotation, and the strip follows",B2.track!==A.track&&/^title/.test(B2.track)&&B2.text.includes(N[B2.track]),JSON.stringify({A:A.track,B2}));
await p.click('#jukebox .mu'); await p.waitForTimeout(700); const C=await strip();
check("🔇 turns the music off and the strip says MUSIC OFF",C.off&&/MUSIC OFF/.test(C.text)&&!C.playing,JSON.stringify(C));
await p.click('#jukebox .nm'); await wait(()=>window.__mus.state().playing); const D=await strip();
check("a click on the strip turns it back on and it plays",!D.off&&D.playing&&/NOW PLAYING/.test(D.text),JSON.stringify(D));
// build 581 (Matt: the hall's music volume / sound off came through to the title with no control there): the strip shows the music volume, and says when it is at 0 or the sound is off
await p.evaluate(()=>window.__sound.set('music',0)); await p.waitForTimeout(600); const V0=await strip(); const vv=await p.evaluate(()=>+document.querySelector('#jukebox .vol').value);
check("music volume at 0 (set in the hall): the strip says MUSIC VOLUME 0 and its slider sits at 0",/MUSIC VOLUME 0/.test(V0.text)&&vv===0,JSON.stringify({V0,vv}));
await p.click('#jukebox .nm'); await p.waitForTimeout(600); const V1=await strip(); const mv=await p.evaluate(()=>window.__sound.get().music);
check("a click on the strip turns it up and it plays",mv>.3&&/NOW PLAYING/.test(V1.text),JSON.stringify({V1,mv}));
await p.evaluate(()=>{ const s=document.querySelector('#jukebox .vol'); s.value='0.25'; s.dispatchEvent(new Event('input',{bubbles:true})); }); const mv2=await p.evaluate(()=>window.__sound.get().music);
check("the slider sets the music volume (the same one as the hall's sound menu)",Math.abs(mv2-.25)<.01,String(mv2));
await p.evaluate(()=>window.__dd.mute()); await p.waitForTimeout(600); const S0=await strip();
check("the game's sound off: the strip says SOUND OFF",/SOUND OFF/.test(S0.text),JSON.stringify(S0));
await p.click('#jukebox .nm'); await p.waitForTimeout(800); const S1=await strip();
check("a click turns the sound back on",!/SOUND OFF/.test(S1.text),JSON.stringify(S1));
check("no page errors",errors.length===0,JSON.stringify(errors.slice(0,3)));
await browser.close();
// a browser with 3D off
const b2=await chromium.launch({args:["--disable-webgl","--disable-webgl2","--disable-3d-apis"]}); const q=await b2.newPage(); await q.goto("http://127.0.0.1:8862/"); await q.waitForTimeout(3000);
const E=await q.evaluate(()=>{ const d=document.getElementById('nowebgl'); return { shown:!!d&&getComputedStyle(d).display!=='none', text:d?d.textContent.slice(0,120):'' }; });
check("3D switched off: the 3D GRAPHICS ARE OFF card, with how to turn it on",E.shown&&/3D GRAPHICS ARE OFF/.test(E.text),JSON.stringify(E));
await b2.close(); server.close(); console.log(results.filter(Boolean).length+"/"+results.length+" passed"); process.exit(results.every(Boolean)?0:1);
