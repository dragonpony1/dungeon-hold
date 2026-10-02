// ===== EVERY TOWER COUNTS ITS KILLS (build 463). Matt: "when I look at a tower one of the little numbers should show how many mobs it's killed".
// game.js's hurt() notes which tower dealt a blow (DMGSRC, set while a tower fires, ticks or its shot flies -- and by the trap, pit, electrifier and Sky Wrecker modules); a mob that dies within 1.5 s of
// a tower's blow is that tower's kill (d.kills) -- a mob the hero finishes long after is nobody's. The tower card (60-lootfeel.js) shows 💀 Kills. First in the module order on purpose: these wraps sit
// closest to game.js, so every later module's wraps run around them. Test hook: window.__killcount.
(function(){
'use strict';
// a tower's own shots carry it
{ const prev=fire; fire=function(d,e){ const n0=projs.length; const r=prev.apply(this,arguments); for(let i=n0;i<projs.length;i++){ const p=projs[i]; if(p&&p.src===undefined) p.src=d; } return r; }; }
// nothing is credited outside a tower's own turn
{ const prev=updateDefs; updateDefs=function(){ try{ return prev.apply(this,arguments); } finally { DMGSRC=null; } }; }
{ const prev=updateProj; updateProj=function(){ try{ return prev.apply(this,arguments); } finally { DMGSRC=null; } }; }
// the kill: the tower that struck last (in the last 1.5 s), or the one acting now (a snare's net takes a flyer outright)
let total=0;
{ const prev=kill; kill=function(e){ const was=e&&!e.dead; const r=prev.apply(this,arguments); if(was&&e.dead){ let d=(e.lastDef&&S.t-(e.lastDefT||-99)<=1.5)?e.lastDef:DMGSRC; if(d&&defs.includes(d)){ d.kills=(d.kills|0)+1; total++; } } return r; }; }
window.__killcount={ total:()=>total, of:d=>d?d.kills|0:0 };
})();
