// ===== NETWORK: phase 2 of co-op — the actual transport. PeerJS (vendored in head.html, window.Peer) talks to its
// free public signaling broker (0.peerjs.com) so two browsers can find each other and open a WebRTC data channel
// directly between them: no server of our own to run. One player hosts — their own peer id becomes the room code —
// and up to three more join by connecting to that code. This module only proves the pipe (connect, send, receive,
// disconnect) works; it doesn't drive the party puppets or the sim yet (that's phase 3/4), and has no UI of its own.
(function(){
let peer=null, role=null;   // 'host' | 'guest' | null
const conns=new Map();      // host: one entry per connected guest, keyed by their peer id · guest: one entry, keyed 'host'
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
    conn.on('open',()=>{ conns.set('host',conn); wire(conn); cb&&cb(null,myId); });
    conn.on('error',e=>{ cb&&cb(e); });
  });
  peer.on('error',e=>{ cb&&cb(e); });
}
function leave(){ conns.forEach(c=>c.close()); conns.clear(); if(peer) peer.destroy(); peer=null; role=null; }
window.__net={ host, join, leave, send, onMessage, role:()=>role, peers:()=>[...conns.keys()], myId:()=>peer&&peer.id };
})();
