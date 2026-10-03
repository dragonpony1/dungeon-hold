// ===== co-op sweep 2026-10-02 (cross-area): PARTNERS SEE EACH OTHER'S PETS SHOOT. Hero bolts, arrows and tower shots all reached the other screens (hshot/tshot); a pet's shot never did,
// so a teammate's pet just hovered at his shoulder (98-party.js) while damage numbers popped on mobs from nowhere. Now every volley a pet fires (famFire, wrapped here OUTERMOST -- after
// 85-familiars, 93-gearsets and 97h's second pet) sends 'pshot': which pet (1 or 2), its rarity colour and where it aims. The other pages fly the same coloured bolt (30-familiar.js
// famBoltMesh) from that partner's puppet pet to the spot -- LOOKS ONLY: a module-local list, never famBolts, so it can't hurt anything (the real damage is still the host's, as before).
// The host relays a guest's shots to the other guests. Bat/Imp swoops, Owl and Drake beams and Trimaw breaths show as the plain bolt in the pet's colour.
// The Bramblewhisk's thorn patch (85-familiars.js) the same way: the host's own patches and each guest's are drawn on everyone's floor as looks only ('brambleFx'; sprout's 4th arg).
(function(){
const N=()=>window.__net;
const LIST=[], MAX=60;
const cnt={sent:0,drawn:0,relayed:0,bram:0};
const ok=v=>Number.isFinite(v)&&Math.abs(v)<1e4;
// ---- sender: once per volley (the twin, the extra projectiles and fproj all go through the inner famFire and fireOne, not this outer one)
{ const prev=famFire; famFire=function(e){ const r=prev.apply(this,arguments); const n=N();
    try{ if(n&&n.role&&n.role()&&n.peers().length&&e&&fam&&ok(+e.x)&&ok(+e.z)){ const it=gear.familiar; n.send('pshot',{s:FAM_PASS2?2:1,c:RCOL[(it&&it.rarity)|0]||0xffffff,x:+(+e.x).toFixed(2),y:+((+e.y||0)+(+e.h||1.2)*.55).toFixed(2),z:+(+e.z).toFixed(2)}); cnt.sent++; } }catch(err){}
    return r; }; }
// ---- receiver: draw from the partner's puppet pet (98-party dressTick puts pet 1 at yaw+2.3, pet 2 at yaw-2.3, .85 out, 1.45 up)
function draw(who,d){ const P=window.__party, p=P&&P.get&&P.get(who); if(!p||p.dead) return; const tx=+d.x, ty=+d.y, tz=+d.z; if(!ok(tx)||!ok(ty)||!ok(tz)) return;
  if(Math.hypot(tx-p.x,tz-p.z)>40) return;   // a pet's range is 9 (FAM_RANGE); anything this far off is not a shot from that pet
  while(LIST.length>=MAX){ const o=LIST.shift(); scene.remove(o.mesh); }
  const a=(+p.yaw||0)+(d.s===2?-2.3:2.3), x=p.x+Math.sin(a)*.85, y=p.y+1.45, z=p.z+Math.cos(a)*.85, dx=tx-x, dy=ty-y, dz=tz-z, dist=Math.hypot(dx,dy,dz)||1;
  const col=Number.isFinite(+d.c)?(+d.c)&0xffffff:0xffffff, mesh=famBoltMesh(col); mesh.position.set(x,y,z); scene.add(mesh);
  LIST.push({x,y,z,vx:dx/dist*FAM_BOLT_SPD,vy:dy/dist*FAM_BOLT_SPD,vz:dz/dist*FAM_BOLT_SPD,left:dist/FAM_BOLT_SPD,t:0,mesh,rg:p.look&&p.look.rg||null}); cnt.drawn++; }
function tick(dt){ if(!LIST.length) return; if(S.phase!=='build'&&S.phase!=='wave'){ clear(); return; }
  for(let i=LIST.length-1;i>=0;i--){ const b=LIST[i]; b.t+=dt; b.x+=b.vx*dt; b.y+=b.vy*dt; b.z+=b.vz*dt; b.mesh.position.set(b.x,b.y,b.z); if(b.t>=b.left||b.t>FAM_BOLT_LIFE){ if(b.rg&&b.t>=b.left&&window.__ringlook) window.__ringlook.hitFx(b.rg,b.x,b.y,b.z); scene.remove(b.mesh); LIST.splice(i,1); } } }   // build 512 prep: a partner wearing Beast Mode / Malamute -- his pet's shot lands as a claw slash / frost burst here too (97h2-ringlook.js, pooled)
function clear(){ for(const b of LIST) scene.remove(b.mesh); LIST.length=0; }
{ const prev=Meta.update; Meta.update=dt=>{ prev(dt); tick(dt); }; }
const rate=new Map();   // the host's cap per guest: 8 shots a half second is well over two pets' pace with every rate bonus (the 'bramble' cap's reasoning)
let hooked=false;
function hook(){ const n=N(); if(hooked||!n||!n.onMessage) return; hooked=true;
  n.onMessage('pshot',(d,fromId)=>{ if(!d) return; const n=N(), role=n.role();
    if(role==='host'){ const now=performance.now(), r=rate.get(fromId)||{t:-1e9,n:0}; if(now-r.t>500){ r.t=now; r.n=0; } rate.set(fromId,r); if(++r.n>8) return;
      const m={s:d.s===2?2:1,c:+d.c|0,x:+d.x,y:+d.y,z:+d.z,who:fromId}; n.peers().forEach(id=>{ if(id!==fromId){ n.send('pshot',m,id); cnt.relayed++; } }); draw(fromId,m); }
    else if(role==='guest'){ const who=(typeof d.who==='string'&&d.who)?d.who:n.hostId(); if(who===n.myId()) return; draw(who,d); } });
  n.onMessage('brambleFx',d=>{ const n=N(); if(!d||n.role()!=='guest') return; const x=+d.x, z=+d.z, B=window.__bramble; if(!ok(x)||!ok(z)||!(B&&B.sprout)) return; B.sprout(x,z,0,true); cnt.bram++; }); }
hook();   // 99-network.js sorts before this file, so __net is already up
// ---- the host's own Bramblewhisk patches, drawn on every guest's floor (a guest's own reach the host as 'bramble' and the host relays them on, 99-network.js)
{ const prev=famLand; famLand=function(x,z,dmg){ const r=prev.apply(this,arguments); const n=N();
    try{ if(n&&n.role&&n.role()==='host'&&n.peers().length&&window.__bramble&&window.__bramble.on()&&ok(+x)&&ok(+z)) n.send('brambleFx',{x:+(+x).toFixed(2),z:+(+z).toFixed(2)}); }catch(err){}
    return r; }; }
window.__petshots={ list:()=>LIST.map(b=>({x:+b.x.toFixed(2),y:+b.y.toFixed(2),z:+b.z.toFixed(2)})), count:()=>LIST.length, cnt, clear };   // test hook
})();
