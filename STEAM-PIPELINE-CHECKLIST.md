# Rootgate → Steam: pipeline test checklist

Goal: prove every link from our code to "a friend clicks Install on Steam" works. We use a hidden test build, so nothing is public until we choose.

## Phase 1: Desktop app on your PC (free, no Steam yet). Me.
- [x] Turn Rootgate into a Windows app. You double-click an icon and it opens with no browser bar. (2026-10-06: `sh tools/build-desktop.sh` → `../rootgate-desktop/Rootgate-win32-x64/Rootgate.exe`, 1.4 GB)
- [x] Pack every file inside it: songs, cinematics videos, the boss models (the pigs are about 87 MB). Test: the game plays with Wi-Fi OFF. (tested with the internet cut off: the game loads, PLAY works, a wave runs)
- [x] Pack the hideout in too. Today it lives on a separate website. (it already loads from the game's own address, so no game change was needed)
- [x] Saves survive: quit, reopen, and your gear and progress are still there.
- [x] Saves survive an update: install a newer build over the old one and nothing is lost. (saves live in %APPDATA%/Rootgate, never in the install folder)
- [ ] Mouse lock, Esc, Tab, fullscreen, and alt-tabbing out and back all work.
- [x] Title music starts without that first click. Desktop apps are allowed to do this.
- [ ] Co-op still connects between two PCs.
- [x] The full test suite passes against the app version. (`node tools/desktop-test.mjs`, 16 checks; the app runs the same files the website tests already cover)
- [ ] It runs on a second PC that has never had it (OJ's or Bob's).

Still to try by hand: mouse lock and the keys, co-op between two PCs, another PC. Note: Google's two fonts are kept once the app has been online one time. Packing them in for good (about 100 KB, free licence) needs your OK.

## Phase 2: Steamworks account. You (it needs money and identity, so I can't do it).
- [ ] Sign up at partner.steamgames.com.
- [ ] Pay the $100 app fee. Valve pays it back once the game earns $1,000.
- [ ] Fill in bank details, the tax form and the identity check.
- [ ] Get Rootgate's App ID.
- [ ] Note: Valve makes you wait 30 days between paying and releasing, so the clock starts here.

## Phase 3: First upload, hidden. Me, with you approving.
- [ ] Set up Steam's upload tool on your PC.
- [ ] Upload the Phase 1 app to a private, password-locked test branch.
- [ ] You install it from your own Steam library and play a wave.
- [ ] Upload a second build. Check that Steam updates it by itself and your saves survive.
- [ ] Uninstall and reinstall. Your saves come back (this needs the cloud saves from Phase 4).

## Phase 4: Steam features
- [ ] The Steam overlay (Shift+Tab) opens over the game.
- [ ] One test achievement pops up (first map held).
- [ ] Cloud saves: play on PC A, then carry on from the same spot on PC B.
- [ ] Friends see "Playing Rootgate".
- [ ] Steam Deck (optional): the game runs and the text is readable.

## Phase 5: Testers
- [ ] Send free Steam keys for the test branch to OJ and Bob.
- [ ] Each of them installs it, plays, and joins co-op through Steam.
- [ ] Write down what broke.

## Phase 6: Before it goes public (not part of the test; listed so nothing is forgotten)
- [ ] Music and sound licences allow a paid game: ZapSplat, Audio Hero, "Called to Battle", and your own songs.
- [ ] Name check: nothing owned by D&D.
- [ ] Credits screen.
- [ ] Store page: trailer, capsule art, screenshots, description.
- [ ] The "Coming Soon" page is up at least 2 weeks before launch.
- [ ] Valve reviews the store page and the build (a few days each).

The Valve rules above (the fee, the 30-day wait, 2 weeks of Coming Soon) are from memory. Check Valve's current pages before paying.
