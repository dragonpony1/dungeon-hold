// ===== LOOT FEEL: a pickup card that compares what you found with what you wear (E to equip), gear you can SEE on
// the gnome (weapon-hand glow, orbiting charm, amulet gem — coloured by rarity), and a live hero stat block =====
(function(){
const css=`#pickcard{position:absolute;right:14px;top:112px;width:272px;max-width:calc(100vw - 28px);background:linear-gradient(#2a1f33f4,#160f1cf4);border:2px solid #6b5a3c;border-radius:10px;padding:10px 12px;box-shadow:0 4px 0 #000,0 0 18px #0008;pointer-events:auto;transform:translateX(120%);transition:transform .35s cubic-bezier(.2,.9,.3,1.2),opacity .3s;opacity:0;font-size:13px;line-height:1.35;cursor:pointer}
#pickcard.show{transform:none;opacity:1}
#pickcard .pc-h{display:flex;gap:9px;align-items:center;margin-bottom:5px}#pickcard .pc-ic{font-size:26px;width:30px;text-align:center}#pickcard .pc-n{font-weight:bold;font-size:14px;line-height:1.2}#pickcard .pc-t{font-size:11px;color:#bfae90;letter-spacing:1px}
#pickcard .pc-s{display:flex;justify-content:space-between;gap:8px;font-size:12px;padding:1px 0}#pickcard .up{color:#5ad05a}#pickcard .dn{color:#ff6a5a}#pickcard .nu{color:#8f8470}
#pickcard .pc-f{margin-top:6px;font-size:12px;color:#e8b94a;border-top:1px solid #6b5a3c66;padding-top:5px}#pickcard .pc-f b{color:#fff;background:#2a1f33;border:1px solid #6b5a3c;border-radius:4px;padding:0 5px}
#pickcard.eq{border-color:#e8b94a;box-shadow:0 4px 0 #000,0 0 22px #e8b94a66}
#herostats{margin-top:6px;font-size:11.5px;line-height:1.45;text-shadow:0 1px 2px #000;display:grid;grid-template-columns:1fr 1fr;gap:0 8px}
#herostats .hs{display:flex;justify-content:space-between;gap:6px;padding:0 4px;border-radius:3px;transition:background .8s}#herostats .hs b{color:#f1e6d0;font-weight:bold}#herostats .hs i{font-style:normal;color:#bfae90}
#herostats .hs.up{background:#5ad05a66;transition:none}#herostats .hs.dn{background:#ff6a5a66;transition:none}
#defcard{margin-top:6px;font-size:11.5px;line-height:1.45;text-shadow:0 1px 2px #000;background:#0006;border:1px solid #6b5a3c66;border-radius:6px;padding:4px 6px;display:none}#defcard.show{display:block}#defcard .dc-n{font-weight:bold;color:#e8b94a}#defcard .dc-r{display:flex;justify-content:space-between;gap:8px}#defcard .dc-r i{font-style:normal;color:#bfae90}#defcard .dc-r b{color:#f1e6d0}#defcard .dc-hp{color:#5ad05a}#defcard .dc-note{color:#5ee9ff;font-style:italic}#defcard .dc-rune{color:#ffd27a;font-style:italic;text-shadow:0 0 6px #ffb84a99,0 1px 2px #000}#defcard .dc-chevs{display:inline-flex;flex-direction:column-reverse;align-items:center;vertical-align:middle;margin:-3px 0 0 6px}#defcard .dc-cv{display:block;width:6px;height:6px;border:solid #ffc83a;border-width:2.5px 0 0 2.5px;transform:rotate(45deg);margin:0 0 -1.5px;box-shadow:-1px -1px 0 #2a1606}#hud .res .mana.spend{color:#fff;text-shadow:0 0 12px var(--cyan)}
@media (max-width:700px){#pickcard{width:250px;top:auto;bottom:150px;right:auto;left:50%;transform:translate(-50%,140%);font-size:12px}#pickcard.show{transform:translate(-50%,0)}#pickcard .pc-ic{font-size:20px}#herostats{font-size:10.5px;grid-template-columns:1fr}}`;
const st=document.createElement('style'); st.textContent=css; document.head.appendChild(st);
const card=document.createElement('div'); card.id='pickcard'; $('hud').appendChild(card);
const CS={it:null,before:null,canEquip:false,timer:null};
const fmt=(k,v)=>k==='regen'?(Math.round(v*10)/10)+'':Math.round(v)+'';
function statRows(it,before){ const keys=Object.keys(it.stats); if(before) for(const k in before.stats) if(!keys.includes(k)) keys.push(k);
  return keys.map(k=>{ const v=it.stats[k]||0, o=before?(before.stats[k]||0):0, d=v-o; const lab=v?(STATL[k]?STATL[k](v):k+' '+v):'<span class="nu">no '+(STATL[k]?STATL[k](0).replace(/^\+?0\s*/,''):k)+'</span>';
    const dl=!before?'<span class="nu">new</span>':d>0?'<span class="up">▲ '+fmt(k,d)+'</span>':d<0?'<span class="dn">▼ '+fmt(k,-d)+'</span>':'<span class="nu">=</span>';
    return '<div class="pc-s"><span>'+lab+'</span>'+dl+'</div>'; }).join(''); }
function footer(){ const it=CS.it; if(!it) return ''; if(CS.outcome==='equipped') return 'Equipped!'; if(CS.outcome==='sold') return 'sold for '+it.value+' '+(Meta.bag?'gold':'mana');
  // build 314 (Matt: "the pop up tool that says level 7 required, i dont understand it and it just keeps coming up"): a better piece you are too low to wear no longer offers E (E used to
  // try it, get refused and throw the LEVEL card -- again on every E press while this card stood); it shows its lock instead
  if(CS.lock) return '<span style="color:#ff8a6a">🔒 <b>Lv '+CS.lock+'</b></span>  ·  you: Lv '+(Meta.level?Meta.level():1)+'  ·  🎒 in your bag';
  if(CS.keep) return 'in your bag  ·  your set '+CS.keep.name+' stays whole ('+CS.keep.count+' worn)  ·  swap it from the bag if you mean to';
  return CS.canEquip?'<b>E</b> equip now  ·  in your bag':(CS.better?'in your bag':'in your bag  ·  not better than yours'); }
// a worn piece that is holding a set bonus (three or more of its set on) is never swapped by the card's quick E: a better
// loose piece would break the set the player built, so it goes to the bag with a note instead (swap it from the bag or the
// sheet on purpose). A better piece of the SAME set still gets the offer -- that only makes the set stronger. (build 147)
function keepsSet(it,before){ if(!before||!Meta.sets) return null; const n=Meta.sets.setOf(before); if(!n||Meta.sets.setOf(it)===n) return null; const a=Meta.sets.active().find(x=>x.name===n); return a?{name:n,count:a.count}:null; }
function showCard(it,before,outcome){ CS.it=it; CS.before=before; CS.outcome=outcome; CS.better=!before||it.score>before.score; CS.keep=CS.better?keepsSet(it,before):null; CS.lock=(CS.better&&Meta.canWear&&!Meta.canWear(it))?(it.req|0):0; CS.canEquip=outcome==='bagged'&&CS.better&&!!Meta.equip&&!CS.keep&&!CS.lock;
  card.innerHTML='<div class="pc-h"><div class="pc-ic">'+slotIcon(it)+'</div><div><div class="pc-n" style="color:'+RCSS[it.rarity]+'">'+it.name+'</div><div class="pc-t">T'+(it.tier||tierOf(it.lvl))+' · '+RNAME[it.rarity].toUpperCase()+(before?' · vs '+before.name:' · new slot')+'</div></div></div>'+statRows(it,before)+'<div class="pc-f">'+footer()+'</div>';
  card.classList.remove('eq'); card.classList.add('show'); if(CS.timer) clearTimeout(CS.timer); CS.timer=setTimeout(hideCard,4800); }
function hideCard(){ card.classList.remove('show'); CS.it=null; CS.canEquip=false; CS.keep=null; }
function equipFromCard(){ if(!CS.it||!CS.canEquip||!Meta.equip) return false; if(!Meta.equip(CS.it.id)) return false; CS.canEquip=false; CS.outcome='equipped'; card.querySelector('.pc-f').innerHTML='Equipped!'; card.classList.add('eq'); if(CS.timer) clearTimeout(CS.timer); CS.timer=setTimeout(hideCard,2200); refreshGear(true); return true; }
addEventListener('keydown',e=>{ if(e.code!=='KeyE'||!CS.canEquip||Meta.isOpen()) return; if(equipFromCard()){ e.stopImmediatePropagation(); e.preventDefault(); } },true);
card.addEventListener('click',e=>{ e.stopPropagation(); equipFromCard(); }); card.addEventListener('touchstart',e=>{ e.preventDefault(); e.stopPropagation(); equipFromCard(); },{passive:false});
// what happened to the item you walked over: bagged (tavern build), equipped / sold (old path), sold (bag full)
const pickupProc=pickup;
pickup=function(l){ const it=l.it, before=gear[it.slot]; pickupProc(l); let outcome='sold'; if(gear[it.slot]===it) outcome='equipped'; else if(Meta.bag&&Meta.bag().some(b=>b.id===it.id)) outcome='bagged'; showCard(it,before,outcome); refreshGear(false); };

// ---- gear you can see ----
const V={host:null,weapon:null,charm:null,amulet:null,ids:''}; const ORB_GEO=new THREE.OctahedronGeometry(.11,0);
function heroHand(){ if(useGLB&&GLBH&&GLBH.root){ let b=GLBH.root.getObjectByName('mixamorigRightHand'); if(!b) GLBH.root.traverse(o=>{ if(!b&&o.isBone&&/RightHand$/i.test(o.name)) b=o; }); return b||null; } return H.armR||null; }
function rebuildVisuals(){ if(V.weapon&&V.weapon.parent) V.weapon.parent.remove(V.weapon); if(V.charm) scene.remove(V.charm); if(V.amulet) scene.remove(V.amulet); V.weapon=V.charm=V.amulet=null;
  const host=heroHand(); V.host=host; const w=gear.weapon;
  if(w&&w.rarity>=1&&host){ const s=glow(RCOL[w.rarity],1,.45+.12*w.rarity); let at=host, y=0; if(useGLB&&GLBH){ let mn=null; host.traverse(o=>{ if(!mn&&/^(weapon|staff|bow)Mount_\d+/.test(o.name)) mn=o; }); if(mn){ at=mn; y=(+mn.name.split('_')[1])*.4; } }   // on the weapon mount when the rig has one, 40% up the blade
    at.updateWorldMatrix(true,false); const k=(useGLB&&GLBH)?1/at.getWorldScale(new THREE.Vector3()).x:1;   // sprite size in world units whatever the rig's own scale
    s.scale.set(.85*k,.85*k,1); s.position.y=(useGLB&&GLBH)?y:-.42; s.userData.base=s.material.opacity; at.add(s); V.weapon=s; }
  const c=gear.charm; if(c){ const g=new THREE.Group(); const orb=new THREE.Mesh(ORB_GEO,basic(RCOL[c.rarity])); orb.userData.noOL=true; g.add(orb); g.add(glow(RCOL[c.rarity],.9,.55)); g.userData.orb=orb; scene.add(g); V.charm=g; }
  const a=gear.amulet; if(a){ const s=glow(RCOL[a.rarity],.45,.7); scene.add(s); V.amulet=s; } }
function refreshGear(force){ const ids=SLOTS.map(s=>gear[s]?gear[s].id:'-').join('|')+'|'+(useGLB?'g':'p'); const host=heroHand(); if(force||ids!==V.ids||host!==V.host){ V.ids=ids; rebuildVisuals(); } }
function visualsUpdate(dt){ refreshGear(false); const t=S.t, dead=hero.dead>0;
  if(V.weapon){ const w=gear.weapon; V.weapon.material.opacity=V.weapon.userData.base*(w&&w.rarity>=3?.85+Math.sin(t*6)*.15:1); V.weapon.visible=!dead; }
  if(V.charm){ V.charm.visible=!dead; V.charm.position.set(hero.x+Math.cos(t*1.6)*.95,hero.y+2.15+Math.sin(t*3.1)*.1,hero.z+Math.sin(t*1.6)*.95); V.charm.userData.orb.rotation.y=t*2.5; V.charm.userData.orb.rotation.x=t*1.3; }
  if(V.amulet){ V.amulet.visible=!dead; const fx=Math.sin(hero.yaw), fz=Math.cos(hero.yaw); V.amulet.position.set(hero.x+fx*.3,hero.y+1.55,hero.z+fz*.3); V.amulet.material.opacity=.55+Math.sin(t*4)*.15; } }

// ---- the numbers you fight with ----
const ROWS=[['dmg','⚔ Damage'],['aps','⚡ Swings/s'],['magic','✨ Magic'],['dps','💥 DPS'],['armor','🛡 Armor'],['tow','🏹 Defenses'],['hp','❤ HP']];
let hsEl=null; const hsLast={}, hsFlash={};
function heroStats(){ const dmg=heroDmg(), aps=1/swingDur(), f=gear.familiar, fr=f?(f.stats.frate||0):0, magic=f?Math.round((f.stats.fdmg||0)*heroMult('dmg')):0, pdps=f?magic*1.2*(1+fr/100):0;
  return {dmg,aps:Math.round(aps*100)/100,magic,dps:Math.round(dmg*aps+pdps),armor:Math.min(90,heroStat('def')),tow:Math.round(((1+heroStat('tow')/100)*heroMult('tow')-1)*100),hp:Math.round(hero.hp)+'/'+hero.max}; }
const hsFmt={dmg:v=>v,aps:v=>v.toFixed(2),magic:v=>v||'—',dps:v=>v,armor:v=>v+'%',tow:v=>'+'+v+'%',hp:v=>v};
function ensureStats(){ if(hsEl) return; const anchor=$('xpline')||$('gear'); if(!anchor) return; hsEl=document.createElement('div'); hsEl.id='herostats'; hsEl.innerHTML=ROWS.map(([k,l])=>'<div class="hs" id="hs-'+k+'"><i>'+l+'</i><b>–</b></div>').join(''); anchor.insertAdjacentElement('afterend',hsEl); }
let manaLast=null, manaFlash=0;
function manaWatch(){ const el=document.querySelector('#hud .res .mana'); if(!el) return; if(manaLast!==null&&S.mana<=manaLast-20){ el.classList.add('spend'); if(manaFlash) clearTimeout(manaFlash); manaFlash=setTimeout(()=>el.classList.remove('spend'),700); } manaLast=S.mana; }
function statsUpdate(){ ensureStats(); manaWatch(); if(!hsEl) return; const s=heroStats(); for(const [k] of ROWS){ const v=s[k]; if(hsLast[k]===v) continue; const row=$('hs-'+k); const num=typeof v==='number'&&typeof hsLast[k]==='number'; if(num&&k!=='hp'){ row.classList.remove('up','dn'); void row.offsetWidth; row.classList.add(v>hsLast[k]?'up':'dn'); if(hsFlash[k]) clearTimeout(hsFlash[k]); hsFlash[k]=setTimeout(()=>row.classList.remove('up','dn'),900); } hsLast[k]=v; row.lastElementChild.textContent=hsFmt[k](v); } }

// ---- the defense you are standing at: its numbers ----
let dcEl=null, dcKey='';
function chevHtml(l){ const n=chevCount(l); return n?'<span class="dc-chevs" title="'+n+' chevron'+(n>1?'s':'')+'">'+'<span class="dc-cv"></span>'.repeat(n)+'</span>':''; }   // build 177: the Mark V+ tower's gold chevrons (game.js towerChevrons), drawn small on the card too
// build 499: the card on a co-op GUEST's screen -- the host's tower its E will act on (99-network.js guestPick): its name and mark, health, kills, and what E and X will do
function guestCard(p){ const cfg=DEFS[p.kind]; const rows=[]; const R=(l,v)=>rows.push('<div class="dc-r"><i>'+l+'</i><b>'+v+'</b></div>'); const hurt=p.max&&p.hp<p.max;
  R('❤ Health','<span class="dc-hp">'+Math.ceil(p.hp||0)+'</span> / '+(p.max||'?')); R('💀 Kills',(p.kills|0).toLocaleString());
  if(hurt) R('🔧 Repair · E',Math.ceil((p.max-p.hp)/8)+' ◆ mana'); if(p.lvl<MAXLVL) R(hurt?'⬆ Upgrade (after repair)':'⬆ Upgrade · E',upCost(p)+' ◆ mana → Mk '+MARK[p.lvl+1]+chevHtml(p.lvl+1)); else R('⬆ Upgrade','Mark '+MARK[MAXLVL]+' — the top mark');
  if(p.spent) R('✖ Sell · X','+'+Math.round(p.spent*.7)+' ◆ mana');
  const key='g'+p.id+p.lvl+'|'+rows.join(''); if(key===dcKey) return; dcKey=key; dcEl.innerHTML='<div class="dc-n">'+cfg.ic+' '+cfg.name+' · Mark '+MARK[p.lvl]+chevHtml(p.lvl)+'</div>'+rows.join(''); dcEl.classList.add('show'); }
function defCard(){ if(!dcEl){ const anchor=$('herostats')||$('xpline')||$('gear'); if(!anchor) return; dcEl=document.createElement('div'); dcEl.id='defcard'; anchor.insertAdjacentElement('afterend',dcEl); }
  const d=(S.phase==='build'||S.phase==='wave')&&!placing?pickDef():null;   /* build 165: the same tower E will act on (game.js pickDef) */
  if(!d&&(S.phase==='build'||S.phase==='wave')&&!placing&&window.__defsync&&window.__defsync.pick){ const p=window.__defsync.pick(); if(p&&DEFS[p.kind]){ guestCard(p); return; } }   // build 499: a co-op guest's card, from the host's towers it sees
  if(!d){ if(dcKey){ dcKey=''; dcEl.classList.remove('show'); } return; }
  const cfg=DEFS[d.kind]; const rows=[]; const R=(l,v)=>rows.push('<div class="dc-r"><i>'+l+'</i><b>'+v+'</b></div>');
  R('❤ Health','<span class="dc-hp">'+Math.ceil(d.hp)+'</span> / '+d.max); R('💀 Kills',(d.kills|0).toLocaleString());   /* build 463 (Matt: "one of the little numbers should show how many mobs it's killed") */
  if(cfg.dmg!==undefined) R('⚔ Damage',stat(d,'dmg')); if(cfg.cd!==undefined) R('⚡ Rate',(1/stat(d,'cd')).toFixed(2)+'/s'); if(cfg.range) R('📏 Range',Math.round(stat(d,'range')*10)/10); if(cfg.arcs||(cfg.arc&&cfg.arc<360)) R('◔ Cone',arcOf(d)+'°'); if(cfg.thorns){ const k=(1+.25*((d.lvl||1)-1))*(1+oStat(d,'tow')/100); R('🌵 Thorns',Math.round(50*k)+'% of each hit +'+Math.round(cfg.thorns*k)); }   // build 163: what game.js's thornsBack returns to a melee attacker R('🌱 Roots',cfg.du);
  // build 178: the Rune Totem's two auras, what feeds them, and who is getting them; and on a tower standing in a ring, what it gets
  const P=v=>Math.round(v*100);
  if(d.kind==='totem'){ const bd=stat(d,'buffD'), bs=stat(d,'buffS'), rr=stat(d,'range'); let n=0; for(const o of defs) if(o!==d&&o.kind!=='totem'&&runeTakes(o)&&Math.hypot(o.x-d.x,o.z-d.z)<=rr) n++; const who=d.ownerId?"its placer's":'your';
    R('⚔ Damage aura','+'+P(bd)+'%'); R('⚡ Speed aura','+'+P(bs)+'%'); R('🔗 Empowering',n+' tower'+(n===1?'':'s'));
    rows.push('<div class="dc-rune">'+P(stat(d,'buff'))+'% from its marks, + half '+who+' 🏹 defense damage / 🔁 defense attack speed</div>'); }
  else if(d.buffD>0||d.buffS>0){ const parts=[]; if(cfg.dmg>0&&d.buffD>0) parts.push('+'+P(d.buffD)+'% damage'); if(cfg.cd!==undefined&&d.buffS>0) parts.push('+'+P(d.buffS)+'% speed'); if(parts.length) rows.push('<div class="dc-rune">🗿 Empowered by a Rune Totem: '+parts.join(', ')+'</div>'); }
  // what E and X do here, and what they cost — the numbers the player asked for
  if(d.hp<d.max){ R('🔧 Repair · E',Math.ceil((d.max-d.hp)/8)+' ◆ mana'); }
  if(d.lvl<MAXLVL){ const l0=d.lvl; d.lvl=l0+1; const nd=cfg.dmg!==undefined?stat(d,'dmg'):null, nr=cfg.range?Math.round(stat(d,'range')*10)/10:null, na=cfg.arcs?arcOf(d):null; d.lvl=l0;
    const gains=[]; if(nd!==null) gains.push('dmg '+nd); if(nr!==null) gains.push((cfg.arc===360?'radius ':'range ')+nr); if(na!==null&&na!==arcOf(d)) gains.push(na+'°');   /* build 177: the cone stops at 40° after Mark V -- only say it when it grows */ if(cfg.thorns||cfg.regrow) gains.push('hp '+Math.round(cfg.hp*(1+.4*l0))); if(cfg.buff){ d.lvl=l0+1; gains.push('auras +'+P(stat(d,'buffD'))+'% / +'+P(stat(d,'buffS'))+'%'); d.lvl=l0; }   /* build 178: a totem's next mark, +5% to each aura */
    R((d.hp<d.max?'⬆ Upgrade (after repair)':'⬆ Upgrade · E'),upCost(d)+' ◆ mana → Mk '+MARK[l0+1]+chevHtml(l0+1)+(gains.length?' ('+gains.join(', ')+')':'')); }
  else R('⬆ Upgrade','Mark '+MARK[MAXLVL]+' — the top mark');
  R('✖ Sell · X','+'+Math.round(d.spent*.7)+' ◆ mana');
  R('','<span class="dc-note">you have '+Math.floor(S.mana)+' ◆</span>');
  const key=d.kind+d.lvl+'|'+Math.ceil(d.hp)+'|'+rows.join(''); if(key===dcKey) return; dcKey=key;
  dcEl.innerHTML='<div class="dc-n">'+cfg.ic+' '+cfg.name+' · Mark '+MARK[d.lvl]+chevHtml(d.lvl)+'</div>'+rows.join(''); dcEl.classList.add('show'); }
{ const prevU=Meta.update; Meta.update=dt=>{ prevU(dt); visualsUpdate(dt); }; const prevH=Meta.hud; Meta.hud=()=>{ prevH(); statsUpdate(); defCard(); }; }
window.__feel={defcard:()=>dcEl&&dcEl.classList.contains('show')?dcEl.textContent:null,card:()=>CS.it?{name:CS.it.name,id:CS.it.id,outcome:CS.outcome,canEquip:CS.canEquip,keep:CS.keep||null,shown:card.classList.contains('show'),html:card.innerHTML}:null,stats:heroStats,visuals:()=>({weapon:!!V.weapon,weaponColor:V.weapon?'#'+V.weapon.material.color.getHexString():null,hostIsBone:!!(V.host&&V.host.isBone),charm:!!V.charm,amulet:!!V.amulet}),equipFromCard};
})();
