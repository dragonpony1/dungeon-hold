// ===== THE HOST SEES WHO IS IN THE HIDEOUT (build 508, Matt approved, co-op). A guest who steps through the portal shops in the hideout while its gnome stands in the hall, and the host could not tell -- so
// the wave horn pulled the guest out mid-shopping. Now, on the HOST's screen, a small 🏠 floats over that guest's gnome, bobbing gently, for as long as 99d-coophideout.js has the guest on its list of who is
// inside (its hdpos reports put it there; hdout, the reports stopping, or its link closing take it off), and the same 🏠 sits beside its dot on the mini-map (97g-minimap.js reads ids()). A picture only:
// the horn and the wave clock are untouched. The badge stands at the gnome's last spot (98-party.js keeps it), over everything (no depth test). Test hook: window.__hideoutBadge.
(function(){
'use strict';
if(TUTORIAL) return;
const LIFT=2.6, SIZE=.95, BOB=.12;
let TEX=null; function tex(){ if(TEX) return TEX; const c=document.createElement('canvas'); c.width=c.height=128; const g=c.getContext('2d');
  g.fillStyle='rgba(22,12,32,.78)'; g.beginPath(); g.arc(64,64,58,0,Math.PI*2); g.fill(); g.lineWidth=7; g.strokeStyle='#ffd27a'; g.stroke();
  g.font='70px "Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji",sans-serif'; g.textAlign='center'; g.textBaseline='middle'; g.fillText('\u{1F3E0}',64,70);
  TEX=new THREE.CanvasTexture(c); TEX.encoding=THREE.sRGBEncoding; return TEX; }
const B=new Map();   // guest id -> { s (the sprite), x, y, z (its gnome's spot), ph }
const cnt={ made:0, dropped:0, ticks:0 };
function make(){ const s=new THREE.Sprite(new THREE.SpriteMaterial({ map:tex(), depthTest:false, depthWrite:false, transparent:true })); s.scale.set(SIZE,SIZE,1); s.renderOrder=999; s.userData.noOL=true; scene.add(s); return s; }
function drop(id){ const b=B.get(id); if(!b) return; scene.remove(b.s); b.s.material.dispose(); B.delete(id); cnt.dropped++; }
function place(b,t){ b.s.position.set(b.x,b.y+LIFT+Math.sin(t*2.2+b.ph)*BOB,b.z); }
function inside(){ const C=window.__coopHideout; if(!C||!C.peers) return []; try{ return C.peers().map(p=>p.id); }catch(e){ return []; } }
function tick(){ cnt.ticks++; const n=window.__net, P=window.__party, host=!!(n&&n.role&&n.role()==='host'&&P&&P.get), want=new Set(host?inside():[]);
  for(const id of [...B.keys()]) if(!want.has(id)||!P||!P.get(id)) drop(id);   // out of the hideout, gone from the hall, or no longer hosting
  for(const id of want){ const p=P.get(id); if(!p) continue; let b=B.get(id); if(!b){ b={ s:make(), ph:Math.random()*6.28 }; B.set(id,b); cnt.made++; } b.x=p.x; b.y=p.y||0; b.z=p.z; place(b,S.t); } }
setInterval(tick,250);
WORLDANIM.push((dt,t)=>{ B.forEach(b=>place(b,t)); });   // the gentle bob, every frame the hall animates
window.__hideoutBadge={ ids:()=>[...B.keys()], tick, info:()=>Object.assign({ n:B.size, list:[...B.entries()].map(([id,b])=>({ id, x:+b.s.position.x.toFixed(2), y:+b.s.position.y.toFixed(2), z:+b.s.position.z.toFixed(2), visible:b.s.visible, depthTest:b.s.material.depthTest, inScene:!!b.s.parent })) },cnt) };
})();
