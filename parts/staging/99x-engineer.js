// ===== THE GNOME ENGINEER, the fifth hero (build 598). Matt: "he would be a 5th" / "engineer unlocks at level 7 and please go add him in".
// His model is Matt's Meshy gnome (Pictures\dungeon art,\Hero's\gnome engineer: rig, idle, walk, run, jump, death and his own overhead wrench smash), merged with tools/hero-merge.mjs into
// parts/assets/engineer.glb (the Knight's weapon mount copied onto his right hand); his title card is hero-engineer.png (tools/render-engineer-portrait.mjs).
//  * LOCKED until the player reaches LEVEL 7 (70-hero2.js lockLvl): the card, the raven and H all honour it and say so.
//  * Melee, like the Knight: he swings what the Knight swings (swords and polearms count for his stats, game.js WTYPE_HEROES) -- but his hand always shows HIS WRENCH (Matt's
//    gnome_wrench_model.glb, cut from 526,000 triangles to 35,000 with tools/glb-decimate.mjs: parts/assets/wrench-engineer.glb).
//  * His kit, for now (my call -- his own Barricade, Gnome Turret and Powder Keg come in as their art lands): the LOOKOUT PERCH (it moves to him from the Ranger, as Matt planned),
//    the SAW BLADE GUNNER (the Knight keeps his too) and the SKY WRECKER (the Ranger keeps his too).
//  * His special, OVERCLOCK (73-specials.js): every tower within 10 of him reloads TWICE AS FAST for 6 s, a blue steam glow on each while it lasts.
// Test hook: window.__engineer.
(function(){
'use strict';
if(typeof HEROES==='undefined') return;
const ID='engineer', LVL=7, OC_R=10, OC_T=6, OC_K=.5, WRENCH='wrench-engineer';
if(!HEROES.find(h=>h.id===ID)) HEROES.push({ id:ID, name:'GNOME ENGINEER', sub:'a big brass wrench · he builds the battlefield', glb:'engineer.glb', label:'Gnome Engineer (Meshy)', reach:2.4, lockLvl:LVL, unlocks:['perch','harpoon','sky'] });
{ const r=HEROES.find(h=>h.id==='troll'); if(r){ const i=r.unlocks.indexOf('perch'); if(i>=0) r.unlocks.splice(i,1); } }   // the Lookout Perch is his now
if(DEFS.perch){ DEFS.perch.name='Lookout Perch'; const n=document.querySelector('#slot-perch .n'); if(n) n.textContent='Lookout Perch'; }   // Matt's name for it, now it is no longer the archer's
// the saved pick was read (70-hero2.js) before he joined the list, so a player who left as the Engineer came back as the first hero: pick him again (if his level still allows)
try{ if(window.__heroSaved===ID&&window.__heroes.pick()!==ID&&!window.__heroes.locked(ID)) window.__heroes.select(ID); }catch(e){}
try{ if(window.__heroLine) window.__heroLine(); }catch(e){}   // the title's hero row was drawn before he joined
const cnt={ casts:0, boosted:0, forced:0 };
// ---- his wrench in his hand, whatever weapon he wears
try{ window.__weapons.registerReal(WRENCH,'wrench-engineer.glb',{ gripF:.3, lenScale:.85 }); }catch(e){}
let forced=false;
const isMe=()=>{ try{ return window.__heroes.pick()===ID; }catch(e){ return false; } };
{ const prev=Meta.update; Meta.update=dt=>{ prev(dt); const me=isMe(); if(me&&!forced){ try{ window.__weapons.force(WRENCH); forced=true; cnt.forced++; }catch(e){} } else if(!me&&forced){ try{ window.__weapons.force(null); }catch(e){} forced=false; } }; }
// ---- OVERCLOCK: towers near him reload twice as fast for a while
let OC=null; const GLOWS=[];
const inOC=d=>!!(OC&&S.t<OC.until&&d&&Math.hypot(d.x-OC.x,d.z-OC.z)<=OC_R);
{ const prev=stat; stat=function(d,k){ const v=prev.apply(this,arguments); return (k==='cd'&&inOC(d))?v*OC_K:v; }; }
function overclock(p){ OC={ x:p.x, z:p.z, until:S.t+OC_T }; cnt.casts++; for(const d of defs){ if(d.dead||!inOC(d)) continue; d.cd=Math.min(d.cd||0,(d.cd||0)*OC_K); cnt.boosted++; } }
function steam(x,z){ for(const d of defs){ if(d.dead||Math.hypot(d.x-x,d.z-z)>OC_R) continue; const g=glow(0x6ad0ff,1.6,.7); g.position.set(d.x,(d.base||0)+(d.top||2)+.4,d.z); scene.add(g); GLOWS.push({ g, t:0, life:OC_T, ph:Math.random()*6 }); } }
WORLDANIM.push(dt=>{ for(let i=GLOWS.length-1;i>=0;i--){ const G=GLOWS[i]; G.t+=dt; const k=G.t/G.life; if(k>=1){ scene.remove(G.g); if(G.g.material) G.g.material.dispose(); GLOWS.splice(i,1); continue; }
    G.g.material.opacity=(.45+.25*Math.sin(G.t*9+G.ph))*(1-k*k); G.g.position.y+=dt*.15; } });
window.__engineer={ id:ID, LVL, OC_R, overclock, steam, active:()=>!!(OC&&S.t<OC.until), info:()=>Object.assign({ oc:OC?{ left:+Math.max(0,OC.until-S.t).toFixed(2) }:null, glows:GLOWS.length, forced },cnt) };
})();
