// ===== THE TITLE SCREEN'S 3D BACKGROUNDS (build 256). Matt: "loading screen has our background rotation in it, add fire imp and storm drake", and earlier "all of them should be that way": every rotating background is the model shown
// the way Meshy previews it -- slowly spinning on black, a soft pool of light behind it fading to black at the edges, nothing else. 19b-titlepick.js picks the one for this visit; when it is not the painting this draws it:
//   * its own small WebGL canvas (#titleStage) behind the title's content, its own scene (a sky/ground light, a bright key light, a cool rim light from behind), the model fetched once at the 'soon' tier (one file, 1-1.5 MB)
//     and fitted to about 60% of the screen height; on a wide screen it stands on the right so the heading and the buttons stay clear, on a narrow one it is centred; it fades in when it has arrived (the black pool is
//     already there while it loads); a slow bob and a spin;
//   * it draws only while the title is showing (the poll below): the moment the game starts (#start gets .hide) the loop stops, the renderer is disposed and its WebGL context released, so play never carries a second
//     context; a title shown again later (back to the title) starts it again from the model already in memory.
// Matt: "it will be in the background rotation with a moniker showing its name": each model has its NAME under it (#titleMoniker, in the heading font, gold; the two named mythics also say so), fading in with it.
// Test hook: window.__titlestage.
(function(){
const want=window.__titleWant?window.__titleWant():'portal';
window.__titlestage={want,running:()=>false,loaded:()=>false,canvas:()=>null,snapshot:()=>null};
if(!HAS_ASSETS||want==='portal') return;
const st=document.getElementById('start'); if(!st) return;
const FILES={firebow:'bow-fire.glb',wisp:'fam-wisp-projectile.glb',imp:'fam-imp.glb',drake:'fam-drake.glb',trimaw:'named-trimaw.glb',sixseven:'named-sixseven.glb',mousetrap:'title-mousetrap.glb',firework:'title-firework.glb'};
const SPIN={firebow:.32,wisp:.4,imp:.36,drake:.34,trimaw:.3,sixseven:.3,mousetrap:.3,firework:.32};
const NAMES={firebow:['DRACONIC FIRE BOW',''],wisp:['WISP PROJECTILE',''],imp:['FIRE IMP',''],drake:['STORM DRAKE',''],trimaw:['TRIMAW','named mythic'],sixseven:['6/7','named mythic'],mousetrap:['THE IRON MOUSE TRAP','a trap for the Knight'],firework:['THE DRAKE POPPER','fireworks for the flyers']};
{ const css=document.createElement('style'); css.textContent='#start.art.stage{isolation:isolate;background:radial-gradient(ellipse 40% 60% at var(--tsx,82%) 50%,#4c515f 0%,#23262d 48%,#060607 100%),#000}'
  +'#start.stage::before{content:"";position:fixed;inset:0;z-index:-1;pointer-events:none;background:linear-gradient(180deg,#000b 0%,#0000 26%,#0000 62%,#000c 100%)}'
  +'#titleStage{position:fixed;inset:0;width:100%;height:100%;z-index:-2;pointer-events:none;opacity:0;transition:opacity .9s}#titleStage.on{opacity:1}'
  +'#titleMoniker{position:fixed;left:var(--tsx,82%);bottom:7%;transform:translateX(-50%);z-index:-1;pointer-events:none;text-align:center;opacity:0;transition:opacity .9s;white-space:nowrap}#titleMoniker.on{opacity:1}'
  +'#titleMoniker b{display:block;font:700 clamp(15px,2.1vw,26px)/1.1 "Cinzel Decorative",Georgia,serif;letter-spacing:.24em;color:#e8b94a;text-shadow:0 0 18px #000,0 0 10px #000,0 2px 0 #000}'
  +'#titleMoniker i{display:block;margin-top:5px;font:italic 13px Georgia,serif;letter-spacing:.14em;color:#b9a77c;text-shadow:0 0 8px #000,0 1px 0 #000}@media (max-width:759px){#titleMoniker{display:none}}';
  document.head.appendChild(css); }
st.classList.add('art','stage');   // the painting's text shadows and card backing (.art) with this file's black-and-spotlight background on top of it: no flash of a flat screen, no painting
let R=null, scene=null, cam=null, root=null, cv=null, mk=null, raf=0, loaded=false, model=null, RAD=1, T0=0, LOADING=false;
function ensure(){ if(R) return true; cv=document.createElement('canvas'); cv.id='titleStage'; st.insertBefore(cv,st.firstChild);
  try{ R=new THREE.WebGLRenderer({canvas:cv,antialias:true,alpha:true}); }catch(e){ cv.remove(); cv=null; R=null; return false; }
  R.setPixelRatio(Math.min(window.devicePixelRatio||1,1.5)); R.outputEncoding=THREE.sRGBEncoding; R.setClearColor(0x000000,0);
  scene=new THREE.Scene(); scene.add(new THREE.HemisphereLight(0xffffff,0x555566,1.15)); const key=new THREE.DirectionalLight(0xffffff,1.0); key.position.set(2,3,4); scene.add(key); const rim=new THREE.DirectionalLight(0xa8c8ff,.9); rim.position.set(-3,2,-4); scene.add(rim);
  cam=new THREE.PerspectiveCamera(30,1,.05,200); if(root) scene.add(root);
  mk=document.createElement('div'); mk.id='titleMoniker'; mk.innerHTML='<b></b><i></i>'; mk.querySelector('b').textContent=NAMES[want][0]; mk.querySelector('i').textContent=NAMES[want][1]; st.insertBefore(mk,cv.nextSibling);
  mk.classList.add('on');   // build 265 (Matt: "does it load in too?"): the name shows at once, so a slow load is a name on a black spotlight, not an empty screen; the model fades in when it lands
  if(loaded) cv.classList.add('on'); place(); return true; }
function place(){ if(!R) return; const w=Math.max(2,st.clientWidth||innerWidth), h=Math.max(2,st.clientHeight||innerHeight); R.setSize(w,h,false); cam.aspect=w/h; cam.updateProjectionMatrix();
  const th=Math.tan(cam.fov*Math.PI/360), dist=RAD/(th*Math.min(1,cam.aspect))/.56; cam.position.set(0,RAD*.12,dist); cam.lookAt(0,0,0);
  const sx=w>=1000?.82:w>=760?.74:.5; if(root) root.position.x=(sx*2-1)*th*dist*cam.aspect; st.style.setProperty('--tsx',(sx*100)+'%'); }
function load(){ if(LOADING||loaded) return; LOADING=true;
  fetchBytes(ASSET(FILES[want]),'soon').then(buf=>new Promise((res,rej)=>new THREE.GLTFLoader().parse(buf,'',res,rej))).then(g=>{ model=g.scene||g.scenes[0]; model.updateMatrixWorld(true);
    const box=new THREE.Box3().setFromObject(model), sz=box.getSize(new THREE.Vector3()), c=box.getCenter(new THREE.Vector3()); model.position.sub(c); RAD=Math.max(sz.x,sz.y,sz.z)/2*1.02;
    root=new THREE.Group(); root.add(model); if(scene) scene.add(root); loaded=true; place(); if(cv) cv.classList.add('on'); }).catch(e=>console.warn('title background',e)); }
function frame(now){ raf=requestAnimationFrame(frame); if(!loaded||!R||!root) return; if(!T0) T0=now; const t=(now-T0)/1000; root.rotation.y=t*SPIN[want]; model.position.y=Math.sin(t*.9)*RAD*.03; R.render(scene,cam); }
function start(){ if(raf||!ensure()) return; T0=0; raf=requestAnimationFrame(frame); load(); }
function stop(){ if(raf){ cancelAnimationFrame(raf); raf=0; } if(R){ if(root&&scene) scene.remove(root); R.dispose(); try{ R.forceContextLoss(); }catch(e){} R=null; } if(cv){ cv.remove(); cv=null; } if(mk){ mk.remove(); mk=null; } scene=null; cam=null; }
window.addEventListener('resize',()=>{ if(R) place(); });
setInterval(()=>{ const showing=!st.classList.contains('hide'); if(showing&&!raf) start(); else if(!showing&&(raf||R)) stop(); },400);
if(!st.classList.contains('hide')) start();
window.__titlestage={want,running:()=>!!raf,loaded:()=>loaded,canvas:()=>document.getElementById('titleStage'),moniker:()=>{ const e=document.getElementById('titleMoniker'); return e?{name:e.querySelector('b').textContent,sub:e.querySelector('i').textContent,on:e.classList.contains('on')}:null; },
  snapshot:()=>{ if(!R||!loaded) return null; R.render(scene,cam); const c2=document.createElement('canvas'); c2.width=R.domElement.width; c2.height=R.domElement.height; const g=c2.getContext('2d'); g.drawImage(R.domElement,0,0); const d=g.getImageData(0,0,c2.width,c2.height).data; let lit=0; for(let i=3;i<d.length;i+=4) if(d[i]>40) lit++; return {lit,total:d.length/4,w:c2.width,h:c2.height}; }};
})();
