// ===== NETWORK: phases 2-3 of co-op. Phase 2 is the transport — PeerJS (vendored in head.html, window.Peer) talks
// to its free public signaling broker (0.peerjs.com) so two browsers can find each other and open a WebRTC data
// channel directly between them: no server of our own to run. One player hosts — their own peer id becomes the
// room code — and up to three more join by connecting to that code. Phase 3 is the first real payload over that
// pipe: the host broadcasts its own hero's position/heading/hero-pick a few times a second, and a guest renders it
// as a party puppet (98-party.js) — the same setTarget(id,x,z,yaw) call a test script used to drive in phase 1,
// now driven by an actual player on the other end. Guest input flowing back to the host is phase 4, still open.
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

// ---- phase 3: the host's own hero, broadcast a few times a second and rendered as a puppet on every guest ----
const HERO_GLB={witch:'witch.glb',troll:'troll.glb',knight:'knight.glb',fighter:'fighter.glb'};   // hero id -> glb file (70-hero2.js's HEROES table, duplicated here rather than reached into, so this module only ever touches __heroes/__party through their own public surface)
let syncT=0;
function hostBroadcastHero(dt){
  if(role!=='host'||!conns.size) return;
  syncT+=dt; if(syncT<1/15) return; syncT=0;   // 15Hz: plenty for a puppet that already eases toward its target (98-party.js) rather than snapping to it
  const h=window.__dd.hero, pick=window.__heroes.pick();
  send('hero',{x:+h.x.toFixed(3),z:+h.z.toFixed(3),yaw:+h.yaw.toFixed(3),pick});
}
onMessage('hero',(data,fromId)=>{
  if(!window.__party.list().includes(fromId)) window.__party.add(fromId,HERO_GLB[data.pick]||'witch.glb','Host');
  window.__party.setTarget(fromId,data.x,data.z,data.yaw);
});
onMessage('__leave',fromId=>{ window.__party.remove(fromId); });
{ const prev=Meta.update; Meta.update=dt=>{ prev(dt); hostBroadcastHero(dt); }; }
})();
