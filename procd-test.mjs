// ===== PROC'D GEAR (build 243, hideout build 51): only the forge makes it (its proc, the named mythic result); +35% on the primary stat; the card says PROC'D GEAR and shows the primary stat gold; worn, it gives the
// wearer a golden particulate glow; arriving in the bag it plays the synthesized fanfare.
import { chromium } from "playwright"; import { serve } from "./serve.mjs";
const server=await serve(8884);
const results=[]; const check=(n,ok,d)=>{ results.push(ok); console.log((ok?"PASS ":"FAIL ")+n+(d?"  -> "+d:"")); };
const browser=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]}); const errors=[]; const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const page=await (await browser.newContext()).newPage(); page.on("pageerror",e=>errors.push(String(e)));
await page.goto("http://127.0.0.1:8884/?silent&nogate",{timeout:90000}); await page.waitForFunction(()=>window.__dd&&window.__meta&&window.__mythic&&window.__procglow&&window.__hideout,null,{timeout:90000});
await page.evaluate(()=>{ const d=window.__dd; d.start(); d.step(1/60,20); window.__meta.reset(); d.resetGear&&d.resetGear(); });
const n=await page.evaluate(()=>{ const M=window.__mythic; const plain=M.normalize({tier:"named",named:"rootsplitter"}), pd=M.normalize({tier:"named",named:"rootsplitter",procd:true});
  const pl=M.normalize({tier:"named",named:"mossheart_aegis",procd:true}); return { plain:plain.stats, pd:pd.stats, pdFlag:pd.procd, primary:pd.primary, plainFlag:!!plain.procd, armor:pl.stats, armorPrimary:pl.primary }; });
check("a proc'd named mythic gets +35% on its primary stat (Rootsplitter's dmg 30 -> 40.5) and nothing else; a plain one is untouched",n.plain.dmg===30&&n.pd.dmg===40.5&&n.pd.hp===n.plain.hp&&n.pdFlag&&n.primary==="dmg"&&!n.plainFlag,JSON.stringify(n));
check("the primary is the first stat of the piece (an armor's hp: 170 -> 229.5)",n.armorPrimary==="hp"&&n.armor.hp===229.5,JSON.stringify({p:n.armorPrimary,hp:n.armor.hp}));
const txt=await page.evaluate(()=>{ const it=window.__mythic.normalize({tier:"named",named:"rootsplitter",procd:true}); const plain=window.__mythic.normalize({tier:"named",named:"rootsplitter"}); return { s:window.statStr?window.statStr(it):null, html:window.__procHtml("✦PROC'D GEAR✦ · ✦+40.5 dmg✦ · +90 hp"), plainHas:/PROC/.test(document.body.innerHTML) }; });
// statStr is a game-scope function: read it through the card the game builds
const card=await page.evaluate(()=>{ const M=window.__mythic, meta=window.__meta; const it=M.normalize({tier:"named",named:"rootsplitter",procd:true}); meta.giveItem(it); const plain=M.normalize({tier:"named",named:"last_lantern"}); meta.giveItem(plain); meta.open(); const tab=document.querySelector('#tavern [data-tab="bag"]'); if(tab) tab.click();
  const cards=[...document.querySelectorAll('#tavern .tv-card')].map(c=>({html:c.innerHTML,text:c.textContent})); return { cards:cards.length, pd:cards.find(c=>/Rootsplitter/.test(c.text)), plain:cards.find(c=>/Last Lantern/.test(c.text)), id:it.id }; });
check("the tavern card says PROC'D GEAR and shows the primary stat in the gold .procstat span; a plain named card does neither",!!card.pd&&/PROC'D GEAR/.test(card.pd.text)&&/class="procstat"/.test(card.pd.html)&&!!card.plain&&!/PROC/.test(card.plain.text)&&!/procstat/.test(card.plain.html),JSON.stringify({pd:card.pd&&card.pd.text,plain:card.plain&&card.plain.text}));
check("__procHtml turns the star markers into the gold decorated span",/<b class="procstat">\+40\.5 dmg<\/b>/.test(txt.html)&&/<b class="procstat">PROC'D GEAR<\/b>/.test(txt.html),txt.html);
await page.evaluate(()=>window.__tavern.close());
const glow=await page.evaluate(()=>{ const d=window.__dd, meta=window.__meta; const id=meta.bag().find(b=>b.procd).id; const off=window.__procglow.own().on; meta.equip(id); d.step(1/60,5); const on=window.__procglow.own().on, n=window.__procglow.own().n; const worn=window.__procglow.worn();
  const plainId=meta.bag().find(b=>!b.procd&&b.named).id; meta.equip(plainId); d.step(1/60,5); const stillOn=window.__procglow.own().on;   // the lantern is a weapon too: it replaced the proc'd one
  return { off, on, n, worn, afterSwap:stillOn }; });
check("wearing a proc'd piece turns on the golden particulate glow (18 motes); it is off with nothing proc'd worn, and off again when the proc'd piece is swapped out",glow.off===false&&glow.on===true&&glow.n===18&&glow.worn===true&&glow.afterSwap===false,JSON.stringify(glow));
const fan=await page.evaluate(()=>{ const meta=window.__meta; const a0=window.__procglow.arrived(); const it=window.__mythic.normalize({tier:"named",named:"voidwoven_mantle",procd:true}); const ok=meta.onPickup(it); const plain=window.__mythic.normalize({tier:"named",named:"wardens_oath"}); meta.onPickup(plain); return { ok, n:window.__procglow.arrived()-a0, locked:!!meta.bag().find(b=>b.id===it.id).locked }; });
check("a proc'd piece arriving in the bag plays the synthesized fanfare once (a plain named one does not, here) and auto-locks like every fancy piece",fan.ok&&fan.n===1&&fan.locked,JSON.stringify(fan));
// ---- the forge side (hideout build 51), through the game's overlay
await page.evaluate(()=>{ window.__dd.setHero(30,30); window.__hideout.open(); });
let f=null; for(let i=0;i<400&&!f;i++){ f=page.frames().find(x=>x.url().includes("hideout/index.html")); if(!f) await sleep(50); }
await f.waitForFunction(()=>typeof namedRecord==='function'&&typeof pieceFromForged==='function'&&typeof sfxProcd==='function',null,{timeout:120000});
const forge=await f.evaluate(()=>{ const out={ recs:[] }; for(const t of ['weapon','armor','amulet','trinket','familiar']){ try{ const r=namedRecord(t); const base=NAMED_MYTHICS[r.named].stats, pk=Object.keys(base)[0]; out.recs.push({ t, procd:r.procd, primary:r.primary===pk, boosted:r.stats[pk]===Math.round(base[pk]*1.35*10)/10, others:Object.keys(base).slice(1).every(k=>r.stats[k]===base[k]) }); }catch(e){ out.recs.push({t,err:String(e)}); } }
  const r=namedRecord('weapon'); const piece=pieceFromForged(r); const g=toGameItem({kind:'forged',rec:r}); out.sub=piece.sub; out.tip=/PROC'D GEAR/.test(piece.tip); out.game={procd:g.procd,primary:g.primary}; out.html=statHtml(r.stats,r.primary); out.sfx=typeof sfxProcd; return out; });
check("the forge's proc (namedRecord) makes proc'd gear for every kind of piece: flagged, +35% on the primary stat only",forge.recs.length>=4&&forge.recs.filter(x=>!x.err).every(x=>x.procd&&x.primary&&x.boosted&&x.others),JSON.stringify(forge.recs));
check("its card says Proc'd gear, its tooltip says PROC'D GEAR, it is handed to the game with its flag and primary, and the primary stat is gold",/Proc'd gear/.test(forge.sub)&&forge.tip&&forge.game.procd===true&&!!forge.game.primary&&/class="procstat"/.test(forge.html)&&forge.sfx==="function",JSON.stringify({sub:forge.sub,game:forge.game}));
const realErrors=errors.filter(e=>!/Failed to load resource|favicon|net::ERR|hideout\/gear|fonts\.googleapis/i.test(e)); check("no page errors",realErrors.length===0,realErrors.slice(0,3).join(" | "));
await browser.close(); server.close(); console.log(results.filter(Boolean).length+"/"+results.length+" passed");
