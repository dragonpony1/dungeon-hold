// ===== HEROES: the playable characters, each a Meshy rig fetched from assets/. The squire baked into the page shows for
// the first second and stays as the fallback. The pick is saved (ddHero) and can be changed on the start screen; a
// different hero swaps in live, no reload. The witch fights with a battle staff: her model carries a staffMount in her
// left hand (meshy/witch3), the weapons module puts a code-built staff there, and her swing throws a bolt (82-staff.js).
const HEROES=[
  {id:'warden',name:'GNOME WARDEN',sub:'sword and shield-arm · the hall\'s keeper',glb:'squire2.glb',label:'Gnome Warden (Meshy v2)',reach:2.4},
  {id:'witch', name:'GNOME BATTLE WITCH',sub:'a battle staff that shoots · bolts reach 18',glb:'witch.glb',label:'Gnome Battle Witch (Meshy)',reach:18},
  {id:'troll', name:'TROLL ARCHER',sub:'a longbow · arrows reach 24',glb:'troll.glb',label:'Troll Archer (Meshy)',reach:24}];   // doubled from 9/12: both targeting range and projectile flight distance derive from reach (83-bow.js, 82-staff.js), so this doubles how far a ranged hero can actually engage, not just how far the bolt visually flies
let heroPick=(()=>{ try{ return HEROES.find(h=>h.id===localStorage.getItem('ddHero'))||HEROES[0]; }catch(e){ return HEROES[0]; } })();
function installHero(h){ heroPick=h; try{ localStorage.setItem('ddHero',h.id); }catch(e){} hero.reach=h.reach;
  return fetchBytes(ASSET(h.glb)).then(buf=>{ if(heroPick!==h) return; if(GLBH&&GLBH.label&&!/Meshy/.test(GLBH.label)) return;   // the player dropped their own model meanwhile: keep it
    loadHeroGLB(buf,h.label,true); hero.reach=h.reach; }).catch(e=>console.warn('hero '+h.id,e)); }
installHero(heroPick);
window.__heroes={list:()=>HEROES.map(h=>({id:h.id,name:h.name})),pick:()=>heroPick.id,select:id=>{ const h=HEROES.find(h=>h.id===id); if(h) return installHero(h); }};
