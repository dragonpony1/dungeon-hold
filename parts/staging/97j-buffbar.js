// ===== THE BUFF BAR (build 527 prep). Matt: "when iam getting a buff from the talent tree and little icon in the top right" / "I am thinking specivically about vigil right now, how long do i need to stand
// still for my towers to be buffed, maybe that icone shows up when the buff is active".
// A row of small round chips top-right, under the mini-map and its wave strip (97g-minimap.js; with the map hidden by M the row moves up). One chip per buff you have RIGHT NOW -- the talent's own icon,
// a thin gold ring running down on a timed one, a small number on a stacking one; it pops in with a gold glow and fades out when it ends. Hover = its name and the talent's own chip line.
// Vigil: while the Knight stands still a dim 👁 fills its ring (the 1 s wait), then it lights up. The list (my judgment: on/off and timed buffs on YOU, not passive stats, not instant procs):
//   Knight -- Vigil (charge + on), Aegis (3 s), Fury (3 s, refreshed by each kill), Last Stand (under 35% health)
//   Ranger -- Eagle Eye (on a perch)          Fighter -- Mending Light (healing in his halos), Halo Surge (6 s + Surge Master; any hero's surge doubles the halos)
//   Witch  -- Doom (kills toward the next explosion, a stack number; her only one -- the rest of her tree is passive or instant)
//   any hero -- Gabriel's Charm BLITZ (6 s), Mossheart Aegis (stand still 2 s: charge, then healing)
// A co-op guest's page runs its own stillness / perch / health, and the host's 'powerFx' (Aegis, Fury, Blitz) and 'mend' messages already start the guest's own timers -- so no new network.
// Test hook: window.__buffbar.
(function(){
'use strict';
const css=document.createElement('style'); css.textContent=
 '#buffbar{position:fixed;top:300px;right:14px;width:180px;z-index:6;display:flex;flex-wrap:wrap;justify-content:flex-end;gap:7px;pointer-events:none}#buffbar.off{display:none}'
+'body.avery-cut #buffbar{visibility:hidden!important}'
+'.bb-c{position:relative;width:30px;height:30px;border-radius:50%;box-sizing:border-box;display:grid;place-items:center;pointer-events:auto;cursor:default;'
+ 'background:radial-gradient(circle at 50% 38%,#3a2350 0%,#1c1028 62%,#0e0716 100%);border:2px solid #b8893a;box-shadow:0 2px 0 #000,0 0 0 1px #000,inset 0 0 6px #000c;transition:opacity .35s,transform .35s}'
+'.bb-c .i{font:17px/1 "Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji",sans-serif;filter:drop-shadow(0 1px 1px #000);transition:opacity .25s,filter .25s}'
+'.bb-c::before{content:"";position:absolute;inset:-5px;border-radius:50%;background:conic-gradient(var(--rc,#ffd27a) calc(var(--p,0)*360deg),#0000 0);'
+ '-webkit-mask:radial-gradient(farthest-side,#0000 calc(100% - 3px),#000 calc(100% - 2.5px));mask:radial-gradient(farthest-side,#0000 calc(100% - 3px),#000 calc(100% - 2.5px));opacity:0;transition:opacity .2s}'
+'.bb-c.ring::before{opacity:1}'
+'.bb-c.chg{border-color:#6b5a3c;--rc:#c9a24a}.bb-c.chg .i{opacity:.45;filter:grayscale(.7) drop-shadow(0 1px 1px #000)}'
+'.bb-c .n{position:absolute;right:-5px;bottom:-4px;min-width:14px;height:14px;padding:0 2px;box-sizing:border-box;border-radius:7px;background:#2a1638;border:1px solid #ffd27a;color:#ffe9a8;font:800 9px/12px system-ui;text-align:center}'
+'.bb-c.pop{animation:bbpop .55s cubic-bezier(.2,.9,.3,1.3)}@keyframes bbpop{0%{transform:scale(.4);box-shadow:0 0 0 0 #ffd27a00}45%{transform:scale(1.18);box-shadow:0 0 16px 6px #ffd27acc}100%{transform:scale(1);box-shadow:0 2px 0 #000,0 0 0 1px #000}}'
+'.bb-c.out{opacity:0;transform:scale(.6);pointer-events:none}'
+'.bb-c .tip{position:absolute;top:38px;right:-4px;white-space:nowrap;padding:4px 8px;border-radius:8px;background:linear-gradient(#2a1638f4,#160b20f4);border:1px solid #b8893a;box-shadow:0 3px 0 #000;'
+ 'font:700 11px/1.35 system-ui;color:#e8dcc8;text-align:right;display:none;z-index:2}.bb-c .tip b{display:block;font:800 12px Georgia,serif;color:var(--tc,#ffd27a);letter-spacing:.5px}.bb-c:hover .tip{display:block}';
document.head.appendChild(css);
const bar=document.createElement('div'); bar.id='buffbar'; bar.className='off'; document.body.appendChild(bar);
const TL=()=>window.__talents, NET=()=>window.__net, isGuest=()=>{ const n=NET(); return !!(n&&n.role&&n.role()==='guest'); };
const hid=()=>window.__heroes?window.__heroes.pick():'knight';
const rk=id=>{ const T=TL(); return T&&T.tree&&T.tree()?(T.rank(id)|0):0; };
const alive=()=>hero&&hero.dead<=0;
// ---- what the guest only learns from messages: the host's BLITZ for its charm, its own Halo Surge cast, its Mending Light
const G={ blitz:-1, surge:-1, surgeDur:6, mend:-99 };
if(window.__gabriel&&window.__gabriel.cue){ const prev=window.__gabriel.cue; window.__gabriel.cue=function(){ if(isGuest()) G.blitz=S.t+((window.__gabriel&&window.__gabriel.dur)||6); return prev.apply(this,arguments); }; }
if(TL()){ const T=TL();
  if(T.coopFx){ const prev=T.coopFx; T.coopFx=function(k){ if(k==='mend') G.mend=S.t; return prev.apply(this,arguments); }; }
  if(T.onSpecial){ const prev=T.onSpecial; T.onSpecial=function(h,p,o){ if(isGuest()&&h==='fighter'&&!o){ G.surgeDur=6+2*rk('fsurge'); G.surge=S.t+G.surgeDur; } return prev.apply(this,arguments); }; } }   /* 73-specials.js HALO_SURGE_DUR 6, + Surge Master's 2 s a rank */
// ---- the buffs right now: [{id, ic, name, tip, col, st:'on'|'chg', p (ring 0..1, or null), n (stack)}]
const info=id=>{ const T=TL(); return (T&&T.info&&T.info(id))||{ic:'✦',name:id,chip:''}; };
const tal=(id,st,p,n)=>{ const f=info(id); return { id, ic:f.ic, name:f.name, tip:f.chip, col:f.col, st, p, n }; };
let surgeMax=0, mendV=0, mendSeen=-99, lastAt=0;
function current(){ const out=[], T=TL(); if(!T||!hero) return out; const tm=T.timers?T.timers():null, h=hid(), now=S.t;
  if(tm&&h==='knight'&&T.tree()==='knight'){
    if(rk('kvigil')&&alive()){ if(tm.vigil) out.push(tal('kvigil','on',null)); else if(tm.still>=.15) out.push(tal('kvigil','chg',Math.min(1,tm.still))); }   /* 96l vigilOn: still 1 s */
    if(now<tm.aegis) out.push(tal('kaegis','on',(tm.aegis-now)/3));
    if(rk('kfury')&&now<tm.rush) out.push(tal('kfury','on',(tm.rush-now)/3));
    if(rk('kstand')&&alive()&&hero.hp<hero.max*.35) out.push(tal('kstand','on',null)); }
  if(tm&&h==='troll'&&rk('rperch')&&tm.eagle) out.push(tal('rperch','on',null));
  if(h==='fighter'&&rk('fmend')){ if(tm&&tm.mend>mendV) mendSeen=now; if(tm) mendV=tm.mend; if(alive()&&(now-mendSeen<.3||now-G.mend<.9)) out.push(tal('fmend','on',null)); }
  { const sp=window.__specials, st=sp&&sp.haloSurgeT?sp.haloSurgeT():0; let left=st, dur;
    if(st>0){ if(st>surgeMax+.05) surgeMax=st; dur=surgeMax; } else surgeMax=0;
    if(!(left>0)&&now<G.surge){ left=G.surge-now; dur=G.surgeDur; }
    if(left>0){ const f=rk('fsurge'); out.push({ id:'surge', ic:'💫', name:'Halo Surge', tip:'💫 halos ×2'+(f?' · ⚡ +'+2*f+' s':''), col:'#ffe08a', st:'on', p:Math.min(1,left/Math.max(.1,dur)) }); } }
  if(tm&&h==='witch'&&rk('doom')){ const n=tm.doom%10; if(n>0) out.push(tal('doom','on',n/10,n)); }
  { const gb=window.__gabriel; let left=gb&&gb.blitz?gb.blitz():0; if(!(left>0)&&now<G.blitz) left=G.blitz-now; if(left>0) out.push({ id:'blitz', ic:'🏈', name:'Gabriel’s Charm', tip:'✦ BLITZ ✦ towers fire +50%', col:'#7fd8ff', st:'on', p:Math.min(1,left/((gb&&gb.dur)||6)) }); }
  { const M=window.__mythic; if(M&&M.has&&M.has('mossheart_aegis')&&alive()){ const it=M.state?M.state().idleT:0; const c={ id:'moss', ic:'🌿', name:'Mossheart Aegis', tip:'stand still ⤳ ✚ you + towers near', col:'#8ef05a' };
      if(it>=2) out.push(Object.assign(c,{st:'on',p:null})); else if(it>=.3) out.push(Object.assign(c,{st:'chg',p:it/2})); } }   /* 97-mythics.js: idle 2 s */
  return out; }
// ---- the DOM: one chip per id, touched only when its state changes; the ring is a CSS variable, at most ten times a second
const CH=new Map(); const cnt={ pops:0, builds:0 };
function pop(el){ el.classList.remove('pop'); void el.offsetWidth; el.classList.add('pop'); cnt.pops++; }
function make(b){ const el=document.createElement('div'); el.className='bb-c'; el.dataset.buff=b.id; el.innerHTML='<span class="i"></span><span class="tip"><b></b><span></span></span>'; cnt.builds++; return { el, key:'', p:-1, n:-1, kill:0 }; }
function render(list){ const seen=new Set();
  for(const b of list){ seen.add(b.id); let c=CH.get(b.id); const fresh=!c;
    if(!c){ c=make(b); CH.set(b.id,c); bar.appendChild(c.el); } else if(c.kill){ clearTimeout(c.kill); c.kill=0; c.el.classList.remove('out'); }
    const key=b.st+'|'+b.ic+'|'+b.name+'|'+b.tip;
    if(key!==c.key){ const was=c.key.split('|')[0]; c.key=key; c.el.querySelector('.i').textContent=b.ic; c.el.querySelector('.tip b').textContent=b.name; c.el.querySelector('.tip span').textContent=b.tip; c.el.style.setProperty('--tc',b.col||'#ffd27a');
      c.el.classList.toggle('chg',b.st==='chg'); if(b.st==='on'&&(fresh||was!=='on')) pop(c.el); }
    const ring=b.p!==null&&b.p!==undefined; if(c.el.classList.contains('ring')!==ring) c.el.classList.toggle('ring',ring);
    if(ring){ const p=Math.round(b.p*100)/100; if(p!==c.p){ c.p=p; c.el.style.setProperty('--p',p); } }
    const n=b.n|0; if(n!==c.n){ c.n=n; let s=c.el.querySelector('.n'); if(n){ if(!s){ s=document.createElement('span'); s.className='n'; c.el.appendChild(s); } s.textContent=n; } else if(s) s.remove(); } }
  for(const [id,c] of CH){ if(seen.has(id)||c.kill) continue; c.el.classList.remove('pop'); c.el.classList.add('out'); c.kill=setTimeout(()=>{ c.el.remove(); CH.delete(id); },380); } }
// ---- where it sits: under the wave strip, or the map, or (both hidden) where the map would be
let topPx='';
function place(){ const wv=document.getElementById('mmWave'), mm=document.getElementById('minimap'); let y=112;
  if(wv&&wv.classList.contains('on')) y=wv.getBoundingClientRect().bottom+8; else if(mm&&mm.classList.contains('on')) y=mm.getBoundingClientRect().bottom+8;
  const t=Math.round(y)+'px'; if(t!==topPx){ topPx=t; bar.style.top=t; } }
const showable=()=>(S.phase==='build'||S.phase==='wave')&&!(window.__hideout&&window.__hideout.isOpen&&window.__hideout.isOpen());
let acc=1, last=[];
function tick(dt){ acc+=dt||0; if(acc<.1) return; acc=0; const on=showable(); let list=[];
  if(on){ try{ list=current(); }catch(e){ list=[]; } }
  last=list; const vis=on&&(list.length>0||CH.size>0); if(bar.classList.contains('off')===vis) bar.classList.toggle('off',!vis);
  if(on){ render(list); place(); } else if(CH.size){ for(const c of CH.values()){ if(c.kill) clearTimeout(c.kill); c.el.remove(); } CH.clear(); } }
{ const prev=update; update=function(dt){ const r=prev.apply(this,arguments); try{ tick(dt); }catch(e){} return r; }; }   // every phase, the title screen too (Meta.update stops outside the hall)
window.__buffbar={ list:()=>last.map(b=>({ id:b.id, ic:b.ic, st:b.st, p:b.p===null||b.p===undefined?null:+b.p.toFixed(2), n:b.n|0 })),
  dom:()=>[...bar.children].filter(el=>!el.classList.contains('out')).map(el=>({ id:el.dataset.buff, ic:el.querySelector('.i').textContent, chg:el.classList.contains('chg'), ring:el.classList.contains('ring'), p:+(el.style.getPropertyValue('--p')||0), n:+((el.querySelector('.n')||{}).textContent||0), tip:el.querySelector('.tip').textContent })),
  shown:()=>!bar.classList.contains('off')&&getComputedStyle(bar).visibility!=='hidden', rect:()=>{ const r=bar.getBoundingClientRect(); return { top:Math.round(r.top), right:Math.round(innerWidth-r.right), w:Math.round(r.width) }; },
  tick:()=>{ acc=1; tick(0); }, counts:()=>Object.assign({},cnt), guest:G };
})();
