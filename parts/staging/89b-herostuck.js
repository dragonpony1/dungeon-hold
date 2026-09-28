// ===== HERO UNSTUCK (build 196). Matt: "stuck again, we need an unstuck button maybe but we also need to talk about
// the hitboxes on defenses, i keep getting stuck in them". Mobs have had a stuck-recovery since build 180
// (88-straggler.js's unstick()), but that one is safe on a much shorter fuse because a MOB's own AI stops trying to
// move once it's in range of its target -- "moving with intent but no progress for 1.5s" only ever means genuinely
// wedged. A PLAYER holding a key is a different animal: walking up to a tower and holding forward a beat too long
// (reading its card, lining up an upgrade click) looks IDENTICAL to that same signal, and correctly stopping at a
// tower's own edge isn't a bug -- confirmed by testing this: a hero walked face-first into an isolated tower and
// correctly stopped there is indistinguishable from "stuck" by hero.moving + no-progress alone. So the automatic
// net here is deliberately a much longer fuse (8s, not 1.5s) -- a backstop for "genuinely forgot this exists",
// not a hair-trigger that second-guesses ordinary standing-at-a-tower moments. The real fix for those is the
// hitbox shrink above; the manual key (U) is the one meant to actually be reached for.
(function(){
if(TUTORIAL) return;
const UNSTICK=8, MOVED=.08;
let wt=0, wx, wz;
// an expanding ring search outward from (x0,z0) for the first point solidAt (game.js) doesn't block the hero at --
// if the hero's own current spot is already clear this returns it unchanged, so a legitimately idle hero (not
// stuck, just standing still) is never actually moved by this
function nearestOpenSpot(x0,z0){ if(!solidAt(x0,z0,hero.y,true)) return [x0,z0];
  for(let r=1;r<=20;r++){ const rr=r*.3; for(let k=0;k<16;k++){ const a=k/16*TAU; const x=x0+Math.cos(a)*rr, z=z0+Math.sin(a)*rr; if(!solidAt(x,z,hero.y,true)) return [x,z]; } }
  return [x0,z0]; }
function tryUnstick(announce){ const [nx,nz]=nearestOpenSpot(hero.x,hero.z); wt=0; wx=hero.x; wz=hero.z;
  if(Math.hypot(nx-hero.x,nz-hero.z)<.05){ if(announce) toast("You're not stuck"); return false; }
  hero.x=nx; hero.z=nz; wx=nx; wz=nz; if(announce) toast('Unstuck!'); return true; }
function tick(dt){ if(hero.dead>0||!hero.moving){ wt=0; wx=hero.x; wz=hero.z; return; }
  if(wx===undefined||Math.hypot(hero.x-wx,hero.z-wz)>MOVED){ wx=hero.x; wz=hero.z; wt=0; return; }
  wt+=dt; if(wt<UNSTICK) return; tryUnstick(false); }
{ const prev=Meta.update; Meta.update=dt=>{ prev(dt); tick(dt); }; }
addEventListener('keydown',e=>{ if(e.code!=='KeyU'||e.repeat||Meta.isOpen()) return; const t=e.target&&e.target.tagName; if(t==='INPUT'||t==='TEXTAREA') return; tryUnstick(true); },true);
window.__herostuck={tryUnstick:()=>tryUnstick(true),nearestOpenSpot};
})();
