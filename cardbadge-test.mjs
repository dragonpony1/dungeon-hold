// ===== THE SET BADGE ON A TAVERN CARD (93-gearsets.js, build 252). Matt: "on card thumbnail overlaping type icon". The round set badge used to sit at the card's corner under the 30 px picture (or over the slot icon on a piece
// with no picture); now it sits just below the thumbnail, clear of it, and inside the card. Checked on a set piece with a picture (a mythic), a set piece without one (the Forest's), and a plain piece (no badge).
import { chromium } from "playwright"; import { serve } from "./serve.mjs";
const server=await serve(8891);
const results=[]; const check=(n,ok,d)=>{ results.push(ok); console.log((ok?"PASS ":"FAIL ")+n+(d?"  -> "+d:"")); };
const browser=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]}); const errors=[];
const ctx=await browser.newContext({viewport:{width:1280,height:800}}); await ctx.addInitScript(()=>{ try{ localStorage.setItem("ddSound","off"); localStorage.setItem("ddMapsCleared","1"); }catch(e){} });
const page=await ctx.newPage(); page.on("pageerror",e=>errors.push(String(e)));
await page.goto("http://127.0.0.1:8891/?silent&nogate",{timeout:120000}); await page.waitForFunction(()=>window.__dd&&window.__tavern&&window.__meta&&window.__mythic,null,{timeout:120000}); await page.waitForTimeout(1500);
await page.evaluate(()=>{ const d=window.__dd, M=window.__meta; d.start(); d.step(1/60,20); const P="hideout/assets/hideout/items/";
  const mk=(slot,name,extra)=>{ const it=d.rollItem(2,slot,10); it.name=name; Object.assign(it,extra||{}); M.giveItem(it); return it; };
  mk("weapon","Plain Broadsword"); mk("weapon","Mythic Sword of Shadow",{rarity:5,mythic:true,setId:"shadow",look:"sword",art:P+"sets/shadow-sword.jpg"}); mk("armor","Forest Jerkin of the Forest");
  window.__tavern.open(); window.__tavern.tab("bag"); window.__tavern.render(); });
await page.waitForSelector('#tv-bag .tv-card[data-from="bag"]'); await page.waitForTimeout(1500);
const r=await page.evaluate(()=>{ const box=e=>{ const r=e.getBoundingClientRect(); return {l:r.left,t:r.top,r:r.right,b:r.bottom}; }, hit=(a,b)=>!(a.r<=b.l||b.r<=a.l||a.b<=b.t||b.b<=a.t);
  return [...document.querySelectorAll('#tv-bag .tv-card[data-from="bag"]')].map(c=>{ const bd=c.querySelector('.tv-setbadge'), ic=c.querySelector('.ic'), img=c.querySelector('.ic .ia'); const cb=box(c);
    return { name:c.querySelector('.nm').textContent.trim(), set:!!bd, pic:!!img&&!img.classList.contains('bad'), overlapsIcon:bd&&ic?hit(box(bd),box(ic)):null, inside:bd?(box(bd).l>=cb.l&&box(bd).r<=cb.r&&box(bd).t>=cb.t&&box(bd).b<=cb.b):null, tall:c.classList.contains('tv-set') }; }); });
const set=r.filter(x=>x.set), plain=r.filter(x=>!x.set);
check("two set pieces and a plain piece are in the bag (one set piece with its picture showing)",set.length===2&&plain.length===1&&set.some(x=>x.pic),JSON.stringify(r));
check("on every set card the badge is clear of the thumbnail / slot icon and sits inside the card",set.every(x=>x.overlapsIcon===false&&x.inside===true),JSON.stringify(set.map(x=>[x.name,x.overlapsIcon,x.inside])));
check("a set card is marked tv-set (tall enough for the badge); a plain card is not",set.every(x=>x.tall)&&plain.every(x=>!x.tall));
const realErrors=errors.filter(e=>!/Failed to load resource|favicon/i.test(e)); check("no page errors",realErrors.length===0,realErrors.slice(0,2).join(" | "));
await browser.close(); server.close(); console.log(results.filter(Boolean).length+"/"+results.length+" passed");
