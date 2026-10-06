// ===== THREE ONE-TIME PICTURE CARDS (build 571). Matt, for his wife's first play ("shes not a gamer so just little tweaks"):
//   * "explain the hero's secondary attack maybe not on each one but just once in the hall" -- THE GNOME HALL, the first build break after wave 2: hold right-click (or ✦), it charges, what it does.
//   * "a sludge tutorial from pick up, salvage all the way thru forge" -- the first sludge jar picked up: walk over jars, take them to the hideout, the forge makes Mythic gear. The hideout's own
//     cauldron and forge show their halves the first time each is opened (hideout build 90).
//   * "when you get the malamute or Beast Mode for the first time a stop and explain cinematic, perhaps as you walk over it to pick it up" -- the first time the hero comes near one of the two rings
//     on the floor the hall STOPS (window.__freeze, the same hold the tests use) under a card: wear it, two pets, how to put the second one in. CONTINUE (click, Enter, Space) and it walks on.
//     In co-op the hall never stops for one player; the card shows as an ordinary lesson instead.
// Each shows once per save (dd_tip_special, dd_tip_sludge, dd_tip_ring); never in the tutorial hall or on a test page (?silent) unless asked. Test hook: window.__halltips.
(function(){
'use strict';
const L=window.__lesson; if(!L) return;
const seen=k=>{ try{ return localStorage.getItem(k)==='1'; }catch(e){ return true; } }, mark=k=>{ try{ localStorage.setItem(k,'1'); }catch(e){} };
const cnt={ special:0, sludge:0, ring:0 };
const coop=()=>{ try{ const n=window.__net; return !!(n&&n.role&&n.role()!=='solo'&&n.peers&&n.peers().length); }catch(e){ return false; } };
const busy=()=>{ try{ return L.on()||(window.__bagguide&&window.__bagguide.isOn())||Meta.isOpen()||!!(window.__hideout&&window.__hideout.isOpen&&window.__hideout.isOpen())||document.body.classList.contains('cine-on')||!!(ring&&ring.on); }catch(e){ return true; } };
const off=()=>TUTORIAL||SILENT;

// ---- 1. the hero's second attack, once, in the hall
const SP={ knight:['🌀','Spin: hits everything around you'], witch:['☄️','Stars fall where you aim'], fighter:['💫','A halo ring rolls out, and every halo hits harder'], troll:['🏹','Arrows rain where you aim'] };
let buildT=0;
function special(){ const S_=window.__specials; const id=S_&&S_.hero?S_.hero():'knight', nm=(S_&&S_.name?S_.name():'Special')||'Special', p=SP[id]||SP.knight;
  L.flow({ ic:'✦', title:nm.toUpperCase(), css:'#ffd27a', steps:[ TOUCH?{ ic:'✦', t:'HOLD the ✦ button' }:{ ic:'🖱', t:'HOLD right-click' }, { ic:'⏳', t:'It charges up' }, { ic:p[0], t:p[1] } ], note:'your hero’s big attack · it rests a moment after each one' },10);
  mark('dd_tip_special'); cnt.special++; }

// ---- 2. sludge, the hall's half: the first jar picked up
function sludge(){ L.flow({ ic:'🧪', title:'SLUDGE', css:'#7dff8a', steps:[ { ic:'🧪', t:'Walk over jars' }, { ic:'🌀', t:'Take it to your hideout (portal: E)' }, { ic:'🔨', t:'The forge makes Mythic gear' } ], note:'Common · Uncommon · Rare · Legendary — the rarer, the better' },10);
  mark('dd_tip_sludge'); cnt.sludge++; }

// ---- 3. the two-pet rings: stop and explain as the hero reaches it
const RINGS={ beast_mode:'BEAST MODE', malamute:'MALAMUTE' };
const st=document.createElement('style'); st.textContent=
 '#ringtip{position:fixed;inset:0;z-index:85;display:none;align-items:center;justify-content:center;background:radial-gradient(circle,#0000 30%,#000a)}#ringtip.on{display:flex}'+
 '#ringtip .rt{width:min(700px,94vw);background:linear-gradient(#2a1630,#140a1a);border:3px solid #ff7ade;border-radius:16px;box-shadow:0 0 30px #ff7ade66,0 10px 40px #000;padding:18px 20px 14px;color:#f3e6cf;font:16px Georgia,serif;text-align:center}'+
 '#ringtip h3{margin:0 0 4px;font:bold 26px Georgia,serif;letter-spacing:4px;color:#ff9ae8}#ringtip .sub{color:#d9c3e8;margin-bottom:14px}'+
 '#ringtip .row{display:flex;align-items:stretch;justify-content:center;gap:8px;flex-wrap:wrap}#ringtip .s{flex:1 1 160px;max-width:200px;background:#ffffff0a;border:1px solid #ffffff1c;border-radius:12px;padding:10px 8px}'+
 '#ringtip .s b{display:block;font-size:40px;line-height:52px}#ringtip .s span{font-size:15px;line-height:1.25}#ringtip .ar{align-self:center;font-size:26px;color:#ff9ae8}'+
 '#ringtip .go{margin-top:14px;background:linear-gradient(#5a1a4a,#2a0a22);border:2px solid #ff7ade;border-radius:999px;color:#ffe2f4;font:bold 17px Georgia,serif;letter-spacing:3px;padding:9px 34px;cursor:pointer}';
document.head.appendChild(st);
let ring=null;
function ringStop(it){ try{ L.close(); }catch(e){} mark('dd_tip_ring'); cnt.ring++; const name=RINGS[it.named]||'A PET RING';
  const steps=[['💍','Walk over it, then wear it as your charm'],['🐾 🐾','TWO pets: one on each side'],['🎒','In the bag: pick a 2nd pet, “Equip as 2nd”']];
  if(coop()){ L.flow({ ic:'💍', title:name, css:'#ff7ade', steps:steps.map(s=>({ ic:s[0], t:s[1] })), note:'a rare ring' },11); return; }
  let el=document.getElementById('ringtip'); if(!el){ el=document.createElement('div'); el.id='ringtip'; document.body.appendChild(el); el.addEventListener('click',e=>{ if(e.target.closest('.go')||e.target===el) go(); }); }
  el.innerHTML='<div class="rt"><h3>💍 '+name+'</h3><div class="sub">A rare ring — one of only two</div><div class="row">'+steps.map(s=>'<div class="s"><b>'+s[0]+'</b><span>'+s[1]+'</span></div>').join('<div class="ar">➜</div>')+'</div><button class="go" type="button">CONTINUE</button></div>';
  ring={ on:true, was:!!window.__freeze, at:performance.now() }; window.__freeze=true; try{ if(document.pointerLockElement) document.exitPointerLock(); }catch(e){} el.classList.add('on'); }
function go(){ if(!ring||!ring.on) return; if(performance.now()-ring.at<400) return; ring.on=false; window.__freeze=ring.was; const el=document.getElementById('ringtip'); if(el) el.classList.remove('on'); }
addEventListener('keydown',e=>{ if(!ring||!ring.on) return; e.preventDefault(); e.stopImmediatePropagation(); if(e.code==='Enter'||e.code==='Space'||e.code==='Escape'||e.code==='NumpadEnter') go(); },true);

// ---- the watch: the hall's update for the ring (it moves), a slow timer for the rest
const ringBusy=()=>{ try{ return Meta.isOpen()||!!(window.__hideout&&window.__hideout.isOpen&&window.__hideout.isOpen())||document.body.classList.contains('cine-on')||!!(ring&&ring.on)||S.phase==='start'||S.phase==='dead'; }catch(e){ return true; } };   // not the lesson card: the ring cannot wait behind it (it would be walked over)
{ const prev=Meta.update; Meta.update=dt=>{ prev(dt); if(off()||seen('dd_tip_ring')||ringBusy()) return; try{ for(const l of loot){ const it=l&&l.it; if(!it||!RINGS[it.named]||!(l.t>.6)) continue; if(Math.hypot(l.x-hero.x,l.z-hero.z)<6){ ringStop(it); break; } } }catch(e){} }; }
setInterval(()=>{ if(off()) return;
  try{ if(!seen('dd_tip_sludge')&&!busy()){ const J=window.__jars; if(J&&J.run&&J.run().some(n=>n>0)) sludge(); } }catch(e){}
  try{ if(!seen('dd_tip_special')&&MAPI===0&&!SURVIVAL&&S.phase==='build'&&S.wave>=2){ buildT+=.5; if(buildT>=2.5&&!busy()) special(); } else buildT=0; }catch(e){} },500);
window.__halltips={ info:()=>Object.assign({ ringOn:!!(ring&&ring.on) },cnt), special, sludge, ringStop, go };
})();
