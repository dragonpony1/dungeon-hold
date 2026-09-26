// ===== THE MAIN MENU, tidied for a beginner (build 133): one essentials line, the two pickers (map, hero), ENTER THE
// HALL first, the other buttons, and everything else -- all controls, the mechanics paragraphs, the testing line --
// folded into a closed ALL CONTROLS & HOW IT WORKS section at the bottom. A touch device gets touch wording.
import { chromium } from "playwright"; import { serve } from "./serve.mjs"; import path from "path";
const SP=path.dirname(new URL(import.meta.url).pathname); const DIST=process.env.DIST||SP+"/dist";
const results=[]; const check=(n,ok,d)=>{ results.push(ok); console.log((ok?"PASS ":"FAIL ")+n+(d?"  -> "+d:"")); };
const PORT=8911, BASE="http://127.0.0.1:"+PORT;
const server=await serve(PORT,{dist:DIST});
const browser=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]});
const errors=[];
async function open(ctx){ const p=await ctx.newPage(); p.on("pageerror",e=>errors.push(String(e))); await p.goto(BASE+"/?silent&nogate",{timeout:90000}); await p.waitForFunction(()=>window.__dd&&window.__campaign&&window.__hideout,null,{timeout:60000}); return p; }
const ctx=await browser.newContext({viewport:{width:1100,height:760}}); const page=await open(ctx);
const m=await page.evaluate(()=>{ const st=document.getElementById('start'); const kids=[...st.children]; const id=e=>e.id||(e.tagName+(e.className?'.'+e.className.split(' ')[0]:'')); const order=kids.map(id);
  const ess=document.getElementById('essentials'); const fold=document.getElementById('howto'); const test=document.getElementById('testline');
  const vis=e=>!!e&&(e.checkVisibility?e.checkVisibility():e.offsetParent!==null);   /* a closed <details> keeps layout boxes for its content (content-visibility), so rects lie; checkVisibility tells the truth */
  return {order,ess:ess&&ess.textContent.replace(/\s+/g,' ').trim(),essFirst:kids.indexOf(ess)<kids.indexOf(document.getElementById('mapline')),foldOpen:fold&&fold.open,foldParas:fold?fold.querySelectorAll('p').length:0,foldAfterButtons:kids.indexOf(fold)>kids.indexOf(document.getElementById('coopRow')),testInFold:!!(test&&fold&&fold.contains(test)),testVisible:vis(test),foldSummary:fold&&fold.querySelector('summary').textContent,playBeforeTav:kids.indexOf(document.getElementById('playbtn'))<kids.indexOf(document.getElementById('tavbtn')),hideoutAfterTav:kids.indexOf(document.getElementById('hideoutbtn'))===kids.indexOf(document.getElementById('tavbtn'))+1,standalone:!!document.querySelector('#standalone a[href*="github.io/dungeon-hold"]'),buildline:document.getElementById('buildline').textContent}; });
check("one essentials line sits under the title, before the map picker: move, look, swing, place a defense, the horn, 'the rest is taught on map one'",m.essFirst&&/W A S D move/.test(m.ess)&&/number keys place a defense/.test(m.ess)&&/G sounds the horn/.test(m.ess)&&/taught on map one/.test(m.ess),m.ess);
check("the old three paragraphs (controls, building, tavern/mana/gold/roots) live in a folded section that is closed by default, below the buttons",m.foldOpen===false&&m.foldParas>=3&&m.foldAfterButtons&&/ALL CONTROLS/.test(m.foldSummary),JSON.stringify({open:m.foldOpen,paras:m.foldParas,after:m.foldAfterButtons,summary:m.foldSummary}));
check("the 🧪 testing line is inside that fold, so a new player never sees it (testers open the fold)",m.testInFold&&!m.testVisible,JSON.stringify({inFold:m.testInFold,visible:m.testVisible}));
check("ENTER THE HALL comes before TAVERN, THE HIDEOUT right after TAVERN, and the standalone link is on the page",m.playBeforeTav&&m.hideoutAfterTav&&m.standalone,JSON.stringify(m.order));
// opening the fold shows the testing line and the paragraphs; the campaign's own test hook still reads it
const opened=await page.evaluate(()=>{ const fold=document.getElementById('howto'); fold.open=true; const test=document.getElementById('testline'); return {visible:test.checkVisibility?test.checkVisibility():test.offsetParent!==null,line:window.__campaign.test().line}; });
check("opening the fold reveals the testing line, and the campaign hook still reads it",opened.visible&&/testing/.test(opened.line),JSON.stringify(opened));
// a fresh player: the Knight is picked and the only open card; the other three are locked (🔒, 'hold your first hall to unlock') and a click on one does nothing
const fresh=await page.evaluate(()=>{ const cards=[...document.querySelectorAll('#heroline .hcard')]; const locked=cards.filter(c=>c.classList.contains('locked')).map(c=>c.dataset.hero); const sel=cards.filter(c=>c.classList.contains('sel')).map(c=>c.dataset.hero); const lk=cards.find(c=>c.classList.contains('locked')); lk.click(); return {pick:window.__heroes.pick(),sel,locked:locked.sort(),lockText:lk.querySelector('.hs').textContent,hasLockIcon:!!lk.querySelector('.lk'),pickAfterClick:window.__heroes.pick(),toast:document.getElementById('toast').textContent}; });
check("a fresh player is the Gnome Knight: its card is picked, the other three are locked with a 🔒 and 'hold your first hall to unlock', and clicking a locked card does not pick it",fresh.pick==='knight'&&fresh.sel.join()==='knight'&&fresh.locked.join()==='fighter,troll,witch'&&fresh.hasLockIcon&&/hold your first hall/i.test(fresh.lockText)&&fresh.pickAfterClick==='knight'&&/unlock/i.test(fresh.toast),JSON.stringify(fresh));
// with map one held, every hero is open
await page.evaluate(()=>{ try{ localStorage.setItem('ddMapsCleared','1'); }catch(e){} }); await page.reload({timeout:90000}); await page.waitForFunction(()=>window.__dd&&window.__campaign&&window.__hideout,null,{timeout:60000});
// the hero picker: a card per hero with a portrait rendered from its own model; the picked one is marked; a click picks
const hero=await page.evaluate(async()=>{ const cards=[...document.querySelectorAll('#heroline .hcard')]; if(cards.some(c=>c.classList.contains('locked'))) return {n:-1,imgs:[],names:[],lockedStill:true}; await Promise.all(cards.map(c=>{ const im=c.querySelector('img'); return im.complete?null:new Promise(r=>{ im.onload=r; im.onerror=r; }); })); const pick=window.__heroes.pick(); const sel=cards.filter(c=>c.classList.contains('sel'));
  const other=cards.find(c=>c.dataset.hero!==pick); other.click(); await new Promise(r=>setTimeout(r,50)); const cards2=[...document.querySelectorAll('#heroline .hcard')];
  return {n:cards.length,imgs:cards.map(c=>{ const im=c.querySelector('img'); return {src:im.getAttribute('src'),w:im.naturalWidth,h:im.naturalHeight}; }),pickBefore:pick,selBefore:sel.map(c=>c.dataset.hero),clicked:other.dataset.hero,pickAfter:window.__heroes.pick(),selAfter:cards2.filter(c=>c.classList.contains('sel')).map(c=>c.dataset.hero),names:cards.map(c=>c.querySelector('.hn').textContent)}; });
check("with map one held the picker is four open cards, each with a portrait that loaded (assets/hero-<id>.png) and a name",hero.n===4&&hero.imgs.every(i=>/^assets\/hero-[a-z]+\.png$/.test(i.src)&&i.w>0&&i.h>0)&&hero.names.every(n=>n.length>3),JSON.stringify(hero.imgs));
check("the picked hero's card is marked, and clicking another card picks that hero",hero.selBefore.join()===hero.pickBefore&&hero.pickAfter===hero.clicked&&hero.selAfter.join()===hero.clicked,JSON.stringify({before:hero.pickBefore,clicked:hero.clicked,after:hero.pickAfter,sel:hero.selAfter}));
// the game still starts from the tidy menu
const started=await page.evaluate(()=>{ document.getElementById('playbtn').click(); return window.__dd.S.phase; });
check("ENTER THE HALL still enters the hall",started==='build',started);
// a visible way out: the ⏸ button on the HUD opens the pause menu, which has RETURN TO TITLE SCREEN
const pause=await page.evaluate(()=>{ const b=document.getElementById('pausebtn'); const vis=b&&b.getBoundingClientRect().width>0; b.click(); const open=window.__pause.isOpen(); const back=[...document.querySelectorAll('#pause button')].some(x=>/RETURN TO TITLE/.test(x.textContent)); return {vis,open,back}; });
check("in the hall a ⏸ button sits by the sound button; it opens the pause menu, which offers RETURN TO TITLE SCREEN (no need to close the tab)",pause.vis&&pause.open&&pause.back,JSON.stringify(pause));
const musb=await page.evaluate(()=>{ window.__pause.close&&window.__pause.close(true); const b=document.getElementById('musbtn'); return {vis:!!b&&b.getBoundingClientRect().width>0,title:b&&b.title}; });
check("a 🎵 music button sits by them too",musb.vis&&/Music/.test(musb.title),JSON.stringify(musb));
await ctx.close();
// touch wording
const tctx=await browser.newContext({viewport:{width:900,height:600},hasTouch:true,isMobile:true}); const tp=await open(tctx);
const te=await tp.evaluate(()=>({touch:document.body.classList.contains('touch')||!!document.querySelector('.touch'),ess:document.getElementById('essentials').textContent.replace(/\s+/g,' ').trim()}));
check("a touch device gets the touch essentials (joystick, drag, ⚔, tap a hotbar slot, 📯)",/joystick move/.test(te.ess)&&/tap a hotbar slot/.test(te.ess)&&/📯 sounds the horn/.test(te.ess),te.ess);
await tctx.close();
const realErrors=errors.filter(e=>!/Failed to load resource|favicon/i.test(e));
check("no page errors",realErrors.length===0,realErrors.slice(0,5).join(" | "));
await browser.close(); server.close();
console.log(results.filter(Boolean).length+"/"+results.length+" passed");
process.exit(results.some(r=>!r)?1:0);
