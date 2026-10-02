// ===== AVERY, THE DRAWBRIDGE'S BOSS (build 473). Matt: "wait till you see the boss for this map!!! he/she puts the drag in dragon" -> "she will fly around the roof tops, dropping feathers from her boa that
// do damage to defenses then heartroots, all bright colors that match her motif" -> "when she first comes on in wave 7 a cut scene that shows her, one of those where it's showing movement then a freeze pose
// then like a stamp 'Avery! she puts the Drag in Dragon'" -> "when this boss dies it will drop the entire wind set and 40 legendary sludge jars". Bob's art (Pictures\dungeon art,\mobs\Avery the dragon\animated):
// the remeshed flyer with twelve clips (parts/assets/avery-flyer.glb) and the bust with its Intro_Stamp clip -- turn, wink, fanged grin, hold (parts/assets/avery-bust.glb); both cut down by tools/glb-compact.mjs.
//   * THE INTRO: once a quarter of the Drawbridge's last wave is out, the hall stops: pink and purple spotlights sweep up over the castle, she glides in from the north-east over the hall roof, then the
//     camera cuts to her bust on a stage of light -- the turn, the wink, the grin -- FREEZE, a flash, and the stamp slams on. Any key or click skips it.
//   * THE FIGHT: she circles the rooftops (out over the inn too), and every few seconds swoops and shakes a burst of boa feathers down -- on the nearest tower if one is in reach, else on the most
//     hurt Heartroot. Every fourth swoop she lands on the hall roof and preens for six seconds (low enough for a sword). Below half health she is FURIOUS: faster swoops, two bursts each.
//   * HER FALL: wings folded, she spins down in a burst of feathers and fireworks -- 40 Legendary jars (99g-sludgejars.js BOSS), every piece of the Wind set (mythic, my call: the forge's set pieces),
//     and the boss chance at a named mythic (87-mythicdrops.js).
// Only MAP.id==='moat', campaign. Test hook: window.__avery.
(function(){
'use strict';
window.__avery={ loaded:()=>false };
if(TUTORIAL||!MAP||MAP.id!=='moat') return;
const K='avery', P=MAP.padN|0;
MOBS[K]={ hp:5200, spd:0, dmg:0, cd:99, mana:120, detour:0, fly:8 };
MOBDIM[K]={ fit:6.6, h:5, r:2.6, nat:{walk:1,run:1} };
const ROOF=16, CRUISE=ROOF+4,   /* build 479 (Matt: "at her highest altitude she's almost too high to see"): was 8 over the roofs */ SPD={ cruise:7.5, swoop:15, perch:9 }, ATK_CD=[4.6,3.0], PERCH_EVERY=4, PERCH_T=6, HEAD=-.71, DROP_T=1.2;   // HEAD: Bob's flyer faces 41 deg off its own +z (head bone vs pelvis, bone map): turned back so she flies nose first
const TOWER_K=.3, TOWER_MIN=50, HEART_DMG=12, REACH=30;
const WAY=[[8,6],[16,-3],[34,-3],[44,5],[40,13],[32,22],[34,38],[40,30],[24,14],[10,13]].map(([x,z])=>({ x:cw(x), z:cwz(z+P) }));   // round the castle roofs, out over the inn and back
const PERCH={ x:cw(24), z:cwz(-2+P) };   // the middle of the hall roof
const cnt={ intro:0, spawned:0, swoops:0, towerHits:0, heartHits:0, perches:0, deaths:0, skipped:0 };
const isMoat=()=>!SURVIVAL&&MAP&&MAP.id==='moat';
// ---------------------------------------------------------------- her two models, fetched once from the map's fifth wave
let loadP=null, bust=null;
// build 476 (Matt: "does she have any more rigging that could make her wings move" -- "let's see what you can do with the flying"): Bob's twelve clips each move all 42 bones; cut by bone into four
// layers that play at once and change on their own -- BODY (root, spine, legs), WINGS, TAIL, HEAD (neck, head, ears, jaw)
const GROUPS={ body:/^(CTRL_root|pelvis|spine|chest|hind_|fore_)/, wings:/^wing_/, tail:/^tail_/, head:/^(neck|head|ear|jaw)/ }, SUB={};
function layer(e,gname,clip,o){ o=o||{}; const L=e.lay||(e.lay={ cur:{}, act:{}, at:{} }); if(L.cur[gname]===clip&&!o.restart) return; const sub=SUB[gname]&&SUB[gname][clip]; if(!sub) return;
  const now=performance.now()/1000; if(!o.force&&L.at[gname]!==undefined&&now-L.at[gname]<HOLD_MIN) return; L.at[gname]=now;
  const a=e.mdl.mixer.clipAction(sub); a.reset(); a.timeScale=o.speed||(gname==='wings'&&SPEED[clip])||1; a.setEffectiveWeight(1); if(o.once){ a.setLoop(THREE.LoopOnce,1); a.clampWhenFinished=true; } else a.setLoop(THREE.LoopRepeat,Infinity);
  const prev=L.act[gname]; a.play(); if(prev&&prev!==a) a.crossFadeFrom(prev,o.fade!==undefined?o.fade:.35,false); L.cur[gname]=clip; L.act[gname]=a; }
// build 477 (Matt: "she sort of twitches a little but you don't see her huge wings actually move much"): Bob's ranges are "deliberately modest" -- his wingbeat swings the wing 17 deg either
// way (two flaps in 3 s), the hover half that, the fold 7 deg. Each wing bone's turn away from its GLIDE pose (the spread wing) is multiplied: the arm x3, the forearm x3.5, the fingers x6 -- his
// own motion, its own direction and timing, only bigger -- and the fold far more, to a real tuck. (Capped at 160 deg a bone.)
const AMP={ Wingbeat:{ arm:3, fore:3.5, fin:6 }, Hover:{ arm:3.5, fore:4, fin:6 }, Wing_Fold:{ arm:7, fore:6, fin:6 } };
function amplifyWings(){ const base=SUB.wings&&SUB.wings.Glide; if(!base) return; const q0=new THREE.Quaternion(), q=new THREE.Quaternion(), d=new THREE.Quaternion(), inv=new THREE.Quaternion();
  for(const clip in AMP){ const c=SUB.wings[clip]; if(!c) continue; for(const t of c.tracks){ if(!/quaternion$/.test(t.name)) continue; const bt=base.tracks.find(x=>x.name===t.name); if(!bt) continue;
      const bone=t.name.split('.')[0], k=/arm/.test(bone)&&!/fore/.test(bone)?AMP[clip].arm:/forearm/.test(bone)?AMP[clip].fore:AMP[clip].fin; q0.fromArray(bt.values,0); inv.copy(q0).invert();
      const v=t.values; for(let i=0;i<v.length;i+=4){ q.fromArray(v,i); d.multiplyQuaternions(inv,q).normalize(); if(d.w<0){ d.x=-d.x; d.y=-d.y; d.z=-d.z; d.w=-d.w; }
        const th=2*Math.acos(Math.min(1,d.w)), sn=Math.sin(th/2); if(sn<1e-6) continue; const th2=Math.min(th*k,160*PI/180), s2=Math.sin(th2/2)/sn; d.set(d.x*s2,d.y*s2,d.z*s2,Math.cos(th2/2)); q.multiplyQuaternions(q0,d).normalize(); q.toArray(v,i); } } } }
const HOLD_MIN=.5, SPEED={ Wingbeat:1.4, Hover:1.5 };   // a layer keeps a clip at least half a second (no flicker between two); the flaps a little quicker than Bob's 1.5 s
function pose(e,body,wings,tail,head,o){ o=o||{}; layer(e,'body',body,o); layer(e,'wings',wings,o.wingsOnce?Object.assign({},o,{ once:true }):o); layer(e,'tail',tail||'Tail_Swish'); layer(e,'head',head||'Look_Around',{ speed:.8 }); }
function parse(file){ return fetchBytes(ASSET(file)).then(buf=>new Promise((res,rej)=>new THREE.GLTFLoader().parse(buf,'',res,rej))); }
// build 495: her own music (Matt's pick, Picturesdungeon art,mobsAvery the dragonsoundsmusic_zapsplat_chiller.mp3 -- ZapSplat), fetched with her models, never at start
if(typeof TRACKS!=='undefined') TRACKS.avery='assets/music-avery.mp3';
function load(){ if(loadP) return loadP; if(typeof musFetch==='function'&&typeof TRACKS!=='undefined'&&TRACKS.avery) musFetch('avery');   /* once: load() runs every frame from wave 5, and loadP guards it (the Archhag's song once refetched every frame, build 414) */
  loadP=Promise.all([parse('avery-flyer.glb'),parse('avery-bust.glb')]).then(([f,b])=>{
    const root=f.scene||f.scenes[0]; const fit=fitModel(root,MOBDIM[K].fit); toonify(root,fit.scale); const by=n=>(f.animations||[]).find(a=>a.name===n);
    const map={ idle:by('Hover'), walk:by('Glide'), run:by('Wingbeat'), attack:by('Jaw_Open'), death:by('Wing_Fold'), hover:by('Hover'), glide:by('Glide'), wingbeat:by('Wingbeat'), bankL:by('Bank_Left'), bankR:by('Bank_Right'),
      tail:by('Tail_Swish'), look:by('Look_Around'), reach:by('Foreleg_Reach'), jaw:by('Jaw_Open'), breathe:by('Breathe'), fold:by('Wing_Fold') }; for(const k in map) if(!map[k]) delete map[k];
    MOBGLB[K]={ wrap:fit.wrap, map:{}, scale:fit.scale };   // build 476: no whole-body clips for the core to play -- she is driven in layers (below)
    for(const c of (f.animations||[])) for(const gname in GROUPS){ const tr=c.tracks.filter(t=>GROUPS[gname].test(t.name.split('.')[0])); (SUB[gname]=SUB[gname]||{})[c.name]=new THREE.AnimationClip(c.name+'_'+gname,c.duration,tr); }
    amplifyWings();
    const br=b.scene||b.scenes[0]; const bfit=fitModel(br,3.2); toonify(br,bfit.scale); const clip=(b.animations||[]).find(a=>a.name==='Intro_Stamp')||(b.animations||[])[0];
    bust={ g:bfit.wrap, clip, mixer:null };
  }).catch(e=>{ console.warn('avery model',e); loadP=null; });
  return loadP; }
{ const prev=Meta.update; Meta.update=dt=>{ prev(dt); if(isMoat()&&S.wave>=5) load(); }; }
// her stage for the bust shot, far above the hall (lit by two lamps of its own, added now so no shader rebuild hitches the cut later; they reach 14 and the hall is 300 below)
const STAGE=new THREE.Group(); STAGE.position.set(0,300,0); STAGE.visible=false; scene.add(STAGE);
{ const l1=new THREE.PointLight(C(0xffd0f0),1.6,14,2); l1.position.set(2.5,2.5,5); STAGE.add(l1); const l2=new THREE.PointLight(C(0xff3fd0),1.4,14,2); l2.position.set(-3,1,2); STAGE.add(l2);
  const c=document.createElement('canvas'); c.width=4; c.height=256; const g=c.getContext('2d'); const gr=g.createLinearGradient(0,0,0,256); gr.addColorStop(0,'#2a0a3a'); gr.addColorStop(.55,'#7a1a7a'); gr.addColorStop(1,'#ff4fd8'); g.fillStyle=gr; g.fillRect(0,0,4,256);
  const t=new THREE.CanvasTexture(c); t.encoding=THREE.sRGBEncoding; const back=new THREE.Mesh(new THREE.PlaneGeometry(40,24),new THREE.MeshBasicMaterial({ map:t, depthWrite:false })); back.position.set(0,1,-6); back.userData.noOL=true; STAGE.add(back);
  for(let i=0;i<5;i++){ const b=beamMesh(i%2?0xff4fd8:0xb05aff,9,1.4); b.position.set(-8+i*4,-5,-5); b.rotation.z=(i-2)*.22; STAGE.add(b); }
  for(let i=0;i<26;i++){ const s=glow(i%3?0xffb0f0:0xffffff,.25+Math.random()*.35,.85); s.position.set((Math.random()-.5)*16,-2+Math.random()*8,-5+Math.random()*2); STAGE.add(s); } }
// a spotlight beam: an open cone, additive, wide at the top
function beamMesh(col,len,w){ const m=new THREE.Mesh(new THREE.CylinderGeometry(w,.25,len,18,1,true),new THREE.MeshBasicMaterial({ color:C(col), transparent:true, opacity:.22, blending:THREE.AdditiveBlending, depthWrite:false, side:THREE.DoubleSide }));
  m.geometry.translate(0,len/2,0); m.userData.noOL=true; return m; }
// the castle's spotlights: on from her entrance until she falls, sweeping the sky
const BEAMS=[]; function beamsOn(){ if(BEAMS.length) return; [[12,24],[20,24],[28,24],[36,24],[6,-6],[44,-6]].forEach(([x,z],i)=>{ const b=beamMesh(i%2?0xff4fd8:0xa050ff,46,4.5); b.position.set(cw(x),z<0?ROOF:0,cwz(z+P)); world.add(b); BEAMS.push({ b, ph:i*1.3 }); }); }
function beamsOff(){ for(const o of BEAMS){ world.remove(o.b); o.b.geometry.dispose(); o.b.material.dispose(); } BEAMS.length=0; }
// ---------------------------------------------------------------- feathers: a pink and purple boa feather, falling and fluttering
let FTEX=null; function featherTex(){ if(FTEX) return FTEX; const c=document.createElement('canvas'); c.width=64; c.height=128; const g=c.getContext('2d');
  for(let i=0;i<40;i++){ const y=8+i*2.8, w=(Math.sin(i/40*PI)*26+4); g.strokeStyle=i%3?'#ff5ad8':'#c46aff'; g.lineWidth=2.2; g.beginPath(); g.moveTo(32,y); g.lineTo(32-w,y-6+Math.random()*3); g.moveTo(32,y); g.lineTo(32+w,y-6+Math.random()*3); g.stroke(); }
  g.strokeStyle='#ffe0f6'; g.lineWidth=2; g.beginPath(); g.moveTo(32,4); g.lineTo(32,124); g.stroke(); FTEX=new THREE.CanvasTexture(c); FTEX.encoding=THREE.sRGBEncoding; return FTEX; }
const FALL=[];   // { m, x,y,z, vy, spin, t, life }
function burst(fromX,fromY,fromZ,toX,toY,toZ,n){ const mat=new THREE.MeshBasicMaterial({ map:featherTex(), transparent:true, side:THREE.DoubleSide, depthWrite:false, alphaTest:.05 });
  for(let i=0;i<n;i++){ const m=new THREE.Mesh(new THREE.PlaneGeometry(.7,1.4),mat); m.userData.noOL=true; const sx=toX+(Math.random()-.5)*3.2, sz=toZ+(Math.random()-.5)*3.2; m.position.set(fromX+(Math.random()-.5)*2,fromY,fromZ+(Math.random()-.5)*2); scene.add(m);
    FALL.push({ m, x0:m.position.x, z0:m.position.z, x1:sx, z1:sz, y0:fromY, y1:toY+.2, t:-i*.05, life:1.1+Math.random()*.4, spin:(Math.random()-.5)*8, ph:Math.random()*TAU }); } }
function updFeathers(dt){ for(let i=FALL.length-1;i>=0;i--){ const f=FALL[i]; f.t+=dt; if(f.t<0) continue; const k=Math.min(1,f.t/f.life); const e=k*k*(3-2*k);
    f.m.position.set(f.x0+(f.x1-f.x0)*e+Math.sin(f.t*5+f.ph)*.35,f.y0+(f.y1-f.y0)*e,f.z0+(f.z1-f.z0)*e+Math.cos(f.t*4+f.ph)*.35); f.m.rotation.set(Math.sin(f.t*3+f.ph)*.8,f.t*f.spin,Math.cos(f.t*2.5)*.6);
    if(f.t>f.life+1.4){ f.m.material.opacity=Math.max(0,1-(f.t-f.life-1.4)/.6); if(f.t>f.life+2){ scene.remove(f.m); f.m.geometry.dispose(); FALL.splice(i,1); } } } }
// ---------------------------------------------------------------- what she aims at: the nearest tower in reach, else the Heartroot with the least left
function heartroots(){ const out=[{ which:1, x:0, z:0, y:(crystalG&&crystalG.position.y)||0, hp:S.crystal }];
  if(typeof GOAL2!=='undefined'&&GOAL2>=0) out.push({ which:2, x:C2X, z:C2Z, y:hgt[GOAL2]||0, hp:S.crystal2 }); if(typeof GOAL3!=='undefined'&&GOAL3>=0) out.push({ which:3, x:C3X, z:C3Z, y:MAP.crystal3Y!=null?MAP.crystal3Y:(hgt[GOAL3]||0), hp:S.crystal3 });
  return out.filter(h=>h.hp>0); }
function pickTarget(e,skip){ let best=null, bd=REACH; for(const d of defs){ if(d.dead||d===skip||d.kind==='perch'||d.kind==='trap'||d.kind==='pit') continue; const dd=Math.hypot(d.x-e.x,d.z-e.z); if(dd<bd){ bd=dd; best=d; } }
  if(best) return { def:best, x:best.x, z:best.z, y:best.top||((best.base||0)+2) };
  const hs=heartroots(); if(!hs.length) return null; hs.sort((a,b)=>a.hp-b.hp); const h=hs[0]; return { heart:h.which, x:h.x, z:h.z, y:h.y+2.5 }; }
function strike(e,tg){ if(tg.def){ const d=tg.def; if(!defs.includes(d)) return; const dmg=Math.max(TOWER_MIN,Math.round((d.max||100)*TOWER_K)); hurtDef(d,dmg); cnt.towerHits+=dmg; }
  else if(tg.heart){ hurtCrystal(HEART_DMG,e,tg.heart); cnt.heartHits+=HEART_DMG; }
  const g=glow(0xff4fd8,4,.9); g.position.set(tg.x,tg.y,tg.z); scene.add(g); projs.push({ kind:'splat', t:0, mesh:g }); try{ SFX.hit&&SFX.hit(); }catch(er){} }
// ---------------------------------------------------------------- the boss bar: hers, in pink, a line at half
{ const st=document.createElement('style'); st.textContent='#averybar{position:fixed;left:50%;top:66px;transform:translateX(-50%);width:min(480px,76vw);z-index:20;text-align:center;pointer-events:none;display:none;font:bold 14px Georgia,serif;color:#ffd0f4;text-shadow:0 2px 3px #000;letter-spacing:3px}'
  +'#averybar .track{position:relative;height:13px;margin-top:3px;background:#1a0a1e;border:2px solid #6a2a6a;border-radius:7px;overflow:hidden;box-shadow:0 0 12px #ff4fd855}#averybar .fill{display:block;height:100%;background:linear-gradient(90deg,#b040ff,#ff4fd8,#ffb0e8);transition:width .2s}'
  +'#averybar .half{position:absolute;left:50%;top:0;bottom:0;width:2px;background:#ffd27a}'
  +'#averycut{position:fixed;inset:0;z-index:60;pointer-events:none;display:none}#averycut .flash{position:absolute;inset:0;background:#fff;opacity:0}'
  +'#averycut .stamp{position:absolute;left:50%;top:42%;transform:translate(-50%,-50%) rotate(-7deg) scale(3);opacity:0;text-align:center;white-space:nowrap}'
  +'#averycut .stamp b{display:block;font:900 clamp(64px,11vw,150px) Georgia,serif;color:#ff4fd8;-webkit-text-stroke:3px #ffd27a;text-shadow:0 0 30px #ff4fd8,0 8px 0 #5a0a4a;letter-spacing:6px}'
  +'#averycut .stamp i{display:block;margin-top:6px;font:italic 700 clamp(20px,2.6vw,34px) Georgia,serif;color:#ffe6fa;text-shadow:0 3px 6px #000}'
  +'#averycut .avlb{position:absolute;left:0;right:0;width:auto;height:11vh;background:#000;margin:0}#averycut .avlb-t{top:0}#averycut .avlb-b{bottom:0;top:auto}#averycut .skip{position:absolute;right:18px;bottom:calc(11vh + 10px);font:13px Georgia;color:#d8b8e0;opacity:.7}'
  +'body.avery-cut #hud,body.avery-cut #hotbar,body.avery-cut #banner,body.avery-cut #toast,body.avery-cut #prompt,body.avery-cut #minimap,body.avery-cut #averybar,body.avery-cut #defcard,body.avery-cut #herostats,body.avery-cut #pickcard,body.avery-cut #ov,body.avery-cut #btns,body.avery-cut #wavebtn,body.avery-cut #mmWave,body.avery-cut #loadctr{visibility:hidden!important}';   /* the game already has a .bars (the Heartroot bars): the letterbox has its own name; and the HUD steps aside for her */
  document.head.appendChild(st); }
const bar=document.createElement('div'); bar.id='averybar'; bar.innerHTML='💋 AVERY 💋<div class="track"><i class="fill"></i><span class="half"></span></div>'; document.body.appendChild(bar);
const cutEl=document.createElement('div'); cutEl.id='averycut'; cutEl.innerHTML='<div class="avlb avlb-t"></div><div class="avlb avlb-b"></div><div class="flash"></div><div class="stamp"><b>AVERY!</b><i>she puts the Drag in Dragon</i></div><div class="skip">SPACE to skip ▸▸</div>'; document.body.appendChild(cutEl);
// ---------------------------------------------------------------- her arrival: the cut scene
let waveTotal=0, done=false, cut=null, avery=null;
{ const prev=startWave; startWave=function(){ prev(); if(isMoat()&&S.wave===MAP.waves) waveTotal=spawnQ.length; }; }
{ const prev=updateWave; updateWave=function(dt){ if(isMoat()&&!done&&S.phase==='wave'&&S.wave===MAP.waves&&waveTotal>0&&MOBGLB[K]&&bust&&waveTotal-spawnQ.length>=Math.max(1,Math.floor(waveTotal*.25))) startCut(); prev(dt); }; }
const SHOT_A=4.2, SHOT_B=3.6, HOLD=2.4, END=SHOT_A+SHOT_B+HOLD;
const START={ x:cw(47), z:cwz(-7+P), y:ROOF+16 };
let inSpawn=false;
function spawnAvery(){ const lk=Object.keys(LANES); inSpawn=true; let e=null; try{ e=spawnEnemy(K,lk[0]); } finally { inSpawn=false; } if(!e) return null; e.noSnare=true; e.atk=1e9; e.ast='cruise'; e.aw=1; e.acd=3; e.aswoops=0; e.at=0; e.phase=1;
  e.x=START.x; e.z=START.z; e.y=START.y; e.fly=START.y-baseFloor(e.x,e.z); e.mdl.g.position.set(e.x,e.y,e.z); e.mdl.actions={}; pose(e,'Glide','Glide'); cnt.spawned++; return e; }
function startCut(){ done=true; cnt.intro++; avery=spawnAvery(); if(!avery) return; beamsOn(); setMusic('none'); try{ SFX.horn&&SFX.horn(); }catch(e){}
  bust.g.position.set(0,-1.2,0); bust.g.rotation.y=0; if(!bust.g.parent) STAGE.add(bust.g); bust.mixer=new THREE.AnimationMixer(bust.g); const a=bust.mixer.clipAction(bust.clip); a.setLoop(THREE.LoopOnce,1); a.clampWhenFinished=true; a.play(); bust.act=a; a.paused=true;
  cut={ t:0, cam:camera.position.clone(), q:camera.quaternion.clone() }; cutEl.style.display='block'; cutEl.querySelector('.stamp').style.cssText=''; document.body.classList.add('avery-cut'); }
function endCut(){ if(!cut) return; camera.position.copy(cut.cam); camera.quaternion.copy(cut.q); cut=null; STAGE.visible=false; cutEl.style.display='none'; document.body.classList.remove('avery-cut');
  if(avery&&!avery.dead){ avery.x=PERCH.x+10; avery.z=PERCH.z+6; avery.y=CRUISE; avery.fly=CRUISE-baseFloor(avery.x,avery.z); } setMusic(TRACKS&&TRACKS.avery?'avery':'wave'); banner('💋 AVERY','she puts the Drag in Dragon'); camShake=Math.max(camShake,.5); }
// build 474 (Matt: "how can I see Avery, can I call her in from the dev hud"): the dev panel's Spawn with avery picked brings her in the way the wave does -- the whole cut scene, then the fight
{ const prev=spawnEnemy; spawnEnemy=function(kind){ if(kind!==K||inSpawn) return prev.apply(this,arguments); if(cut) return avery;
    if(MOBGLB[K]&&bust){ startCut(); return avery; } toast('💋 Avery is on her way…'); load().then(()=>{ if(MOBGLB[K]&&bust&&!cut) startCut(); }); return null; }; }
// build 478 (Matt: "when I spawn Avery from the dev hud it skips the cinematic"): any key or click used to skip -- a held W (its key repeat), or the click that takes the mouse back after the dev panel,
// threw the whole scene away at once. Only a deliberate SPACE or ENTER skips now, never a held key, and not in the first second.
addEventListener('keydown',ev=>{ if(!cut) return; if((ev.code==='Space'||ev.code==='Enter'||ev.code==='NumpadEnter')&&!ev.repeat&&cut.t>1&&cut.t<END-.5){ cut.t=END-.5; cnt.skipped++; } },true);
function stepCut(dt){ const c=cut; c.t+=dt; const t=c.t, e=avery;
  for(const o of BEAMS){ o.b.rotation.z=Math.sin(S.t*.0+t*.9+o.ph)*.45; o.b.rotation.x=Math.cos(t*.7+o.ph)*.25; }
  if(t<SHOT_A){ // SHOT A: the castle from the green, the spotlights up, and her glide in over the hall roof
    STAGE.visible=false; const k=t/SHOT_A, s=k*k*(3-2*k); const to={ x:PERCH.x, z:PERCH.z+2, y:CRUISE };
    if(e&&!e.dead){ e.x=START.x+(to.x-START.x)*s; e.z=START.z+(to.z-START.z)*s; e.y=START.y+(to.y-START.y)*s; const g=e.mdl.g; g.position.set(e.x,e.y,e.z); g.rotation.y=Math.atan2(to.x-START.x,to.z-START.z)+HEAD;
      pose(e,k>.72?'Hover':'Glide',k>.72?'Wingbeat':'Glide'); e.mdl.mixer.update(dt); }
    camera.position.set(cw(38),21,cwz(15+P)); if(e) camera.lookAt(e.x,e.y+1,e.z); }   /* from over the south wall-walk, under her line in */
  else if(t<SHOT_A+SHOT_B+HOLD){ // SHOT B: her bust on the stage -- the turn, the wink, the grin; then the FREEZE and the stamp
    STAGE.visible=true; const tb=t-SHOT_A; if(bust.act){ bust.act.paused=false; if(tb<SHOT_B) bust.mixer.update(dt); }
    camera.position.set(0,300+.9,4.6); camera.lookAt(0,300+.6,0);
    const flash=cutEl.querySelector('.flash'), stamp=cutEl.querySelector('.stamp');
    if(tb>=SHOT_B){ const h=tb-SHOT_B; flash.style.opacity=String(Math.max(0,.9-h*3)); const k=Math.min(1,h/.16); stamp.style.opacity='1'; stamp.style.transform='translate(-50%,-50%) rotate(-7deg) scale('+(3-2*k).toFixed(3)+')';
      if(h<.25&&!c.slam){ c.slam=true; camShake=Math.max(camShake,.6); try{ SFX.thud&&SFX.thud(); }catch(er){} } const jig=h>.16&&h<.5?(Math.random()-.5)*8:0; if(jig) stamp.style.transform+=' translate('+jig+'px,'+(-jig)+'px)'; }
    else { flash.style.opacity='0'; stamp.style.opacity='0'; } }
  if(t>=END) endCut(); }
// the hall holds still for the cut scene (as it does for a Heartroot's fall): only the cut runs
{ const prev=update; update=function(dt){ if(cut){ stepCut(dt); updFeathers(dt); updateHUD(); return; } return prev(dt); }; }
// ---------------------------------------------------------------- her mind, every frame (spd 0: the core never moves her; it keeps her at e.fly over the floor, so her height is set from the roof she is over)
function headTo(e,x,z,spd,dt){ const dx=x-e.x, dz=z-e.z, d=Math.hypot(dx,dz); if(d<.05) return 0; const s_=Math.min(d,spd*dt); e.x+=dx/d*s_; e.z+=dz/d*s_;
  const want=Math.atan2(dx,dz)+HEAD, g=e.mdl.g; let df=want-g.rotation.y; df=Math.atan2(Math.sin(df),Math.cos(df)); g.rotation.y+=df*Math.min(1,dt*3); e.bank=lerp(e.bank||0,df,Math.min(1,dt*4)); g.rotation.z=0; return d-s_; }
function setY(e,y){ e.climb=y-(e.y||0); e.fly=Math.max(.6,y-baseFloor(e.x,e.z)); }
{ const prev=updateEnemies; updateEnemies=function(dt){ prev(dt);
    for(const e of enemies){ if(e.kind!==K||e.dead||!e.ast) continue; e.atk=1e9; e.holdT=0; e.slowT=0; e.chillT=0; e.at+=dt; e.beatT=Math.max(0,(e.beatT||0)-dt);
      if(e.phase===1&&e.hp<=e.max*.5){ e.phase=2; banner('💅 AVERY IS FURIOUS','faster swoops, double the feathers'); camShake=Math.max(camShake,.6); burst(e.x,e.y+2,e.z,e.x,baseFloor(e.x,e.z),e.z,16); e.beatT=1.5; }
      const fast=e.phase===2?1.25:1;
      if(e.ast==='cruise'){ setY(e,CRUISE+Math.sin(S.t*.7)*.8); const w=WAY[e.aw%WAY.length]; if(headTo(e,w.x,w.z,SPD.cruise*fast,dt)<2.5){ e.aw++; if(e.aw%2===0) e.beatT=Math.max(e.beatT,1.4); }   // a few strong beats every other turn of her round
        const turn=e.bank||0, climbing=e.climb>1.2||e.beatT>0; if(Math.abs(turn)>.35) e.banking=turn>0?'Bank_Left':'Bank_Right'; else if(Math.abs(turn)<.15) e.banking=null; pose(e,e.banking||(climbing?'Hover':'Glide'),climbing?'Wingbeat':'Glide');
        e.acd-=dt; if(e.acd<=0){ if(e.aswoops>0&&e.aswoops%PERCH_EVERY===0&&!e.perched){ e.ast='perch'; e.perched=true; e.at=0; cnt.perches++; }
          else { const tg=pickTarget(e); if(tg){ e.atg=tg; e.ast='swoop'; e.at=0; e.beatT=.8; } e.acd=ATK_CD[e.phase-1]; } } }
      else if(e.ast==='swoop'){ const tg=e.atg; if(tg.def&&!defs.includes(tg.def)){ e.ast='cruise'; continue; } setY(e,tg.y+6);
        pose(e,e.beatT>0?'Hover':'Glide',e.beatT>0?'Wingbeat':'Wing_Fold',null,'Look_Around',{ fade:.25, wingsOnce:!(e.beatT>0) });   // a couple of beats, then wings tucked for the dive
        if(headTo(e,tg.x,tg.z,SPD.swoop*fast,dt)<2||e.at>6){ e.ast='drop'; e.at=0; burst(e.x,e.y+1.5,e.z,tg.x,tg.y-1.5,tg.z,e.phase===2?16:10); e.strikeQ=(e.strikeQ||[]).concat([{ at:S.t+1.1, tg }]);
          if(e.phase===2){ const t2=pickTarget(e,tg.def); if(t2&&(t2.def!==tg.def||t2.heart!==tg.heart)){ burst(e.x,e.y+1.5,e.z,t2.x,t2.y-1.5,t2.z,10); e.strikeQ.push({ at:S.t+1.2, tg:t2 }); } }
          e.aswoops++; cnt.swoops++; e.perched=false; } }
      else if(e.ast==='drop'){ const tg=e.atg; setY(e,tg.y+6); pose(e,'Hover','Hover',null,'Jaw_Open',{ fade:.2 });   // hovering over it, grinning, while the boa sheds
        if(e.at>DROP_T){ e.ast='cruise'; e.at=0; e.beatT=1.6; } }
      else if(e.ast==='perch'){ const left=headTo(e,PERCH.x,PERCH.z,SPD.perch,dt); setY(e,left>1?ROOF+3:ROOF+.6);
        if(left>1) pose(e,'Hover','Hover');
        else { if(!e.perchLanded){ e.perchLanded=true; e.at=0; floatText(e.x,e.y+4,e.z,'💋','#ff4fd8'); }
          if(e.at<PERCH_T-1.2) pose(e,'Breathe','Wing_Fold',null,e.at%4<2?'Look_Around':'Jaw_Open',{ wingsOnce:true, fade:.4 });   // landed: wings folded and kept folded, tail swishing, looking round, a grin now and then
          else pose(e,'Hover','Wingbeat',null,null,{ fade:.25 }); }   // the last second: wings open, a big beat to lift off
        if(e.perchLanded&&e.at>PERCH_T){ e.perchLanded=false; e.ast='cruise'; e.acd=1; e.at=0; e.beatT=1.8; floatText(e.x,e.y+4,e.z,'💅','#ff9ae8'); } }
      if(e.strikeQ&&e.strikeQ.length){ e.strikeQ=e.strikeQ.filter(q=>{ if(S.t<q.at) return true; strike(e,q.tg); return false; }); } }
    for(const o of BEAMS){ o.b.rotation.z=Math.sin(S.t*.6+o.ph)*.45; o.b.rotation.x=Math.cos(S.t*.45+o.ph)*.25; }
    updFeathers(dt);
    const e=enemies.find(x=>x.kind===K&&!x.dead); bar.style.display=e&&!cut?'block':'none'; if(e) bar.querySelector('.fill').style.width=Math.max(0,100*e.hp/e.max)+'%'; }; }
// ---------------------------------------------------------------- her fall: feathers and fireworks, the Wind set and her jars
function windSet(){ const look=(()=>{ try{ const m=window.__weapons&&window.__weapons.mount&&window.__weapons.mount(); return m&&m.staff?'staff':m&&m.bow?'bow':'sword'; }catch(e){ return 'sword'; } })();
  const ST={ weapon:{dmg:24,spd:45,tow:41}, armor:{hp:156,def:24,regen:4.5}, amulet:{mana:65,tow:41,hp:156}, familiar:{fdmg:35,frate:63,move:20}, charm:{move:20,trate:20,tarea:18} };
  return [{ slot:'weapon', name:'Mythic '+look[0].toUpperCase()+look.slice(1)+' of the Wind', setId:'wind', look, rarity:5, lvl:20, stats:ST.weapon },
    { slot:'armor', name:'Armor of the Wind', setId:'wind', rarity:5, lvl:20, stats:ST.armor }, { slot:'amulet', name:'Amulet of the Wind', setId:'wind', rarity:5, lvl:20, stats:ST.amulet },
    { slot:'familiar', name:'Storm Drake of the Wind', setId:'wind', rarity:5, lvl:20, stats:ST.familiar }, { slot:'charm', name:'Charm of the Wind', setId:'wind', rarity:5, lvl:20, stats:ST.charm }]; }
{ const prev=kill; kill=function(e){ const was=e&&!e.dead&&e.kind===K; const r=prev.apply(this,arguments); if(was){ cnt.deaths++; try{ pose(e,'Hindleg_Tuck','Wing_Fold',null,'Jaw_Open',{ wingsOnce:true, fade:.15, force:true }); }catch(er){}
    burst(e.x,e.y+2,e.z,e.x,baseFloor(e.x,e.z),e.z,40); for(let k=0;k<5;k++){ const g=glow([0xff4fd8,0xffd27a,0xb05aff,0xffffff,0xff8ae0][k],5+k,.9); g.position.set(e.x+(Math.random()-.5)*4,e.y+1+Math.random()*3,e.z+(Math.random()-.5)*4); scene.add(g); projs.push({ kind:'splat', t:0, mesh:g }); }
    camShake=Math.max(camShake,.9); banner('💋 AVERY FALLS','the Wind set is yours'); setTimeout(()=>{ if(!enemies.some(x=>x.kind===K&&!x.dead)&&musicMode==='avery') setMusic(S.phase==='wave'?'wave':'build'); },2500);
    const N=window.__mythic&&window.__mythic.normalize; windSet().forEach((rec,i)=>{ const it=N?N(rec):null; if(!it) return; const a=i/5*TAU; dropLoot(it,hero.x+Math.cos(a)*3.5,hero.z+Math.sin(a)*3.5,true); });
    setTimeout(()=>{ if(!enemies.some(x=>x.kind===K&&!x.dead)) beamsOff(); },2500); } return r; }; }
window.__avery={ kind:K, load, loaded:()=>!!(MOBGLB[K]&&bust), info:()=>Object.assign({ cut:!!cut, cutT:cut?+cut.t.toFixed(2):null, beams:BEAMS.length, feathers:FALL.length },cnt),
  state:()=>enemies.filter(e=>!e.dead&&e.kind===K).map(e=>({ st:e.ast, phase:e.phase, x:+e.x.toFixed(1), z:+e.z.toFixed(1), y:+(e.y||0).toFixed(1), hp:Math.round(e.hp), max:e.max, swoops:e.aswoops })),
  peek:(wclip,frac)=>{ const e=enemies.find(x=>x.kind===K&&!x.dead); if(!e) return false; e.ast='peek'; const mx=e.mdl.mixer; mx.stopAllAction(); e.lay={ cur:{}, act:{}, at:{} }; for(const [g,c] of [['body','Hover'],['wings',wclip],['tail','Tail_Swish'],['head','Look_Around']]){ const sub=SUB[g]&&SUB[g][c]; if(!sub) continue; const act=mx.clipAction(sub); act.reset(); act.play(); act.time=sub.duration*frac; act.paused=true; } mx.update(0); return true; },   /* test hook: hold her in one pose (avery-test pictures) */ startCut, endCut, skip:()=>{ if(cut) cut.t=END-.01; }, windSet, way:WAY, perch:PERCH };
})();
