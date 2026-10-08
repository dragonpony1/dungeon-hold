// ===== WHAT'S COMING OUT OF EACH DOOR, ON THE MINI-MAP (build 590). Matt: "at one point i was gonna have little signs made to tell what was coming out of each door, but, now i am
// thinking maybe just some icons on the mini map during build phase" / "just put a number inside one mob icon we don't need to know every single thing coming out, just which doors to defend".
//  * In the BUILD phase every door the next wave uses gets ONE round icon on the mini-map: a portrait of the toughest mob coming out of it (photographed from its real model, in game),
//    with how many come out of that door on a badge. A boss coming out of a door rings its icon red; the Drawbridge's SKY gate (flyers over the far wall) gets one too, ringed sky blue. A door that sends nothing gets no icon. The horn sounds -> the icons go.
//  * Never wrong: the next wave is worked out once as the build phase starts and that same wave is what the horn sends (waveComp below hands the worked-out wave to startWave) --
//    so nothing about the waves changes, it is only decided a little earlier.
//  * A co-op guest's waves are the host's (the guest never works one out), so a guest's map shows no icons (my call; the host's does).
// Test hook: window.__doorpreview.
(function(){
'use strict';
if(typeof waveComp!=='function'||typeof LANES==='undefined') return;
const BOSS=new Set(['cyclops','pigflail','pigdagger','pigsling','trollboss','archhag','corruptor','avery','bullion','direwolf']);
const isGuest=()=>{ const n=window.__net; return !!(n&&n.role&&n.role()==='guest'); };
const diff=()=>{ try{ return (window.__difficulty&&window.__difficulty.level().id)||''; }catch(e){ return ''; } };
const keyFor=w=>[MAP&&MAP.id,SURVIVAL?1:0,TUTORIAL?1:0,w,diff()].join('|');
// where a door sits: a lane's gate, or the Drawbridge's SKY gate (99h-skygate.js: every other flyer rises over the far wall instead)
function doorAt(lane){ const L=LANES[lane]; if(L) return { x:cw(L.cx), z:cwz(L.cz) }; const SG=MAP&&MAP.skyGate; if(lane==='SKY'&&SG&&Array.isArray(SG.at)) return { x:cw(SG.at[0]), z:cwz(SG.at[1]+(MAP.padN|0)), sky:true }; return null; }
let PRE=null;   // { key, w, c, used, doors }
const cnt={ made:0, handed:0, portraits:0 };
// the worked-out wave is the one the horn sends
{ const prev=waveComp; waveComp=function(w){ if(PRE&&!PRE.used&&PRE.w===w&&PRE.key===keyFor(w)){ PRE.used=true; cnt.handed++; return PRE.c; } return prev.apply(this,arguments); }; }
function work(){ const w=effWave()+1, k=keyFor(w); if(PRE&&PRE.key===k&&!PRE.used) return PRE;
  let c=null; const s0=S.wave; try{ S.wave=s0+1; c=waveComp.call(null,w); }catch(e){ c=null; } finally{ S.wave=s0; }   // as startWave will ask it (S.wave already counted up)
  if(!c||!Array.isArray(c.q)){ PRE=null; return null; }
  const doors={}; for(const x of c.q){ if(!x||!doorAt(x.lane)) continue; const d=doors[x.lane]||(doors[x.lane]={ n:0, top:null, topHp:-1, boss:false }); d.n++; const hp=(MOBS[x.kind]&&MOBS[x.kind].hp)||0; if(BOSS.has(x.kind)) d.boss=true; if(hp>d.topHp){ d.topHp=hp; d.top=x.kind; } }
  PRE={ key:k, w, c, used:false, doors }; cnt.made++; return PRE; }
// a new wave, a new map, a restart: start over
const showing=()=>S.phase==='build'&&!S.held&&!TUTORIAL&&!isGuest()&&!(window.__hideout&&window.__hideout.isOpen&&window.__hideout.isOpen())&&(effWave()-MAP.wbase)<runWaves();
// ---- portraits: each mob kind once, from its real model (until the model has loaded, a plain red disc stands in and it tries again later)
const PIC={}, PSZ=96;
let rt=null, pscene=null, pcam=null;
function portrait(kind){ const have=PIC[kind]; if(have&&have.real) return have.cv; if(have&&performance.now()-have.at<3000) return have.cv;
  if(typeof MOBGLB==='undefined'||!MOBGLB[kind]){ PIC[kind]={ cv:null, real:false, at:performance.now() }; return null; }
  try{
    if(!rt){ rt=new THREE.WebGLRenderTarget(PSZ,PSZ); rt.texture.encoding=THREE.sRGBEncoding; pscene=new THREE.Scene(); pcam=new THREE.PerspectiveCamera(30,1,.05,200);
      pscene.add(new THREE.HemisphereLight(0xfff2dd,0x302040,1.15)); const key=new THREE.DirectionalLight(0xffffff,1.1); key.position.set(2,3,4); pscene.add(key); }
    const m=makeMob(kind); const g=m.g; try{ const a=m.actions&&(m.actions.idle||m.actions.walk); if(a){ a.play(); m.mixer.update(.4); } }catch(e){}
    g.traverse(o=>{ if(o.isMesh&&typeof SHADOWMAT!=='undefined'&&o.material===SHADOWMAT) o.visible=false; });   /* not its floor shadow */ g.position.set(0,0,0); g.rotation.set(0,0,0); g.updateMatrixWorld(true); pscene.add(g);
    // the head and shoulders, seen from the front a touch above. Sized from the game's own height for the kind (MOBDIM; a skinned model's bounding box is its bind pose, not what shows)
    const dim=(typeof MOBDIM!=='undefined'&&MOBDIM[kind])||null, box=new THREE.Box3().setFromObject(g), h=Math.max(.2,(dim&&dim.h)||(box.max.y-box.min.y)), fly=(MOBS[kind]&&MOBS[kind].fly)?1:0;
    const fy=fly?h*.55:h*.8, span=fly?h*1.1:h*.7, dist=span*.5/Math.tan(15*Math.PI/180); pcam.position.set(0,fy+h*.06,dist); pcam.lookAt(0,fy,0);
    const oldT=renderer.getRenderTarget(), oldC=renderer.getClearColor(new THREE.Color()), oldA=renderer.getClearAlpha();
    renderer.setRenderTarget(rt); renderer.setClearColor(0x000000,0); renderer.clear(); renderer.render(pscene,pcam); const px=new Uint8Array(PSZ*PSZ*4); renderer.readRenderTargetPixels(rt,0,0,PSZ,PSZ,px);
    renderer.setRenderTarget(oldT); renderer.setClearColor(oldC,oldA); pscene.remove(g);
    g.traverse(o=>{ if(o.geometry&&o.geometry.dispose&&!o.isSkinnedMesh&&o.userData&&o.userData.own) o.geometry.dispose(); });
    const cv=document.createElement('canvas'); cv.width=cv.height=PSZ; const c2=cv.getContext('2d'), img=c2.createImageData(PSZ,PSZ);
    for(let y=0;y<PSZ;y++){ const src=(PSZ-1-y)*PSZ*4; img.data.set(px.subarray(src,src+PSZ*4),y*PSZ*4); }   // the GPU reads bottom-up
    c2.putImageData(img,0,0); PIC[kind]={ cv, real:true, at:performance.now() }; cnt.portraits++; return cv;
  }catch(e){ PIC[kind]={ cv:null, real:false, at:performance.now() }; return null; } }
// ---- drawn over the mini-map (97g-minimap.js calls __mmExtra at the end of each draw)
let last=null;
window.__mmExtra=function(g,px,pz,DPR,cv){ if(!showing()){ last=null; return; } const P=work(); if(!P) { last=null; return; } last=P;
  const R=11*DPR, W=cv.width, H=cv.height;
  for(const lane in P.doors){ const D=doorAt(lane), d=P.doors[lane]; if(!D) continue;
    let x=px(D.x), z=pz(D.z); x=Math.max(R+2*DPR,Math.min(W-R-2*DPR,x)); z=Math.max(R+2*DPR,Math.min(H-R-2*DPR,z));
    const pic=portrait(d.top);
    g.save(); g.beginPath(); g.arc(x,z,R,0,6.2832); g.fillStyle='#2a0d10'; g.fill(); g.clip();
    if(pic) g.drawImage(pic,x-R,z-R,R*2,R*2); else { g.fillStyle='#ff4646'; g.beginPath(); g.arc(x,z,R*.55,0,6.2832); g.fill(); }
    g.restore();
    g.beginPath(); g.arc(x,z,R,0,6.2832); g.lineWidth=(d.boss?2.6:1.6)*DPR; g.strokeStyle=d.boss?'#ff3a3a':D.sky?'#7cc8ff':'#ffd27a'; if(d.boss){ g.shadowColor='#ff2020'; g.shadowBlur=6*DPR; } g.stroke(); g.shadowBlur=0;
    // the count on a badge, bottom right
    const t=String(d.n), bx=x+R*.72, bz=z+R*.62; g.font='bold '+Math.round(9.5*DPR)+'px system-ui,sans-serif'; const tw=Math.max(g.measureText(t).width+5*DPR,12*DPR);
    g.fillStyle='#000000e0'; g.beginPath(); if(g.roundRect) g.roundRect(bx-tw/2,bz-6.5*DPR,tw,13*DPR,6.5*DPR); else g.rect(bx-tw/2,bz-6.5*DPR,tw,13*DPR); g.fill();
    g.lineWidth=DPR; g.strokeStyle=d.boss?'#ff3a3a':'#ffd27a'; g.stroke(); g.fillStyle='#ffffff'; g.textAlign='center'; g.textBaseline='middle'; g.fillText(t,bx,bz+.5*DPR); } };
window.__doorpreview={ info:()=>Object.assign({ on:!!last, w:last?last.w:null, doors:last?JSON.parse(JSON.stringify(last.doors)):null, used:last?last.used:null, pics:Object.keys(PIC).filter(k=>PIC[k].real) },cnt),
  lastQ:()=>{ const P=PRE; if(!P) return null; const o={}; for(const x of P.c.q) if(!doorAt(x.lane)) o[x.kind+"@"+x.lane]=(o[x.kind+"@"+x.lane]||0)+1; return o; }, work, pending:()=>PRE&&!PRE.used?{ w:PRE.w, n:PRE.c.q.length, doors:JSON.parse(JSON.stringify(PRE.doors)) }:null, portrait };
})();
