// ===== THE GNOME FIGHTER WIELDS POLEARMS (build 510 prep). Matt noticed "our witch weapons and fighter weapons are the same" and decided "we have polearms so maybe we just say witch can use
// staffs and fighter can use polearms", then "we have polearm art already, he can only use what he can only use": the Fighter is POLEARM-ONLY. Whatever the item -- a set piece that dropped as a
// staff, a sword or a polearm -- his hand holds a polearm:
//   * a set piece: that set's own polearm, Matt's real spear / scythe / halberd / trident models (86l-86u, 86r), the ones the Knight holds for a polearm piece;
//   * a named weapon: The Last Lantern and 6/7 as themselves (they are polearms); any other (Rootsplitter's axe, Subterfuge's bow) as the top plain polearm, as a staff hand held the top staff;
//   * anything else: one of the five PLAIN POLEARMS built below, one per forge tier like the five staffs (82-staff.js) -- Hazel Spear, Copper-bound Spear, Runed Ash Glaive, Stormwood Halberd,
//     Gnome Battle Halberd ('polearm-hazel' ... 'polearm-battle').
// Item data is left alone: only the model the Fighter's hand gets changes (80-weapons.js heldFor, hm.pole), and what the game calls his weapon (game.js weaponKind 🔱, 87-mythicdrops a mythic's look,
// 99k-dualwield Tootsie's "2 POLEARMS"). The Witch keeps her staffs and the Knight his sword-or-polearm by the item; the same piece shows as each hand's own.
// His fighting is unchanged: a polearm on a staff mount is a CASTER's (80-weapons.js attachWeapon), so a swing throws the same bolt (82-staff.js) -- the same reach, rate and damage, the same charge and
// levelling (84-aim.js) -- now from poleTip, near the point; the bolt keeps a staff's colours (the set's, or the tier's). A soft light at the point brightens as he charges.
// The frame is the polearm frame of 86-setweapons.js (butt at y=0, the point at the top of the box, the fist 30% up, body-length: lenScale 1.64), on his staff mount as it is.
// Test hook: window.__fighterpole. Tests: fighterpolearm-test.mjs.
(function(){
'use strict';
const {V,lit,slab,tube,helix,spike,noOL,pulseGlow,finish}=window.__setweapons.kit;
const PLAIN=['hazel','copper','runed','storm','battle'];   // tier 1..5, the staffs' own kinds: a plain polearm's bolt is that tier's staff bolt
const box=(x0,x1,top)=>new THREE.Box3(V(x0,-.09,-.07),V(x1,top,.07));
// the parts every plain polearm shares: the shaft, the staffs' leather grip bound with four thin rings, a butt cap and spike, the socket the head sits in and the staff's crystal set in it
function base(g,K){ g.add(M(G.cyl(.024,.03,1.3,8),mat(K.wood),0,.65,0));
  g.add(M(G.cyl(.038,.038,.17,8),mat(K.dark),0,.4,0)); for(let i=0;i<4;i++) g.add(M(G.cyl(.042,.042,.012,8),mat(K.band),0,.33+i*.045,0));
  g.add(M(G.cyl(.036,.03,.06,8),mat(K.band),0,.03,0)); g.add(spike(.022,.08,mat(K.band),0,-.04,0,PI,0));
  g.add(M(G.cyl(.046,.033,.1,8),mat(K.band),0,1.25,0));
  const gem=new THREE.Mesh(new THREE.OctahedronGeometry(.026,0),lit(K.gem)); gem.scale.set(1,1.5,1); gem.position.set(0,1.25,.044); g.add(noOL(gem)); return g; }
const KS={
  hazel: {wood:0x6b4a2a,dark:0x3a2716,band:0x8a6a3a,gem:0xbfe8ff,glow:0x9ad8ff,iron:0x9aa4ae,iron2:0x5e6670},
  copper:{wood:0x4e3320,dark:0x2c1c10,band:0xb87333,gem:0xffc050,glow:0xffa030,iron:0xc98446,iron2:0x8a5428},
  runed: {wood:0x5a4632,dark:0x33281c,band:0x8fb0c0,gem:0x8dffa8,glow:0x4dff7a,iron:0x6e7c8a,iron2:0x4a5864},
  storm: {wood:0x2e2a3a,dark:0x1a1722,band:0xc0c8d8,gem:0x7fbbff,glow:0x3d8bff,iron:0x6a7282,iron2:0xc8d0dc},
  battle:{wood:0x3a2416,dark:0x22150c,band:0xe0b040,gem:0xfff2c0,glow:0xffd060,iron:0x7e8894,iron2:0x8a6a2a}};
function hazel(){ const K=KS.hazel, g=base(new THREE.Group(),K); g.name='polearm-hazel';   // a plain iron leaf on a hazel pole, lashed on
  g.add(slab([[0,1.29],[.036,1.36],[.046,1.44],[.032,1.53],[0,1.63],[-.032,1.53],[-.046,1.44],[-.036,1.36]],.022,mat(K.iron)));
  g.add(slab([[0,1.31],[.008,1.44],[0,1.6],[-.008,1.44]],.028,mat(K.iron2)));   // its ridge
  g.add(tube(helix(1.13,1.22,.037,2.5,0,0),.006,mat(K.dark),24));
  g.add(pulseGlow(K.glow,.18,0,1.5,0));
  return finish(g,'plain',box(-.06,.06,1.63),.3,1.64); }
function copper(){ const K=KS.copper, g=base(new THREE.Group(),K); g.name='polearm-copper';   // a winged spear, copper-bound
  for(const y of [.72,.98,1.15]) g.add(M(G.cyl(.04,.04,.03,8),mat(K.band),0,y,0));
  g.add(slab([[0,1.29],[.032,1.36],[.042,1.45],[.028,1.55],[0,1.66],[-.028,1.55],[-.042,1.45],[-.032,1.36]],.022,mat(K.iron)));
  g.add(slab([[0,1.31],[.008,1.45],[0,1.62],[-.008,1.45]],.028,mat(K.iron2)));
  for(const s of [-1,1]) g.add(slab([[s*.03,1.26],[s*.1,1.28],[s*.085,1.31],[s*.03,1.33]],.02,mat(K.band)));   // the lugs below the point
  g.add(pulseGlow(K.glow,.2,0,1.48,0));
  return finish(g,'plain',box(-.1,.1,1.66),.3,1.64); }
function runed(){ const K=KS.runed, g=base(new THREE.Group(),K); g.name='polearm-runed';   // a glaive of runed ash: one curved edge, its runes alight
  for(let i=0;i<4;i++){ const a=i/4*TAU, r=M(G.box(.014,.07,.01),lit(K.gem),Math.sin(a)*.031,.84+(i%2)*.09,Math.cos(a)*.031); r.rotation.y=a; g.add(noOL(r)); }   // runes cut into the ash (the runed staff's)
  for(const y of [.18,.72]) g.add(M(G.cyl(.04,.04,.03,8),mat(K.band),0,y,0));
  g.add(slab([[-.03,1.26],[.02,1.27],[.07,1.32],[.105,1.4],[.116,1.5],[.097,1.59],[.054,1.66],[0,1.7],[-.02,1.64],[-.03,1.52],[-.034,1.38]],.022,mat(K.iron)));
  g.add(noOL(slab([[.072,1.34],[.098,1.41],[.106,1.5],[.09,1.58],[.052,1.645],[.046,1.632],[.08,1.572],[.093,1.5],[.086,1.42],[.064,1.352]],.026,lit(K.glow))));   // the rune-bright edge
  for(const y of [1.36,1.46,1.56]) g.add(noOL(M(G.box(.012,.04,.026),lit(K.gem),-.008,y,0)));   // three runes down the blade
  g.add(spike(.014,.07,mat(K.iron2),-.05,1.4,0,0,PI/2));   // a hook off the back
  g.add(pulseGlow(K.glow,.3,.05,1.5,0));
  return finish(g,'plain',box(-.09,.12,1.7),.3,1.64); }
function storm(){ const K=KS.storm, g=base(new THREE.Group(),K); g.name='polearm-storm';   // a stormwood halberd: a silver point, an axe with a lightning-blue edge, a back spike
  for(const y of [.72,.98,1.16]) g.add(M(G.cyl(.04,.04,.03,8),mat(K.band),0,y,0));
  g.add(slab([[0,1.29],[.03,1.4],[.022,1.5],[0,1.63],[-.022,1.5],[-.03,1.4]],.022,mat(K.iron2)));
  g.add(slab([[.02,1.29],[.09,1.27],[.16,1.22],[.21,1.26],[.23,1.36],[.21,1.45],[.16,1.5],[.09,1.46],[.02,1.43]],.024,mat(K.iron)));
  g.add(noOL(slab([[.16,1.24],[.205,1.275],[.222,1.36],[.205,1.44],[.16,1.48],[.168,1.495],[.215,1.45],[.236,1.36],[.215,1.265],[.166,1.226]],.028,lit(0x8ac8ff))));   // its edge, alight
  g.add(noOL(tube([[.06,1.3,0],[.09,1.34,0],[.075,1.37,0],[.11,1.41,0]],.005,lit(K.gem),10)));   // a fork of lightning etched on it
  g.add(spike(.02,.12,mat(K.iron2),-.07,1.37,0,0,PI/2));
  g.add(pulseGlow(K.glow,.4,.15,1.36,0));
  return finish(g,'plain',box(-.14,.24,1.63),.3,1.64); }
function battle(){ const K=KS.battle, g=base(new THREE.Group(),K); g.name='polearm-battle';   // the gnome battle halberd: gold-bound, a broad crescent axe, a fluke, a long point, a red tassel
  for(const y of [.18,.72,.98,1.16]) g.add(M(G.cyl(.04,.04,.03,8),mat(K.band),0,y,0));
  g.add(tube(helix(.5,1.12,.031,3,0,0),.004,mat(K.band),50));   // gold wire wound up the haft
  g.add(slab([[0,1.29],[.028,1.38],[.034,1.48],[.02,1.58],[0,1.72],[-.02,1.58],[-.034,1.48],[-.028,1.38]],.022,mat(K.iron)));
  g.add(slab([[0,1.31],[.007,1.48],[0,1.68],[-.007,1.48]],.028,mat(K.band)));   // a gold rib up the point
  g.add(slab([[.02,1.29],[.07,1.27],[.12,1.23],[.17,1.16],[.21,1.14],[.25,1.2],[.272,1.3],[.276,1.4],[.256,1.5],[.215,1.57],[.17,1.55],[.12,1.48],[.07,1.44],[.02,1.42]],.024,mat(K.iron)));   // the crescent
  g.add(noOL(slab([[.21,1.16],[.245,1.21],[.265,1.3],[.269,1.4],[.25,1.49],[.214,1.55],[.224,1.565],[.262,1.5],[.282,1.4],[.278,1.3],[.256,1.19],[.218,1.145]],.028,mat(K.band,{emissive:C(0x6a4a10)}))));   // its gilded edge
  for(const [x,y] of [[.06,1.33],[.06,1.39],[.1,1.36]]) for(const z of [.014,-.014]) g.add(M(G.sph(.011,6,5),mat(K.band),x,y,z));   // gold rivets where it is fixed on
  g.add(slab([[-.02,1.32],[-.08,1.3],[-.15,1.25],[-.2,1.19],[-.165,1.26],[-.105,1.33],[-.02,1.38]],.02,mat(K.iron)));   // the fluke out the back
  for(const [x,a] of [[-.012,.2],[0,0],[.012,-.2]]){ const t=M(G.box(.012,.14,.006),mat(0xb02a2a),x,1.12,.045); t.rotation.z=a; g.add(t); }   // a red tassel
  g.add(pulseGlow(K.glow,.5,.17,1.36,0));
  return finish(g,'plain',box(-.21,.29,1.72),.3,1.64); }
const POLE_MAKE={hazel,copper,runed,storm,battle};   // not BUILD: that is the game's build number (game.js), and tools grep for "const BUILD="
PLAIN.forEach(k=>window.__weapons.register('polearm-'+k,()=>{ const g=POLE_MAKE[k](); g.userData.kind=k; return g; }));
// ---- which polearm the Fighter holds for an item: the set's own (setModel's 'pole' hand: 86-setweapons, 86h-named, 86r-realforest), a pack's stand-in, else the plain one of its tier
function poleFor(it){ if(!it) return 'polearm-hazel'; const W=window.__weapons; const sm=W.setModel&&W.setModel(it,'pole'); if(sm) return sm;
  const pk=Meta.packs&&Meta.packs.of(it); if(pk&&pk.models&&pk.models.polearm) return pk.models.polearm; if(pk&&/void/i.test(pk.name||pk.id||'')) return 'polearm-void';
  const t=Math.max(1,Math.min(5,it.tier||tierOf(it.lvl||1))); return 'polearm-'+PLAIN[t-1]; }
window.__weapons.poleFor=poleFor;
// ---- the light at the point: soft at rest, swelling and brightening as he charges a bolt (84-aim.js), in the bolt's own colour
const LIGHTS=new WeakMap(), _s=new THREE.Vector3(); let made=0;
function lightOf(o){ if(!o||!o.parent||!o.userData.pole||!o.userData.caster) return null; let g=LIGHTS.get(o); if(g!==undefined) return g; g=null; const tip=o.getObjectByName('poleTip');
  if(tip){ const K=window.__staff&&window.__staff.info?window.__staff.info(o.userData.kind||'hazel'):null; g=glow(K&&K.glow!=null?K.glow:0x9ad8ff,1,.3); g.name='poleGlow'; tip.add(g); made++; } LIGHTS.set(o,g); return g; }
function shine(o,c,hot){ const g=lightOf(o); if(!g) return; const ws=o.getWorldScale(_s).x||1, w=.38*(1+1.6*c)*(hot?1.12:1); g.scale.set(w/ws,w/ws,1); g.material.opacity=Math.min(.95,.26+.62*c+(hot?.12:0)); }
{ const prev=Meta.update; Meta.update=dt=>{ prev(dt); const W=window.__weapons, main=W.mounted(), DW=window.__dualwield, off=DW&&DW.off?DW.off():null, offCasts=!!(off&&DW.offSwing&&DW.offSwing());
    const A=window.__aim, c=A&&A.holding&&A.holding()?A.charge():0, hot=hero.swingT>=0&&!(hero.dead>0);
    if(main&&main.userData.pole) shine(main,offCasts?0:c,hot&&!offCasts); if(off&&off.userData.pole) shine(off,offCasts?c:0,offCasts); }; }
window.__fighterpole={ PLAIN:PLAIN.slice(), poleFor, kinds:()=>PLAIN.map(k=>'polearm-'+k), light:o=>{ const g=lightOf(o||window.__weapons.mounted()); return g?{opacity:+g.material.opacity.toFixed(2)}:null; }, lights:()=>made };
})();
