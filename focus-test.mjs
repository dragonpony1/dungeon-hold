// ===== THE FOCUS + THE BOW (build 625, hideout 104). Matt: "if i am going thru the campaign ill never complete the chaos set until i finish the campaign and come back to the thrown room"
// -> "yes build both, the pin and the bow call it a focus instead of a pin". Checked: tap a set in the hall's book and it is the FOCUS (the ribbon, "pages on every map"); on the Cloister about half
// the pages go to it, the rest stay Shadow/Wind; its page card wears the ribbon; tap again drops it; learning the set's last blueprint drops it; the hideout's book focuses the same way;
// the Blacksmith offers a Bow, a Ranger's default, and a forged "Mythic Bow of Chaos" is a bow the Ranger can wield.
import { chromium } from "playwright"; import { serve } from "./serve.mjs";
const server=await serve(8936,{dist:process.env.DIST||"./dist"});
const results=[]; const check=(n,ok,d)=>{ results.push(!!ok); console.log((ok?"PASS ":"FAIL ")+n+(d?"  -> "+d:"")); };
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const browser=await chromium.launch({args:["--use-angle=d3d11","--enable-gpu","--ignore-gpu-blocklist"]}); const errors=[];
const page=await (await browser.newContext({viewport:{width:1280,height:800}})).newPage(); page.on("pageerror",e=>errors.push(String(e)));
await page.route("**/api/**",r=>r.fulfill({status:200,contentType:"application/json",body:"{}"}));
await page.addInitScript(()=>{ try{ if(sessionStorage.getItem('__fo')) return; sessionStorage.setItem('__fo','1'); localStorage.setItem("ddSound","off"); localStorage.setItem("ddMapsCleared","9"); localStorage.setItem("dd_trainer",JSON.stringify({done:{},off:true})); localStorage.setItem("ddHero","troll");
  localStorage.setItem("dd_recipes",JSON.stringify({seeded:1,seededH:1,seededBoss:1,known:{"of Chaos|weapon":1,"of Chaos|armor":1,"of Chaos|amulet":1,"of Chaos|charm":1},pages:{},named:{},trophies:{},bosses:{}})); }catch(e){} });
await page.goto("http://127.0.0.1:8936/?silent&nogate&map=2",{timeout:120000}); await page.waitForFunction(()=>window.__dd&&window.__recipes&&window.__blueprints&&window.__hideout,null,{timeout:120000});
await page.evaluate(()=>{ window.__dd.start(); window.__dd.step(1/60,5); window.__blueprints.open(); }); await sleep(600);
await page.click('#bpBook td.bset[data-set="of Chaos"]'); await sleep(400);
const A=await page.evaluate(()=>{ const td=document.querySelector('#bpBook td.bset[data-set="of Chaos"]'); return { focus:window.__recipes.focus(), fo:td.classList.contains('fo'), rb:!!td.querySelector('.rb'), txt:td.textContent, done:!!document.querySelector('#bpBook td.bset[data-set="of Chaos"]') }; });
check("tap Chaos in the hall's book: it is the focus, its row wears the ribbon and says pages on every map",A.focus==='of Chaos'&&A.fo&&A.rb&&/pages on every map/.test(A.txt),JSON.stringify(A));
const B=await page.evaluate(()=>{ const R=window.__recipes; let ch=0, home=0, other=0; for(let i=0;i<2000;i++){ const k=R.pickKey(); if(/^of Chaos\|familiar$/.test(k)) ch++; else if(/^of (Shadow|the Wind)\|/.test(k)) home++; else other++; } return { ch, home, other }; });
check("on the Cloister about half the pages go to the focus (Chaos's one unknown, the pet), the rest stay Shadow/Wind",B.ch>850&&B.ch<1150&&B.home+B.ch===2000,JSON.stringify(B));
const C=await page.evaluate(()=>{ const R=window.__recipes; R.pageCard('of Chaos|familiar',1); const a=R.pageCardHtml(); R.pageCard('of Shadow|armor',1); const b=R.pageCardHtml(); return { chaos:/class="rb"/.test(a), shadow:/class="rb"/.test(b) }; });
check("a focus page's corner card wears the ribbon; another set's doesn't",C.chaos&&!C.shadow,JSON.stringify(C));
await page.click('#bpBook td.bset[data-set="of Chaos"]'); await sleep(300);
const D=await page.evaluate(()=>({ focus:window.__recipes.focus() }));
check("tap it again: the focus is dropped",D.focus===null,JSON.stringify(D));
const E=await page.evaluate(()=>{ const R=window.__recipes; R.setFocus('of Chaos'); const before=R.focus(); R.learn('of Chaos|familiar','pages',true); return { before, after:R.focus(), refuse:R.setFocus('of Chaos') }; });
check("learning the set's last blueprint drops the focus, and a finished set can't be focused",E.before==='of Chaos'&&E.after===null&&E.refuse===false,JSON.stringify(E));
await page.evaluate(()=>window.__blueprints.close());
// the hideout: its book focuses the same way; the Blacksmith's Bow
await page.evaluate(async()=>{ window.__hideout.open(); window.__dd.step(1/60,2); for(let i=0;i<80&&!window.__hideout.frameWin();i++) await new Promise(r=>setTimeout(r,100)); }); await sleep(4000);
const F=await page.evaluate(()=>{ const w=window.__hideout.frameWin(); w.eval('openRecipeBook()'); const d=w.document; const td=d.querySelector('#forgeBook td.bset.tap[data-set="of Shadow"]'); if(td) td.click(); const td2=d.querySelector('#forgeBook td.bset[data-set="of Shadow"]');
  const focus=JSON.parse(localStorage.getItem('dd_recipes')).focus; return { focus, fo:!!(td2&&td2.classList.contains('fo')), sub:d.querySelector('#forgeBook .bsub').textContent }; });
check("the hideout's book: tap Shadow and it is the focus there too (the same save the game rolls from)",F.focus==='of Shadow'&&F.fo&&/focus it/.test(F.sub),JSON.stringify(F));
const G=await page.evaluate(()=>{ const w=window.__hideout.frameWin(); const r=w.eval("({ hero:heroWeapon(), looks:SET_ART_PIECES.weapon.slice(), word:WEAPON_WORD.bow, rec:setPieceRecord('weapon','crimson',null,'normal','bow') })");
  w.eval("forgeSelected='weapon'; forgeSet='crimson'; forgeNamed=null; forgeWeapon=null; buildForgeWtype();"); const btns=[...w.document.querySelectorAll('#forgeWtype button')].map(b=>b.textContent+(b.classList.contains('sel')?'*':''));
  const it={ slot:'weapon', name:r.rec.name, art:r.rec.art }; return { hero:r.hero, looks:r.looks, name:r.rec.name, art:r.rec.art, btns, wt:window.__emblem.wtypeOf(it), wield:window.__emblem.canWield(it) }; });
check("the Blacksmith: Sword / Staff / Polearm / Bow, the Ranger's pick is the Bow, and a forged Mythic Bow of Chaos is a bow the Ranger can wield",G.hero==='bow'&&G.looks.includes('bow')&&G.btns.includes('Bow*')&&G.name==='Mythic Bow of Chaos'&&G.art==='bow'&&G.wt==='bow'&&G.wield===true,JSON.stringify(G));
const real=errors.filter(e=>!/Failed to load resource|favicon|net::ERR|fonts\.googleapis/i.test(e)); check("no page errors",real.length===0,real.slice(0,3).join(" | "));
await browser.close(); server.close(); console.log(results.filter(Boolean).length+"/"+results.length+" passed"); process.exit(results.every(Boolean)?0:1);
