// ===== THE TORCH-BEARERS (build 359). Matt, about the horde coming up out of the dark behind the prison's broken wall: "as these mobs come up from the back we need one carrying a torch ever so often for added intensity to the
// situation". Every so often (one goblin or orc in every eight to thirteen that comes through a gate) carries a burning torch in its right hand: a dark stick, a flickering flame, a warm glow, and -- the intensity -- real light:
// a fixed pool of four lights made once when the map opens (so nothing is ever added mid-fight, which would make every material rebuild: a hitch) is handed, each frame, to the four torches nearest to you, so a bearer in
// the dark throws a moving pool of orange light over the stone and the mobs around it. A bearer that is killed drops the torch: it lies on the floor burning for a few seconds, still lit. THE DEEP PRISON only.
// Test hook: window.__torchmobs.
(function(){
'use strict';
window.__torchmobs={ info:()=>null };
if(!MAP||MAP.id!=='prison') return;
const KINDS=new Set(['goblin','orc']), POOL=4, REACH=16, DROP_T=6;
let spawnN=0, nextAt=6+((Math.random()*6)|0); const bearers=[], fallen=[], cnt={ made:0, dropped:0 };
const STICK=G.cyl(.04,.055,.8,6), STICKM=mat(0x4a3220);
const lights=[]; for(let i=0;i<POOL;i++){ const l=new THREE.PointLight(C(0xffa040),0,REACH,2); l.position.set(0,-60,0); scene.add(l); lights.push(l); }
function torchGroup(){ const g=new THREE.Group(); g.name='mobtorch'; const st=new THREE.Mesh(STICK,STICKM); st.position.y=.4; st.userData.noOL=true; g.add(st);
  const fl=new THREE.Mesh(G.cone(.13,.42,7),basic(0xff7a1a)); fl.position.y=.98; fl.userData.noOL=true; g.add(fl); const fl2=new THREE.Mesh(G.cone(.07,.3,7),basic(0xffd060)); fl2.position.y=.94; fl2.userData.noOL=true; g.add(fl2);
  const gl=glow(0xff8a2a,2.4,.6); gl.position.y=1.0; g.add(gl); g.userData.parts={ fl, fl2, gl, ph:Math.random()*6 }; return g; }
function attach(e){ const g=e.mdl&&e.mdl.g; if(!g) return; const t=torchGroup(); t.position.set(-(e.r||.6)*.95,(e.h||1.6)*.42,.3); t.rotation.z=.12; t.scale.setScalar(1.35); g.add(t); e.torch=t; bearers.push(e); cnt.made++; }
{ const prev=spawnEnemy; spawnEnemy=function(kind,lane){ const r=prev.apply(this,arguments);
    if(KINDS.has(kind)){ const e=enemies[enemies.length-1]; if(e&&e.kind===kind&&!e.pushFor&&!e.torch){ spawnN++; if(spawnN>=nextAt){ nextAt=spawnN+8+((Math.random()*6)|0); attach(e); } } }
    return r; }; }
// a torch-bearer cut down drops the torch where it stood
{ const prev=kill; kill=function(e){ const had=e&&e.torch&&!e.dead; const r=prev.apply(this,arguments);
    if(had&&e.dead){ const t=e.torch; e.torch=null; const i=bearers.indexOf(e); if(i>=0) bearers.splice(i,1); if(t.parent) t.parent.remove(t);
      const f=torchGroup(); f.position.set(e.x,(typeof floorH==='function'?floorH(e.x,e.z):0)+.1,e.z); f.rotation.set(0,rnd()*6,PI/2-.25); scene.add(f); f.userData.parts.ph=rnd()*6; fallen.push({ g:f, t:0 }); cnt.dropped++;
      try{ const n=window.__net; if(n&&n.role&&n.role()==='host'&&n.peers().length) n.send('torchDrop',{ x:+e.x.toFixed(2), z:+e.z.toFixed(2), ry:+f.rotation.y.toFixed(2) }); }catch(er){} }
    return r; }; }
// co-op sweep 2026-10-02: on a GUEST the bearers were plain puppets -- no torch, no light, no torch dropped (attach and the drop run on the host's real mobs only). The host names its bearers once a
// second ('torches', their co-op ids: new ones and late joiners catch up) and says where each dead one's torch fell ('torchDrop'); the guest puts the same torch in its puppet's hand and the same torch on the floor,
// and the light pool below then works on it unchanged. 99-network.js loads after this file: the listeners are hooked on the first frame it is there.
let TIDS=new Set(), tHooked=false, tSendT=0;
function hookTorches(){ if(tHooked) return; const n=window.__net; if(!(n&&n.onMessage)) return; tHooked=true; const guest=()=>n.role&&n.role()==='guest';
  n.onMessage('torches',d=>{ if(guest()) TIDS=new Set(Array.isArray(d&&d.ids)?d.ids.slice(0,200).map(String):[]); });
  n.onMessage('torchDrop',d=>{ if(!guest()||!d) return; const x=+d.x, z=+d.z; if(!Number.isFinite(x)||!Number.isFinite(z)||fallen.length>20) return; const f=torchGroup(); f.position.set(x,(typeof floorH==='function'?floorH(x,z):0)+.1,z); f.rotation.set(0,+d.ry||0,PI/2-.25); scene.add(f); fallen.push({ g:f, t:0 }); cnt.dropped++; }); }
function coopTorches(dt){ hookTorches(); const n=window.__net, role=n&&n.role&&n.role();
  if(role==='host'){ tSendT-=dt; if(tSendT<=0){ tSendT=1; try{ if(n.peers().length) n.send('torches',{ ids:bearers.map(e=>e.__coopId).filter(v=>v!=null) }); }catch(er){} } return; }
  if(role!=='guest') return; const M=window.__mobsync; if(!M||!M.each) return; const live=new Set();
  M.each((p,id)=>{ id=String(id); live.add(id); if(!TIDS.has(id)||!p.mdl||!p.mdl.g) return; if(p.torch&&p.torch.parent===p.mdl.g) return; if(p.torch&&p.torch.parent) p.torch.parent.remove(p.torch);
    const t=torchGroup(); t.position.set(-(p.mdl.r||.6)*.95,(p.mdl.h||1.6)*.42,.3); t.rotation.z=.12; t.scale.setScalar(1.35); p.mdl.g.add(t); p.torch=t; p.__tid=id; if(!bearers.includes(p)){ bearers.push(p); cnt.made++; } });
  for(const p of bearers) if(p.__tid&&p.torch&&(!live.has(p.__tid)||!TIDS.has(p.__tid))){ if(p.torch.parent) p.torch.parent.remove(p.torch); p.torch=null; } }   // gone (or no longer a bearer): the drop is the host's 'torchDrop'
const V=new THREE.Vector3();
function flicker(t,S0){ const p=t.userData.parts, k=1+Math.sin(S.t*13+p.ph)*.18+Math.sin(S.t*7.3+p.ph*2)*.1; p.fl.scale.set(1,k,1); p.fl2.scale.set(1,1.1-(k-1),1); p.gl.material.opacity=.5+.2*(k-.9); }
WORLDANIM.push(dt=>{ coopTorches(dt);
  for(let i=bearers.length-1;i>=0;i--){ const e=bearers[i]; if(e.dead||!e.torch){ bearers.splice(i,1); continue; } flicker(e.torch); }
  for(let i=fallen.length-1;i>=0;i--){ const f=fallen[i]; f.t+=dt; flicker(f.g); if(f.t>DROP_T){ const k=Math.max(0,1-(f.t-DROP_T)/1.2); f.g.scale.setScalar(k||.001); if(f.t>DROP_T+1.2){ scene.remove(f.g); fallen.splice(i,1); } } }
  // the four lights go to the four torches nearest you (a torch further than the lights' reach is not lit at all)
  const F=(window.__torchFocus&&window.__torchFocus())||hero;   // the cutscene of the big barrier (56i-prisonbarrier.js) hands the lights to the torches it is looking at
  const src=[]; for(const e of bearers){ const fl=e.torch.userData.parts.fl; fl.getWorldPosition(V); src.push({ x:V.x, y:V.y+.3, z:V.z, d:Math.hypot(V.x-F.x,V.z-F.z) }); }
  for(const f of fallen){ const fl=f.g.userData.parts.fl; fl.getWorldPosition(V); src.push({ x:V.x, y:V.y+.4, z:V.z, d:Math.hypot(V.x-F.x,V.z-F.z)*1.15, fade:f.t>DROP_T?Math.max(0,1-(f.t-DROP_T)/1.2):1 }); }
  src.sort((a,b)=>a.d-b.d);
  for(let i=0;i<POOL;i++){ const l=lights[i], s=src[i]; let target=0; if(s&&s.d<70){ l.position.set(s.x,s.y,s.z); target=(2.2+Math.sin(S.t*11+i)*.35+Math.sin(S.t*5.3+i*2)*.25)*(s.fade===undefined?1:s.fade); } l.intensity+=(target-l.intensity)*Math.min(1,dt*9); if(l.intensity<.02&&!target) l.position.y=-60; } });
window.__torchmobs={ info:()=>Object.assign({ alive:bearers.length, fallen:fallen.length, pool:POOL, lit:lights.filter(l=>l.intensity>.05).length, lights:lights.length },cnt), bearers:()=>bearers.slice(), lights:()=>lights, force:e=>{ if(e&&!e.torch) attach(e); } };
})();
