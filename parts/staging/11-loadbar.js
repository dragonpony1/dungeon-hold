// ===== ASSET LOADING COUNTER (build 204): Matt: "map 2 still loads pretty slowly, if its as good as it gets we
// need an assest counter, with maybe a progress bar" -- then, seeing a pig boss come in as a wooden-doll placeholder
// mid-test: "reminds me about the asset counter". Wants it "top middle of the screen big enough font you cant miss
// it" in the hideout's reward font (Cinzel Decorative -- now loaded in the main page's <head> too, head.html).
// Real numbers, not a fake bar: game.js's own LOADT already tracks bytes and file count as fetches land (it's what
// the one-time "Map loaded" toast reads from) -- this just keeps that visible live, in big letters, instead of a
// toast that flashes once and is gone. No fixed total is known ahead of time (what a run fetches depends on hero,
// map, and how far the wave gets, so there's nothing to compute a true percentage against) -- shown as a plain,
// honest running count instead of a bar promising precision the game doesn't have.
// Shows itself the instant anything is in flight (the first page load, or a later lazy fetch like the pig bosses at
// wave 5) and clears the moment nothing is downloading. Polled with a plain setInterval, not tied to Meta.update or
// the sim loop, so it works on the title screen too, before any game state exists.
(function(){
const el=document.createElement('div'); el.id='loadctr';
// build 205 (Matt: "its counting up instead of down. the idea is it serves as a tell to the gamer... they can look up
// and see how many files, assets are left" -- and separately, "its superimposed over the part that says build
// phase, bring it down a little"): LOADT.inflight is already a real countdown -- however many fetches are actually
// in the air right now, ticking to 0 as each lands (and back up if a fresh batch starts, which is just as honest:
// more really did just get queued). Moved below #topC's BUILD PHASE / wave text (top:10px, ~50px tall) instead of
// sitting on top of it.
el.style.cssText='position:fixed;top:64px;left:50%;transform:translateX(-50%);z-index:50;pointer-events:none;text-align:center;font-family:"Cinzel Decorative",Georgia,serif;font-weight:700;font-size:26px;color:#e8b94a;text-shadow:0 0 14px #000,0 3px 0 #000;letter-spacing:1px;display:none;white-space:nowrap;';
document.body.appendChild(el);
function fmt(){ const n=LOADT.inflight; return '⏳ '+n+' ASSET'+(n===1?'':'S')+' LEFT'; }
setInterval(()=>{ const on=LOADT.inflight>0; el.style.display=on?'block':'none'; if(on) el.textContent=fmt(); },150);
window.__loadctr={el:()=>el,visible:()=>el.style.display==='block',text:()=>el.textContent};
})();
