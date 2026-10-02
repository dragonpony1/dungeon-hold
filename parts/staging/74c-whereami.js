// ===== "YOU ARE HERE" IN THE DEV PANEL (build 457). Matt: "can you move the heart to where I am standing". The dev panel (F9) shows, live, the square the hero stands on in the map's own numbers (the ones its
// build is written in -- the Drawbridge's north padding taken off), and how high he is, so "put it where I'm standing" is two numbers read out. Test hook: window.__whereami.
(function(){
'use strict';
const P=(MAP&&MAP.padN)|0;
const where=()=>({ x:wc(hero.x), z:wcz(hero.z)-P, y:+(hero.y||0).toFixed(1), map:MAP&&MAP.name });
setInterval(()=>{ const p=document.getElementById('devpanel'); if(!p) return; let sec=document.getElementById('dp-where');
  if(!sec){ sec=document.createElement('div'); sec.className='sect'; sec.id='dp-where'; sec.innerHTML='<label>📍 you are here</label><div class="row"><b id="dp-where-t" style="font:700 15px monospace;color:#ffd27a"></b></div>'; p.insertBefore(sec,p.firstChild.nextSibling||null); }
  const w=where(), t=document.getElementById('dp-where-t'), s='square '+w.x+', '+w.z+' · '+w.y+' up'; if(t&&t.textContent!==s) t.textContent=s; },300);
window.__whereami={ where };
})();
