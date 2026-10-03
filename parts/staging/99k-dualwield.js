// ===== THE DUAL-WIELD RINGS (build 509 prep). Matt approved them 2026-10-03: "build it ill do the art later". Four named charms (97-mythics.js NAMED), ONE PER HERO, each working only for its own hero:
//     Twotimer        the Knight   -- two swords          Toil-n-Trouble   the Witch   -- two staffs
//     Tootsie         the Fighter  -- two battle staffs   Bifurcation      the Ranger (hero id 'troll') -- two bows
// Built on the two-pet rings (97h-tworings.js):
//  * DROPS: every wave held, from the first, each has a 10% chance to drop by the hero -- unless you already have it (on you, in the bag, the armory or on another hero, 97h owned()) -- with Matt's
//    ring sound (named-ring-two.mp3) in place of the named-mythic fanfare (the beam still rises).
//  * THE 2ND WEAPON SLOT (gear.weapon2) is open while the hero wears THEIR OWN ring. Its stats count in full (heroStat), it is NOT a set piece (the sets count the five slots, 92-sets.js). The Knight takes only a
//    sword-type weapon as his 2nd -- never a polearm (look 'polearm', or halberd / spear / polearm in its name, or a polearm model: two-handed) -- and while his MAIN weapon is a polearm his 2nd sleeps (💤:
//    no stats, not in his hand), as the 2nd pet sleeps without its ring. The Witch, Fighter and Ranger take any weapon; their hand decides the model, as it does for the main weapon.
//    The ring off: the 2nd weapon goes back to the bag by itself (it waits asleep only if the bag is full).
//    EACH HERO KEEPS THEIR OWN (Matt's rule for worn gear, 71-herogear.js: "If it's equipped it belongs to that hero"): switch heroes and the Knight's 2nd sword stays filed under the Knight (dd_heroWeapon2),
//    back in his hand when you switch back. It is also saved in ddGear with the rest of what the current hero wears.
//  * THE LOOK: the 2nd weapon rides in the hero's FREE hand -- the Knight's LEFT (his sword is in his right), the RIGHT hand of the Witch, Fighter and Ranger (their staff or bow is in their left) -- on a mount
//    made by mirroring the main hand's mount across the body (prep, read off the rig at rest the moment it loads), so the grip is the main grip's mirror image. Real set models and the held glow (86w) work there too.
//  * ATTACKS ALTERNATE HANDS: the main hand, then the 2nd, and so on -- a visual alternation at the same rate, each hit the damage the game computes (which already counts the 2nd weapon's stats). A 2nd-hand
//    swing plays the hero's attack clip MIRRORED (mirror(): every bone takes its mirror twin's pose, reflected across the body), so the Knight's left sword slashes; the Witch and Fighter cast from the right
//    staff (the bolt leaves its head, 84-aim levels it); the Ranger turns the other way and looses from the right bow (83-bow draws it).
//  * UI, as the 2nd pet's: the bag's "2ND WEAPON" card under the equipped row, its panel (the forge, Take off), "Equip as 2nd" on a spare weapon; the Tab sheet's 2nd-weapon plaque (68-paperdoll.js); the ring
//    cards' chips (96f): "🗡️🗡️ 2 SWORDS" and the hero whose ring it is.
//  * CO-OP: partners see the 2nd weapon in the puppet's free hand and its swings mirrored (99-network.js lookOf w2/dh, 98-party.js); a guest's 2nd-weapon stats reach the host in its own heroStat/heroDmg
//    numbers (the input's stat block, each swing's and shot's dmg), the way all of its gear does.
// ART -- Matt's files, when he makes them (the stand-ins step aside by themselves):
//    floor stand (3D):  parts/assets/named-twotimer.glb, named-toil_n_trouble.glb, named-tootsie.glb, named-bifurcation.glb   (93c-weaponstand.js NAMED_REAL finds each by its build stamp;
//                       until then ringModel() below builds a stand-in: a gold band, a gem in the hero's colour, the hero's two weapons crossed above it)
//    card thumbnail:    hideout-wip branch public/assets/hideout/items/named/twotimer.jpg, toil_n_trouble.jpg, tootsie.jpg, bifurcation.jpg   (node sync-hideout.mjs, then delete the four nulls in
//                       87-mythicdrops.js NAMED_PIC; until then the card shows LOOK[hero].card)
// Test hook: window.__dualwield.
(function(){
'use strict';
const RING_HERO={ twotimer:'knight', toil_n_trouble:'witch', tootsie:'fighter', bifurcation:'troll' };
const RING_OF={}; for(const k in RING_HERO) RING_OF[RING_HERO[k]]=k;
const RINGS=Object.keys(RING_HERO), DROP=.10, STORE_KEY='dd_heroWeapon2';
// per hero: the ring card's picture, the 2nd weapon's icon and word, the chips, the hero's colour (the ring's column on the floor, the stand-in's gem)
const LOOK={
  knight: { card:'⚔️', ic:'🗡️', word:'sword', two:'2 SWORDS', who:'🛡️ KNIGHT', col:0x8ab8ff, css:'#8ab8ff', mini:'sword' },
  witch:  { card:'🧙', ic:'🪄', word:'staff', two:'2 STAFFS', who:'🧙 WITCH',  col:0xc070ff, css:'#c070ff', mini:'staff' },
  fighter:{ card:'🥢', ic:'🪄', word:'staff', two:'2 STAFFS', who:'🥋 FIGHTER', col:0xffa040, css:'#ffa040', mini:'staff' },
  troll:  { card:'🏹', ic:'🏹', word:'bow',   two:'2 BOWS',   who:'🌲 RANGER', col:0x6ad86a, css:'#6ad86a', mini:'bow' } };
const cnt={ drops:0, returned:0, equipped:0, swings:{ main:0, off:0 }, mirrors:0 };
const heroId=()=>{ try{ return heroPick.id; }catch(e){ return window.__heroes?window.__heroes.pick():'knight'; } };
const ringHero=it=>it&&it.named?RING_HERO[it.named]||null:null;
const kind=()=>LOOK[heroId()]||LOOK.knight;
function ringMine(){ const c=gear.charm; return !!(c&&c.named&&RING_HERO[c.named]===heroId()); }
// ---- a polearm takes both hands (the Knight's rule). Cached per item: heroStat asks every frame, many times
const POLE=new WeakMap(), POLE_MODEL=/^(polearm-|named-last_lantern$|named-sixseven$)/;
function isPolearm(it){ if(!it||typeof it!=='object') return false; let v=POLE.get(it); if(v!==undefined) return v;
  v=it.look==='polearm'||/\b(polearm|halberd|spear|scythe|glaive)\b/i.test(it.name||'')||it.named==='sixseven'||it.named==='last_lantern';
  if(!v) try{ v=POLE_MODEL.test(window.__weapons.swordFor(it)||''); }catch(e){ v=false; }
  POLE.set(it,v); return v; }
const mainBlocks=()=>heroId()==='knight'&&isPolearm(gear.weapon);   // a Knight with a polearm in his hands has no hand free
function fits(it){ return !!(it&&it.slot==='weapon'&&it.stats&&!(heroId()==='knight'&&isPolearm(it))); }
function dual(){ const w=gear.weapon2; return !!(w&&w.stats&&ringMine()&&!mainBlocks()); }
const asleep=()=>!!(gear.weapon2&&!dual());
function canEquip2(it){ return !!(it&&ringMine()&&!mainBlocks()&&fits(it)&&(!Meta.canWear||Meta.canWear(it))); }
// ---- its stats count in full while the slot is open (never toward a set: the sets read the five slots)
{ const prev=heroStat; heroStat=function(k){ const v=prev.apply(this,arguments); const w=gear.weapon2; return (w&&w.stats&&w.stats[k]&&dual())?v+w.stats[k]:v; }; }
// ---- each hero's own 2nd weapon: dd_heroWeapon2 = {heroId:item}, written on every save of the worn set; the current hero's also rides ddGear (gear.weapon2)
let STORE={}; try{ const o=JSON.parse(localStorage.getItem(STORE_KEY)); if(o&&typeof o==='object'&&!Array.isArray(o)) STORE=o; }catch(e){}
const okItem=it=>!!(it&&typeof it==='object'&&it.id&&it.slot==='weapon'&&it.stats&&(typeof validItem!=='function'||validItem(it)));
function persist(){ const h=heroId(); if(gear.weapon2) STORE[h]=gear.weapon2; else delete STORE[h]; try{ localStorage.setItem(STORE_KEY,JSON.stringify(STORE)); }catch(e){} }
{ for(const k of Object.keys(STORE)) if(!okItem(STORE[k])) delete STORE[k];
  let w=STORE[heroId()]; if(!okItem(w)){ try{ const g=JSON.parse(localStorage.getItem('ddGear')); if(g&&okItem(g.weapon2)) w=g.weapon2; }catch(e){} }
  gear.weapon2=okItem(w)?w:null; if(gear.weapon2&&typeof fixItem==='function') try{ fixItem(gear.weapon2); }catch(e){}
  // exactly once: a 2nd weapon that is also in the bag, the armory or worn by a hero is a stray copy -- dropped (the other one is the real piece)
  const seen=new Set(); const see=it=>{ if(it&&it.id) seen.add(it.id); }; Meta.bag().forEach(see); try{ const a=JSON.parse(localStorage.getItem('ddArmory')); if(Array.isArray(a)) a.forEach(see); }catch(e){}
  try{ (Meta.heroGear&&Meta.heroGear.allWorn?Meta.heroGear.allWorn():SLOTS.map(s=>gear[s])).forEach(see); }catch(e){}
  if(gear.weapon2&&seen.has(gear.weapon2.id)) gear.weapon2=null; else if(gear.weapon2) seen.add(gear.weapon2.id);
  for(const k of Object.keys(STORE)){ if(k===heroId()) continue; const it=STORE[k]; if(seen.has(it.id)) delete STORE[k]; else seen.add(it.id); }
  persist(); }
{ const prev=saveGear; saveGear=function(){ const r=prev.apply(this,arguments); persist(); return r; }; }
{ const prev=resetGear; resetGear=function(){ STORE={}; const r=prev.apply(this,arguments); persist(); return r; }; }   // a full reset empties every hero's
// the switch (installHero: every picker's one door, 71-herogear.js): the leaving hero's 2nd weapon is filed under them, the arriving hero's own comes back to `gear`
{ const prev=installHero; installHero=function(h){ const from=heroId(), go=!!(h&&h.id&&h.id!==from);
    if(go){ if(gear.weapon2) STORE[from]=gear.weapon2; else delete STORE[from]; const nx=STORE[h.id]; gear.weapon2=okItem(nx)?nx:null; HAND.cur='main'; HAND.last='off'; }
    const r=prev.apply(this,arguments); if(go){ persist(); try{ applyGear(); }catch(e){} } return r; }; }
if(typeof applyGear==='function') try{ applyGear(); }catch(e){}
// ---- equip / take off the 2nd
function equip2(id){ const bag=Meta.bag(), i=bag.findIndex(b=>b.id===id); if(i<0) return false; const it=bag[i];
  if(!canEquip2(it)){ if(it.slot==='weapon'&&heroId()==='knight'&&(isPolearm(it)||mainBlocks())) toast('🔱 = ✋✋'); return false; }   // a polearm takes both hands
  bag.splice(i,1); const old=gear.weapon2; gear.weapon2=it; if(old) bag.push(old); cnt.equipped++;
  saveGear(); if(Meta.save) Meta.save(); try{ applyGear(); }catch(e){} return true; }
function unequip2(){ const w=gear.weapon2; if(!w) return false; if(Meta.bagFull&&Meta.bagFull()){ toast('Bag is full'); return false; } gear.weapon2=null; Meta.bag().push(w); saveGear(); if(Meta.save) Meta.save(); try{ applyGear(); }catch(e){} return true; }
// the ring off (or another hero's ring on): the 2nd weapon back to the bag by itself
function giveBack(){ const w=gear.weapon2; if(!w||ringMine()) return false; if(!(Meta.giveItem&&Meta.giveItem(w))) return false; gear.weapon2=null; cnt.returned++; saveGear(); try{ applyGear(); }catch(e){} if(Meta.save) Meta.save(); toast(kind().ic+' ➜ 🎒'); return true; }
for(const f of ['equip','unequip']){ const prev=Meta[f]; if(typeof prev==='function') Meta[f]=function(){ const r=prev.apply(this,arguments); if(r) giveBack(); return r; }; }   // at once, not a frame later: the bag on screen shows it there
// ---- the free hand: its mount, mirrored from the main hand's at rest, and the mirrored attack ---------------------------------------------------------------------------------------------------------------
// prep(root,atRest): called the moment a hero rig loads (the local hero: setHeroGLB below; a partner's puppet: 98-party.js loadPuppetGLB), before it has moved -- a later call only returns what was found then
function prep(root,atRest){ if(!root) return null; const ud=root.userData; if(ud.dw!==undefined||!atRest) return ud.dw||null; ud.dw=null;
  let mount=null; root.traverse(o=>{ if(!mount&&/^(weapon|staff|bow)Mount_\d+/.test(o.name)) mount=o; }); if(!mount||!mount.parent) return null;
  const hand=mount.parent, side=/Left/.test(hand.name)?'Left':/Right/.test(hand.name)?'Right':null; if(!side) return null;
  const want=hand.name.replace(side,side==='Left'?'Right':'Left'); let other=null; root.traverse(o=>{ if(!other&&o.name===want) other=o; }); if(!other) return null;
  root.updateMatrixWorld(true); const rinv=new THREE.Matrix4().copy(root.matrixWorld).invert(), S=new THREE.Matrix4().makeScale(-1,1,1);   // the rig's own frame: +x is across the body (the root carries no turn)
  const M4=new THREE.Matrix4().multiplyMatrices(rinv,mount.matrixWorld), H4=new THREE.Matrix4().multiplyMatrices(rinv,other.matrixWorld);
  const L4=new THREE.Matrix4().copy(H4).invert().multiply(new THREE.Matrix4().multiplyMatrices(S,M4).multiply(S));   // the main mount reflected across the body (S M S keeps it a true turn), seen from the free hand
  const mk=/^weapon/.test(mount.name)?'weapon':/^staff/.test(mount.name)?'staff':'bow', node=new THREE.Object3D(); node.name=mk+'Off_'+(mount.name.split('_')[1]||'90'); node.userData.offHand=true;   // attachWeapon reads the kind and the length from the name
  L4.decompose(node.position,node.quaternion,node.scale); other.add(node);
  ud.dw={ node, kind:mk, main:hand.name, off:other.name, rest:restOf(root,rinv), mirrors:new Map() }; return ud.dw; }
// every bone's pose at rest, in the rig's own frame: its parent, its turn and place, its frame, its mirror twin (Left <-> Right; a middle bone is its own)
function restOf(root,rinv){ const bones=[]; root.traverse(o=>{ if(o.isBone) bones.push(o); }); const by=new Map(bones.map((b,i)=>[b.name,i])), idx=new Map(bones.map((b,i)=>[b,i])), q=new THREE.Quaternion(), p=new THREE.Vector3(), s=new THREE.Vector3(), m=new THREE.Matrix4();
  const R={ names:bones.map(b=>b.name), by, parent:[], base:[], restL:[], restP:[], restG:[], restGi:[], partner:[] };
  bones.forEach(b=>{ const pi=b.parent&&idx.has(b.parent)?idx.get(b.parent):-1; R.parent.push(pi); if(pi<0){ m.multiplyMatrices(rinv,b.parent.matrixWorld); m.decompose(p,q,s); R.base.push(q.clone()); } else R.base.push(null); R.restL.push(b.quaternion.clone()); R.restP.push(b.position.clone()); });
  bones.forEach((b,i)=>{ const pi=R.parent[i], g=(pi>=0?R.restG[pi]:R.base[i]).clone().multiply(R.restL[i]); R.restG.push(g); R.restGi.push(g.clone().invert()); });
  bones.forEach((b,i)=>{ const t=/Left|Right/.exec(b.name); let j=i; if(t){ const tw=b.name.replace(t[0],t[0]==='Left'?'Right':'Left'); if(by.has(tw)) j=by.get(tw); } R.partner.push(j); });
  return R; }
// a clip mirrored across the body: at each of its key times, every bone's turn from rest (in the rig's frame) is its twin's, reflected (x stays, y and z flip), then put back in the bone's own frame
function mirror(root,clip){ const dw=root&&root.userData.dw; if(!dw||!clip) return null; if(dw.mirrors.has(clip)) return dw.mirrors.get(clip); let out=null; try{ out=buildMirror(dw.rest,clip); }catch(e){ console.warn('dual-wield mirror',e); } dw.mirrors.set(clip,out); if(out) cnt.mirrors++; return out; }
function buildMirror(R,clip){ const n=R.names.length, rot=new Array(n).fill(null), pos=new Array(n).fill(null), ts=new Set();
  for(const tr of clip.tracks){ let pn; try{ pn=THREE.PropertyBinding.parseTrackName(tr.name); }catch(e){ continue; } const i=R.by.get(pn.nodeName); if(i===undefined) continue;
    if(pn.propertyName==='quaternion') rot[i]=tr.createInterpolant(); else if(pn.propertyName==='position') pos[i]=tr.createInterpolant(); else continue; for(const t of tr.times) ts.add(t); }
  const T=[...ts].sort((a,b)=>a-b); if(!T.length) return null;
  const G=R.names.map(()=>new THREE.Quaternion()), Gm=R.names.map(()=>new THREE.Quaternion()), P=R.names.map(()=>new THREE.Vector3()), L=new THREE.Quaternion(), D=new THREE.Quaternion(), X=new THREE.Quaternion(), V=new THREE.Vector3();
  const wantQ=R.names.map((_,i)=>!!(rot[i]||rot[R.partner[i]])), wantP=R.names.map((_,i)=>!!(pos[i]||pos[R.partner[i]])), outQ=R.names.map(()=>[]), outP=R.names.map(()=>[]);
  for(const t of T){
    for(let i=0;i<n;i++){ if(rot[i]){ const v=rot[i].evaluate(t); L.set(v[0],v[1],v[2],v[3]).normalize(); } else L.copy(R.restL[i]); const pi=R.parent[i]; G[i].copy(pi>=0?G[pi]:R.base[i]).multiply(L);
      if(pos[i]){ const v=pos[i].evaluate(t); P[i].set(v[0],v[1],v[2]); } else P[i].copy(R.restP[i]); }
    for(let i=0;i<n;i++){ const j=R.partner[i]; D.copy(G[j]).multiply(R.restGi[j]); D.y=-D.y; D.z=-D.z; Gm[i].copy(D).multiply(R.restG[i]); }
    for(let i=0;i<n;i++){ const pi=R.parent[i]; X.copy(pi>=0?Gm[pi]:R.base[i]).invert();
      if(wantQ[i]){ D.copy(X).multiply(Gm[i]); outQ[i].push(D.x,D.y,D.z,D.w); }
      if(wantP[i]){ const j=R.partner[i], pj=R.parent[j]; V.copy(P[j]).sub(R.restP[j]).applyQuaternion(pj>=0?G[pj]:R.base[j]); V.x=-V.x; V.applyQuaternion(X).add(R.restP[i]); outP[i].push(V.x,V.y,V.z); } } }
  const tracks=[]; for(let i=0;i<n;i++){ if(outQ[i].length) tracks.push(new THREE.QuaternionKeyframeTrack(R.names[i]+'.quaternion',T.slice(),outQ[i])); if(outP[i].length) tracks.push(new THREE.VectorKeyframeTrack(R.names[i]+'.position',T.slice(),outP[i])); }
  return tracks.length?new THREE.AnimationClip(clip.name+'_mirror',clip.duration,tracks):null; }
{ const prev=setHeroGLB; setHeroGLB=function(){ const r=prev.apply(this,arguments); try{ if(GLBH&&GLBH.root) prep(GLBH.root,true); }catch(e){ console.warn('dual-wield prep',e); } OFF.key=''; return r; }; }
// ---- the 2nd weapon in the free hand, kept in step with gear.weapon2 like the main one (80-weapons.js weaponsUpdate)
const OFF={ obj:null, key:'', glow:null };
function offNode(){ if(!(useGLB&&GLBH&&GLBH.root)) return null; const dw=GLBH.root.userData.dw; return dw?dw.node:null; }
function unmountOff(){ if(OFF.obj&&OFF.obj.parent) OFF.obj.parent.remove(OFF.obj); OFF.obj=null; OFF.glow=null; }
// a 2nd STAFF stands upright in its fist, leaning a little out from the body, eased there (the free hand's own rest pose turns its mirrored mount every which way: the Witch's right hand hangs differently
// from the left one that holds her staff). The bolt's turn is 84-aim's pointStaff, which starts from this hold. Also a partner's puppet's (98-party.js)
const _pq=new THREE.Quaternion(), _qa=new THREE.Quaternion(), _hp=new THREE.Vector3(), _out=new THREE.Vector3(), _d=new THREE.Vector3(), _g=new THREE.Vector3(), _Y=new THREE.Vector3(0,1,0);
function holdStaff(o,cx,cz,dt,rate){ const sd=o&&o.userData.sword; if(!sd||!o.parent) return; o.parent.getWorldQuaternion(_pq); o.parent.getWorldPosition(_hp); _out.set(_hp.x-cx,0,_hp.z-cz); const L=_out.length(); if(L>1e-4) _out.multiplyScalar(1/L);
  _d.set(0,1,0).addScaledVector(_out,.16).normalize(); _qa.setFromUnitVectors(_Y,_d).premultiply(_pq.invert()); o.quaternion.slerp(_qa,Math.min(1,1-Math.exp(-(rate||12)*dt))); _g.set(0,sd.gripY*sd.scale,0).applyQuaternion(o.quaternion); o.position.copy(_g).negate(); }
function offModel(it,hm){ const W=window.__weapons; return hm.staff?(window.__staff?window.__staff.staffFor(it):'staff-hazel'):hm.bow?(window.__bow?window.__bow.bowFor(it):'bow-ash'):W.swordFor(it); }
function offUpdate(dt){ const W=window.__weapons, node=offNode(), hm=W&&W.mount&&W.mount();
  if(!node||!hm){ if(OFF.obj) unmountOff(); OFF.key=''; return; } if(OFF.obj&&OFF.obj.parent!==node) unmountOff();
  const it=dual()?gear.weapon2:null; if(!it){ if(OFF.obj) unmountOff(); OFF.key=''; return; }
  const name=offModel(it,hm), tier=W.swordTier(it), pk=Meta.packs&&Meta.packs.of(it), set=pk&&pk.emissive?pk.name:null, key=name+'|'+tier+'|'+GLBH.label+(set?'|set:'+set:'')+'|'+it.id;
  if(key!==OFF.key){ OFF.key=key; W.attach(node,name,tier,set,obj=>{ if(OFF.key!==key||obj.parent!==node){ if(obj.parent) obj.parent.remove(obj); return; } if(OFF.obj&&OFF.obj!==obj&&OFF.obj.parent) OFF.obj.parent.remove(OFF.obj);
      OFF.obj=obj; obj.userData.offHand=true; OFF.fresh=true; OFF.glow=window.__heldglow&&window.__heldglow.dress?window.__heldglow.dress(obj):null; }); }
  const o=OFF.obj; if(o&&o.parent){ if(OFF.glow&&window.__heldglow) window.__heldglow.tick(OFF.glow,dt);   // a real set weapon glows in this hand too (86w)
    if(/^staff-/.test(o.name)){ if(window.__staff&&window.__staff.animate) window.__staff.animate(o,dt); if(!offSwing()) holdStaff(o,hero.x,hero.z,OFF.fresh?1:dt);   // its crystal turns; held upright at the hero's side until it casts (84-aim levels it then). A bow's moving bits are 83-bow.js's
      else { const m=W.mounted(); if(m&&m!==o&&/^staff-/.test(m.name)) holdStaff(m,hero.x,hero.z,dt,30); } }   // while the 2nd staff casts, the first is held upright in the other hand (the mirrored cast would swing it about)
    OFF.fresh=false;
    if(o.userData.setw&&window.__setweapons&&window.__setweapons.pulse) window.__setweapons.pulse(o); } }
// ---- which hand swings: decided as a swing starts (alternating while two weapons are in hand); the 2nd hand's swing plays the attack mirrored by standing it in for the attack action, so everything that
// reads GLBH.actions.attack (game.js swing, 84-aim's hold at the draw) drives the right clip
const HAND={ cur:'main', last:'off' };
function atk(){ if(!(useGLB&&GLBH&&GLBH.mixer&&GLBH.map&&GLBH.map.attack)) return null; if(GLBH.dwA) return GLBH.dwA; const a0=GLBH.actions.attack; if(!a0) return null;
  const mc=GLBH.root&&GLBH.root.userData.dw?mirror(GLBH.root,GLBH.map.attack):null; let m=null; if(mc){ m=GLBH.mixer.clipAction(mc); m.setLoop(THREE.LoopOnce,1); m.clampWhenFinished=true; } return GLBH.dwA={ a0, m }; }
function offSwing(){ return HAND.cur==='off'&&hero.swingT>=0&&!(hero.dead>0)&&!!(OFF.obj&&OFF.obj.parent); }
{ const prev=swing; swing=function(){ const before=hero.swingT, two=dual()&&!!(OFF.obj&&OFF.obj.parent), next=two?(HAND.last==='main'?'off':'main'):'main', A=two?atk():(GLBH&&GLBH.dwA)||null;
    if(A&&A.a0) GLBH.actions.attack=(next==='off'&&A.m)?A.m:A.a0;
    const r=prev.apply(this,arguments);
    if(before<0&&hero.swingT===0){ HAND.cur=next; HAND.last=two?next:'off'; if(two) cnt.swings[next]++; }
    else if(A&&A.a0) GLBH.actions.attack=(HAND.cur==='off'&&A.m&&hero.swingT>=0)?A.m:A.a0;   // no new swing: the one under way keeps its clip
    return r; }; }
function attackSync(){ const A=GLBH&&GLBH.dwA; if(A&&A.a0&&hero.swingT<0&&GLBH.actions.attack!==A.a0) GLBH.actions.attack=A.a0; if(hero.swingT<0) HAND.cur='main'; }
// ---- the blow itself: for a 2nd-hand swing the weapon "in hand" is the 2nd one while the hit runs, so the bolt leaves the right staff's head (82-staff.js), the arrow the right bow's grip (83-bow.js), a co-op
// guest's shot message names the right kind (99-network.js) -- this wrap is the outermost (the last file), so every hitCone layer sees it
const WP=window.__weapons; let OVR=false; { const m0=WP.mounted; WP.mounted=function(){ return (OVR&&OFF.obj&&OFF.obj.parent)?OFF.obj:m0.apply(this,arguments); }; }
const LOG=[], _v=new THREE.Vector3();
function note(off){ const o=off?OFF.obj:WP.mounted(); const e={ hand:off?'off':'main', name:o?o.name:null, side:0, at:null, tip:null, shot:null, dmg:Math.round(heroDmg()*10)/10 };
  if(o&&o.parent){ o.updateWorldMatrix(true,false); o.parent.getWorldPosition(_v); const yaw=(GLBH&&GLBH.wrap)?GLBH.wrap.rotation.y:hero.yaw, rx=-Math.cos(yaw), rz=Math.sin(yaw);   // the body's right (it faces +z at yaw 0)
    e.side=Math.sign((_v.x-hero.x)*rx+(_v.z-hero.z)*rz); e.at=[+_v.x.toFixed(2),+_v.y.toFixed(2),+_v.z.toFixed(2)]; e.bone=o.parent.parent?o.parent.parent.name:null;
    const sd=o.userData.sword; if(sd){ _v.set(0,sd.tipY,0); o.localToWorld(_v); e.tip=[+_v.x.toFixed(2),+_v.y.toFixed(2),+_v.z.toFixed(2)]; e.tipSide=Math.sign((_v.x-hero.x)*rx+(_v.z-hero.z)*rz); } }
  LOG.push(e); if(LOG.length>40) LOG.shift(); return e; }
// A bow's power rides its kind (Subterfuge's five-arrow wedge, 86i): a named bow's power stays with the MAIN hand, the way a named sword's does (97-mythics has() reads the five slots). If either bow carries
// one, the 2nd bow's shot leaves from the 2nd bow but is the main bow's arrow -- Subterfuge in the main hand keeps every wedge, and a Subterfuge as the 2nd bow is its stats, not its wedge
const bowPower=k=>{ const B=window.__bow, K=B&&B.info&&k?B.info(k):null; return !!(K&&(K.wedge||K.onHit||K.arrow)); };
{ const prev=hitCone; hitCone=function(){ const off=offSwing(), b0=window.__staff?window.__staff.bolts():0, a0=window.__bow?window.__bow.arrows():0, o=OFF.obj, m=WP.mounted();
    const swap=off&&o&&m&&/^bow-/.test(o.name)&&/^bow-/.test(m.name)&&o.userData.kind!==m.userData.kind&&(bowPower(o.userData.kind)||bowPower(m.userData.kind)), k0=swap?o.userData.kind:null;
    OVR=off; if(swap) o.userData.kind=m.userData.kind; let r; try{ r=prev.apply(this,arguments); } finally { OVR=false; if(swap) o.userData.kind=k0; }
    if(hero.hitDone&&(dual()||off)){ const e=note(off); try{ const S2=window.__staff, B=window.__bow; if(S2&&S2.bolts()>b0){ const l=S2.boltList(); const b=l[l.length-1]; e.shot={ kind:'bolt', x:b.x, y:b.y, z:b.z, dmg:b.dmg, n:S2.bolts()-b0 }; } else if(B&&B.arrows()>a0){ const l=B.flying(); const b=l[l.length-1]; e.shot={ kind:'arrow', x:b.x, y:b.y, z:b.z, dmg:b.dmg, n:B.arrows()-a0, k:b.kind }; }
        if(e.shot){ const yaw=(GLBH&&GLBH.wrap)?GLBH.wrap.rotation.y:hero.yaw; e.shotSide=Math.sign((e.shot.x-hero.x)*-Math.cos(yaw)+(e.shot.z-hero.z)*Math.sin(yaw)); } }catch(er){} }   // the hold (84-aim) puts hitDone back: no blow yet
    return r; }; }
// ---- every frame
let artDone=false; function fillArt(){ if(artDone) return; const A=window.__mythicDrops&&window.__mythicDrops.art; if(!A) return; artDone=true; const all=[gear.charm].concat(Meta.bag(),Meta.armory?Meta.armory():[]); try{ if(Meta.heroGear&&Meta.heroGear.allWorn) all.push(...Meta.heroGear.allWorn()); }catch(e){}
  for(const it of all){ if(it&&ringHero(it)&&!it.art){ const p=A(it); if(p) it.art=p; } } }   // a ring dropped before its picture existed gets it once the picture is in (87-mythicdrops.js NAMED_PIC)
{ const prev=Meta.update; Meta.update=dt=>{ prev(dt); fillArt(); giveBack(); offUpdate(dt); attackSync(); }; }
// ---- the drops: 10% each per wave held, from the first, unless owned; Matt's ring sound
function owned(id){ const R=window.__tworings; if(R&&R.owned) return R.owned(id); const is=it=>it&&it.named===id; return SLOTS.some(s=>is(gear[s]))||Meta.bag().some(is)||!!(Meta.armory&&Meta.armory().some(is)); }
function dropRing(id){ const M=window.__mythic; if(!M||!M.normalize||!RING_HERO[id]) return null; const it=M.normalize({ tier:'named', named:id, lvl:Math.max(1,typeof effWave==='function'?effWave():1) }); if(!it) return null;
  const a=Math.random()*TAU, x=hero.x+Math.cos(a)*3, z=hero.z+Math.sin(a)*3; const f=SFX.fancy; SFX.fancy=()=>{}; try{ dropLoot(it,x,z,true); }finally{ SFX.fancy=f; } const R=window.__tworings; if(R&&R.sound) R.sound();
  floatText(x,(hero.y||0)+2.6,z,'💍 '+it.name.toUpperCase()+' 💍',LOOK[RING_HERO[id]].css); cnt.drops++; return it; }
{ const prev=Meta.onWaveHeld; Meta.onWaveHeld=function(){ const r=prev.apply(this,arguments); if(!TUTORIAL){ for(const id of RINGS){ if(!owned(id)&&LR()<DROP) dropRing(id); } } return r; }; }
// ---- the pictures: a ring's card picture (until Matt's thumbnail) and its chips
{ const prev=slotIcon; slotIcon=function(it){ const h=ringHero(it); return h?LOOK[h].card:prev.apply(this,arguments); }; }
const HERO_WORD={ knight:'Knight', witch:'Witch', fighter:'Fighter', troll:'Ranger' };
function chip(it){ const h=ringHero(it); if(!h) return ''; const K=LOOK[h];
  return '<span class="tvp-c two" title="Worn by the '+HERO_WORD[h]+', a SECOND weapon slot opens: two '+K.word+'s, one in each hand, the attacks taking turns">'+K.ic+K.ic+' '+K.two+'</span>'+
    '<span class="tvp-c dw-who" style="border-color:'+K.css+';color:'+K.css+'" title="Only the '+HERO_WORD[h]+' can use it">'+K.who+'</span>'; }
const colours=named=>{ const h=RING_HERO[named]; return h?[LOOK[h].col,0xffffff]:null; };
// ---- the stand-in ring for the floor (until Matt's 3D art, 93c NAMED_REAL standIn): an upright gold band, a gem in the hero's colour, the hero's two weapons crossed above it
function miniWeapon(k,col){ const w=new THREE.Group(), gold=mat(0xe0b040), dark=mat(0x3a2716), gem=()=>{ const g=new THREE.Mesh(new THREE.OctahedronGeometry(.05,0),basic(col)); g.userData.noOL=true; return g; };
  if(k==='sword'){ w.add(M(G.box(.06,.5,.016),mat(0xd8dde8),0,.36,0)); const tip=M(G.cone(.03,.08,4),mat(0xd8dde8),0,.65,0); tip.rotation.y=PI/4; w.add(tip); w.add(M(G.box(.2,.035,.05),gold,0,.1,0)); w.add(M(G.cyl(.02,.02,.13,6),dark,0,.02,0)); w.add(M(G.sph(.03,6,5),gold,0,-.06,0)); }
  else if(k==='staff'){ w.add(M(G.cyl(.018,.024,.7,6),mat(0x6b4a2a),0,.3,0)); w.add(M(G.cyl(.03,.03,.04,8),gold,0,.62,0)); const g=gem(); g.scale.set(1,1.7,1); g.position.y=.71; w.add(g); }
  else { const arc=new THREE.Mesh(new THREE.TorusGeometry(.3,.016,6,18,PI*.95),mat(0x7a5a3a)); arc.rotation.z=-PI*.475; arc.position.set(-.18,.33,0); w.add(arc); w.add(M(G.cyl(.005,.005,.6,4),mat(0xeae0c8),-.19,.33,0)); w.add(M(G.box(.035,.09,.035),dark,.12,.33,0)); }
  return w; }
function ringModel(id){ const h=RING_HERO[id]||'knight', K=LOOK[h], g=new THREE.Group(); g.name='dwRing-'+id; const gold=mat(0xe0b040);
  const band=new THREE.Mesh(new THREE.TorusGeometry(.3,.065,10,36),gold); band.position.y=.37; g.add(band);   // upright: its face turns as the stand spins
  g.add(M(G.cyl(.075,.11,.07,10),gold,0,.7,0)); const gem=new THREE.Mesh(new THREE.OctahedronGeometry(.14,0),basic(K.col)); gem.scale.set(1,1.3,1); gem.position.y=.84; gem.userData.noOL=true; g.add(gem);
  const gl=glow(K.col,.8,.8); gl.position.y=.84; g.add(gl);
  for(const s of [-1,1]){ const w=miniWeapon(K.mini,K.col); w.scale.setScalar(.8); w.position.set(s*.2,.9,-.1); w.rotation.z=s*.55; g.add(w); }   // the two, crossed above and behind the gem
  return g; }
// ---- the bag (the tavern): the 2nd weapon's card under the equipped row; its panel (the forge, Take off); "Equip as 2nd" on a spare weapon that fits
{ const st=document.createElement('style'); st.textContent='.tv-bag2.cols .tv-eq>#tv-wpn2{grid-column:1/-1}.tvp-c.dw-who{font-weight:800;background:#16121e!important}'; document.head.appendChild(st); }
function bagCard(){ const on=ringMine(), w=gear.weapon2, K=kind();
  if(!w&&!on){ const r=RING_OF[heroId()], N=window.__mythic&&window.__mythic.NAMED; return r&&owned(r)?'<div class="tv-card" style="opacity:.45"><span class="ic">'+K.ic+K.ic+'</span><span class="nm">🔒 2nd '+K.word+' · wear 💍 '+(N&&N[r]?N[r].name:r)+'</span></div>':''; }
  const head='<div class="tv-sub" style="margin-top:4px">2ND WEAPON '+K.ic+K.ic+(w&&!dual()?' · 💤 '+(on?'🔱 ✋✋':'💍'):'')+'</div>';
  if(w) return head+tvCard(w,'wpn2');
  return head+'<div class="tv-card" style="opacity:'+(mainBlocks()?'.45':'.9')+'"><span class="ic">'+K.ic+'</span><span class="nm">'+(mainBlocks()?'💤 🔱 ✋✋':'2nd '+K.word+' · pick one in your bag 🎒')+'</span></div>'; }
if(typeof tvRenderBag==='function'){ const prev=tvRenderBag; tvRenderBag=function(){ prev.apply(this,arguments); const eq=document.querySelector('#tv-bag .tv-eq'); if(!eq) return; const h=bagCard(); if(!h) return;
    const d=document.createElement('div'); d.id='tv-wpn2'; d.innerHTML=h; eq.appendChild(d); }; }
if(typeof tvRenderDetail==='function'){ const prev=tvRenderDetail; tvRenderDetail=function(){ const s0=TV.sel; if(s0&&s0.from==='wpn2'){ const w=gear.weapon2; if(!w||w.id!==s0.id){ TV.sel=null; return prev.apply(this,arguments); }
      TV.sel={ id:w.id, from:'eq', slot:'weapon2' }; try{ prev.apply(this,arguments); } finally { if(TV.sel) TV.sel=s0; }   // the worn-piece panel with gear.weapon2 standing in for the slot: the forge (96f) and the pictures draw it
      const db=document.querySelector('#tv-detail .db'); if(db) db.innerHTML='<button class="tv-btn" data-act="unequipw2"'+(Meta.bagFull&&Meta.bagFull()?' disabled':'')+'>'+kind().ic+' Take off 2nd</button>';
      const dm=document.querySelector('#tv-detail .dh .dm'); if(dm) dm.innerHTML=dm.innerHTML.replace('· WORN','· 2ND WEAPON'+(dual()?'':' 💤')); return; }
    prev.apply(this,arguments); const s=TV.sel; if(!s||s.from!=='bag') return; const it=Meta.bag().find(b=>b.id===s.id); if(!it||!canEquip2(it)) return;
    const row=document.querySelector('#tv-detail [data-act="equip"]'); if(row&&!document.querySelector('#tv-detail [data-act="equipw2"]')) row.insertAdjacentHTML('afterend','<button class="tv-btn hot" data-act="equipw2" data-id="'+it.id+'">'+kind().ic+' Equip as 2nd</button>'); }; }
document.addEventListener('click',e=>{ const t=e.target.closest&&e.target.closest('[data-act="equipw2"],[data-act="unequipw2"]'); if(!t||!t.closest('#tavern')) return; e.stopPropagation();
  if(t.dataset.act==='equipw2'){ const it=Meta.bag().find(b=>b.id===t.dataset.id); if(equip2(t.dataset.id)){ tvSay(kind().ic+kind().ic+' '+(it?it.name:'')); TV.sel=null; } }
  else if(unequip2()){ tvSay(kind().ic+' ➜ 🎒'); TV.sel=null; }
  if(typeof tvRenderTab==='function') tvRenderTab(true); },true);
// ---- for a co-op partner's screen (99-network.js lookOf): the 2nd weapon's model, tier and set, as this page's own hand shows it
function look(){ const o=OFF.obj; if(!dual()||!o||!o.parent||!o.userData.sword) return null; return { w:o.userData.sword.name, t:o.userData.sword.tier||1, s:(/\|set:([^|]+)/.exec(OFF.key)||[])[1]||null }; }
window.__dualwield={ RINGS:RINGS.slice(), RING_HERO, RING_OF, LOOK, ringMine, dual, asleep, mainBlocks, fits, canEquip2, isPolearm, equip2, unequip2, giveBack, dropRing, owned, chip, colours, ringModel,
  prep, mirror, look, holdStaff, off:()=>(OFF.obj&&OFF.obj.parent)?OFF.obj:null, offSwing, hand:()=>HAND.cur, kindIcon:()=>kind().ic, kindWord:()=>kind().word,
  stored:()=>JSON.parse(JSON.stringify(STORE)), log:()=>LOG.slice(), clearLog:()=>{ LOG.length=0; },
  info:()=>{ const o=OFF.obj, dw=GLBH&&GLBH.root&&GLBH.root.userData.dw; return Object.assign({ hero:heroId(), ring:gear.charm&&gear.charm.named||null, mine:ringMine(), dual:dual(), asleep:asleep(), second:gear.weapon2?gear.weapon2.name:null,
    off:o&&o.parent?{ name:o.name, node:o.parent.name, hand:o.parent.parent?o.parent.parent.name:null, glow:OFF.glow?OFF.glow.mats.length:0 }:null, rig:dw?{ main:dw.main, off:dw.off, kind:dw.kind, node:dw.node.name }:null, mirrored:!!(GLBH&&GLBH.dwA&&GLBH.dwA.m), hand:HAND.cur },
    JSON.parse(JSON.stringify(cnt))); } };
})();
