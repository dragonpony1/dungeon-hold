// ===== FORGED GEAR SHOWS ITS PICTURE IN THE BAG (build 596; parts/staging/93-gearsets.js fixArt). Matt: "on my mythic polearm of fire why isn't it showing the thumb?" /
// "6/7 and rootsplitter showing generic thumbs". A piece made in the hideout's forge can carry its picture as the hideout page wrote it ("assets/hideout/items/...", no hideout/ in front)
// or just its kind ("polearm"). Checked: those come out as the real picture paths (and each loads), a game-made piece is unchanged; no page errors.
import { chromium } from "playwright"; import { serve } from "./serve.mjs";
const DIST=process.env.DIST||"./dist"; const server=await serve(8869,{dist:DIST});
const results=[]; const check=(n,ok,d)=>{ results.push(!!ok); console.log((ok?"PASS ":"FAIL ")+n+(d?"  -> "+d:"")); };
const browser=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]}); const errors=[];
const ctx=await browser.newContext(); await ctx.addInitScript(()=>{ try{ localStorage.setItem("ddMapsCleared","9"); }catch(e){} });
const page=await ctx.newPage(); page.on("pageerror",e=>errors.push(String(e)));
await page.route("**/api/**",r=>r.fulfill({status:200,contentType:"application/json",body:"{}"}));
await page.goto("http://127.0.0.1:8869/?silent&nogate&map=0",{timeout:120000}); await page.waitForFunction(()=>window.__dd&&window.__meta&&window.__mythic,null,{timeout:120000});
const R=await page.evaluate(async()=>{ const P=window.__meta.packs;
  const forged=[ {slot:'weapon',named:'sixseven',tier:'named',name:'6/7',rarity:5,art:'assets/hideout/items/named/sixseven.jpg',stats:{dmg:1}},
    {slot:'weapon',named:'rootsplitter',tier:'named',name:'Rootsplitter',rarity:5,art:'assets/hideout/items/named/rootsplitter.jpg',stats:{dmg:1}},
    {slot:'weapon',tier:'mythic',mythic:true,name:'Mythic Polearm of Fire',rarity:5,art:'assets/hideout/items/sets/lava-polearm.jpg',stats:{dmg:1}},
    {slot:'weapon',named:'sixseven',name:'6/7',rarity:5,art:'polearm',stats:{dmg:1}} ];
  const pics=forged.map(it=>P.art(it)); const loads=await Promise.all(pics.map(src=>new Promise(r=>{ const im=new Image(); im.onload=()=>r(im.naturalWidth>0); im.onerror=()=>r(false); im.src=src; })));
  const game=window.__mythic.normalize({tier:'named',named:'sixseven',lvl:10}); return { pics, loads, game:P.art(game) }; });
check("forged pieces (6/7, Rootsplitter, a Mythic Polearm of Fire) get their real pictures, and each loads",R.pics.every(p=>/^hideout\/assets\/hideout\/items\//.test(p))&&R.loads.every(Boolean)&&/named\/sixseven\.jpg$/.test(R.pics[3]),JSON.stringify(R));
check("a game-made named piece is unchanged",R.game==='hideout/assets/hideout/items/named/sixseven.jpg',R.game);
check("no page errors",errors.length===0,JSON.stringify(errors.slice(0,3)));
await browser.close(); server.close(); console.log(results.filter(Boolean).length+"/"+results.length+" passed"); process.exit(results.every(Boolean)?0:1);
