// ===== THE BAG, RESTYLED AFTER MATT'S MOCKUP (build 524 prep). Matt sent an AI concept of the tavern bag ("I dont know if this is usable"), then on rebuilding it as real UI: "yes i am sure you can do a
// better job bcause you know what it really needs to do", and on its sixth equipped card: "he put the off hand in threre as 6 dymaic slot for extra weapon or pet".
// Real HTML/CSS throughout -- nothing laid over a flat picture (the lesson of the Trade-O-Matic): the frame, plaque, tabs, bands and buttons are gradients, borders and shadows; the only pictures are
// Matt's ten set medallions (parts/assets/medal-<key>.png) and the item art the bag already shows.
//   * the whole tavern window (BAG, SHOP, TALENTS) wears an antique-gold frame with carved corners, a gold title plaque, side banners (wide screens only), gold-edged tabs and a gold BACK TO THE HALL
//   * the bag's own buttons (sort, Sell junk, Sell all, the L-lock chip, the hideout's Salvage) move up beside the tabs
//   * EQUIPPED is a band of SIX big cards: the five slots plus a dynamic OFF-HAND / 2ND PET card -- the 2nd weapon while a dual-wield ring is on (99k-dualwield.js), the 2nd pet while Beast Mode or
//     Malamute is on (97h-tworings.js), else a locked 💍 slot (a filed piece whose ring is off shows faded with 💤). It replaces the separate 2ND FAMILIAR / 2ND WEAPON rows; a click opens the same panel.
//     Each card: slot, picture, name, Lv, rarity, and a green +N for the forge upgrades bought on it.
//   * the by-set grid is a gold-framed column per set, Matt's glowing medallion on top, the five slot squares under it and n/5 at its foot; OTHER GEAR (NO SET) is five framed panels.
// Every rule still lives where it did (Meta, 20-tavern.js tvClick, the wraps); this file only re-lays the DOM and dresses it. Test hook: window.__bagstyle.
(function(){
'use strict';
if(typeof tvRenderBag!=='function'||typeof tvBagSetCols!=='function'||!$('tavern')) return;
const SLOT_WORD={weapon:'WEAPON',armor:'ARMOR',charm:'CHARM',amulet:'AMULET',familiar:'FAMILIAR'};
const svgUrl=s=>'url("data:image/svg+xml,'+encodeURIComponent(s)+'")';
// a carved gold corner: a double rail with a scroll curl each way and a jewel where they meet (drawn for the top-left; the others are mirrors)
const CORNER=svgUrl("<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 96 96'><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='#fff3c4'/><stop offset='.4' stop-color='#e2b24c'/><stop offset='1' stop-color='#6e4a14'/></linearGradient>"
 +"<radialGradient id='j' cx='.4' cy='.35' r='.7'><stop offset='0' stop-color='#f2c8ff'/><stop offset='.45' stop-color='#9a3ae0'/><stop offset='1' stop-color='#2a0848'/></radialGradient></defs>"
 +"<g fill='none' stroke='url(#g)' stroke-linecap='round' stroke-linejoin='round'><path d='M5 94V18Q5 5 18 5H94' stroke-width='5'/><path d='M14 94V26Q14 14 26 14H94' stroke-width='1.6'/>"
 +"<path d='M5 52C24 52 31 38 25 29C20 22 11 26 15 33C18 37 23 34 21 31' stroke-width='3'/><path d='M52 5C52 24 38 31 29 25C22 20 26 11 33 15C37 18 34 23 31 21' stroke-width='3'/>"
 +"<path d='M14 70C22 66 24 60 21 56' stroke-width='1.8'/><path d='M70 14C66 22 60 24 56 21' stroke-width='1.8'/></g>"
 +"<path d='M2 2L17 6L22 22L6 17Z' fill='url(#g)' stroke='#3a2508' stroke-width='1'/><circle cx='30' cy='30' r='6.5' fill='url(#j)' stroke='url(#g)' stroke-width='2.4'/></svg>");
// the little gold fleur that sits on the plaque and under the banners' words
const FLEUR=svgUrl("<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 24'><defs><linearGradient id='g' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#fff0b8'/><stop offset='1' stop-color='#a8752a'/></linearGradient></defs>"
 +"<g fill='url(#g)'><path d='M20 1C23 6 23 10 20 14C17 10 17 6 20 1Z'/><path d='M20 14C14 16 9 13 8 8C12 9 15 11 20 14Z'/><path d='M20 14C26 16 31 13 32 8C28 9 25 11 20 14Z'/><rect x='12' y='15' width='16' height='2.4' rx='1.2'/>"
 +"<path d='M1 16H10L12 15.5L10 18H1Z'/><path d='M39 16H30L28 15.5L30 18H39Z'/><circle cx='20' cy='20.5' r='2.4'/></g></svg>");
{ const ln=document.createElement('link'); ln.rel='stylesheet'; ln.href='https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700;800&display=swap'; ln.id='bs-font'; document.head.appendChild(ln); }
const CZ="'Cinzel',Georgia,'Times New Roman',serif";
const css=document.createElement('style'); css.id='bs-css'; css.textContent=`
#tavern.bs{background:radial-gradient(ellipse at 50% 40%,#140a1cee 0%,#06030af6 75%)}
/* ---- the frame ---- */
.bs .tv-box{--g1:#fff0b8;--g2:#e0b04c;--g3:#8a5e1c;--gd:#3a2508;border:3px solid transparent;border-radius:14px;
 background:radial-gradient(ellipse 70% 55% at 50% 38%,#2a1638 0%,#190d24 55%,#0c0612 100%) padding-box,radial-gradient(circle at 0% 100%,#ff9a3a1c,transparent 26%) padding-box,radial-gradient(circle at 100% 100%,#ff9a3a14,transparent 22%) padding-box,linear-gradient(135deg,var(--g1),var(--g2) 18%,var(--g3) 40%,var(--g2) 60%,var(--g1) 78%,var(--g3)) border-box;
 box-shadow:inset 0 0 0 2px #1a0e06,inset 0 0 0 3px #b8893a99,inset 0 0 0 7px #0000,inset 0 0 90px #000c,0 0 0 1px #000,0 0 0 4px #2a1a0a,0 0 0 5px #7a5a26,0 14px 60px #000}
.bs .tv-box>.bs-cn{position:absolute;width:104px;height:104px;background:${CORNER} center/contain no-repeat;pointer-events:none;z-index:6;filter:drop-shadow(0 2px 3px #000c)}
.bs .bs-cn.tl{left:-11px;top:-11px}.bs .bs-cn.tr{right:-11px;top:-11px;transform:scaleX(-1)}.bs .bs-cn.bl{left:-11px;bottom:-11px;transform:scaleY(-1)}.bs .bs-cn.br{right:-11px;bottom:-11px;transform:scale(-1,-1)}
/* ---- the head: level on the left, the plaque in the middle, gold and the close on the right ---- */
.bs .tv-head{display:grid;grid-template-columns:minmax(0,1fr) auto minmax(0,1fr);column-gap:118px;row-gap:6px;align-items:center;padding:12px 26px 4px;padding-top:calc(12px + env(safe-area-inset-top,0px));border-bottom:none;position:relative;z-index:2}
.bs .tv-title{position:relative;flex:none;overflow:visible;display:flex;align-items:center;gap:14px;padding:5px 30px 6px;border-radius:10px;font:800 30px/1.15 ${CZ};letter-spacing:4px;color:#f6dc8e;text-shadow:0 2px 0 #000,0 0 18px #e8b94a55;
 background:linear-gradient(#3a2246,#1c0f26) padding-box,linear-gradient(#fff0b8,#c9962f 45%,#6e4a14 80%,#d8aa4c) border-box;border:2px solid transparent;box-shadow:inset 0 0 0 1px #000,inset 0 0 0 3px #8a5e1c88,inset 0 0 20px #000a,0 0 22px #e8b94a2a,0 3px 10px #000}
.bs .tv-title:before,.bs .tv-title:after{content:"";position:absolute;top:50%;width:100px;height:10px;margin-top:-5px;pointer-events:none;
 background:radial-gradient(circle at 50% 50%,#f2d27a 0 3px,transparent 3.6px) right center/12px 10px no-repeat,linear-gradient(90deg,transparent,#c9962f 60%,#f6dc8e) center/100% 2px no-repeat}
.bs .tv-title:before{right:calc(100% + 6px)}.bs .tv-title:after{left:calc(100% + 6px);transform:scaleX(-1)}
.bs .tv-title .bs-mug{font-size:28px;filter:drop-shadow(0 2px 2px #000)}.bs .tv-title .bs-fl{width:34px;height:21px;background:${FLEUR} center/contain no-repeat;filter:drop-shadow(0 1px 1px #000)}
.bs .bs-right{display:flex;align-items:center;justify-content:flex-end;gap:10px;min-width:0}
.bs .tv-gold{padding:5px 14px;border-radius:20px;background:linear-gradient(#24162c,#120a18);border:1.5px solid #8a6a32;box-shadow:inset 0 0 8px #000,0 0 10px #ffd06022;font:700 18px Georgia,serif}
.bs .tv-x{width:42px;height:42px;border-radius:9px;background:linear-gradient(#3a2446,#1a0e22);border:2px solid #c9962f;color:#f6dc8e;box-shadow:inset 0 0 0 1px #000,0 2px 6px #000;font:700 18px ${CZ}}
.bs .tv-x:hover{color:#fff;border-color:#f6dc8e;box-shadow:inset 0 0 0 1px #000,0 0 12px #e8b94a88}
.bs .tv-head .tv-lvl{padding:0;min-width:0;flex-wrap:nowrap;font-size:12px}
.bs .tv-head .tv-lvl b{font:700 15px ${CZ};color:#f6dc8e;padding:2px 9px;border:1.5px solid #8a6a32;border-radius:7px;background:#120a18}
.bs .tv-head .tv-xp{height:9px;border:1px solid #8a6a32;border-radius:5px;background:#0c0612;box-shadow:inset 0 0 4px #000}.bs .tv-head .tv-xp i{background:linear-gradient(90deg,#2a8ab0,#7ae8ff)}
.bs .tv-head .tv-pts{background:linear-gradient(#7a2a6e,#3e143a);border-color:#e8b94a}
/* ---- side banners: hung beside the plaque and the tabs on a wide screen ---- */
.bs .bs-ban{display:none;position:absolute;top:14px;width:100px;height:128px;z-index:3;pointer-events:none;filter:drop-shadow(0 6px 8px #000c)}
.bs .bs-ban:before{content:"";position:absolute;left:-6px;right:-6px;top:-5px;height:8px;border-radius:4px;background:linear-gradient(#fff0b8,#a8752a);box-shadow:0 1px 2px #000}
.bs .bs-ban>span{position:absolute;inset:0;clip-path:polygon(0 0,100% 0,100% 100%,50% 84%,0 100%);background:linear-gradient(160deg,#f6dc8e,#9a6a22 50%,#e0b04c)}
.bs .bs-ban>span:after{content:"";position:absolute;inset:3px 3px 4px;clip-path:polygon(0 0,100% 0,100% 100%,50% 84%,0 100%);background:radial-gradient(ellipse at 50% 30%,#3e1f4e,#1a0c24 80%)}
.bs .bs-ban b{position:absolute;left:15px;right:15px;top:20px;z-index:1;text-align:center;font:700 12px/1.3 ${CZ};letter-spacing:.5px;color:#f2d27a;text-shadow:0 1px 0 #000}
.bs .bs-ban i{position:absolute;left:50%;top:86px;width:30px;height:18px;margin-left:-15px;z-index:1;background:${FLEUR} center/contain no-repeat}
.bs .bs-ban.l{left:16px}.bs .bs-ban.r{right:16px}
@media (min-width:1640px){.bs .bs-ban{display:block}.bs .tv-head,.bs .tv-tabs{padding-left:128px;padding-right:128px}}
/* ---- tabs, then a divider and the bag's own buttons ---- */
.bs .tv-tabs{justify-content:center;align-items:center;flex-wrap:wrap;gap:8px 10px;padding:8px 26px 10px;position:relative;z-index:2}
.bs .tv-tabs>button{flex:0 0 auto;min-width:132px;min-height:44px;padding:0 24px;border:2px solid transparent;border-radius:8px;font:700 17px ${CZ};letter-spacing:2px;color:#e8d6a8;
 background:linear-gradient(#2c1a36,#140a1c) padding-box,linear-gradient(#e8c06a,#7a5418 55%,#c9962f) border-box;box-shadow:inset 0 0 0 1px #000,0 2px 6px #000a}
.bs .tv-tabs>button:hover{color:#fff4cc}
.bs .tv-tabs>button.on{color:#fff0c0;text-shadow:0 0 10px #d090ff,0 1px 0 #000;background:radial-gradient(ellipse at 50% 35%,#8a44d0,#4a1a7a 60%,#2a0c48) padding-box,linear-gradient(#fff3c4,#e0b04c 50%,#fff0b8) border-box;
 box-shadow:inset 0 0 0 1px #000,inset 0 0 14px #c890ff66,0 0 16px #a050ffaa,0 2px 6px #000}
.bs .bs-div{width:2px;align-self:stretch;margin:4px 6px;background:linear-gradient(transparent,#c9962f,transparent)}
#bs-tools{display:flex;align-items:center;min-width:0}#bs-tools:empty{display:none}
#bs-tools .tv-sub{margin:0;gap:8px;row-gap:6px;flex-wrap:wrap;letter-spacing:0}#bs-tools .tv-sub .sp{display:none}
#bs-tools .bs-bagn{font:700 13px ${CZ};color:#e8d6a8;letter-spacing:1px;white-space:nowrap}#bs-tools .bs-bagn .tv-n{font:600 12px Georgia,serif;color:#c9b8a0}
#bs-tools .tv-btn{flex:none;min-width:0;overflow:visible;min-height:42px;padding:4px 16px;border:2px solid transparent;border-radius:8px;font:700 14px ${CZ};letter-spacing:.5px;color:#f0dfb4;text-transform:none;
 background:linear-gradient(#2c1a36,#140a1c) padding-box,linear-gradient(#e8c06a,#7a5418 55%,#c9962f) border-box;box-shadow:inset 0 0 0 1px #000,0 2px 6px #000a}
#bs-tools .tv-btn:not(:disabled):hover{color:#fff;box-shadow:inset 0 0 0 1px #000,0 0 12px #e8b94a77}
#bs-tools .tv-btn.hot{color:#fff;background:linear-gradient(#8a2a2e,#3e1416) padding-box,linear-gradient(#fff0b8,#c9962f) border-box}
#bs-tools #tv-selljunk:before{content:"💰 "}#bs-tools #tv-sellall:before{content:"🪙 "}
#bs-tools .lk-hint{margin-left:0;min-height:30px;padding:0 9px;border-color:#8a6a32}
.bs .tv-body{border-top:none;background:none;padding:6px 22px 90px;position:relative;z-index:1}
.bs .tv-pane>.tv-sub,.bs #tv-skills .tal-top h3{font-family:${CZ}}
/* ---- EQUIPPED: one green band, six big cards ---- */
.bs .tv-bag2,.bs .tv-bag2.cols{display:grid;grid-template-columns:minmax(0,1fr)!important;gap:14px}
.bs .tv-eq{display:block!important;position:relative;padding:6px 12px 12px;border-radius:12px;border:2px solid #3fae4a;background:linear-gradient(#16261a99,#0b120cbb);
 box-shadow:0 0 0 1px #000,0 0 14px #3fdc5a44,inset 0 0 22px #3fdc5a1c,inset 0 0 0 1px #9bffa222}
.bs .bs-eqh{display:flex;align-items:center;justify-content:center;gap:12px;min-height:34px;margin:0 0 8px}
.bs .bs-eqh .tv-sub{margin:0;font:700 18px ${CZ};letter-spacing:2px;color:#f6dc8e;text-shadow:0 2px 0 #000;flex-wrap:nowrap;min-width:0}
.bs .bs-eqh:before,.bs .bs-eqh>.bs-orn{content:"";flex:0 1 160px;height:10px;background:radial-gradient(circle at 100% 50%,#f2d27a 0 3px,transparent 3.6px) right center/8px 10px no-repeat,linear-gradient(90deg,transparent,#c9962f) left center/calc(100% - 8px) 2px no-repeat}
.bs .bs-eqh>.bs-orn{transform:scaleX(-1)}
.bs .bs-eqh .bg-head{position:absolute;right:12px;top:6px;margin:0;padding:4px 10px;font:700 13px ${CZ};letter-spacing:1px}.bs .bs-eqh .bg-head b{font-size:14px}
.bs .bs-eqrow{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:10px}
.bs .tv-card.bs-eq{display:flex;flex-direction:row;align-items:center;gap:10px;min-height:96px;margin:0;padding:8px 10px;border:2px solid #4fc85a;border-radius:9px;overflow:visible;
 background:radial-gradient(circle at 7px calc(100% - 7px),#7dff8a 0 2.6px,#1c6a24 3.4px,transparent 4.2px),radial-gradient(circle at calc(100% - 7px) calc(100% - 7px),#7dff8a 0 2.6px,#1c6a24 3.4px,transparent 4.2px),linear-gradient(#24152c,#120a18);
 box-shadow:inset 0 0 0 1px #000,inset 0 0 14px #3fdc5a22,0 0 8px #3fdc5a33,0 3px 8px #000}
.bs .tv-card.bs-eq:hover{filter:brightness(1.12)}
.bs .tv-card.bs-eq.bg-up{border-color:#5ff07a!important;box-shadow:inset 0 0 0 1px #000,inset 0 0 16px #3fdc5a33,0 0 12px #3fdc5a77,0 3px 8px #000}
.bs .tv-card.bs-eq.sel{border-color:#ffd24a!important;box-shadow:inset 0 0 0 1px #000,0 0 0 1px #ffd24a,0 0 16px #ffd24a99}
.bs .bs-eq .bs-pic{position:relative;flex:none;width:76px;height:76px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:36px;
 background:radial-gradient(circle at 50% 42%,color-mix(in srgb,var(--rc) 30%,#1a1226),#0c0612 72%);border:2px solid var(--rc);box-shadow:inset 0 0 12px #000,0 0 10px color-mix(in srgb,var(--rc) 45%,transparent)}
.bs .bs-eq .bs-pic .ic{position:static;font-size:inherit;line-height:1;width:100%;height:100%;display:flex;align-items:center;justify-content:center}
.bs .bs-eq .bs-pic .ia{width:90%;height:90%;object-fit:contain;filter:drop-shadow(0 2px 3px #000)}.bs .bs-eq .bs-pic .ia+.ie{display:none}.bs .bs-eq .bs-pic .ia.bad{display:none}.bs .bs-eq .bs-pic .ia.bad+.ie{display:inline}
.bs .bs-eq .bs-pic .lk{position:absolute;left:2px;bottom:1px;font-size:12px;font-style:normal;z-index:2}
.bs .bs-eq .bs-pic.nmd:before{content:"";position:absolute;inset:-2px;border-radius:8px;padding:3px;background:conic-gradient(from var(--tvra),#ff3b3b,#ffb02e,#fff23a,#4dff6a,#3ad8ff,#5a6bff,#d04bff,#ff3b3b);-webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);-webkit-mask-composite:xor;mask-composite:exclude;animation:tvrain 2.4s linear infinite;pointer-events:none;z-index:1}
.bs .bs-eq .bs-pic.prc{overflow:hidden}.bs .bs-eq .bs-pic.prc:after{content:"";position:absolute;inset:0;background:linear-gradient(110deg,transparent 35%,#ffffff70 48%,#fff6c080 52%,transparent 65%);background-size:260% 100%;animation:tvshim 2.2s ease-in-out infinite;pointer-events:none;z-index:1}
.bs .bs-eq .bs-inf{flex:1;min-width:0;display:flex;flex-direction:column;gap:1px}
.bs .bs-eq .bs-sl{font:700 12px ${CZ};letter-spacing:1px;color:#e8d6a8;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.bs .bs-eq .nm{display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:2;font:700 11.5px/1.22 Georgia,serif;overflow:hidden;overflow-wrap:anywhere}
.bs .bs-eq .bs-lv{font:700 15px/1.2 ${CZ};color:#f4ead2}
.bs .bs-eq .bs-rar{font:700 12px/1.2 ${CZ};letter-spacing:.5px;text-transform:uppercase}
.bs .bs-eq .bs-up{position:absolute;left:62px;top:-1px;width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font:800 13px/1 system-ui,sans-serif;color:#fff;z-index:3;
 background:radial-gradient(circle at 38% 32%,#5ad24a,#1a6a1a 70%);border:2px solid #9bff8a;box-shadow:0 0 0 1px #000,0 0 10px #3fdc5aaa;text-shadow:0 1px 1px #000}
.bs .bs-eq .bg-b{top:auto;right:auto;left:4px;bottom:4px;width:19px;height:19px;font-size:11px}
.bs .tv-card.bs-eq.bs-none{border-color:#3d6a42}.bs .bs-eq.bs-none .bs-pic{border-style:dashed;border-color:#4a6a4a;opacity:.55;filter:grayscale(.7)}.bs .bs-eq.bs-none .bs-lv{font:italic 12px Georgia,serif;color:#8f8470}
.bs .bs-eq.bs-zz{opacity:.62}.bs .bs-eq.bs-zz .bs-pic{filter:grayscale(.5)}
.bs .bs-eq.bs-lock{border-color:#4a5a4a;background:linear-gradient(#1a1220,#0e0814);box-shadow:inset 0 0 0 1px #000,0 3px 8px #000}.bs .bs-eq.bs-lock .bs-pic{border:2px dashed #5a4a6a;opacity:.6;filter:grayscale(.6);--rc:#5a4a6a}
.bs .bs-eq.bs-lock .bs-sl{white-space:normal;line-height:1.25}.bs .bs-eq .bs-pics{font:14px/1.35 system-ui,sans-serif;letter-spacing:1px;opacity:.8}
/* ---- the set grid: a framed column per set, its medallion on top ---- */
.bs .tv-smat.bs-sets{display:grid;grid-template-columns:repeat(var(--n),minmax(0,1fr));gap:8px;margin:2px 0 12px;--ch:74px;--tmax:62px}
.bs .bs-set{position:relative;display:flex;flex-direction:column;align-items:stretch;gap:4px;min-width:0;padding:0 6px 6px;margin-top:30px;border-radius:12px 12px 9px 9px;border:2px solid transparent;
 background:linear-gradient(color-mix(in srgb,var(--sc) 16%,#1c1026),#110a18 46%,#0c0612) padding-box,linear-gradient(#f6dc8e,#8a5e1c 30%,#c9962f 70%,#6e4a14) border-box;box-shadow:inset 0 0 0 1px #000,inset 0 0 18px #000a,0 4px 10px #000a}
.bs .bs-set .tv-sh{display:contents}
.bs .bs-set .bs-med{display:block;width:62px;height:62px;margin:-32px auto 0;object-fit:contain;filter:drop-shadow(0 0 7px var(--sc)) drop-shadow(0 2px 3px #000);transition:transform .2s}
.bs .bs-set:hover .bs-med{transform:scale(1.06)}
.bs .bs-set .bs-medx{display:flex;align-items:center;justify-content:center;width:52px;height:52px;margin:-28px auto 0;border-radius:50%;font-size:26px;background:#1a1026;border:2px solid #c9962f}
.bs .bs-set .bs-sn{display:block;text-align:center;font:700 13px/1.1 ${CZ};letter-spacing:1px;color:color-mix(in srgb,var(--sc) 55%,#fff6dc);text-shadow:0 0 8px color-mix(in srgb,var(--sc) 60%,transparent),0 1px 0 #000;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin:0 0 2px}
.bs .bs-set.none .bs-med{filter:grayscale(.75) brightness(.7) drop-shadow(0 2px 3px #000)}.bs .bs-set.none .bs-sn{opacity:.6}
.bs .bs-set .tv-n{order:9;display:block;align-self:center;margin-top:2px;padding:1px 12px;border-radius:9px;border:1px solid #8a6a32;background:linear-gradient(#2c1a36,#140a1c);font:700 11px ${CZ};color:#e8d6a8;letter-spacing:1px}
.bs .bs-set .tv-n.full{color:#1a1000;background:linear-gradient(#fff0b8,#e0b04c);border-color:#fff0b8;box-shadow:0 0 8px #ffd24a}
.bs .bs-sets .tv-sc{container-type:inline-size;height:var(--ch);min-height:0;box-sizing:border-box;padding:3px;display:grid;grid-template-columns:repeat(var(--c),auto);justify-content:center;align-content:center;gap:4px;border-radius:7px;
 background:radial-gradient(circle at 50% 45%,color-mix(in srgb,var(--sc) 10%,#140c1c),#0a060e);box-shadow:inset 0 0 0 1px #00000088,inset 0 0 0 2px color-mix(in srgb,var(--sc) 22%,#2a1a34),inset 0 0 10px #000}
.bs .bs-sets .tv-sc .tv-tile{--tw:min(var(--tmax),calc((100cqw - (var(--c) - 1) * 4px) / var(--c)),calc((var(--ch) - 6px - (var(--r) - 1) * 4px) / var(--r)));width:var(--tw);font-size:calc(var(--tw) * .42)}
.bs .bs-sets .tv-sc .tv-ghost{width:min(calc(var(--ch) - 12px),calc(100cqw - 4px));height:min(calc(var(--ch) - 12px),calc(100cqw - 4px));border:1.5px dashed #5a4a6a;opacity:.35;font-size:20px;border-radius:7px}
/* ---- tiles (sets, other gear, the hideout wardrobe) ---- */
.bs .tv-tile{border-radius:7px;background:radial-gradient(circle at 50% 42%,color-mix(in srgb,var(--rc) 24%,#1a1226),#0e0814 74%)}
/* ---- OTHER GEAR (NO SET): five framed panels ---- */
.bs .tv-oth{display:flex;align-items:center;justify-content:center;gap:12px;margin:6px 0 10px;font:700 21px ${CZ};letter-spacing:2px;color:#f6dc8e;text-shadow:0 2px 0 #000}
.bs .tv-oth:before,.bs .tv-oth:after{content:"";flex:0 1 200px;height:10px;background:radial-gradient(circle at 100% 50%,#f2d27a 0 3px,transparent 3.6px) right center/8px 10px no-repeat,linear-gradient(90deg,transparent,#c9962f) left center/calc(100% - 8px) 2px no-repeat}
.bs .tv-oth:after{transform:scaleX(-1)}.bs .tv-oth .tv-n{font:600 13px Georgia,serif;color:#c9b8a0;letter-spacing:0}
.bs .tv-cols{gap:10px}
.bs .tv-col{padding:8px 9px 10px;border-radius:10px;border:2px solid transparent;background:linear-gradient(#1e1228,#100a16) padding-box,linear-gradient(#e8c06a,#6e4a14 40%,#c9962f 80%,#6e4a14) border-box;box-shadow:inset 0 0 0 1px #000,inset 0 0 16px #000a,0 3px 10px #000a}
.bs .tv-col h4{justify-content:center;gap:7px;margin:0 0 8px;padding-bottom:6px;border-bottom:1px solid #6e4a14aa;font:700 15px ${CZ};letter-spacing:1.5px;color:#f6dc8e;text-shadow:0 1px 0 #000}
.bs .tv-col h4 .tv-n{margin-left:2px;font:600 12px Georgia,serif;color:#a89878}
.bs .tv-tiles{grid-template-columns:repeat(auto-fill,minmax(54px,1fr));gap:6px}
/* ---- the card panel, the hover card, the shop's cards ---- */
.bs .tv-detail{border:2px solid transparent;border-radius:12px;background:linear-gradient(#2e1c3a,#160c1e) padding-box,linear-gradient(#fff0b8,#a8752a 40%,#e0b04c 70%,#6e4a14) border-box;box-shadow:inset 0 0 0 1px #000,0 0 0 1px #000,0 10px 34px #000}
.bs .tv-detail .dn2{font-size:16px}
#tv-hover .tv-card{border-color:#c9962f;background:linear-gradient(#2a1a34,#140a1c);box-shadow:inset 0 0 0 1px #000,0 0 14px #e8b94a33}
/* ---- the foot: BACK TO THE HALL ---- */
.bs .tv-foot{background:none;border-top:none;padding:4px 26px 14px;padding-bottom:calc(14px + env(safe-area-inset-bottom,0px));position:relative;z-index:2}
.bs .tv-foot:before{content:"";position:absolute;left:26px;right:26px;top:0;height:2px;background:linear-gradient(90deg,transparent,#8a5e1c 15%,#e0b04c 50%,#8a5e1c 85%,transparent)}
.bs #tv-defend{min-height:50px;padding:6px 34px 6px 30px;border:2px solid transparent;border-radius:10px;font:700 19px ${CZ};letter-spacing:1.5px;color:#f6e4b0;text-shadow:0 2px 0 #000;
 background:radial-gradient(ellipse at 50% 30%,#3a4a72,#1a2440 70%) padding-box,linear-gradient(#fff3c4,#c9962f 40%,#6e4a14 70%,#e0b04c) border-box;box-shadow:inset 0 0 0 1px #000,inset 0 0 12px #000a,0 0 0 3px #2a1a0a,0 0 0 4px #a8803a,0 6px 16px #000}
.bs #tv-defend:after{content:" \\276F";font-size:15px;margin-left:6px;color:#f6dc8e}
.bs #tv-defend:hover{color:#fff;box-shadow:inset 0 0 0 1px #000,0 0 0 3px #2a1a0a,0 0 0 4px #f6dc8e,0 0 18px #e8b94a88}
/* ---- an iPad, a small laptop ---- */
@media (max-width:1800px){.bs .tv-head .tv-lvl .tv-best{display:none}}
@media (max-width:1600px){.bs .tv-head .tv-lvl #tv-xpt{display:none}}
@media (max-width:1400px){.bs .tv-head{column-gap:80px}.bs .tv-title:before,.bs .tv-title:after{width:66px}.bs .tv-title{font-size:26px;padding:4px 24px 5px}.bs .tv-tabs>button{min-width:110px;padding:0 16px;font-size:15px}#bs-tools .tv-btn{padding:4px 11px;font-size:13px}
 .bs .tv-smat.bs-sets{--ch:66px;--tmax:56px;gap:6px}.bs .bs-set{padding:0 4px 5px}.bs .bs-set .bs-med{width:52px;height:52px;margin-top:-27px}.bs .bs-set{margin-top:26px}.bs .bs-set .bs-sn{font-size:11px;letter-spacing:.5px}
 .bs .tv-card.bs-eq{gap:7px;padding:7px;min-height:84px}.bs .bs-eq .bs-pic{width:62px;height:62px;font-size:30px}.bs .bs-eq .bs-lv{font-size:13px}.bs .bs-eq .bs-sl{font-size:11px;letter-spacing:.5px}.bs .bs-eq .bs-up{width:24px;height:24px;font-size:11px;left:50px;top:-1px}.bs .bs-eq .bs-sl{font-size:10.5px}.bs .bs-eq .nm{font-size:11px}
 .bs .bs-eqrow{gap:7px}.bs .tv-body{padding-left:16px;padding-right:16px}.bs .tv-head{padding-left:18px;padding-right:18px}}
@media (max-width:1240px){.bs .tv-head{column-gap:24px}.bs .tv-title:before,.bs .tv-title:after{display:none}.bs .bs-eqh .bg-head{position:static}.bs .bs-eqh:before,.bs .bs-eqh>.bs-orn{flex-basis:60px}}
@media (max-width:1000px){.bs .tv-head{grid-template-columns:minmax(0,1fr) auto;row-gap:4px}.bs .tv-head .tv-title{grid-column:1/-1;grid-row:1;justify-self:center}.bs .tv-head .tv-lvl{grid-row:2;grid-column:1}.bs .tv-head .bs-right{grid-row:2;grid-column:2}.bs .bs-eqrow{grid-template-columns:repeat(3,minmax(0,1fr))}.bs .tv-smat.bs-sets{grid-template-columns:repeat(5,minmax(0,1fr));row-gap:12px}.bs .tv-cols{grid-template-columns:repeat(3,minmax(0,1fr))}.bs .tv-title .bs-fl{display:none}.bs .bs-div{visibility:hidden;width:0;margin:0}}
@media (max-width:700px){.bs .tv-head{grid-template-columns:minmax(0,1fr) auto;padding:8px 10px 2px}.bs .tv-head .tv-lvl{grid-column:1/-1;grid-row:3}.bs .tv-title{font-size:19px;letter-spacing:2px;padding:3px 12px}.bs .tv-title:before,.bs .tv-title:after{display:none}
 .bs .tv-tabs>button{min-width:0;flex:1;padding:0 6px;font-size:13px;letter-spacing:1px}.bs .bs-div{display:none}#bs-tools{flex-basis:100%;justify-content:center}.bs .bs-eqrow{grid-template-columns:repeat(2,minmax(0,1fr))}.bs .tv-body{padding:6px 8px 90px}
 .bs .tv-cols{grid-template-columns:repeat(2,minmax(0,1fr))}.bs .bs-cn{width:56px;height:56px}.bs #tv-defend{font-size:15px;padding:6px 18px}}
@media (max-height:500px){.bs .tv-title{font-size:17px;padding:2px 14px}.bs .tv-title .bs-mug{font-size:18px}.bs .tv-tabs{padding-top:2px;padding-bottom:4px}.bs .tv-tabs>button{min-height:38px}#bs-tools .tv-btn{min-height:38px}.bs .tv-foot{padding-bottom:6px}.bs #tv-defend{min-height:40px;font-size:15px}}
`;
document.head.appendChild(css);
// ---- the window, re-laid once: plaque, corners, banners, the level line into the head, the tools beside the tabs
function dress(){ const tv=$('tavern'), box=$('tv-box'); if(!tv||!box||tv.classList.contains('bs')) return; tv.classList.add('bs');
  const head=box.querySelector('.tv-head'), title=box.querySelector('.tv-title'), lvl=box.querySelector('.tv-lvl'), tabs=box.querySelector('.tv-tabs');
  if(title) title.innerHTML='<span class="bs-mug">🍺</span><span class="bs-tt">THE TAVERN</span><span class="bs-fl"></span>';
  if(head&&lvl){ head.insertBefore(lvl,head.firstChild); const r=document.createElement('div'); r.className='bs-right'; for(const id of ['tv-gold','tv-close']){ const el=$(id); if(el) r.appendChild(el); } head.appendChild(r); }
  if(tabs&&!$('bs-tools')){ const dv=document.createElement('span'); dv.className='bs-div'; tabs.appendChild(dv); const t=document.createElement('div'); t.id='bs-tools'; tabs.appendChild(t); }
  for(const c of ['tl','tr','bl','br']){ const i=document.createElement('i'); i.className='bs-cn '+c; box.appendChild(i); }
  for(const [c,w] of [['l','Gear Builds Legends'],['r','Good Gear, Better Company']]){ const b=document.createElement('div'); b.className='bs-ban '+c; b.innerHTML='<span></span><b>'+w+'</b><i></i>'; box.appendChild(b); } }
dress();
// ---- the medallion of a set: its pack's stand id ('stand-void', 'stand-crimson' ...) names Matt's picture
const medalKey=n=>{ const P=Meta.packs, pk=P&&P.get&&P.get(n); const id=pk&&pk.unlock&&pk.unlock.id; return id?String(id).replace(/^stand-/,''):null; };
function medal(n){ const k=medalKey(n), P=Meta.packs, pk=(P&&P.get&&P.get(n))||{}; return k?'<img class="bs-med" src="'+ASSET('medal-'+k+'.png')+'" alt="" data-medal="'+k+'" onerror="this.outerHTML=\'<span class=bs-medx>'+(pk.ic||'◆')+'</span>\'">':'<span class="bs-medx">'+(pk.ic||'◆')+'</span>'; }
// a cell's squares: one fills it; two sit side by side; then a row of three, 2x2, 3x2, 4x2, 4x3, 4x4, 5 across
const fitOf=k=>k<=1?[1,1]:k===2?[2,1]:k===3?[3,1]:k===4?[2,2]:k<=6?[3,2]:k<=8?[4,2]:k<=12?[4,3]:k<=16?[4,4]:[5,Math.ceil(k/5)];
// build 441's set grid, re-laid as a column per set (same tiles, same .tv-sh / .tv-sc / .tv-ghost the rest of the game and the tests know)
tvBagSetCols=function(bag){ const P=Meta.packs, ord=P&&P.list?P.list():[], setOf=it=>Meta.bagSetOf(it)||'';
  const tmp=document.createElement('div'); tmp.innerHTML=tvBagCols(bag.filter(it=>setOf(it)),bag); const tiles={}; tmp.querySelectorAll('.tv-tile').forEach(t=>{ tiles[t.dataset.id]=t.outerHTML; });
  let h='<div class="tv-smat bs-sets" style="--n:'+ord.length+'">';
  for(const n of ord){ const pk=P.get(n)||{}, nm=n.replace(/^of (the )?/,''), have=SLOTS.filter(sl=>bag.some(it=>setOf(it)===n&&it.slot===sl)).length;
    h+='<div class="bs-set'+(have?'':' none')+'" data-set="'+tvEsc(n)+'" title="'+tvEsc(nm.replace(/^./,c=>c.toUpperCase()))+' set: '+have+' of 5 pieces in your bag" style="--sc:'+(pk.css||'#bfae90')+'"><div class="tv-sh'+(have?'':' none')+'" title="'+tvEsc(n)+'">'+medal(n)+'<span class="bs-sn">'+tvEsc(nm.toUpperCase())+'</span><span class="tv-n'+(have===5?' full':'')+'">'+have+'/5</span></div>';
    for(const sl of SLOTS){ const here=bag.filter(it=>setOf(it)===n&&it.slot===sl).sort((x,y)=>(y.locked?1:0)-(x.locked?1:0)||(+y.score||0)-(+x.score||0)); const k=here.length, [c,r]=fitOf(k), fit=k<=1?1:k<=2?2:k<=4?4:k<=9?9:16;
      h+='<div class="tv-sc f'+fit+'" data-slot="'+sl+'" style="--sc:'+(pk.css||'#bfae90')+';--c:'+c+';--r:'+r+'">'+(k?here.map(it=>tiles[it.id]||'').join(''):'<div class="tv-ghost" title="No '+tvEsc(nm)+' '+sl+' yet">'+SICON[sl]+'</div>')+'</div>'; }
    h+='</div>'; }
  h+='</div>'; const rest=bag.filter(it=>!setOf(it)); if(rest.length) h+='<div class="tv-oth">OTHER GEAR (NO SET) <span class="tv-n">'+rest.length+'</span></div>'+tvBagCols(rest,bag); return h; };
// ---- the six equipped cards
const F=()=>Meta.forge;
const upsOf=it=>{ const f=F(); try{ return f&&it&&it.stats?f.used(it)|0:0; }catch(e){ return 0; } };
function eqCard(it,o){ // o: {from, slot, label, extra classes, sel}
  const P=Meta.packs, art=P&&P.artHtml?P.artHtml(it):slotIcon(it), u=upsOf(it), B=window.__best;
  let best=''; if(o.from==='eq'&&B&&B.slotState){ const st=B.slotState(o.slot); best=st==='up'?' bg-up':st==='ok'?' bg-ok':''; }
  const badge=best===' bg-up'?'<i class="bg-b" title="Something in your bag beats this">▲</i>':best===' bg-ok'?'<i class="bg-b" title="Nothing in your bag beats this">✓</i>':'';
  const sel=TV.sel&&TV.sel.id===it.id;
  return '<div class="tv-card bs-eq'+best+(o.cls||'')+(sel?' sel':'')+'" data-act="sel" data-id="'+it.id+'" data-from="'+o.from+'"'+(o.from==='eq'?' data-slot="'+o.slot+'"':'')+' style="--rc:'+RCSS[it.rarity]+'" title="'+tvEsc(it.name)+'">'
    +badge+(u?'<b class="bs-up" title="'+u+' forge upgrade'+(u===1?'':'s')+' bought on it">+'+u+'</b>':'')
    +'<div class="bs-pic'+(it.named?' nmd':'')+(it.procd?' prc':'')+'"><span class="ic">'+art+'</span>'+(it.locked?'<i class="lk" title="Locked">🔒</i>':'')+'</div>'
    +'<div class="bs-inf"><div class="bs-sl">'+o.label+'</div><div class="nm" style="color:'+RCSS[it.rarity]+'">'+tvEsc(it.name)+'</div><div class="bs-lv">Lv. '+(it.lvl|0)+'</div><div class="bs-rar" style="color:'+RCSS[it.rarity]+'">'+(it.named?'✦ ':'')+RNAME[it.rarity]+'</div></div></div>'; }
function emptyCard(slot){ const B=window.__best, up=B&&B.slotState&&Meta.bag().some(it=>it.slot===slot&&B.verdict(it)==='up');
  return '<div class="tv-card bs-eq bs-none'+(up?' bg-up':'')+'" data-act="sel" data-id="" data-from="eq" data-slot="'+slot+'" style="--rc:#4a6a4a">'+(up?'<i class="bg-b" title="Your bag has one to put here">▲</i>':'')
    +'<div class="bs-pic"><span class="ic">'+SICON[slot]+'</span></div><div class="bs-inf"><div class="bs-sl">'+SLOT_WORD[slot]+'</div><div class="bs-lv">empty</div></div></div>'; }
// the sixth card: what it shows right now -- {kind:'weapon2'|'pet2'|'open-weapon'|'open-pet'|'blocked'|'locked', it, asleep}
function offState(){ const D=window.__dualwield, R=window.__tworings, w=gear.weapon2, f=gear.familiar2;
  const dOn=!!(D&&D.ringMine&&D.ringMine()), pOn=!!(R&&R.ringOn&&R.ringOn());
  if(w&&dOn) return { kind:'weapon2', it:w, asleep:!(D.dual&&D.dual()) };
  if(f&&pOn) return { kind:'pet2', it:f, asleep:false };
  if(dOn) return { kind:D.mainBlocks&&D.mainBlocks()?'blocked':'open-weapon' };
  if(pOn) return { kind:'open-pet' };
  if(w) return { kind:'weapon2', it:w, asleep:true };   // filed, its ring off: there, asleep
  if(f) return { kind:'pet2', it:f, asleep:true };
  return { kind:'locked' }; }
function offCard(){ const s=offState(), D=window.__dualwield, kic=(D&&D.kindIcon&&D.kindIcon())||'⚔', kw=(D&&D.kindWord&&D.kindWord())||'weapon';
  if(s.it) return eqCard(s.it,{ from:s.kind==='weapon2'?'wpn2':'fam2', label:(s.kind==='weapon2'?'OFF-HAND':'2ND PET')+(s.asleep?' 💤':''), cls:' bs-off'+(s.asleep?' bs-zz':'') }).replace('class="tv-card','id="bs-off" data-off="'+s.kind+(s.asleep?'-asleep':'')+'" class="tv-card');
  const lock=s.kind==='locked', pet=s.kind==='open-pet', blocked=s.kind==='blocked';
  const tip=lock?'Wear a two-weapon ring (Twotimer, Toil-n-Trouble, Tootsie, Bifurcation) or Beast Mode / Malamute and this slot opens':pet?'Pick a pet in your bag, then Equip as 2nd':blocked?'A polearm takes both hands':'Pick a '+kw+' in your bag, then Equip as 2nd';
  return '<div id="bs-off" data-off="'+s.kind+'" class="tv-card bs-eq bs-off bs-none'+(lock?' bs-lock':'')+(blocked?' bs-zz':'')+'" data-act="bsoff" title="'+tvEsc(tip)+'" style="--rc:#4a6a4a">'
    +'<div class="bs-pic"><span class="ic">'+(lock?'💍':pet?'🦉':kic)+'</span></div><div class="bs-inf"><div class="bs-sl">'+(lock?'OFF-HAND / 2ND PET':pet?'2ND PET':'OFF-HAND')+'</div>'
    +'<div class="bs-lv bs-pics">'+(lock?'💍 ➜ '+kic+kic+'<br>💍 ➜ 🦉🦉':blocked?'💤 🔱 ✋✋':'🎒 ➜ '+(pet?'🦉🦉':kic+kic))+'</div></div></div>'; }
// the band: the title with its ornaments and the UPGRADES call, then the six cards -- the 2nd weapon beside the weapon, the 2nd pet beside the familiar
function renderEq(){ const eq=document.querySelector('#tv-bag .tv-eq'); if(!eq) return; const sub=eq.querySelector(':scope > .tv-sub'), head=eq.querySelector(':scope > .bg-head');
  const title=sub?sub.textContent.replace(/\s*·\s*/,' — '):'EQUIPPED'; const s=offState(), pet=s.kind==='pet2'||s.kind==='open-pet';
  const cards=SLOTS.map(sl=>gear[sl]?eqCard(gear[sl],{ from:'eq', slot:sl, label:SLOT_WORD[sl] }):emptyCard(sl)); cards.splice(pet?5:1,0,offCard());
  eq.innerHTML='<div class="bs-eqh"><div class="tv-sub">'+tvEsc(title)+'</div><i class="bs-orn"></i></div><div class="bs-eqrow">'+cards.join('')+'</div>';
  if(head) eq.querySelector('.bs-eqh').appendChild(head); }
// the bag's buttons go up beside the tabs ("BAG" becomes the 🎒 count)
function moveTools(){ const tools=$('bs-tools'); if(!tools) return; const sub=document.querySelector('#tv-bag .tv-bag2 > div:nth-child(2) > .tv-sub'); if(!sub) return;
  const n=sub.querySelector(':scope > .tv-n'); const lead=document.createElement('span'); lead.className='bs-bagn'; lead.title='Pieces in your bag'; lead.textContent='🎒 '; if(n) lead.appendChild(n);
  for(const c of [...sub.childNodes]) if(c.nodeType===3) c.remove(); sub.insertBefore(lead,sub.firstChild); tools.replaceChildren(sub); }
{ const prev=tvRenderBag; tvRenderBag=function(){ const r=prev.apply(this,arguments); dress(); try{ renderEq(); }catch(e){ console.warn('bagstyle eq',e); } try{ moveTools(); }catch(e){ console.warn('bagstyle tools',e); } return r; }; }
// the tools show on the BAG tab only
{ const prev=tvRenderTab; tvRenderTab=function(){ const r=prev.apply(this,arguments); const t=$('bs-tools'), dv=document.querySelector('#tavern .bs-div'), on=TV.tab==='bag'; if(t) t.style.display=on?'':'none'; if(dv) dv.style.display=on?'':'none'; return r; }; }
// the locked / empty sixth card says what opens it; the cards themselves still go through tvClick's 'sel' (eq / wpn2 / fam2)
$('tavern').addEventListener('click',e=>{ const t=e.target.closest&&e.target.closest('[data-act="bsoff"]'); if(!t) return; const k=t.dataset.off, D=window.__dualwield;
  tvSay(k==='locked'?'💍 Wear a two-weapon ring or Beast Mode / Malamute to open this slot':k==='blocked'?'🔱 A polearm takes both hands':'🎒 Pick a '+(k==='open-pet'?'pet':((D&&D.kindWord&&D.kindWord())||'weapon'))+' in your bag, then Equip as 2nd'); });
// hover: a worn card shows its full card too (in every sort, and the sixth card), as a bag tile does
document.addEventListener('mouseover',e=>{ const t=e.target.closest&&e.target.closest('#tv-bag .bs-eq[data-id]'); if(!t||!t.dataset.id) return; const hv=$('tv-hover'); if(!hv) return; const D=t.dataset;
  const it=D.from==='wpn2'?gear.weapon2:D.from==='fam2'?gear.familiar2:SLOTS.map(s=>gear[s]).find(g=>g&&g.id===D.id); if(!it||it.id!==D.id) return;
  hv.innerHTML=tvCard(it,D.from==='eq'?'bag':'eq',D.from==='eq'?tvVs(it):''); hv.style.display='block'; const r=t.getBoundingClientRect(), W=260, H=hv.offsetHeight; const x=Math.min(r.left,innerWidth-W-6); let y=r.bottom+6; if(y+H>innerHeight-8) y=r.top-H-6;
  hv.style.left=Math.max(6,x)+'px'; hv.style.top=Math.max(6,y)+'px'; });
window.__bagstyle={ offState:()=>{ const s=offState(); return { kind:s.kind, id:s.it?s.it.id:null, asleep:!!s.asleep }; }, medalKey, dress, fitOf };
})();
