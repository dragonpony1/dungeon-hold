// ===== THE GNOME HALL'S WALLS AND PILLARS (build 247). Matt: "think about what we've done to fix up the throne room and think about how you can simply fix up map 1", then "use the assets we already have".
// Nothing new is made: the hall keeps its own red brick and carpet and gets the Throne Room's finished pieces (56-thronedecor.js), the same models from the same files, hung the way the throne room's walls were fixed:
//   * the four purple stand-in pillars become the real runed pillars (throne-pillar.glb) at the same four spots and the same height;
//   * the great hall's four walls carry Matt's blue-and-gold window, tall banners, scepter racks and dragon-head plaques in a set rhythm -- each wall has an arm either side of its opening (the gate corridors and the
//     tavern door), a big piece two cells in from the corner and a banner beside the opening, and none of it stands in the corner cells (barrels and crates);
//   * they are sized to THIS hall's 7-high walls (the throne room's are 18), hang a hair off the brick (the throne room's lesson: a piece mounted inside the wall's own relief is never seen), and replace what they cover:
//     the small flat painted banners (and their rods) and painted windows, and any flat procedural torch in the great hall that a piece would crowd (the torches with clear wall around them stay lit as before), while the real sconce goes on each pillar, facing the room (self-lit, no extra point lights);
//   * every model is fetched once and cloned per spot (the throne room's ONE-FETCH lesson) at the 'later' tier, behind the hero, the defenses, the goblin and the other mobs (about 3.7 MB in all), so map one, where a new player starts, opens no slower and no wave waits on a wall decoration.
// Only MAP.id==='hall': the tutorial hall, the throne room and every other map are untouched. Test hook: window.__halldecor.
(function(){
window.__halldecor={pieces:()=>[],used:()=>({}),loaded:()=>false};
if(!MAP||MAP.id!=='hall') return;
const [hx0,hx1,hz0,hz1]=MAP.hall;
// ---- glows (the same three the throne room gives its models)
function purpleGlow(root){ root.traverse(o=>{ const m=o.isMesh&&o.material; if(!m||m.userData.__pg) return; m.userData.__pg=true;
  m.onBeforeCompile=sh=>{ sh.fragmentShader=sh.fragmentShader.replace('#include <emissivemap_fragment>',
    '#include <emissivemap_fragment>\n  { float pf=clamp(diffuseColor.b-diffuseColor.g,0.0,1.0)*clamp(diffuseColor.r-diffuseColor.g+0.25,0.0,1.0); totalEmissiveRadiance += vec3(0.62,0.2,0.98)*pf*1.7; }'); }; }); }
function warmGlow(root){ root.traverse(o=>{ const m=o.isMesh&&o.material; if(!m||m.userData.__wg) return; m.userData.__wg=true;
  m.onBeforeCompile=sh=>{ sh.fragmentShader=sh.fragmentShader.replace('#include <emissivemap_fragment>',
    '#include <emissivemap_fragment>\n  totalEmissiveRadiance += vec3(.32,.16,.05);'); }; }); }
function windowGlow(root){ root.traverse(o=>{ const m=o.isMesh&&o.material; if(!m||m.userData.__wgl) return; m.userData.__wgl=true; const prev=m.onBeforeCompile;
  m.onBeforeCompile=sh=>{ if(prev) prev(sh); sh.fragmentShader=sh.fragmentShader.replace('#include <emissivemap_fragment>','#include <emissivemap_fragment>\n  { float bf=clamp(diffuseColor.b-diffuseColor.r-.05,0.0,1.0); totalEmissiveRadiance += vec3(.25,.5,1.0)*bf*3.0; }'); }; }); }   // stronger than the throne room's 1.5: the hall's warm orange lamps wash the blue out, so the glass needs more of its own light to read as blue
// ---- one fetch and one parse per model, a clone per placement
const PROTO={}, USED={}; let DONE=0, WANT=0;
function protoOf(name,size){ const key=name+'|'+size; return PROTO[key]||(PROTO[key]=fetchBytes(ASSET(name),'later').then(buf=>new Promise((res,rej)=>new THREE.GLTFLoader().parse(buf,'',gltf=>{ try{
    const root=gltf.scene||gltf.scenes[0]; const fit=fitModel(root,size); toonify(root,fit.scale); purpleGlow(root); res(fit.wrap); }catch(e){ rej(e); } },rej)))); }
const useProp=(name,size,cb)=>{ WANT++; return protoOf(name,size).then(p=>{ USED[name]=(USED[name]||0)+1; cb(p.clone()); }).catch(e=>console.warn('hall decor '+name,e)).then(()=>{ DONE++; }); };
// ---- the plan: [kind, wall, cell along it]. faceAt finds the engine's own wall face for that floor cell and side, so it lines up exactly
const faceAt=(cx,cz,nx,nz)=>wallFaces.find(f=>f.cx===cx&&f.cz===cz&&f.nx===nx&&f.nz===nz);
const N=[0,1], S=[0,-1], W=[1,0], E=[-1,0];   // the face's normal: toward the room (a north wall faces south, +z)
// measured on this hall's 7-high walls: window 1.9 wide x 4.2 tall, banner 2.2 x 3.5, scepter rack .7 x 2.7, dragon plaque 1.8 x 2.9 (a cell is 2), so no piece stands in the corner cells (barrels and crates), in a pillar's row or column
// (pillars at cells 12 and 20 across, 13 and 21 down: a piece there is hidden behind the column) or over another
const PLAN=[
  ['banner',N,11],['window',N,13],['rack',N,14],['rack',N,18],['window',N,19],['banner',N,21],      // the north wall, the way you face at the start: two windows, a scepter rack either side of the gate
  ['banner',S,11],['beast',S,14],['beast',S,18],['banner',S,21],                                   // the south wall: a dragon plaque either side of the tavern door
  ['banner',W,12],['window',W,15],['window',W,19],['banner',W,22],
  ['banner',E,12],['window',E,15],['window',E,19],['banner',E,22]];
const plan=[]; PLAN.forEach(([kind,[nx,nz],c])=>{ const cx=nx?(nx>0?hx0:hx1):c, cz=nx?c:(nz>0?hz0:hz1); const f=faceAt(cx,cz,nx,nz); if(!f) return; const base=hgt[idx(f.cx,f.cz)]||0; plan.push({kind,f,base,span:WALLH-base,yaw:Math.atan2(f.nx,f.nz)}); });
const SIZE={ window:s=>Math.min(10.5,s*.6), banner:s=>Math.min(9,s*.5), beast:s=>Math.min(7,s*.42), rack:s=>Math.min(6.4,s*.38) };   // how tall each is on a wall this high
const BOTTOM={ window:(b,s,h)=>b+s*.22, banner:(b,s,h)=>b+s*.92-h, beast:(b,s,h)=>b+s*.42-h/2, rack:(b,s,h)=>b+s*.42-h/2 };
const FLAT={ window:.55, banner:1, beast:.6, rack:.8 };   // depth squash: a model scaled by height gets thicker as it gets taller
const PROP={ window:['throne-window-v2.glb',8], banner:['throne-banner2.glb',6], beast:['throne-beast.glb',3.6], rack:['throne-scepter.glb',4.4] };
const OFF=.1;   // the brick has no panel relief here, so a piece's back rests almost on the wall
// ---- what the new pieces cover: the painted windows, the small painted banners and their rods, and the great hall's procedural torches that a piece would crowd (the rest stay lit)
(world.userData.windowParts||[]).forEach(o=>{ o.visible=false; });
(world.userData.bannerMeshes||[]).forEach(o=>{ o.visible=false; }); (world.userData.bannerRods||[]).forEach(o=>{ o.visible=false; });
const inHall=f=>f.cx>=hx0&&f.cx<=hx1&&f.cz>=hz0&&f.cz<=hz1;
const nearPiece=(x,z)=>plan.some(p=>Math.hypot(p.f.x-x,p.f.z-z)<2.1);
let hidTorches=0;
(world.userData.torchProcs||[]).forEach(t=>{ const f=wallFaces.find(w=>Math.hypot(w.x-t.position.x,w.z-t.position.z)<.05); if(!f||!inHall(f)||!nearPiece(f.x,f.z)) return; t.visible=false; hidTorches++; });
// ---- the pieces
for(const kind of Object.keys(PROP)){ const [file,H0]=PROP[kind];
  useProp(file,H0,wrap=>{ if(kind==='window') windowGlow(wrap); wrap.children[0].scale.z*=FLAT[kind];
    for(const p of plan){ if(p.kind!==kind) continue; const h=SIZE[kind](p.span), k=h/H0, t=wrap.clone(); t.scale.setScalar(k); t.updateMatrixWorld(true);
      const bb=new THREE.Box3().setFromObject(t); p.w=+(bb.max.x-bb.min.x).toFixed(2); p.dep=+(bb.max.z-bb.min.z).toFixed(2); const back=Math.max(0,-bb.min.z);   // how far the model reaches behind its own origin (a plaque's wooden back): pushed out so it rests just clear of the brick
      t.position.set(p.f.x+p.f.nx*(OFF+back),BOTTOM[kind](p.base,p.span,h),p.f.z+p.f.nz*(OFF+back)); t.rotation.y=p.yaw; world.add(t); p.done=true; } }); }
// ---- a real sconce on each pillar, on the side that faces the middle of the room (the throne room does the same: a pillar's torch faces the aisle, not the wall)
let sconces=0;
useProp('throne-sconce.glb',1.5,wrap=>{ warmGlow(wrap);
  MAP.pillars.forEach(([px,pz])=>{ const nx=px<MAP.crystal[0]?1:-1, t=wrap.clone(); t.position.set(cw(px)+nx*.78,(hgt[idx(px,pz)]||0)+3.0,cwz(pz)); t.rotation.y=Math.atan2(nx,0); world.add(t); sconces++; }); });
// ---- the real pillars at the four spots, the same height as the purple stand-ins (the shaft PH plus the base and capital's own 1)
(world.userData.pillarProcs||[]).forEach(p=>{ p.visible=false; });
const PH=MAP.pillarH||6; let pillars=0;
useProp('throne-pillar.glb',PH+1,wrap=>{ MAP.pillars.forEach(([px,pz])=>{ const t=wrap.clone(); t.position.set(cw(px),hgt[idx(px,pz)]||0,cwz(pz)); world.add(t); pillars++; }); });
window.__halldecor={pieces:()=>plan.map(p=>({kind:p.kind,cx:p.f.cx,cz:p.f.cz,nx:p.f.nx,nz:p.f.nz,x:+p.f.x.toFixed(1),z:+p.f.z.toFixed(1),base:p.base,h:+SIZE[p.kind](p.span).toFixed(2),w:p.w,dep:p.dep,done:!!p.done})),
  used:()=>Object.assign({},USED),loaded:()=>WANT>0&&DONE>=WANT,pillars:()=>pillars,sconces:()=>sconces,torchesHidden:()=>hidTorches,protos:()=>Object.keys(PROTO)};
})();
