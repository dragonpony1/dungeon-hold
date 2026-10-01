// ===== THE PRISON'S MOBS (95o-prisonmobs.js, build 367). Matt: "ok we can get rid of the ogre sound for this map" and "increase the health of all the mobs except the boss by 100%". Checked on THE DEEP PRISON: every mob that
// comes out (a gate's goblins, orcs, ogres, bandits, drakes, a cart and its two orcs) has exactly double the health the game gives it, the Corruptor (the boss) its own; each is doubled once only; the ogre's roar sound is gone
// (SFX.roar does nothing); and on another map nothing of this applies.
import { chromium } from "playwright"; import { serve } from "./serve.mjs";
const server=await serve(8994,{dist:process.env.DIST||"./dist"});
const results=[]; const check=(n,ok,d)=>{ results.push(ok); console.log((ok?"PASS ":"FAIL ")+n+(d?"  -> "+d:"")); };
const browser=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]}); const errors=[];
const ctx=await browser.newContext({viewport:{width:900,height:560}}); await ctx.addInitScript(()=>{ try{ localStorage.setItem("ddMapsCleared","9"); localStorage.setItem("ddSound","off"); }catch(e){} });
const page=await ctx.newPage(); page.on("pageerror",e=>errors.push(String(e)));
await page.goto("http://127.0.0.1:8994/?silent&nogate&map=5",{timeout:120000}); await page.waitForFunction(()=>window.__dd&&window.__prisonmobs&&window.__corruptor&&window.__carts&&window.__dd.map().id==='prison',null,{timeout:120000});
await page.evaluate(async()=>{ try{ window.__trainer.skip(); }catch(e){} const d=window.__dd; d.start(); d.step(1/60,5); await window.__corruptor.load(); await Promise.all(window.__carts.kinds.map(k=>window.__carts.load(k))); d.S.phase='wave'; d.S.crystal=1e6; });
const A=await page.evaluate(()=>{ const d=window.__dd, P=window.__prisonmobs; const one=(kind,x)=>{ P.setX(x); const n=d.enemies.length; d.spawn(kind,'E'); const e=d.enemies[n]; return { max:e.max, hp:e.hp, hpx:e.hpx, kind:e.kind }; }; const out={};
  for(const k of ['goblin','orc','archer','ogre','drake','troll']){ const a=one(k,1), b=one(k,2); out[k]={ base:a.max, dbl:b.max, same:b.hp===b.max, once:b.hpx===2 }; }
  const c1=one('corruptor',1), c2=one('corruptor',2); out.corruptor={ base:c1.max, dbl:c2.max };
  P.setX(1); const n1=d.enemies.length; d.spawn('kegcart','E'); const crew1=d.enemies.slice(n1).map(e=>e.max); P.setX(2); const n2=d.enemies.length; d.spawn('kegcart','E'); const crew2=d.enemies.slice(n2).map(e=>e.max);
  out.team={ kinds:d.enemies.slice(n2).map(e=>e.kind), base:crew1, dbl:crew2 }; P.setX(2); return { out, silenced:P.roarSilenced(), info:P.info() }; });
const ratios=Object.entries(A.out).filter(([k])=>!['corruptor','team'].includes(k)).map(([k,v])=>[k,v.dbl/v.base]);
check("every kind of mob that comes out of the prison's gates has exactly double the health the game would give it (goblin, orc, bandit, ogre, drake, troll archer), full health, doubled once",ratios.length===6&&ratios.every(([k,r])=>Math.abs(r-2)<=.01)&&Object.values(A.out).filter(v=>v.once!==undefined).every(v=>v.same&&v.once),JSON.stringify(A.out));
check("the boss (the Corruptor) keeps its own health",A.out.corruptor.base===A.out.corruptor.dbl&&A.out.corruptor.base>0,JSON.stringify(A.out.corruptor));
check("a siege cart and its two real orcs are doubled too (all three)",A.out.team.kinds.length===3&&A.out.team.dbl.every((v,i)=>Math.abs(v/A.out.team.base[i]-2)<=.01),JSON.stringify(A.out.team));
check("the ogre's laugh (the roar sound) is gone on this map",A.silenced,JSON.stringify({ silenced:A.silenced }));
// ---- another map is untouched
await page.goto("http://127.0.0.1:8994/?silent&nogate&map=0",{timeout:120000}); await page.waitForFunction(()=>window.__dd&&window.__dd.map().id!=='prison',null,{timeout:120000});
const B=await page.evaluate(()=>({ hasMod:!!(window.__prisonmobs&&window.__prisonmobs.info()), x:(window.__prisonmobs&&window.__prisonmobs.info())||null }));
check("on the other maps none of it applies (the module is not even loaded)",!B.hasMod,JSON.stringify(B));
const realErrors=errors.filter(x=>!/Failed to load resource|favicon|net::ERR|hideout\/gear|fonts\.googleapis/i.test(x)); check("no page errors",realErrors.length===0,realErrors.slice(0,3).join(" | "));
await browser.close(); server.close(); console.log(results.filter(Boolean).length+"/"+results.length+" passed");
