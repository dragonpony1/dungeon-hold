// ===== A SET WEAPON GLOWS IN THE HAND (build 487). Matt, of his Void longsword: "should sword of the void be animated in my hand?" -- (offered a glow and motes rather than Bob's whole-sword flourish, which
// would pull the blade out of the grip) -- "yeah something, it doesn't even look purple". Matt's real set weapons (his Meshy art: a texture, no code-built glow of its own) light up in their set's colour
// while held: the texture itself becomes the glow (its bright veins and gems shine, its dark steel stays dark), breathing slowly, and a few motes of the set's colour drift up off the blade.
// Code-built weapons keep their own lit parts. Test hook: window.__heldglow (window.__setglow is the full-set armour glow, 93-gearsets.js).
(function(){
'use strict';
const COL={ void:0xb46aff, chaos:0xff3a5a, earth:0x6aff5a, fire:0xff7a2a, radiance:0xffe08a, tempest:0x6ac8ff, necrotic:0x9a6aff, ice:0x8ae8ff, wind:0xbaffe0, forest:0x7aff6a };
const NAMECOL={ 'sword-necrotic':0x8aff4a };   // build 492: Matt's Shadow sword is fel GREEN (the set's colour is violet): a weapon's own art can ask for its own glow
const setOfName=n=>{ if(n==='void') return 'void'; const m=/^(sword|polearm|staff|bow)-([a-z]+)$/.exec(n||''); return m&&COL[m[2]]?m[2]:null; };
let cur=null, mats=[], col=0, t=0, moteT=0; const motes=[], v=new THREE.Vector3(), cnt={ lit:0, motes:0 };
function light(obj){ cur=obj; mats=[]; const s=obj&&obj.userData.sword, k=s&&setOfName(s.name); if(!k) return; col=NAMECOL[s.name]||COL[k];
  obj.traverse(o=>{ if(!o.isMesh||o.userData.isOL) return; const m=o.material; if(!m||!m.map||!m.emissive) return; const c=m.clone(); c.emissiveMap=m.map; c.emissive.setHex(col); c.emissiveIntensity=.6; c.needsUpdate=true; o.material=c; mats.push(c); });
  if(mats.length) cnt.lit++; }
{ const prev=Meta.update; Meta.update=dt=>{ prev(dt); const W=window.__weapons, obj=W&&W.mounted&&W.mounted(); if(obj!==cur) light(obj); t+=dt;
    if(mats.length&&obj&&obj.parent){ const k=.8+.32*Math.sin(t*2.3)+.08*Math.sin(t*7.1); for(const m of mats) m.emissiveIntensity=k;
      moteT-=dt; if(moteT<=0&&motes.length<14){ moteT=.16; const s=obj.userData.sword, y=s.gripY+(s.tipY-s.gripY)*(.25+Math.random()*.75); v.set((Math.random()-.5)*.04,y,(Math.random()-.5)*.04); obj.localToWorld(v);
        const g=glow(col,.22+Math.random()*.12,.9); g.position.copy(v); scene.add(g); motes.push({ g, t:0, life:.9+Math.random()*.5, vx:(Math.random()-.5)*.3, vz:(Math.random()-.5)*.3 }); cnt.motes++; } }
    for(let i=motes.length-1;i>=0;i--){ const m=motes[i]; m.t+=dt; const f=m.t/m.life; if(f>=1){ scene.remove(m.g); m.g.material.dispose(); motes.splice(i,1); continue; } m.g.position.x+=m.vx*dt; m.g.position.y+=.55*dt; m.g.position.z+=m.vz*dt; m.g.material.opacity=.9*Math.sin(Math.PI*f); } }; }
window.__heldglow={ info:()=>Object.assign({ held:cur&&cur.userData.sword&&cur.userData.sword.name, glowing:mats.length, live:motes.length },cnt) };
})();
