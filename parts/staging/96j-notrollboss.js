// ===== NO TROLL BOSS IN THE WAVES (build 326). Matt: "you can take the troll boss out, hes a miss". The lavender healer no longer comes in any wave (campaign every fifth wave from the
// twelfth; Survival's boss waves, which he led out) -- on a Survival boss wave the first of its ogre guard leads it out instead. He still exists for the dev panel. Loaded after every other
// waveComp wrap (56d, 95c, 95d...), so it cleans the final list.
(function(){
'use strict';
{ const prev=waveComp; waveComp=function(w){ const c=prev(w); if(!c||!Array.isArray(c.q)) return c; const n=c.q.length; c.q=c.q.filter(x=>x.kind!=='trollboss'); if(c.q.length===n) return c;
    if(c.boss){ const og=c.q.find(x=>x.kind==='ogre'); if(og){ og.t=1; c.q.sort((a,b)=>a.t-b.t); } }
    if(c.desc) c.desc=String(c.desc).replace(/ · A TROLL BOSS/,''); return c; }; }
})();
