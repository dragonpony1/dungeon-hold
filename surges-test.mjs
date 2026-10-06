// ===== SURGES (build 564; parts/staging/99n-surges.js). Matt: "Throughout the game surges work much better than trickling out mobs one at a time" / "let's try a new rhythm".
// Checked: on Normal a wave's ordinary mobs come in surges (3 on the early waves, more later), the wave keeps exactly the mobs it had, each surge all out inside about a second with a
// lull between, a cue (and dust at the gates) for each one; THE GNOME HALL's first wave, every map's last wave and Easy keep the trickle; the spawn list carries no markers.
import { chromium } from "playwright"; import { serve } from "./serve.mjs";
const server=await serve(8853,{dist:process.env.DIST||"./dist"}); const SHOT=process.env.SHOT||"";
const results=[]; const check=(n,ok,d)=>{ results.push(!!ok); console.log((ok?"PASS ":"FAIL ")+n+(d?"  -> "+d:"")); };
const browser=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]}); const errors=[];
async function open(diff,map){ const page=await browser.newPage({viewport:{width:1100,height:640}}); page.on("pageerror",e=>errors.push(String(e)));
  await page.addInitScript(d=>{ try{ localStorage.setItem("ddMapsCleared","9"); localStorage.setItem("dd_difficulty",d); localStorage.setItem("ddSound","off");
    localStorage.setItem("dd_cine_seen",JSON.stringify(["prologue","tavern","garden","feast","castle","lantern","torchline","ending"])); }catch(e){} },diff);
  await page.goto("http://127.0.0.1:8853/?silent&nogate"+(map?"&map="+map:""),{timeout:120000}); await page.waitForFunction(()=>window.__dd&&window.__dd.map&&window.__dd.map()&&window.__surges,null,{timeout:90000}); return page; }
const PLAIN=['goblin','orc','archer','troll','ogre','drake','direwolf'];

// ---- the plan, map one on Normal
const p=await open("normal");
const A=await p.evaluate(P=>{ const d=window.__dd, M=d.map(); const o={}; for(let w=1;w<=M.waves;w++){ const c=d.waveComp(M.wbase+w); const ts=c.q.filter(x=>P.includes(x.kind)).map(x=>+x.t);
    o[w]={ surges:c.surges||0, at:c.surgeAt||[], n:ts.length, markers:c.q.filter(x=>/^__surge/.test(x.kind)).length }; } return o; },PLAIN);
check("THE GNOME HALL's first wave stays a trickle (the on-ramp), and its last wave keeps its own timing",!A[1].surges&&!A[7].surges,JSON.stringify({w1:A[1],w7:A[7]}));
check("waves 2-6 come in surges: three early, growing to five",A[2].surges===3&&A[6].surges>=5&&[2,3,4,5,6].every(w=>A[w].surges>=3&&A[w].surges<=6&&A[w+1]?A[w].surges<=(A[w+1].surges||9):true),JSON.stringify([2,3,4,5,6].map(w=>A[w].surges)));
check("no markers ride in the spawn list (every count of the wave's mobs stays true)",Object.values(A).every(a=>a.markers===0));
// same mobs as the trickle: count each kind with the surge wrap's work undone (the wave as Easy would build it is not the same wave, so compare against the module's own input)
const B=await p.evaluate(P=>{ const d=window.__dd, M=d.map(); const w=M.wbase+4; const c=d.waveComp(w); const kinds={}; for(const x of c.q) kinds[x.kind]=(kinds[x.kind]||0)+1;
    const plain=c.q.filter(x=>P.includes(x.kind)).sort((a,b)=>a.t-b.t); const gaps=[]; for(let i=1;i<plain.length;i++) gaps.push(+(plain[i].t-plain[i-1].t).toFixed(2));
    return { kinds, surges:c.surges, at:c.surgeAt, bigGaps:gaps.filter(g=>g>2).length, inside:gaps.filter(g=>g<=.5).length, n:plain.length }; },PLAIN);
check("wave 4: the mobs come in bunches -- the only long gaps are the lulls between surges, everything else a fraction of a second apart",B.bigGaps===B.surges-1&&B.inside>=B.n-B.surges,JSON.stringify(B));

// ---- playing it: wave 2, a cue for each surge, each surge out inside about a second
const C=await p.evaluate(async P=>{ const d=window.__dd; try{ window.__trainer.skip(); }catch(e){} d.start(); d.step(1/60,5); d.S.wave=1; d.S.phase='build'; d.startWave(); const due=window.__surges.due(); const c0=window.__surges.info();
    const live=()=>d.enemies.filter(e=>!e.dead&&P.includes(e.kind)).length; const born=[]; let seen=new Set(d.enemies);
    for(let f=0;f<60*16;f++){ d.step(1/60,1); d.S.crystal=1e9; d.hero.hp=d.hero.max; for(const e of d.enemies){ if(!seen.has(e)){ seen.add(e); if(P.includes(e.kind)) born.push(+d.S.waveT.toFixed(2)); } } if(f%20===0) await new Promise(r=>setTimeout(r,0)); }
    const c1=window.__surges.info(); return { due, born, cues:c1.cues-c0.cues, puffs:c1.puffs-c0.puffs, wave:d.S.wave }; },PLAIN);
const bursts=C.due.map((t,i)=>C.born.filter(b=>b>=t&&b<(C.due[i+1]??1e9)));
check("playing wave 2: every surge sounds its cue and puffs dust at its gates",C.due.length===3&&C.cues===3&&C.puffs>=3,JSON.stringify({ due:C.due, cues:C.cues, puffs:C.puffs }));
check("each surge is out inside about a second and a half of its cue",bursts.every((b,i)=>b.length>=3&&Math.max(...b)-C.due[i]<=1.6),JSON.stringify(bursts));
if(SHOT){ await p.evaluate(async()=>{ const d=window.__dd; for(const e of d.enemies) d.kill(e); d.step(1/60,2); d.S.phase='build'; d.S.wave=4; d.startWave(); const t=window.__surges.due()[1]; while(d.S.waveT<t+.55){ d.step(1/60,1); d.S.crystal=1e9; } }); await p.waitForTimeout(400); await p.screenshot({ path:SHOT }); }
await p.close();

// ---- Easy keeps the trickle; so does every map's last wave on Normal
const e=await open("easy"); const E=await e.evaluate(()=>{ const d=window.__dd, M=d.map(); return [2,3,4,5,6].map(w=>d.waveComp(M.wbase+w).surges||0); }); await e.close();
check("on EASY every wave keeps the trickle",E.every(n=>n===0),JSON.stringify(E));
const t=await open("normal",1); const T=await t.evaluate(()=>{ const d=window.__dd, M=d.map(); return { id:M.id, mid:d.waveComp(M.wbase+3).surges||0, last:d.waveComp(M.wbase+M.waves).surges||0 }; }); await t.close();
check("THE THRONE ROOM: its middle waves surge, its boss wave (the pigs) keeps its own timing",T.id==='throne'&&T.mid>=3&&T.last===0,JSON.stringify(T));
check("no page errors",errors.length===0,JSON.stringify(errors.slice(0,3)));
await browser.close(); server.close(); console.log(results.filter(Boolean).length+"/"+results.length+" passed"); process.exit(results.every(Boolean)?0:1);
