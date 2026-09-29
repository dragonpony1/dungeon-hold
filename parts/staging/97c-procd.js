// ===== PROC'D GEAR (build 243). Matt: "proc'd gear can only come from the forge and i want it to make synthesized fanfare sound, any proc'd gear equiped will give a golden particulate glow to wearer, the
// piece also says Proc'd gear on it. it has a 35% increase to its primary stat and on the card that stat has a font and in gold".
// The FORGE makes it (hideout build 51: the forge's proc -- the named-mythic result -- is a proc'd named mythic, its primary stat +35%, flagged procd + primary in the record). Nothing in the
// hall makes it: a named mythic that drops from a wave or a mob is an ordinary one. This module is what the game does with the flag:
//   * 97-mythics.js normalize() re-applies the +35% to the primary stat (the game rebuilds a named piece's stats from its own table) and keeps procd / primary on the item;
//   * statStr (every card, toast and sheet reads it) gains a "✦PROC'D GEAR✦" lead and the primary stat wrapped in ✦…✦ markers; window.__procHtml turns the markers into the gold, decorated-font
//     .procstat span where a card is HTML (the tavern card and detail rows, the character sheet's card, the pickup toast) -- elsewhere the markers just read as stars;
//   * any proc'd piece WORN gives its wearer a golden particulate glow: motes rising round the hero (a teammate's hero on your screen too: the look message carries pd, 99-network.js / 98-party.js);
//   * a proc'd piece arriving in the bag plays the SYNTHESIZED FANFARE (not the drop sample) with a gold float text.
(function(){
const GOLD=0xffd24a, MARK='✦';
{ const st=document.createElement('style'); st.textContent=".procstat{color:#ffd24a;font-family:'Cinzel Decorative',Georgia,'Times New Roman',serif;font-weight:900;text-shadow:0 0 6px #ffb02e99;letter-spacing:.5px}"; document.head.appendChild(st); }
const primaryOf=it=>it.primary||Object.keys(it.stats||{})[0];
{ const prev=statStr; statStr=function(it){ const s=prev(it); if(!it||!it.procd||!it.stats) return s; const k=primaryOf(it), lab=k&&STATL[k]?STATL[k](it.stats[k]):'';
    const out=lab&&s.includes(lab)?s.replace(lab,MARK+lab+MARK):s; return MARK+"PROC'D GEAR"+MARK+' · '+out; }; }
const html=t=>String(t).replace(/✦([^✦]+)✦/g,'<b class="procstat">$1</b>');
// ---- the glow
function makeGlow(){ const g=new THREE.Group(); g.userData.sp=[]; for(let i=0;i<18;i++){ const s=glow(GOLD,.2+rnd()*.16,.9); s.userData={a:rnd()*TAU,r:.3+rnd()*.45,ph:rnd(),sp:.35+rnd()*.5}; g.add(s); g.userData.sp.push(s); } return g; }
function tickGlow(g,x,y,z,t){ g.position.set(x,y,z); for(const s of g.userData.sp){ const u=(t*s.userData.sp+s.userData.ph)%1, a=s.userData.a+t*.9; s.position.set(Math.cos(a)*s.userData.r,u*1.95,Math.sin(a)*s.userData.r); s.material.opacity=.95*Math.sin(u*PI); s.scale.setScalar(.22+.18*(1-u)); } }
const OWN=makeGlow(); OWN.visible=false; scene.add(OWN);
const wornProcd=()=>SLOTS.some(s=>gear[s]&&gear[s].procd);
{ const prev=Meta.update; Meta.update=dt=>{ prev(dt); const on=wornProcd()&&S.phase!=='dead'&&S.phase!=='start'; OWN.visible=on; if(on) tickGlow(OWN,hero.x,hero.y||0,hero.z,S.t); }; }
// ---- the fanfare when one arrives in the bag
let ARRIVED=0;
{ const prev=Meta.onPickup; Meta.onPickup=function(it,l){ const r=prev.apply(this,arguments);
    if(r&&it&&it.procd&&Meta.bag().some(b=>b.id===it.id)){ ARRIVED++; if(SFX.fancySynth) SFX.fancySynth(true); floatText(hero.x,2.7,hero.z,"✦ PROC'D GEAR ✦ "+it.name,'#ffd24a'); }
    return r; }; }
window.__procHtml=html;
window.__procglow={make:makeGlow,tick:tickGlow,own:()=>({on:OWN.visible,n:OWN.userData.sp.length}),worn:wornProcd,arrived:()=>ARRIVED};
})();
