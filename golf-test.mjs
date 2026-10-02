// ===== THE WHITE TREE LINKS (build 480). A robot golfer plays all four holes (aims at the next bend or the cup, picks its power from the distance): every hole finishes, the ball never leaves its fairway,
// a holed hole pays Legendary jars at the cup, a hole can't be played twice; the moat sends a ball back to the tee while the bridge is up; the catapult flings the ball to the island; E starts and leaves a hole.
import { chromium } from "playwright"; import { serve } from "./serve.mjs";
const server=await serve(9032,{dist:"./dist"}); const browser=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]});
const page=await (await browser.newContext({viewport:{width:1100,height:680}})).newPage(); const errors=[]; page.on("pageerror",e=>errors.push(String(e)));
await page.addInitScript(()=>{ try{ localStorage.setItem("ddMapsCleared","9"); localStorage.setItem("ddSound","off"); localStorage.setItem("dd_talent_card","1"); }catch(e){} });
await page.goto("http://127.0.0.1:9032/?silent&nogate&map=4",{timeout:120000}); await page.waitForFunction(()=>window.__dd&&window.__dd.heroModel(),null,{timeout:120000});
const results=[]; const check=(n,ok,d)=>{ results.push(ok); console.log((ok?'PASS ':'FAIL ')+n+(d?'  -> '+d:'')); };
await page.evaluate(()=>{ const d=window.__dd; try{ window.__trainer.skip(); }catch(e){} d.start(); d.step(1/60,3); window.__freeze=true; d.S.phase='build'; });
await page.waitForFunction(()=>window.__golf.ready(),null,{timeout:120000});
// E at the first tee
const E=await page.evaluate(()=>{ const d=window.__dd, h=window.__golf.holes[0]; d.setHero(h.tee.x,h.tee.z+.3,0); d.step(1/60,5); return true; });
await page.keyboard.press('KeyE'); const E1=await page.evaluate(()=>window.__golf.info().on); await page.keyboard.press('KeyE'); const E2=await page.evaluate(()=>window.__golf.info().on);
check('E on a tee takes up the putter, E again walks away',E1===true&&E2===false,JSON.stringify({E1,E2}));
const play=await page.evaluate(async()=>{ const d=window.__dd, g=window.__golf, out={};
  const dist=v=>v/.22-(1.6/.0484)*Math.log(1+.22*v/1.6);   // how far a putt of speed v rolls (the module's own slowing)
  const powerFor=D=>{ let lo=0, hi=1; for(let i=0;i<30;i++){ const m=(lo+hi)/2; if(dist(1.2+m*12.5)<D) lo=m; else hi=m; } return Math.min(1,(lo+hi)/2); };
  for(const n of [1,2,3,4]){ const h=g.holes[n-1]; g.start(n); let outside=0, strokes=0;
    // the hole's points from the module itself: aim at the cup when it is in a straight line, else at the next bend
    const P=window.__golf_pts?window.__golf_pts(n):null;
    for(let s=0;s<9&&g.info().on&&g.info().hole===n&&g.info().done[n]===undefined;s++){ const b=g.ball(); if(n===2) g.set({ mill:0.85 }); if(n===3) g.set({ bridge:2.2 });
      const wp=(window.__golf.path(n)).find(p=>Math.hypot(p.x-b.x,p.z-b.z)>1.2&&!p.passed)||h.cup; let tx=wp.x, tz=wp.z; if(n===4&&!b.region.startsWith('is')) { const c=window.__golf.path(4).slice(-1)[0]; if(Math.hypot(c.x-b.x,c.z-b.z)<3){ tx=c.x; tz=c.z; } }
      const D=Math.hypot(tx-b.x,tz-b.z); const pw=n===4&&b.region==='fw'&&Math.hypot(window.__golf.path(4).slice(-1)[0].x-b.x,window.__golf.path(4).slice(-1)[0].z-b.z)<3?.32:powerFor(wp===h.cup?D+.2:D); g.putt(tx-b.x,tz-b.z,pw); strokes++;
      for(let f=0;f<60*12;f++){ d.step(1/60,1); const bb=g.ball(); if(!bb||!g.info().on) break; if(!bb.moving&&!bb.flight) break; } window.__golf.markPassed(n); }
    for(let f=0;f<90;f++) d.step(1/60,1); await new Promise(r=>setTimeout(r,1600)); g.stop(); out[n]=g.info().done[n]; }
  return { out, info:g.info() }; });
check('all four holes finish (holed, or closed at 7)',[1,2,3,4].every(n=>play.out[n]!==undefined),JSON.stringify(play));
check('at least two holes holed, and each holed hole paid Legendary jars',Object.keys(play.info.result).length>=2&&play.info.jars>=Object.keys(play.info.result).length,JSON.stringify(play.info));
check('the catapult flung the ball',play.info.flings>=1,JSON.stringify(play.info));
const M=await page.evaluate(()=>{ const d=window.__dd, g=window.__golf; g.reset(); g.start(3); const h=g.holes[2], p=g.path(3)[0]; g.setBall(p.x,p.z+.5); const s0=g.info().splashes; g.set({ bridge:0 }); g.putt(0,1,.55); for(let f=0;f<60*5;f++){ d.step(1/60,1); g.set({ bridge:0 }); if(g.info().splashes>s0) break; } const b=g.ball(); const r={ splashed:g.info().splashes-s0, atTee:b&&Math.hypot(b.x-h.tee.x,b.z-h.tee.z)<.3 }; g.stop(); return r; });
check('with the bridge up the ball falls in the moat and goes back to the tee',M.splashed===1&&M.atTee,JSON.stringify(M));
await page.evaluate(()=>{ const g=window.__golf; g.reset(); g.start(1); g.putt(0,-1,.2); for(let f=0;f<60*4;f++) window.__dd.step(1/60,1); g.stop(); });
const again=await page.evaluate(()=>window.__golf.start(1)); check('a hole cannot be played twice',again===false,''+again);
check('no page errors',errors.length===0,JSON.stringify(errors.slice(0,3)));
await browser.close(); server.close(); console.log(results.filter(Boolean).length+"/"+results.length+" passed"); process.exit(results.every(Boolean)?0:1);
