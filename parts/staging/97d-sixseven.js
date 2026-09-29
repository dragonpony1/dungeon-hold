// ===== 6/7 (build 258): the fourteenth named mythic (97-mythics.js NAMED), a polearm. Matt, 2026-09-29: sent "Storm Halberd 2K PBR.glb" and its inventory icon (Weapon sets / named myths 3D / 67) and said "the polearm is called the 6/7",
// then "it will be in the background rotation with a moniker showing its name" (that part is the title screen: 20b-titlestage.js). The model is Matt's own (parts/assets/named-sixseven.glb, 1K), held by the Knight the way
// The Last Lantern's halberd is (the polearm frame: fist a third of the way up, body-length; 86k-sixseven.js registers it), a storm-blue column with gold motes when it lies on the floor (93c-weaponstand.js).
// The power is MY call (Matt named it, didn't say what it does): the name is the rule -- EVERY 6TH SWING throws lightning through UP TO 7 ENEMIES: the nearest mob in front of you, then jumping to the nearest not-yet-hit mob
// within 4.5 (in sight) until seven are struck, each for 70% of your hero damage. It is on top of the swing's own blow; a lone goblin takes 70% more, a pack takes seven bolts. It draws with Subterfuge's lightning
// (86i-subterfuge.js __subterfuge.draw). Any hero that wears it counts its own attacks. Co-op: a guest's 6th swing tells the host ('sixseven', 99-network.js), which strikes the real mobs from the guest's spot and sends
// back the bolts to draw (powerFx k:'chain'), the way the Rootsplitter's roots and Subterfuge's chains are relayed. Test hook: window.__sixseven.
(function(){
const ID='sixseven', EVERY=6, MAXHIT=7, REACH=4.5, MUL=.7;
let SWINGS=0, FIRED=0, LAST=null;
const mid=e=>({x:e.x,y:(e.y||0)+(e.h||1.2)*.55,z:e.z});
const wears=()=>!!(window.__mythic&&window.__mythic.has(ID));
// the strike itself, from any spot and facing (this hero's 6th swing, or a guest's, relayed): the mobs it took, and the bolt segments to draw
function strike(x,y,z,yaw,dmg){ const fx=Math.sin(yaw), fz=Math.cos(yaw), reach=(hero.reach||2.4)+1.6; let first=null, bd=1e9;
  for(const e of enemies){ if(e.dead) continue; const dx=e.x-x, dz=e.z-z, d=Math.hypot(dx,dz); if(d>reach+e.r) continue; if(d>1.2&&(dx*fx+dz*fz)/Math.max(d,.01)<.3) continue; if(d<bd){ bd=d; first=e; } }
  if(!first) return {hits:[],segs:[]};
  const hits=[first]; let cur=first;
  while(hits.length<MAXHIT){ let nx=null, nd=REACH; for(const m of enemies){ if(m.dead||hits.includes(m)) continue; const dd=Math.hypot(m.x-cur.x,m.z-cur.z); if(dd<nd&&los(cur.x,cur.z,m.x,m.z)){ nd=dd; nx=m; } } if(!nx) break; hits.push(nx); cur=nx; }
  const per=Math.round(dmg*MUL*10)/10, segs=[]; let a={x,y:y+1.2,z}; const out=[];
  for(const e of hits){ const b=mid(e); segs.push([a.x,a.y,a.z,b.x,b.y,b.z].map(v=>+v.toFixed(2))); a=b; hurt(e,per,0,0); out.push(e); }
  FIRED++; LAST={n:hits.length,per,dmg};
  if(window.__subterfuge&&window.__subterfuge.draw) window.__subterfuge.draw(segs);
  floatText(first.x,(first.y||0)+(first.h||1.2)+1.2,first.z,'✦ 6/7 ✦','#7fd0ff');
  return {hits:out,segs};
}
{ const prev=hitCone; hitCone=function(){ prev.apply(this,arguments); if(!wears()) return; SWINGS++; if(SWINGS%EVERY) return;
    const dmg=heroDmg(), role=window.__net&&window.__net.role?window.__net.role():null;
    if(role==='guest'){ window.__net.send('sixseven',{x:+hero.x.toFixed(2),z:+hero.z.toFixed(2),yaw:+hero.yaw.toFixed(3),dmg:Math.round(dmg*10)/10}); return; }   // its page has no real mobs; the host strikes them
    strike(hero.x,hero.y||0,hero.z,hero.yaw,dmg); }; }
window.__sixseven={strike,every:EVERY,max:MAXHIT,reach:REACH,mul:MUL,state:()=>({swings:SWINGS,fired:FIRED,last:LAST}),reset:()=>{ SWINGS=0; FIRED=0; LAST=null; }};
})();
