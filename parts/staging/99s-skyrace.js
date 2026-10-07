// ===== THE SKY RACE (build 580). Matt: "a skill race, 9 floating rings some high some down lower, the blue one is next once thru it a new blue one to head for, its a race in the sky on your paramotor".
// THE DRAWBRIDGE, the BUILD phase (like the paramotor and the mini golf). Nine rings hang round the castle -- over the gate, high over the keep, out past the north-east corner, along the east wall,
// skimming the moat, beside the inn, low over the south green, out west, and the finish right in front of the castle gate. The NEXT ring is BLUE (with a beam of light above it so it can be found from
// anywhere); the rest of the course glows faint gold, and the ones you have flown through go pale green. Fly through ring 1 and the clock starts (top of the screen: the ring you are on, the time,
// your best); through all nine in order and it is a finish: a fanfare, your time, NEW BEST if it is, and (my call) a Legendary Sludge for the first finish of each run. Land or drop before the end and the
// race is off -- ring 1 is blue again. Each player races their own (co-op: everyone sees the same rings; the colours are your own progress). Best time: dd_skyrace_best. Test hook: window.__skyrace.
(function(){
'use strict';
window.__skyrace={ info:()=>null };
const PA=window.__para;
if(!MAP||MAP.id!=='moat'||!PA||!PA.flying) return;
const P=(MAP.padN)|0;
// the course: [cell x, the dev panel's row (north padding off), height]
const COURSE=[[24,8,22],[24,-4,30],[42,3,24],[45,9,20],[44,22,9],[40,31,18],[22,30,7],[6,30,9],[24,20,10]];
const R=3.6;   // ring radius: wide enough for the wing
const pts=COURSE.map(([x,r,y])=>new THREE.Vector3(cw(x),y,cwz(r+P)));
const START=new THREE.Vector3(cw(24),20,cwz(14+P));   // the gate towers: where the paramotors take off
const C3=h=>new THREE.Color(h);
const COL={ next:0x1e7bff, todo:0xffc840, done:0x4aff7a };
const rings=pts.map((c,i)=>{ const prev=i?pts[i-1]:START, nxt=pts[i+1]||c.clone().add(c.clone().sub(prev)); const n=nxt.clone().sub(prev); n.y*=.35; n.normalize();
  const mat=new THREE.MeshBasicMaterial({ color:C3(COL.todo), transparent:true, opacity:.4, depthWrite:false, fog:false });
  const m=new THREE.Mesh(new THREE.TorusGeometry(R,.28,10,48),mat); m.position.copy(c); m.lookAt(c.clone().add(n)); m.userData.noOL=true; m.renderOrder=3; world.add(m);
  return { c, n, m, mat }; });
// the beam over the next ring, and a soft glow behind it
const beamM=new THREE.MeshBasicMaterial({ color:C3(COL.next).convertSRGBToLinear(), transparent:true, opacity:.22, depthWrite:false, fog:false, blending:THREE.AdditiveBlending });
const beam=new THREE.Mesh(new THREE.CylinderGeometry(.35,.35,60,10,1,true),beamM); beam.userData.noOL=true; world.add(beam);
let halo=null; try{ halo=glow(COL.next,9,.55); halo.material.fog=false; world.add(halo); }catch(e){}
// the HUD strip
const css=document.createElement('style'); css.textContent='#skyrace{position:fixed;top:112px;left:50%;transform:translateX(-50%);z-index:25;pointer-events:none;display:none;background:#0b0912e8;border:2px solid #3aa8ff;border-radius:999px;color:#e6f3ff;font:bold 16px Georgia,serif;padding:6px 18px;box-shadow:0 3px 14px #000,0 0 14px #3aa8ff55;white-space:nowrap}#skyrace b{color:#7cc8ff}#skyrace .t{font:bold 18px system-ui;margin:0 6px}#skyrace .bst{color:#ffd27a;font-size:14px}'+
 '#skyfin{position:fixed;top:24%;left:50%;transform:translateX(-50%);z-index:26;pointer-events:none;display:none;background:linear-gradient(#10243a,#081420);border:3px solid #3aa8ff;border-radius:16px;padding:14px 28px;color:#e6f3ff;text-align:center;box-shadow:0 0 30px #3aa8ff66,0 10px 30px #000}#skyfin .h{font:bold 24px Georgia,serif;letter-spacing:3px;color:#7cc8ff}#skyfin .tm{font:bold 44px system-ui;margin:4px 0}#skyfin .nb{font:bold 18px Georgia,serif;color:#ffd27a}#skyfin .rw{margin-top:6px;font-size:16px}';
document.head.appendChild(css);
const hud=document.createElement('div'); hud.id='skyrace'; document.body.appendChild(hud);
const fin=document.createElement('div'); fin.id='skyfin'; document.body.appendChild(fin);
const fmt=t=>{ const m=Math.floor(t/60), s=t-m*60; return m+':'+(s<10?'0':'')+s.toFixed(1); };
let best=null; try{ const v=parseFloat(localStorage.getItem('dd_skyrace_best')); if(v>0) best=v; }catch(e){}
const RACE={ next:0, t:0, on:false, rewarded:false, finT:0 };
const cnt={ passes:0, finishes:0, dnfs:0 };
const phase=()=>{ try{ return typeof hallPhase==='function'?hallPhase():S.phase; }catch(e){ return S.phase; } };
function paint(){ rings.forEach((r,i)=>{ const st=i<RACE.next?'done':i===RACE.next?'next':'todo'; r.mat.color.setHex(COL[st]).convertSRGBToLinear();   /* r128: the page renders in sRGB -- a plain hex comes out washed pale without this */ r.mat.opacity=st==='next'?.95:st==='done'?.18:.4; r.st=st; });
  const nr=rings[RACE.next]; if(nr){ beam.visible=true; beam.position.set(nr.c.x,nr.c.y+30+R,nr.c.z); if(halo){ halo.visible=true; halo.position.copy(nr.c); } } else { beam.visible=false; if(halo) halo.visible=false; } }
function reset(){ RACE.next=0; RACE.t=0; RACE.on=false; paint(); }
paint();
function chime(i){ try{ beep(620+i*55,.16,'triangle',.07,240); setTimeout(()=>{ try{ beep(930+i*55,.14,'sine',.05,0); }catch(e){} },90); }catch(e){} }
function fanfare(){ try{ [523,659,784,1047].forEach((f,k)=>setTimeout(()=>{ try{ beep(f,.22,'triangle',.08,0); }catch(e){} },k*120)); }catch(e){} }
function sludge(){ try{ const K='dd_sludge_in'; let b=null; try{ b=JSON.parse(localStorage.getItem(K)); }catch(e){} b=(b&&typeof b==='object')?b:{}; b.legendary=(Math.floor(+b.legendary)||0)+1; localStorage.setItem(K,JSON.stringify(b)); return true; }catch(e){ return false; } }
function finish(){ RACE.on=false; cnt.finishes++; const t=RACE.t, nb=best===null||t<best; if(nb){ best=t; try{ localStorage.setItem('dd_skyrace_best',String(t)); }catch(e){} }
  let rw=''; if(!RACE.rewarded&&sludge()){ RACE.rewarded=true; rw='<div class="rw">🧪 +1 Legendary Sludge</div>'; try{ floatText(hero.x,(hero.y||0)+2.4,hero.z,'+1 Legendary Sludge','#ffb040'); }catch(e){} }
  fin.innerHTML='<div class="h">🏁 SKY RACE</div><div class="tm">'+fmt(t)+'</div>'+(nb?'<div class="nb">★ NEW BEST ★</div>':'<div class="nb">best '+fmt(best)+'</div>')+rw; fin.style.display='block'; RACE.finT=4.5; fanfare();
  RACE.next=rings.length; paint(); RACE.last={ t:+t.toFixed(2), nb }; }
// passing a ring: the step from the last spot to this one crosses its face inside the hoop (or comes within a step of its middle)
const prevPos=new THREE.Vector3(), cur=new THREE.Vector3(), tmp=new THREE.Vector3(); let havePrev=false;
function passes(r,a,b){ const da=tmp.copy(a).sub(r.c).dot(r.n), db=tmp.copy(b).sub(r.c).dot(r.n);
  if(da<=0&&db>0||da>=0&&db<0){ const k=da/(da-db); tmp.copy(a).lerp(b,k); if(tmp.distanceTo(r.c)<R) return true; }
  return b.distanceTo(r.c)<1.6; }
function track(x,y,z){ const nr=rings[RACE.next]; cur.set(x,y,z); if(havePrev&&nr&&passes(nr,prevPos,cur)){ cnt.passes++; chime(RACE.next); if(RACE.next===0){ RACE.on=true; RACE.t=0; } RACE.next++; if(RACE.next>=rings.length) finish(); else paint(); } prevPos.copy(cur); havePrev=true; }
PA.onLand(()=>{ if(RACE.next>0&&RACE.next<rings.length){ cnt.dnfs++; RACE.dnf={ at:RACE.next }; } reset(); });
{ const prev=Meta.update; Meta.update=dt=>{ prev(dt);
    const build=phase()==='build'&&!(window.CINE&&window.CINE.active&&window.CINE.active()); for(const r of rings) r.m.visible=build;   /* build 585: never inside a cinematic (the castle scene plays in the Drawbridge's first build phase) */ if(!build){ beam.visible=false; if(halo) halo.visible=false; hud.style.display='none'; if(RACE.next) reset(); havePrev=false; return; }
    if(RACE.finT>0){ RACE.finT-=dt; if(RACE.finT<=0){ fin.style.display='none'; reset(); } }
    const t=performance.now()/1000, nr=rings[RACE.next]; if(nr){ const pulse=.8+.2*Math.sin(t*5); nr.mat.opacity=.95*pulse; nr.m.rotation.z+=dt*.6; if(halo) halo.material.opacity=.45*pulse; }
    if(RACE.on) RACE.t+=dt;
    const flying=PA.flying(); if(!flying){ hud.style.display='none'; havePrev=false; return; }
    track(hero.x,(hero.y||0)+1.2,hero.z);   // the hero's middle (the wing rides above)
    if(RACE.next<rings.length){ hud.style.display='block'; hud.innerHTML='🏁 RING <b>'+(RACE.next+1)+'</b>/'+rings.length+'<span class="t">'+(RACE.on?fmt(RACE.t):'0:00.0')+'</span>'+(best!==null?'<span class="bst">best '+fmt(best)+'</span>':'<span class="bst">fly through the blue ring</span>'); } else hud.style.display='none'; }; }
(window.__cineHide=window.__cineHide||[]).push(()=>rings.map(r=>r.m).concat([beam,halo]));   // build 585: out of every cinematic (the framework hides them as a scene begins; the build check below keeps them hidden)
window.__skyrace={ info:()=>Object.assign({ next:RACE.next, on:RACE.on, t:+RACE.t.toFixed(2), best, rewarded:RACE.rewarded, last:RACE.last||null, dnf:RACE.dnf||null, rings:rings.map(r=>({ x:+r.c.x.toFixed(1), y:+r.c.y.toFixed(1), z:+r.c.z.toFixed(1), st:r.st, vis:r.m.visible })) },cnt),
  ring:i=>{ const r=rings[i]; return r?{ x:r.c.x, y:r.c.y, z:r.c.z, nx:r.n.x, ny:r.n.y, nz:r.n.z }:null; }, count:rings.length, R, reset, track,
  clear:()=>rings.map((r,i)=>{ let hits=0; const u=new THREE.Vector3(), v=new THREE.Vector3(); u.set(0,1,0).cross(r.n); if(u.lengthSq()<1e-6) u.set(1,0,0); u.normalize(); v.copy(r.n).cross(u).normalize(); for(let k=0;k<24;k++){ const a=k/24*Math.PI*2, px=r.c.x+(u.x*Math.cos(a)+v.x*Math.sin(a))*R, py=r.c.y+(u.y*Math.cos(a)+v.y*Math.sin(a))*R, pz=r.c.z+(u.z*Math.cos(a)+v.z*Math.sin(a))*R; if(PA.flySolid(px,pz,py)) hits++; } return hits; }) };
})();
