// ===== THE BALLISTA'S RIG (build 128, the new Meshy ballistas): the bow assembly pans and tilts on a pedestal that never
// moves. hingeSplit (50-defmodels.js) cuts each mark's model at its waist into a fixed pedestal and a 'pitch' group inside
// a 'yoke' group, both hung from a mount at the pedestal's top; the game aims with yoke.rotation.y and tilts with
// pitch.rotation.x as it always did. Here: the four marks load and are rigged, the pedestal stays put while the assembly
// turns to a goblin off to one side, the assembly tilts at a drake, the bolt still flies, and the model faces +Z (its
// winch post behind the pivot, its bolt tip ahead).
import { chromium } from "playwright"; import { serve } from "./serve.mjs"; import path from "path";
const SP=path.dirname(new URL(import.meta.url).pathname); const DIST=process.env.DIST||SP+"/dist";
const results=[]; const check=(n,ok,d)=>{ results.push(ok); console.log((ok?"PASS ":"FAIL ")+n+(d?"  -> "+d:"")); };
const PORT=8908, BASE="http://127.0.0.1:"+PORT;
const server=await serve(PORT,{dist:DIST});
const browser=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]});
const errors=[]; const page=await browser.newPage(); page.on("pageerror",e=>errors.push(String(e)));
await page.goto(BASE+"/?silent&nogate",{timeout:90000}); await page.waitForFunction(()=>window.__dd&&window.__defglb,null,{timeout:60000});
await page.evaluate(()=>{ window.__freeze=true; window.__dd.start(); window.__dd.step(1/60,3); });
// every mark: ask for II..IV (lazy since build 123) and wait for all four templates
await page.evaluate(()=>{ for(let l=2;l<=4;l++) window.__defglb.ensure('harpoon',l); });
const got=await page.waitForFunction(()=>{ const l=window.__defglb.list().harpoon||[]; return l.length>=4&&l[0]&&l[1]&&l[2]&&l[3]; },null,{timeout:120000}).then(()=>true).catch(()=>false);
check("all four ballista marks load (Mark I with the 'soon' tier, II-IV on request)",got,JSON.stringify(await page.evaluate(()=>(window.__defglb.list().harpoon||[]).map(t=>!!t))));
const rig=await page.evaluate(()=>{ const d=window.__dd; const out=[]; for(let l=1;l<=4;l++){ const g=window.__defglb.template('harpoon',l); if(!g) { out.push(null); continue; } const root=g.wrap; let mount=null,yoke=null,pitch=null; root.traverse(o=>{ if(o.name==='mount') mount=o; if(o.name==='yoke') yoke=o; if(o.name==='pitch') pitch=o; });
    const base=[]; root.traverse(o=>{ if(o.isMesh&&!o.userData.isOL){ let p=o, inAsm=false; while(p){ if(p===pitch) inAsm=true; p=p.parent; } if(!inAsm) base.push(o); } });
    const asm=[]; if(pitch) pitch.traverse(o=>{ if(o.isMesh&&!o.userData.isOL) asm.push(o); });
    // facing: the winch post (the top fifth of the assembly) should sit behind the pivot (negative z), the bolt tip ahead
    let topZ=0,topN=0,maxZ=-1e9; for(const o of asm){ const P=o.geometry.attributes.position; const bb=o.geometry.boundingBox||(o.geometry.computeBoundingBox(),o.geometry.boundingBox); const yTop=bb.max.y-(bb.max.y-bb.min.y)*.2; for(let i=0;i<P.count;i++){ const z=P.getZ(i); maxZ=Math.max(maxZ,z); if(P.getY(i)>yTop){ topZ+=z; topN++; } } }
    root.updateMatrixWorld(true); const wp=new THREE.Vector3(); if(mount) mount.getWorldPosition(wp);
    const h=root.children[0]&&root.children[0].userData.hinge||root.userData.hinge||null; let hinge=null; root.traverse(o=>{ if(!hinge&&o.userData.hinge) hinge=o.userData.hinge; });
    out.push({turn:g.turn,mount:!!mount,yoke:!!yoke,pitch:!!pitch,yokeInMount:!!(yoke&&yoke.parent===mount),pitchInYoke:!!(pitch&&pitch.parent===yoke),baseMeshes:base.length,asmMeshes:asm.length,hinge,mountY:+wp.y.toFixed(2),postZ:topN?+(topZ/topN).toFixed(2):null,tipZ:+maxZ.toFixed(2)}); } return out; });
for(let l=1;l<=4;l++){ const r=rig[l-1];
  check("Mark "+l+": rigged -- a mount at the pedestal's top, a 'yoke' inside it (the turn node), a 'pitch' inside the yoke, meshes on both sides of the cut",!!r&&r.turn==='yoke'&&r.mount&&r.yoke&&r.pitch&&r.yokeInMount&&r.pitchInYoke&&r.baseMeshes>=1&&r.asmMeshes>=1&&r.hinge&&r.hinge.top>=1&&r.hinge.bottom>=1,JSON.stringify(r));
  check("Mark "+l+": the hinge sits at about half the height (the pedestal's pivot block), and the model faces +Z (winch post behind the pivot, bolt tip ahead)",!!r&&r.mountY>.7&&r.mountY<1.0&&r.postZ!==null&&r.postZ<-.2&&r.tipZ>.3,JSON.stringify({mountY:r&&r.mountY,postZ:r&&r.postZ,tipZ:r&&r.tipZ})); }
// pan: a goblin off to the side -- the assembly turns to it, the pedestal's meshes don't move a hair
const pan=await page.evaluate(()=>{ const d=window.__dd; d.addMana(9000); d.setHero(8,10,0); d.step(1/60,3); const t=d.place('harpoon',16,14,Math.PI); if(!t) return null; d.step(1/60,40);   /* the spot ballista-test.mjs uses: facing north (PI), open floor ahead */
  const m=t.mdl; const yoke=m.userData.yoke, pitch=m.userData.pitch; const base=[]; m.traverse(o=>{ if(o.isMesh&&!o.userData.isOL){ let p=o, inY=false; while(p){ if(p===yoke) inY=true; p=p.parent; } if(!inY) base.push(o); } });
  const asm=[]; yoke.traverse(o=>{ if(o.isMesh&&!o.userData.isOL) asm.push(o); });
  m.updateMatrixWorld(true); const snap=o=>{ const v=new THREE.Vector3(); o.getWorldPosition(v); const q=new THREE.Quaternion(); o.getWorldQuaternion(q); return [v.x,v.y,v.z,q.x,q.y,q.z,q.w].map(x=>+x.toFixed(4)); };
  const b0=base.map(snap), a0=asm.map(snap);
  const OFF=.1; /* a Mark I ballista's arc is 16 degrees: 5.7 degrees off is within its 8-degree half-arc, and the yoke follows d.yaw there exactly */ const e=d.spawn('goblin','N'); e.hp=1e9; e.spd=0; e.x=t.x+7*Math.sin(t.rot+OFF); e.z=t.z+7*Math.cos(t.rot+OFF); for(let i=0;i<90;i++){ d.step(1/60,1); e.x=t.x+7*Math.sin(t.rot+OFF); e.z=t.z+7*Math.cos(t.rot+OFF); }
  m.updateMatrixWorld(true); const b1=base.map(snap), a1=asm.map(snap);
  const moved=(A,B)=>A.some((r,i)=>r.some((x,k)=>Math.abs(x-B[i][k])>1e-3));
  return {yawDelta:+(t.yaw-t.rot).toFixed(2),yokeY:+yoke.rotation.y.toFixed(2),baseMoved:moved(b0,b1),asmMoved:moved(a0,a1),base:base.length,asm:asm.length,pitchHandle:!!pitch,sameObj:yoke===pitch}; });
check("a goblin 5.7° off the ballista's rest heading (inside a Mark I's 16° arc): the yoke pans to it (rotation.y follows d.yaw), the assembly's meshes turn in the world, the pedestal's meshes do not",!!pan&&Math.abs(pan.yawDelta)>.07&&Math.abs(pan.yokeY-pan.yawDelta)<.05&&pan.asmMoved&&!pan.baseMoved&&pan.base>=1&&pan.asm>=1,JSON.stringify(pan));
check("the pitch handle is its own group inside the yoke (tilt and pan are separate rotations)",!!pan&&pan.pitchHandle&&!pan.sameObj,JSON.stringify({pitchHandle:pan&&pan.pitchHandle,sameObj:pan&&pan.sameObj}));
// tilt: a drake overhead -- pitch.rotation.x tilts up, and a bolt flies with lift
const tilt=await page.evaluate(()=>{ const d=window.__dd; for(const e of d.enemies) e.dead=true; d.step(1/60,5); const t=d.defs[d.defs.length-1]; const dr=d.spawn('drake','N'); dr.hp=dr.max=1e6; dr.spd=0; dr.x=t.x; dr.z=t.z-9; let pitchMax=0, bolt=null; for(let i=0;i<240;i++){ dr.x=t.x; dr.z=t.z-9; d.step(1/60,1); pitchMax=Math.max(pitchMax,t.pitch||0); const p=d.projs.find(p=>p.kind==='harpoon'); if(p&&!bolt) bolt={vy:+p.vy.toFixed(2),y0:+p.y.toFixed(2)}; }
  const pitch=t.mdl.userData.pitch; return {pitchMax:+pitchMax.toFixed(2),pitchX:+pitch.rotation.x.toFixed(2),bolt}; });
check("a drake ahead and above: the assembly tilts up on its pitch group and the bolt leaves climbing",!!tilt&&tilt.pitchMax>.12&&tilt.pitchX<-.1&&tilt.bolt&&tilt.bolt.vy>2,JSON.stringify(tilt));
// the ghost preview is rigged the same way and shows nothing odd
// the ballista is the knight's (70-hero2.js: select() refuses a defense the current hero hasn't unlocked), so switch heroes first
await page.evaluate(()=>window.__heroes.select('knight')); await page.waitForFunction(()=>/Knight/i.test(window.__dd.heroModel().label),null,{timeout:90000}).catch(()=>{});
const ghost=await page.evaluate(()=>{ const d=window.__dd; try{ d.select('harpoon'); d.step(1/60,3); const g=d.ghost(); return {ok:!!g,phase:d.S.phase,ghost:g}; }catch(err){ return {ok:false,err:String(err)}; } });
check("selecting the ballista for placement still previews without error (the ghost is the rigged clone in ghost material)",ghost.ok,JSON.stringify(ghost));
const realErrors=errors.filter(e=>!/Failed to load resource|favicon/i.test(e));
check("no page errors",realErrors.length===0,realErrors.slice(0,5).join(" | "));
await browser.close(); server.close();
console.log(results.filter(Boolean).length+"/"+results.length+" passed");
process.exit(results.some(r=>!r)?1:0);
