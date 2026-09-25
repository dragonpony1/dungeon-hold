// ===== NETWORK: phases 2-4 of co-op. Phase 2 is the transport — PeerJS (vendored in head.html, window.Peer) talks
// to its free public signaling broker (0.peerjs.com) so two browsers can find each other and open a WebRTC data
// channel directly between them: no server of our own to run. One player hosts — their own peer id becomes the
// room code — and up to three more join by connecting to that code. Phase 3 broadcast the host's own hero over
// that pipe, rendered by a guest as a party puppet (98-party.js) — the same setTarget(id,x,z,yaw) call a test
// script used to drive in phase 1. Phase 4 closes the loop: a guest's own keys and look are relayed to the host,
// which simulates a real, collision-respecting hero for them and folds it into the same broadcast, so every screen
// renders every OTHER player. Still open: guest actions (combat, placing defenses) and enemies noticing anyone but
// the host's own hero — both need the single-player combat/targeting code to learn there's more than one hero.
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
const guestHero=new Map();   // id -> {x,y,z,yaw} the host moves each tick from guestIn, same collision rules as the real hero
function guestInputTick(dt){
  if(role!=='host') return;
  guestIn.forEach((inp,id)=>{
    let g=guestHero.get(id);
    if(!g){ g={x:guestHero.size*1.5,y:0,z:6,yaw:0}; guestHero.set(id,g); }
    let mx=0,mz=0; if(inp.w) mz+=1; if(inp.s) mz-=1; if(inp.d) mx+=1; if(inp.a) mx-=1;
    const len=Math.hypot(mx,mz);
    if(len>.05){ mx/=Math.max(len,1); mz/=Math.max(len,1);
      const fx=Math.sin(inp.yaw), fz=Math.cos(inp.yaw), rx=-Math.cos(inp.yaw), rz=Math.sin(inp.yaw);
      const vx=fx*mz+rx*mx, vz=fz*mz+rz*mx, spd=7.5*(inp.shift?11/7.5:1);
      moveCircle(g,vx*spd*dt,vz*spd*dt,.42,true);
      g.yaw=angLerp(g.yaw,Math.atan2(vx,vz),1-Math.exp(-12*dt)); }
    g.y=floorAt(g.x,g.z,g.y);
    // the host renders every guest as a puppet on its own screen too, straight from the state it just simulated —
    // no need to round-trip its own broadcast, which never loops back to the sender anyway
    if(!window.__party.list().includes(id)) window.__party.add(id,HERO_GLB[inp.pick]||'witch.glb',heroLabel(inp.pick));
    window.__party.setTarget(id,g.x,g.z,g.yaw);
  });
}
onMessage('input',(data,fromId)=>{ guestIn.set(fromId,data); });

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
// local hero already moves from (heroUpdate, above), just relayed instead of applied here
let syncTIn=0;
function guestSendInput(dt){
  if(role!=='guest') return;
  syncTIn+=dt; if(syncTIn<1/15) return; syncTIn=0;
  send('input',{w:K.w?1:0,s:K.s?1:0,a:K.a?1:0,d:K.d?1:0,shift:K.shift?1:0,yaw:+cam.yaw.toFixed(3),pick:window.__heroes.pick()});
}

onMessage('__leave',fromId=>{ window.__party.remove(fromId); guestIn.delete(fromId); guestHero.delete(fromId); });
{ const prev=Meta.update; Meta.update=dt=>{ prev(dt); guestInputTick(dt); hostBroadcastHeroes(dt); guestSendInput(dt); }; }
})();
