// ===== THE THRONE ROOM, SLIMMED (56-thronedecor.js + the fetch layer in game.js): "hardly loads, it does completely load, it's
// just very slow" / "yes pare down the doors if you need to". Map two used to pull 109 MB: its 10 MB door once per gate, the raked
// railing twelve times, the chandelier, rugs and statues once per spot. This suite loads map two cold and checks: the doors stand
// on all four lanes and are the slim hall-door model (the 7.6 MB original is never asked for); no asset URL is requested twice
// during the load; each model placed many times served every placement from its one fetch; the load timer counts exactly the
// bytes that came down; the model bytes stay under a budget; and two asks for a file still in flight share one download.
import { chromium } from "playwright"; import { serve } from "./serve.mjs"; import path from "path";
const SP=path.dirname(new URL(import.meta.url).pathname); const DIST=process.env.DIST||SP+"/dist";
const results=[]; const check=(n,ok,d)=>{ results.push(ok); console.log((ok?"PASS ":"FAIL ")+n+(d?"  -> "+d:"")); };
const PORT=8950, BASE="http://127.0.0.1:"+PORT; const server=await serve(PORT,{dist:DIST});
const BUDGET_MB=52;   // model bytes (base64 as sent) for a cold map-two load: 109.1 MB before the slim pass, 51.3 with each model fetched once, 42.4 with the decor textures as JPEG; the margin covers a few new models, not a door coming back four times
const browser=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]});
const ctx=await browser.newContext({viewport:{width:1100,height:700}}); const page=await ctx.newPage(); const errors=[]; page.on("pageerror",e=>errors.push(String(e)));
await page.addInitScript(()=>{ try{ localStorage.setItem('ddMapsCleared','1'); }catch(e){} });
const reqs={}, sizes={}; let phase="load";
const key=u=>u.replace(/^.*\/assets\//,'').replace(/\?.*$/,'');
page.on("request",r=>{ const u=r.url(); if(!/\/assets\//.test(u)) return; const k=key(u); (reqs[k]=reqs[k]||{load:0,after:0})[phase]++; });
page.on("response",async r=>{ const u=r.url(); if(!/\/assets\//.test(u)) return; try{ const b=await r.body(); (sizes[key(u)]=sizes[key(u)]||[]).push(b.length); }catch(e){} });
await page.goto(BASE+"/?silent&nogate&map=1",{timeout:300000});
const loaded=await page.waitForFunction(()=>window.__loadtime&&window.__loadtime().all!==null&&window.__thronedecor&&window.__thronedecor.doors().length>=4,null,{timeout:600000,polling:250}).then(()=>true).catch(()=>false);
await page.waitForTimeout(1500); phase="after";
const r=await page.evaluate(()=>{ const d=window.__dd; let inWorld=0, lanes=[]; d.scene.traverse(o=>{ if(o.userData&&o.userData.throneDoor){ let vis=true; for(let p=o;p;p=p.parent) if(!p.visible) vis=false; if(vis){ inWorld++; lanes.push(o.userData.throneDoor); } } });
  return {map:d.map().id,lanes:Object.keys(d.lanes()),doors:window.__thronedecor.doors(),used:window.__thronedecor.used(),protos:window.__thronedecor.protos(),inWorld,worldLanes:lanes.sort(),L:window.__loadtime()}; });
const models=Object.keys(reqs).filter(k=>/\.glb\.txt$/.test(k)), stem=k=>k.replace(/\.[0-9a-f]{8}\.glb\.txt$/,'.glb').replace(/\.glb\.txt$/,'.glb');
const reqOf=name=>models.filter(k=>stem(k)===name).reduce((s,k)=>s+reqs[k].load,0);
const modelBytes=models.reduce((s,k)=>s+(sizes[k]||[]).reduce((a,b)=>a+b,0),0), modelReqs=models.reduce((s,k)=>s+reqs[k].load,0);
console.log(JSON.stringify({loaded,map:r.map,doors:r.doors,used:r.used,modelMB:+(modelBytes/1048576).toFixed(1),modelReqs,L:{bytesMB:+(r.L.bytes/1048576).toFixed(1),files:r.L.files,first:r.L.first,soon:r.L.soon,all:r.L.all}}));
check("map two loads to the end (the load timer's 'everything' fires) with its four doors up",loaded&&r.map==='throne',JSON.stringify({loaded,map:r.map}));
check("a door stands on every lane (South, East lower, West, East upper), in the world and visible, each from the slim hall-door model",r.doors.length===4&&r.doors.map(x=>x.lane).sort().join()===r.lanes.slice().sort().join()&&r.lanes.length===4&&r.doors.every(x=>x.model==='hall-door.glb')&&r.inWorld===4&&r.worldLanes.join()===r.lanes.slice().sort().join(),JSON.stringify({lanes:r.lanes,doors:r.doors.map(x=>x.lane+':'+x.model),inWorld:r.inWorld}));
check("the door is fetched once (hall-door), and the 7.6 MB throne-door original is never requested",reqOf('hall-door.glb')===1&&reqOf('throne-door.glb')===0,JSON.stringify({hallDoor:reqOf('hall-door.glb'),throneDoor:reqOf('throne-door.glb')}));
const dups=Object.entries(reqs).filter(([k,v])=>v.load>1).map(([k,v])=>k+' x'+v.load);
check("no asset URL is requested more than once during the map-two load",Object.keys(reqs).length>20&&dups.length===0,dups.length?dups.join(', '):Object.keys(reqs).length+' distinct URLs, each once');
const many={'hall-door.glb':4,'chandelier.glb':3,'throne-railing.glb':12,'throne-rug.glb':3,'throne-statue.glb':2};
const manyOk=Object.entries(many).every(([n,c])=>r.used[n]===c&&reqOf(n)===1);
check("every model placed more than once serves all its placements from one fetch: doors 4, chandeliers 3, railings 12, rugs 3, statues 2",manyOk,JSON.stringify(Object.fromEntries(Object.keys(many).map(n=>[n,{placed:r.used[n],fetched:reqOf(n)}]))));
check("the whole room's decor still arrives (17 models, the seat, statues, window, crest, pillars, sconces, floor, walls, banners, carpet, rugs, doors, chandeliers)",['throne-seat.glb','throne-statue.glb','throne-window.glb','throne-crest.glb','throne-portrait.glb','throne-scepter.glb','hall-door.glb','chandelier.glb','throne-pillar.glb','throne-railing.glb','throne-banister.glb','throne-sconce.glb','throne-floor.glb','throne-panel2.glb','throne-banner2.glb','throne-carpet-tile.glb','throne-rug.glb'].every(n=>r.used[n]>=1),JSON.stringify(r.used));
check("the load timer counts every model byte exactly once: its bytes equal what came down for the models, its files equal the model requests",r.L.bytes===modelBytes&&r.L.files===modelReqs,JSON.stringify({timerBytes:r.L.bytes,modelBytes,timerFiles:r.L.files,modelReqs}));
check("map two's model bytes stay under "+BUDGET_MB+" MB (it was 109.1 MB)",modelBytes>5e6&&modelBytes<BUDGET_MB*1048576,(modelBytes/1048576).toFixed(1)+" MB in "+modelReqs+" model files");
// the fetch layer: two asks for a file still in flight share one download and one count; once it lands, the next ask is a fresh fetch
const f=await page.evaluate(async()=>{ const F=window.__fetchlayer, url=F.asset('smith.glb'); const L0=window.__loadtime(); const a=F.now(url), b=F.now(url); const same=a===b, mid=window.__loadtime().files-L0.files, held=F.inflight().includes(url); const [x,y]=await Promise.all([a,b]);
  const L1=window.__loadtime(); await new Promise(r=>setTimeout(r,50)); const released=!F.inflight().includes(url); const c=F.now(url); const fresh=c!==a; const z=await c; const L2=window.__loadtime();
  return {url,same,mid,held,released,sameBuf:x===y,len:x.byteLength,addBytes:L1.bytes-L0.bytes,files2:L2.files-L0.files,fresh,len2:z.byteLength,inflight:L2.inflight}; });
await page.waitForTimeout(300);
const smithKey=models.concat(Object.keys(reqs)).find(k=>stem(k)==='smith.glb');
check("two asks for a file still in flight share one download (one request, one promise, one byte count); after it lands the entry is let go and the next ask fetches afresh",f.same&&f.mid===1&&f.held&&f.released&&f.sameBuf&&f.len>1e5&&f.addBytes>0&&f.addBytes===(sizes[smithKey]||[])[0]&&f.fresh&&f.files2===2&&f.len2===f.len&&smithKey&&reqs[smithKey].load===0&&reqs[smithKey].after===2,JSON.stringify({...f,requests:smithKey?reqs[smithKey]:null}));
const realErrors=errors.filter(e=>!/Failed to load resource|favicon/i.test(e));
check("no page errors",realErrors.length===0,realErrors.slice(0,5).join(" | "));
await browser.close(); server.close();
console.log(results.filter(Boolean).length+"/"+results.length+" passed");
process.exit(results.some(r=>!r)?1:0);
