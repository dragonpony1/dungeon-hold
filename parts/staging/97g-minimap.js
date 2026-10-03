// ===== THE MINI-MAP (build 399). OJ's idea, through Matt: "mini map, up in the right corner, shows mobs moving, mana and loot all in different colors, as small dots".
// The whole map, top-right under the buttons, drawn once (the floor, shaded lighter the higher it stands, the water, the gates) and the live dots over it ten-odd times a second:
//   mobs RED (a boss bigger, ringed), flyers ORANGE, mana BLUE, loot GOLD, your towers faint GREEN squares, a co-op friend CYAN, the Heartroot a GOLD diamond, you a WHITE arrow pointing where you look.
// It stands still (up = the way you face as a map starts), so a glance reads the same every time. M hides / shows it (remembered). A co-op guest's mobs are the host's (the puppets).
// Test hook: window.__minimap.
(function(){
'use strict';
const SIZE=176, PAD=6, KEY='dd_minimap';
const css=document.createElement('style'); css.textContent=
 '#minimap{position:fixed;top:112px;right:14px;width:'+SIZE+'px;height:'+SIZE+'px;z-index:6;pointer-events:none;border-radius:10px;border:2px solid #6b5a3c;background:#0b0712b8;box-shadow:0 3px 0 #000,0 0 14px #000a;display:none}'
+'#mmWave{position:fixed;top:'+(112+SIZE+8)+'px;right:14px;width:'+(SIZE+4)+'px;box-sizing:border-box;z-index:6;pointer-events:none;text-align:center;padding:5px 6px;border-radius:9px;border:2px solid #6b5a3c;background:#0b0712d0;box-shadow:0 3px 0 #000;color:#ffd27a;font:800 14px Georgia,serif;letter-spacing:2px;display:none}#mmWave.on{display:block}#mmWave small{font:700 10px system-ui;letter-spacing:1px;color:#bfae90;margin-right:6px}#mmWave.fight{color:#ff8a6a;border-color:#a04a3a}#mmWave.held{color:#8ef05a}'
+'#minimap.on{display:block}#minimap canvas{width:100%;height:100%;display:block;border-radius:8px}';
document.head.appendChild(css);
const box=document.createElement('div'); box.id='minimap'; const cv=document.createElement('canvas'); box.appendChild(cv); document.body.appendChild(box);
// build 406 (Matt: "add next to the mini map what wave we're on so we can see during build phase"): a strip under the map -- NEXT · WAVE n/N while building, WAVE n/N (red) in the fight, ✓ ALL N HELD once the map is held.
// A co-op guest reads the host's wave and phase (99-network.js world); the strip shows whether or not the map itself is hidden with M.
const wv=document.createElement('div'); wv.id='mmWave'; document.body.appendChild(wv);
function waveText(){ const n=window.__net, guest=n&&n.role&&n.role()==='guest', w=guest&&n.world?n.world():null; const ph=(w&&typeof w.phase==='string')?w.phase:S.phase, cur=(w&&Number.isFinite(w.wave))?w.wave:S.wave, tot=(w&&Number.isFinite(w.waveTotal))?w.waveTotal:runWaves();
  if(S.held||(w&&w.held)||ph==='won') return ['✓ ALL '+tot+' HELD','held']; if(ph==='wave') return ['WAVE '+cur+' / '+tot,'fight']; return ['<small>NEXT</small>WAVE '+Math.min(tot,cur+1)+' / '+tot,'']; }
let lastWv='';
function tickWave(){ const on=(S.phase==='build'||S.phase==='wave'||S.phase==='won')&&!(window.__hideout&&window.__hideout.isOpen&&window.__hideout.isOpen()); if(wv.classList.contains('on')!==on) wv.classList.toggle('on',on); if(!on) return; const top=(box.classList.contains('on')?112+SIZE+8:112)+'px'; if(wv.style.top!==top) wv.style.top=top;   /* the map hidden (M): the strip takes its place */
  let [t,c]=waveText(); const DF=window.__difficulty&&window.__difficulty.level(); if(DF&&DF.id!=='normal') t+=' <small style="margin:0 0 0 6px;color:'+DF.col+'">'+DF.ic+' '+DF.name+'</small>';   /* build 415 */
  const k=t+c; if(k!==lastWv){ lastWv=k; wv.innerHTML=t; wv.className='on'+(c?' '+c:''); } }
const DPR=Math.min(2,window.devicePixelRatio||1); cv.width=cv.height=Math.round(SIZE*DPR); const g=cv.getContext('2d');
let want=true; try{ want=localStorage.getItem(KEY)!=='off'; }catch(e){}
const cnt={ draws:0, mobs:0, fly:0, orbs:0, loot:0, defs:0, mates:0, homes:0 };
// map -> canvas: the whole grid fits, centred; x right, z down (up = the way you face on arrival)
let x0=GW, x1=0, z0=GH, z1=0; for(let cz=0;cz<GH;cz++) for(let cx=0;cx<GW;cx++){ const t=gat(cx,cz); if(t===T.WALL||t===T.PILLAR) continue; if(cx<x0) x0=cx; if(cx>x1) x1=cx; if(cz<z0) z0=cz; if(cz>z1) z1=cz; }   /* fitted to the floor, not the whole grid (the outer walls are empty space) */
if(x1<x0){ x0=0; x1=GW-1; z0=0; z1=GH-1; }
const span=Math.max(x1-x0+1,z1-z0+1), k=(SIZE-PAD*2)*DPR/span, ox=(SIZE*DPR-(x1-x0+1)*k)/2-x0*k, oz=(SIZE*DPR-(z1-z0+1)*k)/2-z0*k;
const px=x=>ox+((x+OX)/CELL)*k, pz=z=>oz+((z+OZ)/CELL)*k;
let bg=null;
function drawBg(){ bg=document.createElement('canvas'); bg.width=bg.height=cv.width; const b=bg.getContext('2d'); let hmax=1; for(let i=0;i<GW*GH;i++) hmax=Math.max(hmax,hgt[i]||0);
  for(let cz=0;cz<GH;cz++) for(let cx=0;cx<GW;cx++){ const t=gat(cx,cz); if(t===T.WALL||t===T.PILLAR) continue; let col;
    if(t===T.WATER) col='#1f4466'; else if(t===T.SPAWN) col='#6a2630'; else { const h=Math.max(0,hgt[idx(cx,cz)]||0)/hmax, l=Math.round(30+h*26); col='hsl(270,14%,'+l+'%)'; }
    b.fillStyle=col; b.fillRect(ox+cx*k,oz+cz*k,Math.ceil(k)+.5,Math.ceil(k)+.5); } }
function dot(x,z,r,col,ring){ g.beginPath(); g.arc(px(x),pz(z),r*DPR,0,6.2832); g.fillStyle=col; g.fill(); if(ring){ g.lineWidth=1.2*DPR; g.strokeStyle=ring; g.stroke(); } }
// co-op sweep 2026-10-02 (hud-ui): a guest's map was nearly empty -- MOBPUP is private to 99-network's closure (the read threw, so no mobs), and its towers, mana orbs and
// teammates are puppets, not the local defs/orbs/Meta.heroes (host-only). On a guest it now reads the window accessors 99-network/98-party export (resolved at draw time);
// flyers go orange by MOBS[k].fly as the host's e.fly does (moths, wraiths, Avery). Single player and the host draw exactly as before.
const isGuest=()=>{ const n=window.__net; return !!(n&&n.role&&n.role()==='guest'); };
const BOSS=new Set(['cyclops','pigflail','pigdagger','pigsling','trollboss','archhag','corruptor','direwolf']);
function mobs(){ if(isGuest()){ try{ const M=window.__mobsync; return (M&&M.foes?M.foes():[]).map(q=>({x:q.x,z:q.z,kind:q.kind,fly:!!(q.fly||(MOBS[q.kind]&&MOBS[q.kind].fly))})); }catch(e){ return []; } } return enemies.filter(e=>!e.dead); }
const sq=(x,z)=>{ const s=2.6*DPR; g.fillStyle='#6fdc7aaa'; g.fillRect(px(x)-s/2,pz(z)-s/2,s,s); };
function draw(){ if(!bg) drawBg(); g.clearRect(0,0,cv.width,cv.height); g.drawImage(bg,0,0); cnt.draws++;
  const gu=isGuest();
  if(gu){ cnt.defs=0; try{ const D=window.__defsync, ids=D?D.list():[]; for(const id of ids){ const d=D.get(id); if(d) sq(d.x,d.z); } cnt.defs=ids.length; }catch(e){} }
  else { for(const d of defs) sq(d.x,d.z); cnt.defs=defs.length; }
  // the Heartroot
  { const x=px(0), z=pz(0), s=4.2*DPR; g.beginPath(); g.moveTo(x,z-s); g.lineTo(x+s,z); g.lineTo(x,z+s); g.lineTo(x-s,z); g.closePath(); g.fillStyle='#ffd27a'; g.fill(); g.lineWidth=DPR; g.strokeStyle='#000a'; g.stroke(); }
  if(gu){ cnt.orbs=0; try{ const P=window.__pickupsync, ids=P?P.orbs():[]; for(const id of ids){ const o=P.orbAt(id); if(o) dot(o.x,o.z,1.8,'#59c8ff'); } cnt.orbs=ids.length; }catch(e){} }
  else { for(const o of orbs) dot(o.x,o.z,1.8,'#59c8ff'); cnt.orbs=orbs.length; }
  for(const l of loot) dot(l.x,l.z,2.5,'#ffd040','#000a'); cnt.loot=loot.length;
  const ms=mobs(); for(const e of ms){ if(BOSS.has(e.kind)) dot(e.x,e.z,3.6,'#ff3a3a','#ffd0d0'); else dot(e.x,e.z,2.2,e.fly?'#ff9a3a':'#ff4646'); } cnt.mobs=ms.length; cnt.fly=ms.filter(e=>e.fly).length;
  let mates=[]; try{ mates=gu?(window.__party?window.__party.list().map(id=>window.__party.get(id)).filter(p=>p&&!p.dead):[]):((Meta.heroes&&Meta.heroes())||[]); }catch(e){} for(const h of mates){ if(h&&!(h.isDead&&h.isDead())) dot(h.x,h.z,2.4,'#5ff0ff','#000a'); } cnt.mates=mates.length;
  // build 508 (Matt approved, co-op): on the host's map a guest in the hideout carries the same 🏠 as over its gnome (99d2-hideoutbadge.js)
  cnt.homes=0; if(!gu&&window.__hideoutBadge){ const inn=new Set(window.__hideoutBadge.ids()); if(inn.size){ g.font=Math.round(10*DPR)+'px "Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji",sans-serif'; g.textAlign='center'; g.textBaseline='middle'; for(const h of mates){ if(h&&h.gid&&inn.has(h.gid)){ g.fillText('\u{1F3E0}',px(h.x)+5*DPR,pz(h.z)-5*DPR); cnt.homes++; } } } }
  // you: an arrow along where the camera looks
  if(hero.dead<=0){ const x=px(hero.x), z=pz(hero.z), a=cam.yaw, fx=Math.sin(a), fz=Math.cos(a), s=5*DPR; g.beginPath(); g.moveTo(x+fx*s,z+fz*s); g.lineTo(x-fx*s*.6+fz*s*.55,z-fz*s*.6-fx*s*.55); g.lineTo(x-fx*s*.25,z-fz*s*.25); g.lineTo(x-fx*s*.6-fz*s*.55,z-fz*s*.6+fx*s*.55); g.closePath(); g.fillStyle='#ffffff'; g.fill(); g.lineWidth=DPR; g.strokeStyle='#000'; g.stroke(); } }
const show=()=>want&&(S.phase==='build'||S.phase==='wave')&&!(window.__hideout&&window.__hideout.isOpen&&window.__hideout.isOpen());
let last=0;
function tick(now){ tickWave(); const on=show(); if(box.classList.contains('on')!==on) box.classList.toggle('on',on); if(on&&now-last>70){ last=now; try{ draw(); }catch(e){} } }
{ const prev=Meta.update; Meta.update=dt=>{ prev(dt); tick(performance.now()); }; }
addEventListener('keydown',e=>{ if(e.code!=='KeyM'||e.repeat) return; const ae=document.activeElement; if(ae&&(ae.tagName==='INPUT'||ae.tagName==='TEXTAREA')) return; if(S.phase==='start') return; want=!want; try{ localStorage.setItem(KEY,want?'on':'off'); }catch(er){} toast(want?'🗺 Map on (M)':'🗺 Map off (M)'); },true);
window.__minimap={ wave:()=>({ on:wv.classList.contains('on'), text:wv.textContent, cls:wv.className }), info:()=>Object.assign({ on:box.classList.contains('on'), want },cnt), draw, toggle:v=>{ want=v===undefined?!want:!!v; return want; }, px, pz, canvas:cv };
})();
