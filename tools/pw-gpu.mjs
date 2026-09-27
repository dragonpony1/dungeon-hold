// Preload for running the *-test.mjs suites on Matt's Windows PC:  node --import ./tools/pw-gpu.mjs coop-test.mjs
// The suites launch Chromium with SwiftShader (software WebGL, so they run the same on any CI box). On this PC two
// game pages rendering in software starve the whole machine: a co-op guest page took 25-90+ s to load and the tests
// timed out. This swaps SwiftShader for the real graphics card (ANGLE on Direct3D 11) — the guest then loads in <1 s.
// Nothing in the suites changes; without the preload they behave exactly as before.
import { chromium } from "playwright";
const GPU = ["--use-angle=d3d11", "--enable-gpu", "--ignore-gpu-blocklist"];
const launch = chromium.launch.bind(chromium);
chromium.launch = (opts = {}) => launch({ ...opts, args: (opts.args || []).filter(a => !/swiftshader|^--use-gl=|^--use-angle=/.test(a)).concat(GPU) });
