// dungeon.html = parts/head.html + <script> parts/game.js + parts/modules/*.js (sorted) + </script> tail
import fs from "fs"; import path from "path";
const SP=path.dirname(new URL(import.meta.url).pathname); const P=SP+"/parts";
const head=fs.readFileSync(P+"/head.html","utf8"), tail=fs.readFileSync(P+"/tail.html","utf8"); let game=fs.readFileSync(P+"/game.js","utf8");
const modDir=P+"/modules"; let mods=""; const dirs=process.env.NOMODS?[]:[modDir]; if(process.env.EXTRA) dirs.push(process.env.EXTRA); const names=[];
for(const dir of dirs){ if(!fs.existsSync(dir)) continue; for(const f of fs.readdirSync(dir).filter(f=>f.endsWith(".js")).sort()){ names.push(f); mods+="\n// ===== module: "+f+" =====\n"+fs.readFileSync(dir+"/"+f,"utf8")+"\n"; } }
// modules go in before the test hook so they can extend it; marker is the __dd hook line
const mark="window.__dd={"; const k=game.lastIndexOf(mark); if(k<0) throw new Error("hook marker not found");
const out=head+game.slice(0,k)+mods+game.slice(k)+tail;
let page=out; if(process.env.DIST) page=page.replace("const HAS_ASSETS=/*ASSETS*/false;","const HAS_ASSETS=/*ASSETS*/true;");
// every asset gets a short content stamp; the page appends it as ?v= so a re-exported model is never served from an old cache
if(process.env.DIST){ const crypto=await import("crypto"); const st={}; for(const f of fs.readdirSync(P+"/assets")) st[f]=crypto.createHash("sha1").update(fs.readFileSync(P+"/assets/"+f)).digest("hex").slice(0,8); page=page.replace("const ASSET_STAMPS=/*STAMPS*/{};","const ASSET_STAMPS=/*STAMPS*/"+JSON.stringify(st)+";"); }
// NOEMBED: the big models are not baked into the page; the game fetches them from assets/ instead (see the typeof guards in game.js)
if(process.env.NOEMBED) page=page.replace(/<script>const (SQUIRE|GOBLIN)_GLB_B64="[^"]*";<\/script>\n?/g,"");
// parts/hideout/index.html is the hideout page exactly as its own session ships it (public/hideout.html on the
// hideout-wip branch) -- never edited here, so a newer upstream copy drops straight in. What the game needs from it is
// derived at build time instead: site-root paths made relative (it lives at dist/hideout/, and the site root is not
// "/" on GitHub Pages or the artifact), a settable base for its shared-gear Worker API (?api=https://...), and an
// exit that knows when it's embedded in the game's overlay (59-hideout.js) rather than a page of its own, plus a
// BACK TO THE HALL button on its entry overlay for that case (its own crystal portal starts unplaced, in the hotbar).
// Every rewrite is checked: an upstream change that moves an anchor fails the build loudly, never ships a broken room.
function embedHideout(h){
  if(!(h.match(/["']\/(assets|vendor)\//g)||[]).length) throw new Error("hideout: no site-root asset/vendor paths found -- upstream layout changed?");
  h=h.replace(/(["'])\/(assets|vendor)\//g,"$1$2/");
  if(!(h.match(/fetch\('\/api\/hideout\//g)||[]).length) throw new Error("hideout: no /api/hideout/ fetches found -- upstream layout changed?");
  h=h.replace(/fetch\('\/api\/hideout\//g,"fetch(HIDEOUT_API_BASE+'/api/hideout/");
  const exit="window.location.href = '/';"; if(h.split(exit).length!==2) throw new Error("hideout: the portal's exit ("+exit+") not found exactly once -- upstream changed?");
  h=h.replace(exit,"hideoutLeave();");
  const prelude="<script>/* injected by assemble.mjs (embedHideout) -- not part of the upstream hideout page */\n"
   +"const HIDEOUT_EMBEDDED=window.parent!==window;\n"
   +"const HIDEOUT_API_BASE=(new URLSearchParams(location.search).get('api')||'').replace(/\\/$/,'');\n"
   +"function hideoutLeave(){ if(HIDEOUT_EMBEDDED){ if(document.pointerLockElement) document.exitPointerLock(); window.parent.postMessage({type:'hideout:exit'},'*'); } else window.location.href='../'; }\n"
   +"if(HIDEOUT_EMBEDDED) addEventListener('DOMContentLoaded',()=>{ const s=document.getElementById('start'); if(!s) return; const b=document.createElement('button'); b.id='leaveBtn'; b.textContent='\\u2190 BACK TO THE HALL'; b.style.cssText='display:inline-block;margin-top:22px;cursor:pointer;font:bold 15px Georgia,serif;letter-spacing:1px;color:#fff;background:linear-gradient(#7a2a2e,#3e1416);border:2px solid #e8b94a;border-radius:8px;padding:10px 18px'; b.addEventListener('click',e=>{ e.stopPropagation(); hideoutLeave(); }); s.appendChild(document.createElement('br')); s.appendChild(b); });\n"
   +"</script>\n";
  const k=h.indexOf('<script src="vendor/three.min.js">'); if(k<0) throw new Error("hideout: three.min.js script tag not found -- upstream changed?");
  return h.slice(0,k)+prelude+h.slice(k);
}
let outPath=process.env.OUT||(SP+"/dungeon.html");
// DIST=<dir>: a deployable folder — index.html + assets/ copied from parts/assets
if(process.env.DIST){ const D=process.env.DIST; fs.mkdirSync(D+"/assets",{recursive:true}); const crypto=await import("crypto"); for(const f of fs.readdirSync(P+"/assets")){ if(/\.glb$/.test(f)){ const raw=fs.readFileSync(P+"/assets/"+f), b64=raw.toString("base64"), st=crypto.createHash("sha1").update(raw).digest("hex").slice(0,8); fs.writeFileSync(D+"/assets/"+f+".txt",b64); fs.writeFileSync(D+"/assets/"+f.replace(/\.glb$/,"")+"."+st+".glb.txt",b64); } else fs.copyFileSync(P+"/assets/"+f,D+"/assets/"+f); } outPath=D+"/index.html"; if(fs.existsSync(P+"/hideout")){ fs.cpSync(P+"/hideout",D+"/hideout",{recursive:true}); fs.writeFileSync(D+"/hideout/index.html",embedHideout(fs.readFileSync(P+"/hideout/index.html","utf8"))); } }   // the hideout (parts/hideout/: its own page, vendor/ and models) rides along as dist/hideout/, opened by the game in an overlay (59-hideout.js)   // models are written twice: plain (the fallback) and with their content stamp in the name (what the page asks for)
fs.writeFileSync(outPath,page); const out2=page; console.log("assembled",outPath,out2.length,"bytes, modules:",names.join(", ")||"none");
