// Voidhammer: The Shattered Realms. Third-person scenes (town walks and field battles).
// Loaded on demand by the VH3D bridge in index.html. The world map stays a top-down 2D canvas.
// People are rigged, animated low-poly bodies (KayKit, CC0) loaded from ./assets/chars; surfaces, sky and grass
// are generated in the browser (art.js). No CDN: everything is local and works offline in the PC build.
// If the bodies fail to load, the old box people are used instead.
// The scene never changes game numbers itself: it reports back to the bridge, which runs the existing sheets and finishBattle.
import * as THREE from "./three.module.min.js";
import { loadChars, charsReady, makeCharKit, makeChar } from "./chars.js";
import { makeArt, Merge, paintedSky, grassField, gfxGet, gfxSet } from "./art.js";

// ---------- Realm looks (from GAME_CANON_SPEC.md and the Realm Codex §15b LOOK) ----------
const REALMS = {
  ember: { name: "Flameborne", ground: 0x5e4a36, path: 0x86704f, wall: 0x7e5640, wall2: 0x5a4234, roof: 0x3a2a22, trim: 0xb8733a, accent: 0xd4562c, sky: 0x4a3024, fog: 0x5c3e2c, sun: 0xffa868, sunI: 2.2, hemi: 0xffb27a, roofType: "gable", cloth: [0x8a2a1c, 0x3a2a24, 0x6a3a20, 0x2a2420, 0x7a4a2a], torch: 0xff8a3a, fx: "ash", stone: 0x5a4a40 },
  stone: { name: "Stonehold", ground: 0x5a5650, path: 0x7a766c, wall: 0x8c8982, wall2: 0x6c685f, roof: 0x4a4a52, trim: 0xb08a40, accent: 0x9aa4b4, sky: 0x46505a, fog: 0x5a6268, sun: 0xffe2b8, sunI: 2.4, hemi: 0xd8dce4, roofType: "flat", cloth: [0x6a6a6a, 0x9a7a3a, 0x4a5a6a, 0x5a4a3a, 0x7a6a50], torch: 0xffa050, fx: "dust", stone: 0x7c7870, squat: 0.85 },
  storm: { name: "Stormreach", ground: 0x4a5c48, path: 0x6c6c62, wall: 0x5c6c7a, wall2: 0x3c4c5a, roof: 0x2c3c4c, trim: 0x8ab0d0, accent: 0x5fb4e0, sky: 0x3a4a5e, fog: 0x4c5c70, sun: 0xcfe0ff, sunI: 2.2, hemi: 0xb8ccff, roofType: "steep", cloth: [0x3a5a7a, 0x6a7a8a, 0x2a3a5a, 0x5a6a6a, 0x46566a], torch: 0xffb070, fx: "rain", stone: 0x5a646c },
  light: { name: "Lightforge", ground: 0x8c7c52, path: 0xcabb8c, wall: 0xe8e0cc, wall2: 0xcfc4ac, roof: 0xc8a040, trim: 0xe8c75a, accent: 0xe8c75a, sky: 0xdcc8a0, fog: 0xd2be94, sun: 0xfff2cc, sunI: 3.0, hemi: 0xfff0d0, roofType: "dome", cloth: [0xeae4d4, 0xd8d0bc, 0xc8a040, 0xe0d8c8, 0xb89a60], torch: 0xffd890, fx: "motes", fxc: 0xfff0c0, stone: 0xd8ccb0, tall: 1.15 },
  frost: { name: "Frostgrave", ground: 0xd6e0e6, path: 0xa6b2b8, wall: 0x5c5248, wall2: 0x8c8c92, roof: 0xeef4f8, trim: 0xa9dcd8, accent: 0xa9dcd8, sky: 0x9cacba, fog: 0xbccad6, sun: 0xdcecff, sunI: 2.2, hemi: 0xe0f0ff, roofType: "steep", cloth: [0xe8e8e8, 0x8a9098, 0x9ac0d0, 0x2a2a30, 0x6a7a8a], torch: 0xffb070, fx: "snow", stone: 0x9aa2a8 },
  spirit: { name: "Spiritveil", ground: 0x3e4a44, path: 0x7c8278, wall: 0xd8d4c8, wall2: 0xaaaea6, roof: 0x5a6a60, trim: 0xc8d8e8, accent: 0x9a7fd6, sky: 0x262a38, fog: 0x434b54, sun: 0xc8d0ff, sunI: 1.4, hemi: 0xb0b8e0, roofType: "spire", cloth: [0xc8c8c0, 0x8a9a8a, 0xe0dcd0, 0x6a7a70, 0x9aa0a8], torch: 0xc8e0ff, fx: "motes", fxc: 0xb8ccff, stone: 0xb8bab0, tall: 1.3, lanterns: true },
  shadow: { name: "Shadowdeep", ground: 0x2a2a30, path: 0x3e3e48, wall: 0x3c3c46, wall2: 0x2c2c34, roof: 0x1e1e26, trim: 0x8a70d0, accent: 0x6f7396, sky: 0x13131b, fog: 0x1e1e2a, sun: 0x8a90c0, sunI: 1.0, hemi: 0x6a6a9a, roofType: "flat", cloth: [0x2a2a30, 0x3a3a44, 0x4a4458, 0x1e1e22, 0x34303c], torch: 0xa080ff, fx: "motes", fxc: 0x9a80e0, stone: 0x34343c },
  metal: { name: "Metalcrown", ground: 0x3a3634, path: 0x4c4846, wall: 0x4c4c50, wall2: 0x6c3c2c, roof: 0x2a2a2e, trim: 0xc23d78, accent: 0xc23d78, sky: 0x3a3230, fog: 0x4c423c, sun: 0xffb488, sunI: 1.8, hemi: 0xd8a080, roofType: "saw", cloth: [0x6a6a64, 0x7a3a2a, 0x4a4a48, 0x5a5048, 0x3a3a3c], torch: 0xff7030, fx: "ash", stone: 0x4a4644, chimneys: true }
};
const VOIDC = 0x9a7cd0;
// surfaces per Realm (art.js textures; the Realm colours above tint them)
const WALL_STYLE = { ember: "frame", stone: "stone", storm: "frame", light: "ashlar", frost: "planks", spirit: "ashlar", shadow: "stone", metal: "brick" };
const ROOF_TEX = { ember: "tile", stone: "stone", storm: "slate", light: "tile", frost: "slate", spirit: "slate", shadow: "slate", metal: "slate" };
const GROUND_TEX = { ember: "dirt", stone: "dirt", storm: "grass", light: "grass", frost: "plaster", spirit: "grass", shadow: "dirt", metal: "dirt" };
const GRASS_TINT = { ember: [0x6a5a34, 0x8a6a3a], stone: [0x6a7448, 0x8a8a5a], storm: [0x4a7040, 0x6a8a4a], light: [0x9a9a4a, 0xc8b860], frost: [0xb8c0b0, 0xd8dcd0], spirit: [0x5a7a6a, 0x8a9a8a], shadow: [0x34343e, 0x4a4656], metal: [0x4a4a38, 0x6a5a40] };
const GRASS_N = { ember: 0.55, metal: 0.4, shadow: 0.6, frost: 0.35, stone: 0.7 };
const CLOUD = { ember: 0.55, stone: 0.5, storm: 0.95, light: 0.3, frost: 0.75, spirit: 0.6, shadow: 0.7, metal: 0.65 };
// a pine (stacked cones) or a broadleaf (clumped rocks of foliage) into an instanced batch
function tree(B, white, x, y, z, h, tc, rand) {
  B.add("cyl", white, x, y + h * 0.2, z, 0.35, h * 0.45, 0.35, 0, 0x4a3420);
  if (rand() < 0.65) { for (let k = 0; k < 3; k++) { const s = (1 - k * 0.24) * h * 0.55; B.add("cone", white, x, y + h * (0.35 + k * 0.22) + s * 0.4, z, s, s * 0.9, s, rand() * 3, shade(tc, 0.75 + rand() * 0.4 + k * 0.06)); } }
  else { for (let k = 0; k < 4; k++) { const s = h * (0.32 + rand() * 0.12); B.add("rock", white, x + (rand() - 0.5) * h * 0.3, y + h * (0.62 + rand() * 0.25), z + (rand() - 0.5) * h * 0.3, s, s * 0.85, s, rand() * 6, shade(tc, 0.85 + rand() * 0.4)); } }
}

// ---------- small helpers ----------
function hashStr(str) { let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
function rng(seed) { let s = (typeof seed === "string" ? hashStr(seed) : seed) >>> 0; return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function lattice(ix, iz) { let h = Math.imul(ix, 374761393) + Math.imul(iz, 668265263); h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; }
function vnoise(x, z) {
  const ix = Math.floor(x), iz = Math.floor(z), fx = x - ix, fz = z - iz, u = fx * fx * (3 - 2 * fx), v = fz * fz * (3 - 2 * fz);
  const a = lattice(ix, iz), b = lattice(ix + 1, iz), c = lattice(ix, iz + 1), d = lattice(ix + 1, iz + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
function angLerp(a, b, t) { let d = b - a; while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2; return a + d * t; }
function shade(hex, k) { const c = new THREE.Color(hex); c.multiplyScalar(k); return c; }
function mix(h1, h2, t) { return new THREE.Color(h1).lerp(new THREE.Color(h2), t); }

// ---------- the stage: renderer, DOM, input, disposal ----------
let styled = false;
function styleOnce() {
  if (styled) return; styled = true;
  const st = document.createElement("style");
  st.textContent = `
#vh3d{position:absolute;inset:0;z-index:30;background:#0b0907;overflow:hidden;touch-action:none;user-select:none;-webkit-user-select:none;font-family:var(--serif,Georgia,serif)}
#vh3d canvas{position:absolute;inset:0;width:100%;height:100%;display:block;outline:none}
#vh3d .v3-vig{position:absolute;inset:0;pointer-events:none;background:radial-gradient(120% 95% at 50% 45%,rgba(0,0,0,0) 52%,rgba(4,3,2,.62) 100%),linear-gradient(rgba(6,5,3,.55),rgba(6,5,3,0) 16%,rgba(6,5,3,0) 78%,rgba(6,5,3,.6))}
#vh3d .v3-hud{position:absolute;left:0;right:0;top:0;padding:calc(.7rem + env(safe-area-inset-top,0px)) 1rem 0;pointer-events:none;color:#efe6cf;text-shadow:0 1px 3px #000}
#vh3d .v3-hud h3{margin:0;font:italic 400 1.45rem 'IM Fell English',Georgia,serif;color:#f4e3b8;letter-spacing:.01em}
#vh3d .v3-hud small{display:block;font:500 .66rem 'IBM Plex Mono',ui-monospace,monospace;letter-spacing:.16em;text-transform:uppercase;color:#c9b48a;margin-top:.1rem}
#vh3d .v3-bars{display:grid;grid-template-columns:1fr auto 1fr;gap:.7rem;align-items:center;max-width:44rem;margin:.45rem auto 0;font:500 .66rem 'IBM Plex Mono',ui-monospace,monospace;letter-spacing:.08em}
#vh3d .v3-bar{height:8px;background:#2a2118cc;border-radius:4px;overflow:hidden;border:1px solid #5a4528}
#vh3d .v3-bar i{display:block;height:100%;transition:width .25s}
#vh3d .v3-bar.e i{margin-left:auto}
#vh3d .v3-ord{text-align:center;color:#ffd884;min-width:7rem}
#vh3d .v3-hp{position:absolute;left:1rem;bottom:calc(1rem + env(safe-area-inset-bottom,0px));width:min(16rem,40vw);pointer-events:none;font:500 .62rem 'IBM Plex Mono',ui-monospace,monospace;letter-spacing:.12em;color:#e8d8b0;text-shadow:0 1px 2px #000}
#vh3d .v3-hp .v3-bar{height:10px;margin-top:3px}
#vh3d .v3-keys{position:absolute;right:1rem;bottom:calc(1rem + env(safe-area-inset-bottom,0px));pointer-events:none;font:500 .62rem 'IBM Plex Mono',ui-monospace,monospace;color:#c9b48acc;letter-spacing:.06em;text-align:right;line-height:1.7;text-shadow:0 1px 2px #000}
#vh3d .v3-msg{position:absolute;left:50%;top:22%;transform:translateX(-50%);pointer-events:none;color:#ffe2a0;font:italic 1.25rem 'IM Fell English',Georgia,serif;text-shadow:0 2px 6px #000;text-align:center;opacity:0;transition:opacity .4s;max-width:90vw}
#vh3d .v3-msg.on{opacity:1}
#vh3d .v3-prompt{position:absolute;left:50%;bottom:calc(5.4rem + env(safe-area-inset-bottom,0px));transform:translateX(-50%);padding:.55rem 1.1rem;background:#1a1208e8;border:1px solid #c8873a;border-radius:4px;color:#f4e3b8;font:500 .78rem 'IBM Plex Mono',ui-monospace,monospace;letter-spacing:.08em;cursor:pointer;box-shadow:0 0 24px #c8873a44;pointer-events:auto}
#vh3d .v3-prompt b{color:#ffd884;font-weight:600}
#vh3d .v3-top{position:absolute;right:.8rem;top:calc(.7rem + env(safe-area-inset-top,0px));display:flex;gap:.4rem}
#vh3d .v3-top button,#vh3d .v3-act button{padding:.5rem .8rem;font:500 .66rem 'IBM Plex Mono',ui-monospace,monospace;letter-spacing:.08em;text-transform:uppercase;background:#1a1610d8;color:#efe6cf;border:1px solid #6a5535;border-radius:3px;cursor:pointer}
#vh3d .v3-top button:hover,#vh3d .v3-act button:hover{border-color:#c8873a}
#vh3d .v3-act{position:absolute;right:.8rem;bottom:calc(4.6rem + env(safe-area-inset-bottom,0px));display:none;grid-template-columns:repeat(2,4.4rem);gap:.45rem}
#vh3d .v3-act button{height:3.4rem;padding:0}
#vh3d .v3-act button.on{background:#c8873a;color:#1a1208}
#vh3d.touch .v3-act{display:grid}#vh3d.touch .v3-keys{display:none}
#vh3d .v3-stick{position:absolute;width:110px;height:110px;margin:-55px 0 0 -55px;border-radius:50%;border:2px solid #ffffff55;background:#ffffff12;pointer-events:none}
#vh3d .v3-stick i{position:absolute;left:50%;top:50%;width:46px;height:46px;margin:-23px 0 0 -23px;border-radius:50%;background:#ffffff44}
#vh3d .v3-load{position:absolute;inset:0;display:grid;place-items:center;background:#0b0907;color:#c8873a;font:500 .8rem 'IBM Plex Mono',ui-monospace,monospace;letter-spacing:.18em;text-transform:uppercase;transition:opacity .5s}
#vh3d .v3-load.off{opacity:0;pointer-events:none}
#vh3d .v3-modal{position:absolute;inset:0;display:grid;place-items:center;background:#0008}
#vh3d .v3-modal div{max-width:34rem;margin:1rem;padding:1.1rem 1.2rem;background:linear-gradient(#1d1a15,#0d0b08);border:1px solid #8a6a30;border-radius:4px;color:#efe6cf;font-size:1.02rem;line-height:1.5}
#vh3d .v3-modal button{display:block;width:100%;margin-top:.55rem;text-align:left;padding:.7rem .8rem;background:#1a1610;color:#efe6cf;border:1px solid #6a5535;border-radius:3px;font:inherit;font-size:.95rem;cursor:pointer;text-transform:none;letter-spacing:0}
#vh3d .v3-modal button:hover{border-color:#c8873a}
#vh3d .v3-end{position:absolute;left:0;right:0;top:38%;text-align:center;pointer-events:none;font:italic 2.6rem 'IM Fell English',Georgia,serif;color:#ffe2a0;text-shadow:0 3px 14px #000;opacity:0;transition:opacity .6s}
#vh3d .v3-end.on{opacity:1}
@media (max-width:600px){#vh3d .v3-top{gap:.3rem;right:.5rem;left:.5rem;justify-content:flex-end}#vh3d .v3-top button{padding:.5rem .55rem;font-size:.58rem;letter-spacing:.04em}#vh3d .v3-hud{padding-top:calc(3.3rem + env(safe-area-inset-top,0px))}#vh3d .v3-hud h3{font-size:1.15rem}#vh3d .v3-bars{margin-top:.3rem}}
#vh3d.touch .v3-prompt{bottom:calc(9.2rem + env(safe-area-inset-bottom,0px));max-width:86vw;text-align:center}
#vh3d.touch .v3-hp{bottom:calc(1rem + env(safe-area-inset-bottom,0px));width:min(12rem,42vw)}
#vh3d .v3-end small{display:block;font:500 .8rem 'IBM Plex Mono',ui-monospace,monospace;letter-spacing:.2em;text-transform:uppercase;color:#d8c8a0;margin-top:.4rem}`;
  document.head.appendChild(st);
}

function makeStage(loadText) {
  styleOnce();
  const old = document.getElementById("vh3d"); if (old) old.remove();
  const sh = document.getElementById("sheet");
  const host = (sh && sh.parentNode) || document.body;
  const root = document.createElement("div"); root.id = "vh3d";
  root.innerHTML = '<canvas tabindex="-1"></canvas><div class="v3-vig"></div><div class="v3-hud"></div><div class="v3-msg"></div><div class="v3-prompt" hidden></div><div class="v3-hp" hidden></div><div class="v3-keys"></div><div class="v3-act"></div><div class="v3-top"></div><div class="v3-stick" hidden><i></i></div><div class="v3-end"></div><div class="v3-load">' + loadText + "</div>";
  host.appendChild(root);
  const $ = (q) => root.querySelector(q);
  const canvas = $("canvas");
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
  } catch (e) { root.remove(); throw e; }
  const coarse = matchMedia("(pointer:coarse)").matches && !matchMedia("(pointer:fine)").matches;
  if (coarse || "ontouchstart" in window && navigator.maxTouchPoints > 0 && !matchMedia("(pointer:fine)").matches) root.classList.add("touch");
  const touchDev = coarse || ("ontouchstart" in window && navigator.maxTouchPoints > 0 && !matchMedia("(pointer:fine)").matches);
  let gfx = gfxGet(touchDev);
  // pixel ratio: 1.5 at most anywhere (phones included), 1.25 on Low; auto-quality lowers it further if frames run long
  const prCap = () => Math.min(window.devicePixelRatio || 1, gfx === "low" ? 1.25 : 1.5);
  renderer.setPixelRatio(prCap());
  renderer.shadowMap.enabled = gfx !== "low"; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(58, 1, 0.1, 420);
  // portrait phones see a narrow slice, so the follow camera pulls back a little
  function resize() { const w = root.clientWidth || innerWidth, h = root.clientHeight || innerHeight; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); if (stageRef) stageRef.distK = camera.aspect < 0.8 ? 1.3 : 1; }
  let stageRef = null;
  resize();
  const disposers = [];
  const listen = (el, ev, fn, opt) => { el.addEventListener(ev, fn, opt); disposers.push(() => el.removeEventListener(ev, fn, opt)); };
  listen(window, "resize", resize);

  // input: keyboard, mouse (drag to turn, click to act, right button to block), touch (left stick, right drag)
  const inp = { keys: {}, turn: 0, pitch: 0, click: 0, rmb: false, stick: { x: 0, y: 0, on: false }, blocked: () => false, onKey: null };
  const KEYS = new Set(["w", "a", "s", "d", "q", "e", "f", "c", "h", "r", "1", "2", "3", " ", "shift", "control", "arrowup", "arrowdown", "arrowleft", "arrowright", "enter", "tab", "escape"]);
  listen(window, "keydown", (e) => {
    if (inp.blocked()) return;
    const k = e.key.toLowerCase();
    if (!KEYS.has(k)) return;
    if (e.target && /input|textarea|select/i.test(e.target.tagName)) return;
    e.preventDefault(); e.stopImmediatePropagation();
    if (!inp.keys[k] && inp.onKey) inp.onKey(k, e);
    inp.keys[k] = true;
  }, true);
  listen(window, "keyup", (e) => { const k = e.key.toLowerCase(); if (inp.keys[k]) { inp.keys[k] = false; e.stopImmediatePropagation(); } }, true);
  listen(window, "blur", () => { inp.keys = {}; inp.rmb = false; });
  let drag = null, stickId = -1;
  const stickEl = $(".v3-stick"), knob = stickEl.firstChild;
  listen(canvas, "pointerdown", (e) => {
    canvas.focus({ preventScroll: true });
    if (e.pointerType === "touch") {
      if (e.clientX < root.clientWidth * 0.45 && stickId < 0) {
        stickId = e.pointerId; inp.stick = { x: 0, y: 0, on: true, ox: e.clientX, oy: e.clientY };
        stickEl.hidden = false; stickEl.style.left = e.clientX + "px"; stickEl.style.top = e.clientY + "px"; knob.style.transform = "";
      } else drag = { id: e.pointerId, x: e.clientX, y: e.clientY, sx: e.clientX, sy: e.clientY, t: performance.now(), touch: true };
      canvas.setPointerCapture(e.pointerId); return;
    }
    if (e.button === 2) { inp.rmb = true; return; }
    if (e.button === 0) { drag = { id: e.pointerId, x: e.clientX, y: e.clientY, sx: e.clientX, sy: e.clientY, t: performance.now() }; canvas.setPointerCapture(e.pointerId); }
  });
  listen(canvas, "pointermove", (e) => {
    if (e.pointerId === stickId) {
      let dx = e.clientX - inp.stick.ox, dy = e.clientY - inp.stick.oy; const d = Math.hypot(dx, dy), m = 46;
      if (d > m) { dx *= m / d; dy *= m / d; }
      inp.stick.x = dx / m; inp.stick.y = dy / m; knob.style.transform = "translate(" + dx + "px," + dy + "px)"; return;
    }
    if (drag && e.pointerId === drag.id) { inp.turn += (e.clientX - drag.x); inp.pitch += (e.clientY - drag.y); drag.x = e.clientX; drag.y = e.clientY; }
  });
  const up = (e) => {
    if (e.pointerId === stickId) { stickId = -1; inp.stick = { x: 0, y: 0, on: false }; stickEl.hidden = true; return; }
    if (e.button === 2) inp.rmb = false;
    if (drag && e.pointerId === drag.id) {
      if (Math.hypot(e.clientX - drag.sx, e.clientY - drag.sy) < 7 && performance.now() - drag.t < 450) inp.click++;
      drag = null;
    }
  };
  listen(canvas, "pointerup", up); listen(canvas, "pointercancel", up);
  listen(canvas, "contextmenu", (e) => e.preventDefault());

  let raf = 0, last = 0, dead = false, frameFn = null, firstFrame = true, slowAcc = 0, slowN = 0, pr = renderer.getPixelRatio();
  function loop(t) {
    if (dead) return;
    raf = requestAnimationFrame(loop);
    const raw = (t - last) / 1000 || 0.016, dt = Math.min(0.05, raw); last = t;
    stage.frames++;
    if (frameFn) for (let i = 0; i < stage.substeps; i++) frameFn(dt, t / 1000 + i * dt);
    // keep it smooth on slow machines: drop the render resolution step by step if frames run long
    if (!firstFrame && raw < 1) { slowAcc += raw; slowN++; if (slowN >= 45) { if (slowAcc / slowN > 1 / 34 && pr > 0.6) { pr = Math.max(0.6, pr * 0.8); renderer.setPixelRatio(pr); resize(); } slowAcc = 0; slowN = 0; } }
    renderer.render(scene, camera);
    if (firstFrame) { firstFrame = false; setTimeout(() => { const l = $(".v3-load"); if (l) l.classList.add("off"); }, 60); }
  }
  let msgT = 0;
  const stage = {
    distK: camera.aspect < 0.8 ? 1.3 : 1, root, $, canvas, renderer, scene, camera, inp, listen, frames: 0, substeps: 1, coarse: touchDev, get gfx() { return gfx; }, onGfx: [],
    // the Low / High button in the top bar: Low drops shadows, grass and resolution
    gfxButton() {
      const top = $(".v3-top"), b = document.createElement("button"); b.setAttribute("data-g", "1"); top.insertBefore(b, top.firstChild);
      const label = () => { b.textContent = "Graphics: " + (gfx === "low" ? "Low" : "High"); };
      label();
      listen(b, "click", (e) => {
        e.stopPropagation(); gfx = gfx === "low" ? "high" : "low"; gfxSet(gfx); label();
        renderer.shadowMap.enabled = gfx !== "low"; pr = prCap(); renderer.setPixelRatio(pr); resize();
        scene.traverse((o) => { const ms = o.material ? (Array.isArray(o.material) ? o.material : [o.material]) : []; ms.forEach((m) => { m.needsUpdate = true; }); });
        stage.onGfx.forEach((f) => f(gfx));
      });
    },
    start(fn) { frameFn = fn; raf = requestAnimationFrame(loop); },
    msg(t, secs) { const m = $(".v3-msg"); m.textContent = t; m.classList.add("on"); clearTimeout(msgT); msgT = setTimeout(() => m.classList.remove("on"), (secs || 3) * 1000); },
    dispose() {
      if (dead) return; dead = true; cancelAnimationFrame(raf); clearTimeout(msgT);
      disposers.forEach((d) => d());
      const seen = new Set();
      scene.traverse((o) => {
        if (o.geometry && !seen.has(o.geometry)) { seen.add(o.geometry); o.geometry.dispose(); }
        const ms = o.material ? (Array.isArray(o.material) ? o.material : [o.material]) : [];
        ms.forEach((m) => { if (seen.has(m)) return; seen.add(m); for (const k in m) { const v = m[k]; if (v && v.isTexture && !seen.has(v)) { seen.add(v); v.dispose(); } } m.dispose(); });
        if (o.isLight && o.shadow && o.shadow.map) o.shadow.map.dispose();
        if (o.dispose && o.isInstancedMesh) o.dispose();
      });
      extraDispose.forEach((x) => { try { x.dispose(); } catch (e) {} });
      scene.clear();
      renderer.dispose(); try { renderer.forceContextLoss(); } catch (e) {}
      root.remove();
    },
    track(x) { extraDispose.push(x); return x; }
  };
  const extraDispose = [];
  stageRef = stage;
  return stage;
}

// ---------- shared kit: materials, geometries, figures ----------
function makeKit(stage) {
  const mats = new Map();
  const mat = (hex, o) => {
    const key = (typeof hex === "number" ? hex : new THREE.Color(hex).getHex()) + "|" + JSON.stringify(o || {});
    if (mats.has(key)) return mats.get(key);
    const m = new THREE.MeshStandardMaterial(Object.assign({ color: hex, roughness: 0.86, metalness: 0.04, flatShading: true }, o || {}));
    mats.set(key, m); return m;
  };
  const glow = (hex) => mat(hex, { emissive: hex, emissiveIntensity: 1.6, roughness: 1, metalness: 0 });
  const g = {
    box: new THREE.BoxGeometry(1, 1, 1),
    prism: prismGeo(),
    cyl: new THREE.CylinderGeometry(0.5, 0.5, 1, 8),
    cone: new THREE.ConeGeometry(0.5, 1, 7),
    dome: new THREE.SphereGeometry(0.5, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2),
    rock: new THREE.DodecahedronGeometry(0.6, 0),
    leg: new THREE.BoxGeometry(0.17, 0.84, 0.2).translate(0, -0.42, 0),
    torso: new THREE.BoxGeometry(0.5, 0.64, 0.3),
    belt: new THREE.BoxGeometry(0.52, 0.12, 0.32),
    arm: new THREE.BoxGeometry(0.13, 0.62, 0.15).translate(0, -0.31, 0),
    head: new THREE.IcosahedronGeometry(0.16, 1),
    cap: new THREE.CylinderGeometry(0.15, 0.185, 0.17, 8),
    spike: new THREE.ConeGeometry(0.19, 0.34, 8),
    hood: new THREE.ConeGeometry(0.24, 0.5, 8),
    cloak: new THREE.BoxGeometry(0.48, 0.95, 0.05).translate(0, -0.47, 0),
    blade: new THREE.BoxGeometry(0.06, 0.9, 0.025).translate(0, -0.45, 0),
    hilt: new THREE.BoxGeometry(0.24, 0.05, 0.05),
    spear: new THREE.CylinderGeometry(0.025, 0.025, 2.3, 5),
    spearTip: new THREE.ConeGeometry(0.05, 0.22, 5),
    shield: new THREE.CylinderGeometry(0.31, 0.31, 0.05, 10).rotateX(Math.PI / 2),
    eye: new THREE.BoxGeometry(0.2, 0.03, 0.02),
    flame: new THREE.ConeGeometry(0.11, 0.32, 6)
  };
  Object.values(g).forEach((x) => stage.track(x));
  const glowTex = stage.track(radialTex("rgba(255,220,170,1)", "rgba(255,160,80,0)"));
  const coldTex = stage.track(radialTex("rgba(220,210,255,1)", "rgba(150,120,230,0)"));
  const track = (x) => stage.track(x);
  const ck = charsReady() ? makeCharKit(track) : null;
  const art = makeArt(track, stage.gfx);
  const statics = [];
  // blob shadows: a soft dark disc under each person, used on Low instead of the shadow map
  const blobTex = track(radialTex("rgba(0,0,0,0.55)", "rgba(0,0,0,0)")), blobGeo = track(new THREE.PlaneGeometry(1.1, 1.1).rotateX(-Math.PI / 2));
  const blobMat = track(new THREE.MeshBasicMaterial({ map: blobTex, transparent: true, depthWrite: false, opacity: 0.8 }));
  blobMat.visible = stage.gfx === "low"; stage.onGfx.push((q) => { blobMat.visible = q === "low"; });
  return { mat, glow, g, glowTex, coldTex, mats, ck, art, statics, blobGeo, blobMat, tickStatics(dt) { for (const f of statics) f.userData.ch.update(dt, 0, 0, false); } };
}

// wait for the rigged bodies (or give up after a while and use the box people), then build
function whenChars(fn) {
  if (charsReady()) { fn(); return; }
  let doneOnce = false; const go = () => { if (!doneOnce) { doneOnce = true; fn(); } };
  loadChars().then(go, (e) => { if (window.console) console.log("vh3d: rigged people unavailable, using box people", e && e.message); go(); });
  setTimeout(go, 15000);
}

const HAIR = [0x2a1e18, 0x3e2a1c, 0x5a3e26, 0x1a1414, 0x7a5a3a, 0x8a8078];
// turn a box-person look into a rigged-body look (unless the caller gave one in o.ch)
function charLook(o) {
  if (o.ch) return o.ch;
  const r = (hashStr(JSON.stringify(o)) % 1000) / 1000, hair = o.hair || HAIR[Math.floor(Math.random() * HAIR.length)];
  const skin = o.skin || [0xd8b090, 0xb88a68, 0x8a5a3a, 0xc89a78][Math.floor(Math.random() * 4)];
  const shieldKind = o.shield ? (o.armour ? "badge" : "round") : null;
  if (o.eyes) return { base: "hood", cloth: o.cloak || o.cloth, cloth2: o.cloth, legs: o.cloth2, gloves: o.cloth2, leather: 0x241c28, metal: 0x3a3440, skin: o.skin, hair: 0x101014, weapon: o.weapon === "spear" ? "spear" : "sword", scale: o.scale };
  if (o.armour || o.tabard) return { base: "knight", cloth: o.tabard || o.cloth, metal: o.metal || 0x8a8e94, dark: shade(o.metal || 0x8a8e94, 0.55).getHex(), leather: 0x4a3424, skin, hair, helm: o.helm === "cap" || o.helm === "spike" || o.helm === "crown", capeOn: !!o.cloak, weapon: o.weapon, shieldKind, shield: o.shield, scale: o.scale };
  if (o.helm === "hood") return { base: "hood", cloth: o.hoodc || o.cloth2 || o.cloth, cloth2: o.cloth, legs: o.cloth2 || shade(o.cloth, 0.6).getHex(), gloves: 0x3a2a1c, skin, hair, capeOn: !!o.cloak, weapon: o.weapon === "spear" ? "spear" : o.weapon ? "knife" : null, shieldKind, shield: o.shield, scale: o.scale };
  const base = o.weapon ? (r < 0.5 ? "barbarian" : "rogue") : r < 0.4 ? "rogue" : r < 0.75 ? "mage" : "barbarian";
  return { base, cloth: o.cloth, cloth2: shade(o.cloth2 || o.cloth, 0.7).getHex(), cape: o.cloak || o.cloth2, legs: o.cloth2 || 0x3a2e24, fur: 0xb8a890, skin, hair, capeOn: !!o.cloak, weapon: o.weapon === "spear" ? "spear" : o.weapon === "sword" ? (base === "barbarian" ? "axe" : "sword") : o.lantern ? null : (base === "barbarian" && r > 0.9 ? "mug" : null), shieldKind, shield: o.shield, scale: o.scale };
}

function prismGeo() {
  // a unit triangular prism: x in [-0.5,0.5], y in [0,1], ridge along z in [-0.5,0.5]
  const v = [-0.5, 0, 0.5, 0.5, 0, 0.5, 0, 1, 0.5, -0.5, 0, -0.5, 0, 1, -0.5, 0.5, 0, -0.5];
  const idx = [0, 1, 2, 5, 3, 4, 3, 0, 2, 3, 2, 4, 1, 5, 4, 1, 4, 2, 3, 5, 1, 3, 1, 0];
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(v, 3)); geo.setIndex(idx);
  const ni = geo.toNonIndexed(); ni.computeVertexNormals(); geo.dispose();
  return ni;
}

function radialTex(c0, c1) {
  const c = document.createElement("canvas"); c.width = c.height = 64; const x = c.getContext("2d");
  const gr = x.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, c0); gr.addColorStop(0.35, c0.replace(/[\d.]+\)$/, "0.45)")); gr.addColorStop(1, c1);
  x.fillStyle = gr; x.fillRect(0, 0, 64, 64);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

function labelSprite(stage, text, sub) {
  const c = document.createElement("canvas"); c.width = 512; c.height = 128; const x = c.getContext("2d");
  x.fillStyle = "rgba(16,12,8,0.78)"; roundRect(x, 6, 18, 500, sub ? 96 : 76, 14); x.fill();
  x.strokeStyle = "rgba(200,135,58,0.9)"; x.lineWidth = 3; x.stroke();
  x.fillStyle = "#f4e3b8"; x.textAlign = "center"; x.textBaseline = "middle"; x.font = "600 40px Cinzel, 'IM Fell English', Georgia, serif";
  x.fillText(text, 256, sub ? 52 : 56);
  if (sub) { x.font = "500 22px 'IBM Plex Mono', monospace"; x.fillStyle = "#c9b48a"; x.fillText(sub, 256, 92); }
  const t = stage.track(new THREE.CanvasTexture(c)); t.colorSpace = THREE.SRGBColorSpace;
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, depthWrite: false, fog: false }));
  sp.scale.set(4.2, 1.05, 1); sp.renderOrder = 10;
  return sp;
}
function roundRect(x, a, b, w, h, r) { x.beginPath(); x.moveTo(a + r, b); x.arcTo(a + w, b, a + w, b + h, r); x.arcTo(a + w, b + h, a, b + h, r); x.arcTo(a, b + h, a, b, r); x.arcTo(a, b, a + w, b, r); x.closePath(); }

// a low-poly person. o: { cloth, cloth2, skin, metal, helm: "cap"|"spike"|"hood"|"bare"|"crown", cloak, weapon: "sword"|"spear"|null, shield, eyes, scale }
// the player: mail and a surcoat and cloak in the banner colour, bare-headed
function heroLook(banner, armed) { return { base: "knight", cloth: banner, metal: 0x9a9ea4, dark: 0x3a3430, leather: 0x5a3e28, skin: 0xc89a78, hair: 0x2e2018, helm: false, capeOn: true, weapon: "sword", shieldKind: armed ? "badge" : null, shield: banner }; }
// Kaelren (Cosplay Kit): ash-grey watch coat, faded rust undershirt, copper buttons, dark hair, warm tawny-brown skin
function kaelLook(armed) { return { base: "rogue", cloth: 0x8a8782, cloth2: 0xa0522d, metal: 0xb87333, skin: 0xa0663e, hair: 0x1e1612, legs: 0x3a322c, gloves: 0x4a3626, leather: 0x4a3626, capeOn: false, weapon: "sword", shieldKind: armed ? "round" : null, shield: 0x8a5a34 }; }
function figure(kit, o) {
  const f = figure0(kit, o);
  const b = new THREE.Mesh(kit.blobGeo, kit.blobMat); b.position.y = 0.03; b.renderOrder = 1; f.add(b);
  return f;
}
function figure0(kit, o) {
  if (kit.ck) { try { const f = makeChar(kit.ck, charLook(o)); if (o.lantern) { const l = new THREE.Mesh(kit.g.box, kit.glow(o.lantern)); l.scale.setScalar(0.12); l.position.set(0.32, 0.75, 0.12); f.add(l); } return f; } catch (e) { if (window.console) console.log("vh3d: body fallback", e && e.message); } }
  return boxFigure(kit, o);
}
function boxFigure(kit, o) {
  const { g, mat } = kit;
  const root = new THREE.Group(); root.rotation.order = "YXZ";
  const body = new THREE.Group(); root.add(body);
  const cloth = mat(o.cloth), cloth2 = mat(o.cloth2 || o.cloth), skin = mat(o.skin || 0xc89a78), metal = mat(o.metal || 0x8a8e94, { metalness: 0.55, roughness: 0.5 });
  const legL = new THREE.Group(), legR = new THREE.Group(); legL.position.set(-0.12, 0.86, 0); legR.position.set(0.12, 0.86, 0);
  legL.add(new THREE.Mesh(g.leg, cloth2)); legR.add(new THREE.Mesh(g.leg, cloth2)); body.add(legL, legR);
  const torso = new THREE.Mesh(g.torso, o.armour ? metal : cloth); torso.position.y = 1.2; body.add(torso);
  const belt = new THREE.Mesh(g.belt, mat(0x3a2a1c)); belt.position.y = 0.92; body.add(belt);
  if (o.tabard) { const tb = new THREE.Mesh(g.torso, mat(o.tabard)); tb.scale.set(0.7, 0.92, 1.06); tb.position.y = 1.18; body.add(tb); }
  const head = new THREE.Mesh(g.head, skin); head.position.y = 1.7; body.add(head);
  if (o.helm === "cap" || o.helm === "spike" || o.helm === "crown") { const c = new THREE.Mesh(g.cap, o.helm === "crown" ? mat(0xe8c75a, { metalness: 0.7, roughness: 0.35 }) : metal); c.position.y = 1.8; body.add(c); }
  if (o.helm === "spike") { const s = new THREE.Mesh(g.spike, metal); s.position.y = 1.98; body.add(s); }
  if (o.helm === "hood") { const h = new THREE.Mesh(g.hood, mat(o.hoodc || o.cloth2 || o.cloth)); h.position.y = 1.82; h.scale.set(1, 1, 1.05); body.add(h); }
  if (o.eyes) { const e = new THREE.Mesh(g.eye, kit.glow(o.eyes)); e.position.set(0, 1.73, 0.15); body.add(e); }
  if (o.cloak) { const ck = new THREE.Mesh(g.cloak, mat(o.cloak)); ck.position.set(0, 1.5, -0.18); ck.rotation.x = 0.08; body.add(ck); root.userData.cloak = ck; }
  const armL = new THREE.Group(), armR = new THREE.Group(); armL.position.set(-0.33, 1.48, 0); armR.position.set(0.33, 1.48, 0);
  armL.add(new THREE.Mesh(g.arm, o.armour ? metal : cloth)); armR.add(new THREE.Mesh(g.arm, o.armour ? metal : cloth)); body.add(armL, armR);
  if (o.weapon === "sword") {
    const w = new THREE.Group(); w.position.set(0, -0.6, 0.02); w.rotation.x = -1.25;
    w.add(new THREE.Mesh(g.blade, mat(0xd8dce0, { metalness: 0.8, roughness: 0.3 }))); const hl = new THREE.Mesh(g.hilt, mat(0x5a4022)); w.add(hl);
    armR.add(w); root.userData.weapon = w;
  } else if (o.weapon === "spear") {
    const w = new THREE.Group(); w.position.set(0, -0.58, 0.02); w.rotation.x = -1.35;
    const sh = new THREE.Mesh(g.spear, mat(0x6a4a2a)); sh.position.y = -0.35; w.add(sh);
    const tp = new THREE.Mesh(g.spearTip, mat(0xd0d4d8, { metalness: 0.8, roughness: 0.3 })); tp.position.y = -1.55; tp.rotation.x = Math.PI; w.add(tp);
    armR.add(w); root.userData.weapon = w;
  } else if (o.weapon === "staff") {
    const w = new THREE.Group(); w.position.set(0, -0.58, 0.02);
    const sh = new THREE.Mesh(g.spear, mat(0x5a4022)); sh.position.y = 0.2; w.add(sh); armR.add(w);
  }
  if (o.shield) { const s = new THREE.Mesh(g.shield, mat(o.shield)); s.position.set(-0.06, -0.38, 0.14); armL.add(s); root.userData.shield = s; }
  if (o.lantern) { const l = new THREE.Mesh(g.box, kit.glow(o.lantern)); l.scale.setScalar(0.12); l.position.set(0, -0.68, 0.06); armL.add(l); }
  root.traverse((m) => { if (m.isMesh) { m.castShadow = true; } });
  const sc = o.scale || 1; root.scale.setScalar(sc);
  root.userData.parts = { legL, legR, armL, armR, body };
  return root;
}
// walk cycle, attack swing, block pose
function animFigure(f, t, move, atk, block, dt, skip) {
  if (f.userData.ch) { f.userData.ch.update(dt || 0.016, move, atk, block, skip); return; }
  const p = f.userData.parts; if (!p) return;
  const s = Math.sin(t * (6 + 5 * move)) * Math.min(1, move) * 0.7;
  p.legL.rotation.x = s; p.legR.rotation.x = -s;
  p.armL.rotation.x = block ? -1.3 : -s * 0.8;
  p.armL.rotation.z = block ? 0.5 : 0;
  if (atk > 0) { const k = 1 - atk; p.armR.rotation.x = k < 0.35 ? lerp(0, -2.7, k / 0.35) : lerp(-2.7, -0.6, Math.min(1, (k - 0.35) / 0.3)); }
  else p.armR.rotation.x = lerp(p.armR.rotation.x, s * 0.8, 0.25);
  p.body.position.y = Math.abs(Math.sin(t * (6 + 5 * move))) * 0.05 * Math.min(1, move);
  const ck = f.userData.cloak; if (ck) ck.rotation.x = 0.08 + Math.min(1, move) * 0.35 + Math.sin(t * 3) * 0.03;
}

// ---------- batched static geometry (instanced) ----------
class Batch {
  constructor(kit) { this.kit = kit; this.items = new Map(); }
  add(geoKey, matObj, x, y, z, sx, sy, sz, ry, col, opts) {
    const key = geoKey + "|" + matObj.uuid + "|" + (opts && opts.noShadow ? 1 : 0);
    if (!this.items.has(key)) this.items.set(key, { geo: this.kit.g[geoKey], mat: matObj, list: [], opts: opts || {} });
    this.items.get(key).list.push([x, y, z, sx, sy, sz, ry || 0, col]);
  }
  box(x, y, z, sx, sy, sz, ry, col, m, opts) { this.add("box", m || this.kit.mat(0xffffff), x, y, z, sx, sy, sz, ry, col, opts); }
  build(scene) {
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), p = new THREE.Vector3(), s = new THREE.Vector3(), c = new THREE.Color();
    for (const it of this.items.values()) {
      const im = new THREE.InstancedMesh(it.geo, it.mat, it.list.length);
      it.list.forEach((d, i) => {
        p.set(d[0], d[1], d[2]); s.set(d[3], d[4], d[5]); q.setFromEuler(e.set(0, d[6], 0)); m4.compose(p, q, s); im.setMatrixAt(i, m4);
        if (d[7] !== undefined && d[7] !== null) im.setColorAt(i, c.set(d[7]));
      });
      if (im.instanceColor) im.instanceColor.needsUpdate = true;
      im.castShadow = !it.opts.noShadow; im.receiveShadow = !it.opts.noRecv;
      scene.add(im);
    }
  }
}

// cold Realms keep their own light (Spiritveil is silver); the rest get a warmer, lower key light
const COLD = { spirit: 1, shadow: 1, frost: 1, storm: 1 };
function lights(stage, P, center, span, opts) {
  const { scene } = stage;
  const cold = opts && opts.cold;
  const hemi = new THREE.HemisphereLight(P.hemi, shade(P.ground, 0.5), opts && opts.dim ? 0.8 : 1.15); scene.add(hemi);
  const sun = new THREE.DirectionalLight(cold ? P.sun : mix(P.sun, 0xffc890, 0.3), (P.sunI || 2) * (opts && opts.dim ? 0.7 : 1.15));
  sun.position.set(center.x + 30, 36, center.z + 22); sun.target.position.copy(center);
  const big = stage.gfx !== "low" && !stage.coarse;
  sun.castShadow = true; sun.shadow.mapSize.set(big ? 2048 : 1024, big ? 2048 : 1024); sun.shadow.bias = -0.0005; sun.shadow.normalBias = 0.035;
  const sc = sun.shadow.camera; sc.left = -span; sc.right = span; sc.top = span; sc.bottom = -span; sc.near = 1; sc.far = 140;
  scene.add(sun, sun.target);
  return { hemi, sun };
}

let DOT = null;
function dotTex() { if (!DOT) { DOT = radialTex("rgba(255,255,255,1)", "rgba(255,255,255,0)"); } return DOT; }
function particles(stage, kind, count, area, height, tint) {
  const geo = new THREE.BufferGeometry(), pos = new Float32Array(count * 3), vel = new Float32Array(count * 3);
  let cfg = { ash: [0xff9a50, 0.09, true], snow: [0xffffff, 0.12, false], rain: [0x9ab0c8, 0.06, false], motes: [0xffe8b0, 0.07, true], dust: [0xd8c8a8, 0.06, false], void: [0xb89cff, 0.1, true] }[kind] || [0xffffff, 0.08, false];
  if (tint) cfg = [tint, cfg[1], cfg[2]];
  for (let i = 0; i < count; i++) { pos[i * 3] = (Math.random() - 0.5) * area; pos[i * 3 + 1] = Math.random() * height; pos[i * 3 + 2] = (Math.random() - 0.5) * area; vel[i * 3] = (Math.random() - 0.5) * 0.4; vel[i * 3 + 1] = kind === "ash" || kind === "motes" || kind === "void" ? 0.2 + Math.random() * 0.4 : kind === "rain" ? -9 : -0.6 - Math.random() * 0.6; vel[i * 3 + 2] = (Math.random() - 0.5) * 0.4; }
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  const m = new THREE.PointsMaterial({ color: cfg[0], size: cfg[1], map: dotTex(), transparent: true, opacity: 0.85, depthWrite: false, blending: cfg[2] ? THREE.AdditiveBlending : THREE.NormalBlending });
  // round, soft flecks that never grow into big squares right in front of the camera
  m.onBeforeCompile = (sh) => { sh.vertexShader = sh.vertexShader.replace("#include <fog_vertex>", "gl_PointSize = min(gl_PointSize, 7.0);\n#include <fog_vertex>"); };
  const pts = new THREE.Points(geo, m); pts.frustumCulled = false;
  pts.userData.tick = (dt, cx, cz) => {
    for (let i = 0; i < count; i++) {
      let x = pos[i * 3] + vel[i * 3] * dt, y = pos[i * 3 + 1] + vel[i * 3 + 1] * dt, z = pos[i * 3 + 2] + vel[i * 3 + 2] * dt;
      if (y > height) y = 0; if (y < 0) y = height;
      if (x - cx > area / 2) x -= area; if (x - cx < -area / 2) x += area; if (z - cz > area / 2) z -= area; if (z - cz < -area / 2) z += area;
      pos[i * 3] = x; pos[i * 3 + 1] = y; pos[i * 3 + 2] = z;
    }
    geo.attributes.position.needsUpdate = true;
  };
  return pts;
}

function torch(kit, scene, x, y, z, col, withLight, cold) {
  const f = new THREE.Mesh(kit.g.flame, kit.glow(col)); f.position.set(x, y, z); scene.add(f);
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: cold ? kit.coldTex : kit.glowTex, color: col, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
  sp.scale.setScalar(1.6); sp.position.set(x, y + 0.05, z); scene.add(sp);
  let light = null;
  if (withLight) { light = new THREE.PointLight(col, cold ? 22 : 30, 15, 2); light.position.set(x, y + 0.3, z); scene.add(light); }
  const ph = Math.random() * 10;
  return { tick(t) { const k = 0.85 + 0.15 * Math.sin(t * 11 + ph) * Math.sin(t * 7.3 + ph * 2); f.scale.set(1, k * 1.1, 1); sp.material.opacity = 0.65 + 0.3 * k; if (light) light.intensity = (cold ? 22 : 30) * k; } };
}

function followCam(cam, tx, ty, tz, yaw, pitch, dist, side, dt, snap) {
  const fx = -Math.sin(yaw), fz = -Math.cos(yaw), rx = Math.cos(yaw), rz = -Math.sin(yaw);
  const h = 1.2 + dist * Math.sin(pitch), back = dist * Math.cos(pitch);
  const px = tx - fx * back + rx * side, py = ty + h, pz = tz - fz * back + rz * side;
  const k = snap ? 1 : 1 - Math.exp(-dt * 10);
  cam.position.x = lerp(cam.position.x, px, k); cam.position.y = lerp(cam.position.y, py, k); cam.position.z = lerp(cam.position.z, pz, k);
  cam.lookAt(tx + fx * 2.5 + rx * side * 0.4, ty + 1.45, tz + fz * 2.5 + rz * side * 0.4);
}

// read the move intent relative to the camera yaw
function moveIntent(inp, yaw) {
  const k = inp.keys; let mx = 0, mz = 0;
  if (k.w || k.arrowup) mz += 1; if (k.s || k.arrowdown) mz -= 1; if (k.d) mx += 1; if (k.a) mx -= 1;
  if (inp.stick.on) { mx += inp.stick.x; mz -= inp.stick.y; }
  const len = Math.hypot(mx, mz); if (len > 1) { mx /= len; mz /= len; }
  const fx = -Math.sin(yaw), fz = -Math.cos(yaw), rx = Math.cos(yaw), rz = -Math.sin(yaw);
  return { x: fx * mz + rx * mx, z: fz * mz + rz * mx, amt: Math.min(1, len) };
}

// ======================================================================
// TOWN / VILLAGE / CASTLE WALK
// ======================================================================
export function walk(api, info, done) {
  let st;
  try { st = makeStage(info.type === "village" ? "Walking into the village…" : "Walking through the gate…"); }
  catch (e) { api.fail(e); setTimeout(() => done("fail"), 0); return null; }
  // the handle is filled in once the people have loaded (instant after the first scene)
  const ctl = { ready: false, stop() { if (ctl.ready) return; ctl.off = true; st.dispose(); done("map"); } };
  whenChars(() => {
    if (ctl.off) return;
    try { Object.assign(ctl, buildWalk(st, api, info, done)); ctl.ready = true; }
    catch (e) { api.fail(e); st.dispose(); setTimeout(() => done("fail"), 0); }
  });
  return ctl;
}

function buildWalk(st, api, info, done) {
  const P = REALMS[info.realm] || REALMS.ember, rand = rng(info.id + "|walk"), kit = makeKit(st), { scene, camera, inp } = st;
  const B = new Batch(kit), white = kit.mat(0xffffff), winMat = kit.glow(0xffb45a), coldWin = kit.glow(0xc8dcff);
  const R = info.type === "village" ? 24 : info.type === "castle" ? 22 : info.size >= 4 ? 36 : 31;
  const walled = info.type !== "village";
  const solids = [], spots = [], torches = [], ticks = [];
  const tall = P.tall || 1, squat = P.squat || 1;
  scene.fog = new THREE.FogExp2(P.fog, 0.014 + info.voidNear * 0.006);
  const L = lights(st, P, new THREE.Vector3(0, 0, 0), 30, { dim: info.realm === "shadow" || info.realm === "spirit", cold: COLD[info.realm] });
  const sky = paintedSky(P.sky, mix(P.fog, 0xffffff, 0.12), L.sun.position.clone(), L.sun.color, info.voidNear, VOIDC, CLOUD[info.realm]); scene.add(sky);
  const art = kit.art, M = new Merge();
  const isV0 = info.type === "village";
  const GT = GROUND_TEX[info.realm] || "grass";

  // ground: textured (grass, ash-dirt or snow per Realm) with colour noise, rising into hills outside
  const gg = new THREE.PlaneGeometry(300, 300, 60, 60); gg.rotateX(-Math.PI / 2);
  { const pos = gg.attributes.position, uv = gg.attributes.uv, col = []; const c0 = new THREE.Color(P.ground), c = new THREE.Color();
    for (let i = 0; i < pos.count; i++) { const x = pos.getX(i), z = pos.getZ(i), n = vnoise(x * 0.08, z * 0.08) * 0.7 + vnoise(x * 0.3, z * 0.3) * 0.3; c.copy(c0).multiplyScalar(0.82 + n * 0.32); col.push(c.r, c.g, c.b); uv.setXY(i, x / 6, z / 6); if (Math.hypot(x, z) > R + 14) pos.setY(i, (vnoise(x * 0.03, z * 0.03) - 0.3) * Math.min(14, (Math.hypot(x, z) - R - 14) * 0.25)); }
    gg.setAttribute("color", new THREE.Float32BufferAttribute(col, 3)); gg.computeVertexNormals(); }
  const groundMat = art.mat(GT, { roughness: 1 }); groundMat.map.repeat.set(1, 1);
  const ground = new THREE.Mesh(gg, groundMat); ground.receiveShadow = true; scene.add(ground);
  const groundY = (x, z) => { const d = Math.hypot(x, z); return d > R + 14 ? (vnoise(x * 0.03, z * 0.03) - 0.3) * Math.min(14, (d - R - 14) * 0.25) : 0; };

  // streets: main street north-south (gate at +Z), cross street east-west, plaza in the middle (cobbles in towns, packed dirt in villages)
  const pathMat = art.mat(isV0 ? "dirt" : "cobble", { roughness: 0.95 });
  const street = (x, z, w, d) => { M.box(pathMat, x, 0.02, z, w, 0.04, d, 0, P.path, { noShadow: true }); if (!isV0) for (const s of [-1, 1]) { if (w < d) M.box(art.mat("stone"), x + s * (w / 2 + 0.15), 0.05, z, 0.3, 0.1, d, 0, shade(P.stone, 0.9), { noShadow: true }); } };
  street(0, 0, 4.4, R * 2 + 6); street(0, 0, R * 2 - 4, 4.4);
  { const r0 = isV0 ? 5 : 7.5; M.add("cyl24", pathMat, 0, 0.03, 0, r0 * 2, 0.06, r0 * 2, 0, P.path, 0, { noShadow: true }); }
  const solid = (x, z, w, d, ry) => { const c = Math.abs(Math.cos(ry || 0)), s = Math.abs(Math.sin(ry || 0)); const hw = (w * c + d * s) / 2, hd = (w * s + d * c) / 2; solids.push([x - hw, x + hw, z - hd, z + hd]); };
  const occupied = [];
  const free = (x, z, r) => occupied.every((o) => Math.hypot(o[0] - x, o[1] - z) > o[2] + r);

  // local → world for a building at (x,z) turned ry; local +z is the front door side
  const W = (x, z, ry, lx, lz) => [x + lx * Math.cos(ry) + lz * Math.sin(ry), z - lx * Math.sin(ry) + lz * Math.cos(ry)];
  // wall, roof and trim materials by Realm (Codex looks): timber frames in Flameborne and Stormreach, dressed stone in
  // Lightforge and Spiritveil, plank halls in Frostgrave, brick in Metalcrown, rough granite in Stonehold and Shadowdeep
  const WS = WALL_STYLE[info.realm] || "frame";
  const mWall = art.mat(WS === "frame" ? "plaster" : WS), mStone = art.mat("stone"), mBeam = art.mat("beam", { roughness: 0.85 }), mPlank = art.mat("planks", { roughness: 0.85 });
  const roofTex = isV0 && (P.roofType === "gable" || P.roofType === "steep") && info.realm !== "frost" ? "thatch" : (ROOF_TEX[info.realm] || "slate");
  const mRoof = art.mat(roofTex, { roughness: roofTex === "slate" ? 0.7 : 0.95 });
  const beamC = info.realm === "ember" || info.realm === "metal" ? 0x2a2018 : info.realm === "frost" ? 0x4a3a2c : 0x3e2c1e;
  const shutterC = shade(P.trim, 0.7).getHex();
  function gable(x, z, w, d, h, ry, rh, rc, oh, wallC) {
    // gable ends filled with wall, two thick slopes with an overhang, and a ridge beam
    M.add("prism", WS === "frame" ? mWall : mWall, x, h, z, d, rh, w, ry + Math.PI / 2, wallC);
    const a = Math.atan2(rh, d / 2), run = d / 2 + oh, L = run / Math.cos(a), th = 0.16;
    for (const sgn of [1, -1]) {
      const cz = sgn * run / 2, cy = h + rh - run / 2 * Math.tan(a) + th / 2 / Math.cos(a), p = W(x, z, ry, 0, cz);
      M.add("box", mRoof, p[0], cy, p[1], w + 0.7, th, L, ry, rc, sgn * a, { slope: true });
    }
    M.box(mBeam, x, h + rh + 0.06, z, w + 0.75, 0.2, 0.24, ry, beamC);
  }
  function windowAt(x, z, ry, lx, lz, y, side, wm) {
    // dark frame, a small glowing pane, shutters and a stone sill
    const r = side ? ry + Math.PI / 2 : ry;
    const P0 = side ? W(x, z, ry, lx, lz) : W(x, z, ry, lx, lz);
    const off = (k) => side ? W(x, z, ry, lx + k, lz) : W(x, z, ry, lx, lz + k);
    let q = off(0.02); M.box(mBeam, q[0], y, q[1], 0.78, 0.9, 0.08, r, beamC);
    q = off(0.05); B.add("box", wm, q[0], y, q[1], 0.5, 0.62, 0.04, r, null, { noShadow: true });
    q = off(0.07); B.box(q[0], y, q[1], 0.04, 0.62, 0.04, r, beamC); B.box(q[0], y, q[1], 0.5, 0.04, 0.04, r, beamC);
    for (const sd of [-1, 1]) { const t = side ? W(x, z, ry, lx + 0.06, lz + sd * 0.56) : W(x, z, ry, lx + sd * 0.56, lz + 0.06); M.box(mPlank, t[0], y, t[1], 0.32, 0.88, 0.05, r, shutterC); }
    q = off(0.1); M.box(mStone, q[0], y - 0.5, q[1], 0.9, 0.1, 0.22, r, shade(P.stone, 1.05));
    return P0;
  }
  function house(x, z, w, d, h, ry, o) {
    o = o || {};
    h *= tall * squat; const wc = o.wall || (rand() < 0.5 ? P.wall : mix(P.wall, P.wall2, rand()).getHex());
    const wallC = shade(WS === "frame" ? mix(wc, 0xe6dcc8, 0.45).getHex() : wc, 0.9 + rand() * 0.2);
    // stone plinth, walls
    M.box(mStone, x, 0.25, z, w + 0.14, 0.5, d + 0.14, ry, shade(P.stone, 0.85 + rand() * 0.2));
    M.box(mWall, x, h / 2 + 0.02, z, w, h, d, ry, wallC);
    if (WS === "frame" || WS === "planks") {
      // corner posts, sill and top plates, a mid rail and a pair of braces on the front
      for (const [i, j] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { const c = W(x, z, ry, i * (w / 2), j * (d / 2)); M.box(mBeam, c[0], h / 2 + 0.1, c[1], 0.24, h + 0.2, 0.24, ry, beamC); }
      for (const j of [-1, 1]) for (const yy of [0.55, h - 0.1].concat(h > 3.4 && WS === "frame" ? [h * 0.52] : [])) { const c = W(x, z, ry, 0, j * (d / 2 + 0.03)); M.box(mBeam, c[0], yy, c[1], w + 0.1, 0.18, 0.1, ry, beamC); }
      for (const i of [-1, 1]) for (const yy of [h - 0.1].concat(h > 3.4 && WS === "frame" ? [h * 0.52] : [])) { const c = W(x, z, ry, i * (w / 2 + 0.03), 0); M.box(mBeam, c[0], yy, c[1], 0.1, 0.18, d + 0.1, ry, beamC); }
      if (WS === "frame") for (const i of [-1, 1]) { const c = W(x, z, ry, i * (w / 2 - 0.55), d / 2 + 0.04); M.add("box", mBeam, c[0], h * 0.27 + 0.3, c[1], 0.12, Math.min(2.2, h * 0.5), 0.08, ry, beamC, 0, { rz: i * 0.6 }); }
    } else {
      // dressed stone: a cornice in the trim colour and quoins at the corners
      M.box(mStone, x, h - 0.1, z, w + 0.24, 0.22, d + 0.24, ry, shade(P.trim, 0.9));
      for (const [i, j] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { const c = W(x, z, ry, i * (w / 2), j * (d / 2)); M.box(mStone, c[0], h / 2, c[1], 0.36, h, 0.36, ry, shade(P.stone, 1.08)); }
    }
    const rt = o.roof || P.roofType, rc = shade(o.roofc || P.roof, 0.85 + rand() * 0.3);
    if (rt === "gable" || rt === "steep" || rt === "saw") {
      const rh = rt === "steep" ? d * 0.95 : rt === "saw" ? d * 0.4 : d * 0.6;
      gable(x, z, w, d, h, ry, rh, rc, 0.45, wallC);
      if (rt === "saw" || P.chimneys || rand() < 0.35) { const c = W(x, z, ry, w * 0.3, -d * 0.2); M.box(mStone, c[0], h + rh * 0.65 + 0.5, c[1], 0.6, rh * 0.7 + 1.4, 0.6, ry, shade(P.stone, 0.8)); }
    } else if (rt === "flat") {
      M.box(mStone, x, h + 0.15, z, w + 0.3, 0.3, d + 0.3, ry, rc);
      for (let i = -1; i <= 1; i += 2) for (let j = -1; j <= 1; j += 2) { const c = W(x, z, ry, i * (w / 2), j * (d / 2)); M.box(mStone, c[0], h + 0.55, c[1], 0.5, 0.6, 0.5, ry, rc); }
    } else if (rt === "dome") {
      M.box(mStone, x, h + 0.12, z, w + 0.2, 0.24, d + 0.2, ry, P.wall2);
      const r = Math.min(w, d) * 0.85; B.add("dome", kit.mat(0xffffff, { metalness: 0.5, roughness: 0.4, flatShading: false }), x, h + 0.2, z, r, r * 0.8, r, 0, rc);
    } else if (rt === "spire") {
      gable(x, z, w, d, h, ry, d * 0.55, rc, 0.35, wallC);
      if (o.spire !== false) { const c = W(x, z, ry, w * 0.32, 0); M.add("cyl", mWall, c[0], h + 1.4, c[1], 1.1, 2.8, 1.1, 0, P.wall); M.add("cone", mRoof, c[0], h + 2.8 + 1.4, c[1], 1.4, 2.8, 1.4, 0, rc); }
    }
    // door: frame, planks, lintel and a step
    { const dp = W(x, z, ry, 0, d / 2 + 0.04); M.box(mBeam, dp[0], 1.05, dp[1], 1.3, 2.1, 0.12, ry, beamC);
      const dq = W(x, z, ry, 0, d / 2 + 0.08); M.box(mPlank, dq[0], 0.98, dq[1], 0.98, 1.86, 0.08, ry, shade(0x7a5434, 0.8 + rand() * 0.3));
      const ds = W(x, z, ry, 0, d / 2 + 0.4); M.box(mStone, ds[0], 0.08, ds[1], 1.5, 0.16, 0.6, ry, shade(P.stone, 0.95)); }
    const wm = P.lanterns || info.realm === "shadow" ? coldWin : winMat;
    const nwin = Math.max(1, Math.floor(w / 2.4));
    for (let i = 0; i < nwin; i++) {
      const lx = (i - (nwin - 1) / 2) * 2.2; if (Math.abs(lx) < 1.1) continue;
      if (rand() < 0.8) windowAt(x, z, ry, lx, d / 2, Math.min(h * 0.5, 1.6), false, wm);
      if (h > 4.5 && rand() < 0.7) windowAt(x, z, ry, lx, d / 2, h * 0.78, false, wm);
    }
    if (rand() < 0.6) windowAt(x, z, ry, w / 2, 0, Math.min(h * 0.5, 1.6), true, wm);
    if (P.lanterns && rand() < 0.7) { const p = W(x, z, ry, 0.9, d / 2 + 0.35); B.add("box", kit.glow(0xc8e0ff), p[0], 2.1, p[1], 0.18, 0.24, 0.18, 0, null, { noShadow: true }); }
    // barrels, crates and a bench by the walls
    if (rand() < 0.6) { const p = W(x, z, ry, -w / 2 + 0.6, d / 2 + 0.75); if (rand() < 0.55) barrel(p[0], p[1]); else crate(p[0], p[1], rand()); }
    if (rand() < 0.35) { const p = W(x, z, ry, w / 2 - 0.5, d / 2 + 0.7); crate(p[0], p[1], rand()); if (rand() < 0.5) crate(p[0], p[1], rand(), 0.8); }
    solid(x, z, w, d, ry);
    occupied.push([x, z, Math.max(w, d) * 0.62]);
    return { door: W(x, z, ry, 0, d / 2 + 1.6), h };
  }
  function barrel(x, z, s) { s = s || 1; M.add("cyl", mPlank, x, 0.45 * s, z, 0.7 * s, 0.9 * s, 0.7 * s, rand() * 3, shade(0x8a6038, 0.85 + rand() * 0.3)); for (const yy of [0.2, 0.7]) M.add("cyl", mBeam, x, yy * s, z, 0.74 * s, 0.06, 0.74 * s, 0, 0x2a2420, 0, { noShadow: true }); solids.push([x - 0.35, x + 0.35, z - 0.35, z + 0.35]); }
  function crate(x, z, ry, y0) { const sz = 0.7 + rand() * 0.2; M.box(mPlank, x, (y0 || 0) + sz / 2, z, sz, sz, sz, ry, shade(0x9a7448, 0.8 + rand() * 0.3)); if (!y0) solids.push([x - 0.4, x + 0.4, z - 0.4, z + 0.4]); }
  function cart(x, z, ry) {
    M.box(mPlank, x, 0.85, z, 1.4, 0.12, 2.4, ry, 0x8a6a44); for (const sd of [-1, 1]) { const q = W(x, z, ry, sd * 0.7, 0); M.box(mPlank, q[0], 1.05, q[1], 0.08, 0.35, 2.4, ry, 0x7a5a38); }
    for (const sd of [-1, 1]) { const q = W(x, z, ry, sd * 0.8, -0.3); M.add("cyl", mBeam, q[0], 0.55, q[1], 1.1, 0.12, 1.1, ry, 0x4a3422, 0, { rz: Math.PI / 2 }); }
    const t = W(x, z, ry, 0, 1.9); M.box(mBeam, t[0], 0.7, t[1], 0.1, 0.1, 1.6, ry, 0x4a3422);
    if (rand() < 0.7) { const q = W(x, z, ry, 0, -0.4); M.box(art.mat("cloth"), q[0], 1.2, q[1], 1.2, 0.5, 1.2, ry, P.cloth[Math.floor(rand() * P.cloth.length)]); }
    solid(x, z, 1.6, 2.6, ry);
  }
  function lamp(x, z) { const sx = x > 0 ? -1 : 1; M.box(mBeam, x, 1.3, z, 0.14, 2.6, 0.14, 0, beamC); M.box(mBeam, x + sx * 0.25, 2.55, z, 0.6, 0.08, 0.08, 0, beamC); B.add("box", P.lanterns ? kit.glow(0xc8e0ff) : kit.glow(0xffb45a), x + sx * 0.5, 2.3, z, 0.2, 0.28, 0.2, 0, null, { noShadow: true }); solids.push([x - 0.2, x + 0.2, z - 0.2, z + 0.2]); }
  const SIGNS = [];
  function keySpot(key, label, sub, x, z, light, cold) {
    spots.push({ key, label, x, z, r: 2.8 });
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.9, 1.15, 28), new THREE.MeshBasicMaterial({ color: cold ? 0xb8a8ff : 0xffc870, transparent: true, opacity: 0.55, depthWrite: false, side: THREE.DoubleSide }));
    ring.rotation.x = -Math.PI / 2; ring.position.set(x, 0.07, z); scene.add(ring);
    const sp = labelSprite(st, label, sub); sp.position.set(x, 3.6, z); scene.add(sp); SIGNS.push(sp);
    ticks.push((dt, t) => { ring.material.opacity = 0.35 + 0.25 * Math.sin(t * 3 + x); ring.rotation.z += dt * 0.4; });
    if (light !== false) torches.push(torch(kit, scene, x + 1.4, 2.3, z, cold ? 0xc8dcff : P.torch, torches.length < 6, cold));
    B.box(x + 1.4, 1.1, z, 0.12, 2.2, 0.12, 0, 0x3a2a1c);
  }

  // --- key places by settlement type ---
  const isV = info.type === "village", isC = info.type === "castle";
  if (!isV) {
    // the hall (towns) or the keep (castles), north end of the main street
    const hz = -R + (isC ? 9 : 8);
    if (isC) {
      const kw = 11, kh = 9 * squat * tall;
      M.box(mStone, 0, kh / 2, hz, kw, kh, kw, 0, P.stone); solid(0, hz, kw, kw); occupied.push([0, hz, 8]);
      for (let i = -1; i <= 1; i += 2) for (let j = -1; j <= 1; j += 2) { M.add("cyl", mStone, i * kw / 2, kh * 0.62, hz + j * kw / 2, 3, kh * 1.24, 3, 0, shade(P.stone, 0.9)); M.add("cone", mRoof, i * kw / 2, kh * 1.24 + 1.4, hz + j * kw / 2, 3.6, 2.8, 3.6, 0, P.roof); }
      for (let i = -4; i <= 4; i += 2) { M.box(mStone, i, kh + 0.4, hz + kw / 2, 0.9, 0.8, 0.6, 0, P.stone); M.box(mStone, i, kh + 0.4, hz - kw / 2, 0.9, 0.8, 0.6, 0, P.stone); }
      M.box(mBeam, 0, 1.4, hz + kw / 2 + 0.05, 2.6, 2.8, 0.14, 0, beamC); M.box(mPlank, 0, 1.3, hz + kw / 2 + 0.1, 2.2, 2.6, 0.1, 0, 0x5a3c24);
      for (const i of [-3, 3]) windowAt(0, hz, 0, i, kw / 2, kh * 0.6, false, winMat);
      banner(0, kh + 0.8, hz + kw / 2 + 0.2, info.own ? info.banner : P.accent, 2.4);
      keySpot("hall", "The Keep", info.own ? "your hold" : (info.ownerName || "the lord"), 0, hz + kw / 2 + 1.8);
    } else {
      const hw = info.size >= 4 ? 14 : 12;
      house(0, hz, hw, 9, 6.5, 0, { roofc: P.roof });
      M.add("cyl", mStone, hw / 2 - 1, 5.5, hz - 2, 2.6, 11, 2.6, 0, P.stone); M.add("cone", mRoof, hw / 2 - 1, 12.4, hz - 2, 3.2, 2.8, 3.2, 0, P.roof);
      banner(-2.5, 7.4, hz + 4.6, info.own ? info.banner : P.accent, 2);
      keySpot("hall", info.size >= 4 ? "The Great Hall" : "Town Hall", info.own ? "your hold" : (info.ownerName || ""), 0, hz + 6.2);
    }
    // market stalls round the plaza
    const stalls = isC ? 3 : info.size >= 4 ? 7 : 5;
    for (let i = 0; i < stalls; i++) {
      const a = (i / stalls) * Math.PI * 2 + 0.4, r = 5.2, x = Math.cos(a) * r, z = Math.sin(a) * r;
      if (Math.abs(x) < 2.2 || Math.abs(z) < 2.2) continue;
      const ry = -a + Math.PI / 2, cc = P.cloth[i % P.cloth.length];
      for (const [lx, lz] of [[-0.9, -0.6], [0.9, -0.6], [-0.9, 0.6], [0.9, 0.6]]) { const p = W(x, z, ry, lx, lz); M.box(mBeam, p[0], 1.1, p[1], 0.1, 2.2, 0.1, ry, 0x4a3420); }
      M.add("prism", art.mat("cloth"), x, 2.2, z, 2.3, 0.55, 1.9, ry + Math.PI / 2, i % 2 ? shade(P.accent, 0.85).getHex() : cc);
      M.box(mPlank, x, 0.8, z, 1.9, 0.12, 1.2, ry, 0x8a6a44);
      for (let k = 0; k < 3; k++) { const p = W(x, z, ry, -0.5 + k * 0.5, 0); B.box(p[0], 0.98, p[1], 0.3, 0.25, 0.3, ry, [0xc8a040, 0x8a3a2a, 0x5a7a3a, 0xd8c8a0][(i + k) % 4]); }
      { const p = W(x, z, ry, 1.2, 0.7); if (rand() < 0.6) barrel(p[0], p[1], 0.8); else crate(p[0], p[1], rand()); }
      solid(x, z, 2, 1.4, ry);
    }
    keySpot("market", "Market", "grain, salvage, gear", -3.4, 3.4);
    cart(-7.2, -4.2, 0.5); if (!isC) cart(6.8, 5.6, -2.4);
    for (let zz = 10; zz < R - 4; zz += 8) { lamp(-3.5, zz); lamp(3.5, zz - 4); }
    if (info.writs) {
      M.box(mBeam, 3.2, 1.0, -3.6, 0.12, 2, 0.12, 0, 0x3a2a1c); M.box(mBeam, 4.8, 1.0, -3.6, 0.12, 2, 0.12, 0, 0x3a2a1c); M.box(mPlank, 4, 1.5, -3.6, 1.9, 1.1, 0.1, 0, 0x8a6a44); M.add("prism", mRoof, 4, 2.1, -3.6, 0.6, 0.3, 2.2, Math.PI / 2, P.roof);
      for (let k = 0; k < 4; k++) B.box(3.45 + k * 0.38, 1.5 + (k % 2) * 0.18, -3.53, 0.28, 0.36, 0.02, 0, 0xe8dcc0, null, { noShadow: true });
      solid(4, -3.6, 2, 0.4); keySpot("writs", "Writ Board", "contracts", 4, -2.2, false);
    }
    // tavern, smithy, barracks, shrine
    const t1 = house(9.5, 9, 7, 6, 4.4, -Math.PI / 2); keySpot("tavern", "Tavern", info.townKael ? "a young swordsman waits" : "rumours", t1.door[0], t1.door[1]);
    const s1 = house(-9.5, 9, 6, 6, 3.6, Math.PI / 2, { roof: P.roofType === "dome" ? "flat" : undefined });
    { const p = W(-9.5, 9, Math.PI / 2, 2, 4.2); M.box(mStone, p[0], 0.5, p[1], 1.4, 1.0, 1.2, 0, P.stone); const f = new THREE.Mesh(kit.g.box, kit.glow(0xff7a2a)); f.scale.set(0.9, 0.25, 0.7); f.position.set(p[0], 1.05, p[1]); scene.add(f);
      B.box(p[0] + 0.2, 0.55, p[1] + 1.6, 0.5, 0.5, 0.9, 0, 0x2a2a2e); torches.push(torch(kit, scene, p[0], 1.3, p[1], 0xff7a2a, true)); solid(p[0], p[1], 1.4, 1.2); }
    keySpot("smith", "Smithy", "the forge", s1.door[0], s1.door[1], false);
    const b1 = house(-10.5, -9, 9, 5.5, 3.6, Math.PI / 2, { roof: "gable" }); keySpot("barracks", "Barracks", "hire men", b1.door[0], b1.door[1]);
    for (let k = 0; k < 3; k++) { const p = W(-10.5, -9, Math.PI / 2, -2 + k * 2, 3.6); M.box(mBeam, p[0], 0.9, p[1], 0.08, 1.8, 0.08, 0, 0x6a4a2a); }
    { const p = W(-10.5, -9, Math.PI / 2, 3.2, 3.4); M.box(mBeam, p[0], 0.9, p[1], 0.1, 1.8, 1.6, Math.PI / 2, 0x4a3422); }
    shrine(10, -9);
    walls();
  } else {
    // village: elder's house, granary, fields, builders' yard, shrine, and a tavern or smithy if built
    const e1 = house(0, -11, 8, 6, 3.6, 0); keySpot("barracks", "Village Elder", "men for your column", e1.door[0], e1.door[1]);
    M.add("cyl", mPlank, 8, 1.8, 3, 4.4, 3.6, 4.4, 0, shade(P.wall, 1.1)); M.add("cone", mRoof, 8, 4.6, 3, 5.6, 2.2, 5.6, 0, P.roof); M.add("cyl", mStone, 8, 0.2, 3, 4.7, 0.4, 4.7, 0, P.stone); solid(8, 3, 4.4, 4.4); occupied.push([8, 3, 3]);
    barrel(5.4, 0.8); barrel(6.1, 0.4); crate(10.6, 0.6, 0.3); cart(3.2, 7.5, 0.9);
    keySpot("market", "Granary", "buy and sell grain", 5, 3.4);
    // fields north and west
    for (let r = 0; r < 9; r++) { M.box(art.mat("dirt"), -14 - r * 1.3, 0.06, -8, 1.3, 0.12, 12, 0, shade(P.ground, 0.7), { noShadow: true }); M.box(art.mat("thatch"), -14 - r * 1.3, 0.3, -8, 0.6, 0.5, 11.6, 0, r % 2 ? 0x9aa84a : 0xd8b850, { noShadow: true }); }
    for (let r = 0; r < 7; r++) { M.box(art.mat("dirt"), 14 + r * 1.3, 0.06, -12, 1.3, 0.12, 10, 0, shade(P.ground, 0.7), { noShadow: true }); M.box(art.mat("thatch"), 14 + r * 1.3, 0.3, -12, 0.6, 0.5, 9.6, 0, r % 2 ? 0x7a9a42 : 0xc8b048, { noShadow: true }); }
    keySpot("fields", "The Fields", "work for crowns", -12, -1.5, false);
    M.box(mPlank, -6, 0.35, 8, 3, 0.7, 1.2, 0.2, 0x9a7a50); M.box(mBeam, -6.2, 0.95, 8, 2.6, 0.5, 1, 0.1, 0xa88458); M.box(mStone, -4.2, 0.4, 9.4, 1.2, 0.8, 1, 0.4, P.stone); keySpot("build", "Builders' Yard", "raise a building", -6, 10.2, false);
    if (info.has.tavern) { const t = house(-9, -2, 6, 5, 3.4, Math.PI / 2); keySpot("tavern", "Tavern", "", t.door[0], t.door[1]); }
    if (info.has.smithy) { const s = house(9, -9, 5, 5, 3.2, -Math.PI / 2); keySpot("smith", "Smithy", "gear", s.door[0], s.door[1], false); torches.push(torch(kit, scene, s.door[0], 1.2, s.door[1] - 1, 0xff7a2a, true)); }
    shrine(-4, -4.5);
    // fences round the green
    for (let i = 0; i < 40; i++) { const a = i / 40 * Math.PI * 2, r = R - 2; const x = Math.cos(a) * r, z = Math.sin(a) * r; if (z > R - 6 && Math.abs(x) < 4) continue; M.box(mBeam, x, 0.5, z, 0.14, 1, 0.14, 0, 0x5a4026); M.box(mBeam, x, 0.75, z, 0.1, 0.08, 3.3, -a, 0x6a4a2c); M.box(mBeam, x, 0.4, z, 0.1, 0.08, 3.3, -a, 0x6a4a2c); }
    // the way out
    spots.push({ key: "gate", label: "The village edge", x: 0, z: R - 1, r: 3 });
  }
  if (info.townKael) npcStatic(t1door(), 0, { cloth: 0x8a8782, cloth2: 0xa0522d, skin: 0xa0663e, helm: "bare", weapon: "sword", scale: 0.96, ch: kaelLook(false) });
  function t1door() { const s = spots.find((p) => p.key === "tavern"); return s ? [s.x - 1.6, s.z + 0.8] : [6, 6]; }

  function shrine(x, z) {
    for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; M.box(mStone, x + Math.cos(a) * 2.1, 1.1, z + Math.sin(a) * 2.1, 0.55, 2.2 + rand() * 0.6, 0.4, -a, shade(P.stone, 0.8 + rand() * 0.3)); solid(x + Math.cos(a) * 2.1, z + Math.sin(a) * 2.1, 0.6, 0.6); }
    M.box(mStone, x, 0.4, z, 1, 0.8, 1, 0.3, shade(P.stone, 0.75));
    const l = new THREE.Mesh(kit.g.box, kit.glow(0xc8dcff)); l.scale.set(0.3, 0.42, 0.3); l.position.set(x, 1.05, z); scene.add(l);
    torches.push(torch(kit, scene, x, 1.5, z, 0xb8c8ff, torches.length < 6, true)); solid(x, z, 1, 1); occupied.push([x, z, 3]);
    keySpot("shrine", "Memory Shrine", "the Ledger", x, z + 3.1, false, true);
  }
  function banner(x, y, z, col, s) {
    const m = new THREE.Mesh(kit.g.box, kit.mat(col, { side: THREE.DoubleSide })); m.scale.set(0.9 * s / 2, 1.6 * s / 2, 0.04); m.position.set(x, y - 0.8 * s / 2, z); m.castShadow = true; scene.add(m);
    ticks.push((dt, t) => { m.rotation.y = Math.sin(t * 1.7 + x) * 0.12; });
  }
  function walls() {
    const wh = (isC ? 5 : 3.6) * squat, th = 1.2, col = shade(P.stone, 0.95);
    const seg = (x, z, w, d) => { M.box(mStone, x, wh / 2, z, w, wh, d, 0, col); solid(x, z, w, d); for (let i = -w / 2 + 0.5; i < w / 2; i += 1.6) if (w > d) M.box(mStone, x + i, wh + 0.35, z, 0.8, 0.7, th, 0, col); else M.box(mStone, x, wh + 0.35, z + i, th, 0.7, 0.8, 0, col); };
    seg(0, -R, R * 2, th); seg(-R, 0, th, R * 2); seg(R, 0, th, R * 2);
    seg(-(R + 3.2) / 2, R, R - 3.2, th); seg((R + 3.2) / 2, R, R - 3.2, th);
    for (const [x, z] of [[-R, -R], [R, -R], [-R, R], [R, R], [-4.2, R], [4.2, R]]) { M.add("cyl", mStone, x, wh * 0.7, z, 2.6, wh * 1.4, 2.6, 0, shade(P.stone, 0.88)); M.add("cone", mRoof, x, wh * 1.4 + 1.1, z, 3, 2.2, 3, 0, P.roof); solid(x, z, 2.4, 2.4); }
    M.box(mStone, 0, wh + 0.6, R, 7, 1.2, th + 0.3, 0, col); M.box(mBeam, 0, wh - 0.1, R, 5.4, 0.3, th + 0.4, 0, beamC);
    torches.push(torch(kit, scene, -2.9, 3.2, R - 0.85, P.torch, torches.length < 6)); torches.push(torch(kit, scene, 2.9, 3.2, R - 0.85, P.torch, false));
    spots.push({ key: "gate", label: "The Gate", x: 0, z: R - 1.2, r: 2.8 });
    npcStatic([-2.4, R - 2.2], Math.PI, guardLook()); npcStatic([2.4, R - 2.2], Math.PI, guardLook());
  }
  function guardLook() { return { cloth: P.cloth[1], cloth2: 0x2a2420, armour: true, metal: info.realm === "light" ? 0xd8b858 : info.realm === "metal" ? 0x2c2c30 : 0x8a8e94, tabard: info.own ? info.banner : P.accent, helm: info.realm === "metal" ? "spike" : info.realm === "shadow" ? "hood" : "cap", weapon: "spear", shield: P.accent }; }

  // filler houses on lots along the streets
  const lotStep = isV ? 7.5 : 7;
  for (let gx = -R + 4.5; gx <= R - 4.5; gx += lotStep) for (let gz = -R + 4.5; gz <= R - 4.5; gz += lotStep) {
    const x = gx + (rand() - 0.5) * 1.6, z = gz + (rand() - 0.5) * 1.6;
    if (Math.abs(x) < 6 || Math.abs(z) < 6) continue;
    if (Math.hypot(x, z) < 11) continue;
    if (isV && Math.hypot(x, z) > R - 4) continue;
    if (isV && rand() < 0.35) continue;
    if (!free(x, z, 3.4)) continue;
    const w = 4 + rand() * 2.4, d = 3.6 + rand() * 2, h = 2.8 + rand() * (isV ? 1 : 2.6);
    const ry = Math.abs(x) > Math.abs(z) ? (x > 0 ? -Math.PI / 2 : Math.PI / 2) : (z > 0 ? Math.PI : 0);
    house(x, z, w, d, h, ry + (isV ? (rand() - 0.5) * 0.5 : 0));
  }
  // trees and far hills outside
  for (let i = 0; i < 70; i++) {
    const a = rand() * Math.PI * 2, r = R + 7 + rand() * 40, x = Math.cos(a) * r, z = Math.sin(a) * r;
    if (Math.abs(x) < 5 && z > 0) continue;
    const h = 3 + rand() * 4, tc = info.realm === "frost" ? 0x3a5048 : info.realm === "light" ? 0x7a8a3a : info.realm === "shadow" ? 0x22282a : 0x2e4a2a;
    tree(B, white, x, groundY(x, z), z, h, tc, rand);
  }
  for (let i = 0; i < 18; i++) { const a = i / 18 * Math.PI * 2 + rand() * 0.2, r = 150 + rand() * 40; B.add("cone", white, Math.cos(a) * r, 18, Math.sin(a) * r, 60 + rand() * 50, 36 + rand() * 40, 60 + rand() * 50, rand(), shade(P.ground, 0.55), { noShadow: true }); }
  B.build(scene); M.build(scene, (g) => st.track(g));

  // scattered grass and stones (High only)
  { const tint = GRASS_TINT[info.realm] || [0x6a8a3a, 0x9aa84a];
    const n = Math.round((st.gfx === "low" ? 0 : st.coarse ? 1600 : 3000) * (GRASS_N[info.realm] || 1));
    const gf = grassField((x) => st.track(x), n, () => { const a = rand() * Math.PI * 2, r = 3 + rand() * (R + 26), x = Math.cos(a) * r, z = Math.sin(a) * r; if (Math.abs(x) < 3 || (Math.abs(z) < 3 && Math.abs(x) < R)) return null; if (Math.hypot(x, z) < (isV0 ? 6 : 8.5)) return null; if (solids.some((s) => x > s[0] - 0.4 && x < s[1] + 0.4 && z > s[2] - 0.4 && z < s[3] + 0.4)) return null; return [x, groundY(x, z), z]; }, tint[0], tint[1]);
    if (gf) { scene.add(gf); st.onGfx.push((q) => { gf.visible = q !== "low"; }); } }

  // the Void on the horizon when it is close
  if (info.voidNear > 0.15) {
    const vs = new THREE.Sprite(new THREE.SpriteMaterial({ map: kit.coldTex, color: VOIDC, transparent: true, opacity: 0.5 * info.voidNear, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }));
    vs.scale.set(120, 60, 1); vs.position.set(-40, 20, -170); scene.add(vs);
    const vl = new THREE.PointLight(VOIDC, 40 * info.voidNear, 60, 1.5); vl.position.set(-14, 8, -R); scene.add(vl);
    scene.add(particles(st, "void", 120, 70, 10));
  }
  const fx = particles(st, P.fx, info.realm === "frost" ? 500 : 260, 70, info.realm === "storm" ? 18 : 12, P.fxc); scene.add(fx);

  // townsfolk on the street graph
  const nodes = [];
  for (let z = -R + 5; z <= R - 3; z += 4) nodes.push([0, z]);
  for (let x = -R + 5; x <= R - 5; x += 4) if (Math.abs(x) > 1) nodes.push([x, 0]);
  const inSolid = (n) => solids.some((s) => n[0] > s[0] - 0.6 && n[0] < s[1] + 0.6 && n[1] > s[2] - 0.6 && n[1] < s[3] + 0.6);
  for (let i = nodes.length - 1; i >= 0; i--) if (inSolid(nodes[i])) nodes.splice(i, 1);
  const near = (n) => nodes.filter((m) => m !== n && ((m[0] === 0 && n[0] === 0 && Math.abs(m[1] - n[1]) <= 4.01) || (m[1] === 0 && n[1] === 0 && Math.abs(m[0] - n[0]) <= 4.01) || (Math.abs(m[0]) + Math.abs(m[1]) <= 4.01 && Math.abs(n[0]) + Math.abs(n[1]) <= 4.01)));
  const folk = [];
  const nf = isV ? 9 : isC ? 9 : info.size >= 4 ? 22 : 16;
  for (let i = 0; i < nf; i++) {
    const spawnable = nodes.filter((q) => q[1] < R - 9), n = (spawnable.length ? spawnable : nodes)[Math.floor(rand() * (spawnable.length || nodes.length))], c = P.cloth[Math.floor(rand() * P.cloth.length)];
    const kind = rand();
    const f = figure(kit, kind < 0.15 && !isV ? guardLook() : { cloth: c, cloth2: shade(P.cloth[(i + 2) % P.cloth.length], 0.8).getHex(), skin: [0xd8b090, 0xb88a68, 0x8a5a3a, 0xe8c8a8][Math.floor(rand() * 4)], helm: info.realm === "shadow" || info.realm === "spirit" && rand() < 0.5 ? "hood" : "bare", cloak: rand() < 0.4 ? shade(c, 0.7).getHex() : null, lantern: P.lanterns && rand() < 0.5 ? 0xc8e0ff : null, scale: 0.88 + rand() * 0.18 });
    const off = (rand() - 0.5) * 2.4;
    f.position.set(n[0] + (n[0] === 0 ? off : 0), 0, n[1] + (n[1] === 0 ? off : 0)); scene.add(f);
    folk.push({ f, n, tgt: null, off, wait: rand() * 3, sp: 1 + rand() * 0.5, t: rand() * 10 });
  }
  function npcStatic(p, ry, look) { const f = figure(kit, look); f.position.set(p[0], 0, p[1]); f.rotation.y = ry; scene.add(f); if (f.userData.ch) kit.statics.push(f); solids.push([p[0] - 0.35, p[0] + 0.35, p[1] - 0.35, p[1] + 0.35]); return f; }

  // the player
  const me = figure(kit, { cloth: 0x4a3a2a, cloth2: 0x2a2018, cloak: info.banner, skin: 0xc89a78, helm: "bare", weapon: "sword", shield: null, ch: heroLook(info.banner, false) });
  me.position.set(0, 0, R - (isV ? 3.5 : 6.5)); me.rotation.y = Math.PI; scene.add(me);
  let yaw = 0, pitch = 0.32, moveT = 0;
  followCam(camera, me.position.x, 0, me.position.z, yaw, pitch, 5.6 * st.distK, 0.55, 0, true);

  // HUD
  const where = (isV ? "Village" : isC ? "Castle" : info.size >= 4 ? "Capital" : "Town") + " · " + (info.own ? "your banner" : info.ownerName || P.name);
  st.$(".v3-hud").innerHTML = "<h3>" + esc(info.name) + "</h3><small>" + esc(where) + "</small>";
  st.$(".v3-keys").innerHTML = "WASD move · Shift run<br>drag or Q / E turn<br>E or Enter: go in · Tab: menu · Esc: map";
  st.$(".v3-top").innerHTML = '<button data-v="menu">Skip to menu</button><button data-v="map">Back to map</button>';
  st.$(".v3-act").innerHTML = '<button data-v="use">Go in</button><button data-v="run">Run</button>';
  st.gfxButton();
  const prompt = st.$(".v3-prompt");
  let running = false, exiting = false, cur = null;
  st.listen(st.root, "click", (e) => {
    const b = e.target.closest("[data-v]"); if (b) { const v = b.getAttribute("data-v"); if (v === "menu") exit("menu"); else if (v === "map") exit("map"); else if (v === "use") use(); else if (v === "run") { running = !running; b.classList.toggle("on", running); } return; }
    if (e.target === prompt || prompt.contains(e.target)) use();
  });
  inp.blocked = () => api.sheetOpen();
  inp.onKey = (k) => {
    if (k === "escape") exit("map");
    else if (k === "tab") exit("menu");
    else if ((k === "e" || k === "enter" || k === "f") && cur) use();
  };
  function use() { if (!cur || exiting) return; if (cur.key === "gate") { exit("map"); return; } api.sfx && api.sfx("door"); inp.keys = {}; api.open(cur.key); }
  function exit(how) { if (exiting) return; exiting = true; st.root.style.transition = "opacity .35s"; st.root.style.opacity = "0"; setTimeout(() => { st.dispose(); done(how); }, 360); }
  st.msg(info.name, 2.4);

  const pr = 0.38;
  function collide(p) {
    for (const s of solids) {
      const cx = clamp(p.x, s[0], s[1]), cz = clamp(p.z, s[2], s[3]), dx = p.x - cx, dz = p.z - cz, d = Math.hypot(dx, dz);
      if (d < pr) { if (d > 1e-4) { p.x = cx + dx / d * pr; p.z = cz + dz / d * pr; } else { p.x += pr; } }
    }
    for (const n of folk) { const dx = n.f.position.x - p.x, dz = n.f.position.z - p.z, d = Math.hypot(dx, dz); if (d < 0.75 && d > 1e-4) { n.f.position.x = p.x + dx / d * 0.75; n.f.position.z = p.z + dz / d * 0.75; } }
    const lim = isV ? R + 10 : R - 1; p.x = clamp(p.x, -lim, lim); p.z = clamp(p.z, -lim, isV ? R + 10 : (Math.abs(p.x) < 2.6 ? R + 3 : R - 1));
  }

  st.start((dt, t) => {
    const paused = api.sheetOpen() || exiting;
    torches.forEach((x) => x.tick(t)); ticks.forEach((f) => f(dt, t)); fx.userData.tick(dt, me.position.x, me.position.z); sky.userData.tick(dt, camera.position.x, camera.position.z); kit.tickStatics(dt);
    scene.children.forEach((o) => { if (o.isPoints && o !== fx && o.userData.tick) o.userData.tick(dt, me.position.x, me.position.z); });
    // folk wander street to street
    for (const n of folk) {
      n.t += dt;
      if (n.wait > 0) { n.wait -= dt; animFigure(n.f, n.t, 0, 0, false, dt); continue; }
      if (!n.tgt) { const nb = near(n.n); n.tgt = nb.length ? nb[Math.floor(Math.random() * nb.length)] : n.n; }
      const tx = n.tgt[0] + (n.tgt[0] === 0 ? n.off : 0), tz = n.tgt[1] + (n.tgt[1] === 0 ? n.off : 0), dx = tx - n.f.position.x, dz = tz - n.f.position.z, d = Math.hypot(dx, dz);
      const pd = Math.hypot(me.position.x - n.f.position.x, me.position.z - n.f.position.z);
      if (pd < 1.1) { n.f.rotation.y = angLerp(n.f.rotation.y, Math.atan2(me.position.x - n.f.position.x, me.position.z - n.f.position.z), 0.1); animFigure(n.f, n.t, 0, 0, false, dt); continue; }
      if (d < 0.2) { n.n = n.tgt; n.tgt = null; if (Math.random() < 0.3) n.wait = 1 + Math.random() * 3; continue; }
      n.f.position.x += dx / d * n.sp * dt; n.f.position.z += dz / d * n.sp * dt;
      n.f.rotation.y = angLerp(n.f.rotation.y, Math.atan2(dx, dz), 0.15); animFigure(n.f, n.t, 0.5 * n.sp, 0, false, dt);
    }
    if (!paused) {
      const k = inp.keys;
      yaw -= inp.turn * 0.006; inp.turn = 0; pitch = clamp(pitch + inp.pitch * 0.003, 0.08, 0.95); inp.pitch = 0;
      if (k.q || k.arrowleft) yaw += dt * 2.2; if ((k.e && !cur) || k.arrowright) yaw -= dt * 2.2;
      const mv = moveIntent(inp, yaw), run = k.shift || running, sp = (run ? 6.4 : 3.2) * mv.amt;
      if (mv.amt > 0.05) {
        me.position.x += mv.x * sp * dt; me.position.z += mv.z * sp * dt; collide(me.position);
        me.rotation.y = angLerp(me.rotation.y, Math.atan2(mv.x, mv.z), 1 - Math.exp(-dt * 12));
        moveT += dt * (run ? 1.6 : 1);
        if (Math.floor(moveT * 2.2) !== Math.floor((moveT - dt) * 2.2) && api.sfx && Math.random() < 0.35) api.sfx("step");
      }
      animFigure(me, moveT, mv.amt * (run ? 1.6 : 1), 0, false, dt);
      if (inp.click) { inp.click = 0; if (cur) use(); }
      // nearest place
      let best = null, bd = 1e9; for (const s of spots) { const d = Math.hypot(s.x - me.position.x, s.z - me.position.z); if (d < s.r && d < bd) { bd = d; best = s; } }
      if (best !== cur) { cur = best; if (cur) { prompt.innerHTML = "<b>E</b> &nbsp;" + (cur.key === "gate" ? esc(cur.label) + " · leave for the map" : "Go in · " + esc(cur.label)); prompt.hidden = false; } else prompt.hidden = true; }
      if (me.position.z > R + 1.5 && !isV) exit("map");
      if (isV && Math.hypot(me.position.x, me.position.z) > R + 8) exit("map");
    } else { prompt.hidden = true; cur = null; animFigure(me, moveT, 0, 0, false, dt); }
    for (const s of SIGNS) { const d = Math.hypot(s.position.x - me.position.x, s.position.z - me.position.z); s.material.opacity = Math.min(clamp(1.6 - d / 12, 0, 1), clamp((d - 2.6) / 2.5, 0, 1)); s.visible = s.material.opacity > 0.02; }
    followCam(camera, me.position.x, 0, me.position.z, yaw, pitch, 5.6 * st.distK, 0.55, dt);
    // keep the camera inside the walls so the gatehouse never fills the view
    if (walled && me.position.z < R - 1) { camera.position.z = Math.min(camera.position.z, R - 0.9); camera.position.x = clamp(camera.position.x, -R + 0.9, R - 0.9); if (camera.position.z < -R + 0.9) camera.position.z = -R + 0.9; }
    L.sun.position.set(me.position.x + 30, 42, me.position.z + 22); L.sun.target.position.set(me.position.x, 0, me.position.z);
  });
  return { stop: () => exit("map"), scene: st, info, me, spots, near: () => cur && cur.key, goTo(key) { const s = spots.find((p) => p.key === key); if (!s) return false; me.position.set(s.x, 0, s.z + 0.5); return true; } };
}
function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c])); }

// ======================================================================
// FIELD BATTLE
// ======================================================================
export function battle(api, info, done) {
  let st;
  try { st = makeStage("The lines are forming…"); }
  catch (e) { api.fail(e); setTimeout(() => done({ how: "fail" }), 0); return null; }
  const ctl = { ready: false, stop() { if (ctl.ready) return; ctl.off = true; st.dispose(); done({ how: "fail" }); }, fast() {}, state: () => ({}) };
  whenChars(() => {
    if (ctl.off) return;
    try { Object.assign(ctl, buildBattle(st, api, info, done)); ctl.ready = true; }
    catch (e) { api.fail(e); st.dispose(); setTimeout(() => done({ how: "fail" }), 0); }
  });
  return ctl;
}

function buildBattle(st, api, info, done) {
  const isVoid = info.kind === "void" || info.kind === "rift";
  const P = REALMS[info.realm] || REALMS.ember, kit = makeKit(st), { scene, camera, inp } = st, rand = rng((info.title || "") + "|" + Math.floor(info.p0 * 100));
  const B = new Batch(kit), white = kit.mat(0xffffff);
  const fogC = isVoid ? mix(P.fog, 0x2a2040, 0.6) : new THREE.Color(P.fog);
  scene.fog = new THREE.FogExp2(fogC, isVoid ? 0.02 : 0.012);
  const L = lights(st, P, new THREE.Vector3(0, 0, 0), 30, { dim: isVoid, cold: isVoid || COLD[info.realm] });
  const sky = paintedSky(isVoid ? mix(P.sky, 0x1a1030, 0.6) : P.sky, mix(fogC, 0xffffff, 0.1), L.sun.position.clone(), L.sun.color, Math.max(info.voidNear, isVoid ? 1 : 0), VOIDC, isVoid ? 0.8 : CLOUD[info.realm]); scene.add(sky);
  const art = kit.art, M = new Merge();
  if (isVoid) { L.sun.color = mix(P.sun, 0xb8a8ff, 0.5); const vl = new THREE.PointLight(VOIDC, 80, 70, 1.4); vl.position.set(0, 10, -34); scene.add(vl); }

  // terrain: gentle in the middle, hills at the edges
  const H = (x, z) => { const e = clamp((Math.max(Math.abs(x) - 26, Math.abs(z) - 34, 0)) / 30, 0, 1); return (vnoise(x * 0.05, z * 0.05) - 0.5) * (1.2 + e * 10) + (vnoise(x * 0.18 + 9, z * 0.18) - 0.5) * 0.35 + e * e * 6; };
  const tg = new THREE.PlaneGeometry(240, 240, 90, 90); tg.rotateX(-Math.PI / 2);
  { const pos = tg.attributes.position, uv = tg.attributes.uv, col = [], c0 = new THREE.Color(isVoid ? mix(P.ground, 0x3a2a4a, 0.4) : P.ground), c = new THREE.Color(), cv = new THREE.Color(0x4a2a6a), cd = shade(P.path, 0.9);
    for (let i = 0; i < pos.count; i++) { const x = pos.getX(i), z = pos.getZ(i), y = H(x, z); pos.setY(i, y); uv.setXY(i, x / 6, z / 6); const n = vnoise(x * 0.1, z * 0.1); c.copy(c0).multiplyScalar(0.8 + n * 0.32 + y * 0.012); if (!isVoid && vnoise(x * 0.06 + 7, z * 0.06) > 0.66) c.lerp(cd, 0.45); if (isVoid && vnoise(x * 0.07 + 3, z * 0.07) > 0.62) c.lerp(cv, 0.5); col.push(c.r, c.g, c.b); }
    tg.setAttribute("color", new THREE.Float32BufferAttribute(col, 3)); tg.computeVertexNormals(); }
  const terr = new THREE.Mesh(tg, art.mat(isVoid ? "dirt" : GROUND_TEX[info.realm] || "grass", { roughness: 1 })); terr.receiveShadow = true; scene.add(terr);
  // props
  const tc = info.realm === "frost" ? 0x3a5048 : info.realm === "light" ? 0x7a8a3a : isVoid ? 0x2a2434 : 0x2e4a2a;
  for (let i = 0; i < 140; i++) {
    let x = (rand() - 0.5) * 200, z = (rand() - 0.5) * 200; if (Math.abs(x) < 28 && Math.abs(z) < 36 && rand() < 0.92) continue;
    const h = 3 + rand() * 5, y = H(x, z);
    tree(B, white, x, y, z, h, tc, rand);
  }
  for (let i = 0; i < 40; i++) { const x = (rand() - 0.5) * 120, z = (rand() - 0.5) * 140; const s = 0.6 + rand() * 1.8; B.add("rock", white, x, H(x, z) + s * 0.25, z, s, s * 0.8, s, rand() * 6, shade(P.stone, 0.75 + rand() * 0.3)); }
  if (isVoid) for (let i = 0; i < 16; i++) { const a = rand() * Math.PI * 2, r = 14 + rand() * 40, x = Math.cos(a) * r, z = Math.sin(a) * r - 10; const m = new THREE.Mesh(kit.g.cone, kit.mat(0x6a4aa0, { emissive: VOIDC, emissiveIntensity: 0.8, roughness: 0.3 })); const s = 0.6 + rand() * 1.4; m.scale.set(s, s * 3, s); m.position.set(x, H(x, z) + s * 1.2, z); m.rotation.set(rand() - 0.5, 0, rand() - 0.5); m.castShadow = true; scene.add(m); }
  if (info.siege) { const z = -46, ms = art.mat("stone"), mr = art.mat(ROOF_TEX[info.realm] || "slate"); for (let x = -40; x <= 40; x += 8) { M.box(ms, x, H(x, z) + 4, z, 8.2, 8, 2, 0, shade(P.stone, 0.9)); for (let i = -3; i <= 3; i += 2) M.box(ms, x + i, H(x, z) + 8.4, z, 0.9, 0.8, 2.2, 0, shade(P.stone, 0.9)); } for (let x = -40; x <= 40; x += 20) { M.add("cyl", ms, x, H(x, z) + 6, z, 4, 12, 4, 0, shade(P.stone, 0.85)); M.add("cone", mr, x, H(x, z) + 13.5, z, 4.6, 3, 4.6, 0, P.roof); } }
  for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2, r = 170 + rand() * 30; B.add("cone", white, Math.cos(a) * r, 16, Math.sin(a) * r, 70 + rand() * 50, 40 + rand() * 40, 70 + rand() * 50, rand(), shade(P.ground, 0.5), { noShadow: true }); }
  B.build(scene); M.build(scene, (g) => st.track(g));
  { const tint = isVoid ? [0x3a3048, 0x5a4a6a] : GRASS_TINT[info.realm] || [0x6a8a3a, 0x9aa84a];
    const n = Math.round((st.gfx === "low" ? 0 : st.coarse ? 2000 : 4200) * (isVoid ? 0.5 : GRASS_N[info.realm] || 1));
    const gf = grassField((x) => st.track(x), n, () => { const x = (rand() - 0.5) * 110, z = (rand() - 0.5) * 120; return [x, H(x, z), z]; }, tint[0], tint[1]);
    if (gf) { scene.add(gf); st.onGfx.push((q) => { gf.visible = q !== "low"; }); } }
  const fx = particles(st, isVoid ? "void" : P.fx, isVoid ? 260 : info.realm === "frost" ? 420 : 200, 80, 14, isVoid ? null : P.fxc); scene.add(fx);
  // standards behind each line
  const standard = (x, z, col) => { const y = H(x, z); const pole = new THREE.Mesh(kit.g.cyl, kit.mat(0x4a3420)); pole.scale.set(0.12, 5, 0.12); pole.position.set(x, y + 2.5, z); pole.castShadow = true; scene.add(pole); const fl = new THREE.Mesh(kit.g.box, kit.mat(col, { side: THREE.DoubleSide })); fl.scale.set(1.4, 0.9, 0.04); fl.position.set(x + 0.72, y + 4.4, z); fl.castShadow = true; scene.add(fl); flags.push(fl); };
  const flags = [];
  standard(-3, 25, info.banner); standard(3, -25, info.ecol);

  // ---- forces ----
  const ownT = Math.max(1, Math.round(info.t0));
  const allyN = info.allies.reduce((a, h) => a + Math.max(2, Math.round(h.s)), 0);
  const NP = clamp(Math.round(ownT + (info.allyS > 0 ? Math.min(16, allyN) : 0)), 1, 44), NE = clamp(Math.round(info.en0), 3, 40);
  const nAlly = info.allyS > 0 ? clamp(Math.round(NP * info.allyS / info.p0), 1, NP - 1) : 0;
  const wp = info.p0 / NP, we = info.e0 / NE;
  const units = [];
  const ec = new THREE.Color(info.ecol), bc = new THREE.Color(info.banner), ecol2 = Math.abs(ec.r - bc.r) + Math.abs(ec.g - bc.g) + Math.abs(ec.b - bc.b) < 0.35 ? shade(info.ecol, 0.5).getHex() : info.ecol;
  const enemyLook = () => {
    if (isVoid) return { cloth: 0x1e1828, cloth2: 0x141018, skin: 0x3a2a4a, helm: "hood", hoodc: 0x16121e, eyes: VOIDC, weapon: rand() < 0.5 ? "sword" : "spear", cloak: 0x241a34 };
    if (info.fac) { const r = REALMS[info.fac] || P; return { cloth: r.cloth[0], cloth2: r.cloth[3] || 0x2a2420, armour: true, metal: info.fac === "metal" ? 0x2c2c30 : info.fac === "light" ? 0xd0b050 : info.fac === "frost" ? 0x6a7a8a : 0x8a8e94, tabard: ecol2, helm: info.fac === "metal" ? "spike" : info.fac === "shadow" ? "hood" : "cap", weapon: rand() < 0.45 ? "spear" : "sword", shield: info.fac === "shadow" ? null : ecol2 }; }
    return { cloth: [0x6a4a2a, 0x4a3a2a, 0x5a3a24, 0x3a3020][Math.floor(rand() * 4)], cloth2: 0x2a2018, skin: [0xc89a78, 0x9a6a48, 0xd8b090][Math.floor(rand() * 3)], helm: rand() < 0.5 ? "hood" : rand() < 0.5 ? "cap" : "bare", hoodc: 0x3a2a1c, weapon: rand() < 0.3 ? "spear" : "sword", shield: rand() < 0.4 ? 0x6a4a2a : null, armour: rand() < 0.2 };
  };
  const ownLook = (ally) => ally ? { cloth: 0x3a3428, cloth2: 0x2a2420, armour: true, tabard: ally.col, helm: "cap", weapon: rand() < 0.4 ? "spear" : "sword", shield: ally.col }
    : { cloth: 0x4a3e30, cloth2: 0x2a2420, armour: rand() < 0.6, tabard: info.banner, helm: rand() < 0.7 ? "cap" : "bare", weapon: rand() < 0.4 ? "spear" : "sword", shield: rand() < 0.7 ? info.banner : null };
  const ringGeo = st.track(new THREE.RingGeometry(0.3, 0.42, 16));
  const ringMat = (c, o) => new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: o, depthWrite: false });
  const ringP = ringMat(0xffd884, 0.55), ringHero = ringMat(0xffffff, 0.9), ringE = ringMat(isVoid ? 0xb89cff : 0xff3a2a, 0.6);
  function addUnit(side, i, n, w, look, extra) {
    const cols = Math.min(12, Math.ceil(Math.sqrt(n * 2.2))), row = Math.floor(i / cols), col = i % cols;
    const sx = (col - (cols - 1) / 2) * 1.55 + (rand() - 0.5) * 0.3, sz = (side === "p" ? 15 : -15) + (side === "p" ? 1 : -1) * row * 1.7 + (rand() - 0.5) * 0.3;
    const f = figure(kit, look); f.position.set(sx, H(sx, sz), sz); f.rotation.y = side === "p" ? Math.PI : 0; scene.add(f);
    const ring = new THREE.Mesh(ringGeo, side === "p" ? (extra && extra.hero ? ringHero : ringP) : ringE); ring.rotation.x = -Math.PI / 2; ring.position.y = 0.04; f.add(ring); f.userData.ring = ring;
    const u = Object.assign({ f, side, w, hp: w * 3.2, hpm: w * 3.2, x: sx, z: sz, hx: sx, hz: sz, yaw: f.rotation.y, tgt: null, cd: 0.4 + rand() * 0.8, atk: 0, rout: false, dead: false, gone: false, deadT: 0, t: rand() * 10, mv: 0, retarget: rand() * 0.3, reach: look.weapon === "spear" ? 1.75 : 1.35 }, extra || {});
    units.push(u); return u;
  }
  let ai = 0;
  info.allies.forEach((a) => { const k = Math.round(nAlly * a.s / Math.max(0.001, info.allyS)); for (let j = 0; j < k && ai < nAlly; j++, ai++) addUnit("p", NP - nAlly + ai, NP, wp, ownLook(a), { ally: true }); });
  for (let i = 0; i < NP - ai; i++) addUnit("p", i, NP, wp, ownLook(null));
  for (let i = 0; i < NE; i++) addUnit("e", i, NE, we, enemyLook());
  const p0w = units.filter((u) => u.side === "p").reduce((a, u) => a + u.w, 0), e0w = units.filter((u) => u.side === "e").reduce((a, u) => a + u.w, 0);
  // the hero and Kaelren (not counted in the line's strength, as on the 2D field)
  const hero = addUnit("p", 0, 1, info.heroW, { cloth: 0x4a3a2a, cloth2: 0x2a2018, armour: true, metal: 0x9a9ea4, cloak: info.banner, tabard: info.banner, helm: "bare", weapon: "sword", shield: info.banner, ch: heroLook(info.banner, true) }, { hero: true });
  hero.hp = hero.hpm = info.heroHp; hero.x = hero.hx = 0; hero.z = hero.hz = 11.5; hero.reach = 1.9;
  let kael = null;
  if (info.kaelAlive) { kael = addUnit("p", 0, 1, info.hb * 3, { cloth: 0x8a8782, cloth2: 0xa0522d, armour: true, metal: 0x2a2624, skin: 0xa0663e, helm: "bare", weapon: "sword", shield: 0xb8733a, ch: kaelLook(true) }, { kael: true }); kael.hp = kael.hpm = info.hb * 3 * 3.2 * 1.6; kael.x = kael.hx = -2.2; kael.z = kael.hz = 12.4; }
  units.forEach((u) => u.f.position.set(u.x, H(u.x, u.z), u.z));

  // clash sparks pool
  const sparks = []; for (let i = 0; i < 24; i++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: kit.glowTex, color: 0xffd8a0, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })); s.visible = false; s.scale.setScalar(0.7); scene.add(s); sparks.push({ s, t: 0 }); }
  let spi = 0; const spark = (x, y, z, col) => { const k = sparks[spi++ % sparks.length]; k.s.position.set(x, y, z); k.s.material.color.set(col || 0xffd8a0); k.s.visible = true; k.t = 0.25; };

  // HUD
  st.$(".v3-hud").innerHTML = '<h3 style="text-align:center">' + esc(info.title) + '</h3><div class="v3-bars"><div class="v3-bar"><i id="v3p" style="width:100%;background:linear-gradient(90deg,#8a5a24,' + info.banner + ')"></i></div><div class="v3-ord" id="v3o">Hold the line</div><div class="v3-bar e"><i id="v3e" style="width:100%;background:linear-gradient(90deg,' + (isVoid ? "#9a7cd0" : info.ecol) + ',#4a2a1a)"></i></div></div>';
  const hp = st.$(".v3-hp"); hp.hidden = false; hp.innerHTML = 'YOU<div class="v3-bar"><i id="v3h" style="width:100%;background:linear-gradient(90deg,#8a2a1a,#d8643a)"></i></div>' + (kael ? '<div style="margin-top:6px">KAELREN</div><div class="v3-bar"><i id="v3k" style="width:100%;background:linear-gradient(90deg,#6a2a10,#d4562c)"></i></div>' : "");
  st.$(".v3-keys").innerHTML = "WASD move · Shift run · drag or Q / E turn<br>click / Space strike · right-click / Ctrl block<br>C charge · H hold · F fall back";
  st.$(".v3-top").innerHTML = '<button data-v="flee">Fall back</button>';
  st.$(".v3-act").innerHTML = '<button data-v="charge">Charge</button><button data-v="hold" class="on">Hold</button><button data-v="block">Block</button><button data-v="atk">Strike</button>';
  st.gfxButton();
  const elP = st.$("#v3p"), elE = st.$("#v3e"), elO = st.$("#v3o"), elH = st.$("#v3h"), elK = st.$("#v3k");
  let order = "hold", t0 = 0, enemyGo = info.kind === "bandit" ? 2.5 : 4, over = null, overT = 0, paused = false, fleeAsk = 0, touchBlock = false, kdead = false, vowDone = !info.kael, heroDown = false, speedK = 1, yaw = 0, pitch = 0.5, ended = false;
  const setOrder = (o) => {
    order = o; elO.textContent = o === "charge" ? "Charge!" : "Hold the line";
    st.root.querySelectorAll(".v3-act [data-v=charge],.v3-act [data-v=hold]").forEach((b) => b.classList.toggle("on", b.getAttribute("data-v") === o));
    if (o === "charge") { api.sfx && api.sfx("horn"); st.msg("Charge!", 1.4); }
    else st.msg("Hold!", 1.2);
  };
  st.listen(st.root, "click", (e) => {
    const b = e.target.closest("[data-v]"); if (!b) return; const v = b.getAttribute("data-v");
    if (v === "charge" || v === "hold") setOrder(v); else if (v === "flee") askFlee(); else if (v === "atk") strike(); else if (v === "block") { touchBlock = !touchBlock; b.classList.toggle("on", touchBlock); }
  });
  inp.onKey = (k) => {
    if (paused || over) return;
    if (k === "c" || k === "1") setOrder("charge"); else if (k === "h" || k === "2") setOrder("hold");
    else if (k === " ") strike(); else if (k === "f" || k === "escape") askFlee();
  };
  function askFlee() { if (over) return; if (fleeAsk > 0) { finish("flee"); return; } fleeAsk = 2.2; st.msg("Fall back? Press F again to pull your men off the field.", 2.2); }
  st.msg(info.allies.length ? info.allies.map((a) => a.name).join(" and ") + " fight beside you. Press C to charge." : "Your line holds. Press C to charge.", 3.4);
  api.sfx && api.sfx("horn");

  const alive = (u) => !u.dead && !u.gone;
  const fighting = (u) => alive(u) && !u.rout;
  function sideW(s, fightOnly) { let w = 0; for (const u of units) if (u.side === s && !u.hero && !u.kael && (fightOnly ? fighting(u) : alive(u))) w += u.w; return w; }
  function nearestFoe(u) {
    let best = null, bd = 1e9;
    for (const o of units) { if (o.side === u.side || !fighting(o)) continue; const d = (o.x - u.x) ** 2 + (o.z - u.z) ** 2 - (o.hero ? 2 : 0); if (d < bd) { bd = d; best = o; } }
    return best;
  }
  function hurt(v, dmg, from) {
    if (!alive(v)) return;
    if (v.hero) {
      dmg = info.hb * (0.8 + Math.random() * 0.4) * Math.min(1, (from ? from.w : info.hb) / info.hb);
      const blocking = inp.rmb || inp.keys.control || touchBlock;
      if (blocking && from) { const a = Math.atan2(from.x - v.x, from.z - v.z); let d = a - v.f.rotation.y; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI; if (Math.abs(d) < 1.3) { dmg *= 0.2; spark(v.x, v.f.position.y + 1.3, v.z, 0xfff0c0); } }
      api.sfx && Math.random() < 0.5 && api.sfx("hurt");
    }
    v.hp -= dmg;
    if (v.hp <= 0) {
      if (v.hero) { v.hp = 0; heroDown = true; v.dead = true; v.deadT = 0; if (v.f.userData.ring) v.f.userData.ring.visible = false; st.msg("You are struck down. Your sergeants drag you behind the line. The men fight on.", 4); speedK = 2; return; }
      v.dead = true; v.deadT = 0;
      if (v.kael) { kdead = true; st.msg("Kaelren is down. Four men carry him back on a shield.", 3.5); }
      if (from && from.hero && api.sfx) api.sfx("kill");
    } else if (!v.hero && !v.kael && v.hp < v.hpm * 0.3 && Math.random() < 0.25) v.rout = true;
  }
  function strike() {
    if (heroDown || paused || over || hero.cd > 0) return;
    hero.cd = 0.55; hero.atk = 1; api.sfx && api.sfx("swing");
    later(0.16, () => {
      let n = 0;
      const hits = units.filter((o) => o.side === "e" && fighting(o)).map((o) => ({ o, d: Math.hypot(o.x - hero.x, o.z - hero.z) })).filter((p) => p.d < hero.reach + 0.6).sort((a, b) => a.d - b.d);
      for (const p of hits) {
        const a = Math.atan2(p.o.x - hero.x, p.o.z - hero.z); let d = a - hero.f.rotation.y; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI;
        if (Math.abs(d) > 1.0) continue;
        hurt(p.o, info.heroW * (0.9 + Math.random() * 0.3), hero); spark(p.o.x, p.o.f.position.y + 1.2, p.o.z); n++;
        if (n >= 3) break;
      }
      if (n && api.sfx) api.sfx("hit");
    });
  }
  function finish(how) {
    if (over) return; over = how; overT = 0;
    const end = st.$(".v3-end");
    end.innerHTML = how === "win" ? "They break!<small>the field is yours</small>" : how === "lose" ? "Your line breaks<small>fall back, fall back</small>" : "You pull back<small>the men follow your banner off the field</small>";
    end.classList.add("on"); if (how === "win" && api.sfx) api.sfx("horn");
  }
  function report() {
    if (ended) return; ended = true;
    const pf = clamp(sideW("p", false) / Math.max(1e-6, p0w), 0, 1), ef = clamp(sideW("e", false) / Math.max(1e-6, e0w), 0, 1);
    st.root.style.transition = "opacity .4s"; st.root.style.opacity = "0";
    setTimeout(() => { st.dispose(); done({ how: over, pf, ef, kdead }); }, 420);
  }
  // Kaelren's vow, as on the battle sheet: the line is breaking and he is about to ride
  function vowModal() {
    paused = true; vowDone = true; inp.keys = {};
    const m = document.createElement("div"); m.className = "v3-modal";
    m.innerHTML = '<div><p><b style="font-weight:400;color:#c8873a">Kaelren’s horse screams.</b> The line is breaking. He has seen a man go down, and no one is closer. In three seconds he will ride.</p>' + api.vowChoices().map((c) => '<button data-vow="' + c.id + '">' + esc(c.t) + "</button>").join("") + "</div>";
    st.root.appendChild(m);
    m.addEventListener("click", (e) => {
      const b = e.target.closest("[data-vow]"); if (!b) return; const id = b.getAttribute("data-vow"); m.remove();
      const r = api.vow(id, sideW("p", true) / Math.max(1e-6, p0w));
      if (r.end) { over = "done"; ended = true; st.root.style.transition = "opacity .4s"; st.root.style.opacity = "0"; setTimeout(() => { st.dispose(); done({ how: "done" }); }, 420); return; }
      paused = false;
      if (kael && id === "hold") kael.pinned = true;
      if (r.lost) { const k = Math.min(Math.round(r.lost * NP / Math.max(1, ownT)), 12); units.filter((u) => u.side === "p" && fighting(u) && !u.hero && !u.kael && !u.ally).sort((a, b) => b.x - a.x).slice(0, k).forEach((u) => { u.dead = true; u.deadT = 0; }); st.msg("The right flank never heard the order.", 3); }
      if (r.ride && kael && alive(kael)) {
        st.msg("Kaelren rides. The line breaks around him.", 3.5);
        const foes = units.filter((u) => u.side === "e" && fighting(u)); let w = 0; const half = foes.reduce((a, u) => a + u.w, 0) / 2;
        foes.sort((a, b) => Math.hypot(a.x - kael.x, a.z - kael.z) - Math.hypot(b.x - kael.x, b.z - kael.z));
        let delay = 0; for (const u of foes) { if (w >= half) break; w += u.w; const uu = u; delay += 0.12; later(delay, () => { if (alive(uu)) { uu.dead = true; uu.deadT = 0; spark(uu.x, uu.f.position.y + 1.2, uu.z, 0xff8a3a); } }); }
        kael.ride = true; kael.rideT = 2.6;
      }
    });
  }

  const sepR = 0.85, pend = [];
  followCam(camera, hero.x, hero.f.position.y, hero.z, 0, 0.5, 8 * st.distK, 0.7, 0, true);
  function later(s, fn) { pend.push({ t: t0 + s, fn }); }
  st.start((dt, time) => {
    for (const k of sparks) if (k.s.visible) { k.t -= dt; k.s.scale.setScalar(0.5 + (0.25 - k.t) * 3); k.s.material.opacity = k.t * 4; if (k.t <= 0) k.s.visible = false; }
    fx.userData.tick(dt, hero.x, hero.z); sky.userData.tick(dt, camera.position.x, camera.position.z); flags.forEach((f, i) => { f.rotation.y = Math.sin(time * 2 + i) * 0.25; });
    if (paused) return;
    if (fleeAsk > 0) fleeAsk -= dt;
    const sdt = dt * speedK;
    t0 += sdt;
    for (let i = pend.length - 1; i >= 0; i--) if (pend[i].t <= t0) { const p = pend.splice(i, 1)[0]; p.fn(); }
    // player control
    if (!heroDown && !over) {
      const k = inp.keys;
      yaw -= inp.turn * 0.006; inp.turn = 0; pitch = clamp(pitch + inp.pitch * 0.003, 0.12, 0.95); inp.pitch = 0;
      if (k.q || k.arrowleft) yaw += dt * 2.4; if (k.e || k.arrowright) yaw -= dt * 2.4;
      const blocking = inp.rmb || k.control || touchBlock;
      const mv = moveIntent(inp, yaw), run = k.shift && !blocking, sp = (blocking ? 1.8 : run ? 6.2 : 3.6) * mv.amt;
      if (mv.amt > 0.05) { hero.x += mv.x * sp * dt; hero.z += mv.z * sp * dt; hero.mv = mv.amt * (run ? 1.6 : 1); hero.f.rotation.y = angLerp(hero.f.rotation.y, Math.atan2(mv.x, mv.z), 1 - Math.exp(-dt * 12)); }
      else { hero.mv = 0; if (blocking || hero.atk > 0) hero.f.rotation.y = angLerp(hero.f.rotation.y, yaw + Math.PI, 1 - Math.exp(-dt * 10)); }
      if (inp.click) { inp.click = 0; hero.f.rotation.y = yaw + Math.PI; strike(); }
      hero.block = blocking;
      hero.x = clamp(hero.x, -70, 70); hero.z = clamp(hero.z, -70, 70);
    }
    if (hero.cd > 0) hero.cd -= dt;
    // the line's AI
    const pW = sideW("p", true), eW = sideW("e", true);
    if (!vowDone && !over && kael && fighting(kael) && (pW / p0w < 0.62 || kael.hp < kael.hpm * 0.4)) { vowModal(); return; }
    for (const u of units) {
      if (u.hero) continue;
      u.t += sdt;
      if (u.dead) {
        if (u.f.userData.ring) u.f.userData.ring.visible = false;
        if (u.f.userData.ch) { if (u.deadT === 0) { u.f.userData.ch.die(); u.deadT = 0.001; } u.f.userData.ch.update(sdt, 0, 0, false); continue; }
        if (u.deadT < 1) { u.deadT += sdt * 2.2; u.f.rotation.x = -Math.PI / 2 * Math.min(1, u.deadT); u.f.position.y = H(u.x, u.z) + 0.15 * Math.min(1, u.deadT); } continue;
      }
      if (u.gone) continue;
      if (u.ride) { u.rideT -= sdt; u.z -= sdt * 9; u.x += Math.sin(u.t * 2) * sdt * 2; u.mv = 1.6; if (u.rideT <= 0) { u.gone = true; u.f.visible = false; } u.f.position.set(u.x, H(u.x, u.z), u.z); u.f.rotation.y = Math.PI; animFigure(u.f, u.t, 1.6, 0, false, sdt); continue; }
      if (u.cd > 0) u.cd -= sdt; if (u.atk > 0) u.atk = Math.max(0, u.atk - sdt * 2.4);
      const sideRatio = u.side === "p" ? pW / p0w : eW / e0w;
      if (!u.rout && !u.kael && sideRatio < 0.32 && Math.random() < sdt * 0.6) u.rout = true;
      let tx = u.hx, tz = u.hz, want = false;
      if (u.rout) {
        tx = u.x + (u.x > 0 ? 3 : -3); tz = u.side === "p" ? 90 : -90; want = true;
        if (Math.abs(u.z) > 62) { u.gone = true; u.f.visible = false; continue; }
      } else {
        u.retarget -= sdt;
        if (u.retarget <= 0 || !u.tgt || !fighting(u.tgt)) { u.tgt = nearestFoe(u); u.retarget = 0.35 + Math.random() * 0.3; }
        const foe = u.tgt, fd = foe ? Math.hypot(foe.x - u.x, foe.z - u.z) : 1e9;
        const engage = u.side === "e" ? t0 > enemyGo || fd < 7 : u.pinned ? fd < 1.6 : (order === "charge" || fd < 6 || (u.kael && !u.pinned && fd < 9) || (u.ally && t0 > 6));
        if (u.kael && !engage && !heroDown) { tx = hero.x - 2; tz = hero.z + 1; want = Math.hypot(tx - u.x, tz - u.z) > 1.5; }
        if (foe && engage) {
          if (fd > u.reach) { tx = foe.x; tz = foe.z; want = true; }
          else {
            u.f.rotation.y = angLerp(u.f.rotation.y, Math.atan2(foe.x - u.x, foe.z - u.z), 0.2);
            if (u.cd <= 0) { u.cd = 0.85 + Math.random() * 0.5; u.atk = 1; const ff = foe, uu = u; later(0.18, () => { if (fighting(uu) && alive(ff) && Math.hypot(ff.x - uu.x, ff.z - uu.z) < uu.reach + 0.6) { hurt(ff, uu.w * (0.8 + Math.random() * 0.4), uu); if (Math.random() < 0.35) spark((ff.x + uu.x) / 2, ff.f.position.y + 1.2, (ff.z + uu.z) / 2); } }); }
          }
        } else if (u.side === "p" && order === "hold") { tx = u.hx; tz = u.hz; want = Math.hypot(tx - u.x, tz - u.z) > 0.4; }
        else if (u.side === "e" && !engage) { want = false; }
      }
      if (want) {
        const dx = tx - u.x, dz = tz - u.z, d = Math.hypot(dx, dz) || 1, sp = u.rout ? 4.2 : u.kael ? 4.4 : 3.1;
        u.x += dx / d * sp * sdt; u.z += dz / d * sp * sdt; u.mv = u.rout ? 1.5 : 1;
        u.f.rotation.y = angLerp(u.f.rotation.y, Math.atan2(dx, dz), 0.15);
      } else u.mv = Math.max(0, u.mv - sdt * 4);
    }
    // keep bodies apart
    for (let i = 0; i < units.length; i++) { const a = units[i]; if (!alive(a)) continue; for (let j = i + 1; j < units.length; j++) { const b = units[j]; if (!alive(b)) continue; const dx = b.x - a.x, dz = b.z - a.z, d2 = dx * dx + dz * dz; if (d2 < sepR * sepR && d2 > 1e-6) { const ma = a.hero ? 0 : 1, mb = b.hero ? 0 : 1; if (!ma && !mb) continue; const d = Math.sqrt(d2), push = (sepR - d) / (ma + mb), nx = dx / d, nz = dz / d; a.x -= nx * push * ma; a.z -= nz * push * ma; b.x += nx * push * mb; b.z += nz * push * mb; } } }
    const cpx = camera.position.x, cpz = camera.position.z;
    for (const u of units) { if (u.dead || u.gone || u.ride || u.hero) continue; u.f.position.set(u.x, H(u.x, u.z), u.z); const cd = Math.hypot(u.x - cpx, u.z - cpz); animFigure(u.f, u.t, u.mv, u.atk, false, sdt, cd > 45 ? 3 : cd > 26 ? 2 : 0); }
    hero.f.position.set(hero.x, H(hero.x, hero.z), hero.z);
    if (hero.atk > 0) hero.atk = Math.max(0, hero.atk - dt * 3);
    hero.t += dt; if (!heroDown) animFigure(hero.f, hero.t, hero.mv, hero.atk, hero.block, dt);
    else if (hero.f.userData.ch) { if (hero.deadT === 0) { hero.f.userData.ch.die(); hero.deadT = 0.001; } hero.f.userData.ch.update(dt, 0, 0, false); }
    else if (hero.deadT < 1) { hero.deadT += dt * 2; hero.f.rotation.x = -Math.PI / 2 * Math.min(1, hero.deadT); }
    // the outcome
    if (!over) {
      const pf = pW / p0w, ef = eW / e0w;
      if (ef < 0.2 || eW <= 0) finish("win");
      else if (pf < 0.2 || pW <= 0) finish("lose");
      else if (t0 > 240) finish(pf / Math.max(0.01, ef) >= 1 ? "win" : "lose");
    } else { overT += dt; if (overT > 2.2) report(); }
    if (over === "win") for (const u of units) if (u.side === "e" && fighting(u)) u.rout = true;
    if (over === "lose") for (const u of units) if (u.side === "p" && fighting(u) && !u.hero) u.rout = true;
    elP.style.width = Math.round(100 * clamp(pW / p0w, 0, 1)) + "%"; elE.style.width = Math.round(100 * clamp(eW / e0w, 0, 1)) + "%";
    elH.style.width = Math.round(100 * clamp(hero.hp / hero.hpm, 0, 1)) + "%"; if (elK && kael) elK.style.width = Math.round(100 * clamp(kael.dead ? 0 : kael.hp / kael.hpm, 0, 1)) + "%";
    // camera: over the shoulder, or a slow look over the field once you are down
    if (!heroDown) followCam(camera, hero.x, hero.f.position.y, hero.z, yaw, pitch, 8 * st.distK, 0.7, dt);
    else { let cx = 0, cz = 0, n = 0; for (const u of units) if (fighting(u)) { cx += u.x; cz += u.z; n++; } if (n) { cx /= n; cz /= n; } yaw += dt * 0.15; followCam(camera, cx, H(cx, cz), cz, yaw, 0.6, 22, 0, dt); }
    L.sun.position.set(hero.x + 30, 42, hero.z + 22); L.sun.target.position.set(hero.x, 0, hero.z);
  });
  return { stop: () => finish("flee"), fast(n) { st.substeps = Math.max(1, n | 0); }, hero, scene: st, info, units, state: () => ({ over, t: t0, order, pW: sideW("p", true) / p0w, eW: sideW("e", true) / e0w, heroDown, NP, NE }) , _finish: finish };
}
