// ===== MASON: A TOWER-HEALTH SKILL (build 290). Matt: "we need to add a stat called tower health in the skills maybe". 10-meta.js's SKILLS gains Mason (+8% defense health a point, 10 points: +80%, key 'thp');
// this keeps every tower's health in step with it: a tower's full health is its kind's (DEFS) at its level, times its OWNER's Mason (oMult: in co-op a guest's towers use that guest's skill, sent with its other
// multipliers, 99-network.js). Checked every frame -- a point spent mid-run raises the towers already standing, keeping how hurt each one is (its share of health), and a newly placed or upgraded tower gets
// it at once. Only where towers are real (solo or the host); a guest's copies take the host's numbers.
(function(){
const base=d=>Math.round(DEFS[d.kind].hp*(1+.4*((d.lvl||1)-1)));
const want=d=>Math.max(1,Math.round(base(d)*oMult(d,'thp')));
function sync(){ const N=window.__net; if(N&&N.role&&N.role()==='guest') return; for(const d of defs){ if(!DEFS[d.kind]||!(d.max>0)) continue; const w=want(d); if(d.max!==w){ d.hp=Math.max(1,Math.round(d.hp*w/d.max)); d.max=w; } } }
{ const prev=Meta.update; Meta.update=dt=>{ prev(dt); sync(); }; }
window.__mason={sync,want:d=>want(d),base:d=>base(d)};
})();
