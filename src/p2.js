// ================= MODELS =================
function limb(x,y,len,r,m){ const l=new THREE.Group(); l.position.set(x,y,0); l.add(M(G.cyl(r,r*.85,len,7),m,0,-len/2,0)); l.userData.len=len; return l; }
function makeHero(){
  const g=new THREE.Group();
  const skin=mat(0xf2c39a), armor=mat(0x5b6f9e), steel=mat(0xc4ced9), gold=mat(0xe0b040), red=mat(0xc8262b), beard=mat(0xf4f0ea), boot=mat(0x4a3423), dark=mat(0x2b2540), capeM=mat(0x2b4a9e,{side:THREE.DoubleSide});
  function leg(x){ const l=new THREE.Group(); l.position.set(x,.5,0); l.add(M(G.cyl(.13,.15,.42,8),dark,0,-.2,0)); l.add(M(G.box(.28,.16,.4),boot,0,-.44,.05)); return l; }
  const legL=leg(-.19), legR=leg(.19); g.add(legL,legR);
  g.add(M(G.cyl(.4,.36,.7,10),armor,0,.85,0)); g.add(M(G.cyl(.43,.43,.1,10),gold,0,.55,0)); g.add(M(G.box(.5,.42,.12),steel,0,.95,.36));
  const em=M(G.sph(.16,8,6),gold,0,.98,.42); em.scale.set(1,1,.5); g.add(em);
  const head=new THREE.Group(); head.position.y=1.55; g.add(head);
  head.add(M(G.sph(.42,14,11),skin)); head.add(M(G.sph(.11,8,6),skin,0,-.07,.4));
  const eL=M(G.sph(.05,6,5),basic(0x1a1020),-.14,.05,.37), eR=M(G.sph(.05,6,5),basic(0x1a1020),.14,.05,.37); eL.userData.noOL=eR.userData.noOL=true; head.add(eL,eR);
  const bd=M(G.sph(.33,12,9),beard,0,-.23,.22); bd.scale.set(1,1.15,.75); head.add(bd);
  const hat=M(G.cone(.47,.95,12),red,0,.62,0); hat.rotation.x=-.12; head.add(hat); head.add(M(G.cyl(.48,.5,.12,12),steel,0,.2,0));
  function arm(x){ const a=new THREE.Group(); a.position.set(x,1.12,0); a.add(M(G.cyl(.1,.09,.5,8),armor,0,-.25,0)); a.add(M(G.sph(.12,8,6),skin,0,-.52,0)); return a; }
  const armR=arm(-.46), armL=arm(.46); g.add(armR,armL);
  const sw=new THREE.Group(); sw.position.set(0,-.52,0); sw.add(M(G.cyl(.04,.04,.22,6),dark,0,.02,0)); sw.add(M(G.sph(.06,6,5),gold,0,.14,0)); sw.add(M(G.box(.36,.06,.1),gold,0,-.1,0)); sw.add(M(G.box(.12,.95,.03),steel,0,-.6,0)); const tip=M(G.cone(.06,.14,4),steel,0,-1.14,0); tip.rotation.x=PI; sw.add(tip); armR.add(sw);
  const sh=new THREE.Group(); sh.position.set(0,-.4,.16); const disc=M(G.cyl(.45,.45,.06,14),red); disc.rotation.x=PI/2; sh.add(disc); const rim=M(new THREE.TorusGeometry(.45,.04,6,16),gold); sh.add(rim); sh.add(M(G.sph(.1,8,6),gold,0,0,.05)); armL.add(sh);
  const capeG=new THREE.Group(); capeG.position.set(0,1.25,-.36); const cp=M(new THREE.PlaneGeometry(.9,1.0),capeM,0,-.5,0); cp.userData.noOL=true; capeG.add(cp); g.add(capeG);
  outline(g);
  return {g,legL,legR,armR,armL,capeG,head};
}
function makeGoblin(kind){
  const g=new THREE.Group(); let skin,cloth,sc=1,h=1.4,r=.42; const steel=mat(0xc4ced9), wood=mat(0x6b4a2a), eye=basic(0xff3030);
  if(kind==='goblin'){ skin=mat(0x62b03c); cloth=mat(0x5a3a22); }
  else if(kind==='orc'){ skin=mat(0x4f8a35); cloth=mat(0x3a2a1a); sc=1.55; h=2.1; r=.65; }
  else if(kind==='archer'){ skin=mat(0x8a78b8); cloth=mat(0x2a2036); sc=1.1; h=1.55; r=.42; }
  else { skin=mat(0x9a8a5c); cloth=mat(0x4a2e1a); sc=2.4; h=3.3; r=1.05; }
  const bulky=kind==='orc'||kind==='ogre';
  const legL=limb(-.14,.42,.36,bulky?.11:.08,skin), legR=limb(.14,.42,.36,bulky?.11:.08,skin); g.add(legL,legR);
  g.add(M(G.cyl(bulky?.3:.2,bulky?.36:.24,.44,8),skin,0,.66,0)); g.add(M(G.box(bulky?.62:.44,.22,bulky?.5:.34),cloth,0,.44,0));
  if(bulky){ const belly=M(G.sph(.33,10,8),skin,0,.62,.08); belly.scale.set(1,.85,.9); g.add(belly); }
  const head=new THREE.Group(); head.position.y=bulky?1.08:1.1; g.add(head);
  head.add(M(G.sph(bulky?.32:.3,12,9),skin));
  const eL=M(G.sph(.05,6,5),eye,-.11,.04,.26), eR=M(G.sph(.05,6,5),eye,.11,.04,.26); eL.userData.noOL=eR.userData.noOL=true; head.add(eL,eR);
  const nose=M(G.cone(.06,.18,5),skin,0,-.04,.32); nose.rotation.x=PI/2; head.add(nose);
  if(kind==='goblin'||kind==='archer'){ const earL=M(G.cone(.08,.38,5),skin,-.34,.08,0); earL.rotation.z=PI/2; const earR=M(G.cone(.08,.38,5),skin,.34,.08,0); earR.rotation.z=-PI/2; head.add(earL,earR); }
  if(bulky){ const jaw=M(G.box(.34,.14,.24),skin,0,-.22,.16); head.add(jaw); [-.1,.1].forEach(x=>{ const t=M(G.cone(.035,.16,5),mat(0xf4f0ea),x,-.1,.3); head.add(t); }); }
  if(kind==='archer'){ const hood=M(G.cone(.36,.6,9),cloth,0,.2,-.02); head.add(hood); const cl=M(G.cyl(.3,.4,.5,8),cloth,0,.7,0); g.add(cl); }
  if(kind==='ogre'){ const horn=M(G.cone(.07,.3,5),mat(0xf4f0ea),0,.28,.02); head.add(horn); }
  const armL=limb(.3,.86,.38,bulky?.09:.06,skin), armR=limb(-.3,.86,.38,bulky?.09:.06,skin); g.add(armL,armR);
  if(kind==='goblin'){ const d=new THREE.Group(); d.position.y=-.4; d.add(M(G.box(.05,.34,.02),steel,0,-.15,0)); d.add(M(G.box(.14,.04,.05),wood,0,.02,0)); armR.add(d); }
  else if(kind==='archer'){ const bow=M(new THREE.TorusGeometry(.42,.025,5,12,PI),wood,0,-.36,.1); bow.rotation.y=PI/2; bow.rotation.z=-PI/2; armL.add(bow); const qv=M(G.cyl(.08,.08,.5,6),cloth,-.18,.8,-.22); qv.rotation.x=.4; g.add(qv); }
  else { const c=new THREE.Group(); c.position.y=-.36; c.add(M(G.cyl(.05,.07,.6,6),wood,0,-.25,0)); c.add(M(G.sph(.15,8,6),wood,0,-.58,0)); if(kind==='ogre'){ for(let k=0;k<4;k++){ const a=k/4*TAU; const sp=M(G.cone(.03,.14,4),steel,Math.cos(a)*.16,-.58,Math.sin(a)*.16); sp.rotation.z=-Math.cos(a)*PI/2; sp.rotation.x=Math.sin(a)*PI/2; c.add(sp); } } armR.add(c); }
  g.scale.set(sc,sc,sc); const sh=blob(r*1.1/sc); sh.position.y=.04/sc; g.add(sh);
  outline(g);
  return {g,legs:[legL,legR],arms:[armL,armR],head,h,r};
}
function makeDef(kind,ghost){
  const g=new THREE.Group(); const stone=mat(0x5a5276), wood=mat(0x7a4f2c), dark=mat(0x2b2540), steel=mat(0xc4ced9), rope=mat(0xcbb58a), gold=mat(0xe0b040), red=mat(0xc8262b);
  if(kind==='harpoon'){
    g.add(M(G.cyl(.85,.95,.3,10),stone,0,.15,0)); g.add(M(G.cyl(.16,.2,.8,8),wood,0,.7,0)); g.add(M(G.box(.5,.12,.5),dark,0,1.05,0));
    const yoke=new THREE.Group(); yoke.position.y=1.18; yoke.add(M(G.box(.26,.2,1.7),wood,0,0,.1));
    const lL=M(G.box(.08,.1,.9),wood,-.45,.02,.55); lL.rotation.y=-.55; const lR=M(G.box(.08,.1,.9),wood,.45,.02,.55); lR.rotation.y=.55; yoke.add(lL,lR);
    const s=M(G.cyl(.015,.015,1.7,4),rope,0,.02,.2); s.rotation.z=PI/2; yoke.add(s);
    const hp=new THREE.Group(); hp.position.set(0,.17,.2); const shaft=M(G.cyl(.035,.035,1.5,6),dark); shaft.rotation.x=PI/2; hp.add(shaft); const tip=M(G.cone(.07,.28,6),steel,0,0,.85); tip.rotation.x=PI/2; hp.add(tip); yoke.add(hp);
    const w=M(G.cyl(.08,.08,.4,8),dark,0,.02,-.75); w.rotation.z=PI/2; yoke.add(w); yoke.add(M(G.box(.06,.06,.5),wood,0,.02,-.45));
    g.add(yoke); g.userData.yoke=yoke; g.userData.hp=hp;
  } else if(kind==='ball'){
    g.add(M(G.cyl(.85,.95,.3,10),stone,0,.15,0)); g.add(M(G.cyl(.55,.45,.95,10),wood,0,.78,0)); g.add(M(G.cyl(.58,.58,.1,10),dark,0,.55,0)); g.add(M(G.cyl(.56,.56,.1,10),dark,0,1.1,0));
    const tur=new THREE.Group(); tur.position.y=1.3; const chute=M(G.cyl(.3,.36,.9,10),dark,0,.1,.35); chute.rotation.x=-PI/2+.32; tur.add(chute); const ballm=M(G.sph(.27,10,8),mat(0x1a1620),0,.25,.72); tur.add(ballm); tur.add(M(G.box(.7,.16,.4),wood,0,-.02,-.2)); const cr=M(G.cyl(.05,.05,.5,6),dark,0,.1,-.4); cr.rotation.z=PI/2; tur.add(cr);
    g.add(tur); g.userData.yoke=tur; g.userData.ball=ballm;
  } else if(kind==='slice'){
    g.add(M(G.cyl(.85,.95,.3,10),stone,0,.15,0)); g.add(M(G.cyl(.16,.22,1.7,8),dark,0,1.1,0)); g.add(M(G.cyl(.28,.28,.14,8),dark,0,.5,0));
    const hub=new THREE.Group(); hub.position.y=1.05; hub.add(M(G.cyl(.16,.16,.5,8),steel,0,.1,0));
    for(let k=0;k<2;k++){ const b=M(G.box(1.55,.05,.22),steel,0,0,0); b.rotation.y=k*PI/2; hub.add(b); const b2=M(G.box(1.35,.05,.2),steel,0,.34,0); b2.rotation.y=k*PI/2+PI/4; hub.add(b2); }
    g.add(hub); g.userData.hub=hub; const pn=M(G.cone(.12,.36,4),red,0,2.1,0); g.add(pn);
  } else {
    g.add(M(G.box(2.0,.5,.45),wood,0,.62,0)); g.add(M(G.box(1.9,.3,.3),wood,0,1.0,0));
    [-.8,.8].forEach(x=>{ const a=M(G.box(.14,1.2,.14),wood,x,.55,.35); a.rotation.x=.55; const b=M(G.box(.14,1.2,.14),wood,x,.55,-.35); b.rotation.x=-.55; g.add(a,b); });
    g.add(M(G.box(.2,.62,.5),dark,-.4,.62,0)); g.add(M(G.box(.2,.62,.5),dark,.4,.62,0));
    for(let k=0;k<6;k++){ const x=-.75+k*.3; const sp=M(G.cone(.07,.5,5),steel,x,.78,.35); sp.rotation.x=PI/2-.35; g.add(sp); const sp2=M(G.cone(.06,.4,5),steel,x+.1,1.08,.22); sp2.rotation.x=PI/2-.6; g.add(sp2); }
  }
  if(ghost){ g.traverse(m=>{ if(m.isMesh) m.material=GHOST_OK; }); } else { outline(g); g.add(blob(.95)); }
  return g;
}
const GHOST_OK=new THREE.MeshBasicMaterial({color:C(0x40ff80),transparent:true,opacity:.45,depthWrite:false});
const GHOST_BAD=new THREE.MeshBasicMaterial({color:C(0xff3030),transparent:true,opacity:.45,depthWrite:false});
function harpoonMesh(){ const g=new THREE.Group(); const s=M(G.cyl(.035,.035,1.3,6),mat(0x2b2540)); s.rotation.x=PI/2; g.add(s); const t=M(G.cone(.07,.26,6),mat(0xc4ced9),0,0,.75); t.rotation.x=PI/2; g.add(t); return g; }
function ballMesh(){ const g=new THREE.Group(); const m=M(G.sph(.42,12,10),mat(0x1a1620)); [[.1,.34,.22],[-.12,.34,.22],[0,.4,.1]].forEach(([x,y,z])=>{ const h=M(G.sph(.06,6,5),basic(0x000000),x,y,z); h.userData.noOL=true; m.add(h); }); outline(m); g.add(m); g.userData.m=m; return g; }
function arrowMesh(){ const g=new THREE.Group(); const s=M(G.cyl(.02,.02,.9,4),mat(0x6b4a2a)); s.rotation.x=PI/2; g.add(s); const t=M(G.cone(.04,.14,4),mat(0xc4ced9),0,0,.5); t.rotation.x=PI/2; g.add(t); return g; }
function orbMesh(){ const g=new THREE.Group(); const o=new THREE.Mesh(new THREE.OctahedronGeometry(.16,0),basic(0x7af4ff)); o.userData.noOL=true; g.add(o); g.add(glow(0x4ae6ff,1.2,.7)); g.userData.o=o; return g; }
