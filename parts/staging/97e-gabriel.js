// ===== GABRIEL'S CHARM (build 266): the fifteenth named mythic (97-mythics.js NAMED), a charm. Matt, 2026-09-30: sent "Silver Blitz Charm 2K PBR.glb" and its inventory thumbnail (Weapon sets / GEAR SETS / Arcane) and answered "named mythic
// charm, Gabriel's Charm". A silver football-shaped pendant, stitched laces, glowing cyan swirls and a big "2". The model is his own (parts/assets/named-gabriels_charm.glb, 1K), the floor stand a silver-cyan column (93c-weaponstand.js).
// The power is MY call (he named it, didn't say what it does; I had suggested a burst of defense speed at the start of a wave and he took the piece): the charm is a BLITZ, and the "2" is how many a wave --
// TWICE A WAVE, when the horn sounds and again when the last mob of the wave has been sent, every defense in the hall FIRES 50% FASTER FOR 6 SECONDS. It goes through stat(d,'cd') the way the Gloomcap Censer's does (97-mythics.js),
// so it composes with the Censer, upgrades and a Rune Totem like any other speed-up. It counts when THIS page wears it or, on a co-op host, when a guest does (Meta.coopWear): defenses are hall-wide, the horn is the host's.
// A "✦ BLITZ ✦" over the wearer and a rising sting mark each one. Test hook: window.__gabriel.
(function(){
const ID='gabriels_charm', MUL=1.5, DUR=6;
let T=0, FIRED=0, prevN=0;
const wears=()=>{ if(window.__mythic&&window.__mythic.has(ID)) return true; const w=Meta.coopWear&&Meta.coopWear(); return !!(w&&w.some(x=>x.myth&&x.myth.includes(ID))); };
// co-op sweep 2026-10-02: the cue goes over the WEARER -- a guest who wears it is sent it ('powerFx' blitz, 99-network.js) and sees and hears it on its own screen; the host
// shows it over its own hero only when it wears the charm itself (or nobody does: the test hook's force)
let CUED=0;
function cue(x,y,z,chime){ CUED++; try{ floatText(x,(y||0)+2.7,z,'✦ BLITZ ✦','#7fd8ff'); if(chime){ beep(520,.12,'triangle',.05,0); setTimeout(()=>beep(780,.14,'triangle',.05,0),90); setTimeout(()=>beep(1040,.22,'triangle',.06,0),190); } }catch(e){} }
function blitz(){ T=DUR; FIRED++; let n=0; const cw=(Meta.coopWear&&Meta.coopWear())||[]; for(const x of cw) if(x.myth&&x.myth.includes(ID)&&x.g){ n++; cue(x.g.x,x.g.y,x.g.z,false); try{ if(window.__net) window.__net.send('powerFx',{k:'blitz'},x.id); }catch(e){} }
  if(!n||(window.__mythic&&window.__mythic.has(ID))) cue(hero.x,hero.y,hero.z,true); }
{ const prev=stat; stat=function(d,k){ const v=prev.apply(this,arguments); if(T>0&&k==='cd'&&d) return v/MUL; return v; }; }
{ const prev=startWave; startWave=function(){ const was=S.phase; const r=prev.apply(this,arguments); if(was!=='wave'&&S.phase==='wave'&&wears()){ prevN=spawnQ.length; blitz(); } return r; }; }
{ const prev=Meta.update; Meta.update=function(dt){ prev.apply(this,arguments); if(T>0) T=Math.max(0,T-dt);
    if(S.phase==='wave'){ const n=spawnQ.length; if(prevN>0&&n===0&&wears()) blitz(); prevN=n; } else prevN=0; }; }
window.__gabriel={id:ID,mul:MUL,dur:DUR,blitz:()=>T,fired:()=>FIRED,cd:d=>stat(d,'cd'),force:()=>blitz(),cue:()=>cue(hero.x,hero.y,hero.z,true),cued:()=>CUED,reset:()=>{ T=0; FIRED=0; prevN=0; }};
})();
