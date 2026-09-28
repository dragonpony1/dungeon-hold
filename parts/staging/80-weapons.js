// ===== VISIBLE WEAPONS: the weapon in the hero's hand is the weapon you wear. Sword models live in assets/ and staffs are
// built in code (82-staff.js); either is mounted on the hero's hand bone at the mount the model carries (an empty node:
// position = grip, +Y = the blade or staff axis, name = length in cm). A sword mount takes swords, a staff mount staffs —
// the same item shows as a sword on a sword-wielding hero and a staff on the Witch, so loot is shared and each holds their own kind.
(function(){
const SWORDS={rusty:'sword-rusty.glb',venom:'sword-venom.glb',frost:'sword-frost.glb',flame:'sword-flame.glb',holy:'sword-holy.glb'};
const GRIP_F=0.17;                        // the fist closes this far up the sword from the pommel (fraction of its full length)
const tpl={}, loading={}; const PROC_WEAPONS={};   // name -> template root (bounds in userData.box) / pending callbacks; name -> builder for weapons made in code
// which model an item shows: its name decides (cleavers are the goblin blade, embers burn, storms and the deep are ice,
// crystal and myth are holy), then the base weapon, then rarity — so a new find usually looks new in the hand
const BASE_SWORD=[['shortsword','rusty'],['broadsword','rusty'],['cleaver','venom'],['warhammer','flame'],['halberd','frost'],['gnome blade','holy']];
function swordFor(it){ if(!it) return 'rusty'; const sw=window.__weapons.setModel&&window.__weapons.setModel(it,'sword'); if(sw) return sw;   /* build 154: a gear set's own sword or polearm (86-setweapons.js) */ const n=(it.name||'').toLowerCase(), r=Math.max(0,Math.min(4,it.rarity|0)); const pk=Meta.packs&&Meta.packs.of(it); if(pk&&pk.models&&pk.models.sword) return pk.models.sword;   // a great set's stand-in blade until its own model lands
  if(/cleaver|goblin|venom|serpent/.test(n)) return 'venom';
  if(/ember|flame|fire|dragon|blaze/.test(n)) return 'flame';
  if(/frost|\bice\b|deep|storm|moon|silver/.test(n)) return 'frost';
  if(/crystal|eternal|mythic|holy|sacred/.test(n)) return 'holy';
  for(const [k,v] of BASE_SWORD) if(n.includes(k)) return v;
  return ['rusty','rusty','frost','flame','holy'][r]; }
function swordTier(it){ return it?Math.max(1,Math.min(5,it.tier||tierOf(it.lvl||1))):1; }
function lenMul(tier){ return .8+.07*(tier-1); }   // a tier-1 blade is a bit short of the baked one; tier 5 a touch longer
function loadSword(name,cb){ if(tpl[name]) return cb(tpl[name]); if(PROC_WEAPONS[name]){ tpl[name]=PROC_WEAPONS[name](); return cb(tpl[name]); } if(loading[name]){ loading[name].push(cb); return; } loading[name]=[cb];
  if(!SWORDS[name]){ console.warn('no weapon model named '+name); delete loading[name]; return; }
  fetchBytes(ASSET(SWORDS[name]),'first').then(buf=>new THREE.GLTFLoader().parse(buf,'',gltf=>{ const root=gltf.scene||gltf.scenes[0]; root.traverse(m=>{ if(m.isMesh) m.frustumCulled=false; }); root.updateMatrixWorld(true); if(!root.userData.box) root.userData.box=new THREE.Box3().setFromObject(root);   // the model's own frame: pommel at box.min.y, tip at box.max.y
    tpl[name]=root; const cbs=loading[name]; delete loading[name]; cbs.forEach(f=>f(root)); },e=>{ console.warn('sword '+name,e); delete loading[name]; })).catch(e=>{ console.warn('sword '+name,e); delete loading[name]; }); }
const W={key:'',obj:null,hand:null,tier:1}; let FORCE_WEAPON=null;   // a name to mount regardless of gear (previews and tests)
function outlineScaled(obj,scale){ const o=OL.clone(); o.uniforms.t.value=.02/(scale||1); o.polygonOffset=true; o.polygonOffsetFactor=1.5; o.polygonOffsetUnits=1.5; obj.traverse(m=>{ if(m.isMesh&&!m.userData.isOL&&!m.userData.noOL&&!m.isSprite){ const k=new THREE.Mesh(m.geometry,o); k.userData.isOL=true; m.add(k); } }); }
function setTint(obj,pk){ obj.traverse(m=>{ if(m.isMesh&&!m.userData.isOL&&m.material&&m.material.emissive){ m.material=m.material.clone(); m.material.color.multiplyScalar(.45); m.material.emissive.set(pk.emissive); m.material.emissiveIntensity=.8; } }); obj.userData.void=true; obj.userData.set=pk.name; }   // a great set's piece: the stand-in model darkens and burns with the set's colour from within
function heroMount(){ if(!(useGLB&&GLBH&&GLBH.root)) return null; if(GLBH.mountNode===undefined){ let n=null; GLBH.root.traverse(o=>{ if(!n&&/^(weapon|staff|bow)Mount_\d+/.test(o.name)) n=o; }); GLBH.mountNode=n; }   // an empty node under the hand bone
  const n=GLBH.mountNode; return n?{node:n,len:+n.name.split('_')[1],staff:/^staff/.test(n.name),bow:/^bow/.test(n.name)}:null; }
function unmount(){ if(W.obj&&W.obj.parent) W.obj.parent.remove(W.obj); W.obj=null; W.hand=null; }
// mount a weapon on ANY rig's mount node (build 150: the party puppets wear what their player wears): the template by
// name, sized to the node's length suffix and the tier, outlined/toonified for the node's world scale, tinted for a set
// build 183 (Matt: "its sorta just floating on his wrist, i dont know if we can curl his hand slightly and get it
// closer to being in his hand"): the Knight's rig has no finger bones at all (probes/glbinfo.mjs: 24 joints, stops at
// LeftHand/RightHand) -- there is no curl to pose, so the fix is mount calibration instead. His weaponMount_90 empty
// sits noticeably off from where the hand mesh's own (sculpted, static) half-closed fingers actually rest: close-up
// renders (tools/scratch-main/knight-grip.mjs) showed the hilt hovering up near the wrist with the fingers dangling
// well past it. A one-time local offset along the mount's own Z walks the whole weapon down into the fingers'
// resting curl -- found empirically (a sweep of +/-5 on each axis, then narrowing in Z), same idea as the Troll's
// build-156 "briefcase" bow-hold fix. It's on the MOUNT (weaponMount_ only -- the Knight's own sword/polearm hand),
// not the item, so it corrects the rig regardless of which sword, polearm or set weapon ends up there; a staff or
// bow mount (a different empty, on a different rig) is untouched
const KNIGHT_GRIP_FIX={weapon:15};
function attachWeapon(node,name,tier,setName,cb){ loadSword(name,root=>{ const len=+node.name.split('_')[1]||90; const obj=root.clone(); const box=root.userData.box; const L=box.max.y-box.min.y;
    const gripY=box.min.y+(root.userData.gripF!==undefined?root.userData.gripF:GRIP_F)*L, tipY=box.max.y; const s=(len*lenMul(tier||1)*(root.userData.lenScale||1))/(box.max.y-gripY);   /* lenScale: a template longer than a sword (a staff is body-length) */ obj.scale.setScalar(s);
    const mountKind=/^weapon/.test(node.name)?'weapon':/^staff/.test(node.name)?'staff':/^bow/.test(node.name)?'bow':null, fixZ=KNIGHT_GRIP_FIX[mountKind]||0;
    obj.position.set(0,-gripY*s,fixZ);   // the grip point sits on the mount (in the fist); the blade runs up the mount's +Y
    node.updateWorldMatrix(true,false); const worldPerUnit=s*node.getWorldScale(new THREE.Vector3()).x; if(root.userData.proc) outlineScaled(obj,worldPerUnit); else toonify(obj,worldPerUnit);
    const pk=setName&&Meta.packs&&Meta.packs.get(setName); if(pk){ if(root.userData.proc){ obj.userData.void=true; obj.userData.set=pk.name; } else setTint(obj,pk); }   // a set's own staff already wears its colours; a stand-in sword is tinted
    obj.userData.sword={name,tier,scale:s,gripY,tipY,len:L}; node.add(obj); if(cb) cb(obj); }); }
function mountSword(name,tier,key){ const hm=heroMount(); if(!hm) return; const m=/\|set:(.+)$/.exec(key); attachWeapon(hm.node,name,tier,m?m[1]:null,obj=>{ if(W.key!==key){ if(obj.parent) obj.parent.remove(obj); return; }   // a newer request won
    unmount(); W.obj=obj; W.hand=hm.node.parent; W.tier=tier; }); }
function weaponsUpdate(dt){ const hm=heroMount(); if(!hm){ if(W.obj) unmount(); W.key=''; return; } if(W.obj&&W.obj.parent&&W.obj.parent!==hm.node) unmount();   // the hero model changed: drop the old weapon at once, the new one follows when its model is ready
  const it=gear.weapon, name=FORCE_WEAPON||(hm.staff?(window.__staff?window.__staff.staffFor(it):'staff-hazel'):hm.bow?(window.__bow?window.__bow.bowFor(it):'bow-ash'):swordFor(it)), tier=swordTier(it); const pk=Meta.packs&&Meta.packs.of(it); const key=name+'|'+tier+'|'+GLBH.label+(pk&&pk.emissive?'|set:'+pk.name:''); if(key===W.key&&W.obj&&W.obj.parent===hm.node) return; W.key=key; mountSword(name,tier,key); }
{ const prev=Meta.update; Meta.update=dt=>{ prev(dt); weaponsUpdate(dt); }; }
// preload the plain sword so the hero is never empty-handed for long
loadSword('rusty',()=>{});
// where the blade is right now, in world units (tests, and anything that wants to hang an effect on the weapon)
function bladeWorld(){ if(!(W.obj&&W.obj.parent)) return null; const sd=W.obj.userData.sword, box=tpl[sd.name].userData.box; W.obj.updateWorldMatrix(true,false); const p=v=>W.obj.localToWorld(v.clone()).toArray().map(x=>+x.toFixed(3));
  const cx=(box.min.x+box.max.x)/2, cz=(box.min.z+box.max.z)/2; return {pommel:p(new THREE.Vector3(cx,box.min.y,cz)),grip:p(new THREE.Vector3(cx,sd.gripY,cz)),tip:p(new THREE.Vector3(cx,sd.tipY,cz)),mount:W.obj.parent.getWorldPosition(new THREE.Vector3()).toArray().map(x=>+x.toFixed(3)),hand:W.hand.getWorldPosition(new THREE.Vector3()).toArray().map(x=>+x.toFixed(3))}; }
window.__weapons={force:n=>{ FORCE_WEAPON=n||null; },attach:attachWeapon,look:()=>({w:W.key.split('|')[0]||null,t:W.tier||1,s:(/\|set:(.+)$/.exec(W.key)||[])[1]||null}),register:(n,fn)=>{ PROC_WEAPONS[n]=fn; },mounted:()=>W.obj,mount:heroMount,tick:dt=>weaponsUpdate(dt),model:(name,cb)=>loadSword(name,root=>cb(root.clone())),
  state:()=>({key:W.key,void:!!(W.obj&&W.obj.userData.void),mounted:!!(W.obj&&W.obj.parent),whip:false,staff:!!(W.obj&&/^staff-/.test(W.obj.name)),bow:!!(W.obj&&/^bow-/.test(W.obj.name)),hand:W.hand?W.hand.name:null,tier:W.tier,loaded:Object.keys(tpl),mount:GLBH&&GLBH.mountNode?{bone:GLBH.mountNode.parent.name,len:+GLBH.mountNode.name.split('_')[1],staff:/^staff/.test(GLBH.mountNode.name),bow:/^bow/.test(GLBH.mountNode.name)}:null,label:GLBH&&GLBH.label}),swordFor,swordTier,blade:bladeWorld};
})();
