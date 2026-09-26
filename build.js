// Assembles the single-file game: head.html + Three.js + src/p*.js
//   public/index.html      standalone document (dev server / Cloudflare)
//   ../dungeon-hold.html   same standalone copy in the project root
//   dungeon-hold.artifact.html  fragment without doctype/html/head/body (the Artifact tool wraps it)
const fs = require('fs'), p = require('path');
const d = __dirname;
const head = fs.readFileSync(p.join(d, 'src/head.html'), 'utf8');
const three = fs.readFileSync(p.join(d, 'vendor/three.min.js'), 'utf8');
const gltfLoader = fs.readFileSync(p.join(d, 'vendor/GLTFLoader.js'), 'utf8');
const parts = fs.readdirSync(p.join(d, 'src')).filter(f => /^p\d+\.js$/.test(f)).sort();
const game = parts.map(f => fs.readFileSync(p.join(d, 'src', f), 'utf8')).join('\n');
const scripts = '\n<script>\n' + three + '\n</script>\n<script>\n' + gltfLoader + '\n</script>\n<script>\n' + game + '\n</script>\n';
const standalone = head + scripts + '</body></html>\n';
const frag = head.replace(/^<!DOCTYPE html>\s*<html[^>]*><head><meta charset="utf-8">\s*<meta name="viewport"[^>]*>\s*/i, '').replace('</style></head><body>', '</style>') + scripts;
if (frag.includes('<head>') || frag.includes('<body>')) throw new Error('fragment still has document tags');
fs.mkdirSync(p.join(d, 'public'), { recursive: true });
fs.writeFileSync(p.join(d, 'public/index.html'), standalone);
fs.writeFileSync(p.join(d, '..', 'dungeon-hold.html'), standalone);
fs.writeFileSync(p.join(d, 'dungeon-hold.artifact.html'), frag);
console.log('built from', parts.join(' '), (standalone.length / 1024).toFixed(0) + ' KB; fragment starts:', JSON.stringify(frag.slice(0, 40)));
