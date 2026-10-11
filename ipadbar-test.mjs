// ===== THE TOWER BAR CLEAR OF SAFARI'S TOOLBAR (build 629, head.html --hudlift). Matt, on an iPad: "On the iPad the windowed mode is covering the bottom, can't select towers" / "This is safari".
// Checked: as iPad Safari (an iPad's user agent, touch) the whole HUD stands at least 70 up from the bottom, so the tower bar sits above the toolbar and its buttons can be tapped;
// on a PC the tower bar is exactly where it always was (14 from the bottom).
import { chromium, devices } from "playwright"; import { serve } from "./serve.mjs";
const server=await serve(8941,{dist:process.env.DIST||"./dist"});
const results=[]; const check=(n,ok,d)=>{ results.push(!!ok); console.log((ok?"PASS ":"FAIL ")+n+(d?"  -> "+d:"")); };
const browser=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]}); const errors=[];
async function look(opts){ const ctx=await browser.newContext(opts); const p=await ctx.newPage(); p.on("pageerror",e=>errors.push(String(e)));
  await p.route("**/api/**",r=>r.fulfill({status:200,contentType:"application/json",body:"{}"}));
  await ctx.addInitScript(()=>{ try{ localStorage.setItem("ddSound","off"); localStorage.setItem("ddMapsCleared","9"); localStorage.setItem("dd_trainer",JSON.stringify({done:{},off:true})); }catch(e){} });
  await p.goto("http://127.0.0.1:8941/?silent&nogate&map=1",{timeout:120000}); await p.waitForFunction(()=>window.__dd&&document.getElementById('hotbar'),null,{timeout:120000});
  await p.evaluate(()=>{ window.__dd.start(); window.__dd.step(1/60,5); }); await new Promise(r=>setTimeout(r,500));
  const r=await p.evaluate(()=>{ const hb=document.getElementById('hotbar').getBoundingClientRect(), b=[...document.querySelectorAll('#hotbar > *')].find(x=>x.getBoundingClientRect().width>0); const br=b&&b.getBoundingClientRect(); const top=br?document.elementFromPoint(br.left+br.width/2,br.top+br.height/2):null;
    return { lift:window.__hudLift, h:innerHeight, gapBelow:Math.round(innerHeight-hb.bottom), btnHit:!!(top&&b&&(top===b||b.contains(top))), first:b&&(b.tagName+'.'+b.className+'#'+b.id), top:top&&(top.tagName+'.'+top.className+'#'+top.id) }; });
  if(process.env.SHOTS) await p.screenshot({path:process.env.SHOTS+"/ipad-"+(opts.hasTouch?"ipad":"pc")+".png"}); await ctx.close(); return r; }
const IPAD={ viewport:{width:1180,height:760}, userAgent:"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.0 Safari/605.1.15", hasTouch:true, isMobile:false, deviceScaleFactor:2 };
const A=await look(IPAD);
check("as iPad Safari the tower bar stands at least 70 clear of the bottom (Safari's toolbar), and its button takes a tap",A.lift>=70&&A.gapBelow>=80&&A.btnHit,JSON.stringify(A));
const B=await look({ viewport:{width:1280,height:800} });
check("on a PC nothing moves: the tower bar is 14 from the bottom as ever",B.lift===0&&B.gapBelow===14,JSON.stringify(B));
const real=errors.filter(e=>!/Failed to load resource|favicon|net::ERR|fonts\.googleapis/i.test(e)); check("no page errors",real.length===0,real.slice(0,3).join(" | "));
await browser.close(); server.close(); console.log(results.filter(Boolean).length+"/"+results.length+" passed"); process.exit(results.every(Boolean)?0:1);
