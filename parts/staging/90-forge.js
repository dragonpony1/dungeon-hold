// ===== THE FORGE: put gold into the gear you wear, Dungeon Defenders style. Every item takes a number of upgrade points
// set by its rarity (Common 50 … Legendary 200); each point goes into a stat you pick for that item — hero stats on
// weapons, armor and amulets, defense stats on charms (and a little on everything), pet stats on familiars — and costs
// gold that climbs slowly with the points already in the item. Bought at the anvil in the tavern, or from the character
// sheet (Tab): tap a slot, pick a stat, press +.
(function(){
const UP_MAX=[50,75,100,150,200,260];                                    // upgrade points by rarity
const UPINC={dmg:.5,spd:.5,hp:2,def:.2,regen:.05,tow:.5,trate:.4,tarea:.4,mana:.5,move:.2,fdmg:.5,frate:.5,fproj:1,wproj:1};   // what one point adds
const UPCAP={def:60,move:50,spd:150,fproj:[0,1,1,2,3,3],wproj:[1,1,2,3,4,4]};             // total-value caps; fproj = points allowed by rarity
const UPKEYS={weapon:['dmg','spd','tow','trate','wproj'],armor:['hp','def','regen','tow'],charm:['tow','trate','tarea','mana'],amulet:['hp','regen','def','spd','move'],familiar:['fdmg','frate','fproj','tow']};
const UPLBL={dmg:'⚔ Hero damage',spd:'⚡ Swing speed',hp:'❤ Max health',def:'🛡 Armor',regen:'✚ Regen',tow:'🏹 Defense damage',trate:'🔁 Defense attack speed',tarea:'◎ Defense range & area',mana:'◆ Mana from orbs',move:'👟 Move speed',fdmg:'✨ Pet damage',frate:'✨ Pet attack speed',fproj:'✨ Pet projectiles',wproj:'🏹 Shots'};
const UPFMT={dmg:v=>'+'+v,spd:v=>'+'+v+'%',hp:v=>'+'+v,def:v=>'+'+v+'%',regen:v=>'+'+v+'/s',tow:v=>'+'+v+'%',trate:v=>'+'+v+'%',tarea:v=>'+'+v+'%',mana:v=>'+'+v+'%',move:v=>'+'+v+'%',fdmg:v=>'+'+v,frate:v=>'+'+v+'%',fproj:v=>'+'+v,wproj:v=>'+'+v};
function upMax(it){ if(it&&it.named==='trimaw') return 400; /* Matt: "give it high upgrade cap like 400" -- the survival-wave-50 hydra (85-familiars.js) */ return UP_MAX[clamp(it.rarity|0,0,5)]; }
function upUsed(it){ return it.up|0; }
function upLeft(it){ return Math.max(0,upMax(it)-upUsed(it)); }
// build 411 (Matt: "OJ says it's not spending his gold, he's getting NaN by the cost"): a piece whose saved tier is not a number (a word, or missing with an odd level -- pieces back from the hideout's forge can be) priced
// at NaN, and gold never moves by NaN (10-meta.js addGold) -- so the upgrade went through FREE. The tier is now read as a number or worked out from the level, and a price that still is not a number is refused.
const tierNum=it=>{ const t=+it.tier; if(Number.isFinite(t)&&t>=1) return t; const L=+it.lvl; return tierOf(Number.isFinite(L)&&L>0?L:1); };
function upCost(it){ return Math.max(1,Math.round((3+2*clamp(+it.rarity||0,0,5))*(1+.06*upUsed(it))*(1+.1*(tierNum(it)-1)))); }
function upCostK(it,k){ if(k==='wproj') return wprojCost(it); const c=upCost(it); if(k!=='fproj') return c; const n=((it.ups&&it.ups.fproj)|0)+1; return c*(FPROJ_COST_K[Math.min(n,5)]||1); }   /* build 410 */
function upKeys(it){ const ks=UPKEYS[it.slot]||[]; return (it.slot==='weapon'&&!rangedHero())?ks.filter(k=>k!=='wproj'):ks; }   /* build 511 prep: SHOTS only for a ranged hero */
// build 511 prep (Matt: "on their card let the player pay gold to upgrade their shot count. It should cost a decent amount per additional count"): SHOTS ('wproj') on a WEAPON -- each point one more
// projectile per attack (81-rangedshots.js: a volley fanned about the aim). Offered on the card (the bag's forge and the Tab sheet) whenever the hero who'd hold it is the Witch, the Fighter or the Ranger;
// never for the Knight (a point already bought stays on the piece). Capped by rarity (UPCAP: Common/Uncommon 1, Rare 2, Epic 3, Legendary/Mythic 4 -- five shots), Subterfuge at 2 (its five-arrow wedge is
// its volley: 81-rangedshots.js wedgeN). Shot points are bought with gold alone: they are not upgrade points (a maxed piece still takes them, and they leave its allowance alone).
// The price climbs steeply with each shot (WPROJ_COST_K, by the shot being bought) on the piece's going rate before any points -- upCost's rarity and tier part, not the climb with points already in it,
// so a well-forged weapon isn't charged ten times more for the same shot -- rounded to 50 and never under WPROJ_MIN: a Legendary tier 4 is 2,500 / 6,450 / 14,300 / 31,450 gold.
const WPROJ_COST_K=[0,175,450,1000,2200], WPROJ_MIN=1000, SUB_CAP=2;
const RANGED_HEROES={witch:1,fighter:1,troll:1};
function rangedHero(){ let h='knight'; try{ h=heroPick.id; }catch(e){ try{ h=window.__heroes.pick(); }catch(e2){} } return !!RANGED_HEROES[h]; }
const isSubterfuge=it=>{ if(!it||!it.named) return false; const M=window.__mythic; return (M&&M.id?M.id(it):String(it.named))==='subterfuge'; };
function wprojBase(it){ return (3+2*clamp(+it.rarity||0,0,5))*(1+.1*(tierNum(it)-1)); }
function wprojCost(it,n){ n=n||(((it.ups&&it.ups.wproj)|0)+1); const k=WPROJ_COST_K[clamp(n,1,4)]; return Math.max(WPROJ_MIN,Math.round(wprojBase(it)*k/50)*50); }
function wprojTable(it){ const out=[]; for(let n=1;n<=capOf(it,'wproj');n++) out.push(wprojCost(it,n)); return out; }
// build 410 (Matt: "we should allow a few mythic set pets to get up to 5 projectiles, more and more expenditure"): a MYTHIC pet that belongs to a SET takes up to 5 projectile points (every other pet keeps the
// rarity table above), and those last ones cost more and more: the 4th x5 the going rate, the 5th x12 (the 1st-3rd as ever).
const FPROJ_SET_CAP=5, FPROJ_COST_K=[1,1,1,1,5,12];   /* by the projectile point being bought (1st..5th) */
const setPet=it=>!!(it&&it.slot==='familiar'&&(it.rarity|0)>=5&&Meta.sets&&Meta.sets.setOf&&Meta.sets.setOf(it));
function capOf(it,k){ if(k==='fproj'&&setPet(it)) return FPROJ_SET_CAP; if(k==='wproj'&&isSubterfuge(it)) return SUB_CAP; const c=UPCAP[k]; if(Array.isArray(c)) return c[clamp(it.rarity|0,0,5)]; return c===undefined?Infinity:c; }
function canUp(it,k){ if(!it) return {ok:false,why:'nothing there'}; if(!upKeys(it).includes(k)) return {ok:false,why:'not on this item'}; if(k!=='wproj'&&upLeft(it)<=0) return {ok:false,why:'fully upgraded'};
  if(k==='fproj'){ if(((it.ups&&it.ups.fproj)|0)>=capOf(it,k)) return {ok:false,why:capOf(it,k)?'max projectiles for '+RNAME[it.rarity]+(setPet(it)||(it.rarity|0)<5?'':' (a mythic SET pet takes 5)'):'needs an Uncommon or better pet'}; }
  else if(k==='wproj'){ if(((it.ups&&it.ups.wproj)|0)>=capOf(it,k)){ const R=window.__rshots, sub=isSubterfuge(it); return {ok:false,max:true,why:'🔒 '+(sub&&R?R.wedgeN('subterfuge',1+capOf(it,k)):1+capOf(it,k))+' 🏹 max'+(sub?' (Subterfuge)':' for '+RNAME[it.rarity|0])}; } }   /* Subterfuge counts its wedge's arrows */   /* build 511 prep */
  else if((it.stats[k]||0)+UPINC[k]>capOf(it,k)+1e-9) return {ok:false,why:'at the cap'};
  const c=upCostK(it,k); if(!Number.isFinite(c)||c<1) return {ok:false,why:'no price for this piece'}; if(Meta.gold()<c) return {ok:false,why:'need '+Meta.fmtG(c-Meta.gold())+' more gold',cost:c}; return {ok:true,why:'',cost:c}; }
function findItem(ref){ if(ref&&typeof ref==='object') return ref; for(const s of SLOTS){ if(gear[s]&&gear[s].id===ref) return gear[s]; } if(gear.familiar2&&gear.familiar2.id===ref) return gear.familiar2; /* build 505: the 2nd pet (97h) */ if(gear.weapon2&&gear.weapon2.id===ref) return gear.weapon2; /* build 509 prep: the 2nd weapon (99k-dualwield.js) */ return Meta.bag().find(b=>b.id===ref)||Meta.stock().find(b=>b.id===ref)||null; }
function rescore(it){ let sc=0; for(const k in it.stats) sc+=(it.stats[k]||0)*(STATW[k]||1); it.score=Math.round(sc*10)/10; }
function upgrade(ref,k,n){ const it=findItem(ref); if(!it) return 0; n=Math.max(1,n|0); let done=0;
  while(done<n){ const c=canUp(it,k); if(!c.ok) break; Meta.addGold(-c.cost,'forge'); if(k!=='wproj') it.up=upUsed(it)+1; /* build 511 prep: shots are gold alone, not upgrade points */ it.ups=it.ups||{}; it.ups[k]=(it.ups[k]|0)+1; it.stats[k]=Math.round(((it.stats[k]||0)+UPINC[k])*100)/100; done++; }
  if(done){ rescore(it); applyGear(); saveGear(); Meta.save(); SFX.place(); } return done; }
// items saved before the forge existed, or edited storage: points are whole numbers within the item's allowance
function sane(it){ if(!it||!it.stats) return; it.up=clamp(Math.floor(+it.up||0),0,upMax(it)); const u={}; let sum=0; if(it.ups&&typeof it.ups==='object') for(const k in it.ups){ const v=clamp(Math.floor(+it.ups[k]||0),0,upMax(it)); if(v>0&&UPINC[k]){ u[k]=v; if(k!=='wproj') sum+=v; } } it.ups=u; if(sum>it.up) it.up=Math.min(upMax(it),sum); }
for(const s of SLOTS) if(gear[s]) sane(gear[s]); Meta.bag().forEach(sane); Meta.stock().forEach(sane);
// the stat line everywhere (bag, shop, sheet, toasts) says its upgrades out of the allowance (Common 50 … Legendary 200)
STATL.wproj=v=>'+'+v+' shot'+(v===1?'':'s'); STATW.wproj=10;   /* build 511 prep: a weapon's bought SHOTS */
const statStrForge=statStr; statStr=function(it){ const s=statStrForge(it); return (it&&it.stats)?s+' · ⬆ '+upUsed(it)+'/'+upMax(it):s; };   // every card says how far it can go, even before the first point
const forge={costFor:upCostK,wprojCost,wprojTable,ranged:rangedHero,WPROJ_COST_K,WPROJ_MIN,setPet,max:upMax,used:upUsed,left:upLeft,cost:upCost,keys:upKeys,can:canUp,upgrade,inc:UPINC,cap:capOf,label:k=>UPLBL[k]||k,fmt:(k,v)=>(UPFMT[k]||(x=>x))(v),find:findItem,defStat:(d,k)=>stat(d,k)};
Meta.forge=forge; window.__forge=forge;
})();
