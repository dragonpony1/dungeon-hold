// ===== THE WALL'S MUSIC (build 366). Matt, with three tracks (boss 1.mp3, boss 2.mp3 in the prison assets' sounds folder, and the 12-Drums-from-the-Depths mp3): "when the cinematic starts is boss 1 then boss 2 until its quiet",
// then "so at 15 seconds on boss 2 stop and go to the drum file and start the drum file around 7 seconds", then "fade one out at 18", and "i want the cinematic to take up one and two". So the cutscene of the big barrier
// (56i-prisonbarrier.js) is 33 seconds long and this is its score:  0:00 BOSS 1 begins -- 0:18 it fades out (two seconds) as BOSS 2 comes in -- 0:33 (15 seconds into boss 2) boss 2 fades and the DRUMS come in at the 7-second mark
// of their file, as the horde is let out and the game is handed back. The drums go on, looping from their 7-second mark, until it is quiet: the fight is over (no mob left alive for three seconds), another part of the game
// puts its own music on (a wave's end plays the build music), or music is turned off -- then the game's own music for the phase comes back. The three files (5.5 MB) are fetched four seconds after the prison opens, never at start.
// The stages run on a clock the cutscene hands in (sync) so the picture and the score cannot drift apart; with no audio (sound off) the clock and the stages still run. Test hook: window.__bossMusic.
(function(){
'use strict';
window.__bossMusic={ info:()=>null };
if(!MAP||MAP.id!=='prison') return;
if(typeof TRACKS==='undefined'||typeof musFetch!=='function'||typeof musDecode!=='function'||typeof setMusic!=='function') return;
const B1_FADE_AT=18, B1_FADE=2.0, B2_AT=18, B2_LEN=15, DRUM_AT=B2_AT+B2_LEN, DRUM_OFF=7, DRUM_LOOP_END=146, B2_FADE=1.6;
const VOL={ boss1:.95, boss2:.95, drums:.5 };   // the drums are about twice as loud in their file
TRACKS.boss1='assets/music-boss1.mp3'; TRACKS.boss2='assets/music-boss2.mp3'; TRACKS.drums='assets/music-drums-depths.mp3';
setTimeout(()=>{ ['boss1','boss2','drums'].forEach(k=>{ try{ musFetch(k); }catch(er){} }); },4000);
const BM={ on:false, t:0, stage:'off', nodes:{}, gen:0, calm:0, played:[] };
const audioOn=()=>{ try{ return !!(!soundOff&&musicOn&&A()); }catch(er){ return false; } };
function begin(name,fade,opt){ if(!audioOn()) return; const gen=BM.gen, a=A(); musDecode(name,buf=>{ if(gen!==BM.gen||!BM.on) return; const g=a.createGain(), s=a.createBufferSource(); s.buffer=buf; if(opt&&opt.loop){ s.loop=true; s.loopStart=opt.loopStart; s.loopEnd=Math.min(opt.loopEnd,buf.duration); }
    g.gain.setValueAtTime(.0001,a.currentTime); g.gain.exponentialRampToValueAtTime(Math.max(.0002,MUS_VOL*(VOL[name]||1)),a.currentTime+fade); s.connect(g).connect(MUSOUT(a)); s.start(0,(opt&&opt.offset)||0); BM.nodes[name]={ s, g }; BM.played.push(name); }); }
function fadeOut(name,sec){ const n=BM.nodes[name]; if(!n||!ac) return; delete BM.nodes[name]; try{ n.g.gain.cancelScheduledValues(ac.currentTime); n.g.gain.setValueAtTime(Math.max(.0002,n.g.gain.value),ac.currentTime); n.g.gain.exponentialRampToValueAtTime(.0001,ac.currentTime+sec); }catch(er){}
  setTimeout(()=>{ try{ n.s.stop(); n.s.disconnect(); n.g.disconnect(); }catch(er){} },sec*1000+250); }
function toStage(next){ if(next==='boss2'){ fadeOut('boss1',B1_FADE); begin('boss2',1.2); }
  else if(next==='drums'){ fadeOut('boss1',.6); fadeOut('boss2',B2_FADE); begin('drums',1.2,{ loop:true, loopStart:DRUM_OFF, loopEnd:DRUM_LOOP_END, offset:DRUM_OFF }); } BM.stage=next; }
function advance(t){ BM.t=t; if(!BM.on) return; if(BM.stage==='boss1'&&t>=B1_FADE_AT) toStage('boss2'); if(BM.stage==='boss2'&&t>=DRUM_AT) toStage('drums'); }
function start(){ if(BM.on) return false; BM.on=true; BM.gen++; BM.t=0; BM.stage='boss1'; BM.calm=0; BM.played=[]; if(audioOn()){ try{ setMusic('none'); }catch(er){} begin('boss1',.4); } return true; }
function stop(sec,restore){ if(!BM.on) return; BM.on=false; BM.gen++; BM.stage='off'; for(const k of Object.keys(BM.nodes)) fadeOut(k,sec||2); if(restore){ try{ musicForPhase(); }catch(er){} } }
// the skip button: straight to the drums
function toDrums(){ if(!BM.on) return; BM.t=Math.max(BM.t,DRUM_AT); if(BM.stage!=='drums') toStage('drums'); }
WORLDANIM.push(dt=>{ if(!BM.on) return; const cine=!!(window.__finale&&window.__finale.active&&window.__finale.active()); if(!cine) advance(BM.t+dt);
  if(audioOn()&&typeof musicMode!=='undefined'&&musicMode!=='none'){ stop(1.5,false); return; }   // another part of the game has put its own music on (a wave's end plays the build music)
  if(!audioOn()&&BM.stage!=='off'&&BM.played.length){ stop(.5,false); return; }   // music or sound turned off partway
  if(!cine&&BM.stage==='drums'){ const alive=enemies.some(e=>!e.dead); BM.calm=alive?0:BM.calm+dt; if(BM.calm>3||S.phase==='dead'||S.phase==='won') stop(2.5,true); } });
window.__bossMusic={ start, stop, sync:t=>advance(t), toDrums, info:()=>({ on:BM.on, t:+BM.t.toFixed(2), stage:BM.stage, played:BM.played.slice(), nodes:Object.keys(BM.nodes), calm:+BM.calm.toFixed(1) }), consts:{ B1_FADE_AT, B2_AT, B2_LEN, DRUM_AT, DRUM_OFF } };
})();
