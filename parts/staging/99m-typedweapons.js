// ===== TYPED WEAPONS + GEAR SCORE (build 525 prep). Matt: "yeah we really need typed weapons", "if were serious about putting this on steam", "lets get the cinmatics going, the loot typing fixed", and for
// gear score: "show gear score on items equipped as wel as in bag, and a small like showing total gear score on equipped".
// The rules live in game.js (WTYPES, HERO_WTYPES, wtypeOf, canWield, rollWtype, typeWeapon; gsOf, gsBadge, gearScoreTotal). This file, last in the build on purpose, does three things:
//   * THE MIGRATION, once (localStorage dd_wtype_v1), before anything is drawn: every weapon a save holds is given its type for good, nothing removed --
//       - a WORN weapon takes its wearer's type: each hero's five slots (71-herogear.js) and each hero's 2nd weapon (99k-dualwield.js dd_heroWeapon2). The Knight keeps a polearm that says it is one
//         (its look or its name), else a sword; his 2nd weapon is always a sword (his 2nd hand never holds a polearm). The Witch's is a staff, the Fighter's a polearm, the Ranger's a bow;
//       - a weapon in the bag, the armory, the shop, the Forest locker, or a hideout record on its way (dd_gear_carried, dd_gear_return) keeps the type its look or name says, else takes the type of the
//         hero being played now;
//       - its plain base word is renamed to its type's ladder at the same step ("Keen Broadsword" on the Witch -> "Keen Copper Staff"), a mythic's type word too ("Mythic Staff of Chaos" -> "Mythic Bow of Chaos");
//       - every item's gear score is checked (missing, broken or negative -> worked out again from its stats).
//   * THE EQUIP RULE: Meta.equip refuses a weapon this hero cannot use (the bag, the Tab sheet, the pickup card's E, loadouts -- all go through it), with a picture toast: 🚫 the type ➜ who can use it.
//     The bag's Equip button turns into that same picture, disabled (the Tab sheet's: 68-paperdoll.js; Equip as 2nd: 99k-dualwield.js fits).
//   * THE LOOK of the GS badges, the type chips and the gear-score total (CSS), and the test hooks: window.__typed, window.__gearscore.
(function(){
'use strict';
const FLAG='dd_wtype_v1';
const rep={ ran:false, worn:{}, w2:{}, bag:0, armory:0, stock:0, locker:0, carried:0, returning:0, renamed:0, scores:0, refused:0 };
const parse=k=>{ try{ return JSON.parse(localStorage.getItem(k)); }catch(e){ return null; } };
const write=(k,v)=>{ try{ localStorage.setItem(k,JSON.stringify(v)); }catch(e){} };
function wornType(it,h,second){ const own=heroWtypes(h); if(second&&h==='knight') return 'sword'; const g=guessWtype(it); return own.includes(g)?g:own[0]; }
function typeIt(it,t){ if(!it||it.slot!=='weapon'||WTYPES.includes(it.wtype)) return false; const n=it.name; typeWeapon(it,t); if(it.name!==n) rep.renamed++; return true; }
const bagRule=it=>guessWtype(it)||heroWtypes()[0];
function fixScore(it){ if(!it||!it.stats) return; const v=+it.score; if(!Number.isFinite(v)||v<0||(v===0&&gsCalc(it)>0)){ gsOf(it); rep.scores++; } }
function migrate(){ if(WTYPE_READY) return false; rep.ran=true; const cur=heroPick.id;
  // worn, by every hero (the current hero's live set is `gear`; the others' come back from 71-herogear as the very same item objects)
  for(const h of HEROES){ const set=h.id===cur?gear:(Meta.heroGear&&Meta.heroGear.of?Meta.heroGear.of(h.id):null); if(!set) continue;
    const w=set.weapon; if(w&&typeIt(w,wornType(w,h.id))) rep.worn[h.id]=w.wtype; for(const s of SLOTS) fixScore(set[s]); }
  // each hero's 2nd weapon
  const D=window.__dualwield, ST=D&&D.store?D.store():{}; for(const h in ST){ const w=ST[h]; if(w&&typeIt(w,wornType(w,h,true))) rep.w2[h]=w.wtype; fixScore(w); }
  if(gear.weapon2&&typeIt(gear.weapon2,wornType(gear.weapon2,cur,true))) rep.w2[cur]=gear.weapon2.wtype; fixScore(gear.weapon2); fixScore(gear.familiar2);
  for(const it of Meta.bag()){ if(typeIt(it,bagRule(it))) rep.bag++; fixScore(it); }
  for(const it of (Meta.armory?Meta.armory():[])){ if(typeIt(it,bagRule(it))) rep.armory++; fixScore(it); }
  for(const it of (Meta.stock?Meta.stock():[])){ if(typeIt(it,bagRule(it))) rep.stock++; fixScore(it); }
  // what waits outside the game's own lists: the Forest locker's last piece, and the hideout hand-offs (game items carried there, records coming back -- 97-mythics normalize keeps rec.wtype)
  { const o=parse('dd_forest_locker'); if(o&&o.item&&typeIt(o.item,bagRule(o.item))){ rep.locker++; write('dd_forest_locker',o); } }
  { const a=parse('dd_gear_carried'); if(Array.isArray(a)){ let n=0; for(const r of a) if(r&&r.slot==='weapon'&&typeIt(r,bagRule(r))) n++; if(n){ rep.carried=n; write('dd_gear_carried',a); } } }
  { const a=parse('dd_gear_return'); if(Array.isArray(a)){ let n=0; for(const r of a){ if(!r||typeof r!=='object') continue; const slot=r.slot||(r.type==='weapon'?'weapon':null); if(slot!=='weapon'||WTYPES.includes(r.wtype)) continue; const t=guessWtype(r)||(r.named&&NAMED_WTYPE[r.named])||heroWtypes()[0]; r.wtype=t; if(r.hideout&&r.hideout.rec&&typeof r.hideout.rec==='object') r.hideout.rec.wtype=t; n++; } if(n){ rep.returning=n; write('dd_gear_return',a); } } }
  WTYPE_READY=true; try{ localStorage.setItem(FLAG,'1'); }catch(e){}
  try{ saveGear(); }catch(e){} try{ if(Meta.heroGear&&Meta.heroGear.save) Meta.heroGear.save(); }catch(e){} try{ if(Meta.armory) write('ddArmory',Meta.armory()); }catch(e){} try{ Meta.save(); }catch(e){}
  try{ applyGear(); }catch(e){} return true; }
try{ migrate(); }catch(e){ console.warn('typed weapons: migration',e); WTYPE_READY=true; try{ localStorage.setItem(FLAG,'1'); }catch(er){} }
// ---- the equip rule, around every other wrap of Meta.equip (this file is the last): a weapon of a type this hero cannot use is refused, in pictures
function findAny(id){ const b=Meta.bag().find(x=>x&&x.id===id); if(b) return b; const w=Meta.heroGear&&Meta.heroGear.whereWorn?Meta.heroGear.whereWorn(id):null; if(w) return w.it; return (Meta.armory?Meta.armory():[]).find(x=>x&&x.id===id)||null; }
function refuseHtml(it){ return '🚫 '+WEAPON_EMBLEM[wtypeOf(it)]+' ➜ '+wieldersHtml(it); }
{ const prev=Meta.equip; Meta.equip=function(id){ const it=findAny(id); if(it&&it.slot==='weapon'&&!canWield(it)){ rep.refused++; toast(refuseHtml(it)); try{ SFX.no?SFX.no():beep(180,.12,'square',.04,-60); }catch(e){} return false; } return prev.apply(this,arguments); }; }
// ---- the bag's panel: the Equip button of a piece this hero cannot use becomes the picture, disabled
if(typeof tvRenderDetail==='function'){ const prev=tvRenderDetail; tvRenderDetail=function(){ const r=prev.apply(this,arguments); try{ const s=TV.sel; if(!s||s.from!=='bag') return r; const it=Meta.bag().find(b=>b.id===s.id); if(!it||it.slot!=='weapon'||canWield(it)) return r;
    const b=document.querySelector('#tv-detail [data-act="equip"]'); if(b){ b.outerHTML='<button class="tv-btn tw-no" data-act="equip" data-id="'+it.id+'" disabled title="'+WTYPE_WORD[wtypeOf(it)]+' -- not for this hero">'+refuseHtml(it)+'</button>'; } }catch(e){} return r; }; }
// ---- the look
{ const st=document.createElement('style'); st.id='tw-css'; st.textContent=
 '.gs-b{display:inline-block;font:800 10px/1.25 sans-serif;letter-spacing:.3px;color:#ffe08a;background:linear-gradient(#3e2a0a,#1c1204);border:1px solid #c8963a;border-radius:4px;padding:0 4px;vertical-align:middle;text-shadow:0 1px 0 #000;white-space:nowrap;box-shadow:0 0 4px #0008}'
+'.tv-tile .gs-b.gs-t{position:absolute;left:2px;bottom:1px;font-size:clamp(6px,calc(var(--tw,58px)*.155),9px);padding:0 2px;line-height:1.15;z-index:2;pointer-events:none;border-radius:3px}'
+'.tv-tile .gs-b.gs-t .wt{font-style:normal;margin-right:2px;filter:drop-shadow(0 0 1px #000)}.tv-tile .lk{bottom:calc(1px + clamp(6px,calc(var(--tw,58px)*.155),9px) + 4px)!important}'
+'.tv-tile .gs-b.gs-t .wt.no{filter:grayscale(.9);opacity:.7}'
+'.tv-gsl{display:flex;gap:6px;align-items:center;flex-wrap:wrap;margin:2px 0 1px}'
+'.wt-chip{display:inline-block;font-size:11px;line-height:1.35;padding:0 5px;border:1px solid #6b5a3c;border-radius:4px;background:#0007;color:#e8dcc0;vertical-align:middle;white-space:nowrap}.wt-chip.no{border-color:#c0442a;color:#ff9a7a;background:#3a0c0688}'
+'.bs-eq .bs-gs{display:flex;align-items:center;gap:5px;margin-top:3px}.bs-eq .bs-gs .wt{font-size:13px;filter:drop-shadow(0 0 2px #000)}'
+'.gs-total{display:inline-flex;align-items:center;gap:6px;font:800 13px/1.2 Cinzel,Georgia,serif;letter-spacing:1.5px;color:#ffe9a8;background:linear-gradient(#4a320c,#1e1405);border:1.5px solid #e0b04c;border-radius:7px;padding:3px 10px;box-shadow:0 0 0 1px #000,0 0 10px #e8b94a44;text-shadow:0 1px 0 #000;white-space:nowrap}'
+'.bs-eqh .gs-total{flex:none;font-size:14px}#doll .dl-gold .gs-total{margin-left:4px;font-size:11px;line-height:1;padding:0 6px;border-width:1px;box-shadow:none;vertical-align:baseline;display:inline}#doll .dl-gold .gs-total b{color:#fff3c4}'
+'#doll .inv-c{position:relative}#doll .inv-c .gs-b.gs-t{position:absolute;left:50%;top:1px;transform:translateX(-50%);font-size:8px;padding:0 2px;line-height:1.15;z-index:2;pointer-events:none}#doll .gs-pl{font-size:9px;margin-left:4px}'
+'.tw-no,.tw-no:disabled{opacity:1!important;background:#2a0e0c!important;cursor:not-allowed!important;border-color:#c0442a!important;color:#ffb09a!important;filter:none!important}'
+'#doll .inv-c span.tv-setbadge{display:block;width:15px;height:15px;z-index:2}#doll .inv-c span .ia:not(.bad)+.ie{display:none}#doll .inv-c span .ie{width:auto;height:auto}'   /* the Tab sheet's inventory: its 86% span rule (68-paperdoll) also caught the set badge and the emblem under a picture -- huge rings and a doubled picture since build 514/524 */
+'#pickcard .gs-b{font-size:9px}#pickcard .wt-chip{font-size:10px}';
 document.head.appendChild(st); }
window.__typed={ report:()=>JSON.parse(JSON.stringify(rep)), migrate:()=>{ WTYPE_READY=false; try{ localStorage.removeItem(FLAG); }catch(e){} return migrate(); }, ready:()=>WTYPE_READY,
  of:it=>wtypeOf(it), can:(it,h)=>canWield(it,h), heroTypes:h=>heroWtypes(h).slice(), roll:h=>rollWtype(h), force:t=>{ WTYPE_FORCE=t||null; }, type:(it,t)=>typeWeapon(it,t), guess:it=>guessWtype(it),
  bases:()=>JSON.parse(JSON.stringify(WTYPE_BASES)), named:()=>Object.assign({},NAMED_WTYPE), wielders:t=>(WTYPE_HEROES[t]||[]).slice(), FLAG };
window.__gearscore={ of:it=>gsOf(it), total:()=>gearScoreTotal(), parts:()=>gearScoreParts().map(it=>({id:it.id,slot:it.slot,score:gsOf(it)})), badge:it=>gsBadge(it), calc:it=>gsCalc(it) };
})();
