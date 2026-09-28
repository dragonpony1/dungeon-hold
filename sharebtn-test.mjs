import { chromium } from "playwright"; import { serve } from "./serve.mjs";
// build 212: the share button -- title-screen pill + pause card; the share sheet gets everything in `text`, no `url`; clipboard where there's no sheet
const server=await serve(8871);
const results=[]; const check=(n,ok,d)=>{ results.push(ok); console.log((ok?"PASS ":"FAIL ")+n+(d?"  -> "+d:"")); };
const browser=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]});
const errors=[];
async function open(vp,mobile){ const ctx=await browser.newContext({viewport:vp,isMobile:!!mobile,hasTouch:!!mobile}); const page=await ctx.newPage(); page.on("pageerror",e=>errors.push(String(e)));
  await page.goto("http://127.0.0.1:8871/?silent&nogate"); await page.waitForFunction(()=>window.__dd&&window.__share&&window.__pause,null,{timeout:60000}); return {ctx,page}; }
const place=page=>page.evaluate(()=>{ const b=document.getElementById("sharebtn"), h=document.querySelector("#start h1"); const r=b.getBoundingClientRect(), q=h.getBoundingClientRect(); const cs=getComputedStyle(b);
  const hit=!(r.right<=q.left||r.left>=q.right||r.bottom<=q.top||r.top>=q.bottom); return {vis:cs.display!=="none"&&cs.visibility!=="hidden"&&r.width>0,inView:r.left>=0&&r.right<=innerWidth&&r.top>=0&&r.bottom<=innerHeight,hitsTitle:hit,label:b.textContent,box:[r.left,r.top,r.right,r.bottom].map(Math.round),title:[q.left,q.top,q.right,q.bottom].map(Math.round),noScroll:document.documentElement.scrollWidth<=innerWidth}; });
// computer: the pill sits in the corner, clear of the title
{ const {ctx,page}=await open({width:1280,height:720});
  const p=await place(page); check("title screen: SHARE pill visible in the top corner, clear of the ROOTGATE title (computer)",p.vis&&p.inView&&!p.hitsTitle&&p.label==="📤 SHARE",JSON.stringify(p));
  // a phone-style share sheet: title + text, the link inside the text, no separate url field; the title screen stays put
  const r1=await page.evaluate(async()=>{ const calls=[]; navigator.share=d=>{ calls.push(d); return Promise.resolve(); }; document.getElementById("sharebtn").click(); await new Promise(r=>setTimeout(r,50)); return {calls,phase:window.__dd.S.phase}; });
  const c=r1.calls[0]||{};
  check("tapping it opens the share sheet with the link in the text (no url field), and doesn't start the game",r1.calls.length===1&&c.title==="Rootgate"&&!("url" in c)&&/https:\/\/dragonpony1\.github\.io\/dungeon-hold\//.test(c.text||"")&&/Add to Home Screen/.test(c.text||"")&&r1.phase==="start",JSON.stringify(r1));
  check("a local copy shares the real public address, and nothing from the address bar rides along",!/127\.0\.0\.1|silent|nogate/.test(c.text||""),c.text);
  // backing out of the sheet is not a failure: no copy, no label change
  const r2=await page.evaluate(async()=>{ let copied=0; navigator.share=()=>Promise.reject(new DOMException("cancelled","AbortError")); Object.defineProperty(navigator,"clipboard",{configurable:true,value:{writeText:()=>{ copied++; return Promise.resolve(); }}}); const b=document.getElementById("sharebtn"); b.click(); await new Promise(r=>setTimeout(r,80)); return {copied,label:b.textContent}; });
  check("backing out of the share sheet does nothing (no copy, no error)",r2.copied===0&&r2.label==="📤 SHARE",JSON.stringify(r2));
  // no share sheet (most computers): the whole message goes on the clipboard, the pill says so, and a second tap mid-flash can't strand the label
  const r3=await page.evaluate(async()=>{ const got=[]; navigator.share=undefined; Object.defineProperty(navigator,"clipboard",{configurable:true,value:{writeText:t=>{ got.push(t); return Promise.resolve(); }}}); const b=document.getElementById("sharebtn");
    b.click(); await new Promise(r=>setTimeout(r,60)); const l1=b.textContent; b.click(); await new Promise(r=>setTimeout(r,60)); const l2=b.textContent; await new Promise(r=>setTimeout(r,1800)); return {got:got.length,first:got[0],l1,l2,after:b.textContent}; });
  check("no share sheet: the message is copied, the pill flashes ✓ COPIED and goes back to 📤 SHARE (even after a second tap)",r3.got===2&&/dungeon-hold/.test(r3.first||"")&&r3.l1==="✓ COPIED"&&r3.l2==="✓ COPIED"&&r3.after==="📤 SHARE",JSON.stringify({got:r3.got,l1:r3.l1,l2:r3.l2,after:r3.after}));
  // the pause card carries it too
  const r4=await page.evaluate(async()=>{ const d=window.__dd; d.start(); d.step(1/60,5); const opened=window.__pause.open(); const calls=[]; navigator.share=x=>{ calls.push(x); return Promise.resolve(); }; const b=document.querySelector('#pause [data-act="share"]'); const vis=!!b&&b.getBoundingClientRect().height>0; if(b) b.click(); await new Promise(r=>setTimeout(r,50)); return {opened,vis,label:b&&b.textContent,calls:calls.length,stillOpen:window.__pause.isOpen()}; });
  check("pause card: 📤 SHARE ROOTGATE opens the same share sheet and leaves the card open",r4.opened&&r4.vis&&r4.label==="📤 SHARE ROOTGATE"&&r4.calls===1&&r4.stillOpen,JSON.stringify(r4));
  await ctx.close(); }
// phone: small pill, still clear of the title, nothing scrolls sideways
{ const {ctx,page}=await open({width:390,height:844},true);
  const p=await place(page); check("title screen: SHARE pill visible and clear of the title on a phone, no sideways scroll",p.vis&&p.inView&&!p.hitsTitle&&p.noScroll,JSON.stringify(p));
  await ctx.close(); }
const realErrors=errors.filter(e=>!/Failed to load resource|favicon/i.test(e));
check("no page errors",realErrors.length===0,realErrors.slice(0,3).join(" | "));
await browser.close(); server.close(); console.log(results.filter(Boolean).length+"/"+results.length+" passed");
