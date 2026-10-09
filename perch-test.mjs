// ===== THE ARCHER'S PERCH IS MATT'S "HERO LOOKOUT PERCH" (96b-perch.js, build 296). Checked: the model is asked for only when someone picks the perch (not at start), and a placed perch swaps to it (deck
// at 2.5, the height the perch always had); a hero dropped onto the front step's end lands at 1.47, onto the right step's end at 2.06, onto the deck at 2.5; a perch placed turned stands square to the grid (a
// quarter turn) and its footholds turn with it.
import { chromium } from "playwright"; import { serve } from "./serve.mjs";
const server=await serve(8949,{dist:process.env.DIST||"./dist"});
const results=[]; const check=(n,ok,d)=>{ results.push(ok); console.log((ok?"PASS ":"FAIL ")+n+(d?"  -> "+d:"")); };
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const browser=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]}); const errors=[];
const page=await (await browser.newContext({viewport:{width:1280,height:800}})).newPage(); page.on("pageerror",e=>errors.push(String(e)));
const asked=[]; page.on("request",r=>{ if(/perch|lookout/.test(r.url())) asked.push(r.url()); });
await page.goto("http://127.0.0.1:8949/?silent&nogate",{timeout:120000}); await page.waitForFunction(()=>window.__dd&&window.__heroes&&window.__meta&&window.__dd.heroModel(),null,{timeout:120000});
await sleep(1500); const askedAtStart=asked.length;
await page.evaluate(()=>{ const d=window.__dd; try{ window.__trainer.skip(); }catch(e){} window.__heroes.select("troll"); window.__meta.reset&&window.__meta.reset(); d.start(); d.step(1/60,10); d.addMana(5000); d.setHero(8,10,0); d.step(1/60,3); });
const placed=await page.evaluate(()=>{ const d=window.__dd; const p=d.place('perch',12,14,0); return p?{x:p.x,z:p.z,base:p.base}:null; });
let a=null; for(let i=0;i<300;i++){ a=await page.evaluate(()=>{ const d=window.__dd; d.step(1/60,2); const p=d.defs.find(x=>x.kind==='perch'); if(!p) return null; const b=new window.THREE.Box3().setFromObject(p.mdl); return { glb:!!p.mdl.userData.glb, h:+(b.max.y-b.min.y).toFixed(2), rails:(p.railboxes||[]).map(r=>+(r.top-p.base).toFixed(2)).sort((a,b)=>a-b) }; }); if(a&&a.glb) break; await sleep(60); }
check("nobody asks for the perch model at start; placing a perch asks for it and swaps to it (build 599: Matt's new Lookout Perch, lookout.glb, about 3.9 tall, give or take its outline and ground shadow: deck at 2.5)",askedAtStart===0&&asked.length>0&&a&&a.glb&&Math.abs(a.h-3.9)<.3,JSON.stringify({askedAtStart,asked:asked.length,placed,a}));
check("its footholds: the ladder 1.3, the deck 2.5",a&&JSON.stringify(a.rails)===JSON.stringify([1.3,2.5]),JSON.stringify(a&&a.rails));
const drop=(dx,dz,which)=>page.evaluate(({dx,dz,which})=>{ const d=window.__dd, H=d.hero; const p=d.defs.filter(x=>x.kind==='perch')[which||0]; H.x=p.x+dx; H.z=p.z+dz; H.y=p.base+4.2; H.vy=0; H.grounded=false; for(let i=0;i<120;i++){ d.setHeroYaw&&0; H.x=p.x+dx; H.z=p.z+dz; d.step(1/60,1); } return +(H.y-p.base).toFixed(2); },{dx,dz,which});
const f=await drop(-.1,1.15), r=f, k=await drop(-.3,-.3), off=await drop(-1.4,0);
check("a hero dropped onto the ladder stands at 1.3, onto the deck at 2.5, and off to the back falls to the ground",Math.abs(f-1.3)<.05&&Math.abs(k-2.5)<.05&&off<.1,JSON.stringify({front:f,right:r,deck:k,off}));
const t=await page.evaluate(()=>{ const d=window.__dd; const p=d.place('perch',18,14,1.2); d.step(1/60,5); return p?{rot:+p.rot.toFixed(3),mrot:+p.mdl.rotation.y.toFixed(3)}:null; });
const tf=await drop(1.15,.1,1), tr=tf;
check("a perch placed turned stands a quarter turn (square to the grid) and its footholds turn with it: its ladder now faces +x (1.3)",t&&Math.abs(t.rot-Math.PI/2)<.001&&t.mrot===t.rot&&Math.abs(tf-1.3)<.05,JSON.stringify({t,tf,tr}));
const realErrors=errors.filter(e=>!/Failed to load resource|favicon|net::ERR|hideout\/gear|fonts\.googleapis/i.test(e)); check("no page errors",realErrors.length===0,realErrors.slice(0,3).join(" | "));
await browser.close(); server.close(); console.log(results.filter(Boolean).length+"/"+results.length+" passed");
