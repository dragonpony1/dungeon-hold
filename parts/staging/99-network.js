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
// ===== BUILD 159: KNOWING WHEN SOMEONE IS GONE. The only departure signal used to be PeerJS's own 'close', and PeerJS closes
// a connection only when ICE reports 'failed' or 'closed' -- which Chrome never does for a tab that dies (closed, crashed,
// a phone's browser killed, wifi gone): ICE sits at 'disconnected' forever and the data channel still says 'open'. So a
// host kept a dead guest's frozen gnome in the hall (mobs kept walking over to hit it) and kept stuffing updates at it, and a
// guest whose host had gone stood in a dead hall forever, horn refused, nothing said. Now every page sends a tiny 'alive'
// once a second on a timer (never the frame loop, which stops under a menu or in a hidden tab), and a peer is dropped --
// through the same close path a clean leave takes, so the lobby row, the puppet and a guest's defense stats all go exactly
// as before -- when its link is dead ('failed'/'closed'), or when it has been silent 6 s AND its link has stopped answering
// too. Silence alone never drops anyone: a page busy decoding the throne room, or a phone that has just locked, still has
// a live link, and comes back. A peer that says it is going to the background gets a minute instead of 6 s. Whoever leaves
// on purpose (RETURN TO TITLE, NEXT MAP, REPLAY, TRY AGAIN, the hideout, closing the tab -- they all unload the page) says
// 'bye' from pagehide first, so the others react at once. A guest in the hall whose host is gone gets the end screen, THE
// HOST LEFT, and a way back to the title (guestHostLeft); one still in the lobby gets the lobby's own "the host left".
// Also: one Peer per page (a second JOIN or HOST shuts the first attempt, which could otherwise open a second live
// connection from one tab -- double gold, a puppet of yourself), four players at most ('full'), and the host and join
// errors say what actually happened (the matchmaking server, no such game, or two networks that can't reach each other).
// ===== BUILD 159 (2/7): THE HALL DOESN'T PAUSE IN CO-OP. The whole simulation -- and every broadcast here, which all ride
// Meta.update -- only ran while no menu was open, so the host opening the bag, the sheet, a tavern station, the forge or the
// pause menu (which opens by itself when the mouse leaves pointer lock: an alt-tab to Discord) froze the hall for everyone, mobs
// stopped mid-stride and nothing said; a hidden host tab (another tab in front, the window minimised or covered) froze it too,
// since the only thing driving the hall was the frame loop and a browser stops that for a hidden page. Now, while a page hosts a
// hall with anyone in it, the hall runs on under the host's menus (Meta.sharedHall, read by that one guard in game.js's update)
// with the host's gnome standing still, and when the host's frames stop a tiny Worker keeps it going (the keeper, below). The
// pause card says so, a guest is told when the host's game is in the background, and single player pauses exactly as before.
// ===== BUILD 159 (3/7): A GUEST'S LOOT AND MANA ARE WORTH WHAT THE HOST'S ARE. A guest's own copy of every drop was rolled at ITS
// OWN wave -- and a guest's S.wave never moves (only the host's startWave counts waves), so every guest roll was a wave-zero roll:
// level 1 all run on map one (the map's first level on later ones), never an epic or a legendary, no Void or random Forest
// pieces, mythics at a quarter of the host's damage. Now the host's drop and held-wave messages carry the hall's wave and a
// guest rolls with its S.wave borrowed for that one synchronous call (atHallWave) -- the same trick 10-meta.js's shop stock
// uses. The HALL HELD payout now rides the run-end message as the host's own number (25 x the CAMPAIGN wave on a later map,
// not the map's). A guest sells only what it built (the host sells anything; repair and upgrade stay open to everyone), no
// defense action goes through after the hall fell or held, and a guest who drops and rejoins gets its own mana pool back,
// and its defenses, keyed by its lobby seat (seatJoin/seatLeave) -- no free refill, no savings lost.
// ===== BUILD 159 (4/7): WHERE A GUEST REALLY IS. The spawn spot the host handed a joining guest was dropped on the floor (the 'hp'
// handler only read a position when the guest was coming back from the dead), and the first guest's spot was the host's own
// anyway, so every co-op game began with everyone standing inside everyone else, and a guest whose own countdown won the race
// back from a fall came up on the host's start too. Now each guest has a spot beside the host's (GUEST_SPAWN_X) that the host
// marks as one to stand on (snap), both on joining and on getting back up, and a guest's own countdown puts it there as well. A
// guest who joins wearing health gear is registered at its geared max (it used to get a fake hit on joining: the red flash, the
// hurt sound and a bar down by its whole gear bonus). The host's copy of a guest (what mobs aim at, where its shots start) keeps up
// with a fast guest, follows a Tear of the Rootgate jump to a gate instead of freezing where it stood, and a shot says where its
// shooter stands, as a swing always did. A click in the moment between switching to a ranged hero and the bow or staff appearing
// no longer sends a sword swing with the bow's 24 reach. And every puppet keeps up with its player (98-party.js), a Troll's bow
// held the build 155/156 way on every screen.
// ===== BUILD 159 (5/7): THE NEWER FEATURES, FOR A GUEST TOO. Most of what came after co-op ran only on the page that wore it, and a
// guest's page has no real mobs. A guest's input now also names the named mythics it wears, its full sets and whether it stands
// still (myth/five/idle), and the host runs those powers for it: the Hourglass and the Warden's Oath fire if anyone wears them; the
// Last Lantern, the Gloomcap Censer and Mossheart's healing work around the host's copy of each wearer (97-mythics.js); a guest's
// Mantle swallows its first hit of each of the host's waves (guestMantle); its full Void set tears rifts off its sword
// (93-gearsets.js guestSwing, from guestHitCone); its Rootsplitter's 4th swing roots the host's mobs ('roots'); and its pet's
// spores and burns reach the host's mobs (famHit's slow/burn). The rings and shouts come back to the guest's own screen ('powerFx').
// On the guest's own page: its Tear of the Rootgate counts the host's waves, a finished Forest set no longer silences its pet
// (93-gearsets.js), and the hideout portal follows the host's phase -- gone for the host's waves, and the horn calls a guest back
// out of the hideout (58-portal.js hallPhase).
// ===== BUILD 159 (6/7): LESS ON THE HOST'S UPLOAD IN THE BIG WAVES. The mob list goes packed ('mobs', packMobs/unpackMobs: the same
// numbers at a third of the size) to every guest that says it reads it, the old 'enemies' list to any that doesn't (an older build);
// and a link that can't keep up skips the snapshots until it drains (sendSnap/snapBusy) instead of queueing seconds of them in
// front of every hit and toast -- the mob deaths in a skipped list wait for that link's next one.
// ===== BUILD 159 (7/7): THE PARTY STAYS TOGETHER BETWEEN RUNS. Every way on from a run reloads the page (TRY AGAIN, REPLAY, NEXT MAP,
// RETURN TO TITLE), and HOST A GAME drew a fresh room code every time, so after every win or loss the host read out a new code and
// everyone typed it in again. Now the host's tab keeps its code and HOST A GAME asks for that one first (a fresh one only if it's
// taken), and a hall that has fallen or been held leaves the matchmaking server at once (parkHost): nobody walks into a run that's
// over, and the code is free for the next one. A guest's end screen (SHATTERED, HALL HELD, THE HOST LEFT) offers ⟲ REJOIN <CODE>
// beside TRY AGAIN, which stays a solo go. REJOIN reloads through the lobby's own rejoin link (?coopjoin) and waits for the host's
// next game -- a join that waits asks again every few seconds while the server says there is no such room, instead of backing off to
// a minute -- and the JOIN box comes up holding the last code. It never lands a guest on a map past its own unlock: from a map it had
// followed the host to, it goes home, and the host's lobby moves it on again only while that lobby is really there.
// ===== BUILD 160: THE VICTORY LAP, FOR EVERYONE. Holding a map's last wave no longer ends the run on the spot (game.js winMap): the hall
// stays open until the host presses ▶ MOVE ON. The guests hear it at once ('mapHeld': the banner, the map counted as theirs, and the map's
// pay -- see guestHeld) and roam the lap with the host: the orbs and loot, building, the portal. A guest's own MOVE ON only tells it the host
// decides. The host's MOVE ON is what now sends 'runEnd' (held:true, nothing paid twice) and leaves the matchmaking server (parkHost).
(function(){
let peer=null, role=null;   // 'host' | 'guest' | null
const conns=new Map();      // one entry per connected remote peer, keyed by ITS peer id — same key on both host and guest sides, so the generic close handler below (and anything else keyed off a peer id) works identically for either role
const handlers={};          // message type -> fn(data, fromPeerId)
// build 152 ("why can't Jacob join me"): two players who both sit behind a strict NAT (a mobile hotspot, some ISPs, an
// island uplink) never find a direct path, and the join dies -- ping has nothing to do with it; only a TURN relay carries
// them. Build 152 added the Open Relay Project's public relay for that, but it turned out dead: its server refuses the
// shared credentials (checked twice, build 159), so it only ever added a failed lookup to every join. It's gone. What is
// left is Google's STUN server, which finds the direct path wherever there is one; a strict-NAT pair still can't connect
// until the game has a relay of its own (a TURN account in Matt's name -- noted for him, not added here). Like build 152's,
// this list replaces PeerJS's own default, which names peerjs.com's public relays (untested, and a third party too: also
// left for Matt to decide). A caller's own config wins.
// Build 159: the game's own relay. Matt's Cloudflare account runs a TURN relay (Cloudflare Realtime) behind a small Worker,
// rootgate-turn.52bulls.workers.dev (its own folder, clude project\rootgate-turn), which hands out relay passes that expire in
// a few hours -- the long-term key stays in the Worker. The page asks for a pass as it loads and again whenever one is getting
// old, in the background: HOST and JOIN never wait for it. With a pass, iceOpts adds Cloudflare's STUN and TURN servers to
// Google's STUN; without one (the Worker not set up yet, offline, a slow answer) the list is exactly what it was. Only on the
// real site (https): the test suites' pages on 127.0.0.1 never reach out.
const RELAY_URL='https://rootgate-turn.52bulls.workers.dev/ice'; let relayIce=null, relayAt=0, relayAsking=false;
function fetchRelay(){ if(relayAsking||location.protocol!=='https:'||typeof fetch!=='function') return; if(relayIce&&Date.now()-relayAt<3*3600e3) return;   // a pass lasts 4 h; a fresh one after 3
  relayAsking=true; let ctl=null; try{ ctl=new AbortController(); }catch(e){} const t=setTimeout(()=>{ try{ ctl&&ctl.abort(); }catch(e){} },5000);
  fetch(RELAY_URL,{cache:'no-store',signal:ctl?ctl.signal:undefined}).then(r=>r.ok?r.json():null).then(d=>{ const s=d&&Array.isArray(d.iceServers)?d.iceServers.filter(x=>x&&x.urls&&typeof x==='object'):[]; if(s.length){ relayIce=s; relayAt=Date.now(); } })
    .catch(()=>{}).then(()=>{ clearTimeout(t); relayAsking=false; }); }
fetchRelay();
function iceOpts(o){ o=Object.assign({},o||{}); if(!o.config) o.config={iceServers:[{urls:'stun:stun.l.google.com:19302'}].concat(relayIce||[])}; fetchRelay(); return o; }
function onMessage(type,fn){ handlers[type]=fn; }
const leaveHooks=[];        // extra listeners for a connection closing, after the one __leave handler below (99b-lobby.js drops a row, or hears that the host left); each guarded so one can't break the rest
function onLeave(fn){ leaveHooks.push(fn); }
function send(type,data,toId){
  const msg=JSON.stringify({type,data});
  if(toId){ const c=conns.get(toId); if(c&&c.open) c.send(msg); return; }
  conns.forEach(c=>{ if(c.open) c.send(msg); });
}
// build 159 (6/7): backpressure for the host's snapshots. The channel is reliable and ordered, and nothing ever looked at how much a
// link still had to send: a guest whose link couldn't keep up (a host on a phone hotspot sending a big late wave to three friends,
// or over a relay) just queued more and more -- the browser's buffer, then PeerJS's own -- and every later message waited behind
// it, a hit or a toast seconds late and getting later all wave. The five snapshots (heroes, world, mobs, defs, pickups) each
// replace the last, so a link with more than SNAP_BUF still waiting skips them until it drains; the next one that goes carries the
// whole state anyway. One-shot messages (hp, toast, lootDrop, alive...) always go. A healthy link drains between two snapshots and
// never gets near it; 64 KB is a second or two of mob lists on a link that is already behind
const SNAP_BUF=64*1024;
// build 159 (7/7): what this TAB remembers about its party, in its own sessionStorage -- a reload, NEXT MAP or the hideout keep it,
// another tab (or the next day's window) never sees it: the room it was last in as a guest (the end screen's REJOIN, the JOIN box)
// and the code it last hosted on (HOST A GAME asks for that one again). A browser that refuses sessionStorage still has this page's copy
const tabGet=k=>{ try{ return sessionStorage.getItem(k); }catch(e){ return null; } }, tabSet=(k,v)=>{ try{ sessionStorage.setItem(k,v); }catch(e){} };
let roomMem=null;
function lastRoom(){ const c=tabGet('ddLastRoom')||roomMem; return typeof c==='string'&&c&&c.length<=40?c:null; }
function rememberRoom(c){ if(typeof c!=='string'||!c||c.length>40) return; roomMem=c; tabSet('ddLastRoom',c); }
function snapBusy(c){ const dc=c.dataChannel; const busy=!!(dc&&dc.bufferedAmount>SNAP_BUF)||(c.bufferSize|0)>0; if(busy) c.__skipped=(c.__skipped|0)+1; return busy; }   // bufferSize: PeerJS's own queue, used once the browser's is full
function sendSnap(type,data){ let msg=null; conns.forEach(c=>{ if(!c.open||snapBusy(c)) return; if(msg===null) msg=JSON.stringify({type,data}); c.send(msg); }); }
function wire(conn){
  if(conn.__wired) return; conn.__wired=true;   // PeerJS's own 'open' event can fire more than once for the same DataConnection (seen intermittently in testing, most likely an ICE/negotiation retry) -- unguarded, a second wire() call stacked a second 'data' listener on the same conn, so every message after that point (including a one-shot action like 'swing'/'place'/'defAction') was handled twice
  conn.__heard=Date.now();   // build 159: when this peer last said anything at all (the heartbeat below reads it)
  conn.on('data',raw=>{ conn.__heard=Date.now(); if(conns.get(conn.peer)!==conn&&conn.open) conns.set(conn.peer,conn);   // the connection a peer is actually talking on is the one to answer on (two of a joiner's attempts can both open -- see join())
    try{ const {type,data}=JSON.parse(raw); const h=handlers[type]; if(h) h(data,conn.peer); }catch(e){ console.warn('net parse',e); } });
  conn.on('close',()=>gone(conn));
}
// a connection is over: unregister it and tell everyone who listens (__leave, then the lobby's hooks), with why -- 'bye' (they
// said goodbye), 'closed' (the link closed cleanly: a reload, a leave), 'lost' (the heartbeat gave up on them), 'full' (the
// hall turned us away), 'left' (we left). Safe to call twice: only the first call for the live connection does anything
function gone(conn){ if(conns.get(conn.peer)!==conn) return;   // a superseded connection to the same peer (a join's earlier attempt, see join()) closing must not unregister the live one
  const why=conn.__why||'closed'; conns.delete(conn.peer);
  const h=handlers.__leave; if(h) try{ h(conn.peer,why); }catch(e){ console.warn('net leave',e); }   // guarded like the hooks: one failing must not stop the lobby from hearing it
  leaveHooks.forEach(f=>{ try{ f(conn.peer,why); }catch(e){ console.warn('net leave hook',e); } }); }
// close it ourselves -- PeerJS emits 'close' synchronously, which runs gone(); the direct gone() covers a connection PeerJS had
// already marked shut without saying so
function drop(conn,why){ if(!conn.__why) conn.__why=why; try{ conn.close(); }catch(e){} gone(conn); }
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
function keepOnBroker(p){ let n=0; p.on('open',()=>{ n=0; }); p.on('disconnected',()=>{ if(p.__parked) return; setTimeout(()=>{ try{ if(p===peer&&!p.destroyed&&p.disconnected&&!p.__parked) p.reconnect(); }catch(e){} },Math.min(30000,1500*Math.pow(2,n++))); }); }   // __parked: a finished hall left on purpose (parkHost, build 159 7/7)
// build 159 (four players at most -- the README always said "up to three more join", nothing enforced it; a fifth was let in
// and, past eight, sat in the game unlisted): a joiner past the third guest is told 'full' and let go a moment later, so the
// message gets there before the close does. Counted on live connections; a guest reloading onto the host's map holds no
// connection while it reloads, so a stranger could take its seat in that moment -- rare enough to leave.
const MAX_GUESTS=3;
function host(roomCode,cb,peerOpts){
  if(peer) leave();   // build 159: one Peer per page -- an earlier attempt's (a collision retry, a failed HOST) is shut, not left on the broker
  role='host'; const p=peer=new Peer(roomCode||undefined,iceOpts(peerOpts)); keepOnBroker(p);
  p.on('open',id=>{ if(p!==peer) return; selfId=id; cb&&cb(null,id); });
  p.on('connection',conn=>{ conn.on('open',()=>{ if(p!==peer){ try{ conn.close(); }catch(e){} return; }
    if(!conns.has(conn.peer)&&conns.size>=MAX_GUESTS){ if(!conn.__full){ conn.__full=true; try{ conn.send(JSON.stringify({type:'full',data:{max:MAX_GUESTS+1}})); }catch(e){} setTimeout(()=>{ try{ conn.close(); }catch(e){} },1500); } return; }
    conns.set(conn.peer,conn); wire(conn); const h=handlers.__join; if(h) h(conn.peer); }); });
  p.on('error',e=>{ if(p===peer) cb&&cb(e); });
}
const JOIN_RETRY_MS=+Q.get('joinretry')||12000;   // first retry of a stuck attempt (test-only override, the same idiom as ?jointimeout); then twice as long each time, up to a minute
// build 159 (7/7): a join that WAITS for its host (o.wait: REJOIN, or CONNECT on the code of the room this tab was last in). The host
// of a party that has just finished a run is reloading, so for a while there is no such room: the server says so ('peer-unavailable',
// about 5 s after being asked), and a join then sat out its backoff (12 s, 24, 48, a minute) before asking again -- up to a minute of
// the host's new lobby standing there a player short. A waiting join asks again WAIT_POLL_MS after each "no such room", for about ten
// minutes, then carries on as any join does. Only on that answer: an attempt that has reached a host is never cut short by it
const WAIT_POLL_MS=+Q.get('joinpoll')||4000, WAIT_POLLS=60;
function join(roomCode,cb,peerOpts,o){
  if(peer) leave();   // build 159 (P2): CONNECT pressed again (or Enter twice) used to make a second Peer beside the first, and the first one's slow attempt could still open -- two live connections from one tab: the host simulated two of you, every reward came twice and you saw a puppet of yourself. The old Peer, and every attempt it had going, goes first
  role='guest'; const p=peer=new Peer(undefined,iceOpts(peerOpts)); keepOnBroker(p); let asked=false, done=false, tries=0, polls=0, cur=null; const wait=!!(o&&o.wait);
  const attempt=()=>{ if(done||p!==peer||p.destroyed) return;
    if(p.disconnected){ setTimeout(attempt,3000); return; }   // off the broker for the moment (keepOnBroker is bringing it back): connect() would only refuse
    const conn=p.connect(roomCode,{reliable:true}), t0=Date.now(); let timer=0; if(!conn){ setTimeout(attempt,3000); return; }
    cur={conn,stop:()=>clearTimeout(timer)};   // the attempt under way -- the one a "no such room" is about (one at a time: the next starts only after this one is dropped)
    // only an attempt that is really stuck is dropped: no ICE under way at all (the offer or the answer never arrived) or ICE failed.
    // One still negotiating ('checking') gets up to two minutes -- on a busy page (a big map decoding) every step just comes late,
    // and cutting it off to start over would only start over late again
    const check=()=>{ if(done||conn.open||p!==peer||p.destroyed) return; const pc=conn.peerConnection, st=pc&&pc.iceConnectionState;
      if(st&&st!=='new'&&st!=='failed'&&st!=='closed'&&Date.now()-t0<120000){ timer=setTimeout(check,5000); return; }
      if(tries>=20) return;   // about twenty minutes of trying, then it stops by itself: a wrong code never lands
      try{ conn.close(); }catch(e){} tries++; attempt(); };
    timer=setTimeout(check,Math.min(60000,JOIN_RETRY_MS*Math.pow(2,tries)));
    conn.on('open',()=>{ if(p!==peer){ try{ conn.close(); }catch(e){} return; }   // build 159 (P2): an attempt of a Peer this page has since replaced never gets in
      if(done){ if(conns.get(conn.peer)!==conn) try{ conn.close(); }catch(e){} return; } done=true; clearTimeout(timer); conns.set(conn.peer,conn); wire(conn); rememberRoom(roomCode); cb&&cb(null,selfId); });   // done: 'open' can fire twice for one connection, and only one attempt may ever win -- a second attempt that opens too is closed
    conn.on('error',e=>{ if(p===peer) cb&&cb(e); });
  };
  p.on('open',myId=>{ if(p!==peer) return; selfId=myId; if(asked) return; asked=true; attempt(); });
  p.on('error',e=>{ if(p!==peer) return;
    if(wait&&e&&e.type==='peer-unavailable'&&cur&&!done&&polls<WAIT_POLLS){ const c=cur; cur=null; polls++; c.stop(); try{ c.conn.close(); }catch(x){} setTimeout(attempt,WAIT_POLL_MS); }   // build 159 (7/7): no such room yet -- ask again shortly (cur=null: the same attempt's second "no such room", a moment later, starts nothing)
    cb&&cb(e); });
}
// leaving on purpose: 'bye' first (the close right behind it can outrun it -- either one tells the others), then shut everything.
// `leaving` is up while our own closes fire their 'close' events: PeerJS emits them synchronously, and a guest's own leave must
// not read as "the host left" (guestHostLeft below)
let leaving=false;
function leave(){ leaving=true;
  try{ send('bye',{}); }catch(e){}
  conns.forEach(c=>{ if(!c.__why) c.__why='left'; try{ c.close(); }catch(e){} gone(c); }); conns.clear(); if(peer) try{ peer.destroy(); }catch(e){}
  peer=null; role=null; selfId=null; leaving=false; }
window.__net={ host, join, leave, send, onMessage, onLeave, role:()=>role, peers:()=>[...conns.keys()], world:()=>hostWorld,
  hostId:()=>role==='guest'?[...conns.keys()][0]||null:null,   // a guest only ever has the one connection — a convenience name for it, same id __party keys its puppet under
  myId:()=>selfId||(peer&&peer.id)||null,
  links:()=>[...conns.values()].map(c=>{ const pc=c.peerConnection; return {id:c.peer,alive:!!c.__alive,hidden:!!c.__hidden,quiet:Date.now()-(c.__heard||0),ice:pc?pc.iceConnectionState:null,link:pc?pc.connectionState:null,skipped:c.__skipped|0,held:c.__died?c.__died.length:0}; }) };   // build 159: a test hook -- what the heartbeat below knows about each connection (and, 6/7, how many snapshots a busy link skipped and how many mob deaths wait for it)

// ---- build 159: the heartbeat. Every page, host or guest, says 'alive' once a second to everyone it is connected to, on a timer --
// never the frame loop, which stops under the host's menus and in a hidden tab and would read as "gone". Anything received counts
// as a sign of life. A peer is dropped (drop -> gone -> the same __leave and lobby hooks a clean leave runs) when:
//  - its link is dead: connectionState 'failed' or 'closed' -- terminal, nothing brings it back -- or ICE 'failed'/'closed';
//  - or it has been silent HB_QUIET_MS AND its link has stopped answering too (ICE not 'connected'/'completed'): what a closed,
//    crashed or unplugged tab looks like, and Chrome reports that 'disconnected' about 5 s after the fact.
// Silence over a live link never drops anyone: that is a page busy (a phone decoding the throne room, a long frame) or frozen for
// a moment (a phone locked), and it comes back. A peer that said it was going to the background (h:1) gets HB_HIDDEN_MS of
// silence instead -- a phone switching to Messages to send the room code, say. The quiet rule only applies to a peer that has
// sent at least one 'alive' (an older build, or a test's raw peer, is judged by its link alone). If THIS page is the one that
// was asleep (a gap in its own timer, or it has just come back to the front), everyone gets a fresh window before being judged.
const HB_MS=1000, HB_QUIET_MS=6000, HB_HIDDEN_MS=60000;
let hbAt=Date.now();
function hbFresh(now){ conns.forEach(c=>{ c.__heard=now; }); hbAt=now; }
function heartbeat(){ const now=Date.now(), gap=now-hbAt; hbAt=now; if(!conns.size) return;
  if(gap>5*HB_MS) hbFresh(now);
  send('alive',aliveMsg());
  [...conns.values()].forEach(c=>{ const pc=c.peerConnection, st=pc?pc.connectionState:'closed', ice=pc?pc.iceConnectionState:'closed';
    if(st==='failed'||st==='closed'||ice==='failed'||ice==='closed'){ drop(c,'lost'); return; }
    if(!c.__alive||ice==='connected'||ice==='completed') return;
    if(now-(c.__heard||now)>=(c.__hidden?HB_HIDDEN_MS:HB_QUIET_MS)) drop(c,'lost'); });
}
setInterval(heartbeat,HB_MS);
onMessage('alive',(d,from)=>{ const c=conns.get(from); if(c){ c.__alive=true; c.__hidden=!!(d&&d.h); c.__paused=!!(d&&d.p); } });   // p: build 159 (2/7), see hallHeld below
document.addEventListener('visibilitychange',()=>{ if(!conns.size) return; if(!document.hidden) hbFresh(Date.now()); send('alive',aliveMsg()); });   // say so the moment we go to the background (a phone freezes the page right after), and give everyone a fresh window on the way back
// goodbye on the way out: every deliberate leave in the hall unloads the page (RETURN TO TITLE, TRY AGAIN, REPLAY THIS MAP and NEXT
// MAP reload or navigate; so do the hideout and closing the tab), so pagehide covers them all, on phones too. Not beforeunload:
// phones skip it, and it also fires for a leave the player then cancels
addEventListener('pagehide',()=>{ if(role&&conns.size) try{ send('bye',{}); }catch(e){} });
onMessage('bye',(d,from)=>{ const c=conns.get(from); if(c) drop(c,'bye'); });
onMessage('full',(d,from)=>{ if(role!=='guest') return; const c=conns.get(from); if(c) drop(c,'full'); });   // the host already has three guests (host() above): the lobby says so on the title screen

// ---- build 159 (2/7): the hall doesn't pause in co-op. "The tavern pauses the hall" (game.js update()) was right for one player
// and wrong for four: the host's bag, sheet, forge, tavern stations and pause menu -- and an alt-tab, which opens the pause --
// froze every guest's game with no word, and guests stopped even seeing each other move. While this page hosts a hall with anyone
// in it, the hall runs on under its menus; hosting alone (nobody to keep it going for) and single player pause as they always did.
// The host's gnome stands still meanwhile: its held keys are cleared every step a menu is up (the pause and the sheet clear them
// on opening, the tavern never did, and a thumb left on the touch joystick would keep steering). COOP_HALL_RUNS is the switch --
// false puts back "the host's menus pause everyone", and the hidden-tab keeper below goes with it.
const COOP_HALL_RUNS=true;
Meta.sharedHall=()=>COOP_HALL_RUNS&&role==='host'&&conns.size>0;
window.__net.hallRuns=()=>(role==='guest'&&conns.size>0)||Meta.sharedHall();   // is the hall this page plays in running on regardless of its menus? (97-pause.js's card says so) -- a guest's own menus never held the host's hall, switch or no switch
// with the switch off the host's menus hold everyone's hall again, and then the guests are told so rather than left guessing: the
// heartbeat's 'alive' says p:1 while this host's hall is held under a menu (never while the switch is on), and a guest's HUD reads it
function hallHeld(){ return role==='host'&&!Meta.sharedHall()&&Meta.isOpen()&&(S.phase==='build'||S.phase==='wave'); }
function aliveMsg(){ return {h:document.hidden?1:0,p:hallHeld()?1:0}; }
let runPh=null;
{ const prevUpdate=update; update=function(dt){
    if(Meta.sharedHall()&&Meta.isOpen()){ for(const k in K) K[k]=0; if(TOUCH){ joy.x=0; joy.y=0; } }
    prevUpdate(dt);
    // a co-op run can end under a menu now (the host's crystal falls while it is in the pause or on the sheet; a guest hears the
    // run ended while in its own): the pause and the sheet step aside for the death cut and the end screen, as a single player
    // never needed (their run can't end under a menu). The tavern needs nothing: it hands itself over to the run summary (20-tavern.js)
    const ph=S.phase; if(ph!==runPh){ if(role&&(runPh==='build'||runPh==='wave')&&!(ph==='build'||ph==='wave')){ if(window.__pause&&window.__pause.isOpen()) window.__pause.close(false); if(window.__doll&&window.__doll.isOpen()) window.__doll.close(); } runPh=ph; } }; }
// ...and not when the host's tab is in the background either. A browser stops the frame loop (requestAnimationFrame) for a hidden
// page -- another tab in front, the window minimised, or (Chrome on Windows) another window covering it -- and that loop was all
// that ever drove the hall, so every guest's game froze until the host came back. So while this page hosts guests and its frames
// have stopped, the keeper runs the hall: a tiny Worker ticks 20 times a second (a worker's timer isn't held to a hidden page's
// once a second) and each tick moves the hall on by the real time that passed, in steps no longer than a frame's (.05 s) and a
// second at most (a PC waking from sleep doesn't fast-forward the horde). It moves game.js's lastT along with it, so the first
// frame back doesn't run the same moment twice. Where no Worker can be made (a strict page policy) a plain timer does it, once a
// second while hidden, catching up in the same steps. It takes over only when the frames have really stopped -- the tab hidden, or
// no frame for a second: a frame loop that is only slow (a weak laptop, the co-op suites' four frames a second) keeps its own pace,
// as it always has. A phone that switches apps suspends the whole page, keeper and all; nothing can keep that hall going, and the
// heartbeat's minute for a backgrounded peer covers it.
const KEEP_STEP=.05, KEEP_MAX=1, KEEP_STALL_MS=1000;
let frameAt=performance.now(), keeper=null, keeperURL=null, keeperSteps=0;
{ const prevFrame=frame; frame=function(now){ frameAt=performance.now(); if(now<lastT) lastT=now;   // a frame stamped before the keeper's last step: nothing to catch up (never a negative dt)
    if(keeper&&!document.hidden) keeperStop(); return prevFrame(now); }; }
function keeperTick(){ if(keeper) keeper.heard=performance.now();
  if(!Meta.sharedHall()||window.__freeze){ keeperStop(); return; }   // nobody left to keep it going for; or a test is stepping the hall itself
  const now=performance.now(); if(!document.hidden&&now-frameAt<KEEP_STALL_MS) return;   // the frames are running: they drive the hall
  let left=Math.min(KEEP_MAX,Math.max(0,(now-lastT)/1000)); lastT=now;
  while(left>1e-4){ const dt=Math.min(KEEP_STEP,left); left-=dt; update(dt); keeperSteps++; } }
function keeperTimer(){ const id=setInterval(keeperTick,KEEP_STEP*1000); keeper={kind:'timer',heard:performance.now(),stop:()=>clearInterval(id)}; }
function keeperStart(){ if(keeper) return;
  try{ keeperURL=keeperURL||URL.createObjectURL(new Blob(['setInterval(function(){ postMessage(0); },'+(KEEP_STEP*1000)+');'],{type:'text/javascript'}));
    const w=new Worker(keeperURL); w.onmessage=keeperTick; w.onerror=()=>{ if(keeper&&keeper.w===w){ keeperStop(); keeperTimer(); } };   // a policy that refuses it only once the script is asked for
    keeper={kind:'worker',w,heard:performance.now(),stop:()=>w.terminate()}; }
  catch(e){ keeperTimer(); } }   // refused on the spot (Chrome under a strict Content-Security-Policy)
function keeperStop(){ if(!keeper) return; const k=keeper; keeper=null; try{ k.stop(); }catch(e){} }
function keeperCheck(){ if(!Meta.sharedHall()||window.__freeze){ keeperStop(); return; }
  if(keeper&&keeper.kind==='worker'&&performance.now()-keeper.heard>3000){ keeperStop(); keeperTimer(); return; }   // a worker that never says a word: the timer instead
  if(!keeper&&(document.hidden||performance.now()-frameAt>=KEEP_STALL_MS)) keeperStart(); }
setInterval(keeperCheck,500); document.addEventListener('visibilitychange',keeperCheck);   // the timer runs once a second in a hidden tab: the event starts the keeper at once
window.__net.keeper=()=>({on:!!keeper,kind:keeper?keeper.kind:null,steps:keeperSteps});   // a test hook

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
const ROOM_A='ABCDEFGHJKMNPQRSTUVWXYZ23456789';
function shortRoomCode(){ const A=ROOM_A; let s=''; for(let i=0;i<5;i++) s+=A[Math.floor(Math.random()*A.length)]; return s; }
// build 159 (7/7): the code this tab last hosted on, if it is one of ours (a console-made id is never reused)
const HOST_KEY='ddHostCode', KEPT_RETRY_MS=1500;
function keptHostCode(){ const c=tabGet(HOST_KEY); return c&&new RegExp('^['+ROOM_A+']{5}$').test(c)?c:null; }
// build 159: say what actually went wrong. HOST's failure used to be written into the host panel in the same breath the panel
// was hidden (the HOST button just came back, silently), and JOIN blamed the code for everything -- a correct code included,
// when it was really the free matchmaking server (0.peerjs.com) that couldn't be reached. PeerJS's own error types tell them apart
const SERVER_DOWN=/^(network|server-error|socket-error|socket-closed|disconnected)$/;
const SERVER_MSG="Couldn't reach the matchmaking server — check your internet, or try again in a minute.";
function hostErrText(e){ const t=e&&e.type; if(SERVER_DOWN.test(t)) return SERVER_MSG; if(t==='browser-incompatible') return "This browser can't do multiplayer — try Chrome, Edge, Firefox or Safari."; return "Couldn't open a game — try again?"; }
function joinErrText(e){ const t=e&&e.type;
  if(t==='peer-unavailable') return "No open game with that code — check it, and make sure your friend's game is still open.";
  if(SERVER_DOWN.test(t)) return SERVER_MSG;
  if(t==='negotiation-failed'||t==='webrtc') return "Found your friend's game, but your two networks can't reach each other — try a different network (home wifi instead of a phone hotspot, say).";
  if(t==='browser-incompatible') return "This browser can't do multiplayer — try Chrome, Edge, Firefox or Safari.";
  return "Couldn't connect — check the code and try again."; }
{ const hostbtn=$('hostbtn'), joinbtn=$('joinbtn'), coopRow=$('coopRow'), hostPanel=$('hostPanel'), hostMsg=$('hostMsg'),
    joinPanel=$('joinPanel'), joinCode=$('joinCode'), joinGoBtn=$('joinGoBtn'), joinMsg=$('joinMsg'), coopMsg=$('coopMsg');
  let hostSeq=0;   // build 159 (7/7): which HOST press is the current one -- a kept code's delayed second try must not start after BACK, or on top of a newer press
  hostbtn.addEventListener('click',()=>{
    coopRow.classList.add('hide'); hostPanel.classList.remove('hide'); hostMsg.textContent='Opening the gate…'; coopMsg.textContent='';
    let tries=0, kept=keptHostCode(), keptTries=0; const my=++hostSeq;
    const tryHost=()=>{
      if(my!==hostSeq||hostPanel.classList.contains('hide')) return;
      let opened=false;
      window.__net.host(kept||shortRoomCode(),(err,id)=>{
        if(opened) return;   // the same Peer can report a later error (its signaling socket dropping, say) -- that must not tear down a lobby that is already open; the data channels to anyone in it don't need the broker any more
        if(err){
          if(err.type==='unavailable-id'&&kept){ if(++keptTries<2){ setTimeout(tryHost,KEPT_RETRY_MS); return; } kept=null; tryHost(); return; }   // build 159 (7/7): last game's code is still taken -- the page this tab just left not quite let go of yet (asked again a moment later), or a duplicate of this tab hosting on it (then a fresh code, as ever)
          if(err.type==='unavailable-id'&&tries<4){ tries++; tryHost(); return; }   // a real collision on the room code itself -- quietly try a fresh one rather than surface a confusing error for something this recoverable
          coopMsg.textContent=hostErrText(err); hostPanel.classList.add('hide'); coopRow.classList.remove('hide'); return;   // #coopMsg sits outside the host panel, so it stays up with the buttons
        }
        opened=true; const same=!!kept&&id===kept; tabSet(HOST_KEY,id);   // build 159 (7/7): this tab hosts on this code again next time
        hostMsg.innerHTML='Share this code with your friends:<br><span class="netCode" id="hostCode">'+id+'</span>'+(same?'<br><small id="hostSame">the same code as your last game — your party can press ⟲ REJOIN</small>':'');
        $('hostCode').addEventListener('click',()=>{ const c=$('hostCode'); try{ navigator.clipboard.writeText(id); c.textContent='copied!'; setTimeout(()=>{ c.textContent=id; },900); }catch(e){} });
        window.__lobby.openHost(id);   // the lobby (99b-lobby.js) takes it from here: the roster, the loading lights, START
      },TEST_PEER_OPTS);
    };
    tryHost();
  });
  joinbtn.addEventListener('click',()=>{ coopRow.classList.add('hide'); joinPanel.classList.remove('hide'); coopMsg.textContent=''; joinCode.focus(); });
  // WebRTC's own peer-to-peer negotiation (the actual connect, once both sides have reached the signaling server
  // fine) can just hang with neither an 'open' nor an 'error' ever firing -- a real, common failure mode on some
  // wifi/cellular networks (symmetric NAT, a firewall blocking UDP, one side's tab backgrounded and throttled by
  // the browser mid-negotiation), not something this module's own code controls. Left unguarded, a real player
  // hit exactly this: "Connecting…" forever, no error, no way to know anything was even wrong. JOIN_TIMEOUT below
  // doesn't cancel the underlying attempt (a slow real connection can still land after it fires -- settled just
  // stops the SAME outcome from being reported twice) -- it only stops leaving the player staring at an unchanging
  // message with zero signal, after a wait generous enough not to false-positive on an ordinary slow connection.
  const JOIN_TIMEOUT=+Q.get('jointimeout')||20000;   // test-only override (?jointimeout=300), same escape-hatch idiom as peerhost/peerport/peerpath above
  let joinSeq=0;   // build 159 (P2): which CONNECT is the current one -- an earlier one's late answer is ignored (join() has shut its Peer anyway)
  function doJoin(){
    if(joinGoBtn.disabled) return;   // build 159 (P2): one in flight already -- the Enter key never looked at the disabled button, so a double Enter made two joins
    let code=joinCode.value.trim(); if(!code) return; if(/^[a-z0-9]{4,8}$/i.test(code)) code=code.toUpperCase();   /* build 147: a short room code in any letter case (a phone keyboard capitalises the first letter or lowercases the lot); a long console-made id is left alone */
    const my=++joinSeq, wait=code===lastRoom();   // build 159 (7/7): the room this tab was last in (REJOIN, or the code the box came up holding): a join that waits for the host's next game, and says so
    const waitMsg="Waiting for the host's next game — you'll go in by yourself as soon as they press HOST A GAME.";
    joinMsg.textContent='Connecting…'; joinMsg.classList.remove('err'); joinGoBtn.disabled=true;
    let settled=false;
    const timer=setTimeout(()=>{
      if(settled||my!==joinSeq) return; settled=true; joinGoBtn.disabled=false;
      joinMsg.textContent="Still not connecting — this can happen on some wifi/cellular networks. Double-check the code, make sure your friend's tab is open and active, or try again.";
      joinMsg.classList.add('err');
    },JOIN_TIMEOUT);
    window.__net.join(code,err=>{
      if(my!==joinSeq) return;
      if(settled){ if(!err) window.__lobby.openGuest(code); return; }   // a late success after the timeout already showed -- still let them in (to the lobby) rather than strand a connection that did eventually land
      settled=true; clearTimeout(timer); joinGoBtn.disabled=false;
      if(err){ if(wait&&err.type==='peer-unavailable'){ joinMsg.textContent=waitMsg; return; } joinMsg.textContent=joinErrText(err); joinMsg.classList.add('err'); return; }   // build 159 (7/7): no such room YET, for a waiting join -- not an error, and join() is already asking again
      window.__lobby.openGuest(code);   // phase 14: into the host's lobby, not straight into the hall -- the host's START (or, after it, this page's own room finishing its load) is what enters
    },TEST_PEER_OPTS,{wait});
  }
  joinGoBtn.addEventListener('click',doJoin);
  joinCode.addEventListener('keydown',e=>{ e.stopPropagation(); if(e.key==='Enter'){ e.preventDefault(); doJoin(); } });
  // the same join, started by code rather than a click: 99b-lobby.js rejoins the room this way after reloading onto the host's map --
  // and, since build 159 (7/7), after an end screen's REJOIN. The multiplayer screen opens for it (it used to stay shut until the join
  // had landed, on a map this player had unlocked: a REJOIN waiting for its host would have been a bare title screen, nothing said)
  window.__net.uiJoin=code=>{ if(window.__mp&&S.phase==='start') window.__mp.open(); coopRow.classList.add('hide'); joinPanel.classList.remove('hide'); joinCode.value=String(code||''); doJoin(); };
  // build 159 (7/7): the JOIN box comes up holding the room this tab was last in -- one tap on CONNECT, never a join by itself
  { const c=lastRoom(); if(c&&!joinCode.value) joinCode.value=c; }
}

// ---- phase 3/4: every hero in the hall, broadcast a few times a second and rendered as a puppet on every OTHER
// screen. Phase 3 was just the host's own hero; phase 4 adds every guest's, host-simulated from input they send —
// this module runs in game.js's own top-level scope (parts/DESIGN.md), same as 98-party.js, so it can call
// moveCircle/floorAt/angLerp directly: a guest's hero moves and collides with walls, rails and stairs exactly like
// the real one does, just fed by a network message instead of live keys. Combat isn't wired up yet (updateEnemies
// and hurtHero still only know the host's own `hero`), and gear-driven move speed isn't either (heroStat('move')
// reads the HOST's own gear) — both stay open for a later phase.
// build 376 (Matt: "he sees me as the old troll and there is no old troll"): the Troll hero became the Gnome Ranger (ranger.glb) long ago and this copy of the table never followed -- a teammate's puppet wore the retired troll.glb. The real table is asked first now (__heroes.glb), this one is only the fallback
const HERO_GLB={witch:'witch.glb',troll:'ranger.glb',knight:'knight.glb',fighter:'fighter.glb'};
const heroGlb=pick=>(window.__heroes&&window.__heroes.glb&&window.__heroes.glb(pick))||HERO_GLB[pick]||'witch.glb';   // hero id -> glb file (70-hero2.js's HEROES table, duplicated here rather than reached into, so this module only ever touches __heroes/__party through their own public surface)
function heroLabel(pick){ const h=window.__heroes.list().find(h=>h.id===pick); return h?h.name:'Ally'; }

// host only: what each connected guest is simulated at, driven by the input they last sent
const guestIn=new Map();     // id -> latest {w,s,a,d,shift,yaw,pick}
const guestHero=new Map();   // id -> {x,y,z,yaw,hp,max,hurtT,dead} the host moves each tick from guestIn, same collision rules as the real hero
const GUEST_MAX_HP=100, GUEST_REACH=2.4, GUEST_DMG=8;   // hero's own unequipped defaults/fallbacks (game.js: hero={hp:100,max:100,reach:2.4}, heroDmg()'s own base is 8) -- GUEST_MAX_HP now doubles as applyGear()'s own "100" base for the gear-scaled max below; REACH/DMG only matter if a 'swing' somehow arrives without them
// build 159 (4/7): the longest a melee swing reaches. Only the knight swings (2.4); the witch, the fighter and the archer shoot (18-24),
// and since phase 9 a shot never comes through the swing path -- except in the moment after switching to one of them, before the
// staff or bow has appeared (installHero sets the reach at once, the weapon mounts once the model loads), when a click used to go out
// as a sword swing 24 long that hit everything ahead through walls. The guest no longer sends one then, and the host never trusts a
// swing longer than this
const GUEST_MELEE_MAX=4;
// build 159 (4/7): where each guest stands -- beside the host's own start (game.js: the hero starts and gets back up at (0,6)), never on
// it: the first guest on its right, the second on its left, a third further out. A spot a guest still holds is skipped, so someone
// joining after someone left never lands on a player who stayed. Open floor on all five maps (every spot within 4.5 of the start is)
const GUEST_SPAWN_X=[1.5,-1.5,3,-3], GUEST_SPAWN_Z=6;
function guestSpawnX(){ const used=new Set([...guestHero.values()].map(g=>g.spawnX)); const x=GUEST_SPAWN_X.find(x=>!used.has(x)); return x!==undefined?x:GUEST_SPAWN_X[guestHero.size%GUEST_SPAWN_X.length]; }
function guestMaxHp(s){ return Math.round((GUEST_MAX_HP+(s?s.stat.hp:0))*(s?s.mult.hp:1)); }   // applyGear()'s own formula (game.js), from the stats that guest reports
// each guest gets their OWN mana pool, seeded at the same MAP.mana baseline the hall itself started with -- not a
// share of the host's own S.mana, which stays exactly what it always was, the HOST's own pool. See the phase-12
// header comment (top of file) for why this replaced a single shared S.mana for defense costs.
const guestMana=new Map();   // id -> number
const MAP_MANA=MAP.mana||260;   // the exact fallback S's own init (game.js: const S={mana:MAP.mana||260,...}) already uses -- some maps (the default 'hall' among them) never set their own MAP.mana at all
// build 159 (3/7): a pool outlives its connection. Pools are keyed by peer id and every join makes a new one, so a guest who dropped
// and came back was seeded MAP_MANA again: a free refill for one who had spent down (leave, rejoin, 260), the savings gone for one
// who had banked 900, and their defenses lost their gear (d.ownerId named the dead id). A guest's input now names its lobby seat
// (99b-lobby.js SEAT: one per tab, kept across the reload onto the host's map and a RETURN TO TITLE; the host never shows it to
// anyone, so one guest can't name another's). When a guest leaves, the host puts its pool aside under that seat for the rest of
// the run and hands it back -- with its defenses -- when the seat registers again. A tab with no seat, or a new one, starts at
// MAP_MANA as anyone joining does. If the same tab is back on a new id before its old link was given up on (a phone's tab killed
// and reopened inside the heartbeat's minute), the old pool joins whatever the new one has done since, and its defenses move over.
const seatOf=new Map();     // host: peer id -> {seat, seed}: that guest's seat and the pool it was registered with
const seatKept=new Map();   // host: seat -> the pool a departed guest left behind
function seatJoin(id,inp){ const seat=inp&&typeof inp.seat==='string'&&/^[a-z0-9]{8}$/.test(inp.seat)?inp.seat:null; let pool=MAP_MANA;
  if(seat&&seatKept.has(seat)){ pool=seatKept.get(seat); seatKept.delete(seat); defs.forEach(d=>{ if(d.ownerSeat===seat) d.ownerId=id; }); }
  if(seat) seatOf.set(id,{seat,seed:pool}); return pool; }
function seatLeave(id){ const s=seatOf.get(id); seatOf.delete(id); if(!s||!guestMana.has(id)) return; const pool=guestMana.get(id);
  const heir=[...seatOf.entries()].find(([k,v])=>v.seat===s.seat&&guestMana.has(k));
  if(heir){ const [k,v]=heir; guestMana.set(k,Math.round((guestMana.get(k)-v.seed+pool)*10)/10); v.seed=0; defs.forEach(d=>{ if(d.ownerId===id) d.ownerId=k; }); }   // its free MAP_MANA start is replaced by the old pool (seed 0: nothing in it is free any more)
  else seatKept.set(s.seat,pool); }
// the wave-held bonus (updateWave, game.js) only ever credits S.mana -- and, same as gold/xp (10-meta.js's own
// onWaveHeld, a separate, still-host-only gap not fixed here), only the HOST ever sees it, since a guest's own
// local S.phase never reaches 'wave' at all (startWave() is blocked for them below). Meta.onWaveHeld(effWave())
// is the one clean hook already firing at that exact moment -- host-only, by construction, so no role check would
// even be needed, but kept for clarity -- reused here to credit every connected guest's own pool with the same
// bonus their real teammate defending alongside them just earned, using the identical 50+10*wave formula.
{ const origOnWaveHeld=Meta.onWaveHeld;
  Meta.onWaveHeld=w=>{ origOnWaveHeld(w);
    if(role==='host'){ const bonus=50+10*w; guestMana.forEach((v,id)=>guestMana.set(id,Math.round((v+bonus)*10)/10)); send('waveHeld',{w}); } }; }   // phase 13: the gold/xp half goes to every guest too
// build 159 (3/7): a guest's S.wave never moves (startWave is the host's alone, below), so anything a guest rolls reads effWave()
// = MAP.wbase: a wave-zero roll, whatever wave the hall is on. What the host's hall hands a guest to roll -- a drop (lootDrop),
// the held wave's thanks (waveHeld: the Forest pieces, the named mythic's 5%) -- runs here with S.wave borrowed from the hall for
// that one synchronous call, then put back, the same swap 10-meta.js's rollStockItem makes for the shop; nothing that watches
// S.wave each frame (97-mythics.js) can ever see it. ew is the host's effWave() at that moment (the campaign wave, so a guest
// whose own map base differed would still land on the host's number); an older host that sends none falls back to the wave its
// world broadcast last said
function atHallWave(ew,fn){ const w0=S.wave; S.wave=typeof ew==='number'&&Number.isFinite(ew)?ew-MAP.wbase:(hostWorld&&Number.isFinite(hostWorld.wave)?hostWorld.wave:w0);
  try{ return fn(); } finally{ S.wave=w0; } }
onMessage('waveHeld',d=>{ if(role==='guest'&&d&&Number.isFinite(+d.w)) atHallWave(+d.w,()=>Meta.onWaveHeld(+d.w)); });   // d.w is already the host's effWave() (updateWave passes it)
// phase 13: party xp -- every kill's xp to every guest, as the host's own onKill fires
{ const origOnKill=Meta.onKill; Meta.onKill=e=>{ origOnKill(e); if(role==='host'&&e) send('killXp',{kind:e.kind}); }; }
onMessage('killXp',d=>{ if(role==='guest'&&d) Meta.onKill({kind:d.kind}); });
const MEND_AUR=new Set(['zap','venom','ember','dazzle']);
onMessage('mend',d=>{ if(role!=='guest'||!d||hero.dead>0) return; hero.hp=Math.min(hero.max,hero.hp+Math.max(0,Math.min(1e4,+d.a||0))); if(window.__talents&&window.__talents.coopFx) window.__talents.coopFx('mend'); });
function guestInputTick(dt){
  if(role!=='host') return;
  guestIn.forEach((inp,id)=>{
    let g=guestHero.get(id);
    const s=guestStats.get(id);
    if(!g){ const ox=guestSpawnX(), m0=guestMaxHp(s); g={x:ox,y:floorAt(ox,GUEST_SPAWN_Z,0),z:GUEST_SPAWN_Z,yaw:0,hp:m0,max:m0,hurtT:0,dead:0,spawnX:ox,holdT:.8}; guestHero.set(id,g); guestMana.set(id,seatJoin(id,inp)); send('hp',{hp:g.hp,max:g.max,dead:0,x:g.x,y:g.y,z:g.z,snap:1},id); }   /* build 147: the guest's own position leads now (below), so on registration their local hero is put at this spawn and the host holds its copy there for a moment rather than chasing the spot their page loaded them at, on top of the host. Build 159 (4/7): snap is what makes the 'hp' handler actually put them there (it never did), and the copy starts at the guest's geared max -- a flat 100 read as a hit on a guest wearing +50 hp */
    // gear-scaled max hp, delta-preserving on increase -- the same pattern applyGear() (game.js) uses for the real hero
    const newMax=guestMaxHp(s);
    if(newMax!==g.max){ if(newMax>g.max) g.hp+=newMax-g.max; g.max=newMax; g.hp=Math.min(g.hp,g.max); }
    // same 4s-then-respawn rule heroUpdate uses for the real hero; no movement while down. Respawns back at this
    // guest's own spawnX (not a recomputed guestHero.size*1.5, which drifts as players join/leave) so two guests
    // who go down around the same time don't stack on the identical point -- and sends the guest their own fresh
    // hp/position so their own client (see 'hp' below) snaps back in step rather than drifting from what they wandered to locally.
    // Build 159 (4/7): snap, so the guest stands there even when its own countdown got it up first (heroUpdate puts a hero back at
    // the host's start); and the copy holds the spot a moment, as on joining, while the guest's reports from where it fell drain out
    if(g.dead>0){ g.dead-=dt; if(g.dead<=0){ g.dead=0; g.hp=g.max; g.x=g.spawnX; g.z=GUEST_SPAWN_Z; g.y=floorAt(g.x,g.z,0); g.holdT=.5; g.stuckT=0; g.farT=0; send('hp',{hp:g.hp,max:g.max,dead:g.dead,x:g.x,y:g.y,z:g.z,snap:1},id); } }
    else{
      g.hurtT-=dt; if(g.hurtT<0&&g.hp<g.max) g.hp=Math.min(g.max,g.hp+(1.5+(s?s.stat.regen:0))*dt);   // passive regen, same base rate and gear scaling as heroUpdate's (game.js)
      // co-op sweep 2026-10-02: his Mending Light -- 2% a second inside one of HIS halos (96l-talents.js), told to his own page every .6 s ('mend'), as Mossheart keeps both bars together
      if(s&&s.tal&&s.tal.fmend&&g.hp<g.max&&defs.some(d=>!d.dead&&MEND_AUR.has(d.kind)&&d.ownerId===id&&d.ownerHero==='fighter'&&Math.hypot(d.x-g.x,d.z-g.z)<=stat(d,'range'))){ const a=Math.min(g.max-g.hp,g.max*.02*dt); g.hp+=a; g.mendAcc=(g.mendAcc||0)+a; }
      g.mendT=(g.mendT||0)+dt; if(g.mendT>=.6){ g.mendT=0; if(g.mendAcc>0){ send('mend',{a:+g.mendAcc.toFixed(2)},id); g.mendAcc=0; } }
      // build 147 ("having to calibrate in game to get avatars to sync"): the host used to re-simulate every guest from
      // the keys they sent, 15 times a second, while the guest's own screen moved their hero from the same keys at
      // 60 -- two copies of one hero that started apart and drifted further with every dropped packet, until walking
      // into a wall pinned both to the same spot. Now the guest's own position is the truth: the host walks its copy
      // toward it (through moveCircle, so walls and rails still hold) with a catch-up cap of 16 units a second, so a
      // late packet is caught up in a fraction of a second but nobody can teleport, and a jump of more than 30
      // units in one packet is ignored (a map mismatch, or nonsense). An older guest that sends no position still
      // gets the keys path below.
      // Build 159 (4/7): the cap is no longer a flat 16 -- a guest with +50% move sprints past it (11 a second at base, times its move
      // stat and multiplier), and the copy fell further behind every step, mobs swinging at the empty spot it lagged at. It is now that
      // guest's own top speed with a third again to catch up in. And a far jump is no longer ignored for good: the Tear of the Rootgate
      // (97-mythics.js) puts its wearer at a gate 30+ away, and the copy used to stay where they had stood -- mobs at the gate ignored
      // them, mobs at the old spot kept hurting them, their shots started there. A far spot that holds for .3 s (several reports
      // agreeing, not one stray packet) on floor a hero can stand on is where the copy goes
      if(g.holdT>0) g.holdT-=dt;
      else if(typeof inp.x==='number'&&typeof inp.z==='number'){ const dx=inp.x-g.x, dz=inp.z-g.z, d=Math.hypot(dx,dz);
        if(d>0&&d<30){ g.farT=0; const vmax=Math.max(16,11*(1+(s?s.stat.move:0)/100)*(s?s.mult.move:1)*4/3), k=Math.min(1,vmax*dt/d); moveCircle(g,dx*k,dz*k,.42,true); if(d>1.4){ g.stuckT=(g.stuckT||0)+dt; if(g.stuckT>.8){ g.x=inp.x; g.z=inp.z; g.stuckT=0; } } else g.stuckT=0; }   /* build 150 ("guests not doing any damage"): a copy that cannot walk to where its guest really stands (a hedge or a wall between, the guest on a ledge) snaps there after .8 s -- the guest's swings and the mobs' aim use the copy, so a copy stuck behind a defense fought nothing */
        else if(d>=30){ g.farT=(g.farT||0)+dt; if(g.farT>=.3&&!heroSolid(gat(wc(inp.x),wcz(inp.z)))){ g.x=inp.x; g.z=inp.z; g.y=floorAt(g.x,g.z,0); g.stuckT=0; g.farT=0; } }
        else g.farT=0;
        if(typeof inp.hyaw==='number') g.yaw=inp.hyaw; g.y=floorAt(g.x,g.z,g.y); }
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
    window.__party.add(id,heroGlb(inp.pick),heroLabel(inp.pick));   // every tick: add() returns at once for the same rig and re-skins on a pick change (build 150)
    window.__party.setTarget(id,g.x,g.z,g.yaw,g.y); if(window.__party.setLook) window.__party.setLook(id,inp.look||null);   // build 150: the host dresses its copy of the guest from the look that rides the guest's input
  });
}
// build 159 (5/7): a guest's Voidwoven Mantle. 97-mythics.js wraps hurtHero, but a guest is hurt here, so a guest's mantle never swallowed
// anything. The same rule, on the host's copy: the first hit of each of the HOST's waves is swallowed and the copy blinks a few steps
// away from the nearest mob; the guest is told to blink the same way on its own screen (its position leads, so the copy holds the new
// spot a moment while the guest's reports from there arrive) -- 'mantle' below
function guestMantle(id,g,s){ if(!(s&&s.myth&&s.myth.includes('voidwoven_mantle'))||S.phase!=='wave'||g.mantleW===S.wave) return false; g.mantleW=S.wave;
  let bx=-Math.sin(g.yaw), bz=-Math.cos(g.yaw), nearest=null, nd=1e9; for(const e of enemies){ if(e.dead) continue; const d=Math.hypot(e.x-g.x,e.z-g.z); if(d<nd){ nd=d; nearest=e; } } if(nearest&&nd>.01){ bx=(g.x-nearest.x)/nd; bz=(g.z-nearest.z)/nd; }
  for(let i=0;i<6;i++) moveCircle(g,bx*.6,bz*.6,.42,true); g.y=floorAt(g.x,g.z,g.y); g.hurtT=1; g.holdT=Math.max(g.holdT||0,.35);
  const gl=glow(0xc070ff,2.4,.9); gl.position.set(g.x,g.y+.9,g.z); scene.add(gl); projs.push({kind:'splat',t:0,mesh:gl});
  send('mantle',{bx:+bx.toFixed(3),bz:+bz.toFixed(3)},id); return true; }
onMessage('mantle',d=>{ if(role!=='guest'||!d||hero.dead>0) return; const bx=+d.bx||0, bz=+d.bz||0, l=Math.hypot(bx,bz); if(!(l>.01)) return;
  for(let i=0;i<6;i++) moveCircle(hero,bx/l*.6,bz/l*.6,.42,true); hero.hurtT=1; const gl=glow(0xc070ff,2.4,.9); gl.position.set(hero.x,hero.y+.9,hero.z); scene.add(gl); projs.push({kind:'splat',t:0,mesh:gl}); toast('The mantle swallows the blow'); });
// co-op sweep 2026-10-02: the guest's own defensive talents, in the order the host's own hurtHero wraps run them (96l-talents.js; the Mantle stays first, it is outermost):
// Light Feet's DODGE, the Aegis shell, Last Stand, the Aegis catching a near-fatal blow, then the blow, then Martyr's Light. Each shows on the guest's own screen ('powerFx' tal)
function hurtGuestHero(id,dmg){
  const g=guestHero.get(id); if(!g||g.dead>0) return;
  const s=guestStats.get(id), def=s?s.stat.def:0, t=(s&&s.tal)||{};
  if(guestMantle(id,g,s)) return;
  if(t.rdodge&&Math.random()<.15){ floatText(g.x,(g.y||0)+3,g.z,'🍃 DODGE','#8ef0c8'); send('powerFx',{k:'tal',t:'dodge'},id); return; }
  if(t.kaegis&&S.t<(g.aegisT||-1)) return;
  if(t.kstand&&g.hp<g.max*.35) dmg*=1-.1*t.kstand;
  if(t.kaegis&&S.t>=(g.aegisReady||0)&&g.hp-dmg*(1-Math.min(75,def)/100)<=g.max*.3){ g.aegisT=S.t+3; g.aegisReady=S.t+30; floatText(g.x,(g.y||0)+3.2,g.z,'✨ AEGIS','#ffe08a'); send('powerFx',{k:'tal',t:'aegis'},id); return; }
  dmg=Math.max(1,Math.round(dmg*(1-Math.min(75,def)/100)));   // same gear-scaled mitigation hurtHero() (game.js) applies to the real hero
  g.hp-=dmg; g.hurtT=3; if(g.hp<=0){ g.hp=0; g.dead=4; }
  if(t.fmartyr&&g.martyrW!==S.wave&&!(g.dead>0)&&g.hp>0&&g.hp<g.max*.25){ g.martyrW=S.wave; g.hp=Math.min(g.max,g.hp+g.max*.4); const bd=t.md||0, M=window.__mythic;
    const blast=()=>{ for(const e of enemies.slice()){ if(e.dead||Math.hypot(e.x-g.x,e.z-g.z)>5+e.r) continue; const dx=e.x-g.x, dz=e.z-g.z, l=Math.max(.01,Math.hypot(dx,dz)); hurt(e,bd,dx/l*3,dz/l*3); } };
    if(bd>0){ if(M&&M.asHero) M.asHero(blast); else blast(); } if(typeof shockRing==='function') shockRing(g.x,baseFloor(g.x,g.z),g.z,5); floatText(g.x,(g.y||0)+3.4,g.z,'✝ MARTYR\u2019S LIGHT','#fff2c0'); send('powerFx',{k:'tal',t:'martyr'},id); }
  send('hp',{hp:g.hp,max:g.max,dead:g.dead,x:g.x,y:g.y,z:g.z},id);
}
// ...and a mob that strikes him up close takes his Briar Skin and Thorns back, as one striking the host's own hero does (96l-talents.js landHit wraps)
{ const prev=landHit; landHit=function(e,tg){ const r=prev.apply(this,arguments); if(role==='host'&&tg&&tg.kind==='hero'&&!tg.ranged&&tg.hero&&tg.hero.gid&&e&&!e.dead){ const st=guestStats.get(tg.hero.gid), t=st&&st.tal;
    if(t&&t.briar&&!e.dead){ hurt(e,Math.max(1,Math.round(e.dmg*.15*t.briar)),0,0); floatText(e.x,e.y+e.h+.2,e.z,'🌵','#8ef05a'); }
    if(t&&t.kthorns&&!e.dead){ hurt(e,Math.max(1,Math.round(e.dmg*.25)),0,0); floatText(e.x,e.y+e.h+.2,e.z,'🌵','#9fc3ff'); } } return r; }; }
// the guest's own client (see onMessage('hp') below) applies this straight to its own local `hero` -- otherwise the
// hp/dead this module tracks is host-private, so the one player it's happening to would see none of it: their own
// health bar, hurt flash/SFX, death toast and movement-freeze-on-death all read the LOCAL hero (game.js), and that
// local hero's own enemies array stays empty (a guest can't start a wave), so hurtHero() never fires through real
// local gameplay -- targeted (toId) rather than broadcast, since nobody else needs to know a guest's own raw hp
window.__combat={ guestHero:id=>{ const g=guestHero.get(id); return g?{x:+g.x.toFixed(2),z:+g.z.toFixed(2),hp:g.hp,max:g.max,dead:g.dead}:null; },
  guestMana:id=>guestMana.has(id)?guestMana.get(id):null, setGuestMana:(id,v)=>{ guestMana.set(id,v); },   // test-only

  seatOf:id=>{ const s=seatOf.get(id); return s?s.seat:null; }, seatKept:seat=>seatKept.has(seat)?seatKept.get(seat):null };   // guestHero/guestMana are this module's own private state (not re-exposed anywhere else, deliberately -- other modules reach them only through Meta.heroes()/hostTryPlaceDef etc.); this object is purely a test hook
// co-op combat, part 1: enemies can now notice and damage a guest's hero, not just the host's own -- Meta.heroes()
// (game.js) is the hook updateEnemies/landHit read every tick; each entry closes over a live guestHero record, so
// isDead()/hurt() always reflect the CURRENT state at the moment an attack actually lands, not a stale snapshot
// taken when the enemy first picked its target
Meta.heroes=()=>[...guestHero.entries()].map(([id,g])=>({gid:id,x:g.x,y:g.y,z:g.z,isDead:()=>g.dead>0,hurt:dmg=>hurtGuestHero(id,dmg)}));   // gid (co-op sweep 2026-10-02): whose -- his Briar Skin and Thorns (landHit, below)
// guest only: the host's authoritative hp/dead/position for THIS client's own hero, applied straight onto the local
// `hero` object -- reusing the exact same side effects hurtHero()/heroUpdate() already use for the real hero
// (flashDmg/SFX.hurt/the fall toast on death, the respawn toast/model-show/position-snap on recovery) so a guest's
// own screen finally shows what's already true on the host, rather than a permanently-full health bar that never
// moves. Local `hero.dead` is then left to count down on its own too (heroUpdate runs unconditionally every tick
// regardless of role) in parallel with the host's own guestHero.dead countdown -- both start from the same value
// at nearly the same real time, so the two respawns land within a network round-trip of each other; harmless, and
// this message is what corrects it either way once it arrives.
// Build 159 (4/7): snap marks the two messages that place this hero -- joining (the spot the host gave us) and getting back up (the
// same spot). They put us there whatever our own state (our own respawn countdown may have got us up first, at the host's start),
// the spot is remembered for that countdown (the heroUpdate wrap below), and neither is ever read as a hit
let mySpawn=null;
onMessage('hp',data=>{
  if(role!=='guest') return;
  const wasDead=hero.dead>0, at=typeof data.x==='number'&&typeof data.z==='number';
  if(data.snap&&at&&!(data.dead>0)) mySpawn={x:data.x,z:data.z};
  if(data.dead>0&&!wasDead){ hero.hp=0; hero.dead=data.dead; hero.hurtT=3; flashDmg(); SFX.hurt(); toast('You fell! Back in 4 seconds…'); H.g.visible=false; heroShadow.visible=false; }
  else if(data.dead<=0&&wasDead){ hero.dead=0; hero.hp=data.max; hero.max=data.max; hero.x=data.x; hero.z=data.z; hero.y=data.y; hero.vy=0; H.g.visible=!useGLB; heroShadow.visible=true; if(GLBH){ GLBH.wrap.visible=useGLB; playHero('idle',{restart:true}); } toast('Back on your feet!'); }
  else if(data.snap){ if(at){ hero.x=data.x; hero.z=data.z; if(typeof data.y==='number') hero.y=data.y; hero.vy=0; } hero.hp=Math.min(data.hp,hero.max); }
  else if(data.dead<=0&&data.hp<hero.hp){ hero.hp=data.hp; hero.hurtT=3; flashDmg(); SFX.hurt(); }
  else hero.hp=data.hp;
});
// our own countdown back from a fall (heroUpdate, game.js) puts a hero at the host's start, (0,6); a guest belongs at its own spot
{ const prevHeroUpdate=heroUpdate; heroUpdate=function(dt){ const was=hero.dead>0; prevHeroUpdate(dt); if(role==='guest'&&mySpawn&&was&&hero.dead<=0){ hero.x=mySpawn.x; hero.z=mySpawn.z; } }; }
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
  swing=function(){ const before=hero.swingT; origSwing(); if(role==='guest'&&before<0&&hero.swingT===0&&!(window.__aim&&window.__aim.kind())&&(hero.reach||GUEST_REACH)<=GUEST_MELEE_MAX) { const TL=window.__talents, tal=TL&&TL.tree&&TL.tree()==='knight'?{sw:TL.rank('ksweep'),bash:TL.rank('kbash'),bleed:TL.rank('kbleed'),fury:TL.rank('kfury')}:undefined;   /* co-op sweep 2026-10-02: the Knight's swing talents, run on the host (guestHitCone) */
    send('swing',{yaw:+hero.yaw.toFixed(3),x:+hero.x.toFixed(2),z:+hero.z.toFixed(2),dmg:Math.round(heroDmg()*10)/10,reach:+(hero.reach||GUEST_REACH).toFixed(2),tal}); } }; }   // build 159 (4/7): a reach past any sword's is a ranged hero whose staff or bow hasn't appeared yet (just switched) -- no swing then; its shot goes as a shot once the weapon is in hand. Build 150 ("guests' defenses do damage but not the sword"): the swing carries the guest's OWN facing and spot -- hitCone() swings from hero.yaw (the way the hero faces, the walk's direction when moving), not the camera's yaw the relay used to send, and from where the guest really stands, not where the host's copy got to
// the melee cone: still not a faithful port of anything, just a straightforward "who's in front of me" check, same
// as the real local hitCone() (game.js) a melee hero uses -- ranged guests no longer come through here (phase 9,
// below, gives them a real bolt/arrow instead), so GUEST_REACH/GUEST_DMG's own fallbacks now only ever matter for
// a 'swing' that somehow arrives with no dmg/reach at all.
// co-op sweep 2026-10-02: what a host's own swing gets that a guest's did not -- the full Wind set's GALE (40% more reach, mobs thrown back: 93b-sets8.js), the swinger as
// Radiance's and Shadow's "who" (93-gearsets.js guestSwing), and the Knight's swing talents (Wide Sweep, Shield Bash, Bleed, Fury) from the ranks the swing carries (at.tal)
const guestSwingTal=t=>(t&&typeof t==='object')?{ sw:Math.max(0,Math.min(3,t.sw|0)), bash:Math.max(0,Math.min(3,t.bash|0)), bleed:Math.max(0,Math.min(1,t.bleed|0)), fury:Math.max(0,Math.min(3,t.fury|0)) }:null;
function guestHitCone(id,yaw,dmg,reach,at){
  const g=guestHero.get(id); if(!g||g.dead>0) return;
  const s0=guestStats.get(id), wind=!!(s0&&s0.five&&s0.five.includes('of the Wind')), T=guestSwingTal(at&&at.tal), r0=Math.min(reach||GUEST_REACH,GUEST_MELEE_MAX);
  const r=r0*(1+.12*(T?T.sw:0))*(wind?1.4:1), d=dmg||GUEST_DMG; const gx=(at&&typeof at.x==='number')?at.x:g.x, gz=(at&&typeof at.z==='number')?at.z:g.z;   // the guest's reported spot when it sends one (build 150); the host's copy otherwise. Build 159 (4/7): never a sword longer than a sword (GUEST_MELEE_MAX) -- an older guest still sends the bow's 24 in the moment after a switch
  if(Math.hypot(gx-g.x,gz-g.z)<30){ g.x=gx; g.z=gz; }   // and the copy is put there too: a swing is the surest word on where the guest is
  const fx=Math.sin(yaw), fz=Math.cos(yaw); let n=0;
  const cone=()=>{ for(const e of enemies){ if(e.dead) continue; const dx=e.x-gx, dz=e.z-gz, dd=Math.hypot(dx,dz);
    if(dd<r+e.r&&(dx*fx+dz*fz)/Math.max(dd,.01)>.4){ hurt(e,d,fx*1.4,fz*1.4); n++; } } };
  // build 159 (5/7): the powers a host's own swing carries, for the guest's too. This path never went through hitCone, so a guest's full
  // Void set never tore a rift (93-gearsets.js guestSwing runs the swing and that guest's five-piece powers the way the hitCone wrap does
  // the host's), and the Last Lantern counted a guest's sword as a DEFENSE's blow, 25% more on a lit mob (asHero, 97-mythics.js)
  const s=s0, P=Meta.packs, M=window.__mythic, hp0=g.hp, before=new Map(); for(const e of enemies) if(!e.dead) before.set(e,e.hp);
  const go=()=>P&&P.guestSwing?P.guestSwing(s&&s.five,d,cone,g):(cone(),[]);
  const fired=M&&M.asHero?M.asHero(go):go();
  if(wind) for(const [e,h] of before) if(e.hp<h||e.dead){ for(let i=0;i<3;i++) moveCircle(e,fx*.9,fz*.9,e.r*.8,false); const gl=glow(0xd8f0b0,1.2,.85); gl.position.set(e.x,(e.y||0)+.4,e.z); scene.add(gl); projs.push({kind:'splat',t:0,mesh:gl}); }
  const TL=window.__talents; if(T&&TL&&TL.coopSwing){ const run=()=>TL.coopSwing({g,gx,gz,fx,fz,r0,d,T,before}); const o=M&&M.asHero?M.asHero(run):run();
    if(o.bash) send('powerFx',{k:'tal',t:'bash'},id); if(o.bleed) send('powerFx',{k:'tal',t:'bleed'},id); if(o.kill&&T.fury) send('powerFx',{k:'tal',t:'fury'},id); }
  if(g.hp>hp0&&!(g.dead>0)) send('hp',{hp:g.hp,max:g.max,dead:g.dead,x:g.x,y:g.y,z:g.z},id);   // Radiance healed him: his own bar fills
  if(n) SFX.hit();
  if(fired.length) send('powerFx',{k:'rift',at:fired.slice(0,24)},id);   // the rift's ring on the swinger's own screen (its page has no real mobs to tear one on)
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
          // co-op sweep 2026-10-02: the talents single player puts on the shot -- the Witch's boltMods (bigger, piercing, blasting bolts, the twin pair every 5th cast) and the
          // Ranger's Headhunter crit and Piercing Arrows -- with the same numbers 82-staff.js/83-bow.js use; tal = the bolt's on-hit ranks (Withering, Hex Mark, Rootgrasp, Fork,
          // Rot, Doom, Overgrowth, Solar Flare), run on the host by 96l-talents.js onBolt for this guest
          const TL=window.__talents, TM=isStaff&&TL&&TL.boltMods?TL.boltMods():null, crit=!isStaff&&!!(TL&&TL.rCrit&&TL.rCrit()), tr=TL&&TL.tree?TL.tree():null;
          const tal=isStaff&&TL&&TL.rank&&(tr==='witch'||tr==='fighter')?{wither:TL.rank('wither'),mark:TL.rank('mark'),grasp:TL.rank('grasp'),fork:TL.rank('fork'),rot:TL.rank('rot'),doom:TL.rank('doom'),overgrow:TL.rank('overgrow'),fflare:TL.rank('fflare'),hd:Math.round(heroDmg()*10)/10}:undefined;
          const msg={wtype:isStaff?'bolt':'arrow',kind:wo.userData.kind,
            dmg:Math.round(heroDmg()*sh.mul*(crit?2:1)*10)/10,
            dir:{x:+d3.fx.toFixed(3),y:+d3.fy.toFixed(3),z:+d3.fz.toFixed(3)},
            spd:+spd.toFixed(2), life:+((range+1)/spd).toFixed(3),
            size:+(isStaff?(1+.7*sh.c)*(TM?TM.size:1):(1+.4*sh.c)*(crit?1.4:1)).toFixed(2),
            splash:isStaff?Math.max(sh.full?1.9:0,TM?TM.splash:0):0, pierce:isStaff?(TM?TM.pierce:0):(sh.full?2:0)+(TL&&TL.rPierce?TL.rPierce():0), crit:crit?1:undefined, tal,
            x:+hero.x.toFixed(2), y:+hero.y.toFixed(2), z:+hero.z.toFixed(2)};   // build 159 (4/7): where the shooter really stands, as a swing says (hostGuestShot)
          send('shot',msg);
          if(TM&&TM.twin) for(const a of [.14,-.14]){ const v=new THREE.Vector3(d3.fx,d3.fy,d3.fz).applyAxisAngle(new THREE.Vector3(0,1,0),a); send('shot',Object.assign({},msg,{dir:{x:+v.x.toFixed(3),y:+v.y.toFixed(3),z:+v.z.toFixed(3)}})); }
          if(TL){ const bm=TL.boltMods, rc=TL.rCrit; TL.boltMods=()=>TM; TL.rCrit=()=>crit; try{ return prevHitCone(); }finally{ TL.boltMods=bm; TL.rCrit=rc; } }
        }
      }
    }
    return prevHitCone();   // the guest's own local shot still fires too (their own screen's real visual/audio), against their own empty local `enemies` -- cosmetic only, the message above is what actually hurts anything
  };
}
function guestBoltTal(t){ if(!t||typeof t!=='object') return null; const o={}; for(const k of ['wither','mark','grasp','fork','rot','doom','overgrow','fflare']) o[k]=Math.max(0,Math.min(3,t[k]|0)); o.hd=Math.max(0,Math.min(1e5,+t.hd||0)); return o; }
function hostGuestShot(data,fromId){
  const g=guestHero.get(fromId); if(!g||g.dead>0) return;
  // build 159 (4/7): the shot starts where the guest says it stands (a sprinting witch's bolts used to leave from the copy, steps
  // behind her), and the copy is put there too -- the same rule guestHitCone keeps for a swing. Its own height as well, so a shot
  // loosed mid-jump leaves from the air; an older guest that sends no spot fires from the copy as before
  if(typeof data.x==='number'&&typeof data.z==='number'&&Math.hypot(data.x-g.x,data.z-g.z)<30){ g.x=data.x; g.z=data.z; g.y=floorAt(g.x,g.z,g.y); }
  const y0=typeof data.y==='number'&&Math.abs(data.y-g.y)<4?data.y:g.y;
  const from=new THREE.Vector3(g.x,y0+(data.wtype==='bolt'?1.3:1.1),g.z);   // an approximate hand/head height -- the host has no bone-accurate rig for a guest's puppet to read the real one from, same "good enough to read as real" tradeoff the mob/def puppets already make
  const dir=new THREE.Vector3(data.dir.x,data.dir.y,data.dir.z);
  const tal=data.wtype==='bolt'?guestBoltTal(data.tal):null;   // co-op sweep 2026-10-02: crit, and the guest's bolt talents with its own counters (96l-talents.js onBolt)
  const opts={dmg:data.dmg,life:data.life,size:data.size,splash:data.splash,pierce:data.pierce,owner:fromId,crit:!!data.crit,tal,ctr:tal?(g.talCtr||(g.talCtr={bolt:0,flare:0,kill:0})):null};   // owner (build 170): whose arrow -- Subterfuge sends that guest the chain lightning it throws (86i-subterfuge.js)
  if(data.wtype==='bolt') window.__staff.fireBolt(data.kind,from,dir,data.spd,opts);
  else window.__bow.fireArrow(data.kind,from,dir,data.spd,opts);
}
onMessage('shot',(data,fromId)=>hostGuestShot(data,fromId));
onMessage('swing',(data,fromId)=>{ guestHitCone(fromId,data.yaw,data.dmg,data.reach,data); });
const guestByHero=new Map();   // build 434: id|hero -> {stat,mult}, the last a guest reported while that hero was out
const guestStats=new Map();   // id -> {stat:{tow,trate,tarea,move,def,hp,regen},mult:{tow,tcd,aoe,move,hp}} -- this guest's OWN gear/skill numbers, last reported
// build 159 (5/7): myth, five and idle -- the named mythics this guest wears, its full sets and whether its hero stands still -- so the
// host can run that guest's powers (97-mythics.js GW, 93-gearsets.js guestSwing, guestMantle above). Only names the game knows are kept
const strList=(a,ok)=>Array.isArray(a)?a.filter(k=>typeof k==='string'&&k.length<40&&(!ok||ok(k))).slice(0,8):[];
onMessage('input',(data,fromId)=>{ guestIn.set(fromId,data); if(data.stat&&data.mult){ const NM=window.__mythic&&window.__mythic.NAMED;
  if(typeof data.pick==='string') guestByHero.set(fromId+'|'+data.pick,{stat:data.stat,mult:data.mult,kind:data.kind||{}});   /* build 434: each guest's numbers kept per hero, so their towers keep the placer's after a switch */
  guestStats.set(fromId,{pick:typeof data.pick==='string'?data.pick:null,stat:data.stat,mult:data.mult,kind:data.kind||{},myth:strList(data.myth,k=>!!(NM&&Object.prototype.hasOwnProperty.call(NM,k))),five:strList(data.five),idle:!!data.idle,tt:cleanTT(data.tt),tal:cleanDefTal(data.tal)}); } });
Meta.defOwnerTalent=(id,h,t)=>{ const s=guestStats.get(id); return s&&s.tt?((s.tt[h]||{})[t]|0):undefined; };   // co-op sweep 2026-10-02: that guest's tower-talent rank (96l-talents.js towRank); undefined = not known (an older guest, or gone)
Meta.coopFive=()=>{ if(role!=='host') return null; const out=[]; guestHero.forEach((g,id)=>{ const s=guestStats.get(id); if(s&&s.five&&s.five.length) out.push({id,five:s.five,g}); }); return out; };   // co-op sweep 2026-10-02: who wears which full sets (93b-sets8.js: the Earth's guard round each guest)
Meta.coopWear=()=>{ if(role!=='host') return null; const out=[]; guestHero.forEach((g,id)=>{ const s=guestStats.get(id); if(s&&s.myth&&s.myth.length) out.push({id,myth:s.myth,idle:s.idle,g}); }); return out; };   // who wears what, for 97-mythics.js (g: the host's live copy of that guest's hero)
// a guest's Rootsplitter: its own 4th swing drew the roots on its own screen (97-mythics.js) and says so here; the host holds its mobs
// from where the guest stands, as the host's own swing does. Only for a guest that wears it, alive, from within a few steps of its copy
onMessage('roots',(d,fromId)=>{ if(role!=='host'||!d) return; const g=guestHero.get(fromId), s=guestStats.get(fromId), M=window.__mythic; if(!g||g.dead>0||!(s&&s.myth.includes('rootsplitter'))||!(M&&M.roots)) return;
  const now=performance.now(); if(now-(g.rootsAt||-1e9)<300) return; g.rootsAt=now;   // four swings can't come quicker than this
  const ok=typeof d.x==='number'&&typeof d.z==='number'&&Math.hypot(d.x-g.x,d.z-g.z)<6, x=ok?d.x:g.x, z=ok?d.z:g.z, yaw=Number.isFinite(+d.yaw)?+d.yaw:g.yaw;
  if(M.roots(x,g.y,z,yaw,Math.max(0,Math.min(27,+d.reach||0)))) send('powerFx',{k:'roots',x:+x.toFixed(2),z:+z.toFixed(2),yaw:+yaw.toFixed(3)},fromId); });
// build 258: a guest's 6/7 (97d-sixseven.js). Its own 6th swing has no real mobs on its page, so it asks here: the host strikes the real mobs from where the guest stands (up to 7, 70% of the damage it reports) and sends the bolts back to draw
onMessage('sixseven',(d,fromId)=>{ if(role!=='host'||!d) return; const g=guestHero.get(fromId), s=guestStats.get(fromId), X=window.__sixseven; if(!g||g.dead>0||!(s&&s.myth.includes('sixseven'))||!X) return;
  const now=performance.now(); if(now-(g.sixAt||-1e9)<800) return; g.sixAt=now;   // six swings can't come quicker than this
  const ok=typeof d.x==='number'&&typeof d.z==='number'&&Math.hypot(d.x-g.x,d.z-g.z)<6, x=ok?d.x:g.x, z=ok?d.z:g.z, yaw=Number.isFinite(+d.yaw)?+d.yaw:g.yaw, dmg=Math.max(0,Math.min(1e5,+d.dmg||0));
  const r=X.strike(x,g.y,z,yaw,dmg); if(r&&r.segs.length) send('powerFx',{k:'chain',s:r.segs.slice(0,8)},fromId); });
// build 178: a guest's Bramblewhisk. Its pet's shot landed on its own screen, which drew the thorn patch there (85-familiars.js famLand,
// looks only: that page has no real mobs); the host grows the real one -- the slow and the pricks -- on its own floor. Only for a guest
// that wears it, alive, near where its pet could reach, at no more than a pet's pace, and never a patch that pricks harder than a shot
onMessage('bramble',(d,fromId)=>{ if(role!=='host'||!d) return; const g=guestHero.get(fromId), s=guestStats.get(fromId), B=window.__bramble; if(!g||g.dead>0||!(s&&s.myth.includes('bramblewhisk'))||!(B&&B.sprout)) return;
  const x=+d.x, z=+d.z; if(!Number.isFinite(x)||!Number.isFinite(z)||Math.hypot(x-g.x,z-g.z)>FAM_RANGE+6) return;
  const now=performance.now(); if(now-(g.brambleAt||-1e9)>500){ g.brambleAt=now; g.brambleN=0; } if(++g.brambleN>6) return;   /* a volley (twin shot, extra projectiles) lands together: six a half second is well over any pet's pace */
  B.sprout(x,z,Math.max(0,Math.min(200,+d.dmg||0))); });
// what the host says a guest's power just did, drawn on that guest's own screen: the Void rift's rings, the ROOTS shout
onMessage('powerFx',d=>{ if(role!=='guest'||!d) return;
  if(d.k==='rift'&&Array.isArray(d.at)){ const P=Meta.packs; d.at.slice(0,24).forEach(p=>{ if(P&&P.ring&&p&&Number.isFinite(+p.x)&&Number.isFinite(+p.z)) P.ring(+p.x,+p.y||0,+p.z,+p.c||0x8a3dff); }); if(SFX.rift) SFX.rift(); }
  else if(d.k==='roots'&&Number.isFinite(+d.x)&&Number.isFinite(+d.z)){ const fx=Math.sin(+d.yaw||0), fz=Math.cos(+d.yaw||0); floatText(+d.x+fx*1.5,hero.y+1.4,+d.z+fz*1.5,'ROOTS','#5ad05a'); }
  else if(d.k==='chain'&&Array.isArray(d.s)&&window.__subterfuge){ const segs=d.s.slice(0,8).filter(s=>Array.isArray(s)&&s.length===6&&s.every(v=>Number.isFinite(+v))).map(s=>s.map(Number)); if(segs.length) window.__subterfuge.draw(segs); }
  else if(d.k==='blitz'&&window.__gabriel&&window.__gabriel.cue) window.__gabriel.cue();   /* co-op sweep 2026-10-02: this guest's Gabriel's Charm just sped up the host's defenses -- the BLITZ over our own hero */
  else if(d.k==='tal'&&window.__talents&&window.__talents.coopFx) window.__talents.coopFx(d.t);   /* co-op sweep 2026-10-02: a talent of ours the host just ran (DODGE, AEGIS, MARTYR'S LIGHT, Fury...) shown on our own hero */ });   // build 170: the chain lightning this guest's Subterfuge arrow threw across the host's mobs
Meta.defOwnerStat=(id,k)=>{ const s=guestStats.get(id); return s?s.stat[k]:undefined; };
Meta.defOwnerMult=(id,k)=>{ const s=guestStats.get(id); return s?s.mult[k]:undefined; };
Meta.defOwnerHero=id=>{ const s=guestStats.get(id); return s?s.pick:null; };
Meta.defOwnerHeroStat=(id,h,k)=>{ const s=guestByHero.get(id+'|'+h); return s&&s.stat?s.stat[k]:undefined; };
Meta.defOwnerHeroKind=(id,h,kind)=>{ const s=guestByHero.get(id+'|'+h); return s&&s.kind?(s.kind[kind]||0):undefined; };
Meta.defOwnerHeroMult=(id,h,k)=>{ const s=guestByHero.get(id+'|'+h); return s&&s.mult?s.mult[k]:undefined; };
Meta.defOwnerRingCol=id=>{ const s=guestStats.get(id); if(!s) return undefined; const P=Meta.packs, pk=(s.five||[]).map(n=>P&&P.get(n)).find(p=>p&&p.col); return pk?pk.col:null; };   // co-op sweep 2026-10-02: the rune ring colour of that guest's own full set, for its towers (93-gearsets.js defRingUpdate)
Meta.defOwnerKind=(id,kind)=>{ const s=guestStats.get(id); return s?(s.kind&&s.kind[kind])||0:undefined; };   // that guest's own full-set power for this defense kind (94-voidset.js)

// build 150: what this player wears, resolved here (the weapon model key its own rig mounted, the tier, the weapon's set for
// the tint, the FULL set for the glow, the familiar's name and rarity) -- the receivers only need names (98-party.js dress)
// build 181: `s`/`st` used to be full-set-or-nothing (tier>=5); now the MOST COMPLETE active set rides along whatever its
// tier actually is (3 or 5), so a puppet can show the dimmer three-piece shell too (98-party.js dress/dressTick, told
// the tier) -- one extra small field, no new message type. Every five-piece gameplay power is untouched: those all key
// off has()/anyWears()/Meta.sets.active() on the wearer's OWN page, never off this cosmetic broadcast field.
function lookOf(){ const w=window.__weapons&&window.__weapons.look?window.__weapons.look():null; const acts=Meta.sets&&Meta.sets.active?Meta.sets.active():[]; const full=acts.find(a=>a.tier>=5)||acts.find(a=>a.tier>=3)||null; const fi=gear.familiar, f2=window.__tworings&&window.__tworings.ringOn()?gear.familiar2:null; return {f2:f2?{n:f2.name,r:f2.rarity|0,nm:f2.named||null}:null,w:w&&w.w||null,t:w&&w.t||1,ws:w&&w.s||null,s:full?full.name:null,st:full?full.tier:0,f:fi?{n:fi.name,r:fi.rarity|0,nm:fi.named||null}:null,pd:SLOTS.some(s=>gear[s]&&gear[s].procd)?1:0,gf:window.__golf&&window.__golf.mine?window.__golf.mine():null}; }   /* co-op sweep 2026-10-02 (hero-gear-pets): nm = a named pet's id (Gladehart, Trimaw...), so a partner's puppet wears its real model, not the Wisp stand-in. gf = this hero's mini golf ball and putt while on a hole (56k4-moatgolf.js draws it on the partners' pages) */
let syncT=0;
function hostBroadcastHeroes(dt){
  if(role!=='host'||!conns.size) return;
  syncT+=dt; if(syncT<1/15) return; syncT=0;   // 15Hz: plenty for a puppet that already eases toward its target (98-party.js) rather than snapping to it
  const h=window.__dd.hero;
  const list=[{id:selfId,x:+h.x.toFixed(3),y:+(h.y||0).toFixed(2),z:+h.z.toFixed(3),yaw:+h.yaw.toFixed(3),pick:window.__heroes.pick(),look:lookOf()}];
  guestHero.forEach((g,id)=>{ const inp=guestIn.get(id); list.push({id,x:+g.x.toFixed(3),y:+(g.y||0).toFixed(2),z:+g.z.toFixed(3),yaw:+g.yaw.toFixed(3),pick:(inp&&inp.pick)||'witch',look:(inp&&inp.look)||null}); });   // a guest's look rides its input (build 150); relayed here so every guest sees every other
  sendSnap('heroes',{list});
}
onMessage('heroes',data=>{
  const mine=selfId;
  const ids=new Set();
  data.list.forEach(h=>{ ids.add(h.id); if(h.id===mine) return;   // that's me -- I already render my own local hero directly, not as a puppet of myself
    window.__party.add(h.id,heroGlb(h.pick),heroLabel(h.pick));   // same: a teammate's pick change re-skins their puppet here
    window.__party.setTarget(h.id,h.x,h.z,h.yaw,h.y); if(window.__party.setLook) window.__party.setLook(h.id,h.look||null); });
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
// co-op sweep 2026-10-02: the ranks the host can't know. tt: per hero, the tower talents (a tower keeps its placer's, 96l-talents.js towRank). tal: the current hero's
// defensive ones (Light Feet, Last Stand, Aegis, Thorns, Briar Skin, Martyr's Light, Mending Light) and Martyr's blast damage
const TT_IDS={knight:['ktrap','kthorn','klong'],troll:['rtangle','rvenom','rsky'],fighter:['fbind']}, DEF_TAL=['rdodge','kstand','kaegis','kthorns','briar','fmartyr','fmend'];
function guestTowerTal(){ const T=window.__talents; if(!T||!T.hr) return undefined; const o={}; for(const h in TT_IDS) for(const k of TT_IDS[h]){ const r=T.hr(h,k); if(r>0) (o[h]||(o[h]={}))[k]=r; } return o; }
function guestDefTal(){ const T=window.__talents; if(!T||!T.tree||!T.tree()) return undefined; const o={}; for(const k of DEF_TAL){ const r=T.rank(k); if(r) o[k]=r; } if(o.fmartyr) o.md=Math.round(heroDmg()*3*10)/10; return o; }
const cleanTT=t=>{ if(!t||typeof t!=='object') return null; const o={}; for(const h in TT_IDS){ const x=t[h]; if(!x||typeof x!=='object') continue; for(const k of TT_IDS[h]){ const r=Math.max(0,Math.min(3,x[k]|0)); if(r) (o[h]||(o[h]={}))[k]=r; } } return o; };
const cleanDefTal=t=>{ if(!t||typeof t!=='object') return {}; const o={}; for(const k of DEF_TAL){ const r=Math.max(0,Math.min(3,t[k]|0)); if(r) o[k]=r; } if(o.fmartyr) o.md=Math.max(0,Math.min(1e5,+t.md||0)); return o; };
let syncTIn=0;
function guestSendInput(dt){
  if(role!=='guest') return;
  syncTIn+=dt; if(syncTIn<1/15) return; syncTIn=0;
  send('input',{w:K.w?1:0,s:K.s?1:0,a:K.a?1:0,d:K.d?1:0,shift:K.shift?1:0,yaw:+cam.yaw.toFixed(3),pick:window.__heroes.pick(),x:+hero.x.toFixed(2),z:+hero.z.toFixed(2),hyaw:+hero.yaw.toFixed(3),   /* build 147: where this guest's own hero really is -- the host follows it instead of re-simulating the keys (see guestInputTick) */
    stat:{tow:heroStat('tow'),trate:heroStat('trate'),tarea:heroStat('tarea'),move:heroStat('move'),def:heroStat('def'),hp:heroStat('hp'),regen:heroStat('regen'),mana:heroStat('mana')},
    mult:{tow:heroMult('tow'),tcd:heroMult('tcd'),aoe:heroMult('aoe'),move:heroMult('move'),hp:heroMult('hp'),mana:heroMult('mana'),thp:heroMult('thp')},
    kind:Meta.defKindMap?Meta.defKindMap():{},   // a full set's per-defense-kind power (94-voidset.js), for the halos this guest places
    seat:window.__lobby&&window.__lobby.seat?window.__lobby.seat():undefined,   // build 159 (3/7): this tab's lobby seat, so the host can keep this player's mana and defenses for them across a drop (seatJoin)
    myth:window.__mythic&&window.__mythic.worn?window.__mythic.worn():[], five:Meta.sets&&Meta.sets.active?Meta.sets.active().filter(a=>a.tier>=5).map(a=>a.name):[], idle:(!hero.moving&&hero.swingT<0&&hero.dead<=0)?1:0,   // build 159 (5/7): what the host needs to run this guest's named mythics and five-piece powers (the 'input' handler), and Mossheart's "stand still"
    look:lookOf(),   // build 150: what this guest wears, for its puppet on every other screen
    tt:guestTowerTal(), tal:guestDefTal(),   // co-op sweep 2026-10-02: the talent ranks the host needs for this guest's towers (any hero's) and for this guest himself when hurt
    mz:MOBS_V});   // build 159 (6/7): "I read the packed mob list" -- the host sends 'mobs' instead of 'enemies' from then on (hostBroadcastEnemies)
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
  sendSnap('world',{crystal:S.crystal,left:enemies.filter(e=>!e.dead).length+spawnQ.length,   /* build 503 (Matt, with Jacob: "he does not see enemies left under the wave count") */ crystal2:GOAL2>=0?S.crystal2:null,crystal3:(typeof GOAL3!=='undefined'&&GOAL3>=0)?S.crystal3:null,   /* build 499 (Matt, with Jacob: "his heartroot health didn't change when one took damage"): the Drawbridge's third, the keep's */ crystalMax:CRYSTAL_MAX,wave:S.wave,phase:S.phase,held:!!S.held,waveTotal:runWaves(),survival:!!SURVIVAL,diff:window.__difficulty?window.__difficulty.id():'normal',mapName:MAP.name,mana:S.mana,manas,du:S.du,duCap:DU_CAP,hk:(window.__hideout&&window.__hideout.ownKey)?window.__hideout.ownKey():'main'});   // hk (build 377): the host's hideout key -- a guest visiting the hideout is sent to the HOST's table (59-hideout.js)
   // held (build 160): the host's hall is on its victory lap -- phase 'build', but no horn to wait for
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
// build 160: the victory lap. The host's last wave held no longer ends the run -- its hall stays open (game.js winMap) until the host
// presses MOVE ON -- so a guest hears about it twice: 'mapHeld' the moment the horde breaks, and 'runEnd' at the host's MOVE ON. The
// map's payout goes with the FIRST, to every guest in the hall at that moment, exactly as the host is paid then (10-meta.js onMapHeld):
// closing the tab on the lap, the host never moving on, or the host's tab dying all lose a guest nothing it earned, and 'runEnd' then
// carries held:true -- "already paid" -- so nobody is paid twice: not a guest that was there, not one that dropped and came back on
// the lap (its pay is in its save from before), and not one that walked in during the lap (it held nothing). An older host that sends
// no held flag still pays at 'runEnd', as it always did. guestHeld is what this page was told and paid at HALL HELD
let guestHeld=null;
function guestShowRunEnd(w){
  guestRunEnded=true; S.phase=w.phase; cancelPlace(); droneOff(); setMusic('none');
  if(w.phase==='won'){ try{ if(window.__jars&&window.__jars.sweep) window.__jars.sweep(); }catch(e){} }   // co-op sweep 2026-10-02: a held hall's jars still on this guest's floor are banked, as single player's MOVE ON does (99g sweep)
  if(document.exitPointerLock) document.exitPointerLock(); document.body.classList.remove('play');
  const sv=!!w.survival, held=w.phase==='won'?w.wave|0:Math.max(0,(w.wave|0)-1), rec=sv&&window.__survival?window.__survival.record(held):null;   // build 176: a Survival run -- the waves held go on this player's own best for the map too (they held them)
  if(w.phase==='won'){ SFX.held(); $('deadh1').textContent=sv?'SURVIVAL COMPLETE':'HALL HELD'; $('deadh2').textContent=sv?'ALL '+held+' WAVES HELD ON '+MAP.name:w.mapName+' is cleared'; }
  else { sting(); $('deadh1').textContent='THE GATE HAS OPENED'; $('deadh2').textContent='THE HALL FELL ON WAVE '+w.wave+(sv?' · SURVIVED '+held+' WAVE'+(held===1?'':'S')+(rec&&rec.newBest?' — A NEW BEST':''):''); }
  const paidAtHeld=w.phase==='won'&&!!w.held;   // build 160: paid at HALL HELD (mapHeld, below) -- or, arriving on the lap, not at all
  const pay=paidAtHeld?(guestHeld?guestHeld.pay:0):typeof w.pay==='number'&&Number.isFinite(w.pay)?Math.max(0,Math.round(w.pay)):w.wave>0?25*w.wave+(w.phase==='won'?150:0):0; if(pay&&!paidAtHeld){ Meta.addGold(pay,'run'); Meta.save(); }   // phase 13: the run's payout -- since build 159 (3/7) the host's own number (runPay), so a later map pays the guest what it pays the host; the old map-wave formula only for an older host that sends none
  $('deadp').textContent=(pay?'+'+pay+' ● gold for the run. ':'')+'Your own gear, gold and skills stay with you. Go again.'+(offerRejoin()?" ⟲ REJOIN puts you in the host's next game as soon as they host it.":'');
  $('nextmapbtn').style.display='none'; $('dead').classList.remove('hide');
}
// build 159 (7/7): ⟲ REJOIN <CODE>, beside TRY AGAIN on a guest's end screen (TRY AGAIN stays what it always was: this player's own
// title screen, to go solo or anywhere). It reloads through the lobby's own rejoin link -- ?coopjoin=CODE, which 99b-lobby.js reads,
// strips and joins by itself, a join that waits for the host's next game (join()'s o.wait) -- and on the map this page is on, when
// it is one this player has opened (fresh from storage: a hall held with the host has just opened the next one). A page that had
// followed its host past this player's own unlock goes home instead (no ?coopmap), so a host who never comes back leaves the guest
// on its own map, free to play; if the host does host again on that map, its lobby moves the guest there itself, as for any joiner
const REJOIN=(()=>{ const a=$('againbtn'); if(!a) return null; const b=document.createElement('button'); b.className='big'; b.id='rejoinbtn'; b.style.display='none'; a.insertAdjacentElement('afterend',b);
  b.addEventListener('click',()=>{ const c=lastRoom(); if(!c||b.disabled) return; b.disabled=true; b.textContent='⟲ REJOINING…'; location.href=rejoinHref(c); }); return b; })();
function rejoinHref(code){ const q=new URLSearchParams(location.search); q.delete('coopmap'); q.delete('coopjoin');
  let cleared=0; try{ cleared=parseInt(localStorage.getItem('ddMapsCleared'))||0; }catch(e){}
  if(MAPI<=cleared) q.set('coopmap',String(MAPI)); q.set('coopjoin',code);
  return location.pathname+'?'+q.toString()+location.hash; }
function offerRejoin(){ const c=lastRoom(); if(!REJOIN||!c) return false; REJOIN.textContent='⟲ REJOIN '+(c.length<=8?c:'THE HOST'); REJOIN.style.display=''; return true; }
window.__net.rejoinTo=()=>{ const c=lastRoom(); return c?rejoinHref(c):null; };   // a test hook: where REJOIN would take this page
// build 159 (7/7): a hall that has fallen or been held takes nobody new. Every way on from its end screen reloads the page, so the host
// leaves the matchmaking server there and then (PeerJS's disconnect(): the links to the guests stay up -- they need no server -- and
// keepOnBroker leaves it off). A guest pressing REJOIN before the host has hosted again finds no such room and waits for the next one,
// instead of walking into a run that is over (the host's lobby would have let it in as a late joiner, into a dead hall); and the code
// is already free when the host's reloaded page asks for it again
function parkHost(){ if(role!=='host'||!peer||peer.destroyed||peer.__parked) return; peer.__parked=true; try{ peer.disconnect(); }catch(e){} }
window.__net.onBroker=()=>!!(peer&&!peer.destroyed&&!peer.disconnected);   // a test hook
onMessage('world',data=>{ hostWorld=data; if(role==='guest'&&data){ SURVIVAL=!!data.survival; if(data.diff&&window.__difficulty) window.__difficulty.fromHost(String(data.diff)); } });   /* build 415: and its difficulty */   // build 176: a guest plays its host's mode (the mode row on its own title is the host's business once it follows one)
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
  if(GSFX.crystalHp!==null&&w.crystal<GSFX.crystalHp-.01){ SFX.crystal(); if(SFX.alarm) SFX.alarm(); GSFX.crystal++; } GSFX.crystalHp=w.crystal;
  // build 500 (Matt, with Jacob: "he can't hear when the thing is getting hit"): the Drawbridge's other two Heartroots, the inn's and the keep's, ring the same hit and alarm on a guest
  for(const k of ['crystal2','crystal3']){ const v=w[k]; if(v==null) continue; const was=GSFX[k+'Hp']; if(was!=null&&v<was-.01){ SFX.crystal(); if(SFX.alarm) SFX.alarm(); GSFX.crystal++; } GSFX[k+'Hp']=v; } }
function guestMapCleared(){ try{ const cur=parseInt(localStorage.getItem('ddMapsCleared'))||0; localStorage.setItem('ddMapsCleared',String(Math.max(cur,MAPI+1))); }catch(e){} }   /* build 150: a hall held with the host counts for the guest too (winMap records it on the host only) -- the next room and the other heroes open for them as well */
onMessage('runEnd',data=>{ if(role==='guest'&&!guestRunEnded&&data){ if(data.phase==='won'&&!data.survival) guestMapCleared(); guestShowRunEnd(data); } });   // build 176: a Survival run held clears nothing (the host's map may be past this guest's own campaign)
// build 160: the host's hall is held -- the victory lap begins, on this page too: the banner, the map counted as cleared, and the map's
// payout, right now (see guestHeld above). The HUD, the horn button (▶ MOVE ON, which only tells a guest the host decides) and the portal
// follow the host's world broadcast (held:true, phase 'build'); the end screen waits for the host's MOVE ON ('runEnd')
onMessage('mapHeld',data=>{ if(role!=='guest'||guestRunEnded||guestHeld||!data) return;
  const pay=typeof data.pay==='number'&&Number.isFinite(data.pay)?Math.max(0,Math.round(data.pay)):0;
  guestHeld={pay,wave:data.wave|0,mapName:typeof data.mapName==='string'?data.mapName.slice(0,60):MAP.name}; if(!data.survival) guestMapCleared(); else if(window.__survival) window.__survival.record(data.wave|0);   // build 176: Survival complete clears nothing, but the fifty waves go on this guest's own best
  if(data.survival&&MAPI===1&&window.__trimaw) atHallWave((data.wave|0)+MAP.wbase,()=>window.__trimaw.reward(true));   // co-op sweep 2026-10-02: Throne Room survival held -- the guest earns its own Trimaw, as 85-familiars' winMap wrap gives solo/host
  if(pay){ Meta.addGold(pay,'run'); Meta.save(); floatText(hero.x,hero.y+3.2,hero.z,'+'+Meta.fmtG(pay)+' ● gold — the hall is held','#ffd060'); }
  banner(data.survival?'SURVIVAL COMPLETE':'HALL HELD',MAP.name+(data.survival?' stands':' is yours')+(pay?'  ·  +'+pay+' ● gold':'')+'  ·  the host moves the party on when ready'); });   // the fanfare itself already played: guestWorldSfx hears the host's phase leave 'wave'   // MAP.name, never the host's text: banner() writes innerHTML (a guest is on the host's map, so it is the same name)
// build 159 (3/7): what the host's own Meta.onRunEnd pays (10-meta.js: 25 a wave, +150 for a map held), worked out from the very wave
// the host pays itself on -- the map's own count when the crystal falls (finishDeath), the CAMPAIGN wave when the map is held
// (winMap's effWave()). A guest used to work it out from the map's count both times, so holding the Throne Room paid the host 500
// and the guest 325, and the gap grew every map
function runPay(w,won){ w=w|0; return w>0?25*w+(won?150:0):0; }
{ const origFinishDeath=finishDeath;
  finishDeath=function(){ origFinishDeath(); if(role==='host'){ send('runEnd',{phase:'dead',wave:S.wave,pay:runPay(S.wave,false),survival:!!SURVIVAL}); parkHost(); } }; }
// build 160: the last wave held opens the victory lap (game.js winMap) -- the guests get it and the map's pay at once ('mapHeld'), and
// the host stays on the matchmaking server: the run isn't over, and a friend may still walk in to see the hall. The run ends at the
// host's MOVE ON (moveOn): 'runEnd' (held:true -- the pay already went out) and parkHost go from there now, as they went from winMap
{ const origWinMap=winMap;
  winMap=function(){ const was=S.held; origWinMap(); if(role==='host'&&!was&&S.held) send('mapHeld',{wave:S.wave,mapName:MAP.name,pay:runPay(effWave(),true),survival:!!SURVIVAL}); }; }
{ const origMoveOn=moveOn;
  moveOn=function(){ const was=S.phase; origMoveOn(); if(role==='host'&&was!=='won'&&S.phase==='won'){ send('runEnd',{phase:'won',held:true,wave:S.wave,mapName:MAP.name,pay:runPay(effWave(),true),survival:!!SURVIVAL}); parkHost(); } }; }

// starting a wave is the host's call alone -- a guest is visiting the host's hall, not running a second one next to
// it. startWave is a plain top-level function (game.js), so this reassigns the same binding every call site already
// looks up by name (the G key, the wave button, window.__dd.startWave) rather than touching game.js itself.
{ const origStartWave=startWave;
  startWave=function(){ if(role==='guest'){ toast((hostWorld&&hostWorld.held)||guestHeld?"The hall is held — the host moves the party on when they're ready":"Only the host can start the wave — you're helping defend their hall"); return; } origStartWave(); }; }   // build 160: on the host's victory lap the guest's horn reads ▶ MOVE ON, and MOVE ON is the host's call too

{ const prevH=Meta.hud; Meta.hud=()=>{ prevH();
  if(role==='guest'&&hostWorld){ const w=hostWorld; guestWorldSfx(w);
    $('cbar').style.width=Math.max(0,w.crystal/w.crystalMax*100)+'%';
    if(w.phase==='wave'){ $('wavet').textContent=(w.survival?'SURVIVAL · WAVE ':'WAVE ')+w.wave+' / '+w.waveTotal; $('phaset').textContent=Number.isFinite(w.left)?w.left+' enem'+(w.left===1?'y':'ies')+' left':'Helping defend the hall'; }   // build 503: the host's count, as the host sees it   // build 176: the host's Survival run reads as one here too (waveTotal is its fifty)
    else if(w.phase==='build'&&w.held){ $('wavet').textContent=w.survival?'SURVIVAL COMPLETE — '+w.mapName+' STANDS':'HALL HELD — '+w.mapName+' CLEARED'; $('phaset').textContent='The hall is yours to roam — the host moves the party on when ready'; }   // build 160: the host's victory lap
    else if(w.phase==='build'){ $('wavet').textContent=w.wave?'HALL HELD — BUILD PHASE':'BUILD PHASE'; $('phaset').textContent='Only the host can start the next wave'; }
    else if(w.phase==='won'){ $('wavet').textContent='HALL HELD — '+w.mapName+' CLEARED'; $('phaset').textContent=''; }
    else if(w.phase==='dead'){ $('wavet').textContent='THE HEARTROOT FELL'; $('phaset').textContent=''; }
    { const b=$('wavebtn'), want=w.held?'▶ MOVE ON':'📯 START WAVE'; if(b&&b.textContent!==want) b.textContent=want; }   // build 160: the host's lap is this page's lap (game.js's own label only knows this page's S.held, never set on a guest)
    { const hc=[...conns.values()][0]; if(hc&&(w.phase==='build'||w.phase==='wave')){ if(hc.__hidden) $('phaset').textContent="The host's game is in the background"; else if(hc.__paused) $('phaset').textContent='The host paused the game'; } }   // build 159 (2/7): the heartbeat's own flags (the host says so the moment its tab hides) -- why no horn is coming. The hall itself runs on (the keeper), except on a phone host, which the browser stops outright; 'paused' only ever shows with COOP_HALL_RUNS off
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
// build 375 (Matt: a guest "sees wooden doll for pig bosses"): the bosses and a few other kinds load their models only when the HOST's game spawns one (each module's own spawnEnemy wrapper), so on a guest makeMob(kind) fell back to the plain wooden mannequin and stayed one. A guest now asks for the model the first time it sees such a kind, and a puppet built as the stand-in is rebuilt the moment the model lands (mobPuppetsTick)
const KIND_LOAD={ pigflail:()=>window.__pigbosses&&window.__pigbosses.ensure(), pigdagger:()=>window.__pigbosses&&window.__pigbosses.ensure(), pigsling:()=>window.__pigbosses&&window.__pigbosses.ensure(),
  cyclops:()=>window.__cyclops&&window.__cyclops.ensure(), wraith:()=>window.__wraith&&window.__wraith.load(), moth:()=>window.__moth&&window.__moth.load(), archhag:()=>window.__archhag&&window.__archhag.ensure&&window.__archhag.ensure(), stickman:()=>window.__archhag&&window.__archhag.ensure&&window.__archhag.ensure(), direwolf:()=>window.__direwolf&&window.__direwolf.load&&window.__direwolf.load(),
  corruptor:()=>window.__corruptor&&window.__corruptor.load(), kegcart:()=>window.__carts&&window.__carts.load('kegcart'), topiary:()=>{ const A=window.__archhag; if(A){ if(A.ensure) A.ensure(); if(A.ensureTopi) A.ensureTopi(); } }, firecart:()=>window.__carts&&window.__carts.load('firecart'), avery:()=>window.__avery&&window.__avery.load&&window.__avery.load() };   /* build 504: Avery too (95u-avery.js) */
const KIND_ASKED=new Set();
const loaderOf=kind=>KIND_LOAD[kind]||(/^topiary-/.test(kind)?KIND_LOAD.topiary:null);   // the Archhag's animated topiaries: a stand-in made from the court's own garden figures (95f-archhag.js ensureTopiKinds), Bob's rig when it lands
function askKindModel(kind){ const f=loaderOf(kind); if(MOBGLB[kind]||KIND_ASKED.has(kind)||!f) return; KIND_ASKED.add(kind); try{ f(); }catch(e){ console.warn('mob model '+kind,e); } }
function mobPuppetAdd(id,kind){
  askKindModel(kind);
  const m=makeMob(kind); scene.add(m.g);
  const p={kind,mdl:m,sc0:m.g.scale.x,gf:1,gfNow:1,x:0,y:0,z:0,yaw:0,tx:0,ty:0,tz:0,tyaw:0,walking:false,ph:0,ref:MOBGLB[kind]||null,stand:!MOBGLB[kind]&&!!loaderOf(kind)};
  MOBPUP.set(id,p); return p;
}
function mobPuppetRemove(id){ const p=MOBPUP.get(id); if(!p) return; scene.remove(p.mdl.g); MOBPUP.delete(id); }   // no manual geometry/material dispose: makeMob's rigs are built the same way spawnEnemy's are, and the game's own enemy despawn (updateEnemies) never disposes them either -- they're shared/cached per kind, not per-instance
let mobHitFeedback=0;   // how many times a guest's own screen has shown "something just hit this" -- a test hook, not gameplay state
// build 150 ("guest bat not fighting at all"): a guest's pet aims at the host's mobs through these proxies of the mob puppets
// (30-familiar.js famFoes), stable per id so a chain-lightning hit list keeps working; a hit on one goes to the host as famHit
const MOBPROX=new Map(); const PROX_SIZE={ogre:[.95,2.3],trollboss:[.8,2.1],orc:[.6,1.6],archer:[.5,1.4],drake:[.6,1.2]};
function mobProxies(){ if(role!=='guest') return enemies; const out=[]; MOBPUP.forEach((p,id)=>{ let q=MOBPROX.get(id); if(!q){ const sz=PROX_SIZE[p.kind]||[.5,1.3]; q={puppet:true,__coopId:id,kind:p.kind,r:sz[0],h:sz[1],dead:0,slowT:0,fly:p.kind==='drake'}; MOBPROX.set(id,q); } q.x=p.x; q.y=p.y; q.z=p.z; q.hp=p.hp; q.max=p.max||p.maxSeen||p.hp; q.squash=p.squash||0; q.dead=(p.hp<=0)?1:0; if(!q.dead) out.push(q); }); MOBPROX.forEach((q,id)=>{ if(!MOBPUP.has(id)) MOBPROX.delete(id); }); return out; }   // squash (build 159, 5/7): "just hit", as hurt() marks a real mob -- Old Lamplight's pet fires at whatever is being hit (97-mythics.js), and on a guest nothing ever was
onMessage('famHit',(data,fromId)=>{ if(role!=='host'||!data) return; const e=enemies.find(e=>e.__coopId===data.id&&!e.dead); if(!e) return; const dmg=Math.max(0,Math.min(400,+data.dmg||0)); if(dmg>0) hurt(e,dmg,+data.kx||0,+data.kz||0);   // a guest's pet lands on the host's REAL mob, as guestHitCone and hostGuestShot do for the guest's own blows
  // build 159 (5/7): and what the pet's hit does besides (famHurt's ex): the Moss Sprite's spores slow it, the Fire Imp sets it burning --
  // this page's own burnUpdate (85-familiars.js) ticks the burn from here, as for the host's own Imp. Capped at a little over the
  // pets' own numbers (2.2 s of slow, 3 s of burn), so a doctored page can't freeze or cook a mob for good
  if(e.dead) return; const sl=+data.slow, bu=+data.burn;
  if(sl>0) e.slowT=Math.max(e.slowT||0,Math.min(5,sl));
  if(bu>0){ e.burnT=Math.min(5,bu); e.burnDmg=Math.max(0,Math.min(50,+data.burnDmg||0)); e.burnTick=e.burnTick||0; }
  // co-op sweep 2026-10-02: the Trimaw's venom head poisons and every head marks (+25%), as its hits do for the host's own pet (85-familiars.js trimawFire)
  const po=+data.poison, mk=+data.mark; if(po>0){ e.poisonT=Math.min(5,po); e.poisonDmg=Math.max(0,Math.min(50,+data.poisonDmg||0)); } if(mk>0) e.markT=Math.min(4,mk); });
window.__mobsync={ each:fn=>MOBPUP.forEach((p,id)=>fn(p,id)),   /* build 504: a module can drive its own kind's puppets (95u-avery.js: Avery's layered flight) */ foes:mobProxies, list:()=>[...MOBPUP.keys()], get:id=>{ const p=MOBPUP.get(id); if(!p) return null; return {id,kind:p.kind,scale:p.mdl&&p.sc0?+(p.mdl.g.scale.x/p.sc0).toFixed(2):1,wing:(p.mdl&&p.mdl.parts&&p.mdl.parts.wingL)?+p.mdl.parts.wingL.rotation.z.toFixed(3):null,glb:!!(p.mdl&&p.mdl.glb),stand:!!p.stand,max:p.max||0,x:+p.x.toFixed(2),y:+p.y.toFixed(2),z:+p.z.toFixed(2),yaw:+p.yaw.toFixed(2),walking:p.walking,hp:p.hp}; }, hitFeedback:()=>mobHitFeedback,
  unpack:d=>unpackMobs(d) };   // build 159 (6/7), a test hook: a packed 'mobs' message back into the old list (coop-tests-test.mjs)
function mobPuppetsTick(dt){
  MOBPUP.forEach(p=>{ if(MOBGLB[p.kind]&&MOBGLB[p.kind]!==p.ref&&loaderOf(p.kind)){ scene.remove(p.mdl.g); p.mdl=makeMob(p.kind); scene.add(p.mdl.g); p.sc0=p.mdl.g.scale.x; p.ref=MOBGLB[p.kind]; p.stand=false; }   /* the real model has landed (or replaced a stand-in: Bob's topiary rigs, the stickman's rig): out with the mannequin */
    const k=1-Math.exp(-10*dt); const m=p.mdl; if(p.squash>0) p.squash=Math.max(0,p.squash-dt*7);   // hurt()'s own fade (game.js updateEnemies)
    p.x=lerp(p.x,p.tx,k); p.y=lerp(p.y,p.ty,k); p.z=lerp(p.z,p.tz,k); p.yaw=angLerp(p.yaw,p.tyaw,k);
    if(m.glb){ const A=m.actions; const name=p.walking?(A.walk?'walk':(A.run?'run':null)):'idle'; if(name&&A[name]) mobPlay(m,name,{fade:.15}); m.mixer.update(dt); }
    else { p.ph+=dt*(p.walking?9:0); const w=p.walking?1:0;
      if(m.legs){ m.legs[0].rotation.x=Math.sin(p.ph)*.8*w; m.legs[1].rotation.x=-Math.sin(p.ph)*.8*w; }
      if(m.arms){ m.arms[0].rotation.x=-Math.sin(p.ph)*.6*w; m.arms[1].rotation.x=Math.sin(p.ph)*.6*w; } }
    m.g.position.set(p.x,p.y,p.z); m.g.rotation.y=p.yaw;
    p.gfNow+=((p.gf||1)-p.gfNow)*Math.min(1,dt*6); if(Math.abs(p.gfNow-1)>.002) m.g.scale.setScalar(p.sc0*p.gfNow);   /* build 376: the Archhag's GROW (95f-archhag.js): a grown mob is twice the size on a guest's screen too */
    if(m.parts){ const ph=p.ph0===undefined?(p.ph0=Math.random()*6.28):p.ph0, P=m.parts, f=Math.sin(S.t*7+ph)*.55; m.g.rotation.z=Math.sin(S.t*2.2+ph)*.07; m.g.rotation.x=p.walking?-.12:0; if(P.wingL) P.wingL.rotation.z=f; if(P.wingR) P.wingR.rotation.z=-f; if(P.tail) P.tail.rotation.y=Math.sin(S.t*2.6+ph)*.25; }   /* build 376: a drake's wingbeats, tail sway and lean on a guest's screen too (game.js updateEnemies does them for the host's real mobs) */ });
}
let nextEnemyId=1, syncTE=0;
const diedQ=[];   // build 147: mobs killed on the host since its last enemies list -- filled the moment kill() runs, not by scanning `enemies` at broadcast time (a mob killed and removed between two slow frames was never reported, and the guest never heard it die)
{ const prevKill=kill; kill=function(e){ const was=e&&e.dead; const r=prevKill.apply(this,arguments); if(role==='host'&&e&&!was&&e.dead){ if(!e.__coopId) e.__coopId='e'+(nextEnemyId++); diedQ.push({id:e.__coopId,kind:e.kind});
    if(e.kind==='cyclops'){ const B=window.__cyclops&&Number.isFinite(window.__cyclops.bonus)?window.__cyclops.bonus:800; guestMana.forEach((v,id)=>guestMana.set(id,Math.round((v+B)*10)/10)); send('cycFall',{ew:effWave(),b:B}); } } return r; }; }   // co-op sweep 2026-10-02: the Cyclops's +800 goes in every guest's own pool too (95c pays only S.mana, the host's), and each guest earns its own Gladehart ('cycFall', below)
// ---- build 159 (6/7): the mob list at a third of the size. At the campaign's last wave (161 alive) the list was ~14 KB, 12 times a
// second, to EVERY guest -- ~170 KB/s of the host's upload per guest at that peak, and most of it the same key names and the same
// kind names 161 times over. 'mobs' carries the very same numbers, rounded exactly as before, as rows -- [id, kind, x, y, z, yaw,
// walking, hp] -- with each kind named once per message (k) and an id 'e123' sent as 123: about 5 KB for those 161. A guest unpacks it
// into the old list (unpackMobs), so everything after that is untouched. A guest says it reads it (mz on its input); to one that
// hasn't said so yet, or never will (an older build -- mixed builds may play together, the lobby only marks them), the host still
// sends the old 'enemies' list, and this build still reads that one too: any two builds keep seeing each other's mobs.
const MOBS_V=1, DIED_KEEP=100;
function packMobs(live){ const k=[], ki=new Map();
  return {k,l:live.map(e=>{ let n=ki.get(e.kind); if(n===undefined){ n=k.length; k.push(e.kind); ki.set(e.kind,n); } const m=/^e([1-9]\d{0,14})$/.exec(e.__coopId);
    const row=[m?+m[1]:e.__coopId,n,+e.x.toFixed(2),+e.y.toFixed(2),+e.z.toFixed(2),+e.yaw.toFixed(2),e.walking?1:0,+e.hp.toFixed(1)]; const gf=(e.gBase&&e.gBase.sc)?+(e.sc/e.gBase.sc).toFixed(2):1; if(e.max>=250||gf!==1) row.push(e.max>=250?Math.round(e.max):0); if(gf!==1) row.push(gf); return row; })}; }   // build 376: and how much bigger the Archhag's GROW has made it (1 = not at all), so a guest's puppet grows too   // build 375: a big mob (a boss, a cart) also says its full health, for a guest's boss bar   // an id that isn't 'e<n>' (a test names its own) goes as the string itself
function unpackMobs(d){ const k=Array.isArray(d&&d.k)?d.k:[];
  return (Array.isArray(d&&d.l)?d.l:[]).filter(Array.isArray).map(r=>({id:typeof r[0]==='number'?'e'+r[0]:String(r[0]),kind:k[r[1]],x:+r[2]||0,y:+r[3]||0,z:+r[4]||0,yaw:+r[5]||0,walking:!!r[6],hp:+r[7]||0,max:+r[8]||0,gf:+r[9]||1})); }
function hostBroadcastEnemies(dt){
  if(role==='host'&&!conns.size) diedQ.length=0;   // build 159 (P6): hosting alone (a START with nobody in yet, or everyone gone) there's no one to tell -- the queue used to grow all run and land on the first joiner in one lump
  if(role!=='host'||!conns.size) return;
  syncTE+=dt; if(syncTE<1/12) return; syncTE=0;
  const live=enemies.filter(e=>!e.dead); live.forEach(e=>{ if(!e.__coopId) e.__coopId='e'+(nextEnemyId++); });
  const died=diedQ.splice(0);   // build 147: every mob killed since the last list (queued by the kill wrapper below at the moment it happens, so a slow frame can never miss one), for the guest's death sound; one that leaves the list without dying reached the crystal
  let rows=null, list=null;   // each made once, and only if some guest takes it
  conns.forEach((c,id)=>{ if(!c.open) return;
    if(snapBusy(c)){ if(died.length) c.__died=(c.__died||[]).concat(died).slice(-DIED_KEEP); return; }   // a busy link skips this list (sendSnap above) -- but the deaths in it are news, not state: they wait for its next one
    const dd=c.__died?c.__died.concat(died):died; c.__died=null;
    const g=guestIn.get(id);
    if(g&&g.mz===MOBS_V){ if(!rows) rows=packMobs(live); c.send(JSON.stringify({type:'mobs',data:{k:rows.k,l:rows.l,died:dd}})); }
    else { if(!list) list=live.map(e=>({id:e.__coopId,kind:e.kind,x:+e.x.toFixed(2),y:+e.y.toFixed(2),z:+e.z.toFixed(2),yaw:+e.yaw.toFixed(2),walking:!!e.walking,hp:+e.hp.toFixed(1),max:e.max>=250?Math.round(e.max):0,gf:(e.gBase&&e.gBase.sc)?+(e.sc/e.gBase.sc).toFixed(2):1}));   // y matters for flyers (drake etc, spawned at e.fly's altitude) -- without it they'd render as if grounded; hp is new (see below)
      c.send(JSON.stringify({type:'enemies',data:{list,died:dd}})); } });
}
// hp above is new: real hits (guestHitCone, hostGuestShot's bolts/arrows) already land on the host's REAL enemies --
// the damage was never fake -- but nothing ever told a GUEST's screen that anything happened. hurt() (game.js)
// spawns its floatText/SFX.hit purely on the HOST's own local scene; a guest's puppet enemy just sat there
// unchanged until it eventually vanished from the roster, dead. A real player testing this read it exactly right:
// "basically cosmetic" -- their swing landed, for real, but they had zero way to see or hear that it did. Comparing
// each puppet's previously-known hp against what just arrived reconstructs "something hit this" without any new
// message type or per-swing attribution back to a specific guest -- same floatText/SFX.hit every local hit already uses.
onMessage('enemies',data=>applyMobs(data.list,data.died));   // the old list: an older host, or this build's host before this guest's first input
onMessage('mobs',data=>applyMobs(unpackMobs(data),data&&data.died));   // build 159 (6/7): the same list, packed (packMobs above)
function applyMobs(list,died){
  const ids=new Set();
  list.forEach(e=>{ ids.add(e.id);
    let p=MOBPUP.get(e.id);
    if(!p){ p=mobPuppetAdd(e.id,e.kind); if(/^topiary-/.test(e.kind)&&window.__archhag&&window.__archhag.guestWake) window.__archhag.guestWake(e.x,e.z); p.x=p.tx=e.x; p.y=p.ty=e.y; p.z=p.tz=e.z; p.yaw=p.tyaw=e.yaw; p.hp=e.hp; p.kind=e.kind; }   // snap on first sight, no popping in from the origin, and no false "hit" flash for however damaged it already was
    else if(e.hp<p.hp-.05){ floatText(p.x,p.y+1.5,p.z,String(Math.round((p.hp-e.hp)*10)/10),'#ffd060'); SFX.hit(); mobHitFeedback++; p.squash=1; }   // squash: see mobProxies
    p.tx=e.x; p.ty=e.y; p.tz=e.z; p.tyaw=e.yaw; p.walking=e.walking; p.hp=e.hp; if(e.max) p.max=e.max; p.gf=e.gf||1; p.maxSeen=Math.max(p.maxSeen||0,e.hp); });
  (Array.isArray(died)?died:[]).forEach(d=>{ const now=performance.now(); if(now-GSFX.dieT>80){ GSFX.dieT=now; if((d.kind==='ogre'||d.kind==='trollboss')&&SFX.bigDie) SFX.bigDie(); else SFX.die(); } GSFX.die++; });   // build 147: the death sound for each mob the host says died since its last list (throttled to one every 80 ms so a splash kill is a thud, not a drumroll)
  [...MOBPUP.keys()].forEach(id=>{ if(!ids.has(id)) mobPuppetRemove(id); });   // a dead or despawned enemy just stops being in the list -- same roster-diff removal 99-network.js already uses for heroes
}

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
  const pup={kind,lvl,mdl:m}; DEFPUP.set(id,pup);
  if(kind==='perch'&&window.__perch&&role==='guest'){ pup.railboxes=window.__perch.boxesFor(x,z,rot,y); for(const b of pup.railboxes) RAILBOXES.push(b); }   // build 376: the Archer's Perch's footholds, so a guest can climb it (96b-perch.js)
}
// the cage's show on a guest (build 148): the host cues charge / calm / implode over the wire (Meta.onDefFx), the guest runs
// the same cageAnim on its puppet and plays the implosion sound; the damage itself stays the host's, as for every defense
{ const prev=Meta.onDefFx; Meta.onDefFx=function(d,fx,arg){ prev(d,fx,arg); if(role!=='host'||!d) return; if(!d.__coopId) d.__coopId='d'+(nextDefId++); send('fx',{id:d.__coopId,fx,arg}); }; }
onMessage('fx',data=>{ const p=DEFPUP.get(data.id); if(!p||p.kind!=='slice') return; const fx=p.fx||(p.fx=cageState());
  if(data.fx==='charge'){ fx.phase='charge'; fx.t=0; fx.k=0; fx.dur=+data.arg||2; } else if(data.fx==='calm'){ fx.phase='rest'; fx.t=0; } else if(data.fx==='implode'){ fx.phase='boom'; fx.t=0; fx.k=1; fx.cloud=DEFS.slice.cloud; SFX.implode(); } });
// co-op sweep 2026-10-02: the full-set rune ring the host draws under a tower (93-gearsets.js defRingUpdate), on its puppet here -- added, recoloured or dropped as the list says, and hung again on a rebuilt model
const PUP_RING_GEO=new THREE.RingGeometry(.7,.92,28);
function defPupLong(p,lg){ p.lg=lg?1:0; const s=p.mdl&&p.mdl.userData.stretch; if(s) s.scale.x=HEDGE_STRETCH*(p.lg?1.6:1); }   // co-op sweep 2026-10-02: a Long Hedge (96l-talents.js LONG_K) stands its real length here
function defPupRing(p,rc){ rc=rc|0; if(p.ring&&(p.ringCol!==rc||p.ring.parent!==p.mdl)){ if(p.ring.parent) p.ring.parent.remove(p.ring); p.ring.material.dispose(); p.ring=null; } p.ringCol=rc;
  if(rc&&!p.ring){ const rad=Math.max(1.15,((DEFS[p.kind]||{}).top||1.5)*.75); const m=new THREE.Mesh(PUP_RING_GEO,new THREE.MeshBasicMaterial({color:rc,transparent:true,opacity:.5,side:THREE.DoubleSide,depthWrite:false,blending:THREE.AdditiveBlending})); m.rotation.x=-PI/2; m.position.y=.07; m.scale.set(rad,rad,1); m.userData.noOL=true; p.mdl.add(m); p.ring=m; } }
function defPuppetsTick(dt){ if(role!=='guest') return; DEFPUP.forEach(p=>{ if(p.ring) p.ring.material.opacity=.35+.2*Math.sin(S.t*2.4+(p.x||0)+(p.z||0)); towerChevrons(p,p.mdl,p.kind,p.lvl);   /* build 177: a guest sees the host's Mark V+ chevrons too -- the defs list already carries lvl, and they ride p.mdl, so a mark-up's rebuilt model (onMessage('defs') below) just gets them hung again */
  if(p.kind!=='slice') return; const fx=p.fx||(p.fx=cageState()); fx.t+=dt;
  if(fx.phase==='charge'){ fx.k=Math.min(1,fx.t/fx.dur); if(fx.t>fx.dur+1){ fx.phase='rest'; fx.t=0; } } else if(fx.phase==='boom'){ if(fx.t>=.45){ fx.phase='rest'; fx.t=0; fx.k=0; } } else if(fx.t>fx.next){ fx.t=0; fx.next=R(3,7); fx.flex=.5; }
  if(fx.cloud>0) fx.cloud-=dt; cageAnim(p.mdl,fx,dt,fx.phase==='rest'?0:1); }); }
function defPuppetRemove(id){ const p=DEFPUP.get(id); if(!p) return; scene.remove(p.mdl); if(p.railboxes) for(const b of p.railboxes){ const i=RAILBOXES.indexOf(b); if(i>=0) RAILBOXES.splice(i,1); } DEFPUP.delete(id); }   // no manual dispose, same reasoning as mob puppets: the real defs array's own removeDef never disposes either
// build 499 (Matt, playing with Jacob: "when he walks up to a tower it doesn't say on bottom which one he's targeting, so he has a hard time upgrading the right defense"): a guest's E is the host's pickDef
// (game.js) run at the guest's own spot and facing -- the guest's screen now runs the SAME pick over the towers it sees, rings the one E will act on (gold: upgrade, green: repair) and shows its card (60-lootfeel.js)
function guestPick(){ if(role!=='guest'||!hero) return null; const fx=Math.sin(hero.yaw||0), fz=Math.cos(hero.yaw||0); let best=null, bs=1e9;
  DEFPUP.forEach((p,id)=>{ if(p.x===undefined) return; const dx=p.x-hero.x, dz=p.z-hero.z, dist=Math.hypot(dx,dz); if(dist>=3.4) return; const facing=dist>.05?(1-(dx*fx+dz*fz)/dist):1; const hurt=p.max&&p.hp<p.max;
    const sc=(hurt?0:10)+facing*1.6+dist*.35; if(sc<bs){ bs=sc; best={ id, kind:p.kind, lvl:p.lvl, hp:p.hp, max:p.max, kills:p.kills|0, spent:p.spent|0, x:p.x, y:p.y, z:p.z }; } }); return best; }
let gRing=null;
function guestRing(p){ if(!p){ if(gRing) gRing.visible=false; return; } if(!gRing){ gRing=new THREE.Mesh(new THREE.RingGeometry(.82,1,40),new THREE.MeshBasicMaterial({color:0xe8b94a,transparent:true,opacity:.6,side:THREE.DoubleSide,depthWrite:false,blending:THREE.AdditiveBlending})); gRing.rotation.x=-PI/2; gRing.userData.noOL=true; scene.add(gRing); }
  const hurt=p.max&&p.hp<p.max; gRing.visible=true; gRing.material.color.setHex(hurt?0x5ef0a0:0xe8b94a); gRing.scale.setScalar(1.25); gRing.position.set(p.x,(p.y||0)+.06,p.z); gRing.material.opacity=.45+.25*Math.sin(S.t*6); }
// build 501: the HOST builds each guest's tower card -- pickDef at the guest's own spot and facing (as its E uses), the card from 60-lootfeel.js with the guest's own mana -- and sends it four times a second
// when it changes (and once a second regardless); the guest shows it and rings that very tower. Every number is the host's (tower owner's stats, auras, talents, mythics nearby).
const DCARD={ last:new Map(), t:0, got:null };
function hostSendCards(dt){ if(role!=='host'||!conns.size||!window.__cardHtml) return; DCARD.t+=dt; if(DCARD.t<.25) return; DCARD.t=0; const now=performance.now();
  conns.forEach((c,id)=>{ const g=guestHero.get(id); let msg={ none:1 };
    if(g&&!(g.dead>0)&&(S.phase==='build'||S.phase==='wave')){ const d=pickDef({ x:g.x, z:g.z, yaw:g.yaw }); if(d){ const m=guestMana.has(id)?guestMana.get(id):S.mana; const cd=window.__cardHtml(d,m); msg={ key:cd.key, html:cd.html, x:+d.x.toFixed(2), y:+(d.base||0).toFixed(2), z:+d.z.toFixed(2), hurt:d.hp<d.max?1:0, r:d.kind==='slice'?+(stat(d,'range')*.55).toFixed(2):1.25 }; } }
    const was=DCARD.last.get(id); const k=msg.none?'none':msg.key+'@'+msg.x+','+msg.z; if(was&&was.k===k&&now-was.at<1000) return; DCARD.last.set(id,{ k, at:now }); send('dcard',msg,id); }); }
onMessage('dcard',data=>{ if(role!=='guest'||!data) return; DCARD.got=data.none?null:Object.assign({ at:performance.now() },data); });
const guestCardNow=()=>{ const c=DCARD.got; return c&&performance.now()-c.at<2500?c:null; };
{ const prev=Meta.update; Meta.update=dt=>{ prev(dt); hostSendCards(dt); if(role!=='guest'){ if(gRing) gRing.visible=false; return; }
    const live=(S.phase==='build'||S.phase==='wave')&&!placing; const c=live&&guestCardNow(); if(c){ guestRing({ x:c.x, y:c.y, z:c.z, hp:c.hurt?0:1, max:1 }); if(gRing) gRing.scale.setScalar(c.r||1.25); } else guestRing(live?guestPick():null); }; }
window.__defsync={ card:()=>guestCardNow(), pick:guestPick, list:()=>[...DEFPUP.keys()], get:id=>{ const p=DEFPUP.get(id); if(!p) return null; return {id,kind:p.kind,lvl:p.lvl,chev:p.chev&&p.chev.parent===p.mdl?p.chev.userData.n:0,ring:p.ring&&p.ring.parent===p.mdl?p.ringCol:0,lg:p.lg|0,stretch:p.mdl.userData.stretch?+p.mdl.userData.stretch.scale.x.toFixed(3):null,x:+p.mdl.position.x.toFixed(2),y:+p.mdl.position.y.toFixed(2),z:+p.mdl.position.z.toFixed(2)}; } };
// ---- build 376 (Matt: "he cannot see projectiles from ballistas"): a tower's shot was a host-only object -- fire() (game.js) pushes it into the host's own `projs`, and a guest's screen only ever showed the read-only tower. The host now says each shot it fires (a ballista's bolt, an acorn cannon's three acorns, a trebuchet's turnip: where it starts and how it flies), and a guest flies the same projectile on its own screen, drawn and moving as the host's (updateProj), with no damage (its `enemies` are empty; the host's shot already hurt the real mobs). The hit sound/splash of a turnip ride along for free
const SHOT_KINDS={harpoon:1,acorn:1,turnip:1,arrow:1}; let shotsSent=0, shotsSeen=0;
function sendShots(from,d){ if(role!=='host'||!conns.size) return; for(let i=from;i<projs.length;i++){ const p=projs[i]; if(!p||!SHOT_KINDS[p.kind]) continue; const f=v=>+(+v||0).toFixed(3);
    if(p.kind==='arrow') send('tshot',{ k:'arrow', x0:f(p.x0), y0:f(p.y0), z0:f(p.z0), x1:f(p.x1), y1:f(p.y1), z1:f(p.z1), dur:f(p.dur), g:p.splash?1:0 });   // a mob's arrow or a bomb (the bandits, the troll, the Sling boss)
    else send('tshot',{ k:p.kind, x:f(p.x), y:f(p.y), z:f(p.z), fx:f(p.fx), fz:f(p.fz), vx:f(p.vx), vy:f(p.vy), vz:f(p.vz), spd:f(p.spd), life:f(p.life), splash:f(p.splash), yaw:f(d&&d.yaw), pt:f(d&&d.pitch) }); shotsSent++; } }
{ const prevFire=fire; fire=function(d,e){ const n=projs.length; const r=prevFire.apply(this,arguments); sendShots(n,d); return r; }; }
{ const prevArrow=fireArrow; fireArrow=function(e,x,y,z,hit){ const n=projs.length; const r=prevArrow.apply(this,arguments); sendShots(n,null); return r; }; }
onMessage('tshot',data=>{ if(role!=='guest'||!data||!SHOT_KINDS[data.k]) return; shotsSeen++; let m;
  if(data.k==='harpoon'){ m=harpoonMesh(); m.rotation.set(-(data.pt||0),data.yaw||0,0,'YXZ'); scene.add(m); m.position.set(data.x,data.y,data.z); projs.push({kind:'harpoon',x:data.x,y:data.y,z:data.z,fx:data.fx,fz:data.fz,vy:data.vy,spd:data.spd||26,life:data.life||1,hit:new Set(),dmg:0,mesh:m,cosmetic:true}); SFX.harpoon(); }
  else if(data.k==='acorn'){ m=acornMesh(); scene.add(m); m.position.set(data.x,data.y,data.z); projs.push({kind:'acorn',x:data.x,y:data.y,z:data.z,vx:data.vx,vy:data.vy,vz:data.vz,life:data.life||1.3,bounces:0,dmg:0,mesh:m,cosmetic:true}); SFX.acorn(); }
  else if(data.k==='arrow'){ m=data.g?grenadeMesh():arrowMesh(); scene.add(m); m.position.set(data.x0,data.y0,data.z0); projs.push({kind:'arrow',x0:data.x0,y0:data.y0,z0:data.z0,x1:data.x1,y1:data.y1,z1:data.z1,t:0,dur:Math.max(.2,data.dur||.5),dmg:0,hit:{kind:'none'},mesh:m,splash:0,owner:null,cosmetic:true}); }   // flies its arc and stops: it hurts nothing here (hit.kind 'none', no splash) -- the host's own shot already did
  else { m=turnipMesh(); scene.add(m); m.position.set(data.x,data.y,data.z); projs.push({kind:'turnip',x:data.x,y:data.y,z:data.z,vx:data.vx,vy:data.vy,vz:data.vz,life:data.life||1.5,dmg:0,splash:data.splash||3,mesh:m,cosmetic:true}); SFX.ball(); } });
// the heroes' own shots: the host's, and every guest's (which the host flies for real, hostGuestShot). The host says each one the moment it leaves (82-staff.js / 83-bow.js call __shotEvent), to every guest but the one who fired it (that page already flew its own); a guest flies a copy that hurts nothing
window.__shotEvent=(w,kind,from,d,spd,opts)=>{ if(role!=='host'||!conns.size) return; const f=v=>+(+v||0).toFixed(3), msg=JSON.stringify({type:'hshot',data:{ w, kind, x:f(from.x), y:f(from.y), z:f(from.z), dx:f(d.x), dy:f(d.y), dz:f(d.z), spd:f(spd), life:f(opts&&opts.life), size:f(opts&&opts.size) }}); const own=opts&&opts.owner; conns.forEach((c,id)=>{ if(id===own||!c.open) return; c.send(msg); }); shotsSent++; };
onMessage('hshot',data=>{ if(role!=='guest'||!data||!window.__staff||!window.__bow) return; shotsSeen++; const from=new THREE.Vector3(+data.x||0,+data.y||0,+data.z||0), dir=new THREE.Vector3(+data.dx||0,+data.dy||0,+data.dz||1); if(!(dir.lengthSq()>1e-6)) return; const o={ dmg:0, life:Math.max(.1,Math.min(5,+data.life||1.2)), size:+data.size||0 };
  if(data.w==='bolt'){ window.__staff.fireBolt(String(data.kind||'hazel'),from,dir,Math.max(1,Math.min(80,+data.spd||22)),o); if(SFX.harpoon) SFX.harpoon(); } else window.__bow.fireArrow(String(data.kind||'ash'),from,dir,Math.max(1,Math.min(80,+data.spd||22)),o); });
window.__shotsync={ sent:()=>shotsSent, seen:()=>shotsSeen, cosmetic:()=>projs.filter(p=>p.cosmetic).length };
let nextDefId=1, syncTD=0;
function hostBroadcastDefs(dt){
  if(role!=='host'||!conns.size) return;
  syncTD+=dt; if(syncTD<.5) return; syncTD=0;   // static once placed -- 2Hz is plenty to catch a new one, an upgrade, or one destroyed
  const list=defs.map(d=>{ if(!d.__coopId) d.__coopId='d'+(nextDefId++);
    return {id:d.__coopId,kind:d.kind,lvl:d.lvl||1,x:+d.x.toFixed(2),y:+d.base.toFixed(2),z:+d.z.toFixed(2),rot:+d.rot.toFixed(2),hp:Math.ceil(d.hp),max:d.max,kills:d.kills|0,spent:Math.round(d.spent||0),rc:d.setRing?(d.setRingCol|0):0,lg:d.long?1:0}; });   /* co-op sweep 2026-10-02: rc = the full-set rune ring under it (93-gearsets.js), drawn on the guest's puppet too */   /* build 499: hp/max/kills/spent -- a guest's own tower card and pick (below) */
  sendSnap('defs',{list});
}
onMessage('defs',data=>{
  const ids=new Set();
  data.list.forEach(d=>{ ids.add(d.id);
    let p=DEFPUP.get(d.id); if(p){ p.hp=d.hp; p.max=d.max; p.kills=d.kills; p.spent=d.spent; p.x=d.x; p.y=d.y; p.z=d.z; }
    if(!p){ defPuppetAdd(d.id,d.kind,d.lvl,d.x,d.y,d.z,d.rot); const np=DEFPUP.get(d.id); if(np){ np.hp=d.hp; np.max=d.max; np.kills=d.kills; np.spent=d.spent; np.x=d.x; np.y=d.y; np.z=d.z; defPupRing(np,d.rc); defPupLong(np,d.lg); } if(GSFX.defsSeen){ SFX.place(); GSFX.place++; } return; }   // a defense set down since the last list: the placement sound (build 147), whoever placed it
    ensureDefMark(d.kind,d.lvl); ensureDefMark(d.kind,d.lvl+1); const T=defTemplate(d.kind,d.lvl);   // an upgrade on the host asks for that mark's model here too (and the next one up), as reskinDefs does for the host's own
    if(d.lvl>p.lvl){ SFX.place(); GSFX.upgrade++; }   // a mark up: the same sound the host hears for it (build 147)
    if(p.lvl!==d.lvl||(T&&p.mdl.userData.tpl!==T)){ scene.remove(p.mdl); p.mdl=makeDef(d.kind,false,d.lvl); p.mdl.position.set(d.x,d.y,d.z); p.mdl.rotation.y=d.rot; scene.add(p.mdl); p.lvl=d.lvl; }
    defPupRing(p,d.rc); if((p.lg|0)!==(d.lg?1:0)||d.lg) defPupLong(p,d.lg);   // a new mark, or its model just landed (the first build wore the mark below while it downloaded): the same test reskinDefs makes, caught on the host's next list, twice a second
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
  const surf=(window.__perch&&window.__perch.deckFor)?window.__perch.deckFor(kind,x,z):null;   // build 381: a ballista may stand on a free perch's deck or a Cloister hedge (96b-perch.js)
  if(!surf&&(!(t===T.FLOOR||t===T.CARPET)||cells.some(i=>!walk(grid[i])||MOBBLOCK[i]))) reason="Can't build there";
  else if(!surf&&cells.some(i=>defAt[i])) reason='Already occupied';
  else if(cells.includes(idx(wc(g.x),wcz(g.z)))||Math.hypot(x-g.x,z-g.z)<1.1) reason="You're standing there";   // the same self-overlap rule updateGhost (game.js) enforces locally, mirrored here against the guest's own HOST-tracked position
  else if(S.du+cfg.du>DU_CAP) reason='Not enough Defense Units';
  const realMana=S.mana; S.mana=guestMana.has(fromId)?guestMana.get(fromId):MAP_MANA;
  if(!reason&&S.mana<cfg.mana) reason='Not enough mana';
  else if(!reason&&enemies.some(e=>!e.dead&&Math.hypot(e.x-x,e.z-z)<2.2)) reason='Enemy too close';
  if(reason){ S.mana=realMana; send('toast',reason,fromId); return; }
  const d=placeDefAt(kind,x,z,yaw); if(d){ d.ownerId=fromId; d.ownerHero=Meta.defOwnerHero(fromId)||null; const st=seatOf.get(fromId); if(st) d.ownerSeat=st.seat; }   // stat() (game.js) reads this via Meta.defOwnerStat/Mult so the defense keeps ITS PLACER's buffs, not the host's own; the seat (build 159, 3/7) is how it finds its placer again after a rejoin (seatJoin)
  guestMana.set(fromId,S.mana); S.mana=realMana;
}
// co-op sweep 2026-10-02: a guest's hedge is as long as HIS Long Hedge says (96l-talents.js longOn reads this while the host places it), not the host's
{ const inner=hostTryPlaceDef; hostTryPlaceDef=function(kind,x,z,yaw,fromId){ if(role!=='host') return inner.apply(this,arguments); window.__placeLong=kind==='spike'&&Meta.defOwnerHero(fromId)==='knight'&&Meta.defOwnerTalent(fromId,'knight','klong')>0; try{ return inner.apply(this,arguments); }finally{ window.__placeLong=undefined; } }; }
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
  if(S.phase==='start'||S.phase==='dead'||S.phase==='won'||S.phase==='deathcut'){ send('toast','Not right now',fromId); return; }   // build 159 (3/7): the same end-of-run gate hostTryPlaceDef has always had -- a repair, upgrade or sell after the hall fell or held used to go through
  const pos={x:g.x,z:g.z,yaw:g.yaw};   // build 165: the guest's facing too -- game.js's pickDef takes a hurt tower first, then the one you face
  // build 159 (3/7), Matt's call: a guest sells only the defenses it built -- sell() takes whichever is nearest, so pressing X by a
  // friend's tower took it down and put 70% of what THEY paid in your own pool. The host may sell any (its hall), and repairing or
  // upgrading anyone's stays open to everyone: helping is fine
  if(data.action==='sell'){ const d=pickDef(pos); if(d&&d.ownerId!==fromId){ send('toast',"That's a teammate's defense — you can only sell the ones you built",fromId); return; } }
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
// ===== YOUR LOOT IS YOUR OWN (build 151): "that would have fixed a big problem of getting the first green set". Gear was one
// physical item on the host's floor that any player could grab (and a guest's grab went through lootGrant), so three
// players split one stream and the host lost pieces. Now every drop the host's hall makes -- a mob's, the held wave's --
// is rolled ONCE PER PLAYER: the host's own lands on its floor as ever, and each guest is told the roll's terms
// (rarity floor, slot, level, where) and rolls its own with its own rules (its own Forest pity, its own set chances) onto
// its own page, where it alone can walk over it. Loot is never shown to anyone else; mana orbs stay shared.
let LASTROLL=null;
{ const prev=rollItem; rollItem=function(minR,slot,lvl){ const it=prev(minR,slot,lvl); LASTROLL={it,args:[minR,slot,lvl]}; return it; }; }
// co-op sweep 2026-10-02: the held wave's reward is marked (rw) so a guest rolls it through waveRewardItem too -- the Throne Room's wave-7 mythic set piece (97b-setgate.js) is on the guest's own
// roll as well as the host's. This wrap loads after 97b, so it sees the final item. An item flagged __noRelay (the dire wolf's Ice piece, rolled per guest by 95g) is not relayed as a plain one
let LASTRW=null;
{ const prev=waveRewardItem; waveRewardItem=function(){ const it=prev.apply(this,arguments); LASTRW=it; return it; }; }
{ const prev=dropLoot; dropLoot=function(it,x,z,gentle){ const l=prev(it,x,z,gentle); if(role==='host'&&conns.size&&LASTROLL&&LASTROLL.it===it&&!(it&&it.__noRelay)){ const a=LASTROLL.args, rw=LASTRW===it?1:0; if(rw) LASTRW=null; send('lootDrop',{minR:a[0]|0,slot:a[1]||null,lvl:Number.isFinite(+a[2])?+a[2]:null,ew:effWave(),x:+(+x).toFixed(2),z:+(+z).toFixed(2),gentle:!!gentle,rw}); } return l; }; }   // only an item that came straight from rollItem is relayed: the Forest guarantee's set pieces (already personal, 93-gearsets.js) and take-backs are not. ew (build 159, 3/7): the hall's wave, which the guest rolls at
// the guest's roll runs at the hall's wave (atHallWave, above): the level, the rarity odds (epic from wave 3, legendary from 6), the
// Void and Forest chances (93-gearsets.js) and a mythic's stats (87-mythicdrops.js rolls them on the item's own level) all come out
// as the host's own roll would -- only the dice are this guest's, and its own rules (Forest pity, its own 7% mythic)
onMessage('lootDrop',d=>{ if(role!=='guest'||!d) return; atHallWave(d.ew,()=>{ const it=d.rw?waveRewardItem():rollItem(Math.max(0,Math.min(4,d.minR|0)),d.slot||undefined,d.lvl||undefined); dropLoot(it,+d.x||0,+d.z||0,!!d.gentle); }); });
// co-op sweep 2026-10-02: drops the host rolls once per guest and the guest makes on its own page, at the hall's wave -- a dire wolf's 6% Ice piece (95g-direwolf.js) and an ordinary mob's
// named-mythic chance (87-mythicdrops.js), same odds as single player; and the Cyclops's fall (+800 is paid into this guest's pool on the host; Gladehart is earned here, once, like solo)
onMessage('wolfIce',d=>{ if(role!=='guest'||!d||!window.__direwolf||!window.__direwolf.makeIce) return; atHallWave(d.ew,()=>dropLoot(window.__direwolf.makeIce(),+d.x||0,+d.z||0)); });
onMessage('namedDrop',d=>{ if(role!=='guest'||!d) return; atHallWave(d.ew,()=>{ const M=window.__mythicDrops, it=M&&M.namedItem&&M.namedItem(); if(!it) return; const x=+d.x||0, z=+d.z||0; dropLoot(it,x,z); floatText(x,2.4,z,'✦ A NAMED MYTHIC ✦ '+it.name,'#ffcf3a'); toast('A named mythic dropped from a '+String(d.k||'mob').replace(/[^a-z0-9 ]/gi,'').slice(0,20)+': '+it.name); }); });
onMessage('cycFall',d=>{ if(role!=='guest'||guestRunEnded) return; const b=d&&Number.isFinite(+d.b)?Math.round(+d.b):800; toast('☠ THE CYCLOPS FALLS — +'+b+' mana, and the hall remembers'); SFX.setBong&&SFX.setBong(); if(window.__gladehart) atHallWave(d&&d.ew,()=>window.__gladehart.reward(true)); });
function hostBroadcastPickups(dt){
  if(role!=='host'||!conns.size) return;
  syncTP+=dt; if(syncTP<1/10) return; syncTP=0;
  const lootList=[];   // build 151: the host's loot is its own -- never a puppet on a guest's screen (orbs still are)
  const orbList=orbs.map(o=>{ if(!o.__coopId) o.__coopId='p'+(nextPickupId++); return {id:o.__coopId,x:+o.x.toFixed(2),y:+o.y.toFixed(2),z:+o.z.toFixed(2)}; });
  sendSnap('pickups',{loot:lootList,orbs:orbList});
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
  const o=orbs[i];
  // its own spill, still held: tell it to ask again in a moment (a guest asks once per orb, and it stands right on its own pile when it spills)
  if(o.spill===fromId&&o.t<SPILL_HOLD){ send('orbNo',{id:data.id},fromId); return; }
  scene.remove(o.mesh); orbs.splice(i,1);
  const s=guestStats.get(fromId), v=o.val!==undefined?o.val:Math.round(5*MANA_ORB_MUL*(1+(s?s.stat.mana:0)/100)*(s?s.mult.mana:1)*10)/10;   // same formula updateOrbs (game.js) uses for the real hero, now read off THIS guest's own reported mana stat; build 259: a spilled orb (o.val) pays exactly what came out of its owner's pool
  guestMana.set(fromId,Math.round(((guestMana.has(fromId)?guestMana.get(fromId):MAP_MANA)+v)*10)/10);
  SFX.mana(); send('orbGrant',{v},fromId);
}
onMessage('pickupOrb',(data,fromId)=>hostGuestPickupOrb(data,fromId));
function guestApplyLoot(it){ Meta.onPickup(it,{x:hero.x,y:hero.y,z:hero.z}); }   // the complete real pickup flow, scoped to THIS client's own Meta/bag/gold entirely for free
onMessage('lootGrant',data=>{ if(role==='guest') guestApplyLoot(data.it); });
onMessage('orbGrant',data=>{ if(role!=='guest') return; SFX.mana(); floatText(hero.x,hero.y+1,hero.z,'+'+data.v,'#5ee9ff'); });
// build 259 (Matt: "I still want mana to fall on the ground. Picking it up and hearing the tinkling is part of it. So don't auto mana anything. But if tap left alt all my mana spills on the floor for anyone to pick up").
// Build 257's automatic gift of every kill's mana to each guest is gone: mana comes only from orbs on the floor, as before. Instead, in a co-op room, TAPPING LEFT ALT pours ALL of your mana onto the floor around you as ordinary
// mana orbs (the same ones a kill leaves, the same chime when they are picked up) for ANYONE to collect -- a player with plenty tops up a teammate who cannot build; you can take it back yourself. The pool is emptied at once.
// A spilled orb carries its own value (o.val, in game.js updateOrbs and hostGuestPickupOrb below), so what comes off your pool is exactly what lands in whoever collects it, whatever their mana stat: about 6.3 an orb (the value
// of one a kill leaves), at most 60 orbs (a bigger pool makes each worth more). A guest's tap asks the host ('spillMana'), which holds that guest's pool and pours it at the guest's spot; a host's tap pours its own S.mana.
// The spiller cannot collect its own spill for the first 4 seconds (o.spill names the owner; game.js updateOrbs and hostGuestPickupOrb both look): standing where you tapped would otherwise suck it straight back into your
// pool before anyone could reach it. Not in a solo run, not under a menu, dead, or on the title; one spill a second. Touch has no Alt key.
const SPILL_MAX=60; let lastSpill=-1e9;
const SPILL_HOLD=4;
function spillOrbs(x,z,amount,owner){ amount=Math.round(amount*10)/10; if(!(amount>=1)) return 0; const n=Math.max(1,Math.min(SPILL_MAX,Math.ceil(amount/6.3))); const before=orbs.length; spawnOrbs(x,z,n); const made=orbs.slice(before); let left=amount;
  made.forEach((o,i)=>{ const v=i===made.length-1?Math.round(left*10)/10:Math.round(amount/n*10)/10; o.val=v; o.spill=owner; left-=v; }); return made.length; }
function spillSound(){ for(let i=0;i<6;i++) setTimeout(()=>beep(1100+rnd()*700,.09,'sine',.03,0),i*65); }   // a scatter of little tinkles (not SFX.mana: the room-one guide counts that one as 'walked over an orb')
addEventListener('keydown',e=>{ if(e.code!=='AltLeft') return; e.preventDefault(); if(e.repeat||!role) return; const tg=e.target&&e.target.tagName; if(tg==='INPUT'||tg==='TEXTAREA') return;
  if(Meta.isOpen()||S.phase==='start'||S.phase==='dead'||S.phase==='won'||S.phase==='deathcut'||hero.dead>0) return; const now=performance.now(); if(now-lastSpill<1000) return; lastSpill=now;
  if(role==='host'){ const A=Math.floor(S.mana*10)/10; if(A<1){ toast('No mana to spill'); return; } S.mana=Math.round((S.mana-A)*10)/10; spillOrbs(hero.x,hero.z,A,'host'); spillSound(); floatText(hero.x,hero.y+2.4,hero.z,'-'+A+' mana spilled','#5ee9ff'); }
  else if(role==='guest') send('spillMana',{}); },true);
addEventListener('keyup',e=>{ if(e.code==='AltLeft') e.preventDefault(); },true);   // Alt on its own would otherwise move focus to the browser's menu bar
onMessage('spillMana',(d,fromId)=>{ if(role!=='host') return; const g=guestHero.get(fromId); if(!g||g.dead>0) return; const now=performance.now(); if(now-(g.spillAt||-1e9)<900) return; g.spillAt=now;
  const pool=guestMana.has(fromId)?guestMana.get(fromId):0, A=Math.floor(pool*10)/10; if(A<1){ send('manaSpilled',{v:0},fromId); return; } guestMana.set(fromId,Math.round((pool-A)*10)/10); spillOrbs(g.x,g.z,A,fromId); spillSound(); send('manaSpilled',{v:A},fromId); });
onMessage('orbNo',d=>{ if(role==='guest'&&d) setTimeout(()=>requested.delete(d.id),700); });
onMessage('manaSpilled',d=>{ if(role!=='guest'||!d) return; if(+d.v>0){ spillSound(); floatText(hero.x,hero.y+2.4,hero.z,'-'+d.v+' mana spilled','#5ee9ff'); } else toast('No mana to spill'); });

// build 159: the host is gone (a guest's one connection is the host's, so any close on a guest is that). Everything of the host's
// hall goes -- every party puppet (the other guests' too: their only link to this page was through the host, and they stood
// frozen), the orbs, the cached world the HUD kept drawing -- and a guest standing in the hall gets the end screen, the same
// #dead overlay a fallen crystal shows (guestShowRunEnd), retitled: THE HOST LEFT, no payout (the run didn't end, it stopped; what
// each held wave paid is already theirs), and its button goes back to the title (it reloads, as TRY AGAIN always has -- onto this
// player's own map, since the lobby already took the host's map off the address). On the title screen the lobby says it instead
// (99b-lobby.js hostGone). Not for our own leave (leave() closes the connection too) and not for a hall that was full.
let hostLeftSaid=false;
function guestHostLeft(why){
  window.__party.list().forEach(id=>window.__party.remove(id)); [...LOOTPUP.keys(),...ORBPUP.keys()].forEach(pickupPuppetRemove); MOBPROX.clear(); requested.clear(); hostWorld=null;
  if(leaving||why==='left') return;
  setTimeout(()=>{ if(role==='guest'&&!conns.size) leave(); },0);   // no host, no guest: role back to none, the Peer off the broker (after this close event has finished, not inside it)
  if(hostLeftSaid||why==='full') return;
  if(guestRunEnded){ hostLeftSaid=true; $('deadp').textContent+=' The host has left the game.'; return; }   // already on SHATTERED / HALL HELD: that screen stays, it just says so
  if(!(S.phase==='build'||S.phase==='wave')) return;   // still on the title screen: the lobby's own
  if(guestHeld){ hostLeftSaid=true; if(window.__pause&&window.__pause.isOpen()) window.__pause.close(false); guestShowRunEnd({phase:'won',held:true,wave:guestHeld.wave,mapName:guestHeld.mapName}); $('deadp').textContent+=' The host has left the game.'; toast('The host left the game'); return; }   // build 160: gone on the victory lap -- the hall WAS held, and this guest paid for it at HALL HELD: its own HALL HELD screen (REJOIN and all), not THE HOST LEFT
  hostLeftSaid=guestRunEnded=true; S.phase='dead'; cancelPlace(); droneOff(); setMusic('none');
  if(window.__pause&&window.__pause.isOpen()) window.__pause.close(false);
  if(document.exitPointerLock) document.exitPointerLock(); document.body.classList.remove('play');
  $('deadh1').textContent='THE HOST LEFT'; $('deadh2').textContent=why==='lost'?'THE CONNECTION TO THEIR HALL DROPPED':'THE HALL CLOSED WITH THEM';
  $('deadp').textContent='Your own gear, gold and skills stay with you. Back to the title to host a game or join another.'+(offerRejoin()?' ⟲ REJOIN puts you back in their game as soon as it is open again.':'');   // build 159 (7/7): a host coming back (RETURN TO TITLE, then HOST A GAME on its same code), or a link of ours that dropped while the host's hall runs on
  $('nextmapbtn').style.display='none'; $('againbtn').textContent='↩ BACK TO THE TITLE'; $('dead').classList.remove('hide');
  toast('The host left the game');   // seen even from inside the tavern, which sits over the end screen
}
window.__hostLeft=()=>hostLeftSaid;   // a test hook
onMessage('__leave',(fromId,why)=>{ if(role==='guest') guestHostLeft(why);
  if(role==='host') seatLeave(fromId);   // build 159 (3/7): this guest's pool is put aside under its seat (or handed to the same tab already back), before it goes below
  window.__party.remove(fromId); guestIn.delete(fromId); guestHero.delete(fromId); guestStats.delete(fromId); guestMana.delete(fromId); [...MOBPUP.keys()].forEach(mobPuppetRemove); [...DEFPUP.keys()].forEach(defPuppetRemove); });   // guestStats gone -> Meta.defOwnerStat/Mult return undefined for whatever this guest placed -> stat() falls back to the host's own numbers, automatically
{ const prev=Meta.update; Meta.update=dt=>{ prev(dt); guestInputTick(dt); hostBroadcastHeroes(dt); hostBroadcastWorld(dt); hostBroadcastEnemies(dt); hostBroadcastDefs(dt); hostBroadcastPickups(dt); mobPuppetsTick(dt); defPuppetsTick(dt); pickupPuppetsTick(dt); guestPickupTick(dt); guestSendInput(dt); }; }
})();
