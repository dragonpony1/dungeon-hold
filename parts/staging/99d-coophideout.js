// ===== THE CO-OP HIDEOUT (build 234). The hideout is its own page (parts/hideout/index.html) in an iframe over the hall (59-hideout.js);
// in a co-op run the game page -- and so the PeerJS session -- stays alive underneath it. This module is the bridge between the two:
//   * a GUEST who steps through the portal is shown the HOST's room (the host's furniture, sent by the host), can walk it, use the
//     machines with its OWN sludge and bag, but cannot move the furniture (the hideout page enforces that);
//   * everyone inside sees everyone else inside as an avatar with a name tag: each page reports its position (hd:pos, 8/s at most),
//     the host collects them and broadcasts the list (hdpeers) to the guests;
//   * TRADES ride the same bridge: the hideout page's trade window posts hd:trade to us, the host relays it to the other player.
// Messages on the wire (all unique names; the network keeps ONE handler per type, so each is role-aware):
//   guest -> host   hdpos {x,y,z,ry,name,hero}   my place in the hideout          hdout {}  I left the hideout      hdneed {}  send me your layout
//   host -> guests  hdpeers {list}               who is inside and where           hdlayout {placed,host}  the host's furniture (chest contents never sent)
//   both ways       hdtrade {to,msg} / {from,to,msg}   a trade message, relayed by the host
// Between this page and the iframe (postMessage, same origin): iframe -> us  hd:ready hd:pos hd:saved hd:trade;  us -> iframe  hd:me hd:peers hd:layout hd:trade.
// Nothing here runs outside a co-op run: the iframe only speaks when the game opened it with ?coop=host|guest.
(function(){
if(TUTORIAL) return;
const H=window.__hideout, N=window.__net; if(!H||!H.hooks||!N||!N.onMessage) return;
const SAVE_KEY='dd_hideout_save_v2';
const role=()=>N.role?N.role():null, myId=()=>(N.myId&&N.myId())||'me';
const txt=(v,n)=>String(v==null?'':v).slice(0,n), num=v=>{ v=+v; return isFinite(v)?Math.round(v*100)/100:0; };
const heroId=()=>window.__heroes&&window.__heroes.pick?window.__heroes.pick():'';
function myName(){ const el=document.getElementById('lobbyName'); const v=el&&el.value&&el.value.trim(); if(v) return v.slice(0,16);
  const h=window.__heroes&&window.__heroes.list?window.__heroes.list().find(x=>x.id===heroId()):null; return h?String(h.name).replace(/^GNOME /,'').slice(0,16):'Friend'; }
const post=msg=>{ const w=H.frameWin&&H.frameWin(); if(w) try{ w.postMessage(msg,'*'); }catch(e){} };
const PEERS=new Map();   // host side: guest id -> {name,hero,x,y,z,ry,t}
let selfPos=null, lastSig='', wasList=false, lastRole=null, stats={sent:0,layouts:0,trades:0};
// the host's furniture, straight from its hideout save (chest contents are never sent: a chest is private)
function readLayout(){ let s=null; try{ s=JSON.parse(localStorage.getItem(SAVE_KEY)); }catch(e){}
  const placed=s&&Array.isArray(s.placed)?s.placed:[];
  return placed.filter(p=>p&&typeof p.gid==='string'&&isFinite(+p.x)&&isFinite(+p.z)).slice(0,300).map(p=>{ const o={pid:txt(p.pid,60),gid:txt(p.gid,40),x:+p.x,z:+p.z,ry:+p.ry||0}; if(p.y!==undefined&&isFinite(+p.y)) o.y=+p.y; return o; }); }
const layoutMsg=()=>({placed:readLayout(),host:myName()});
function hostLayoutChanged(){ if(role()!=='host'||!N.peers().length) return; const m=layoutMsg(), sig=JSON.stringify(m.placed); if(sig===lastSig) return; lastSig=sig; N.send('hdlayout',m); stats.layouts++; }
function peerList(){ const t=Date.now(), list=[];
  if(H.isOpen()&&selfPos) list.push({id:myId(),name:myName(),hero:heroId(),x:selfPos.x,y:selfPos.y,z:selfPos.z,ry:selfPos.ry});
  PEERS.forEach((p,id)=>{ if(t-p.t>4500){ PEERS.delete(id); return; } list.push({id,name:p.name,hero:p.hero,x:p.x,y:p.y,z:p.z,ry:p.ry}); });
  return list; }
// ---- the network side
N.onMessage('hdpos',(d,from)=>{ if(role()!=='host'||!d) return; PEERS.set(from,{name:txt(d.name,16)||'Friend',hero:txt(d.hero,24),x:num(d.x),y:num(d.y),z:num(d.z),ry:num(d.ry),t:Date.now()}); });
N.onMessage('hdout',(d,from)=>{ if(role()==='host') PEERS.delete(from); });
N.onMessage('hdneed',(d,from)=>{ if(role()==='host'){ N.send('hdlayout',layoutMsg(),from); stats.layouts++; } });
N.onMessage('hdpeers',d=>{ if(role()!=='guest'||!H.isOpen()||!d) return; post({type:'hd:peers',list:Array.isArray(d.list)?d.list.slice(0,4):[]}); });
N.onMessage('hdlayout',d=>{ if(role()!=='guest'||!d||!Array.isArray(d.placed)) return; post({type:'hd:layout',placed:d.placed.slice(0,300),host:txt(d.host,24)}); });
N.onMessage('hdtrade',(d,from)=>{ if(!d||typeof d!=='object') return; stats.trades++;
  if(role()==='host'){ if(d.to===myId()) post({type:'hd:trade',from,msg:d.msg}); else if(d.to) N.send('hdtrade',{from,to:d.to,msg:d.msg},d.to); }
  else if(role()==='guest') post({type:'hd:trade',from:d.from,msg:d.msg}); });
// someone's connection closed: the host forgets a guest; a guest whose host went is pulled out of the hideout (its room is gone)
N.onLeave((id,why)=>{ if(role()==='host'){ PEERS.delete(id); return; }
  if(lastRole==='guest'&&H.isOpen()) setTimeout(()=>{ if(H.isOpen()&&!(N.peers&&N.peers().length)) H.close('The host left — back to the hall'); },0); });
// ---- the iframe side
addEventListener('message',e=>{ const w=H.frameWin&&H.frameWin(); if(!w||e.source!==w) return; const d=e.data; if(!d||typeof d.type!=='string'||d.type.slice(0,3)!=='hd:') return;
  if(d.type==='hd:ready'){ post({type:'hd:me',id:myId(),name:myName(),hero:heroId()}); if(role()==='guest') N.send('hdneed',{}); }
  else if(d.type==='hd:pos'){ selfPos={x:num(d.x),y:num(d.y),z:num(d.z),ry:num(d.ry)}; if(role()==='guest'){ N.send('hdpos',Object.assign({name:myName(),hero:heroId()},selfPos)); stats.sent++; } }
  else if(d.type==='hd:saved'){ hostLayoutChanged(); }
  else if(d.type==='hd:trade'){ if(!d.to||typeof d.to!=='string') return; if(role()==='host') N.send('hdtrade',{from:myId(),to:d.to,msg:d.msg},d.to); else if(role()==='guest') N.send('hdtrade',{to:d.to,msg:d.msg}); } });
H.hooks.close=()=>{ selfPos=null; if(role()==='guest') N.send('hdout',{}); };
// the host broadcasts who is inside, about 8 times a second while anyone is
setInterval(()=>{ const r=role(); if(r) lastRole=r; if(r!=='host'||!N.peers().length){ wasList=false; return; }
  const list=peerList(); if(!list.length){ if(wasList){ wasList=false; N.send('hdpeers',{list:[]}); post({type:'hd:peers',list:[]}); } return; }
  wasList=true; N.send('hdpeers',{list}); if(H.isOpen()) post({type:'hd:peers',list}); },125);
window.__coopHideout={peers:()=>[...PEERS.entries()].map(([id,p])=>Object.assign({id},p)),layout:readLayout,list:peerList,stats:()=>Object.assign({},stats),self:()=>selfPos&&Object.assign({},selfPos),name:myName};
})();
