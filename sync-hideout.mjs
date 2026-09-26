// Pull the hideout page and its assets from the hideout-wip branch into parts/hideout/, byte for byte, and record the
// upstream hash in parts/hideout/UPSTREAM. The other session owns that branch (public/hideout.html, its vendor/ and
// public/assets/hideout/); this repo never edits the copy -- assemble.mjs derives the embedded variant at build time.
// Usage: node sync-hideout.mjs        (REF=origin/hideout-wip by default; pass REF=<hash> to pin)
import { execSync } from "child_process"; import fs from "fs"; import path from "path";
const SP=path.dirname(new URL(import.meta.url).pathname); const REF=process.env.REF||"origin/hideout-wip";
const sh=c=>execSync(c,{cwd:SP,encoding:"utf8",maxBuffer:64*1024*1024});
if(!process.env.REF) sh("git fetch origin +refs/heads/hideout-wip:refs/remotes/origin/hideout-wip");
const hash=sh("git rev-parse --short "+REF).trim();
const files=sh("git ls-tree -r --name-only "+REF).split("\n").filter(f=>f==="public/hideout.html"||f.startsWith("public/assets/hideout/")||f.startsWith("public/vendor/"));
let n=0; for(const f of files){ const dest=path.join(SP,"parts/hideout",f==="public/hideout.html"?"index.html":f.replace(/^public\//,"")); fs.mkdirSync(path.dirname(dest),{recursive:true});
  const buf=execSync("git show "+REF+":"+f,{cwd:SP,maxBuffer:64*1024*1024}); if(!fs.existsSync(dest)||!buf.equals(fs.readFileSync(dest))){ fs.writeFileSync(dest,buf); n++; } }
fs.writeFileSync(path.join(SP,"parts/hideout/UPSTREAM"),hash+"\n");
console.log("hideout copy at "+hash+": "+n+" file(s) updated of "+files.length+(n?"":" (already current)"));
