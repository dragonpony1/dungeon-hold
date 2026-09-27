// Turns Matt's gear-set concept art (Pictures\dungeon art,\Weapon sets\GEAR SETS\<set folder>\*.png, 1024px PNGs of
// ~1.1 MB each) into small hideout pictures: public/assets/hideout/items/sets/<set id>-<piece>.jpg, 512px JPEG. The art is
// painted on a flat dark background, so JPEG (no transparency needed) — the page cuts the background out at run time
// where it wants to (knockOutBackground). Also prints each set's glow colour (average of the bright, saturated pixels)
// so a set's name can be drawn in its own colour.
// Usage (from dungeon-hold/):  node tools/set-art.js
const fs = require('fs'), path = require('path');
const { Jimp, JimpMime } = require('jimp');

const SRC = 'C:/Users/Matt/Pictures/dungeon art,/Weapon sets/GEAR SETS';
const OUT = path.join(__dirname, '..', 'public', 'assets', 'hideout', 'items', 'sets');
// folder -> set id (the hideout's armor-stand set ids, which the game's sets line up with)
const SETS = { 'Nature': 'forest', 'Arcane': 'void', 'chaos': 'crimson', 'Earth set': 'rock', 'Fire set': 'lava',
  'Holy': 'angelic', 'Lightningstorm': 'storm', 'Necrotic': 'shadow', 'water set': 'ice', 'Windair': 'wind' };
// Weapons are swords, magical staves and polearms (Matt, 2026-09-27: "no whips"; the bo staff is called a polearm).
// A piece whose art isn't in the folder yet is reported MISSING and skipped — put "staff" / "polearm" in the file
// name and rerun. (The folders' old whip art is deliberately not converted.)
const PIECES = ['armor', 'amulet', 'sword', 'staff', 'polearm', 'trinket'];

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  let total = 0;
  for (const [folder, id] of Object.entries(SETS)) {
    const dir = path.join(SRC, folder);
    const files = fs.readdirSync(dir).filter(f => /\.png$/i.test(f));
    let r = 0, g = 0, b = 0, n = 0;
    const got = [];
    for (const piece of PIECES) {
      // Matt names his staves "..._Stave_Mythic.png"; prefer his newer *_Mythic icons over the old concept renders
      const words = piece === 'staff' ? ['stave', 'staff'] : [piece];
      const hits = files.filter(x => words.some(w => x.toLowerCase().includes(w)));
      const f = hits.find(x => /mythic/i.test(x)) || hits[0];
      if (!f) { console.log('  MISSING', id, piece); continue; }
      const img = await Jimp.read(path.join(dir, f));
      img.resize({ w: 512, h: 512 });
      const d = img.bitmap.data;
      for (let p = 0; p < d.length; p += 4) {
        const mx = Math.max(d[p], d[p+1], d[p+2]), mn = Math.min(d[p], d[p+1], d[p+2]);
        if (mx > 150 && mx - mn > 70) { r += d[p]; g += d[p+1]; b += d[p+2]; n++; }
      }
      const buf = await img.getBuffer(JimpMime.jpeg, { quality: 84 });
      fs.writeFileSync(path.join(OUT, id + '-' + piece + '.jpg'), buf);
      total += buf.length;
      got.push(piece + ' ' + Math.round(buf.length / 1024) + 'KB');
    }
    const hex = n ? '#' + [r, g, b].map(v => Math.round(v / n).toString(16).padStart(2, '0')).join('') : '?';
    console.log(id.padEnd(8), folder.padEnd(15), 'glow', hex, '|', got.join(', '));
  }
  console.log('total', Math.round(total / 1024), 'KB');
})().catch(e => { console.error(e); process.exit(1); });
