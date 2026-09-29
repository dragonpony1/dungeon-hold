// ===== PITFALL (build 228): the Witch's trap-and-kill tower. Matt: "a new tower that traps and kills" (the Mycelium Cage's root-and-mushroom look is going, the Heartroot takes it),
// "Can you make mobs sink?" -- "Like actually sink into the floor". A carved-stone pit mouth lies on the floor. When ground mobs gather over it (and it is off cooldown) the
// hatch splits, everything inside is HELD (e.holdT, the same freeze Rootsplitter's roots use) for cfg.hold seconds and SINKS into the floor (a negative e.lift, a look only: the
// opaque floor hides what is below it), taking spike ticks; then the walls SLAM: small mobs are killed outright, an ogre-sized one is badly hurt (a fraction of its max hp) and
// heaves itself back out, and a boss can never be held or sunk -- it only takes the crush. It looks like underground stone and iron, not roots (placeholder art: Matt's Meshy marks
// drop in later). Runs where the mobs are real (solo / the host); a co-op guest sees the pit and the held mobs, not the sinking (a puppet mob's look is the host's).
(function(){
if(TUTORIAL) return;
DEFS.pit={name:'Pitfall',ic:'🕳',du:5,mana:80,hp:999999,top:.05,range:2.2,rangeUp:.3,arc:360,cd:7,dmg:14,hold:2.6,crush:5,bigFrac:.4};
DEFKEYS.push('pit'); DEFKEY_LABELS.push('4');
{ const cfg=DEFS.pit; const s=document.createElement('div'); s.className='slot'; s.id='slot-pit';
  s.innerHTML='<div class="k">4</div><div class="ic">'+cfg.ic+'</div><div class="n">'+cfg.name+'</div><div class="cst">🌱 '+cfg.du+' · '+cfg.mana+' ◆</div>';
  s.addEventListener('click',()=>select('pit')); $('hotbar').appendChild(s); }
{ const w=HEROES.find(h=>h.id==='witch'); if(w&&!w.unlocks.includes('pit')) w.unlocks.push('pit'); }
NOWALK_DEF.pit=1;   // mobs walk straight over it and never attack it (the Cage and the Perch get the same treatment)
const BOSS=new Set(['trollboss','cyclops','pigflail','pigdagger','pigsling']), BIG=new Set(['ogre']);
const isGuest=()=>!!(window.__net&&window.__net.role&&window.__net.role()==='guest');
// ---------------------------------------------------------------- the look: a ring of stone blocks, a hatch that splits away, a black pit, iron teeth that rise, dust
{ const prevMakeDef=makeDef; makeDef=function(kind,ghost,lvl){ if(kind!=='pit') return prevMakeDef(kind,ghost,lvl);
    const g=new THREE.Group(), body=new THREE.Group(); g.add(body); const stone=mat(0x7d7889), slab=mat(0x5b5668), iron=mat(0x2c2a33);
    const N=18; for(let i=0;i<N;i++){ const a=i/N*TAU; const b=M(G.box(.36,.2,.24),stone,Math.cos(a)*1.04,.1,Math.sin(a)*1.04); b.rotation.y=-a; body.add(b); }
    const hole=new THREE.Mesh(new THREE.CircleGeometry(.98,32),new THREE.MeshBasicMaterial({color:0x050308})); hole.rotation.x=-PI/2; hole.position.y=.03; hole.userData.noOL=true; body.add(hole);
    const halves=[]; for(const sgn of [-1,1]){ const h=new THREE.Mesh(new THREE.CylinderGeometry(.96,.96,.1,20,1,false,sgn<0?0:PI,PI),slab); h.position.y=.06; h.userData.side=sgn; body.add(h); halves.push(h); }
    const teeth=[]; for(let i=0;i<14;i++){ const a=i/14*TAU; const t=M(G.cone(.07,.42,5),iron,Math.cos(a)*.84,-.25,Math.sin(a)*.84); t.userData.a=a; body.add(t); teeth.push(t); }
    const glo=glow(0xff5a20,3.4,0); glo.position.y=.15; body.add(glo); const dust=new THREE.Group(); for(let i=0;i<8;i++){ const p=glow(0xb59b7c,1,0); p.userData={a:i/8*TAU,r:.3+.5*((i*7)%3)/2,ph:i*.13}; dust.add(p); } body.add(dust);
    g.userData.pit={body,hole,halves,teeth,glo,dust};
    if(ghost){ g.traverse(m=>{ if(m.isMesh) m.material=GHOST_OK; }); } else { outline(g); g.add(blob(.95)); }
    return g; }; }
function pitAnim(d,dt){ const u=d.mdl.userData.pit; if(!u) return; const P=d.pit||{phase:'rest',t:0}; const rr=stat(d,'range'), s=d.mdl.scale.x||1; u.body.scale.setScalar(rr/s);
  const open=P.phase==='open'?Math.min(1,P.t/.35):P.phase==='crush'?Math.max(0,1-P.t/.45):0;   // how far the hatch has split
  for(const h of u.halves) h.position.set(0,.06,h.userData.side*.96*open); u.hole.visible=open>.02;
  const crush=P.phase==='crush'?Math.min(1,P.t/.16):0;   // the teeth snap inward
  for(const t of u.teeth){ const a=t.userData.a; t.position.set(Math.cos(a)*(.84-.55*crush),-.25+.5*open+.05*crush,Math.sin(a)*(.84-.55*crush)); t.rotation.set(0,0,0); t.rotation.z=Math.cos(a)*-.9*crush; t.rotation.x=Math.sin(a)*.9*crush; }
  u.glo.material.opacity=(.45*open+(P.phase==='crush'?.5*(1-crush):0))*(.85+.15*Math.sin(S.t*9));
  const showDust=P.phase==='crush'&&P.t<.9; u.dust.visible=showDust; if(showDust) for(const p of u.dust.children){ const q=P.t/.9; p.position.set(Math.cos(p.userData.a)*(p.userData.r+q*.7),.1+q*1.3+p.userData.ph,Math.sin(p.userData.a)*(p.userData.r+q*.7)); p.material.opacity=.55*(1-q); p.scale.setScalar(.6+q*1.4); } }
// ---------------------------------------------------------------- the trap
function inPit(d,e,rr){ return !e.dead&&!e.fly&&Math.hypot(e.x-d.x,e.z-d.z)<rr+(e.r||.4)*.3; }
function pitTick(d,dt){ const cfg=DEFS.pit; const P=d.pit||(d.pit={phase:'rest',t:0,cool:1.5,held:[],tick:0}); const rr=stat(d,'range'), H=cfg.hold;
  if(P.phase==='rest'){ P.cool-=dt; if(P.cool<=0&&!isGuest()){ const held=enemies.filter(e=>!BOSS.has(e.kind)&&inPit(d,e,rr)); if(held.length){ P.phase='open'; P.t=0; P.tick=0; P.held=held; beep(90,.45,'sawtooth',.06,-30); noise(.3,.06,320); floatText(d.x,d.base+1.4,d.z,'THE FLOOR OPENS','#c9b29a'); } } }
  else if(P.phase==='open'){ P.t+=dt; if(P.t<H*.5) for(const e of enemies) if(!BOSS.has(e.kind)&&inPit(d,e,rr)&&!P.held.includes(e)) P.held.push(e);   // a late arrival still falls in
    P.held=P.held.filter(e=>!e.dead);
    for(const e of P.held){ const goal=BIG.has(e.kind)?.5*(e.h||1.6):1.1*(e.h||1.2); e.sinkBy=d; e.sink=Math.min(goal,(e.sink||0)+dt*goal/(H*.8)); e.lift=-e.sink; e.holdT=Math.max(e.holdT||0,.3); e.x=lerp(e.x,d.x,Math.min(1,dt*1.5)); e.z=lerp(e.z,d.z,Math.min(1,dt*1.5)); }   // held, and drawn toward the middle as it takes them
    P.tick+=dt; if(P.tick>=.5){ P.tick-=.5; for(const e of P.held) hurt(e,stat(d,'dmg')*.35,0,0); }
    if(P.t>=H) pitCrush(d,P,cfg,rr); }
  else if(P.phase==='crush'){ P.t+=dt; if(P.t>=.6){ P.phase='rest'; P.t=0; P.cool=stat(d,'cd'); } }
  pitAnim(d,dt); }
function pitCrush(d,P,cfg,rr){ P.phase='crush'; P.t=0; const dmg=stat(d,'dmg')*cfg.crush; let killed=0, hurtN=0;
  for(const e of enemies){ if(e.dead||e.fly||!inPit(d,e,rr+.3)) continue; if(BOSS.has(e.kind)){ hurt(e,dmg,0,0); hurtN++; continue; }
    if(!P.held.includes(e)) continue;
    if(BIG.has(e.kind)){ hurt(e,Math.max(dmg,cfg.bigFrac*e.max),0,0); e.sinkBy=d; hurtN++; }
    else { e.sink=Math.max(e.sink||0,1.1*(e.h||1.2)); e.lift=-e.sink; hurt(e,e.hp+1e6,0,0); killed++; } }
  P.held=[]; SFX.implode&&SFX.implode(); d.shake=.4; floatText(d.x,d.base+1.6,d.z,killed?'SWALLOWED ×'+killed:'CRUSHED','#c9b29a'); }
// a mob that sank comes back up when its pit closes or is gone; the look only
function surface(dt){ for(const e of enemies){ if(!(e.sink>0)) continue; const d=e.sinkBy; const still=!e.dead&&d&&defs.includes(d)&&d.pit&&d.pit.phase==='open'&&d.pit.held.includes(e); if(still) continue; e.sink=Math.max(0,e.sink-dt*(e.dead?0:1.6)); e.lift=-e.sink; if(e.sink<=0) e.sinkBy=null; } }
{ const prev=updateDefs; updateDefs=function(dt){ prev(dt); for(const d of defs) if(d.kind==='pit') pitTick(d,dt); surface(dt); }; }
window.__pit={cfg:DEFS.pit,state:d=>d&&d.pit?{phase:d.pit.phase,t:+d.pit.t.toFixed(2),held:d.pit.held.length,cool:+(d.pit.cool||0).toFixed(1)}:null};
})();
