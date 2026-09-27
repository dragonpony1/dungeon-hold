// Run a set of the *-test.mjs suites one after another (they share ports, so never in parallel) against dist/, on the
// graphics card (tools/pw-gpu.mjs), and print a summary.   node tools/run-tests.mjs coop-*-test.mjs lobby-test.mjs
// Patterns are simple globs over the repo root; with none, every *-test.mjs runs. A suite's full output goes to
// tools/test-logs/<name>.log (gitignored).
import fs from "fs"; import path from "path"; import { spawnSync } from "child_process";
const ROOT = path.resolve(path.dirname(decodeURIComponent(new URL(import.meta.url).pathname).replace(/^\/(?=[A-Za-z]:)/, "")), "..");
const pats = process.argv.slice(2); const rx = p => new RegExp("^" + p.replace(/[.+^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*").replace(/\?/g, ".") + "$");
const all = fs.readdirSync(ROOT).filter(f => /-test\.mjs$/.test(f)).sort();
const list = pats.length ? all.filter(f => pats.some(p => rx(p).test(f))) : all;
const LOGS = path.join(ROOT, "tools", "test-logs"); fs.mkdirSync(LOGS, { recursive: true });
const env = { ...process.env, DIST: process.env.DIST || path.join(ROOT, "dist"), SP: process.env.SP || ROOT };   // SP: older suites save screenshots under $SP/parts/shots (gitignored)
const rows = []; let failed = 0;
for (const f of list) {
  const t0 = Date.now();
  const r = spawnSync(process.execPath, ["--import", "./tools/pw-gpu.mjs", f], { cwd: ROOT, env, encoding: "utf8", timeout: +process.env.SUITE_TIMEOUT || 600000, maxBuffer: 64 << 20 });
  const out = (r.stdout || "") + (r.stderr || ""); fs.writeFileSync(path.join(LOGS, f.replace(/\.mjs$/, ".log")), out);
  const pass = (out.match(/^PASS /gm) || []).length, fail = (out.match(/^FAIL /gm) || []).length, skip = /^SKIP /m.test(out);
  const crashed = r.status !== 0 && !fail; const bad = fail > 0 || crashed || r.error;
  if (bad) failed++;
  const note = r.error ? String(r.error.code || r.error) : crashed ? "exit " + r.status + ": " + (out.trim().split("\n").filter(l => /Error|error|Timeout/.test(l))[0] || "").slice(0, 140) : "";
  rows.push(`${bad ? "✗" : skip ? "–" : "✓"} ${f.padEnd(30)} ${String(pass).padStart(3)} pass ${String(fail).padStart(3)} fail ${((Date.now() - t0) / 1000).toFixed(0).padStart(4)}s ${note}`);
  console.log(rows[rows.length - 1]);
  for (const l of out.split("\n").filter(l => /^FAIL /.test(l)).slice(0, 8)) console.log("      " + l.slice(0, 220));
}
console.log(`\n${list.length - failed}/${list.length} suites clean`);
