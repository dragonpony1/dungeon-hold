// ===== THE WALL'S MUSIC (build 366, reworked 367). Matt, with three tracks (boss 1.mp3, boss 2.mp3 in the prison assets' sounds folder, and DRUMS FROM THE DEPTHS -- "it should be called drums from the depths"): "when the cinematic starts is
// boss 1 then boss 2 until its quiet", "so at 15 seconds on boss 2 stop and go to the drum file and start the drum file around 7 seconds", "fade one out at 18", "i want the cinematic to take up one and two"; then, having played it:
// "i heard the first 2 cuts but never the drum line", "i think that second boss cut needs to be cut shorter", "did boss 2 stop at the 15 second mark?". So the cutscene of the big barrier (56i-prisonbarrier.js) is 29 seconds and this is its score:
//   0:00 BOSS 1 begins -- 0:18 it fades out (two seconds) as BOSS 2 comes in -- 0:29 (11 seconds into boss 2, shortened from 15) boss 2 fades (.8 s) and DRUMS FROM THE DEPTHS comes in at the 7-second mark of its file, as the horde is let out and the
//   game is handed back. It goes on, looping from its 7-second mark (to 2:26), until it is quiet: the fight is over (no mob left alive for three seconds), another part of the game puts its own music on (a wave's end plays the build music),
//   or music is turned off -- then the game's own music for the phase comes back.
// Why the drums were not heard: this module used the game's lazy loader, which fetched and DECODED a track only when its stage began -- a 152-second mp3 takes a couple of seconds to decode (longer with a hundred skinned mobs on screen), so the drums arrived late
// or, if anything went wrong (a failed fetch or decode ended in the game's own music coming back, which this module reads as 'another part of the game put its own music on' and stops), not at all. Now the three files are fetched AND DECODED by this
// module's own loader (with retries and a console warning on failure) six seconds after the prison opens, so every stage starts the instant its time comes; the 5.5 MB is never loaded at start. The stages run on a clock the cutscene hands in
// (sync) so the picture and the score cannot drift apart; with no audio (sound off) the clock and the stages still run. Test hook: window.__bossMusic.
(function(){
'use strict';
window.__bossMusic={ info:()=>null };
if(!MAP||MAP.id!=='prison') return;
if(typeof setMusic!=='function') return;
const B1_FADE_AT=18, B1_FADE=2.0, B2_AT=18, B2_LEN=11, B2_FADE=.8, DEPTHS_AT=B2_AT+B2_LEN, DEPTHS_OFF=7;   // (56i's T_GO is the same 29)
// (Matt: "the drums are so quiet can we turn them up": its volume went from .5 to 1.15 -- about +7 dB; the file is bass-heavy drums, which read quieter than the boss tracks at the same level)
// the BATTLE track that follows boss 2: Drums from the Depths (152 s; from its 7-second mark, looping 7 to 2:26) -- or, kept as a SECOND OPTION at Matt's word ("well keep this one as a second option"), Fundamental_30_EXT01044.mp3 (45.9 s: a hit and a build
// for twelve seconds, then a steady groove to 0:39 and a tail; played from its start, looping 12 to 39.5). Chosen on the dev panel (F9, remembered in localStorage ddBattleTrack) or with ?battle=alt in the address; Drums from the Depths is the default.
const BATTLE_TRACKS={ depths:{ name:'Drums from the Depths', file:'assets/music-drums-from-the-depths.mp3', vol:1.15, offset:7, loopStart:7, loopEnd:146 }, alt:{ name:'Fundamental 30 (EXT01044)', file:'assets/music-fundamental-30.mp3', vol:.95, offset:0, loopStart:12, loopEnd:39.5 } };
let battle='depths'; try{ const q=new URLSearchParams(location.search).get('battle'), st=localStorage.getItem('ddBattleTrack'); battle=BATTLE_TRACKS[q]?q:BATTLE_TRACKS[st]?st:'depths'; }catch(er){}
const FILES={ boss1:'assets/music-boss1.mp3', boss2:'assets/music-boss2.mp3', depths:BATTLE_TRACKS.depths.file, alt:BATTLE_TRACKS.alt.file };
const VOL={ boss1:.95, boss2:.95, depths:BATTLE_TRACKS.depths.vol, alt:BATTLE_TRACKS.alt.vol };
const BUF={}, LOADING={}, FAILED={};
const BM={ on:false, t:0, stage:'off', nodes:{}, gen:0, calm:0, played:[] };
const audioOn=()=>{ try{ return !!(!soundOff&&musicOn&&A()); }catch(er){ return false; } };
// ---- the loader: fetch, decode, keep; two retries
function load(name,tries){ tries=tries||0; if(BUF[name]) return Promise.resolve(BUF[name]); if(LOADING[name]) return LOADING[name]; const a=audioOn()?A():null; if(!a) return Promise.resolve(null);
  LOADING[name]=fetch(FILES[name]).then(r=>{ if(!r.ok) throw new Error('HTTP '+r.status); return r.arrayBuffer(); })
    .then(bytes=>new Promise((res,rej)=>{ const p=a.decodeAudioData(bytes,res,rej); if(p&&p.catch) p.catch(()=>{}); }))
    .then(buf=>{ BUF[name]=buf; delete LOADING[name]; return buf; })
    .catch(er=>{ delete LOADING[name]; FAILED[name]=(FAILED[name]||0)+1; console.warn('wall music: could not load '+name,er); return tries<2?new Promise(r=>setTimeout(r,1500)).then(()=>load(name,tries+1)):null; });
  return LOADING[name]; }
function preload(){ if(!audioOn()) return; load('boss1'); load('boss2'); load(battle); }
setTimeout(preload,6000);
// ---- the stages
function play(name,buf,fade,opt){ const a=A(); if(!a||!buf) return; const g=a.createGain(), s=a.createBufferSource(); s.buffer=buf; if(opt&&opt.loop){ s.loop=true; s.loopStart=opt.loopStart; s.loopEnd=Math.min(opt.loopEnd,buf.duration); }
  g.gain.setValueAtTime(.0001,a.currentTime); g.gain.exponentialRampToValueAtTime(Math.max(.0002,MUS_VOL*(VOL[name]||1)),a.currentTime+fade); s.connect(g).connect(MUSOUT(a)); s.start(0,(opt&&opt.offset)||0); BM.nodes[name]={ s, g }; BM.played.push(name); }
function begin(name,fade,opt){ if(!audioOn()) return; const gen=BM.gen; if(BUF[name]){ play(name,BUF[name],fade,opt); return; } load(name).then(buf=>{ if(buf&&gen===BM.gen&&BM.on) play(name,buf,fade,opt); }); }
function fadeOut(name,sec){ const n=BM.nodes[name]; if(!n||!ac) return; delete BM.nodes[name]; try{ n.g.gain.cancelScheduledValues(ac.currentTime); n.g.gain.setValueAtTime(Math.max(.0002,n.g.gain.value),ac.currentTime); n.g.gain.exponentialRampToValueAtTime(.0001,ac.currentTime+sec); }catch(er){}
  setTimeout(()=>{ try{ n.s.stop(); n.s.disconnect(); n.g.disconnect(); }catch(er){} },sec*1000+250); }
function toStage(next){ if(next==='boss2'){ fadeOut('boss1',B1_FADE); begin('boss2',1.0); }
  else if(next==='battle'){ const T=BATTLE_TRACKS[battle]; fadeOut('boss1',.6); fadeOut('boss2',B2_FADE); begin(battle,1.0,{ loop:true, loopStart:T.loopStart, loopEnd:T.loopEnd, offset:T.offset }); } BM.stage=next; }
function advance(t){ BM.t=t; if(!BM.on) return; if(BM.stage==='boss1'&&t>=B1_FADE_AT) toStage('boss2'); if(BM.stage==='boss2'&&t>=DEPTHS_AT) toStage('battle'); }
function start(){ if(BM.on) return false; BM.on=true; BM.gen++; BM.t=0; BM.stage='boss1'; BM.calm=0; BM.played=[]; if(audioOn()){ preload(); try{ setMusic('none'); }catch(er){} begin('boss1',.4); } return true; }
function stop(sec,restore,why){ if(!BM.on) return; BM.on=false; BM.gen++; BM.stage='off'; BM.stopped=why||'stop'; for(const k of Object.keys(BM.nodes)) fadeOut(k,sec||2); if(restore){ try{ musicForPhase(); }catch(er){} } }
// the skip button: straight to Drums from the Depths
function toDepths(){ if(!BM.on) return; BM.t=Math.max(BM.t,DEPTHS_AT); if(BM.stage!=='battle') toStage('battle'); }
WORLDANIM.push(dt=>{ if(!BM.on) return; const cine=!!(window.__finale&&window.__finale.active&&window.__finale.active()); if(!cine) advance(BM.t+dt);
  if(audioOn()&&typeof musicMode!=='undefined'&&musicMode!=='none'){ stop(1.5,false,'game music '+musicMode); return; }   // another part of the game has put its own music on (a wave's end plays the build music)
  if(!audioOn()&&BM.stage!=='off'&&BM.played.length){ stop(.5,false,'music off'); return; }   // music or sound turned off partway
  if(!cine&&BM.stage==='battle'){ const n=window.__net, gu=!!(n&&n.role&&n.role()==='guest'), alive=gu?!!(window.__mobsync&&window.__mobsync.foes&&window.__mobsync.foes().length):enemies.some(e=>!e.dead);   /* build 508 (co-op): a guest's mobs are the host's puppets (its own enemies list is empty: the drums stopped 3 s in) */ BM.calm=alive?0:BM.calm+dt; if(BM.calm>3||S.phase==='dead'||S.phase==='won') stop(2.5,true,'quiet'); } });
// ---- the dev panel (F9): which battle track
setInterval(()=>{ const p=document.getElementById('devpanel'); if(!p||document.getElementById('dp-battle')) return; const sec=document.createElement('div'); sec.className='sect'; sec.id='dp-battle';
  sec.innerHTML='<label>the wall fight music, after boss 2</label><div class="row"><select id="dp-battle-sel"><option value="depths">Drums from the Depths</option><option value="alt">Fundamental 30</option></select></div>'; const note=p.querySelector('.note'); if(note) p.insertBefore(sec,note); else p.appendChild(sec);
  const sel=document.getElementById('dp-battle-sel'); sel.value=battle; sel.onchange=()=>{ battle=sel.value; try{ localStorage.setItem('ddBattleTrack',battle); }catch(er){} if(audioOn()) load(battle); }; },800);
// build 384: another cutscene's music (the mortar show, 95q) can DUCK this one under it and bring it back
function duck(k,sec){ const a=A(); if(!a) return; for(const [name,n] of Object.entries(BM.nodes)){ try{ const v=Math.max(.0002,MUS_VOL*(VOL[name]||1)*k); n.g.gain.cancelScheduledValues(a.currentTime); n.g.gain.setValueAtTime(Math.max(.0002,n.g.gain.value),a.currentTime); n.g.gain.exponentialRampToValueAtTime(v,a.currentTime+(sec||.6)); }catch(er){} } }
window.__bossMusic={ duck, start, stop, sync:t=>advance(t), toDepths, load, preload, setBattle:k=>{ if(BATTLE_TRACKS[k]) battle=k; }, battle:()=>battle, info:()=>({ on:BM.on, t:+BM.t.toFixed(2), stage:BM.stage, played:BM.played.slice(), nodes:Object.keys(BM.nodes), calm:+BM.calm.toFixed(1), stopped:BM.stopped||null, loaded:Object.keys(BUF), failed:Object.assign({},FAILED), mm:typeof musicMode!=='undefined'?musicMode:null, ctx:(typeof ac!=='undefined'&&ac)?ac.state:null }), consts:{ B1_FADE_AT, B2_AT, B2_LEN, DEPTHS_AT, DEPTHS_OFF }, battle:undefined };
})();
