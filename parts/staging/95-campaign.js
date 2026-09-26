// ===== THE CAMPAIGN: maps in a row. The start screen picks a map (◀ ▶, locked until the one before it is held); holding
// the last wave of a map clears it and offers NEXT MAP on the tally and on the end screen. The map is built when the page
// loads, so moving on is a reload with ?map=N (other query flags kept).
(function(){
const cleared=()=>{ try{ return Math.max(0,Math.min(MAPS.length,parseInt(localStorage.getItem('ddMapsCleared'))||0)); }catch(e){ return 0; } };
function go(i){ i=Math.max(0,Math.min(i,MAPS.length-1,cleared())); try{ localStorage.setItem('ddMap',String(i)); }catch(e){} const q=new URLSearchParams(location.search); q.set('map',String(i)); location.href=location.pathname+'?'+q.toString(); }
function next(){ if(MAPI+1<MAPS.length) go(MAPI+1); }
function mapLine(){ const el=$('mapline'); if(!el) return; const c=cleared(); const m=MAP; el.innerHTML='<button id="mapprev" title="previous map"'+(MAPI>0?'':' disabled')+'>◀</button><span>MAP '+(MAPI+1)+' OF '+MAPS.length+' · '+m.name+(c>MAPI?' ✓':'')+'<small>'+m.sub+(MAPI+1<MAPS.length&&c<=MAPI?' · hold all '+m.waves+' waves to unlock map '+(MAPI+2):'')+'</small></span><button id="mapnext" title="next map"'+(MAPI+1<MAPS.length&&c>MAPI?'':' disabled')+'>▶</button>';
  $('mapprev').onclick=()=>go(MAPI-1); $('mapnext').onclick=()=>go(MAPI+1); }
mapLine();
// the hero pick, under the map line
function heroLine(){ let el=$('heroline'); if(!el){ el=document.createElement('div'); el.id='heroline'; el.className='herorow'; $('mapline').insertAdjacentElement('afterend',el); } const H=HEROES, cur=heroPick.id;
  // a card per hero -- its portrait (hero-<id>.png, rendered from the hero's own model), name, and the picked one's line -- click to pick
  const lockedOf=h=>window.__heroes&&window.__heroes.locked(h.id);
  el.innerHTML='<div class="hlab">HERO</div>'+H.map(h=>{ const lk=lockedOf(h); return '<button class="hcard'+(h.id===cur?' sel':'')+(lk?' locked':'')+'" data-hero="'+h.id+'" title="'+(lk?'Hold your first hall to unlock':String(h.sub).replace(/"/g,'&quot;'))+'"><img src="'+ASSET('hero-'+h.id+'.png')+'" alt="'+h.name+'">'+(lk?'<span class="lk">🔒</span>':'')+'<span class="hn">'+h.name+'</span><span class="hs">'+(lk?'hold your first hall to unlock':h.sub)+'</span></button>'; }).join('');
  el.querySelectorAll('.hcard').forEach(b=>{ b.onclick=()=>{ const h=H.find(x=>x.id===b.dataset.hero); if(!h) return; if(lockedOf(h)){ toast('Hold your first hall to unlock the '+h.name); return; } if(h.id!==heroPick.id){ installHero(h); heroLine(); } }; }); }
heroLine();
// testing shortcuts, on the start screen: unlock every map, magnet mana from anywhere, a purse of gold
const TEST={autoMana:false}; try{ TEST.autoMana=localStorage.getItem('ddAutoMana')==='on'; }catch(e){} window.__autoMana=TEST.autoMana;
function testLine(){ let el=$('testline'); if(!el){ el=document.createElement('p'); el.id='testline'; el.className='mapline'; el.style.fontSize='12px'; el.style.letterSpacing='1px'; el.style.color='#bfae90'; el.style.gap='8px'; const fold=$('howto'); if(fold) fold.appendChild(el); else $('heroline').insertAdjacentElement('afterend',el); }   /* the testing line lives in the folded section since build 133: testers know where it is, a new player never sees it */
  el.innerHTML='🧪 testing: <button data-t="maps">'+(cleared()>=MAPS.length?'all maps unlocked ✓':'unlock all maps')+'</button><button data-t="mana">auto-mana: '+(TEST.autoMana?'ON':'off')+'</button><button data-t="gold">+1000 gold</button><button data-t="guide" title="show the map-one training guide again from step one">🎓 reset guide</button>';
  el.querySelectorAll('button').forEach(b=>{ b.style.width='auto'; b.style.height='30px'; b.style.fontSize='12px'; b.style.padding='0 10px'; b.onclick=()=>{ const t=b.dataset.t; if(t==='maps'){ try{ localStorage.setItem('ddMapsCleared',String(MAPS.length)); }catch(e){} mapLine(); } else if(t==='mana'){ TEST.autoMana=!TEST.autoMana; window.__autoMana=TEST.autoMana; try{ localStorage.setItem('ddAutoMana',TEST.autoMana?'on':'off'); }catch(e){} } else if(t==='gold'){ Meta.addGold(1000,'refund'); } else if(t==='guide'){ if(window.__trainer){ window.__trainer.reset(); toast('Training guide reset — it starts again on map one'); } } else if(t==='reload'){ freshReload(); return; } else if(t==='wipe'){ if(TEST.wipeArm&&Date.now()-TEST.wipeArm<5000){ wipeSaves(); freshReload(); return; } TEST.wipeArm=Date.now(); b.textContent='wipe saves — click again to confirm'; return; } testLine(); }; }); }
// the two buttons every device needs in plain sight (they were in the testing line until build 136 folded it away):
// a fresh reload past any cached copy, and the wipe of every save -- on a small line of their own above the build line
function maintLine(){ let el=$('maintline'); if(!el){ el=document.createElement('p'); el.id='maintline'; el.className='mapline'; el.style.fontSize='12px'; el.style.letterSpacing='1px'; el.style.color='#bfae90'; el.style.gap='8px'; el.style.margin='14px 0 0'; const bl=$('buildline'); if(bl) bl.insertAdjacentElement('beforebegin',el); else $('start').appendChild(el); }
  el.innerHTML='<button data-t="reload" title="reload the page past any cached copy (saves kept)">↻ update / fresh reload</button><button data-t="wipe" title="forget gear, gold, skills, hero and map progress, then reload fresh">wipe saves</button>';
  el.querySelectorAll('button').forEach(b=>{ b.style.width='auto'; b.style.height='30px'; b.style.fontSize='12px'; b.style.padding='0 10px'; b.onclick=()=>{ const t=b.dataset.t; if(t==='reload'){ freshReload(); return; } if(t==='wipe'){ if(TEST.wipeArm&&Date.now()-TEST.wipeArm<5000){ wipeSaves(); freshReload(); return; } TEST.wipeArm=Date.now(); b.textContent='wipe saves — click again to confirm'; return; } }; }); }
// a plain reload (the browser re-checks the page with the host; model files carry their own content stamps, so they are
// never stale); the page's own URL is left alone — a host may sign it. The wipe forgets every dd* key first
function freshReload(){ location.reload(); }
function wipeSaves(){ try{ Object.keys(localStorage).filter(k=>/^dd/.test(k)).forEach(k=>localStorage.removeItem(k)); }catch(e){} }
window.__fresh={reload:freshReload,wipe:wipeSaves};
testLine(); maintLine();
// the end screen for a held map
const winProc=winMap; winMap=function(){ winProc(); $('deadh1').textContent='HALL HELD'; $('deadh2').textContent=MAP.name+' CLEARED · ALL '+MAP.waves+' WAVES HELD'; $('deadp').textContent=MAPI+1<MAPS.length?'The horde broke. Your gear, gold and skills come with you to the next map.':'That was the last map for now — the horde will be back with more halls.'; $('nextmapbtn').style.display=MAPI+1<MAPS.length?'':'none'; $('againbtn').textContent='↻ REPLAY THIS MAP'; };
$('nextmapbtn').addEventListener('click',next);
window.__campaign={index:MAPI,cleared,next,go,maps:()=>MAPS.map(m=>({id:m.id,name:m.name,waves:m.waves})),line:()=>$('mapline').textContent,test:()=>({autoMana:TEST.autoMana,line:$('testline').textContent}),unlockAll:()=>{ try{ localStorage.setItem('ddMapsCleared',String(MAPS.length)); }catch(e){} mapLine(); testLine(); }};
})();
