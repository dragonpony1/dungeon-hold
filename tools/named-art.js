// Turns Matt's named-mythic icons (Pictures\dungeon art,\Weapon sets\named myth thumbs\Meshy_AI_Icon_<Name>_Mythic.png,
// 1024px PNG ~1.5 MB) into small hideout pictures: public/assets/hideout/items/named/<id>.jpg, 512px JPEG. The ids are
// NAMED_MYTHICS keys in hideout.html; a picture is matched by the name in its file name.
// Usage (from dungeon-hold/):  node tools/named-art.js
const fs = require('fs'), path = require('path');
const { Jimp, JimpMime } = require('jimp');

const SRC = 'C:/Users/Matt/Pictures/dungeon art,/Weapon sets/named myth thumbs';
const OUT = path.join(__dirname, '..', 'public', 'assets', 'hideout', 'items', 'named');
const IDS = { // what to look for in the file name (lower case, no spaces) -> NAMED_MYTHICS id
  rootsplitter: 'rootsplitter', thelastlantern: 'last_lantern', mossheartaegis: 'mossheart_aegis',
  voidwovenmantle: 'voidwoven_mantle', tearoftherootgate: 'tear_of_the_rootgate', wardensoath: 'wardens_oath',
  bramblewhisk: 'bramblewhisk', oldlamplight: 'old_lamplight', gloomcapcenser: 'gloomcap_censer',
  hourglasshollowsand: 'hourglass_hollow_sand',
};

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const files = fs.readdirSync(SRC).filter(f => /\.(png|jpe?g)$/i.test(f));
  const done = new Set();
  for (const f of files) {
    const key = Object.keys(IDS).find(k => f.toLowerCase().replace(/[^a-z]/g, '').includes(k));
    if (!key) { console.log('  (no match)', f); continue; }
    const img = await Jimp.read(path.join(SRC, f));
    img.resize({ w: 512, h: 512 });
    const buf = await img.getBuffer(JimpMime.jpeg, { quality: 88 });
    fs.writeFileSync(path.join(OUT, IDS[key] + '.jpg'), buf);
    done.add(IDS[key]);
    console.log(IDS[key].padEnd(22), Math.round(buf.length / 1024) + 'KB  <-', f);
  }
  const missing = Object.values(IDS).filter(id => !done.has(id));
  console.log(missing.length ? 'still missing: ' + missing.join(', ') : 'all ten done');
})().catch(e => { console.error(e); process.exit(1); });
