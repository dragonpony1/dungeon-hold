// ===== A MOB THAT CAME OUT AS A WOODEN DOLL WEARS ITS REAL MODEL ONCE IT LANDS (build 513). Matt, Throne Room survival: "on thrown room survival i am getting wooden placeholder dolls again" / "its
// something flying thats coming as a wooden doll". The moth (95t) and the Crimson Phase Wraith (95s) fetch their models only once survival reaches wave 4 / 10, and a big download can still be on its
// way when the first one spawns (a jumped wave, a slow line) -- makeMob() then builds the code stand-in (makeGoblin), and that mob kept it for life. Every half second, any living mob still in the
// stand-in whose kind's model has since landed (MOBGLB[kind]) is rebuilt in the real one, where it stands -- the same swap a co-op guest's puppets already get (99-network.js). Any kind, not just these two.
// Test hook: window.__mobswap.
(function(){
let t=0; const cnt={ swaps:0 };
function swap(e){ const old=e.mdl, g0=old.g; const m=makeMob(e.kind); if(!m.glb) return false;
  m.g.position.copy(g0.position); m.g.rotation.copy(g0.rotation); m.g.scale.copy(g0.scale); scene.remove(g0); scene.add(m.g); e.mdl=m; cnt.swaps++; return true; }
{ const prev=Meta.update; Meta.update=dt=>{ prev(dt); t+=dt; if(t<.5) return; t=0;
    for(const e of enemies){ if(e.dead||!e.mdl||e.mdl.glb) continue; if(!MOBGLB[e.kind]){ fetchFor(e.kind); continue; } try{ swap(e); }catch(x){ console.warn('mob swap',e.kind,x); } } }; }
// build 515 (Matt: "right now the wood doll is in for phase wraith"): a lazily-loaded kind's model is only ASKED for on its own maps / waves (the wraith: feast, moat, prison from wave 2, survival
// from wave 10) -- one met anywhere else (the Throne Room campaign, a dev-panel spawn) never started its download, so there was nothing to swap to. A stand-in now asks its own kind's loader.
const LOADERS={ wraith:()=>window.__wraith&&window.__wraith.load, moth:()=>window.__moth&&window.__moth.load, direwolf:()=>window.__direwolf&&window.__direwolf.load,
  cyclops:()=>window.__cyclops&&window.__cyclops.ensure, archhag:()=>window.__archhag&&window.__archhag.ensure, stickman:()=>window.__archhag&&window.__archhag.loadSticks,
  pigflail:()=>window.__pigbosses&&window.__pigbosses.ensure, pigdagger:()=>window.__pigbosses&&window.__pigbosses.ensure, pigsling:()=>window.__pigbosses&&window.__pigbosses.ensure,
  bullion:()=>window.__bullion&&window.__bullion.load };   /* build 529 prep: Sir Bullion (95v-bullion.js) */
const asked={}; function fetchFor(k){ if(asked[k]) return; const f=LOADERS[k]&&LOADERS[k](); if(typeof f!=='function') return; asked[k]=true; try{ const p=f(); if(p&&p.catch) p.catch(()=>{ asked[k]=false; }); }catch(x){ asked[k]=false; } }
window.__mobswap={ info:()=>Object.assign({},cnt), withoutModel:(k,fn)=>{ const T=MOBGLB[k]; delete MOBGLB[k]; try{ return fn(); } finally{ if(T) MOBGLB[k]=T; } }, stand:()=>enemies.filter(e=>!e.dead&&e.mdl&&!e.mdl.glb).map(e=>e.kind) };
})();
