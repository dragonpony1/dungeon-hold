// ===== THE CRYSTAL: the castle-crystal model (Meshy) replaces the procedural pedestal and octahedron. The old crystal's
// glow sprite, orbiting shards and bob stay, moved up to the new crystal's height. Only the crystal itself pulses: the
// model is one mesh with one texture, so its triangles are sorted by texture colour — blue ones are crystal (they glow
// and flash when the crystal is hit), the rest is the stone platform and stays plain.
{ function splitCrystal(root){ const list=[]; root.traverse(m=>{ if(m.isMesh) list.push(m); }); let tris=[0,0];
    for(const m of list){ const g=m.geometry, mt=Array.isArray(m.material)?m.material[0]:m.material; const uv=g.attributes.uv, img=mt&&mt.map&&mt.map.image; if(!uv||!img||!img.width) continue;
      const W=img.width, H=img.height; const c=document.createElement('canvas'); c.width=W; c.height=H; const ctx=c.getContext('2d'); ctx.drawImage(img,0,0); const px=ctx.getImageData(0,0,W,H).data;
      const idx=g.getIndex(); const n=idx?idx.count:g.attributes.position.count; const vid=i=>idx?idx.getX(i):i; const A=[], B=[];
      for(let i=0;i+2<n;i+=3){ let u=0, v=0; for(let k=0;k<3;k++){ u+=uv.getX(vid(i+k)); v+=uv.getY(vid(i+k)); } u=((u/3)%1+1)%1; v=((v/3)%1+1)%1; const X=Math.min(W-1,Math.floor(u*W)), Y=Math.min(H-1,Math.floor(mt.map.flipY?(1-v)*H:v*H)); const o=(Y*W+X)*4; const r=px[o], gg=px[o+1], b=px[o+2];
        const blue=b>90&&b>r*1.25&&gg>r*.9; (blue?A:B).push(vid(i),vid(i+1),vid(i+2)); }
      if(!A.length||!B.length) continue; tris=[A.length/3,B.length/3];
      const gA=g.clone(); gA.setIndex(A); const gB=g.clone(); gB.setIndex(B); const mA=mt.clone(); mA.emissive=C(0x1a8ac0); mA.emissiveIntensity=.35; mt.emissive=C(0x000000);
      const a=new THREE.Mesh(gA,mA), bm=new THREE.Mesh(gB,mt); for(const x of [a,bm]){ x.position.copy(m.position); x.quaternion.copy(m.quaternion); x.scale.copy(m.scale); m.parent.add(x); } a.userData.crystal=true; m.parent.remove(m); g.dispose(); }
    return tris; }
  fetchBytes(ASSET('crystal.glb'),'first').then(buf=>new THREE.GLTFLoader().parse(buf,'',gltf=>{ try{
    const root=gltf.scene||gltf.scenes[0]; const tris=splitCrystal(root); const fit=fitModel(root,5.6); toonify(root,fit.scale);
    const mats=[]; root.traverse(m=>{ if(m.isMesh&&!m.userData.isOL&&m.userData.crystal){ (Array.isArray(m.material)?m.material:[m.material]).forEach(mt=>mats.push(mt)); } });
    const cg=crystalG.userData.cg; for(const c of crystalG.children.slice()){ if(c!==cg) crystalG.remove(c); }
    fit.wrap.position.y=.02;   // a hair above the floor: its underside on the floor surface flickered
    crystalG.add(fit.wrap); crystalG.userData.cgY=3.8; crystalG.userData.model=root; crystalG.userData.mats=mats; crystalG.userData.tris=tris;
    crystalMesh.visible=false; const gl=cg.children.find(o=>o.isSprite); if(gl) gl.scale.set(5.2,5.2,1);
  }catch(e){ console.warn('crystal model',e); } },e=>console.warn('crystal model',e))).catch(e=>console.warn('crystal model',e));
  const prev=Meta.hud; Meta.hud=()=>{ prev(); const mats=crystalG.userData.mats; if(mats){ const k=crystalMesh.material.emissiveIntensity*.75; for(const mt of mats) mt.emissiveIntensity=k; } };
  window.__crystal={state:()=>({model:!!crystalG.userData.model,cgY:crystalG.userData.cgY||2.7,oldVisible:crystalMesh.visible,tris:crystalG.userData.tris||null,pulsing:(crystalG.userData.mats||[]).length})}; }
// ---- the alarm: the crystal losing life is easy to miss from across the hall (a red edge flash and a soft hit), so any
// drop in S.crystal -- a mob's blow on the host, or the world sync on a guest's screen -- raises a red UNDER ATTACK strip
// under the wave line for 2.5 s (renewed while the hits keep coming) and rings a low two-tone bell, at most once every 3 s.
{ const css=document.createElement('style'); css.textContent='#alarm{position:absolute;left:50%;top:58px;transform:translateX(-50%);background:#5a0e12ee;border:2px solid #ff5a5a;border-radius:8px;color:#fff;font:bold 15px Georgia,serif;letter-spacing:3px;padding:6px 16px;white-space:nowrap;opacity:0;transition:opacity .2s;pointer-events:none;text-shadow:0 2px 3px #000;animation:alarmPulse .7s ease-in-out infinite}#alarm.on{opacity:1}@keyframes alarmPulse{0%,100%{box-shadow:0 0 6px #ff5a5a66}50%{box-shadow:0 0 22px #ff5a5acc}}@media (max-width:700px){#alarm{top:auto;bottom:196px;font-size:13px}}'; document.head.appendChild(css);
  const strip=document.createElement('div'); strip.id='alarm'; strip.textContent='⚠ THE CRYSTAL IS UNDER ATTACK'; (document.getElementById('hud')||document.body).appendChild(strip);
  const AL={last:null,showT:0,cool:0,rings:0,hits:0};
  SFX.alarm=()=>{ beep(196,.45,'triangle',.16,-30); setTimeout(()=>beep(147,.6,'triangle',.14,-20),220); noise(.08,.03,900); };
  const prev=Meta.update; Meta.update=dt=>{ prev(dt); if(AL.showT>0){ AL.showT-=dt; if(AL.showT<=0) strip.classList.remove('on'); } if(AL.cool>0) AL.cool-=dt;
    const c=S.crystal; if(AL.last!==null&&c<AL.last&&c>0&&(S.phase==='wave'||S.phase==='build')){ AL.hits++; strip.classList.add('on'); AL.showT=2.5; if(AL.cool<=0){ AL.cool=3; AL.rings++; if(!soundOff) SFX.alarm(); } } AL.last=c; };
  window.__alarm={on:()=>strip.classList.contains('on'),rings:()=>AL.rings,hits:()=>AL.hits,max:()=>CRYSTAL_MAX}; }
