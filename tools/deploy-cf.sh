#!/bin/sh
# Build 307+: Rootgate lives on Cloudflare -- https://rootgate.52bulls.workers.dev (a static-assets Worker, ../rootgate-site).
# Builds the game with plain .glb models into ../rootgate-site/public and deploys it. Run from anywhere:  sh tools/deploy-cf.sh
# (GitHub Pages still publishes on every push, but its page only forwards to the Cloudflare site.)
set -e
cd "$(dirname "$0")/.."
rm -rf ../rootgate-site/public
DIST=../rootgate-site/public RAWGLB=1 EXTRA=./parts/staging node assemble.mjs
printf '/\n  Cache-Control: no-cache\n/index.html\n  Cache-Control: no-cache\n/assets/*\n  Cache-Control: public, max-age=604800\n/hideout/\n  Cache-Control: no-cache\n/hideout/index.html\n  Cache-Control: no-cache\n/hideout/assets/*\n  Cache-Control: public, max-age=3600\n/hideout/vendor/*\n  Cache-Control: public, max-age=3600\n'   # build 447: /hideout/ (where hideout/index.html redirects) matched /hideout/* and was kept an hour -- Matt saw an old hideout > ../rootgate-site/public/_headers
cd ../rootgate-site && npx wrangler deploy
