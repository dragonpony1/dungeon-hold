# Dungeon Hold

A Dungeon Defenders–style 3D tower defense: a gnome hero, a crystal to hold, five original defenses, a loot loop with a
physical tavern (locker, barkeep, trainer, anvil), six familiars, Meshy-made models. Three.js r128, plain JavaScript, one
page plus an `assets/` folder. Desktop first, tablet at most.

Live build: https://claude.ai/artifact/Y8nkfEsKZyvLESKRs7n9Zj (build 32; a second copy at https://claude.ai/artifact/G178miB5MXnvFLeqenipmE).

## Layout

- `parts/head.html` — page shell, CSS, start/dead screens, the baked goblin fallback model (base64), Three.js r128 + GLTFLoader (CSP-safe patch).
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
moat, aim, newmobs, trollboss, armory, totem, pause, pwa, share, hideout, loadorder, bagsort, gearlock, coop-rewards,
voidset, halo-column, ballista-rig, forestset, and the verify-* adversarial suites. Run them one at a
time: ten in parallel time out on page loads (the page is 6.8 MB).

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
checks all of it and takes the `throne-*.png` shots. `56-thronedecor.js` dresses it with real Meshy art, gated to
`MAP.throne` so nothing else is touched: a throne (hides the procedural stone seat), two guardian statues, a
stained-glass window and a beast-head crest on the wall behind it, twin torch sconces, a portrait and a spear rack on
the side walls, a real door standing in the alcove behind each gate's portal swirl, the ornate railing model flanking
the top of the main stair, wood-and-gem floor tiles over the dais under the crystal and throne, and stone wall tiles
on the wall behind it), 3 The Cloister Court (outdoors under a night sky: a sunken court, a covered
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

- `70-hero2.js` holds `HEROES` (Gnome Battle Witch and Gnome Fighter, each a battle staff that shoots, reach 18; Troll Archer
  with a longbow, reach 24; Gnome Knight with a sword, reach 2.4); all twelve defenses split evenly, three per hero. The start screen
  picks one (saved as `ddHero`); a pick swaps the model live. The start screen also has a testing line: unlock all maps,
  auto-mana (orbs fly to you from anywhere), +1000 gold, ↻ fresh reload (a plain reload; the page's URL is left alone since a host may sign it; saves kept) and wipe saves (two clicks: forgets every `dd*` key, then reloads fresh).
- `82-staff.js` — battle staffs built in code, no model to load: six kinds (`hazel`, `copper`, `runed`, `storm`, `battle` for
  the five forge tiers, `void` for the set) in the sword GLBs' model units, the fist 44% of the way up (`userData.gripF`).
  Registered with the weapon mount as `staff-<kind>` through `window.__weapons.register` (a code-built template is served
  like a loaded sword; `userData.proc` skips the material conversion and gets the scaled ink outline), animated by part
  name (`animFor`) so a mounted clone turns its crystal and orbits its motes too. `fireBolt` throws a spark of the staff's
  colour that bursts on the first wall, ledge or floor; `__staff.plant/fire/fireFromHand/clear` are the design bench and
  `probes/staffshot.mjs` renders the row, a bolt, a burst and the staff in the hero's hand (`__weapons.force(name)`
  mounts any weapon regardless of gear). The staff mount decides the mechanic, not the hero by id (Gnome Battle Witch and
  Gnome Fighter both carry one): with a staff in hand a swing throws a
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
  ping at full — `FULL_BASE` is .5s now, was .75, so a tap-to-full-charge cycle comes round faster), and the hero walks at
  half speed while holding. Releasing looses at the current charge: a tap does 60% damage, a full charge 130% and
  something extra — a full-draw arrow flies faster and pierces two more mobs, a full-charge bolt is bigger and bursts on
  the mobs beside the one it hits. The camera itself shifts over the hero's right shoulder while a ranged weapon is out
  (`cam.shoulder`, eased in `updateCamera`, backing off if a wall is at that shoulder) so the hero's own body doesn't
  block the target. `aim-test.mjs` covers the reticle, the hold, both release strengths, piercing, the staff's
  point-and-charge, and that nothing shows while placing a defense.
- The reticle keeps a target locked through a looser retain check once acquired (`LOCK` in `84-aim.js`), so it doesn't
  flicker between two goblins jostling for the same spot as the horde closes in; a fresh acquisition always runs against
  a fresh scan too, so a deliberate re-aim (pitching up onto a drake overhead) can override a stale lock on a goblin at
  your feet, not just lose it to one. Vertical aim is real: `aimElev()` reads the camera's own pitch as a genuine
  look-up/down angle (scaled and capped — `PITCH0` is level, `UP_SCALE`/`DOWN_SCALE`/`ELEV_MAX` tuned so the top of the
  range reaches a hovering drake without overshooting past it) and `aimDir3()` turns yaw + elevation into one 3D ray, used
  for target-picking, the free crosshair's on-screen position and an unlocked shot's actual flight direction — the three
  always agree, so the arrow goes where the reticle shows. The free crosshair walks that ray out to `hero.reach` but
  stops it the moment a steep downward look would put it underground, landing it on the floor nearby instead of
  projecting a point far away and buried — without that clip a steep-down aim swung the reticle the wrong way on screen.

- Mobs: a bandit archer (`archer`, ranged 11) throws rocks from wave 3; a troll archer (`troll`, ranged 13, 65 hp, a
  Meshy rig merged the same way as the hero pipeline — `meshy/trollmob/merge.html`, no weapon mount needed since mob
  ranged attacks are a separate tween-based projectile system, `fireArrow(e,x,y,z,hit)` in the core engine, unrelated to
  the hero bow module of the same function name) joins from wave 8, one every third wave, capped at four. A lavender
  troll boss (`trollboss`, 340 hp, the same merge pipeline again — `meshy/trollboss/merge.html`) is a healer and a
  mini-boss in one: it lobs a magic grenade that splashes anything within 2.2 units of where it lands (`grenadeMesh`,
  `fireArrow`'s `splash` field, applied to both the crystal and nearby defenses in `updateProj`), and every 3.2s pulses a
  heal (`healAmt` 14 within `healR` 6.5) over every wounded mob in range, itself included — kill it first or the horde it's
  minding outlasts you. Joins from wave 12, every fifth wave after, capped at one. `trollboss-test.mjs` covers the rig,
  the splash and the heal-pulse's range, and the wave-12 introduction. Wave one is a gentler five-goblin opener with a
  slower trickle (`waveComp`'s `w===1` branch) — the climb in count and mob tier still starts properly at wave two, per
  the design: winnable out of the gate with defenses actually placed, harder only as the waves go on.

## Open items

- Void set models: the concept art (shard charm, galaxy amulet, starless robe) is waiting on Meshy exports; the Void
  sword, staff and bow are done, built in code (`94-voidset.js`, `82-staff.js`, `83-bow.js`). The Holy set is next.
- Co-op, phases 1-10 done — a guest can now join a host's hall, from the title screen itself, help defend it, fight in it,
  build in it, and fight AS the gear/skills they actually have equipped, not a flat unequipped baseline, with a ranged
  guest's shot a real travelling bolt/arrow rather than an instant hit. Phase 1 (`98-party.js`): other players' heroes render alongside the local one —
  each loads its own hero GLB through the same fit/toonify/clip-map pipeline the local hero uses, keeps its own
  wrap/mixer/actions, and eases toward whatever position/yaw it's last told (`window.__party.add/remove/setTarget`),
  switching idle/walk/run itself; the local hero has no idea puppets exist. Phase 2 (`99-network.js`): the actual
  transport — PeerJS (vendored in `head.html`, MIT, sets `window.Peer`) opens a real WebRTC data channel between two
  browsers via its free public signaling broker (`0.peerjs.com`), no server of our own to run. One player hosts —
  their peer id is the room code — up to three more join by connecting to it; `window.__net.host/join/send/
  onMessage/leave` is the whole surface. `network-test.mjs` proves a real handshake and message round-trip end to
  end, against a throwaway local signaling server (`npm i peer`, the official PeerJS server package — same client
  code path and protocol as the public broker, just no public network needed to test it; skips cleanly if that
  dev-only package isn't installed). Phase 3 (`99-network.js`'s `hostBroadcastHero`): the first real payload over
  that pipe — the host sends its own hero's x/z/yaw and hero pick 15 times a second, and every guest renders it as
  a phase-1 party puppet (`onMessage('hero',...)` calls the same `setTarget` a test script used to drive one).
  `coop-test.mjs` proves it end to end: a puppet grows at the host's position, keeps live-updating to a second
  position rather than sticking at the first, and disappears cleanly when the host leaves — all against the same
  local signaling server as phase 2's suite. Phase 4 (`99-network.js`'s `guestSendInput`/`guestInputTick`): a
  guest's own keys and look are relayed to the host, which simulates a real hero for them — `moveCircle`/`floorAt`/
  `angLerp`, the exact functions `heroUpdate` itself uses, so a guest collides with walls, rails and stairs exactly
  like the real hero does. The old single-hero broadcast became a roster (`onMessage('heroes',...)`, plural), so
  every screen renders every OTHER player, guest-to-guest included — a guest only ever learns a fellow guest left
  by the roster shrinking, since there's no direct connection between two guests to carry a `__leave` event between
  them. `coop-input-test.mjs` (host + two guests) proves the relay specifically: guest B, with no connection to
  guest A at all, still sees guest A move and later disappear, purely via the host. **Still open, and it's the
  real remaining work, not polish:** guests can only walk the hall together so far — `updateEnemies` and
  `hurtHero` still only know the host's own `hero`, so enemies never notice a guest and a guest can't swing, place
  a defense, take damage or be healed; gear-driven move speed isn't wired to guest heroes either. Making the
  crystal/waves/defenses actually shared needs those core single-player combat/targeting functions to learn there's
  more than one hero, which is a bigger, riskier change than any of phases 1-4 (all four were bolt-on modules that
  never touched game.js's own combat code) — split into phase 5 (sync the host's real world to a guest's screen,
  read-only) and phase 6 (let a guest actually fight in it) — both now COMPLETE — so each shipped and tested on
  its own.
  Phase 5, crystal/wave slice (`99-network.js`'s `hostBroadcastWorld`): a guest is helping the host defend ONE
  hall, not tracking a private one of their own — the host's real crystal HP and wave/phase reach the guest's HUD
  (`window.__world.host()`), drawn by a `Meta.hud` override laid down *after* `updateHUD`'s own now-irrelevant
  pass, the same non-invasive hook trick every module in this codebase already uses. Starting a wave is the host's
  call alone: `startWave` gets monkey-patched from the module (reassigning the same top-level binding every call
  site — the G key, the wave button, `window.__dd.startWave` — already looks up by name) rather than editing
  game.js, so a guest's own `startWave()` is a no-op with a toast. `coop-world-test.mjs` proves the guest's actual
  HUD (`#cbar`'s width, `#wavet`/`#phaset` text) matches the host's real numbers, and that the guest's own local
  `S.crystal`/`S.wave` stay untouched underneath (still running, just no longer what's displayed).
  Phase 5, enemies slice (`99-network.js`'s `hostBroadcastEnemies`/`window.__mobsync`): the host's real enemies now
  render as read-only puppets on a guest's screen too, not just an empty hall under a ticking HUD. `makeMob(kind)`
  is synchronous (`MOBGLB` is pre-fetched at page load) so a puppet builds the instant it's first seen, the same as
  a hero puppet (`98-party.js`) — but its animation is deliberately simpler (idle vs walking only, no shout/attack/
  death clips): `mobAnim` needs a fairly complete fake-enemy shape that isn't worth building for a puppet nobody
  can hurt or be hurt by yet. Two real bugs turned up building this slice: the broadcast originally left out `y`,
  so a flying enemy (the drake, spawned at `e.fly`'s altitude) would have rendered as if walking on the ground —
  fixed by syncing `y` like everything else; and `coop-mobsync-test.mjs`'s first draft compared a puppet's tracked
  position against the real enemy's position *at spawn time*, which fails as soon as the enemy starts walking its
  flow-field path — fixed by comparing against the host's current position instead.
  Phase 5, defenses slice (`99-network.js`'s `hostBroadcastDefs`/`window.__defsync`) — **this completes world-sync**:
  the host's real defenses render as read-only puppets too, so enemies visibly path around something instead of
  invisible obstacles. `makeDef(kind,ghost,lvl)` is fully monkey-patched by `50-defmodels.js` into the same kind of
  synchronous, GLB-aware builder `makeMob` is (`defTemplate(kind,lvl)` picks whatever's loaded), a drop-in parallel.
  A defense never moves once placed, so a puppet snaps straight to its spot with no easing, and only ever rebuilds
  if its level changes — the same thing `reskinDefs` does to the real one on an upgrade. `y` (elevation, not just
  x/z) mattered again here, the same lesson as flying enemies: a defense on the throne room's dais or stairs needs
  its real height. Deliberately skipped for this first cut: aiming (the yoke turning to track a target), recoil,
  and the aura defenses' glow ring (`defRingUpdate`, `93-gearsets.js`) — a puppet just sits at its placed position
  and rotation. Two test-harness bugs turned up writing `coop-defsync-test.mjs`: `window.removeDef` turned out not
  to be globally reachable the way an earlier test assumed (game.js's own functions don't leak onto `window`
  despite being a classic script) — fixed by splicing `window.__dd.defs` directly, which exercises the same
  broadcast path without needing that access; and the test's own tick budget (copied from the faster hero/enemy
  suites) wasn't enough simulated time to reach the defense broadcast's slower 2Hz threshold — fixed by giving it
  more ticks. **World-sync (phase 5) is done**: a guest now sees everything happening in the host's hall.
  Phase 6 (`99-network.js` + a small, deliberate touch to `game.js` itself): combat. The host's real enemies now
  notice and can damage a guest's hero, not just the host's own — `game.js` gets a new `Meta.heroes` hook (the
  same chainable-override pattern every other hook in this codebase uses, just the first phase that needed a new
  one) that `99-network.js` fills with live `{x,y,z,isDead,hurt}` entries per connected guest, and `updateEnemies`'s
  melee-proximity check (`nearestHero`, new) picks whichever hero — the host's own or any guest's — is actually
  closest, instead of a hardcoded single `hero`. This was the first time this co-op effort touched `game.js`'s own
  combat code directly, rather than staying a bolt-on module — every earlier phase managed without it (phase 7,
  below, is the second and third time). A guest can also swing and damage the host's real enemies: `swing()` gets monkey-patched to relay a `'swing'`
  message (the same top-level-rebinding trick `startWave` already uses), and the host's `guestHitCone` reimplements
  `hitCone`'s own forward-cone check for an arbitrary attacker, calling the exact same `hurt(e,dmg,kx,kz)` unchanged.
  `coop-combat-test.mjs` proves both directions end to end over a real WebRTC handshake.
  Before shipping, this diff went through an adversarial multi-lens code review (four independent review passes,
  each finding adversarially re-verified) precisely because it was the first phase to touch `game.js` — and it
  earned that caution: the review found five real, reproducible defects, not style nits. (1) A guest's own hp/death
  was tracked correctly on the host but never sent back to the guest's own screen — their health bar stayed
  permanently full and no hurt/death feedback ever played, because `hostBroadcastHeroes`'s existing roster
  broadcast deliberately skips a client's own entry (`if(h.id===mine) return`), and a guest's local `hero` never
  takes damage through its own, always-empty local simulation. (2) The same missing wire meant a guest's own local
  position permanently diverged from the host's authoritative one the first time they died, since the host's
  respawn snap never reached them. (3) `swing()`'s relay could double-send the `'swing'` message for one physical
  swing if two swing-bound inputs (an ordinary way to mash an attack key) landed in the same animation frame,
  doubling melee damage. (4) Two guests respawning around the same time stacked at the identical fixed spawn
  point, since the per-guest spread offset was only ever applied once, at first connection. (5) The ogre/trollboss
  roar-and-enrage trigger still checked distance to the host's own hero only, so a mini-boss fought entirely by a
  guest never roared or enraged. All five are fixed: a targeted `'hp'` message now applies a guest's own hp/dead/
  position straight onto their local `hero`, reusing `hurtHero`/`heroUpdate`'s own flash/SFX/toast/respawn side
  effects so it looks and feels identical to the real thing; the swing relay now captures `swingT` *before* calling
  the original (a same-frame rejected duplicate can't be mistaken for a fresh swing); each guest's spawn offset is
  now persisted on their record and reused on every respawn, not just the first; and the roar/enrage check now
  finds whichever hero (host's or any guest's) is actually nearest. `coop-combat-fix-test.mjs` (host + two guests)
  proves all five fixes directly.
  Phase 7 (`99-network.js` + `game.js`): defense placement, and a design requirement given mid-effort — "let me
  get my knight place that, he has fast ballistas": a defense a guest places should carry THAT GUEST's own live
  gear/skill stats, for as long as they're actually connected, not a permanent enchantment. A guest can now place,
  repair, upgrade and sell REAL defenses on the host's hall, spending the host's own shared mana/DU pool, not a
  pointless local copy. `placeDefAt` gets the same guest-relay monkey-patch treatment as `swing`; `repair`/`upgrade`/
  `sell`/`nearestDef` (game.js) gained an optional `pos` parameter defaulting to the local hero, so the host runs
  the exact same cost/effect math a real click would, from the guest's own host-tracked position, instead of a
  second, drift-prone copy of it. `upgrade()`'s own binding turned out to already be wrapped by two OTHER modules
  (a tavern-station UI intercept and the raven's character-sheet shortcut) that take no arguments and don't forward
  any — reaching it through that chain silently dropped a guest's `pos`, defaulting to the host's own (usually
  far-away) position and making a guest's upgrade request a silent no-op. Fixed by splitting the real logic into
  `upgradeDef(pos)`, a name nothing else wraps.
  Ownership: `stat()` (game.js) now routes a defense's damage/cooldown/range through new `oStat`/`oMult` helpers
  that check `d.ownerId` (set on a guest-placed defense by the host) via two new chainable `Meta` hooks,
  `defOwnerStat`/`defOwnerMult`, falling back to the local hero's own numbers exactly as before when there's no
  live owner — so single-player and host-placed defenses are byte-identical to before this phase. A guest's own
  six relevant `heroStat`/`heroMult` numbers, computed on THEIR OWN client where their gear is real, piggyback on
  the existing 15Hz `'input'` message rather than a new message type. When that guest disconnects, their stat
  snapshot is dropped with their other state, and every defense they placed transparently reverts to the host's
  own numbers — automatic, no special-case cleanup needed, exactly matching "for as long as they're in the game."
  Before shipping, this diff got the same adversarial multi-lens review phase 6 did, for the same reason (it
  touches `game.js` again) — and again earned it: 21 raw findings, all 21 confirmed real on independent
  verification. The two costliest: the new owner-aware `stat()` routing was applied to damage/cooldown/range but
  missed two OTHER formulas computing the same stats directly — the trebuchet's splash radius and the spike
  hedge's thorn counter-damage both still read the HOST's own gear, not the placing guest's (plus the same bug in
  a cosmetic tooltip) — fixed by routing all three through `oStat`/`oMult` too. The rest were trust-boundary gaps
  in the new host-side validator, `hostTryPlaceDef`: its "too far away" bound failed OPEN (skipped, not rejected)
  for a sender the host hadn't yet registered a position for — reproduced live, a crafted `'place'` message landed
  a defense 45+ units from where a guest claimed to be; it also never rejected a placement overlapping the
  placer's own tracked position (something the local ghost preview always blocks), never checked the game's own
  phase (a still-connected guest could keep building after the crystal fell or the map was won), and had no
  dead-guest gate at all where the parallel repair/upgrade/sell path did. All fixed: the distance check now fails
  closed, a "You're standing there" check mirrors the local one, a phase gate matches `select()`'s own, and both
  paths now reject (with a toast explaining why) a guest who's currently down. Smaller UX gaps also fixed: a dead
  guest's repair/upgrade/sell attempt used to be silently dropped with no feedback at all; and `repair()`/`sell()`
  only ever gave world-space `floatText` feedback on success (nothing a remote guest's own client renders) — a
  guest upgrading a damaged defense (which silently redirects into a repair first) got literally no confirmation
  that anything happened. `hostDefAction` now synthesizes a toast from the real mana change when nothing was
  already captured to relay. `coop-defplace-test.mjs` and `coop-defplace-fix-test.mjs` (13/13 each) prove the
  placement/repair/upgrade/sell relay, the owner-stat scaling (checked against the exact formula, not just "did
  it change"), stats reverting on disconnect, and every one of the trust-boundary fixes above, directly.
  A guest's own COMBAT damage/hp was still flat/unequipped at this point (`GUEST_DMG`/`GUEST_MAX_HP`) — only
  *placed defenses* drew on their real stats so far — fixed next, in phase 8.
- Co-op, phase 8: a guest's own SIMULATED HERO now scales with their real gear/skills too, closing the gap phase 7
  left open — "the guest should also carry their own stats, speed, damage, hp, weapon special damages, their
  equipment should affect their actions." `guestInputTick`'s move speed now reads the exact `(1+move%)*moveMult`
  formula `heroUpdate()` uses; `guestHero` gains a gear-scaled max hp (the same delta-preserving bump on increase
  `applyGear()` gives the real hero — heal on a hp buff only by the difference, not to full) and passive regen
  (`heroUpdate()`'s own post-hit-cooldown tick, base rate plus the guest's own `regen` stat); `hurtGuestHero`
  mitigates incoming damage by the guest's own `def` stat, same formula as `hurtHero()`. A swing's damage and reach
  now ride the `'swing'` message itself — read straight off the guest's own `heroDmg()`/`hero.reach` at the moment
  they swing, since `heroDmg()` folds in a GLB-attack-clip-duration ratio the host has no equivalent of for a
  guest's puppet, so having the guest compute the final number client-side (same idea as the periodic stat sync,
  just per-swing) is simpler than reconstructing the formula host-side. A witch/fighter/troll archer guest now
  genuinely threatens from range (reach 18/18/24) instead of only within melee's 2.4, using a generalised
  melee/ranged cone rather than a faithful port of the real bolt/arrow flight — no travel time, no single-target
  stop-on-first-hit, no charge multiplier, deliberately, since replicating that would mean relaying press/hold/
  release instead of one message, a materially bigger protocol change than "make the guest's own stats matter."
  `game.js` itself needed zero changes this phase — every formula it called was already general enough. Testing
  this phase's exact-value assertions (a +100 move stat doubling walk speed; a +50 hp stat bumping max by exactly
  50 while preserving an existing deficit; a +60 def stat mitigating 50 raw damage down to exactly 20; regen
  matching `1.5+regen` per second) turned up a real, pre-existing transport bug: PeerJS's own `'open'` event can
  fire twice for one `DataConnection`, and `wire()` (phase 2) wasn't guarding against being called twice for the
  same connection — a second call stacked a second `'data'` listener, so every message after that (not just
  `'swing'` — `'place'`/`'defAction'` too) was handled twice. Surfaced intermittently (roughly one test run in
  three) as a guest's swing landing for exactly double damage; fixed with a one-line re-entrancy guard on `wire()`.
  This phase's own testing also exposed real measurement traps worth naming for whoever writes the next co-op
  test: `game.js`'s own `requestAnimationFrame` loop keeps calling `update(dt)` with REAL wall-clock time
  underneath any test driving the sim through explicit `step()` calls, unless `window.__freeze` is set — without
  it, the real sleeps a multi-page WebRTC test needs between ticks (for messages to actually arrive) let a stray
  extra tick or two of real-time movement sneak in on top of the intended tick count, which is exactly what was
  inflating an early version of this phase's move-speed ratio test on some runs. `coop-herostats-test.mjs` (14/14)
  covers all of the above, including the `wire()` regression, against exact formulas throughout — not just "did it
  change."
  A ranged guest's attack was still the generalised cone above at this point, not a real single-target, travelling
  bolt or arrow — fixed next, in phase 9. **Still open, honestly**: a mini-boss's roar is still a cue for whoever
  it's aimed at, not a shared HUD/SFX moment; a guest gets no local range-ring/cost-prompt affordance standing near
  a real defense (`nearestDef`'s HUD-facing callers were never made position-aware) — they have to already know to
  press E/X and read the toast.
- Persistent per-player loadouts: this was flagged as still-needed work after phase 7, on the assumption that a
  guest's gear/skills only ever lived in this co-op module's own live state and would vanish the moment they
  disconnected. That assumption was wrong, and `loadout-persist-test.mjs` (9/9) proves it empirically rather than
  by re-reading the code: gold, xp/level, spent skill points, equipped gear and the bag itself were *already*
  fully persistent — `ddMeta`/`ddGear` (`parts/modules/10-meta.js`, `parts/game.js`'s `saveGear`/`loadGear`) save
  to `localStorage` on every single change (`saveMeta()`/`saveGear()` are called inline from every mutator —
  `addGold`, `addXP`, `spend`, `equip`/`unequip`, `bagItem`/`onPickup`, `buy`/`sell` — there is no separate "save
  game" action anywhere), completely independent of `99-network.js` and the co-op networking layer, which never
  touches `localStorage` or calls `Meta.reset()`/`resetGear()` on join. A guest's own browser already saves and
  loads their gear/gold/skills exactly like single-player, whether or not they ever join anyone's hall. Nothing
  needed to be built — this was a verification task, not an implementation one.
- Co-op, phase 9: a ranged guest's shot (witch/fighter's staff bolt, troll archer's bow arrow) is now a REAL
  projectile — it travels, stops at the first wall or mob it meets, and pierces on a full draw — not phase 8's
  generalised instant-hit cone. The trick that made this cheap rather than "a materially bigger protocol change":
  `boltsUpdate`/`arrowsUpdate` (82-staff.js/83-bow.js) were already wired into `Meta.update` unconditionally, on
  every page regardless of role, so once the host spawns a guest's shot into its own `BOLTS`/`ARROWS` array (via
  `fireBolt`/`fireArrow`, now exported raw from those files — no live weapon model needed, unlike the `fire()`/
  `fireFromHand()` they already exposed), the existing per-tick collision/wall-block/pierce loop just carries it,
  hurting the host's real `enemies` exactly as it would the host's own shot — nothing about those update loops
  needed to change. The relay moved from `swing()`'s press moment to `hitCone()`'s own release moment (a new,
  further-out wrap around `hitCone()`, melee guests untouched, still relayed at press via `swing()` as before) —
  the only point a held shot's final aim and charge are actually known, and where the real local fire already
  happens too. The guest computes every derived number itself (damage, speed, lifespan, splash/pierce, visual
  size) using 82-staff.js's/83-bow.js's own `hitCone()` formulas at that exact moment, same "guest computes the
  real number, host just uses it" pattern phase 8 established for damage. One real limitation carried over
  honestly: `window.__aim.pick()` (the reticle's lock-on) always returns `null` for a guest, since it scans the
  *local* `enemies` array (`game.js`) a guest never has real enemies in — every guest shot is free-aim
  (`window.__aim.dir3()`), never a homing lock, even standing right next to a mob; not a bug this phase introduced,
  just not something it fixed either. Also true, and also pre-existing: nobody but the host ever *sees* a guest's
  bolt/arrow fly — bolts/arrows were never synced to other screens at all, even for the host's own shots.
  `coop-projectile-test.mjs` (11/11) tests exactly the properties that distinguish a real projectile from the old
  cone rather than re-proving damage math coop-herostats-test.mjs already covers: a tap shot hits the nearer of two
  enemies in its path and stops there, damage doesn't land until the shot has had time to travel, and a real
  full-charge draw (driven through `window.__aim.press()`/`release()`, the only place in either suite that
  actually exercises the hold-and-charge state — calling `swing()` directly, as every other test in both suites
  does, never engages it at all) pierces through to a second enemy that a tap shot couldn't reach. Updating
  `coop-herostats-test.mjs` for the new mechanic also caught two real test bugs of its own, not production code:
  its old 30-tick wait was long enough for the instant cone but too short for a real bolt to fire and travel,
  intermittently letting one section's still-in-flight shot land during a *later* section's assertions instead;
  and its expected damage for a tap shot needed multiplying by `window.__aim.shot().mul` (`TAP_MUL`, ~0.6) since
  the old cone never applied a charge multiplier at all and the real fire path always does, tap included.
- Co-op, phase 10: an actual title-screen UI to reach any of this — every phase before now only ever exposed co-op
  as a `window.__net.host()`/`.join()` console API, unusable by anyone who isn't opening dev tools. `parts/head.html`'s
  `#start` screen gains two buttons, **HOST A GAME** and **JOIN A FRIEND**, wired in `99-network.js` (not `game.js`,
  same "co-op UI lives in this module" reasoning as everything else here). Hosting shows the real room code PeerJS
  itself generates — nothing to invent or agree on beforehand — with a tap-to-copy and a manual "▶ ENTER THE HALL"
  step, so the code stays on screen until it's actually been shared, rather than vanishing the moment hosting
  succeeds; joining just takes the code a friend sent and connects straight into the hall. One real bug this caught:
  `game.js`'s own keydown handler already calls `play()` on `Enter`/`Space` while `S.phase==='start'`, with no check
  for whether an input has focus — unguarded, pressing Enter to submit a join code would ALSO fire that handler.
  Fixed with `stopPropagation()` on the input's own keydown, the same guard `60-lootfeel.js`/`65-tavernroom.js`'s
  own input-conflicting hotkeys already use. `coop-titleui-test.mjs` (10/10) drives the real buttons and input
  Playwright's own way (`.click()`/`.fill()`/`.press()`), not `window.__net` directly — including typing a wrong
  code first, to prove both the error path and the Enter-key guard hold.
- The hideout portal (`58-portal.js`, new): a crystal archway that pops in during the build phase and back out at
  the horn, mirroring the raven's own lifecycle (`57-raven.js`) exactly — same `easeOutBack` pop, same
  `MAP.portal||null` per-map placement with a fallback beside the crystal, tucked out of the way the same way the
  raven is. Visual only, deliberately: no E-prompt, no interaction, no hideout behind it yet — that's its own
  separate, still-in-progress piece of work; this module only makes the portal itself show up where it'll
  eventually lead. `parts/assets/hideout-portal.glb` is a Meshy export shrunk from 21MB to 1.2MB the same way
  `meshy/merge-static.mjs`'s static-prop pipeline would (512px texture, no metal/rough map — `toonify()` only ever
  reads a model's base color map, so the original metallicRoughness texture was dead weight from the start, not
  just oversized). `portal-test.mjs` (5/5) proves the pop-in/pop-out lifecycle and that it sits at a distinct spot
  from the raven, not on top of it.
- Co-op, phase 11: two real bugs a real two-player test (title-screen UI, separate devices, an actual host + an
  actual guest) turned up that nothing scripted so far had caught, since every earlier co-op suite reads damage/hp
  through `window.__dd`/`window.__combat` directly rather than checking what a GUEST's own screen actually shows.
  First: a guest's hits were always real — landing on the host's actual enemies, for real damage — but `hurt()`'s
  `floatText`/`SFX.hit` are purely local to whoever is simulating the hit (the host); a guest's own puppet enemy
  just silently lost hp with zero feedback until it eventually vanished, dead. A real player read this exactly
  right: "it's all basically cosmetic." Fixed by adding `hp` to `hostBroadcastEnemies`'s payload and diffing it
  puppet-side in `onMessage('enemies',...)` — the same `floatText`/`SFX.hit` every local hit already uses, now
  guest-side too, no new message type or per-swing attribution needed. Second, and the more interesting bug: when
  the host's real crystal died (or their last wave held), the HOST alone got dropped to the SHATTERED/HALL HELD
  screen — a guest just kept standing in a now-frozen, empty hall with no idea the run was over. The first fix
  attempt (piggyback the phase onto the existing `hostBroadcastWorld` 10Hz broadcast) looked right and *tested*
  right in isolation, but failed for a specific, structural reason `coop-feedback-test.mjs` caught: `update()`
  (`game.js`) stops calling `Meta.update()` — and everything inside it, `hostBroadcastWorld` included — the instant
  `S.phase` becomes `'deathcut'`, and never resumes once it's `'dead'` either. The hall correctly freezes for the
  host's own death cutscene, then just stays frozen, forever, for everyone, since nothing ever broadcasts again.
  Fixed with an explicit one-shot `'runEnd'` message sent directly from `finishDeath()`/`winMap()` themselves
  (monkey-patched, same trick as `startWave`/`swing`/`hitCone` elsewhere in this file), which doesn't depend on
  `Meta.update` at all — `send()` writes straight to the data channel the moment it's called. `guestShowRunEnd`
  reuses the same `#dead` overlay `finishDeath()`/`winMap()` already show solo, retitled for a guest (never
  `Meta.onRunEnd` — that's the single-player reward/campaign-progress hook, scored off THIS client's own wave/gear,
  not something the host's outcome should trigger for a guest at all). `coop-feedback-test.mjs` (18/18) proves both:
  a guest's own `hitFeedback()` counter and puppet hp catch up the moment their swing lands; the guest's own
  `S.phase` moves to `'dead'`/`'won'` and shows the right overlay text the moment the host's real run ends either
  way, driven through the actual `hurtCrystal()`/last-wave-cleared paths, not a direct phase-assignment shortcut.
- Co-op, two more real-play join/host bugs, neither one a connectivity problem this module's own code controls, both
  now handled instead of leaving a player stuck with zero signal. First: PeerJS's own default room code is a full
  auto-generated UUID — fine for a machine, a real mouthful to read aloud or thumb-type on a phone, which real
  testing turned up fast ("this giant invite code is a little much"). `hostbtn` now generates its own short,
  spoken-friendly code (`shortRoomCode`, 5 chars from a 32-symbol alphabet with no ambiguous 0/O/1/I/L) and hands it
  to `Peer()` as the room's own id, rather than leaving PeerJS to auto-generate one; on the rare real collision
  (`'unavailable-id'` — the code's already someone else's live game right now) it quietly tries a fresh one, up to a
  few times, rather than surfacing a confusing error for something this recoverable. Second, and the one that
  actually stopped a real session cold: WebRTC's own peer-to-peer negotiation can hang indefinitely — neither an
  `'open'` nor an `'error'` ever fires — on some wifi/cellular networks (symmetric NAT, a firewall blocking UDP, a
  backgrounded tab throttled mid-negotiation). A real player hit exactly this: "Connecting…" forever, no error, no
  way to know anything was wrong. `doJoin()` now bounds that wait (`JOIN_TIMEOUT`, 20s) with a real, actionable
  message — without cancelling the underlying attempt, so a slow connection that lands late still lets them in
  rather than stranding a connection that did eventually work. `coop-joinux-test.mjs` (11/11, new) proves the short
  code's format, the collision retry (and that it gives up after a bounded number of tries rather than looping
  forever), the timeout message itself, and the late-success path, all via mocking `window.__net.host`/`.join`
  rather than needing a real, deliberately-broken network to reproduce a hang on demand.
- Co-op, phase 12: loot and mana orbs are now real for a guest, and mana is per-player. Two real-play asks landed
  together here because orb pickup is exactly where a guest's own mana pool gets earned into. "i joined him and never
  saw any loot drop" shared its exact root cause with the phase-11 hit-feedback bug: `kill(e)` (game.js) spawns both
  loot and orbs into the host's own arrays, and `updateLoot`/`updateOrbs` only ever check proximity against the LOCAL
  `hero`, so a guest's own always-empty arrays never grow. `hostBroadcastPickups` (99-network.js) now syncs both as
  puppets (`LOOTPUP`/`ORBPUP`, same roster-diff pattern as mobs/defs), and — the part puppets alone couldn't cover —
  `guestPickupTick` sends a pickup request the instant the guest's own hero is close enough; the host validates the
  item still exists (first-come-first-served, someone else may have got it), removes it for real, and grants it back
  to that guest specifically. Loot turned out simpler than first designed: `Meta.onPickup(it,pos)` (10-meta.js) is
  ALREADY the complete real pickup flow (bag it, or auto-sell for gold if full) and always returns true for a valid
  item — the equip-or-sell-for-mana fallback `pickup()` itself falls through to is dead code in the real game, never
  reached — so `guestApplyLoot` just calls `Meta.onPickup` directly, scoped to the guest's own bag/gold for free.
  Then "mana seems to be shared, we need to change that — split into separate pools per player": each guest gets a
  `guestMana` entry seeded at `MAP.mana||260` (the exact fallback `S`'s own init already uses — the default 'hall'
  map never sets `MAP.mana`, a real bug the new test caught immediately when the pool came back `undefined`), earned
  into by orb pickups (value scaled by THAT guest's own reported mana stat, now riding the 15Hz `input` payload) and
  the wave-held bonus (`Meta.onWaveHeld` wrapped to credit every connected pool the same `50+10*wave`, host-only by
  construction since a guest's own `S.phase` never reaches 'wave'). Spending needed no game.js changes at all:
  `hostTryPlaceDef`/`hostDefAction` temporarily point the shared `S.mana` binding at the acting guest's own pool for
  the duration of each synchronous call and read it back after, so `placeDefAt`/`repair`/`upgradeDef`/`sell`'s own
  real cost formulas and messaging land on the right pool untouched. `hostBroadcastWorld` gains `manas` (every
  player's own pool by peer id; the old `mana` field keeps its host's-own meaning) and the guest's `Meta.hud` reads
  its own entry for both the number and the hotbar affordability styling. DU stays hall-wide on purpose — a
  structural cap on the hall, not a personal resource. Gold/xp for a wave-held are still host-only (10-meta.js's own
  `onWaveHeld`), a separate gap deliberately not widened into here. `coop-pickups-test.mjs` (21/21) drives all of it
  through real physics — an enemy killed for real, orbs and a dropped item settling for real, the guest actually
  walking to where each landed — and proves the pools are genuinely independent both ways (the host's own mana
  boosted to 50k changes nothing for the guest; the guest's own spend never touches the host's). Three older suites
  needed their stale shared-mana assertions updated to match (`coop-defplace-test.mjs`), and one guessed-delay race
  in `coop-feedback-test.mjs` surfaced once a fifth broadcast channel joined the others — its section 3 runs an
  entire wave-clear inside ONE synchronous `evaluate()` with no yields, so every queued message only flushes once it
  returns; now polls for the real state instead.
- The hideout, through the portal (`59-hideout.js`, new; `parts/hideout/`, new; `embedHideout()` in `assemble.mjs`): E at
  the crystal archway during the build phase now actually goes somewhere, and a 🔮 THE HIDEOUT button on the title
  screen goes there outside a run. The hideout itself was built in a parallel session as its own standalone page (the
  `hideout-wip` branch: a first-person room with its own Three.js, pointer-lock WASD, the Trade-O-Matic furniture
  shop, the Forge's mythic-gear gamble, the Cauldron Cart's tiered sludge crafting, free furniture placement, and a
  shared gear display backed by a Cloudflare Durable Object). It's folded in exactly as it ships — `parts/hideout/`
  holds its `index.html`, `vendor/` and `assets/` byte-for-byte, never edited here, so a newer upstream copy drops
  straight in (`node sync-hideout.mjs` pulls the branch and records the hash in `parts/hideout/UPSTREAM`) — and the
  assembler derives the embedded variant into `dist/hideout/` at build time: site-root paths
  made relative (the site root isn't `/` on GitHub Pages or the artifact), a `?api=` base for its shared-gear
  Worker, an exit that knows when it's embedded, and a BACK TO THE HALL button on its entry overlay (its own crystal
  portal starts unplaced, in the hotbar). Every rewrite is anchored and fails the build loudly if upstream moves. Its models ship as
  base64 `.glb.txt` like the game's own (the artifact host serves no `.glb` at all), with the derived page's
  `GLTFLoader` taught to read them; the source copy keeps the real `.glb` files.
  The design decision that's this repo's own: the hideout opens in a full-screen iframe OVER the hall rather than
  navigating away, so the game page never unloads and a live co-op session (PeerJS dies with the page) survives the
  trip — both players can be in the hideout at once with the host's game still running underneath, and the shared
  gear table is what they see in common. The hideout's portal (or that button) posts `hideout:exit` and the overlay
  drops, leaving you where you stood; the horn sounding pulls you out automatically. `?hideoutnav` switches to the
  full-page navigation the hideout's own brief describes, for a deployment where its page is served next to the game
  at the site root (the Worker) — the game already restores gold/xp/level/skills/bag from `ddMeta` on a fresh load,
  so that round trip works too, at the cost of any co-op session and the abandoned run. THE GEAR HANDOFF follows the
  hideout's contract: `localStorage` `dd_gear_bag` = per-rarity integer counts (`common`/`uncommon`/`rare`/
  `legendary`, plus this game's own `epic` under its own name), always read-modify-write and ADDED to — the
  Cauldron Cart decrements these as it crafts, so an absolute write would resurrect used-up gear — with a field the
  hideout side owns left untouched. What goes in is the bag: every unequipped piece, which leaves the bag for good;
  worn gear and the armory's kept treasures are never touched. There is no prompt at the door (there was one for a
  build; the player asked for none): lock what you keep — see the lock below — and everything else unequipped is
  scrap, decided in the bag ahead of time; the hideout's own Cart and gear panel are where the results show up.
  `hideout-test.mjs` (42/42) drives the real E keypress walking straight through, the counts, the iframe actually
  running the hideout's page with its models loading from `hideout/assets/` and nothing leaking to the site root,
  the hideout's own acceptance step (its Cauldron Cart reads the carried count, crafting spends it down to 0 in
  storage, and a later carry lands on that 0 rather than resurrecting what was used up — the whole reason the
  contract says ADD), both ways out, the title-screen button, a fresh load restoring from `ddMeta`, and the page
  standalone. The hideout side kept pace in the same afternoon (`a3e6b0e`, then `ca52e25`): the Cart reads
  `dd_gear_bag` and salvages every rarity (a row per rarity, five counts in its header, the frames in this game's own
  `RCSS` colours), `epic` is one of its default keys, its testing seed is gone, and its Worker answers CORS for
  `dragonpony1.github.io`, so the game hands the derived page that Worker as its API base when served from GitHub
  Pages (same-origin everywhere else). Not linked yet: hideout-forged mythic/unique gear coming back into the game
  (needs a real item database, per the brief).
- Load order (`fetchBytes`/`firstLoadsDone` in `game.js`; `70-hero2.js`, `55-crystal.js`): "build 21 · hero model:
  loading…" for minutes on a phone turned out to be queue order, not a hang. Some sixty models (~80MB of base64)
  are requested the moment the page runs and a browser keeps about six connections open per host, so the hero —
  requested by a late module — sat behind cannons, mushrooms, totems and armor stands nobody could see yet, and
  the build line (which only updates once the hero lands) read as "still loading" the whole time, and the sword in
  the hero's hand arrived after wave one. Loads now run in three tiers, each waiting for the one before it to land
  (or a timeout, so one hung fetch can never hold the hall hostage): `'first'` is what the start screen shows (the
  hero, the crystal, the sword in hand — `80-weapons.js` already fetched only the equipped one); `'soon'` is what
  getting in and placing needs (mark-I defenses and their shots, the wave-one goblin, the raven, the portal, a map's
  own decor, a co-op friend's hero); everything else is `'later'` and streams behind while the player is already
  building (the music, `40-music.js`, waits on the first tier too). And three things aren't loaded at start at
  all any more: a defense's marks II–IV are fetched the moment one first reaches them, with the next mark prefetched
  so the upgrade after that lands dressed (`50-defmodels.js`, `ensureDefMark` from `reskinDefs`; `defTemplate`'s
  fall-back to the highest loaded mark is what it always did); a familiar's model when one of that kind is first
  called for (`85-familiars.js`); a set's armor-stand mannequin when a stashed piece of that set first needs it
  (`96-armory.js`). The startup stream went from 59 model requests to 25, and the ~30MB of upgrade marks now only
  come down for kinds actually placed. The build line also shows the real build number from the first frame instead
  of `head.html`'s old placeholder — that literal "build 21" had already sent one real playtest down a
  cache-clearing rabbit hole. `loadorder-test.mjs` (15/15) records the real request order: the three firsts, nothing
  else requested until they've finished, the soon tier next, the later tier only once the whole soon tier has landed,
  no upgrade mark / familiar / armor stand at start, and a placed ballista asking for Mark II, then Mark III on
  upgrade, which actually lands.
- Bag sorting (`sortedBag`/`setBagSort` in `10-meta.js`; `20-tavern.js`; `68-paperdoll.js`): the bag page sorts
  by type (slot order — weapon · armor · charm · amulet · familiar — best rarity first within each, with a heading
  per group so the eye can jump straight to "amulets"), by rarity (best first, a heading per rarity), or newest
  first; one small button in the BAG header cycles the three, and the choice is remembered (`ddBagSort`) like the
  sound toggles. Type is the default. The bag itself is never reordered — `equip()`, the armory and saves all splice
  by id and stay stable — only the views ask for `sortedBag()`, and the character sheet's inventory grid follows the
  same order. `bagsort-test.mjs` (19/19) bags eight scrambled pieces and checks every mode's order and headings, the
  cycle, the reload, the sheet's grid, and that equipping the top card equips exactly that piece.
- The lock (`toggleLock` in `10-meta.js`; `20-tavern.js`; `68-paperdoll.js`; `59-hideout.js`): "a named mythic drops, it
  looks cool, but I'm not going to equip it over my set bonus — I want it on display in my hideout." 🔒 Lock on any
  bag card's detail panel (the tavern and the character sheet both). A locked piece is never scrapped at the portal
  and never sold — not by Sell junk, not by the Sell button, which stays disabled until it's unlocked — and it leads
  its group in the sorted bag so what's being kept is easy to spot. The flag lives on the item, so it rides along
  worn, kept or saved. At the portal there's no prompt and no choice: the unlocked pieces become scrap for the Cart
  and the locked ones ride through whole, as gear for the hideout's display — the locked ones leave the bag as
  whole item records appended to `localStorage` `dd_gear_carried` — the hideout's second contract, an array of items
  (id, name, slot, rarity 0–4, lvl, tier, stats, value, score, `from:'dungeon-hold'`, `carriedAt`), read-modify-write,
  never the same id twice. The hideout side landed the same day (`dd083cb`): YOUR GEAR lists carried trophies next to
  its forged mythics (slot icon, this game's rarity colour, name, level) and they go onto the shared display through
  the same flow, the record leaving `dd_gear_carried` only then and coming back if picked up; the Cart never sees them. `gearlock-test.mjs` covers the lock from both views, the junk sale and the Sell button refusing a
  locked piece, the sort order, the walk-through with no prompt, the two contracts written correctly (counts for the unlocked, whole
  records for the locked, a record the hideout side already held left alone), the all-locked case, and a reload.
- Co-op, phase 13 — guests earn what the host earns (`99-network.js`): gold and xp for a held wave, xp for kills and
  the run's payout gold all used to reach only the host's own Meta, since only the host runs the sim and fires those
  hooks; a guest could defend twenty waves and never level. The host now relays each the moment it fires:
  `waveHeld` and `killXp` as direct sends (the guest applies the same Meta hooks on its own page, to its own
  gold/xp/level — the mana half of a held wave already went to `guestMana` in phase 12), and the payout rides the
  existing `runEnd` (25 per wave held, +150 for a map held, on the guest's own dead/won screen). Kill xp is PARTY
  xp — every connected player gets the xp for every kill, whoever landed it — because a guest's bolts and arrows are
  simulated on the host with no clean way to attribute a killing blow, and towers are shared anyway. Host-only on
  purpose: `onRunEnd`'s own bookkeeping (best wave, shop tier, campaign progress) is the host's save telling the
  host's story. `coop-rewards-test.mjs` (16/16) proves a goblin and an ogre are worth 2 and 40 to the guest, a held
  wave pays 15 gold and the guest's xp gain matches the host's exactly, a defeat pays 25 and a map held 25×waves+150
  on the guest's own screen and into its save, and the guest's best wave stays untouched.
- The Void set fleshed out (`94-voidset.js`, new; `93-gearsets.js`; build 127). Three things it still borrowed are now its own.
  (1) Its sword: an obsidian blade built in code like the void staff and bow (a violet fuller with runes, a horned iron guard
  lit at the tips, a wrapped grip, a floating crystal pommel), registered with the weapon mount as `void` so a Void weapon
  in the knight's hand is no longer the holy blade tinted — `pack.models.sword:'void'`. (2) Its five-piece power on defenses:
  `pack.defKind` maps a defense kind to a fraction (`{dazzle:.75}`), applied in `stat(d,'dmg')` as a multiplier for a halo
  that has damage of its own, and — since the Dazzling Halo only confuses — as a LASH for it: while the full set is worn,
  every dazzle ring the wearer owns also hits everything it dazzles with void energy, 75% of a Storm Halo's blow on a Storm
  Halo's rhythm, scaled by mark and the owner's defense buffs, with a violet pulse each time it lands. The owner is what
  matters: the host by its worn sets, a co-op guest by the kind map its client reports (`kind` in the guest's input payload,
  `Meta.defOwnerKind`), so a friend's halos carry the friend's set, never the host's. (3) Its unlock: the first time all five
  pieces are worn, a record goes into localStorage `dd_hideout_unlocks` — the hideout's third contract, an object keyed by
  unlock id (`{id:'stand-void',set,name:'Void Armor Stand',model:'armor-stand-void.glb',at,seen:false,claimed:false}`);
  the game only ever adds, the hideout flips `seen`/`claimed` — with a toast and a floating VOID ARMOR STAND UNLOCKED. The
  hideout side (a wall locker that glows while an unlock is unseen, the stand offered as furniture) is the other session's.
  The set's violet drop column, sound and the hero's aura are 93's and unchanged. Also for play: every mob's mana orbs are
  worth 25% more (`MANA_ORB_MUL` in game.js, read by the co-op orb grant too). `voidset-test.mjs` (20/20) covers the
  sword in the knight's hand, the unlock written once and never overwritten, the lash landing on dazzled goblins in solo
  and co-op (a guest-owned dazzle lashes with the guest's tow, a host-owned one doesn't when only the guest wears the set),
  no lash at three pieces, and an orb worth 5 × 1.25.
- Halo light columns (`auraRing` in game.js; build 127): each of the four elemental halos stands a faint see-through column
  of its own colour on its ring — an open cylinder 2.4 tall, brightest at the floor and gone by the top (vertex colours fade
  to black, and under additive blending black adds nothing), no depth write so it never hides what walks through it,
  opacity .06 at rest breathing ±.015 and +.04 while a mob stands inside. It grows with the ring at each mark. From the
  camera's height it says which halo this is and who is inside it, where the flat ring alone was hidden behind the mobs;
  kept faint on purpose so four overlapping halos never wash out a lane. The totem and frost spire keep their own aura.
  `halo-column-test.mjs` (25/25).
- Hideout copy at `478753a` (hideout build 9: shell-first loading, each model parsed once and cloned, props after the walls;
  a build number of its own). The assembler now reads the hideout page's `<meta name="hideout-build">` and stamps it into
  the game (`HIDEOUT_BUILD`), so the status line reads `build 127 · hideout build 9 · …` and Matt can compare the embedded
  copy with the live page without opening the overlay (`__hideout.build()`; the build fails loudly if the meta is missing).
- New ballista art (build 128): Matt's four Meshy ballistas (`ballista-tier1..4-lowpoly`), run through `meshy/merge-static.mjs`
  (`yaw=90` so the bolt faces +Z, `tex=512`, the metal/rough maps dropped) from 18-20 MB raw to 1.2 MB each, so the load
  budget of build 123 is untouched. They are rigged, per the ask, so "the main bow part pans and tilts": `hingeSplit` in
  `50-defmodels.js` cuts each mark at its waist (`HINGE.harpoon` .53 of the height, the pivot block under the stock) into a
  pedestal that never moves and a bow assembly hung from a mount at the pedestal's top -- the footprint centre of the
  slice just under the cut, i.e. the pivot post, not the model's centre, which the long stock pulls forward. The
  assembly is a `pitch` group (tilts at a drake) inside a `yoke` group (pans to the target, and recoils), so the game's
  own handles didn't change: `yoke.rotation.y`, `yoke.position.z`, `pitch.rotation.x`. `ballista-rig-test.mjs` loads all
  four marks and checks the hierarchy, the hinge height, the facing (winch post behind the pivot, bolt tip ahead), a pan at a
  goblin inside the Mark I arc with the pedestal's meshes provably still, the tilt at a drake, the bolt, and the ghost.
- Hideout on the artifact host fixed (build 129): under the viewer's strict Content-Security-Policy (`connect-src 'self'`)
  the hideout's stock `GLTFLoader` turned every embedded texture into a `blob:` URL and fetched it, the policy refused the
  fetch, every model failed to parse and the room never built ("Building the room… 0%" forever). The game's own loader
  had this fix already (decode from the bytes with `createImageBitmap`, no object URL, no fetch); `patchHideoutLoader` in
  `assemble.mjs` now applies the same two anchored rewrites to `dist/hideout/vendor/GLTFLoader.js` at build time, the
  source copy staying stock. `hideout-test.mjs` (47/47) loads the page under that CSP and checks all six shell files parse
  and the tiles come in textured with no blob/CSP error. On GitHub Pages nothing changes: no such policy there.
- Hideout copy at `55709b6` (hideout build 10): a placeable Arcane Wardrobe, the physical home of `dd_gear_carried`, with
  a reward contract of its own -- a reward is a normal `dd_gear_carried` record with `reward:true` and an optional
  `reason` shown under the name; the hideout adds `rewardSeen` when the locker is opened, shows an arcane banner on
  entry and steams the wardrobe until then. The Void unlock (build 130) now speaks that contract: the first full wear
  appends the Void Armor Stand as a legendary armor-slot reward (`reward-stand-void`, reason "The Void set, complete",
  `model` named for the hideout's later use) and the game keeps its own granted ledger in `dd_hideout_unlocks` (one
  entry per unlock id) so a reward that has been claimed -- the record leaves the list when the piece goes on display --
  is never granted twice. `voidset-test.mjs` (22/22) walks the grant, the hideout's `rewardSeen` and foreign record
  surviving a re-check, and the claimed reward staying claimed.
- The Forest set, the starter (`93-gearsets.js`; build 131) -- the first of the map-one training wheels. Green like the
  Uncommon it starts at: Uncommon+ from wave 1, 30% of such drops through wave 3 fading four points a wave to a 6% floor,
  worth ×1.5, so a new player completes a set in a run or two and learns the frame on pieces that don't matter much. Three
  pieces +8% health and +4% move; five +15% health, +8% move, +10% hero damage and BRAMBLE (every hit roots the target
  1.5 s, a green ring). The venom blade, hazel staff and yew bow stand in, the forest mannequin is its stand, and the
  full set's locker reward is the Forest Armor Stand (an uncommon reward, so the locker is learned early too). The
  first set piece a player ever sees lands with a one-line lesson ("wear three for a bonus, all five for its power"),
  once per browser (`dd_setHint`), and the sheet's set panel lists every registered set with its count, so "of the
  Forest 0/5" tells a new player a set exists before the first piece lands. `forestset-test.mjs` covers the chance curve from the real roll at waves 0/1/6/12,
  the Common floor, the lesson firing once, the bonuses on the multiplier hook, the reward, BRAMBLE on a knight's hit,
  the blade and the aura; `sets-test.mjs` now expects both sets.
- Ideas queued: switch heroes mid-defense; a Survival mode (endless waves); touch buttons for pause and the sheet on iPad.
- Eight more great sets to design (suffix, drop rule, buffs, sound); each is one `addSet` entry. The Holy set is next.
- Meshy art still wanted: turnip trebuchet, hobgoblin archer, and the Frost Spire (none of the uploads so far is a frost
  tower — the seven unnamed `Meshy_AI_model.glb` files were the drake, the first three ballista marks (replaced in build 128), the acorn cannon and the barkeep;
  `frost-1..4.glb` in `assets/` and a fetch line in `50-defmodels.js` would wire it).
- Upgraded gear raises gear score, which nudges mob health up a little (rubber band); revisit if it feels punishing.
