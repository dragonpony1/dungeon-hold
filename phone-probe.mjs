// Phone pass helper: open the game in WebKit (Safari's engine) as an iPhone in landscape, run a scene, screenshot it.
//   node phone-probe.mjs <scene> [<scene> ...]      scenes below; pictures -> TEMP/iph/<scene>.png
//   PORTRAIT=1 for the phone held upright; DIST=... for another build (default ./dist2)
import { webkit, devices } from "playwright"; import fs from "fs"; import { serve } from "./serve.mjs";
const OUT=(process.env.TEMP||".")+"/iph"; fs.mkdirSync(OUT,{recursive:true});
const server=await serve(8873,{dist:process.env.DIST||"./dist2"});
const base=devices[process.env.PORTRAIT?'iPhone 14 Pro':'iPhone 14 Pro landscape'];
// a real iPhone follows the page's viewport tag (head.html: landscape lays out ~600 tall and is scaled to fit); WebKit on Windows does not, so lay out at that size here and scale the same way
const L=Math.max(base.screen.width,base.screen.height), Sx=Math.min(base.screen.width,base.screen.height), dpx=base.viewport.width*base.deviceScaleFactor;
const dev=process.env.PORTRAIT||process.env.RAW?base:{...base, viewport:{width:Math.round(600*L/Sx),height:Math.round(600*L/Sx*base.viewport.height/base.viewport.width)}, deviceScaleFactor:dpx/Math.round(600*L/Sx)};
const browser=await webkit.launch();
const SCENES={
  title:async p=>{},
  hall:async p=>{ await p.evaluate(async()=>{ const d=window.__dd; try{ window.__trainer.skip(); }catch(e){} d.start(); for(let i=0;i<60;i++){ d.step(1/30,1); await new Promise(r=>setTimeout(r,10)); } }); },
  wave:async p=>{ await SCENES.hall(p); await p.evaluate(async()=>{ const d=window.__dd; d.startWave(); for(let i=0;i<150;i++){ d.step(1/30,1); if(i%10===0) await new Promise(r=>setTimeout(r,10)); } }); },
  bag:async p=>{ await SCENES.hall(p); await p.evaluate(()=>window.__meta.open()); await p.waitForTimeout(600); },
  talents:async p=>{ await SCENES.hall(p); await p.evaluate(()=>window.dispatchEvent(new KeyboardEvent('keydown',{code:'KeyN',bubbles:true}))); await p.waitForTimeout(600); },
  sheet:async p=>{ await SCENES.hall(p); await p.evaluate(()=>{ try{ window.__doll.open(); }catch(e){} }); await p.waitForTimeout(600); },
  play:async p=>{ await SCENES.hall(p); const R={};
    const box=async sel=>p.evaluate(s=>{ const e=document.querySelector(s); if(!e) return null; const r=e.getBoundingClientRect(); return { x:r.left+r.width/2, y:r.top+r.height/2, w:r.width, h:r.height }; },sel);
    const slot=await p.evaluate(()=>{ const e=[...document.querySelectorAll('#hotbar .slot, #hotbar > *')].find(x=>x.getBoundingClientRect().width>20); if(!e) return null; const r=e.getBoundingClientRect(); return { x:r.left+r.width/2, y:r.top+r.height/2 }; });
    R.slot=slot; if(slot){ await p.touchscreen.tap(slot.x,slot.y); await p.waitForTimeout(300); }
    R.placing1=await p.evaluate(()=>!!document.body.className.match(/placing/)||!!(window.__dd.ghost&&window.__dd.ghost()&&window.__dd.ghost().ok!==undefined));
    const vw=await p.evaluate(()=>[innerWidth,innerHeight]); await p.touchscreen.tap(vw[0]*.5,vw[1]*.62); await p.waitForTimeout(300);
    const ok=await box('#btns .hb:nth-child(3)'); R.btns=await p.evaluate(()=>[...document.querySelectorAll('#btns .hb')].map(b=>b.textContent+':'+Math.round(b.getBoundingClientRect().width)));
    const defs0=await p.evaluate(()=>window.__dd.defs.length); const conf=await p.evaluate(()=>{ const b=[...document.querySelectorAll('#btns .hb')].find(x=>x.textContent==='✔'); if(!b) return null; const r=b.getBoundingClientRect(); return { x:r.left+r.width/2, y:r.top+r.height/2 }; });
    if(conf){ await p.touchscreen.tap(conf.x,conf.y); await p.waitForTimeout(400); } R.defs=[defs0,await p.evaluate(()=>window.__dd.defs.length)];
    const wb=await box('#wavebtn'); if(wb){ await p.touchscreen.tap(wb.x,wb.y); await p.waitForTimeout(300); } R.phase=await p.evaluate(()=>window.__dd.S.phase);
    console.log('PLAY',JSON.stringify(R)); },
  raven:async p=>{ await SCENES.hall(p); await p.evaluate(async()=>{ const d=window.__dd, R=window.__raven.pos(); d.hero.x=R.x+1.2; d.hero.z=R.z+1.2; for(let i=0;i<20;i++){ d.step(1/30,1); await new Promise(r=>setTimeout(r,10)); } }); },
};
const want=process.argv.slice(2); const list=want.length?want:['title'];
for(const name of list){ const ctx=await browser.newContext({...dev});
  await ctx.addInitScript(f=>{ try{ if(f){ localStorage.setItem("ddMapsCleared","9"); localStorage.setItem("dd_talent_card","1"); localStorage.setItem("dd_cine_seen",JSON.stringify(["prologue","tavern","garden","feast","castle","lantern","torchline","ending"])); localStorage.setItem("dd_bag_guide","1"); } localStorage.setItem("ddSound","off"); }catch(e){} },!process.env.FRESH);
  const page=await ctx.newPage(); const errs=[]; page.on("pageerror",e=>errs.push(String(e).slice(0,200)));
  await page.route("**/api/**",r=>r.fulfill({status:200,contentType:"application/json",body:"{}"}));
  await page.goto("http://127.0.0.1:8873/?silent"+(process.env.QS||""),{timeout:180000});
  try{ await page.waitForFunction(()=>window.__dd&&window.__dd.heroModel&&window.__dd.heroModel(),null,{timeout:180000}); }catch(e){}
  const S=SCENES[name]; if(S) await S(page); else console.log('no scene',name);
  await page.waitForTimeout(400); console.log("PHONEINFO",name,await page.evaluate(()=>{ const ph=window.__phone&&window.__phone.info(); let tex=null; try{ tex=window.__dd.renderer.info.memory.textures; }catch(e){} const m=document.body.innerText.match(/everything in[^|]*/); return JSON.stringify({ ph, tex, load:m?m[0].slice(0,60):"" }); }));
  await page.screenshot({path:`${OUT}/${name}${process.env.PORTRAIT?'-portrait':''}.png`});
  const over=await page.evaluate(()=>{ const W=innerWidth, H=innerHeight, out=[]; for(const el of document.querySelectorAll('body *')){ const cs=getComputedStyle(el); if(cs.display==='none'||cs.visibility==='hidden'||+cs.opacity===0) continue; const r=el.getBoundingClientRect(); if(r.width<2||r.height<2) continue; if((cs.position==='fixed'||cs.position==='absolute')&&(r.right>W+2||r.bottom>H+2||r.left<-2||r.top<-2)&&el.id) out.push(el.id+':'+Math.round(r.left)+','+Math.round(r.top)+','+Math.round(r.width)+'x'+Math.round(r.height)); } return out.slice(0,12); });
  console.log(name,'viewport',innerW(dev),'off-screen:',over.join(' | ')||'-','errors:',errs.length?errs.slice(0,3).join(' | '):'0');
  await ctx.close(); }
function innerW(d){ return d.viewport.width+'x'+d.viewport.height; }
await browser.close(); server.close();
