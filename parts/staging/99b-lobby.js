// ===== THE LOBBY (co-op phase 14). "maybe we need a lobby, its a little clunky to wait until everyone is [in]. besides we could
// wait in the lobby until theres a green light the room is loaded, would work great for bigger maps like 2." Until now HOST A GAME
// put up a room code and a bare ENTER THE HALL, and a guest dropped into the hall the instant the connection opened -- often still
// loading, and on whatever map their OWN page had loaded (nothing synced the map at all; a guest on another map than the host's
// just silently broke). Now everyone waits in a lobby on the title screen first: one row per player (host first, your own row
// marked) with the hero they picked and a light -- amber "loading 7 s" while their room is still coming down, green "ready 4.2 s"
// once their LOADT.soon is set (game.js's build-142 load timer: the room, and what building and the first wave need, are in), and a
// small "✓ all" once everything else has streamed in too. The host's START counts the green lights and stays shut until every
// row is green (after 45 s a small "start without waiting" appears, in case someone is stuck); START is one message, and every
// page in the lobby calls play() on it together. The host is the authority: a guest sends only its own status ('lobbyMe'), the
// host keeps the roster and sends it to everyone ('lobby'); everything a peer sent is clamped on arrival and escaped before it
// touches innerHTML. The host's map index rides along with the roster -- a guest on another map says "Moving to <map>…" and
// reloads onto it with ?coopmap=N&coopjoin=CODE (the one pair game.js's MAPI line lets past this player's own unlock gate), and
// this module strips both from the address bar the moment the page has read them and rejoins the room by itself; the host holds
// that row (still amber, START still shut) while it moves. A page that followed a host past its own gate goes back to its own map
// the moment it stops following one, so co-op never becomes a way round the campaign's locks. Someone who arrives after START goes
// straight in as soon as their own room has loaded. None of this runs unless HOST A GAME or JOIN A FRIEND was used: the solo ENTER
// THE HALL is untouched, and pages driven through window.__net directly (the older co-op suites) never see a lobby message.
// Loads after 99-network.js (file order) and touches the network only through its public window.__net surface.
(function(){
const N=window.__net;
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const txt=(v,n)=>typeof v==='string'?v.slice(0,n):'';                                                       // peer text: strings only, clamped
const msv=v=>typeof v==='number'&&Number.isFinite(v)&&v>=0&&v<864e5?Math.round(v):null;                      // a peer's load time (ms): sane, or nothing
const int=(v,lo,hi)=>Number.isInteger(v)&&v>=lo&&v<=hi?v:-1;
const WAIT_MS=+Q.get('lobbywait')||45000;   // how long before the host is offered "start without waiting" (?lobbywait= is a test-only override, the same idiom as ?jointimeout)
const MOVE_MS=1200, NOLOBBY_MS=8000, GHOST_MS=180000, MAXROWS=8;   // GHOST_MS: how long the host holds the row of a guest reloading onto its map (a phone parsing the big throne room can take a while)
let HOLD=Q.has('lobbyhold');   // test-only: this page reports itself still loading until window.__lobby.release() -- a deterministic slow guest for lobby-test.mjs (a held network isn't: the load tiers give up waiting after 40 s). In play the light is LOADT.soon, nothing else
const soonMs=()=>HOLD?null:LOADT.soon;
const gated=MAPI>MAPS_CLEARED;   // this page is past this player's own unlock gate -- only possible when it followed a host here (game.js's coopmap)
const store=(k,v)=>{ try{ if(v==null) sessionStorage.removeItem(k); else sessionStorage.setItem(k,v); }catch(e){} }, recall=k=>{ try{ return sessionStorage.getItem(k); }catch(e){ return null; } };
const SEAT=(()=>{ let s=recall('ddLobbySeat'); if(!/^[a-z0-9]{8}$/.test(s||'')){ s=(Math.random().toString(36).slice(2)+'00000000').slice(0,8); store('ddLobbySeat',s); } return s; })();   // this tab's seat: it survives the reload onto the host's map, so the host knows the row that comes back is the one that left
// phase: 'off' no lobby · 'lobby' waiting in it · 'moving' reloading onto the host's map · 'waiting' the game started, in as soon as this room is loaded · 'in' in the hall
const L={phase:'off',role:null,code:'',openedAt:0,joinedAt:0,started:false,hostMap:-1,hostMapName:'',hostBuild:-1,roster:[],gotState:0,sentJ:'',sentAt:0,bcastAt:0,bcastJ:'',movedFrom:null,rowsHTML:'',err:''};
const R=new Map();   // host only: the roster, peer id -> row (insertion order is join order; the host's own row is always listed first)
const el={panel:$('lobbyPanel'),map:$('lobbyMap'),roster:$('lobbyRoster'),name:$('lobbyName'),start:$('lobbyStart'),force:$('lobbyForce'),enter:$('lobbyEnter'),msg:$('lobbyMsg'),leave:$('lobbyLeave'),note:$('coopMsg')};
function setText(e,t){ if(e&&e.textContent!==t) e.textContent=t; }
function show(e,on){ if(e) e.classList.toggle('hide',!on); }
function note(t){ setText(el.note,t||''); }
// ---- your name, optional: three fresh players are all Gnome Knights (70-hero2.js), so the hero alone can't tell the rows apart
try{ el.name.value=(localStorage.getItem('ddName')||'').slice(0,16); }catch(e){}
el.name.addEventListener('keydown',e=>{ e.stopPropagation(); if(e.key==='Enter'){ e.preventDefault(); el.name.blur(); } });   // game.js's own keys (Enter/Space -> play(), I/B -> the tavern) must not fire while typing a name -- the same guard as the join code's input
el.name.addEventListener('input',()=>{ try{ localStorage.setItem('ddName',el.name.value.slice(0,16)); }catch(e){} tick(); });
const myName=()=>el.name.value.trim().slice(0,16);
// ---- a player's status: what this page reports about itself, and the same shape clamped when it arrives from a peer
function mine(){ return {hero:window.__heroes.pick(),name:myName(),seat:SEAT,first:LOADT.first,soon:soonMs(),all:HOLD?null:LOADT.all,t:Math.round(performance.now()),map:MAPI,build:BUILD,moving:L.phase==='moving',inHall:S.phase!=='start'}; }
function clean(d,id,host){ d=d&&typeof d==='object'&&!Array.isArray(d)?d:{}; return {id:txt(id,40),host:!!host,hero:txt(d.hero,24),name:txt(d.name,16),seat:/^[a-z0-9]{8}$/.test(d.seat)?d.seat:'',first:msv(d.first),soon:msv(d.soon),all:msv(d.all),t:msv(d.t)||0,map:int(d.map,0,99),build:int(d.build,0,1e6),moving:!!d.moving,inHall:!!d.inHall,ghost:!!d.ghost}; }
const lobbyMap=()=>L.role==='host'?MAPI:L.hostMap, lobbyMapName=()=>L.role==='host'?MAP.name:L.hostMapName;
const isReady=e=>!e.ghost&&!e.moving&&(e.inHall||(e.soon!==null&&e.map===lobbyMap()));   // green: the room and what the first wave needs are in, on the lobby's own map
// ---- host: keeps the roster, answers every status with the whole lobby, and sends it out whenever it changes
function hostSelf(){ const id=N.myId()||L.code; R.set(id,clean(mine(),id,true)); }
function rosterList(){ const a=[...R.values()]; return a.filter(e=>e.host).concat(a.filter(e=>!e.host)).slice(0,MAXROWS); }
function stateMsg(){ return {code:L.code,map:MAPI,mapName:MAP.name,build:BUILD,started:L.started,roster:rosterList().map(e=>Object.assign(clean(e,e.id,e.host),{seat:''}))}; }   // seats stay with the host: a guest has no business with anyone else's
function hostBroadcast(force){ if(L.role!=='host') return; const m=stateMsg(), j=JSON.stringify(m), now=Date.now();
  if(!force&&(j===L.bcastJ?now-L.bcastAt<3000:now-L.bcastAt<900)) return; L.bcastJ=j; L.bcastAt=now; N.send('lobby',m); }
N.onMessage('lobbyMe',(d,from)=>{ if(L.role!=='host'||typeof from!=='string') return;
  const had=R.get(from); if(!had&&R.size>=MAXROWS) return;
  const e=clean(d,from,false); e.joinedAt=had?had.joinedAt:Date.now();
  if(e.seat) [...R.keys()].forEach(k=>{ const g=R.get(k); if(k!==from&&!g.host&&g.seat===e.seat) R.delete(k); });   // the same tab back from its reload onto this map (or a stale row of it): one row per seat
  R.set(from,e); N.send('lobby',stateMsg(),from); hostBroadcast(!had); if(!had) render(); });
function dropGuest(id){ if(L.role!=='host') return; const e=R.get(id); if(!e||e.host) return; R.delete(id);
  if(e.moving&&e.seat) R.set('seat:'+e.seat,Object.assign({},e,{id:'seat:'+e.seat,ghost:true,until:Date.now()+GHOST_MS}));   // it left to reload onto this map: hold its row (amber, START shut) until it rejoins, or GHOST_MS passes
  hostBroadcast(true); render(); }
function start(force){ if(L.role!=='host'||L.started) return false; const rows=rosterList(); if(!force&&!(rows.length&&rows.every(isReady))) return false;
  L.started=true; L.phase='in'; N.send('lobbyStart',{map:MAPI}); hostSelf(); hostBroadcast(true); render(); if(S.phase==='start') play(); return true; }
// ---- guest: reports itself, follows the host's map, and goes in on START (or, arriving late, once its own room is loaded)
function sendMine(force){ if(L.role!=='guest') return; const m=mine(), j=JSON.stringify(Object.assign({},m,{t:0})), now=Date.now();
  if(!force&&j===L.sentJ&&now-L.sentAt<(m.soon===null?1000:3000)) return; L.sentJ=j; L.sentAt=now; N.send('lobbyMe',m); }
N.onMessage('lobby',(d,from)=>{ if(L.role!=='guest'||from!==L.code||!(L.phase==='lobby'||L.phase==='waiting')||!d||typeof d!=='object') return;
  const map=int(d.map,0,99); if(map<0) return;
  L.gotState=Date.now(); L.hostMap=map; L.hostMapName=txt(d.mapName,40); L.hostBuild=int(d.build,0,1e6); if(d.started) L.started=true;
  L.roster=(Array.isArray(d.roster)?d.roster:[]).slice(0,MAXROWS).map(r=>clean(r,r&&r.id,r&&r.host));
  if(map!==MAPI){ moveTo(map); return; }
  if(L.started&&L.phase==='lobby') L.phase='waiting';
  tryEnter(); render(); });
N.onMessage('lobbyStart',(d,from)=>{ if(L.role!=='guest'||from!==L.code||L.phase!=='lobby') return; L.started=true; L.phase='waiting'; tryEnter(); render(); });
function tryEnter(force){ if(L.role!=='guest'||L.phase!=='waiting'&&!(force&&L.phase==='lobby')) return; if(!force&&(soonMs()===null||MAPI!==L.hostMap)) return;
  L.phase='in'; render(); if(S.phase==='start') play(); sendMine(true); }
const RJ=txt(Q.get('coopjoin'),40), RJMAP=parseInt(Q.get('coopmap'));   // this page came here to rejoin a room (Q is the address as loaded, before the strip below)
function moveTo(map){ if(L.phase==='moving') return;
  if(map>=MAPS.length){ L.err="The host is on a map this build doesn't have yet — press ↻ update below, then join again."; render(); return; }
  if(RJ&&RJMAP===map){ L.err="Couldn't move to the host's map."; render(); return; }   // never a reload loop: this page already came here for that map
  L.phase='moving'; store('ddLobbyMoved',JSON.stringify({from:MAPI,to:map})); sendMine(true); render();
  const q=new URLSearchParams(location.search); q.set('coopmap',String(map)); q.set('coopjoin',L.code);
  setTimeout(()=>{ location.href=location.pathname+'?'+q.toString()+location.hash; },MOVE_MS); }   // long enough to read "Moving to…", and for the host to hear this row is moving
function goHome(){ const q=new URLSearchParams(location.search); q.delete('coopmap'); q.delete('coopjoin'); location.href=location.pathname+(q.toString()?'?'+q.toString():'')+location.hash; }
// ---- both: open, leave, and the host leaving
function openHost(code){ R.clear(); Object.assign(L,{phase:'lobby',role:'host',code:String(code),openedAt:Date.now(),started:false,rowsHTML:'',bcastJ:'',bcastAt:0}); hostSelf(); enterUI(true); hostBroadcast(true); render(); }
function openGuest(code){ if(L.role==='guest'&&L.phase!=='off') return;   // PeerJS can report the same connection opening twice
  Object.assign(L,{phase:'lobby',role:'guest',code:N.hostId()||String(code||''),openedAt:Date.now(),joinedAt:Date.now(),started:false,gotState:0,roster:[],hostMap:-1,hostMapName:'',sentJ:'',rowsHTML:'',err:''}); enterUI(false); sendMine(true); render(); }
function enterUI(host){ $('start').classList.add('inLobby'); show($('coopRow'),false); show($('joinPanel'),false); show($('hostPanel'),host); show(el.panel,true); note(''); setText(el.msg,''); }
function exit(why){ const wasGated=gated&&L.role==='guest';
  Object.assign(L,{phase:'off',role:null,started:false,roster:[],gotState:0,rowsHTML:''}); R.clear();   // phase off FIRST: leave() below closes the connections, and those close events must not read as "the host left"
  try{ N.leave(); }catch(e){}
  $('start').classList.remove('inLobby'); show(el.panel,false); show($('hostPanel'),false); show($('joinPanel'),false); show($('coopRow'),true); el.roster.innerHTML='';
  if(wasGated){ store('ddLobbyNote',(why?why+' ':'')+'Back on your own map.'); note((why?why+' ':'')+'Back to your own map…'); setTimeout(goHome,700); return; }   // this page only had the host's map to follow the host: without one, back to this player's own
  note(why||''); }
function hostGone(){ if(L.role!=='guest'||!(L.phase==='lobby'||L.phase==='waiting')) return; exit('The host left — the lobby closed.'); }
N.onLeave(id=>{ if(L.role==='host') dropGuest(id); else if(id===L.code) hostGone(); });
N.onMessage('lobbyBye',(d,from)=>{ if(L.role==='host') dropGuest(from); else if(from===L.code) hostGone(); });
function leave(){ if(L.phase==='off') return; try{ N.send('lobbyBye',{}); }catch(e){} exit(''); }
addEventListener('pagehide',()=>{ if(L.role&&(L.phase==='lobby'||L.phase==='waiting')) try{ N.send('lobbyBye',{}); }catch(e){} });   // a closed or reloaded tab says goodbye itself; a MOVING one doesn't, so the host holds its row
el.leave.addEventListener('click',leave);
el.start.addEventListener('click',()=>start(false));
el.force.addEventListener('click',()=>start(true));
el.enter.addEventListener('click',()=>tryEnter(true));
// ---- nothing else starts a lobby player's game: the solo ENTER THE HALL (hidden in the lobby, but the tavern's own "defend" clicks
// it) and game.js's Enter/Space-on-the-title both wait for START -- and a page that followed a host past its own gate never plays it solo
const blocked=()=>S.phase==='start'&&((L.phase!=='off'&&L.phase!=='in')||gated);
$('start').addEventListener('click',e=>{ if(!e.target.closest||!e.target.closest('#playbtn')||!blocked()) return; e.stopPropagation(); e.preventDefault();
  if(L.role==='host'&&!start(false)) setText(el.msg,'START opens when every light is green'); },true);
addEventListener('keydown',e=>{ if(!(e.code==='Enter'||e.code==='Space')||!blocked()) return; const t=e.target&&e.target.tagName; if(t==='INPUT'||t==='TEXTAREA') return; e.stopImmediatePropagation(); if(t!=='BUTTON') e.preventDefault(); },true);   /* inputs guard themselves; a focused button (START, say) still activates, it just never reaches game.js's play() */
// ---- the roster, drawn the same way on every page
const heroOf=id=>window.__heroes.list().find(h=>h.id===id)||null;
function light(e){ const mn=lobbyMapName();
  if(e.ghost||e.moving) return ['amber','moving to '+(mn||'the map')];
  if(e.inHall) return ['green','in the hall'];
  if(e.map!==lobbyMap()) return ['amber','joining…'];
  if(e.soon!==null) return ['green','ready '+fmtS(e.soon)];
  return ['amber','loading '+Math.round(e.t/1000)+' s']; }
function rowHTML(e,i){ const me=e.id===N.myId()&&!e.ghost, h=heroOf(e.hero), lt=light(e), who=e.name||(e.host?'Host':'Player '+(i+1));
  return '<div class="lbRow'+(me?' me':'')+'" data-id="'+esc(e.id)+'" data-state="'+lt[0]+'">'+(h?'<img src="'+esc(ASSET('hero-'+h.id+'.png'))+'" alt="">':'<span class="lbImg">?</span>')
    +'<div class="lbWho"><b>'+esc(who)+(e.host&&e.name?' <small>· host</small>':'')+(me?' <small>(you)</small>':'')+'</b><span>'+esc(h?h.name:(e.hero||'no hero yet'))+(e.build>=0&&e.build!==BUILD?' · <em>build '+e.build+'</em>':'')+'</span></div>'
    +'<div class="lbLight '+lt[0]+'"><i></i><span>'+esc(lt[1])+'</span>'+(lt[0]==='green'&&!e.inHall&&e.all!==null?'<small title="everything loaded in '+esc(fmtS(e.all))+'">✓ all</small>':'')+'</div></div>'; }
function rows(){ if(L.role==='host') return rosterList();
  const my=N.myId(), me=r=>Object.assign(clean(mine(),r.id,r.host)), a=L.roster.map(r=>r.id===my?me(r):r);   // this page's own row from its own live status, not the host's second-hand copy of it
  if(L.gotState&&my&&!a.some(r=>r.id===my)) a.push(clean(mine(),my,false)); return a; }
function render(){ if(L.phase==='off') return; const host=L.role==='host', guest=L.role==='guest', rs=rows(), n=rs.length, r=rs.filter(isReady).length;
  const html=rs.map(rowHTML).join('')||'<p class="netMsg">Joining the host\'s lobby…</p>'; if(html!==L.rowsHTML){ L.rowsHTML=html; el.roster.innerHTML=html; }
  const mn=lobbyMapName(); setText(el.map,(host?'':'ROOM '+L.code+(mn?' · ':''))+(mn?'MAP '+(lobbyMap()+1)+' · '+mn:'')+(L.movedFrom!==null&&guest?' (you were moved here from map '+(L.movedFrom+1)+')':''));
  show(el.start,host&&!L.started); el.start.disabled=!(n&&r===n); setText(el.start,'▶ START · '+r+'/'+n+' ready');
  show(el.force,host&&!L.started&&r<n&&Date.now()-L.openedAt>=WAIT_MS);
  const noLobby=guest&&L.phase==='lobby'&&!L.gotState&&Date.now()-L.joinedAt>NOLOBBY_MS;
  show(el.enter,guest&&(L.phase==='waiting'||noLobby));
  let m='';
  if(host) m=L.started?'The game is on.':r<n?'START opens when every light is green.':'Everyone is ready.';
  else if(L.err) m=L.err;
  else if(L.phase==='moving') m='Moving to '+(mn||"the host's map")+'…';
  else if(L.phase==='waiting') m="The game has started — you'll go in as soon as your room is loaded.";
  else if(noLobby) m="No lobby from the host (an older build?) — you can go in anyway.";
  else if(L.gotState) m='Waiting for the host to start…'+(L.hostBuild>=0&&L.hostBuild!==BUILD?' (the host is on build '+L.hostBuild+', you on '+BUILD+')':'');
  else m="Joining the host's lobby…";
  setText(el.msg,m); }
// ---- the heartbeat: statuses out, the roster in, lights redrawn -- a timer rather than the frame loop, which stops in a background tab
function tick(){ if(L.phase==='off') return;
  if(L.role==='host'){ hostSelf(); const now=Date.now(); [...R.keys()].forEach(k=>{ const g=R.get(k); if(g.ghost&&now>g.until) R.delete(k); });
    if(!L.started&&S.phase!=='start'){ start(true); return; }   // got into the hall some other way (a test's __dd.start(), say): that IS the start, so nobody is left behind in the lobby
    if(!L.started) hostBroadcast(false); }
  else if(L.role==='guest'){ if(L.phase==='in') return; if(L.phase!=='moving'&&S.phase!=='start'){ L.phase='in'; sendMine(true); return; } if(L.phase!=='moving') sendMine(false); tryEnter(); }
  render(); }
setInterval(tick,500);
// ---- a page that reloaded onto its host's map: read the pair, strip it, rejoin the room through the real join flow
if(gated){ $('start').classList.add('coopPage');   // no solo play and no hosting on a map this player hasn't unlocked; if the rejoin fails, the way out is back home
  const b=document.createElement('button'); b.className='lbLink'; b.id='coopHome'; b.textContent='↩ back to your own map'; b.addEventListener('click',goHome); $('joinPanel').appendChild(b); }
if(RJ){ const q=new URLSearchParams(location.search); q.delete('coopjoin'); q.delete('coopmap'); try{ history.replaceState(history.state,'',location.pathname+(q.toString()?'?'+q.toString():'')+location.hash); }catch(e){}
  try{ const m=JSON.parse(recall('ddLobbyMoved')||'null'); if(m&&m.to===MAPI&&Number.isInteger(m.from)) L.movedFrom=m.from; }catch(e){} store('ddLobbyMoved',null);
  setTimeout(()=>{ if(!N.role()&&N.uiJoin) N.uiJoin(RJ); },0); }
{ const n=recall('ddLobbyNote'); if(n){ store('ddLobbyNote',null); note(n); } }
function release(){ HOLD=false; const q=new URLSearchParams(location.search); if(q.has('lobbyhold')){ q.delete('lobbyhold'); try{ history.replaceState(history.state,'',location.pathname+(q.toString()?'?'+q.toString():'')+location.hash); }catch(e){} } tick(); }   // (the test hook's other half: a later reload is unheld)
window.__lobby={ openHost, openGuest, start:()=>start(false), forceStart:()=>start(true), leave, tick, release,
  state:()=>({phase:L.phase,role:L.role,code:L.code,started:L.started,map:MAPI,lobbyMap:L.phase==='off'?-1:lobbyMap(),lobbyMapName:L.phase==='off'?'':lobbyMapName(),movedFrom:L.movedFrom,ready:soonMs()!==null,held:HOLD,gated,seat:SEAT,startLabel:el.start.textContent,startDisabled:el.start.disabled,msg:el.msg.textContent,note:el.note.textContent}),
  roster:()=>[...el.roster.querySelectorAll('.lbRow')].map(r=>({id:r.dataset.id,light:r.dataset.state,me:r.classList.contains('me'),who:(r.querySelector('.lbWho b')||{}).textContent||'',hero:(r.querySelector('.lbWho span')||{}).textContent||'',status:(r.querySelector('.lbLight')||{}).textContent||'',img:(r.querySelector('img')||{}).getAttribute?r.querySelector('img').getAttribute('src'):null})),
  rows:()=>rows().map(e=>Object.assign({},e,{ready:isReady(e)})) };   // a test hook: what the panel shows (roster) and what it was drawn from (rows)
})();
