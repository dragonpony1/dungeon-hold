// ===== DIFFICULTY LEVELS (build 415). OJ's reminder, Matt: "I agree" to the plan -- EASY · NORMAL · HARD · NIGHTMARE, picked on the title under the mode row. NORMAL is the game as it was.
// Matt's rule holds (dungeon-hold.md build 294): harder is MORE mobs, never faster ones.
//               mobs   health  damage   gold   loot
//   EASY        0.7x   0.8x    0.8x     0.85x  a little worse (1 roll in 5 keeps the poorer of two)
//   NORMAL      1x     1x      1x       1x     as ever
//   HARD        1.4x   1.2x    1.1x     1.25x  better (1 roll in 4 keeps the better of two), mythic / named drops x1.3
//   NIGHTMARE   1.8x   1.5x    1.25x    1.6x   better still (1 in 2), mythic / named drops x1.8
//  * MORE MOBS, STEADIER: a wave's extra mobs are copies of its ordinary ones (goblins, orcs, archers, troll archers, ogres, drakes, wolves -- never a boss, a cart or a set-piece mob) spread evenly over the
//    wave's own span, not dropped on top of its opening rush -- so a NIGHTMARE Cloister wave (~200) comes on steadily. EASY drops ordinary mobs the same way. The Deep Prison's final stand keeps its own 300.
//  * Health and damage on every mob as it spawns (bosses too). Speed never.
//  * Gold: a wave held and a run's payout (10-meta.js addGold reads goldK for 'wave' and 'run'); selling, the forge, refunds untouched.
//  * CO-OP: the host's level goes to every guest with the world (99-network.js), and the row is shut on a page following a host.
//  * Each map's best: the hardest level it has been held on (dd_diff_best {mapId: 0..3}), shown on the row as a medal.
// Remembered in dd_difficulty. Test hook: window.__difficulty.
(function(){
'use strict';
const LEVELS=[
  { id:'easy',      name:'EASY',      ic:'🌱', col:'#8ef05a', mobs:.7, hp:.8, dmg:.8,  gold:.85, better:-.2,  myth:1 },
  { id:'normal',    name:'NORMAL',    ic:'⚔',  col:'#e8d29a', mobs:1,  hp:1,  dmg:1,   gold:1,   better:0,    myth:1 },
  { id:'hard',      name:'HARD',      ic:'🔥', col:'#ff9a4a', mobs:1.4,hp:1.2,dmg:1.1, gold:1.25,better:.25,  myth:1.3 },
  { id:'nightmare', name:'NIGHTMARE', ic:'☠',  col:'#ff4a6a', mobs:1.8,hp:1.5,dmg:1.25,gold:1.6, better:.5,   myth:1.8 } ];
const KEY='dd_difficulty', BKEY='dd_diff_best';
let cur=1; try{ const v=localStorage.getItem(KEY); const i=LEVELS.findIndex(l=>l.id===v); if(i>=0) cur=i; }catch(e){}
const L=()=>LEVELS[cur];
const cnt={ added:0, dropped:0, boosted:0, waves:0 };
const isGuest=()=>!!(window.__net&&window.__net.role&&window.__net.role()==='guest');
// ---- more (or fewer) mobs, spread over the wave
const COMMON=new Set(['goblin','orc','archer','troll','ogre','drake','direwolf']);
{ const prev=waveComp; waveComp=function(w){ const c=prev.apply(this,arguments); const k=L().mobs; if(TUTORIAL||k===1||!c||!Array.isArray(c.q)||!c.q.length) return c;
    if(window.__finalstand&&window.__finalstand.isFinal&&window.__finalstand.isFinal(w)) return c;   // the prison's last stand is its own fixed 300
    const plain=c.q.filter(q=>COMMON.has(q.kind)); if(!plain.length) return c;
    let q=c.q.slice(); const ts=q.map(x=>+x.t||0), t0=Math.min(...ts), t1=Math.max(...ts), span=Math.max(4,t1-t0);
    if(k>1){ const n=Math.round(plain.length*(k-1)); for(let i=0;i<n;i++){ const src=plain[(rnd()*plain.length)|0]; const t=+(t0+span*((i+.5)/n)+(rnd()-.5)*.6).toFixed(3); q.push(Object.assign({},src,{t:Math.max(t0,t)})); } cnt.added+=n; }
    else { const n=Math.round(plain.length*(1-k)); const drop=new Set(); let tries=0; while(drop.size<n&&tries<n*20){ tries++; const src=plain[(rnd()*plain.length)|0]; drop.add(src); } q=q.filter(x=>!drop.has(x)); cnt.dropped+=drop.size; }
    q.sort((a,b)=>(+a.t||0)-(+b.t||0)); cnt.waves++;
    return Object.assign({},c,{ q }); }; }
// ---- health and damage as they spawn (bosses too; never speed). A mob is touched once (the spawn of a cart's crew spawns inside the cart's own spawn: the loop walks back to the last one marked)
{ const prev=spawnEnemy; spawnEnemy=function(){ const r=prev.apply(this,arguments); const l=L(); if(TUTORIAL||(l.hp===1&&l.dmg===1)) return r;
    for(let i=enemies.length-1;i>=0;i--){ const e=enemies[i]; if(e.dfk) break; e.dfk=1; e.hp=Math.round(e.hp*l.hp); e.max=Math.round(e.max*l.hp); e.dmg=Math.round(e.dmg*l.dmg*10)/10; cnt.boosted++; } return r; }; }
// ---- loot: the better (or poorer) of two rarity rolls, some of the time; mythic and named drop chances
{ const prev=rollRarity; rollRarity=function(minR){ const a=prev.apply(this,arguments), b=L().better; if(!b) return a; if(LR()>=Math.abs(b)) return a; const c=prev.apply(this,arguments); return b>0?Math.max(a,c):Math.max(minR||0,Math.min(a,c)); }; }
let baseRates=null;
function applyRates(){ const M=window.__mythicDrops; if(!M||!M.rates||!M.set) return; if(!baseRates) baseRates=M.rates(); const k=L().myth; M.set(baseRates.mythic*k,baseRates.named*k,baseRates.mob*k); }
setTimeout(applyRates,0);
// ---- the pick
function set(i,quiet){ i=Math.max(0,Math.min(LEVELS.length-1,i|0)); if(i===cur&&!quiet) return render(); cur=i; try{ localStorage.setItem(KEY,L().id); }catch(e){} applyRates(); render(); }
function best(){ try{ const o=JSON.parse(localStorage.getItem(BKEY)); return o&&typeof o==='object'?o:{}; }catch(e){ return {}; } }
function record(){ if(TUTORIAL||!MAP) return; const b=best(); if(!((b[MAP.id]|0)>=cur&&MAP.id in b)){ b[MAP.id]=Math.max(b[MAP.id]|0,cur); try{ localStorage.setItem(BKEY,JSON.stringify(b)); }catch(e){} } }
{ const prev=Meta.onMapHeld; Meta.onMapHeld=function(){ record(); return prev.apply(this,arguments); }; }
{ const prev=Meta.onWaveHeld; Meta.onWaveHeld=function(){ const r=prev.apply(this,arguments); if(SURVIVAL&&S.wave>=10) record(); return r; }; }   // a Survival run counts once it has held ten
// ---- the row on the title (under the mode row)
const st=document.createElement('style'); st.textContent='#start #diffline{flex-wrap:wrap;margin:2px 0 2px;row-gap:4px}#diffline .mlab{font-size:12px;letter-spacing:2px;color:#bfae90}'
 +'#start #diffline button.dl{width:auto;height:30px;padding:0 11px;font:bold 13px Georgia,serif;letter-spacing:1px;background:#2a1f33;border:2px solid #6b5a3c;border-radius:8px;color:#e9ddc8;cursor:pointer}'
 +'#start #diffline button.dl.sel{color:#fff;background:#3a2a1a;border-color:var(--dc);box-shadow:0 0 10px var(--dc)}#diffline small{flex-basis:100%;text-align:center}'
 +'#start.inLobby #diffline button,#start.coopPage #diffline button{pointer-events:none}#start.inLobby #diffline button:not(.sel),#start.coopPage #diffline button:not(.sel){opacity:.2}';
document.head.appendChild(st);
function row(){ let el=$('diffline'); if(!el){ const after=$('modeline')||$('mapline'); if(!after) return null; el=document.createElement('p'); el.id='diffline'; el.className='mapline'; after.insertAdjacentElement('afterend',el); } return el; }
function render(){ if(TUTORIAL) return; const el=row(); if(!el) return; const b=best(), mb=MAP&&MAP.id in b?LEVELS[b[MAP.id]]:null, l=L();
  const pct=v=>Math.round(v*100)+'%';
  const why=(l.id==='normal'?'the game as it stands':pct(l.mobs)+' mobs · '+pct(l.hp)+' health · '+pct(l.dmg)+' damage · '+pct(l.gold)+' gold'+(l.myth>1?' · rarer drops more often':l.better<0?' · plainer loot':''))+' · speed never changes'+(mb?' · 🏅 held here on '+mb.ic+' '+mb.name:'');
  const html='<span class="mlab">DIFFICULTY</span>'+LEVELS.map((x,i)=>'<button class="dl'+(i===cur?' sel':'')+'" data-i="'+i+'" style="--dc:'+x.col+'" title="'+x.name+'">'+x.ic+' '+x.name+'</button>').join('')+'<small>'+why+'</small>';
  if(el.innerHTML!==html){ el.innerHTML=html; el.querySelectorAll('button.dl').forEach(x=>{ x.onclick=e=>{ e.stopPropagation(); const s=$('start'); if(S.phase!=='start'||(s&&(s.classList.contains('inLobby')||s.classList.contains('coopPage')))) return; set(+x.dataset.i); }; }); } }
render(); setTimeout(render,0); setInterval(()=>{ if(S.phase==='start') render(); },1000);   // the map picker (◀ ▶) changes MAP's best medal
window.__difficulty={ id:()=>L().id, level:()=>Object.assign({},L()), set:(v,q)=>{ const i=typeof v==='number'?v:LEVELS.findIndex(l=>l.id===v); if(i>=0) set(i,q); return L().id; }, goldK:()=>L().gold, levels:()=>LEVELS.map(l=>l.id), best, info:()=>Object.assign({ id:L().id },cnt), fromHost:id=>{ const i=LEVELS.findIndex(l=>l.id===id); if(i>=0&&i!==cur){ cur=i; applyRates(); render(); } } };
})();
