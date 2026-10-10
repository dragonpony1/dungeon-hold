// ===== RECIPES: TORN PAGES and SALVAGE-TO-LEARN (build 604; the forge reads them, hideout build 89). Matt, on the crafting forge: "we have a lot of recipes to get out there if it's just bosses" ->
// "yes build the pages and salvage to learn". The forge makes a set piece only once you KNOW its recipe: 45 of them (nine forge sets x weapon, armor, amulet, familiar, charm).
//  * TORN RECIPE PAGES drop from ordinary mobs, about PAGE_BUDGET a wave (a couple a map run), on the floor like a sludge jar; walk near and it flies to you. Each page is one piece of one of THIS MAP'S
//    sets (HOME -- Matt's table: Throne Room Chaos + Radiance, Cloister Court Shadow + Wind, Feast Hall Fire, Drawbridge Storm + Ice, Deep Prison Void; the Gnome Hall, which had none, Earth), a piece you
//    don't know yet. NEED (3) pages of a piece = its recipe. Every page is banked the moment you take it.
//  * SALVAGE A SET PIECE (the bag over the hideout, 96g) and you learn ITS recipe: the loot that drops feeds the forge.
//  * One time only (my call): what you already own -- worn, in the bag, in the armory -- counts as known, so the forge isn't suddenly locked on a save that has pieces.
//  * Learning one: a gold "RECIPE LEARNED" card with the set's and the piece's pictures, and a chord.
//  * CO-OP: a guest's pages are its own (rolled for it on the host, as jars are: 'pageDrop'), and its book is its own.
// Shared with the hideout: localStorage 'dd_recipes' = { v:1, known:{ "<set tail>|<slot>":time }, pages:{ "<set tail>|<slot>":n }, seeded, seededH }. Test hook: window.__recipes.
(function(){
'use strict';
const TUT=typeof TUTORIAL!=='undefined'&&!!TUTORIAL;
const KEY='dd_recipes', NEED=3, PAGE_BUDGET=.3;
const ALL=['of the Void','of Chaos','of the Earth','of Fire','of Radiance','of the Storm','of Shadow','of Ice','of the Wind'];
const HOME=[['of the Earth'],['of Chaos','of Radiance'],['of Shadow','of the Wind'],['of Fire'],['of the Storm','of Ice'],['of the Void']];
const PIECES=['weapon','armor','amulet','familiar','charm'], PNAME={weapon:'Weapon',armor:'Armor',amulet:'Amulet',familiar:'Familiar',charm:'Charm'}, PIC={weapon:'⚔',armor:'🛡',amulet:'📿',familiar:'🐾',charm:'💍'};
const key=(set,slot)=>set+'|'+slot;
const setInfo=n=>(Meta.sets&&Meta.sets.SETS&&Meta.sets.SETS[n])||{ ic:'✦', col:'#ffd24a' };
const colOf=n=>{ const c=setInfo(n).col; return typeof c==='string'?c:'#ffd24a'; };
const label=k=>{ const [s,p]=k.split('|'); return s.replace(/^of (the )?/,'').replace(/^./,c=>c.toUpperCase())+' '+(PNAME[p]||p); };
function read(){ let b=null; try{ b=JSON.parse(localStorage.getItem(KEY)); }catch(e){} if(!b||typeof b!=='object') b={}; b.v=1; if(!b.known||typeof b.known!=='object') b.known={}; if(!b.pages||typeof b.pages!=='object') b.pages={}; return b; }
function write(b){ try{ localStorage.setItem(KEY,JSON.stringify(b)); }catch(e){} }
const cnt={ dropped:0, taken:0, learned:0, salvLearned:0 };
// ---- the gold card
const card=document.createElement('div'); card.id='recipeCard';
{ const st=document.createElement('style'); st.textContent='#recipeCard{position:fixed;left:50%;top:18%;transform:translate(-50%,-10px) scale(.96);z-index:60;pointer-events:none;opacity:0;transition:opacity .25s,transform .25s;background:linear-gradient(#3a2a0f,#20140a);border:2px solid #ffcf3a;border-radius:14px;box-shadow:0 0 24px #ffcf3a88;padding:10px 22px;text-align:center;font-family:Georgia,serif;color:#fff2c0}#recipeCard.on{opacity:1;transform:translate(-50%,0) scale(1)}#recipeCard .rk{font-size:.8em;letter-spacing:.2em;color:#ffcf3a}#recipeCard .rp{font-size:2em;line-height:1.2}#recipeCard .rn{font-size:1.25em;font-weight:bold}'; document.head.appendChild(st); }
document.body.appendChild(card); let cardT=null;
function showCard(k,how){ const [s,p]=k.split('|'); card.innerHTML='<div class="rk">📖 RECIPE LEARNED</div><div class="rp">'+setInfo(s).ic+' '+(PIC[p]||'✦')+'</div><div class="rn" style="color:'+colOf(s)+'">'+label(k)+'</div><div class="rk">'+(how==='salvage'?'🧪 from salvage':'📜 '+NEED+' pages')+' · forge it at the Blacksmith</div>';
  card.classList.add('on'); clearTimeout(cardT); cardT=setTimeout(()=>card.classList.remove('on'),3200); try{ SFX.loot&&SFX.loot(4); }catch(e){} }
function learn(k,how,quiet){ const b=read(); if(b.known[k]) return false; b.known[k]=Date.now(); delete b.pages[k]; write(b); cnt.learned++; if(how==='salvage') cnt.salvLearned++; if(!quiet) showCard(k,how); return true; }
function addPage(k,x,y,z){ const b=read(); if(b.known[k]) return; const n=(b.pages[k]|0)+1; cnt.taken++;
  if(n>=NEED){ learn(k,'pages'); return; } b.pages[k]=n; write(b); try{ SFX.mana(); }catch(e){} floatText(x,(y||0)+.9,z,'📜 '+label(k)+'  '+n+'/'+NEED,colOf(k.split('|')[0])); }
// which piece a page is for: this map's sets first, a piece you don't know (pages already started weigh more, so recipes finish); then any set; none once every recipe is known
function pickKey(){ const b=read(); const pool=sets=>{ const out=[]; for(const s of sets) for(const p of PIECES){ const k=key(s,p); if(!b.known[k]) for(let i=0;i<1+(b.pages[k]|0);i++) out.push(k); } return out; };
  let P=pool(HOME[MAPI]||ALL); if(!P.length) P=pool(ALL); return P.length?P[Math.floor(Math.random()*P.length)]:null; }
// ---- the page on the floor: a rolled parchment on two dark rods, tied with a ribbon in its set's colour, a glow ring and a thin beam
const PAGES=[]; const HOOK=typeof LOOT_HOOK!=='undefined'?LOOT_HOOK:3.2;
function pageMesh(k){ const c=new THREE.Color(colOf(k.split('|')[0])); const g=new THREE.Group(), item=new THREE.Group(); item.position.y=.5;
  const roll=M(G.cyl(.11,.11,.62,10),mat(0xeedcb0)); roll.rotation.z=PI/2; item.add(roll);
  for(const s of [-1,1]){ const r=M(G.cyl(.05,.05,.12,8),mat(0x4a3320)); r.rotation.z=PI/2; r.position.x=s*.36; item.add(r); }
  const rib=new THREE.Mesh(new THREE.TorusGeometry(.115,.025,6,14),mat(c.getHex(),{emissive:c,emissiveIntensity:.4})); rib.rotation.y=PI/2; item.add(rib);
  outline(item); g.add(item); g.userData.item=item;
  const gl=glow(c.getHex(),1.2,.5); gl.position.y=.5; g.add(gl);
  const ring=new THREE.Mesh(new THREE.RingGeometry(.22,.36,18),new THREE.MeshBasicMaterial({color:c,transparent:true,opacity:.6,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide})); ring.rotation.x=-PI/2; ring.position.y=.05; ring.userData.noOL=true; g.add(ring); g.userData.ring=ring;
  const beam=new THREE.Mesh(new THREE.CylinderGeometry(.06,.16,2.2,10,1,true),new THREE.MeshBasicMaterial({color:c,transparent:true,opacity:.18,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide})); beam.position.y=1.1; beam.userData.noOL=true; g.add(beam);
  return g; }
function spawnPage(k,x,z){ if(!k) return null; const a=Math.random()*TAU, sp=1.2+Math.random(); const p={k,x,y:.6,z,vx:Math.cos(a)*sp,vy:4.4,vz:Math.sin(a)*sp,t:0,mesh:pageMesh(k)}; p.mesh.position.set(x,.6,z); scene.add(p.mesh); PAGES.push(p); cnt.dropped++; return p; }
function take(i){ const p=PAGES[i]; scene.remove(p.mesh); PAGES.splice(i,1); addPage(p.k,p.x,p.y,p.z); }
function updatePages(dt){ for(let i=PAGES.length-1;i>=0;i--){ const p=PAGES[i]; p.t+=dt; const it=p.mesh.userData.item;
    if(hero.dead<=0&&p.t>.45&&(p.landed||p.vy<=.01)){ const hd=Math.hypot(hero.x-p.x,hero.z-p.z), hy=Math.abs(hero.y-p.y);
      if(window.__autoMana||(hd<HOOK&&hy<4)){ const dx=hero.x-p.x, dy=hero.y+.9-p.y, dz=hero.z-p.z, dd=Math.hypot(dx,dy,dz); if(dd<.6){ take(i); continue; }
        const s=Math.min(1,10*dt/dd); p.x+=dx*s; p.y+=dy*s; p.z+=dz*s; p.vx=p.vz=p.vy=0; p.mesh.position.set(p.x,p.y,p.z); it.rotation.y+=dt*6; continue; } }
    p.vy-=14*dt; const nx=p.x+p.vx*dt, nz=p.z+p.vz*dt; if(!solidAt(nx,nz,0,true)){ p.x=nx; p.z=nz; } else { p.vx=-p.vx*.5; p.vz=-p.vz*.5; }
    p.y+=p.vy*dt; const fl=baseFloor(p.x,p.z); if(p.y<fl){ p.y=fl; p.vy=-p.vy*.3; p.vx*=.6; p.vz*=.6; p.landed=true; if(p.vy<.6) p.vy=0; }
    p.mesh.position.set(p.x,p.y,p.z); it.position.y=.5+Math.sin(p.t*3)*.07; it.rotation.y+=dt*1.4; p.mesh.userData.ring.scale.setScalar(1+Math.sin(p.t*4)*.08);
    if(hero.dead<=0&&p.t>.3&&Math.hypot(hero.x-p.x,hero.z-p.z)<1.2&&Math.abs(hero.y-p.y)<1.6) take(i); } }
// pages still on the floor when you move on are banked for you, as jars are
function sweep(){ const n=PAGES.length; for(const p of PAGES.splice(0)){ scene.remove(p.mesh); addPage(p.k,hero.x,hero.y,hero.z); } return n; }
{ const prev=moveOn; moveOn=function(){ try{ if(S.held&&S.phase==='build') sweep(); }catch(e){} return prev.apply(this,arguments); }; }
// ---- the roll: on an ordinary mob's death, the wave's PAGE_BUDGET shared over its roster
let wN=0, wKey=null;
function waveN(){ const k=S.wave+'|'+effWave(); if(k!==wKey){ wKey=k; wN=0; try{ wN=waveComp(effWave()).q.length; }catch(e){ wN=0; } } return wN; }
const BOSSY=k=>!!(MOBS[k]&&(MOBS[k].boss||MOBS[k].siege))||/^(pig|archhag|avery|bullion|cyclops|corruptor|ogre|trollboss)/.test(k);
function chance(kind){ if(BOSSY(kind)) return 0; const n=waveN(); return n>0?Math.min(1,PAGE_BUDGET/n):0; }
function rollPages(e){ if(!e||TUT) return; const N=window.__net, role=N&&N.role?N.role():null; if(role==='guest') return;
  if(Math.random()<chance(e.kind)) spawnPage(pickKey(),e.x,e.z);
  if(role==='host'&&N.peers) N.peers().forEach(id=>{ if(Math.random()<chance(e.kind)) N.send('pageDrop',{x:+(+e.x).toFixed(2),z:+(+e.z).toFixed(2)},id); }); }
{ const prev=rollDrop; rollDrop=function(e){ const out=prev.apply(this,arguments); try{ rollPages(e); }catch(err){} return out; }; }
if(window.__net&&window.__net.onMessage) window.__net.onMessage('pageDrop',d=>{ const N=window.__net; if(!d||!N.role||N.role()!=='guest') return; spawnPage(pickKey(),+d.x||0,+d.z||0); });   // the guest picks from ITS OWN book
{ const prev=updateLoot; updateLoot=function(dt){ prev.apply(this,arguments); try{ updatePages(dt); }catch(err){} }; }
// ---- salvage teaches (96g calls this for every piece it salvages): a set piece of a forge set, not a named one
function salvaged(it){ if(!it||it.named) return null; const s=Meta.sets&&Meta.sets.setOf?Meta.sets.setOf(it):null; if(!s||!ALL.includes(s)||!PIECES.includes(it.slot)) return null; const k=key(s,it.slot); return learn(k,'salvage')?label(k):null; }
// ---- one time: what you own counts as known
function seed(){ const b=read(); if(b.seeded) return 0; let n=0; const items=[];
  try{ for(const s of SLOTS) if(gear[s]) items.push(gear[s]); }catch(e){} try{ if(Meta.allWorn) items.push(...Meta.allWorn()); }catch(e){} try{ items.push(...Meta.bag()); }catch(e){} try{ if(Meta.armory) items.push(...Meta.armory()); }catch(e){}
  for(const it of items){ const s=it&&!it.named&&Meta.sets&&Meta.sets.setOf?Meta.sets.setOf(it):null; if(!s||!ALL.includes(s)||!PIECES.includes(it.slot)) continue; const k=key(s,it.slot); if(!b.known[k]){ b.known[k]=Date.now(); delete b.pages[k]; n++; } }
  b.seeded=Date.now(); write(b); return n; }
if(!TUT) setTimeout(()=>{ try{ seed(); }catch(e){} },1500);
// ---------------------------------------------------------------- build 605: BOSS RECIPES (Matt: "yes do the boss recipes next"). Every boss beaten (the Pig Lords when the last of the three falls):
//  * the FIRST win teaches a recipe from its map's sets (one you don't know);
//  * EVERY win teaches its next MASTERWORK -- the recipe for one of the named mythics it guards (BOSSES[].named, in order), until you know them all -- and drops its TROPHY (banked);
//  * the hideout's forge makes a masterwork from its recipe + 1 of that boss's trophies + Legendary Sludge (a proc makes it Proc'd). Named mythics come from masterworks now, not a random proc.
//  * one time (my call): bosses whose maps you'd already cleared count as beaten once, so an old save isn't behind.
//  * CO-OP: the host tells every guest ('bossBeat') and each learns into its own book.
const BOSSES={
  pigs:{ kinds:['pigflail','pigdagger','pigsling'], name:'the Pig Lords', map:1, sets:['of Chaos','of Radiance'], trophy:"Pig Lord's Tusk", tic:'🦷', named:['rootsplitter','wardens_oath','beast_mode'] },
  archhag:{ kinds:['archhag'], name:'the Archhag', map:2, sets:['of Shadow','of the Wind'], trophy:"Archhag's Heart", tic:'🖤', named:['bramblewhisk','mossheart_aegis','malamute'] },
  bullion:{ kinds:['bullion'], name:'Sir Bullion', map:3, sets:['of Fire'], trophy:"Sir Bullion's Ladle", tic:'🥄', named:['old_lamplight','gloomcap_censer','gabriels_charm'] },
  avery:{ kinds:['avery'], name:'Avery', map:4, sets:['of the Storm','of Ice'], trophy:"Avery's Scale", tic:'🐉', named:['tear_of_the_rootgate','last_lantern','subterfuge'] },
  corruptor:{ kinds:['corruptor'], name:'the Corruptor of Fate', map:5, sets:['of the Void'], trophy:'Shard of Fate', tic:'🔮', named:['voidwoven_mantle','sixseven'] },
  cyclops:{ kinds:['cyclops'], name:'the Cyclops', map:-1, sets:['of the Earth'], trophy:'Cyclops Eye', tic:'👁', named:['hourglass_hollow_sand'] } };
const NAMED_NAME={ rootsplitter:'Rootsplitter', wardens_oath:"The Warden's Oath", beast_mode:'Beast Mode', bramblewhisk:'Bramblewhisk', mossheart_aegis:'Mossheart Aegis', malamute:'Malamute', old_lamplight:'Old Lamplight', gloomcap_censer:'Gloomcap Censer', gabriels_charm:"Gabriel's Charm",
  tear_of_the_rootgate:'Tear of the Rootgate', last_lantern:'The Last Lantern', subterfuge:'Subterfuge', voidwoven_mantle:'Voidwoven Mantle', sixseven:'6/7', hourglass_hollow_sand:'Hourglass of Hollow Sand' };
const bossOf=kind=>{ for(const id in BOSSES) if(BOSSES[id].kinds.includes(kind)) return id; return null; };
const bossCard=document.createElement('div'); bossCard.id='bossRecipeCard';
{ const st=document.createElement('style'); st.textContent='#bossRecipeCard{position:fixed;left:50%;top:14%;transform:translate(-50%,-10px) scale(.96);z-index:61;pointer-events:none;opacity:0;transition:opacity .3s,transform .3s;background:linear-gradient(#3a2a0f,#1a0f06);border:3px solid #ffcf3a;border-radius:16px;box-shadow:0 0 34px #ffcf3aaa;padding:12px 26px;text-align:center;font-family:Georgia,serif;color:#fff2c0;min-width:300px}#bossRecipeCard.on{opacity:1;transform:translate(-50%,0) scale(1)}#bossRecipeCard .bh{font-size:1.3em;letter-spacing:.14em;color:#ffcf3a;margin-bottom:6px}#bossRecipeCard .br{font-size:1.1em;margin:5px 0;padding:4px 10px;border-radius:9px;background:#ffffff0c}#bossRecipeCard .br.mw{background:linear-gradient(90deg,#4a3410,#2a1a08);border:1px solid #ffd27a;color:#ffe08a;font-weight:bold}'; document.head.appendChild(st); }
document.body.appendChild(bossCard); let bossT=null;
function showBossCard(B,rows){ bossCard.innerHTML='<div class="bh">👑 '+B.name.replace(/^the /,'').toUpperCase()+' BEATEN</div>'+rows.map(r=>'<div class="br'+(r.mw?' mw':'')+'">'+r.t+'</div>').join('');
  bossCard.classList.add('on'); clearTimeout(bossT); bossT=setTimeout(()=>bossCard.classList.remove('on'),6000); try{ SFX.fancySynth?SFX.fancySynth(true):SFX.loot&&SFX.loot(4); }catch(e){} }
function beatBoss(id,quiet){ const B=BOSSES[id]; if(!B) return null; const b=read(); b.named=b.named&&typeof b.named==='object'?b.named:{}; b.trophies=b.trophies&&typeof b.trophies==='object'?b.trophies:{}; b.bosses=b.bosses&&typeof b.bosses==='object'?b.bosses:{};
  const first=!(b.bosses[id]>0); b.bosses[id]=(b.bosses[id]|0)+1; b.trophies[id]=(b.trophies[id]|0)+1; const out={ boss:id, first, set:null, named:null };
  if(first){ const pool=[]; for(const st of B.sets) for(const p of PIECES){ const k=key(st,p); if(!b.known[k]) pool.push(k); } if(pool.length){ const k=pool[Math.floor(Math.random()*pool.length)]; b.known[k]=Date.now(); delete b.pages[k]; out.set=k; cnt.learned++; } }
  const nid=B.named.find(n=>!b.named[n]); if(nid){ b.named[nid]=Date.now(); out.named=nid; }
  write(b); cnt.bosses=(cnt.bosses|0)+1;
  if(!quiet){ const rows=[]; if(out.set) rows.push({ t:'📖 Recipe: '+label(out.set) }); if(out.named) rows.push({ mw:true, t:'✦ MASTERWORK: '+NAMED_NAME[out.named] }); rows.push({ t:'<img src="hideout/assets/hideout/items/trophies/'+id+'.webp" alt="'+B.tic+'" style="height:3.4em;vertical-align:middle;margin-right:.3em;filter:drop-shadow(0 0 6px #ffd27a)">+1 '+B.trophy+'  ·  forge it at the Blacksmith' });   /* build 610: the trophy's picture (Matt's models) */ showBossCard(B,rows); }
  return out; }
function bossDied(e){ const id=bossOf(e&&e.kind); if(!id) return; const B=BOSSES[id]; if(B.kinds.length>1&&enemies.some(o=>o!==e&&!o.dead&&B.kinds.includes(o.kind))) return;   // the trio counts when the last one falls
  const N=window.__net, role=N&&N.role?N.role():null; if(role==='guest') return; beatBoss(id); if(role==='host'&&N.peers) N.peers().forEach(p=>N.send('bossBeat',{id},p)); }
{ const prev=rollDrop; rollDrop=function(e){ const out=prev.apply(this,arguments); try{ if(!TUT) bossDied(e); }catch(err){} return out; }; }
if(window.__net&&window.__net.onMessage) window.__net.onMessage('bossBeat',d=>{ const N=window.__net; if(!d||!N.role||N.role()!=='guest'||!BOSSES[d.id]) return; beatBoss(d.id); });
// one time: a boss whose map you'd already cleared counts as beaten once (its first set recipe, its first masterwork, one trophy)
function seedBosses(){ const b=read(); if(b.seededBoss) return []; b.seededBoss=Date.now(); write(b); let cleared=0; try{ cleared=parseInt(localStorage.getItem('ddMapsCleared'))||0; }catch(e){}
  const done=[]; for(const id in BOSSES){ const B=BOSSES[id]; if(B.map>=0&&B.map<cleared&&!(read().bosses||{})[id]){ beatBoss(id,true); done.push(id); } } return done; }
if(!TUT) setTimeout(()=>{ try{ seedBosses(); }catch(e){} },1600);
window.__recipes={ BOSSES, NAMED_NAME, beatBoss, bossOf, seedBosses, KEY, NEED, HOME, ALL, PIECES, read, learn, addPage, pickKey, spawn:(k,x,z)=>spawnPage(k||pickKey(),x,z), list:()=>PAGES.map(p=>({k:p.k,x:+p.x.toFixed(2),z:+p.z.toFixed(2)})), chance, salvaged, seed, label, sweep, info:()=>Object.assign({ floor:PAGES.length },cnt) };
})();
