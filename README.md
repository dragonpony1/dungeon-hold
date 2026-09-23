# Dungeon Hold

A Dungeon Defenders–style 3D tower defense: a gnome warden, a crystal to hold, five original defenses, a loot loop with a
physical tavern (locker, barkeep, trainer, anvil), six familiars, Meshy-made models. Three.js r128, plain JavaScript, one
page plus an `assets/` folder. Desktop first, tablet at most.

Live build: https://claude.ai/artifact/Y8nkfEsKZyvLESKRs7n9Zj (build 30; a second copy at https://claude.ai/artifact/G178miB5MXnvFLeqenipmE).

## Layout

- `parts/head.html` — page shell, CSS, start/dead screens, the baked gnome/goblin/squire models (base64), Three.js r128 + GLTFLoader (CSP-safe patch).
- `parts/game.js` — the game: grid, hero, mobs, defenses, projectiles, loot, HUD, hero/mob GLB fitting (`fitModel`, `toonify`, `cloneSkinned`).
- `parts/modules/` — meta game written against `parts/DESIGN.md`: `10-meta.js` (bag, gold, xp, skills, shop), `20-tavern.js` (overlay UI), `30-familiar.js` (procedural pet + bolt).
- `parts/staging/` — later modules, same script scope, loaded after `modules/`: music, defense models, castle crystal, loot feel, tavern room, character sheet (Tab), hero v2, swords in hand, familiars v2 (Meshy models + per-kind attacks), casino mana sound, the forge (item upgrades).
- `parts/assets/` — GLB models, music, sfx. The build converts `.glb` to `.glb.txt` (base64) because the artifact host only serves fixed file types; `fetchBytes()` decodes.
- `parts/tail.html` — closes the script; `window.__dd` debug/test API is defined at the end of `game.js`.
- `assemble.mjs` — builds the page. `serve.mjs` — test server.
- `*-test.mjs` — Playwright suites (headless Chromium with SwiftShader). `probes/` — screenshot/diagnostic scripts.
- `meshy/` — pipelines for Meshy exports: `merge.html/.mjs` (rigged characters: idle/walk/run/attack(/shout) → one GLB), `merge-static.html/.mjs` (props: shrink texture, face +Z, floor, centre), `view.html/.mjs` (frame-strip renderer), per-model folders with their merge variants. Model inputs are not committed.
- `parts/DESIGN.md` — the meta-game contract (bag/gold/tavern/skills/familiar/forge). `parts/MAP.md` — the planned bigger seven-door hall.

## Build

```
# folder build (index.html + assets/), what the artifact serves:
DIST=./dist EXTRA=./parts/staging node assemble.mjs
# single-file build (dungeon.html, no assets: procedural fallbacks stay):
EXTRA=./parts/staging node assemble.mjs
```
Env: `DIST=<dir>`, `EXTRA=<dir of extra modules>`, `NOMODS=1` (skip modules), `OUT=<file>`.
Publishing = upload `dist/index.html` plus any changed `dist/assets/*.glb.txt` to the artifact.

## Tests

```
npm i playwright            # Chromium must be available (PLAYWRIGHT_BROWSERS_PATH or executablePath)
export SP=$PWD
DIST=$SP/dist node forge-test.mjs      # any *-test.mjs; run them one at a time (they share timing)
node familiar-test.mjs                  # the single-file fallback suite reads $SP/dungeon.html
```
Suites: feat, loot, glb, place, csp, mob, mobpath, meta, tavern, tavernroom, familiar, familiars2, cone, music, defglb,
ballista, lootfeel, weapons, towers, paperdoll, casino, ogre, forge, fix-r1, fix-r2, heroes, void, sets, throne, campaign, maps,
moat. Run them one at a time: ten in parallel time out on page loads (the page is 6.8 MB).

## Adding Meshy art

- Props (towers, swords, familiars, crystal): `cd meshy && node merge-static.mjs out.glb "in=raw.glb&yaw=90&tex=512"`
  (yaw turns the model so its front faces +Z; cannons need 90, hedge/crystal/familiars 0). Copy to `parts/assets/`, register in
  `parts/staging/50-defmodels.js` (defenses by kind + mark), `80-weapons.js` (swords), `85-familiars.js` (pets).
- Rigged mobs/heroes: `meshy/<name>/merge.html` + `merge.mjs` merges the Meshy rig with its walk/run/attack(/shout) clips,
  fixes facing and hip drift, and (for the hero) cuts the baked sword out and leaves a `weaponMount_<cm>` node under RightHand.

## The campaign (maps)

`MAPS` in `parts/game.js` is the list of maps. Each one holds its grid (`build(f,g,h,ramp)`: fill tiles, set a tile, fill a
raised floor height, lay a staircase), the crystal cell, the gates (`lanes`, in the order waves open them, or each with
`from`: the map's own wave that gate first opens on), props, lights (world coords, `{cx,cz,y}` cells, or `{cx,cz,up}`
above that cell's floor), the hall rectangle (banners), beams, a throne, and where the tavern room sits
(`tavern:{dx,dz}`, an offset from map 1's room). The map is chosen when the page loads: `?map=N` or the saved `ddMap`, never
past `ddMapsCleared`. Hold `waves` waves and the map is cleared (`winMap`): the tally shows NEXT MAP, which reloads with the
next `?map`. Difficulty carries across maps through `effWave()` (map 2 wave 1 fights like wave 8); the HUD shows the map's own
wave count. Height: `hgt`/`rampA` per cell, `floorH(x,z)` (stairs are two flat steps per cell), no walking or pathing up a
ledge taller than a step, a flight is entered and left at its ends only (never over its side), no building on stairs;
raised tops and stone drops are generated after the walls (pale stone in marble halls), gates, torches, banners and
windows sit on the floor of the cell they stand at, and `style.rails` adds a balustrade (instanced posts and a gold rail)
along every drop of a step and a half or more. The ballista pitches (`d.pitch`, the yoke's rotation.x) at its target's height, so it tilts up at a drake or a mob on a landing, and its bolt flies in three dimensions: it dies on a wall, the floor, a landing's face or the ceiling, and hits what it passes through at its own height (`ballista-test.mjs`).

Maps so far: 1 The Gnome Hall (the original), 2 The Throne Room (a 27×54 marble stair hall under an 18-high ceiling with
arched windows and drapes, five levels high: the horde comes in at the south gate on the floor and climbs twin first
flights, one up each wall, to the lower landing (two up); a single flight up the middle takes it to the middle landing
(four up), where the two streams meet; twin third flights up the walls split it again on the way to the upper landing
(six up), and one last flight up the middle brings it together at the throne platform (eight up) with the crystal and the
throne. Feeder gates open onto the landings as the waves go — the east lower landing from wave 3, the west landing from
5, the east upper landing from 6 — each with a shorter climb than the last; balustrades line every drop; `throne-test.mjs`
checks all of it and takes the `throne-*.png` shots), 3 The Cloister Court (outdoors under a night sky: a sunken court, a covered
colonnade a step and a half up with four flights down, trees, three corner gates), 4 The Great Feast Hall (three long
tables with benches and candles, four hearths, the crystal on the high-table dais, doors east, north and south), 5 The
Drawbridge (outdoors, 50×56: the castle's outer ward behind a curtain wall, a moat four cells wide across the whole map, the
drawbridge over it in the middle and an old ford (a paved causeway) at the west end below a postern, a wide green before
the walls with the royal road up the middle, lamp posts, stone gnome kings on plinths, braziers, the keep rising behind
the ward with lit windows and the royal banner, twin gate towers with pennants, battlements on every wall, the portcullis
raised in the gate arch, and the tavern as a walled roadside inn. Gates: the road's far end (wave 1), the west wood (2,
walks the ford), the east wood (3, walks round to the bridge), a sally port in the ward's east wall (5). `moat-test.mjs`
checks it and takes the `moat-*.png` shots).
Map styles: `wallH`, `fog`, `style.marble` / `style.moss` / `style.grass` (floor and wall painters), `style.road` (carpet
cells paint as pale paving with the gold edge), `style.windows` (arched windows with drapes), `style.outdoor` (no ceiling,
night sky, stars and a moon, and the camera may rise above the walls), `roofs` (slabs over colonnades), `trees`, `tables` +
`tableGaps`, `hearths`, `throne`, `chandeliers`, `pillarH`, `du` / `mana` (that map's roots cap and starting mana: 40/260
on the hall, 80/480 in the throne room, 60/360 on the court and in the feast hall, 90/520 at the drawbridge), and
`castle` (`towers` [x,z,r,h,'cone'?], `keep` [x0,x1,z0,z1,h], `arches` [x0,x1,z0,z1,underside], `bridge`, `chains`,
`lamps`, `statues`, `braziers`; battlements go on every wall face except the inn's). The water tile `T.WATER` is a moat:
walkers and the hero stop at the bank, flyers cross it (`bfs(…,fly)` and `solidAt` let a flyer over water), nothing is
built on it; its cells sink to `WATER_BED` (-1.5) so the banks show as stone drops, a water map draws every cell's top
itself instead of one floor plane, wall faces reach down to a sunken cell, and the surface is a painted ripple texture
drifting over the bed with a fainter sheen drifting the other way (`WORLDANIM` runs the water and the pennants each frame).

Design rule (Matt, Sep 23): every map from here on is outdoors or has a tall ceiling like the throne room's — no more low
halls.

Building: defenses may stand on a flight of stairs (they stand on the highest step under their footprint, `standH`); a
hedge across a flight blocks it and the horde chews through. The Meshy ballista is split at 60% of its height into the
pedestal and the bow assembly (`hingeSplit` in `50-defmodels.js`, a group named `pitch` with its origin at the pedestal's
top); the assembly alone tilts at a drake, the pedestal stands.

Balance notes: the crystal has `CRYSTAL_MAX` (150) life; the Bramble Hedge is five cells wide (its three-cell model
stretched to match) with 220 hp for 50 mana; ballista bolts are stout (thick shaft, broad head, fletching); asset fetches
retry three times before falling back, so one dropped file can't cost the hero model. Roots (`DU_CAP`) and starting mana
are per map (`MAP.du`, `MAP.mana`, see above): the bigger halls give more to build with. Drakes are frail (32 hp, 9
damage, 4 mana) and come in flights that grow with the waves (`waveComp`: two on the sixth wave, six by the twelfth, a
dozen by the twenty-first) — the difficulty is in their numbers, not their hides.

## Heroes, weapons, sets

- `70-hero2.js` holds `HEROES` (Gnome Warden with a sword and reach 2.4, Gnome Battle Witch with a battle staff that shoots, reach 9, Troll Archer with a longbow, reach 12); the start screen
  picks one (saved as `ddHero`); a pick swaps the model live. The start screen also has a testing line: unlock all maps,
  auto-mana (orbs fly to you from anywhere), +1000 gold, ↻ fresh reload (a plain reload; the page's URL is left alone since a host may sign it; saves kept) and wipe saves (two clicks: forgets every `dd*` key, then reloads fresh).
- `82-staff.js` — battle staffs built in code, no model to load: six kinds (`hazel`, `copper`, `runed`, `storm`, `battle` for
  the five forge tiers, `void` for the set) in the sword GLBs' model units, the fist 44% of the way up (`userData.gripF`).
  Registered with the weapon mount as `staff-<kind>` through `window.__weapons.register` (a code-built template is served
  like a loaded sword; `userData.proc` skips the material conversion and gets the scaled ink outline), animated by part
  name (`animFor`) so a mounted clone turns its crystal and orbits its motes too. `fireBolt` throws a spark of the staff's
  colour that bursts on the first wall, ledge or floor; `__staff.plant/fire/fireFromHand/clear` are the design bench and
  `probes/staffshot.mjs` renders the row, a bolt, a burst and the staff in the Warden's hand (`__weapons.force(name)`
  mounts any weapon regardless of gear). The staff is strictly the witch's weapon: with one in hand her swing throws a
  bolt from the crystal (`hitCone` is wrapped: aimed at the nearest mob in the cone within `hero.reach`, it hurts the first
  mob it meets for `heroDmg()` and bursts there); `staffFor(item)` picks the staff by forge tier, or the set's own
  (`pack.models.staff`, the Void set's `staff-void`).
- `83-bow.js` — bows built in code like the staffs (`ash`, `yew`, `horn`, `storm`, `war` for the five tiers, `void` for the set),
  registered as `bow-<kind>`, each its own length and fittings: the shortbow plain with horn knobs, the longbow tall with
  leather wraps, the recurve curling its tips back with horn plates and runes, the stormwood bow with gold caps, a crystal in
  the belly, motes about it and a string that burns blue, the war bow a tall gold-capped recurve with a halo about the grip,
  the Bow of the Void with crystal tips, a void gem, motes, dark shards adrift along the limbs and a violet string. Animated
  by part name (`animFor`) on the mounted bow and on planted ones; `__bow.plant/fire/clear` are the design bench and
  `probes/bowshot.mjs` renders the row and the Void bow in the troll's hand. With a bow in hand a swing
  looses an arrow (`fireArrow`: a shaft, steel head, fletching in the bow's colour) from the grip at the nearest mob in the
  cone within `hero.reach`; it flies flat, stops in the first mob it meets or dies on a wall, the floor or at range. The
  mounted bow is re-aimed every frame in world space (`holdBow`: upright, facing the archer's way, its grip slid back into
  the fist) because the hand's own turn would lay it flat when the arm comes up to aim. The Meshy archery clip aims 90° to
  the left of the body, as a real archer stands, so while the shot plays the body turns side-on (`heroYawOff`, blended in
  and out) and the bow arm points down the aim; the string is drawn back in two halves with a nocked arrow on it until the
  release (`setDraw`). Arrows are stout and slow enough to follow (`ARROW_L`, `ARROW_V`), with a glow at the head and a
  streak behind. `bowFor(item)` picks by tier or the set's `models.bow`.
- `80-weapons.js` mounts a weapon model on the hero's `weaponMount_<cm>` (a sword), `staffMount_<cm>` (a staff) or `bowMount_<cm>` (a bow) node:
  the grip point (`userData.gripF` of the template's height) sits on the mount, the blade or shaft runs up its +Y, scaled
  so the length above the grip is the mount's length (× `userData.lenScale`; a staff is body-length). A set piece that is
  a loaded GLB is tinted (darkened, burning the set's colour); a code-built staff already wears its colours. Whips are
  gone (the whip models, the rope simulation and the `whipMount` are removed with the fae witch).
- The Gnome Battle Witch is a Meshy re-rig merged by `meshy/witch3/merge.mjs` (`merge.html?hand=auto&len=90&grip=.045`):
  the rig file's mesh and skeleton, the separate Meshy clips (walk, run, idle, staff thrust → Attack, jump, death) retargeted
  by bone name, facing found from the `headfront` marker, the Attack clip cut to ±0.35 s around the arm's fastest motion,
  Jump procedural, and a `staffMount_90` added under the hand that travels most in the thrust (LeftHand), placed at the
  fist with +Y along world-up in the idle pose so the staff stands upright in her grip. `meshy/view.mjs` renders clip strips
  to check a merge. The old fae witch (two Meshy exports, `meshy/witch` and `meshy/witch2`) is retired.
- The Troll Archer is the same pipeline in `meshy/troll` (`merge.html?hand=LeftHand&mount=bow&len=90&grip=.045`: the
  `mount=` parameter names the node — `staff`, `bow` or `weapon`). His Meshy archery clip is 3.8 s of drawing and aiming; the
  cut Attack window is the aim. `probes/glbinfo.mjs <glb…>` prints any GLB's nodes, skins and clips (run it on a new export
  first); `probes/thumbs.mjs out.png a.glb …` renders static models from three sides.
- `72-witchswing.js`: a hand-made strike for a hero whose attack clip is unusable (the arm winds up over the shoulder and
  snaps forward, bones aimed in world space and blended into the idle or walk pose). Nobody uses it; heroes opt in by id in
  `PROC`, or at runtime `window.__armSwing.set('witch','Left')`.
- Model files carry their content stamp in the name (`assets/witch.<sha1[0:8]>.glb.txt`, written by `assemble.mjs` for the
  folder build next to the plain copy) so a re-exported model is a new file and no browser or CDN cache can hand out the
  old one; `fetchBytes` falls back to the plain path if the stamped file is missing.
- `68-paperdoll.js` is the Tab character sheet in the ashen style: the live hero (the hall's own model, turning on a stone
  pedestal under an arch, rendered by a second camera that sees only layer 1 and copied into the sheet), the five slot
  plaques with the forge rows, HP / mana / attack / defense, seven medallions, an INVENTORY grid (click a piece to read,
  equip or sell it) and the item card. `window.__doll.select(id,from)` picks an item for the card.
- `92-sets.js` is the set frame: pieces sharing an "of the …" name count together, three give the small bonus, five the
  big one, completing one says so, the sheet's SET BONUSES panel lists every registered set with its count, stat lines say
  "Void set 3/5". The frame holds no sets of its own: ordinary drops carry flavour suffixes only (of Embers, of Fury, of
  Stone, of the Watch, of Thorns…) and never mean a set.
- `93-gearsets.js` is the registry for the great sets (ten planned; the arcane **Void** set is the first). An entry gives
  the suffix, icon and colour, the lowest rarity that can carry it and the chance per drop by wave, the value multiplier,
  the drop sound, the three- and five-piece percentages (on `Meta.mult`) and an optional five-piece `onHit` power, plus
  stand-in weapon models until Meshy art lands. Of the Void: Rare+ only, from wave 4 at 5% of such drops rising a point a
  wave to 15%, worth ×3, drops with a low bell under a rising shimmer and a violet column, glows violet on the floor and in
  the hand; 3 pieces +15% hero damage and +20% familiar damage; 5 pieces VOID RIFT (every hit deals 40% of the blow to all
  within 3 units and slows them 2 s). `window.__void` and `void-test.mjs` cover it.
- Card art: a set entry's `art` map names a picture per slot (`item-void-sword.png`, `-whip` for the witch's weapon,
  `-armor`, `-charm`, `-amulet`, in assets/); `Meta.packs.artHtml(it)` renders it wherever gear is drawn — the sheet's
  slot boxes and inventory grid, the tavern's bag and shop cards — with the slot's emoji shown instead when the file is
  missing. The Void pictures are still to be dropped in (the concept shots exist; they need uploading as PNG files).
- Full-set aura: with all five pieces of a set worn, the hero's own model wears a thin shell in the set's colour (an
  additive back-face shell a hair wider than the ink outline, `userData.setGlow`, rebuilt on a model swap, pulsing faintly)
  in the hall and on the sheet's portrait. Off again the moment a piece comes off.

- `97-pause.js`: Escape in the hall (or the mouse leaving pointer lock) opens PAUSED — RESUME, or RETURN TO TITLE SCREEN
  (a reload; gold, gear, skills and map progress are saved as they happen, the run is forfeited). Escape while placing
  still cancels the placement; the tavern and the sheet keep their own Escape. `window.__freeze=true` stops the live
  loop's update so a test can step the hall itself and still see it drawn.

- The crystal stands on its own carved base, level with the floor: no raised dais (the DAIS cells remain an inlaid floor
  marking with a gold border, and `baseFloor` no longer steps up on them).

- Rune Totem (key 6, `DEFS.totem`, Meshy art `totem-1..4.glb` by mark, procedural fallback): a runed pillar with a ring of
  7 (+1 a mark). Every other defense standing in a ring hits harder and faster by the strongest ring it stands in (+15%,
  +5% a mark, `d.buff` set each frame in `updateDefs` and read by `stat` for dmg and cd; totems never buff totems and never
  stack). Buff only.
- Frost Spire (key 7, `DEFS.frost`, procedural ice shards until its art lands — drop `frost-1..4.glb` into assets/ and add
  the fetch line in `50-defmodels.js`): a ring of 6 (+0.8 a mark); mobs in it crawl at 60% (6 points slower a mark, Mark V
  36%; `e.chillT` / `e.chillK`, the deepest cold wins where rings overlap, thaws half a second after leaving). Slow only.
- Both draw their ring on the floor at its reach with a small spinner and a plume of light at the top (`mdl.userData.aura`,
  added at runtime so a model swap keeps it). `totem-test.mjs` covers both.

- `96-armory.js`: every piece asks for a hero level (`it.req` = drop level × 0.8 + rarity, so a wave-7 legendary wants 10, a
  wave-7 common 6; old pieces get one on the way through `fixItem`); the sheet marks a locked piece (red Lv badge, 🔒 in
  the grid, EQUIP becomes "LEVEL N NEEDED"), the tavern's cards carry the badge, and `Meta.equip` refuses with a toast.
  The ARMORY keeps pieces for later: eight stands (`ddArmory`, its own save; `Meta.stash` / `Meta.unstash` / `Meta.armory`),
  a grid under the inventory on the sheet (KEEP IN ARMORY on a bag piece's card, TAKE BACK on a kept one), and the stands
  themselves along the tavern's north wall showing what they hold — armor on a wooden mannequin, a weapon on a rack with its
  real model (`window.__weapons.model`), a charm or amulet on a pedestal, a familiar's egg on a perch, each with a name tag.
  E at the stands opens the sheet on the first kept piece. `armory-test.mjs` covers it. `?nogate` on the page URL turns the
  level gate off (`Meta.levelGate(false)` at runtime); every other suite runs with it so their high-level test pieces equip.

- The loot hook: a piece that has landed within 3.2 units of the hero flies to their hands and is bagged (no need to stand
  on it; the test magnet extends it to anywhere). Walking over a piece still works. A legendary's bonus stat is drawn from
  the rollable stats only (the forge-only ones — defense speed and range, pet projectiles — are bought, never rolled).

- `84-aim.js`: aiming for the archer and the witch — a reticle, a two-phase press-to-draw/release-to-loose attack, and a
  shoulder camera. The camera's own facing is the aim; `pick(yaw)` finds the mob nearest that line, in reach and in sight
  (a wide cone up close, narrow at range), and the reticle locks brackets onto it or shows a crosshair where the shot would
  land with nothing there. Pressing (mouse, the touch ⚔ button, or `__aim.press()`) starts the swing and holds it: the
  archer's clip freezes at full draw, the witch's at her wind-up with the staff levelled at the target (`pointStaff`, turned
  about the grip so the fist doesn't slide), the charge ring fills over `fullT()` seconds (quicker with attack speed, a
  ping at full), and the hero walks at half speed while holding. Releasing looses at the current charge: a tap does 60%
  damage, a full charge 130% and something extra — a full-draw arrow flies faster and pierces two more mobs, a full-charge
  bolt is bigger and bursts on the mobs beside the one it hits. The camera itself shifts over the hero's right shoulder
  while a ranged weapon is out (`cam.shoulder`, eased in `updateCamera`, backing off if a wall is at that shoulder) so the
  hero's own body doesn't block the target. `aim-test.mjs` covers the reticle, the hold, both release strengths, piercing,
  the staff's point-and-charge, and that nothing shows while placing a defense.

## Open items

- Void set models: the concept art (runed blade, shard charm, galaxy amulet, starless robe) is waiting on Meshy exports;
  until then the Void sword is the holy sword darkened and burning violet. The Void staff is done (`staff-void`, built in code).
- Ideas queued: switch heroes mid-defense; a Survival mode (endless waves); co-op (a room server on Cloudflare Durable
  Objects, host-authoritative); touch buttons for pause and the sheet on iPad.
- Nine more great sets to design (suffix, drop rule, buffs, sound); each is one `addSet` entry.
- Meshy art still wanted: turnip trebuchet, hobgoblin archer, and the Frost Spire (none of the uploads so far is a frost
  tower — the seven unnamed `Meshy_AI_model.glb` files are the drake, three ballista marks, the acorn cannon and the barkeep;
  `frost-1..4.glb` in `assets/` and a fetch line in `50-defmodels.js` would wire it).
- Upgraded gear raises gear score, which nudges mob health up a little (rubber band); revisit if it feels punishing.
