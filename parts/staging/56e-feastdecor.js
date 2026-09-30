// ===== THE GREAT FEAST HALL, LIT (build 303). Matt: "ok the next map is a dinning hall, first thing it needs is more light so hang a bunch of chandeliers in there", then "you have sconses to use too".
// The hall had three small procedural candle rings down its middle and only four real lights in the whole room. Now, with the throne room's own real art (56-thronedecor.js):
//   * CHANDELIERS (chandelier.glb, 3.2 tall): three over each of the three long tables (over the middle of each run of benches, between the aisles), one over the high table on the dais at the west end
//     and one before the east doors -- eleven, each with a warm light of its own; the procedural rings are hidden.
//   * SCONCES (throne-sconce.glb, 1.5 tall): one on every wall face that carried the painted procedural torch (every fourth face, game.js), each with a warm light; the painted torches are hidden.
// One fetch per model, cloned for every placement. Only MAP.id==='feast'. Test hook: window.__feastdecor.
(function(){
window.__feastdecor={info:()=>null};
if(!MAP||MAP.id!=='feast') return;
const PROTO={}; let chand=0, sconces=0;
function protoOf(name,size){ return PROTO[name]||(PROTO[name]=fetchBytes(ASSET(name),'soon').then(buf=>new Promise((res,rej)=>new THREE.GLTFLoader().parse(buf,'',gl=>{ try{
    const root=gl.scene||gl.scenes[0]; const fit=fitModel(root,size); toonify(root,fit.scale); res(fit.wrap); }catch(e){ rej(e); } },rej)))); }
// a warm floor under the models' own colour so the bronze reads against the dark stone (the throne room's warmGlow)
function warmGlow(root){ root.traverse(o=>{ const m=o.isMesh&&o.material; if(!m||m.userData.__wg) return; m.userData.__wg=true;
  m.onBeforeCompile=sh=>{ sh.fragmentShader=sh.fragmentShader.replace('#include <emissivemap_fragment>','#include <emissivemap_fragment>\n  totalEmissiveRadiance += vec3(.22,.11,.03);'); }; }); }
const midX=(a,b)=>(cw(a)+cw(b))/2, midZ=(a,b)=>(cwz(a)+cwz(b))/2;
// the three tables run x 14..40 in rows z 8-9, 13-14, 18-19 with aisles at 22-23, 30-31, 38-39 (game.js): a chandelier over the middle of each of the three long runs of each table
const SPOTS=[];
for(const [z0,z1] of [[8,9],[13,14],[18,19]]) for(const [x0,x1] of [[14,21],[24,29],[32,37]]) SPOTS.push([midX(x0,x1),midZ(z0,z1)]);
SPOTS.push([midX(4,6),midZ(12,14)]);   // over the high table on the dais
SPOTS.push([midX(43,45),midZ(13,14)]);   // before the east doors
const CH_H=3.2, CH_Y=WALLH-CH_H-.6;
(world.userData.chandelierProcs||[]).forEach(ch=>{ ch.visible=false; });
protoOf('chandelier.glb',CH_H).then(p=>{ warmGlow(p); for(const [x,z] of SPOTS){ const t=p.clone(); t.position.set(x,CH_Y,z); world.add(t);
    const l=new THREE.PointLight(C(0xffb05a),3,17,2); l.position.set(0,.8,0); t.add(l); chand++; } }).catch(e=>console.warn('feast chandelier',e));
// the sconces, where the painted torches hung
const TORCH=(world.userData.torchProcs||[]).map(t=>({x:t.position.x,y:t.position.y,z:t.position.z,ry:t.rotation.y,t}));
protoOf('throne-sconce.glb',1.5).then(p=>{ warmGlow(p); for(const s of TORCH){ s.t.visible=false; const nx=Math.sin(s.ry), nz=Math.cos(s.ry);
    const t=p.clone(); t.position.set(s.x+nx*.18,s.y,s.z+nz*.18); t.rotation.y=s.ry; world.add(t);
    const l=new THREE.PointLight(C(0xffa040),4.5,13,2); l.position.set(nx*.15,.3,nz*.15); t.add(l); sconces++; } }).catch(e=>console.warn('feast sconce',e));
window.__feastdecor={info:()=>({chandeliers:chand,sconces,spots:SPOTS.length,torchSpots:TORCH.length,chY:+CH_Y.toFixed(2)})};
})();
