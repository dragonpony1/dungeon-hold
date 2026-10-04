// ===== WHO PLAYED (build 534). Matt asked whether he could see who played while he was away, and said "sure" to the plan: the game reports a small session record to the
// site's own POST /api/play (rootgate-site/src/worker.js: one SQLite Durable Object; the private page /plays?key=... lists them, co-op games grouped by room).
//   * THE NAME CARD: the first time ever, a small "who's playing?" card on the title -- a name box (24 max), ✓ and SKIP. Saved in dd_player_name (SKIP saves '' -- asked once,
//     reported as no name). The name sits small in the title's top-left corner with a ✎ to change it. Prefilled from the co-op lobby name (ddName) when there is one.
//   * A SESSION: a random 16-character id per page load. 'start' when the run leaves the title (S.phase leaves 'start' -- PLAY, a tutorial/room that starts by itself, a co-op
//     lobby START), 'beat' every 3 minutes while in a run, 'end' on pagehide/beforeunload (sendBeacon, a JSON Blob; the Worker reads req.json(), the type is not checked).
//   * WHAT IS SENT, nothing more: sid, name, map (MAP.name), mode (campaign / survival / tutorial, plus the difficulty when it isn't NORMAL), hero id, the best wave this page
//     reached, the co-op room code + role (host / guest / solo), the build number, the event. No IP or user agent is sent by the game (the server stores none either).
//   * ONLY ON THE REAL SITE: a *.workers.dev host, never a browser a test drives (navigator.webdriver), never with ?silent or ?nolog. Every step is wrapped: it can never throw
//     into the game or hold it up. The card also stays away under webdriver / ?silent (so no suite meets it) unless ?namecard is on the address.
// Test hook: window.__whoplayed.
(function(){
const NKEY='dd_player_name', EP='/api/play', BEAT_MS=180000;
const sid=(()=>{ const A='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_'; let s=''; try{ const b=new Uint8Array(16); crypto.getRandomValues(b); for(const x of b) s+=A[x&63]; }catch(e){ for(let i=0;i<16;i++) s+=A[Math.floor(Math.random()*64)]; } return s; })();
function wouldReport(host,wd,search){ try{ host=String(host||'').toLowerCase(); const q=new URLSearchParams(search||''); if(wd||q.has('silent')||q.has('nolog')) return false; return host==='rootgate.52bulls.workers.dev'||/(^|\.)workers\.dev$/.test(host); }catch(e){ return false; } }
let live=wouldReport(location.hostname,!!navigator.webdriver,location.search), started=false, ended=false, endedAt=0, best=0, beatT=0;
const cnt={ sent:0, failed:0, beacons:0 };
function getName(){ try{ const v=localStorage.getItem(NKEY); return v==null?null:String(v).slice(0,24); }catch(e){ return null; } }
function setName(v){ v=String(v==null?'':v).replace(/[\u0000-\u001f]/g,'').trim().slice(0,24); try{ localStorage.setItem(NKEY,v); }catch(e){} paintChip(); return v; }
function netRole(){ try{ const n=window.__net; const r=n&&n.role&&n.role(); return r==='host'||r==='guest'?r:'solo'; }catch(e){ return 'solo'; } }
function netRoom(){ try{ const n=window.__net, r=netRole(); if(r==='host') return String(n.myId()||'').slice(0,40); if(r==='guest') return String(n.hostId()||'').slice(0,40); }catch(e){} return ''; }
function mode(){ let m='campaign'; try{ m=TUTORIAL?'tutorial':SURVIVAL?'survival':'campaign'; const d=window.__difficulty&&window.__difficulty.id&&window.__difficulty.id(); if(d&&d!=='normal') m+=' '+d; }catch(e){} return m.slice(0,20); }
function hero(){ try{ return String((window.__heroes&&window.__heroes.pick&&window.__heroes.pick())||'').slice(0,12); }catch(e){ return ''; } }
function payload(ev){ try{ best=Math.max(best,S.wave|0); }catch(e){}
  let map=''; try{ map=String(MAP.name||MAP.id||'').slice(0,40); }catch(e){}
  return { sid, name:getName()||'', map, mode:mode(), hero:hero(), wave:best, room:netRoom(), role:netRole(), ver:String(BUILD).slice(0,10), ev }; }
function post(ev){ if(!live) return false; try{ const body=JSON.stringify(payload(ev)); cnt.sent++;
    fetch(EP,{ method:'POST', headers:{'Content-Type':'application/json'}, body, keepalive:true, credentials:'omit', cache:'no-store' }).catch(()=>{ cnt.failed++; }); return true; }catch(e){ cnt.failed++; return false; } }
function beacon(){ if(!live||!started||ended) return false; ended=true; endedAt=Date.now(); try{ const body=JSON.stringify(payload('end')); cnt.sent++; cnt.beacons++;
    let ok=false; try{ ok=!!(navigator.sendBeacon&&navigator.sendBeacon(EP,new Blob([body],{type:'application/json'}))); }catch(e){}
    if(!ok) fetch(EP,{ method:'POST', headers:{'Content-Type':'application/json'}, body, keepalive:true, credentials:'omit' }).catch(()=>{});
    return true; }catch(e){ return false; } }
function inRun(){ try{ return S.phase!=='start'&&S.phase!=='dead'; }catch(e){ return false; } }
function beat(){ if(!started||ended||!inRun()) return false; beatT=Date.now(); return post('beat'); }
// the run starts the moment S.phase leaves 'start', whichever path took it there
setInterval(()=>{ try{ best=Math.max(best,S.wave|0); if(!started&&S.phase!=='start'){ started=true; beatT=Date.now(); closeCard(); post('start'); }
    else if(started&&Date.now()-beatT>=BEAT_MS) beat();
    if(ended&&Date.now()-endedAt>15000){ ended=false; beat(); } }catch(e){} },500);   // an unload that was called off (the page is plainly still here 15 s on): the session carries on
addEventListener('pagehide',()=>{ try{ beacon(); }catch(e){} });
addEventListener('beforeunload',()=>{ try{ beacon(); }catch(e){} });
addEventListener('pageshow',e=>{ try{ if(e.persisted&&started&&ended){ ended=false; beat(); } }catch(er){} });   // back from the browser's page cache: the session carries on

// ---- the name card + the title-corner chip
const SHOWCARD=Q.has('namecard')||!(navigator.webdriver||SILENT);
const st=document.createElement('style'); st.textContent=
 '#whoCard{position:fixed;inset:0;z-index:13;display:flex;align-items:center;justify-content:center;background:#0b0712e6;padding:16px}#whoCard.hide{display:none}'
+'#whoCard .wcBox{display:flex;flex-direction:column;align-items:center;gap:12px;width:min(380px,92vw);background:linear-gradient(#251a30,#140e1a);border:3px solid #6b5a3c;border-radius:14px;padding:20px 18px 16px;box-shadow:0 8px 40px #000,0 0 0 1px #000,inset 0 0 0 1px #e8b94a33}'
+'#whoCard .wcIc{font-size:44px;line-height:1;filter:drop-shadow(0 3px 0 #000)}'
+'#whoCard h2{margin:0;color:var(--gold,#e8b94a);font:bold 22px Georgia,serif;letter-spacing:4px;text-shadow:0 0 18px #e8b94a44,0 3px 0 #000}'
+'#whoCard input{background:#1c1424;border:2px solid #6b5a3c;border-radius:10px;color:#fff;font:18px Georgia,serif;padding:10px 14px;text-align:center;letter-spacing:1px;width:min(260px,80vw)}#whoCard input:focus{outline:none;border-color:var(--gold,#e8b94a)}'
+'#whoCard .wcRow{display:flex;gap:12px;align-items:center;margin-top:2px}#whoCard .big{margin-top:0;font-size:18px;padding:10px 26px}#whoCard .big.alt{margin-top:0;font-size:14px;padding:8px 16px}'
+'#whoChip{position:absolute;top:10px;left:12px;z-index:2;background:linear-gradient(#2a1f33,#160f1c);border:2px solid #6b5a3c;border-radius:999px;color:#f1e6d0;font:bold 13px Georgia,serif;letter-spacing:1px;padding:6px 12px;cursor:pointer;box-shadow:0 2px 0 #000;max-width:46vw;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}'
+'#whoChip:hover{border-color:var(--gold,#e8b94a);color:#fff}#whoChip .pen{color:var(--gold,#e8b94a);margin-left:6px}body.tutorial #whoChip,#whoChip.away{display:none}'
+'@media (max-width:520px){#whoChip{top:5px;left:6px;padding:5px 9px;font-size:11px}}';
document.head.appendChild(st);
let card=null, inp=null, chip=null;
function buildCard(){ if(card) return card; card=document.createElement('div'); card.id='whoCard'; card.className='hide';
  card.innerHTML='<div class="wcBox"><div class="wcIc">🧙</div><h2>WHO\'S PLAYING?</h2><input id="whoName" maxlength="24" autocomplete="nickname" spellcheck="false" placeholder="✎ your name"><div class="wcRow"><button class="big" id="whoOk" type="button">✓ OK</button><button class="big alt" id="whoSkip" type="button">SKIP ✕</button></div></div>';
  (document.getElementById('start')||document.body).appendChild(card); inp=card.querySelector('#whoName');
  card.querySelector('#whoOk').addEventListener('click',e=>{ e.stopPropagation(); setName(inp.value); closeCard(); });
  card.querySelector('#whoSkip').addEventListener('click',e=>{ e.stopPropagation(); if(getName()==null) setName(''); closeCard(); });   // SKIP never wipes a name already chosen (the ✎ re-open)
  card.addEventListener('pointerdown',e=>e.stopPropagation()); card.addEventListener('click',e=>e.stopPropagation());
  return card; }
function cardOpen(){ return !!card&&!card.classList.contains('hide'); }
function openCard(){ try{ if(S.phase!=='start') return false; buildCard(); let v=getName(); if(v==null){ try{ v=(localStorage.getItem('ddName')||''); }catch(e){ v=''; } } inp.value=String(v||'').slice(0,24);
    card.classList.remove('hide'); setTimeout(()=>{ try{ inp.focus(); inp.select(); }catch(e){} },30); return true; }catch(e){ return false; } }
function closeCard(){ try{ if(card) card.classList.add('hide'); if(inp) inp.blur(); }catch(e){} }
// while the card is up, keys belong to it: the title's Enter/Space (PLAY), B/I (the bag), H and the rest never see them. Registered on window in the capture phase, ahead of every later module's.
addEventListener('keydown',e=>{ if(!cardOpen()) return; e.stopImmediatePropagation();
  if(e.code==='Enter'||e.code==='NumpadEnter'){ e.preventDefault(); setName(inp.value); closeCard(); }
  else if(e.code==='Escape'){ e.preventDefault(); if(getName()==null) setName(''); closeCard(); }
  else if(document.activeElement!==inp&&e.key&&e.key.length===1){ try{ inp.focus(); }catch(er){} } },true);
addEventListener('keyup',e=>{ if(cardOpen()) e.stopImmediatePropagation(); },true);
// the chip shares the title's top-left corner with the file counter (11-loadbar.js, title mode): it steps aside while that is showing
setInterval(()=>{ try{ if(!chip) return; const lc=window.__loadctr, busy=!!(lc&&lc.visible&&lc.visible()); if(chip.classList.contains('away')!==busy) chip.classList.toggle('away',busy); }catch(e){} },400);
function paintChip(){ try{ if(!chip) return; const n=getName(); chip.textContent=''; const a=document.createElement('span'); a.textContent='👤 '+(n||'?'); const p=document.createElement('span'); p.className='pen'; p.textContent='✎'; chip.appendChild(a); chip.appendChild(p); chip.title=n?'playing as '+n+' — tap to change':'tap to add your name'; }catch(e){} }
try{ const start=document.getElementById('start'); if(start){ chip=document.createElement('button'); chip.id='whoChip'; chip.type='button'; paintChip();
    chip.addEventListener('click',e=>{ e.stopPropagation(); openCard(); }); start.appendChild(chip); } }catch(e){}
// first time ever: up once the title is there (after the loading screen, if one stands over it)
if(SHOWCARD&&getName()==null&&!TUTORIAL){ const t0=performance.now(); const iv=setInterval(()=>{ try{ if(S.phase!=='start'||performance.now()-t0>120000){ clearInterval(iv); return; }
    const ls=window.__loadscreen; if(ls&&ls.on&&ls.on()) return; clearInterval(iv); if(getName()==null) openCard(); }catch(e){ clearInterval(iv); } },250); }

window.__whoplayed={ sid:()=>sid, live:()=>live, forceLive:on=>{ live=!!on; return live; }, wouldReport, payload, beatNow:beat, endNow:beacon, started:()=>started, best:()=>best,
  name:getName, setName, open:openCard, close:closeCard, isOpen:cardOpen, counts:()=>Object.assign({},cnt) };
})();
