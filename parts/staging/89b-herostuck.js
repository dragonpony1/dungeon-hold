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
const UNSTICK=8, MOVED=.08, HINT=2;
let wt=0, wx, wz;
// build 405 (Matt: "is there an unstuck button" / "or one you can put in fast"): U has always been it, but nothing said so when it mattered. Now:
//   * pushing to move with no headway for HINT (2) seconds flashes a U keycap above the hotbar -- one press and you are out; it goes the moment you move;
//   * on a touch screen (no U key) a 🆘 button sits with the other round buttons;
//   * the Esc menu has ⤴ UNSTUCK too.
const cssU=document.createElement('style'); cssU.textContent='#stuckHint{position:fixed;left:50%;bottom:118px;transform:translateX(-50%);z-index:7;display:none;align-items:center;gap:8px;padding:6px 12px 6px 6px;border-radius:12px;background:#140e1ae6;border:2px solid #ffd27a;box-shadow:0 0 16px #ffd27a66;color:#ffd27a;font:800 13px Georgia,serif;letter-spacing:2px;pointer-events:none;animation:stuckPulse 1s ease-in-out infinite}'
 +'#stuckHint.on{display:flex}#stuckHint b{display:inline-block;min-width:30px;height:30px;line-height:28px;text-align:center;border-radius:7px;background:#2a1f33;border:2px solid #ffd27a;color:#fff;font:800 17px system-ui}@keyframes stuckPulse{0%,100%{box-shadow:0 0 6px #ffd27a44}50%{box-shadow:0 0 22px #ffd27aaa}}';
document.head.appendChild(cssU);
const hintEl=document.createElement('div'); hintEl.id='stuckHint'; hintEl.innerHTML='<b>U</b>⤴ UNSTUCK'; document.body.appendChild(hintEl);
function showHint(on){ on=!!on&&!TOUCH; if(hintEl.classList.contains('on')!==on) hintEl.classList.toggle('on',on); }
// an expanding ring search outward from (x0,z0) for the first point solidAt (game.js) doesn't block the hero at --
// if the hero's own current spot is already clear this returns it unchanged, so a legitimately idle hero (not
// stuck, just standing still) is never actually moved by this
// build 405 (Matt: "u said you are not stuck"): the old test only asked whether the point under the hero was solid -- wedged against a tower's edge, a railing or a stair lip the point is clear
// while every step is blocked, so U answered "You're not stuck". Now it asks what moving asks: can the hero take a step (moveCircle, the hero's own .42 body) in each of 8 directions? Free in 3 or more = not stuck;
// otherwise the nearest spot where he is (searched outward, each at its own floor height -- so a hero sunk below a ledge comes up onto it).
const ARC8=[[1,0],[-1,0],[0,1],[0,-1],[.71,.71],[-.71,.71],[.71,-.71],[-.71,-.71]], FREE=3, STEP=.3;   /* a hero in a corner still has 5 ways out; wedged has 0-2 */
function mobility(x,z,y){ if(solidAt(x,z,y,true)) return 0; let n=0; for(const a of ARC8){ const p={x,z,y}; moveCircle(p,a[0]*STEP,a[1]*STEP,.42,true); if(Math.hypot(p.x-x,p.z-z)>=STEP*.6) n++; } return n; }
function nearestOpenSpot(x0,z0){ if(mobility(x0,z0,hero.y)>=FREE) return [x0,z0];
  for(let r=1;r<=24;r++){ const rr=r*.3; for(let k=0;k<16;k++){ const a=k/16*TAU; const x=x0+Math.cos(a)*rr, z=z0+Math.sin(a)*rr; if(mobility(x,z,baseFloor(x,z))>=FREE) return [x,z]; } }
  return [x0,z0]; }
function tryUnstick(announce){ showHint(false); const [nx,nz]=nearestOpenSpot(hero.x,hero.z); wt=0; wx=hero.x; wz=hero.z;
  if(Math.hypot(nx-hero.x,nz-hero.z)<.05){ if(announce) toast("You're not stuck"); return false; }
  hero.x=nx; hero.z=nz; const fy=baseFloor(nx,nz); if(hero.y<fy) hero.y=fy; hero.vy=0; wx=nx; wz=nz; if(announce) toast('Unstuck!'); return true; }
function tick(dt){ if(hero.dead>0||!hero.moving||Meta.isOpen()){ wt=0; wx=hero.x; wz=hero.z; showHint(false); return; }
  if(wx===undefined||Math.hypot(hero.x-wx,hero.z-wz)>MOVED){ wx=hero.x; wz=hero.z; wt=0; showHint(false); return; }
  wt+=dt; showHint(wt>=HINT); if(wt<UNSTICK) return; tryUnstick(false); }
{ const prev=Meta.update; Meta.update=dt=>{ prev(dt); tick(dt); }; }
addEventListener('keydown',e=>{ if(e.code!=='KeyU'||e.repeat||Meta.isOpen()) return; const t=e.target&&e.target.tagName; if(t==='INPUT'||t==='TEXTAREA') return; tryUnstick(true); },true);
// the touch button (shown only in touch mode, with the other round buttons) and the Esc menu's line
{ const b=document.createElement('div'); b.className='hb'; b.id='unstuckBtn'; b.textContent='🆘'; b.title='Unstuck'; b.addEventListener('pointerdown',e=>{ e.preventDefault(); e.stopPropagation(); tryUnstick(true); }); const host=$('btns'); if(host) host.appendChild(b); }
function pauseButton(){ const pz=document.querySelector('#pause .pz'); if(!pz||pz.querySelector('[data-act="unstuck"]')) return; const b=document.createElement('button'); b.className='quiet'; b.dataset.act='unstuck'; b.textContent='⤴ UNSTUCK (U)';
  b.addEventListener('click',e=>{ e.stopPropagation(); if(window.__pause) window.__pause.close(true); tryUnstick(true); }); const sh=pz.querySelector('[data-act="share"]'); pz.insertBefore(b,sh||null); }
setInterval(pauseButton,400);   /* the Esc menu (97-pause.js) loads after this file and builds itself the first time it opens */
window.__herostuck={tryUnstick:()=>tryUnstick(true),nearestOpenSpot,hint:()=>hintEl.classList.contains('on'),pauseButton,mobility,box:b=>{ RAILBOXES.push(b); return ()=>{ const i=RAILBOXES.indexOf(b); if(i>=0) RAILBOXES.splice(i,1); }; }};   // box: unstuck-test.mjs builds a cage with it
})();
