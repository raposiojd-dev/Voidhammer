// Voidhammer: The Shattered Realms. The off-map places in 3D: Ashford, every hub, town, village and castle area,
// the roads, caves, camps, the builder's yard and the overland walk.
// This module only draws. The existing area simulation in index.html (AR: movement, collision, enemies, quests,
// chests, exits, dialogue) runs exactly as before; the bridge hands this module a read-only view of it plus a few
// input calls (move, strike, talk, shoot). So every quest, flag, number and save key is untouched.
// One sim pixel is PX metres; one 16 px tile is T metres. Sim x runs east (+x), sim y runs south (+z).
import { K3 } from "./scene3d.js";
import { Merge, paintedSky, grassField, groundMat, horizonBand, loadArt, useSkyEnv } from "./art.js";
import { BARKS } from "./barks.js";
import { setBiome, modelProp, pickW, biomeOf, recoloured, pack, FIRE, loadPack } from "./models.js";
import { clone as skClone } from "./lib/SkeletonUtils.js";
const { THREE, REALMS, townTone, VOIDC, GROUND_TEX, GRASS_TINT, CLOUD, COLD, tree, rng, vnoise, clamp, lerp, angLerp, shade, mix,
  makeStage, makeKit, whenChars, heroLook, kaelLook, figure, animFigure, Batch, lights, particles, pool, torch, followCam, moveIntent, labelSprite, radialTex, esc } = K3;

export const T = 1.35, PX = T / 16;
const CH = 24; // tiles per culling chunk
const LODR = 28; // metres: chunks further than this draw their cheap twin instead of the model trees
const WALL_STYLE = { ember: "frame", stone: "stone", storm: "frame", light: "ashlar", frost: "planks", spirit: "ashlar", shadow: "stone", metal: "brick" };
const ROOF_TEX = { ember: "tile", stone: "stone", storm: "slate", light: "tile", frost: "slate", spirit: "slate", shadow: "slate", metal: "slate" };
// house kinds (from the 2D town painter) that open a section of the settlement sheet
const KIND = { tavern: ["tavern", "Tavern"], smithy: ["smith", "Smithy"], barracks: ["barracks", "Barracks"], market: ["market", "Market"], granary: ["market", "Granary"], mill: ["market", "Mill"], yard: ["build", "Builders' Yard"], farm: ["fields", "The Fields"] };
const FEMALE = /\b(Mara|Marta|Ilse|Sella|Tamsin|Wen|Anwen|Orrel|Elyndra|Wren|Lady|Sister|Mother|Widow|Dame|Aunt|Gran|Nan|Maid|Mistress|Hild|Brannagh|Ysane|Lume)\b/i;

let styled = false;
function styleOnce() {
  if (styled) return; styled = true;
  const st = document.createElement("style");
  st.textContent = `
#area.v3on #acv,#area.v3on #astick,#area.v3on #ause{visibility:hidden!important;pointer-events:none!important}
#area.v3on{background:#0b0907}
#vh3d.v3-area{z-index:0}
#vh3d.v3-area .v3-top{top:auto;bottom:auto;top:calc(40% + env(safe-area-inset-top,0px));right:.55rem;flex-direction:column;align-items:flex-end}
#vh3d.v3-area .v3-top button{min-width:5.2rem;padding:.55rem .6rem}
#vh3d.v3-area .v3-top button.on{background:#c8873a;color:#1a1208}
@media (max-width:600px){#vh3d .v3-use{bottom:calc(9.4rem + env(safe-area-inset-bottom,0px));min-width:9rem;max-width:46vw;padding:.85rem 1rem;font-size:.92rem}#vh3d.v3-area .v3-top{top:calc(30% + env(safe-area-inset-top,0px))}#vh3d.v3-area .v3-top button{min-width:4.4rem;padding:.45rem .4rem;font-size:.54rem}}
#vh3d .v3-fl{position:absolute;left:0;top:0;pointer-events:none;font:700 .95rem 'IBM Plex Mono',monospace;color:#ffe9b0;text-shadow:0 1px 3px #000,0 0 6px #000;white-space:nowrap;will-change:transform}
#vh3d .v3-fl.h{color:#ff7a6a}
#vh3d .v3-hb{position:absolute;left:0;top:0;width:46px;height:6px;margin-left:-23px;background:#120c08cc;border:1px solid #000;pointer-events:none;will-change:transform}
#vh3d .v3-hb i{display:block;height:100%;background:#d4562c}
#vh3d .v3-hb.boss{width:90px;margin-left:-45px;height:8px}
#vh3d .v3-hb.y i{background:#e0d070}
#vh3d .v3-tag{position:absolute;left:0;top:0;pointer-events:none;padding:.2rem .45rem;background:#0c0906d8;border:1px solid #6a5535;border-radius:3px;font:600 .72rem 'IBM Plex Mono',monospace;white-space:nowrap;transform-origin:50% 100%;will-change:transform}
#vh3d .v3-bark{position:absolute;left:0;top:0;max-width:15rem;padding:.45rem .65rem;background:#f4ead2f0;color:#22180e;border-radius:10px;font:italic .82rem/1.3 Georgia,serif;pointer-events:none;box-shadow:0 3px 10px #0008;will-change:transform;transition:opacity .3s}
#vh3d .v3-bark:after{content:'';position:absolute;left:50%;bottom:-7px;margin-left:-6px;border:6px solid transparent;border-top-color:#f4ead2f0;border-bottom:0}
#vh3d .v3-hurt{position:absolute;inset:0;pointer-events:none;box-shadow:inset 0 0 90px 30px #b0201088;opacity:0;transition:opacity .08s}
#vh3d.touch .v3-keys{display:none}
#vh3d.v3-area .v3-keys{right:auto;left:1rem;bottom:1rem;text-align:left}
#area.v3on #ahud .abtns{display:none!important}
#area.v3on #ahearts{margin-top:0!important;padding:.15rem .9rem .35rem 0;font-size:1.15rem;pointer-events:auto;cursor:pointer;margin-left:env(safe-area-inset-left,0px)}
#area.v3on #aobj{display:block;width:max-content;max-width:min(17rem,46vw);margin-top:.1rem;margin-left:env(safe-area-inset-left,0px);padding:.3rem .55rem .32rem;border-left:2px solid #c8873a;border-radius:0 4px 4px 0;background:linear-gradient(90deg,rgba(12,9,6,.62),rgba(12,9,6,.22));font-size:.68rem!important;line-height:1.3;color:#e8d8b4;pointer-events:auto;cursor:pointer;opacity:0;transform:translateX(-6px);transition:opacity .6s,transform .6s}
#area.v3on #aobj b{display:block;font-size:.6rem;letter-spacing:.12em;text-transform:uppercase;color:#d8b868}
#aobj .aos{font-style:normal}#area.v3on #aobj .aos{display:none}
#area.v3on #atoast{transition:opacity .5s}#area.v3on #atoast.v3-tfade{opacity:0!important}
@media (orientation:landscape) and (max-height:520px){#area.v3on #atoast{top:calc(.55rem + env(safe-area-inset-top,0px));max-width:min(21rem,40vw);padding:.3rem .6rem!important;font-size:.72rem!important;line-height:1.3!important}}
#area.v3on #aobj.v3-objon{opacity:1;transform:none;transition:opacity .25s,transform .25s}
#vh3d .v3-nm{color:#f4e3b8;font:600 .74rem 'Cinzel',Georgia,serif;letter-spacing:.04em;border-color:#8a6a30aa;background:#0c0906b8}
`;
  document.head.appendChild(st);
}

const realmLook = (id) => { try { const C = window.VH_CANON, r = C && C.realm(id); return r && r.id === id ? r.look : null; } catch (e) { return null; } };
const hex = (c, d) => { if (typeof c === "number") return c; try { return new THREE.Color(c || d || "#888888").getHex(); } catch (e) { return d || 0x888888; } };

// ======================================================================
// the presenter: follows whichever area is open and rebuilds when it changes
// ======================================================================
export function area(api, done) {
  styleOnce();
  const ctl = { ready: false, A: null, w: null, st: null, off: false };
  let watch = 0;
  function teardown() { if (ctl.st) { try { ctl.st.dispose(); } catch (e) {} } ctl.st = null; ctl.w = null; ctl.ready = false; }
  function open(A) {
    teardown(); ctl.A = A;
    let st;
    try { st = makeStage(A.sp && A.sp.th === "cave" ? "Into the dark…" : "Walking in…", { host: api.host(), cls: "v3-area", keys: ["w", "a", "s", "d", "e", "f", "q", "shift", "arrowup", "arrowdown", "arrowleft", "arrowright", "escape", "r", "control"] }); }
    catch (e) { api.fail(e); finish("fail"); return; }
    ctl.st = st; api.on(true);
    try { const i0 = api.info(A); loadArt(st, i0.cave ? "shadow" : i0.realm); } catch (e) {}
    whenChars(() => {
      if (ctl.off || ctl.st !== st || api.AR() !== A) return;
      try { ctl.w = buildArea(st, api, A); ctl.ready = true; }
      catch (e) { api.fail(e); finish("fail"); }
    }, ["nature", "village", "dungeon"]);
  }
  function finish(how) { if (ctl.off) return; ctl.off = true; clearInterval(watch); teardown(); api.on(false); done(how || "left"); }
  // follow the sim: a new AR object means a new place; no AR means we are back on the map
  watch = setInterval(() => { if (ctl.off) return; const A = api.AR(); if (!A) finish("left"); else if (A !== ctl.A) open(A); }, 60);
  ctl.stop = () => finish("left");
  ctl.me = () => ctl.w && ctl.w.me;
  ctl.near = () => ctl.w && ctl.w.near();
  ctl.goTo = (k) => ctl.w && ctl.w.goTo(k);
  ctl.state = () => ctl.w ? ctl.w.state() : {};
  ctl.face = () => ctl.w ? ctl.w.face() : null;
  ctl.aim = (range) => ctl.w ? ctl.w.aim(range) : null;
  open(api.AR());
  return ctl;
}

// ======================================================================
// one place
// ======================================================================
function buildArea(st, api, A) {
  const sp = A.sp, W = A.W, H = A.H, g = A.g, info = api.info(A);
  setBiome(info.cave ? "shadow" : info.realm);
  const cave = !!info.cave, over = !!sp.over;
  const townish = info.type === "town" && !cave, P = townish ? townTone(REALMS[info.realm] || REALMS.ember, info.realm) : (REALMS[info.realm] || REALMS.ember), kit = makeKit(st), { scene, camera, inp } = st, rand = rng((A.id || "a") + "|3d");
  const art = kit.art, white = kit.mat(0xffffff);
  const th = A.th || {};
  const cG0 = new THREE.Color(hex(th.g && th.g[0], 0x3f7a3a)), cG1 = new THREE.Color(hex(th.g && th.g[1], 0x468540)), cPath = new THREE.Color(hex(th.path, 0xb89a62)), cPlaza = new THREE.Color(hex(th.plaza, 0x9a9486));
  // the 2D palettes are bright for pixel art; pull them toward the Realm ground so the 3D light reads naturally
  const realmG = new THREE.Color(P.ground);
  [cG0, cG1].forEach((c) => c.lerp(realmG, cave ? 0.2 : 0.35).multiplyScalar(0.9));
  cPath.lerp(new THREE.Color(P.path), 0.3); cPlaza.lerp(new THREE.Color(P.path), 0.25);
  const cWater = new THREE.Color(over ? 0x5e5a6e : hex(th.water, 0x2d6aa8)), cTree = new THREE.Color(hex(th.tree, 0x1f4d2a)), cTree2 = new THREE.Color(hex(th.tree2, 0x2d6a38)), cRock = new THREE.Color(hex(th.rock, 0x7b7b80)), cRoof = new THREE.Color(hex(th.roof, P.roof)), cWall = new THREE.Color(hex(th.wall, P.wall));
  const at = (x, y) => (x < 0 || y < 0 || x >= W || y >= H) ? 2 : g[y][x];
  const isWater = (x, y) => at(x, y) === 3;

  // ---------- light, sky, fog ----------
  const centre = new THREE.Vector3(A.p.x * PX, 0, A.p.y * PX);
  let L;
  if (cave) {
    scene.background = new THREE.Color(0x07060a);
    scene.fog = new THREE.FogExp2(0x0a080e, 0.032);
    const hemi = new THREE.HemisphereLight(0x9a98c0, 0x3a3038, 1.05); scene.add(hemi);
    const sun = new THREE.DirectionalLight(0xa89ac8, 0.6); sun.position.set(centre.x + 10, 30, centre.z + 8); sun.target.position.copy(centre); scene.add(sun, sun.target);
    L = { hemi, sun };
  } else {
    scene.fog = new THREE.FogExp2(P.fog, over ? 0.02 : (townish ? 0.011 : 0.014) + info.voidNear * 0.006);
    L = lights(st, P, centre, 26, { dim: info.realm === "shadow" || info.realm === "spirit", cold: COLD[info.realm] });
    const sky = paintedSky(P.sky, mix(P.fog, 0xffffff, 0.12), L.sun.position.clone().sub(centre), L.sun.color, info.voidNear, VOIDC, CLOUD[info.realm]); scene.add(sky);
    L.sky = sky;
    // the Realm's painted horizon (its 2D poster art), faint and far, behind the hills
    L.band = horizonBand(info.realm, P.fog, (x) => st.track(x), { amt: over ? 0.5 : 0.4 }); scene.add(L.band);
  }
  st.setGrade(cave ? "cave" : info.realm, { town: townish });
  // time of day from the game clock: warm low sun at dawn and dusk, cold blue night, windows brighter after dark
  const tod = { sunI: L.sun.intensity, sunC: L.sun.color.clone(), hemiI: L.hemi.intensity, hemiC: L.hemi.color.clone(), top: L.sky && L.sky.material.uniforms.top.value.clone(), hor: L.sky && L.sky.material.uniforms.hor.value.clone(), night: 0 };
  const WARM = new THREE.Color(0xff9a52), NIGHT = new THREE.Color(0x52628e), NSKY = new THREE.Color(0x0b1022);
  function timeOfDay() {
    if (cave || !api.tod) return; const h = api.tod(); if (!(h >= 0)) return;
    const up = THREE.MathUtils.smoothstep(h, 4.5, 6.5) * (1 - THREE.MathUtils.smoothstep(h, 18.5, 20.5)), warm = Math.max(Math.exp(-Math.pow((h - 6.6) / 1.2, 2)), Math.exp(-Math.pow((h - 18.4) / 1.2, 2)));
    tod.night = 1 - up;
    L.sun.intensity = tod.sunI * (0.35 + 0.65 * up); L.sun.color.copy(tod.sunC).lerp(WARM, warm * 0.3).lerp(NIGHT, tod.night * 0.6);
    L.hemi.intensity = tod.hemiI * (0.72 + 0.28 * up); L.hemi.color.copy(tod.hemiC).lerp(NIGHT, tod.night * 0.45);
    if (L.sky) { const u = L.sky.material.uniforms; u.top.value.copy(tod.top).lerp(NSKY, tod.night * 0.7).lerp(WARM, warm * 0.08); u.hor.value.copy(tod.hor).lerp(WARM, warm * 0.12).lerp(NSKY, tod.night * 0.5); }
  }
  // High: the painted sky lights the people too (image-based light); rebuilt as the day moves on
  if (L.sky) { L.env = useSkyEnv(st, scene, L.sky); st.track(L.env); }
  timeOfDay();
  // the hero carries a lantern underground
  const lantern = cave ? new THREE.PointLight(0xffc080, 70, 26, 1.15) : null; if (lantern) scene.add(lantern);
  const lanternFill = cave ? new THREE.PointLight(0xffd8a8, 11, 12, 1) : null; if (lanternFill) scene.add(lanternFill); // a softer light just ahead and above, so the hero's face and the next few strides show

  // ---------- ground: one vertex per tile corner, coloured by tile ----------
  // On the big overland (a whole continent, ~1.9 km) the ground, water, trees and rocks are built in chunks around the hero
  // as you walk and dropped again far behind; every other area is built once, as before.
  const big = over && W * H > 250000;
  const GT = cave ? "dirt" : (GROUND_TEX[info.realm] === "plaster" ? "plaster" : "grass");
  const gMat = groundMat(art, GT, cave ? "stone" : over ? "dirt" : info.type && info.type !== "village" ? "cobble" : "dirt", !cave && info.realm !== "frost" && info.realm !== "light");
  function groundGeo(x0, y0, nx, ny) {
    const gg = new THREE.PlaneGeometry(nx * T, ny * T, nx, ny); gg.rotateX(-Math.PI / 2); gg.translate(x0 * T + nx * T / 2, 0, y0 * T + ny * T / 2);
    const pos = gg.attributes.position, uv = gg.attributes.uv, n = pos.count, col = new Float32Array(n * 3), bl = new Float32Array(n), c = new THREE.Color(), tmp = new THREE.Color();
    for (let i = 0; i < n; i++) {
      const ix = x0 + i % (nx + 1), j = y0 + Math.floor(i / (nx + 1)); let r = 0, gr = 0, b = 0, k = 0, blend = 0, wet = 0;
      for (let dy = -1; dy <= 0; dy++) for (let dx = -1; dx <= 0; dx++) {
        const tx = ix + dx, ty = j + dy; if (tx < 0 || ty < 0 || tx >= W || ty >= H) continue;
        const t = g[ty][tx], v = vnoise(tx * 0.7, ty * 0.7);
        if (t === 1) { tmp.copy(cPath); blend += 1; } else if (t === 9) { tmp.copy(cPlaza); blend += 1; } else if (t === 3) { tmp.copy(cWater).multiplyScalar(0.35); wet++; }
        else if (t === 2 && cave) tmp.copy(cTree2).multiplyScalar(0.8); else if (t === 2 || t === 10) tmp.copy(cG0).lerp(cTree, 0.35 + v * 0.15); else if (t === 11) tmp.copy(cG0).lerp(cRock, 0.45 + v * 0.2); else tmp.copy(v > 0.5 ? cG1 : cG0);
        if (over && sp.reg && api.regTint) { const rt = api.regTint(sp.reg[ty * W + tx]); if (rt !== null && rt !== undefined) tmp.lerp(c.set(rt), 0.22); }
        r += tmp.r; gr += tmp.g; b += tmp.b; k++;
      }
      k = k || 1; const nz = 0.86 + vnoise(ix * 0.31, j * 0.31) * 0.28;
      col[i * 3] = r / k * nz; col[i * 3 + 1] = gr / k * nz; col[i * 3 + 2] = b / k * nz; bl[i] = Math.min(0.9, blend / k * 1.1);
      if (wet === k && k > 0) pos.setY(i, -0.35);
      uv.setXY(i, pos.getX(i) / 3.5, pos.getZ(i) / 3.5);
    }
    gg.setAttribute("color", new THREE.BufferAttribute(col, 3)); gg.setAttribute("aBlend", new THREE.BufferAttribute(bl, 1)); gg.computeVertexNormals();
    return gg;
  }
  const ground = big ? null : new THREE.Mesh(st.track(groundGeo(0, 0, W, H)), gMat); if (ground) { ground.receiveShadow = true; scene.add(ground); }
  // the land beyond the edge: low hills, so the horizon is never empty
  if (!cave && !big) {
    const S2 = Math.max(W, H) * T + 220, sg = new THREE.PlaneGeometry(S2, S2, 70, 70); sg.rotateX(-Math.PI / 2); sg.translate(W * T / 2, -0.06, H * T / 2);
    const pos = sg.attributes.position, uv = sg.attributes.uv, col = [], c = new THREE.Color();
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), z = pos.getZ(i), ox = Math.max(-x, x - W * T, 0), oz = Math.max(-z, z - H * T, 0), o = Math.hypot(ox, oz);
      if (o > 2) pos.setY(i, (vnoise(x * 0.025, z * 0.025) * 0.8 + 0.2) * Math.min(18, o * 0.22) - 0.06);
      c.copy(cG0).lerp(cTree, 0.25).multiplyScalar(0.8 + vnoise(x * 0.05, z * 0.05) * 0.3); col.push(c.r, c.g, c.b); uv.setXY(i, x / 6, z / 6);
    }
    sg.setAttribute("color", new THREE.Float32BufferAttribute(col, 3)); sg.setAttribute("aBlend", new THREE.BufferAttribute(new Float32Array(pos.count), 1)); sg.computeVertexNormals();
    const skirt = new THREE.Mesh(sg, gMat); skirt.receiveShadow = true; scene.add(skirt); st.track(sg);
    // a far ring of forest on the hills
    const B0 = new Batch(kit);
    for (let i = 0; i < 90; i++) { const a = rand() * Math.PI * 2, R = Math.max(W, H) * T * 0.5 + 14 + rand() * 50, x = W * T / 2 + Math.cos(a) * R, z = H * T / 2 + Math.sin(a) * R; if (x > -2 && x < W * T + 2 && z > -2 && z < H * T + 2) continue; const o = Math.hypot(Math.max(-x, x - W * T, 0), Math.max(-z, z - H * T, 0)); tree(B0, white, x, (vnoise(x * 0.025, z * 0.025) * 0.8 + 0.2) * Math.min(18, o * 0.22) - 0.2, z, 4 + rand() * 5, cTree.getHex(), rand); }
    B0.build(scene);
  }

  // ---------- water ----------
  const wm = st.track(new THREE.MeshStandardMaterial({ color: cWater.clone().multiplyScalar(cave ? 0.6 : 0.85), roughness: 0.12, metalness: 0.35, transparent: true, opacity: 0.86, emissive: cWater, emissiveIntensity: cave ? 0.15 : 0.05 }));
  function waterMesh(xa, ya, xb, yb) {
    const v = []; for (let y = ya; y < yb; y++) for (let x = xa; x < xb; x++) if (g[y][x] === 3) { const x0 = x * T, z0 = y * T, x1 = x0 + T, z1 = z0 + T; v.push(x0, 0, z0, x0, 0, z1, x1, 0, z0, x1, 0, z0, x0, 0, z1, x1, 0, z1); }
    if (!v.length) return null;
    const wg = new THREE.BufferGeometry(); wg.setAttribute("position", new THREE.Float32BufferAttribute(v, 3)); wg.computeVertexNormals();
    const water = new THREE.Mesh(wg, wm); water.position.y = -0.12; water.receiveShadow = true; return water;
  }
  if (!big) { const w0 = waterMesh(0, 0, W, H); if (w0) { st.track(w0.geometry); scene.add(w0); } }
  st.onFrame = (t) => { wm.emissiveIntensity = (cave ? 0.15 : 0.05) + 0.03 * Math.sin(t * 1.3); };

  // ---------- chunks: trees, rocks, cave walls, flowers (culled by distance) ----------
  const chunks = [], solidH = new Float32Array(W * H); // tile heights for the camera
  const nCX = Math.ceil(W / CH), nCZ = Math.ceil(H / CH), small = W * H <= 48 * 48;
  const mStone = art.mat("stone"), mPlank = art.mat("planks", { roughness: 0.85 }), mBeam = art.mat("beam", { roughness: 0.85 });
  const mm = kit.mm; // model materials on Medium and High (null on Low or if the packs did not load)
  const kitS = Object.assign({}, kit, { mm: null }); // the same kit, drawing the simple shapes (far chunks)
  if (big) for (let y = 0; y < H; y++) { const row = g[y]; for (let x = 0; x < W; x++) if (row[x] === 2) solidH[y * W + x] = 7; }
  function buildChunk(cx, cz, rand) {
    // with models, each chunk also gets a cheap twin (the old cone trees and plain rocks), shown when the chunk is far away
    const grp = new THREE.Group(), B = new Batch(kit), M = new Merge(), Bs = mm ? new Batch(kitS) : null; let any = big;
    for (let y = cz * CH; y < Math.min(H, (cz + 1) * CH); y++) for (let x = cx * CH; x < Math.min(W, (cx + 1) * CH); x++) {
      const t = g[y][x], wx = (x + 0.5) * T, wz = (y + 0.5) * T, r1 = rand(), r2 = rand();
      if (t === 2) {
        any = true;
        if (cave && mm) {
          // rock walls (Medium/High): heaped boulders, not blocks; edge tiles get a big face, deep rock a lower filler
          const edge = at(x - 1, y) !== 2 || at(x + 1, y) !== 2 || at(x, y - 1) !== 2 || at(x, y + 1) !== 2, h = edge ? 2.2 + r1 * 1.0 : 1.5 + r1 * 0.6; solidH[y * W + x] = h;
          const rk = ["rock1", "rock2", "rockmoss"], tint = shade(cRock.getHex(), 0.8 + r2 * 0.35);
          modelProp(B, rk[Math.floor(r1 * 3)], mm.solid, wx + (r2 - 0.5) * 0.5, -0.3, wz + (r1 - 0.5) * 0.5, (edge ? 1.75 : 1.45) + r2 * 0.55, r1 * 6.28, tint);
          if (Bs) Bs.add("rock", white, wx, h * 0.45, wz, T * 1.3, h, T * 1.3, r2 * 6, shade(cRock.getHex(), 0.6));
          if (edge) { modelProp(B, rk[Math.floor(r2 * 3)], mm.solid, wx + (r1 - 0.5) * 0.6, h * 0.35, wz + (r2 - 0.5) * 0.6, 1.1 + r1 * 0.5, r2 * 6.28, shade(cRock.getHex(), 0.65 + r1 * 0.3));
            // a crystal seam or a stalagmite at the foot of some walls, in the Realm's light
            const k = rand(); if (k < 0.12) { for (let c = 0; c < 3; c++) { const cr = new THREE.Mesh(kit.g.cone, kit.glow(info.realm === "frost" ? 0x9ad8ff : info.realm === "ember" ? 0xff7a3a : info.realm === "shadow" ? 0xb69cff : 0x8ae0d0)); cr.scale.set(0.22, 0.9 + rand() * 0.7, 0.22); cr.position.set(wx + (rand() - 0.5) * 1.1, 0.4, wz + (rand() - 0.5) * 1.1); cr.rotation.set((rand() - 0.5) * 0.6, 0, (rand() - 0.5) * 0.6); grp.add(cr); } }
            else if (k < 0.3) B.add("cone", white, wx + (r2 - 0.5) * T, 0.6, wz + (r1 - 0.5) * T, 0.45, 1.2 + r1, 0.45, 0, shade(cRock.getHex(), 0.7)); }
          else M.box(mStone, wx, h / 2 - 0.2, wz, T * 0.9, h, T * 0.9, r2 * 0.6, shade(cTree2.getHex(), 0.45 + r1 * 0.2));
        } else if (cave) {
          const h = 1.7 + r1 * 1.1; solidH[y * W + x] = h;
          M.box(mStone, wx, h / 2, wz, T * 1.04, h, T * 1.04, r2 * 0.3, shade(cTree2.getHex(), 0.55 + r1 * 0.3));
          if (r2 < 0.35) B.add("rock", white, wx + (r1 - 0.5) * 0.6, h, wz, 0.9, 0.7, 0.9, r2 * 6, shade(cRock.getHex(), 0.6));
        } else {
          solidH[y * W + x] = 7; // the camera won't sit inside a tree
          const h = 3.6 + r1 * 3.4;
          const tx = wx + (r2 - 0.5) * T * 0.4, tz = wz + (r1 - 0.5) * T * 0.4, tcol = (r2 < 0.5 ? cTree : cTree2).getHex();
          tree(B, white, tx, 0, tz, h, tcol, rand);
          if (Bs) tree(Bs, white, tx, 0, tz, h, tcol, rand);
        }
        // forest edge (Medium/High): undergrowth where the trees meet open ground, so woods have a skirt, not a wall
        if (mm && !cave && r1 < 0.4 && (at(x - 1, y) !== 2 || at(x + 1, y) !== 2 || at(x, y - 1) !== 2 || at(x, y + 1) !== 2)) {
          const bo = biomeOf(), k = rand(), ex = wx + (rand() - 0.5) * T, ez = wz + (rand() - 0.5) * T;
          if (k < 0.5) modelProp(B, pickW(bo.bush, null, rand()), mm.sway, ex, 0, ez, 0.9 + rand() * 0.7, rand() * 6, shade(bo.tint, 0.85 + rand() * 0.25));
          else if (k < 0.75 && info.realm !== "frost") modelProp(B, "fern", mm.sway, ex, 0, ez, 0.5 + rand() * 0.4, rand() * 6, shade(bo.tint, 0.8 + rand() * 0.3));
          else if (k < 0.87) modelProp(B, rand() < 0.5 ? "stump" : "log", mm.solid, ex, 0, ez, 0.9 + rand() * 0.5, rand() * 6, 0xffffff);
          else modelProp(B, pickW(bo.rock, null, rand()), mm.solid, ex, 0, ez, 0.6 + rand() * 0.5, rand() * 6, shade(cRock.getHex(), 1.6));
        }
      } else if (t === 7) {
        any = true; const s = 0.7 + r1 * 0.6;
        if (Bs) Bs.add("rock", white, wx, s * 0.3, wz, s * 1.2, s * 0.9, s * 1.1, r2 * 6, shade(cRock.getHex(), 0.75 + r2 * 0.3));
        if (mm) { const bo = biomeOf(); modelProp(B, pickW(bo.rock, null, r2), mm.solid, wx, -0.05, wz, s * 1.25, r2 * 6, shade(cRock.getHex(), 1.5 + r2 * 0.4)); if (r1 < 0.4) modelProp(B, "grass", mm.sway, wx + 0.5, 0, wz + 0.4, 0.45, r1 * 6, shade(bo.tint, 0.9)); }
        else B.add("rock", white, wx, s * 0.3, wz, s * 1.2, s * 0.9, s * 1.1, r2 * 6, shade(cRock.getHex(), 0.75 + r2 * 0.3));
      }
      // open-world forest floor: ferns, bushes and fallen wood you walk through; rocky highland: stones and tufts
      else if (t === 10) {
        if (r1 < 0.16 && st.gfx !== "low") { any = true; const ex = wx + (r2 - 0.5) * T, ez = wz + (rand() - 0.5) * T;
          if (mm) { const bo = biomeOf(), k = rand(); if (k < 0.5) modelProp(B, pickW(bo.bush, null, rand()), mm.sway, ex, 0, ez, 0.7 + rand() * 0.6, rand() * 6, shade(bo.tint, 0.8 + rand() * 0.25)); else if (k < 0.85 && info.realm !== "frost") modelProp(B, "fern", mm.sway, ex, 0, ez, 0.5 + rand() * 0.4, rand() * 6, shade(bo.tint, 0.8 + rand() * 0.3)); else modelProp(B, "grass", mm.sway, ex, 0, ez, 0.4 + rand() * 0.3, rand() * 6, shade(bo.tint, 0.9)); }
          else B.add("cone", white, ex, 0.3, ez, 0.5, 0.6, 0.5, 0, shade(cTree2.getHex(), 0.9)); }
      }
      else if (t === 11) {
        if (r1 < 0.12) { any = true; const s2 = 0.3 + r2 * 0.4, ex = wx + (r2 - 0.5) * T, ez = wz + (rand() - 0.5) * T;
          if (mm) { const bo = biomeOf(); if (r2 < 0.6) modelProp(B, pickW(bo.rock, null, r2), mm.solid, ex, -0.05, ez, s2, r2 * 6, shade(cRock.getHex(), 1.5 + r2 * 0.4)); else modelProp(B, "grass", mm.sway, ex, 0, ez, 0.35, r2 * 6, shade(biomeOf().tint, 0.85)); }
          else B.add("rock", white, ex, s2 * 0.2, ez, s2, s2 * 0.6, s2, r2 * 6, shade(cRock.getHex(), 0.8)); }
      }
      else if (t === 8 && st.gfx !== "low") {
        any = true;
        if (mm) { for (let k = 0; k < 2; k++) modelProp(B, rand() < 0.65 ? "flowers" : "grass", mm.sway, wx + (rand() - 0.5) * T * 0.8, 0, wz + (rand() - 0.5) * T * 0.8, 0.32 + rand() * 0.2, rand() * 6, [0xffe070, 0xffffff, 0xff8080, 0xc8a0ff, 0x9ad8ff][Math.floor(rand() * 5)]); }
        else for (let k = 0; k < 3; k++) B.add("cone", white, wx + (rand() - 0.5) * T * 0.8, 0.12, wz + (rand() - 0.5) * T * 0.8, 0.12, 0.24, 0.12, 0, [0xd8b040, 0xe8e0d0, 0xb04040, 0x9a70d0][Math.floor(rand() * 4)]);
      }
      // cave floor (Medium/High): loose stones, bones of old fires, the odd pale mushroom
      else if (mm && cave && t === 0 && r1 < 0.09) { any = true; if (r2 < 0.75) modelProp(B, ["rock1", "rock2"][Math.floor(r2 * 2)], mm.solid, wx + (r2 - 0.5) * T, -0.05, wz + (r1 * 10 - 0.45) * T, 0.25 + r2 * 0.35, r2 * 6, shade(cRock.getHex(), 0.9)); else { for (let m = 0; m < 3; m++) B.add("cone", white, wx + (rand() - 0.5) * 0.8, 0.12, wz + (rand() - 0.5) * 0.8, 0.14, 0.24, 0.14, 0, 0xd8d0b8); } }
      // open ground (Medium/High): the odd grass clump or wild flowers, never on paths, plazas or water
      else if (mm && !cave && t === 0 && r1 < 0.05) { any = true; const bo = biomeOf(); modelProp(B, r2 < 0.6 ? "grass" : "flowers", mm.sway, wx + (r2 - 0.5) * T, 0, wz + (r1 * 10 - 0.25) * T, 0.3 + r2 * 0.25, r2 * 6, r2 < 0.6 ? shade(bo.tint, 0.85) : [0xffe070, 0xffffff, 0xc8a0ff][Math.floor(r2 * 3)]); }
    }
    if (!any) return null;
    let near = null, far = null;
    if (Bs) { near = new THREE.Group(); far = new THREE.Group(); B.build(near); Bs.build(far); far.visible = false; grp.add(near, far); } else B.build(grp);
    const own = [];
    if (big) {
      const x0 = cx * CH, y0 = cz * CH, nx = Math.min(CH, W - x0), ny = Math.min(CH, H - y0);
      const gm = new THREE.Mesh(groundGeo(x0, y0, nx, ny), gMat); gm.receiveShadow = true; grp.add(gm); own.push(gm.geometry);
      const wt = waterMesh(x0, y0, x0 + nx, y0 + ny); if (wt) { grp.add(wt); own.push(wt.geometry); }
      M.build(grp, (x) => { own.push(x); return x; });
    } else M.build(grp, (x) => st.track(x));
    scene.add(grp);
    return { grp, near, far, own, cx, cz, x: (cx + 0.5) * CH * T, z: (cz + 0.5) * CH * T };
  }
  function dropChunk(c) {
    scene.remove(c.grp); c.grp.traverse((o) => { if (o.isInstancedMesh) o.dispose(); }); c.own.forEach((x) => { try { x.dispose(); } catch (e) {} });
  }
  // big overland: chunks within R of the hero are built (a couple per frame), those well behind are dropped
  const live = new Map();
  function streamChunks(hx, hz, maxNew) {
    const ccx = Math.floor(hx / (CH * T)), ccz = Math.floor(hz / (CH * T)), R = 3, want = []; let made = 0;
    for (let dz = -R; dz <= R; dz++) for (let dx = -R; dx <= R; dx++) { const cx = ccx + dx, cz = ccz + dz; if (cx < 0 || cz < 0 || cx >= nCX || cz >= nCZ) continue; const d = Math.hypot(dx, dz); if (d <= R + 0.3) want.push([d, cx, cz]); }
    want.sort((a, b) => a[0] - b[0]);
    for (const w of want) { if (made >= maxNew) break; const k = w[1] + "," + w[2]; if (live.has(k)) continue; const c = buildChunk(w[1], w[2], rng((A.id || "a") + "|" + k)); if (c) { live.set(k, c); chunks.push(c); } made++; }
    for (const [k, c] of live) if (Math.hypot(c.cx - ccx, c.cz - ccz) > R + 2.2) { dropChunk(c); live.delete(k); const i = chunks.indexOf(c); if (i >= 0) chunks.splice(i, 1); }
  }
  if (big) streamChunks(A.p.x * PX, A.p.y * PX, 99);
  else for (let cz = 0; cz < nCZ; cz++) for (let cx = 0; cx < nCX; cx++) { const c = buildChunk(cx, cz, rand); if (c) chunks.push(c); }
  // a felled tree or a broken rock: rebuild just the chunk it stood in
  window.__vh3dTile = (tx, ty) => {
    if (!big || ctlGone()) return; solidH[ty * W + tx] = g[ty][tx] === 2 ? 7 : 0;
    const cx = Math.floor(tx / CH), cz = Math.floor(ty / CH), k = cx + "," + cz, c = live.get(k); if (!c) return;
    dropChunk(c); live.delete(k); const i = chunks.indexOf(c); if (i >= 0) chunks.splice(i, 1);
    const n = buildChunk(cx, cz, rng((A.id || "a") + "|" + k)); if (n) { live.set(k, n); chunks.push(n); }
  };
  let gone = false; const ctlGone = () => gone || api.AR() !== A;

  // ---------- buildings: the 2D town's houses, raised in the Realm's style ----------
  const MH = new Merge(), BH = new Batch(kit), VB = new Batch(kit);
  const useModels = !!(mm && pack("village") && !cave && P.roofType !== "dome" && P.roofType !== "spire");
  const WS = WALL_STYLE[info.realm] || "frame", isV = info.type === "village";
  const mWall = art.mat(WS === "frame" ? "plaster" : WS);
  const roofTex = cave ? "stone" : isV && (P.roofType === "gable" || P.roofType === "steep") && info.realm !== "frost" ? "thatch" : (ROOF_TEX[info.realm] || "slate");
  const mRoof = art.mat(roofTex, { roughness: roofTex === "slate" ? 0.7 : 0.95 });
  const beamC = info.realm === "ember" || info.realm === "metal" ? 0x2a2018 : 0x3e2c1e, winMat = kit.glow(0xffb45a), coldWin = kit.glow(0xc8dcff);
  const covered = new Uint8Array(W * H), doors = [], signs = [], torches = [];
  const houses = (sp.houses || []).filter((h) => h && h[2] > 0 && h[3] > 0);
  const kinds = info.kinds || [];
  houses.forEach((h, i) => {
    const [hx, hy, hw, hd] = h; for (let y = hy; y < hy + hd; y++) for (let x = hx; x < hx + hw; x++) if (x >= 0 && y >= 0 && x < W && y < H) covered[y * W + x] = 1;
    const x = (hx + hw / 2) * T, z = (hy + hd / 2) * T, w = hw * T - 0.1, d = hd * T - 0.1, ht = (2.8 + Math.min(2.4, hw * hd * 0.06)) * (P.tall || 1) * (P.squat || 1);
    const mh = useModels ? modelHouse(x, z, w, d, kinds[i], i) : 0;
    if (!mh) house(x, z, w, d, ht, kinds[i]);
    for (let y = hy; y < hy + hd; y++) for (let xx = hx; xx < hx + hw; xx++) if (xx >= 0 && y >= 0 && xx < W && y < H) solidH[y * W + xx] = (mh || ht) + 1.5;
    const kd = KIND[kinds[i]], dsid = (sp.hsid && sp.hsid[i]) || info.siteId;
    if (kd && dsid) {
      const dx = x, dz = (hy + hd) * T + 1.0;
      doors.push({ key: kd[0], label: kd[1], x: dx, z: dz, r: 2.2, sid: dsid });
      const sg = labelSprite(st, kd[1], "go in"); sg.scale.set(3.2, 0.8, 1); sg.position.set(dx, ht + 0.9, dz - 1.2); scene.add(sg); signs.push(sg);
      if (torches.length < 5) torches.push(torch(kit, scene, dx + 1.2, 2.1, (hy + hd) * T + 0.25, P.torch, torches.length < 3 && st.gfx !== "low"));
    }
  });
  // any other solid structure tiles (walls, ruins, pens) become stone blocks
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const t = g[y][x]; if ((t === 4 || t === 5 || t === 6) && !covered[y * W + x]) { const h = cave ? 3.2 : 2.4 + vnoise(x * 0.5, y * 0.5) * 0.8; solidH[y * W + x] = h; MH.box(mStone, (x + 0.5) * T, h / 2, (y + 0.5) * T, T, h, T, 0, shade(cWall.getHex(), 0.75 + vnoise(x, y) * 0.25)); }
  }
  // ---------- model buildings (Medium/High, Realms with pitched roofs or plain villages): Quaternius cottages, inn, smithy ----------
  // The model sits on the same footprint as the 2D house (colliders, doors and NPC spots are unchanged). It is scaled to the
  // footprint's depth, stretched a little at most, and any spare width becomes a fenced yard with barrels, crates and hay.
  // Roofs, plaster, stone and timber take the Realm's canon palette (models.js recolouring by material role).
  function modelHouse(x, z, w, d, kind, idx) {
    const pick = kind === "tavern" ? "inn" : kind === "smithy" ? "smithy" : kind === "barracks" || kind === "farm" ? "stable" : kind === "mill" || kind === "granary" ? "mill" : kind === "yard" ? "sawmill"
      : (info.realm === "stone" || info.realm === "shadow") && rand() < 0.45 ? "house3" : ["house1", "house2", "house1", "house3"][Math.floor(rand() * 4)];
    const VP = pack("village"); if (!VP || !VP.geo[pick]) return 0;
    const g = vGeo(pick); if (!g) return 0;
    const inf = VP.info[pick] || {}, mw = inf.w || 1, md = inf.d || 1, mhh = inf.h || 1;
    let s = Math.min(w / mw, d / md); const sx = s * Math.min(1.15, (w / mw) / s), sz = s * Math.min(1.08, (d / md) / s);
    const tint = shade(0xffffff, 0.92 + rand() * 0.16);
    VB.add(g, mm.solid, x, 0, z, sx, s, sz, 0, tint);
    // spare width: a fenced yard on each side, with a few props
    const spare = (w - mw * sx) / 2;
    if (spare > 0.9) for (const sd of [-1, 1]) {
      const yx = x + sd * (w / 2 - spare / 2), fz = z + d / 2 - 0.15, L = spare;
      const nF = Math.max(1, Math.round(L / 1.25)); for (let k = 0; k < nF; k++) modelProp(VB, "fence", mm.solid, yx - L / 2 + (k + 0.5) * L / nF, 0, fz, L / nF * 1.02, 0, 0xffffff);
      const nS = Math.max(1, Math.round(d * 0.7 / 1.25)); for (let k = 0; k < nS; k++) modelProp(VB, "fence", mm.solid, x + sd * (w / 2 - 0.12), 0, z + d / 2 - (k + 0.5) * d * 0.7 / nS, d * 0.7 / nS * 1.02, Math.PI / 2, 0xffffff);
      const r = rand(), px = yx, pz = z + d * 0.05;
      if (r < 0.3) { modelProp(VB, "barrel", mm.solid, px - 0.3, 0, pz, 0.62, rand() * 6); modelProp(VB, "barrel", mm.solid, px + 0.35, 0, pz + 0.3, 0.6, rand() * 6); modelProp(VB, "crate", mm.solid, px, 0, pz - 0.6, 0.62, rand()); }
      else if (r < 0.55) { modelProp(VB, "hay", mm.solid, px, 0, pz, 0.7, rand() * 6); modelProp(VB, "hay", mm.solid, px + 0.6, 0, pz - 0.5, 0.62, rand() * 6); }
      else if (r < 0.75 && spare > 1.5) modelProp(VB, "cart", mm.solid, px, 0, pz, 1.9, sd * Math.PI / 2 + (rand() - 0.5) * 0.4);
      else { modelProp(VB, "crate", mm.solid, px, 0, pz, 0.66, rand()); modelProp(VB, "crate", mm.solid, px + 0.2, 0.66, pz + 0.05, 0.6, rand()); modelProp(VB, "bags", mm.solid, px - 0.55, 0, pz + 0.4, 0.75, rand() * 6); }
    }
    return Math.max(2.6, mhh * s);
  }
  // the Realm-coloured copy of a village model, registered on the kit for instancing
  function vGeo(key) {
    const gk = "v:" + key; if (kit.g[gk]) return gk;
    const wallT = WS === "frame" || WS === "planks" ? mix(P.wall, 0xe6dcc8, 0.5).getHex() : P.wall;
    const geo = recoloured("village", key, { 1: mix(0x7a5636, beamC, 0.35).getHex(), 2: wallT, 3: shade(mix(P.roof, cRoof.getHex(), 0.3).getHex(), 1.05).getHex(), 4: shade(P.stone, 1.05).getHex(), 7: P.accent, 8: FIRE }, info.realm + (cave ? "c" : ""));
    if (!geo) return null; kit.g[gk] = geo; return gk;
  }
  function W2(x, z, lx, lz) { return [x + lx, z + lz]; }
  function windowAt(x, z, lx, lz, y, side, wm) {
    const r = side ? Math.PI / 2 : 0, off = (k) => side ? W2(x, z, lx + k, lz) : W2(x, z, lx, lz + k);
    let q = off(0.02); MH.box(mBeam, q[0], y, q[1], 0.74, 0.86, 0.08, r, beamC);
    q = off(0.05); BH.add("box", wm, q[0], y, q[1], 0.48, 0.58, 0.04, r, null, { noShadow: true });
    q = off(0.07); BH.box(q[0], y, q[1], 0.04, 0.58, 0.04, r, beamC); BH.box(q[0], y, q[1], 0.48, 0.04, 0.04, r, beamC);
    q = off(0.1); MH.box(mStone, q[0], y - 0.48, q[1], 0.86, 0.1, 0.2, r, shade(P.stone, 1.05));
  }
  function house(x, z, w, d, h, kind) {
    const wc = rand() < 0.5 ? P.wall : mix(P.wall, P.wall2, rand()).getHex();
    const wallC = cave ? shade(cWall.getHex(), 0.8) : shade(WS === "frame" ? mix(wc, 0xe6dcc8, 0.45).getHex() : wc, 0.9 + rand() * 0.2);
    MH.box(mStone, x, 0.22, z, w + 0.14, 0.44, d + 0.14, 0, shade(P.stone, 0.85 + rand() * 0.2));
    MH.box(mWall, x, h / 2 + 0.02, z, w, h, d, 0, wallC);
    if (WS === "frame" || WS === "planks") {
      for (const [i, j] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) MH.box(mBeam, x + i * w / 2, h / 2 + 0.1, z + j * d / 2, 0.24, h + 0.2, 0.24, 0, beamC);
      for (const j of [-1, 1]) for (const yy of [0.5, h - 0.1]) MH.box(mBeam, x, yy, z + j * (d / 2 + 0.03), w + 0.1, 0.18, 0.1, 0, beamC);
      for (const i of [-1, 1]) MH.box(mBeam, x + i * (w / 2 + 0.03), h - 0.1, z, 0.1, 0.18, d + 0.1, 0, beamC);
      if (WS === "frame") for (const i of [-1, 1]) MH.add("box", mBeam, x + i * (w / 2 - 0.55), h * 0.27 + 0.3, z + d / 2 + 0.04, 0.12, Math.min(2.2, h * 0.5), 0.08, 0, beamC, 0, { rz: i * 0.6 });
    } else {
      MH.box(mStone, x, h - 0.1, z, w + 0.24, 0.22, d + 0.24, 0, shade(P.trim, 0.9));
      for (const [i, j] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) MH.box(mStone, x + i * w / 2, h / 2, z + j * d / 2, 0.36, h, 0.36, 0, shade(P.stone, 1.08));
    }
    const rt = cave ? "flat" : P.roofType, rc = cave ? shade(cRoof.getHex(), 0.6) : shade(mix(P.roof, cRoof.getHex(), 0.3).getHex(), 0.85 + rand() * 0.3);
    if (rt === "flat") {
      MH.box(mStone, x, h + 0.15, z, w + 0.3, 0.3, d + 0.3, 0, rc);
      for (const i of [-1, 1]) for (const j of [-1, 1]) MH.box(mStone, x + i * w / 2, h + 0.55, z + j * d / 2, 0.5, 0.6, 0.5, 0, rc);
    } else if (rt === "dome") {
      MH.box(mStone, x, h + 0.12, z, w + 0.2, 0.24, d + 0.2, 0, P.wall2);
      const r = Math.min(w, d) * 0.85; BH.add("dome", kit.mat(0xffffff, { metalness: 0.5, roughness: 0.4, flatShading: false }), x, h + 0.2, z, r, r * 0.8, r, 0, rc);
    } else {
      // gable along x, eaves front and back; steeper in the storm and frost Realms
      const rh = rt === "steep" ? d * 0.8 : rt === "saw" ? d * 0.4 : rt === "spire" ? d * 0.55 : d * 0.5;
      MH.add("prism", mWall, x, h, z, d, rh, w, Math.PI / 2, wallC);
      const a = Math.atan2(rh, d / 2), run = d / 2 + 0.45, Ls = run / Math.cos(a), thk = 0.16;
      for (const sgn of [1, -1]) { const cz = sgn * run / 2, cy = h + rh - run / 2 * Math.tan(a) + thk / 2 / Math.cos(a); MH.add("box", mRoof, x, cy, z + cz, w + 0.7, thk, Ls, 0, rc, sgn * a, { slope: true }); }
      MH.box(mBeam, x, h + rh + 0.06, z, w + 0.75, 0.2, 0.24, 0, beamC);
      if (rt === "saw" || P.chimneys || rand() < 0.35 || kind === "smithy") MH.box(mStone, x + w * 0.3, h + rh * 0.65 + 0.5, z - d * 0.2, 0.6, rh * 0.7 + 1.4, 0.6, 0, shade(P.stone, 0.8));
      if (rt === "spire") { MH.add("cyl", mWall, x + w * 0.32, h + 1.4, z, 1.1, 2.8, 1.1, 0, P.wall); MH.add("cone", mRoof, x + w * 0.32, h + 4.2, z, 1.4, 2.8, 1.4, 0, rc); }
    }
    // door, step and windows on the street side (+z), one on each gable end
    MH.box(mBeam, x, 1.05, z + d / 2 + 0.04, 1.3, 2.1, 0.12, 0, beamC);
    MH.box(mPlank, x, 0.98, z + d / 2 + 0.08, 0.98, 1.86, 0.08, 0, shade(0x7a5434, 0.8 + rand() * 0.3));
    MH.box(mStone, x, 0.08, z + d / 2 + 0.4, 1.5, 0.16, 0.6, 0, shade(P.stone, 0.95));
    const wm = P.lanterns || info.realm === "shadow" || cave ? coldWin : winMat, nwin = Math.max(1, Math.floor(w / 2.4));
    for (let i = 0; i < nwin; i++) { const lx = (i - (nwin - 1) / 2) * 2.2; if (Math.abs(lx) < 1.1) continue; windowAt(x, z, lx, d / 2, Math.min(h * 0.5, 1.6), false, wm); if (h > 4.2 && rand() < 0.7) windowAt(x, z, lx, d / 2, h * 0.78, false, wm); }
    if (rand() < 0.6) windowAt(x, z, w / 2, 0, Math.min(h * 0.5, 1.6), true, wm);
    if (kind === "smithy") { const f = new THREE.Mesh(kit.g.box, kit.glow(0xff7a2a)); f.scale.set(0.8, 0.22, 0.6); f.position.set(x - w / 2 - 0.7, 0.85, z + d / 2 - 0.4); scene.add(f); MH.box(mStone, x - w / 2 - 0.7, 0.4, z + d / 2 - 0.4, 1.2, 0.8, 1.0, 0, P.stone); }
    if (kind === "tavern" || kind === "market") { const q = rand() < 0.5 ? -1 : 1; MH.add("cyl", mPlank, x + q * (w / 2 - 0.6), 0.45, z + d / 2 + 0.75, 0.7, 0.9, 0.7, 0, shade(0x8a6038, 0.9)); }
    if (rand() < 0.5) MH.box(mPlank, x - w / 2 + 0.6, 0.36, z + d / 2 + 0.7, 0.7, 0.7, 0.7, rand(), shade(0x9a7448, 0.85 + rand() * 0.25));
  }
  MH.build(scene, (x) => st.track(x)); BH.build(scene); VB.build(scene);

  // ---------- exits: lit posts and a sign where a road leaves; settlements, caves and the yard on the overland ----------
  const exits = [];
  (sp.exits || []).forEach((e) => {
    const x = (e.x + e.w / 2) * T, z = (e.y + e.h / 2) * T, nm = api.exitName(e);
    const o = { e, x, z, parts: [] };
    if (over && e.ovsite) siteMarker(o, api.siteLook(e.ovsite));
    else if (over && e.cave !== undefined) caveMouth(o);
    else if (over && e.qsite) questSite(o, e);
    else if (over && e.yard) { const s = labelSprite(st, "Builders' Yard", "raise a building"); s.scale.set(3, 0.75, 1); s.position.set(x, 3, z); scene.add(s); o.sign = s; signpost(x, z - 0.6); }
    else gatePosts(o, nm);
    exits.push(o);
  });

  // ---------- props (Medium/High): a well on the green, market stalls, a campfire, barrels and crates by doors, banners ----------
  // Only where they are clear of every NPC's spot, every door's enter point and every exit, so no one ends up inside a barrel.
  const fires = [];
  if (mm && pack("village") && !cave && !over) {
    const PB = new Batch(kit), RL = realmLook(info.realm), flagC = (RL && RL.cloth) || P.accent;
    const npcAt = A.npcs.map((n) => [n.px * PX, n.py * PX]), exAt = exits.map((o) => [o.x, o.z]);
    const free = (x, z, r) => {
      const tx = Math.floor(x / T), tz = Math.floor(z / T), t = at(tx, tz); if (t !== 0 && t !== 9 && t !== 1 && t !== 8) return false; if (covered[tz * W + tx]) return false;
      for (const q of npcAt) if (Math.hypot(q[0] - x, q[1] - z) < r + 0.9) return false;
      for (const q of doors) if (Math.hypot(q.x - x, q.z - z) < r + 1.6) return false;
      for (const q of exAt) if (Math.hypot(q[0] - x, q[1] - z) < r + 3) return false;
      for (const q of placed) if (Math.hypot(q[0] - x, q[1] - z) < r + q[2]) return false;
      return true;
    }, placed = [], put = (x, z, r) => { placed.push([x, z, r]); };
    // the well: the middle of the plaza (or of the settlement), on the first clear spot spiralling out
    if (sp.houses && sp.houses.length) {
      let px = 0, pz = 0, pn = 0; for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (g[y][x] === 9) { px += (x + 0.5) * T; pz += (y + 0.5) * T; pn++; }
      if (!pn) { px = W * T / 2; pz = H * T / 2; pn = 1; }
      px /= pn; pz /= pn;
      for (let k = 0; k < 40; k++) { const a = k * 2.4, r = k * 0.45, wx = px + Math.cos(a) * r, wz = pz + Math.sin(a) * r; if (free(wx, wz, 1.3)) { modelProp(PB, "well", mm.solid, wx, 0, wz, 1.9, rand() * 6); put(wx, wz, 1.3); break; } }
    }
    // by the doors: a barrel or crate stack beside some doors, and two stalls in front of the market
    doors.forEach((d0) => {
      for (const sd of [-1, 1]) {
        const bx = d0.x + sd * (1.6 + rand() * 0.5), bz = d0.z - 0.7;
        if (rand() < 0.55 && free(bx, bz, 0.5)) { const r = rand(); if (r < 0.5) { modelProp(PB, "barrel", mm.solid, bx, 0, bz, 0.6, rand() * 6); if (r < 0.25) modelProp(PB, "barrel", mm.solid, bx + sd * 0.55, 0, bz + 0.1, 0.58, rand() * 6); } else { modelProp(PB, "crate", mm.solid, bx, 0, bz, 0.62, rand()); if (r > 0.8) modelProp(PB, "crate", mm.solid, bx, 0.62, bz, 0.56, rand()); } put(bx, bz, 0.6); }
      }
      if (d0.key === "market") for (const sd of [-1, 1]) { const sx = d0.x + sd * 3.4, sz = d0.z + 1.6; if (free(sx, sz, 1.1)) { modelProp(PB, rand() < 0.5 ? "stall1" : "stall2", mm.solid, sx, 0, sz, 2.2, Math.PI + (rand() - 0.5) * 0.2, 0xffffff); put(sx, sz, 1.3); } }
    });
    // villages and camps: a campfire with benches; it flickers (light on High only, the rest is a cheap glow)
    if (isV || info.type === "camp" || !info.type) {
      for (let k = 0; k < 60; k++) {
        const fx = (2 + rand() * (W - 4)) * T, fz = (2 + rand() * (H - 4)) * T;
        if (!free(fx, fz, 2.2) || at(Math.floor(fx / T), Math.floor(fz / T)) === 1) continue;
        modelProp(PB, "bonfire", mm.solid, fx, 0, fz, 1.1, rand() * 6);
        modelProp(PB, "bench", mm.solid, fx, 0, fz - 1.5, 1.4, 0); modelProp(PB, "bench", mm.solid, fx + 1.4, 0, fz + 0.4, 1.4, Math.PI / 2 + 0.3);
        fires.push(torch(kit, scene, fx, 0.55, fz, 0xff9a40, st.gfx === "high"));
        put(fx, fz, 2.4); break;
      }
    }
    // banners in the Realm's colours on the posts where the roads leave
    const banG = recoloured("castle", "banner", { 7: flagC, 0: flagC, 4: 0x5a4632 }, "ban" + info.realm);
    if (banG) { kit.g["v:banner"] = banG; for (const o of exits) { if (!o.veil) continue; const horiz = o.e.w >= o.e.h, half = (horiz ? o.e.w : o.e.h) * T / 2 + 0.4; for (const sd of [-1, 1]) { const bx = horiz ? o.x + sd * half : o.x, bz = horiz ? o.z : o.z + sd * half; PB.add("v:banner", mm.sway, bx, 2.7, bz, 1.4, 1.4, 1.4, (horiz ? 0 : Math.PI / 2) + (sd < 0 ? Math.PI : 0), 0xffffff); } } }
    PB.build(scene);
  }
  // caves: torches set into the walls every few strides, so the dark has edges you can read (the nearest four throw real light)
  if (cave) {
    const cand = [];
    for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) if (at(x, y) === 0 && (at(x - 1, y) === 2 || at(x + 1, y) === 2 || at(x, y - 1) === 2 || at(x, y + 1) === 2)) cand.push([x, y, rand()]);
    cand.sort((p, q) => p[2] - q[2]);
    const picked = []; for (const c of cand) { if (picked.length >= 18) break; if (picked.every((p) => Math.hypot(p[0] - c[0], p[1] - c[1]) > 7)) picked.push(c); }
    picked.forEach((c, i) => fires.push(torch(kit, scene, (c[0] + 0.5) * T, 1.9, (c[1] + 0.5) * T, 0xffa452, i < 5 && st.gfx !== "low")));
    // dungeon dressing (Medium/High): skulls, pots, cobwebs in the corners, old coins, columns set into the walls, wall torches
    if (kit.mm && kit.g["m:skull"]) {
      const DB = new Batch(kit), wallDir = (x, y) => { for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (at(x + dx, y + dy) === 2) return [dx, dy]; return [0, 1]; };
      const isTorch = (c) => picked.some((p) => p[0] === c[0] && p[1] === c[1]);
      for (const c of cand) {
        const [dx, dy] = wallDir(c[0], c[1]), wx = (c[0] + 0.5 + dx * 0.3) * T, wz = (c[1] + 0.5 + dy * 0.3) * T, face = Math.atan2(-dx, -dy), r = rand();
        if (isTorch(c)) { modelProp(DB, "dtorch", kit.mm.solid, (c[0] + 0.5 + dx * 0.42) * T, 1.3, (c[1] + 0.5 + dy * 0.42) * T, 0.45, face); continue; }
        if (r < 0.05) modelProp(DB, "skull", kit.mm.solid, wx, 0, wz, 0.32, rand() * 6);
        else if (r < 0.09) modelProp(DB, rand() < 0.5 ? "vase" : "barrel2", kit.mm.solid, wx, 0, wz, 0.55 + rand() * 0.2, rand() * 6);
        else if (r < 0.13) modelProp(DB, rand() < 0.5 ? "cobweb" : "cobweb2", kit.mm.solid, (c[0] + 0.5 + dx * 0.45) * T, 1.0 + rand() * 0.8, (c[1] + 0.5 + dy * 0.45) * T, 1.0, face);
        else if (r < 0.145) modelProp(DB, "coins", kit.mm.solid, wx, 0, wz, 0.5, rand() * 6);
        else if (r < 0.16) modelProp(DB, "coinbag", kit.mm.solid, wx, 0, wz, 0.4, rand() * 6);
      }
      // columns stand in the wall line (half in the rock), so you never walk through one
      for (const c of cand) { if (rand() > 0.035 || isTorch(c)) continue; const [dx, dy] = wallDir(c[0], c[1]); modelProp(DB, rand() < 0.5 ? "column" : "column2", kit.mm.solid, (c[0] + 0.5 + dx * 0.55) * T, 0, (c[1] + 0.5 + dy * 0.55) * T, 0.9, Math.atan2(-dx, -dy), shade(cRock.getHex(), 1.3)); }
      DB.build(scene);
    }
  }
  function gatePosts(o, nm) {
    const { e, x, z } = o, horiz = e.w >= e.h, half = (horiz ? e.w : e.h) * T / 2 + 0.4;
    const M = new Merge();
    for (const s of [-1, 1]) { const px = horiz ? x + s * half : x, pz = horiz ? z : z + s * half; M.box(mBeam, px, 1.4, pz, 0.28, 2.8, 0.28, 0, beamC); }
    M.build(scene, (q) => st.track(q));
    const veil = new THREE.Mesh(st.track(new THREE.PlaneGeometry(horiz ? half * 2 : 0.1, 2.6)), new THREE.MeshBasicMaterial({ color: cave ? 0xffe8b0 : 0xfff0c0, transparent: true, opacity: 0.12, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending }));
    veil.position.set(x, 1.3, z); if (!horiz) { veil.geometry.dispose(); veil.geometry = st.track(new THREE.PlaneGeometry(half * 2, 2.6)); veil.rotation.y = Math.PI / 2; }
    scene.add(veil); o.veil = veil;
    const lp = pool(kit, scene, x, z, 0xffd890, 4, 0.35); o.pool = lp;
    const s = labelSprite(st, nm || "The way on", e.to === "world" ? "to the map" : "the road on"); s.scale.set(3.4, 0.85, 1); s.position.set(x, 3.3, z); scene.add(s); o.sign = s;
  }
  function siteMarker(o, look) {
    const { x, z } = o, M = new Merge(), col = hex(look && look.col, 0xc8873a);
    const n = look && look.type === "village" ? 3 : 5;
    for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2 + 0.4, r = 3.2, hx = x + Math.cos(a) * r, hz = z - 2.5 + Math.sin(a) * r * 0.6, hh = 2.2 + rand(); M.box(mWall, hx, hh / 2, hz, 2.2, hh, 2, a, shade(P.wall, 0.9)); M.add("prism", mRoof, hx, hh, hz, 2, 1.1, 2.6, a + Math.PI / 2, P.roof); }
    if (look && look.type !== "village") { M.add("cyl", mStone, x, 3.5, z - 3.5, 2, 7, 2, 0, P.stone); M.add("cone", mRoof, x, 8, z - 3.5, 2.6, 2, 2.6, 0, shade(col, 0.6)); }
    M.build(scene, (q) => st.track(q));
    const fl = new THREE.Mesh(kit.g.box, kit.mat(col, { side: THREE.DoubleSide })); fl.scale.set(1.2, 0.8, 0.04); fl.position.set(x + 0.7, 5.6, z - 1.2); scene.add(fl);
    const pole = new THREE.Mesh(kit.g.cyl, kit.mat(0x4a3420)); pole.scale.set(0.1, 6, 0.1); pole.position.set(x, 3, z - 1.2); scene.add(pole); o.flag = fl;
    const s = labelSprite(st, (look && look.name) || "A settlement", look && look.sub || "walk in"); s.position.set(x, 7.5, z); scene.add(s); o.sign = s;
    o.pool = pool(kit, scene, x, z, 0xffd890, 5, 0.4);
  }
  // a quest's place out in the country: a ring of old standing stones, a banner, a warm light, and its name
  function questSite(o, e) {
    const { x, z } = o, M = new Merge();
    for (let i = 0; i < 7; i++) { const a = i / 7 * Math.PI * 2, r = 3.4, h = 1.6 + rand() * 1.8; M.box(mStone, x + Math.cos(a) * r, h / 2, z - 1 + Math.sin(a) * r, 0.7, h, 0.5, a, shade(P.stone, 0.7 + rand() * 0.3)); }
    M.box(mStone, x, 0.15, z - 1, 2.4, 0.3, 2.4, 0.3, shade(P.stone, 0.6));
    M.build(scene, (q) => st.track(q));
    const pole = new THREE.Mesh(kit.g.cyl, kit.mat(0x4a3420)); pole.scale.set(0.1, 5, 0.1); pole.position.set(x + 1.6, 2.5, z - 2.4); scene.add(pole);
    const fl = new THREE.Mesh(kit.g.box, kit.mat(0xe0b050, { side: THREE.DoubleSide })); fl.scale.set(1.1, 0.7, 0.04); fl.position.set(x + 2.2, 4.5, z - 2.4); scene.add(fl); o.flag = fl;
    const s = labelSprite(st, e.qname || "A quest", "your quest · go in"); s.position.set(x, 6, z); scene.add(s); o.sign = s;
    o.pool = pool(kit, scene, x, z, 0xffd070, 6, 0.5);
  }
  function caveMouth(o) {
    const { x, z } = o, M = new Merge();
    M.add("cone", mStone, x - 1.6, 1.3, z - 0.6, 2.2, 2.6, 1.8, 0.3, shade(P.stone, 0.6)); M.add("cone", mStone, x + 1.6, 1.3, z - 0.6, 2.2, 2.6, 1.8, 1.2, shade(P.stone, 0.6)); M.box(mStone, x, 2.5, z - 0.8, 3.6, 1.0, 1.6, 0.05, shade(P.stone, 0.55));
    M.build(scene, (q) => st.track(q));
    const dark = new THREE.Mesh(kit.g.box, kit.mat(0x050408)); dark.scale.set(2, 2.2, 0.2); dark.position.set(x, 1.1, z - 0.9); scene.add(dark);
    const s = labelSprite(st, "A cave", "go down"); s.scale.set(3, 0.75, 1); s.position.set(x, 4.2, z); scene.add(s); o.sign = s;
    o.pool = pool(kit, scene, x, z + 0.5, 0xb8a8ff, 3.5, 0.35);
  }

  // ---------- road signs (big overland): a post where each road leaves a settlement, naming the place at the other end ----------
  const roadSigns = [];
  if (over && sp.signs && sp.signs.length) {
    const MS = new Merge();
    for (const z of sp.signs) {
      const x = (z.x + 0.5) * T, zz = (z.y + 0.5) * T;
      MS.box(mBeam, x, 1.1, zz, 0.16, 2.2, 0.16, 0, beamC);
      // the arm points down the road it names
      const ax = Math.sin(z.ang), az = Math.cos(z.ang);
      MS.add("box", mPlank, x + ax * 0.55, 1.85, zz + az * 0.55, 1.2, 0.32, 0.06, z.ang + Math.PI / 2, 0xa8865a);
      MS.add("box", mPlank, x + ax * 1.2, 1.85, zz + az * 1.2, 0.3, 0.22, 0.06, z.ang + Math.PI / 2 + 0.785, 0xa8865a);
      roadSigns.push({ z, x, zz, lab: null });
    }
    MS.build(scene, (q) => st.track(q));
  }
  function syncSigns(hx, hz) {
    for (const r of roadSigns) {
      const d = Math.hypot(r.x - hx, r.zz - hz);
      if (d < 26 && !r.lab) { r.lab = labelSprite(st, r.z.to + " →", r.z.dist + " · from " + r.z.from); r.lab.scale.set(3.6, 0.9, 1); r.lab.position.set(r.x, 3.0, r.zz); scene.add(r.lab); }
      else if (d > 34 && r.lab) { scene.remove(r.lab); try { r.lab.material.map.dispose(); r.lab.material.dispose(); } catch (e) {} r.lab = null; }
      if (r.lab) { r.lab.material.opacity = clamp(1.4 - d / 22, 0, 1); r.lab.visible = r.lab.material.opacity > 0.02; }
    }
  }
  // ---------- followed side quests: up to three gold markers on the road ----------
  const qBeams = [];
  for (let i = 0; i < 3; i++) {
    const m = new THREE.Mesh(st.track(new THREE.CylinderGeometry(0.35, 0.6, 26, 10, 1, true)), new THREE.MeshBasicMaterial({ color: 0xffc860, transparent: true, opacity: 0.12, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending }));
    m.position.y = 13; m.visible = false; scene.add(m); qBeams.push({ m, lab: null, txt: "" });
  }
  function syncQuestBeams(hx, hz) {
    const L = (over && api.targets) ? api.targets() : [];
    qBeams.forEach((b, i) => {
      const q = L[i]; if (!q) { b.m.visible = false; if (b.lab) b.lab.visible = false; return; }
      const x = q.x * PX, z = q.y * PX, d = Math.hypot(x - hx, z - hz);
      b.m.position.set(x, 13, z); b.m.visible = d > 6; b.m.material.opacity = 0.16 * clamp((d - 6) / 20, 0, 1);
      if (q.lab !== b.txt) { b.txt = q.lab; if (b.lab) scene.remove(b.lab); b.lab = labelSprite(st, q.lab, "followed quest"); scene.add(b.lab); }
      b.lab.position.set(x, 4.8, z); b.lab.visible = d > 4;
    });
  }
  // ---------- bandit camps and holds (big overland): smoke you can see from far off, then tents, a fire and a stockade ----------
  const camps3 = [];
  let smokeMat = null;
  if (big && sp.P && sp.P.camps) {
    smokeMat = new THREE.SpriteMaterial({ map: st.track(radialTex("rgba(96,90,84,0.9)", "rgba(80,76,72,0)")), transparent: true, depthWrite: false, fog: false, opacity: 0.6 });
    sp.P.camps.forEach((cm) => camps3.push({ cm, x: (cm.x + 0.5) * T, z: (cm.y + 0.5) * T, grp: null, smoke: null, lab: null, fl: null, ph: rand() * 10 }));
  }
  const tentCol = [0xb8a682, 0x8a6a4a, 0x9a8a6a, 0x7a5a40], stakeM = kit.mat(0x4a3420), dirtM = kit.mat(0x4a3a2c), redM = kit.mat(0x8a2a22, { side: THREE.DoubleSide });
  function campBuild(c) {
    const grp = new THREE.Group(), { x, z } = c, bigC = !!c.cm.big, rr = rng("camp" + c.cm.x + "," + c.cm.y);
    const MT = !!(kit.mm && kit.g["m:tent"]), MP = (k, px, pz, sc, ry) => { if (kit.mm && kit.g["m:" + k]) mesh(kit.g["m:" + k], kit.mm.solid, px, 0, pz, sc, sc, sc, ry || 0); };
    const mesh = (geo, mat, px, py, pz, sx, sy, sz, ry) => { const m = new THREE.Mesh(geo, mat); m.position.set(px, py, pz); m.scale.set(sx, sy, sz); m.rotation.y = ry || 0; m.castShadow = true; grp.add(m); return m; };
    // tents around the fire
    const nt = bigC ? 5 : 2 + Math.floor(rr() * 2);
    for (let i = 0; i < nt; i++) {
      const a = i / nt * Math.PI * 2 + rr() * 0.5, R = bigC ? 4.6 + rr() * 1.4 : 2.6 + rr() * 0.6, tx = x + Math.cos(a) * R, tz = z + Math.sin(a) * R, s2 = bigC ? 1.25 : 1.0;
      if (MT) { const m = mesh(kit.g["m:tent"], kit.mm.solid, tx, 0, tz, 2.6 * s2, 2.6 * s2, 2.6 * s2, -a - Math.PI / 2); m.receiveShadow = true; }
      else { mesh(kit.g.cone, kit.mat(tentCol[Math.floor(rr() * tentCol.length)]), tx, 1.05 * s2, tz, 2.2 * s2, 2.1 * s2, 2.2 * s2, rr() * 6);
        mesh(kit.g.box, kit.mat(0x1a120c), tx + Math.cos(a) * -0.9 * s2, 0.45, tz + Math.sin(a) * -0.9 * s2, 0.5, 0.9, 0.08, -a + Math.PI / 2); }
    }
    // the fire: stones, logs, a flame, a warm ring of light on the ground
    for (let i = 0; i < 7; i++) { const a = i / 7 * Math.PI * 2; mesh(kit.g.box, kit.mat(0x6a6460), x + Math.cos(a) * 0.75, 0.12, z + Math.sin(a) * 0.75, 0.32, 0.24, 0.28, a); }
    mesh(kit.g.cyl, kit.mat(0x3a2414), x, 0.15, z, 0.12, 1.1, 0.12, 0).rotation.z = 1.4;
    if (kit.g.flame) { c.fl = new THREE.Mesh(kit.g.flame, kit.glow(0xff8a3a)); c.fl.position.set(x, 0.35, z); c.fl.scale.setScalar(3); grp.add(c.fl); }
    const glow = new THREE.Mesh(kit.g.pool || (kit.g.pool = new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2)), new THREE.MeshBasicMaterial({ map: kit.glowTex, color: 0xff9a40, transparent: true, opacity: 0.45, depthWrite: false, blending: THREE.AdditiveBlending }));
    glow.scale.setScalar(bigC ? 9 : 6); glow.position.set(x, 0.06, z); glow.renderOrder = 2; grp.add(glow); c.glow = glow;
    MP("campfire", x, z, 1.5, rr() * 6); MP("woodlog", x + 1.6, z + 0.9, 1.3, 0.4); MP("woodlog", x - 1.5, z + 1.1, 1.3, 2.6);
    if (bigC) { MP("beartrap", x + 6.4, z + 0.5, 0.8, rr() * 6); MP("beartrap", x - 6.2, z - 1.2, 0.8, rr() * 6); MP("chestgold", x + 1.8, z - 3.2, 1.0, rr() * 6); MP("coins", x + 2.6, z - 3.0, 0.7, 0); MP("wtorch", x + 7.6, z + 1.2, 0.5, 0); MP("wtorch", x - 7.6, z - 1.2, 0.5, 0); }
    // crates and sacks of what they've taken
    for (let i = 0; i < (bigC ? 6 : 2); i++) { const a = rr() * 6.28, R = 1.6 + rr() * (bigC ? 2.6 : 0.8); mesh(kit.g.box, kit.mat(rr() < 0.5 ? 0x7a5a34 : 0x8a7a5a), x + Math.cos(a) * R, 0.3, z + Math.sin(a) * R, 0.6, 0.6, 0.6, rr() * 6); }
    if (bigC) {
      // a stockade of sharpened stakes with two gaps, a lookout platform and the chief's red banner
      const R = 8.6, n = 44;
      for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2; if (Math.abs(Math.sin(a)) < 0.12) continue; const h = 2.2 + rr() * 0.8; mesh(kit.g.cone, stakeM, x + Math.cos(a) * R, h / 2, z + Math.sin(a) * R, 0.34, h, 0.34, 0); }
      const lx = x + 5.2, lz = z - 5.2;
      for (const [dx, dz] of [[-0.8, -0.8], [0.8, -0.8], [-0.8, 0.8], [0.8, 0.8]]) mesh(kit.g.cyl, stakeM, lx + dx, 2, lz + dz, 0.14, 4, 0.14, 0);
      mesh(kit.g.box, kit.mat(0x5a4028), lx, 4.05, lz, 2.0, 0.16, 2.0, 0);
      mesh(kit.g.cyl, stakeM, x - 1.6, 3.2, z - 1.6, 0.1, 6.4, 0.1, 0);
      c.flag = mesh(kit.g.box, redM, x - 1.0, 5.8, z - 1.6, 1.2, 0.8, 0.04, 0);
      mesh(kit.g.box, dirtM, x, 0.02, z, 13, 0.04, 13, 0.3).castShadow = false;
    }
    scene.add(grp); return grp;
  }
  function campDrop(c) { if (!c.grp) return; scene.remove(c.grp); try { c.glow.material.dispose(); } catch (e) {} c.grp = null; c.fl = null; c.flag = null; }
  function syncCamps(hx, hz) {
    for (const c of camps3) {
      const d = Math.hypot(c.x - hx, c.z - hz), live = !c.cm.done;
      // smoke over every live camp within a few hundred strides: the thing you walk toward
      if (live && d < 260 && !c.smoke) { c.smoke = []; for (let i = 0; i < 4; i++) { const s = new THREE.Sprite(smokeMat); s.scale.setScalar(4 + i * 3); s.position.set(c.x, 3 + i * 3.4, c.z); s.renderOrder = 3; scene.add(s); c.smoke.push(s); } }
      else if ((!live || d > 290) && c.smoke) { c.smoke.forEach((s) => scene.remove(s)); c.smoke = null; }
      if (d < 80 && !c.grp) c.grp = campBuild(c); else if (d > 100 && c.grp) campDrop(c);
      if (c.cm.big && d < 60 && !c.lab) { c.lab = labelSprite(st, c.cm.name, (c.cm.chief ? c.cm.chief + "'s hold" : "bandit hold") + " · Lv " + c.cm.lv); c.lab.scale.set(4.6, 1.15, 1); c.lab.position.set(c.x, 7.2, c.z); scene.add(c.lab); }
      else if (c.lab && (d > 70 || !live)) { scene.remove(c.lab); try { c.lab.material.map.dispose(); c.lab.material.dispose(); } catch (e) {} c.lab = null; }
      if (c.lab) { c.lab.material.opacity = clamp((60 - d) / 18, 0, 1) * clamp((d - 6) / 8, 0, 1); c.lab.visible = c.lab.material.opacity > 0.02; }
    }
  }
  function tickCamps(t) {
    for (const c of camps3) {
      if (c.smoke) c.smoke.forEach((s, i) => { s.position.x = c.x + Math.sin(t * 0.3 + c.ph + i) * (0.6 + i * 0.5); s.position.y = 3 + i * 3.4 + Math.sin(t * 0.5 + i) * 0.4; });
      if (c.fl) { const k = 0.85 + 0.15 * Math.sin(t * 11 + c.ph) * Math.sin(t * 7.3 + c.ph * 2); c.fl.scale.set(3, 3.4 * k, 3); c.glow.material.opacity = 0.38 + 0.1 * k; }
      if (c.flag) c.flag.rotation.y = Math.sin(t * 1.7 + c.ph) * 0.25;
    }
  }
  // ---------- wildlife (big overland, Medium/High): herds that graze, wander and bolt when you come close ----------
  const WILD = { ember: ["deer", "fox"], stone: ["stag", "wolf"], storm: ["deer", "cow"], light: ["deer", "cow"], frost: ["stag", "wolf", "fox"], spirit: ["deer", "stag"], shadow: ["wolf", "fox"], metal: ["wolf", "fox"] };
  const WH = { deer: 1.45, stag: 1.85, wolf: 0.95, fox: 0.55, cow: 1.5 }, WN = { deer: [3, 5], stag: [1, 3], wolf: [3, 4], fox: [1, 2], cow: [3, 6] }, WFLEE = { deer: 18, stag: 16, wolf: 12, fox: 14, cow: 7 };
  const WHP = { deer: 2, stag: 3, wolf: 3, fox: 1, cow: 4 }, WNAME = { deer: "deer", stag: "stag", wolf: "wolf", fox: "fox", cow: "wild cow" };
  const herds = [], wildP = {}; let wildOn = false, wildT = 0; window.__vhWild = herds;
  const wildNight = () => { let h = 12; try { h = api.tod(); } catch (e) {} return h >= 20 || h < 5; };
  if (big && kit.mm) { const ks = (WILD[info.realm] || ["deer", "cow"]).slice(); if (ks.indexOf("wolf") < 0) ks.push("wolf"); Promise.all(ks.map((k) => loadPack(k).then((p) => { if (p && p.gltf) wildP[k] = p; }, () => {}))).then(() => { wildOn = Object.keys(wildP).length > 0; }); }
  const wildMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.85, metalness: 0 }); st.track(wildMat); wildMat.userData.vhEnv = 1;
  const openTile = (x, z) => { const tx = Math.floor(x / T), ty = Math.floor(z / T); if (tx < 1 || ty < 1 || tx >= W - 1 || ty >= H - 1) return false; const q = g[ty][tx]; return q === 0 || q === 8 || q === 10 || q === 11; };
  function wildOne(k) {
    const P = wildP[k], o = skClone(P.gltf.scene); o.traverse((m) => { if (m.isMesh) { m.material = wildMat; m.castShadow = true; m.frustumCulled = false; } });
    o.updateMatrixWorld(true); const bb = new THREE.Box3().setFromObject(o), h = bb.max.y - bb.min.y, sc = h > 0.01 ? WH[k] * (0.9 + Math.random() * 0.2) / h : 1;
    const g2 = new THREE.Group(); o.scale.multiplyScalar(sc); o.position.y = -bb.min.y * sc; g2.add(o);
    const mixer = new THREE.AnimationMixer(o), acts = {}; P.gltf.animations.forEach((c) => { acts[c.name] = mixer.clipAction(c); });
    const a0 = acts.Eating || acts.Idle; if (a0) { a0.play(); a0.time = Math.random() * 3; }
    if (acts.Death) { acts.Death.setLoop(THREE.LoopOnce, 1); acts.Death.clampWhenFinished = true; }
    return { g: g2, mixer, acts, cur: acts.Eating ? "Eating" : "Idle", k, vx: 0, vz: 0, t: Math.random() * 6, flee: 0, hp: WHP[k] || 2, bite: 0.8 };
  }
  function wildPlay(a, want) { if (want === a.cur || !a.acts[want]) return; a.acts[want].reset().fadeIn(0.3).play(); if (a.acts[a.cur]) a.acts[a.cur].fadeOut(0.3); a.cur = want; }
  // hunting (13 Nov): your sword or your bow can bring an animal down; walk up and butcher it for meat and hides.
  // At night wolves hunt you back, and a wolf you've hurt comes for you any time of day.
  window.__vh3dHunt = (how, fx, fz) => {
    if (!wildOn || ctlGone()) return null; const hx = A.p.x * PX, hz = A.p.y * PX, L = Math.hypot(fx, fz) || 1; fx /= L; fz /= L;
    let best = null, bd = 1e9;
    for (const h of herds) for (const a of h.a) {
      if (a.dead) continue; const p = a.g.position, dx = p.x - hx, dz = p.z - hz, d = Math.hypot(dx, dz), dot = (dx * fx + dz * fz) / (d || 1);
      const ok = how === "shot" ? d < 38 && dot > 0.88 : d < 3 && (d < 1.4 || dot > 0.2); if (ok && d < bd) { bd = d; best = { a, h, d }; }
    }
    if (!best) return null; const a = best.a;
    if (how === "shot" && Math.random() > Math.max(0.3, 0.97 - best.d / 55 - (a.flee > 0 ? 0.15 : 0))) { a.flee = 5; return { miss: 1, k: a.k }; }
    a.hp -= how === "shot" ? 2 : 1; spark(a.g.position.x, 0.9, a.g.position.z, 0xd04a3a); try { api.sfx("hit"); } catch (e) {}
    if (a.k === "wolf") a.angry = 1;
    if (a.hp <= 0) {
      a.dead = 1; a.deadT = 0; wildPlay(a, "Death"); for (const o of best.h.a) if (o !== a && o.k !== "wolf") o.flee = 6;
      try { api.hunt({ ev: "kill", k: a.k, n: WNAME[a.k] }); } catch (e) {} return { kill: 1, k: a.k };
    }
    if (a.k !== "wolf") for (const o of best.h.a) if (o.k !== "wolf") o.flee = 6;
    return { hit: 1, k: a.k };
  };
  function wildCarcass(hx, hz) { let best = null, bd = 3.2; for (const h of herds) for (const a of h.a) { if (!a.dead || a.cut) continue; const d = Math.hypot(a.g.position.x - hx, a.g.position.z - hz); if (d < bd) { bd = d; best = a; } } return best; }
  function wildButcher(a) { if (!a || a.cut) return; a.cut = 1; a.deadT = 999; scene.remove(a.g); a.mixer.stopAllAction(); try { api.hunt({ ev: "butcher", k: a.k, n: WNAME[a.k] }); } catch (e) {} }
  function wildSpawn(hx, hz) {
    const ks = Object.keys(wildP); if (!ks.length) return;
    for (let tries = 0; tries < 12; tries++) {
      const ang = Math.random() * Math.PI * 2, d = 55 + Math.random() * 60, x = hx + Math.cos(ang) * d, z = hz + Math.sin(ang) * d;
      if (!openTile(x, z) || herds.some((h) => Math.hypot(h.x - x, h.z - z) < 40)) continue;
      const day = ks.filter((q) => q !== "wolf" || (WILD[info.realm] || []).indexOf("wolf") >= 0), night = wildNight() && wildP.wolf && Math.random() < 0.6;
      const k = night ? "wolf" : day.length ? day[Math.floor(Math.random() * day.length)] : ks[0], [n0, n1] = WN[k], n = n0 + Math.floor(Math.random() * (n1 - n0 + 1)), h = { k, x, z, a: [] };
      for (let i = 0; i < n; i++) { const an = wildOne(k), px = x + (Math.random() - 0.5) * 6, pz = z + (Math.random() - 0.5) * 6; an.g.position.set(openTile(px, pz) ? px : x, 0, openTile(px, pz) ? pz : z); an.g.rotation.y = Math.random() * 6.28; scene.add(an.g); h.a.push(an); }
      herds.push(h); return;
    }
  }
  function syncWild(dt, hx, hz, spawn) {
    if (spawn) {
      for (const h of herds) for (let j = h.a.length - 1; j >= 0; j--) { const a = h.a[j]; if (a.dead && (a.cut || a.deadT > 120)) { if (!a.cut) { scene.remove(a.g); a.mixer.stopAllAction(); } h.a.splice(j, 1); } }
      for (let i = herds.length - 1; i >= 0; i--) { const h = herds[i]; if (!h.a.length || Math.hypot(h.x - hx, h.z - hz) > 170) { h.a.forEach((a) => { scene.remove(a.g); a.mixer.stopAllAction(); }); herds.splice(i, 1); } }
      if (herds.length < 6) wildSpawn(hx, hz);
    }
    const night = wildNight(), busy = api.inDlg() || api.sheetOpen();
    for (const h of herds) {
      if (!h.a.length) continue; let cx = 0, cz = 0; for (const a of h.a) { cx += a.g.position.x; cz += a.g.position.z; } h.x = cx / h.a.length; h.z = cz / h.a.length;
      for (const a of h.a) {
        const p = a.g.position, dh = Math.hypot(p.x - hx, p.z - hz);
        if (a.dead) { a.deadT += dt; if (dh < 90 && a.deadT < 4) a.mixer.update(dt); continue; }
        const hunt = a.k === "wolf" && (night || a.angry) && dh < 45 && !busy;
        if (!hunt && dh < WFLEE[a.k]) a.flee = 4 + Math.random() * 2;
        let sp = 0;
        if (hunt) {
          a.flee = 0; const ux = (hx - p.x) / (dh || 1), uz = (hz - p.z) / (dh || 1); a.vx = ux; a.vz = uz;
          if (dh > 1.6) { sp = dh > 8 ? 8 : 4.5; wildPlay(a, "Gallop"); a.bite = Math.min(a.bite, 0.6); }
          else { wildPlay(a, "Attack"); a.bite -= dt; if (a.bite <= 0) { a.bite = 1.2 + Math.random() * 0.5; try { api.bite(1); } catch (e) {} } const want = Math.atan2(ux, uz); let dr = want - a.g.rotation.y; dr = Math.atan2(Math.sin(dr), Math.cos(dr)); a.g.rotation.y += dr * Math.min(1, dt * 8); }
          if (!a.howl && dh < 40) { a.howl = 1; try { api.hunt({ ev: "wolves", n: night }); } catch (e) {} }
        }
        else if (a.flee > 0) { a.flee -= dt; const ux = (p.x - hx) / (dh || 1), uz = (p.z - hz) / (dh || 1); a.vx = ux; a.vz = uz; sp = a.k === "cow" ? 2.6 : 8.5; wildPlay(a, sp > 3 ? "Gallop" : "Walk"); }
        else { a.t -= dt; if (a.t <= 0) { a.t = 3 + Math.random() * 6; if (Math.random() < 0.45) { const an = Math.random() * 6.28, back = Math.hypot(h.x - p.x, h.z - p.z) > 6; a.vx = back ? (h.x - p.x) : Math.cos(an); a.vz = back ? (h.z - p.z) : Math.sin(an); const L = Math.hypot(a.vx, a.vz) || 1; a.vx /= L; a.vz /= L; a.walk = 1; } else a.walk = 0; }
          if (a.walk) { sp = 1.1; wildPlay(a, "Walk"); } else if (a.cur === "Walk" || a.cur === "Gallop") wildPlay(a, a.acts.Eating && Math.random() < 0.6 ? "Eating" : "Idle"); }
        if (sp > 0) { const nx = p.x + a.vx * sp * dt, nz = p.z + a.vz * sp * dt; if (openTile(nx, nz)) { p.x = nx; p.z = nz; } else { const ox = a.vx; a.vx = -a.vz; a.vz = ox; a.t = 0; } const want = Math.atan2(a.vx, a.vz); let dr = want - a.g.rotation.y; dr = Math.atan2(Math.sin(dr), Math.cos(dr)); a.g.rotation.y += dr * Math.min(1, dt * 6); }
        if (dh < 90) a.mixer.update(dt * (a.cur === "Walk" ? 0.9 : 1));
      }
    }
  }
  // ---------- the Void and the Realm gates (big overland): seen from far off, so you can walk to them ----------
  const farMarks = [];
  if (big) {
    const domeG = st.track(new THREE.SphereGeometry(1, 28, 18)), beamG = st.track(new THREE.CylinderGeometry(0.6, 1.4, 60, 12, 1, true));
    for (const q of (sp.SP || [])) {
      if (!q.vh) continue; const x = (q.cx + 0.5) * T, z = (q.cy + 0.5) * T;
      const dm = new THREE.Mesh(domeG, new THREE.MeshBasicMaterial({ color: 0x5a2aa0, transparent: true, opacity: 0.2, depthWrite: false, side: THREE.DoubleSide, fog: false })); dm.scale.set(30, 18, 30); dm.position.set(x, 0, z); dm.renderOrder = 4; scene.add(dm);
      const pl = pool(kit, scene, x, z, 0x8a5ae0, 70, 0.45);
      const lb = labelSprite(st, q.s.name, "held by the Void"); lb.scale.set(6, 1.5, 1); lb.position.set(x, 20, z); scene.add(lb);
      farMarks.push({ m: dm, lb, pl, x, z, void: 1 });
    }
    for (const z0 of (sp.portals || [])) {
      const x = (z0.x + 0.5) * T, z = (z0.y + 0.5) * T, bm = new THREE.Mesh(beamG, new THREE.MeshBasicMaterial({ color: 0x7ae0ff, transparent: true, opacity: 0.14, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, fog: false }));
      bm.position.set(x, 30, z); scene.add(bm); farMarks.push({ m: bm, x, z, gate: 1 });
    }
  }
  function tickFar(t, hx, hz) { for (const f of farMarks) { const d = Math.hypot(f.x - hx, f.z - hz); if (f.void) { f.m.material.opacity = 0.16 + 0.05 * Math.sin(t * 0.8 + f.x); f.m.rotation.y = t * 0.05; f.lb.visible = d > 25; } else { f.m.visible = d > 12; f.m.material.opacity = 0.12 + 0.05 * Math.sin(t * 2); } } }
  // ---------- people: NPCs, chests, gates and cells ----------
  const markTex = [null, markerTex("!", "#ffd84a"), markerTex("?", "#9fd8ff")];
  function markerTex(ch, col) {
    const c = document.createElement("canvas"); c.width = c.height = 128; const x = c.getContext("2d");
    const gr = x.createRadialGradient(64, 64, 4, 64, 64, 62); gr.addColorStop(0, col + "aa"); gr.addColorStop(1, col + "00"); x.fillStyle = gr; x.fillRect(0, 0, 128, 128);
    x.font = "900 96px Georgia, serif"; x.textAlign = "center"; x.textBaseline = "middle"; x.lineWidth = 10; x.strokeStyle = "#1a1209"; x.strokeText(ch, 64, 70); x.fillStyle = col; x.fillText(ch, 64, 70);
    const t = st.track(new THREE.CanvasTexture(c)); t.colorSpace = THREE.SRGBColorSpace; return t;
  }
  // your own camp (survival): a tent, a fire and a warm ring of light
  function myCamp(x, z) {
    const grp = new THREE.Group(), add = (geo, mat, px, py, pz, sc, ry) => { const m = new THREE.Mesh(geo, mat); m.position.set(px, py, pz); m.scale.setScalar(sc); m.rotation.y = ry || 0; m.castShadow = true; grp.add(m); return m; };
    if (kit.mm && kit.g["m:tent"]) add(kit.g["m:tent"], kit.mm.solid, x - 1.6, 0, z - 1.2, 2.6, 0.6); else { const t = add(kit.g.cone, kit.mat(0xb8a682), x - 1.6, 1.05, z - 1.2, 1, 0); t.scale.set(2.2, 2.1, 2.2); }
    if (kit.mm && kit.g["m:campfire"]) add(kit.g["m:campfire"], kit.mm.solid, x, 0, z, 1.4, 0); if (kit.mm && kit.g["m:woodlog"]) add(kit.g["m:woodlog"], kit.mm.solid, x + 1.3, 0, z + 0.7, 1.2, 0.5);
    const f = new THREE.Mesh(kit.g.flame, kit.glow(0xff8a3a)); f.position.set(x, 0.35, z); f.scale.setScalar(3); grp.add(f);
    const gl = new THREE.Mesh(kit.g.pool || (kit.g.pool = new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2)), new THREE.MeshBasicMaterial({ map: kit.glowTex, color: 0xff9a40, transparent: true, opacity: 0.45, depthWrite: false, blending: THREE.AdditiveBlending }));
    gl.scale.setScalar(6); gl.position.set(x, 0.06, z); grp.add(gl); scene.add(grp);
    fires.push({ tick(t) { const k = 0.85 + 0.15 * Math.sin(t * 11 + x) * Math.sin(t * 7.3 + z); f.scale.set(3, 3.4 * k, 3); gl.material.opacity = 0.38 + 0.1 * k; } });
    return grp;
  }
  const npcs = [];
  window.__vh3dDropCamps = () => { for (let i = npcs.length - 1; i >= 0; i--) { const o = npcs[i]; if (!o.n.mycamp) continue; if (o.obj) scene.remove(o.obj); if (o.mark) scene.remove(o.mark); npcs.splice(i, 1); } };
  window.__vh3dAddNpc = (n) => { if (ctlGone()) return; const o = { n, x: n.px * PX, z: n.py * PX, obj: null, mark: null, mk: -1, label: null }; npcObj(o); npcs.push(o); };
  function npcObj(o) {
    const n = o.n, x = o.x, z = o.z;
    if (n.mycamp) o.obj = myCamp(x, z);
    else if (n.chest || /chest|stash/.test(String(n.id || ""))) o.obj = chest(x, z);
    else if (n.gate || n.portal) o.obj = portal(x, z);
    else if (n.cell) o.obj = cage(x, z);
    else if (n.id === "rvboard" && A._rv) o.obj = rvBoard3D(x, z);
    else if (n.draw) o.obj = signpost(x, z);
    else {
      // townsfolk wear their Realm's palette (premium/canon.js), blended with their own colours so each still reads apart
      const nm = n.name || "", female = FEMALE.test(nm), RL = realmLook(info.realm), cloth = RL ? mix(hex(n.col, 0x6a5a4a), (nm.length % 2 ? RL.cloth : RL.cloth2), 0.38).getHex() : hex(n.col, 0x6a5a4a), hair = hex(n.hair, 0x3a2a18);
      let ch;
      if (/kaelren/i.test(nm)) ch = kaelLook(false);
      else if (/elyndra/i.test(nm)) ch = { base: "woman", hood: 0xd8d8e0, cloth: 0xc8c8d0, cloth2: 0x8a90a8, legs: 0x4a4a58, skin: 0xe0c8b0, hair: 0xd8d0c0, lantern: 0xc8e0ff };
      else ch = { base: female ? "woman" : /smith|guard|captain|sergeant|warden|marshal|knight/i.test(nm) ? "soldier" : "man", cloth, cloth2: shade(cloth, 0.6).getHex(), hood: shade(cloth, 0.75).getHex(), legs: 0x3a2e24, hair, skin: [0xd8b090, 0xb88a68, 0x8a5a3a, 0xc89a78][Math.floor(rand() * 4)], metal: 0x8a8e94, weapon: /smith/i.test(nm) ? "axe" : null, scale: n.small ? 0.68 : 0.94 + rand() * 0.1 };
      const f = figure(kit, { ch, cloth: ch.cloth, cloth2: ch.cloth2, skin: ch.skin }); f.position.set(x, 0, z); f.rotation.y = Math.random() * 0.6 - 0.3; scene.add(f); o.obj = f; o.fig = f;
    }
  }
  A.npcs.forEach((n) => {
    const o = { n, x: n.px * PX, z: n.py * PX, obj: null, mark: null, mk: -1, label: null };
    if (!big || n.portal || Math.hypot(o.x - A.p.x * PX, o.z - A.p.y * PX) < 70) npcObj(o);
    npcs.push(o);
  });
  function lazyNpcs(hx, hz) {
    for (const o of npcs) {
      if (o.n.portal) continue; const d = Math.hypot(o.x - hx, o.z - hz);
      if (!o.obj && d < 70) npcObj(o);
      else if (o.obj && d > 95) { scene.remove(o.obj); o.obj = null; o.fig = null; if (o.mark) { scene.remove(o.mark); o.mark = null; o.mk = -1; } }
    }
  }
  // the names of towns and villages built into the open world, high over their squares
  const townNames = [];
  if (big && sp.tnames) for (const tn of sp.tnames) { const l = labelSprite(st, tn.name, tn.sub); l.scale.set(6, 1.5, 1); l.position.set((tn.x + 0.5) * T, 9, (tn.y + 0.5) * T); scene.add(l); townNames.push(l); }
  // ---------- Realm Vision (November event): poster boards, the stage, the band and the lights ----------
  function rvCanvasTex(w, h, draw) { const c = document.createElement("canvas"); c.width = w; c.height = h; draw(c.getContext("2d"), w, h); const t = st.track(new THREE.CanvasTexture(c)); t.colorSpace = THREE.SRGBColorSpace; return t; }
  function rvBoard3D(x, z) {
    const R = window.__rvInfo && window.__rvInfo(A._rv.own); const grp = new THREE.Group(); if (!R) return grp;
    const I = R.I, wood = kit.mat(0x4a3624), bg = new THREE.BoxGeometry(1, 1, 1); st.track(bg);
    [-0.78, 0.78].forEach((dx) => { const p = new THREE.Mesh(bg, wood); p.scale.set(0.14, 2.5, 0.14); p.position.set(dx, 1.25, 0); p.castShadow = true; grp.add(p); });
    const tex = rvCanvasTex(512, 320, (g, w, h) => {
      g.fillStyle = "#14101a"; g.fillRect(0, 0, w, h); g.strokeStyle = I.c1; g.lineWidth = 10; g.strokeRect(10, 10, w - 20, h - 20);
      g.textAlign = "center"; g.fillStyle = I.c2; g.font = "900 78px Georgia, serif"; g.fillText("REALM", w / 2, 108); g.fillText("VISION", w / 2, 188);
      g.fillStyle = I.c1; g.font = "700 30px Georgia, serif"; g.fillText("VOTE · MEET THE BAND · JOIN IN", w / 2, 240); g.font = "700 26px Georgia, serif"; g.fillStyle = "#f0e2b8"; g.fillText("NOVEMBER ONLY", w / 2, 284);
    });
    const pn = new THREE.Mesh(st.track(new THREE.PlaneGeometry(1.8, 1.125)), new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide })); pn.position.set(0, 2.15, 0.1); grp.add(pn);
    const back = new THREE.Mesh(bg, wood); back.scale.set(1.9, 1.2, 0.08); back.position.set(0, 2.15, 0.0); grp.add(back);
    const gl = new THREE.Sprite(new THREE.SpriteMaterial({ map: kit.glowTex, color: hex(I.c1), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.55 })); gl.scale.setScalar(3.2); gl.position.set(0, 2.15, 0.3); grp.add(gl);
    const sp0 = sp.spawn || [A.W / 2, A.H / 2]; grp.rotation.y = Math.atan2(sp0[0] * T + T / 2 - x, sp0[1] * T + T / 2 - z);
    grp.position.set(x, 0, z); scene.add(grp); return grp;
  }
  function rvStage3D() {
    const R = window.__rvInfo && window.__rvInfo(A._rv.own), s = A._rv.stage; if (!R || !s) return null;
    const I = R.I, songs = R.songs, x0 = s.x * PX, z0 = s.y * PX, w = s.w * PX, d = s.h * PX, cx = x0 + w / 2, grp = new THREE.Group(), bg = new THREE.BoxGeometry(1, 1, 1); st.track(bg);
    const c1 = hex(I.c1), c2 = hex(I.c2), dark = kit.mat(0x1a1620), metal = kit.mat(0x3a3440, { metalness: 0.5, roughness: 0.5 });
    function box(m, px, py, pz, sx, sy, sz, rot) { const b = new THREE.Mesh(bg, m); b.scale.set(sx, sy, sz); b.position.set(px, py, pz); if (rot) b.rotation.y = rot; b.castShadow = true; b.receiveShadow = true; grp.add(b); return b; }
    const glowM = (c, o) => new THREE.MeshBasicMaterial({ color: c, transparent: o < 1, opacity: o == null ? 1 : o });
    box(kit.mat(0x2b2430), cx, 0.28, z0 + d * 0.46, w, 0.56, d * 0.92);
    box(glowM(c1), cx, 0.58, z0 + d * 0.46 + d * 0.46, w, 0.05, 0.06);
    for (let i = 0; i < 9; i++) box(glowM(i % 2 ? c2 : c1), x0 + 0.25 + i * ((w - 0.5) / 8), 0.3, z0 + d * 0.92 + 0.02, 0.18, 0.1, 0.04);
    box(kit.mat(0x14101a), cx, 2.3, z0 + 0.12, w * 0.9, 2.0, 0.14);
    const tex = rvCanvasTex(768, 256, (g, ww, hh) => {
      g.fillStyle = I.bg; g.fillRect(0, 0, ww, hh); const gr = g.createLinearGradient(0, 0, ww, 0); gr.addColorStop(0, I.c1 + "55"); gr.addColorStop(0.5, I.c2 + "33"); gr.addColorStop(1, I.c1 + "55"); g.fillStyle = gr; g.fillRect(0, 0, ww, hh);
      g.strokeStyle = I.c1; g.lineWidth = 8; g.strokeRect(8, 8, ww - 16, hh - 16); g.textAlign = "center"; g.fillStyle = I.c2; g.font = "900 96px Georgia, serif"; g.fillText("REALM VISION", ww / 2, 120);
      g.fillStyle = I.c1; g.font = "700 38px Georgia, serif"; g.fillText(songs.map((q) => q[1]).join("  ·  ").toUpperCase(), ww / 2, 180); g.fillStyle = "#f0e2b8"; g.font = "700 28px Georgia, serif"; g.fillText("LIVE ALL NOVEMBER", ww / 2, 224);
    });
    const scr = new THREE.Mesh(st.track(new THREE.PlaneGeometry(w * 0.84, w * 0.84 / 3)), new THREE.MeshBasicMaterial({ map: tex })); scr.position.set(cx, 2.35, z0 + 0.2); grp.add(scr);
    [x0 - 0.05, x0 + w + 0.05].forEach((px) => box(metal, px, 1.8, z0 + d * 0.9, 0.16, 3.6, 0.16));
    box(metal, cx, 3.55, z0 + d * 0.9, w + 0.3, 0.16, 0.16); box(metal, cx, 3.55, z0 + 0.12, w + 0.3, 0.16, 0.16);
    const beams = [], lamps = [], nL = Math.max(3, Math.round(w / 1.8));
    for (let i = 0; i < nL; i++) {
      const lx = x0 + 0.5 + i * ((w - 1) / (nL - 1)), col = i % 2 ? c2 : c1, pv = new THREE.Group(); pv.position.set(lx, 3.45, z0 + d * 0.88);
      const can = new THREE.Mesh(bg, glowM(col)); can.scale.set(0.3, 0.22, 0.3); can.position.y = -0.05; pv.add(can);
      const cone = new THREE.Mesh(st.track(new THREE.ConeGeometry(0.9, 3.4, 14, 1, true).translate(0, -1.7, 0)), new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.1, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }));
      pv.add(cone); grp.add(pv); beams.push({ pv, cone, i }); lamps.push(can);
    }
    [x0 - 0.7, x0 + w + 0.7].forEach((px) => { box(dark, px, 0.8, z0 + d * 0.75, 0.7, 1.6, 0.6); box(glowM(c1), px, 1.3, z0 + d * 0.75 + 0.31, 0.5, 0.06, 0.02); box(metal, px, 0.45, z0 + d * 0.75 + 0.31, 0.38, 0.38, 0.02); });
    const mk = (cloth, hair, skin, base) => ({ ch: { base: base || "man", cloth, cloth2: cloth, hood: cloth, legs: 0x2a2228, hair, skin }, cloth });
    const look = [[c1, hex(I.hair), 0xd8b090, "woman"], [c2, 0x2a1a14, 0xc89a78, "man"], [c1, 0x8a5a30, 0xb88a68, "man"], [c2, 0x14121c, 0xe0c8b0, "woman"]];
    const spots = [[cx, z0 + d * 0.78], [x0 + w * 0.22, z0 + d * 0.6], [x0 + w * 0.78, z0 + d * 0.6], [cx, z0 + d * 0.3]], band = [];
    for (let i = 0; i < 4; i++) {
      const q = look[i], f = figure(kit, { ch: { base: q[3], cloth: q[0], cloth2: shade(q[0], 0.6).getHex(), hood: shade(q[0], 0.75).getHex(), legs: 0x2a2228, hair: q[1], skin: q[2] }, cloth: q[0], cloth2: q[0], skin: q[2] });
      f.position.set(spots[i][0], 0.56, spots[i][1]); f.rotation.y = 0; grp.add(f); band.push({ f, y: 0.56, i });
    }
    const dm = [[-0.7, 0], [0.7, 0], [0, -0.45]]; dm.forEach((q) => { const c = new THREE.Mesh(st.track(new THREE.CylinderGeometry(0.34, 0.34, 0.5, 14)), glowM(0x3a3040)); c.position.set(cx + q[0], 1.0, z0 + d * 0.42 + q[1] * 0.4); grp.add(c); const rim = new THREE.Mesh(st.track(new THREE.CylinderGeometry(0.36, 0.36, 0.05, 14)), glowM(c1)); rim.position.set(cx + q[0], 1.27, z0 + d * 0.42 + q[1] * 0.4); grp.add(rim); });
    box(kit.mat(0x6a4a28), x0 + w * 0.22 - 0.05, 1.0, z0 + d * 0.6 + 0.35, 0.9, 0.12, 0.2, 0.5);
    box(kit.mat(0x1c1822), x0 + w * 0.78, 0.95, z0 + d * 0.6 + 0.45, 1.3, 0.12, 0.5);
    [-1, 1].forEach((sd, k) => {
      const px = sd < 0 ? x0 - 1.3 : x0 + w + 1.3, pz = z0 + d * 0.95, pole = new THREE.Group(); box(kit.mat(0x4a3624), px, 1.8, pz, 0.12, 3.6, 0.12);
      const cl = new THREE.Mesh(st.track(new THREE.PlaneGeometry(0.9, 2.2)), new THREE.MeshBasicMaterial({ map: rvCanvasTex(128, 320, (g, ww, hh) => { g.fillStyle = I.c1; g.fillRect(0, 0, ww, hh); g.fillStyle = I.bg; g.fillRect(0, hh - 60, ww, 60); g.fillStyle = I.c2; g.font = "900 70px Georgia, serif"; g.textAlign = "center"; g.fillText("R", ww / 2, 100); g.fillText("V", ww / 2, 190); }), side: THREE.DoubleSide }));
      cl.position.set(px + 0.5 * sd, 2.5, pz); grp.add(cl); band.push({ cl, k });
    });
    const lg = new THREE.Sprite(new THREE.SpriteMaterial({ map: kit.glowTex, color: c1, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.4 })); lg.scale.set(w * 1.6, 5, 1); lg.position.set(cx, 2.4, z0 + d * 0.7); grp.add(lg);
    scene.add(grp);
    return { update(t, dt) {
      const ph = (t * 2.15) % 1, pulse = Math.pow(1 - ph, 2);
      band.forEach((b) => {
        if (b.cl) { b.cl.rotation.y = Math.sin(t * 1.6 + b.k) * 0.35; return; }
        b.f.position.y = 0.56 + Math.abs(Math.sin(ph * Math.PI)) * 0.07; b.f.rotation.y = Math.sin(t * 1.2 + b.i) * 0.18;
        animFigure(b.f, t, 0, b.i === 0 || b.i === 3 ? Math.max(0, 1 - ph * 1.4) : 0, false, dt);
      });
      beams.forEach((b) => { b.pv.rotation.z = Math.sin(t * 0.9 + b.i * 1.3) * 0.42; b.pv.rotation.x = Math.cos(t * 0.7 + b.i) * 0.2; b.cone.material.opacity = 0.07 + 0.08 * pulse + 0.03 * Math.sin(t * 3 + b.i); });
      lg.material.opacity = 0.28 + 0.2 * pulse;
    } };
  }
  const rv3 = A._rv && A._rv.stage && window.__rvInfo && window.__rvInfo(A._rv.own) ? rvStage3D() : null;
  function chest(x, z) {
    const grp = new THREE.Group(), body = new THREE.Mesh(kit.g.box, kit.mat(0x7a4a24)), lid = new THREE.Mesh(kit.g.box, kit.mat(0x8a5a2c)), band = new THREE.Mesh(kit.g.box, kit.mat(0xb89a50, { metalness: 0.6, roughness: 0.4 }));
    body.scale.set(0.95, 0.55, 0.62); body.position.y = 0.28; lid.scale.set(0.97, 0.18, 0.64); lid.position.y = 0.62; band.scale.set(0.12, 0.6, 0.66); band.position.y = 0.32;
    [body, lid, band].forEach((m) => { m.castShadow = true; grp.add(m); }); grp.position.set(x, 0, z); grp.userData.lid = lid; scene.add(grp);
    const gl = new THREE.Sprite(new THREE.SpriteMaterial({ map: kit.glowTex, color: 0xffd890, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })); gl.scale.setScalar(1.4); gl.position.y = 0.8; grp.add(gl); grp.userData.glow = gl;
    return grp;
  }
  function portal(x, z) {
    const grp = new THREE.Group(), M = new Merge();
    M.box(mStone, -1.1, 1.3, 0, 0.5, 2.6, 0.5, 0, shade(P.stone, 0.7)); M.box(mStone, 1.1, 1.3, 0, 0.5, 2.6, 0.5, 0, shade(P.stone, 0.7)); M.box(mStone, 0, 2.75, 0, 2.8, 0.4, 0.6, 0, shade(P.stone, 0.65));
    M.build(grp, (q) => st.track(q));
    const v = new THREE.Mesh(st.track(new THREE.PlaneGeometry(1.7, 2.4)), new THREE.MeshBasicMaterial({ color: VOIDC, transparent: true, opacity: 0.45, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending })); v.position.y = 1.2; grp.add(v); grp.userData.veil = v;
    grp.position.set(x, 0, z - 0.3); scene.add(grp); return grp;
  }
  function cage(x, z) {
    const grp = new THREE.Group(), M = new Merge();
    for (let i = 0; i < 6; i++) M.box(mBeam, -0.6 + i * 0.24, 1.1, 0.5, 0.06, 2.2, 0.06, 0, 0x3a3a44);
    M.box(mStone, 0, 2.25, 0, 1.6, 0.2, 1.2, 0, 0x4a4a56); M.box(mStone, 0, 0.05, 0, 1.6, 0.1, 1.2, 0, 0x2a2a30); M.box(mStone, 0, 1.1, -0.55, 1.6, 2.2, 0.1, 0, 0x2a2a30);
    M.build(grp, (q) => st.track(q)); grp.position.set(x, 0, z); scene.add(grp); return grp;
  }
  function signpost(x, z) {
    const grp = new THREE.Group(), M = new Merge();
    M.box(mBeam, 0, 0.8, 0, 0.14, 1.6, 0.14, 0, beamC); M.box(mPlank, 0, 1.45, 0.06, 1.1, 0.55, 0.06, 0, 0x9a7a50);
    M.build(grp, (q) => st.track(q)); grp.position.set(x, 0, z); scene.add(grp); return grp;
  }

  // ---------- the hero ----------
  const me = figure(kit, { ch: heroLook(info.banner, true) });
  me.position.set(A.p.x * PX, 0, A.p.y * PX); scene.add(me);
  let yaw = 0, pitch = cave ? 0.78 : 0.42, heroYaw = Math.PI, moveAmt = 0, atkPrev = 0, px0 = A.p.x, py0 = A.p.y;
  // start looking down the road you came in on: away from the nearest edge
  { const ex = A.p.x / (W * 16), ey = A.p.y / (H * 16), mx = Math.min(ex, 1 - ex), my = Math.min(ey, 1 - ey);
    if (mx > 0.3 && my > 0.3) yaw = 0; else if (mx < my) yaw = ex < 0.5 ? -Math.PI / 2 : Math.PI / 2; else yaw = ey < 0.5 ? Math.PI : 0;
    heroYaw = yaw + Math.PI; me.rotation.y = heroYaw; }
  followCam(camera, me.position.x, 0, me.position.z, yaw, pitch, 6 * st.distK, 0.45, 0, true);

  // ---------- enemies, items, missiles, effects (pooled) ----------
  const foes = new Map(), itemMeshes = new Map(), projMeshes = new Map(), seenFx = new WeakSet();
  const lookCache = {};
  function foeLook(e) {
    const t = e.type || "", d = e.d || {}, key = t + "|" + d.col + "|" + d.band; if (lookCache[key]) return lookCache[key];
    const cloth = hex(d.col, 0x6a4a2a), band = hex(d.band, 0xd94a3a), big = d.big ? 1.16 : 1, ranged = !!d.ranged;
    let o;
    if (/ink|unwritten|void|hollow|herald/i.test(t)) o = { cloth, cloth2: 0x141018, skin: 0x3a2a4a, helm: "hood", hoodc: 0x16121e, eyes: VOIDC, weapon: ranged ? null : "sword", cloak: 0x241a34 };
    else if (/scout|wraith|quill|dravik|sable|ironjaw|iron|warden|reaper/i.test(t)) o = { cloth, cloth2: 0x2a2420, armour: true, metal: 0x3a3a40, tabard: band, helm: "spike", weapon: ranged ? "spear" : "sword", shield: ranged ? null : band };
    else if (/knife|shadow|assassin/i.test(t)) o = { cloth, cloth2: 0x1e1e22, helm: "hood", hoodc: shade(cloth, 0.7).getHex(), weapon: "sword" };
    else if (/barrow|ghost|echo/i.test(t)) o = { cloth: 0x6a6e80, cloth2: 0x3a3e50, armour: true, metal: 0x8a90a8, tabard: band, helm: "cap", weapon: "spear", shield: 0x5a6070 };
    else o = { cloth, cloth2: 0x2a2018, skin: [0xc89a78, 0x9a6a48, 0xd8b090][Math.floor(rand() * 3)], helm: rand() < 0.5 ? "hood" : rand() < 0.5 ? "cap" : "bare", hoodc: shade(cloth, 0.6).getHex(), weapon: ranged ? "spear" : "sword", shield: !ranged && rand() < 0.4 ? band : null, armour: d.boss || rand() < 0.2, tabard: d.boss ? band : null };
    o.scale = big; return (lookCache[key] = o);
  }
  const sparks = []; for (let i = 0; i < 16; i++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: kit.glowTex, color: 0xffd8a0, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })); s.visible = false; scene.add(s); sparks.push({ s, t: 0 }); }
  let spi = 0; const spark = (x, y, z, col) => { const k = sparks[spi++ % sparks.length]; k.s.position.set(x, y, z); k.s.material.color.set(col || 0xffd8a0); k.s.visible = true; k.t = 0.28; };
  const gemGeo = st.track(new THREE.OctahedronGeometry(0.22, 0)), heartGeo = st.track(new THREE.SphereGeometry(0.16, 8, 6)), arrowGeo = st.track(new THREE.BoxGeometry(0.04, 0.04, 0.75)), orbGeo = st.track(new THREE.SphereGeometry(0.13, 8, 6));
  const gemMats = {}; const gemMat = (c) => gemMats[c] || (gemMats[c] = st.track(new THREE.MeshStandardMaterial({ color: hex(c, 0xffffff), emissive: hex(c, 0xffffff), emissiveIntensity: 0.9, roughness: 0.3, metalness: 0.2 })));
  const heartMat = st.track(new THREE.MeshStandardMaterial({ color: 0xe84a5a, emissive: 0xa02030, emissiveIntensity: 0.8 })), arrowMat = st.track(new THREE.MeshStandardMaterial({ color: 0xe8d8a8, roughness: 0.8 }));
  const orbMat = st.track(new THREE.MeshBasicMaterial({ color: 0xffb070 })), boltMat = st.track(new THREE.MeshBasicMaterial({ color: 0xc8a8ff }));
  const waveRing = new THREE.Mesh(st.track(new THREE.RingGeometry(0.85, 1, 40)), new THREE.MeshBasicMaterial({ color: 0xc8b0ff, transparent: true, opacity: 0.7, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending })); waveRing.rotation.x = -Math.PI / 2; waveRing.visible = false; scene.add(waveRing);
  // the objective: a soft pillar of light where the quest wants you
  // a short glow that fades upward (an alpha ramp), seen only from a distance: close by, the Talk pill and the marker say enough
  const bAlpha = (() => { const c = document.createElement("canvas"); c.width = 2; c.height = 64; const x = c.getContext("2d"), gr = x.createLinearGradient(0, 64, 0, 0); gr.addColorStop(0, "#fff"); gr.addColorStop(1, "#000"); x.fillStyle = gr; x.fillRect(0, 0, 2, 64); return st.track(new THREE.CanvasTexture(c)); })();
  const beacon = new THREE.Mesh(st.track(new THREE.CylinderGeometry(0.3, 0.5, 7, 10, 1, true)), new THREE.MeshBasicMaterial({ color: 0xffe0a0, alphaMap: bAlpha, transparent: true, opacity: 0.08, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, fog: false }));
  beacon.position.y = 3.5; beacon.visible = false; scene.add(beacon); let beaconOn = false;
  let beaconLab = labelSprite(st, " ", ""), beaconTxt = " "; beaconLab.visible = false; scene.add(beaconLab);

  // particles (ash, snow, motes) and the Void glow on the horizon
  const fx = cave ? particles(st, "dust", 120, 40, 6) : particles(st, P.fx, info.realm === "frost" ? 400 : 200, 70, info.realm === "storm" ? 18 : 12, P.fxc); scene.add(fx);
  if (!cave && info.voidNear > 0.15) { const vs = new THREE.Sprite(new THREE.SpriteMaterial({ map: kit.coldTex, color: VOIDC, transparent: true, opacity: 0.5 * info.voidNear, depthWrite: false, blending: THREE.AdditiveBlending, fog: false })); vs.scale.set(120, 60, 1); vs.position.set(W * T / 2 - 40, 20, -150); scene.add(vs); }
  // grass tufts on High
  if (!cave && st.gfx !== "low" && !big) {
    const tint = GRASS_TINT[info.realm] || [0x6a8a3a, 0x9aa84a];
    const n = Math.min(over ? 5000 : 2600, Math.round(W * H * (st.coarse ? 0.9 : 1.6)));
    const gf = grassField((x) => st.track(x), n, () => { const x = Math.floor(rand() * W), y = Math.floor(rand() * H), t = g[y][x]; if (t !== 0 && t !== 8) return null; return [(x + rand()) * T, 0, (y + rand()) * T]; }, tint[0], tint[1]);
    if (gf) { scene.add(gf); st.onGfx.push((q) => { gf.visible = q !== "low"; }); }
  }

  // ---------- DOM overlays: damage numbers, health bars, item names, the Use button, the hurt flash ----------
  const root = st.root, flEls = [], hbEls = [];
  for (let i = 0; i < 14; i++) { const d = document.createElement("div"); d.className = "v3-fl"; d.hidden = true; root.appendChild(d); flEls.push(d); }
  for (let i = 0; i < 10; i++) { const d = document.createElement("div"); d.className = "v3-hb"; d.hidden = true; d.innerHTML = "<i></i>"; root.appendChild(d); hbEls.push(d); }
  const tagEl = document.createElement("div"); tagEl.className = "v3-tag"; tagEl.hidden = true; root.appendChild(tagEl);
  const nameEls = []; for (let i = 0; i < 3; i++) { const d = document.createElement("div"); d.className = "v3-tag v3-nm"; d.hidden = true; root.appendChild(d); nameEls.push(d); }
  const byD = [];
  const barkEl = document.createElement("div"); barkEl.className = "v3-bark"; barkEl.hidden = true; root.appendChild(barkEl);
  const barkPool = (BARKS[info.realm] || []).concat(BARKS.any || []); let barkO = null, barkT = 0;
  const hurtEl = document.createElement("div"); hurtEl.className = "v3-hurt"; root.appendChild(hurtEl);
  const useBtn = document.createElement("button"); useBtn.className = "v3-use"; useBtn.hidden = true; root.appendChild(useBtn);
  // the scene's buttons sit hidden in .v3-top and show up in the corner menu; the stick pushed to its rim runs (no Run button)
  const top = st.$(".v3-top");
  top.innerHTML = info.siteId ? '<button data-v="menu">' + esc(info.menuLabel || "Town menu") + "</button>" : "";
  st.gfxButton();
  const host = api.host();
  st.menuSrc = () => {
    const out = [], hb = host && host.querySelectorAll("#ahud .abtns button"), ic = { agear: "agear", quest: "quest", askills: "askills", abuild: "abuild", await: "await", aleave: "aleave" };
    (hb ? [...hb] : []).forEach((b) => {
      if (b.hidden || b.style.display === "none") return; const a = b.getAttribute("data-act") || (b.id === "sneakbtn" ? "sneak" : "");
      const sneak = b.id === "sneakbtn";
      out.push({ id: a, label: b.textContent.trim(), icon: sneak ? "sneak" : ic[a] || "dot", run: () => b.click(), on: sneak ? () => /ing$/i.test(b.textContent.trim()) : null });
    });
    return out;
  };
  st.menuToggles = [{ label: "Auto-run", sub: "Walks on by itself; steer with the camera", icon: "auto", on: () => autoRun, run: () => { autoRun = !autoRun; if (autoRun) st.msg("Auto-run: steer with the camera. Touch the stick to take over.", 2.6); } }];
  // the objective tracker (the 2D HUD's #aobj, restyled top-left under the hearts) fades when nothing has changed for a while
  const objEl = document.getElementById("aobj"), heartsEl = document.getElementById("ahearts");
  let objKey = "", objT = 0, toastK = "", toastT = 0;
  const toastEl = document.getElementById("atoast");
  if (toastEl) st.track({ dispose: () => toastEl.classList.remove("v3-tfade") });
  if (big) st.track({ dispose: () => { for (const c of live.values()) dropChunk(c); live.clear(); } });
  const objShow = (secs) => { objT = performance.now() + (secs || 6) * 1000; if (objEl) objEl.classList.add("v3-objon"); };
  const objPoke = (e) => { e.stopPropagation(); objShow(6); };
  if (objEl) { st.listen(objEl, "pointerdown", objPoke); st.listen(heartsEl, "pointerdown", objPoke); st.track({ dispose: () => objEl.classList.remove("v3-objon") }); }
  setTimeout(() => { const kk = st.$(".v3-keys"); if (kk) kk.style.cssText += ";transition:opacity 1s;opacity:0"; }, 14000);
  st.$(".v3-keys").innerHTML = "WASD move · Shift run · drag or arrows: look<br>E talk / open · Space strike · K shoot · L cast · Esc: map";
  let autoRun = false, useAct = null, hintShown = false;
  try { hintShown = localStorage.getItem("vh3d-hint-area") === "1"; } catch (e) {}
  st.listen(root, "click", (e) => {
    const b = e.target.closest("[data-v]"); if (!b) return; const v = b.getAttribute("data-v"); e.stopPropagation();
    if (v === "menu") api.openPlace(null);
  });
  st.listen(useBtn, "pointerdown", (e) => { e.stopPropagation(); e.preventDefault(); doUse(); });
  // what the Use button does from here: talk / open / enter / parley from the sim, or a door into the town's menus
  function refreshUse(hx, hz) {
    const u = api.useInfo(); nearDoor = null;
    if (!u && doors.length) { let bd = 9; for (const dr of doors) { const d = Math.hypot(dr.x - hx, dr.z - hz); if (d < dr.r && d < bd) { bd = d; nearDoor = dr; } } }
    const act = u ? { l: u.l, n: u.n } : nearDoor ? { l: "Go in", n: nearDoor.label, door: nearDoor } : nearParty ? { l: "Talk", n: nearParty.q.name.split(" · ")[0], party: nearParty.q.talk } : null;
    if (!act && over && wildOn) { const c = wildCarcass(hx, hz); if (c) { useAct = { l: "Butcher", n: WNAME[c.k], butcher: c }; const k2 = "B|" + c.k; if (k2 !== (useBtn._k || "")) { useBtn._k = k2; useBtn.innerHTML = "Butcher<small>" + esc(WNAME[c.k]) + "</small>"; } return; } }
    if (!act && over && api.gatherInfo) { const c = api.gatherInfo(); if (c) { useAct = { l: c.l, n: c.n, gather: 1 }; const k2 = c.l + "|" + c.n; if (k2 !== (useBtn._k || "")) { useBtn._k = k2; useBtn.innerHTML = esc(c.l) + "<small>" + esc(c.n) + "</small>"; } return; } }
    if (!act && over && api.climbInfo) { const c = api.climbInfo(); if (c) { useAct = { l: c.l, n: c.n, climb: 1 }; const k2 = c.l + "|" + c.n; if (k2 !== (useBtn._k || "")) { useBtn._k = k2; useBtn.innerHTML = esc(c.l) + "<small>" + esc(c.n) + "</small>"; } return; } }
    const key = act ? act.l + "|" + act.n : "";
    if (key !== (useBtn._k || "")) { useBtn._k = key; useBtn.innerHTML = act ? esc(act.l) + (act.n ? "<small>" + esc(act.n) + "</small>" : "") : ""; }
    useAct = act;
  }
  // E / the button: re-check first, so a press right after arriving (or on a slow frame) still acts on what is here now
  function doUse() { refreshUse(A.p.x * PX, A.p.y * PX); if (!useAct) return; if (useAct.door) { api.sfx("door"); inp.keys = {}; api.openPlace(useAct.door.key, useAct.door.sid); } else if (useAct.party) { inp.keys = {}; api.partyUse(useAct.party); } else if (useAct.climb) { inp.keys = {}; api.climb(); } else if (useAct.butcher) { wildButcher(useAct.butcher); refreshUse(A.p.x * PX, A.p.y * PX); } else if (useAct.gather) { api.gather(); refreshUse(A.p.x * PX, A.p.y * PX); } else api.use(); }
  inp.blocked = () => api.sheetOpen();
  inp.onKey = (k) => {
    if (k === "e" || k === "f") doUse();
    else if (k === "escape") { if (api.inDlg()) api.closeDlg(); else api.leave(); }
  };
  if (!hintShown) { setTimeout(() => { if (!api.inDlg()) st.msg(st.coarse ? "Left thumb: move · drag on the right: look · the big buttons strike and talk" : "WASD to move · drag to look · E to talk · Space to strike", 5); }, 1200); try { localStorage.setItem("vh3d-hint-area", "1"); } catch (e) {} }

  // ---------- per-frame sync ----------
  const v3 = new THREE.Vector3();
  const proj = (x, y, z, el, dy) => {
    v3.set(x, y, z).project(camera);
    if (v3.z > 1 || v3.x < -1.2 || v3.x > 1.2 || v3.y < -1.2 || v3.y > 1.2) { el.hidden = true; return false; }
    const sx = (v3.x * 0.5 + 0.5) * root.clientWidth, sy = (-v3.y * 0.5 + 0.5) * root.clientHeight + (dy || 0);
    el.style.transform = "translate(" + sx.toFixed(1) + "px," + sy.toFixed(1) + "px)"; el.hidden = false; return true;
  };
  const flMap = new WeakMap();
  let frameN = 0, nearDoor = null, dlgCamT = 0, talkTo = null;
  function solidAtW(x, z) { const tx = Math.floor(x / T), tz = Math.floor(z / T); if (tx < 0 || tz < 0 || tx >= W || tz >= H) return 0; return solidH[tz * W + tx]; }

  function syncFoes(dt, t, pX, pZ) {
    for (const e of A.en) {
      let o = foes.get(e);
      const ex = e.x * PX, ez = e.y * PX, dP = Math.hypot(ex - pX, ez - pZ);
      if (!o) {
        if (e.gone || e.dead || dP > 60) continue;
        const f = figure(kit, foeLook(e)); f.position.set(ex, 0, ez); scene.add(f);
        o = { f, lx: ex, lz: ez, yaw: 0, atk: 0, cd: e.cd, shot: e.shot, deadT: -1, mv: 0 }; foes.set(e, o);
      }
      if (e.gone) { o.f.visible = false; continue; }
      if (e.dead) {
        if (o.deadT < 0) { o.deadT = 0; if (o.f.userData.ch) o.f.userData.ch.die(); else o.f.rotation.x = -Math.PI / 2; spark(ex, 1.1, ez, 0xff9a60); }
        o.deadT += dt; if (o.deadT > 6) o.f.visible = false; else if (o.f.userData.ch) o.f.userData.ch.update(dt, 0, 0, false);
        continue;
      }
      const vis = dP < 58; o.f.visible = vis; if (!vis) continue;
      const mx = ex - o.lx, mz = ez - o.lz, sp = Math.hypot(mx, mz) / Math.max(dt, 1e-3);
      o.mv = lerp(o.mv, Math.min(2, sp / 3.2), 0.25); o.lx = ex; o.lz = ez;
      const want = sp > 0.3 ? Math.atan2(mx, mz) : (e.aggro ? Math.atan2(pX - ex, pZ - ez) : o.yaw);
      o.yaw = angLerp(o.yaw, want, 1 - Math.exp(-dt * 10));
      if (e.cd > o.cd + 0.2 && e.aggro && !e.d.ranged) o.atk = 1; o.cd = e.cd;
      if (e.d.ranged && e.shot > o.shot + 0.3) o.atk = 1; o.shot = e.shot;
      o.atk = Math.max(0, o.atk - dt * 2.2);
      o.f.position.set(ex, 0, ez); o.f.rotation.y = o.yaw;
      animFigure(o.f, t, e.yield ? 0 : o.mv, o.atk, false, dt, dP > 30 ? 2 : 0);
    }
  }
  function syncItems(t) {
    const live = A.items;
    for (const [it, m] of itemMeshes) if (live.indexOf(it) < 0) { scene.remove(m); itemMeshes.delete(it); }
    let best = null, bd = 4.5;
    for (const it of live) {
      let m = itemMeshes.get(it);
      if (!m) { m = it.t === "item" ? new THREE.Mesh(gemGeo, gemMat(api.rarCol(it))) : it.t === "arrow" ? new THREE.Mesh(arrowGeo, arrowMat) : new THREE.Mesh(heartGeo, heartMat); scene.add(m); itemMeshes.set(it, m); }
      const x = it.x * PX, z = it.y * PX; m.position.set(x, 0.45 + Math.sin(t * 3 + x) * 0.1, z); m.rotation.y = t * 1.6;
      if (it.t === "item") { const d = Math.hypot(x - me.position.x, z - me.position.z); if (d < bd) { bd = d; best = it; } }
    }
    if (best) { const nm = api.itemName(best); if (tagEl._t !== nm) { tagEl._t = nm; tagEl.textContent = nm; tagEl.style.color = api.rarCol(best); tagEl.style.borderColor = api.rarCol(best); } if (!proj(best.x * PX, 1.0, best.y * PX, tagEl)) tagEl.hidden = true; else tagEl.style.transform += " translate(-50%,-100%)"; } else tagEl.hidden = true;
  }
  function syncProj() {
    const live = A.proj;
    for (const [q, m] of projMeshes) if (live.indexOf(q) < 0) { scene.remove(m); projMeshes.delete(q); }
    for (const q of live) {
      let m = projMeshes.get(q);
      if (!m) { m = q.own ? (q.bolt ? new THREE.Mesh(orbGeo, boltMat) : new THREE.Mesh(arrowGeo, arrowMat)) : new THREE.Mesh(orbGeo, orbMat); scene.add(m); projMeshes.set(q, m); }
      m.position.set(q.x * PX, 1.25, (q.y + 6) * PX); m.rotation.y = Math.atan2(q.vx, q.vy);
    }
  }
  function syncFx() {
    for (const f of A.fx) if (!seenFx.has(f)) { seenFx.add(f); spark(f.x * PX, 1.2, (f.y + 8) * PX); }
    let i = 0;
    for (const f of A.floats) {
      if (i >= flEls.length) break; const el = flEls[i++];
      let m = flMap.get(f); if (!m) { m = { y0: f.y }; flMap.set(f, m); }
      if (el._f !== f) { el._f = f; el.textContent = f.s; el.className = "v3-fl" + (f.hurt ? " h" : ""); el.style.color = f.col || ""; }
      const rise = (m.y0 - f.y) * PX * 2.2;
      if (proj(f.x * PX, 2.1 + rise, (m.y0 + 14) * PX, el)) el.style.opacity = Math.min(1, f.t * 2).toFixed(2);
    }
    for (; i < flEls.length; i++) if (!flEls[i].hidden) { flEls[i].hidden = true; flEls[i]._f = null; }
    // health bars over hurt foes and every boss
    let k = 0;
    for (const e of A.en) {
      if (k >= hbEls.length) break; if (e.dead || e.gone || !(e.hp < e.hpm || e.d.boss)) continue;
      const ex = e.x * PX, ez = e.y * PX; if (Math.hypot(ex - me.position.x, ez - me.position.z) > 26) continue;
      const el = hbEls[k++]; el.className = "v3-hb" + (e.d.boss ? " boss" : "") + (e.yield ? " y" : "");
      if (proj(ex, e.d.big ? 2.55 : 2.2, ez, el)) el.firstChild.style.width = Math.round(100 * clamp(e.hp / e.hpm, 0, 1)) + "%";
    }
    for (; k < hbEls.length; k++) hbEls[k].hidden = true;
    if (A.wave) { waveRing.visible = true; const s = (1 - A.wave.t / 0.5) * 66 * PX + 0.5; waveRing.scale.setScalar(s); waveRing.position.set(A.wave.x * PX, 0.2, (A.wave.y + 6) * PX); waveRing.material.opacity = A.wave.t * 1.4; } else waveRing.visible = false;
  }

  // ---------- the living overland: the map's armies, bandits, hunters and caravans, walking the same roads ----------
  const parties = new Map();
  function partyMember(q, i) {
    const col = hex(q.col, 0x8a6a4a);
    let o;
    if (q.kind === "bandit") o = { cloth: [0x6a4a2a, 0x4a3a2a, 0x5a5040][i % 3], cloth2: 0x2a2018, skin: [0xc89a78, 0x9a6a48, 0xd8b090][i % 3], helm: i % 2 ? "hood" : "bare", hoodc: 0x3a2a1a, weapon: i % 3 === 2 ? "spear" : "sword" };
    else if (q.kind === "folk") o = { cloth: [0x7a6a4a, 0x5a6a7a, 0x8a5a4a, 0x6a7a5a][i % 4], cloth2: 0x3a2e22, skin: [0xc89a78, 0xe0b898, 0x9a6a48][i % 3], helm: i % 3 === 0 ? "hood" : "bare", hoodc: 0x5a4a3a, weapon: null };
    else if (q.kind === "void") o = { cloth: 0x2a2234, cloth2: 0x141018, skin: 0x3a2a4a, helm: "hood", hoodc: 0x16121e, eyes: VOIDC, weapon: "sword", cloak: 0x241a34 };
    else if (q.kind === "caravan") o = i < 2 ? { cloth: [0x8a6a3a, 0x6a5a7a][i], cloth2: 0x3a2a1a, skin: 0xc8a080, helm: "bare", weapon: null } : { cloth: col, cloth2: 0x2a2420, armour: true, metal: 0x6a6a70, tabard: col, helm: "cap", weapon: "spear" };
    else o = { cloth: col, cloth2: 0x2a2420, armour: true, metal: q.kind === "hunter" ? 0x3a3a40 : 0x7a7a84, tabard: col, helm: q.kind === "hunter" ? "spike" : "cap", weapon: i % 3 === 1 ? "spear" : "sword", shield: i % 2 ? shade(col, 0.7).getHex() : undefined };
    return figure(kit, o);
  }
  function wagon(col) {
    const grp = new THREE.Group(), wood = kit.mat(0x6a4a2a), canvas = kit.mat(0xe8dcc0), dark = kit.mat(0x2a1a10);
    const bed = new THREE.Mesh(kit.g.box, wood); bed.scale.set(1.5, 0.5, 2.6); bed.position.y = 0.85; grp.add(bed);
    const cov = new THREE.Mesh(kit.g.cyl, canvas); cov.scale.set(1.45, 2.4, 1.45); cov.rotation.x = Math.PI / 2; cov.position.y = 1.25; grp.add(cov);
    const stripe = new THREE.Mesh(kit.g.box, kit.mat(hex(col, 0xc8873a))); stripe.scale.set(1.52, 0.18, 2.62); stripe.position.y = 1.02; grp.add(stripe);
    for (const sx of [-0.8, 0.8]) for (const sz of [-0.85, 0.85]) { const w = new THREE.Mesh(kit.g.cyl, dark); w.scale.set(0.9, 0.12, 0.9); w.rotation.z = Math.PI / 2; w.position.set(sx, 0.45, sz); grp.add(w); }
    // the horse: a body, a neck and a head, on four legs
    const hc = kit.mat(0x5a3a22), h = new THREE.Group(); h.position.set(0, 0, 2.3); grp.add(h);
    const body = new THREE.Mesh(kit.g.box, hc); body.scale.set(0.55, 0.6, 1.5); body.position.y = 1.25; h.add(body);
    const neck = new THREE.Mesh(kit.g.box, hc); neck.scale.set(0.3, 0.75, 0.35); neck.position.set(0, 1.7, 0.75); neck.rotation.x = -0.5; h.add(neck);
    const head = new THREE.Mesh(kit.g.box, hc); head.scale.set(0.28, 0.3, 0.6); head.position.set(0, 2.0, 1.05); h.add(head);
    const legs = []; for (const lx of [-0.2, 0.2]) for (const lz of [-0.6, 0.6]) { const l = new THREE.Mesh(kit.g.box, hc); l.scale.set(0.14, 0.95, 0.14); l.position.set(lx, 0.48, lz); h.add(l); legs.push(l); }
    grp.traverse((m) => { if (m.isMesh) m.castShadow = true; });
    grp.userData.legs = legs; return grp;
  }
  function makeParty(q) {
    // armies march as a column you can count: up to 16 in ranks of four behind the banner; bands and pilgrims stay small
    const army = q.kind !== "caravan" && q.kind !== "folk" && q.n >= 25;
    const grp = new THREE.Group(), n = army ? Math.max(6, Math.min(16, Math.round(q.n / 4))) : Math.max(2, Math.min(q.kind === "caravan" ? 4 : 7, Math.round(q.n / 5))), mem = [];
    let cart = null; if (q.kind === "caravan") { cart = wagon(q.col); grp.add(cart); }
    for (let i = 0; i < n; i++) {
      const f = partyMember(q, i), row = Math.floor(i / 2), side = i % 2 ? 1 : -1;
      const ox = army ? ((i % 4) - 1.5) * 1.05 : cart ? side * 1.6 : (i === 0 ? 0 : side * 0.9), oz = army ? -Math.floor(i / 4) * 1.3 : cart ? 1.2 - row * 2.4 : -row * 1.3;
      f.position.set(ox, 0, oz); grp.add(f); mem.push({ f, ox, oz, ph: i * 0.7 });
    }
    // a banner on a pole, in the party's colours
    const pole = new THREE.Mesh(kit.g.cyl, kit.mat(0x4a3420)); pole.scale.set(0.08, 3.6, 0.08); pole.position.set(cart ? -0.9 : 0.5, 1.8, cart ? -1.4 : 0.3); grp.add(pole);
    const flag = new THREE.Mesh(kit.g.box, kit.mat(hex(q.col, 0xb2503c), { side: THREE.DoubleSide })); flag.scale.set(0.8, 0.55, 0.03); flag.position.set(pole.position.x + 0.42, 3.25, pole.position.z); grp.add(flag);
    const lab = labelSprite(st, q.name, (q.hostile ? "hostile · " : "") + "about " + Math.max(2, Math.round(q.n / 2) * 2) + (q.kind === "caravan" ? " guards" : " men")); lab.scale.set(4.2, 1.05, 1); lab.position.set(0, 4.6, 0); grp.add(lab);
    if (q.hostile) { const ring = new THREE.Mesh(st.track(new THREE.RingGeometry(2.4, 2.7, 32)), new THREE.MeshBasicMaterial({ color: 0xd84a3a, transparent: true, opacity: 0.35, depthWrite: false, side: THREE.DoubleSide })); ring.rotation.x = -Math.PI / 2; ring.position.y = 0.06; grp.add(ring); }
    scene.add(grp);
    return { grp, mem, cart, flag, lab, q, yaw: 0, mv: 0, init: false };
  }
  // your army, called on the road: your men form up behind you and march with you until the fight
  let escort = null;
  window.__vh3dEscort = (men) => {
    if (escort) { scene.remove(escort.grp); escort = null; } if (!men || ctlGone()) return;
    escort = makeParty({ kind: "lord", n: Math.max(28, Math.min(64, men * 4)), col: "#3aa0d8", name: "Your army", hostile: false });
    escort.grp.position.set(me.position.x, 0, me.position.z + 3); escort.yaw = 0;
  };
  function tickEscort(dt, t, hx, hz) {
    if (!escort) return; const p = escort.grp.position, yaw = me.rotation.y, tx = hx + Math.cos(yaw) * 4.2 + Math.sin(yaw) * 2.5, tz = hz - Math.sin(yaw) * 4.2 + Math.cos(yaw) * 2.5, dx = tx - p.x, dz = tz - p.z, d = Math.hypot(dx, dz);
    if (d > 25) p.set(tx, 0, tz); else { const k = 1 - Math.exp(-dt * 3); p.x += dx * k; p.z += dz * k; }
    escort.mv = lerp(escort.mv, Math.min(1.4, d / 1.5), 0.1); if (d > 0.1) escort.yaw = angLerp(escort.yaw, Math.atan2(dx, dz), 1 - Math.exp(-dt * 4)); escort.grp.rotation.y = escort.yaw;
    for (const m of escort.mem) animFigure(m.f, t + m.ph, escort.mv, 0, false, dt, 0); escort.flag.rotation.y = Math.sin(t * 1.7) * 0.3; escort.lab.visible = false;
  }
  let nearParty = null;
  function syncParties(dt, t, hx, hz) {
    if (!over || !api.parties) return;
    if (frameN % 3 === 0) {
      const list = api.parties(), seen = new Set();
      for (const q of list) {
        seen.add(q.k); let o = parties.get(q.k);
        if (o && (o.q.hostile !== q.hostile || o.q.name !== q.name)) { scene.remove(o.grp); parties.delete(q.k); o = null; }
        if (!o) { o = makeParty(q); parties.set(q.k, o); }
        o.q = q; o.tx = q.x * PX; o.tz = q.y * PX; if (!o.init) { o.init = true; o.grp.position.set(o.tx, 0, o.tz); }
      }
      for (const [k, o] of parties) if (!seen.has(k)) { scene.remove(o.grp); parties.delete(k); }
    }
    nearParty = null; let nd = 5;
    for (const o of parties.values()) {
      const p = o.grp.position, dx = o.tx - p.x, dz = o.tz - p.z, d = Math.hypot(dx, dz);
      if (d > 30) { p.set(o.tx, 0, o.tz); } else { const k = 1 - Math.exp(-dt * 3); p.x += dx * k; p.z += dz * k; }
      const sp = d / Math.max(0.3, 0.33); o.mv = lerp(o.mv, Math.min(1.4, sp / 3), 0.1);
      if (d > 0.05) o.yaw = angLerp(o.yaw, Math.atan2(dx, dz), 1 - Math.exp(-dt * 4));
      o.grp.rotation.y = o.yaw;
      const dh = Math.hypot(p.x - hx, p.z - hz), close = dh < 45;
      for (const m of o.mem) if (close || frameN % 4 === 0) animFigure(m.f, t + m.ph, o.mv, 0, false, close ? dt : dt * 4, dh > 30 ? 2 : 0);
      if (o.cart && o.mv > 0.05) for (const [i, l] of o.cart.userData.legs.entries()) l.rotation.x = Math.sin(t * 8 + i * 1.6) * 0.5 * Math.min(1, o.mv);
      o.flag.rotation.y = Math.sin(t * 1.7 + p.x) * 0.3;
      o.lab.material.opacity = clamp(1.5 - dh / 50, 0, 1); o.lab.visible = o.lab.material.opacity > 0.02;
      if (o.q.talk && dh < nd) { nd = dh; nearParty = o; }
    }
  }
  st.track({ dispose: () => { for (const o of parties.values()) scene.remove(o.grp); parties.clear(); } });

  // the Realm Arts' effects (g3d/skills2.js): the sim casts, these pooled meshes draw it
  let K2v = null;
  try { if (api.sk2Fx) { K2v = api.sk2Fx({ THREE, scene, camera, root: st.root, glowTex: kit.glowTex, gfx: () => st.gfx, PX }); st.track({ dispose: () => K2v && K2v.dispose() }); } } catch (e) { K2v = null; }
  st.start((dt, t) => {
    if (K2v) K2v.pre();
    frameN++;
    const p = A.p, inDlg = api.inDlg(), paused = api.sheetOpen() || inDlg;
    if (st.onFrame) st.onFrame(t);
    torches.forEach((x) => x.tick(t)); fires.forEach((x) => x.tick(t)); kit.tickStatics(dt);
    if (rv3) rv3.update(t, dt);
    if (frameN % 240 === 0) { const n0 = tod.night; timeOfDay(); if (L.env && Math.abs(tod.night - (tod.envN === undefined ? -1 : tod.envN)) > 0.06) { tod.envN = tod.night; L.env.refresh(); } }
    // window glow breathes like a hearth behind the glass, stronger after dark
    winMat.emissiveIntensity = 1.6 * (1 + tod.night * 0.5) * (0.9 + 0.06 * Math.sin(t * 2.3) + 0.04 * Math.sin(t * 7.1 + 1.3));
    if (L.band) L.band.userData.tick(camera.position.x, camera.position.z);
    fx.userData.tick(dt, me.position.x, me.position.z); if (L.sky) L.sky.userData.tick(dt, camera.position.x, camera.position.z);
    for (const k of sparks) if (k.s.visible) { k.t -= dt; k.s.scale.setScalar(0.5 + (0.28 - k.t) * 3); k.s.material.opacity = k.t * 3.5; if (k.t <= 0) k.s.visible = false; }

    // input: camera-relative intent becomes the sim's move vector
    yaw -= inp.turn * 0.006; inp.turn = 0; pitch = clamp(pitch + inp.pitch * 0.003, 0.1, 1.05); inp.pitch = 0;
    const k = inp.keys; if (k.arrowleft || k.q) yaw += dt * 2.2; if (k.arrowright || k.r) yaw -= dt * 2.2;
    let mv = moveIntent(inp, yaw);
    if (autoRun && mv.amt < 0.05) mv = { x: -Math.sin(yaw), z: -Math.cos(yaw), amt: 1 };
    if (inp.stick.on && autoRun) autoRun = false; // touching the stick takes over, as the message says
    // the stick pushed to its rim sprints (as in battle); Shift on a keyboard; auto-run jogs at full pace
    const rim = inp.stick.on && Math.hypot(inp.stick.x, inp.stick.y) > 0.92;
    const sprint = (k.shift || rim) ? 1.35 : 1;
    if (paused) api.move(0, 0, 1); else api.move(mv.amt > 0.05 ? mv.x * mv.amt : 0, mv.amt > 0.05 ? mv.z * mv.amt : 0, sprint);
    if (inp.click) { inp.click = 0; if (!st.coarse && !paused) api.strike(); }

    // the hero follows the sim
    const hx = p.x * PX, hz = p.y * PX, dx = (p.x - px0) * PX, dz = (p.y - py0) * PX, spd = Math.hypot(dx, dz) / Math.max(dt, 1e-3);
    if (Math.hypot(dx, dz) > 4) { me.position.set(hx, 0, hz); } // fell and was dragged back, or a new spawn
    px0 = p.x; py0 = p.y;
    if (spd > 0.25 && Math.hypot(dx, dz) < 4) heroYaw = angLerp(heroYaw, Math.atan2(dx, dz), 1 - Math.exp(-dt * 14));
    moveAmt = lerp(moveAmt, spd / 3.2, 0.3);
    me.position.set(hx, 0, hz); me.rotation.y = heroYaw;
    const atkK = (p.atk || 0) > 0 ? p.atk / 0.2 : (p.atk2 || 0) > 0 ? p.atk2 / 0.2 : 0; atkPrev = p.atk || 0;
    animFigure(me, t, moveAmt, atkK, false, dt);
    hurtEl.style.opacity = p.flash > 0 ? Math.min(1, p.flash * 4).toFixed(2) : "0";
    if (lantern) lantern.position.set(hx, 2.6, hz);
    if (lanternFill) lanternFill.position.set(hx + Math.sin(heroYaw) * 2.2, 1.8, hz + Math.cos(heroYaw) * 2.2);

    // NPCs: markers, names, turning to look at you, chests that open
    let nearN = null, nd = 9;
    for (const o of npcs) {
      const n = o.n, vis = !n.vis || n.vis(); if (o.obj) o.obj.visible = vis;
      const d = Math.hypot(o.x - hx, o.z - hz);
      if (frameN % 10 === 0 || o.mk < 0) {
        const mk = vis && n.mk ? (n.mk() || 0) : 0;
        if (mk !== o.mk) { o.mk = mk; if (o.mark) { scene.remove(o.mark); o.mark = null; } if (mk === 1 || mk === 2) { o.mark = new THREE.Sprite(new THREE.SpriteMaterial({ map: markTex[mk], transparent: true, depthWrite: false, fog: false })); o.mark.scale.setScalar(1.1); o.mark.renderOrder = 12; scene.add(o.mark); } }
        if (n.chest && o.obj && o.obj.userData.lid) { let open = false; try { open = n.d() === "chest_empty"; } catch (e) {} o.obj.userData.lid.rotation.x = open ? -1.1 : 0; o.obj.userData.lid.position.z = open ? -0.2 : 0; o.obj.userData.glow.visible = !open; }
      }
      if (o.mark) {
        o.mark.position.set(o.x, (n.small ? 2.3 : 2.95) + Math.sin(t * 3 + o.x) * 0.12, o.z);
        // on screen the marker stays between ~18px and ~12% of the screen height, whatever the camera distance; it fades out
        // once you are close (the Talk pill names who you are talking to) or the camera is right on top of it
        const dc = Math.max(0.5, camera.position.distanceTo(o.mark.position)), Hs = root.clientHeight || 390, k = 2 * dc * Math.tan(camera.fov * Math.PI / 360) / Hs;
        const px = clamp(1.1 / k, 18, Math.min(52, Hs * 0.12)); o.mark.scale.setScalar(px * k);
        const fade = Math.min(clamp((d - 2.4) / 2.2, 0, 1), clamp((dc - 2.2) / 2, 0, 1));
        o.mark.material.opacity = fade; o.mark.visible = vis && fade > 0.02;
      }
      o.d = vis && n.name ? d : 99;
      if (o.fig && vis) { if (d < 5) o.fig.rotation.y = angLerp(o.fig.rotation.y, Math.atan2(hx - o.x, hz - o.z), 1 - Math.exp(-dt * 4)); if (d < 40 || frameN % 4 === 0) animFigure(o.fig, t, 0, 0, false, d < 40 ? dt : dt * 4, d > 25 ? 2 : 0); }
      if (o.obj && o.obj.userData.veil) o.obj.userData.veil.material.opacity = 0.35 + 0.15 * Math.sin(t * 3);
      if (vis && d < nd) { nd = d; nearN = o; }
    }
    // a passer-by speaks: era-checked barks per Realm, one at a time, never from a quest giver or mid-conversation
    if (barkO) { barkT -= dt; if (barkT <= 0 || paused || barkO.d > 6) { barkEl.hidden = true; barkO = null; } else if (proj(barkO.x, barkO.n.small ? 2.1 : 2.6, barkO.z, barkEl)) barkEl.style.transform += " translate(-50%,-100%)"; }
    else if (!paused && barkPool.length && frameN % 12 === 0) {
      for (const o of npcs) { if (!o.fig || o.mk > 0 || o.d > 3.6 || (o.barkCd || 0) > t) continue; o.barkCd = t + 40; barkO = o; barkT = 4.5; barkEl.textContent = "“" + barkPool[Math.floor(Math.random() * barkPool.length)] + "”"; break; }
    }
    // name plates (people only: plots, signs and chests get none): the person the Talk pill points at (or the nearest), plus up to two others close by, dimmer;
    // a plate that would overlap one already placed is hidden, so they never stack
    byD.length = 0; for (const o of npcs) if (o.fig && o.d < 8) byD.push(o); byD.sort((a, b) => a.d - b.d);
    { const tn = useAct && !useAct.door ? useAct.n : ""; const ti = tn ? byD.findIndex((o) => o.n.name === tn) : -1; if (ti > 0) byD.unshift(byD.splice(ti, 1)[0]); }
    const placed = [];
    for (let i = 0; i < nameEls.length; i++) {
      const el = nameEls[i], o = byD[i];
      if (!o || paused || (i > 0 && o.d > 4.5)) { el.hidden = true; continue; }
      if (el._o !== o) { el._o = o; el.textContent = o.n.name; el._w = 0; }
      v3.set(o.x, o.n.small ? 1.75 : 2.25, o.z).project(camera);
      if (v3.z > 1 || Math.abs(v3.x) > 1.1 || Math.abs(v3.y) > 1.1) { el.hidden = true; continue; }
      const sx = (v3.x * 0.5 + 0.5) * root.clientWidth, sy = (-v3.y * 0.5 + 0.5) * root.clientHeight;
      if (el.hidden) el.hidden = false;
      if (!el._w) { el._w = el.offsetWidth || 90; el._h = el.offsetHeight || 22; }
      const bx = { l: sx - el._w / 2 - 4, r: sx + el._w / 2 + 4, t: sy - el._h - 3, b: sy + 3 };
      if (placed.some((q) => bx.l < q.r && bx.r > q.l && bx.t < q.b && bx.b > q.t)) { el.hidden = true; continue; }
      placed.push(bx);
      el.style.transform = "translate(" + sx.toFixed(1) + "px," + sy.toFixed(1) + "px) translate(-50%,-100%)" + (i ? " scale(.86)" : "");
      el.style.opacity = i ? clamp(1.1 - o.d / 6, 0.3, 0.6).toFixed(2) : "1";
    }
    // the objective tracker: shown when it changes (the clock does not count), faded after a few quiet seconds
    if (objEl && frameN % 10 === 0) {
      const key = (objEl.textContent || "").replace(/Day \d+ \d\d:\d\d( night)?/, "").replace(/\d+ crowns/, "");
      if (key !== objKey) { objKey = key; objShow(6); }
    }
    if (objT && performance.now() > objT) { objT = 0; if (objEl) objEl.classList.remove("v3-objon"); }
    // tips (the area toast) fade after about three seconds of wall time, however slowly the sim's own timer runs
    if (toastEl && frameN % 3 === 0) {
      if (toastEl.hidden) { toastK = ""; toastEl.classList.remove("v3-tfade"); }
      else if (toastEl.textContent !== toastK) { toastK = toastEl.textContent; toastT = performance.now(); toastEl.classList.remove("v3-tfade"); }
      else if (performance.now() - toastT > 3000) toastEl.classList.add("v3-tfade");
    }
    // foes (create lazily near the player), items, missiles, effects
    syncFoes(dt, t, hx, hz); syncParties(dt, t, hx, hz); if (camps3.length) tickCamps(t); if (farMarks.length) tickFar(t, hx, hz); if (escort) tickEscort(dt, t, hx, hz); if (wildOn) { wildT -= dt; syncWild(Math.min(dt, 0.1), hx, hz, wildT <= 0); if (wildT <= 0) wildT = 1.5; } if (frameN % 10 === 0) { syncSigns(hx, hz); syncQuestBeams(hx, hz); if (camps3.length) syncCamps(hx, hz); if (big) lazyNpcs(hx, hz); for (const l of townNames) { const d = Math.hypot(l.position.x - hx, l.position.z - hz); l.material.opacity = clamp((110 - d) / 40, 0, 1) * clamp((d - 8) / 10, 0, 1); l.visible = l.material.opacity > 0.02; } }
    syncItems(t); syncProj(); syncFx();
    // exits: soft pulse; locked ones dim
    if (frameN % 15 === 0) for (const o of exits) { let lk = ""; try { lk = o.e.lock ? o.e.lock() : ""; } catch (e) {} o.locked = !!lk; if (o.veil) o.veil.material.color.set(lk ? 0xff6a5a : 0xfff0c0); if (o.sign) o.sign.material.opacity = lk ? 0.45 : 1; }
    for (const o of exits) { if (o.veil) o.veil.material.opacity = (o.locked ? 0.06 : 0.1) + 0.06 * Math.sin(t * 3 + o.x); if (o.flag) o.flag.rotation.y = Math.sin(t * 1.7 + o.x) * 0.25; if (o.sign) { const d = Math.hypot(o.x - hx, o.z - hz); o.sign.visible = d < (over ? 70 : 40); } }
    // house plates: only the nearest building's plate shows, so plates never stack up or crowd the screen edge
    { let si = -1, sd = 1e9; for (let i = 0; i < signs.length; i++) { const d = Math.hypot(signs[i].position.x - hx, signs[i].position.z - hz); if (d < sd) { sd = d; si = i; } }
      for (let i = 0; i < signs.length; i++) { const s = signs[i]; s.material.opacity = i === si ? clamp(1.6 - sd / 12, 0, 1) : 0; s.visible = s.material.opacity > 0.02; } }

    // the Use button: talk / open / enter / parley from the sim, or a door into the town's menus
    if (frameN % 2 === 0) { refreshUse(hx, hz); useBtn.hidden = !useAct || paused; }
    // the objective beacon
    if (frameN % 20 === 1) {
      const tp = api.target();
      if (tp && !inDlg) {
        beaconOn = true; beacon.visible = true; beacon.position.set(tp.x * PX, 3.5, (tp.y + 8) * PX); const lab = tp.lab || "";
        if (lab !== beaconTxt) { beaconTxt = lab; scene.remove(beaconLab); const nl = labelSprite(st, lab || "Here", "your objective"); beaconLab = nl; scene.add(nl); }
        beaconLab.position.set(tp.x * PX, 3.9, (tp.y + 8) * PX); beaconLab.visible = !!lab;
      } else { beaconOn = false; beacon.visible = false; beaconLab.visible = false; }
    }
    if (beacon.visible) { const d = Math.hypot(beacon.position.x - hx, beacon.position.z - hz); beacon.material.opacity = 0.08 * clamp((d - 7) / 12, 0, 1); beacon.visible = beacon.material.opacity > 0.003; beaconLab.material.opacity = clamp((d - 3) / 4, 0, 1); }

    // culling: far chunks off
    if (big && frameN % 6 === 0) streamChunks(hx, hz, 2);
    if (frameN % 8 === 0) for (const c of chunks) { const d = Math.hypot(c.x - hx, c.z - hz); if (!small) c.grp.visible = d < 72; if (c.near) { const nv = d < LODR; c.near.visible = nv; c.far.visible = !nv; } }

    // camera: over the shoulder; in a conversation, frame the speaker; never through a wall
    if (inDlg && !talkTo) { talkTo = nearN && nd < 4 ? nearN : null; dlgCamT = 0; } else if (!inDlg) talkTo = null;
    let cx = hx, cz = hz, dist = 6 * st.distK, side = 0.45, pt = pitch, cy = 0;
    if (talkTo) { dlgCamT = Math.min(1, dlgCamT + dt * 2); const ty = Math.atan2(talkTo.x - hx, talkTo.z - hz); yaw = angLerp(yaw, ty + Math.PI + 0.45, dt * 2); cx = lerp(hx, talkTo.x, 0.7); cz = lerp(hz, talkTo.z, 0.7); dist = lerp(dist, 3.4, dlgCamT); pt = lerp(pitch, 0.1, dlgCamT); side = 0.15; cy = -1.0 * dlgCamT; }
    // pull in when a building or cave wall sits between the hero and the camera
    { const bx = Math.sin(yaw) * Math.cos(pt), bz = Math.cos(yaw) * Math.cos(pt); let free = dist;
      for (let s = 0.8; s < dist; s += 0.45) { const h = solidAtW(cx + bx * s, cz + bz * s); if (h > 0 && 1.2 + s * Math.sin(pt) < h) { free = Math.max(1.6, s - 0.4); break; } }
      dist = Math.min(dist, free); }
    followCam(camera, cx, cy, cz, yaw, pt, dist, side, dt);
    if (!cave) { L.sun.position.set(hx + 30, 42, hz + 22); L.sun.target.position.set(hx, 0, hz); }
    if (K2v) K2v.tick(dt, hx, hz, heroYaw);
  });

  return {
    me, A, npcs, exits, doors, foes,
    near: () => (useAct ? (useAct.door ? useAct.door.key : "npc:" + (useAct.n || "")) : null),
    goTo(key) { // test hook: stand beside an NPC (by id or name) or a door; the sim position is moved, nothing else
      const n = A.npcs.find((q) => q.id === key || q.name === key); if (n) { A.p.x = n.px; A.p.y = n.py + 12; return true; }
      const d = doors.find((q) => q.key === key); if (d) { A.p.x = d.x / PX; A.p.y = d.z / PX; return true; } return false; },
    face() { return { x: Math.sin(heroYaw), y: Math.cos(heroYaw) }; },
    // light auto-target: the closest foe in front within reach (strike) or bow range (shot)
    aim(range) {
      let best = null, bs = 1e9; const fx = Math.sin(heroYaw), fz = Math.cos(heroYaw), r = range || 34;
      for (const e of A.en) { if (e.dead || e.gone || e.yield) continue; const ddx = e.x - A.p.x, ddy = e.y - A.p.y, d = Math.hypot(ddx, ddy); if (d > r || d < 1) continue; const c = (ddx * fx + ddy * fz) / d; if (c < (range ? 0.55 : -0.2)) continue; const sc = d * (1.6 - c); if (sc < bs) { bs = sc; best = { x: ddx / d, y: ddy / d }; } }
      if (best) heroYaw = Math.atan2(best.x, best.y);
      return best || { x: fx, y: fz };
    },
    state: () => ({ x: A.p.x, y: A.p.y, hp: A.p.hp, foes: foes.size, npcs: npcs.length, marks: npcs.filter((o) => o.mark).length, beacon: beaconOn, chunks: chunks.length, doors: doors.length, use: useAct ? useAct.l + "|" + (useAct.n || "") : "", frames: st.frames, dlg: api.inDlg() })
  };
}
