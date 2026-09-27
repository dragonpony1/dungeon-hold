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
// param), each time narrowly and deliberately. Phase 8 closes the gap phase 7 left open: a guest's own SIMULATED
// HERO (not just what they place) now carries their real gear/skills too — "the guest should also carry their own
// stats, speed, damage, hp, weapon special damages, their equipment should affect their actions". guestInputTick's
// move speed now reads the same (1+move%)*moveMult formula heroUpdate() (game.js) does; guestHero gains a
// gear-scaled max hp (applyGear()'s delta-preserving bump on increase) and passive regen (heroUpdate()'s own
// hurtT-gated tick); hurtGuestHero mitigates by the guest's own def stat, same formula as hurtHero(). A swing's
// damage and reach now ride the swing message itself, read straight off the guest's own heroDmg()/hero.reach at
// the moment they swing (see the comment above guestHitCone for why per-swing beats the periodic sync here, and
// why this is a generalised melee/ranged cone rather than a true projectile port — a ranged guest's shot doesn't
// travel, single-target, or take a charge multiplier the way a real bolt/arrow does; still open, honestly, same as
// everything else in this list). game.js itself needed no changes for this phase — heroDmg()/heroStat()/heroMult()
// were already general enough to call from here. This phase's own testing also turned up a real, pre-existing bug
// in wire() (phase 2, below): PeerJS's 'open' event can fire more than once for the same DataConnection, and an
// unguarded second wire() call stacked a second 'data' listener on it, so every message after that point -- ANY
// one-shot relay, not just 'swing' -- was handled twice (a guest's swing landing for double damage was how this
// phase's own exact-value tests caught it, intermittently, maybe one run in three). Fixed with a one-line
// re-entrancy guard; unrelated to everything else in this phase but real enough to fix immediately rather than
// note and defer. (Persistent per-player loadouts, flagged as still-needed after phase 7, turned out to already be
// solved -- ddMeta/ddGear, parts/modules/10-meta.js and game.js, save to localStorage on every change already,
// independent of this whole module; loadout-persist-test.mjs proves it.) Phase 9 replaces phase 8's generalised
// ranged cone with a REAL bolt/arrow: a witch/fighter/troll archer guest's shot now travels, stops at the first
// wall or mob it meets, and pierces on a full draw, by spawning it into the host's own BOLTS/ARROWS (82-staff.js's
// fireBolt/83-bow.js's fireArrow, now exported raw) so the update loops already wired into Meta.update carry it
// forward unchanged. Relayed at hitCone()'s own release moment (a new, further-out hitCone wrap below), not
// swing()'s press moment -- the only point a held shot's final aim/charge is known. Still open: mini-boss
// roar/aggro shouting still only ever plays for whichever hero it's aimed at, a guest gets no local
// range-ring/cost-prompt affordance standing near a real defense (toast feedback only), the reticle never locks
// for a guest (window.__aim.pick() scans the local, always-empty `enemies`, so every guest shot is free-aim), and
// nobody but the host ever SEES a guest's bolt/arrow fly (bolts/arrows were never synced to other screens, even
// the host's own -- a pre-existing gap this phase didn't create or close). Phase 10 gives co-op an actual
// title-screen UI to reach any of this -- every phase before now only ever exposed it as a window.__net.host()/
// .join() console API, unusable by an ordinary player. HOST A GAME / JOIN A FRIEND buttons (parts/head.html's
// #start screen) wrap that same API: hosting shows the real room code and waits for the player to choose ENTER
// THE HALL; joining takes a typed code, shows a real error on a bad one, and auto-enters on success. Caught one
// real, pre-existing bug: game.js's own keydown handler already calls play() on Enter/Space while S.phase==='start',
// with no check for whether an input has focus -- unguarded, typing a code and hitting Enter to submit it would
// ALSO fire that. Fixed with stopPropagation() on the join input's own keydown, the same idiom 60-lootfeel.js/
// 65-tavernroom.js already use for their own inputs/overlays. peerOpts above already took a {host,port,path}
// override for tests; TEST_PEER_OPTS below reads it from the page's own query string (?peerhost=&peerport=&
// peerpath=) so coop-titleui-test.mjs can point the REAL buttons at a local signaling server instead of the public
// broker, without this module needing a second code path for tests vs. real play. Phase 11 fixes two real bugs a
// real two-player test (title-screen UI, phase 10, a real host + a real guest on separate devices) turned up that
// nothing scripted so far had caught: a guest's own hits were real -- landing on the host's actual enemies, for
// real damage -- but their screen never showed it, since hurt()'s floatText/SFX.hit are purely local to whoever's
// simulating the hit (the host); a guest's puppet enemy just silently lost hp with zero feedback until it eventually
// vanished, dead. Read by an actual player as "it's all basically cosmetic." Fixed by adding hp to
// hostBroadcastEnemies's payload and diffing it puppet-side, in onMessage('enemies',...): the SAME floatText/
// SFX.hit every local hit already uses, now guest-side too, no new message type or per-swing attribution needed.
// Second: when the host's real crystal fell (or their last wave broke), the HOST got dropped to the SHATTERED/HALL
// HELD screen alone -- a guest's own local S.phase never moves through 'deathcut'/'dead'/'won' at all (only the
// host's real hurtCrystal/winMap do that), so a guest just kept standing in a now-frozen, empty hall with no idea
// the run was over. onMessage('world',...) already told a guest's HUD the hall fell (the wavet/phaset text); it
// just never told a guest's own GAME. guestShowRunEnd reuses the same #dead overlay finishDeath()/winMap() already
// show solo, retitled for a guest (never Meta.onRunEnd -- that's the single-player reward/campaign-progress hook,
// scored off THIS client's own wave/gear, not something the host's outcome should trigger for a guest at all).
// Phase 12: loot and mana orbs are real for a guest now, and mana is per-player. Both of a real playtest's asks
// landed together since orb pickup is exactly where a guest's own pool gets earned into. "never saw any loot drop"
// shared its exact root cause with phase 11's hit-feedback bug: kill(e) (game.js) spawns both into the host's own
// arrays and updateLoot/updateOrbs only ever check the LOCAL hero, so a guest's own always-empty arrays never grow.
// hostBroadcastPickups syncs both as puppets (LOOTPUP/ORBPUP, the same roster-diff pattern as mobs/defs), and
// guestPickupTick/hostGuestPickupLoot/Orb add the part puppets alone can't: a real pickup request the instant the
// guest's own hero is close, validated and removed for real on the host (first-come-first-served), granted back to
// that guest specifically. Loot is simpler than first designed -- Meta.onPickup(it,pos) (10-meta.js) is ALREADY the
// complete real pickup flow and always returns true, the equip-or-sell-for-MANA fallback pickup() falls through to
// is dead code in the real game -- so guestApplyLoot just calls it directly, scoped to the guest's own bag for free.
// Then "split mana into separate pools per player": guestMana, seeded at MAP.mana||260 (S's own exact fallback --
// the default 'hall' map never sets MAP.mana at all, a real bug coop-pickups-test.mjs caught the moment the pool
// came back undefined), earned into by orb pickups (scaled by THAT guest's own mana stat, now on the 15Hz input
// payload) and the wave-held bonus (Meta.onWaveHeld wrapped, host-only by construction). Spending needed no game.js
// change: hostTryPlaceDef/hostDefAction point the shared S.mana binding at the acting guest's own pool for the
// duration of each synchronous call and read it back after, so the real cost formulas land on the right pool
// untouched. hostBroadcastWorld gains `manas` (everyone's own pool by peer id; `mana` keeps its host's-own meaning),
// and a guest's Meta.hud reads its own entry. DU stays hall-wide on purpose. Gold/xp for a wave-held are still
// host-only (10-meta.js's own onWaveHeld) -- a separate gap, deliberately not widened into here.
// ===== PHASE 13: guests earn what the host earns. Gold and xp for a held wave (Meta.onWaveHeld), the run's payout
// gold (Meta.onRunEnd's 25*wave, +150 for a map held) and xp for kills (Meta.onKill) all used to reach only the host's
// own Meta, since only the host runs the sim and fires those hooks; a guest could defend twenty waves and never level.
// Now the host relays each of them the moment it fires: 'waveHeld' and 'killXp' as direct sends (a guest applies the
// same Meta hooks on its own page, to its own gold/xp/level -- the mana half of a held wave already went to guestMana
// in phase 12), and the payout rides the existing 'runEnd'. Kill xp is PARTY xp -- every connected player gets the xp
// for every kill, whoever landed it -- because a guest's bolts and arrows are simulated on the host with no clean way
// to attribute a killing blow, and towers are shared anyway. What stays host-only, deliberately: Meta.onRunEnd's own
// bookkeeping (best wave, shop tier, campaign progress) -- that's the host's save telling the host's story.
// ===== PHASE 14: a lobby before the hall (99b-lobby.js, its own module): HOST A GAME and JOIN A FRIEND now both land
// in it, with a loading light per player and the host's map synced -- this file only hands over to it (openHost/
// openGuest in the title-screen block below) and gained two small hooks for it: onLeave (a listener for a connection
// closing, alongside the single __leave handler) and uiJoin (the real join flow, started by code for a rejoin).
(function(){
let peer=null, role=null;   // 'host' | 'guest' | null
const conns=new Map();      // one entry per connected remote peer, keyed by ITS peer id — same key on both host and guest sides, so the generic close handler below (and anything else keyed off a peer id) works identically for either role
const handlers={};          // message type -> fn(data, fromPeerId)
function onMessage(type,fn){ handlers[type]=fn; }
const leaveHooks=[];        // extra listeners for a connection closing, after the one __leave handler below (99b-lobby.js drops a row, or hears that the host left); each guarded so one can't break the rest
function onLeave(fn){ leaveHooks.push(fn); }
function send(type,data,toId){
  const msg=JSON.stringify({type,data});
  if(toId){ const c=conns.get(toId); if(c&&c.open) c.send(msg); return; }
  conns.forEach(c=>{ if(c.open) c.send(msg); });
}
function wire(conn){
  if(conn.__wired) return; conn.__wired=true;   // PeerJS's own 'open' event can fire more than once for the same DataConnection (seen intermittently in testing, most likely an ICE/negotiation retry) -- unguarded, a second wire() call stacked a second 'data' listener on the same conn, so every message after that point (including a one-shot action like 'swing'/'place'/'defAction') was handled twice
  conn.on('data',raw=>{ if(conns.get(conn.peer)!==conn&&conn.open) conns.set(conn.peer,conn);   // the connection a peer is actually talking on is the one to answer on (two of a joiner's attempts can both open -- see join())
    try{ const {type,data}=JSON.parse(raw); const h=handlers[type]; if(h) h(data,conn.peer); }catch(e){ console.warn('net parse',e); } });
  conn.on('close',()=>{ if(conns.get(conn.peer)!==conn) return;   // a superseded connection to the same peer (a join's earlier attempt, see join()) closing must not unregister the live one
    conns.delete(conn.peer); const h=handlers.__leave; if(h) h(conn.peer); leaveHooks.forEach(f=>{ try{ f(conn.peer); }catch(e){ console.warn('net leave hook',e); } }); });
}
// peerOpts: PeerJS's own constructor options, passed straight through — omitted, it uses the public cloud broker
// (0.peerjs.com); a test harness can point it at a local signaling server instead ({host,port,path}) without this
// module knowing or caring which one it's talking to.
// Staying on the broker (phase 14): the signaling server drops a peer whose tab goes quiet for a minute or so -- a phone busy
// decoding the throne room's models right after a lobby move, or a backgrounded tab -- and PeerJS then nulls peer.id and never
// comes back by itself. A host that fell off could take no more joiners on its code, and "me" (the heroes roster, the per-player
// mana, the lobby's own row) went missing. So selfId keeps the id from 'open', keepOnBroker reconnects with the same id (backing
// off), and join() connects to the host only on its FIRST 'open' -- PeerJS fires 'open' again after every reconnect. And an offer
// or answer lost while either side was off the broker leaves a connection pending forever (PeerJS never re-sends it): join()
// drops an attempt that is really stuck (see check() below) and makes a fresh one on the same Peer, backing off -- the join UI's
// own timeout message shows meanwhile, and a late success still lets them in.
let selfId=null;
function keepOnBroker(p){ let n=0; p.on('open',()=>{ n=0; }); p.on('disconnected',()=>{ setTimeout(()=>{ try{ if(p===peer&&!p.destroyed&&p.disconnected) p.reconnect(); }catch(e){} },Math.min(30000,1500*Math.pow(2,n++))); }); }
function host(roomCode,cb,peerOpts){
  role='host'; const p=peer=new Peer(roomCode||undefined,peerOpts); keepOnBroker(p);
  p.on('open',id=>{ selfId=id; cb&&cb(null,id); });
  p.on('connection',conn=>{ conn.on('open',()=>{ conns.set(conn.peer,conn); wire(conn); const h=handlers.__join; if(h) h(conn.peer); }); });
  p.on('error',e=>{ cb&&cb(e); });
}
const JOIN_RETRY_MS=+Q.get('joinretry')||12000;   // first retry of a stuck attempt (test-only override, the same idiom as ?jointimeout); then twice as long each time, up to a minute
function join(roomCode,cb,peerOpts){
  role='guest'; const p=peer=new Peer(undefined,peerOpts); keepOnBroker(p); let asked=false, done=false, tries=0;
  const attempt=()=>{ if(done||p!==peer||p.destroyed) return;
    if(p.disconnected){ setTimeout(attempt,3000); return; }   // off the broker for the moment (keepOnBroker is bringing it back): connect() would only refuse
    const conn=p.connect(roomCode,{reliable:true}), t0=Date.now(); let timer=0; if(!conn){ setTimeout(attempt,3000); return; }
    // only an attempt that is really stuck is dropped: no ICE under way at all (the offer or the answer never arrived) or ICE failed.
    // One still negotiating ('checking') gets up to two minutes -- on a busy page (a big map decoding) every step just comes late,
    // and cutting it off to start over would only start over late again
    const check=()=>{ if(done||conn.open||p!==peer||p.destroyed) return; const pc=conn.peerConnection, st=pc&&pc.iceConnectionState;
      if(st&&st!=='new'&&st!=='failed'&&st!=='closed'&&Date.now()-t0<120000){ timer=setTimeout(check,5000); return; }
      if(tries>=20) return;   // about twenty minutes of trying, then it stops by itself: a wrong code never lands
      try{ conn.close(); }catch(e){} tries++; attempt(); };
    timer=setTimeout(check,Math.min(60000,JOIN_RETRY_MS*Math.pow(2,tries)));
    conn.on('open',()=>{ if(done){ if(conns.get(conn.peer)!==conn) try{ conn.close(); }catch(e){} return; } done=true; clearTimeout(timer); conns.set(conn.peer,conn); wire(conn); cb&&cb(null,selfId); });   // done: 'open' can fire twice for one connection, and only one attempt may ever win -- a second attempt that opens too is closed
    conn.on('error',e=>{ cb&&cb(e); });
  };
  p.on('open',myId=>{ selfId=myId; if(asked) return; asked=true; attempt(); });
  p.on('error',e=>{ cb&&cb(e); });
}
function leave(){ conns.forEach(c=>c.close()); conns.clear(); if(peer) peer.destroy(); peer=null; role=null; selfId=null; }
window.__net={ host, join, leave, send, onMessage, onLeave, role:()=>role, peers:()=>[...conns.keys()], world:()=>hostWorld,
  hostId:()=>role==='guest'?[...conns.keys()][0]||null:null,   // a guest only ever has the one connection — a convenience name for it, same id __party keys its puppet under
  myId:()=>selfId||(peer&&peer.id)||null };

// title-screen host/join UI: co-op was previously a window.__net-only API, no in-game way for an ordinary player
// to actually use it -- these two buttons and their small panels (parts/head.html's #start screen) are that
// entry point. Wired here rather than game.js, same "co-op UI lives in this module" reasoning as everything else.
// A host gets shown their room code with a copy-to-clipboard tap, and since phase 14 a LOBBY (99b-lobby.js) under
// it instead of a bare "enter the hall" button: everyone who joins waits there, each with a loading light, until the
// host's START; a guest types the code they were given and lands in that same lobby rather than straight in the
// hall. The code itself is a short, spoken/typed-friendly one this module generates and hands to Peer()
// as the room's own id (shortRoomCode below) -- PeerJS's own default auto-generated id is a full UUID, fine for a
// machine but a real mouthful to read out or thumb-type on a phone, which real testing turned up fast. A 5-char
// code from a 32-symbol alphabet (no 0/O/1/I/L, easy to tell apart read aloud) is plenty for a handful of friends
// hosting at once; on the rare real collision (PeerJS's 'unavailable-id', the room's already taken by someone
// else's live game right now) hostbtn below just quietly tries a fresh code, up to a few times, rather than
// surfacing a confusing error for something this recoverable. game.js's own keydown handler (the Enter/Space ->
// play() branch, gated on S.phase==='start' with
// no check for whether an input has focus) would otherwise also fire while typing a code that happens to include
// a space, or on the Enter that's meant to submit it -- guarded the same way 60-lootfeel.js/65-tavernroom.js's own
// input-conflicting hotkeys already are, with stopPropagation on the input's own keydown before it can bubble.
// peerOpts is normally omitted (Peer's own default: the public 0.peerjs.com broker) -- a ?peerhost=&peerport=
// override exists purely so a test harness can point these same real buttons at a local signaling server instead,
// the same test-only escape hatch host()/join() themselves already take as a parameter.
const TEST_PEER_OPTS=Q.get('peerhost')?{host:Q.get('peerhost'),port:+Q.get('peerport')||9000,path:Q.get('peerpath')||'/peerjs'}:undefined;
// a 5-char code from a 32-symbol alphabet (no 0/O/1/I/L -- easy to tell apart read aloud or thumb-typed) rather
// than PeerJS's own default auto-generated id, a full UUID: fine for a machine, a real mouthful for a person
function shortRoomCode(){ const A='ABCDEFGHJKMNPQRSTUVWXYZ23456789'; let s=''; for(let i=0;i<5;i++) s+=A[Math.floor(Math.random()*A.length)]; return s; }
{ const hostbtn=$('hostbtn'), joinbtn=$('joinbtn'), coopRow=$('coopRow'), hostPanel=$('hostPanel'), hostMsg=$('hostMsg'),
    joinPanel=$('joinPanel'), joinCode=$('joinCode'), joinGoBtn=$('joinGoBtn'), joinMsg=$('joinMsg');
  hostbtn.addEventListener('click',()=>{
    coopRow.classList.add('hide'); hostPanel.classList.remove('hide'); hostMsg.textContent='Opening the gate…';
    let tries=0;
    const tryHost=()=>{
      let opened=false;
      window.__net.host(shortRoomCode(),(err,id)=>{
        if(opened) return;   // the same Peer can report a later error (its signaling socket dropping, say) -- that must not tear down a lobby that is already open; the data channels to anyone in it don't need the broker any more
        if(err){
          if(err.type==='unavailable-id'&&tries<4){ tries++; tryHost(); return; }   // a real collision on the room code itself -- quietly try a fresh one rather than surface a confusing error for something this recoverable
          hostMsg.textContent="Couldn't open a game — try again?"; hostPanel.classList.add('hide'); coopRow.classList.remove('hide'); return;
        }
        opened=true;
        hostMsg.innerHTML='Share this code with your friends:<br><span class="netCode" id="hostCode">'+id+'</span>';
        $('hostCode').addEventListener('click',()=>{ const c=$('hostCode'); try{ navigator.clipboard.writeText(id); c.textContent='copied!'; setTimeout(()=>{ c.textContent=id; },900); }catch(e){} });
        window.__lobby.openHost(id);   // the lobby (99b-lobby.js) takes it from here: the roster, the loading lights, START
      },TEST_PEER_OPTS);
    };
    tryHost();
  });
  joinbtn.addEventListener('click',()=>{ coopRow.classList.add('hide'); joinPanel.classList.remove('hide'); joinCode.focus(); });
  // WebRTC's own peer-to-peer negotiation (the actual connect, once both sides have reached the signaling server
  // fine) can just hang with neither an 'open' nor an 'error' ever firing -- a real, common failure mode on some
  // wifi/cellular networks (symmetric NAT, a firewall blocking UDP, one side's tab backgrounded and throttled by
  // the browser mid-negotiation), not something this module's own code controls. Left unguarded, a real player
  // hit exactly this: "Connecting…" forever, no error, no way to know anything was even wrong. JOIN_TIMEOUT below
  // doesn't cancel the underlying attempt (a slow real connection can still land after it fires -- settled just
  // stops the SAME outcome from being reported twice) -- it only stops leaving the player staring at an unchanging
  // message with zero signal, after a wait generous enough not to false-positive on an ordinary slow connection.
  const JOIN_TIMEOUT=+Q.get('jointimeout')||20000;   // test-only override (?jointimeout=300), same escape-hatch idiom as peerhost/peerport/peerpath above
  function doJoin(){
    let code=joinCode.value.trim(); if(!code) return; if(/^[a-z0-9]{4,8}$/i.test(code)) code=code.toUpperCase();   /* build 147: a short room code in any letter case (a phone keyboard capitalises the first letter or lowercases the lot); a long console-made id is left alone */
    joinMsg.textContent='Connecting…'; joinMsg.classList.remove('err'); joinGoBtn.disabled=true;
    let settled=false;
    const timer=setTimeout(()=>{
      if(settled) return; settled=true; joinGoBtn.disabled=false;
      joinMsg.textContent="Still not connecting — this can happen on some wifi/cellular networks. Double-check the code, make sure your friend's tab is open and active, or try again.";
      joinMsg.classList.add('err');
    },JOIN_TIMEOUT);
    window.__net.join(code,err=>{
      if(settled){ if(!err) window.__lobby.openGuest(code); return; }   // a late success after the timeout already showed -- still let them in (to the lobby) rather than strand a connection that did eventually land
      settled=true; clearTimeout(timer); joinGoBtn.disabled=false;
      if(err){ joinMsg.textContent="Couldn't connect — check the code and try again."; joinMsg.classList.add('err'); return; }
      window.__lobby.openGuest(code);   // phase 14: into the host's lobby, not straight into the hall -- the host's START (or, after it, this page's own room finishing its load) is what enters
    },TEST_PEER_OPTS);
  }
  joinGoBtn.addEventListener('click',doJoin);
  joinCode.addEventListener('keydown',e=>{ e.stopPropagation(); if(e.key==='Enter'){ e.preventDefault(); doJoin(); } });
  // the same join, started by code rather than a click: 99b-lobby.js rejoins the room this way after reloading onto the host's map
  window.__net.uiJoin=code=>{ coopRow.classList.add('hide'); joinPanel.classList.remove('hide'); joinCode.value=String(code||''); doJoin(); };
}

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
const guestHero=new Map();   // id -> {x,y,z,yaw,hp,max,hurtT,dead} the host moves each tick from guestIn, same collision rules as the real hero
const GUEST_MAX_HP=100, GUEST_REACH=2.4, GUEST_DMG=8;   // hero's own unequipped defaults/fallbacks (game.js: hero={hp:100,max:100,reach:2.4}, heroDmg()'s own base is 8) -- GUEST_MAX_HP now doubles as applyGear()'s own "100" base for the gear-scaled max below; REACH/DMG only matter if a 'swing' somehow arrives without them
// each guest gets their OWN mana pool, seeded at the same MAP.mana baseline the hall itself started with -- not a
// share of the host's own S.mana, which stays exactly what it always was, the HOST's own pool. See the phase-12
// header comment (top of file) for why this replaced a single shared S.mana for defense costs.
const guestMana=new Map();   // id -> number
const MAP_MANA=MAP.mana||260;   // the exact fallback S's own init (game.js: const S={mana:MAP.mana||260,...}) already uses -- some maps (the default 'hall' among them) never set their own MAP.mana at all
// the wave-held bonus (updateWave, game.js) only ever credits S.mana -- and, same as gold/xp (10-meta.js's own
// onWaveHeld, a separate, still-host-only gap not fixed here), only the HOST ever sees it, since a guest's own
// local S.phase never reaches 'wave' at all (startWave() is blocked for them below). Meta.onWaveHeld(effWave())
// is the one clean hook already firing at that exact moment -- host-only, by construction, so no role check would
// even be needed, but kept for clarity -- reused here to credit every connected guest's own pool with the same
// bonus their real teammate defending alongside them just earned, using the identical 50+10*wave formula.
{ const origOnWaveHeld=Meta.onWaveHeld;
  Meta.onWaveHeld=w=>{ origOnWaveHeld(w);
    if(role==='host'){ const bonus=50+10*w; guestMana.forEach((v,id)=>guestMana.set(id,Math.round((v+bonus)*10)/10)); send('waveHeld',{w}); } }; }   // phase 13: the gold/xp half goes to every guest too
onMessage('waveHeld',d=>{ if(role==='guest'&&d&&Number.isFinite(+d.w)) Meta.onWaveHeld(+d.w); });
// phase 13: party xp -- every kill's xp to every guest, as the host's own onKill fires
{ const origOnKill=Meta.onKill; Meta.onKill=e=>{ origOnKill(e); if(role==='host'&&e) send('killXp',{kind:e.kind}); }; }
onMessage('killXp',d=>{ if(role==='guest'&&d) Meta.onKill({kind:d.kind}); });
function guestInputTick(dt){
  if(role!=='host') return;
  guestIn.forEach((inp,id)=>{
    let g=guestHero.get(id);
    if(!g){ const ox=guestHero.size*1.5; g={x:ox,y:0,z:6,yaw:0,hp:GUEST_MAX_HP,max:GUEST_MAX_HP,hurtT:0,dead:0,spawnX:ox,holdT:.8}; guestHero.set(id,g); guestMana.set(id,MAP_MANA); send('hp',{hp:g.hp,max:g.max,dead:0,x:g.x,y:g.y,z:g.z},id); }   /* build 147: the guest's own position leads now (below), so on registration their local hero is put at this spawn (the 'hp' handler applies x/z) and the host holds its copy there for a moment rather than chasing the spot their page loaded them at, on top of the host */
    const s=guestStats.get(id);
    // gear-scaled max hp, delta-preserving on increase -- the same pattern applyGear() (game.js) uses for the real hero
    const newMax=Math.round((GUEST_MAX_HP+(s?s.stat.hp:0))*(s?s.mult.hp:1));
    if(newMax!==g.max){ if(newMax>g.max) g.hp+=newMax-g.max; g.max=newMax; g.hp=Math.min(g.hp,g.max); }
    // same 4s-then-respawn rule heroUpdate uses for the real hero; no movement while down. Respawns back at this
    // guest's own spawnX (not a recomputed guestHero.size*1.5, which drifts as players join/leave) so two guests
    // who go down around the same time don't stack on the identical point -- and sends the guest their own fresh
    // hp/position so their own client (see 'hp' below) snaps back in step rather than drifting from what they wandered to locally
    if(g.dead>0){ g.dead-=dt; if(g.dead<=0){ g.dead=0; g.hp=g.max; g.x=g.spawnX; g.z=6; g.y=0; send('hp',{hp:g.hp,max:g.max,dead:g.dead,x:g.x,y:g.y,z:g.z},id); } }
    else{
      g.hurtT-=dt; if(g.hurtT<0&&g.hp<g.max) g.hp=Math.min(g.max,g.hp+(1.5+(s?s.stat.regen:0))*dt);   // passive regen, same base rate and gear scaling as heroUpdate's (game.js)
      // build 147 ("having to calibrate in game to get avatars to sync"): the host used to re-simulate every guest from
      // the keys they sent, 15 times a second, while the guest's own screen moved their hero from the same keys at
      // 60 -- two copies of one hero that started apart and drifted further with every dropped packet, until walking
      // into a wall pinned both to the same spot. Now the guest's own position is the truth: the host walks its copy
      // toward it (through moveCircle, so walls and rails still hold) with a catch-up cap of 16 units a second, so a
      // late packet is caught up in a fraction of a second but nobody can teleport, and a jump of more than 30
      // units in one packet is ignored (a map mismatch, or nonsense). An older guest that sends no position still
      // gets the keys path below.
      if(g.holdT>0) g.holdT-=dt;
      else if(typeof inp.x==='number'&&typeof inp.z==='number'){ const dx=inp.x-g.x, dz=inp.z-g.z, d=Math.hypot(dx,dz); if(d>0&&d<30){ const k=Math.min(1,16*dt/d); moveCircle(g,dx*k,dz*k,.42,true); if(d>1.4){ g.stuckT=(g.stuckT||0)+dt; if(g.stuckT>.8){ g.x=inp.x; g.z=inp.z; g.stuckT=0; } } else g.stuckT=0; }   /* build 150 ("guests not doing any damage"): a copy that cannot walk to where its guest really stands (a hedge or a wall between, the guest on a ledge) snaps there after .8 s -- the guest's swings and the mobs' aim use the copy, so a copy stuck behind a defense fought nothing */ if(typeof inp.hyaw==='number') g.yaw=inp.hyaw; g.y=floorAt(g.x,g.z,g.y); }
      else {
      let mx=0,mz=0; if(inp.w) mz+=1; if(inp.s) mz-=1; if(inp.d) mx+=1; if(inp.a) mx-=1;
      const len=Math.hypot(mx,mz);
      if(len>.05){ mx/=Math.max(len,1); mz/=Math.max(len,1);
        const fx=Math.sin(inp.yaw), fz=Math.cos(inp.yaw), rx=-Math.cos(inp.yaw), rz=Math.sin(inp.yaw);
        const vx=fx*mz+rx*mx, vz=fz*mz+rz*mx;
        const mul=(inp.shift?11:7.5)/7.5*(1+(s?s.stat.move:0)/100)*(s?s.mult.move:1);   // same gear-scaled speed formula heroUpdate uses for the real hero
        moveCircle(g,vx*7.5*mul*dt,vz*7.5*mul*dt,.42,true);
        g.yaw=angLerp(g.yaw,Math.atan2(vx,vz),1-Math.exp(-12*dt)); }
      g.y=floorAt(g.x,g.z,g.y); }
    }
    // the host renders every guest as a puppet on its own screen too, straight from the state it just simulated —
    // no need to round-trip its own broadcast, which never loops back to the sender anyway
    window.__party.add(id,HERO_GLB[inp.pick]||'witch.glb',heroLabel(inp.pick));   // every tick: add() returns at once for the same rig and re-skins on a pick change (build 150)
    window.__party.setTarget(id,g.x,g.z,g.yaw); if(window.__party.setLook) window.__party.setLook(id,inp.look||null);   // build 150: the host dresses its copy of the guest from the look that rides the guest's input
  });
}
function hurtGuestHero(id,dmg){
  const g=guestHero.get(id); if(!g||g.dead>0) return;
  const s=guestStats.get(id), def=s?s.stat.def:0;
  dmg=Math.max(1,Math.round(dmg*(1-Math.min(75,def)/100)));   // same gear-scaled mitigation hurtHero() (game.js) applies to the real hero
  g.hp-=dmg; g.hurtT=3; if(g.hp<=0){ g.hp=0; g.dead=4; } send('hp',{hp:g.hp,max:g.max,dead:g.dead,x:g.x,y:g.y,z:g.z},id);
}
// the guest's own client (see onMessage('hp') below) applies this straight to its own local `hero` -- otherwise the
// hp/dead this module tracks is host-private, so the one player it's happening to would see none of it: their own
// health bar, hurt flash/SFX, death toast and movement-freeze-on-death all read the LOCAL hero (game.js), and that
// local hero's own enemies array stays empty (a guest can't start a wave), so hurtHero() never fires through real
// local gameplay -- targeted (toId) rather than broadcast, since nobody else needs to know a guest's own raw hp
window.__combat={ guestHero:id=>{ const g=guestHero.get(id); return g?{x:+g.x.toFixed(2),z:+g.z.toFixed(2),hp:g.hp,max:g.max,dead:g.dead}:null; },
  guestMana:id=>guestMana.has(id)?guestMana.get(id):null };   // guestHero/guestMana are this module's own private state (not re-exposed anywhere else, deliberately -- other modules reach them only through Meta.heroes()/hostTryPlaceDef etc.); this object is purely a test hook
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
// dmg and reach ride along on the swing message itself, not the periodic stat sync below: they're read straight off
// the guest's own live hero (heroDmg()/hero.reach) at the exact moment they swing, exactly like a real local swing
// would use them, and heroDmg() folds in a swingBase()/.38 ratio tied to which hero GLB and its attack-clip length
// is actually loaded on THIS client -- something the host has no equivalent of for a guest's puppet, so having the
// guest compute the final number itself (same idea as the periodic stat/mult below, just per-swing instead of 15Hz)
// is simpler and more accurate than trying to reconstruct the formula host-side. Ranged (bow/staff) guests are
// carved out of this path entirely below (phase 9) -- swing() fires at PRESS time, before any charge/aim-adjustment
// has happened, which is right for melee (swing lands almost immediately) but wrong for a held shot.
{ const origSwing=swing;
  swing=function(){ const before=hero.swingT; origSwing(); if(role==='guest'&&before<0&&hero.swingT===0&&!(window.__aim&&window.__aim.kind())) send('swing',{yaw:+hero.yaw.toFixed(3),x:+hero.x.toFixed(2),z:+hero.z.toFixed(2),dmg:Math.round(heroDmg()*10)/10,reach:+(hero.reach||GUEST_REACH).toFixed(2)}); }; }   // build 150 ("guests' defenses do damage but not the sword"): the swing carries the guest's OWN facing and spot -- hitCone() swings from hero.yaw (the way the hero faces, the walk's direction when moving), not the camera's yaw the relay used to send, and from where the guest really stands, not where the host's copy got to
// the melee cone: still not a faithful port of anything, just a straightforward "who's in front of me" check, same
// as the real local hitCone() (game.js) a melee hero uses -- ranged guests no longer come through here (phase 9,
// below, gives them a real bolt/arrow instead), so GUEST_REACH/GUEST_DMG's own fallbacks now only ever matter for
// a 'swing' that somehow arrives with no dmg/reach at all.
function guestHitCone(id,yaw,dmg,reach,at){
  const g=guestHero.get(id); if(!g||g.dead>0) return;
  const r=reach||GUEST_REACH, d=dmg||GUEST_DMG; const gx=(at&&typeof at.x==='number')?at.x:g.x, gz=(at&&typeof at.z==='number')?at.z:g.z;   // the guest's reported spot when it sends one (build 150); the host's copy otherwise
  if(Math.hypot(gx-g.x,gz-g.z)<30){ g.x=gx; g.z=gz; }   // and the copy is put there too: a swing is the surest word on where the guest is
  const fx=Math.sin(yaw), fz=Math.cos(yaw); let n=0;
  for(const e of enemies){ if(e.dead) continue; const dx=e.x-gx, dz=e.z-gz, dd=Math.hypot(dx,dz);
    if(dd<r+e.r&&(dx*fx+dz*fz)/Math.max(dd,.01)>.4){ hurt(e,d,fx*1.4,fz*1.4); n++; } }
  if(n) SFX.hit();
}
// phase 9: a ranged guest's shot is now a REAL bolt/arrow, not an instant cone -- it travels, stops at the first
// wall or mob it meets, and a full-draw arrow pierces, exactly like the host's own local shots (82-staff.js's
// fireBolt/83-bow.js's fireArrow, now exported raw for this reason). The trick: boltsUpdate/arrowsUpdate are
// ALREADY wired into Meta.update unconditionally (both files), on every page regardless of role -- so once the
// host spawns one of the guest's shots into its own BOLTS/ARROWS via the same fireBolt/fireArrow the host's own
// hitCone() calls, the existing per-tick collision/wall-block/pierce loop just carries it, hurting the host's REAL
// enemies exactly as it would for the host's own shot. Nothing about boltsUpdate/arrowsUpdate needed to change.
// The guest computes every derived number itself (dmg, speed, lifespan, splash/pierce, visual size) using the
// exact same formulas 82-staff.js/83-bow.js's own hitCone() overrides use, at the exact moment their OWN shot
// fires -- not swing()'s press-time, but hitCone() itself, hooked one layer further out below, which is where the
// real local fire happens too (after any charge/hold completes). This is also the earliest point aim-adjustment
// during a held shot is reflected, and the only point a full-draw arrow's pierce/a full-charge bolt's splash are
// known. window.__aim.pick() (the reticle's locked target) always returns null for a guest, since it scans the
// LOCAL `enemies` array (game.js) a guest never has real enemies in -- not a bug introduced here, just why every
// guest shot below is a free-aim ray (window.__aim.dir3()), never a homing lock, even standing right next to a mob.
{ const prevHitCone=hitCone;
  hitCone=function(){
    if(role==='guest'){
      const A=window.__aim, rk=A&&A.kind();
      if(rk&&!A.holding()){   // the real release moment: HOLD.on is already false by the time hitCone() reaches the actual fire (84-aim.js's own hitCone wrapper only lets this through once a held shot's release() has run)
        const wo=window.__weapons.mounted();
        if(wo){
          const isStaff=/^staff-/.test(wo.name);
          const d3=A.dir3(), sh=A.shot(), range=hero.reach||(isStaff?9:12);
          const spd=isStaff?26*(1+.35*sh.c):window.__bow.ARROW_V*(1+.45*sh.c);   // same speed formulas 82-staff.js/83-bow.js's own hitCone() overrides use
          send('shot',{wtype:isStaff?'bolt':'arrow',kind:wo.userData.kind,
            dmg:Math.round(heroDmg()*sh.mul*10)/10,
            dir:{x:+d3.fx.toFixed(3),y:+d3.fy.toFixed(3),z:+d3.fz.toFixed(3)},
            spd:+spd.toFixed(2), life:+((range+1)/spd).toFixed(3),
            size:+(isStaff?1+.7*sh.c:1+.4*sh.c).toFixed(2),
            splash:isStaff&&sh.full?1.9:0, pierce:!isStaff&&sh.full?2:0});
        }
      }
    }
    return prevHitCone();   // the guest's own local shot still fires too (their own screen's real visual/audio), against their own empty local `enemies` -- cosmetic only, the message above is what actually hurts anything
  };
}
function hostGuestShot(data,fromId){
  const g=guestHero.get(fromId); if(!g||g.dead>0) return;
  const from=new THREE.Vector3(g.x,g.y+(data.wtype==='bolt'?1.3:1.1),g.z);   // an approximate hand/head height -- the host has no bone-accurate rig for a guest's puppet to read the real one from, same "good enough to read as real" tradeoff the mob/def puppets already make
  const dir=new THREE.Vector3(data.dir.x,data.dir.y,data.dir.z);
  const opts={dmg:data.dmg,life:data.life,size:data.size,splash:data.splash,pierce:data.pierce};
  if(data.wtype==='bolt') window.__staff.fireBolt(data.kind,from,dir,data.spd,opts);
  else window.__bow.fireArrow(data.kind,from,dir,data.spd,opts);
}
onMessage('shot',(data,fromId)=>hostGuestShot(data,fromId));
onMessage('swing',(data,fromId)=>{ guestHitCone(fromId,data.yaw,data.dmg,data.reach,data); });
const guestStats=new Map();   // id -> {stat:{tow,trate,tarea,move,def,hp,regen},mult:{tow,tcd,aoe,move,hp}} -- this guest's OWN gear/skill numbers, last reported
onMessage('input',(data,fromId)=>{ guestIn.set(fromId,data); if(data.stat&&data.mult) guestStats.set(fromId,{stat:data.stat,mult:data.mult,kind:data.kind||{}}); });
Meta.defOwnerStat=(id,k)=>{ const s=guestStats.get(id); return s?s.stat[k]:undefined; };
Meta.defOwnerMult=(id,k)=>{ const s=guestStats.get(id); return s?s.mult[k]:undefined; };
Meta.defOwnerKind=(id,kind)=>{ const s=guestStats.get(id); return s?(s.kind&&s.kind[kind])||0:undefined; };   // that guest's own full-set power for this defense kind (94-voidset.js)

// build 150: what this player wears, resolved here (the weapon model key its own rig mounted, the tier, the weapon's set for
// the tint, the FULL set for the glow, the familiar's name and rarity) -- the receivers only need names (98-party.js dress)
function lookOf(){ const w=window.__weapons&&window.__weapons.look?window.__weapons.look():null; const full=Meta.sets&&Meta.sets.active?Meta.sets.active().find(a=>a.tier>=5):null; const fi=gear.familiar; return {w:w&&w.w||null,t:w&&w.t||1,ws:w&&w.s||null,s:full?full.name:null,f:fi?{n:fi.name,r:fi.rarity|0}:null}; }
let syncT=0;
function hostBroadcastHeroes(dt){
  if(role!=='host'||!conns.size) return;
  syncT+=dt; if(syncT<1/15) return; syncT=0;   // 15Hz: plenty for a puppet that already eases toward its target (98-party.js) rather than snapping to it
  const h=window.__dd.hero;
  const list=[{id:selfId,x:+h.x.toFixed(3),z:+h.z.toFixed(3),yaw:+h.yaw.toFixed(3),pick:window.__heroes.pick(),look:lookOf()}];
  guestHero.forEach((g,id)=>{ const inp=guestIn.get(id); list.push({id,x:+g.x.toFixed(3),z:+g.z.toFixed(3),yaw:+g.yaw.toFixed(3),pick:(inp&&inp.pick)||'witch',look:(inp&&inp.look)||null}); });   // a guest's look rides its input (build 150); relayed here so every guest sees every other
  send('heroes',{list});
}
onMessage('heroes',data=>{
  const mine=selfId;
  const ids=new Set();
  data.list.forEach(h=>{ ids.add(h.id); if(h.id===mine) return;   // that's me -- I already render my own local hero directly, not as a puppet of myself
    window.__party.add(h.id,HERO_GLB[h.pick]||'witch.glb',heroLabel(h.pick));   // same: a teammate's pick change re-skins their puppet here
    window.__party.setTarget(h.id,h.x,h.z,h.yaw); if(window.__party.setLook) window.__party.setLook(h.id,h.look||null); });
  // a guest only ever hears about a departure through the roster shrinking (there's no direct connection between
  // two guests to carry a __leave event between them) -- so dropping whoever the latest roster no longer lists is
  // the only way any non-host screen finds out a fellow guest left
  window.__party.list().forEach(id=>{ if(!ids.has(id)) window.__party.remove(id); });
});

// guest only: this client's own keys and look, sent to the host a few times a second -- the same K/cam.yaw the
// local hero already moves from (heroUpdate, above), just relayed instead of applied here. Piggybacks the
// heroStat/heroMult numbers a defense's own stat() (game.js) reads, computed from THIS client's own real gear and
// skills -- small, cheap to include every tick, and keeps a guest-placed defense's buffs live without a separate
// message type or having to reimplement gear-scoring on the host. Also carries the guest's own COMBAT-relevant
// numbers (move/def/hp/regen) that guestInputTick/hurtGuestHero above now read for their own hero, not just what
// they place -- dmg and reach travel separately, on the swing message itself (see the comment above guestHitCone).
let syncTIn=0;
function guestSendInput(dt){
  if(role!=='guest') return;
  syncTIn+=dt; if(syncTIn<1/15) return; syncTIn=0;
  send('input',{w:K.w?1:0,s:K.s?1:0,a:K.a?1:0,d:K.d?1:0,shift:K.shift?1:0,yaw:+cam.yaw.toFixed(3),pick:window.__heroes.pick(),x:+hero.x.toFixed(2),z:+hero.z.toFixed(2),hyaw:+hero.yaw.toFixed(3),   /* build 147: where this guest's own hero really is -- the host follows it instead of re-simulating the keys (see guestInputTick) */
    stat:{tow:heroStat('tow'),trate:heroStat('trate'),tarea:heroStat('tarea'),move:heroStat('move'),def:heroStat('def'),hp:heroStat('hp'),regen:heroStat('regen'),mana:heroStat('mana')},
    mult:{tow:heroMult('tow'),tcd:heroMult('tcd'),aoe:heroMult('aoe'),move:heroMult('move'),hp:heroMult('hp'),mana:heroMult('mana')},
    kind:Meta.defKindMap?Meta.defKindMap():{},   // a full set's per-defense-kind power (94-voidset.js), for the halos this guest places
    look:lookOf()});   // build 150: what this guest wears, for its puppet on every other screen
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
  // manas: phase 12 -- every connected player's OWN mana pool, keyed by peer id (mana is spent, and its display,
  // is per-player now; du/duCap below stay hall-wide on purpose, a structural cap on the hall itself, not a
  // personal resource). mana:S.mana stays too, unchanged meaning (the HOST's own pool) -- nothing else reads it
  // differently than before, so no existing caller (tests included) needed to change.
  const manas={}; manas[selfId]=S.mana; guestMana.forEach((v,id)=>{ manas[id]=v; });
  send('world',{crystal:S.crystal,crystalMax:CRYSTAL_MAX,wave:S.wave,phase:S.phase,waveTotal:MAP.waves,mapName:MAP.name,mana:S.mana,manas,du:S.du,duCap:DU_CAP});
}
// a guest's own local S.phase never actually moves through 'deathcut'/'dead'/'won' -- only the HOST's real crystal
// hitting 0, or its real last wave breaking, does that (hurtCrystal/winMap, game.js), and neither one so much as
// knows a guest exists. The HUD override above already told a guest's SCREEN the hall fell or held (the wavet/
// phaset text), but nothing ever told a guest's own GAME that the run was over -- so they just kept standing in an
// empty, frozen hall while the host got dropped straight to the SHATTERED/HALL HELD screen alone. This can't just
// piggyback on hostBroadcastWorld above, tempting as that looked: update() (game.js) stops calling Meta.update() --
// and everything inside it, hostBroadcastWorld included -- the INSTANT S.phase becomes 'deathcut', and never
// resumes once it's 'dead' either (the whole hall, guest puppets included, correctly freezes for the host's own
// death cutscene, then just... stays frozen, forever, for everyone, since nothing ever broadcasts again). A real
// two-player test written against that assumption caught it immediately: the guest's own phase never moved. Fixed
// with an explicit one-shot message sent directly from finishDeath()/winMap() themselves (monkey-patched below,
// same trick as startWave/swing/hitCone elsewhere in this file) rather than waiting for a periodic broadcast that
// silently stops firing at the exact moment it matters most. Reusing the same #dead overlay finishDeath()/winMap()
// already show solo, retitled for a guest (never Meta.onRunEnd -- that's the single-player reward/campaign-progress
// hook, scored off THIS client's own wave/gear, not something the host's outcome should trigger for a guest at all).
let guestRunEnded=false;
function guestShowRunEnd(w){
  guestRunEnded=true; S.phase=w.phase; cancelPlace(); droneOff(); setMusic('none');
  if(document.exitPointerLock) document.exitPointerLock(); document.body.classList.remove('play');
  if(w.phase==='won'){ SFX.held(); $('deadh1').textContent='HALL HELD'; $('deadh2').textContent=w.mapName+' is cleared'; }
  else { sting(); $('deadh1').textContent='SHATTERED'; $('deadh2').textContent='THE HALL FELL ON WAVE '+w.wave; }
  const pay=w.wave>0?25*w.wave+(w.phase==='won'?150:0):0; if(pay){ Meta.addGold(pay,'run'); Meta.save(); }   // phase 13: the run's payout, same formula as the host's onRunEnd
  $('deadp').textContent=(pay?'+'+pay+' ● gold for the run. ':'')+'Your own gear, gold and skills stay with you. Go again.';
  $('nextmapbtn').style.display='none'; $('dead').classList.remove('hide');
}
onMessage('world',data=>{ hostWorld=data; });
// build 147: "I couldn't hear any of the sound effects" (as a guest). Nearly every sound is played by the host's own
// simulation -- startWave's horn, a placement, a defense firing, a mob dying -- and none of that runs on a guest, whose
// world arrives as lists. So a guest derives the big ones from those lists: the horn when the host's phase turns to
// 'wave' and the held fanfare when it turns back, the crystal's hit (and the alarm bell) when its hp drops, a placement
// or an upgrade when the defs list gains a row or a mark, a death when an enemy leaves the list with its hp spent.
// Hits already sounded (phase 11, the hp diff); orbs and loot already sound on the grant. Shots stay silent for now
// (bolts and arrows are not synced). GSFX counts them for the suites.
const GSFX={horn:0,held:0,crystal:0,place:0,upgrade:0,die:0,phase:null,crystalHp:null,defsSeen:false,dieT:0};
window.__gsfx=()=>Object.assign({},GSFX);
function guestWorldSfx(w){ if(GSFX.phase&&GSFX.phase!==w.phase){ if(w.phase==='wave'){ SFX.horn(); GSFX.horn++; } else if(w.phase==='build'&&GSFX.phase==='wave'){ SFX.held(); GSFX.held++; } } GSFX.phase=w.phase;
  if(GSFX.crystalHp!==null&&w.crystal<GSFX.crystalHp-.01){ SFX.crystal(); if(SFX.alarm) SFX.alarm(); GSFX.crystal++; } GSFX.crystalHp=w.crystal; }
onMessage('runEnd',data=>{ if(role==='guest'&&!guestRunEnded){ if(data.phase==='won'){ try{ const cur=parseInt(localStorage.getItem('ddMapsCleared'))||0; localStorage.setItem('ddMapsCleared',String(Math.max(cur,MAPI+1))); }catch(e){} }   /* build 150: a hall held with the host counts for the guest too (winMap records it on the host only) -- the next room and the other heroes open for them as well */ guestShowRunEnd(data); } });
{ const origFinishDeath=finishDeath;
  finishDeath=function(){ origFinishDeath(); if(role==='host') send('runEnd',{phase:'dead',wave:S.wave}); }; }
{ const origWinMap=winMap;
  winMap=function(){ origWinMap(); if(role==='host') send('runEnd',{phase:'won',wave:S.wave,mapName:MAP.name}); }; }

// starting a wave is the host's call alone -- a guest is visiting the host's hall, not running a second one next to
// it. startWave is a plain top-level function (game.js), so this reassigns the same binding every call site already
// looks up by name (the G key, the wave button, window.__dd.startWave) rather than touching game.js itself.
{ const origStartWave=startWave;
  startWave=function(){ if(role==='guest'){ toast("Only the host can start the wave — you're helping defend their hall"); return; } origStartWave(); }; }

{ const prevH=Meta.hud; Meta.hud=()=>{ prevH();
  if(role==='guest'&&hostWorld){ const w=hostWorld; guestWorldSfx(w);
    $('cbar').style.width=Math.max(0,w.crystal/w.crystalMax*100)+'%';
    if(w.phase==='wave'){ $('wavet').textContent='WAVE '+w.wave+' / '+w.waveTotal; $('phaset').textContent='Helping defend the hall'; }
    else if(w.phase==='build'){ $('wavet').textContent=w.wave?'HALL HELD — BUILD PHASE':'BUILD PHASE'; $('phaset').textContent='Only the host can start the next wave'; }
    else if(w.phase==='won'){ $('wavet').textContent='HALL HELD — '+w.mapName+' CLEARED'; $('phaset').textContent=''; }
    else if(w.phase==='dead'){ $('wavet').textContent='THE CRYSTAL FELL'; $('phaset').textContent=''; }
    // this guest's OWN mana pool (phase 12 -- no longer the shared hall number), keyed out of w.manas by this
    // client's own peer id; the hall's real roots/DU cap stay shared, a structural cap on the hall, not personal
    const myMana=(w.manas&&window.__net.myId()in w.manas)?w.manas[window.__net.myId()]:0;
    setT('mana',Math.floor(myMana)); setT('du',w.du+'/'+w.duCap);
    DEFKEYS.forEach(k=>{ const el=$('slot-'+k), cfg=DEFS[k]; const cls='slot'+(placing===k?' sel':'')+((myMana<cfg.mana||w.du+cfg.du>w.duCap)?' poor':''); if(el.className!==cls) el.className=cls; }); } }; }

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
let mobHitFeedback=0;   // how many times a guest's own screen has shown "something just hit this" -- a test hook, not gameplay state
// build 150 ("guest bat not fighting at all"): a guest's pet aims at the host's mobs through these proxies of the mob puppets
// (30-familiar.js famFoes), stable per id so a chain-lightning hit list keeps working; a hit on one goes to the host as famHit
const MOBPROX=new Map(); const PROX_SIZE={ogre:[.95,2.3],trollboss:[.8,2.1],orc:[.6,1.6],archer:[.5,1.4],drake:[.6,1.2]};
function mobProxies(){ if(role!=='guest') return enemies; const out=[]; MOBPUP.forEach((p,id)=>{ let q=MOBPROX.get(id); if(!q){ const sz=PROX_SIZE[p.kind]||[.5,1.3]; q={puppet:true,__coopId:id,kind:p.kind,r:sz[0],h:sz[1],dead:0,slowT:0,fly:p.kind==='drake'}; MOBPROX.set(id,q); } q.x=p.x; q.y=p.y; q.z=p.z; q.hp=p.hp; q.dead=(p.hp<=0)?1:0; if(!q.dead) out.push(q); }); MOBPROX.forEach((q,id)=>{ if(!MOBPUP.has(id)) MOBPROX.delete(id); }); return out; }
onMessage('famHit',(data,fromId)=>{ if(role!=='host'||!data) return; const e=enemies.find(e=>e.__coopId===data.id&&!e.dead); if(!e) return; const dmg=Math.max(0,Math.min(400,+data.dmg||0)); if(dmg>0) hurt(e,dmg,+data.kx||0,+data.kz||0); });   // a guest's pet lands on the host's REAL mob, as guestHitCone and hostGuestShot do for the guest's own blows
window.__mobsync={ foes:mobProxies, list:()=>[...MOBPUP.keys()], get:id=>{ const p=MOBPUP.get(id); if(!p) return null; return {id,kind:p.kind,x:+p.x.toFixed(2),y:+p.y.toFixed(2),z:+p.z.toFixed(2),yaw:+p.yaw.toFixed(2),walking:p.walking,hp:p.hp}; }, hitFeedback:()=>mobHitFeedback };
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
const diedQ=[];   // build 147: mobs killed on the host since its last enemies list -- filled the moment kill() runs, not by scanning `enemies` at broadcast time (a mob killed and removed between two slow frames was never reported, and the guest never heard it die)
{ const prevKill=kill; kill=function(e){ const was=e&&e.dead; const r=prevKill.apply(this,arguments); if(role==='host'&&e&&!was&&e.dead){ if(!e.__coopId) e.__coopId='e'+(nextEnemyId++); diedQ.push({id:e.__coopId,kind:e.kind}); } return r; }; }
function hostBroadcastEnemies(dt){
  if(role!=='host'||!conns.size) return;
  syncTE+=dt; if(syncTE<1/12) return; syncTE=0;
  const list=enemies.filter(e=>!e.dead).map(e=>{ if(!e.__coopId) e.__coopId='e'+(nextEnemyId++);
    return {id:e.__coopId,kind:e.kind,x:+e.x.toFixed(2),y:+e.y.toFixed(2),z:+e.z.toFixed(2),yaw:+e.yaw.toFixed(2),walking:!!e.walking,hp:+e.hp.toFixed(1)}; });   // y matters for flyers (drake etc, spawned at e.fly's altitude) -- without it they'd render as if grounded; hp is new (see below)
  const died=diedQ.splice(0);   // build 147: every mob killed since the last list (queued by the kill wrapper below at the moment it happens, so a slow frame can never miss one), for the guest's death sound; one that leaves the list without dying reached the crystal
  send('enemies',{list,died});
}
// hp above is new: real hits (guestHitCone, hostGuestShot's bolts/arrows) already land on the host's REAL enemies --
// the damage was never fake -- but nothing ever told a GUEST's screen that anything happened. hurt() (game.js)
// spawns its floatText/SFX.hit purely on the HOST's own local scene; a guest's puppet enemy just sat there
// unchanged until it eventually vanished from the roster, dead. A real player testing this read it exactly right:
// "basically cosmetic" -- their swing landed, for real, but they had zero way to see or hear that it did. Comparing
// each puppet's previously-known hp against what just arrived reconstructs "something hit this" without any new
// message type or per-swing attribution back to a specific guest -- same floatText/SFX.hit every local hit already uses.
onMessage('enemies',data=>{
  const ids=new Set();
  data.list.forEach(e=>{ ids.add(e.id);
    let p=MOBPUP.get(e.id);
    if(!p){ p=mobPuppetAdd(e.id,e.kind); p.x=p.tx=e.x; p.y=p.ty=e.y; p.z=p.tz=e.z; p.yaw=p.tyaw=e.yaw; p.hp=e.hp; p.kind=e.kind; }   // snap on first sight, no popping in from the origin, and no false "hit" flash for however damaged it already was
    else if(e.hp<p.hp-.05){ floatText(p.x,p.y+1.5,p.z,String(Math.round((p.hp-e.hp)*10)/10),'#ffd060'); SFX.hit(); mobHitFeedback++; }
    p.tx=e.x; p.ty=e.y; p.tz=e.z; p.tyaw=e.yaw; p.walking=e.walking; p.hp=e.hp; });
  (data.died||[]).forEach(d=>{ const now=performance.now(); if(now-GSFX.dieT>80){ GSFX.dieT=now; if((d.kind==='ogre'||d.kind==='trollboss')&&SFX.bigDie) SFX.bigDie(); else SFX.die(); } GSFX.die++; });   // build 147: the death sound for each mob the host says died since its last list (throttled to one every 80 ms so a splash kill is a thud, not a drumroll)
  [...MOBPUP.keys()].forEach(id=>{ if(!ids.has(id)) mobPuppetRemove(id); });   // a dead or despawned enemy just stops being in the list -- same roster-diff removal 99-network.js already uses for heroes
});

// ---- phase 5, defenses slice: the host's real defenses, read-only on every guest's screen — the last piece of
// world-sync. makeDef(kind,ghost,lvl) is fully monkey-patched by 50-defmodels.js into the same kind of synchronous,
// GLB-aware builder makeMob is (defTemplate(kind,lvl) picks whatever's loaded, falling back to the procedural
// shape) — a drop-in parallel. Unlike heroes or enemies, a defense never moves once placed, so there's no easing:
// a puppet snaps straight to its spot and only rebuilds when its level changes or its mark's model lands late
// (mirroring how reskinDefs rebuilds the real thing). y matters here too, the same lesson as flying
// enemies — a defense standing on the throne room's dais or stairs (base, not just x/z) needs its real elevation,
// or it would render as if planted in the floor below it. Deliberately skipped for this first cut: aiming (the
// yoke turning toward a target), recoil, and the aura defenses' glow ring (defRingUpdate, 93-gearsets.js) — a
// puppet just sits at its placed position and rotation, which is enough for enemies to visibly path around it.
const DEFPUP=new Map();   // id -> {kind,lvl,mdl}
function defPuppetAdd(id,kind,lvl,x,y,z,rot){
  ensureDefMark(kind,lvl); ensureDefMark(kind,lvl+1);   // Marks II-IV are fetched lazily (50-defmodels.js), and only reskinDefs asks, over the local defs -- empty on a guest, who builds on the host -- so without this a guest never fetched them and saw every Mark II-V defense in its Mark I look
  const m=makeDef(kind,false,lvl); m.position.set(x,y,z); m.rotation.y=rot; scene.add(m);
  DEFPUP.set(id,{kind,lvl,mdl:m});
}
// the cage's show on a guest (build 148): the host cues charge / calm / implode over the wire (Meta.onDefFx), the guest runs
// the same cageAnim on its puppet and plays the implosion sound; the damage itself stays the host's, as for every defense
{ const prev=Meta.onDefFx; Meta.onDefFx=function(d,fx,arg){ prev(d,fx,arg); if(role!=='host'||!d) return; if(!d.__coopId) d.__coopId='d'+(nextDefId++); send('fx',{id:d.__coopId,fx,arg}); }; }
onMessage('fx',data=>{ const p=DEFPUP.get(data.id); if(!p||p.kind!=='slice') return; const fx=p.fx||(p.fx=cageState());
  if(data.fx==='charge'){ fx.phase='charge'; fx.t=0; fx.k=0; fx.dur=+data.arg||2; } else if(data.fx==='calm'){ fx.phase='rest'; fx.t=0; } else if(data.fx==='implode'){ fx.phase='boom'; fx.t=0; fx.k=1; fx.cloud=DEFS.slice.cloud; SFX.implode(); } });
function defPuppetsTick(dt){ if(role!=='guest') return; DEFPUP.forEach(p=>{ if(p.kind!=='slice') return; const fx=p.fx||(p.fx=cageState()); fx.t+=dt;
  if(fx.phase==='charge'){ fx.k=Math.min(1,fx.t/fx.dur); if(fx.t>fx.dur+1){ fx.phase='rest'; fx.t=0; } } else if(fx.phase==='boom'){ if(fx.t>=.45){ fx.phase='rest'; fx.t=0; fx.k=0; } } else if(fx.t>fx.next){ fx.t=0; fx.next=R(3,7); fx.flex=.5; }
  if(fx.cloud>0) fx.cloud-=dt; cageAnim(p.mdl,fx,dt,fx.phase==='rest'?0:1); }); }
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
    if(!p){ defPuppetAdd(d.id,d.kind,d.lvl,d.x,d.y,d.z,d.rot); if(GSFX.defsSeen){ SFX.place(); GSFX.place++; } return; }   // a defense set down since the last list: the placement sound (build 147), whoever placed it
    ensureDefMark(d.kind,d.lvl); ensureDefMark(d.kind,d.lvl+1); const T=defTemplate(d.kind,d.lvl);   // an upgrade on the host asks for that mark's model here too (and the next one up), as reskinDefs does for the host's own
    if(d.lvl>p.lvl){ SFX.place(); GSFX.upgrade++; }   // a mark up: the same sound the host hears for it (build 147)
    if(p.lvl!==d.lvl||(T&&p.mdl.userData.tpl!==T)){ scene.remove(p.mdl); p.mdl=makeDef(d.kind,false,d.lvl); p.mdl.position.set(d.x,d.y,d.z); p.mdl.rotation.y=d.rot; scene.add(p.mdl); p.lvl=d.lvl; }   // a new mark, or its model just landed (the first build wore the mark below while it downloaded): the same test reskinDefs makes, caught on the host's next list, twice a second
  });
  [...DEFPUP.keys()].forEach(id=>{ if(!ids.has(id)) defPuppetRemove(id); });   // sold or destroyed on the host -- same roster-diff removal as heroes and enemies
  GSFX.defsSeen=true;   // from the second list on, a new row is a placement worth a sound; the first list is the hall as found
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
// phase 12: mana cost checks/spends below read/write the shared S.mana binding -- but by the time this runs it's
// been temporarily swapped to mean THIS guest's own pool (see the S.mana swap around the call site, same trick
// hostDefAction below already uses), so placeDefAt's own internal S.mana-=cfg.mana (game.js) lands on the right
// pool with zero changes to game.js itself.
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
  const realMana=S.mana; S.mana=guestMana.has(fromId)?guestMana.get(fromId):MAP_MANA;
  if(!reason&&S.mana<cfg.mana) reason='Not enough mana';
  else if(!reason&&enemies.some(e=>!e.dead&&Math.hypot(e.x-x,e.z-z)<2.2)) reason='Enemy too close';
  if(reason){ S.mana=realMana; send('toast',reason,fromId); return; }
  const d=placeDefAt(kind,x,z,yaw); if(d) d.ownerId=fromId;   // stat() (game.js) reads this via Meta.defOwnerStat/Mult so the defense keeps ITS PLACER's buffs, not the host's own
  guestMana.set(fromId,S.mana); S.mana=realMana;
}
onMessage('place',(data,fromId)=>hostTryPlaceDef(data.kind,data.x,data.z,data.yaw,fromId));

{ const origRepair=repair, origUpgrade=upgrade, origSell=sell;
  repair=function(pos){ if(role==='guest'){ send('defAction',{action:'repair'}); return; } origRepair(pos); };
  // upgrade's own binding is ALSO where 57-raven.js hooks the 'E' character-sheet shortcut (it has no independent
  // keydown listener of its own, unlike the tavern stations, which do and so are unaffected by this patch running
  // outermost/last-loaded) -- relaying unconditionally for a guest would silently break that shortcut every time
  // they're standing at the raven. window.__raven.near() is already a public check (game.js's own H-key handler
  // uses it the same way), so let the raven's own wrapper run first when it applies, and only relay otherwise.
  upgrade=function(pos){ if(role==='guest'){ if((window.__raven&&window.__raven.near())||(window.__hideout&&window.__hideout.near())){ origUpgrade(pos); return; } /* the raven and the portal are local things, not defenses: E there stays on this machine (59-hideout.js hooks upgrade underneath this) */ send('defAction',{action:'upgrade'}); return; } origUpgrade(pos); };
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
  // repair/upgradeDef/sell (game.js) read/write the shared S.mana binding directly -- temporarily pointing it at
  // THIS guest's own pool for the duration of this one synchronous call (same trick hostTryPlaceDef above uses)
  // reuses their exact real cost formulas and success/failure messaging with no duplication and no game.js changes
  const realMana=S.mana; S.mana=guestMana.has(fromId)?guestMana.get(fromId):MAP_MANA;
  const manaBefore=S.mana;
  try{
    if(data.action==='repair') repair(pos);
    else if(data.action==='upgrade') upgradeDef(pos);
    else if(data.action==='sell') sell(pos);
  } finally { toast=origToast; }
  guestMana.set(fromId,S.mana); S.mana=realMana;
  // repair()/sell() (game.js) only give world-space floatText feedback on success, never a toast() call -- nothing
  // a remote guest's own client ever renders. A mana change with nothing captured means it silently worked, so
  // synthesize the confirmation a local click's floatText would have shown; upgradeDef already toasts its own
  // success text, so 'said' is already set for that case and this branch is only reached by repair/sell
  if(said) send('toast',said,fromId);
  else if(guestMana.get(fromId)!==manaBefore) send('toast',data.action==='sell'?'Sold':'Repaired',fromId);
}
onMessage('defAction',(data,fromId)=>hostDefAction(data,fromId));
onMessage('toast',msg=>{ if(role==='guest') toast(msg); });

// ---- phase 12: loot and mana orbs, read-only puppets on every guest's screen, with a real pickup round trip so a
// guest can actually collect either -- not just see them. Both share the exact same root cause: kill(e) (game.js)
// spawns BOTH into the host's own loot/orbs arrays, and updateLoot/updateOrbs (game.js) only ever check proximity
// against the LOCAL `hero`, so a guest's own local (always-empty) arrays never grow and nothing a guest does
// locally can reach them -- a real player caught this directly: "i joined him and never saw any loot drop."
// Puppets alone would only be half the fix (mob/def puppets are correctly look-but-don't-touch, since nothing CAN
// touch them); loot and orbs are meant to be collected, into something genuinely THIS PLAYER's own -- their bag
// (already fully persistent, loadout-persist-test.mjs) for loot, their own mana pool (guestMana above) for orbs.
// So a guest requesting a pickup gets it granted back to them specifically, applied with their own local logic,
// the same "host validates and owns what's real, the requesting client computes/applies its own numbers" split
// phase 8/9 already established for damage and projectiles, not a new pattern invented here. Loot turned out
// simpler than first designed: Meta.onPickup(it,pos) (10-meta.js) is ALREADY the complete real pickup flow (bag
// it, or auto-sell for GOLD if the bag is full) and always returns true for a valid item -- the equip-or-sell-for-
// MANA fallback pickup() (game.js) itself falls through to is dead code in the real game, never reached, so
// guestApplyLoot below just calls Meta.onPickup directly rather than reimplementing that unreachable branch.
const LOOTPUP=new Map(), ORBPUP=new Map();   // id -> {kind,mesh,x,y,z,tx,ty,tz}
let nextPickupId=1, syncTP=0;
function pickupPuppetAdd(id,kind,fakeIt){
  const mesh=kind==='loot'?lootMesh(fakeIt):orbMesh(); scene.add(mesh);
  const p={kind,mesh,x:0,y:0,z:0,tx:0,ty:0,tz:0}; (kind==='loot'?LOOTPUP:ORBPUP).set(id,p); return p;
}
function pickupPuppetRemove(id){ let p=LOOTPUP.get(id); if(p){ scene.remove(p.mesh); LOOTPUP.delete(id); return; } p=ORBPUP.get(id); if(p){ scene.remove(p.mesh); ORBPUP.delete(id); } }
window.__pickupsync={ loot:()=>[...LOOTPUP.keys()], orbs:()=>[...ORBPUP.keys()],
  lootAt:id=>{ const p=LOOTPUP.get(id); return p?{x:+p.x.toFixed(2),y:+p.y.toFixed(2),z:+p.z.toFixed(2)}:null; },
  orbAt:id=>{ const p=ORBPUP.get(id); return p?{x:+p.x.toFixed(2),y:+p.y.toFixed(2),z:+p.z.toFixed(2)}:null; } };   // purely a test hook, same reasoning as window.__mobsync/__combat above
function pickupPuppetsTick(dt){
  const k=1-Math.exp(-10*dt);
  LOOTPUP.forEach(p=>{ p.x=lerp(p.x,p.tx,k); p.y=lerp(p.y,p.ty,k); p.z=lerp(p.z,p.tz,k); p.mesh.position.set(p.x,p.y,p.z);
    if(p.mesh.userData.item) p.mesh.userData.item.rotation.y+=dt*2; if(p.mesh.userData.ring) p.mesh.userData.ring.scale.setScalar(1+Math.sin(S.t*4)*.08); });
  ORBPUP.forEach(p=>{ p.x=lerp(p.x,p.tx,k); p.y=lerp(p.y,p.ty,k); p.z=lerp(p.z,p.tz,k); p.mesh.position.set(p.x,p.y+Math.sin(S.t*4)*.05,p.z);
    if(p.mesh.userData.o) p.mesh.userData.o.rotation.y+=dt*3; });
}
function hostBroadcastPickups(dt){
  if(role!=='host'||!conns.size) return;
  syncTP+=dt; if(syncTP<1/10) return; syncTP=0;
  const lootList=loot.map(l=>{ if(!l.__coopId) l.__coopId='p'+(nextPickupId++); return {id:l.__coopId,x:+l.x.toFixed(2),y:+l.y.toFixed(2),z:+l.z.toFixed(2),rarity:l.it.rarity,slot:l.it.slot}; });
  const orbList=orbs.map(o=>{ if(!o.__coopId) o.__coopId='p'+(nextPickupId++); return {id:o.__coopId,x:+o.x.toFixed(2),y:+o.y.toFixed(2),z:+o.z.toFixed(2)}; });
  send('pickups',{loot:lootList,orbs:orbList});
}
onMessage('pickups',data=>{
  const ids=new Set();
  data.loot.forEach(l=>{ ids.add(l.id); let p=LOOTPUP.get(l.id); if(!p){ p=pickupPuppetAdd(l.id,'loot',{rarity:l.rarity,slot:l.slot}); p.x=p.tx=l.x; p.y=p.ty=l.y; p.z=p.tz=l.z; } p.tx=l.x; p.ty=l.y; p.tz=l.z; });
  data.orbs.forEach(o=>{ ids.add(o.id); let p=ORBPUP.get(o.id); if(!p){ p=pickupPuppetAdd(o.id,'orb'); p.x=p.tx=o.x; p.y=p.ty=o.y; p.z=p.tz=o.z; } p.tx=o.x; p.ty=o.y; p.tz=o.z; });
  [...[...LOOTPUP.keys()],...[...ORBPUP.keys()]].forEach(id=>{ if(!ids.has(id)) pickupPuppetRemove(id); });   // a collected or despawned pickup just stops being in the list -- same roster-diff removal every puppet type here already uses
});
// a guest requests a pickup once, the instant they're close enough -- `requested` just stops it asking again every
// tick while it waits on the host's reply; the puppet vanishing on the next broadcast (collected by anyone, or
// simply not renewed) makes the id irrelevant either way, so this never needs to be cleared
const requested=new Set();
function guestPickupTick(dt){
  if(role!=='guest'||hero.dead>0) return;
  LOOTPUP.forEach((p,id)=>{ if(requested.has(id)) return; if(Math.hypot(hero.x-p.x,hero.z-p.z)<1.2&&Math.abs(hero.y-p.y)<1.6){ requested.add(id); send('pickupLoot',{id}); } });
  ORBPUP.forEach((p,id)=>{ if(requested.has(id)) return; if(Math.hypot(hero.x-p.x,hero.z-p.z)<1.1&&Math.abs(hero.y-p.y)<1.6){ requested.add(id); send('pickupOrb',{id}); } });
}
function hostGuestPickupLoot(data,fromId){
  if(role!=='host') return;
  const i=loot.findIndex(l=>l.__coopId===data.id); if(i<0) return;   // already gone -- someone else got it, or it despawned; the puppet vanishes from the next broadcast regardless, no need to tell them
  const l=loot[i]; scene.remove(l.mesh); loot.splice(i,1);
  send('lootGrant',{it:l.it},fromId);
}
onMessage('pickupLoot',(data,fromId)=>hostGuestPickupLoot(data,fromId));
function hostGuestPickupOrb(data,fromId){
  if(role!=='host') return;
  const i=orbs.findIndex(o=>o.__coopId===data.id); if(i<0) return;
  const o=orbs[i]; scene.remove(o.mesh); orbs.splice(i,1);
  const s=guestStats.get(fromId), v=Math.round(5*MANA_ORB_MUL*(1+(s?s.stat.mana:0)/100)*(s?s.mult.mana:1)*10)/10;   // same formula updateOrbs (game.js) uses for the real hero, now read off THIS guest's own reported mana stat
  guestMana.set(fromId,Math.round(((guestMana.has(fromId)?guestMana.get(fromId):MAP_MANA)+v)*10)/10);
  SFX.mana(); send('orbGrant',{v},fromId);
}
onMessage('pickupOrb',(data,fromId)=>hostGuestPickupOrb(data,fromId));
function guestApplyLoot(it){ Meta.onPickup(it,{x:hero.x,y:hero.y,z:hero.z}); }   // the complete real pickup flow, scoped to THIS client's own Meta/bag/gold entirely for free
onMessage('lootGrant',data=>{ if(role==='guest') guestApplyLoot(data.it); });
onMessage('orbGrant',data=>{ if(role!=='guest') return; SFX.mana(); floatText(hero.x,hero.y+1,hero.z,'+'+data.v,'#5ee9ff'); });

onMessage('__leave',fromId=>{ window.__party.remove(fromId); guestIn.delete(fromId); guestHero.delete(fromId); guestStats.delete(fromId); guestMana.delete(fromId); [...MOBPUP.keys()].forEach(mobPuppetRemove); [...DEFPUP.keys()].forEach(defPuppetRemove); });   // guestStats gone -> Meta.defOwnerStat/Mult return undefined for whatever this guest placed -> stat() falls back to the host's own numbers, automatically
{ const prev=Meta.update; Meta.update=dt=>{ prev(dt); guestInputTick(dt); hostBroadcastHeroes(dt); hostBroadcastWorld(dt); hostBroadcastEnemies(dt); hostBroadcastDefs(dt); hostBroadcastPickups(dt); mobPuppetsTick(dt); defPuppetsTick(dt); pickupPuppetsTick(dt); guestPickupTick(dt); guestSendInput(dt); }; }
})();
