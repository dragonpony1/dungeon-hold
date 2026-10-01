// ===== GEAR ENDINGS THAT MEAN SOMETHING (build 400; parts/game.js STAT_SUFFIX / honestSuffix). Matt: "can we make the suffix's make sense on regular gear?"
// Checked: every ordinary drop above the lowest rarity ends in the name of its strongest stat (by the game's stat weights) and never "of the ..." (those are sets); a piece saved with one of the old random endings
// is renamed once on load (a set piece and a named piece are left alone, and the rename does not run twice); no page errors.
import { chromium } from "playwright"; import { serve } from "./serve.mjs";
const server=await serve(8991,{dist:process.env.DIST||"./dist"});
const results=[]; const check=(n,ok,d)=>{ results.push(ok); console.log((ok?"PASS ":"FAIL ")+n+(d?"  -> "+d:"")); };
const browser=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]}); const errors=[];
const ctx=await browser.newContext({viewport:{width:1100,height:700}});
await ctx.addInitScript(()=>{ try{ if(sessionStorage.getItem('__sfx')) return; sessionStorage.setItem('__sfx','1'); localStorage.removeItem('dd_suffix_v1'); localStorage.removeItem('dd_suffix_v2'); localStorage.setItem('ddSound','off');
  localStorage.setItem('dd_sfx_probe',JSON.stringify({ bag:[ {id:'a',slot:'weapon',rarity:1,lvl:5,name:'Fine Broadsword of Embers',stats:{dmg:7,spd:10}}, {id:'b',slot:'armor',rarity:2,lvl:10,name:'Runed Chainmail of Vigor',stats:{hp:80,def:17,regen:2.5}},
    {id:'c',slot:'armor',rarity:5,setId:'earth',name:'Runed Chainmail of Thorns',stats:{hp:30}}, {id:'d',slot:'weapon',rarity:5,named:'sixseven',name:'Storm Halberd of Fury',stats:{dmg:9}}, {id:'e',slot:'charm',rarity:0,name:'Rusty Charm',stats:{tow:5}} ] })); }catch(e){} });
const page=await ctx.newPage(); page.on("pageerror",e=>errors.push(String(e)));
await page.goto("http://127.0.0.1:8991/?silent&nogate",{timeout:120000}); await page.waitForFunction(()=>window.__dd&&window.__suffix&&window.__dd.heroModel(),null,{timeout:120000});
const A=await page.evaluate(()=>{ const d=window.__dd, S=window.__suffix, M=S.map(); const bad=[]; let n=0, theOf=0; const armor={};
  for(let i=0;i<300;i++){ const it=d.rollItem(1+(i%4)); if(it.rarity<1) continue; n++; let best=null, bv=-1; for(const k in it.stats){ const v=it.stats[k]/S.mean(k,it.lvl,it.rarity); if(v>bv){ bv=v; best=k; } } if(it.slot==='armor'||it.slot==='amulet'){ const e=it.name.split(' of ').pop(); armor[e]=(armor[e]||0)+1; } if(!it.name.endsWith(' '+M[best])) bad.push(it.name+' '+JSON.stringify(it.stats)); if(/ of the /.test(it.name)) theOf++; }
  const ar=Object.values(armor), at=ar.reduce((p,q)=>p+q,0); return { n, bad:bad.slice(0,4), nbad:bad.length, theOf, armor, armorKinds:ar.length, topShare:+(Math.max(...ar)/at).toFixed(2), sample:[d.rollItem(2,'weapon').name,d.rollItem(2,'armor').name,d.rollItem(2,'charm').name,d.rollItem(2,'familiar').name] }; });
check("every ordinary drop ends in the name of the stat it rolled best for its level and rarity, never 'of the ...' (a set); armor and amulets get a mix of endings (build 402: they were all 'of Vigor')",A.n>200&&A.nbad===0&&A.theOf===0&&A.armorKinds>=3&&A.topShare<.6,JSON.stringify(A));
const B=await page.evaluate(()=>{ const v=JSON.parse(localStorage.getItem('dd_sfx_probe')); return { names:v.bag.map(x=>x.name), flag:localStorage.getItem('dd_suffix_v2'), renamed:window.__suffixRenamed }; });
check("a saved piece with an old random ending is renamed for its strongest stat (sword: its damage rolled best -> of Goblin Slaying; mail, once 'of Vigor': its armor rolled best -> of Stone); a set piece, a named piece and a plain one are left alone",
  B.names[0]==='Fine Broadsword of Goblin Slaying'&&B.names[1]==='Runed Chainmail of Stone'&&B.names[2]==='Runed Chainmail of Thorns'&&B.names[3]==='Storm Halberd of Fury'&&B.names[4]==='Rusty Charm'&&B.flag==='1'&&B.renamed===2,JSON.stringify(B));
await page.evaluate(()=>{ const v=JSON.parse(localStorage.getItem('dd_sfx_probe')); v.bag[0].name='Fine Broadsword of Embers'; localStorage.setItem('dd_sfx_probe',JSON.stringify(v)); }); await page.reload(); await page.waitForFunction(()=>window.__dd&&window.__suffix,null,{timeout:120000});
const C=await page.evaluate(()=>({ name:JSON.parse(localStorage.getItem('dd_sfx_probe')).bag[0].name, renamed:window.__suffixRenamed }));
check("the rename runs once only (the next load leaves the saves alone)",C.name==='Fine Broadsword of Embers'&&C.renamed===undefined,JSON.stringify(C));
check("no page errors",errors.length===0,JSON.stringify(errors.slice(0,3)));
await page.evaluate(()=>localStorage.removeItem('dd_sfx_probe')); await browser.close(); server.close(); console.log(results.filter(Boolean).length+"/"+results.length+" passed"); process.exit(results.every(Boolean)?0:1);
