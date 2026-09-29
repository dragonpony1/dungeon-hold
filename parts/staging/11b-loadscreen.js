// ===== THE LOADING SCREEN (build 277). Matt: "on the loading screen, i am not seeing it a lot, as of now its just fun pictures if you stay on the pick screen too long, but i want it to stay on the loading screen until
// its 90% loaded, give me the rotation and fun saying and quotes about my game from my mom and kids and employer". Until now there was no loading screen of its own: the title (the hero pick) came up at once and
// its one background (19b/20b) faded in behind it whenever its model landed. Now a full screen stands over the title from the first moment:
//   * THE ROTATION: the title's 3D backgrounds (the Draconic Fire Bow, the Wisp's projectile, the Fire Imp, the Storm Drake, the Trimaw, the 6/7), a new one every ROT_S seconds (build 280, Matt: "the images on the loading screen could stay longer make an even 10 seconds"), each slowly spinning on black
//     under a spotlight with its name beneath it (20b-titlestage.js's look). Each is fetched when its turn is near (fetchBytesNow: straight away, and not counted in the percentage -- it is the screen's own dressing).
//   * A LINE that changes every SAY_S seconds (build 279, Matt: "make those tips stay just 1-2 seconds longer": 7 s, was 5.5): fun sayings and tips (mine), and QUOTES about the game from Matt's family and his employer -- Matt's own words, filled in only as he sends them (never made up).
//   * A PROGRESS BAR: the share of every file the game has asked for that has landed (game.js LOADQ: asked/got, every tier, a failure counts as done so one bad file never holds the door).
//   * It stays until that share reaches 90% (and at least MIN_MS, so a cached visit still shows a line), then fades to the title. My call: once the essentials are in (the 'soon' tier: the hero, the hall, the
//     first mobs) a small "press any key to skip" appears, so a slow phone line never traps anyone; and a file that hangs can never hold it past the 'soon' tier plus 45 s.
// Its WebGL context is released when it closes, before the title's own background starts. Not in a browser a test drives (navigator.webdriver) unless ?loadscreen is on the address; not in the single-file build.
// Test hook: window.__loadscreen.
(function(){
const FORCE=Q.has('loadscreen');
window.__loadscreen={on:()=>false,frac:()=>1,line:()=>'',next:()=>{},model:()=>null,closed:()=>true,sayings:()=>[],quotes:()=>[]};
if(!HAS_ASSETS||(navigator.webdriver&&!FORCE)) return;
const MIN_MS=3500, ROT_S=10, SAY_S=7, GOAL=.9, HANG_MS=45000;
const MODELS=[{file:'bow-fire.glb',name:'DRACONIC FIRE BOW',sub:'',spin:.32},{file:'fam-wisp-projectile.glb',name:'WISP PROJECTILE',sub:'',spin:.4},{file:'fam-imp.glb',name:'FIRE IMP',sub:'',spin:.36},
  {file:'fam-drake.glb',name:'STORM DRAKE',sub:'',spin:.34},{file:'named-trimaw.glb',name:'TRIMAW',sub:'named mythic',spin:.3},{file:'named-sixseven.glb',name:'6/7',sub:'named mythic',spin:.3}];
const SAYINGS=[
  'Gnomes do not retreat. They relocate forward.',
  'The Heartroot remembers every goblin. Every single one.',
  'Tip: in co-op, tap Left Alt to spill your mana for a friend.',
  'Sludge jars clink. Legendary ones clink louder.',
  'A bramble hedge never forgives, and rarely forgets.',
  'Tip: wear three pieces of a set for its bonus, all five for its power.',
  'The forge is a gamble. The forge is always a gamble.',
  'Trolls throw rocks. Gnomes throw better rocks.',
  'Tip: an ogre always drops a Legendary sludge jar.',
  'No goblin has ever read the fine print on a pitfall.',
  'The raven sees everything. The raven judges nothing. Mostly.',
  'Tip: between waves, walk up to the portal and press E to visit your hideout.',
  'Somewhere beneath the Rootgate, something is counting crystals.',
  'Gnome Rangers: small, patient, extremely pointy.',
  'Tip: block a path with towers and the horde goes the long way round, if it can.',
  'Mythic odds: one drop in a hundred. Gnome confidence: total.'];
// Matt's family and his employer, in their own words -- {text, by}. Empty until Matt sends them; each one is shown between the sayings (every other line) once there are any.
const QUOTES=[];
const lines=[]; (function build(){ const s=SAYINGS.slice().sort(()=>Math.random()-.5), q=QUOTES.slice().sort(()=>Math.random()-.5); let qi=0; for(let i=0;i<s.length;i++){ lines.push({text:s[i]}); if(q.length&&i%2===1){ lines.push(q[qi%q.length]); qi++; } } if(!lines.length) lines.push({text:'Loading…'}); })();
// ---- the screen
const css=document.createElement('style'); css.textContent='#loadScreen{position:fixed;inset:0;z-index:70;background:radial-gradient(ellipse 42% 58% at 50% 44%,#4c515f 0%,#23262d 46%,#060607 100%),#000;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;padding-bottom:6vh;opacity:1;transition:opacity .8s;color:#f3ead6;font-family:Georgia,serif;overflow:hidden}'
  +'#loadScreen.out{opacity:0;pointer-events:none}#loadScreen canvas{position:absolute;inset:0;width:100%;height:100%;opacity:0;transition:opacity .7s;z-index:0}#loadScreen canvas.on{opacity:1}'
  +'#loadScreen .ls-title{position:absolute;top:5vh;left:0;right:0;text-align:center;font:700 clamp(30px,6vw,64px)/1 "Cinzel Decorative",Georgia,serif;letter-spacing:.14em;color:#e8b94a;text-shadow:0 0 22px #000,0 3px 0 #000;z-index:1}'
  +'#loadScreen .ls-name{position:relative;z-index:1;text-align:center;margin-bottom:3.2vh;opacity:0;transition:opacity .7s}#loadScreen .ls-name.on{opacity:1}#loadScreen .ls-name b{display:block;font:700 clamp(15px,2vw,24px)/1.1 "Cinzel Decorative",Georgia,serif;letter-spacing:.24em;color:#e8b94a;text-shadow:0 0 16px #000,0 2px 0 #000}#loadScreen .ls-name i{display:block;margin-top:4px;font:italic 13px Georgia,serif;letter-spacing:.14em;color:#b9a77c}'
  +'#loadScreen .ls-line{position:relative;z-index:1;max-width:min(760px,88vw);min-height:3.4em;text-align:center;font-size:clamp(16px,2vw,22px);line-height:1.4;text-shadow:0 2px 6px #000;opacity:0;transition:opacity .6s}#loadScreen .ls-line.on{opacity:1}#loadScreen .ls-line .by{display:block;margin-top:6px;font-size:.78em;font-style:italic;color:#e8b94a}'
  +'#loadScreen .ls-bar{position:relative;z-index:1;width:min(560px,80vw);height:14px;margin-top:2.4vh;border:2px solid #e8b94a;border-radius:9px;background:#0009;overflow:hidden;box-shadow:0 0 14px #000}#loadScreen .ls-fill{height:100%;width:0;background:linear-gradient(90deg,#b87a1c,#ffd27a);transition:width .35s}'
  +'#loadScreen .ls-pct{position:relative;z-index:1;margin-top:8px;font:700 14px "Cinzel Decorative",Georgia,serif;letter-spacing:.2em;color:#e8b94a;text-shadow:0 1px 3px #000}#loadScreen .ls-skip{position:relative;z-index:1;margin-top:6px;font-size:12px;letter-spacing:.12em;color:#b9a77c;opacity:0;transition:opacity .6s}#loadScreen .ls-skip.on{opacity:.9}';
document.head.appendChild(css);
const el=document.createElement('div'); el.id='loadScreen';
el.innerHTML='<div class="ls-title">ROOTGATE</div><div class="ls-name"><b></b><i></i></div><div class="ls-line"></div><div class="ls-bar"><div class="ls-fill"></div></div><div class="ls-pct">LOADING 0%</div><div class="ls-skip">press any key or click to skip</div>';
document.body.appendChild(el);
const nameEl=el.querySelector('.ls-name'), lineEl=el.querySelector('.ls-line'), fillEl=el.querySelector('.ls-fill'), pctEl=el.querySelector('.ls-pct'), skipEl=el.querySelector('.ls-skip');
const T_OPEN=performance.now(); let closed=false, li=-1, mi=-1, sayT=null, rotT=null, pollT=null, soonAt=null;
// ---- the 3D rotation (20b-titlestage.js's look: a spotlight, a key and a cool rim, the model spinning and bobbing)
let R=null, scene=null, cam=null, cv=null, raf=0, cur=null, RAD=1, T0=0; const CACHE={};
function ensure(){ if(R) return true; cv=document.createElement('canvas'); el.insertBefore(cv,el.firstChild);
  try{ R=new THREE.WebGLRenderer({canvas:cv,antialias:true,alpha:true}); }catch(e){ cv.remove(); cv=null; return false; }
  R.setPixelRatio(Math.min(window.devicePixelRatio||1,1.5)); R.outputEncoding=THREE.sRGBEncoding; R.setClearColor(0x000000,0);
  scene=new THREE.Scene(); scene.add(new THREE.HemisphereLight(0xffffff,0x555566,1.15)); const key=new THREE.DirectionalLight(0xffffff,1.0); key.position.set(2,3,4); scene.add(key); const rim=new THREE.DirectionalLight(0xa8c8ff,.9); rim.position.set(-3,2,-4); scene.add(rim);
  cam=new THREE.PerspectiveCamera(30,1,.05,200); place(); return true; }
function place(){ if(!R) return; const w=Math.max(2,innerWidth), h=Math.max(2,innerHeight); R.setSize(w,h,false); cam.aspect=w/h; cam.updateProjectionMatrix(); const th=Math.tan(cam.fov*Math.PI/360), dist=RAD/(th*Math.min(1,cam.aspect))/.42; cam.position.set(0,RAD*.1,dist); cam.lookAt(0,-RAD*.3,0); }   // about 42% of the screen tall, standing a little high so its name and the line below stay clear
function loadModel(i){ const M=MODELS[i]; if(CACHE[i]) return CACHE[i]; return CACHE[i]=fetchBytesNow(ASSET(M.file)).then(buf=>new Promise((res,rej)=>new THREE.GLTFLoader().parse(buf,'',res,rej))).then(g=>{ const m=g.scene||g.scenes[0]; m.updateMatrixWorld(true);
    const box=new THREE.Box3().setFromObject(m), sz=box.getSize(new THREE.Vector3()), c=box.getCenter(new THREE.Vector3()); m.position.sub(c); const root=new THREE.Group(); root.add(m); root.userData.rad=Math.max(sz.x,sz.y,sz.z)/2*1.02; root.userData.model=m; root.userData.y0=m.position.y; return root; }); }
function show(i){ if(closed) return; mi=i; const M=MODELS[i]; if(cv) cv.classList.remove('on'); nameEl.classList.remove('on');
  loadModel(i).then(root=>{ if(closed||mi!==i) return; setTimeout(()=>{ if(closed||mi!==i||!ensure()) return; if(cur) scene.remove(cur); cur=root; RAD=root.userData.rad; scene.add(cur); place(); T0=0;
    nameEl.querySelector('b').textContent=M.name; nameEl.querySelector('i').textContent=M.sub; nameEl.classList.add('on'); cv.classList.add('on'); if(!raf) raf=requestAnimationFrame(frame); },cv&&cur?450:0); }).catch(e=>console.warn('loading screen model',e));
  loadModel((i+1)%MODELS.length).catch(()=>{}); }   // the next one comes down while this one spins
function frame(now){ raf=requestAnimationFrame(frame); if(!R||!cur) return; if(!T0) T0=now; const t=(now-T0)/1000, M=MODELS[mi]; cur.rotation.y=t*(M?M.spin:.3); cur.userData.model.position.y=cur.userData.y0+Math.sin(t*.9)*RAD*.03; R.render(scene,cam); }
// ---- the line
function sayNext(){ if(closed) return; li=(li+1)%lines.length; const L=lines[li]; lineEl.classList.remove('on');
  setTimeout(()=>{ if(closed) return; lineEl.textContent=L.by?'“'+L.text+'”':L.text; if(L.by){ const b=document.createElement('span'); b.className='by'; b.textContent='— '+L.by; lineEl.appendChild(b); } lineEl.classList.add('on'); },li===0?0:450); }
// ---- the percentage, and closing
function frac(){ const a=LOADQ.asked.size, g=LOADQ.got.size; return a?Math.min(1,g/a):0; }
function poll(){ if(closed) return; const f=frac(), now=performance.now(); fillEl.style.width=(f*100).toFixed(1)+'%'; pctEl.textContent='LOADING '+Math.floor(f*100)+'%';
  if(LOADT.soon!==null&&soonAt===null){ soonAt=now; skipEl.classList.add('on'); }
  const enough=LOADQ.asked.size>=3&&f>=GOAL, hung=soonAt!==null&&now-soonAt>HANG_MS, all=LOADT.all!==null;
  const st=document.getElementById('start'); if(st&&st.classList.contains('hide')){ close('started'); return; }   // a game already under way (a co-op join link, a script) is never covered: play wins
  if(now-T_OPEN>=MIN_MS&&(enough||hung||all)) close(enough?'loaded':hung?'hung':'all'); }
let closeWhy=null;
function close(why){ if(closed) return; closed=true; closeWhy=why; clearInterval(sayT); clearInterval(rotT); clearInterval(pollT); fillEl.style.width=(frac()*100).toFixed(1)+'%'; el.classList.add('out');
  removeEventListener('keydown',skip,true); el.removeEventListener('pointerdown',skip);
  setTimeout(()=>{ if(raf){ cancelAnimationFrame(raf); raf=0; } if(R){ if(cur&&scene) scene.remove(cur); R.dispose(); try{ R.forceContextLoss(); }catch(e){} R=null; } if(cv){ cv.remove(); cv=null; } el.remove(); },850); }
function skip(e){ if(closed||soonAt===null) return; if(e&&e.type==='keydown'){ e.preventDefault(); e.stopPropagation(); } close('skipped'); }
addEventListener('keydown',skip,true); el.addEventListener('pointerdown',skip);
addEventListener('resize',()=>{ if(R) place(); });
sayNext(); show(Math.floor(Math.random()*MODELS.length));
sayT=setInterval(sayNext,SAY_S*1000); rotT=setInterval(()=>show((mi+1)%MODELS.length),ROT_S*1000); pollT=setInterval(poll,200); poll();
window.__loadscreen={on:()=>!closed,frac,line:()=>lineEl.textContent,next:sayNext,model:()=>mi>=0?MODELS[mi].name:null,closed:()=>closed,why:()=>closeWhy,shown:()=>!!(cur&&cv&&cv.classList.contains('on')),
  sayings:()=>SAYINGS.slice(),quotes:()=>QUOTES.slice(),lines:()=>lines.map(l=>l.by?l.text+' — '+l.by:l.text),skipReady:()=>soonAt!==null,counts:()=>({asked:LOADQ.asked.size,got:LOADQ.got.size})};
})();
