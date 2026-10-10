// ===== KEEP THE MOUSE IN THE HALL (build 398). Matt: "we need to do something to keep the mouse on screen ... the mouse sometimes goes off screen and takes a second to figure out, for example when he came back from the hideout
// his pointer was on a different monitor". The hall looks around with a captured mouse (pointer lock). The hideout's own page captures it while you are in there and lets go as you step out -- and the hall never took it back,
// so the next swing of the hand to look around threw a loose pointer across the desk onto the other monitor, with nothing on screen to say so (the PAUSED card only comes up when the HALL loses the mouse, and it never had it).
// Now: the moment the hall is back in front of you -- out of the hideout, the Tavern or bag closed, the sheet or the sound card shut -- it takes the mouse back at once (a few tries over half a second, since the hideout lets go a
// beat after the key that left). If the browser still says no, the PAUSED card comes up in the middle of the screen: one click on RESUME and you are in. Never a loose pointer in the hall with no sign of it.
// Not on touch, not on the title or the end screens, not while another screen is up. Test hook: window.__mousekeep.
(function(){
'use strict';
const hideoutOpen=()=>!!(window.__hideout&&window.__hideout.isOpen&&window.__hideout.isOpen());
const overlay=()=>!!Meta.isOpen()||hideoutOpen()||!!(window.__blueprints&&window.__blueprints.isOpen());   // build 617: the Blueprint Book (99zd) is a menu too
const screenUp=()=>!!document.querySelector('.screen:not(.hide)');
const wantPlay=()=>!TOUCH&&(S.phase==='build'||S.phase==='wave')&&!overlay()&&!screenUp();
const RETRY=[0,120,300,600], GIVE_UP=900;
const cnt={ returns:0, tries:0, ok:0, fallback:0 };
let wasOver=overlay(), chase=null;
function have(){ return document.pointerLockElement===canvas; }
function ask(){ if(chase&&window.__pause&&window.__pause.isOpen()) window.__pause.close(false);   /* the hideout letting go of the mouse a beat late can flash the PAUSED card up: on the way back in, that is not a pause */
  if(!wantPlay()||have()||!canvas.requestPointerLock) return; cnt.tries++; try{ canvas.requestPointerLock(); }catch(e){} }
function back(){ cnt.returns++; const t0=performance.now(); if(chase) chase.forEach(clearTimeout); chase=RETRY.map(ms=>setTimeout(ask,ms)); chase.push(setTimeout(()=>{ chase=null; if(have()||!wantPlay()) return; cnt.fallback++; prompt(true); },GIVE_UP)); }
// build 423 (Matt: "he tries to esc out and it takes him to the gui that takes you to title screen"): a browser never hands the mouse over off an Escape -- so after Esc closed a menu the fallback was the
// PAUSED card (with RETURN TO TITLE). Now it is only a small "click to play" in the middle of the hall; a click takes the mouse (game.js mousedown) and it goes. No menu.
const pr=document.createElement('div'); pr.id='clickToPlay'; pr.innerHTML='🖱 <b>CLICK</b> TO PLAY'; pr.style.cssText='position:fixed;left:50%;top:46%;transform:translate(-50%,-50%);z-index:9;display:none;padding:10px 18px;border-radius:12px;background:#140e1ae0;border:2px solid #ffd27a;color:#ffd27a;font:800 16px Georgia,serif;letter-spacing:2px;pointer-events:none;box-shadow:0 0 18px #000'; document.body.appendChild(pr);
function prompt(on){ on=!!on; if((pr.style.display==='block')!==on) pr.style.display=on?'block':'none'; }
setInterval(()=>{ if(pr.style.display==='block'&&(have()||!wantPlay())) prompt(false); },100);
document.addEventListener('pointerlockchange',()=>{ if(have()&&chase){ cnt.ok++; chase.forEach(clearTimeout); chase=null; } });
// every overlay that hands the hall back: watched, so a new menu needs nothing extra to join in
setInterval(()=>{ const o=overlay(); if(wasOver&&!o&&wantPlay()&&!have()) back(); wasOver=o; },50);
window.__mousekeep={ prompt:()=>pr.style.display==='block', info:()=>Object.assign({ chasing:!!chase, locked:have(), want:wantPlay() },cnt), back };
})();
