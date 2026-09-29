// ===== THE TAVERN IN PICTURES, AND THE FORGE ON THE TAVERN CARD (build 292). Matt, on the tavern: "we could simplfy this page with pictures i bet", then on the mockup: "yes that tavern page is
// getting closer to what i want ... the whole idea is to find a piece of gear you love then max it out with gold or points or mana or whatever", then "go, put the forge on the tavern card".
// The forge (90-forge.js: every piece has upgrade points by rarity, each bought with gold into a stat you pick) was only on the Tab character sheet. Now, in the tavern (20-tavern.js):
//   * SKILLS are tiles: the skill's picture, the big number it gives you, its pips, a + (the words are on hover / long-press).
//   * a GEAR CARD shows its stats as icon chips (the proc'd stat glowing gold), its set as dots in the set's colour (a pink dot is a worn named mythic filling a slot, 92-sets.js counts()), a named mythic as
//     "✦ any set", and a gold bar for how far it is upgraded (anything else on the stat line -- a pet's power -- stays as small text).
//   * TAP a piece you own (worn or in the bag) and the panel below is its FORGE: the bar, then a tile per stat with +1 and +5 (gold per point on the button), straight into Meta.forge.upgrade.
// Only the tavern's look changes; every rule stays in Meta / Meta.forge. Test hook: window.__tavpics.
(function(){
if(typeof tvCard!=='function'||typeof tvRenderSkills!=='function') return;
const SK_IC={blade:'⚔️',vigor:'❤️',fleet:'👟',overseer:'🏹',loader:'🔁',mason:'🧱',wideshot:'💥',manawell:'🔷'};
const ST_IC={dmg:'⚔️',spd:'⚡',hp:'❤️',def:'🛡️',regen:'💚',tow:'🏹',trate:'🔁',tarea:'🎯',mana:'🔷',move:'👟',fdmg:'🐾⚔️',frate:'🐾⚡',fproj:'🐾🔹'};
const F=()=>Meta.forge;
const ic=k=>ST_IC[k]||'✦';
const val=(k,v)=>{ const f=F(); return f&&f.inc[k]!==undefined?f.fmt(k,Math.round(v*100)/100):(STATL[k]?STATL[k](v):String(v)); };
const words=k=>{ const f=F(); return f?String(f.label(k)).replace(/^\S+\s/,''):k; };
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
{ const st=document.createElement('style'); st.textContent=
 '.tvp-chips{display:flex;flex-wrap:wrap;gap:3px;margin-top:4px}'+
 '.tvp-c{background:#120c1a;border:1px solid #4a3a54;border-radius:10px;padding:0 6px;font:bold 12px/18px system-ui,sans-serif;color:#f0e0c8;white-space:nowrap}'+
 '.tvp-c.proc{border-color:#ffd24a;color:#ffd24a;box-shadow:0 0 5px #ffb02e88}.tvp-c.wild{border-color:#e060d0;color:#ffa0f0}'+
 '.tvp-set{display:flex;gap:3px;align-items:center;margin-top:4px;font-size:12px;line-height:14px}.tvp-set b{width:9px;height:9px;border-radius:50%;border:2px solid var(--c);box-sizing:content-box}'+
 '.tvp-set b.on{background:var(--c)}.tvp-set b.wild{background:#e060d0;border-color:#ffa0f0}'+
 '.tvp-up{display:flex;align-items:center;gap:4px;margin-top:5px;font:bold 11px system-ui,sans-serif;color:#bfae90}.tvp-up .bar{flex:1;height:5px;background:#120c1a;border-radius:3px;overflow:hidden;border:1px solid #3a2a44}'+
 '.tvp-up .bar i{display:block;height:100%;background:linear-gradient(90deg,#b8862a,#ffd060)}.tvp-up.max{color:#ffd060}'+
 '.tvp-x{font-size:11px;color:#bfae90;margin-top:3px;line-height:1.3}'+
 '.tv-detail .dl{gap:4px}.tv-detail .dl .tvp-c{font-size:13px;line-height:20px}.tv-detail .dl .tvp-c span{font-size:12px;margin-left:3px}'+
 '#tv-skills .tv-skg{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:8px}'+
 '#tv-skills .tv-skg .tv-sk{position:relative;display:flex;flex-direction:column;align-items:center;text-align:center;margin:0;padding:10px 6px 8px;gap:0}'+
 '#tv-skills .tv-sk.on{border-color:#c9a040}#tv-skills .tv-sk .sic{font-size:34px;line-height:42px}'+
 '#tv-skills .tv-sk .cv{font:bold 22px/26px Georgia,serif;color:#ffd060}#tv-skills .tv-sk .cv.z{color:#5a4d62}'+
 '#tv-skills .tv-sk .nm{font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#c9b8a0;font-weight:bold}#tv-skills .tv-sk .wh{font-size:11px;color:#8f8470}'+
 '#tv-skills .tv-sk .tv-pips{margin-top:5px}#tv-skills .tv-sk .tv-pips i{width:9px;height:9px}'+
 '#tv-skills .tv-sk .top{display:flex;align-items:center;justify-content:space-between;width:100%;padding:0 2px 0 6px;box-sizing:border-box}'+
 '.tv-detail.tvf-on{max-height:78%}@media (min-width:701px){.tv-detail.tvf-on{width:540px}.tv-detail.tvf-on .tvf-grid{grid-template-columns:repeat(4,1fr)}}.tvf-t .b .tv-btn:first-child{flex:2}'+
 '.tvf{margin:6px 0 10px;padding:8px;border:1px solid #6b5a3c;border-radius:8px;background:#120c1a99}'+
 '.tvf-top{display:flex;align-items:center;gap:6px;font:bold 12px system-ui,sans-serif;color:#ffd060}.tvf-top .ham{font-size:18px}.tvf-top .bar{flex:1;height:10px;background:#08070a;border:1px solid #3a2a44;border-radius:5px;overflow:hidden}'+
 '.tvf-top .bar i{display:block;height:100%;background:linear-gradient(90deg,#6a2e10,#ffb040)}.tvf-top.max .bar i{background:linear-gradient(90deg,#b8862a,#ffd060)}'+
 '.tvf-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(118px,1fr));gap:6px;margin-top:8px}'+
 '.tvf-t{border:2px solid #4a3a54;border-radius:8px;padding:6px 4px;text-align:center;background:linear-gradient(#2a1f33,#1c1424)}.tvf-t.on{border-color:#c9a040}'+
 '.tvf-t .i{font-size:24px;line-height:28px}.tvf-t .v{font:bold 17px/22px Georgia,serif;color:#fff}.tvf-t .v.z{color:#6a5d72}.tvf-t .p{font:11px system-ui,sans-serif;color:#8f8470}'+
 '.tvf-t .b{display:flex;gap:4px;margin-top:5px}.tvf-t .b .tv-btn{flex:1;min-height:40px;padding:2px 4px;font-size:12px;letter-spacing:0}.tvf-t .lk{font-size:16px;line-height:40px;margin-top:5px;color:#8f8470}';
  document.head.appendChild(st); }
// ---- a gear card's stat line, in pictures ----
function wornWild(){ return SLOTS.reduce((a,s)=>a+(gear[s]&&gear[s].named?1:0),0); }
function setDots(it){ const S=Meta.sets; const n=S&&S.setOf(it); if(!n) return ''; const SET=S.SETS[n]||{}; const k=S.counts()[n]|0, wild=k?Math.min(k,wornWild()):0, real=Math.min(5,k-wild); let d='';
  for(let i=0;i<5;i++) d+='<b class="'+(i<real?'on':i<real+wild?'wild':'')+'"></b>';
  return '<div class="tvp-set" style="--c:'+(SET.col||'#58c050')+'" title="'+esc(n.replace('of the ','')+' set: '+k+' of 5 worn'+(wild&&k?' (a pink dot is your named mythic filling a slot)':''))+'">'+(SET.ic||'')+' '+d+'</div>'; }
function upBar(it){ const f=F(); if(!f||!it.stats) return ''; const u=f.used(it), m=f.max(it), full=u>=m; return '<div class="tvp-up'+(full?' max':'')+'" title="Upgraded '+u+' of '+m+' (tap it to upgrade with gold)"><span>🔨</span><span class="bar"><i style="width:'+Math.round(100*u/Math.max(1,m))+'%"></i></span><span>'+(full?'★':u+'/'+m)+'</span></div>'; }
function chips(it){ if(!it||!it.stats) return ''; const prim=it.procd?(it.primary||Object.keys(it.stats)[0]):null; let h='';
  if(it.procd) h+='<span class="tvp-c proc" title="Proc\'d gear: its main stat rolled high">✦ PROC\'D</span>';
  for(const k of Object.keys(it.stats)) h+='<span class="tvp-c'+(k===prim?' proc':'')+'" title="'+esc(words(k))+'">'+ic(k)+' '+esc(val(k,it.stats[k]))+'</span>';
  if(it.named) h+='<span class="tvp-c wild" title="A named mythic counts as a piece of every set you wear">✦ any set</span>';
  return '<div class="tvp-chips">'+h+'</div>'; }
// whatever else the stat line says that the pictures above do not (a pet's power, anything added later) stays as small text
function leftovers(it){ if(!it||!it.stats) return ''; const known=new Set(); for(const k of Object.keys(it.stats)){ const l=STATL[k]?STATL[k](it.stats[k]):''; if(l){ known.add(l); known.add('✦'+l+'✦'); } }
  known.add("✦PROC'D GEAR✦"); known.add('✦ counts for every set'); const f=F(); if(f) known.add('⬆ '+f.used(it)+'/'+f.max(it));
  const S=Meta.sets, n=S&&S.setOf(it); let setLine=null; if(n){ const SET=S.SETS[n]||{}; setLine=(SET.ic||'')+' '+n.replace('of the ','')+' set'; }
  const rest=String(statStr(it)).split(' · ').filter(p=>p&&!known.has(p)&&!(setLine&&(p===setLine||p.startsWith(setLine+' '))));
  return rest.length?'<div class="tvp-x">'+rest.map(esc).join(' · ')+'</div>':''; }
function picLine(it){ return chips(it)+setDots(it)+leftovers(it)+upBar(it); }
{ const prev=tvCard; tvCard=function(it,from,extra){ const h=prev(it,from,extra); if(!it||!it.stats) return h; return h.replace(/<div class="st">[\s\S]*?<\/div>/,()=>'<div class="st">'+picLine(it)+'</div>'); }; }
// ---- the detail panel: the compare line in pictures, and the FORGE for a piece you own ----
tvDeltas=function(it){ const eq=gear[it.slot]; const keys=Object.keys(it.stats); const vs=eq&&eq.id!==it.id; if(vs) for(const k in eq.stats) if(!keys.includes(k)) keys.push(k); const prim=it.procd?(it.primary||Object.keys(it.stats)[0]):null;
  return keys.map(k=>{ const v=it.stats[k]||0, e=vs?(eq.stats[k]||0):0, d=Math.round((v-e)*10)/10; const dl=!vs?'':d>0?'<span class="up">▲'+d+'</span>':d<0?'<span class="dn">▼'+(-d)+'</span>':'<span style="color:#8f8470">=</span>';
    return '<span class="tvp-c'+(k===prim?' proc':'')+'" title="'+esc(words(k))+'">'+ic(k)+' '+esc(val(k,v))+dl+'</span>'; }).join('')+(it.named?'<span class="tvp-c wild">✦ any set</span>':'')+setDots(it); };
function forgeHtml(it){ const f=F(); if(!f||!it||!it.stats) return ''; const u=f.used(it), m=f.max(it), left=f.left(it), cost=f.cost(it), gold=Meta.gold();
  let h='<div class="tvf" id="tv-forge"><div class="tvf-top'+(left?'':' max')+'" title="Upgrades bought for this piece, out of what its rarity allows"><span class="ham">🔨</span><span class="bar"><i style="width:'+Math.round(100*u/Math.max(1,m))+'%"></i></span><span>'+(left?u+'/'+m:'★ MAXED')+'</span></div><div class="tvf-grid">';
  for(const k of f.keys(it)){ const c=f.can(it,k), v=it.stats[k]||0, pts=(it.ups&&it.ups[k])|0; const btn=(n,lab)=>'<button class="tv-btn'+(n===1?' hot':'')+'" data-act="tvup" data-id="'+it.id+'" data-key="'+k+'" data-n="'+n+'"'+(c.ok?'':' disabled')+' title="'+esc(c.ok?words(k)+': +'+n+' upgrade'+(n>1?'s':''):c.why)+'">'+lab+'</button>';
    const blocked=!c.ok&&c.why!=='' && !/gold/.test(c.why);
    h+='<div class="tvf-t'+(pts?' on':'')+'" title="'+esc(words(k))+(pts?' · '+pts+' put in':'')+'"><div class="i">'+ic(k)+'</div><div class="v'+(v?'':' z')+'">'+(v?esc(val(k,v)):'—')+'</div><div class="p">+'+f.inc[k]+' each</div>'+
      (left&&!blocked?'<div class="b">'+btn(1,'+1 · ● '+Meta.fmtG(cost))+btn(5,'+5')+'</div>':'<div class="lk" title="'+esc(c.why)+'">'+(left?'🔒':'★')+'</div>')+'</div>'; }
  return h+'</div>'+(left&&gold<cost?'<div class="dm" style="margin-top:6px;color:#ff9a7a">● '+Meta.fmtG(cost-gold)+' more gold for the next one</div>':'')+'</div>'; }
{ const prev=tvRenderDetail; tvRenderDetail=function(){ prev(); const s=TV.sel, el=$('tv-detail'); if(el) el.classList.remove('tvf-on'); if(!s||!el||el.classList.contains('hide')||(s.from!=='eq'&&s.from!=='bag')) return;
    const it=s.from==='eq'?gear[s.slot]:Meta.bag().find(b=>b.id===s.id); if(!it) return; el.classList.add('tvf-on'); const db=el.querySelector('.db'); if(!db) return; db.insertAdjacentHTML('beforebegin',forgeHtml(it));
    const body=$('tv-body'), card=body&&body.querySelector('.tv-card.sel'); if(card){ const side=innerHeight<=500, cr=card.getBoundingClientRect(), dr=el.getBoundingClientRect(), br=body.getBoundingClientRect(); const top=side?br.bottom:Math.min(dr.top,br.bottom); if(cr.bottom>top-6) body.scrollTop+=cr.bottom-top+10; } }; }
$('tavern').addEventListener('click',e=>{ const t=e.target.closest('[data-act="tvup"]'); if(!t||t.disabled) return; const f=F(); if(!f) return; const D=t.dataset, it=f.find(D.id); if(!it) return;
  const n=f.upgrade(D.id,D.key,+D.n||1); if(n) tvSay('🔨 '+ic(D.key)+' '+val(D.key,it.stats[D.key]||0)+(n>1?'  (×'+n+')':'')); else { const c=f.can(it,D.key); tvSay(c.why?(/gold/.test(c.why)?'● '+c.why:c.why):'cannot upgrade that'); } tvRenderTab(true); });
// ---- skills: tiles ----
tvRenderSkills=function(){ const p=Meta.points(); let h='<div class="tv-sub">✦ SKILLS <span class="tv-n">'+(p?p+' skill point'+(p===1?'':'s')+' to spend':'no points · one per level')+'</span><span class="sp"></span><button class="tv-btn" data-act="respec" id="tv-respec"'+(Meta.canRespec()?'':' disabled')+'>Respec ('+tvG(Meta.respecCost())+' gold)</button></div><div class="tv-skg">';
  for(const s of Meta.SKILLS){ const v=Meta.skill(s.id), pct=Math.round(s.per*v*100); let pips=''; for(let i=0;i<Meta.SKILL_MAX;i++) pips+='<i'+(i<v?' class="on"':'')+'></i>';
    const plus='<button class="tv-btn tv-plus" data-act="spend" data-id="'+s.id+'"'+(p>0&&v<Meta.SKILL_MAX?'':' disabled')+' title="Spend a point">+</button>';
    h+='<div class="tv-sk'+(v?' on':'')+'" id="tv-sk-'+s.id+'" title="'+esc(s.what+' · +'+Math.round(s.per*100)+'% per point'+(v?' · now '+Meta.skillValue(s.id):''))+'"><div class="top"><span class="sic">'+(SK_IC[s.id]||'✦')+'</span>'+plus+'</div><div class="cv'+(v?'':' z')+'">+'+pct+'%</div><div class="nm">'+s.name+'</div><div class="wh">+'+Math.round(s.per*100)+'% a point</div><div class="tv-pips">'+pips+'</div></div>'; }
  $('tv-skills').innerHTML=h+'</div>'; };
window.__tavpics={chips,setDots,upBar,forgeHtml,leftovers,SK_IC,ST_IC};
})();
