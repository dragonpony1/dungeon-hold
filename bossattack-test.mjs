// ===== BOSSES CARRY OUT THEIR ATTACKS WHILE BEING HIT (build 532 prep, 99e-bossgrit.js). Matt, of Sir Bullion: "he kinds has the same knock back issue a lot of the bosses have, where he gets hit then doest do his attack".
// Measured before the fix with a Knight in the full Wind set swinging every frame (auto-fire) at Sir Bullion from 1.9 away: 1 punch in 20 s against 9 when the Knight stood still -- the Wind's GALE shove threw him
// 2.7 units a swing, around the boss rule of build 253 -- and every hit squashed his model flat. Here, for every boss that walks up and hits (Sir Bullion, the Cyclops, the Flail and Dagger pigs, the Corruptor)
// and the two that shoot (the troll boss, the Sling pig): a hero standing beside it, then the same hero hacking at it every frame in the full Wind set while something else (a tower, a pet) hits it every frame
// with a shove -- its blows still land at about the same rate, it is never moved off its spot and its model is never squashed (e.squash still marks it "just hit"); a melee boss hit from just outside its old notice ring (behind it, inside the Knight's reach)
// turns and swings; an ordinary goblin is still shoved by the Wind and still squashes; no page errors.
import { chromium } from "playwright"; import { serve } from "./serve.mjs";
const PORT=9533; const server=await serve(PORT,{dist:process.env.DIST||"./dist"}); const browser=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]});
const page=await (await browser.newContext({viewport:{width:1000,height:640}})).newPage(); const errors=[]; page.on("pageerror",e=>errors.push(String(e)));
await page.addInitScript(()=>{ try{ localStorage.setItem("ddMapsCleared","9"); localStorage.setItem("ddSound","off"); localStorage.setItem("dd_talent_card","1"); }catch(e){} });
await page.route("**/api/**",r=>r.fulfill({ status:200, contentType:"application/json", body:"{}" }));
const results=[]; const check=(n,ok,d)=>{ results.push(ok); console.log((ok?'PASS ':'FAIL ')+n+(d?'  -> '+d:'')); };
await page.goto("http://127.0.0.1:"+PORT+"/?silent&nogate&ownweapons&nosetgate&map=3",{timeout:120000});
await page.waitForFunction(()=>window.__dd&&window.__dd.heroModel()&&window.__bullion&&window.__bossgrit&&window.__heroes&&window.__sets8&&window.__corruptor,null,{timeout:120000});
// the Feast Hall (Sir Bullion lives only here), the Knight in the whole Wind set, Sir Bullion brought in by his own roll-out (skipped), the Corruptor's model
const S0=await page.evaluate(async()=>{ const d=window.__dd, M=window.__meta; try{ window.__trainer.skip(); }catch(e){} await window.__heroes.select('knight'); d.start(); d.step(1/60,3); window.__freeze=true;
  await Promise.all([window.__bullion.load(),window.__corruptor.load()]);
  for(const s of ['weapon','armor','charm','amulet','familiar']){ const it=d.rollItem(2,s,5); it.name=it.name.replace(/ of (the )?[A-Z]\w*( [A-Z]\w*)?$/,'')+' of the Wind'; M.giveItem(it); M.equip(it.id); } d.step(1/60,2);
  for(const e of d.enemies) d.kill(e); d.step(1/30,40); window.__bullion.startCut(); d.step(1/30,3); window.__bullion.skip(); d.step(1/30,10);
  window.__keep=new Set(); window.__clr=()=>{ d.S.crystal=Math.max(d.S.crystal,1e9); for(const e of d.enemies) if(!e.dead&&!window.__keep.has(e)){ e.through=true; e.dead=.001; } };
  const b=d.enemies.find(x=>x.kind==='bullion'&&!x.dead); if(b) window.__keep.add(b);
  return { wind:window.__sets8.full('of the Wind'), bullion:!!b, corruptor:window.__corruptor.loaded(), kinds:window.__bossgrit.kinds() }; });
check('set-up: the Knight wears the whole Wind set, Sir Bullion is in the hall, the Corruptor is loaded, every boss is on the boss list',S0.wind&&S0.bullion&&S0.corruptor&&['bullion','cyclops','pigflail','pigdagger','corruptor','trollboss','pigsling'].every(k=>S0.kinds.includes(k)),JSON.stringify(S0));
// one 15 s run: the boss on an open floor facing west, the hero held on one spot (side: 'front' = in its way, 'back' = behind it), idle or hacking every frame while a tower/pet stand-in hits it every frame with a shove
const run=(kind,side,gap,hit)=>page.evaluate(([kind,side,gap,hit])=>{ const d=window.__dd, B=window.__bossgrit;
  let e=kind==='bullion'?d.enemies.find(x=>x.kind==='bullion'&&!x.dead):null; if(!e){ e=d.spawn(kind,'E'); if(!e) return { err:'no spawn '+kind }; window.__keep.add(e); }
  for(const t of d.defs.slice()) d.sell({ x:t.x, z:t.z, y:0 });
  Object.assign(e,{ x:d.cw(30), z:d.cwz(16), yaw:-Math.PI/2, swing:-1, pending:null, special:null, atk:0, hp:1e7, max:1e7, confuseT:0, dazzled:true, holdT:0, slowT:0, chillT:0, squash:0 }); if(kind==='bullion') e.slamCd=1e9; e.y=d.S&&window.__dd.enemies?e.y:0;
  const dir=side==='front'?-1:1, HX=e.x+dir*(e.r+gap), HZ=e.z; const x0=e.x, z0=e.z;
  let starts=0, lands=0, was=-1, sqMax=0, flat=0, far=0, hpLost=0; const hp0=e.hp;
  for(let i=0;i<30*15;i++){ window.__clr(); d.setHero(HX,HZ); d.hero.hp=d.hero.max=1e6; const a=Math.atan2(e.x-HX,e.z-HZ); d.hero.yaw=a; d.setCam(a,.4,8);
    if(hit){ d.swing(); const l=Math.hypot(e.x-HX,e.z-HZ)||1; B.hurt(e,1,(e.x-HX)/l*3,(e.z-HZ)/l*3); sqMax=Math.max(sqMax,e.squash||0); }
    const pend=!!e.pending, h0=d.hero.hp; d.step(1/30,1); if(e.swing>=0&&was<0) starts++; was=e.swing; if(pend&&!e.pending&&d.hero.hp<h0) lands++; far=Math.max(far,Math.hypot(e.x-HX,e.z-HZ)); sqMax=Math.max(sqMax,e.squash||0); const gs=e.mdl&&e.mdl.g&&e.mdl.g.scale; if(gs&&gs.x>0) flat=Math.max(flat,Math.abs(gs.y/gs.x-1)); }
  hpLost=Math.round(hp0-e.hp); const out={ kind, side, hit, starts, lands, far:+far.toFixed(2), sqMax:+sqMax.toFixed(2), flat:+flat.toFixed(3), hpLost, r:e.r };
  if(kind!=='bullion'){ window.__keep.delete(e); e.dead=.001; d.step(1/30,2); } return out; },[kind,side,gap,hit]);
const MELEE=['bullion','cyclops','pigflail','pigdagger','corruptor'], RANGED=['trollboss','pigsling'];
for(const k of MELEE.concat(RANGED)){
  const base=await run(k,'front',.9,false), hit=await run(k,'front',.9,true);
  check(k+': hit every frame by the Knight (full Wind, auto-fire) and a shoving tower, its blows still land at about the rate they do on a hero who stands still',base.lands>=3&&hit.lands>=Math.ceil(base.lands*.75)&&hit.hpLost>0,JSON.stringify({ still:base.lands, hit:hit.lands, starts:[base.starts,hit.starts], dealt:hit.hpLost }));
  check(k+': never shoved off its spot, its model never squashed by the hits (it is still marked "just hit" for Old Lamplight\'s pet)',hit.far<=Math.max(base.far,hit.r+.9)+.6&&hit.flat<.01&&hit.sqMax>.5,JSON.stringify({ far:[base.far,hit.far], flat:hit.flat, mark:hit.sqMax }));
  if(MELEE.includes(k)){ const back=await run(k,'back',2.0,true);
    check(k+': hacked at from behind, just outside its old notice ring but inside the Knight\'s reach, it turns and fights back',back.lands>=2&&back.hpLost>0,JSON.stringify(back)); } }
// an ordinary mob is unchanged: the Wind still throws a goblin, and a hit still squashes it
const G=await page.evaluate(()=>{ const d=window.__dd; const g=d.spawn('goblin','E'); window.__keep.add(g); Object.assign(g,{ x:d.cw(30), z:d.cwz(16), hp:1e6, max:1e6, spd:0, atk:1e9 }); d.setHero(g.x-1.6,g.z); d.hero.yaw=Math.PI/2; d.setCam(Math.PI/2,.4,8);
  const x0=g.x; let sq=0, flat=0; d.swing(); for(let i=0;i<30;i++){ d.step(1/30,1); sq=Math.max(sq,g.squash||0); const s=g.mdl.g.scale; flat=Math.max(flat,Math.abs(s.y/s.x-1)); } const out={ moved:+Math.abs(g.x-x0).toFixed(2), sq:+sq.toFixed(2), flat:+flat.toFixed(2), hit:g.hp<1e6 }; window.__keep.delete(g); g.dead=.001; return out; });
check('an ordinary goblin is still thrown back by the Wind and still squashes when hit',G.hit&&G.moved>1&&G.sq>0&&G.flat>.05,JSON.stringify(G));
check('no page errors',errors.length===0,JSON.stringify(errors.slice(0,3)));
await browser.close(); server.close(); console.log(results.filter(Boolean).length+"/"+results.length+" passed"); process.exit(results.every(Boolean)?0:1);
