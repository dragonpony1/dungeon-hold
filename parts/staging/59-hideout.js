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
// no duplicates). Worn gear and kept armory treasures are never touched. No prompt at the door -- the player asked for none: lock what you keep (it rides
// through whole for the display); everything else unequipped is scrap for the Cart, decided in the bag ahead of time. Folder build
// only: the single-file dungeon.html has no hideout/ next to it, so there the prompt says so instead of opening a
// broken page.
//
// THE LOCK (10-meta.js, toggleLock; build 241: set pieces, mythics and named mythics lock themselves on pickup): a piece locked in the bag is never scrapped here, and (build 241, Matt: "locked items should just stay in my inventory on the otherside") it no longer rides through either -- it simply STAYS in the bag. The old text below described the carry-through it used to do,
// as an item record appended to localStorage 'dd_gear_carried' (the hideout's second contract: an array of items --
// id, name, slot, rarity 0..4, lvl, tier, stats, value, score, and from:'dungeon-hold', carriedAt -- read-modify-write,
// appended to, never overwritten, never the same id twice) for the hideout to list in YOUR GEAR and put on display.
// It leaves the bag like the scrap does. So "a mythic that looks cool but doesn't beat my set bonus" has a home.
(function(){
const NEAR=2.8;
const HIDEOUT_URL='hideout/index.html';
const HIDEOUT_WORKER='https://dungeon-hold.52bulls.workers.dev';   // where the hideout's shared-gear Durable Object lives; its Worker allows CORS from dragonpony1.github.io
const HIDEOUT_API=Q.get('hideoutapi')||(location.hostname==='dragonpony1.github.io'||location.hostname==='rootgate.52bulls.workers.dev'?HIDEOUT_WORKER:'');   // build 307: the game's own Cloudflare site too   // the API base handed to the derived page: the Worker from GitHub Pages, same-origin everywhere else (the Worker's own deployment, local tests)
const HIDEOUT_NAV=Q.has('hideoutnav')?(Q.get('hideoutnav')||'/hideout.html'):null;   // full-page navigation instead of the overlay (see the header)
// ---- build 377 (Matt: "the whole point of being co-op is that you can go in and share space together ... of course you should have your own hideout if you're playing single player by yourself, but not when you're playing with somebody else"):
// the hideout's gear on display lives in ONE server table per hideout KEY (the Worker's /api/hideout/k/<key>/...). Before this there was a single table for every player alive, so a friend's hideout was yours and what he moved moved in yours.
//   - playing alone (or hosting) you open YOUR OWN key; a guest visiting a host's hideout is sent the HOST's key (the host puts it in its world snapshot, 99-network.js), so everyone in a co-op visit stands in the one room and sees the one table
//   - the key is kept in localStorage ddHideoutKey. Nothing breaks for anyone who already keeps a hideout: with no key yet and a hideout save on this device, the key is 'main' (the original table, so Matt's gear is where he left it);
//     a brand-new player gets a private random one. Open the game once with ?hideoutkey=new to be given a private table (a friend who had been using 'main'), or ?hideoutkey=<4-64 letters/digits> to choose one
const KEY_RE=/^[A-Za-z0-9_-]{4,64}$/, HKEY='ddHideoutKey';
function randomKey(){ let k='h-'; const a=new Uint8Array(10); try{ crypto.getRandomValues(a); }catch(e){ for(let i=0;i<10;i++) a[i]=Math.floor(Math.random()*256); } for(const b of a) k+=(b%36).toString(36); return k; }
function ownHideoutKey(){ try{ const q=Q.get('hideoutkey'); let k=localStorage.getItem(HKEY); if(k&&!KEY_RE.test(k)) k=null;
    if(q&&(q==='new'?!k||k==='main':KEY_RE.test(q))){ k=q==='new'?randomKey():q; localStorage.setItem(HKEY,k); }
    if(k) return k;
    if(localStorage.getItem('dd_hideout_save_v2')) return 'main';   /* already keeps a hideout, no key chosen: the original table */
    k=randomKey(); localStorage.setItem(HKEY,k); return k; }catch(e){ return 'main'; } }
function hideoutKey(){ const role=window.__net&&window.__net.role?window.__net.role():null; if(role==='guest'){ const w=window.__net.world&&window.__net.world(); return (w&&typeof w.hk==='string'&&KEY_RE.test(w.hk))?w.hk:'main'; }   /* a guest stands in the HOST's hideout (an older host sends none: it only ever had the one table) */ return ownHideoutKey(); }
const hkParam=()=>{ const k=hideoutKey(); return k==='main'?'':'&hk='+encodeURIComponent(k); };   // 'main' is the original path: nothing is sent, so the request is exactly what it always was
const BAG_KEY='dd_gear_bag';
const CARRY_KEY='dd_gear_carried';   // whole items (locked pieces), see the header
const RARITY_KEY=['common','uncommon','rare','epic','legendary'];   // RNAME, lower-cased, by the game's own numeric rarity 0..4
const hooks={};   // build 234: 99d-coophideout.js listens for the visit ending (hooks.close)
let wrap=null, frame=null, shown=false, opens=0, lastCarry=null, preloadT=null, loaded=false, focusT=null;   // one frame for the whole run (hideout build 18: 'hideout:hide' / 'hideout:show' keep it alive between visits), created hidden ahead of the first trip
const clampR=r=>Math.max(0,Math.min(4,Math.round(+r)||0));
function readBag(){ let b=null; try{ b=JSON.parse(localStorage.getItem(BAG_KEY)); }catch(e){} return (b&&typeof b==='object'&&!Array.isArray(b))?b:{}; }
function readCarried(){ let a=null; try{ a=JSON.parse(localStorage.getItem(CARRY_KEY)); }catch(e){} return Array.isArray(a)?a.filter(x=>x&&typeof x==='object'):[]; }
function carryGear(){ const bag=Meta.bag(); const counts={}; RARITY_KEY.forEach(k=>counts[k]=0); const carried=[]; let kept=0; if(!bag.length){ lastCarry={n:0,counts,carried,kept}; return lastCarry; }
  const b=readBag(); let n=0; RARITY_KEY.forEach(k=>{ b[k]=Math.max(0,Math.floor(+b[k])||0); });   // every rarity present as an integer after a write, even the ones nothing went into
  const items=bag.slice(); bag.length=0;   // emptied in place, never a fresh array: Meta.bag() is the live one 10-meta.js saves
  for(const it of items){
    if(it.locked){ bag.push(it); kept++; continue; }   // build 241: a locked piece stays in the bag, on this side of the portal
    const k=RARITY_KEY[clampR(it.rarity)]; counts[k]++; b[k]++; n++; }   // scrap, for the Cart
  try{ localStorage.setItem(BAG_KEY,JSON.stringify(b)); }catch(e){}
  Meta.save(); lastCarry={n,counts,carried,kept}; return lastCarry; }
function bagSummary(){ const c={}; Meta.bag().filter(it=>!it.locked).forEach(it=>{ const k=RARITY_KEY[clampR(it.rarity)]; c[k]=(c[k]||0)+1; }); return RARITY_KEY.filter(k=>c[k]).map(k=>c[k]+' '+k).join(', '); }
function portalNear(){ if(!window.__portal||window.__portal.state()!=='shown') return false; const ps=window.__portal.spots?window.__portal.spots():[window.__portal.pos()]; return ps.some(p=>Math.hypot(hero.x-p.x,hero.z-p.z)<NEAR&&Math.abs((hero.y||0)-(p.y||0))<3); }   // build 460: any station's portal
function canUse(){ return portalNear()&&!placing&&!Meta.isOpen()&&hallPhase()==='build'; }   // hallPhase (58-portal.js, build 159 5/7): the host's phase on a co-op guest, whose own S.phase is 'build' all run
// the frame is made once and kept: hidden (visibility, so its page keeps running its loads) between visits, and the
// hideout page told which it is -- 'hideout:hide' stops it drawing and releases the mouse, 'hideout:show' re-reads the
// gear bag and the locker, re-arms the rewards banner and brings back its click-to-enter screen (hideout build 18)
function post(msg){ try{ if(frame&&frame.contentWindow) frame.contentWindow.postMessage(msg,'*'); }catch(e){} }   // a bare command string, nothing in it to leak
function makeFrame(){ if(frame) return frame;
  wrap=document.createElement('div'); wrap.id='hideoutWrap'; wrap.style.cssText='position:fixed;inset:0;z-index:20;background:#000;visibility:hidden;'; wrap.inert=true;   /* hidden AND inert: the kept frame must never hold focus or keys while the hall is in charge */
  frame=document.createElement('iframe'); frame.id='hideoutFrame';
  const coopRole=window.__net&&window.__net.role?window.__net.role():null;   // build 234: the hideout page learns whether this is a co-op visit (and as whom) from its address
  frame.src=HIDEOUT_URL+'?embed=1'+(coopRole?'&coop='+coopRole:'')+(HIDEOUT_API?'&api='+encodeURIComponent(HIDEOUT_API):'')+hkParam();
  frame.setAttribute('allow','fullscreen');   /* pointer lock needs no allow entry in a same-origin frame, and 'pointer-lock' is not a feature name Chrome knows (it logged an error) */ frame.style.cssText='width:100%;height:100%;border:0;display:block;';
  frame.addEventListener('load',()=>{ loaded=true; if(!shown) post('hideout:hide'); });   // a frame made ahead of the visit starts hidden the moment its page can listen
  wrap.appendChild(frame); document.body.appendChild(wrap); return frame; }
// build 150 ("guest game crashed and closed the browser while in hideout"): on a co-op page (host or guest), a touch device, a
// small-memory device, or ?litehideout, the hideout is LITE: never preloaded or kept alive behind the hall,
// made on the visit and torn down on the way out, so the hall and the hideout never sit in memory together
const LITE_DEVICE=TOUCH||(navigator.deviceMemory&&navigator.deviceMemory<=4)||Q.has('litehideout');
function hideoutLite(){ return LITE_DEVICE||!!(window.__net&&window.__net.role&&window.__net.role()); }   // and every co-op page (the crash was a desktop guest's): a hall full of puppets plus a kept hideout is two heavy scenes in one tab
function teardown(){ if(shown||!frame) return; try{ frame.src='about:blank'; }catch(e){} if(wrap&&wrap.parentNode) wrap.parentNode.removeChild(wrap); frame=null; wrap=null; loaded=false; }
function preload(){ if(TUTORIAL||frame||hideoutLite()||!HAS_ASSETS||HIDEOUT_NAV) return false; if(navigator.connection&&navigator.connection.saveData) return false; makeFrame(); return true; }   // build 166: never in the tutorial hall -- it has no portal, and a first-timer's page shouldn't load a 33 MB room behind it   // the download and the room build happen in the background between waves, so the first trip is as quick as the second
function openHideout(){ if(shown) return false;
  if(!HAS_ASSETS){ toast('The hideout only exists in the folder build (dist/hideout/)'); return false; }
  const fresh=!frame; makeFrame(); shown=true; HIDEOUT_SHOWN=true; wrap.inert=false; wrap.style.visibility='visible'; if(!fresh&&loaded) post('hideout:show');
  if(document.pointerLockElement&&document.exitPointerLock) document.exitPointerLock();
  document.body.classList.add('inHideout'); opens++; SFX.enter();
  clearTimeout(focusT); focusT=setTimeout(()=>{ focusT=null; try{ if(frame&&shown) frame.contentWindow.focus(); }catch(e){} },50);   // keys go to the hideout, not the hall, from the first press -- and never to a frame already hidden again (a stray late focus was swallowing the hall's next E)
  return true; }
// build 325, ONE BAG: however the hideout closes (its own portal already does this; the horn, the run ending or BACK from here did not), the gear on its hotbar walks back with you --
// the room hands it to the return list first, which the hideout-close import below moves into your bag
function carryHotbarHome(){ try{ const w=frame&&frame.contentWindow; if(w&&typeof w.sendInventoryToHall==='function'){ const n=w.sendInventoryToHall(); if(n&&typeof w.writeSave==='function') w.writeSave(); return n; } }catch(e){} return 0; }
function closeHideout(why){ if(!shown) return false; carryHotbarHome(); shown=false; HIDEOUT_SHOWN=false; if(hooks.close){ try{ hooks.close(); }catch(e){} } clearTimeout(focusT); focusT=null; post('hideout:hide'); wrap.style.visibility='hidden'; wrap.inert=true; try{ frame.blur(); if(document.activeElement&&document.activeElement.blur) document.activeElement.blur(); }catch(e){} document.body.classList.remove('inHideout'); if(why) toast(why); try{ window.focus(); }catch(e){} if(hideoutLite()) setTimeout(teardown,250); return true; }   // keys go back to the hall at once; a lite hideout is torn down as soon as its hide message has gone
addEventListener('message',e=>{ if(frame&&e.source===frame.contentWindow&&e.data&&e.data.type==='hideout:exit') closeHideout(); });
function go(carry){ if(carry){ const c=carryGear(); const parts=[]; if(c.n) parts.push(c.n+' scrapped for the Cart'); if(c.kept) parts.push(c.kept+' locked piece'+(c.kept===1?'':'s')+' stay in your bag'); if(parts.length) toast(parts.join(' · ')); } Meta.save(); if(HIDEOUT_NAV){ location.href=HIDEOUT_NAV; return; } openHideout(); }
// no panel, no choice, no toast worth reading: the split was decided in the bag with the lock, and the hideout's own Cart
// and gear panel are where the results show up
// build 325, ONE BAG (Matt: "the main bag needs to be portable to the hideout, iam not sure why we've made two seperate bags"): the portal no longer scraps your loose gear -- your bag comes with
// you (the hideout reads and writes it: Forge, trades, the locker, its I panel), and you salvage on purpose (the Tavern's salvage, over the hideout). carryGear stays for a deliberate scrap.
let SCRAP_AT_DOOR=false;   // off: the bag comes with you. On (window.__hideout.scrapAtDoor(true)): the old scrap-at-the-door, for the Cart's own tests or a future "scrap my junk" choice
function passThrough(){ go(SCRAP_AT_DOOR); }
// E at the portal: keyboard E and the touch 🔧 button both arrive through upgrade(), the same hook the raven uses
{ const prev=upgrade; upgrade=function(pos){ if(canUse()){ passThrough(); return; } return prev(pos); }; }
{ const ph=Meta.hud; Meta.hud=()=>{ ph(); if(canUse()&&!shown){   /* !shown, not !wrap: since build 140 the frame is kept (and preloaded), so the wrapper exists between visits and the prompt vanished once it did */ const el=$('prompt'); const want=HAS_ASSETS?'E  step through the portal (the hideout)':'E  the portal (hideout: folder build only)'; if(el.textContent!==want) el.textContent=want; } }; }
// the title screen: a visit outside a run, next to the TAVERN button
{ const tav=$('tavbtn'); if(tav){ const b=document.createElement('button'); b.id='hideoutbtn'; b.className='big alt'; b.textContent='🔮 THE HIDEOUT'; b.addEventListener('click',e=>{ e.stopPropagation(); if(S.phase==='start') passThrough(); }); tav.insertAdjacentElement('afterend',b); } }
// pulled back out the moment a visit's phase ends for any reason (the horn, the crystal falling, the run ending -- since build 160
// a held map's last wave no longer does: the victory lap stays in 'build', so the hideout is there and back on the lap, and a
// guest visiting it is pulled out by its host's ▶ MOVE ON instead).
// Polled rather than hooked into Meta.update, since update() itself stops running on the dead/won screens. A co-op guest goes by
// the host's phase (hallPhase, 58-portal.js; build 159 5/7) -- its own never left 'build', so the host's horn never called it back
setInterval(()=>{ const ph=hallPhase(); if(shown&&ph!=='build'&&ph!=='start') closeHideout(ph==='wave'?'The horn sounds — back to the hall!':null);
  if(hideoutLite()&&frame&&!shown) teardown();   /* a page that turned lite after a frame was kept (it hosted or joined after a solo start): the kept frame goes now */
  if(!frame&&preloadT===null&&(S.phase==='build'||S.phase==='start')&&window.__loadtime&&window.__loadtime().all!==null) preloadT=setTimeout(preload,1500);   /* build 307 (Matt: "the waiting isn't good"): the title screen too, once the game's own loads are all in, so a first trip from the title's HIDEOUT button is ready as well */ },250);   // build 142: only once the hall's own loads are all in (the load timer's 'everything'), so its ~33 MB never competes with a map still streaming -- map two needs ~109 MB of its own   // the first build phase of a run: four seconds in (the hall's own priority loads have gone out by then), the hideout starts loading behind the hall
window.__hideout={key:hideoutKey,ownKey:ownHideoutKey,pass:()=>passThrough(),scrapAtDoor:v=>{ if(v!==undefined) SCRAP_AT_DOOR=!!v; return SCRAP_AT_DOOR; },hooks,frameWin:()=>frame?frame.contentWindow:null,lite:hideoutLite,isOpen:()=>shown,open:openHideout,close:()=>closeHideout(),near:portalNear,url:()=>frame?frame.src:null,opens:()=>opens,preloaded:()=>!!frame&&!shown,loaded:()=>loaded,preload,passThrough,carry:carryGear,lastCarry:()=>lastCarry,readBag,readCarried,BAG_KEY,CARRY_KEY,build:()=>HIDEOUT_BUILD};
})();
