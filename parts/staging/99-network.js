// ===== NETWORK: phases 2-5 of co-op. Phase 2 is the transport — PeerJS (vendored in head.html, window.Peer) talks
// to its free public signaling broker (0.peerjs.com) so two browsers can find each other and open a WebRTC data
// channel directly between them: no server of our own to run. One player hosts — their own peer id becomes the
// room code — and up to three more join by connecting to that code. Phase 3 broadcast the host's own hero over
// that pipe, rendered by a guest as a party puppet (98-party.js) — the same setTarget(id,x,z,yaw) call a test
// script used to drive in phase 1. Phase 4 closes the loop: a guest's own keys and look are relayed to the host,
// which simulates a real, collision-respecting hero for them and folds it into the same broadcast, so every screen
// renders every OTHER player. Phase 5 makes it ONE hall rather than several private ones playing side by side: a
// guest's HUD shows the host's real crystal HP and wave/phase, only the host can start a wave, and the host's real
// enemies AND defenses now render as read-only puppets on a guest's screen (the guest's OWN local `enemies`/`defs`
// are still fully real and simulated underneath — nothing spawns or gets placed into them unless the guest starts
// their own wave or builds their own defense, both still possible locally but pointless since they're not what's
// drawn or shared). World-sync is done. Phase 6 is combat: the host's real enemies now notice and can damage a
// guest's hero too (Meta.heroes()/nearestHero(), game.js), and a guest can swing and damage the host's real
// enemies (guestHitCone below, reusing hurt() unchanged). A guest's own hp/death is synced back down to their own
// client (the 'hp' handler below) so their own screen shows it too, not just the host's private bookkeeping.
// Phase 7 is defense placement: a guest can place, repair, upgrade and sell REAL defenses on the host's hall,
// spending the host's own shared mana/DU (hostTryPlaceDef/hostDefAction below), and a defense a guest places
// carries THAT GUEST's own live gear/skill stats (Meta.defOwnerStat/defOwnerMult, game.js's stat()/oStat/oMult) —
// "let me get my knight place that, he has fast ballistas" — reverting to the host's own stats automatically once
// that guest disconnects. game.js has now been touched three times total across this whole effort (phase 6's
// nearestHero, and phase 7's stat()/oStat/oMult plus repair/upgrade/sell/nearestDef gaining an optional `pos`
// param), each time narrowly and deliberately. Still open: no gear/skill scaling for a guest's own COMBAT damage
// or hp (GUEST_DMG/GUEST_MAX_HP below are still flat, unequipped baselines — only a guest's PLACED DEFENSES draw
// on their real stats so far), nothing carries a guest's gear/skills across sessions (their own browser forgets
// it the moment they leave), mini-boss roar/aggro shouting still only ever plays for whichever hero it's aimed
// at, and a guest gets no local range-ring/cost-prompt affordance standing near a real defense (toast feedback
// only) — deliberately deferred, matching this effort's usual "first cut" scope discipline.
(function(){
let peer=null, role=null;   // 'host' | 'guest' | null
const conns=new Map();      // one entry per connected remote peer, keyed by ITS peer id — same key on both host and guest sides, so the generic close handler below (and anything else keyed off a peer id) works identically for either role
const handlers={};          // message type -> fn(data, fromPeerId)
function onMessage(type,fn){ handlers[type]=fn; }
function send(type,data,toId){
  const msg=JSON.stringify({type,data});
  if(toId){ const c=conns.get(toId); if(c&&c.open) c.send(msg); return; }
  conns.forEach(c=>{ if(c.open) c.send(msg); });
}
function wire(conn){
  conn.on('data',raw=>{ try{ const {type,data}=JSON.parse(raw); const h=handlers[type]; if(h) h(data,conn.peer); }catch(e){ console.warn('net parse',e); } });
  conn.on('close',()=>{ conns.delete(conn.peer); const h=handlers.__leave; if(h) h(conn.peer); });
}
// peerOpts: PeerJS's own constructor options, passed straight through — omitted, it uses the public cloud broker
// (0.peerjs.com); a test harness can point it at a local signaling server instead ({host,port,path}) without this
// module knowing or caring which one it's talking to.
function host(roomCode,cb,peerOpts){
  role='host'; peer=new Peer(roomCode||undefined,peerOpts);
  peer.on('open',id=>{ cb&&cb(null,id); });
  peer.on('connection',conn=>{ conn.on('open',()=>{ conns.set(conn.peer,conn); wire(conn); const h=handlers.__join; if(h) h(conn.peer); }); });
  peer.on('error',e=>{ cb&&cb(e); });
}
function join(roomCode,cb,peerOpts){
  role='guest'; peer=new Peer(undefined,peerOpts);
  peer.on('open',myId=>{
    const conn=peer.connect(roomCode,{reliable:true});
    conn.on('open',()=>{ conns.set(conn.peer,conn); wire(conn); cb&&cb(null,myId); });
    conn.on('error',e=>{ cb&&cb(e); });
  });
  peer.on('error',e=>{ cb&&cb(e); });
}
function leave(){ conns.forEach(c=>c.close()); conns.clear(); if(peer) peer.destroy(); peer=null; role=null; }
window.__net={ host, join, leave, send, onMessage, role:()=>role, peers:()=>[...conns.keys()],
  hostId:()=>role==='guest'?[...conns.keys()][0]||null:null,   // a guest only ever has the one connection — a convenience name for it, same id __party keys its puppet under
  myId:()=>peer&&peer.id };

// ---- phase 3/4: every hero in the hall, broadcast a few times a second and rendered as a puppet on every OTHER
// screen. Phase 3 was just the host's own hero; phase 4 adds every guest's, host-simulated from input they send —
// this module runs in game.js's own top-level scope (parts/DESIGN.md), same as 98-party.js, so it can call
// moveCircle/floorAt/angLerp directly: a guest's hero moves and collides with walls, rails and stairs exactly like
// the real one does, just fed by a network message instead of live keys. Combat isn't wired up yet (updateEnemies
// and hurtHero still only know the host's own `hero`), and gear-driven move speed isn't either (heroStat('move')
// reads the HOST's own gear) — both stay open for a later phase.
const HERO_GLB={witch:'witch.glb',troll:'troll.glb',knight:'knight.glb',fighter:'fighter.glb'};   // hero id -> glb file (70-hero2.js's HEROES table, duplicated here rather than reached into, so this module only ever touches __heroes/__party through their own public surface)
function heroLabel(pick){ const h=window.__heroes.list().find(h=>h.id===pick); return h?h.name:'Ally'; }

// host only: what each connected guest is simulated at, driven by the input they last sent
const guestIn=new Map();     // id -> latest {w,s,a,d,shift,yaw,pick}
const guestHero=new Map();   // id -> {x,y,z,yaw,hp,max,dead} the host moves each tick from guestIn, same collision rules as the real hero
const GUEST_MAX_HP=100, GUEST_REACH=2.4, GUEST_DMG=8;   // hero's own unequipped defaults (game.js: hero={hp:100,max:100,reach:2.4}, heroDmg()'s own base is 8) -- gear/skills aren't wired to a guest hero yet, so this is the honest flat baseline until they are
function guestInputTick(dt){
  if(role!=='host') return;
  guestIn.forEach((inp,id)=>{
    let g=guestHero.get(id);
    if(!g){ const ox=guestHero.size*1.5; g={x:ox,y:0,z:6,yaw:0,hp:GUEST_MAX_HP,max:GUEST_MAX_HP,dead:0,spawnX:ox}; guestHero.set(id,g); }
    // same 4s-then-respawn rule heroUpdate uses for the real hero; no movement while down. Respawns back at this
    // guest's own spawnX (not a recomputed guestHero.size*1.5, which drifts as players join/leave) so two guests
    // who go down around the same time don't stack on the identical point -- and sends the guest their own fresh
    // hp/position so their own client (see 'hp' below) snaps back in step rather than drifting from what they wandered to locally
    if(g.dead>0){ g.dead-=dt; if(g.dead<=0){ g.dead=0; g.hp=g.max; g.x=g.spawnX; g.z=6; g.y=0; send('hp',{hp:g.hp,max:g.max,dead:g.dead,x:g.x,y:g.y,z:g.z},id); } }
    else{
      let mx=0,mz=0; if(inp.w) mz+=1; if(inp.s) mz-=1; if(inp.d) mx+=1; if(inp.a) mx-=1;
      const len=Math.hypot(mx,mz);
      if(len>.05){ mx/=Math.max(len,1); mz/=Math.max(len,1);
        const fx=Math.sin(inp.yaw), fz=Math.cos(inp.yaw), rx=-Math.cos(inp.yaw), rz=Math.sin(inp.yaw);
        const vx=fx*mz+rx*mx, vz=fz*mz+rz*mx, spd=7.5*(inp.shift?11/7.5:1);
        moveCircle(g,vx*spd*dt,vz*spd*dt,.42,true);
        g.yaw=angLerp(g.yaw,Math.atan2(vx,vz),1-Math.exp(-12*dt)); }
      g.y=floorAt(g.x,g.z,g.y);
    }
    // the host renders every guest as a puppet on its own screen too, straight from the state it just simulated —
    // no need to round-trip its own broadcast, which never loops back to the sender anyway
    if(!window.__party.list().includes(id)) window.__party.add(id,HERO_GLB[inp.pick]||'witch.glb',heroLabel(inp.pick));
    window.__party.setTarget(id,g.x,g.z,g.yaw);
  });
}
function hurtGuestHero(id,dmg){ const g=guestHero.get(id); if(!g||g.dead>0) return; g.hp-=Math.max(1,Math.round(dmg)); if(g.hp<=0){ g.hp=0; g.dead=4; } send('hp',{hp:g.hp,max:g.max,dead:g.dead,x:g.x,y:g.y,z:g.z},id); }
// the guest's own client (see onMessage('hp') below) applies this straight to its own local `hero` -- otherwise the
// hp/dead this module tracks is host-private, so the one player it's happening to would see none of it: their own
// health bar, hurt flash/SFX, death toast and movement-freeze-on-death all read the LOCAL hero (game.js), and that
// local hero's own enemies array stays empty (a guest can't start a wave), so hurtHero() never fires through real
// local gameplay -- targeted (toId) rather than broadcast, since nobody else needs to know a guest's own raw hp
window.__combat={ guestHero:id=>{ const g=guestHero.get(id); return g?{x:+g.x.toFixed(2),z:+g.z.toFixed(2),hp:g.hp,max:g.max,dead:g.dead}:null; } };   // guestHero itself is this module's own private state (not re-exposed anywhere else, deliberately -- other modules reach it only through Meta.heroes()); this is purely a test hook
// co-op combat, part 1: enemies can now notice and damage a guest's hero, not just the host's own -- Meta.heroes()
// (game.js) is the hook updateEnemies/landHit read every tick; each entry closes over a live guestHero record, so
// isDead()/hurt() always reflect the CURRENT state at the moment an attack actually lands, not a stale snapshot
// taken when the enemy first picked its target
Meta.heroes=()=>[...guestHero.entries()].map(([id,g])=>({x:g.x,y:g.y,z:g.z,isDead:()=>g.dead>0,hurt:dmg=>hurtGuestHero(id,dmg)}));
// guest only: the host's authoritative hp/dead/position for THIS client's own hero, applied straight onto the local
// `hero` object -- reusing the exact same side effects hurtHero()/heroUpdate() already use for the real hero
// (flashDmg/SFX.hurt/the fall toast on death, the respawn toast/model-show/position-snap on recovery) so a guest's
// own screen finally shows what's already true on the host, rather than a permanently-full health bar that never
// moves. Local `hero.dead` is then left to count down on its own too (heroUpdate runs unconditionally every tick
// regardless of role) in parallel with the host's own guestHero.dead countdown -- both start from the same value
// at nearly the same real time, so the two respawns land within a network round-trip of each other; harmless, and
// this message is what corrects it either way once it arrives.
onMessage('hp',data=>{
  if(role!=='guest') return;
  const wasDead=hero.dead>0;
  if(data.dead>0&&!wasDead){ hero.hp=0; hero.dead=data.dead; hero.hurtT=3; flashDmg(); SFX.hurt(); toast('You fell! Back in 4 seconds…'); H.g.visible=false; heroShadow.visible=false; }
  else if(data.dead<=0&&wasDead){ hero.dead=0; hero.hp=data.max; hero.max=data.max; hero.x=data.x; hero.z=data.z; hero.y=data.y; hero.vy=0; H.g.visible=!useGLB; heroShadow.visible=true; if(GLBH){ GLBH.wrap.visible=useGLB; playHero('idle',{restart:true}); } toast('Back on your feet!'); }
  else if(data.dead<=0&&data.hp<hero.hp){ hero.hp=data.hp; hero.hurtT=3; flashDmg(); SFX.hurt(); }
  else hero.hp=data.hp;
});
// co-op combat, part 2: a guest's own swing, relayed to the host -- swing() is a plain top-level function (game.js),
// so this reassigns the same binding the swing key, click handler and window.__dd.swing all already look up by
// name (the same monkey-patch trick startWave uses in the phase-5 section above), rather than editing game.js.
// hero.swingT is captured BEFORE calling the original, not after: swing()'s own guard rejects a call made while
// swingT is already >=0, leaving swingT unchanged -- so checking only the post-call value can't tell a fresh swing
// (swingT was <0, just became 0) apart from a same-frame rejected duplicate (swingT was already 0, still is). Two
// swing-bound inputs (KeyF/KeyQ/either mouse button, game.js) landing in one frame gap is an ordinary way to mash
// an attack, and a rejected call sending a spurious 'swing' anyway would double guestHitCone's damage for one swing.
{ const origSwing=swing;
  swing=function(){ const before=hero.swingT; origSwing(); if(role==='guest'&&before<0&&hero.swingT===0) send('swing',{yaw:+cam.yaw.toFixed(3)}); }; }
function guestHitCone(id,yaw){
  const g=guestHero.get(id); if(!g||g.dead>0) return;
  const fx=Math.sin(yaw), fz=Math.cos(yaw); let n=0;
  for(const e of enemies){ if(e.dead) continue; const dx=e.x-g.x, dz=e.z-g.z, d=Math.hypot(dx,dz);
    if(d<GUEST_REACH+e.r&&(dx*fx+dz*fz)/Math.max(d,.01)>.4){ hurt(e,GUEST_DMG,fx*1.4,fz*1.4); n++; } }
  if(n) SFX.hit();
}
onMessage('swing',(data,fromId)=>{ guestHitCone(fromId,data.yaw); });
const guestStats=new Map();   // id -> {stat:{tow,trate,tarea},mult:{tow,tcd,aoe}} -- this guest's OWN gear/skill numbers, last reported
onMessage('input',(data,fromId)=>{ guestIn.set(fromId,data); if(data.stat&&data.mult) guestStats.set(fromId,{stat:data.stat,mult:data.mult}); });
Meta.defOwnerStat=(id,k)=>{ const s=guestStats.get(id); return s?s.stat[k]:undefined; };
Meta.defOwnerMult=(id,k)=>{ const s=guestStats.get(id); return s?s.mult[k]:undefined; };

let syncT=0;
function hostBroadcastHeroes(dt){
  if(role!=='host'||!conns.size) return;
  syncT+=dt; if(syncT<1/15) return; syncT=0;   // 15Hz: plenty for a puppet that already eases toward its target (98-party.js) rather than snapping to it
  const h=window.__dd.hero;
  const list=[{id:peer.id,x:+h.x.toFixed(3),z:+h.z.toFixed(3),yaw:+h.yaw.toFixed(3),pick:window.__heroes.pick()}];
  guestHero.forEach((g,id)=>{ const inp=guestIn.get(id); list.push({id,x:+g.x.toFixed(3),z:+g.z.toFixed(3),yaw:+g.yaw.toFixed(3),pick:(inp&&inp.pick)||'witch'}); });
  send('heroes',{list});
}
onMessage('heroes',data=>{
  const mine=peer&&peer.id;
  const ids=new Set();
  data.list.forEach(h=>{ ids.add(h.id); if(h.id===mine) return;   // that's me -- I already render my own local hero directly, not as a puppet of myself
    if(!window.__party.list().includes(h.id)) window.__party.add(h.id,HERO_GLB[h.pick]||'witch.glb',heroLabel(h.pick));
    window.__party.setTarget(h.id,h.x,h.z,h.yaw); });
  // a guest only ever hears about a departure through the roster shrinking (there's no direct connection between
  // two guests to carry a __leave event between them) -- so dropping whoever the latest roster no longer lists is
  // the only way any non-host screen finds out a fellow guest left
  window.__party.list().forEach(id=>{ if(!ids.has(id)) window.__party.remove(id); });
});

// guest only: this client's own keys and look, sent to the host a few times a second -- the same K/cam.yaw the
// local hero already moves from (heroUpdate, above), just relayed instead of applied here. Piggybacks the six
// heroStat/heroMult numbers a defense's own stat() (game.js) reads, computed from THIS client's own real gear and
// skills -- small, cheap to include every tick, and keeps a guest-placed defense's buffs live without a separate
// message type or having to reimplement gear-scoring on the host.
let syncTIn=0;
function guestSendInput(dt){
  if(role!=='guest') return;
  syncTIn+=dt; if(syncTIn<1/15) return; syncTIn=0;
  send('input',{w:K.w?1:0,s:K.s?1:0,a:K.a?1:0,d:K.d?1:0,shift:K.shift?1:0,yaw:+cam.yaw.toFixed(3),pick:window.__heroes.pick(),
    stat:{tow:heroStat('tow'),trate:heroStat('trate'),tarea:heroStat('tarea')},
    mult:{tow:heroMult('tow'),tcd:heroMult('tcd'),aoe:heroMult('aoe')}});
}

// ---- phase 5: the host's real crystal/wave state, so a guest is helping defend ONE hall rather than tracking a
// private one of their own that nobody else can see or that means anything. The guest's own S.crystal/S.wave never
// move (nothing spawns into their local `enemies` unless THEY start a wave, which is disabled below) — the HUD
// numbers a guest actually sees come from here instead, laid down by Meta.hud AFTER updateHUD's own now-irrelevant
// pass runs, the same override trick every hook in this codebase uses rather than editing game.js's own functions.
let hostWorld=null;
window.__world={ host:()=>hostWorld };
let syncTW=0;
function hostBroadcastWorld(dt){
  if(role!=='host'||!conns.size) return;
  syncTW+=dt; if(syncTW<1/10) return; syncTW=0;   // crystal/wave state changes slowly; 10Hz is plenty
  send('world',{crystal:S.crystal,crystalMax:CRYSTAL_MAX,wave:S.wave,phase:S.phase,waveTotal:MAP.waves,mapName:MAP.name,mana:S.mana,du:S.du,duCap:DU_CAP});
}
onMessage('world',data=>{ hostWorld=data; });

// starting a wave is the host's call alone -- a guest is visiting the host's hall, not running a second one next to
// it. startWave is a plain top-level function (game.js), so this reassigns the same binding every call site already
// looks up by name (the G key, the wave button, window.__dd.startWave) rather than touching game.js itself.
{ const origStartWave=startWave;
  startWave=function(){ if(role==='guest'){ toast("Only the host can start the wave — you're helping defend their hall"); return; } origStartWave(); }; }

{ const prevH=Meta.hud; Meta.hud=()=>{ prevH();
  if(role==='guest'&&hostWorld){ const w=hostWorld;
    $('cbar').style.width=Math.max(0,w.crystal/w.crystalMax*100)+'%';
    if(w.phase==='wave'){ $('wavet').textContent='WAVE '+w.wave+' / '+w.waveTotal; $('phaset').textContent='Helping defend the hall'; }
    else if(w.phase==='build'){ $('wavet').textContent=w.wave?'HALL HELD — BUILD PHASE':'BUILD PHASE'; $('phaset').textContent='Only the host can start the next wave'; }
    else if(w.phase==='won'){ $('wavet').textContent='HALL HELD — '+w.mapName+' CLEARED'; $('phaset').textContent=''; }
    else if(w.phase==='dead'){ $('wavet').textContent='THE CRYSTAL FELL'; $('phaset').textContent=''; }
    // the shared hall's real mana/roots, not this guest's own disconnected local numbers -- same source a
    // guest's placement/repair/upgrade requests actually draw from (hostTryPlaceDef/hostDefAction below)
    setT('mana',Math.floor(w.mana)); setT('du',w.du+'/'+w.duCap);
    DEFKEYS.forEach(k=>{ const el=$('slot-'+k), cfg=DEFS[k]; const cls='slot'+(placing===k?' sel':'')+((w.mana<cfg.mana||w.du+cfg.du>w.duCap)?' poor':''); if(el.className!==cls) el.className=cls; }); } }; }

// ---- phase 5, enemies slice: the host's real enemies, read-only puppets on every guest's screen. makeMob(kind) is
// synchronous (MOBGLB is pre-fetched at page load, game.js) so a puppet can be built the instant it's first seen,
// same as 98-party.js does for heroes — but unlike a hero puppet, a mob puppet eases toward its target with a
// simple exponential lerp rather than a capped linear speed, since mob speeds vary a lot by kind and status
// effects (slow/chill) that this slice doesn't track; good enough to read as movement, not meant to be exact.
// Animation is deliberately simpler than mobAnim (game.js): idle vs walking only, no shout/attack/death clips —
// mobAnim needs a fairly complete fake-enemy shape (e.swing, e.shoutT, mobSpd(e)'s slow/chill state) that isn't
// worth building yet for a puppet nobody can hurt or be hurt by until combat (the next phase) exists.
const MOBPUP=new Map();   // id -> {kind,mdl,x,y,z,yaw,tx,ty,tz,tyaw,walking,ph}
function mobPuppetAdd(id,kind){
  const m=makeMob(kind); scene.add(m.g);
  const p={kind,mdl:m,x:0,y:0,z:0,yaw:0,tx:0,ty:0,tz:0,tyaw:0,walking:false,ph:0};
  MOBPUP.set(id,p); return p;
}
function mobPuppetRemove(id){ const p=MOBPUP.get(id); if(!p) return; scene.remove(p.mdl.g); MOBPUP.delete(id); }   // no manual geometry/material dispose: makeMob's rigs are built the same way spawnEnemy's are, and the game's own enemy despawn (updateEnemies) never disposes them either -- they're shared/cached per kind, not per-instance
window.__mobsync={ list:()=>[...MOBPUP.keys()], get:id=>{ const p=MOBPUP.get(id); if(!p) return null; return {id,kind:p.kind,x:+p.x.toFixed(2),y:+p.y.toFixed(2),z:+p.z.toFixed(2),yaw:+p.yaw.toFixed(2),walking:p.walking}; } };
function mobPuppetsTick(dt){
  MOBPUP.forEach(p=>{ const k=1-Math.exp(-10*dt); const m=p.mdl;
    p.x=lerp(p.x,p.tx,k); p.y=lerp(p.y,p.ty,k); p.z=lerp(p.z,p.tz,k); p.yaw=angLerp(p.yaw,p.tyaw,k);
    if(m.glb){ const A=m.actions; const name=p.walking?(A.walk?'walk':(A.run?'run':null)):'idle'; if(name&&A[name]) mobPlay(m,name,{fade:.15}); m.mixer.update(dt); }
    else { p.ph+=dt*(p.walking?9:0); const w=p.walking?1:0;
      if(m.legs){ m.legs[0].rotation.x=Math.sin(p.ph)*.8*w; m.legs[1].rotation.x=-Math.sin(p.ph)*.8*w; }
      if(m.arms){ m.arms[0].rotation.x=-Math.sin(p.ph)*.6*w; m.arms[1].rotation.x=Math.sin(p.ph)*.6*w; } }
    m.g.position.set(p.x,p.y,p.z); m.g.rotation.y=p.yaw; });
}
let nextEnemyId=1, syncTE=0;
function hostBroadcastEnemies(dt){
  if(role!=='host'||!conns.size) return;
  syncTE+=dt; if(syncTE<1/12) return; syncTE=0;
  const list=enemies.filter(e=>!e.dead).map(e=>{ if(!e.__coopId) e.__coopId='e'+(nextEnemyId++);
    return {id:e.__coopId,kind:e.kind,x:+e.x.toFixed(2),y:+e.y.toFixed(2),z:+e.z.toFixed(2),yaw:+e.yaw.toFixed(2),walking:!!e.walking}; });   // y matters for flyers (drake etc, spawned at e.fly's altitude) -- without it they'd render as if grounded
  send('enemies',{list});
}
onMessage('enemies',data=>{
  const ids=new Set();
  data.list.forEach(e=>{ ids.add(e.id);
    let p=MOBPUP.get(e.id); if(!p){ p=mobPuppetAdd(e.id,e.kind); p.x=p.tx=e.x; p.y=p.ty=e.y; p.z=p.tz=e.z; p.yaw=p.tyaw=e.yaw; }   // snap on first sight, no popping in from the origin
    p.tx=e.x; p.ty=e.y; p.tz=e.z; p.tyaw=e.yaw; p.walking=e.walking; });
  [...MOBPUP.keys()].forEach(id=>{ if(!ids.has(id)) mobPuppetRemove(id); });   // a dead or despawned enemy just stops being in the list -- same roster-diff removal 99-network.js already uses for heroes
});

// ---- phase 5, defenses slice: the host's real defenses, read-only on every guest's screen — the last piece of
// world-sync. makeDef(kind,ghost,lvl) is fully monkey-patched by 50-defmodels.js into the same kind of synchronous,
// GLB-aware builder makeMob is (defTemplate(kind,lvl) picks whatever's loaded, falling back to the procedural
// shape) — a drop-in parallel. Unlike heroes or enemies, a defense never moves once placed, so there's no easing:
// a puppet snaps straight to its spot and only ever rebuilds if its level changes (mirroring how reskinDefs
// rebuilds the real thing on an upgrade or a late-loading model). y matters here too, the same lesson as flying
// enemies — a defense standing on the throne room's dais or stairs (base, not just x/z) needs its real elevation,
// or it would render as if planted in the floor below it. Deliberately skipped for this first cut: aiming (the
// yoke turning toward a target), recoil, and the aura defenses' glow ring (defRingUpdate, 93-gearsets.js) — a
// puppet just sits at its placed position and rotation, which is enough for enemies to visibly path around it.
const DEFPUP=new Map();   // id -> {kind,lvl,mdl}
function defPuppetAdd(id,kind,lvl,x,y,z,rot){
  const m=makeDef(kind,false,lvl); m.position.set(x,y,z); m.rotation.y=rot; scene.add(m);
  DEFPUP.set(id,{kind,lvl,mdl:m});
}
function defPuppetRemove(id){ const p=DEFPUP.get(id); if(!p) return; scene.remove(p.mdl); DEFPUP.delete(id); }   // no manual dispose, same reasoning as mob puppets: the real defs array's own removeDef never disposes either
window.__defsync={ list:()=>[...DEFPUP.keys()], get:id=>{ const p=DEFPUP.get(id); if(!p) return null; return {id,kind:p.kind,lvl:p.lvl,x:+p.mdl.position.x.toFixed(2),y:+p.mdl.position.y.toFixed(2),z:+p.mdl.position.z.toFixed(2)}; } };
let nextDefId=1, syncTD=0;
function hostBroadcastDefs(dt){
  if(role!=='host'||!conns.size) return;
  syncTD+=dt; if(syncTD<.5) return; syncTD=0;   // static once placed -- 2Hz is plenty to catch a new one, an upgrade, or one destroyed
  const list=defs.map(d=>{ if(!d.__coopId) d.__coopId='d'+(nextDefId++);
    return {id:d.__coopId,kind:d.kind,lvl:d.lvl||1,x:+d.x.toFixed(2),y:+d.base.toFixed(2),z:+d.z.toFixed(2),rot:+d.rot.toFixed(2)}; });
  send('defs',{list});
}
onMessage('defs',data=>{
  const ids=new Set();
  data.list.forEach(d=>{ ids.add(d.id);
    let p=DEFPUP.get(d.id);
    if(!p){ defPuppetAdd(d.id,d.kind,d.lvl,d.x,d.y,d.z,d.rot); return; }
    if(p.lvl!==d.lvl){ scene.remove(p.mdl); p.mdl=makeDef(d.kind,false,d.lvl); p.mdl.position.set(d.x,d.y,d.z); p.mdl.rotation.y=d.rot; scene.add(p.mdl); p.lvl=d.lvl; }
  });
  [...DEFPUP.keys()].forEach(id=>{ if(!ids.has(id)) defPuppetRemove(id); });   // sold or destroyed on the host -- same roster-diff removal as heroes and enemies
});

// ---- phase 7: guest defense placement -- placing, repairing, upgrading and selling a REAL defense on the host's
// hall, not a pointless one in the guest's own empty local defs. placeDefAt/repair/upgrade/sell are all plain
// top-level functions (game.js), so a guest's calls are redirected the same monkey-patch way swing/startWave
// already are; repair/upgrade/sell also gained an optional `pos` parameter in game.js itself (the one and only
// other core-file touch this effort has needed, alongside phase 6's `nearestHero`) so the host runs the exact same
// cost/effect math a real click would, from the guest's own tracked position, instead of a second, drift-prone
// copy of it here. Placement's target cell has nowhere else to come from but the guest's own aim, so it's trusted
// the same way a guest's swing yaw already is (guestHitCone, above) -- but bounded to a sane radius around the
// guest's own host-tracked position, so a guest can't insta-build clear across the map.
{ const origPlaceDefAt=placeDefAt;
  placeDefAt=function(kind,x,z,rot){
    if(role==='guest'){ send('place',{kind,x:+x.toFixed(2),z:+z.toFixed(2),yaw:+rot.toFixed(3)}); return null; }
    return origPlaceDefAt(kind,x,z,rot);
  }; }
function hostTryPlaceDef(kind,x,z,yaw,fromId){
  if(role!=='host') return;
  const cfg=DEFS[kind]; if(!cfg) return;
  const g=guestHero.get(fromId);
  // fail CLOSED, not open: an unregistered guest (no 'input' processed yet) or one still down from a death is
  // rejected outright rather than skipping the checks below that depend on knowing their real position
  if(!g){ send('toast','Not ready yet',fromId); return; }
  if(g.dead>0){ send('toast',"You're down — wait to respawn",fromId); return; }
  if(S.phase==='start'||S.phase==='dead'||S.phase==='won'||S.phase==='deathcut'){ send('toast','Not right now',fromId); return; }
  if(Math.hypot(x-g.x,z-g.z)>20){ send('toast','Too far away',fromId); return; }
  const cx=wc(x), cz=wcz(z), t=gat(cx,cz), cells=footprintCells(kind,x,z,yaw);
  let reason=null;
  if(!(t===T.FLOOR||t===T.CARPET)||cells.some(i=>!walk(grid[i]))) reason="Can't build there";
  else if(cells.some(i=>defAt[i])) reason='Already occupied';
  else if(cells.includes(idx(wc(g.x),wcz(g.z)))||Math.hypot(x-g.x,z-g.z)<1.1) reason="You're standing there";   // the same self-overlap rule updateGhost (game.js) enforces locally, mirrored here against the guest's own HOST-tracked position
  else if(S.du+cfg.du>DU_CAP) reason='Not enough Defense Units';
  else if(S.mana<cfg.mana) reason='Not enough mana';
  else if(enemies.some(e=>!e.dead&&Math.hypot(e.x-x,e.z-z)<2.2)) reason='Enemy too close';
  if(reason){ send('toast',reason,fromId); return; }
  const d=placeDefAt(kind,x,z,yaw); if(d) d.ownerId=fromId;   // stat() (game.js) reads this via Meta.defOwnerStat/Mult so the defense keeps ITS PLACER's buffs, not the host's own
}
onMessage('place',(data,fromId)=>hostTryPlaceDef(data.kind,data.x,data.z,data.yaw,fromId));

{ const origRepair=repair, origUpgrade=upgrade, origSell=sell;
  repair=function(pos){ if(role==='guest'){ send('defAction',{action:'repair'}); return; } origRepair(pos); };
  // upgrade's own binding is ALSO where 57-raven.js hooks the 'E' character-sheet shortcut (it has no independent
  // keydown listener of its own, unlike the tavern stations, which do and so are unaffected by this patch running
  // outermost/last-loaded) -- relaying unconditionally for a guest would silently break that shortcut every time
  // they're standing at the raven. window.__raven.near() is already a public check (game.js's own H-key handler
  // uses it the same way), so let the raven's own wrapper run first when it applies, and only relay otherwise.
  upgrade=function(pos){ if(role==='guest'){ if(window.__raven&&window.__raven.near()){ origUpgrade(pos); return; } send('defAction',{action:'upgrade'}); return; } origUpgrade(pos); };
  sell=function(pos){ if(role==='guest'){ send('defAction',{action:'sell'}); return; } origSell(pos); }; }
// runs the SAME real repair/upgrade/sell a host click would, from the acting guest's own host-tracked position --
// briefly swapping out toast() to relay whatever it would have said (success or rejection, the exact same text a
// local click gets) back to the guest who actually asked, instead of it silently appearing on the host's own
// screen misattributed to them. Safe because these functions are fully synchronous -- nothing else can call
// toast() between the swap and the restore. Upgrade specifically calls upgradeDef (game.js), not the bare
// upgrade() binding: other modules (tavern stations, the raven's hero-doll panel) also wrap upgrade() to open
// their own UI when the LOCAL player is standing by one, and none of those wrappers forward an argument -- a host
// processing a remote guest's request has no business running those purely local checks anyway.
function hostDefAction(data,fromId){
  if(role!=='host') return;
  const g=guestHero.get(fromId); if(!g) return;
  if(g.dead>0){ send('toast',"You're down — wait to respawn",fromId); return; }
  const pos={x:g.x,z:g.z};
  const origToast=toast; let said=null;
  toast=msg=>{ said=msg; };
  const manaBefore=S.mana;
  try{
    if(data.action==='repair') repair(pos);
    else if(data.action==='upgrade') upgradeDef(pos);
    else if(data.action==='sell') sell(pos);
  } finally { toast=origToast; }
  // repair()/sell() (game.js) only give world-space floatText feedback on success, never a toast() call -- nothing
  // a remote guest's own client ever renders. A mana change with nothing captured means it silently worked, so
  // synthesize the confirmation a local click's floatText would have shown; upgradeDef already toasts its own
  // success text, so 'said' is already set for that case and this branch is only reached by repair/sell
  if(said) send('toast',said,fromId);
  else if(S.mana!==manaBefore) send('toast',data.action==='sell'?'Sold':'Repaired',fromId);
}
onMessage('defAction',(data,fromId)=>hostDefAction(data,fromId));
onMessage('toast',msg=>{ if(role==='guest') toast(msg); });

onMessage('__leave',fromId=>{ window.__party.remove(fromId); guestIn.delete(fromId); guestHero.delete(fromId); guestStats.delete(fromId); [...MOBPUP.keys()].forEach(mobPuppetRemove); [...DEFPUP.keys()].forEach(defPuppetRemove); });   // guestStats gone -> Meta.defOwnerStat/Mult return undefined for whatever this guest placed -> stat() falls back to the host's own numbers, automatically
{ const prev=Meta.update; Meta.update=dt=>{ prev(dt); guestInputTick(dt); hostBroadcastHeroes(dt); hostBroadcastWorld(dt); hostBroadcastEnemies(dt); hostBroadcastDefs(dt); mobPuppetsTick(dt); guestSendInput(dt); }; }
})();
