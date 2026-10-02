// ===== THE CAMERA GLIDES UP AND DOWN STAIRS (build 498). Matt: "the camera shake on the stairs, can you fix that". A stair (ramp(), "a whole step a square") lifts the hero a whole step at a time --
// 0, 1, 2, 3 -- and the camera, aimed at the hero's height, jumped with every step: on a long flight it shook. It now aims at a SMOOTHED height that glides to the hero's (about a tenth of a second
// behind), so a flight reads as one smooth climb. A big change (a teleport, a fall off a wall, a respawn) still snaps straight there. Every map's stairs (the Drawbridge's switchbacks, the Deep Prison's
// flights). Last in the module order on purpose: every other camera wrap (the yard roof's clamp, the cut scenes) sees the smoothed height. Test hook: window.__camsmooth.
(function(){
'use strict';
const SNAP=3, RATE=11;   // a jump of more than SNAP units is not a stair; RATE: how fast the camera's height catches up (per second, exponential)
let sy=null, real=0; const cnt={ snaps:0 };
{ const prev=updateCamera; updateCamera=function(dt){ if(S.phase==='start'||!hero){ sy=null; return prev.apply(this,arguments); }
    real=hero.y||0; if(sy===null||Math.abs(real-sy)>SNAP||!(dt>0)){ if(sy!==null&&Math.abs(real-sy)>SNAP) cnt.snaps++; sy=real; } else sy+=(real-sy)*(1-Math.exp(-RATE*dt));
    hero.y=sy; try{ return prev.apply(this,arguments); } finally { hero.y=real; } }; }
window.__camsmooth={ info:()=>Object.assign({ smoothY:sy, heroY:real },cnt) };
})();
