// ===== THE PHONE (build 595). Matt: "Can you make an iPhone version of this while I'm at work today?"
// head.html's first script decides it (window.__PHONE: a touch screen whose short side is under 600 -- never a PC, never an iPad) and has the page lay out landscape as a small laptop
// screen ~600 tall that the phone scales to fit. This module is everything else a phone needs, and only on a phone (body.phone):
//  * the title fits: the hero cards a little smaller and the keyboard hints line gone (the tutorial teaches it), so ENTER THE HALL shows without scrolling;
//  * held upright, a TURN YOUR PHONE card (the game is landscape);
//  * lighter drawing: the 3D view renders at a lower resolution (the phone's screen is tiny and its graphics chip is not a PC's) -- PC and iPad untouched.
// Test hook: window.__phone.
(function(){
'use strict';
const PHONE=!!window.__PHONE;
// every touch screen (the iPad too): the two keyboard actions that had no button -- SELL (X) the tower you stand by, and CANCEL (Esc / right-click) a placement
if(typeof TOUCH!=='undefined'&&TOUCH&&$('btns')){ [['💰','sellBtn','Sell the tower here (X)',()=>{ try{ sell(); }catch(e){} }],['✖','cancelBtn','Cancel placing (Esc)',()=>{ try{ if(placing) cancelPlace(); }catch(e){} }]].forEach(([t,id,ti,f])=>{ const b=document.createElement('div'); b.className='hb'; b.id=id; b.textContent=t; b.title=ti; b.addEventListener('touchstart',e=>{ e.preventDefault(); f(); },{passive:false}); $('btns').appendChild(b); });
  // one or the other, so the buttons stay a tidy 3 x 3: CANCEL only while placing, SELL the rest of the time
  { const prev=Meta.update; Meta.update=dt=>{ prev(dt); const p=!!(typeof placing!=='undefined'&&placing), c=document.getElementById('cancelBtn'), s=document.getElementById('sellBtn'); if(c&&(c.style.display==='none')===p) c.style.display=p?'':'none'; if(s&&(s.style.display==='none')!==p) s.style.display=p?'none':''; }; } }
window.__phone={ on:PHONE, info:()=>({ on:PHONE }) };
if(!PHONE) return;
document.body.classList.add('phone');
const css=document.createElement('style'); css.textContent=
  // the title: shorter hero row, no hints line
  // the touch buttons: thumb-sized (a page pixel is ~0.56 of a phone's), three across under the mini-map, read from the bottom right so SWING sits under the thumb
  'body.phone #btns{grid-template-columns:repeat(3,auto);gap:10px;right:16px;bottom:16px;transform:rotate(180deg)}body.phone #btns .hb{width:78px;height:78px;font-size:32px;transform:rotate(180deg)}'
 +'body.phone #joy{width:180px;height:180px;left:34px;bottom:34px}body.phone #joy i{left:57px;top:57px;width:64px;height:64px}'
 // the notch: keep the HUD clear of it (the page runs under it when opened from the home screen); no pinch-zoom (it threw the joystick and look off), scrolling menus still scroll
 +'body.phone #hud{left:env(safe-area-inset-left,0px);right:env(safe-area-inset-right,0px)}body.phone{touch-action:pan-x pan-y;-webkit-user-select:none;user-select:none;-webkit-touch-callout:none}body.phone canvas{touch-action:none}'
 +'body.phone #essentials{display:none}body.phone #heroline{transform:scale(.62);transform-origin:top center;margin:-6px 0 -96px}body.phone #start h2{margin-bottom:4px}'
  // upright: turn it
 +'#phoneTurn{position:fixed;inset:0;z-index:2147482000;display:none;align-items:center;justify-content:center;flex-direction:column;gap:14px;background:#0b0712;color:#ffe2b8;font:bold 20px Georgia,serif;text-align:center;padding:24px}'
 +'#phoneTurn .ph{font-size:64px;animation:phTurn 1.6s ease-in-out infinite}@keyframes phTurn{0%,30%{transform:rotate(0)}60%,100%{transform:rotate(-90deg)}}#phoneTurn small{font:14px Georgia,serif;color:#c9b8a0}'
 +'@media (orientation: portrait){body.phone #phoneTurn{display:flex}}';
document.head.appendChild(css);
const turn=document.createElement('div'); turn.id='phoneTurn'; turn.innerHTML='<div class="ph">📱</div><div>TURN YOUR PHONE SIDEWAYS</div><small>Rootgate plays in landscape</small>'; document.body.appendChild(turn);
// memory: an iPhone closes a page that holds too much, and the models carry big textures (2048 and up). On a phone every loaded texture picture is drawn down to 1024 at most as it
// goes to the graphics chip -- a quarter of the memory or less for the big ones, no visible difference on a 6-inch screen. Pictures the game draws itself (canvases it keeps redrawing) are left alone.
const MAXT=1024, cntT={ shrunk:0, saved:0 };
function shrink(t){ const im=t&&t.image; if(!im||t.__phoneShrunk||t.isDataTexture||t.isCompressedTexture||t.isVideoTexture) return; if(typeof HTMLCanvasElement!=='undefined'&&im instanceof HTMLCanvasElement) return;
  const w=im.width||0, h=im.height||0; if(!w||!h||Math.max(w,h)<=MAXT) return; const k=MAXT/Math.max(w,h), c=document.createElement('canvas'); c.width=Math.max(1,Math.round(w*k)); c.height=Math.max(1,Math.round(h*k));
  try{ c.getContext('2d').drawImage(im,0,0,c.width,c.height); t.image=c; t.__phoneShrunk=true; cntT.shrunk++; cntT.saved+=(w*h-c.width*c.height)*4; }catch(e){} }
{ const d=Object.getOwnPropertyDescriptor(THREE.Texture.prototype,'needsUpdate'); if(d&&d.set) Object.defineProperty(THREE.Texture.prototype,'needsUpdate',{ configurable:true, get:d.get, set(v){ if(v===true) shrink(this); d.set.call(this,v); } }); }
// sound: an iPhone opens a page's sound only on a tap that ENDS (touchend) -- wake it then too
addEventListener('touchend',()=>{ try{ if(typeof ac!=='undefined'&&ac&&ac.state==='suspended') ac.resume(); }catch(e){} },{ passive:true, capture:true });
// lighter drawing: the 3D view at about one pixel per page pixel (the page is ~1300 wide on a phone: sharp enough on a 6-inch screen, a fraction of the work)
const PR=1;
function lighten(){ try{ if(renderer.getPixelRatio()!==PR){ renderer.setPixelRatio(PR); renderer.setSize(innerWidth,innerHeight,false); } }catch(e){} }
lighten(); addEventListener('resize',()=>setTimeout(lighten,50)); addEventListener('phonefit',()=>setTimeout(lighten,50));
{ const prev=Meta.update; let t=0; Meta.update=dt=>{ prev(dt); t+=dt; if(t>2){ t=0; lighten(); } }; }   // anything that sets it back (a resize handler of the game's own) is undone within a moment
window.__phone={ on:true, info:()=>({ on:true, pr:renderer.getPixelRatio(), w:innerWidth, h:innerHeight, shrunk:cntT.shrunk, savedMB:Math.round(cntT.saved/1048576) }) };
})();
