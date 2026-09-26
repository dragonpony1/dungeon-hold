// ===== THE GREAT SETS: the arcane Void set is the first of ten planned; the green Forest set is the starter that teaches the frame. Each is a registry entry: its "of the …" suffix, icon and
// colour, how rare it is (lowest rarity that can carry it, the chance per drop by wave), what a piece is worth, the sound and
// light of its drop, the three- and five-piece buffs (percentages on the multiplier hook, and an optional five-piece power that
// fires on hero hits), and which weapon models stand in until its own arrive. Add a set = add an entry to PACKS.
(function(){
const PACKS={};
function addSet(d){ PACKS[d.name]=d; Meta.sets.SETS[d.name]={ic:d.ic,three:{},five:{},text:d.text,col:d.css}; Meta.sets.names.push(d.name); }
const packOf=it=>{ const n=it&&Meta.sets.setOf(it); return n&&PACKS[n]||null; };
const worn=()=>Meta.sets.active().filter(a=>PACKS[a.name]).map(a=>({pack:PACKS[a.name],tier:a.tier}));
// ---- the Void: dark runed pieces that burn violet. Rare+ only, from wave 4 (5% of such drops, +1 point a wave, 15% cap), worth ×3.
addSet({name:'of the Void',ic:'🌌',col:0x8a3dff,css:'#c070ff',emissive:0x5a2bd0,minR:2,chance:w=>w>=4?Math.min(.15,.05+.01*(w-4)):0,valueMul:3,
  three:{dmg:.15,fam:.15,tow:.12},five:{dmg:.25,fam:.25,tow:.20},text:['+15% hero damage · +15% familiar damage · +12% defense damage','+25% hero damage · +25% familiar damage · +20% defense damage · DAZZLING HALOS +75% damage · VOID RIFT: every hit tears a rift — 40% of the blow to all within 3 units, and they crawl for 2 s'],
  defKind:{dazzle:.75},   // the five-piece power on defenses: this wearer's Dazzling Halos, +75% (94-voidset.js applies it in stat())
  unlock:{id:'stand-void',name:'Void Armor Stand',model:'armor-stand-void.glb',slot:'armor',rarity:4,reason:'The Void set, complete'},   // the reward the full set puts in the hideout's wall locker (94-voidset.js: a dd_gear_carried record with reward:true)
  models:{sword:'void',staff:'staff-void',bow:'bow-void',armor:'stand-void'}, /* the sword is the Void's own now, built in 94-voidset.js */ art:{sword:'item-void-sword.webp',armor:'item-void-armor.webp',charm:'item-void-charm.webp',amulet:'item-void-amulet.webp'},   // 2-D card art for the bag, the shop and the sheet (assets/); real files now for sword/armor/charm/amulet — staff (the witch's own weapon-slot art) still doesn't have one, so a witch wearing this set still gets the plain emoji/placeholder for her weapon specifically
  sfx:()=>{ beep(98,.9,'sine',.13,-30); beep(196,.7,'triangle',.05,0); setTimeout(()=>beep(1046,.35,'sine',.045,900),80); setTimeout(()=>beep(1568,.5,'sine',.035,1400),220); noise(.5,.04,6000); },
  onHit:(e,dmg)=>{ const r=rift(e,Math.round(dmg*.4*10)/10); riftFx(e.x,e.y||0,e.z,0x8a3dff); SFX.rift(); return r; }});
// ---- the Forest: the STARTER set, green like the Uncommon it starts at. Training wheels for map one: a set a new player
// will actually complete in a run or two, so the whole frame -- wear three, wear five, a power, the aura, the locker
// reward -- is learned early on pieces that don't matter much. Uncommon+ from wave 1: 30% of such drops through wave 3,
// fading four points a wave to a 6% floor, worth ×1.5. Small, readable bonuses; BRAMBLE roots what the hero hits.
addSet({name:'of the Forest',ic:'🌲',col:0x5ad05a,css:'#5ad05a',emissive:0x1f6a2a,minR:1,chance:w=>w<1?0:Math.min(.4,Math.max(.1,.4-.05*(w-4))),valueMul:1.5,
  three:{hp:.08,move:.04},five:{hp:.15,move:.08,dmg:.10},text:['+8% health · +4% move','+15% health · +8% move · +10% hero damage · TWIN SHOT: your familiar fires two bolts in a spread, half again as far, a little quicker'],
  fam:{twin:true,spread:.26,rate:1.25,range:1.5},   // the five-piece power on the familiar (applied below): two bolts in a spread, farther, a little quicker -- an obvious boon
  unlock:{id:'stand-forest',name:'Forest Armor Stand',model:'armor-stand-forest.glb',slot:'armor',rarity:1,reason:'The Forest set, complete'},   // the locker reward, so the starter set teaches that too
  models:{sword:'venom',staff:'staff-hazel',bow:'bow-yew',armor:'stand-forest'},   // the green blade, the plain wood staff and bow, the forest mannequin
  sfx:()=>{ beep(523,.5,'sine',.07,0); setTimeout(()=>beep(784,.45,'triangle',.05,200),90); setTimeout(()=>beep(1047,.4,'sine',.04,400),180); }});   // a rising woodland chime
// ---- a set's five-piece power on the familiar (pack.fam): TWIN SHOT fires the shot twice, rate divides the cooldown, range stretches the reach
function famBoon(){ const w=worn().find(x=>x.tier>=5&&x.pack.fam); return w?w.pack.fam:null; }
let twinSide=1;
{ const prev=famFire; famFire=function(e){ prev(e); const b=famBoon(); if(!(b&&b.twin)) return; const k=((window.__familiar&&window.__familiar.state())||{}).kind||''; /* the species: 85-familiars keeps kindOf() to itself */ if(k==='Bat'||k==='Crystal Owl'||k==='Storm Drake'){ prev(e); return; }   /* these act on the target itself: a plain second strike */
    const dist=Math.hypot(e.x-fam.x,e.z-fam.z)||1, ang=Math.atan2(e.x-fam.x,e.z-fam.z)+(b.spread||.26)*twinSide; twinSide=-twinSide; prev(Object.assign({},e,{x:fam.x+Math.sin(ang)*dist,z:fam.z+Math.cos(ang)*dist})); }; }   // the second bolt fans out to one side, then the other
{ const prev=famRate; famRate=function(){ const r=prev(); const b=famBoon(); return b&&b.rate?r/b.rate:r; }; }
{ const prev=famTarget; famTarget=function(){ const b=famBoon(); if(!(b&&b.range)) return prev(); let best=null, bd=FAM_RANGE*b.range; for(const e of enemies){ if(e.dead) continue; const d=Math.hypot(e.x-fam.x,e.z-fam.z); if(d<bd&&los(fam.x,fam.z,e.x,e.z)){ bd=d; best=e; } } return best; }; }
// ---- the guarantee, the bigger training wheel: on map one four Forest pieces are in hand by wave two. Each held wave's
// thanks includes Forest pieces for slots the player still lacks -- two owned after wave 1, four after wave 2 -- dropped
// gently by the crystal with the wave's own reward. The FIFTH never drops in the hall: it waits in the hideout's wall locker (below). Pieces still lying on the floor count as owned,
// so nothing is handed out twice; a player who already found some gets only what is missing.
const FOREST_BY_WAVE={1:2,2:4};
function forestGuarantee(w){ if(MAPI!==0) return 0; const target=FOREST_BY_WAVE[w]; if(!target) return 0; const have=forestOwned(); const missing=SLOTS.filter(k=>!have[k]); const n=Math.max(0,Math.min(missing.length,target-(SLOTS.length-missing.length))); const P=PACKS['of the Forest'];
  for(let i=0;i<n;i++){ const it=rollItem(1,missing[i]); it.rarity=Math.max(it.rarity,1); makeSet(it,P); dropLoot(it,R(-2.2,2.2),4.6+.5*(i+1),true); } if(n) floatText(0,3.2,4.6,P.ic+' '+n+' PIECE'+(n>1?'S':'')+' OF THE FOREST — THE HALL\'S THANKS',P.css); return n; }
{ const prev=Meta.onWaveHeld; Meta.onWaveHeld=w=>{ prev(w); forestGuarantee(w); }; }

// ---- the last piece: the hideout's wall locker. On map one, the moment four Forest pieces are in hand the fifth is rolled for
// the missing slot and put in the hideout's locker as a reward record (dd_gear_carried, reward:true -- the locker's contract),
// the game keeping its own copy in dd_forest_locker. The rails: a lesson says where it is, the guide gets a step, and the horn
// will not sound on map one while it waits. When the player comes back from the hideout (the overlay closing, or the title-
// screen visit ending) the piece is taken into the bag if the locker was opened (rewardSeen) or the record is gone (put on
// display), the record is removed if still there, and the set is complete: the five-piece toast and the TWIN SHOT lesson.
const LOCKER_KEY='dd_forest_locker', CARRY_KEY='dd_gear_carried';
function lockerRead(){ try{ const o=JSON.parse(localStorage.getItem(LOCKER_KEY)); return o&&typeof o==='object'?o:null; }catch(e){ return null; } }
function lockerWrite(o){ try{ if(o) localStorage.setItem(LOCKER_KEY,JSON.stringify(o)); else localStorage.removeItem(LOCKER_KEY); }catch(e){} }
function carriedRead(){ try{ const a=JSON.parse(localStorage.getItem(CARRY_KEY)); return Array.isArray(a)?a:[]; }catch(e){ return []; } }
function carriedWrite(a){ try{ localStorage.setItem(CARRY_KEY,JSON.stringify(a)); }catch(e){} }
function lockerPending(){ const o=lockerRead(); return !!(o&&o.item&&!o.taken); }
function offerLastPiece(){ if(MAPI!==0||lockerRead()) return false; const have=forestOwned(); if(Object.keys(have).length!==4) return false; const slot=SLOTS.find(k=>!have[k]); if(!slot) return false; const P=PACKS['of the Forest'];
  const it=rollItem(1,slot); it.rarity=Math.max(it.rarity,1); makeSet(it,P); lockerWrite({item:it,at:Date.now(),taken:false});
  const list=carriedRead(); if(!list.some(r=>r&&r.id===it.id)){ const rec=JSON.parse(JSON.stringify(it)); rec.from='dungeon-hold'; rec.carriedAt=Date.now(); rec.reward=true; rec.takeBack=true; rec.reason='The last piece of the Forest set — take it back to the hall'; list.push(rec); carriedWrite(list); }   // takeBack: the hideout offers TAKE (not the display) and marks rewardTaken
  lesson(P.ic+' Your last piece of the Forest waits in the hideout\'s wall locker — go through the portal (E at the archway) and open the locker before the next horn',10); if(SFX.setBong) SFX.setBong(); return true; }
function collectLastPiece(){ const o=lockerRead(); if(!o||!o.item||o.taken) return false; const list=carriedRead(); const rec=list.find(r=>r&&r.id===o.item.id); if(rec&&!rec.rewardSeen&&!rec.rewardTaken){ lesson('The wall locker is still shut — open it in the hideout to take your Forest piece',7); return false; }
  o.taken=true; lockerWrite(o); if(rec) carriedWrite(list.filter(r=>r!==rec)); Meta.onPickup(o.item); const P=PACKS['of the Forest'];
  lesson(P.ic+' The last piece of the Forest is yours — equip it, and watch your familiar: TWIN SHOT, two bolts in a spread, farther and quicker',10); if(SFX.setBong) SFX.setBong(); return true; }
{ const prev=startWave; startWave=function(){ if(MAPI===0&&lockerPending()){ lesson('The horn waits: fetch your last Forest piece from the hideout\'s wall locker first — E at the archway',7); if(SFX.rift) SFX.rift(); return; } return prev.apply(this,arguments); }; }
{ let wasOpen=false, tick=0; const prev=Meta.update; Meta.update=dt=>{ prev(dt); const open=!!(window.__hideout&&window.__hideout.isOpen()); if(wasOpen&&!open) collectLastPiece(); wasOpen=open; if(++tick%30===0&&MAPI===0&&(S.phase==='build'||S.phase==='wave')) offerLastPiece(); }; }
// ---- the pity rule, a training wheel: on map one, a player holding three or four Forest pieces gets the missing slot from the
// next Uncommon-or-better random-slot drop (a mob's, or the held wave's), so the set completes on the training ground instead of wave seven
function forestOwned(){ const P=PACKS['of the Forest'], have={}; const tag=it=>{ if(it&&Meta.sets.setOf(it)===P.name) have[it.slot]=true; }; for(const k in gear) tag(gear[k]); for(const it of Meta.bag()) tag(it); for(const l of loot) tag(l.it); return have; }   // worn, bagged, or still lying on the floor
function forestPity(){ if(MAPI!==0) return null; const have=forestOwned(); const n=Object.keys(have).length; if(n!==3) return null;   /* fills the fourth only: the fifth is the locker's */ const missing=SLOTS.filter(k=>!have[k]); return missing[Math.floor(LR()*missing.length)]||null; }
// ---- the buffs: percentages on the same multiplier hook as skills, keyed by the set so nothing reads them as flat points
{ const prev=Meta.mult; Meta.mult=k=>{ let v=prev(k)||0; for(const {pack,tier} of worn()){ const b=tier>=5?pack.five:pack.three; if(b&&b[k]) v+=b[k]; } return v; }; }
{ const prev=famDmg; famDmg=function(){ return Math.round(prev()*(1+(Meta.mult('fam')||0))*10)/10; }; }
// ---- the drop rule: after the ordinary roll a Rare-or-better piece may become a set piece; the old suffix goes, the value climbs
function makeSet(it,d){ const base=it.name.replace(/ of (the )?[A-Z]\w*( [A-Z]\w*)?$/,''); it.name=base+' '+d.name;   /* any old "of …" tail goes, saved names from before the sets included */ it.value=Math.round(it.value*(d.valueMul||1)); return it; }
{ const prev=rollItem; rollItem=function(minR,slot,lvl){ const pity=slot===undefined?forestPity():null; const it=prev(minR,pity||slot,lvl); if(pity&&it.rarity>=1){ makeSet(it,PACKS['of the Forest']); return it; } const w=effWave(); const fourForest=Object.keys(forestOwned()).length>=4; for(const n in PACKS){ const d=PACKS[n]; if(fourForest&&d===PACKS['of the Forest']) continue; /* the fifth Forest piece is the locker's alone */ if(it.rarity>=(d.minR|0)&&LR()<d.chance(w)){ makeSet(it,d); break; } } return it; }; }
// ---- the drop: the set's own sound, a column of its light for three seconds, a shout; the piece on the floor takes its colour
SFX.rift=()=>{ beep(140,.22,'sawtooth',.05,-90); noise(.12,.05,2400); };
const FX=[]; const RING_GEO=new THREE.RingGeometry(.6,1,32), COL_GEO=new THREE.CylinderGeometry(.14,.3,7,14,1,true);
function fxMat(col,op){ return new THREE.MeshBasicMaterial({color:col,transparent:true,opacity:op,side:THREE.DoubleSide,depthWrite:false,blending:THREE.AdditiveBlending}); }
function column(x,z,col){ const m=new THREE.Mesh(COL_GEO,fxMat(col,.55)); m.position.set(x,3.5,z); m.userData.noOL=true; scene.add(m); FX.push({m,t:0,kind:'col'}); }
function riftFx(x,y,z,col){ const m=new THREE.Mesh(RING_GEO,fxMat(col,.9)); m.rotation.x=-PI/2; m.position.set(x,y+.08,z); m.userData.noOL=true; scene.add(m); FX.push({m,t:0,kind:'ring'}); }
{ const prev=Meta.update; Meta.update=dt=>{ prev(dt); for(let i=FX.length-1;i>=0;i--){ const f=FX[i]; f.t+=dt; let done=false;
    if(f.kind==='ring'){ const s=1+f.t*6; f.m.scale.set(s,s,1); f.m.material.opacity=Math.max(0,.9-f.t*2.2); done=f.t>.45; }
    else { f.m.material.opacity=Math.max(0,.55*(1-f.t/3)); f.m.rotation.y+=dt*1.5; f.m.scale.set(1+f.t*.15,1,1+f.t*.15); done=f.t>3; }
    if(done){ scene.remove(f.m); f.m.material.dispose(); FX.splice(i,1); } } }; }
// a LESSON is a toast for a first-timer: bigger, centred high, and it stays (8 s) -- the ordinary toast is 2 s of small text a new player never reads
const LESSON={el:null,t:0}; function lesson(text,secs){ if(!LESSON.el){ const st=document.createElement('style'); st.textContent='#lesson{position:absolute;left:50%;top:22%;transform:translateX(-50%);max-width:min(680px,90vw);background:#000c;border:2px solid #ffd27a;border-radius:12px;padding:14px 24px;color:#fff;font-size:20px;line-height:1.4;text-align:center;text-shadow:0 2px 3px #000;opacity:0;transition:opacity .4s;pointer-events:none;z-index:6}#lesson.on{opacity:1}@media (max-width:700px){#lesson{font-size:16px;top:18%}}'; document.head.appendChild(st); LESSON.el=document.createElement('div'); LESSON.el.id='lesson'; (document.getElementById('hud')||document.body).appendChild(LESSON.el); }
  LESSON.el.textContent=text; LESSON.el.classList.add('on'); LESSON.t=secs||8; }
{ const prev=Meta.update; Meta.update=dt=>{ prev(dt); if(LESSON.t>0){ LESSON.t-=dt; if(LESSON.t<=0) LESSON.el.classList.remove('on'); } }; }
window.__lesson={show:lesson,text:()=>LESSON.el?LESSON.el.textContent:'',on:()=>!!(LESSON.el&&LESSON.el.classList.contains('on'))};
const HINT_KEY='dd_setHint';   // the first set piece a player ever sees lands with a one-line lesson, once per browser
function setHint(d){ let seen=false; try{ seen=!!localStorage.getItem(HINT_KEY); localStorage.setItem(HINT_KEY,'1'); }catch(e){} if(seen) return false; setTimeout(()=>lesson(d.ic+' A SET PIECE — wear three '+d.name+' for a bonus, all five for its power. Your sheet shows the count.',9),1400); return true; }
{ const prev=dropLoot; dropLoot=function(it,x,z,gentle){ const l=prev(it,x,z,gentle); const d=packOf(it); if(d){ SFX.setBong(); if(d.sfx) d.sfx(); floatText(x,1.7,z,d.ic+' A PIECE '+d.name.toUpperCase(),d.css); column(x,z,d.col); setHint(d);
    const art=itemArt(it), item=l.mesh.userData.item;
    const recolor=()=>l.mesh.traverse(m=>{ if(m.isMesh&&m.material&&m.material.color&&!m.userData.isOL){ m.material=m.material.clone(); m.material.color.set(d.col); if(m.material.emissive) m.material.emissive.set(d.emissive||0); } });
    // a set with an `art` entry but no file there yet (still common: see the "emoji stands in" note above) used to
    // hide the generic shape regardless of whether the swap actually had anything to show, leaving nothing on the
    // floor at all. Hide it optimistically as before, but bring it back (recoloured, same as a set with no art) if
    // the file 404s instead of silently leaving an empty sprite where the piece should be.
    if(art&&item){ item.visible=false; const tex=new THREE.TextureLoader().load(art,undefined,undefined,()=>{ item.visible=true; recolor(); }); tex.encoding=THREE.sRGBEncoding; const spr=new THREE.Sprite(new THREE.SpriteMaterial({map:tex,transparent:true})); spr.scale.set(.62,.62,1); spr.position.y=.55; spr.userData.noOL=true; l.mesh.add(spr); l.mesh.userData.artSprite=spr; }
    else recolor(); } return l; }; }
// ---- the five-piece powers ride hero hits: a hit that lands hands the target and the blow to the set
function rift(e,dmg){ let n=0; for(const o of enemies){ if(o.dead||o===e) continue; if(Math.hypot(o.x-e.x,o.z-e.z)<3+(o.r||.5)){ hurt(o,dmg,0,0); o.slowT=Math.max(o.slowT||0,2); n++; } } e.slowT=Math.max(e.slowT||0,2); return n; }
{ const prev=hitCone; hitCone=function(){ const five=worn().filter(w=>w.tier>=5&&w.pack.onHit); if(!five.length) return prev(); const before=[]; for(const e of enemies) if(!e.dead) before.push([e,e.hp]); prev(); const dmg=heroDmg(); for(const [e,h] of before) if(e.hp<h) for(const w of five) w.pack.onHit(e,dmg); }; }
// ---- card art: a set piece shows its picture wherever gear is drawn; a missing file falls back to the slot's emoji
function itemArt(it){ if(!it) return null; if(it.art) return it.art; const d=packOf(it); if(!d||!d.art) return null; let k=it.slot; if(k==='weapon'){ const hm=window.__heroes&&window.__heroes.pick(); k=(hm==='witch')?'staff':(hm==='troll')?'bow':'sword'; } const n=d.art[k]||d.art[it.slot]; if(!n) return null; return /^(data:|https?:|\.\/|\/)/.test(n)?n:ASSET(n); }
function artHtml(it,slot){ const em=SICON[(it&&it.slot)||slot]||''; const a=itemArt(it); return a?'<img class="ia" src="'+a+'" alt="" onerror="this.classList.add(\'bad\')"><span class="ie">'+em+'</span>':em; }
{ const st=document.createElement('style'); st.textContent='.ia{width:100%;height:100%;object-fit:contain;display:block;border-radius:2px;pointer-events:none}.ia.bad{display:none}.ia:not(.bad)+.ie{display:none}.tv-card .ic .ia{width:30px;height:30px;vertical-align:middle}.tv-setbadge{position:absolute;top:3px;left:3px;width:15px;height:15px;line-height:15px;text-align:center;font-size:10px;border-radius:50%;background:#120c1a;box-shadow:0 0 0 1px currentColor,0 0 4px currentColor;pointer-events:none}'; document.head.appendChild(st); }
// a small round badge in the corner, the set's own icon on the set's own colour — so a set piece reads as one at a
// glance in the bag/shop/sheet, not just from its "of the ..." name text
if(typeof tvCard==='function'){ const prev=tvCard; tvCard=function(it,from,extra){ let html=prev(it,from,extra).replace('<span class="ic">'+SICON[it.slot]+'</span>','<span class="ic">'+artHtml(it)+'</span>');
  const d=packOf(it); if(d){ html=html.replace(/^<div class="tv-card([^"]*)"/,'<div class="tv-card$1" style="border-color:'+d.css+'"');
    html=html.replace(/^(<div class="tv-card[^>]*>)/,'$1<span class="tv-setbadge" style="color:'+d.css+'" title="Part of a set: '+it.name.replace(/"/g,'&quot;')+'">'+d.ic+'</span>'); }
  return html; }; }
// ---- the full-set aura: a thin shell in the set's colour around the hero's own model (additive, drawn behind the surface,
// so only a faint rim shows), on while all five pieces are worn; the sheet's portrait sees it too
const AURA={root:null,col:null,meshes:[]};
const AURA_VS_SKIN='uniform float t;\n#include <common>\n#include <skinning_pars_vertex>\nvoid main(){\n#include <beginnormal_vertex>\n#include <skinbase_vertex>\nvec3 transformed=position+normalize(objectNormal)*t;\n#include <skinning_vertex>\ngl_Position=projectionMatrix*modelViewMatrix*vec4(transformed,1.0);\n}';
const AURA_VS='uniform float t;\nvoid main(){ vec3 p=position+normal*t; gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.0); }';
const AURA_FS='uniform vec3 col; uniform float op;\nvoid main(){ gl_FragColor=vec4(col,op); }';
function auraMat(col,skinned,t){ return new THREE.ShaderMaterial({side:THREE.BackSide,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,skinning:!!skinned,uniforms:{t:{value:t},col:{value:new THREE.Color(col)},op:{value:.32}},vertexShader:skinned?AURA_VS_SKIN:AURA_VS,fragmentShader:AURA_FS}); }
function auraClear(){ for(const g of AURA.meshes){ if(g.parent) g.parent.remove(g); g.material.dispose(); } AURA.meshes=[]; AURA.root=null; AURA.col=null; }
function fullPack(){ const w=worn().find(x=>x.tier>=5&&x.pack.col); return w?w.pack:null; }
function auraUpdate(){ const pk=fullPack(); const root=(useGLB&&GLBH)?GLBH.root:(typeof H!=='undefined'?H.g:null); const col=pk?pk.col:null;
  if(!col||!root){ if(AURA.meshes.length) auraClear(); return; }
  if(AURA.root!==root||AURA.col!==col){ auraClear(); const sc=(useGLB&&GLBH&&GLBH.scale)||1, t=.05/sc; root.traverse(m=>{ if(!m.isMesh||m.userData.isOL||m.userData.noOL||m.isSprite||m.userData.setGlow) return; if(/lash|handle/.test(m.parent&&m.parent.name||'')) return; let g; if(m.isSkinnedMesh){ g=new THREE.SkinnedMesh(m.geometry,auraMat(col,true,t)); g.bind(m.skeleton,m.bindMatrix); } else g=new THREE.Mesh(m.geometry,auraMat(col,false,t)); g.userData.isOL=true; g.userData.setGlow=true; g.frustumCulled=false; g.renderOrder=2; AURA.meshes.push(g); }); AURA.root=root; AURA.col=col;
    root.traverse(m=>{ if(m.isMesh&&!m.userData.isOL&&!m.userData.setGlow){ const g=AURA.meshes.find(x=>x.geometry===m.geometry&&!x.parent); if(g) m.add(g); } }); }
  const op=.26+.08*Math.sin(S.t*2.2); for(const g of AURA.meshes) g.material.uniforms.op.value=op; }
// ---- the same power, on the ground: every defense the hero has placed carries a rune ring in the set's colour while
// the full set is worn — on/off follows the set, so unequipping a piece (or selling the tower) clears it right away
const DEF_RING_GEO=new THREE.RingGeometry(.7,.92,28);
function defRingUpdate(){ const pk=fullPack(); const col=pk?pk.col:null;
  for(const d of defs){ if(col){ if(!d.setRing||d.setRingCol!==col){ if(d.setRing){ d.mdl.remove(d.setRing); d.setRing.material.dispose(); } const rad=Math.max(1.15,(DEFS[d.kind].top||1.5)*.75); const m=new THREE.Mesh(DEF_RING_GEO,fxMat(col,.5)); m.rotation.x=-PI/2; m.position.y=.07; m.scale.set(rad,rad,1); m.userData.noOL=true; d.mdl.add(m); d.setRing=m; d.setRingCol=col; }
      d.setRing.material.opacity=.35+.2*Math.sin(S.t*2.4+d.x+d.z); }
    else if(d.setRing){ d.mdl.remove(d.setRing); d.setRing.material.dispose(); d.setRing=null; d.setRingCol=null; } } }
{ const prev=Meta.update; Meta.update=dt=>{ prev(dt); auraUpdate(); defRingUpdate(); }; }
Meta.packs={of:packOf,list:()=>Object.keys(PACKS),get:n=>PACKS[n],add:addSet,art:itemArt,artHtml,aura:()=>({on:AURA.meshes.length>0,col:AURA.col,meshes:AURA.meshes.length,attached:AURA.meshes.filter(g=>g.parent).length}),defRings:()=>defs.filter(d=>d.setRing).length};
window.__void={NAME:'of the Void',isVoid:it=>packOf(it)===PACKS['of the Void'],chance:w=>PACKS['of the Void'].chance(w===undefined?effWave():w),lvl:()=>{ const a=Meta.sets.active().find(x=>x.name==='of the Void'); return a?a.tier:0; },make:it=>makeSet(it,PACKS['of the Void']),fx:()=>FX.length,rift};
window.__packs=Meta.packs;
window.__forest={NAME:'of the Forest',isForest:it=>packOf(it)===PACKS['of the Forest'],owned:forestOwned,pity:forestPity,boon:famBoon,guarantee:forestGuarantee,BY_WAVE:FOREST_BY_WAVE,locker:lockerRead,lockerPending,offer:offerLastPiece,collect:collectLastPiece,LOCKER_KEY,chance:w=>PACKS['of the Forest'].chance(w===undefined?effWave():w),lvl:()=>{ const a=Meta.sets.active().find(x=>x.name==='of the Forest'); return a?a.tier:0; },make:it=>makeSet(it,PACKS['of the Forest']),HINT_KEY};
})();
