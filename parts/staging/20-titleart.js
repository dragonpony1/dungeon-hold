// ===== THE TITLE SCREEN'S ART (build 145): "we're gonna use this art for our main menu page" -- the player's painting of a
// portal of twisted roots, glowing mushrooms and violet crystals sits behind the title screen (assets/title-bg.webp, 1536x864,
// 390 KB), under a dark gradient so the heading, the hero cards, the buttons and the small print stay readable (the CSS is
// #start.art in parts/head.html). Only the folder build has the file, so the class goes on only there; the single-file
// build keeps its flat dark screen. The image is fetched as soon as the page runs, ahead of the models.
(function(){
if(!HAS_ASSETS) return;
// build 524: a pic-* pick (19b) is one of Matt's card paintings (assets/loading-<name>.jpg, shared with the loading rotation) on the right where the 3D stage stands, fading into the dark
{ const w=window.__titleWant&&window.__titleWant(); if(w&&/^pic-/.test(w)){ const st=document.getElementById('start'); if(!st) return; const src='assets/loading-'+w.slice(4)+'.jpg'; const im=new Image();
    im.onload=()=>{ st.classList.add('art','picbg'); st.style.background='radial-gradient(ellipse 34% 62% at 78% 50%,#0b071200 40%,#0b0712 74%),linear-gradient(180deg,#0b071299 0%,#0b071200 30%,#0b071200 70%,#0b0712cc 100%),url('+src+') 78% 50%/auto 86% no-repeat,#0b0712'; };
    im.src=src; window.__titleart={on:()=>st.classList.contains('art'),src}; return; } }
if(window.__titleWant&&window.__titleWant()!=='portal') return;   // build 256: the title rotates (19b-titlepick.js, 20b-titlestage.js); this painting is one of six, so the other five never fetch it
const st=document.getElementById('start'); if(!st) return;
const im=new Image(); im.onload=()=>{ st.classList.add('art'); }; im.onerror=()=>{}; im.src='assets/title-bg.webp';   // shown only once it has arrived: no flash of a half-drawn background
window.__titleart={on:()=>st.classList.contains('art'),src:im.src};
})();
