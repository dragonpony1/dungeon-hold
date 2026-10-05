// ===== THE FIGHTER'S HALO SURGE WEARS MATT'S RADIAL SHOCKWAVE (build 541). Matt: "can you apply this to the fighters secondary attack" (his hi3d-radial-shockwave_1.glb ->
// parts/assets/halo-shockwave.glb: a flat ground piece -- an inner hero circle, an outer circle, 32 radial channels with charge sparks running out along them in three pulses, and three
// shockwave rings that swell outward, 3 s, cyan and blue). Looks only: the damage ring (73-specials.js RING_FX, radius 8 over .6 s) and the surge are untouched.
//   * THE CHARGE (holding right-click as the Fighter, 1.2 s): the piece lies at his feet, small, its sparks racing out along the channels, brighter as the charge fills.
//   * THE RELEASE (73-specials.js playFlourish, so a partner's cast shows on every screen too): a big copy at the cast spot, scaled so its last ring reaches the damage ring's 8,
//     played from the first ring's swell at 3.3x so all three rings roll out across the same ~.7 s the damage ring does, then fades.
//   * COLOUR: the polearm's set colour (86w-setglow.js), else his Halo gold -- the model's white / cyan / blue become a pale, full and deep shade of it. The colour rides with the cast in co-op (p.col).
// Pooled: one charge copy and up to three bursts, each with its own three materials. Until the model is in, the old ring and glow (still drawn) stand alone. Test hook: window.__halofx.
(function(){
const FILE='halo-shockwave.glb', GOLD=0xffa51f, OUTER=4.2, CHARGE_SCALE=.5, FROM=.8, SPEED=3.3, FADE=.35;
const cnt={ bursts:0, made:0, charges:0, loadErr:null };
let tmpl=null, clip=null, loadP=null; const pool=[], live=[]; let charge=null;
function load(){ if(tmpl||loadP) return loadP; if(typeof fetchBytes!=='function'||!THREE.GLTFLoader) return null;
  loadP=fetchBytes(ASSET(FILE),'soon').then(buf=>new Promise((res,rej)=>new THREE.GLTFLoader().parse(buf,'',res,rej))).then(g=>{ tmpl=g.scene||g.scenes[0]; clip=(g.animations||[])[0]||null; }).catch(e=>{ cnt.loadErr=String(e); console.warn('halo shockwave',e); loadP=null; });
  return loadP; }
function shade(hex,k){ const c=new THREE.Color(hex); return k<1?c.multiplyScalar(k).getHex():c.lerp(new THREE.Color(0xffffff),k-1).getHex(); }
function col(){ const H=window.__heldglow; let k=null; try{ const n=H&&H.info&&H.info().held, m=/^(sword|polearm|staff|bow)-([a-z]+)$/.exec(n||''); if(m&&H.col) k=H.col(m[2]); }catch(e){} return k!=null?k:GOLD; }
// one copy: its own clone of the piece, its own mixer, and its own three materials (pale / full / deep), unlit, see-through, never writing depth
function make(){ const root=tmpl.clone(true), mats={pale:null,full:null,deep:null}; const mk=(add,op,key)=>{ const m=new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:op,depthWrite:false,side:THREE.DoubleSide,blending:add?THREE.AdditiveBlending:THREE.NormalBlending}); m.userData.key=key; return m; };
  mats.pale=mk(false,1,'pale'); mats.full=mk(false,.95,'full'); mats.deep=mk(true,.5,'deep');   /* the lines solid (added on, they burned out to white), the filled circle added on (laid over, it darkened the floor) */ const morph={pale:null,full:null,deep:null};
  root.traverse(o=>{ if(!o.isMesh) return; const n=(o.material&&o.material.name)||'', key=/White/i.test(n)?'pale':/Cyan/i.test(n)?'full':'deep';
    if(o.morphTargetInfluences&&o.morphTargetInfluences.length){ if(!morph[key]){ morph[key]=mats[key].clone(); morph[key].userData.key=key; morph[key].morphTargets=true; } o.material=morph[key]; } else o.material=mats[key]; o.userData.noOL=true; o.frustumCulled=false; o.renderOrder=3; });
  const all=[mats.pale,mats.full,mats.deep,morph.pale,morph.full,morph.deep].filter(Boolean); const base=all.map(m=>m.opacity);
  const mixer=new THREE.AnimationMixer(root), act=clip?mixer.clipAction(clip):null; if(act){ act.setLoop(THREE.LoopRepeat,Infinity); act.play(); }
  cnt.made++; return {root,mixer,act,all,base,t:0,col:-1}; }
function paint(o,c){ if(o.col===c) return; o.col=c; const P=C(shade(c,1.12)), F=C(c), D=C(shade(c,.6)); for(const m of o.all){ const k=m.userData.key; m.color.copy(k==='pale'?P:k==='full'?F:D); } }
function fade(o,k){ for(let i=0;i<o.all.length;i++) o.all[i].opacity=o.base[i]*k; }
function burst(x,y,z,c,R){ if(!tmpl){ load(); return false; } let o=pool.pop(); if(!o){ if(live.length>=3){ o=live.shift(); scene.remove(o.root); } else o=make(); }
  paint(o,c!=null?c:GOLD); const s=(R||8)/OUTER; o.root.scale.set(s,s,s); o.root.position.set(x,y+.04,z); o.root.rotation.y=rnd()*TAU; o.t=0; o.life=(clip?(clip.duration-FROM)/SPEED:.7)+FADE;
  if(o.act){ o.act.reset(); o.act.play(); o.act.time=FROM; o.act.timeScale=SPEED; o.mixer.update(0); } fade(o,1); scene.add(o.root); live.push(o); cnt.bursts++; return true; }
function tickBursts(dt){ for(let i=live.length-1;i>=0;i--){ const o=live[i]; o.t+=dt; o.mixer.update(dt); const left=o.life-o.t; if(left<=0){ scene.remove(o.root); live.splice(i,1); pool.push(o); continue; } fade(o,left<FADE?left/FADE:1); } }
// the charge at his feet while right-click is held
function tickCharge(dt){ const S_=window.__specials; const on=!!(S_&&S_.charging()&&S_.hero()==='fighter'&&hero.dead<=0);
  if(S_&&S_.hero()==='fighter') load();
  if(!on||!tmpl){ if(charge&&charge.root.parent) scene.remove(charge.root); return; }
  if(!charge) charge=make(); const o=charge, k=Math.min(1,S_.chargeT()/Math.max(.01,S_.chargeTime()));
  if(!o.root.parent){ paint(o,col()); o.root.rotation.y=rnd()*TAU; if(o.act){ o.act.reset(); o.act.play(); o.act.time=0; } scene.add(o.root); cnt.charges++; }
  const s=CHARGE_SCALE*(.85+.35*k); o.root.scale.set(s,s,s); o.root.position.set(hero.x,hero.y+.05,hero.z); o.root.rotation.y+=dt*(1+3*k);
  if(o.act) o.act.timeScale=1.4+2.2*k; o.mixer.update(dt); fade(o,.45+.55*k); }
{ const prev=Meta.update; Meta.update=dt=>{ prev(dt); try{ tickCharge(dt); tickBursts(dt); }catch(e){ console.warn('halo fx',e); } }; }
window.__halofx={ load, burst, col, info:()=>Object.assign({ loaded:!!tmpl, clip:clip&&clip.name, live:live.length, pooled:pool.length, charging:!!(charge&&charge.root.parent) },cnt), liveRoots:()=>live.map(o=>o.root), chargeRoot:()=>charge&&charge.root };
})();
