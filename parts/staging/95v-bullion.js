// ===== SIR BULLION, THE FEAST HALL'S BOSS (build 529 prep). Matt: "ok now the soup guy" -- the plan he approved: a soup golem out of the kitchen at the Feast Hall's last wave, a roll-out cinematic
// like Avery's with a freeze-frame and a title stamp -- his words, exactly: "Just when you thought you couldn't screw up miso soup" -- then a walk on the Heartroot punching what is in his way, scalding
// soup puddles from his slams, a boil-over at half health, and on his fall the whole Fire set and 30 Legendary jars. And, for this build: "we need a huge hearth at his end of the room" (56e3-feasthearth.js).
// The art: Matt's Meshy soup golem, rigged and animated (BoilOver, Attack, Run, Walk, Slam, Death), cut down by tools/glb-compact.mjs -> parts/assets/sir-bullion.glb. His music: "A Street in France"
// (Audio Hero, Matt's pick) -> parts/assets/music-bullion.mp3, from the cut through the fight.
//   * THE ROLL-OUT (wave 7, once a quarter of its queue is out; ~24 s on the wall clock, SPACE/ENTER skips after 1 s): the hall goes quiet and the letterbox comes in, the camera looks down the long hall
//     to the east end; finds the great hearth as the fire roars up and the cafe music starts; he lumbers out of the east doors beside it, sloshing; a big SLAM on the floor, soup everywhere; then a
//     BOIL-OVER -- steam, a roar, in the track's own hush -- FREEZE on the close-up, a flash, and the stamp slams on with the music's hit (60.9 s into the track); the camera swings back to the player.
//   * THE FIGHT: the game's own walker takes him down the hall to the Heartroot (smashing any tower that blocks his way, as the ogre does), and he punches the towers he passes and the heroes in his reach.
//     Every SLAM_CD seconds he SLAMS: a big scalding puddle in front of him and a ring of smaller ones round him. A puddle burns heroes and towers standing in it (never mobs) for its life, then dries.
//     At half health he BOILS OVER (steam, roar, shake) and is FURIOUS: he runs, and slams more often.
//   * HIS FALL: the Death clip, then he sinks into a great puddle of soup that steams and fades. Every piece of the Fire set (mythic; the weapon of the killer's own type) round the hero, 30 Legendary jars
//     (99g-sludgejars.js BOSS), a picture card: SIR BULLION FALLS. In co-op each player gets their own set on their own page (bullFall), the jars come from 99g's own per-guest roll.
// Only MAP.id==='feast', campaign. Test hook: window.__bullion.
(function(){
'use strict';
window.__bullion={ loaded:()=>false };
if(TUTORIAL||!MAP||MAP.id!=='feast') return;
const K='bullion';
MOBS[K]={ hp:3000, spd:1.5, dmg:26, cd:2.4, mana:150, detour:0, swingT:1.5, hitT:.8 };   // hitT is re-set from his Attack clip when it loads
MOBDIM[K]={ fit:5.4, h:5, r:1.0, nat:{ walk:.3, run:.52 } };   // nat: his walk at 1.5/s, his run at 1.5 x FURY
const FURY_SPD=1.7, SLAM_CD=[9,5.5], SLAM_FIRST=5, TOWER_PUNCH=2.2;
const SLAM_R=3.4, SLAM_HERO=22, SLAM_DEF=40;   // the slam's own blow, where it lands
const PUD={ life:6, tick:.5, hero:7, tower:10, big:2.6, small:1.9, ring:4.8 };   // a puddle: its life, how often it burns, the burn on a hero and on a tower, the big one's and the ring's sizes
const cnt={ intro:0, spawned:0, skipped:0, slams:0, puddles:0, heroBurn:0, towerBurn:0, mobBurn:0, towerPunch:0, heroPunch:0, boils:0, deaths:0, falls:0, guestFalls:0, guestFx:0, guestDies:0, stamps:0, musicAsks:0, unstuck:0 };
const isFeast=()=>!SURVIVAL&&MAP&&MAP.id==='feast';
const NET=()=>window.__net, isGuest=()=>{ const n=NET(); return !!(n&&n.role&&n.role()==='guest'); }, isHost=()=>{ const n=NET(); return !!(n&&n.role&&n.role()==='host'); };
const r2=v=>+(+v||0).toFixed(2), fin=v=>Number.isFinite(+v)&&Math.abs(+v)<1e4;
const tell=(k,d)=>{ try{ const n=NET(); if(isHost()&&n.peers&&n.peers().length) n.send('bullFx',Object.assign({ k },d)); }catch(er){} };
// ---------------------------------------------------------------- his model and his clips, fetched once from the map's fifth wave (or a dev-panel spawn)
const CL={}; let loadP=null;
let SLAM_HIT=1.1, BOIL_PEAK=1.9, DEATH_FALL=1.9;   // when his slam lands, when the boil-over is at its height, when he hits the floor -- read from the clips
if(typeof TRACKS!=='undefined') TRACKS.bullion='assets/music-bullion.mp3';
function parse(file){ return fetchBytes(ASSET(file)).then(buf=>new Promise((res,rej)=>new THREE.GLTFLoader().parse(buf,'',res,rej))); }
function load(){ if(loadP) return loadP; if(typeof musFetch==='function'&&typeof TRACKS!=='undefined'&&TRACKS.bullion) musFetch('bullion');   /* once: load() runs every frame from wave 5 (loadP guards it) */
  loadP=parse('sir-bullion.glb').then(gl=>{ const root=gl.scene||gl.scenes[0]; const fit=fitModel(root,MOBDIM[K].fit); toonify(root,fit.scale);
    for(const c of (gl.animations||[])) CL[c.name]=c; if(!CL.Walk) throw new Error('no Walk clip');
    let idle=null; try{ if(CL.Attack&&THREE.AnimationUtils&&THREE.AnimationUtils.subclip) idle=THREE.AnimationUtils.subclip(CL.Attack,'Idle',0,2,30); }catch(er){} CL.Idle=idle||CL.Walk;
    MOBGLB[K]={ wrap:fit.wrap, map:{ idle:CL.Idle, walk:CL.Walk, run:CL.Run||CL.Walk, attack:CL.Attack||CL.Walk, death:CL.Death||CL.Walk }, scale:fit.scale };
    try{ measure(fit.wrap); }catch(er){ console.warn('sir bullion clip timing',er); } timeline(); })
    .catch(e=>{ console.warn('sir bullion model',e); loadP=null; });
  return loadP; }
{ const prev=Meta.update; Meta.update=dt=>{ prev(dt); if(isFeast()&&S.wave>=5) load(); }; }
// the moments that matter in each clip, found by playing it on a copy: the slam's lowest fist, the attack's fastest fist, the boil-over's biggest splash, the death's lowest hips
const MEAS={};
function measure(wrap){ const g=cloneSkinned(wrap), mixer=new THREE.AnimationMixer(g); const find=re=>{ let o=null; g.traverse(n=>{ if(!o&&re.test(n.name)) o=n; }); return o; };
  const cl=find(/^Claw\W?_?L$/i), cr=find(/^Claw\W?_?R$/i), hips=find(/^Head$/i)||find(/^Hips$/i), spl=[]; g.traverse(n=>{ if(/^Soup_Splash/i.test(n.name)) spl.push(n); }); const v=new THREE.Vector3();
  const run=(clip,fn)=>{ mixer.stopAllAction(); const a=mixer.clipAction(clip); a.reset(); a.play(); const out=[]; for(let t=0;t<=clip.duration+1e-6;t+=1/30){ a.time=t; mixer.update(0); g.updateMatrixWorld(true); out.push([t,fn()]); } a.stop(); return out; };
  const low=()=>{ let y=1e9; for(const b of [cl,cr]) if(b){ b.getWorldPosition(v); y=Math.min(y,v.y); } return y; };
  if(CL.Slam&&(cl||cr)){ const s=run(CL.Slam,low); let best=s[0]; for(const p of s) if(p[0]>.3&&p[1]<best[1]) best=p; SLAM_HIT=best[0]; MEAS.slam=+best[0].toFixed(2); }
  if(CL.Attack&&(cl||cr)){ const pos=run(CL.Attack,()=>{ const o=[]; for(const b of [cl,cr]) if(b){ b.getWorldPosition(v); o.push(v.clone()); } return o; }); let bs=0, bt=.8;
    for(let i=1;i<pos.length;i++){ let sp=0; pos[i][1].forEach((p,k)=>{ sp=Math.max(sp,p.distanceTo(pos[i-1][1][k])); }); if(sp>bs&&pos[i][0]>.2){ bs=sp; bt=pos[i][0]; } }
    MOBS[K].hitT=Math.max(.3,Math.min(MOBS[K].swingT-.1,bt*MOBS[K].swingT/CL.Attack.duration)); MEAS.attack=+bt.toFixed(2); }
  if(CL.BoilOver&&spl.length){ const s=run(CL.BoilOver,()=>spl.reduce((a,n)=>{ n.getWorldPosition(v); return a+n.scale.x*10+Math.max(0,v.y); },0)); let best=s[0]; for(const p of s) if(p[1]>best[1]) best=p; BOIL_PEAK=Math.max(1,Math.min(CL.BoilOver.duration-.1,best[0])); MEAS.boil=+best[0].toFixed(2); }
  if(CL.Death&&hips){ const s=run(CL.Death,()=>{ hips.getWorldPosition(v); return v.y; }); const y0=s[0][1], y1=Math.min(...s.map(p=>p[1])); const p=y0-y1>.3?s.find(q=>q[1]<=y0-(y0-y1)*.85):null; DEATH_FALL=p&&p[0]>.3?p[0]:CL.Death.duration*.55; MEAS.death=+DEATH_FALL.toFixed(2); MEAS.deathDrop=+(y0-y1).toFixed(2); }
  mixer.stopAllAction(); }
// a clip of his own (slam, boil-over) held for its length: the game's own mobPlay waits till it is done
function playClip(m,name,o){ o=o||{}; const clip=CL[name]; if(!clip||!m||!m.mixer) return null; const a=m.mixer.clipAction(clip); a.reset(); a.enabled=true; a.setLoop(o.loop?THREE.LoopRepeat:THREE.LoopOnce,o.loop?Infinity:1); a.clampWhenFinished=!o.loop;
  a.timeScale=o.speed||1; a.setEffectiveWeight(1); const prev=m.cur; a.play(); if(prev&&prev!==a) a.crossFadeFrom(prev,o.fade!==undefined?o.fade:.18,false); m.cur=a; m.bullHoldT=o.loop?0:Math.max(0,clip.duration/(o.speed||1)-.15); return a; }
{ const prev=mobPlay; mobPlay=function(m,name){ if(m&&m.bullHoldT>0&&name!=='death') return; return prev.apply(this,arguments); }; }
// ---------------------------------------------------------------- soup: steam puffs, droplets and the scalding puddles (pooled)
const softTex=(()=>{ const c=document.createElement('canvas'); c.width=c.height=64; const x=c.getContext('2d'); const r=x.createRadialGradient(32,32,0,32,32,32); r.addColorStop(0,'rgba(255,255,255,.95)'); r.addColorStop(.45,'rgba(255,255,255,.4)'); r.addColorStop(1,'rgba(255,255,255,0)'); x.fillStyle=r; x.fillRect(0,0,64,64); return new THREE.CanvasTexture(c); })();
const dropTex=(()=>{ const c=document.createElement('canvas'); c.width=c.height=32; const x=c.getContext('2d'); x.fillStyle='#d8782a'; x.beginPath(); x.arc(16,16,13,0,TAU); x.fill(); x.fillStyle='#ffd090'; x.beginPath(); x.arc(11,11,4,0,TAU); x.fill(); const t=new THREE.CanvasTexture(c); t.encoding=THREE.sRGBEncoding; return t; })();
const pudTex=(()=>{ const c=document.createElement('canvas'); c.width=c.height=256; const x=c.getContext('2d');
  const blob=(cx,cy,r,col)=>{ const g=x.createRadialGradient(cx,cy,r*.2,cx,cy,r); g.addColorStop(0,col); g.addColorStop(.75,col); g.addColorStop(1,'rgba(120,52,12,0)'); x.fillStyle=g; x.beginPath(); x.arc(cx,cy,r,0,TAU); x.fill(); };
  blob(128,128,112,'rgba(196,104,36,.95)'); for(let i=0;i<9;i++){ const a=i/9*TAU+.3, d=70+(i%3)*12; blob(128+Math.cos(a)*d,128+Math.sin(a)*d,34+(i%4)*7,'rgba(186,96,32,.92)'); }
  const g2=x.createRadialGradient(128,128,10,128,128,96); g2.addColorStop(0,'rgba(255,190,110,.75)'); g2.addColorStop(1,'rgba(255,170,80,0)'); x.fillStyle=g2; x.beginPath(); x.arc(128,128,96,0,TAU); x.fill();
  for(let i=0;i<12;i++){ const a=Math.random()*TAU, d=Math.random()*80; x.save(); x.translate(128+Math.cos(a)*d,128+Math.sin(a)*d); x.rotate(Math.random()*PI); x.fillStyle='#fff8ec'; x.fillRect(-7,-7,14,14); x.fillStyle='#e8dcc8'; x.fillRect(-7,4,14,3); x.restore(); }   // tofu
  for(let i=0;i<22;i++){ const a=Math.random()*TAU, d=Math.random()*88; x.fillStyle=i%3?'#5aa83a':'#86c84a'; x.beginPath(); x.ellipse(128+Math.cos(a)*d,128+Math.sin(a)*d,7,2.6,Math.random()*PI,0,TAU); x.fill(); }   // spring onion
  const t=new THREE.CanvasTexture(c); t.encoding=THREE.sRGBEncoding; return t; })();
const FX=[];   // { s, x,y,z, vx,vy,vz, g, t, life, s0, s1, op, kind }
function sprite(tex,col,normal){ const s=new THREE.Sprite(new THREE.SpriteMaterial({ map:tex, color:C(col), transparent:true, depthWrite:false, blending:normal?THREE.NormalBlending:THREE.AdditiveBlending })); s.userData.noOL=true; return s; }
function fx(kind,x,y,z,vx,vy,vz,life,s0,s1,op,col){ let f=FX.find(q=>!q.on&&q.kind===kind); if(!f){ if(FX.length>220) return null; f={ kind, s:kind==='steam'?sprite(softTex,0xf4ece4,true):sprite(dropTex,0xffffff,true) }; FX.push(f); scene.add(f.s); }
  Object.assign(f,{ on:true, x,y,z,vx,vy,vz,t:0,life,s0,s1,op, g:kind==='drop'?-16:0 }); f.s.visible=true; if(col!==undefined) f.s.material.color.copy(C(col)); f.s.scale.setScalar(s0); f.s.position.set(x,y,z); return f; }
const puff=(x,y,z,big)=>fx('steam',x+(Math.random()-.5)*.6,y,z+(Math.random()-.5)*.6,(Math.random()-.5)*.6,1.2+Math.random()*1.2,(Math.random()-.5)*.6,1.6+Math.random()*.9,big?1.4:.7,big?4.2:2.4,big?.55:.4,0xf4ece4);
function splash(x,y,z,n,spd){ for(let i=0;i<n;i++){ const a=Math.random()*TAU, s=(spd||5)*(.4+Math.random()*.8); fx('drop',x,y+.3,z,Math.cos(a)*s,4+Math.random()*6,Math.sin(a)*s,1.4,.28+Math.random()*.2,.2,1); } for(let i=0;i<Math.ceil(n/4);i++) puff(x+(Math.random()-.5)*2,y+.4,z+(Math.random()-.5)*2,true); }
function updFx(dt){ for(const f of FX){ if(!f.on) continue; f.t+=dt; if(f.t>=f.life){ f.on=false; f.s.visible=false; continue; } const k=f.t/f.life;
    f.vy+=f.g*dt; if(f.kind==='steam'){ f.vy*=1-dt*.6; f.vx*=1-dt*.8; f.vz*=1-dt*.8; } f.x+=f.vx*dt; f.y+=f.vy*dt; f.z+=f.vz*dt;
    if(f.kind==='drop'){ const fl=baseFloor(f.x,f.z)+.25; if(f.y<fl){ f.y=fl; f.vx=f.vz=f.vy=0; f.g=0; } }
    f.s.position.set(f.x,f.y,f.z); f.s.scale.setScalar(f.s0+(f.s1-f.s0)*k); f.s.material.opacity=f.kind==='steam'?f.op*Math.sin(k*PI):f.op*(k<.8?1:(1-k)/.2); } }
// the puddles
const PUDS=[];
function pudMesh(){ const g=new THREE.Group(); const disc=M(new THREE.CircleGeometry(1,32),new THREE.MeshBasicMaterial({ map:pudTex, transparent:true, depthWrite:false, polygonOffset:true, polygonOffsetFactor:-3, polygonOffsetUnits:-3 }));
  disc.rotation.x=-PI/2; disc.userData.noOL=true; disc.renderOrder=2; g.add(disc); const bub=[]; for(let k=0;k<4;k++){ const b=M(G.sph(.13,8,6),basic(0xf6b868)); b.userData.noOL=true; g.add(b); bub.push({ b, t:Math.random(), x:0, z:0 }); }
  g.userData.noOL=true; scene.add(g); return { g, disc, bub }; }
function addPuddle(x,z,r,o){ o=o||{}; let p=PUDS.find(q=>!q.on); if(!p){ p=pudMesh(); PUDS.push(p); } const y=baseFloor(x,z)+.24;
  Object.assign(p,{ on:true, x,z,y,r,t:0,life:o.life||PUD.life,grow:o.grow||.3,hot:!o.cosmetic,tick:PUD.tick*.5,steamT:0 }); p.g.visible=true; p.g.position.set(x,y,z); p.g.rotation.y=Math.random()*TAU; p.g.scale.setScalar(.01); p.disc.material.opacity=1; cnt.puddles++; return p; }
const allHeroes=()=>[{ x:hero.x, y:hero.y, z:hero.z, isDead:()=>hero.dead>0, hurt:hurtHero }].concat(Meta.heroes?Meta.heroes():[]);
function burn(p){ for(const h of allHeroes()){ if(h.isDead()) continue; if(Math.hypot(h.x-p.x,h.z-p.z)<=p.r+.3&&Math.abs((h.y||0)-(p.y-.24))<1.6){ h.hurt(PUD.hero); cnt.heroBurn++; } }
  for(const d of defs.slice()){ if(d.kind==='perch') continue; if(Math.hypot(d.x-p.x,d.z-p.z)<=p.r+.5&&Math.abs((d.base||0)-(p.y-.24))<1.6){ hurtDef(d,PUD.tower); cnt.towerBurn++; } } }   // mobs never: the soup is his
function updPuddles(dt,live){ for(const p of PUDS){ if(!p.on) continue; p.t+=dt; if(p.t>=p.life){ p.on=false; p.g.visible=false; continue; }
    const s=p.r*Math.min(1,1-Math.pow(1-Math.min(1,p.t/p.grow),3)); p.g.scale.set(s,1,s); p.disc.material.opacity=p.t>p.life-1.2?Math.max(0,(p.life-p.t)/1.2):1;
    for(const b of p.bub){ b.t+=dt; if(b.t>1){ b.t=0; const a=Math.random()*TAU, r=Math.random()*.75; b.x=Math.cos(a)*r; b.z=Math.sin(a)*r; } b.b.position.set(b.x,.05,b.z); b.b.scale.set(1/Math.max(s,.01)*Math.max(.01,Math.sin(b.t*PI)),Math.max(.01,Math.sin(b.t*PI)),1/Math.max(s,.01)*Math.max(.01,Math.sin(b.t*PI))); }
    p.steamT-=dt; if(p.steamT<=0&&p.t<p.life-1){ p.steamT=.3+Math.random()*.25; const a=Math.random()*TAU, r=Math.random()*p.r*.8; puff(p.x+Math.cos(a)*r,p.y+.1,p.z+Math.sin(a)*r,p.r>3); }
    if(live&&p.hot){ p.tick-=dt; if(p.tick<=0){ p.tick=PUD.tick; burn(p); } } } }
// ---------------------------------------------------------------- his slam and his boil-over
const fwd=yaw=>[Math.sin(yaw),Math.cos(yaw)];
const floorOk=(x,z)=>{ const t=gat(wc(x),wcz(z)); return walk(t)&&!MOBBLOCK[idx(wc(x),wcz(z))]; };
function slamPuddles(x,z,yaw,phase){ const [fx_,fz_]=fwd(yaw), cx=x+fx_*2.6, cz=z+fz_*2.6, out=[]; if(floorOk(cx,cz)) out.push([cx,cz,PUD.big]);
  const n=phase===2?4:3; for(let k=0;k<n;k++){ const a=yaw+PI/n+k/n*TAU, px=x+Math.sin(a)*PUD.ring, pz=z+Math.cos(a)*PUD.ring; if(floorOk(px,pz)) out.push([px,pz,PUD.small]); } return out; }
function drawPuddles(list,o){ for(const [x,z,r] of list){ addPuddle(x,z,r,o); splash(x,baseFloor(x,z),z,r>2?16:9,r>2?6:4); } }
function slamLand(e,cosmetic){ const list=slamPuddles(e.x,e.z,e.yaw,e.phase||1); drawPuddles(list,{ cosmetic });
  camShake=Math.max(camShake,.8); try{ SFX.thud&&SFX.thud(); }catch(er){} try{ noise(.5,.12,700); }catch(er){}
  if(cosmetic) return list; const [fx_,fz_]=fwd(e.yaw), cx=e.x+fx_*2.6, cz=e.z+fz_*2.6;
  for(const h of allHeroes()){ if(h.isDead()) continue; const dx=h.x-cx, dz=h.z-cz, d=Math.hypot(dx,dz); if(d<=SLAM_R){ h.hurt(SLAM_HERO); } }
  { const dx=hero.x-cx, dz=hero.z-cz, d=Math.hypot(dx,dz); if(hero.dead<=0&&d<=SLAM_R&&d>.01){ for(let i=0;i<6;i++) moveCircle(hero,dx/d*.5,dz/d*.5,.42,true); } }
  for(const d of defs.slice()) if(Math.hypot(d.x-cx,d.z-cz)<=SLAM_R&&d.kind!=='perch') hurtDef(d,SLAM_DEF);
  tell('pud',{ a:list.map(q=>q.map(r2)) }); return list; }
function startSlam(e){ const sp=e.phase===2?1.25:1; e.special={ k:'slam', t:0, dur:(CL.Slam?CL.Slam.duration:2.5)/sp, hit:SLAM_HIT/sp, yaw:e.yaw, landed:false }; playClip(e.mdl,'Slam',{ speed:sp, fade:.15 }); e.slamCd=SLAM_CD[(e.phase||1)-1]; cnt.slams++;
  tell('slam',{ id:e.__coopId||null, sp }); }
function headY(o){ return (o.y!==undefined?o.y:baseFloor(o.x,o.z))+MOBDIM[K].h*.82; }
function steamBurst(x,y,z,n){ for(let i=0;i<n;i++) fx('steam',x+(Math.random()-.5)*1.6,y+Math.random()*.8,z+(Math.random()-.5)*1.6,(Math.random()-.5)*4,3+Math.random()*4,(Math.random()-.5)*4,1.8+Math.random(),1.6,6.5,.75,0xf6efe8); splash(x,y-.6,z,18,5); }
function roar(){ try{ if(!(typeof playSample==='function'&&playSample('cyclopsRoar',.6,.82))) SFX.roar&&SFX.roar(); }catch(er){} try{ noise(1.4,.09,2600); }catch(er){} }
const FURY_CARD=['♨️ SIR BULLION ♨️','💢 🏃💨 · 💥💥'];
function boilOver(e){ e.phase=2; e.spd=(e.spd0||e.spd)*FURY_SPD; e.special={ k:'boil', t:0, dur:(CL.BoilOver?CL.BoilOver.duration:3), yaw:e.yaw }; playClip(e.mdl,'BoilOver',{ fade:.15 }); cnt.boils++;
  steamBurst(e.x,headY(e),e.z,22); roar(); camShake=Math.max(camShake,1); banner(FURY_CARD[0],FURY_CARD[1]); e.slamCd=Math.min(e.slamCd,3.5); tell('boil',{ id:e.__coopId||null, x:r2(e.x), y:r2(headY(e)), z:r2(e.z) }); }
// ---------------------------------------------------------------- the boss bar (soup-coloured, a line at half)
{ const st=document.createElement('style'); st.textContent='#bullbar{position:fixed;left:50%;top:66px;transform:translateX(-50%);width:min(480px,76vw);z-index:20;text-align:center;pointer-events:none;display:none;font:bold 14px Georgia,serif;color:#ffe0b8;text-shadow:0 2px 3px #000;letter-spacing:3px}'
  +'#bullbar .track{position:relative;height:13px;margin-top:3px;background:#1e1008;border:2px solid #6a3a14;border-radius:7px;overflow:hidden;box-shadow:0 0 12px #ff8a2a55}#bullbar .fill{display:block;height:100%;background:linear-gradient(90deg,#8a3a10,#e07a2a,#ffc070);transition:width .2s}'
  +'#bullbar .half{position:absolute;left:50%;top:0;bottom:0;width:2px;background:#fff1c8}'
  +'#bullcut{position:fixed;inset:0;z-index:60;pointer-events:none;display:none}#bullcut .flash{position:absolute;inset:0;background:#fff4e0;opacity:0}'
  +'#bullcut .stamp{position:absolute;left:50%;top:71%;transform:translate(-50%,-50%) rotate(6deg) scale(3);opacity:0;text-align:center;width:min(1100px,94vw)}'
  +'#bullcut .stamp b{display:block;white-space:nowrap;font:900 clamp(54px,9.5vw,138px) Georgia,serif;color:#ffb347;-webkit-text-stroke:3px #5a2406;text-shadow:0 0 30px #ff8a2a,0 8px 0 #4a1c04;letter-spacing:5px}'
  +'#bullcut .stamp i{display:block;margin-top:8px;font:italic 700 clamp(18px,2.5vw,34px) Georgia,serif;color:#fff1dc;text-shadow:0 3px 6px #000,0 0 14px #ff8a2a88}'
  +'#bullcut .bclb{position:absolute;left:0;right:0;height:0;background:#000;transition:height .6s ease}#bullcut.on .bclb{height:11vh}#bullcut .bclb-t{top:0}#bullcut .bclb-b{bottom:0}'
  +'#bullcut .skip{position:absolute;right:18px;bottom:calc(11vh + 10px);font:13px Georgia;color:#e8c8a0;opacity:.7}'
  +'body.bullion-cut #hud,body.bullion-cut #hotbar,body.bullion-cut #banner,body.bullion-cut #toast,body.bullion-cut #prompt,body.bullion-cut #minimap,body.bullion-cut #bullbar,body.bullion-cut #defcard,body.bullion-cut #herostats,body.bullion-cut #pickcard,body.bullion-cut #ov,body.bullion-cut #btns,body.bullion-cut #wavebtn,body.bullion-cut #mmWave,body.bullion-cut #loadctr,body.bullion-cut #buffbar{visibility:hidden!important}'
  +'#bullfall{position:fixed;left:50%;top:21%;transform:translate(-50%,-50%) scale(.6);z-index:40;pointer-events:none;opacity:0;transition:opacity .35s,transform .35s cubic-bezier(.2,1.6,.4,1);text-align:center;padding:14px 26px 16px;border-radius:16px;background:radial-gradient(circle at 50% 0,#5a2a0c,#1e0e06 75%);border:3px solid #e0a040;box-shadow:0 0 0 2px #000,0 0 40px #ff8a2a88}'
  +'#bullfall.on{opacity:1;transform:translate(-50%,-50%) scale(1)}#bullfall .ic{font-size:54px;line-height:1;filter:drop-shadow(0 4px 6px #000)}#bullfall b{display:block;margin:4px 0 10px;font:900 clamp(26px,3.6vw,44px) Georgia,serif;color:#ffc060;letter-spacing:3px;text-shadow:0 3px 0 #4a1c04,0 0 18px #ff8a2a}'
  +'#bullfall .row{display:flex;gap:8px;justify-content:center;align-items:center}#bullfall .t{width:58px;height:58px;border-radius:9px;border:2px solid #ff8a3a;background:#2a1208 center/cover no-repeat;box-shadow:0 0 10px #ff6a1a88;display:flex;align-items:center;justify-content:center;font-size:30px}'
  +'#bullfall .j{display:flex;align-items:center;gap:4px;margin-left:8px;font:900 26px Georgia,serif;color:#ffd060;text-shadow:0 2px 0 #000}#bullfall .j img{width:46px;height:46px;object-fit:contain}';
  document.head.appendChild(st); }
const bar=document.createElement('div'); bar.id='bullbar'; bar.innerHTML='🍲 SIR BULLION 🍲<div class="track"><i class="fill"></i><span class="half"></span></div>'; document.body.appendChild(bar);
const STAMP_TITLE='SIR BULLION', STAMP_LINE="Just when you thought you couldn't screw up miso soup";   // Matt's words, exactly
const cutEl=document.createElement('div'); cutEl.id='bullcut'; cutEl.innerHTML='<div class="bclb bclb-t"></div><div class="bclb bclb-b"></div><div class="flash"></div><div class="stamp"><b></b><i></i></div><div class="skip">SPACE to skip ▸▸</div>';
cutEl.querySelector('.stamp b').textContent=STAMP_TITLE; cutEl.querySelector('.stamp i').textContent=STAMP_LINE; document.body.appendChild(cutEl);
const fallEl=document.createElement('div'); fallEl.id='bullfall'; const ART='assets/item-lava-', JAR='hideout/assets/hideout/items/legendary_sludge.png';
fallEl.innerHTML='<div class="ic">🍲</div><b>SIR BULLION FALLS</b><div class="row">'+[['sword','⚔️'],['armor','🛡️'],['amulet','📿'],['',"🔥"],['charm','💍']].map(([a,em])=>'<span class="t"'+(a?' style="background-image:url('+ART+a+'.jpg)"':'')+'>'+(a?'':em)+'</span>').join('')
  +'<span class="j"><img src="'+JAR+'" alt="" onerror="this.outerHTML=\'🫙\'">×30</span></div>'; document.body.appendChild(fallEl);
let fallT=0; function fallCard(){ fallEl.classList.add('on'); fallT=5.5; cnt.falls++; }
// ---------------------------------------------------------------- THE ROLL-OUT
const P=(cx,cz,y)=>({ x:cw(cx), y:y||0, z:cwz(cz) });
const START=P(48.6,13), STOP=P(44.2,13.4), YAW_IN=-PI/2;   // out of the east doors, beside the hearth, facing down the hall
const MUS_HIT=60.9, T_MUSIC=1.6;   // the track's hush (59.2-60.85 s) and its hit: the stamp lands on it
const T_HALL=3.2, T_HEARTH=7.0, T_WALK=13.2, HOLD=7.6, SWING=2.3;   // build 530 (Matt: "just needs a few more seconds maye 5 just stay there and let them read"): the stamp holds 7.6 s (was 2.6)
let TL=null;
function timeline(){ const slamDur=CL.Slam?CL.Slam.duration:2.53, boilDur=CL.BoilOver?CL.BoilOver.duration:3.03; const SLAM0=T_WALK+.15, SLAM1=SLAM0+slamDur, STAMP=Math.max(SLAM1+BOIL_PEAK-.15,16.5);
  const BOIL0=STAMP-BOIL_PEAK; TL={ SLAM0, SLAM1, BOIL0, STAMP, SWING0:STAMP+HOLD, END:STAMP+HOLD+SWING, boilDur }; return TL; }
timeline();
let waveTotal=0, done=false, cut=null, bull=null, inSpawn=false, cutReal=0, stampAt=0;
{ const prev=startWave; startWave=function(){ prev(); if(isFeast()&&S.wave===MAP.waves) waveTotal=spawnQ.length; }; }
{ const prev=updateWave; updateWave=function(dt){ if(isFeast()&&!done&&S.phase==='wave'&&S.wave===MAP.waves&&waveTotal>0&&MOBGLB[K]&&waveTotal-spawnQ.length>=Math.max(1,Math.floor(waveTotal*.25))) startCut(); prev(dt); }; }
function spawnBull(){ const lk=LANES.E?'E':Object.keys(LANES)[0]; inSpawn=true; let e=null; try{ e=spawnEnemy(K,lk); } finally { inSpawn=false; } if(!e) return null;
  e.pop=1; e.x=START.x; e.z=START.z; e.y=baseFloor(e.x,e.z); e.yaw=YAW_IN; e.spd0=e.spd; e.phase=1; e.slamCd=SLAM_FIRST; e.atk=1; e.bull=true;
  e.mdl.g.position.set(e.x,e.y,e.z); e.mdl.g.rotation.y=e.yaw; e.mdl.g.scale.setScalar(e.sc); cnt.spawned++; return e; }
function musicOn(late){ cnt.musicAsks++; if(typeof TRACKS!=='undefined'&&TRACKS.bullion){ window.__musStart=window.__musStart||{}; window.__musStart.bullion=()=>cut&&!late?MUS_HIT-(TL.STAMP-cut.t):MUS_HIT+(stampAt?(performance.now()-stampAt)/1000:0); setMusic('bullion'); } }
function beginCut(e){ timeline(); bull=e; bull.cutPh=-1; stampAt=0; cut={ t:0, cam:camera.position.clone(), q:camera.quaternion.clone(), shake:0, music:false, look:null };
  cutEl.style.display='block'; cutEl.classList.remove('on'); void cutEl.offsetWidth; cutEl.classList.add('on'); const st=cutEl.querySelector('.stamp'); st.style.cssText=''; cutEl.querySelector('.flash').style.opacity='0'; document.body.classList.add('bullion-cut');
  try{ setMusic('none'); }catch(er){} const m=bull.mdl; m.mixer.stopAllAction(); m.cur=null; m.bullHoldT=0; }
function startCut(){ if(isGuest()) return guestCut(); if(cut) return; done=true; cnt.intro++; const e=spawnBull(); if(!e) return; try{ if(isHost()) NET().send('bullCut',{}); }catch(er){} beginCut(e); }
function endCut(){ cutReal=0; if(!cut) return; const c=cut; camera.position.copy(c.cam); camera.quaternion.copy(c.q); cut=null; try{ if(isHost()) NET().send('bullCutEnd',{}); }catch(er){}
  cutEl.style.display='none'; cutEl.classList.remove('on'); document.body.classList.remove('bullion-cut'); toBattle(); const H=window.__feastHearth; if(H&&H.flare) H.flare(0);
  if(bull){ const m=bull.mdl; if(m&&m.mixer){ m.mixer.stopAllAction(); m.cur=null; m.bullHoldT=0; }
    if(bull.guestFake){ scene.remove(m.g); } else if(!bull.dead){ bull.x=STOP.x; bull.z=STOP.z; bull.yaw=YAW_IN; bull.atk=1; bull.slamCd=SLAM_FIRST; } }
  if(bull&&bull.mdl&&!bull.guestFake) bull.mdl.g.visible=true; bull=null; if(window.__mobsync&&window.__mobsync.each) window.__mobsync.each(p=>{ if(p.kind===K&&p.mdl) p.mdl.g.visible=true; });
  if(!(typeof musicMode!=='undefined'&&musicMode==='bullion')) musicOn(true); banner('🍲 SIR BULLION 🍲','♨️ 🥣 ♨️'); camShake=Math.max(camShake,.5); }
// the dev panel's Spawn (bullion) brings him in the way the wave does: the whole roll-out, then the fight
{ const prev=spawnEnemy; spawnEnemy=function(kind){ if(kind!==K||inSpawn) return prev.apply(this,arguments); if(cut) return bull&&!bull.guestFake?bull:null;
    if(MOBGLB[K]){ startCut(); return enemies.find(x=>x.kind===K&&!x.dead)||null; } toast('🍲 …'); load().then(()=>{ if(MOBGLB[K]&&!cut) startCut(); }); return null; }; }
// SPACE or ENTER skips, never a held key, not in the first second (Avery's rule, build 478)
addEventListener('keydown',ev=>{ if(!cut) return; if((ev.code==='Space'||ev.code==='Enter'||ev.code==='NumpadEnter')&&!ev.repeat&&cut.t>1&&cut.t<TL.END-.5){ cut.t=TL.END-.5; cut.skipped=true; cnt.skipped++; } },true);
const ease=k=>{ k=Math.max(0,Math.min(1,k)); return k*k*(3-2*k); };
const lerp3=(a,b,k)=>[a[0]+(b[0]-a[0])*k,a[1]+(b[1]-a[1])*k,a[2]+(b[2]-a[2])*k];
const W3=(cx,cz,y)=>[cw(cx),y,cwz(cz)];
function camShot(from,to,k,look){ const p=lerp3(from,to,ease(k)), s=cut.shake*.35; camera.position.set(p[0]+(Math.random()-.5)*s,p[1]+(Math.random()-.5)*s,p[2]+(Math.random()-.5)*s); camera.lookAt(look[0],look[1],look[2]); }
function enter(b,ph){ if(b.cutPh>=ph) return false; b.cutPh=ph; return true; }
function stepCut(dt){ const c=cut, T=TL; c.t+=dt; const t=c.t, b=bull; if(!b) return endCut(); const m=b.mdl, H=window.__feastHearth; c.shake=Math.max(0,c.shake-dt*1.8);
  const frozen=t>=T.STAMP&&t<T.SWING0+.05;
  // where he is: behind the doors, walking out, then standing at STOP for the slam and the boil
  const w0=T_HEARTH+.3, w1=T_WALK-.1, kw=Math.max(0,Math.min(1,(t-w0)/(w1-w0)));
  b.x=START.x+(STOP.x-START.x)*kw; b.z=START.z+(STOP.z-START.z)*kw; b.y=baseFloor(b.x,b.z); b.yaw=YAW_IN; m.g.position.set(b.x,b.y,b.z); m.g.rotation.y=b.yaw; m.g.scale.setScalar(b.sc||m.g.scale.x); m.g.visible=t>=T_HEARTH-.1;   /* kept out of sight in the dark doorway until the camera turns to it */
  if(t>=w0&&t<w1&&enter(b,1)){ const a=playClip(m,'Walk',{ loop:true, speed:1.15, fade:.1 }); }
  if(t>=T.SLAM0&&t<T.SLAM1&&enter(b,2)) playClip(m,'Slam',{ fade:.2 });
  if(t>=T.SLAM0+SLAM_HIT&&t<T.BOIL0&&!c.slammed){ c.slammed=true; b.phase=1; slamLand(b,true); c.shake=1.2; }
  if(t>=T.BOIL0&&t<T.STAMP&&enter(b,3)){ playClip(m,'BoilOver',{ fade:.25 }); c.boilT=0; }
  if(t>=T.BOIL0&&t<T.STAMP){ c.boilT=(c.boilT||0)+dt; if(c.boilT>.35&&!c.roared){ c.roared=true; roar(); c.shake=1; steamBurst(b.x,headY(b),b.z,26); } if(Math.random()<dt*14) puff(b.x+(Math.random()-.5)*2,headY(b)+.3,b.z+(Math.random()-.5)*2,true); }
  if(t>=w0&&t<w1&&Math.random()<dt*5){ const a=Math.random()*TAU; fx('drop',b.x+Math.cos(a)*1.1,b.y+2.6+Math.random(),b.z+Math.sin(a)*1.1,Math.cos(a)*.8,1.5,Math.sin(a)*.8,1.2,.24,.18,1); }   // sloshing
  if(!frozen){ m.mixer.update(dt); updFx(dt); updPuddles(dt,false); }
  // the music: a hush, then the cafe as the camera finds the hearth
  if(t>=T_MUSIC&&!c.music){ c.music=true; musicOn(false); }
  // the hearth roars up as the camera finds it
  if(H&&H.flare){ if(t>=T_HALL+.7&&t<T_WALK) H.flare(1); else if(t>=T_WALK) H.flare(.35); }
  const fire=H&&H.fire?[H.fire.x,H.fire.y,H.fire.z]:W3(45.8,19.5,1.8), body=[b.x,b.y+2.7,b.z];
  if(t<T_HALL) camShot(W3(11,16.6,4.3),W3(17,16.1,3.9),t/T_HALL,W3(44,15.6,3.0));   // 1: down the long hall to the east end
  else if(t<T_HEARTH) camShot(W3(38.4,21,3.4),W3(41.3,20.1,2.5),(t-T_HALL)/(T_HEARTH-T_HALL),[fire[0],fire[1]+.6,fire[2]]);   // 2: the hearth, the fire roaring up, the stockpot steaming
  else if(t<T_WALK){ const L=c.look=c.look?lerp3(c.look,body,Math.min(1,dt*4)):body; camShot(W3(41.2,16.6,2.1),W3(40.5,16.9,2.5),(t-T_HEARTH)/(T_WALK-T_HEARTH),L); }   // 3: from beside the fire, he lumbers out of the doors
  else if(t<T.BOIL0) camShot(W3(39.4,10.8,3.4),W3(39.9,11.1,2.9),(t-T_WALK)/(T.BOIL0-T_WALK),[b.x-1.2,b.y+1.6,b.z]);   // 4: the slam, from the side
  else if(t<T.STAMP){ const k=(t-T.BOIL0)/(T.STAMP-T.BOIL0); camShot(W3(39.2,12.8,3.6),W3(40.8,13.2,4.3),k,[b.x,b.y+MOBDIM[K].h*.74,b.z]); }   // 5: the boil-over, pushing in to his face
  else if(t<T.SWING0){ // FREEZE: the close-up held, a flash, the stamp
    if(!c.freezeCam){ c.freezeCam=camera.position.clone(); c.freezeQ=camera.quaternion.clone(); } camera.position.copy(c.freezeCam); camera.quaternion.copy(c.freezeQ);
    const h=t-T.STAMP, flash=cutEl.querySelector('.flash'), stamp=cutEl.querySelector('.stamp'); if(!stampAt){ stampAt=performance.now(); cnt.stamps++; } c.stampOn=true;
    flash.style.opacity=String(Math.max(0,.9-h*3)); const k=Math.min(1,h/.16); stamp.style.opacity='1'; stamp.style.transform='translate(-50%,-50%) rotate(6deg) scale('+(3-2*k).toFixed(3)+')';
    if(h<.25&&!c.slam2){ c.slam2=true; try{ SFX.thud&&SFX.thud(); }catch(er){} } const jig=h>.16&&h<.5?(Math.random()-.5)*8:0; if(jig) stamp.style.transform+=' translate('+jig+'px,'+(-jig)+'px)'; }
  else { // 6: back to the player
    if(!c.freezeCam){ c.freezeCam=camera.position.clone(); c.freezeQ=camera.quaternion.clone(); } const k=ease((t-T.SWING0)/SWING); camera.position.lerpVectors(c.freezeCam,c.cam,k); camera.quaternion.copy(c.freezeQ).slerp(c.q,k);
    const stamp=cutEl.querySelector('.stamp'); stamp.style.opacity=c.stampOn?String(Math.max(0,1-(t-T.SWING0)/.5)):'0'; cutEl.querySelector('.flash').style.opacity='0'; if(t>T.END-.7) cutEl.classList.remove('on'); }
  if(t>=T.END) endCut(); }
// the hall holds still for the roll-out: only the scene runs (on the wall clock, Avery's way: a slow frame rate can't let it fall behind the music)
{ const prev=update; update=function(dt){ if(cut){ let rdt=dt; if(!window.__freeze){ const now=performance.now(); if(!cutReal||(now-cutReal)/1000<cut.t) cutReal=now-cut.t*1000; rdt=Math.max(0,Math.min(.25,(now-cutReal)/1000-cut.t)); }
      if(isGuest()&&window.__mobsync&&window.__mobsync.each) window.__mobsync.each(p=>{ if(p.kind===K&&p.mdl) p.mdl.g.visible=false; });
      stepCut(rdt); if(cut){ try{ updateFx(rdt); }catch(er){} } updateHUD(); return; } return prev(dt); }; }
// ---------------------------------------------------------------- his mind each frame (the game's own walker moves him; this adds the slams, the boil-over, the punches in passing)
{ const prev=mobSpd; mobSpd=function(e){ if(e&&e.kind===K&&(e.special||e.swing>=0)) return 0; return prev.apply(this,arguments); }; }   // he plants his feet to punch, slam or boil
{ const prev=landHit; landHit=function(e,tg){ if(e&&e.kind===K&&tg){ if(tg.kind==='def'&&!tg.ranged&&tg.obj&&tg.obj.kind!=='spike'){ const d=tg.obj; if(!defs.includes(d)) return; hurtDef(d,Math.round(e.dmg*TOWER_PUNCH)); cnt.towerPunch++; splash(d.x,(d.base||0)+1,d.z,6,3); return; }
      if(tg.kind==='hero') cnt.heroPunch++; } return prev.apply(this,arguments); }; }
function towerInWay(e){ const [fx_,fz_]=fwd(e.yaw); let best=null, bd=e.r+1.7; for(const d of defs){ if(NOWALK_DEF[d.kind]||d.kind==='perch'||d.kind==='trap'||d.kind==='pit') continue; const dx=d.x-e.x, dz=d.z-e.z, dd=Math.hypot(dx,dz); if(dd<bd&&(dx*fx_+dz*fz_)/Math.max(dd,.01)>-.25){ bd=dd; best=d; } } return best; }
function tick(e,dt){ const m=e.mdl; if(m&&m.bullHoldT>0) m.bullHoldT=Math.max(0,m.bullHoldT-dt);
  if(e.special){ const s=e.special; s.t+=dt; e.yaw=s.yaw; m.g.rotation.y=s.yaw; e.atk=Math.max(e.atk,.4);
    if(s.k==='slam'&&!s.landed&&s.t>=s.hit){ s.landed=true; slamLand(e,false); }
    if(s.k==='boil'&&Math.random()<dt*12) puff(e.x+(Math.random()-.5)*2,headY(e)+.3,e.z+(Math.random()-.5)*2,true);
    if(s.t>=s.dur){ e.special=null; e.atk=.3; } return; }
  if(e.phase===1&&e.hp<=e.max*.5){ boilOver(e); return; }
  if(e.swing<0){ e.slamCd-=dt; if(e.slamCd<=0){ startSlam(e); return; } }
  if(e.swing<0&&e.atk<=0){ const d=towerInWay(e); if(d){ e.yaw=Math.atan2(d.x-e.x,d.z-e.z); attack(e,{ kind:'def', obj:d, x:d.x, z:d.z, reach:e.r+1.7 }); e.atk=e.cd; } }
  // a big body on a path cut for goblins: if he has walked a whole second and got nowhere (the owlbear beside the east doors, a table's corner), he squeezes on toward the next square
  const k=e.stk||(e.stk={ x:e.x, z:e.z, t:0 }); if(e.walking&&e.swing<0&&mobSpd(e)>.3){ k.t+=dt; if(k.t>=1){ if(Math.hypot(e.x-k.x,e.z-k.z)<.3) unstick(e); e.stk={ x:e.x, z:e.z, t:0 }; } } else k.t=0;
  if(e.walking&&Math.random()<dt*2.5){ const a=Math.random()*TAU; fx('drop',e.x+Math.cos(a)*1.1,e.y+2.6+Math.random(),e.z+Math.sin(a)*1.1,Math.cos(a)*.8,1.5,Math.sin(a)*.8,1.2,.24,.18,1); } }   // sloshing as he goes
function unstick(e){ const ci=idx(wc(e.x),wcz(e.z)); let n=flowDef.nxt[ci]; if(n<0) n=flowFree.nxt[ci]; if(n<0) return; const dx=cw(n%GW)-e.x, dz=cwz((n/GW)|0)-e.z, dd=Math.hypot(dx,dz)||1; for(let i=0;i<6;i++) moveCircle(e,dx/dd*.25,dz/dd*.25,.45,false); cnt.unstuck++; }
// what the game keeps on a dead mob once his body has gone to the corpse: an empty figure the game's own dead branch can pose and take away safely
function standIn(){ const o=()=>new THREE.Object3D(); return { g:new THREE.Group(), glb:false, legs:[o(),o()], arms:[o(),o()], head:o(), parts:{} }; }
const CORPSES=[];
function corpse(mdl,x,y,z,yaw){ if(!mdl||!mdl.g) return; mdl.bullHoldT=0; if(mdl.mixer){ mdl.mixer.stopAllAction(); const a=CL.Death&&mdl.mixer.clipAction(CL.Death); if(a){ a.reset(); a.setLoop(THREE.LoopOnce,1); a.clampWhenFinished=true; a.play(); } }
  mdl.g.position.set(x,y,z); mdl.g.rotation.y=yaw; CORPSES.push({ m:mdl, x,y,z, t:0, sc:mdl.g.scale.y, splashed:false, sink:(CL.Death?CL.Death.duration:3.5)-.15 }); }
function updCorpses(dt){ for(let i=CORPSES.length-1;i>=0;i--){ const c=CORPSES[i]; c.t+=dt; if(c.m.mixer) c.m.mixer.update(dt);
    if(!c.splashed&&c.t>=DEATH_FALL){ c.splashed=true; addPuddle(c.x,c.z,4.6,{ cosmetic:true, life:10, grow:1.4 }); splash(c.x,c.y,c.z,40,8); for(let k=0;k<14;k++) puff(c.x+(Math.random()-.5)*5,c.y+.5,c.z+(Math.random()-.5)*5,true); camShake=Math.max(camShake,.8); try{ SFX.thud&&SFX.thud(); }catch(er){} }
    if(c.t>c.sink){ const k=Math.min(1,(c.t-c.sink)/1.6); c.m.g.scale.set(c.sc*(1+k*.25),Math.max(.001,c.sc*(1-k)),c.sc*(1+k*.25)); c.m.g.position.y=c.y-k*.6; if(Math.random()<dt*10) puff(c.x+(Math.random()-.5)*3,c.y+.6,c.z+(Math.random()-.5)*3,true); }
    if(c.t>c.sink+1.65){ scene.remove(c.m.g); CORPSES.splice(i,1); } } }
{ const prev=updateEnemies; updateEnemies=function(dt){ prev(dt); const live=!isGuest();
    if(live) for(const e of enemies){ if(e.kind!==K||e.dead) continue; tick(e,dt); }
    updFx(dt); updPuddles(dt,live); updCorpses(dt);
    if(fallT>0){ fallT-=dt; if(fallT<=0) fallEl.classList.remove('on'); }
    if(live){ const e=enemies.find(x=>x.kind===K&&!x.dead); bar.style.display=e&&!cut?'block':'none'; if(e) bar.querySelector('.fill').style.width=Math.max(0,100*e.hp/e.max)+'%'; } }; }
// ---------------------------------------------------------------- his fall: the Death clip, a great puddle, the Fire set and his jars
function fireSet(){ const look=typeof heroWtypes==='function'?heroWtypes()[0]:'sword';   /* the weapon of the killer's own type (this page's hero; a co-op guest builds its own) */
  const ST={ weapon:{dmg:24,spd:45,tow:41}, armor:{hp:156,def:24,regen:4.5}, amulet:{mana:65,tow:41,hp:156}, familiar:{fdmg:35,frate:63,move:20}, charm:{move:20,trate:20,tarea:18} };   // the forge's mythic set numbers, as Avery's Wind set
  return [{ slot:'weapon', name:'Mythic '+look[0].toUpperCase()+look.slice(1)+' of Fire', setId:'lava', look, rarity:5, lvl:20, stats:ST.weapon },
    { slot:'armor', name:'Armor of Fire', setId:'lava', rarity:5, lvl:20, stats:ST.armor }, { slot:'amulet', name:'Amulet of Fire', setId:'lava', rarity:5, lvl:20, stats:ST.amulet },
    { slot:'familiar', name:'Fire Imp of Fire', setId:'lava', rarity:5, lvl:20, stats:ST.familiar }, { slot:'charm', name:'Charm of Fire', setId:'lava', rarity:5, lvl:20, stats:ST.charm }]; }
function dropFire(){ const N=window.__mythic&&window.__mythic.normalize; fireSet().forEach((rec,i)=>{ const it=N?N(rec):null; if(!it) return; const a=i/5*TAU; dropLoot(it,hero.x+Math.cos(a)*3.5,hero.z+Math.sin(a)*3.5,true); }); }
// build 531 (Matt: "i think the music should end and go back to battle music about 10 seconds after his cut scene"): his cafe track plays on for BATTLE_AFTER s after the roll-out, then the hall's own
// battle music takes over for the rest of the fight (a guest too: its endCut runs off the host's bullCutEnd)
const BATTLE_AFTER=10; let battleT=0; function toBattle(){ clearTimeout(battleT); battleT=setTimeout(()=>{ if(typeof musicMode!=='undefined'&&musicMode==='bullion'&&!cut){ const ph=isGuest()?(typeof hallPhase==='function'?hallPhase():'wave'):S.phase; setMusic(ph==='build'?'build':'wave'); cnt.toBattle=(cnt.toBattle|0)+1; } },BATTLE_AFTER*1000); }
function musicBack(){ setTimeout(()=>{ const alive=isGuest()?!!gLive:enemies.some(x=>x.kind===K&&!x.dead); if(!alive&&typeof musicMode!=='undefined'&&musicMode==='bullion') setMusic((isGuest()?(typeof hallPhase==='function'?hallPhase():'wave'):S.phase)==='wave'?'wave':'build'); },2500); }
{ const prev=kill; kill=function(e){ const was=e&&!e.dead&&e.kind===K; const r=prev.apply(this,arguments);
    if(was){ cnt.deaths++; const m=e.mdl; e.mdl=standIn(); e.special=null; corpse(m,e.x,e.y,e.z,e.yaw);   // his body is the corpse's now (the game's own dead branch takes away an empty stand-in)
      camShake=Math.max(camShake,.9); fallCard(); dropFire(); musicBack();
      try{ if(isHost()) NET().send('bullFall',{ id:e.__coopId||null }); }catch(er){} }
    return r; }; }
// ---------------------------------------------------------------- the co-op GUEST's side (Avery's way, 95u): the roll-out on the host's word, a stand-in of him for it, his puppet's slams and boil-over,
// the puddles (looks only -- the host's burn reaches the guest's hero through Meta.heroes), his fall on the puppet, and its own Fire set
let gLate=false, gLive=null, gSeen=false, gGone=0;
function guestCut(){ if(cut) return; gLate=false; const at=performance.now(); load().then(()=>{ if(cut||!MOBGLB[K]) return; done=true; cnt.intro++;
    if(gLate){ gLate=false; if(!stampAt) stampAt=performance.now(); musicOn(true); toBattle(); banner('🍲 SIR BULLION 🍲','♨️ 🥣 ♨️'); return; }
    const m=makeMob(K); scene.add(m.g); beginCut({ mdl:m, x:START.x, z:START.z, y:baseFloor(START.x,START.z), yaw:YAW_IN, sc:m.g.scale.x, guestFake:true, phase:1 });
    const late=Math.min(TL.END-.01,Math.max(0,(performance.now()-at)/1000)); if(late>.05) cut.t=late; }); }
let fellT=-1e9;
function guestFall(){ if(!isGuest()) return; const now=performance.now(); if(now-fellT<20000) return; fellT=now; cnt.guestFalls++; camShake=Math.max(camShake,.9); fallCard(); dropFire(); musicBack(); }
function guestDie(p){ if(!isGuest()||!p||!p.mdl||!p.mdl.glb) return; cnt.guestDies++; const m=p.mdl; p.mdl=standIn(); corpse(m,p.x,p.y||baseFloor(p.x,p.z),p.z,p.yaw||0); }
function guestFx(d){ if(!isGuest()||!d) return; cnt.guestFx++; const each=fn=>{ const M_=window.__mobsync; if(M_&&M_.each) M_.each(p=>{ if(p.kind===K&&p.mdl&&p.mdl.glb) fn(p); }); };
  if(d.k==='slam'){ const sp=Math.max(.5,Math.min(2,+d.sp||1)); each(p=>playClip(p.mdl,'Slam',{ speed:sp, fade:.15 })); }
  else if(d.k==='pud'&&Array.isArray(d.a)){ const list=d.a.slice(0,8).map(q=>Array.isArray(q)?q.slice(0,3).map(Number):null).filter(q=>q&&q.every(fin)).map(([x,z,r])=>[x,z,Math.max(.5,Math.min(5,r))]); drawPuddles(list,{ cosmetic:true }); camShake=Math.max(camShake,.8); try{ SFX.thud&&SFX.thud(); }catch(er){} }
  else if(d.k==='boil'&&[d.x,d.y,d.z].every(fin)){ each(p=>{ playClip(p.mdl,'BoilOver',{ fade:.15 }); p.fur=true; p.boilT=CL.BoilOver?CL.BoilOver.duration:3; }); steamBurst(+d.x,+d.y,+d.z,22); roar(); camShake=Math.max(camShake,1); banner(FURY_CARD[0],FURY_CARD[1]); } }
let hooked=false; function hookNet(){ if(hooked) return; const n=NET(); if(!(n&&n.onMessage)) return; hooked=true;
  n.onMessage('bullCut',()=>{ if(isGuest()) guestCut(); }); n.onMessage('bullFall',()=>{ try{ guestFall(); }catch(er){} }); n.onMessage('bullFx',d=>{ try{ guestFx(d); }catch(er){} });
  n.onMessage('bullCutEnd',()=>{ if(!isGuest()) return; if(cut){ if(cut.t<TL.END-.01) cut.t=TL.END-.01; } else gLate=true; }); }
hookNet(); { const prev=Meta.update; Meta.update=dt=>{ prev(dt); hookNet(); }; }   // 99-network.js loads after this file
{ const prev=Meta.update; Meta.update=dt=>{ prev(dt); if(!isGuest()||cut) return; const M_=window.__mobsync; if(!M_||!M_.each) return; let live=null;
    M_.each(p=>{ if(p.kind!==K||!p.mdl) return; live=p; const m=p.mdl; if(m.bullHoldT>0) m.bullHoldT=Math.max(0,m.bullHoldT-dt);
      if(p.fur&&m.actions&&m.actions.run&&m.actions.walk!==m.actions.run) m.actions.walk=m.actions.run;   // furious: he runs on the guest's screen too
      if(p.boilT>0){ p.boilT-=dt; if(Math.random()<dt*12) puff(p.x+(Math.random()-.5)*2,headY(p)+.3,p.z+(Math.random()-.5)*2,true); } });
    gLive=live; if(live){ gSeen=true; gGone=0; bar.style.display='block'; const mx=live.max||live.maxSeen||MOBS[K].hp; bar.querySelector('.fill').style.width=Math.max(0,100*(live.hp||0)/mx)+'%'; if(typeof musicMode!=='undefined'&&musicMode!=='bullion'&&!gLate) musicOn(true); }
    else if(gSeen){ gGone+=dt; bar.style.display='none'; if(gGone>2){ gSeen=false; if(typeof musicMode!=='undefined'&&musicMode==='bullion') setMusic((typeof hallPhase==='function'?hallPhase():'wave')==='wave'?'wave':'build'); } } }; }
window.__bullion={ kind:K, load, loaded:()=>!!MOBGLB[K], meas:()=>Object.assign({ slamHit:SLAM_HIT, boilPeak:BOIL_PEAK, deathFall:DEATH_FALL, hitT:MOBS[K].hitT },MEAS), timeline:()=>Object.assign({ T_HALL, T_HEARTH, T_WALK, T_MUSIC, MUS_HIT },TL),
  info:()=>Object.assign({ cut:!!cut, cutT:cut?+cut.t.toFixed(2):null, puddles:PUDS.filter(p=>p.on).length, hotPuddles:PUDS.filter(p=>p.on&&p.hot).length, corpses:CORPSES.length, fx:FX.filter(f=>f.on).length, fall:fallEl.classList.contains('on') },cnt),
  state:()=>enemies.filter(e=>!e.dead&&e.kind===K).map(e=>({ phase:e.phase, special:e.special?e.special.k:null, x:+e.x.toFixed(1), z:+e.z.toFixed(1), hp:Math.round(e.hp), max:e.max, spd:+e.spd.toFixed(2), slamCd:+(e.slamCd||0).toFixed(2), clip:e.mdl&&e.mdl.cur?e.mdl.cur.getClip().name:null, walking:!!e.walking, swing:e.swing })),
  puddles:()=>PUDS.filter(p=>p.on).map(p=>({ x:+p.x.toFixed(2), z:+p.z.toFixed(2), r:p.r, t:+p.t.toFixed(2), life:p.life, hot:p.hot })), addPuddle:(x,z,r,o)=>{ addPuddle(x,z,r,o); return PUDS.filter(p=>p.on).length; },
  stamp:()=>({ title:cutEl.querySelector('.stamp b').textContent, line:cutEl.querySelector('.stamp i').textContent, shown:cutEl.style.display==='block'&&cutEl.querySelector('.stamp').style.opacity==='1' }),
  musOffset:()=>{ const f=window.__musStart&&window.__musStart.bullion; return typeof f==='function'?+f().toFixed(2):null; }, startCut, endCut, skip:()=>{ if(cut){ cut.t=TL.END-.01; cnt.skipped++; } }, fireSet, guestCut, guestFall, guestDie, guestFx, start:START, stop:STOP, PUD, SLAM_CD, FURY_SPD, TOWER_PUNCH };
})();
