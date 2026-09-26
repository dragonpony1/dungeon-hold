// ===== THROUGH THE PORTAL: the hideout, reachable at last. Walk up to the crystal archway (58-portal.js) during the
// build phase and E steps through; there's a THE HIDEOUT button on the title screen too, for a visit outside a run.
// The hideout is a whole separate first-person room with its own page -- parts/hideout/index.html, built in a
// parallel session and folded in here exactly as it ships (its own Three.js, pointer-lock WASD, the Trade-O-Matic,
// the Forge, the Cauldron Cart, free furniture placement, and a shared gear display backed by a Cloudflare Durable
// Object; assemble.mjs derives the embedded variant at build time, the source copy is never edited) -- and it opens
// in a full-screen iframe OVER the hall rather than navigating away. That choice is the whole point of this module:
// the game page never unloads, so the run, the hero, and above all a live co-op session (PeerJS connections die with
// the page) all survive the visit. Two players can each be in the hideout at once while the host's game keeps
// running underneath, and the hideout's shared-gear table is what they see in common. The hideout's own crystal
// portal (or the BACK TO THE HALL button on its entry overlay) posts 'hideout:exit' and the overlay drops, leaving
// you exactly where you stood; the horn sounding, or the run ending, pulls you back out automatically so nobody gets
// ambushed while browsing furniture. ?hideoutnav switches to the full-page navigation the hideout's own brief
// describes (save, hand off, location.href='/hideout.html', and the hideout's portal comes back to '/'), for a
// deployment where its page is served next to the game at the site root -- the game already restores gold, xp,
// level, skills and the bag from ddMeta on a fresh load (10-meta.js), so that round trip works too, at the cost of
// any co-op session and the abandoned run.
//
// THE GEAR HANDOFF is the hideout's contract: localStorage 'dd_gear_bag' = {common,uncommon,rare,legendary} integer
// counts of gear by rarity, a missing key or field meaning 0, always read-modify-write and ADDED to -- the hideout's
// Cauldron Cart decrements these as the player crafts, so an absolute write would resurrect gear already used up.
// This game's fifth tier, epic, goes in under its own name rather than being folded into a neighbour. What goes in
// is the bag: every unequipped piece the player is carrying, which leaves the bag for good (carried to the hideout,
// no duplicates). Worn gear and kept armory treasures are never touched. Design call: it's a PROMPT at the portal
// (CARRY IT ALL & GO / JUST VISIT / STAY), not automatic -- the bag is also where a player parks pieces they mean to
// equip or sell later, and silently scrapping all of it on every visit would be a nasty surprise. Folder build
// only: the single-file dungeon.html has no hideout/ next to it, so there the prompt says so instead of opening a
// broken page.
//
// THE LOCK (10-meta.js, toggleLock): a piece locked in the bag is never scrapped here. It rides through WHOLE instead,
// as an item record appended to localStorage 'dd_gear_carried' (the hideout's second contract: an array of items --
// id, name, slot, rarity 0..4, lvl, tier, stats, value, score, and from:'dungeon-hold', carriedAt -- read-modify-write,
// appended to, never overwritten, never the same id twice) for the hideout to list in YOUR GEAR and put on display.
// It leaves the bag like the scrap does. So "a mythic that looks cool but doesn't beat my set bonus" has a home.
(function(){
const NEAR=2.8;
const HIDEOUT_URL='hideout/index.html';
const HIDEOUT_WORKER='https://dungeon-hold.52bulls.workers.dev';   // where the hideout's shared-gear Durable Object lives; its Worker allows CORS from dragonpony1.github.io
const HIDEOUT_API=Q.get('hideoutapi')||(location.hostname==='dragonpony1.github.io'?HIDEOUT_WORKER:'');   // the API base handed to the derived page: the Worker from GitHub Pages, same-origin everywhere else (the Worker's own deployment, local tests)
const HIDEOUT_NAV=Q.has('hideoutnav')?(Q.get('hideoutnav')||'/hideout.html'):null;   // full-page navigation instead of the overlay (see the header)
const BAG_KEY='dd_gear_bag';
const CARRY_KEY='dd_gear_carried';   // whole items (locked pieces), see the header
const RARITY_KEY=['common','uncommon','rare','epic','legendary'];   // RNAME, lower-cased, by the game's own numeric rarity 0..4
let wrap=null, frame=null, opens=0, panel=null, lastCarry=null;
const clampR=r=>Math.max(0,Math.min(4,Math.round(+r)||0));
function readBag(){ let b=null; try{ b=JSON.parse(localStorage.getItem(BAG_KEY)); }catch(e){} return (b&&typeof b==='object'&&!Array.isArray(b))?b:{}; }
function readCarried(){ let a=null; try{ a=JSON.parse(localStorage.getItem(CARRY_KEY)); }catch(e){} return Array.isArray(a)?a.filter(x=>x&&typeof x==='object'):[]; }
function carryGear(){ const bag=Meta.bag(); const counts={}; RARITY_KEY.forEach(k=>counts[k]=0); const carried=[]; if(!bag.length){ lastCarry={n:0,counts,carried}; return lastCarry; }
  const b=readBag(); let n=0; RARITY_KEY.forEach(k=>{ b[k]=Math.max(0,Math.floor(+b[k])||0); });   // every rarity present as an integer after a write, even the ones nothing went into -- ready for when the hideout's chain grows past 'common'
  const list=readCarried(), have=new Set(list.map(x=>x.id));
  const items=bag.slice(); bag.length=0;   // emptied in place, never a fresh array: Meta.bag() is the live one 10-meta.js saves
  for(const it of items){
    if(it.locked){ if(!have.has(it.id)){ const rec=JSON.parse(JSON.stringify(it)); delete rec.locked; rec.from='dungeon-hold'; rec.carriedAt=Date.now(); list.push(rec); have.add(it.id); } carried.push(it.id); continue; }   // whole, for the display
    const k=RARITY_KEY[clampR(it.rarity)]; counts[k]++; b[k]++; n++; }   // scrap, for the Cart
  try{ localStorage.setItem(BAG_KEY,JSON.stringify(b)); if(carried.length) localStorage.setItem(CARRY_KEY,JSON.stringify(list)); }catch(e){}
  Meta.save(); lastCarry={n,counts,carried}; return lastCarry; }
function bagSummary(){ const c={}; Meta.bag().filter(it=>!it.locked).forEach(it=>{ const k=RARITY_KEY[clampR(it.rarity)]; c[k]=(c[k]||0)+1; }); return RARITY_KEY.filter(k=>c[k]).map(k=>c[k]+' '+k).join(', '); }
function portalNear(){ if(!window.__portal||window.__portal.state()!=='shown') return false; const p=window.__portal.pos(); return Math.hypot(hero.x-p.x,hero.z-p.z)<NEAR; }
function canUse(){ return portalNear()&&!placing&&!Meta.isOpen()&&S.phase==='build'&&!panel; }
function openHideout(){ if(wrap) return false;
  if(!HAS_ASSETS){ toast('The hideout only exists in the folder build (dist/hideout/)'); return false; }
  wrap=document.createElement('div'); wrap.id='hideoutWrap'; wrap.style.cssText='position:fixed;inset:0;z-index:20;background:#000;';
  frame=document.createElement('iframe'); frame.id='hideoutFrame';
  frame.src=HIDEOUT_URL+'?embed=1'+(HIDEOUT_API?'&api='+encodeURIComponent(HIDEOUT_API):'');
  frame.setAttribute('allow','pointer-lock; fullscreen'); frame.style.cssText='width:100%;height:100%;border:0;display:block;';
  wrap.appendChild(frame); document.body.appendChild(wrap);
  if(document.pointerLockElement&&document.exitPointerLock) document.exitPointerLock();
  document.body.classList.add('inHideout'); opens++; SFX.enter();
  setTimeout(()=>{ try{ if(frame) frame.contentWindow.focus(); }catch(e){} },50);   // keys go to the hideout, not the hall, from the first press
  return true; }
function closeHideout(why){ if(!wrap) return false; wrap.remove(); wrap=null; frame=null; document.body.classList.remove('inHideout'); if(why) toast(why); try{ window.focus(); }catch(e){} return true; }
addEventListener('message',e=>{ if(frame&&e.source===frame.contentWindow&&e.data&&e.data.type==='hideout:exit') closeHideout(); });
function go(carry){ if(carry){ const c=carryGear(); const parts=[]; if(c.n) parts.push(c.n+' scrapped for the Cart'); if(c.carried.length) parts.push(c.carried.length+' carried through as gear'); if(parts.length) toast(parts.join(' · ')); } Meta.save(); if(HIDEOUT_NAV){ location.href=HIDEOUT_NAV; return; } openHideout(); }
function closeAsk(){ if(panel){ panel.remove(); panel=null; } }
function askThenGo(){ if(panel) return; const bag=Meta.bag(); if(!bag.length){ go(false); return; }
  panel=document.createElement('div'); panel.id='hideoutAsk';
  panel.style.cssText='position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);width:min(460px,92vw);background:linear-gradient(#3a2a44,#1c1424);border:2px solid #e8b94a;border-radius:10px;padding:18px 20px;text-align:center;color:#f1e6d0;font-family:Georgia,serif;box-shadow:0 6px 0 #000,0 0 30px #000c;z-index:15';
  const loose=bag.filter(it=>!it.locked).length, locked=bag.length-loose, pl=(n,w)=>'<b>'+n+'</b> '+w+(n===1?'':'s');
  const body=loose&&locked?'Scrap the '+pl(loose,'unlocked piece')+' in your bag for the Cauldron Cart <span style="color:#bfae90">('+bagSummary()+')</span>, and carry your '+pl(locked,'locked piece')+' through whole, as gear for the hideout\'s display?'
    :loose?'Carry the '+pl(loose,'unequipped piece')+' in your bag through as scrap for the Cauldron Cart? <span style="color:#bfae90">('+bagSummary()+')</span>'
    :'Carry your '+pl(locked,'locked piece')+' through whole, as gear for the hideout\'s display? Nothing gets scrapped.';
  panel.innerHTML='<div style="font-size:22px;letter-spacing:4px;color:#e8b94a;font-weight:bold">THE HIDEOUT</div><p style="margin:10px 0 14px;line-height:1.6;font-size:14px">'+body+' They leave your bag for good — what you\'re wearing and the armory\'s kept treasures stay put.</p>';
  const row=document.createElement('div'); row.style.cssText='display:flex;gap:8px;justify-content:center;flex-wrap:wrap';
  const mk=(t,fn,primary)=>{ const b=document.createElement('button'); b.textContent=t; b.style.cssText='padding:9px 14px;border-radius:6px;border:2px solid '+(primary?'#e8b94a':'#6b5a3c')+';background:linear-gradient('+(primary?'#7a2a2e,#3e1416':'#3a2a44,#1c1424')+');color:#fff;font:bold 12px Georgia,serif;letter-spacing:1px;cursor:pointer'; b.addEventListener('click',e=>{ e.stopPropagation(); fn(); }); return b; };
  row.appendChild(mk('CARRY IT ALL & GO',()=>{ closeAsk(); go(true); },true)); row.appendChild(mk('JUST VISIT',()=>{ closeAsk(); go(false); })); row.appendChild(mk('STAY',closeAsk));
  panel.appendChild(row); document.body.appendChild(panel); if(document.pointerLockElement&&document.exitPointerLock) document.exitPointerLock(); }
addEventListener('keydown',e=>{ if(panel&&e.code==='Escape'){ closeAsk(); e.stopImmediatePropagation(); } },true);
// E at the portal: keyboard E and the touch 🔧 button both arrive through upgrade(), the same hook the raven uses
{ const prev=upgrade; upgrade=function(pos){ if(canUse()){ askThenGo(); return; } return prev(pos); }; }
{ const ph=Meta.hud; Meta.hud=()=>{ ph(); if(canUse()&&!wrap){ const el=$('prompt'); const want=HAS_ASSETS?'E  step through the portal (the hideout)':'E  the portal (hideout: folder build only)'; if(el.textContent!==want) el.textContent=want; } }; }
// the title screen: a visit outside a run, next to the TAVERN button
{ const tav=$('tavbtn'); if(tav){ const b=document.createElement('button'); b.id='hideoutbtn'; b.className='big alt'; b.textContent='🔮 THE HIDEOUT'; b.addEventListener('click',e=>{ e.stopPropagation(); if(S.phase==='start') askThenGo(); }); tav.insertAdjacentElement('afterend',b); } }
// pulled back out the moment a visit's phase ends for any reason (the horn, the crystal falling, the last wave held).
// Polled rather than hooked into Meta.update, since update() itself stops running on the dead/won screens.
setInterval(()=>{ if(wrap&&S.phase!=='build'&&S.phase!=='start') closeHideout(S.phase==='wave'?'The horn sounds — back to the hall!':null); },250);
window.__hideout={isOpen:()=>!!wrap,open:openHideout,close:()=>closeHideout(),near:portalNear,url:()=>frame?frame.src:null,opens:()=>opens,asking:()=>!!panel,ask:askThenGo,carry:carryGear,lastCarry:()=>lastCarry,readBag,readCarried,BAG_KEY,CARRY_KEY};
})();
