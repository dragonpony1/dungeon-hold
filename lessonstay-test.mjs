// ===== THE SET-PIECE TEACHING STAYS (93-gearsets.js lesson(), build 262). Matt: "the set piece teaching, there is info and tool tips that fade away on their own while iam trying to comprehend them." A lesson used to fade after
// 7-10 seconds; now it stays until it is closed (Enter, or a click on it), a newer lesson replaces it, and only a two-minute safety fades one nobody closed.
import { chromium } from "playwright"; import { serve } from "./serve.mjs";
const server=await serve(8902);
const results=[]; const check=(n,ok,d)=>{ results.push(ok); console.log((ok?"PASS ":"FAIL ")+n+(d?"  -> "+d:"")); };
const browser=await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]});
const page=await browser.newPage({viewport:{width:1100,height:700}}); const errors=[]; page.on("pageerror",e=>errors.push(String(e)));
await page.goto("http://127.0.0.1:8902/?silent&nogate"); await page.waitForFunction(()=>window.__dd&&window.__lesson,null,{timeout:120000});
await page.evaluate(()=>{ window.__dd.start(); window.__dd.step(1/60,20); try{ window.__trainer.skip(); }catch(e){} });
const a=await page.evaluate(()=>{ const d=window.__dd, L=window.__lesson; L.show("First lesson: a set piece is worth more together",8); const on0=L.on(); d.step(1/60,60*15); const on15=L.on(); d.step(1/60,60*60); const on75=L.on(); return { on0, on15, on75, text:L.text(), hint:document.querySelector("#lesson .lh").textContent }; });
check("a lesson is still up 15 seconds and a minute and a quarter after it appeared (it used to fade after 8)",a.on0&&a.on15&&a.on75&&/First lesson/.test(a.text),JSON.stringify(a));
check("it says how to close it",/Enter/.test(a.hint)||/tap/.test(a.hint),a.hint);
const b=await page.evaluate(()=>{ const L=window.__lesson; L.show("Second lesson replaces the first",8); return { text:L.text(), on:L.on() }; });
check("a newer lesson replaces it",/Second/.test(b.text)&&b.on,JSON.stringify(b));
await page.keyboard.press("Enter"); await page.waitForTimeout(100);
const c=await page.evaluate(()=>window.__lesson.on());
check("Enter closes it",c===false,String(c));
await page.evaluate(()=>window.__lesson.show("Third lesson",8)); await page.waitForTimeout(100); await page.evaluate(()=>document.getElementById("lesson").click()); const d=await page.evaluate(()=>window.__lesson.on());
check("a click on it closes it",d===false,String(d));
const e=await page.evaluate(()=>{ const D=window.__dd, L=window.__lesson; L.show("Left up",8); D.step(1/60,60*125); return L.on(); });
check("the two-minute safety fades one nobody closed",e===false,String(e));
const realErrors=errors.filter(e=>!/Failed to load resource|favicon/i.test(e)); check("no page errors",realErrors.length===0,realErrors.slice(0,3).join(" | "));
await browser.close(); server.close(); console.log(results.filter(Boolean).length+"/"+results.length+" passed");
