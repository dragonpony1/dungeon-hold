// dev helper: load the built game headless and report what it waits on (slow or failing requests, errors, time to ready)
import { chromium } from "playwright"; import { serve } from "../serve.mjs"; import path from "path";
const SP = path.dirname(decodeURIComponent(new URL(import.meta.url).pathname).replace(/^\/(?=[A-Za-z]:)/, ""));
const dist = process.env.DIST || path.resolve(SP, "../dist"); const port = +process.env.PORT || 8890;
if (process.env.PEER) { const { PeerServer } = await import("peer"); PeerServer({ port: 9452, path: "/peerjs", host: "127.0.0.1" }); console.log("peer server up"); }
const server = await serve(port, { dist });
const browser = await chromium.launch({ args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const page = await browser.newPage(); const t0 = Date.now(); const pending = new Map();
page.on("request", r => pending.set(r, Date.now()));
page.on("requestfinished", r => { const t = Date.now() - pending.get(r); pending.delete(r); if (t > 3000) console.log("slow", t + "ms", r.url()); });
page.on("requestfailed", r => { pending.delete(r); console.log("FAILED", r.url(), r.failure() && r.failure().errorText); });
page.on("pageerror", e => console.log("pageerror", String(e).slice(0, 200)));
page.goto(`http://127.0.0.1:${port}/?silent&nogate`, { waitUntil: "domcontentloaded", timeout: 120000 }).then(() => console.log("domcontentloaded", Date.now() - t0 + "ms"));
try { await page.waitForFunction(() => window.__dd && window.__net, null, { timeout: 120000 }); console.log("game ready", Date.now() - t0 + "ms"); }
catch (e) { console.log("never ready"); }
const loaded = await page.waitForLoadState("load", { timeout: +process.env.WAIT || 150000 }).then(() => true, () => false);
console.log(loaded ? "load event " + (Date.now() - t0) + "ms" : "no load event");
for (const [r, t] of pending) console.log("still pending", Date.now() - t + "ms", r.url().slice(0, 140));
await browser.close(); server.close(); process.exit(0);
