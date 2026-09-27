// ===== THE TUTORIAL HALL (build 166). Matt: "we need to reimagine the entire tutorial or something, it doesn't work as intended. i am
// thinking prior to room one there is a tutorial hall. tutorial as a selection on the title screen gets rid of some buttons too. kill a
// goblin melee. next place a ballista, here's how, now g, oh look loot was dropped. its a tutorial room with one hall and in your face
// instruction". game.js builds TUT_MAP -- one straight hall from a door to the crystal -- instead of the chosen map when the page loads
// with ?tutorial (TUTORIAL there). Two ways in: the 🎓 TUTORIAL button on every title screen, and a brand-new player's PLAY (no map held,
// the tutorial never done or skipped): PLAY reloads into the tutorial, which starts by itself (?tutorial=go), and a small "skip the
// tutorial" under PLAY goes straight into room one instead. Only a real player's PLAY is sent: never on a ?silent page, never in a
// browser a test drives (navigator.webdriver) -- a page nobody chose the tutorial on behaves exactly as it always did (music-test.mjs
// presses PLAY on a fresh save and expects room one). This module runs the tutorial: seven steps, ONE at a time, in
// big type high in the middle of the screen, with an arrow at the thing to look at (the spot on the floor, the goblin, the ballista's
// hotbar slot, its marker on the lane, the horn, the loot, the bag, EQUIP, the orbs, the tower) and a glow on the button to press. Each
// step watches what the game really did (never a timer), ticks ✓, and moves on by itself after a short beat. The wording is the
// device's: W A S D / click / 1 / G / B / E on a computer; the joystick / ⚔ / the slot / ✔ / 📯 / 🎒 / 🔧 on a touch screen.
// The tutorial is the Knight's (melee first) whatever hero is picked -- for this page only, the saved pick is left alone.
// What goes, so there is one thing to look at: on the title the hero cards, THE HIDEOUT and MULTIPLAYER (the map picker becomes one
// line and ENTER THE HALL reads START THE TUTORIAL, with a small "skip" under it); in the hall the raven and the hideout portal
// (57/58 don't build them), the other two tower slots, the old map-one guide card (96-trainer.js), the big lessons (93-gearsets.js),
// the loot's quick-equip card (60-lootfeel.js) and the HUD's own "place defenses, then G" line. The horn waits for its step; selling
// waits for the end. Both waves held starts build 160's victory lap as usual; MOVE ON (G, the ▶ button, Esc → MOVE ON) marks the
// tutorial done (dd_tutorial) and goes straight into room one (a reload that starts by itself), where the old guide has nothing left
// to teach. Holding the tutorial hall unlocks nothing and pays no campaign win (game.js winMap): its waves pay as they are held.
(function(){
const KEY='dd_tutorial', ENTER='ddTutEnter';   // ENTER (sessionStorage, this tab only): the tutorial's way out asks the next page -- room one -- to start by itself
const store=(k,v)=>{ try{ if(v===null) localStorage.removeItem(k); else localStorage.setItem(k,v); }catch(e){} };
const recall=k=>{ try{ return localStorage.getItem(k); }catch(e){ return null; } };
function reloadWith(fn){ const q=new URLSearchParams(location.search); fn(q); const s=q.toString(); location.href=location.pathname+(s?'?'+s:''); }   // other flags (?silent, ?nogate, a host's signature) ride along, the way 95-campaign.js's go() does it
function toTutorial(go){ reloadWith(q=>{ q.set('tutorial',go===false?'1':'go'); q.delete('map'); }); }
function roomOne(){ store('ddMap','0'); try{ sessionStorage.setItem(ENTER,'1'); }catch(e){} reloadWith(q=>{ q.delete('tutorial'); q.set('map','0'); }); }
// start the hall without a second click once the start screen's models are in (the knight, the crystal, the sword) -- the click that
// asked for it was on the page before. The mouse is captured at the first click in the hall, as after any failed capture
function autoPlay(){ const t0=performance.now(); const iv=setInterval(()=>{ if(S.phase!=='start'){ clearInterval(iv); return; } const lt=window.__loadtime?window.__loadtime():null; if((lt&&lt.first!==null)||performance.now()-t0>6000){ clearInterval(iv); play(); } },100); }
if(!TUTORIAL){
  { let enter=false; try{ enter=sessionStorage.getItem(ENTER)==='1'; sessionStorage.removeItem(ENTER); }catch(e){} if(enter&&!Q.get('coopjoin')) autoPlay(); }   // straight into room one after the tutorial (or its skip)
  // 🎓 TUTORIAL on every title screen, next to MULTIPLAYER: anyone can take it (again)
  const row=$('mpRow'); if(row){ const b=document.createElement('button'); b.id='tutbtn'; b.className='big alt'; b.textContent='🎓 TUTORIAL'; b.title='three minutes in a hall of its own: move, fight, build, the horn, loot, upgrade -- then room one';
    b.addEventListener('click',e=>{ e.stopPropagation(); if(S.phase==='start') toTutorial(true); }); row.appendChild(b); }
  const st=document.createElement('style'); st.textContent='#mpRow{flex-wrap:wrap;justify-content:center;column-gap:10px}#start.coopPage #tutbtn,#start.inLobby #tutbtn{display:none!important}#tutskip{font-size:14px;margin-top:10px;color:#e9ddc8;text-shadow:0 1px 3px #000}'; document.head.appendChild(st);
  // a brand-new player's PLAY (the button, Enter or Space on the title, the tavern's DEFEND) goes to the tutorial first; "skip" plays here
  const fresh=()=>!SILENT&&!navigator.webdriver&&!Q.get('coopjoin')&&!recall(KEY)&&!((parseInt(recall('ddMapsCleared'))||0)>=1);
  const lobby=()=>{ const s=$('start'); return !!s&&(s.classList.contains('inLobby')||s.classList.contains('coopPage')); };   // a co-op lobby's START is its own business (99b-lobby.js)
  if(fresh()){ const pb=$('playbtn'); if(pb){ const sk=document.createElement('button'); sk.id='tutskip'; sk.className='lbLink'; sk.textContent='skip the tutorial — straight into room one'; sk.addEventListener('click',e=>{ e.stopPropagation(); store(KEY,'skipped'); sk.remove(); play(); }); pb.insertAdjacentElement('afterend',sk); }
    $('start').addEventListener('click',e=>{ if(!fresh()||lobby()||!e.target.closest||!e.target.closest('#playbtn')) return; e.stopPropagation(); e.preventDefault(); toTutorial(true); },true);
    addEventListener('keydown',e=>{ if(S.phase!=='start'||!(e.code==='Enter'||e.code==='Space')||!fresh()||lobby()||Meta.isOpen()) return; const t=e.target&&e.target.tagName; if(t==='INPUT'||t==='TEXTAREA') return; e.stopImmediatePropagation(); e.preventDefault(); toTutorial(true); },true); }
  window.__tutorial={on:false,go:toTutorial,KEY,fresh,done:()=>recall(KEY)};
  return; }

document.body.classList.add('tutorial');
if(Q.get('tutorial')==='go'){ autoPlay(); try{ const q=new URLSearchParams(location.search); q.set('tutorial','1'); history.replaceState(history.state,'',location.pathname+'?'+q.toString()+location.hash); }catch(e){} }   // it starts itself once; a reload (RETURN TO TITLE, TRY AGAIN) shows the tutorial's own title, with its skip
const HINT_WAS=recall('dd_setHint');   // the first-set-piece lesson is hidden in here (below); if it fires unseen, room one gets to teach it
{ const was=recall('ddHero'); if(heroPick!==KNIGHT) installHero(KNIGHT); store('ddHero',was); }   // the Knight's sword first (70-hero2.js), whatever card is picked -- installHero saves the pick, so the old one goes straight back
hero.x=cw(MAP.start[0]); hero.z=cwz(MAP.start[1]); cam.pitch=.34;   // the knight starts in the hall with the door dead ahead and the crystal at his back (from the usual spot behind the crystal it hid the whole lane), and the camera a touch flatter so the far end of the hall shows below the instructions
let K=!TOUCH; addEventListener('inputmode',()=>{ K=!TOUCH; });   // build 167: an iPad with a mouse and keyboard switches to their wording the moment the mouse moves (game.js setTouchMode)
// ---- the title: START THE TUTORIAL, a quiet way past it, and nothing else to wonder about (the CSS below hides the rest)
{ const pb=$('playbtn'); if(pb){ pb.textContent='▶ START THE TUTORIAL'; const sk=document.createElement('button'); sk.id='tutskip'; sk.className='lbLink'; sk.textContent='skip the tutorial — straight into room one'; sk.addEventListener('click',e=>{ e.stopPropagation(); skip(); }); pb.insertAdjacentElement('afterend',sk); } }
const css=document.createElement('style'); css.textContent=
 'body.tutorial #heroline,body.tutorial #hideoutbtn,body.tutorial #mpRow,body.tutorial #trainer,body.tutorial #lesson,body.tutorial #heroPick,body.tutorial #pickcard{display:none!important}body.tutorial #phaset{visibility:hidden}'   // #pickcard: 60-lootfeel's "E equip now" card -- the lesson here is the bag, and on a phone the card sits right over the 🎒 button (a tap there equipped from the card)
+'#tutskip{font-size:14px;margin-top:10px;color:#e9ddc8;text-shadow:0 1px 3px #000}'
+'#tut{position:fixed;left:50%;top:46px;transform:translateX(-50%);width:max(300px,min(700px,calc(100vw - 560px)));box-sizing:border-box;z-index:25;background:#0b0710e0;border:3px solid #ffd27a;border-radius:14px;padding:8px 18px 11px;text-align:center;color:#fff;text-shadow:0 2px 3px #000;box-shadow:0 0 24px #ffb03a77,0 0 0 1px #000;pointer-events:none;opacity:0;transition:opacity .3s,border-color .3s}'
+'#tut.on{opacity:1}#tut .tn{font-size:11px;letter-spacing:3px;color:#ffd27a}#tut .tm{font-size:30px;font-weight:bold;line-height:1.12;margin-top:1px}#tut .ts{font-size:17px;line-height:1.3;color:#f1e6d0;margin-top:4px}#tut .ts:empty{display:none}'
+'#tut kbd{font-size:.9em;padding:0 7px}#tut .ts b{color:#ffd27a}'
+'#tut .td{display:flex;gap:5px;justify-content:center;margin-top:6px}#tut .td i{width:24px;height:4px;border-radius:2px;background:#fff3}#tut .td i.d{background:#8ef08a}#tut .td i.c{background:#ffd27a}'
+'#tut .tx{position:absolute;right:6px;top:4px;pointer-events:auto;background:none;border:0;color:#fff9;font:12px Georgia,serif;cursor:pointer;padding:2px 4px}#tut .tx:hover{color:#fff}'
+'#tut.ok{border-color:#8ef08a;box-shadow:0 0 30px #8ef08aaa,0 0 0 1px #000}#tut.ok .tm{color:#8ef08a}#tut.new{animation:tutNew .7s ease-out}#tut.nudge{animation:tutNudge .9s ease-in-out}'
+'@keyframes tutNew{0%{box-shadow:0 0 0 #ffd27a;filter:brightness(1.8)}50%{box-shadow:0 0 60px #ffd27a}100%{box-shadow:0 0 24px #ffb03a77;filter:none}}@keyframes tutNudge{0%,100%{box-shadow:0 0 24px #ffb03a77}50%{box-shadow:0 0 60px #ffd27a,0 0 0 4px #ffd27a}}'
+'#tut.low{top:auto;bottom:84px;left:16px;transform:none;width:380px}#tut.low .tm{font-size:24px}#tut.low .ts{font-size:16px}#tut.low .tn{text-align:left}'   /* a narrow panel: the step count to the left, clear of the skip in the corner */
+'@media (max-width:700px){#tut{left:8px;right:84px;width:auto;transform:none;top:150px;padding:7px 10px 9px}#tut .tm{font-size:21px}#tut .ts{font-size:15px}#tut .tn{font-size:10px;letter-spacing:2px;text-align:left}#tut .tx{font-size:11px}#tut .td i{width:16px}#tut.low{top:4px;bottom:auto;left:6px;right:6px;width:auto}#tut.low .tm{font-size:19px}#tut.low .ts{font-size:14px}body.tutorial #gear{display:none}}'
+'@media (max-height:500px){#tut{top:46px}#tut .tm{font-size:20px}#tut .ts{font-size:14px}#tut .td{margin-top:4px}#tut.low{top:auto;bottom:56px;left:6px;width:42%}}'
+'#tutArrow{position:fixed;left:0;top:0;width:0;height:0;z-index:24;pointer-events:none;display:none}#tutArrow .ta{position:absolute;left:0;top:0;transform-origin:0 0}'
+'#tutArrow svg{position:absolute;left:-62px;top:-24px;width:64px;height:48px;overflow:visible;animation:tutBob .55s ease-in-out infinite alternate;filter:drop-shadow(0 0 4px #000) drop-shadow(0 0 10px #ffb03a)}@keyframes tutBob{from{transform:translateX(-16px)}to{transform:translateX(0)}}'
+'@media (max-width:700px){#tutArrow svg{left:-47px;top:-18px;width:48px;height:36px}}'
+'[data-tut]{box-shadow:0 0 0 3px #ffd27a,0 0 22px 6px #ffd27acc!important;animation:tutGlow .8s ease-in-out infinite alternate!important}@keyframes tutGlow{from{filter:brightness(1)}to{filter:brightness(1.45)}}';
document.head.appendChild(css);
const panel=document.createElement('div'); panel.id='tut'; panel.innerHTML='<div class="tn"></div><div class="tm"></div><div class="ts"></div><div class="td"></div><button class="tx" title="skip the tutorial and go to room one">skip tutorial ✕</button>'; document.body.appendChild(panel);   // outside #hud: the tavern makes the HUD inert, and step five talks over the tavern
const P={n:panel.querySelector('.tn'),m:panel.querySelector('.tm'),s:panel.querySelector('.ts'),d:panel.querySelector('.td'),x:panel.querySelector('.tx')};
let skipArm=0; P.x.addEventListener('click',e=>{ e.stopPropagation(); if(skipArm&&Date.now()-skipArm<4000){ skip(); return; } skipArm=Date.now(); P.x.textContent='tap again to skip'; setTimeout(()=>{ if(!finished) P.x.textContent='skip tutorial ✕'; skipArm=0; },4000); });   // two taps, like wipe saves: a thumb on the corner of a phone must not end it
const arrow=document.createElement('div'); arrow.id='tutArrow'; arrow.innerHTML='<div class="ta"><svg viewBox="0 0 64 48"><path d="M3 15 H33 V4 L61 24 L33 44 V33 H3 Z" fill="#ffd27a" stroke="#120c1a" stroke-width="3" stroke-linejoin="round"/></svg></div>'; document.body.appendChild(arrow);
const TA=arrow.firstElementChild;
// ---- the floor markers: a ring and a column of light on the spot to walk to and on the ballista's place (a chevron in it says which way it will face)
const SPOT=[cw(MAP.spot[0]),cwz(MAP.spot[1])], MARK=[cw(MAP.mark[0]),cwz(MAP.mark[1])], DOOR_YAW=PI;   // the door is north (-z): a ballista at yaw PI shoots straight up the runner
function glowMat(col,op,vc){ return new THREE.MeshBasicMaterial({color:col,transparent:true,opacity:op,side:THREE.DoubleSide,depthWrite:false,blending:THREE.AdditiveBlending,vertexColors:!!vc}); }
function marker(col,chevron){ const g=new THREE.Group(); const add=(geo,m)=>{ const o=new THREE.Mesh(geo,m); o.userData.noOL=true; g.add(o); return o; };
  const ring=add(new THREE.RingGeometry(.95,1.3,40),glowMat(col,.9)); ring.rotation.x=-PI/2; ring.position.y=.09;
  const disc=add(new THREE.CircleGeometry(.95,32),glowMat(col,.22)); disc.rotation.x=-PI/2; disc.position.y=.08;
  const H=4.5, bg=new THREE.CylinderGeometry(1,1,H,32,1,true); { const pos=bg.attributes.position, c=new Float32Array(pos.count*3); for(let i=0;i<pos.count;i++){ const k=Math.max(0,.5-pos.getY(i)/H); c[i*3]=c[i*3+1]=c[i*3+2]=k*k; } bg.setAttribute('color',new THREE.BufferAttribute(c,3)); bg.translate(0,H/2,0); }   // brightest at the floor, gone by the top (additive: black adds nothing)
  const beam=add(bg,glowMat(col,.55,true)); beam.scale.set(.95,1,.95);
  if(chevron){ const sh=new THREE.Shape(); sh.moveTo(0,-.62); sh.lineTo(.42,.12); sh.lineTo(.18,.12); sh.lineTo(.18,.5); sh.lineTo(-.18,.5); sh.lineTo(-.18,.12); sh.lineTo(-.42,.12); sh.closePath(); const ch=add(new THREE.ShapeGeometry(sh),glowMat(col,.8)); ch.rotation.x=-PI/2; ch.position.y=.1; }   // an arrow on the floor pointing at the door (shape y -> world -z once laid flat)
  g.userData={ring,beam}; g.visible=false; scene.add(g); return g; }
const MK={spot:marker(0xffd27a,false),mark:marker(0x7af0ff,true)};
MK.spot.position.set(SPOT[0],floorH(SPOT[0],SPOT[1]),SPOT[1]); MK.mark.position.set(MARK[0],floorH(MARK[0],MARK[1]),MARK[1]);
function markers(which,t){ for(const k in MK){ const on=k===which; if(MK[k].visible!==on) MK[k].visible=on; if(on){ const u=MK[k].userData, s=1+.08*Math.sin(t*5); u.ring.scale.set(s,s,s); u.beam.material.opacity=.4+.2*Math.sin(t*3.2); } } }
// ---- what the game did, counted by the same calls the game makes
const picks=[]; let equips=0, pickups=0;
{ const prev=Meta.onPickup; Meta.onPickup=function(it,l){ const r=prev(it,l); if(r){ pickups++; if(it&&Meta.bag().some(b=>b.id===it.id)) picks.push({id:it.id,step:si}); } return r; }; }   // true when the piece went into the bag (a full bag sells it: counted, not bagged)
{ const prev=Meta.equip; Meta.equip=function(id){ const r=prev(id); if(r) equips++; return r; }; }   // the bag and the sheet both equip through here
// ---- the rails: one thing at a time
{ const prev=select; select=function(kind){ if(!finished&&kind!=='harpoon'&&DEFKEYS.includes(kind)) return; return prev(kind); }; }   // the knight's hedge and totem wait for room one (their slots are hidden below)
{ const prev=sell; sell=function(pos){ if(!finished){ toast('Keep it — the tutorial still needs your ballista'); return; } return prev(pos); }; }
{ const prev=startWave; startWave=function(){ if(S.held||finished) return prev.apply(this,arguments); const s=STEPS[si]; if(s&&s.horn&&!beatUntil) return prev.apply(this,arguments);   /* the horn is its step's to sound (4 and 7); the victory lap's MOVE ON always goes through */
  if(S.phase==='build'){ nudgeT=.9; toast('Not yet — the horn comes in a moment. First: '+(s?stripTags(s.view().main):'follow the steps')); } }; }
{ const prev=moveOn; moveOn=function(){ if(S.held&&S.phase==='build'&&!finished){ finish(); return; } return prev.apply(this,arguments); }; }   // MOVE ON: the tutorial is done -- straight on to room one, no tally in between
addEventListener('keydown',e=>{ if(e.code==='KeyH'&&S.phase!=='start'){ e.stopImmediatePropagation(); } },true);   // no hero swap in the knight's tutorial (game.js's H swaps the model when no raven is near)
// the ballista always faces the door here and snaps onto its marker when you aim near it: the lesson is "put a tower on the lane",
// not "turn it to cover the lane" -- a first-timer aiming at the marker from the far side used to get one shooting the crystal
{ const prev=updateGhost; updateGhost=function(){ if(placing==='harpoon'&&!finished){ ghostRot=DOOR_YAW-cam.yaw; anchorYaw=DOOR_YAW; } return prev.apply(this,arguments); }; }
{ const prev=aimPoint; aimPoint=function(){ const p=prev(); if(placing==='harpoon'&&!finished&&!defs.some(d=>d.kind==='harpoon')&&Math.hypot(p[0]-MARK[0],p[1]-MARK[1])<3) return [MARK[0],MARK[1]]; return p; }; }
// two small waves through the one door: three goblins, then five
waveComp=function(w){ const n=w<=1?3:5, q=[]; let t=1.8; for(let i=0;i<n;i++){ q.push({t,kind:'goblin',lane:'N'}); t+=w<=1?1.8:1.2; } return {q,desc:'Goblins ×'+n+'  —  through the door'}; };
// ---- helpers
const stripTags=s=>String(s||'').replace(/<[^>]+>/g,'');
const hb=t=>[...document.querySelectorAll('#btns .hb')].find(b=>b.textContent===t)||null;   // a touch button by its face (game.js makes them: ⚔ ⤴ ✔ ↻ 🔧 🎒)
const tavernOpen=()=>{ const T=window.__tavern; if(!T) return false; const s=T.state(); return !!(s.open&&!s.sum); };
const alive=()=>enemies.filter(e=>!e.dead);
const leadMob=()=>{ let best=null, bd=1e9; for(const e of alive()){ const d=Math.hypot(e.x,e.z); if(d<bd){ bd=d; best=e; } } return best; };   // the one closest to the crystal
const nearest=list=>{ let best=null, bd=1e9; for(const o of list){ const d=Math.hypot(o.x-hero.x,o.z-hero.z); if(d<bd){ bd=d; best=o; } } return best; };
const ballista=()=>{ let b=null; for(const d of defs) if(d.kind==='harpoon'&&(!b||(d.lvl||1)<(b.lvl||1))) b=d; return b; };
const mobAt=e=>e?[e.x,e.y+(e.h||1.4)+.5,e.z]:null;
function lend(n,why){ n=Math.ceil(n); if(n<=0) return; S.mana+=n; floatText(hero.x,hero.y+2.6,hero.z,'+'+n+' ◆ mana — '+why,'#5ee9ff'); }
// ---- the steps. view(): what the panel says (main, how), where the arrow points (el: a button; at: a point in the hall), what glows,
// which floor marker shows. done(): what the player really did. ok: the ✓ line for the beat before the next step
const G={e:null,kills:0,respawn:0};   // step 2's goblin: harmless (it hits for nothing); one that reaches the crystal vanishes and another comes
const L={equipBase:0,pickBase:0,selFor:-1};
const U={lent:false};
const STEPS=[
 {id:'walk', view:()=>({main:'Walk to the glowing spot',how:K?'<kbd>W A S D</kbd> to walk · move the mouse to look around':'drag the <b>joystick</b> (bottom left) to walk · drag the right side to look',at:[SPOT[0],1.2,SPOT[1]],mk:'spot',glow:TOUCH?[$('joy')]:[]}),
  done:()=>Math.hypot(hero.x-SPOT[0],hero.z-SPOT[1])<1.8, ok:'Nice — that is how you get around'},
 {id:'goblin', enter(){ G.e=null; G.kills=0; G.respawn=0; },
  run(dt){ if(G.respawn>0){ G.respawn-=dt; return; } const e=G.e; if(!e){ try{ const n=spawnEnemy('goblin','N'); n.tut=true; n.dmg=0; n.spd*=.8; G.e=n; }catch(err){ G.kills=1; } return; }
    if(e.dead){ if(!e.through) G.kills++; G.e=null; return; }
    if(Math.hypot(e.x,e.z)<2.6){ e.through=true; e.dead=.001; G.e=null; G.respawn=1.6; floatText(e.x,e.y+1.6,e.z,'IT GOT THROUGH — HERE COMES ANOTHER','#ff8a6a'); } },   // quietly, never kill(): no orb or xp for one that walked in
  view:()=>({main:'A goblin! Kill it with your sword',how:K?'get close, then <kbd>click</kbd> to swing (<kbd>F</kbd> works too)':'get close, then tap <b>⚔</b> to swing',at:mobAt(G.e&&!G.e.dead?G.e:null),glow:TOUCH?[hb('⚔')]:[]}),
  done:()=>G.kills>=1, ok:'Goblin down!'},
 {id:'ballista', enter(){ if(S.mana<DEFS.harpoon.mana) lend(DEFS.harpoon.mana-S.mana,'the hall lends it'); },
  view(){ const slot=$('slot-harpoon'); if(placing!=='harpoon') return {main:'Build a BALLISTA',how:K?'press <kbd>1</kbd> — it shoots the goblins down the hall for you':'tap the <b>🏹 Ballista</b> slot at the bottom — it shoots the goblins down the hall for you',el:slot,glow:[slot],mk:'mark'};
    const tch=TOUCH?[hb('✔')]:[];
    if(placeStage===0) return {main:'Put it on the glowing marker',how:K?'look at the marker on the floor, then <kbd>click</kbd> to set it down':'walk toward the marker until the ballista sits on it, then tap <b>✔</b>',at:[MARK[0],.4,MARK[1]],mk:'mark',glow:tch};
    return {main:K?'Click once more to build it':'Tap ✔ again to build it',how:'it faces up the hall, at the door the goblins come through',at:[MARK[0],.4,MARK[1]],mk:'mark',glow:tch}; },
  done:()=>defs.some(d=>d.kind==='harpoon'), ok:'Ballista built!'},
 {id:'horn', horn:true,
  view(){ if(S.phase!=='wave'){ const b=$('wavebtn'); return {main:'Now sound the horn',how:K?'press <kbd>G</kbd> — a few goblins come through the door, after the crystal behind you':'tap <b>📯 START WAVE</b> (top right) — a few goblins come through the door, after your crystal',el:b,glow:[b]}; }
    return {main:'Here they come!',how:'your ballista shoots them down the hall — help it with your sword ('+(K?'<kbd>click</kbd>':'<b>⚔</b>')+')',at:mobAt(leadMob()),glow:TOUCH?[hb('⚔')]:[]}; },
  done:()=>S.wave>=1&&S.phase==='build', ok:'Wave held!'},
 {id:'loot', enter(){ L.equipBase=equips; L.pickBase=pickups; L.selFor=-1; if(!loot.length&&!lootItem()) dropLoot(rollItem(1),0,4.6,true); },   // the held wave drops its reward by the crystal (game.js); if it is already gone somewhere, the hall drops another
  run(){ const it=lootItem(); if(it&&tavernOpen()&&L.selFor!==opens&&Meta.bag().some(b=>b.id===it.id)){ L.selFor=opens; try{ window.__tavern.tab('bag'); window.__tavern.select(it.id,'bag'); }catch(e){} } },   // the bag opens with the new piece already picked: its EQUIP button is right there
  view(){ const it=lootItem(); if(!it){ const l=nearest(loot); return {main:'Oh look — LOOT!',how:'a piece of gear dropped by the crystal — walk over it to pick it up',at:l?[l.x,l.y+1.4,l.z]:null}; }
    if(!tavernOpen()){ const b=TOUCH?hb('🎒'):$('bagbtn'); return {main:'Open your bag',how:K?'press <kbd>B</kbd>':'tap <b>🎒</b>',el:b,glow:[b]}; }
    const eq=document.querySelector('#tv-detail [data-act="equip"]'); return {main:'Equip it',how:(K?'<kbd>click</kbd>':'tap')+' <b>EQUIP</b> — your new piece is already picked',el:eq,glow:[eq],low:true}; },
  done(){ const it=lootItem(); return (!!it&&SLOTS.some(s=>gear[s]&&gear[s].id===it.id))||equips>L.equipBase||(Meta.bagFull()&&pickups>L.pickBase); }, ok:'Equipped — you just got stronger'},
 {id:'upgrade', enter(){ U.lent=false; if(!orbs.length){ const b=ballista(); spawnOrbs(b?b.x:0,b?b.z+3:-4,3); } },   // no orbs left lying about (all grabbed in the fight): the goblins' mana is left by the ballista, so the lesson still happens
  run(){ if(tavernOpen()||orbs.length) return; const b=ballista(); if(!b){ if(S.mana<DEFS.harpoon.mana) lend(DEFS.harpoon.mana-S.mana,'the hall lends it'); return; } if(!U.lent){ U.lent=true; if(S.mana<upCost(b)) lend(upCost(b)-S.mana,'the hall lends the rest'); } },
  view(){ if(tavernOpen()){ const x=$('tv-close'); return {main:'Close your bag',how:K?'press <kbd>B</kbd> (or <kbd>Esc</kbd>)':'tap <b>✕</b> (top right)',el:x,glow:[x],low:true}; }
    if(orbs.length){ const o=nearest(orbs); return {main:'Grab the blue mana orbs',how:'walk over them — mana builds and upgrades towers',at:[o.x,o.y+1,o.z]}; }
    const b=ballista(); if(!b){ const slot=$('slot-harpoon'); return {main:'Build a BALLISTA again',how:K?'press <kbd>1</kbd>, then click on the marker':'tap the <b>🏹</b> slot, then <b>✔</b> on the marker',el:slot,glow:[slot],mk:'mark'}; }
    return {main:'Upgrade your ballista',how:'walk up to it (a gold ring shows under it) and '+(K?'press <kbd>E</kbd>':'tap <b>🔧</b>'),at:[b.x,b.top+.7,b.z],glow:TOUCH?[hb('🔧')]:[]}; },
  done:()=>defs.some(d=>d.kind==='harpoon'&&(d.lvl||1)>=2), ok:'Mark II — it hits harder and aims wider'},
 {id:'last', horn:true,
  view(){ const b=$('wavebtn'); if(S.held) return {main:'HALL HELD!',how:K?'you are ready — press <kbd>G</kbd> to move on to room one':'you are ready — tap <b>▶ MOVE ON</b> (top right) to go to room one',el:b,glow:[b]};
    if(S.phase==='wave') return {main:'Hold the hall!',how:'sword and ballista together — '+(K?'<kbd>click</kbd>':'<b>⚔</b>')+' to swing',at:mobAt(leadMob()),glow:TOUCH?[hb('⚔')]:[]};
    return {main:'One last wave',how:K?'press <kbd>G</kbd> when you are ready':'tap <b>📯 START WAVE</b> when you are ready',el:b,glow:[b]}; },
  done:()=>false, ok:''}];   // MOVE ON ends it (finish)
function lootItem(){ for(let i=picks.length-1;i>=0;i--){ const p=picks[i]; if(p.step<3) continue; const it=Meta.bag().find(b=>b.id===p.id)||SLOTS.map(s=>gear[s]).find(g=>g&&g.id===p.id); if(it) return it; } return null; }   // the latest piece bagged since the horn step (the wave's reward, or a goblin's drop in the fight)
// ---- the run of it
let si=-1, beatUntil=0, okText='', begun=false, finished=false, lastT=null, newT=0, idleT=0, nudgeT=0, opens=0, wasOpen=false, AR=null, glowed=[], shown='';
function chime(hi){ try{ if(hi){ beep(988,.12,'triangle',.05,0); setTimeout(()=>beep(1319,.22,'triangle',.05,0),100); } else { beep(784,.13,'sine',.045,0); setTimeout(()=>beep(1175,.2,'sine',.04,0),110); } }catch(e){} }
function go(i){ si=i; const s=STEPS[si]; if(s&&s.enter) s.enter(); newT=.7; idleT=0; nudgeT=0; chime(false); }
function tick(){ const t=S.t, dt=lastT===null?0:Math.max(0,Math.min(.1,t-lastT)); lastT=t;
  if(!finished&&(S.phase==='build'||S.phase==='wave')){
    if(!begun){ begun=true; if(innerWidth>700) banner('THE TUTORIAL HALL','one hall · one door · learn the ropes, then room one'); go(0); }   // not on a phone: the banner's big type wraps to three lines over the knight, and the panel already says it
    const op=tavernOpen(); if(op&&!wasOpen) opens++; wasOpen=op;
    if(newT>0) newT-=dt; if(nudgeT>0) nudgeT-=dt;
    if(beatUntil){ if(t>=beatUntil){ beatUntil=0; go(si+1); } }
    else { const s=STEPS[si]; if(s){ if(s.run) s.run(dt); if(s.done()){ beatUntil=t+1.3; okText=s.ok; chime(true); } else { idleT+=dt; if(idleT>=12){ idleT=3; nudgeT=.9; } } } } }   /* left undone for 12 s, the panel pulses (then every 9 s) */
  render(t); }
function arrowOff(){ if(arrow.style.display!=='none') arrow.style.display='none'; AR=null; }
function arrowAt(x,y,a,to){ if(arrow.style.display!=='block') arrow.style.display='block'; TA.style.transform='translate('+x.toFixed(1)+'px,'+y.toFixed(1)+'px) rotate('+a.toFixed(3)+'rad)'; AR={x:Math.round(x),y:Math.round(y),a:+a.toFixed(3),to}; }
// a button: the arrow's tip on the edge of it that faces the middle of the screen, pointing at it
function arrowToEl(el){ if(!el||!el.isConnected){ arrowOff(); return; } const r=el.getBoundingClientRect(); if(r.width<1&&r.height<1){ arrowOff(); return; }
  const W=innerWidth, H=innerHeight, cx=r.left+r.width/2, cy=r.top+r.height/2; let dx=cx-W/2, dy=cy-H/2; const l=Math.hypot(dx,dy)||1; dx/=l; dy/=l; if(l<2){ dx=0; dy=1; }
  const e=Math.min(Math.abs(dx)>1e-3?r.width/2/Math.abs(dx):1e9,Math.abs(dy)>1e-3?r.height/2/Math.abs(dy):1e9)+6; arrowAt(cx-dx*e,cy-dy*e,Math.atan2(dy,dx),el.id||el.textContent); }
// a point in the hall: on screen, the arrow stands over it pointing down; off screen, it sits at the edge pointing the way to look
const V=new THREE.Vector3();
function arrowToWorld(p){ if(!p){ arrowOff(); return; } camera.updateMatrixWorld(); const W=innerWidth, H=innerHeight, m=W<=700?40:56; V.set(p[0],p[1],p[2]).applyMatrix4(camera.matrixWorldInverse); const cz=V.z; let dx=V.x, dy=-V.y;
  if(cz<-.1){ V.set(p[0],p[1],p[2]).project(camera); const sx=(V.x+1)/2*W, sy=(1-V.y)/2*H; if(sx>m&&sx<W-m&&sy>m+30&&sy<H-m){ const pr=panel.getBoundingClientRect(), n=W<=700?52:70;
      if(sy-n<pr.bottom&&sx>pr.left-24&&sx<pr.right+24) arrowAt(sx,Math.max(sy+8,pr.bottom+8),-PI/2,'hall');   // just under the panel (far up the hall, on a phone): from below, pointing up at it, never hidden behind the words
      else arrowAt(sx,sy-6,PI/2,'hall'); return; } }
  else { dx=dx<0?-1:1; dy=0; }   // behind: at the left or right edge, the way to turn (never at the bottom, where it would sit on the hotbar)
  const l=Math.hypot(dx,dy)||1; dx/=l; dy/=l; const k=Math.min(Math.abs(dx)>1e-3?(W/2-m)/Math.abs(dx):1e9,Math.abs(dy)>1e-3?(H/2-m)/Math.abs(dy):1e9); arrowAt(W/2+dx*k,H/2+dy*k,Math.atan2(dy,dx),'edge'); }
function glowSet(list){ list=(list||[]).filter(Boolean); for(const el of glowed) if(!list.includes(el)) delete el.dataset.tut; for(const el of list) if(el.dataset.tut!=='1') el.dataset.tut='1'; glowed=list; }   // a data attribute, not a class: the HUD rewrites a hotbar slot's className every frame
function panelOff(){ if(panel.classList.contains('on')) panel.classList.remove('on'); arrowOff(); glowSet([]); markers(null,0); }
function render(t){ const paused=!!(window.__pause&&window.__pause.isOpen()); const vis=!paused&&(finished||(begun&&(S.phase==='build'||S.phase==='wave')));
  if(!vis){ panelOff(); return; }
  let v; if(finished) v={main:'✓ Tutorial complete!',how:'on to room one — the Gnome Hall. The horde is waiting.'}; else if(beatUntil) v={main:'✓ '+okText,how:''}; else v=(STEPS[si]&&STEPS[si].view())||{main:'',how:''};
  const ok=finished||!!beatUntil, n=Math.min(si+1,STEPS.length);
  const key=n+'|'+v.main+'|'+v.how; if(key!==shown){ shown=key; P.n.textContent='🎓 TUTORIAL · STEP '+n+' OF '+STEPS.length; P.m.textContent=v.main; P.s.innerHTML=v.how||''; P.d.innerHTML=STEPS.map((s,k)=>'<i class="'+(k<si||(k===si&&ok)?'d':k===si?'c':'')+'"></i>').join(''); }
  panel.classList.add('on'); panel.classList.toggle('ok',ok); panel.classList.toggle('new',newT>0&&!ok); panel.classList.toggle('nudge',nudgeT>0&&!ok&&newT<=0); panel.classList.toggle('low',!!v.low||tavernOpen());
  if(ok){ arrowOff(); glowSet([]); markers(null,t); return; }
  if(v.el) arrowToEl(v.el); else if(v.at) arrowToWorld(v.at); else arrowOff();
  glowSet(v.glow); markers(v.mk||null,t); }
// the HUD hook runs every frame the hall is drawn, the tavern's included (update() stops the hall under it, not the HUD)
{ const prev=Meta.hud; Meta.hud=()=>{ prev(); DEFKEYS.forEach(k=>{ if(k==='harpoon') return; const el=$('slot-'+k); if(el&&el.style.display!=='none') el.style.display='none'; }); tick(); }; }   // only the ballista's slot on the hotbar (70-hero2.js shows the hero's three; this runs after it)
setInterval(()=>{ if(!(finished||S.phase==='build'||S.phase==='wave')) panelOff(); },300);   // the death cut and the end screens stop the HUD hook; the panel must not hang over them
// ---- the way out: done (MOVE ON), or skipped (the title's link, the panel's ✕)
function tickTrainer(){ const st={done:{},off:false}; try{ const s=JSON.parse(recall('dd_trainer')); if(s&&typeof s==='object'){ if(s.done&&typeof s.done==='object') st.done=s.done; st.off=!!s.off; } }catch(e){}
  ['slay','ballista','horn','orb','loot','equip','locker','more'].forEach(k=>st.done[k]=true); store('dd_trainer',JSON.stringify(st)); }   // room one's old guide card (96-trainer.js) has nothing left to teach a graduate: no wave-zero goblin, no card, no TRAINING GROUND banner. Its locker step goes too -- the Forest's fifth piece still gets 93-gearsets.js's own lesson and horn gate when it lands in the locker
function leaving(){ if(HINT_WAS===null) store('dd_setHint',null); }
function finish(){ if(finished) return; finished=true; store(KEY,'done'); tickTrainer(); leaving(); S.phase='won'; cancelPlace(); setMusic('none'); droneOff(); if(document.pointerLockElement&&document.exitPointerLock) document.exitPointerLock(); document.body.classList.remove('play'); try{ Meta.save(); }catch(e){} SFX.held(); render(S.t); setTimeout(roomOne,1600); }
function skip(){ if(finished) return; finished=true; store(KEY,'skipped'); leaving(); try{ Meta.save(); }catch(e){} roomOne(); }
window.__tutorial={on:true,KEY,go:toTutorial,steps:STEPS.map(s=>s.id),step:()=>STEPS[si]?STEPS[si].id:null,index:()=>si,beat:()=>!!beatUntil,finished:()=>finished,begun:()=>begun,
  main:()=>P.m.textContent,how:()=>P.s.textContent,text:()=>P.m.textContent+' — '+P.s.textContent,shown:()=>panel.classList.contains('on'),low:()=>panel.classList.contains('low'),
  arrow:()=>AR?Object.assign({},AR):null,glow:()=>glowed.map(el=>el.id||el.textContent),marker:()=>Object.keys(MK).find(k=>MK[k].visible)||null,spot:SPOT,mark:MARK,goblin:()=>G.e,lootItem,counts:()=>({picks:picks.length,equips,pickups,opens}),
  skip,finish,done:()=>recall(KEY),jump:i=>{ beatUntil=0; begun=true; go(i); }};   // jump: probes only
})();
