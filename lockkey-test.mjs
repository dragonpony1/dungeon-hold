// ===== L LOCKS AND UNLOCKS A BAG PIECE (96m-lockkey.js, build 340). Matt: "is there a hot key that toggles lock and unlock" -> "yeah L to unlock or lock item in bag". Checked: with the bag open (B),
// L flips the lock on the piece under the mouse, else the selected one; pressed again it unlocks; the card shows the 🔒 and the button says (L); the same on the character sheet (Tab); a worn piece is
// refused with a word and left alone; L with nothing pointed at says to point at a piece; L does nothing in the play view or while typing in a text box; no page errors.
import { chromium } from "playwright"; import { serve } from "./serve.mjs";
const server=await serve(8996,{dist:process.env.DIST||"./dist"});
const results=[]; const check=(n,ok,d)=>{ results.push(ok); console.log((ok?"PASS ":"FAIL ")+n+(d?"  -> "+d:"")); };
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const browser=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]}); const errors=[];
const ctx=await browser.newContext({viewport:{width:1280,height:860}}); await ctx.addInitScript(()=>{ try{ localStorage.setItem("ddMapsCleared","9"); localStorage.setItem("ddSound","off"); }catch(e){} });
const page=await ctx.newPage(); page.on("pageerror",e=>errors.push(String(e)));
await page.goto("http://127.0.0.1:8996/?silent&nogate",{timeout:120000}); await page.waitForFunction(()=>window.__dd&&window.__meta&&window.__tavern&&window.__doll&&window.__lockkey,null,{timeout:120000});
const ids=await page.evaluate(()=>{ const d=window.__dd, M=window.__meta; try{ window.__trainer.skip(); }catch(e){} M.reset(); d.resetGear(); d.start(); d.step(1/60,5);
  const mk=(r,n)=>{ const it=d.rollItem(r,'weapon',4); it.rarity=r; it.name=n; it.locked=false; delete it.locked; M.giveItem(it); return it.id; }; const worn=d.rollItem(2,'armor',3); worn.name='Worn Mail'; M.giveItem(worn); M.equip(worn.id);
  return { a:mk(2,'Sword A'), b:mk(3,'Sword B'), worn:worn.id }; });
const lockedNow=id=>page.evaluate(id=>window.__meta.isLocked(id),id); const press=()=>page.evaluate(()=>{ window.dispatchEvent(new KeyboardEvent('keydown',{code:'KeyL',bubbles:true,cancelable:true})); });
const hover=sel=>page.evaluate(sel=>{ const el=document.querySelector(sel); if(!el) return false; el.dispatchEvent(new MouseEvent('mouseover',{bubbles:true})); return true; },sel);
// 1. the bag: select a piece, press L
await page.evaluate(id=>{ window.__tavern.open(); window.__tavern.tab('bag'); window.__tavern.select(id,'bag'); },ids.a); await sleep(250);
const btn0=await page.evaluate(()=>{ const b=document.querySelector('#tv-detail [data-act="lock"]'); return b&&b.textContent; });
await press(); await sleep(200);
const a1=await lockedNow(ids.a), btn1=await page.evaluate(()=>{ const b=document.querySelector('#tv-detail [data-act="lock"]'); return b&&b.textContent; }), card1=await page.evaluate(id=>!!document.querySelector('#tavern .tv-card[data-id="'+id+'"] .tv-lock'),ids.a);
check("with a piece selected in the bag, L locks it: the piece is locked, its card wears the 🔒, and the button now says Unlock (L) (it said Lock (L))",a1&&card1&&/Lock \(L\)/.test(btn0||'')&&/Unlock \(L\)/.test(btn1||''),JSON.stringify({a1,card1,btn0,btn1}));
await press(); await sleep(200); const a2=await lockedNow(ids.a);
check("L again unlocks it",a2===false,String(a2));
// 2. the piece under the mouse wins over the selected one
await hover('#tavern .tv-card[data-id="'+ids.b+'"]'); await press(); await sleep(200);
const b1=await lockedNow(ids.b), a3=await lockedNow(ids.a);
check("pointing at another piece and pressing L locks THAT one (not the selected one)",b1&&!a3,JSON.stringify({b1,a3}));
await press(); await sleep(100);
// 3. a worn piece is refused
await hover('#tavern .tv-card[data-from="eq"][data-id="'+ids.worn+'"]'); const wornBefore=await lockedNow(ids.worn); await press(); await sleep(150);
const wornAfter=await lockedNow(ids.worn), msg=await page.evaluate(()=>(document.getElementById('toast')||document.querySelector('.toast')||{}).textContent||document.body.innerText.slice(-300));
check("L on a piece you are wearing changes nothing (a bag piece only)",wornBefore===wornAfter&&!wornAfter&&/bag/i.test(msg),JSON.stringify({wornBefore,wornAfter}));
await page.evaluate(()=>window.__tavern.close());
// 4. the character sheet
await page.evaluate(id=>{ window.__doll.open(); window.__doll.select(id,'bag'); },ids.b); await sleep(300);
await press(); await sleep(200); const s1=await lockedNow(ids.b), sb=await page.evaluate(()=>{ const b=document.querySelector('#doll [data-act="lock"]'); return b&&b.textContent; });
check("on the character sheet (Tab), L flips the selected piece too (and the button reads (L))",s1===true&&/Unlock \(L\)|UNLOCK \(L\)/i.test(sb||''),JSON.stringify({s1,sb}));
await press(); await sleep(150); const s2=await lockedNow(ids.b);
check("...and unlocks it again",s2===false,String(s2));
await page.evaluate(()=>window.__doll.close()); await sleep(150);
// 5. no bag open: L does nothing; typing in a text box: L does nothing
await press(); const none=await lockedNow(ids.a);
const typing=await page.evaluate(id=>{ window.__tavern.open(); window.__tavern.tab('bag'); window.__tavern.select(id,'bag'); const inp=document.createElement('input'); document.body.appendChild(inp); inp.focus(); window.dispatchEvent(new KeyboardEvent('keydown',{code:'KeyL',bubbles:true,cancelable:true})); const r=window.__meta.isLocked(id); inp.remove(); window.__tavern.close(); return r; },ids.a);
check("with no bag or sheet open L does nothing, and typing an L in a text box does not lock anything",none===false&&typing===false,JSON.stringify({none,typing}));
const realErrors=errors.filter(x=>!/Failed to load resource|favicon|net::ERR|hideout\/gear|fonts\.googleapis/i.test(x)); check("no page errors",realErrors.length===0,realErrors.slice(0,3).join(" | "));
await browser.close(); server.close(); console.log(results.filter(Boolean).length+"/"+results.length+" passed");
