// ===== SLUDGE JARS (build 270). Matt, on the sludge economy: "We actually just need more loot drops cuz we use gold for the upgrades too" -- a piece of loot is either sold for gold (which buys gear upgrades) or
// salvaged into sludge (the forge gamble), never both -- then "Could add sludge jars to dropped loot by mobs", and "Yeah go on that" to this plan:
//   * MOBS DROP SLUDGE JARS, a roll of their own beside their gear roll. The jar's kind follows the mob: goblins Common (some Uncommon), archers and orcs Uncommon (some Rare), drakes and trolls Rare (some
//     Legendary); an ogre always drops a Legendary jar and a real boss (the troll boss, the cyclops, the pig lords) two.
//   * EACH WAVE PAYS ABOUT THE SAME: a wave's ordinary mobs share a budget (BUDGET, in Legendary-sludge worth at the Cauldron's 3-for-1), so a later wave's hundred goblins don't flood the forge -- each mob's chance is
//     the budget times its weight over the whole wave's weight, over what its jar is worth. Sized (tools/scratch-main/jar-calc2.mjs) for about two forge tries a room from jars alone in room 1 (~58 jars) and ~3.4 in
//     room 2 (its bosses pay on top), with salvaging still adding its own: Matt's barometer is "i should be able to do the loot gamble 2-3 times per round", even selling most gear for gold.
//   * WALK OVER A JAR to take it: it flies to you like loot (LOOT_HOOK), with the mana chime (and the loot chord for Rare and Legendary). It never goes in the bag.
//   * BANKED THE MOMENT YOU TAKE IT (my call, flagged to Matt): each jar is added straight to localStorage 'dd_sludge_in' = {common,uncommon,rare,legendary}, which the hideout (build 61) takes into its own four
//     sludges on load and on every visit, so a death never costs a jar already picked up. Jars still on the floor when you MOVE ON from a held hall are banked for you (sweep).
//   * A COUNTER on the HUD beside the mana shows this run's jars, with the hideout's own jar thumbnails.
//   * CO-OP: every player's jars are their own, rolled for them like their loot (build 151): the host rolls once for itself and once for each guest and sends a guest only its hits ('jarDrop'), which it drops on its
//     own floor and banks into its own hideout.
// Not in the tutorial. Test hook: window.__jars.
(function(){
const TUT=typeof TUTORIAL!=='undefined'&&!!TUTORIAL;
const KEY='dd_sludge_in';
const JR=[{k:'common',name:'Common',col:0x5f6e3a,css:'#c4ccb0',img:'common_sludge.png'},{k:'uncommon',name:'Uncommon',col:0x08b88a,css:'#3fe8b8',img:'uncommon_sludge.png'},
          {k:'rare',name:'Rare',col:0x9a18f0,css:'#d884ff',img:'sludge_jar.webp'},{k:'legendary',name:'Legendary',col:0xf06a00,css:'#ffc040',img:'legendary_sludge.png'}];
const VAL=[1/27,1/9,1/3,1];   // what a jar is worth in Legendary Sludge, refined at the Cauldron's three-for-one
const KIND={goblin:{w:1,r:[.85,.15,0,0]},archer:{w:2,r:[0,.8,.2,0]},orc:{w:3,r:[0,.7,.3,0]},drake:{w:6,r:[0,0,.85,.15]},troll:{w:6,r:[0,0,.8,.2]}};
const VK={}; for(const k in KIND) VK[k]=KIND[k].r.reduce((a,x,i)=>a+x*VAL[i],0);
const BOSS={ogre:1,trollboss:2,cyclops:2,pigflail:2,pigdagger:2,pigsling:2};   // Legendary jars, always
const BUDGET=.6;   // Legendary-sludge worth a wave's ordinary mobs share
const HOOK=typeof LOOT_HOOK!=='undefined'?LOOT_HOOK:3.2;
const JARS=[], RUN=[0,0,0,0];
// ---- the wave's weight: every ordinary mob in this wave's roster (waveComp), worked out once a wave
let wW=-1, wWave=null;
function waveW(){ const key=S.wave+'|'+effWave(); if(key!==wWave){ wWave=key; wW=0; try{ for(const s of waveComp(effWave()).q){ const K=KIND[s.kind]; if(K) wW+=K.w; } }catch(e){ wW=0; } } return wW; }
function chance(kind){ const K=KIND[kind], w=waveW(); if(!K||w<=0) return 0; return Math.min(1,BUDGET*K.w/(w*VK[kind])); }
function jarRoll(kind){ const b=BOSS[kind]; if(b) return new Array(b).fill(3); const K=KIND[kind]; if(!K||LR()>=chance(kind)) return [];
  let x=LR(), r=0; while(r<3&&x>=K.r[r]){ x-=K.r[r]; r++; } return [r]; }
// ---- build 297: MATT'S OWN JARS (his Meshy set: the grey-green sludge jar = Common, the teal brew = Uncommon, the purple slime = Rare, the red-and-gold elixir with the crowned lid = Legendary). Asked for when
// the first wave starts (never on the loading screen); until one lands its jar is the code-built one below, and any code-built jar still on the floor is swapped for the real one the moment it arrives
// (updateJars). Each stands a little taller the rarer it is. The glow, the floor ring and the Rare/Legendary light beam stay the game's.
const JAR_FILES=['jar-common.glb','jar-uncommon.glb','jar-rare.glb','jar-legendary.glb'], JAR_H=[.62,.66,.72,.8], TPL=[];
let jarsAsked=false;
function askJars(){ if(jarsAsked||TUT) return; jarsAsked=true; JAR_FILES.forEach((f,r)=>{ fetchBytes(ASSET(f),'first').then(buf=>new THREE.GLTFLoader().parse(buf,'',gl=>{ try{ const root=gl.scene||gl.scenes[0]; const fit=fitModel(root,JAR_H[r]); toonify(root,fit.scale); TPL[r]=fit.wrap; }catch(e){ console.warn('jar model '+f,e); } },e=>console.warn('jar model '+f,e))).catch(e=>console.warn('jar model '+f,e)); }); }
function realJar(item,r){ const m=TPL[r].clone(); m.position.y=-.3; item.add(m); item.scale.setScalar(1); }
// ---- the code-built jar: glass, the rarity's sludge glowing inside, a cork and a band (after the hideout's jar thumbnails); a gold band and a red gem on a Legendary
function jarMesh(r){ const J=JR[r], g=new THREE.Group(), item=new THREE.Group(); item.position.y=.45; const gold=r===3;
  if(TPL[r]){ realJar(item,r); g.add(item); g.userData.item=item; g.userData.real=true; jarFx(g,r); return g; }
  const glassP=[[0,-.2],[.17,-.2],[.23,-.15],[.25,-.02],[.23,.1],[.17,.16],[.14,.17],[.14,.21]].map(([x,y])=>new THREE.Vector2(x,y));
  const glass=new THREE.Mesh(new THREE.LatheGeometry(glassP,14),new THREE.MeshToonMaterial({color:C(0xdff4ff),gradientMap:GRAD,transparent:true,opacity:.16,depthWrite:false})); item.add(glass);   // thin glass: the sludge is the colour you read
  const goo=[[0,-.18],[.15,-.18],[.205,-.13],[.225,-.02],[.21,.07],[0,.07]].map(([x,y])=>new THREE.Vector2(x,y));
  item.add(new THREE.Mesh(new THREE.LatheGeometry(goo,14),mat(J.col,{emissive:C(J.col),emissiveIntensity:.3})));
  item.add(M(G.cyl(.15,.13,.09,10),mat(0x9a6434),0,.25,0));   // the cork
  const band=new THREE.Mesh(new THREE.TorusGeometry(.155,.022,6,16),mat(gold?0xffc84a:0x9aa2ac)); band.rotation.x=PI/2; band.position.y=.16; item.add(band);
  const base=new THREE.Mesh(new THREE.TorusGeometry(.22,.035,6,18),mat(gold?0xffc84a:0x8a5a2a)); base.rotation.x=PI/2; base.position.y=-.16; item.add(base);
  if(gold){ const gem=new THREE.Mesh(new THREE.OctahedronGeometry(.06,0),mat(0xff3048,{emissive:C(0xff3048),emissiveIntensity:.5})); gem.position.y=.33; item.add(gem); }
  outline(item); item.scale.setScalar(1.15); g.add(item); g.userData.item=item;
  jarFx(g,r); return g; }
// the glow, the floor ring, and a light beam over a Rare or Legendary -- the same around the code-built jar and Matt's
function jarFx(g,r){ const J=JR[r];
  const gl=glow(J.col,1.0+r*.35,.55); gl.position.y=.45; g.add(gl);
  const ring=new THREE.Mesh(new THREE.RingGeometry(.22,.36,18),new THREE.MeshBasicMaterial({color:C(J.col),transparent:true,opacity:.6,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide})); ring.rotation.x=-PI/2; ring.position.y=.05; ring.userData.noOL=true; g.add(ring); g.userData.ring=ring;
  if(r>=2){ const beam=new THREE.Mesh(new THREE.CylinderGeometry(.08,.2,2.4,10,1,true),new THREE.MeshBasicMaterial({color:C(J.col),transparent:true,opacity:.16+(r-2)*.08,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide})); beam.position.y=1.2; beam.userData.noOL=true; g.add(beam); } }
function spawnJar(r,x,z){ r=Math.max(0,Math.min(3,r|0)); const a=LR()*TAU, sp=1.4+LR()*1.2; const j={r,x,y:.6,z,vx:Math.cos(a)*sp,vy:4.2+LR()*1.6,vz:Math.sin(a)*sp,t:0,mesh:jarMesh(r)}; j.mesh.position.set(x,.6,z); scene.add(j.mesh); JARS.push(j); return j; }
function clearJars(){ while(JARS.length){ scene.remove(JARS.pop().mesh); } }
// ---- banking: straight into the hideout's hand-off, the moment it is taken
function readIn(){ let b=null; try{ b=JSON.parse(localStorage.getItem(KEY)); }catch(e){} b=(b&&typeof b==='object'&&!Array.isArray(b))?b:{}; JR.forEach(J=>{ b[J.k]=Math.max(0,Math.floor(+b[J.k])||0); }); return b; }
function bank(r,x,y,z){ const b=readIn(); b[JR[r].k]++; try{ localStorage.setItem(KEY,JSON.stringify(b)); }catch(e){}
  RUN[r]++; drawHud(); SFX.mana(); if(r>=2) SFX.loot(r===3?4:2); floatText(x,y+.8,z,'+1 '+JR[r].name+' Sludge',JR[r].css); }
// build 275 (Matt: "does it make a unique sound if a legendary jar drops?" -> "hi pitched clink"): a LEGENDARY jar clinks the moment it first touches the floor -- two quick glassy pings high up (build 276: C8 then F8, each with a
// faint octave above), so it is heard across the room mid-fight. The other jars land quietly as before.
let CLINKS=0;
function clink(){ CLINKS++; try{ beep(4186,.1,'sine',.15,0); beep(8372,.06,'sine',.045,0); setTimeout(()=>{ beep(5588,.16,'sine',.13,0); beep(11175,.07,'sine',.035,0); },55); }catch(e){} }   // build 276 (Matt: "that sound could be higher and louder"): C8 then F8 (was G7, C8), about twice as loud
function updateJars(dt){
  if(S.phase==='wave') askJars();
  for(let i=JARS.length-1;i>=0;i--){ const j=JARS[i]; j.t+=dt; const it=j.mesh.userData.item;
    if(!j.mesh.userData.real&&TPL[j.r]){ while(it.children.length) it.remove(it.children[0]); realJar(it,j.r); j.mesh.userData.real=true; }   // build 297: Matt's jar has landed -- this one on the floor becomes it
    // build 272 (Matt: "these jars wont allow me to pick them up"): a jar at rest keeps a tiny bounce, so its vy was never under .01 at this check -- only a jar still falling as you came near ever flew to you; landed once is landed
    if(hero.dead<=0&&j.t>.45&&(j.landed||j.vy<=.01)){ const hd=Math.hypot(hero.x-j.x,hero.z-j.z), hy=Math.abs(hero.y-j.y);
      if(window.__autoMana||(hd<HOOK&&hy<4)){ const dx=hero.x-j.x, dy=hero.y+.9-j.y, dz=hero.z-j.z, dd=Math.hypot(dx,dy,dz);
        if(dd<.6){ bank(j.r,j.x,j.y,j.z); scene.remove(j.mesh); JARS.splice(i,1); continue; }
        const s=Math.min(1,10*dt/dd); j.x+=dx*s; j.y+=dy*s; j.z+=dz*s; j.vx=j.vz=j.vy=0; j.mesh.position.set(j.x,j.y,j.z); it.rotation.y+=dt*6; continue; } }
    j.vy-=14*dt; const nx=j.x+j.vx*dt, nz=j.z+j.vz*dt; if(!solidAt(nx,nz,0,true)){ j.x=nx; j.z=nz; } else { j.vx=-j.vx*.5; j.vz=-j.vz*.5; }
    j.y+=j.vy*dt; const fl=baseFloor(j.x,j.z); if(j.y<fl){ if(!j.landed&&j.r===3) clink(); j.y=fl; j.vy=-j.vy*.3; j.vx*=.6; j.vz*=.6; j.landed=true; if(j.vy<.6) j.vy=0; }
    j.mesh.position.set(j.x,j.y,j.z); it.position.y=.45+Math.sin(j.t*3+j.r)*.07; it.rotation.y+=dt*1.6; j.mesh.userData.ring.scale.setScalar(1+Math.sin(j.t*4)*.08);
    if(hero.dead<=0&&j.t>.3&&Math.hypot(hero.x-j.x,hero.z-j.z)<1.2&&Math.abs(hero.y-j.y)<1.6){ bank(j.r,j.x,j.y,j.z); scene.remove(j.mesh); JARS.splice(i,1); } } }   // and walking right over one always takes it, the way loot does
// the room is over (MOVE ON from a held hall: update() stops the hall there): whatever is still on the floor is banked, with one line to say so
function sweep(){ if(!JARS.length) return 0; const n=JARS.length, b=readIn(); for(const j of JARS.splice(0)){ scene.remove(j.mesh); b[JR[j.r].k]++; RUN[j.r]++; } try{ localStorage.setItem(KEY,JSON.stringify(b)); }catch(e){} drawHud(); SFX.mana(); try{ toast(n+' sludge jar'+(n===1?'':'s')+' left on the floor, banked in your hideout'); }catch(e){} return n; }
{ const prev=moveOn; moveOn=function(){ try{ if(S.held&&S.phase==='build') sweep(); }catch(e){} return prev.apply(this,arguments); }; }
// ---- the HUD counter (this run's jars), beside the mana
const hud=document.createElement('span'); hud.id='jarHud'; hud.className='jars'; hud.title='Sludge jars this run: already banked in your hideout';
{ const st=document.createElement('style'); st.textContent='#hud .res .jars{display:none;gap:7px;align-items:center}#hud .res .jars.on{display:inline-flex}#hud .res .jars b{display:inline-flex;align-items:center;gap:2px;font-weight:700}#hud .res .jars img{width:20px;height:20px;border-radius:4px;vertical-align:middle}'; document.head.appendChild(st); }
function attachHud(){ const res=document.querySelector('#hud .res'); if(res&&hud.parentNode!==res) res.appendChild(hud); }
function drawHud(){ attachHud(); const any=RUN.some(n=>n>0); hud.classList.toggle('on',any); if(!any){ hud.innerHTML=''; return; }
  hud.innerHTML=JR.map((J,r)=>RUN[r]?'<b style="color:'+J.css+'"><img src="hideout/assets/hideout/items/'+J.img+'" alt="" onerror="this.style.display=\'none\'">'+RUN[r]+'</b>':'').join(''); }
attachHud();
// ---- the rolls: on the kill, beside the gear roll
function rollJars(e){ if(!e||TUT) return; const N=window.__net, role=N&&N.role?N.role():null; if(role==='guest') return;
  jarRoll(e.kind).forEach(r=>spawnJar(r,e.x,e.z));
  if(role==='host'&&N.peers) N.peers().forEach(id=>{ const rs=jarRoll(e.kind); if(rs.length) N.send('jarDrop',{rs,x:+(+e.x).toFixed(2),z:+(+e.z).toFixed(2)},id); }); }
{ const prev=rollDrop; rollDrop=function(e){ const out=prev.apply(this,arguments); try{ rollJars(e); }catch(err){} return out; }; }
if(window.__net&&window.__net.onMessage) window.__net.onMessage('jarDrop',d=>{ const N=window.__net; if(!d||!N.role||N.role()!=='guest'||!Array.isArray(d.rs)) return; d.rs.slice(0,4).forEach(r=>spawnJar(r,+d.x||0,+d.z||0)); });
// ---- each frame, with the loot; a new run (the wave counter back to 1) starts the counter afresh
let lastWave=S.wave;
{ const prev=updateLoot; updateLoot=function(dt){ prev.apply(this,arguments); try{ if(S.wave===1&&lastWave!==1){ RUN.fill(0); drawHud(); } lastWave=S.wave; updateJars(dt); }catch(err){} }; }
window.__jars={ list:()=>JARS.map(j=>({r:j.r,x:+j.x.toFixed(2),y:+j.y.toFixed(2),z:+j.z.toFixed(2)})), spawn:(r,x,z)=>spawnJar(r,x,z), roll:k=>jarRoll(k), chance:k=>chance(k), waveW:()=>waveW(),
  run:()=>RUN.slice(), clinks:()=>CLINKS, real:()=>TPL.map(Boolean), asked:()=>jarsAsked, ask:askJars, realOnFloor:()=>JARS.map(j=>!!j.mesh.userData.real), banked:()=>readIn(), clear:clearJars, sweep, budget:BUDGET, kinds:()=>Object.keys(KIND), bosses:()=>Object.assign({},BOSS), tut:TUT };
})();
