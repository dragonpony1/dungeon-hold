// ===== THE TITLE SCREEN'S ART (build 145): "we're gonna use this art for our main menu page" -- the player's painting of a
// portal of twisted roots, glowing mushrooms and violet crystals sits behind the title screen (assets/title-bg.webp, 1536x864,
// 390 KB), under a dark gradient so the heading, the hero cards, the buttons and the small print stay readable (the CSS is
// #start.art in parts/head.html). Only the folder build has the file, so the class goes on only there; the single-file
// build keeps its flat dark screen. The image is fetched as soon as the page runs, ahead of the models.
(function(){
if(!HAS_ASSETS) return;
const st=document.getElementById('start'); if(!st) return;
const im=new Image(); im.onload=()=>{ st.classList.add('art'); }; im.onerror=()=>{}; im.src='assets/title-bg.webp';   // shown only once it has arrived: no flash of a half-drawn background
window.__titleart={on:()=>st.classList.contains('art'),src:im.src};
})();
