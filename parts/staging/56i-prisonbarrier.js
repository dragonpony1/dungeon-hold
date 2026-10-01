// ===== THE BIG BARRIER (build 363). Matt: "you come in about 3 tiles and put up a big wall, but the bottom row is breakable, i am wondering if we can have the boss break one and chain reaction the whole thing, maybe its a quick
// cutscene?" -- and, earlier, "there has to be a back wall nobody sees for the first 5 waves" and "the other end the big barrier use meshys breakable door skin". THE DEEP PRISON only.
// The rim's last three rows (43-45, the whole width) are sealed behind a wall of Matt's Meshy cracked-wall panels, two rows of thirteen, floor to roof: for the first five waves it is just a big wall at the back of the rim, a green crack
// glowing in every panel, the rim's two gates now standing in front of it at the east end and the west end. The hero, the mobs and the camera cannot pass (the three rows are solid stone to the game until the wall falls).
// On the sixth wave (the sixteenth second of it, the wave having begun as it always does) a short CUTSCENE plays and the game holds still: black bars slide in, the boss (an Ogre for now -- the Corruptor of Fate has no model yet) bursts out
// of the east cells and charges along the wall, roars, and brings its fist down on one of the bottom panels. That panel bursts into shards, and the break RIPPLES out both ways along the bottom row, each panel breaking a beat after
// its neighbour, the panels above it falling after the ones beneath: a chain reaction. The three rows open up behind it (the floor goes back to being floor, the flow of the mobs is worked out again) and there stands the horde in
// the dark, its torch-bearers with their torches lit, the carts and their orcs; the camera drifts over them, the bars slide away, and the game goes on with all of them coming. A second, bigger crowd follows out of the dark over the next
// seconds. (The dev panel, F9, has a button to play it any time and one to put the wall back.) Test hook: window.__finale.
(function(){
'use strict';
window.__finale={ info:()=>null };
if(!MAP||MAP.id!=='prison') return;
const PWK=window.__prisonwalls; if(!PWK||!PWK.shatter||!PWK.BreakableWall) return;
const isGuest=()=>!!(window.__net&&window.__net.role&&window.__net.role()==='guest');
const inCoop=()=>{ try{ return !!(window.__net&&window.__net.role&&window.__net.role()); }catch(er){ return false; } };   // the cutscene holds the host's game still, which a co-op hall (guests see no barrier yet) must never feel: in a shared hall the wall just stays
const COLS=13, ROWS=2, XA=2, XB=44, Z0=43, Z1=45, FLOOR_Y=6, PH=(WALLH-FLOOR_Y)/ROWS, MID=6;   // thirteen panels across the rim, two high, up to the roof; MID is the column the boss strikes
const FIN_WAVE=6, FIN_T=16;   // the wave it happens on, and how many seconds into that wave
const X0=cw(XA)-CELL/2, X1=cw(XB)+CELL/2, BZ=cwz(Z0)-CELL/2, ZB=cwz(Z1)+CELL/2, PWID=(X1-X0)/COLS, XC=(X0+X1)/2, XS=X0+PWID*(MID+.5);   // the wall's two ends, its front face, the back wall behind the three rows, a panel's width, the strike point
const T_RUN=2.8, T_SWING=T_RUN+1.2, T_HIT=T_SWING+.38, RIP=.17, T_OPEN=T_HIT+.9, T_REVEAL=T_HIT+2.2, T_END=T_HIT+5.3, BLEND_T=.8;   // the cutscene's clock
const MIX=[['goblin',64],['orc',24],['archer',10],['ogre',2]], TEAMS=['kegcart','firecart','kegcart'];   // standing in the dark when the wall falls (plus the carts' own orcs)
const LATER=[['goblin',50],['orc',18],['archer',8],['ogre',2]], LATER_TEAMS=['firecart','kegcart'];   // and the second crowd, out of the dark over the next ten seconds
const smooth=k=>k<=0?0:k>=1?1:k*k*(3-2*k);
const cnt={ built:0, broken:0, starts:0, ends:0, crowd:0, carts:0, later:0, resets:0 };
// ---- the three rows are solid until the wall falls
const strip=[]; for(let z=Z0;z<=Z1;z++) for(let x=XA;x<=XB;x++) strip.push(idx(x,z));
function setStrip(solid){ for(const i of strip) grid[i]=solid?T.WALL:T.FLOOR; reflow(); }
setStrip(true);
// ---- the panels
const panels=[]; let backing=null, ready=false;
const dust=[];
function puff(x,y,z,n,spread){ for(let i=0;i<n;i++){ const s=glow(0xd8c8a8,6+Math.random()*5,.001); s.position.set(x+(Math.random()-.5)*spread,y+Math.random()*4,z+(Math.random()-.5)*3); world.add(s); dust.push({ s, t:0, life:1.6+Math.random()*1.4, vy:.5+Math.random()*.9, vx:(Math.random()-.5)*1.4, vz:-.3-Math.random()*1.4 }); } }
fetchBytes(ASSET('prison-wall2.glb'),'soon').then(buf=>new Promise((res,rej)=>new THREE.GLTFLoader().parse(buf,'',gl=>res(gl.scene||gl.scenes[0]),rej))).then(root=>{
  root.updateMatrixWorld(true); const bb=new THREE.Box3().setFromObject(root), sz=bb.getSize(new THREE.Vector3()); const sx=PWID/sz.x, sy=PH/sz.y, sc=(sx+sy)/2; toonify(root,sc);
  const shards=PWK.shatter(root); if(!shards){ console.warn('prison barrier: no shards'); return; }
  for(let r=0;r<ROWS;r++) for(let c=0;c<COLS;c++){
    const w=new PWK.BreakableWall(root.clone(true),shards.clone(true),{ maxHealth:1e9, gravity:9.81/sc, impulse:1.35, debrisLifetime:8, onHit:()=>{}, onBreak:()=>{} });
    // the top row's pieces stand on the bottom row's: lifted inside the group, so that the group's own floor (where every shard lands) is the rim's floor
    const off=r*PH/sy; w.intact.position.y+=off; w.fragments.position.y+=off;
    const mir=((c*5+r*3)%2)===1; w.group.scale.set(mir?-sx:sx,sy,sc); w.group.position.set(X0+PWID*(c+.5),FLOOR_Y,BZ+sc*sz.z/2+.02); w.group.rotation.y=PI; world.add(w.group);
    panels.push({ w, r, c, x:X0+PWID*(c+.5), broken:false, tb:null }); cnt.built++; }
  // behind the panels, so no seam between two of them shows what is behind
  backing=new THREE.Mesh(new THREE.PlaneGeometry(X1-X0,WALLH-FLOOR_Y),basic(0x06080a,{ side:THREE.DoubleSide })); backing.position.set(XC,FLOOR_Y+(WALLH-FLOOR_Y)/2,BZ+.9); backing.userData.noOL=true; world.add(backing); ready=true;
}).catch(e=>console.warn('prison barrier',e));
function resetPanel(p){ const w=p.w; w.broken=false; w.health=w.o.maxHealth; w.age=0; w.acc=0; w.shake=0; w.intact.visible=true; w.fragments.visible=false; w.intact.position.x=0; w.intact.rotation.z=0;
  for(const ch of w.chunks){ ch.node.position.copy(ch.home); ch.node.quaternion.copy(ch.rotation); ch.node.scale.copy(ch.scale); ch.velocity.set(0,0,0); ch.spin.set(0,0,0); ch.settled=false; } p.broken=false; p.tb=null; }
// ---- the cutscene's bars
const bars=['top','bottom'].map(side=>{ const d=document.createElement('div'); d.style.cssText='position:fixed;left:0;right:0;'+side+':0;height:0;background:#000;z-index:90;pointer-events:none;transition:height .6s ease'; document.body.appendChild(d); return d; });
const letterbox=on=>bars.forEach(d=>{ d.style.height=on?'12vh':'0'; });
// ---- the crowd
const FIN={ active:false, done:false, t:0, boss:null, ev:{}, crowd:[], crowdQ:[], laterQ:[], laterT:0, blend:0, from:null, endP:null, endQ:null, focus:null };
const CARTK=new Set(['kegcart','firecart']);
function buildQueue(mix,teams){ const q=[]; for(const [k,n] of mix) for(let i=0;i<n;i++) q.push(k); for(let i=q.length-1;i>0;i--){ const j=(rnd()*(i+1))|0; const t=q[i]; q[i]=q[j]; q[j]=t; } for(const k of teams) q.splice((rnd()*(q.length+1))|0,0,k); return q; }
function sync(e){ e.y=baseFloor(e.x,e.z); const g=e.mdl.g; g.position.set(e.x,e.y+(e.lift||0),e.z); g.rotation.y=e.yaw; }
function placeNext(q,tag){ const kind=q.shift(); if(!kind) return;
  if(CARTK.has(kind)){ if(!(window.__carts&&window.__carts.loaded(kind))){ try{ window.__carts&&window.__carts.load(kind); }catch(er){} return; }
    const c=spawnEnemy(kind,'E'); if(!c||c.kind!==kind) return; const BACK=(MOBGLB[kind]&&MOBGLB[kind].back)||3, SIDE=(window.__carts&&window.__carts.SIDE)||.7;
    c.x=R(X0+5,X1-5); c.z=ZB-1.1-BACK; c.yaw=PI; sync(c); const fx_=Math.sin(c.yaw), fz_=Math.cos(c.yaw), rx=fz_, rz=-fx_;
    for(const o of (c.crew||[])){ o.x=c.x-fx_*BACK+rx*o.pushSide*SIDE; o.z=c.z-fz_*BACK+rz*o.pushSide*SIDE; o.yaw=c.yaw; sync(o); } cnt.carts++; return; }
  const e=spawnEnemy(kind,'E'); if(!e||e.kind!==kind) return; e.x=(tag!=='later'&&rnd()<.7)?R(-34,34):R(X0+3,X1-3); e.z=R(BZ+1.9,ZB-1.0); e.yaw=PI; sync(e); FIN.crowd.push(e); cnt[tag||'crowd']++; }
// ---- the camera
const KEYS=[ { t:0, p:[14,12.5,34], l:'boss' }, { t:T_RUN, p:[2,11,45], l:'boss' }, { t:T_HIT, p:[-6,9,64], l:[0,8.5,76.5] }, { t:T_HIT+1.7, p:[0,15,40], l:[0,9.5,78] }, { t:T_REVEAL+.4, p:[0,14.5,50], l:[0,7,80] }, { t:T_END, p:[0,12,62], l:[0,6.2,81] } ];
function cutCamera(dt){ const t=FIN.t, b=FIN.boss, bp=b?[b.x,(b.y||FLOOR_Y)+2.6,b.z]:[XS,8,BZ-3];
  let i=0; while(i<KEYS.length-2&&t>=KEYS[i+1].t) i++; const a=KEYS[i], c=KEYS[i+1], u=smooth((t-a.t)/(c.t-a.t)); const la=a.l==='boss'?bp:a.l, lc=c.l==='boss'?bp:c.l;
  let p=[0,1,2].map(k=>a.p[k]+(c.p[k]-a.p[k])*u), l=[0,1,2].map(k=>la[k]+(lc[k]-la[k])*u);
  if(FIN.from){ const bl=smooth(t/.8); p=p.map((v,k)=>FIN.from.p[k]+(v-FIN.from.p[k])*bl); l=l.map((v,k)=>FIN.from.l[k]+(v-FIN.from.l[k])*bl); }
  const sh=camShake>0?camShake*.35:0; camShake=Math.max(0,camShake-dt);
  camera.position.set(p[0]+(rnd()-.5)*sh,p[1]+(rnd()-.5)*sh,p[2]+(rnd()-.5)*sh); camera.lookAt(l[0]+(rnd()-.5)*sh,l[1]+(rnd()-.5)*sh,l[2]+(rnd()-.5)*sh); FIN.focus={ x:l[0], z:l[2] }; }
// ---- the scene
function breakPanel(p){ p.broken=true; const sgn=Math.sign(p.c-MID); const pt=new THREE.Vector3(p.x-sgn*PWID*.6,FLOOR_Y+(p.r?PH+1:1.5),BZ), dir=new THREE.Vector3(0,0,-1);
  p.w.destroy(pt,dir); puff(p.x,FLOOR_Y+p.r*PH+2,BZ-.5,p.r?3:4,PWID); camShake=Math.max(camShake,.45); cnt.broken++; try{ if(cnt.broken%3===1&&SFX.boom) SFX.boom(); else if(SFX.hit) SFX.hit(); }catch(er){} }
function strike(){ if(backing) backing.visible=false; const base=T_HIT; for(const p of panels) p.tb=base+RIP*Math.abs(p.c-MID)+(p.r?.14:0); camShake=1.3; try{ SFX.boom&&SFX.boom(); }catch(er){} }
function openStrip(){ setStrip(false); FIN.opened=true; }
function cutTick(dt){ FIN.t+=dt; const t=FIN.t, b=FIN.boss; const once=(k,at,fn)=>{ if(t>=at&&!FIN.ev[k]){ FIN.ev[k]=1; fn(); } };
  if(b&&!b.dead){ const u=Math.min(1,t/T_RUN), k=u*(2-u); b.x=FIN.bx0+(XS-FIN.bx0)*k; b.z=FIN.bz0+((BZ-2.4)-FIN.bz0)*k; b.yaw=-PI/2*(1-smooth((t-T_RUN)/.5)); b.walking=t<T_RUN; if(b.shoutT>0) b.shoutT-=dt; if(t>=T_SWING){ b.shoutT=0; b.swing=(t<T_HIT+.3)?0:-1; } sync(b); mobAnim(b,dt); }
  once('roar',T_RUN,()=>{ if(b&&b.mdl&&b.mdl.actions&&b.mdl.actions.shout) ogreRoar(b,1); else camShake=Math.max(camShake,.7); });
  once('hit',T_HIT,strike); once('open',T_OPEN,openStrip);
  for(const p of panels) if(!p.broken&&p.tb!==null&&t>=p.tb) breakPanel(p);
  for(let n=0;n<6&&FIN.crowdQ.length;n++) placeNext(FIN.crowdQ);
  for(const e of FIN.crowd) if(!e.dead&&e.mdl&&e.mdl.mixer) mobAnim(e,dt); }
function endCut(){ FIN.active=false; FIN.done=true; const b=FIN.boss; if(b&&!b.dead){ b.spd=b.spd0; b.walking=false; b.swing=-1; } letterbox(false); FIN.endP=camera.position.clone(); FIN.endQ=camera.quaternion.clone(); FIN.blend=BLEND_T; FIN.focus=null;
  if(!FIN.opened) openStrip(); for(const p of panels) if(!p.broken) breakPanel(p); if(backing) backing.visible=false; FIN.laterQ=buildQueue(LATER,LATER_TEAMS); FIN.laterT=1.5; cnt.ends++; }
function start(){ if(FIN.active||FIN.done||isGuest()||inCoop()||!ready) return false; FIN.active=true; FIN.t=0; FIN.ev={}; FIN.crowd=[]; FIN.opened=false; FIN.crowdQ=buildQueue(MIX,TEAMS); FIN.laterQ=[]; cnt.starts++; if(window.__carts) CARTK.forEach(k=>{ try{ window.__carts.load(k); }catch(er){} });
  const v=new THREE.Vector3(); camera.getWorldDirection(v); FIN.from={ p:[camera.position.x,camera.position.y,camera.position.z], l:[camera.position.x+v.x*20,camera.position.y+v.y*20,camera.position.z+v.z*20] };
  const b=spawnEnemy('ogre','E'); FIN.boss=b; if(b){ b.spd0=b.spd; b.spd=11; b.finaleBoss=true; FIN.bx0=b.x; FIN.bz0=b.z; const gl=glow(0xc040ff,5/b.sc,.55); gl.position.y=b.h*.55/b.sc; b.mdl.g.add(gl); }
  letterbox(true); try{ SFX.roar&&SFX.roar(); }catch(er){} return true; }
// ---- the game holds still while it plays: only the world's own animation, the cutscene's camera and the crowd's idling run
{ const prev=update; update=function(dt){ if(!FIN.active||S.phase==='start'||S.phase==='deathcut'||S.phase==='dead'||S.phase==='won') return prev.apply(this,arguments);
    cutTick(dt); updateFx(dt); updateCamera(dt); updateHUD(); Meta.hud(); if(FIN.t>=T_END) endCut(); }; }
{ const prev=updateCamera; updateCamera=function(dt){ if(FIN.active){ cutCamera(dt); return; } prev.apply(this,arguments);
    if(FIN.blend>0&&FIN.endP){ FIN.blend=Math.max(0,FIN.blend-dt); const k=smooth(1-FIN.blend/BLEND_T), q=camera.quaternion.clone(); camera.position.copy(FIN.endP).lerp(camera.position,k); camera.quaternion.copy(FIN.endQ).slerp(q,k); } }; }
// ---- the sixth wave begins, and sixteen seconds in the wall falls (a marker in the wave's own spawn list: the wave cannot end before it)
{ const prev=startWave; startWave=function(){ const w0=S.wave; const r=prev.apply(this,arguments); if(!SURVIVAL&&!FIN.done&&!FIN.active&&S.phase==='wave'&&S.wave===FIN_WAVE&&w0!==S.wave){ spawnQ.push({ t:FIN_T, kind:'__finale', lane:'E' }); spawnQ.sort((a,b)=>a.t-b.t); } return r; }; }
{ const prev=spawnEnemy; spawnEnemy=function(kind,lane){ if(kind==='__finale'){ if(!start()&&!ready&&!isGuest()&&!FIN.done) spawnQ.push({ t:S.waveT+1, kind:'__finale', lane:'E' }); return null; } return prev.apply(this,arguments); }; }
// ---- per frame: the panels' tumble, the dust, the crowd that follows out of the dark
WORLDANIM.push(dt=>{ for(const p of panels) p.w.update(dt);
  for(let i=dust.length-1;i>=0;i--){ const d=dust[i]; d.t+=dt; const k=d.t/d.life; if(k>=1){ world.remove(d.s); dust.splice(i,1); continue; } d.s.position.x+=d.vx*dt; d.s.position.y+=d.vy*dt; d.s.position.z+=d.vz*dt; d.s.material.opacity=.5*Math.sin(Math.min(1,k*1.6)*PI)*(1-k*.4); d.s.scale.setScalar(d.s.scale.x+dt*2.2); }
  if(!FIN.active&&FIN.laterQ.length&&S.phase!=='dead'){ FIN.laterT-=dt; if(FIN.laterT<=0){ FIN.laterT=.5; for(let n=0;n<3&&FIN.laterQ.length;n++) placeNext(FIN.laterQ,'later'); } } });
// ---- the wall put back (for the dev panel and the tests): panels whole again, the three rows solid again
function reset(){ if(FIN.active) return false; for(const p of panels) resetPanel(p); if(backing) backing.visible=true; setStrip(true); FIN.done=false; FIN.opened=false; FIN.laterQ=[]; FIN.blend=0; cnt.resets++; return true; }
// ---- the dev panel (F9)
setInterval(()=>{ const p=document.getElementById('devpanel'); if(!p||document.getElementById('dp-finale')) return; const sec=document.createElement('div'); sec.className='sect'; sec.id='dp-finale';
  sec.innerHTML='<label>the big barrier (wave 6 does this itself)</label><div class="row"><button id="dp-finale-go">🎬 The wall falls</button><button id="dp-finale-back">🧱 Put the wall back</button></div>'; const note=p.querySelector('.note'); if(note) p.insertBefore(sec,note); else p.appendChild(sec);
  document.getElementById('dp-finale-go').onclick=()=>{ start(); }; document.getElementById('dp-finale-back').onclick=()=>{ reset(); }; },800);
window.__torchFocus=()=>FIN.focus;
window.__finale={ info:()=>Object.assign({ panels:panels.length, intactPanels:panels.filter(p=>!p.broken).length, active:FIN.active, done:FIN.done, t:+FIN.t.toFixed(2), sealed:strip.every(i=>grid[i]===T.WALL), open:strip.every(i=>grid[i]===T.FLOOR), crowdNow:FIN.crowd.filter(e=>!e.dead).length, queued:FIN.crowdQ.length, laterQueued:FIN.laterQ.length, backing:!!(backing&&backing.visible), ready, dust:dust.length },cnt),
  start, reset, ready:()=>ready, boss:()=>FIN.boss, crowd:()=>FIN.crowd, panelList:()=>panels.map(p=>({ r:p.r, c:p.c, x:+p.x.toFixed(1), broken:p.broken, tb:p.tb===null?null:+p.tb.toFixed(2) })), strip:()=>strip.slice(),
  geom:{ X0, X1, BZ, ZB, PWID, XS, FLOOR_Y, COLS, ROWS, MID }, times:{ T_RUN, T_SWING, T_HIT, T_OPEN, T_REVEAL, T_END, FIN_WAVE, FIN_T }, camAt:t=>{ const keep=FIN.t; FIN.t=t; cutCamera(0); FIN.t=keep; return { p:camera.position.toArray(), l:FIN.focus }; } };
})();
