// ===== DEFENSE MODELS: drop-in GLB art for defenses (static meshes), per kind and per mark =====
// Models live in assets/ next to the page (fetchDefGLB) or can be handed in as base64 (loadDefGLB). Marks without their
// own model use the highest one below them. The game keeps driving the same userData handles it uses on the procedural
// models: yoke (turns to aim / spins), hp / ball (projectile shown while loaded — dummies here), hub (spinner).
const DEFGLB={};                                                     // kind -> [{wrap,scale,turn,tpl}] by mark index
const DEF_H={harpoon:1.6*BALLISTA_UP,   /* build 164: "a little bigger" -- 1.6 → ~1.95 */acorn:1.5,ball:2.5,slice:.6,spike:1.1,totem:2.8,frost:2.8,snare:2.6};              // target heights in world units (about the procedural sizes)
const DEF_W={slice:3.8,zap:3.2,venom:3.2,ember:3.2,dazzle:3.2};             // flat things fit by footprint width instead (the ring's toadstools stand at radius 2.3) — the halos are the same idea, a low sigil disc, not a spire
const DEF_FACE={ball:-PI/2};   // a model whose front is not +z: the Meshy trebuchet's frame runs along x and throws toward +x (the counterweight side), so it is turned to face +z, the way every defense aims (build 150)
const DEF_TURN=/yoke|turret|swivel|head|top|arm|bow|hub|blade|rotor/i; // a node named like this is the part that turns
// the ballista's rig: the bow assembly (everything above HINGE of the model's height -- the stock, bow and winch post on
// the pedestal) is cut off into a group named 'pitch' that tilts, inside a group named 'yoke' that pans, both hung from a
// mount at the pedestal's top (the centre of the slice just under the cut, i.e. the pivot post -- not the model's centre,
// which the long stock pulls forward). The pedestal itself never moves: it stays a plain child of the root. The game
// drives the same handles it always did -- yoke.rotation.y to aim (and yoke.position.z for recoil), pitch.rotation.x to
// tilt at a drake -- so nothing in updateDefs/fire changed for the rig. The cut is by triangle centroid, so a model needs
// a clean waist between pedestal and stock at HINGE (the Meshy ballistas: their pivot block sits at 45-52% of the height).
const HINGE={harpoon:.53};
function hingeSplit(root,frac){ root.updateMatrixWorld(true); const box=new THREE.Box3().setFromObject(root); const H=box.max.y-box.min.y, ySplit=box.min.y+frac*H; const ctr=box.getCenter(new THREE.Vector3()); const meshes=[]; root.traverse(m=>{ if(m.isMesh) meshes.push(m); }); if(!meshes.length) return null;
  // pass 1: where is the pedestal's top? the footprint centre of the triangles in the slice just under the cut
  const pb=new THREE.Box3(); let pn=0; for(const m of meshes){ const g=m.geometry, P=g.attributes.position, idx=g.index; const n=idx?idx.count:P.count; const v=new THREE.Vector3(); for(let t=0;t<n;t+=3){ let cx=0,cy=0,cz=0; for(let k=0;k<3;k++){ const i=idx?idx.getX(t+k):t+k; v.fromBufferAttribute(P,i).applyMatrix4(m.matrixWorld); cx+=v.x; cy+=v.y; cz+=v.z; } cy/=3; if(cy<ySplit&&cy>=ySplit-.1*H){ pb.expandByPoint(new THREE.Vector3(cx/3,cy,cz/3)); pn++; } } }
  const pv=pn?pb.getCenter(new THREE.Vector3()):ctr;
  const mount=new THREE.Group(); mount.name='mount'; mount.position.set(pv.x,ySplit,pv.z); const yoke=new THREE.Group(); yoke.name='yoke'; mount.add(yoke); const top=new THREE.Group(); top.name='pitch'; yoke.add(top); let nTop=0, nBot=0;
  for(const m of meshes){ const g=(m.geometry.index?m.geometry.toNonIndexed():m.geometry.clone()); g.applyMatrix4(m.matrixWorld); const P=g.attributes.position; const keys=Object.keys(g.attributes); const pick=[[],[]];
    for(let t=0;t<P.count;t+=3){ const cy=(P.getY(t)+P.getY(t+1)+P.getY(t+2))/3; pick[cy>=ySplit?0:1].push(t); }
    const build=(tris,shift)=>{ if(!tris.length) return null; const ng=new THREE.BufferGeometry(); for(const k of keys){ const a=g.attributes[k], sz=a.itemSize, out=new Float32Array(tris.length*3*sz); let o=0; for(const t of tris) for(let v=t;v<t+3;v++) for(let c=0;c<sz;c++) out[o++]=a.array[v*sz+c]; ng.setAttribute(k,new THREE.BufferAttribute(out,sz)); } if(shift) ng.translate(-pv.x,-ySplit,-pv.z); return ng; };
    const gt=build(pick[0],true), gb=build(pick[1],false); m.parent.remove(m); if(gt){ top.add(new THREE.Mesh(gt,m.material)); nTop++; } if(gb){ root.add(new THREE.Mesh(gb,m.material)); nBot++; } }
  root.add(mount); root.userData.hinge={y:ySplit,top:nTop,bottom:nBot,pivot:[+pv.x.toFixed(3),+pv.z.toFixed(3)],slice:pn}; return top; }
function regDefGLB(kind,gltf,markIdx){ const root=gltf.scene||gltf.scenes[0]; if(HINGE[kind]) hingeSplit(root,HINGE[kind]); let targetH=DEF_H[kind]||2; if(DEF_W[kind]){ root.updateMatrixWorld(true); const sz=new THREE.Box3().setFromObject(root).getSize(new THREE.Vector3()); targetH=DEF_W[kind]*sz.y/Math.max(sz.x,sz.z,1e-6); } const fit=fitModel(root,targetH); toonify(root,fit.scale); let turn=null; root.traverse(o=>{ if(!turn&&o!==root&&DEF_TURN.test(o.name||'')) turn=o.name; }); (DEFGLB[kind]=DEFGLB[kind]||[])[markIdx||0]={wrap:fit.wrap,scale:fit.scale,turn}; }
function loadDefGLB(kind,b64,markIdx,cb){ try{ const u=Uint8Array.from(atob(b64),c=>c.charCodeAt(0)); new THREE.GLTFLoader().parse(u.buffer,'',gltf=>{ try{ regDefGLB(kind,gltf,markIdx); if(cb) cb(null); }catch(e){ console.warn('defense model '+kind,e); if(cb) cb(e); } },e=>{ console.warn('defense model '+kind,e); if(cb) cb(e); }); }catch(e){ console.warn('defense model '+kind,e); if(cb) cb(e); } }
function fetchDefGLB(kind,url,markIdx,prio){ fetchBytes(url,prio).then(buf=>new THREE.GLTFLoader().parse(buf,'',gltf=>{ try{ regDefGLB(kind,gltf,markIdx); }catch(e){ console.warn('defense model '+kind,e); } },e=>console.warn('defense model '+kind,e))).catch(e=>console.warn('defense model '+kind+' ('+url+')',e)); }
function defTemplate(kind,lvl){ const list=DEFGLB[kind]; if(!list) return null; let i=Math.min(list.length-1,Math.max(0,(lvl||1)-1)); while(i>=0&&!list[i]) i--; return i>=0?list[i]:null; }
// the procedural ring's spore puffs and faint area disc, reused over the Meshy rings
function sporeHub(){ const hub=new THREE.Group(); for(let k=0;k<9;k++){ const a=k/9*TAU, r=.5+((k*5)%3)*.45; const pf=glow(k%3?0xd08aff:0x8ff6ff,.6+((k*3)%2)*.3,.3); pf.position.set(Math.cos(a)*r,.4,Math.sin(a)*r); pf.userData.ph=k*.31; pf.userData.a=a; pf.userData.r=r; hub.add(pf); } return hub; }   // angle + radius kept: the cage's vortex pulls them to the centre (cageAnim)
// the cage's toxic cloud: murky green-violet puffs hanging over the roots, shown only while the implosion's cloud lasts
function cageCloud(){ const cl=new THREE.Group(); for(let k=0;k<11;k++){ const a=k/11*TAU+.4, r=.3+((k*7)%4)*.42; const pf=glow(k%2?0x8ee06a:0x9a5adf,1.1+((k*5)%3)*.35,.3); const y=.8+((k*3)%3)*.55; pf.position.set(Math.cos(a)*r,y,Math.sin(a)*r); pf.userData.ph=k*.7; pf.userData.y=y; pf.userData.op=.34+((k*5)%3)*.1; cl.add(pf); } cl.visible=false; return cl; }   // the puffs ride up through and over the roots, so the cloud reads from outside the dome
function sporeDisc(){ const disc=new THREE.Mesh(new THREE.CircleGeometry(2.5,24),new THREE.MeshBasicMaterial({color:C(0xb04ad0),transparent:true,opacity:.1,blending:THREE.AdditiveBlending,depthWrite:false})); disc.rotation.x=-PI/2; disc.position.y=.04; disc.userData.noOL=true; return disc; }
const makeDefProc=makeDef;
makeDef=function(kind,ghost,lvl){ const T=defTemplate(kind,lvl); if(!T) return makeDefProc(kind,ghost);
  const g=T.wrap.clone(); g.userData.glb=true; g.userData.tpl=T;                         // clone shares geometry + materials (outline shells included)
  if(DEF_FACE[kind]&&g.children[0]) g.children[0].rotation.y+=DEF_FACE[kind];   // faced before the yoke wraps it, so the turn stays about the footprint centre
  let yoke=null; if(T.turn) g.traverse(o=>{ if(!yoke&&o.name===T.turn) yoke=o; });
  if(!yoke){ yoke=new THREE.Group(); const inner=g.children[0]; g.remove(inner); yoke.add(inner); g.add(yoke); }   // no named part: the whole model turns about its footprint centre
  g.userData.yoke=yoke; g.userData.hub=yoke; g.userData.hp=new THREE.Object3D(); g.userData.ball=new THREE.Object3D(); g.traverse(o=>{ if(o.name==='pitch') g.userData.pitch=o; });   // a hinged bow assembly pitches on its own
  if(kind==='slice'){ g.userData.yoke=new THREE.Object3D(); const cg=new THREE.Group(); cg.name='cage'; while(g.children.length) cg.add(g.children[0]); g.add(cg); g.userData.cage=cg;   // the roots on an inner group: the snap and the breathing scale it, while updateDefs keeps scaling the root by range
    g.userData.hub=sporeHub(); g.add(g.userData.hub); if(!ghost){ const disc=sporeDisc(); g.add(disc); g.userData.disc=disc; const fl=glow(0xc060ff,1,0); fl.position.y=1.35; g.add(fl); g.userData.flash=fl; g.userData.cloud=cageCloud(); g.add(g.userData.cloud); } }   // the flash at the heart and the cloud over it, both dark until the implosion (cageAnim)
  if(ghost){ g.traverse(m=>{ if(m.isMesh){ if(m.userData.isOL) m.visible=false; else m.material=GHOST_OK; } }); }
  else g.add(blob(.95));
  return g; };
// re-skin a built defense whenever its mark (or a late-loading model) calls for a different look — checked every frame, cheaply
function reskinDefs(){ for(const d of defs){ ensureDefMark(d.kind,d.lvl); ensureDefMark(d.kind,d.lvl+1); const T=defTemplate(d.kind,d.lvl); if(!T||d.mdl.userData.tpl===T) continue; const old=d.mdl; scene.remove(old); d.mdl=makeDef(d.kind,false,d.lvl); d.mdl.position.copy(old.position); d.mdl.rotation.y=d.rot; d.mdl.scale.copy(old.scale); scene.add(d.mdl); } }
const HEDGE_STRETCH=1.66;   // the hedge is five cells wide now: stretch the three-cell model to match
{ const base=makeDef; makeDef=function(kind,ghost,lvl){ const m=base(kind,ghost,lvl); if(kind!=='spike') return m; const s=new THREE.Group(); s.name='stretch'; s.scale.x=HEDGE_STRETCH; while(m.children.length) s.add(m.children[0]); m.add(s); m.userData.stretch=s; return m; }; }   // on an inner group, since updateDefs sets d.mdl.scale uniformly every frame (the pop and the 7%-a-mark growth) and wiped a stretch on the root after one frame, so only the ghost was ever wide
function holdHedgeLength(){ for(const d of defs){ const s=d.kind==='spike'&&d.mdl.userData.stretch; if(s) s.scale.x=HEDGE_STRETCH/markGrow(d.lvl); } }   // a mark makes a hedge taller and thicker (updateDefs grows every defense 1+.07*(lvl-1), uniformly), never longer: its length is its footprint's, and a Mark V hedge 28% longer poked 0.67 past its cells into the next cell or the wall when set down off a cell centre, so the stretch gives the mark's growth back along the hedge
{ const prev=Meta.update; Meta.update=dt=>{ prev(dt); reskinDefs(); holdHedgeLength(); }; }
// the ballista (harpoon turret) by mark: tier models from Meshy; marks beyond the last one reuse it
// Mark I comes down with the 'soon' tier (it's what placing shows); marks II..IV are only registered here and fetched
// the moment a defense of that kind first reaches them -- plus the next mark up, prefetched, so the upgrade after that
// lands already dressed. Until a mark's model arrives, defTemplate() falls back to the highest loaded mark, as it always
// did. That's ~24 models (~30MB) that no longer come down before the player has even placed anything.
const DEF_LAZY={}, DEF_ASKED={};
function defMarks(kind,base){ fetchDefGLB(kind,ASSET(base+'-1.glb'),0,'soon'); DEF_LAZY[kind]=[null,ASSET(base+'-2.glb'),ASSET(base+'-3.glb'),ASSET(base+'-4.glb')]; }
function ensureDefMark(kind,lvl){ const list=DEF_LAZY[kind]; if(!list) return false; const i=Math.min(3,(lvl||1)-1); if(i<1||!list[i]) return false; const key=kind+':'+i; if(DEF_ASKED[key]) return false; DEF_ASKED[key]=true; fetchDefGLB(kind,list[i],i,'first'); return true; }
defMarks('harpoon','ballista');   // Mark I..IV; Mark V keeps the tier-4 look
defMarks('spike','hedge');   // the bramble hedge (Meshy) Mark I..IV; Mark V keeps the tier-4 look (hedge-1 is the hedge every mark used to share; II-IV are the player's T2-T4 cut to one 1024 px base-colour map, all toonify() reads)
defMarks('acorn','cannon');   // the acorn cannon (Meshy) Mark I..IV; Mark V keeps the tier-4 look
// (build 230: the Mycelium Cage tower is gone from the game -- its Mark IV art became the Heartroot, heartroot.glb -- so its Mark I..IV files are no longer requested)
defMarks('totem','totem');   // the rune totem (Meshy) Mark I..IV; Mark V keeps the tier-4 look
defMarks('frost','frost');   // the Frost Spire: the player's four cold towers (build 150; the earlier frost-N files were runed pillars that read as rune totems) Mark I..IV; Mark V keeps the tier-4 look
defMarks('ball','trebuchet');   // the Turnip Trebuchet: the player's four Meshy trebuchets, wood / iron / steel / gold as Marks I..IV (build 150); Mark V keeps the gold
defMarks('snare','snare');   // the snare tower (Meshy) Mark I..IV; Mark V keeps the tier-4 look
// the four elemental halos (Meshy): one sigil disc each, all marks — the glow ring drawn over them (game.js, auraRing) is what grows with each mark, not the model
fetchDefGLB('zap',ASSET('aura-zap.glb'),0,'soon'); fetchDefGLB('venom',ASSET('aura-venom.glb'),0,'soon'); fetchDefGLB('ember',ASSET('aura-ember.glb'),0,'soon'); fetchDefGLB('dazzle',ASSET('aura-dazzle.glb'),0,'soon');
// the acorn the cannon fires: Meshy's acorn, toon-shaded, ~0.34 tall; the procedural one until it lands
{ let tpl=null; const proc=acornMesh; fetchBytes(ASSET('acorn.glb'),'soon').then(buf=>new THREE.GLTFLoader().parse(buf,'',gltf=>{ try{ const root=gltf.scene||gltf.scenes[0]; const fit=fitModel(root,.64); toonify(root,fit.scale); const w=fit.wrap; w.children[0].position.y-=.32; tpl=w; }catch(e){ console.warn('acorn model',e); } },e=>console.warn('acorn model',e))).catch(e=>console.warn('acorn model',e));
  acornMesh=function(){ if(!tpl) return proc(); const g=tpl.clone(); g.rotation.set(rnd()*6,rnd()*6,0); return g; }; }
// the bolt the ballista fires: Meshy's model comes standing up (head at +Y, fletching at -Y, the usual export
// convention for a narrow prop), so it's rotated onto its side before fitting so its shaft runs along Z, forward,
// matching the procedural bolt's own convention — the caller then aims it with a plain yaw/pitch rotation. Not run
// through fitModel: that scales to a target Y (height), which is wrong for something meant to lie flat — this
// scales to a target length along Z instead, and centres the model instead of bottom-pivoting it, since a flying
// bolt is aimed from its middle, not stood on a floor.
{ let tpl=null; const proc=harpoonMesh;
  fetchBytes(ASSET('ballista-bolt.glb'),'soon').then(buf=>new THREE.GLTFLoader().parse(buf,'',gltf=>{ try{
      const root=gltf.scene||gltf.scenes[0]; root.rotation.x=-PI/2; root.updateMatrixWorld(true);
      const box=new THREE.Box3().setFromObject(root); const size=box.getSize(new THREE.Vector3());
      const sc=1.5/Math.max(size.z,1e-6), ctr=box.getCenter(new THREE.Vector3());
      const inner=new THREE.Group(); inner.add(root); inner.scale.setScalar(sc); inner.position.set(-ctr.x*sc,-ctr.y*sc,-ctr.z*sc);
      toonify(root,sc); const w=new THREE.Group(); w.add(inner); tpl=w;
    }catch(e){ console.warn('ballista bolt model',e); } },e=>console.warn('ballista bolt model',e))).catch(e=>console.warn('ballista bolt model',e));
  harpoonMesh=function(){ if(!tpl) return proc(); return tpl.clone(); }; }
window.__defglb={load:loadDefGLB,fetch:fetchDefGLB,ensure:ensureDefMark,template:defTemplate,asked:()=>Object.keys(DEF_ASKED),list:()=>Object.fromEntries(Object.entries(DEFGLB).map(([k,v])=>[k,v.map(t=>t?{scale:+t.scale.toFixed(3),turn:t.turn}:null)]))};
