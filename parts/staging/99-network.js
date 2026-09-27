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
function iceOpts(o){ o=Object.assign({},o||{}); if(!o.config) o.config={iceServers:[{urls:'stun:stun.l.google.com:19302'}]}; return o; }
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
function keepOnBroker(p){ let n=0; p.on('open',()=>{ n=0; }); p.on('disconnected',()=>{ setTimeout(()=>{ try{ if(p===peer&&!p.destroyed&&p.disconnected) p.reconnect(); }catch(e){} },Math.min(30000,1500*Math.pow(2,n++))); }); }
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
function join(roomCode,cb,peerOpts){
  if(peer) leave();   // build 159 (P2): CONNECT pressed again (or Enter twice) used to make a second Peer beside the first, and the first one's slow attempt could still open -- two live connections from one tab: the host simulated two of you, every reward came twice and you saw a puppet of yourself. The old Peer, and every attempt it had going, goes first
  role='guest'; const p=peer=new Peer(undefined,iceOpts(peerOpts)); keepOnBroker(p); let asked=false, done=false, tries=0;
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
    conn.on('open',()=>{ if(p!==peer){ try{ conn.close(); }catch(e){} return; }   // build 159 (P2): an attempt of a Peer this page has since replaced never gets in
      if(done){ if(conns.get(conn.peer)!==conn) try{ conn.close(); }catch(e){} return; } done=true; clearTimeout(timer); conns.set(conn.peer,conn); wire(conn); cb&&cb(null,selfId); });   // done: 'open' can fire twice for one connection, and only one attempt may ever win -- a second attempt that opens too is closed
    conn.on('error',e=>{ if(p===peer) cb&&cb(e); });
  };
  p.on('open',myId=>{ if(p!==peer) return; selfId=myId; if(asked) return; asked=true; attempt(); });
  p.on('error',e=>{ if(p===peer) cb&&cb(e); });
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
function shortRoomCode(){ const A='ABCDEFGHJKMNPQRSTUVWXYZ23456789'; let s=''; for(let i=0;i<5;i++) s+=A[Math.floor(Math.random()*A.length)]; return s; }
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
  hostbtn.addEventListener('click',()=>{
    coopRow.classList.add('hide'); hostPanel.classList.remove('hide'); hostMsg.textContent='Opening the gate…'; coopMsg.textContent='';
    let tries=0;
    const tryHost=()=>{
      let opened=false;
      window.__net.host(shortRoomCode(),(err,id)=>{
        if(opened) return;   // the same Peer can report a later error (its signaling socket dropping, say) -- that must not tear down a lobby that is already open; the data channels to anyone in it don't need the broker any more
        if(err){
          if(err.type==='unavailable-id'&&tries<4){ tries++; tryHost(); return; }   // a real collision on the room code itself -- quietly try a fresh one rather than surface a confusing error for something this recoverable
          coopMsg.textContent=hostErrText(err); hostPanel.classList.add('hide'); coopRow.classList.remove('hide'); return;   // #coopMsg sits outside the host panel, so it stays up with the buttons
        }
        opened=true;
        hostMsg.innerHTML='Share this code with your friends:<br><span class="netCode" id="hostCode">'+id+'</span>';
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
    const my=++joinSeq;
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
      if(err){ joinMsg.textContent=joinErrText(err); joinMsg.classList.add('err'); return; }
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
    window.__party.add(id,HERO_GLB[inp.pick]||'witch.glb',heroLabel(inp.pick));   // every tick: add() returns at once for the same rig and re-skins on a pick change (build 150)
    window.__party.setTarget(id,g.x,g.z,g.yaw); if(window.__party.setLook) window.__party.setLook(id,inp.look||null);   // build 150: the host dresses its copy of the guest from the look that rides the guest's input
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
function hurtGuestHero(id,dmg){
  const g=guestHero.get(id); if(!g||g.dead>0) return;
  const s=guestStats.get(id), def=s?s.stat.def:0;
  if(guestMantle(id,g,s)) return;
  dmg=Math.max(1,Math.round(dmg*(1-Math.min(75,def)/100)));   // same gear-scaled mitigation hurtHero() (game.js) applies to the real hero
  g.hp-=dmg; g.hurtT=3; if(g.hp<=0){ g.hp=0; g.dead=4; } send('hp',{hp:g.hp,max:g.max,dead:g.dead,x:g.x,y:g.y,z:g.z},id);
}
// the guest's own client (see onMessage('hp') below) applies this straight to its own local `hero` -- otherwise the
// hp/dead this module tracks is host-private, so the one player it's happening to would see none of it: their own
// health bar, hurt flash/SFX, death toast and movement-freeze-on-death all read the LOCAL hero (game.js), and that
// local hero's own enemies array stays empty (a guest can't start a wave), so hurtHero() never fires through real
// local gameplay -- targeted (toId) rather than broadcast, since nobody else needs to know a guest's own raw hp
window.__combat={ guestHero:id=>{ const g=guestHero.get(id); return g?{x:+g.x.toFixed(2),z:+g.z.toFixed(2),hp:g.hp,max:g.max,dead:g.dead}:null; },
  guestMana:id=>guestMana.has(id)?guestMana.get(id):null,
  seatOf:id=>{ const s=seatOf.get(id); return s?s.seat:null; }, seatKept:seat=>seatKept.has(seat)?seatKept.get(seat):null };   // guestHero/guestMana are this module's own private state (not re-exposed anywhere else, deliberately -- other modules reach them only through Meta.heroes()/hostTryPlaceDef etc.); this object is purely a test hook
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
  swing=function(){ const before=hero.swingT; origSwing(); if(role==='guest'&&before<0&&hero.swingT===0&&!(window.__aim&&window.__aim.kind())&&(hero.reach||GUEST_REACH)<=GUEST_MELEE_MAX) send('swing',{yaw:+hero.yaw.toFixed(3),x:+hero.x.toFixed(2),z:+hero.z.toFixed(2),dmg:Math.round(heroDmg()*10)/10,reach:+(hero.reach||GUEST_REACH).toFixed(2)}); }; }   // build 159 (4/7): a reach past any sword's is a ranged hero whose staff or bow hasn't appeared yet (just switched) -- no swing then; its shot goes as a shot once the weapon is in hand. Build 150 ("guests' defenses do damage but not the sword"): the swing carries the guest's OWN facing and spot -- hitCone() swings from hero.yaw (the way the hero faces, the walk's direction when moving), not the camera's yaw the relay used to send, and from where the guest really stands, not where the host's copy got to
// the melee cone: still not a faithful port of anything, just a straightforward "who's in front of me" check, same
// as the real local hitCone() (game.js) a melee hero uses -- ranged guests no longer come through here (phase 9,
// below, gives them a real bolt/arrow instead), so GUEST_REACH/GUEST_DMG's own fallbacks now only ever matter for
// a 'swing' that somehow arrives with no dmg/reach at all.
function guestHitCone(id,yaw,dmg,reach,at){
  const g=guestHero.get(id); if(!g||g.dead>0) return;
  const r=Math.min(reach||GUEST_REACH,GUEST_MELEE_MAX), d=dmg||GUEST_DMG; const gx=(at&&typeof at.x==='number')?at.x:g.x, gz=(at&&typeof at.z==='number')?at.z:g.z;   // the guest's reported spot when it sends one (build 150); the host's copy otherwise. Build 159 (4/7): never a sword longer than a sword (GUEST_MELEE_MAX) -- an older guest still sends the bow's 24 in the moment after a switch
  if(Math.hypot(gx-g.x,gz-g.z)<30){ g.x=gx; g.z=gz; }   // and the copy is put there too: a swing is the surest word on where the guest is
  const fx=Math.sin(yaw), fz=Math.cos(yaw); let n=0;
  const cone=()=>{ for(const e of enemies){ if(e.dead) continue; const dx=e.x-gx, dz=e.z-gz, dd=Math.hypot(dx,dz);
    if(dd<r+e.r&&(dx*fx+dz*fz)/Math.max(dd,.01)>.4){ hurt(e,d,fx*1.4,fz*1.4); n++; } } };
  // build 159 (5/7): the powers a host's own swing carries, for the guest's too. This path never went through hitCone, so a guest's full
  // Void set never tore a rift (93-gearsets.js guestSwing runs the swing and that guest's five-piece powers the way the hitCone wrap does
  // the host's), and the Last Lantern counted a guest's sword as a DEFENSE's blow, 25% more on a lit mob (asHero, 97-mythics.js)
  const s=guestStats.get(id), P=Meta.packs, M=window.__mythic;
  const go=()=>P&&P.guestSwing?P.guestSwing(s&&s.five,d,cone):(cone(),[]);
  const fired=M&&M.asHero?M.asHero(go):go();
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
          send('shot',{wtype:isStaff?'bolt':'arrow',kind:wo.userData.kind,
            dmg:Math.round(heroDmg()*sh.mul*10)/10,
            dir:{x:+d3.fx.toFixed(3),y:+d3.fy.toFixed(3),z:+d3.fz.toFixed(3)},
            spd:+spd.toFixed(2), life:+((range+1)/spd).toFixed(3),
            size:+(isStaff?1+.7*sh.c:1+.4*sh.c).toFixed(2),
            splash:isStaff&&sh.full?1.9:0, pierce:!isStaff&&sh.full?2:0,
            x:+hero.x.toFixed(2), y:+hero.y.toFixed(2), z:+hero.z.toFixed(2)});   // build 159 (4/7): where the shooter really stands, as a swing says (hostGuestShot)
        }
      }
    }
    return prevHitCone();   // the guest's own local shot still fires too (their own screen's real visual/audio), against their own empty local `enemies` -- cosmetic only, the message above is what actually hurts anything
  };
}
function hostGuestShot(data,fromId){
  const g=guestHero.get(fromId); if(!g||g.dead>0) return;
  // build 159 (4/7): the shot starts where the guest says it stands (a sprinting witch's bolts used to leave from the copy, steps
  // behind her), and the copy is put there too -- the same rule guestHitCone keeps for a swing. Its own height as well, so a shot
  // loosed mid-jump leaves from the air; an older guest that sends no spot fires from the copy as before
  if(typeof data.x==='number'&&typeof data.z==='number'&&Math.hypot(data.x-g.x,data.z-g.z)<30){ g.x=data.x; g.z=data.z; g.y=floorAt(g.x,g.z,g.y); }
  const y0=typeof data.y==='number'&&Math.abs(data.y-g.y)<4?data.y:g.y;
  const from=new THREE.Vector3(g.x,y0+(data.wtype==='bolt'?1.3:1.1),g.z);   // an approximate hand/head height -- the host has no bone-accurate rig for a guest's puppet to read the real one from, same "good enough to read as real" tradeoff the mob/def puppets already make
  const dir=new THREE.Vector3(data.dir.x,data.dir.y,data.dir.z);
  const opts={dmg:data.dmg,life:data.life,size:data.size,splash:data.splash,pierce:data.pierce};
  if(data.wtype==='bolt') window.__staff.fireBolt(data.kind,from,dir,data.spd,opts);
  else window.__bow.fireArrow(data.kind,from,dir,data.spd,opts);
}
onMessage('shot',(data,fromId)=>hostGuestShot(data,fromId));
onMessage('swing',(data,fromId)=>{ guestHitCone(fromId,data.yaw,data.dmg,data.reach,data); });
const guestStats=new Map();   // id -> {stat:{tow,trate,tarea,move,def,hp,regen},mult:{tow,tcd,aoe,move,hp}} -- this guest's OWN gear/skill numbers, last reported
// build 159 (5/7): myth, five and idle -- the named mythics this guest wears, its full sets and whether its hero stands still -- so the
// host can run that guest's powers (97-mythics.js GW, 93-gearsets.js guestSwing, guestMantle above). Only names the game knows are kept
const strList=(a,ok)=>Array.isArray(a)?a.filter(k=>typeof k==='string'&&k.length<40&&(!ok||ok(k))).slice(0,8):[];
onMessage('input',(data,fromId)=>{ guestIn.set(fromId,data); if(data.stat&&data.mult){ const NM=window.__mythic&&window.__mythic.NAMED;
  guestStats.set(fromId,{stat:data.stat,mult:data.mult,kind:data.kind||{},myth:strList(data.myth,k=>!!(NM&&Object.prototype.hasOwnProperty.call(NM,k))),five:strList(data.five),idle:!!data.idle}); } });
Meta.coopWear=()=>{ if(role!=='host') return null; const out=[]; guestHero.forEach((g,id)=>{ const s=guestStats.get(id); if(s&&s.myth&&s.myth.length) out.push({id,myth:s.myth,idle:s.idle,g}); }); return out; };   // who wears what, for 97-mythics.js (g: the host's live copy of that guest's hero)
// a guest's Rootsplitter: its own 4th swing drew the roots on its own screen (97-mythics.js) and says so here; the host holds its mobs
// from where the guest stands, as the host's own swing does. Only for a guest that wears it, alive, from within a few steps of its copy
onMessage('roots',(d,fromId)=>{ if(role!=='host'||!d) return; const g=guestHero.get(fromId), s=guestStats.get(fromId), M=window.__mythic; if(!g||g.dead>0||!(s&&s.myth.includes('rootsplitter'))||!(M&&M.roots)) return;
  const now=performance.now(); if(now-(g.rootsAt||-1e9)<300) return; g.rootsAt=now;   // four swings can't come quicker than this
  const ok=typeof d.x==='number'&&typeof d.z==='number'&&Math.hypot(d.x-g.x,d.z-g.z)<6, x=ok?d.x:g.x, z=ok?d.z:g.z, yaw=Number.isFinite(+d.yaw)?+d.yaw:g.yaw;
  if(M.roots(x,g.y,z,yaw,Math.max(0,Math.min(27,+d.reach||0)))) send('powerFx',{k:'roots',x:+x.toFixed(2),z:+z.toFixed(2),yaw:+yaw.toFixed(3)},fromId); });
// what the host says a guest's power just did, drawn on that guest's own screen: the Void rift's rings, the ROOTS shout
onMessage('powerFx',d=>{ if(role!=='guest'||!d) return;
  if(d.k==='rift'&&Array.isArray(d.at)){ const P=Meta.packs; d.at.slice(0,24).forEach(p=>{ if(P&&P.ring&&p&&Number.isFinite(+p.x)&&Number.isFinite(+p.z)) P.ring(+p.x,+p.y||0,+p.z,+p.c||0x8a3dff); }); if(SFX.rift) SFX.rift(); }
  else if(d.k==='roots'&&Number.isFinite(+d.x)&&Number.isFinite(+d.z)){ const fx=Math.sin(+d.yaw||0), fz=Math.cos(+d.yaw||0); floatText(+d.x+fx*1.5,hero.y+1.4,+d.z+fz*1.5,'ROOTS','#5ad05a'); } });
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
  sendSnap('heroes',{list});
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
    seat:window.__lobby&&window.__lobby.seat?window.__lobby.seat():undefined,   // build 159 (3/7): this tab's lobby seat, so the host can keep this player's mana and defenses for them across a drop (seatJoin)
    myth:window.__mythic&&window.__mythic.worn?window.__mythic.worn():[], five:Meta.sets&&Meta.sets.active?Meta.sets.active().filter(a=>a.tier>=5).map(a=>a.name):[], idle:(!hero.moving&&hero.swingT<0&&hero.dead<=0)?1:0,   // build 159 (5/7): what the host needs to run this guest's named mythics and five-piece powers (the 'input' handler), and Mossheart's "stand still"
    look:lookOf(),   // build 150: what this guest wears, for its puppet on every other screen
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
  sendSnap('world',{crystal:S.crystal,crystalMax:CRYSTAL_MAX,wave:S.wave,phase:S.phase,waveTotal:MAP.waves,mapName:MAP.name,mana:S.mana,manas,du:S.du,duCap:DU_CAP});
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
  const pay=typeof w.pay==='number'&&Number.isFinite(w.pay)?Math.max(0,Math.round(w.pay)):w.wave>0?25*w.wave+(w.phase==='won'?150:0):0; if(pay){ Meta.addGold(pay,'run'); Meta.save(); }   // phase 13: the run's payout -- since build 159 (3/7) the host's own number (runPay), so a later map pays the guest what it pays the host; the old map-wave formula only for an older host that sends none
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
// build 159 (3/7): what the host's own Meta.onRunEnd pays (10-meta.js: 25 a wave, +150 for a map held), worked out from the very wave
// the host pays itself on -- the map's own count when the crystal falls (finishDeath), the CAMPAIGN wave when the map is held
// (winMap's effWave()). A guest used to work it out from the map's count both times, so holding the Throne Room paid the host 500
// and the guest 325, and the gap grew every map
function runPay(w,won){ w=w|0; return w>0?25*w+(won?150:0):0; }
{ const origFinishDeath=finishDeath;
  finishDeath=function(){ origFinishDeath(); if(role==='host') send('runEnd',{phase:'dead',wave:S.wave,pay:runPay(S.wave,false)}); }; }
{ const origWinMap=winMap;
  winMap=function(){ origWinMap(); if(role==='host') send('runEnd',{phase:'won',wave:S.wave,mapName:MAP.name,pay:runPay(effWave(),true)}); }; }

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
function mobProxies(){ if(role!=='guest') return enemies; const out=[]; MOBPUP.forEach((p,id)=>{ let q=MOBPROX.get(id); if(!q){ const sz=PROX_SIZE[p.kind]||[.5,1.3]; q={puppet:true,__coopId:id,kind:p.kind,r:sz[0],h:sz[1],dead:0,slowT:0,fly:p.kind==='drake'}; MOBPROX.set(id,q); } q.x=p.x; q.y=p.y; q.z=p.z; q.hp=p.hp; q.squash=p.squash||0; q.dead=(p.hp<=0)?1:0; if(!q.dead) out.push(q); }); MOBPROX.forEach((q,id)=>{ if(!MOBPUP.has(id)) MOBPROX.delete(id); }); return out; }   // squash (build 159, 5/7): "just hit", as hurt() marks a real mob -- Old Lamplight's pet fires at whatever is being hit (97-mythics.js), and on a guest nothing ever was
onMessage('famHit',(data,fromId)=>{ if(role!=='host'||!data) return; const e=enemies.find(e=>e.__coopId===data.id&&!e.dead); if(!e) return; const dmg=Math.max(0,Math.min(400,+data.dmg||0)); if(dmg>0) hurt(e,dmg,+data.kx||0,+data.kz||0);   // a guest's pet lands on the host's REAL mob, as guestHitCone and hostGuestShot do for the guest's own blows
  // build 159 (5/7): and what the pet's hit does besides (famHurt's ex): the Moss Sprite's spores slow it, the Fire Imp sets it burning --
  // this page's own burnUpdate (85-familiars.js) ticks the burn from here, as for the host's own Imp. Capped at a little over the
  // pets' own numbers (2.2 s of slow, 3 s of burn), so a doctored page can't freeze or cook a mob for good
  if(e.dead) return; const sl=+data.slow, bu=+data.burn;
  if(sl>0) e.slowT=Math.max(e.slowT||0,Math.min(5,sl));
  if(bu>0){ e.burnT=Math.min(5,bu); e.burnDmg=Math.max(0,Math.min(50,+data.burnDmg||0)); e.burnTick=e.burnTick||0; } });
window.__mobsync={ foes:mobProxies, list:()=>[...MOBPUP.keys()], get:id=>{ const p=MOBPUP.get(id); if(!p) return null; return {id,kind:p.kind,x:+p.x.toFixed(2),y:+p.y.toFixed(2),z:+p.z.toFixed(2),yaw:+p.yaw.toFixed(2),walking:p.walking,hp:p.hp}; }, hitFeedback:()=>mobHitFeedback,
  unpack:d=>unpackMobs(d) };   // build 159 (6/7), a test hook: a packed 'mobs' message back into the old list (coop-tests-test.mjs)
function mobPuppetsTick(dt){
  MOBPUP.forEach(p=>{ const k=1-Math.exp(-10*dt); const m=p.mdl; if(p.squash>0) p.squash=Math.max(0,p.squash-dt*7);   // hurt()'s own fade (game.js updateEnemies)
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
    return [m?+m[1]:e.__coopId,n,+e.x.toFixed(2),+e.y.toFixed(2),+e.z.toFixed(2),+e.yaw.toFixed(2),e.walking?1:0,+e.hp.toFixed(1)]; })}; }   // an id that isn't 'e<n>' (a test names its own) goes as the string itself
function unpackMobs(d){ const k=Array.isArray(d&&d.k)?d.k:[];
  return (Array.isArray(d&&d.l)?d.l:[]).filter(Array.isArray).map(r=>({id:typeof r[0]==='number'?'e'+r[0]:String(r[0]),kind:k[r[1]],x:+r[2]||0,y:+r[3]||0,z:+r[4]||0,yaw:+r[5]||0,walking:!!r[6],hp:+r[7]||0})); }
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
    else { if(!list) list=live.map(e=>({id:e.__coopId,kind:e.kind,x:+e.x.toFixed(2),y:+e.y.toFixed(2),z:+e.z.toFixed(2),yaw:+e.yaw.toFixed(2),walking:!!e.walking,hp:+e.hp.toFixed(1)}));   // y matters for flyers (drake etc, spawned at e.fly's altitude) -- without it they'd render as if grounded; hp is new (see below)
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
    if(!p){ p=mobPuppetAdd(e.id,e.kind); p.x=p.tx=e.x; p.y=p.ty=e.y; p.z=p.tz=e.z; p.yaw=p.tyaw=e.yaw; p.hp=e.hp; p.kind=e.kind; }   // snap on first sight, no popping in from the origin, and no false "hit" flash for however damaged it already was
    else if(e.hp<p.hp-.05){ floatText(p.x,p.y+1.5,p.z,String(Math.round((p.hp-e.hp)*10)/10),'#ffd060'); SFX.hit(); mobHitFeedback++; p.squash=1; }   // squash: see mobProxies
    p.tx=e.x; p.ty=e.y; p.tz=e.z; p.tyaw=e.yaw; p.walking=e.walking; p.hp=e.hp; });
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
  sendSnap('defs',{list});
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
  const d=placeDefAt(kind,x,z,yaw); if(d){ d.ownerId=fromId; const st=seatOf.get(fromId); if(st) d.ownerSeat=st.seat; }   // stat() (game.js) reads this via Meta.defOwnerStat/Mult so the defense keeps ITS PLACER's buffs, not the host's own; the seat (build 159, 3/7) is how it finds its placer again after a rejoin (seatJoin)
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
  if(S.phase==='start'||S.phase==='dead'||S.phase==='won'||S.phase==='deathcut'){ send('toast','Not right now',fromId); return; }   // build 159 (3/7): the same end-of-run gate hostTryPlaceDef has always had -- a repair, upgrade or sell after the hall fell or held used to go through
  const pos={x:g.x,z:g.z};
  // build 159 (3/7), Matt's call: a guest sells only the defenses it built -- sell() takes whichever is nearest, so pressing X by a
  // friend's tower took it down and put 70% of what THEY paid in your own pool. The host may sell any (its hall), and repairing or
  // upgrading anyone's stays open to everyone: helping is fine
  if(data.action==='sell'){ const d=nearestDef(3.4,pos); if(d&&d.ownerId!==fromId){ send('toast',"That's a teammate's defense — you can only sell the ones you built",fromId); return; } }
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
{ const prev=dropLoot; dropLoot=function(it,x,z,gentle){ const l=prev(it,x,z,gentle); if(role==='host'&&conns.size&&LASTROLL&&LASTROLL.it===it){ const a=LASTROLL.args; send('lootDrop',{minR:a[0]|0,slot:a[1]||null,lvl:Number.isFinite(+a[2])?+a[2]:null,ew:effWave(),x:+(+x).toFixed(2),z:+(+z).toFixed(2),gentle:!!gentle}); } return l; }; }   // only an item that came straight from rollItem is relayed: the Forest guarantee's set pieces (already personal, 93-gearsets.js) and take-backs are not. ew (build 159, 3/7): the hall's wave, which the guest rolls at
// the guest's roll runs at the hall's wave (atHallWave, above): the level, the rarity odds (epic from wave 3, legendary from 6), the
// Void and Forest chances (93-gearsets.js) and a mythic's stats (87-mythicdrops.js rolls them on the item's own level) all come out
// as the host's own roll would -- only the dice are this guest's, and its own rules (Forest pity, its own 7% mythic)
onMessage('lootDrop',d=>{ if(role!=='guest'||!d) return; atHallWave(d.ew,()=>{ const it=rollItem(Math.max(0,Math.min(4,d.minR|0)),d.slot||undefined,d.lvl||undefined); dropLoot(it,+d.x||0,+d.z||0,!!d.gentle); }); });
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
  const o=orbs[i]; scene.remove(o.mesh); orbs.splice(i,1);
  const s=guestStats.get(fromId), v=Math.round(5*MANA_ORB_MUL*(1+(s?s.stat.mana:0)/100)*(s?s.mult.mana:1)*10)/10;   // same formula updateOrbs (game.js) uses for the real hero, now read off THIS guest's own reported mana stat
  guestMana.set(fromId,Math.round(((guestMana.has(fromId)?guestMana.get(fromId):MAP_MANA)+v)*10)/10);
  SFX.mana(); send('orbGrant',{v},fromId);
}
onMessage('pickupOrb',(data,fromId)=>hostGuestPickupOrb(data,fromId));
function guestApplyLoot(it){ Meta.onPickup(it,{x:hero.x,y:hero.y,z:hero.z}); }   // the complete real pickup flow, scoped to THIS client's own Meta/bag/gold entirely for free
onMessage('lootGrant',data=>{ if(role==='guest') guestApplyLoot(data.it); });
onMessage('orbGrant',data=>{ if(role!=='guest') return; SFX.mana(); floatText(hero.x,hero.y+1,hero.z,'+'+data.v,'#5ee9ff'); });

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
  hostLeftSaid=guestRunEnded=true; S.phase='dead'; cancelPlace(); droneOff(); setMusic('none');
  if(window.__pause&&window.__pause.isOpen()) window.__pause.close(false);
  if(document.exitPointerLock) document.exitPointerLock(); document.body.classList.remove('play');
  $('deadh1').textContent='THE HOST LEFT'; $('deadh2').textContent=why==='lost'?'THE CONNECTION TO THEIR HALL DROPPED':'THE HALL CLOSED WITH THEM';
  $('deadp').textContent='Your own gear, gold and skills stay with you. Back to the title to host a game or join another.';
  $('nextmapbtn').style.display='none'; $('againbtn').textContent='↩ BACK TO THE TITLE'; $('dead').classList.remove('hide');
  toast('The host left the game');   // seen even from inside the tavern, which sits over the end screen
}
window.__hostLeft=()=>hostLeftSaid;   // a test hook
onMessage('__leave',(fromId,why)=>{ if(role==='guest') guestHostLeft(why);
  if(role==='host') seatLeave(fromId);   // build 159 (3/7): this guest's pool is put aside under its seat (or handed to the same tab already back), before it goes below
  window.__party.remove(fromId); guestIn.delete(fromId); guestHero.delete(fromId); guestStats.delete(fromId); guestMana.delete(fromId); [...MOBPUP.keys()].forEach(mobPuppetRemove); [...DEFPUP.keys()].forEach(defPuppetRemove); });   // guestStats gone -> Meta.defOwnerStat/Mult return undefined for whatever this guest placed -> stat() falls back to the host's own numbers, automatically
{ const prev=Meta.update; Meta.update=dt=>{ prev(dt); guestInputTick(dt); hostBroadcastHeroes(dt); hostBroadcastWorld(dt); hostBroadcastEnemies(dt); hostBroadcastDefs(dt); hostBroadcastPickups(dt); mobPuppetsTick(dt); defPuppetsTick(dt); pickupPuppetsTick(dt); guestPickupTick(dt); guestSendInput(dt); }; }
})();
