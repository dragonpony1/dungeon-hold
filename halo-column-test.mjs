// ===== THE HALO COLUMNS: each of the four elemental halos stands a see-through column on its ring (game.js, auraRing) -- 2.4 tall, strongest at the floor and gone by the top, no depth write so it
// never hides what walks through it. Build 305 (Matt: "i want the aura on the aura rings to be darker still"): no longer an added glow (which only lightens, and read near-white on the lit halls' floors) but
// a DEEP version of the halo's own colour (deepAura: darker, more saturated) laid over the floor, faded by an alpha ramp. It grows with the ring (each mark's reach), breathes a
// little, and brightens slightly while a mob stands inside. The totem and frost spire keep their own aura (no column).
import { chromium } from "playwright"; import { serve } from "./serve.mjs"; import path from "path";
const SP=path.dirname(decodeURIComponent(new URL(import.meta.url).pathname).replace(/^\/(?=[A-Za-z]:)/,"")); const DIST=process.env.DIST||SP+"/dist";
const results=[]; const check=(n,ok,d)=>{ results.push(ok); console.log((ok?"PASS ":"FAIL ")+n+(d?"  -> "+d:"")); };
const PORT=8907, BASE="http://127.0.0.1:"+PORT;
const server=await serve(PORT,{dist:DIST});
const browser=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]});
const errors=[]; const page=await browser.newPage(); page.on("pageerror",e=>errors.push(String(e)));
await page.goto(BASE+"/?silent&nogate",{timeout:90000}); await page.waitForFunction(()=>window.__dd&&window.__meta&&window.__defglb,null,{timeout:60000});
await page.evaluate(()=>{ window.__freeze=true; window.__dd.start(); window.__dd.step(1/60,3); });
const placeNear=kind=>page.evaluate(kind=>{ const d=window.__dd; d.S.mana=99999; const before=d.defs.length; const h=d.hero; for(let dz=2;dz<=12&&d.defs.length===before;dz++) for(let dx=-8;dx<=8&&d.defs.length===before;dx++){ try{ d.placeDefAt(kind,h.x+dx,h.z+dz,0); }catch(e){} } d.step(1/60,40); const nd=d.defs[d.defs.length-1]; return d.defs.length>before?{i:d.defs.length-1,kind:nd.kind,x:nd.x,z:nd.z}:null; },kind);
const column=i=>page.evaluate(i=>{ const d=window.__dd, def=d.defs[i]; const a=def.mdl.userData.aura; if(!a) return {aura:false}; const c=a.userData.column; if(!c) return {aura:true,column:false};
  const ws=new THREE.Vector3(); c.getWorldScale(ws); const g=c.geometry; const am=c.material.alphaMap, img=am&&am.image; let fadeBottom=-1, fadeTop=-1; if(img&&img.getContext){ const x=img.getContext('2d'); fadeTop=x.getImageData(0,0,1,1).data[0]/255; fadeBottom=x.getImageData(0,img.height-1,1,1).data[0]/255; }   // the canvas's top row is the column's top (flipY)
  const hsl={}; c.material.color.getHSL(hsl);
  return {aura:true,column:true,color:c.material.color.getHex(),opacity:+c.material.opacity.toFixed(3),additive:c.material.blending===THREE.AdditiveBlending,depthWrite:c.material.depthWrite,transparent:c.material.transparent,alphaMap:!!am,light:+hsl.l.toFixed(3),noOL:!!c.userData.noOL,open:g.parameters.openEnded,height:g.parameters.height,radiusWorld:+ws.x.toFixed(2),heightWorld:+(ws.y*g.parameters.height).toFixed(2),range:d.stat(def,'range'),fadeBottom:+fadeBottom.toFixed(2),fadeTop:+fadeTop.toFixed(2),y:+c.position.y.toFixed(2)}; },i);
await page.evaluate(()=>window.__dd.setHero(40,60));
const HALOS={zap:0x7fd8ff,venom:0x8ef05a,ember:0xff6a2a,dazzle:0xffd060};
const placed={};
for(const kind in HALOS){ const p=await placeNear(kind); placed[kind]=p; check("a "+kind+" halo goes down near the hero",!!p&&p.kind===kind,JSON.stringify(p)); }
for(const kind in HALOS){ const c=await column(placed[kind].i); const deep=await page.evaluate(h=>{ const k=new THREE.Color(h), l={}; k.getHSL(l); return new THREE.Color().setHSL(l.h,1,Math.min(l.l,.30)).convertSRGBToLinear().getHex(); },HALOS[kind]);   // game.js deepAura's rule
  check(kind+": the halo's aura carries a column in a DEEP version of the halo's own colour (builds 305-306: a deep, fully saturated version, lightness at most .38; build 326: .30 -- \"more color\")",c.column&&c.color===deep&&c.light<=.305,JSON.stringify({got:c.color,deep,light:c.light}));
  check(kind+": see-through and laid over the floor -- normal blending (not an added glow), no depth write, opacity about .56 at rest (build 326, was .42), no outline",c.column&&!c.additive&&!c.depthWrite&&c.transparent&&c.opacity>.45&&c.opacity<.66&&c.noOL,JSON.stringify({op:c.opacity,add:c.additive,dw:c.depthWrite}));
  check(kind+": an open 2.4-tall cylinder standing on the floor, strongest at the base and faded to nothing at the top",c.open&&c.height===2.4&&c.y===1.2&&c.alphaMap&&c.fadeBottom>.9&&c.fadeTop<.05,JSON.stringify({open:c.open,h:c.height,y:c.y,fb:c.fadeBottom,ft:c.fadeTop}));
  check(kind+": the column's radius is the halo's reach ("+c.range+") and its height stays 2.4 in the world",Math.abs(c.radiusWorld-c.range)<.05&&Math.abs(c.heightWorld-2.4)<.05,JSON.stringify({r:c.radiusWorld,range:c.range,h:c.heightWorld})); }
// a mark up: the ring and its column grow with the reach
{ const i=placed.zap.i; const before=await column(i);
  const up=await page.evaluate(i=>{ const d=window.__dd, def=d.defs[i]; d.S.mana=99999; const l0=def.lvl; d.upgradeDef({x:def.x,z:def.z}); d.step(1/60,40); return {l0,l1:def.lvl,range:d.stat(def,'range')}; },i);
  const after=await column(i);
  check("Mark II Storm Halo: the column grew to the new reach ("+up.range+")",up.l1===up.l0+1&&after.radiusWorld>before.radiusWorld&&Math.abs(after.radiusWorld-up.range)<.05&&Math.abs(after.heightWorld-2.4)<.05,JSON.stringify({before:before.radiusWorld,after:after.radiusWorld,up})); }
// a mob inside: stronger, still see-through
{ const i=placed.ember.i; const p=placed.ember;
  const idle=await page.evaluate(i=>{ const d=window.__dd; for(const e of d.enemies) e.dead=true; d.step(1/60,1); return d.defs[i].mdl.userData.aura.userData.column.material.opacity; },i);
  const lit=await page.evaluate(({i,x,z})=>{ const d=window.__dd; const e=d.spawn('goblin','N'); e.x=x+.5; e.z=z; e.hp=1e9; d.step(1/60,1); return {op:d.defs[i].mdl.userData.aura.userData.column.material.opacity,inside:Math.hypot(e.x-x,e.z-z)<d.stat(d.defs[i],'range')}; },{i,x:p.x,z:p.z});
  check("a goblin standing in the Ember Halo: its column grows stronger (by about .14), and stays see-through",lit.inside&&lit.op-idle>.08&&lit.op<.76,JSON.stringify({idle:+idle.toFixed(3),lit:+lit.op.toFixed(3)})); }
// not everything with an aura gets one
for(const kind of ['totem','frost']){ const p=await placeNear(kind); const c=p?await column(p.i):null; check("the "+kind+" keeps its own aura (ring, spinner, plume) -- no column",!!c&&c.aura&&!c.column,JSON.stringify(c)); }
const realErrors=errors.filter(e=>!/Failed to load resource|favicon/i.test(e));
check("no page errors",realErrors.length===0,realErrors.slice(0,5).join(" | "));
await browser.close(); server.close();
console.log(results.filter(Boolean).length+"/"+results.length+" passed");
process.exit(results.some(r=>!r)?1:0);
