// ===== WHICH BACKGROUND THE TITLE / LOADING SCREEN SHOWS (build 256). Matt: "loading screen has our background rotation in it, add fire imp and storm drake". The title screen used to have ONE painting behind it (the root portal,
// 20-titleart.js); now it rotates. Each time the game opens ONE of these is picked at random (never the one shown last time, remembered in ddTitleBg):
//   portal -- the painting, as before;   firebow / wisp / imp / drake / trimaw / sixseven -- the Draconic Fire Bow, the Wisp's projectile, the Fire Imp, the Storm Drake, the Trimaw and the Storm Halberd (the named mythic polearm "6/7"), each a slow-spinning 3D model on black
//   under a soft spotlight, the way Meshy previews them (20b-titlestage.js). ?titlebg=<name> forces one (to look at each); a browser a test drives (navigator.webdriver) gets the painting, so the suites that read it stay steady.
// Runs before 20-titleart.js, which asks window.__titleWant() before it even fetches the painting (390 KB nobody sees on the other five). The single-file build has no models: always the painting.
(function(){
const LIST=['portal','firebow','wisp','imp','drake','trimaw','sixseven','mousetrap'];   // mousetrap (build 393, Matt: "put that on the rotation page"): his Iron Mouse Trap, the Mark IV
let pick=null;
try{ const q=new URLSearchParams(location.search).get('titlebg'); if(q&&LIST.includes(q)) pick=q; }catch(e){}
if(!pick&&navigator.webdriver) pick='portal';
if(!pick){ let last=-1; try{ last=parseInt(localStorage.getItem('ddTitleBg')); }catch(e){} const opts=LIST.map((_,i)=>i).filter(i=>i!==last); const i=opts[Math.floor(Math.random()*opts.length)]; pick=LIST[i]; try{ localStorage.setItem('ddTitleBg',String(i)); }catch(e){} }
if(!HAS_ASSETS) pick='portal';
window.__titleWant=()=>pick; window.__titleList=LIST.slice();
})();
