// ===== THE CRAFTING TUTORIAL, the hall's half (build 611; the hideout's half is hideout build 99). Matt: "I think we need a very simple tutorial for how this system works, like start in the first map.
// with very easy to follow clicks, like we did for 67 flowers" -> "yes build it".
// Once, solo, on the Gnome Hall, right after the training guide (96-trainer.js) is finished: a picture banner says the one thing to do and a bouncing hand points at it.
//   1  a torn recipe page drops beside you (guaranteed): walk over it
//   2  two more drop, one at the end of each of the next waves (guaranteed): the third teaches the recipe (the gold RECIPE LEARNED card)
//   3  the hand points at the hideout portal: go through
//   4+ the hideout takes over (the Blacksmith, the piece, the set, Craft -- the first craft always PROCs -- the recipe book, then a boss -> trophy -> masterwork card)
// The tutorial's piece is the first Gnome Hall (Earth) recipe you don't know. State: localStorage 'dd_craft_tut' = { s, key }; s 99 = done. Skip on every banner. Test hook: window.__craftTut.
(function(){
'use strict';
if(TUTORIAL||(SILENT&&!Q.has('crafttut'))) return;   // tests run ?silent: only a test that asks for it (?crafttut) gets the tutorial
const KEY='dd_craft_tut', PIECES=['armor','amulet','charm','weapon','familiar'], SET='of the Earth';
let st=(()=>{ try{ const o=JSON.parse(localStorage.getItem(KEY)); if(o&&typeof o==='object') return o; }catch(e){} return { s:0 }; })();
const save=()=>{ try{ localStorage.setItem(KEY,JSON.stringify(st)); }catch(e){} };
const R=()=>window.__recipes, solo=()=>{ const n=window.__net; return !(n&&n.role&&n.role()); };
// ---- the banner and the hand
{ const css=document.createElement('style'); css.textContent='#ctBan{position:fixed;left:50%;top:12%;transform:translateX(-50%);z-index:58;display:none;align-items:center;gap:14px;background:linear-gradient(#2e1d0c,#160c05);border:3px solid #c9962f;border-radius:16px;box-shadow:0 8px 30px #000c,0 0 18px #ffb00055;padding:10px 20px 10px 14px;font:16px Georgia,serif;color:#f3e6cf;max-width:min(640px,92vw)}#ctBan.on{display:flex;animation:ctIn .35s cubic-bezier(.2,1.4,.4,1)}@keyframes ctIn{from{opacity:0;transform:translate(-50%,-14px) scale(.9)}}#ctBan .pic{font-size:34px;white-space:nowrap}#ctBan .w{font-size:17px;line-height:1.25}#ctBan .w b{color:#ffd27a}#ctBan .sk{margin-left:8px;background:none;border:1px solid #8a6a3a;border-radius:8px;color:#c9a46a;font:12px Georgia,serif;padding:3px 8px;cursor:pointer;align-self:flex-start}'
  +'#ctHand{position:fixed;z-index:57;pointer-events:none;display:none;font-size:46px;transform:translate(-50%,-100%);filter:drop-shadow(0 3px 4px #000);animation:ctBob .7s ease-in-out infinite alternate}#ctHand.on{display:block}@keyframes ctBob{to{margin-top:-14px}}#ctRing{position:fixed;z-index:56;pointer-events:none;display:none;width:54px;height:54px;margin:-27px 0 0 -27px;border:3px solid #ffd27a;border-radius:50%;box-shadow:0 0 14px #ffd27a;animation:ctRing 1s ease-out infinite}#ctRing.on{display:block}@keyframes ctRing{from{transform:scale(.5);opacity:1}to{transform:scale(1.4);opacity:0}}'; document.head.appendChild(css); }
const ban=document.createElement('div'); ban.id='ctBan'; document.body.appendChild(ban);
const hand=document.createElement('div'); hand.id='ctHand'; hand.textContent='👇'; document.body.appendChild(hand);
const ring=document.createElement('div'); ring.id='ctRing'; document.body.appendChild(ring);
let banKey='';
function banner(k,pic,words){ if(banKey===k) return; banKey=k; ban.innerHTML='<div class="pic">'+pic+'</div><div class="w">'+words+'</div><button class="sk" type="button">Skip tutorial</button>'; ban.classList.add('on'); ban.querySelector('.sk').onclick=e=>{ e.stopPropagation(); skip(); }; }
function hideAll(){ ban.classList.remove('on'); banKey=''; hand.classList.remove('on'); ring.classList.remove('on'); }
const V=new THREE.Vector3();
function pointAt(x,y,z){ V.set(x,y,z).project(camera); const on=V.z<1&&Math.abs(V.x)<1.05&&Math.abs(V.y)<1.05; hand.classList.toggle('on',on); ring.classList.toggle('on',on); if(!on) return; const sx=(V.x+1)/2*innerWidth, sy=(1-V.y)/2*innerHeight; hand.style.left=sx+'px'; hand.style.top=(sy-18)+'px'; ring.style.left=sx+'px'; ring.style.top=sy+'px'; }
function skip(){ st.s=99; save(); hideAll(); }
// ---- the tutorial's piece: the first Earth recipe not known yet (none: straight to the hideout)
function pickKey(){ const b=R().read(); for(const p of PIECES){ const k=SET+'|'+p; if(!b.known[k]) return k; } return null; }
const pages=()=>{ const b=R().read(); return st.key?(b.known[st.key]?3:(b.pages[st.key]|0)):0; };
let lastPhase=null, pageOut=false;
function dropPage(){ const H=hero; const a=hero.yaw||0; const p=R().spawn(st.key,H.x+Math.sin(a)*1.8,H.z+Math.cos(a)*1.8); if(p){ p.vx=0; p.vz=0; } pageOut=!!p;   /* lands right in front of you, no scatter */ st.dropWave=S.wave; save(); }
function ready(){ if(st.s>=99||!solo()||MAPI!==0||!R()) return false; const T=window.__trainer; if(!T) return true; try{ const t=T.state(); return T.step()===null||!!t.off; }catch(e){ return true; } }
WORLDANIM.push(()=>{
  if(st.s>=4&&st.s<99){ try{ const o=JSON.parse(localStorage.getItem(KEY)); if(o&&o.s>st.s) st=o; }catch(e){} }   // the hideout carries it on from step 4 and writes it there
  if(!ready()){ if(ban.classList.contains('on')&&st.s<99) hideAll(); lastPhase=hallPhase(); return; }
  const ph=hallPhase(), endWave=lastPhase==='wave'&&ph==='build'; lastPhase=ph;
  if(st.s===0){ if(ph!=='build') return; st.key=pickKey(); st.s=st.key?1:3; save(); if(st.s===1) dropPage(); }
  if(st.s===1||st.s===2){ const n=pages();
    if(n>=3){ st.s=3; save(); pageOut=false; }
    else { const list=R().list().filter(p=>p.k===st.key);
      if(!list.length&&st.s===1&&ph==='build'&&!pageOut) dropPage();
      if(n>=1&&st.s===1){ st.s=2; save(); pageOut=false; }
      if(st.s===2&&ph==='build'&&!list.length&&S.wave>(st.dropWave|0)) dropPage();   // the next one comes at the end of the next wave (a new wave number since the last drop)
      if(list.length){ const p=list[0]; banner('p'+n,'📜 ➜ 📖','<b>A torn recipe page!</b> Walk over it.<br>'+n+' of 3 pages'); pointAt(p.x,.9,p.z); }
      else { banner('w'+n,'📜'.repeat(n)+'<span style="opacity:.35">'+'📜'.repeat(3-n)+'</span>','<b>'+n+' of 3 pages.</b> Fight the next wave:<br>another page drops at its end'); hand.classList.remove('on'); ring.classList.remove('on'); } } }
  if(st.s===3){ const P=window.__portal, open=window.__hideout&&window.__hideout.isOpen&&window.__hideout.isOpen();
    if(open){ st.s=4; save(); hideAll(); return; }
    if(ph!=='build'){ banner('3w','🌀','<b>Recipe learned!</b> When this wave ends,<br>go through the <b>hideout portal</b>'); hand.classList.remove('on'); ring.classList.remove('on'); return; }
    banner('3','🌀 ➜ 🔨','<b>Recipe learned!</b> Go through the <b>portal</b><br>to the <b>Blacksmith</b> in your hideout');
    if(P&&P.pos){ const q=P.pos(); pointAt(q.x,(q.y||0)+3.4,q.z); } }
  if(st.s>=4) hideAll();   // the hideout's half has it
});
window.__craftTut={ state:()=>Object.assign({},st), skip, reset:()=>{ st={ s:0 }; save(); hideAll(); }, set:o=>{ st=Object.assign({},o); save(); }, ready, banner:()=>ban.classList.contains('on')?ban.textContent:'', hand:()=>hand.classList.contains('on') };
})();
