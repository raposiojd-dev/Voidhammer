// Voidhammer: The Shattered Realms. The off-map places in 3D: Ashford, every hub, town, village and castle area,
// the roads, caves, camps, the builder's yard and the overland walk.
// This module only draws. The existing area simulation in index.html (AR: movement, collision, enemies, quests,
// chests, exits, dialogue) runs exactly as before; the bridge hands this module a read-only view of it plus a few
// input calls (move, strike, talk, shoot). So every quest, flag, number and save key is untouched.
// One sim pixel is PX metres; one 16 px tile is T metres. Sim x runs east (+x), sim y runs south (+z).
import { K3 } from "./scene3d.js";
import { Merge, paintedSky, grassField, groundMat } from "./art.js";
import { BARKS } from "./barks.js";
const { THREE, REALMS, VOIDC, GROUND_TEX, GRASS_TINT, CLOUD, COLD, tree, rng, vnoise, clamp, lerp, angLerp, shade, mix,
  makeStage, makeKit, whenChars, heroLook, kaelLook, figure, animFigure, Batch, lights, particles, pool, torch, followCam, moveIntent, labelSprite, radialTex, esc } = K3;

export const T = 1.35, PX = T / 16;
const CH = 24; // tiles per culling chunk
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
#vh3d .v3-use{position:absolute;left:50%;bottom:calc(1.4rem + env(safe-area-inset-bottom,0px));transform:translateX(-50%);min-width:11rem;max-width:62vw;padding:.95rem 1.4rem;border-radius:999px;border:2px solid #e3c27a;background:radial-gradient(circle at 50% 30%,#4a3214,#1a1208 70%);color:#fff2cf;font:700 1rem 'Cinzel',Georgia,serif;letter-spacing:.06em;text-shadow:0 1px 2px #000;box-shadow:0 0 22px #c8873a77,0 6px 18px #000;cursor:pointer;touch-action:none;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#vh3d .v3-use small{display:block;font:500 .66rem 'IBM Plex Mono',monospace;letter-spacing:.12em;color:#e8d8a8;opacity:.85;margin-top:.1rem;text-transform:uppercase}
#vh3d .v3-use:active{transform:translateX(-50%) scale(.96)}
#vh3d .v3-use[hidden]{display:none}
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
#vh3d .v3-nm{color:#f4e3b8;font:600 .74rem 'Cinzel',Georgia,serif;letter-spacing:.04em;border-color:#8a6a30aa;background:#0c0906b8}
`;
  document.head.appendChild(st);
}

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
    whenChars(() => {
      if (ctl.off || ctl.st !== st || api.AR() !== A) return;
      try { ctl.w = buildArea(st, api, A); ctl.ready = true; }
      catch (e) { api.fail(e); finish("fail"); }
    });
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
  const cave = !!info.cave, over = !!sp.over;
  const P = REALMS[info.realm] || REALMS.ember, kit = makeKit(st), { scene, camera, inp } = st, rand = rng((A.id || "a") + "|3d");
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
    scene.fog = new THREE.FogExp2(0x0a080e, 0.06);
    const hemi = new THREE.HemisphereLight(0x8a8ab0, 0x1a1418, 0.55); scene.add(hemi);
    const sun = new THREE.DirectionalLight(0x9a8ac0, 0.35); sun.position.set(centre.x + 10, 30, centre.z + 8); sun.target.position.copy(centre); scene.add(sun, sun.target);
    L = { hemi, sun };
  } else {
    scene.fog = new THREE.FogExp2(P.fog, over ? 0.02 : 0.014 + info.voidNear * 0.006);
    L = lights(st, P, centre, 26, { dim: info.realm === "shadow" || info.realm === "spirit", cold: COLD[info.realm] });
    const sky = paintedSky(P.sky, mix(P.fog, 0xffffff, 0.12), L.sun.position.clone().sub(centre), L.sun.color, info.voidNear, VOIDC, CLOUD[info.realm]); scene.add(sky);
    L.sky = sky;
  }
  // the hero carries a lantern underground
  const lantern = cave ? new THREE.PointLight(0xffb070, 30, 14, 1.6) : null; if (lantern) scene.add(lantern);

  // ---------- ground: one vertex per tile corner, coloured by tile ----------
  const gg = new THREE.PlaneGeometry(W * T, H * T, W, H); gg.rotateX(-Math.PI / 2); gg.translate(W * T / 2, 0, H * T / 2);
  { const pos = gg.attributes.position, uv = gg.attributes.uv, n = pos.count, col = new Float32Array(n * 3), bl = new Float32Array(n), c = new THREE.Color(), tmp = new THREE.Color();
    for (let i = 0; i < n; i++) {
      const ix = i % (W + 1), j = Math.floor(i / (W + 1)); let r = 0, gr = 0, b = 0, k = 0, blend = 0, wet = 0;
      for (let dy = -1; dy <= 0; dy++) for (let dx = -1; dx <= 0; dx++) {
        const tx = ix + dx, ty = j + dy; if (tx < 0 || ty < 0 || tx >= W || ty >= H) continue;
        const t = g[ty][tx], v = vnoise(tx * 0.7, ty * 0.7);
        if (t === 1) { tmp.copy(cPath); blend += 1; } else if (t === 9) { tmp.copy(cPlaza); blend += 1; } else if (t === 3) { tmp.copy(cWater).multiplyScalar(0.35); wet++; }
        else if (t === 2 && cave) tmp.copy(cTree2).multiplyScalar(0.8); else if (t === 2) tmp.copy(cG0).lerp(cTree, 0.35); else tmp.copy(v > 0.5 ? cG1 : cG0);
        if (over && sp.reg && api.regTint) { const rt = api.regTint(sp.reg[ty * W + tx]); if (rt !== null && rt !== undefined) tmp.lerp(c.set(rt), 0.22); }
        r += tmp.r; gr += tmp.g; b += tmp.b; k++;
      }
      k = k || 1; const nz = 0.86 + vnoise(ix * 0.31, j * 0.31) * 0.28;
      col[i * 3] = r / k * nz; col[i * 3 + 1] = gr / k * nz; col[i * 3 + 2] = b / k * nz; bl[i] = Math.min(0.9, blend / k * 1.1);
      if (wet === k && k > 0) pos.setY(i, -0.35);
      uv.setXY(i, pos.getX(i) / 3.5, pos.getZ(i) / 3.5);
    }
    gg.setAttribute("color", new THREE.BufferAttribute(col, 3)); gg.setAttribute("aBlend", new THREE.BufferAttribute(bl, 1)); gg.computeVertexNormals(); }
  const GT = cave ? "dirt" : (GROUND_TEX[info.realm] === "plaster" ? "plaster" : "grass");
  const ground = new THREE.Mesh(gg, groundMat(art, GT, cave ? "stone" : info.type && info.type !== "village" ? "cobble" : "dirt", !cave && info.realm !== "frost" && info.realm !== "light")); ground.receiveShadow = true; scene.add(ground);
  st.track(gg);
  // the land beyond the edge: low hills, so the horizon is never empty
  if (!cave) {
    const S2 = Math.max(W, H) * T + 220, sg = new THREE.PlaneGeometry(S2, S2, 70, 70); sg.rotateX(-Math.PI / 2); sg.translate(W * T / 2, -0.06, H * T / 2);
    const pos = sg.attributes.position, uv = sg.attributes.uv, col = [], c = new THREE.Color();
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), z = pos.getZ(i), ox = Math.max(-x, x - W * T, 0), oz = Math.max(-z, z - H * T, 0), o = Math.hypot(ox, oz);
      if (o > 2) pos.setY(i, (vnoise(x * 0.025, z * 0.025) * 0.8 + 0.2) * Math.min(18, o * 0.22) - 0.06);
      c.copy(cG0).lerp(cTree, 0.25).multiplyScalar(0.8 + vnoise(x * 0.05, z * 0.05) * 0.3); col.push(c.r, c.g, c.b); uv.setXY(i, x / 6, z / 6);
    }
    sg.setAttribute("color", new THREE.Float32BufferAttribute(col, 3)); sg.setAttribute("aBlend", new THREE.BufferAttribute(new Float32Array(pos.count), 1)); sg.computeVertexNormals();
    const skirt = new THREE.Mesh(sg, ground.material); skirt.receiveShadow = true; scene.add(skirt); st.track(sg);
    // a far ring of forest on the hills
    const B0 = new Batch(kit);
    for (let i = 0; i < 90; i++) { const a = rand() * Math.PI * 2, R = Math.max(W, H) * T * 0.5 + 14 + rand() * 50, x = W * T / 2 + Math.cos(a) * R, z = H * T / 2 + Math.sin(a) * R; if (x > -2 && x < W * T + 2 && z > -2 && z < H * T + 2) continue; const o = Math.hypot(Math.max(-x, x - W * T, 0), Math.max(-z, z - H * T, 0)); tree(B0, white, x, (vnoise(x * 0.025, z * 0.025) * 0.8 + 0.2) * Math.min(18, o * 0.22) - 0.2, z, 4 + rand() * 5, cTree.getHex(), rand); }
    B0.build(scene);
  }

  // ---------- water ----------
  { const v = []; for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (g[y][x] === 3) { const x0 = x * T, z0 = y * T, x1 = x0 + T, z1 = z0 + T; v.push(x0, 0, z0, x0, 0, z1, x1, 0, z0, x1, 0, z0, x0, 0, z1, x1, 0, z1); }
    if (v.length) {
      const wg = st.track(new THREE.BufferGeometry()); wg.setAttribute("position", new THREE.Float32BufferAttribute(v, 3)); wg.computeVertexNormals();
      const wm = new THREE.MeshStandardMaterial({ color: cWater.clone().multiplyScalar(cave ? 0.6 : 0.85), roughness: 0.12, metalness: 0.35, transparent: true, opacity: 0.86, emissive: cWater, emissiveIntensity: cave ? 0.15 : 0.05 });
      const water = new THREE.Mesh(wg, wm); water.position.y = -0.12; water.receiveShadow = true; scene.add(water);
      st.onFrame = (t) => { wm.emissiveIntensity = (cave ? 0.15 : 0.05) + 0.03 * Math.sin(t * 1.3); };
    } }

  // ---------- chunks: trees, rocks, cave walls, flowers (culled by distance) ----------
  const chunks = [], solidH = new Float32Array(W * H); // tile heights for the camera
  const nCX = Math.ceil(W / CH), nCZ = Math.ceil(H / CH), small = W * H <= 48 * 48;
  const mStone = art.mat("stone"), mPlank = art.mat("planks", { roughness: 0.85 }), mBeam = art.mat("beam", { roughness: 0.85 });
  for (let cz = 0; cz < nCZ; cz++) for (let cx = 0; cx < nCX; cx++) {
    const grp = new THREE.Group(), B = new Batch(kit), M = new Merge(); let any = false;
    for (let y = cz * CH; y < Math.min(H, (cz + 1) * CH); y++) for (let x = cx * CH; x < Math.min(W, (cx + 1) * CH); x++) {
      const t = g[y][x], wx = (x + 0.5) * T, wz = (y + 0.5) * T, r1 = rand(), r2 = rand();
      if (t === 2) {
        any = true;
        if (cave) {
          const h = 1.7 + r1 * 1.1; solidH[y * W + x] = h;
          M.box(mStone, wx, h / 2, wz, T * 1.04, h, T * 1.04, r2 * 0.3, shade(cTree2.getHex(), 0.55 + r1 * 0.3));
          if (r2 < 0.35) B.add("rock", white, wx + (r1 - 0.5) * 0.6, h, wz, 0.9, 0.7, 0.9, r2 * 6, shade(cRock.getHex(), 0.6));
        } else {
          solidH[y * W + x] = 7; // the camera won't sit inside a tree
          const h = 3.6 + r1 * 3.4;
          tree(B, white, wx + (r2 - 0.5) * T * 0.4, 0, wz + (r1 - 0.5) * T * 0.4, h, (r2 < 0.5 ? cTree : cTree2).getHex(), rand);
        }
      } else if (t === 7) { any = true; const s = 0.7 + r1 * 0.6; B.add("rock", white, wx, s * 0.3, wz, s * 1.2, s * 0.9, s * 1.1, r2 * 6, shade(cRock.getHex(), 0.75 + r2 * 0.3)); }
      else if (t === 8 && st.gfx !== "low") { any = true; for (let k = 0; k < 3; k++) B.add("cone", white, wx + (rand() - 0.5) * T * 0.8, 0.12, wz + (rand() - 0.5) * T * 0.8, 0.12, 0.24, 0.12, 0, [0xd8b040, 0xe8e0d0, 0xb04040, 0x9a70d0][Math.floor(rand() * 4)]); }
    }
    if (!any) continue;
    B.build(grp); M.build(grp, (x) => st.track(x)); scene.add(grp);
    chunks.push({ grp, x: (cx + 0.5) * CH * T, z: (cz + 0.5) * CH * T });
  }

  // ---------- buildings: the 2D town's houses, raised in the Realm's style ----------
  const MH = new Merge(), BH = new Batch(kit);
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
    house(x, z, w, d, ht, kinds[i]);
    for (let y = hy; y < hy + hd; y++) for (let xx = hx; xx < hx + hw; xx++) if (xx >= 0 && y >= 0 && xx < W && y < H) solidH[y * W + xx] = ht + 1.5;
    const kd = KIND[kinds[i]];
    if (kd && info.siteId) {
      const dx = x, dz = (hy + hd) * T + 1.0;
      doors.push({ key: kd[0], label: kd[1], x: dx, z: dz, r: 2.2 });
      const sg = labelSprite(st, kd[1], "go in"); sg.scale.set(3.2, 0.8, 1); sg.position.set(dx, ht + 0.9, dz - 1.2); scene.add(sg); signs.push(sg);
      if (torches.length < 5) torches.push(torch(kit, scene, dx + 1.2, 2.1, (hy + hd) * T + 0.25, P.torch, torches.length < 3 && st.gfx !== "low"));
    }
  });
  // any other solid structure tiles (walls, ruins, pens) become stone blocks
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const t = g[y][x]; if ((t === 4 || t === 5 || t === 6) && !covered[y * W + x]) { const h = cave ? 3.2 : 2.4 + vnoise(x * 0.5, y * 0.5) * 0.8; solidH[y * W + x] = h; MH.box(mStone, (x + 0.5) * T, h / 2, (y + 0.5) * T, T, h, T, 0, shade(cWall.getHex(), 0.75 + vnoise(x, y) * 0.25)); }
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
  MH.build(scene, (x) => st.track(x)); BH.build(scene);

  // ---------- exits: lit posts and a sign where a road leaves; settlements, caves and the yard on the overland ----------
  const exits = [];
  (sp.exits || []).forEach((e) => {
    const x = (e.x + e.w / 2) * T, z = (e.y + e.h / 2) * T, nm = api.exitName(e);
    const o = { e, x, z, parts: [] };
    if (over && e.ovsite) siteMarker(o, api.siteLook(e.ovsite));
    else if (over && e.cave !== undefined) caveMouth(o);
    else if (over && e.yard) { const s = labelSprite(st, "Builders' Yard", "raise a building"); s.scale.set(3, 0.75, 1); s.position.set(x, 3, z); scene.add(s); o.sign = s; signpost(x, z - 0.6); }
    else gatePosts(o, nm);
    exits.push(o);
  });
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
  function caveMouth(o) {
    const { x, z } = o, M = new Merge();
    M.add("cone", mStone, x - 1.6, 1.3, z - 0.6, 2.2, 2.6, 1.8, 0.3, shade(P.stone, 0.6)); M.add("cone", mStone, x + 1.6, 1.3, z - 0.6, 2.2, 2.6, 1.8, 1.2, shade(P.stone, 0.6)); M.box(mStone, x, 2.5, z - 0.8, 3.6, 1.0, 1.6, 0.05, shade(P.stone, 0.55));
    M.build(scene, (q) => st.track(q));
    const dark = new THREE.Mesh(kit.g.box, kit.mat(0x050408)); dark.scale.set(2, 2.2, 0.2); dark.position.set(x, 1.1, z - 0.9); scene.add(dark);
    const s = labelSprite(st, "A cave", "go down"); s.scale.set(3, 0.75, 1); s.position.set(x, 4.2, z); scene.add(s); o.sign = s;
    o.pool = pool(kit, scene, x, z + 0.5, 0xb8a8ff, 3.5, 0.35);
  }

  // ---------- people: NPCs, chests, gates and cells ----------
  const markTex = [null, markerTex("!", "#ffd84a"), markerTex("?", "#9fd8ff")];
  function markerTex(ch, col) {
    const c = document.createElement("canvas"); c.width = c.height = 128; const x = c.getContext("2d");
    const gr = x.createRadialGradient(64, 64, 4, 64, 64, 62); gr.addColorStop(0, col + "aa"); gr.addColorStop(1, col + "00"); x.fillStyle = gr; x.fillRect(0, 0, 128, 128);
    x.font = "900 96px Georgia, serif"; x.textAlign = "center"; x.textBaseline = "middle"; x.lineWidth = 10; x.strokeStyle = "#1a1209"; x.strokeText(ch, 64, 70); x.fillStyle = col; x.fillText(ch, 64, 70);
    const t = st.track(new THREE.CanvasTexture(c)); t.colorSpace = THREE.SRGBColorSpace; return t;
  }
  const npcs = [];
  A.npcs.forEach((n) => {
    const x = n.px * PX, z = n.py * PX, o = { n, x, z, obj: null, mark: null, mk: -1, label: null };
    if (n.chest) o.obj = chest(x, z);
    else if (n.gate) o.obj = portal(x, z);
    else if (n.cell) o.obj = cage(x, z);
    else if (n.draw) o.obj = signpost(x, z);
    else {
      const nm = n.name || "", female = FEMALE.test(nm), cloth = hex(n.col, 0x6a5a4a), hair = hex(n.hair, 0x3a2a18);
      let ch;
      if (/kaelren/i.test(nm)) ch = kaelLook(false);
      else if (/elyndra/i.test(nm)) ch = { base: "woman", hood: 0xd8d8e0, cloth: 0xc8c8d0, cloth2: 0x8a90a8, legs: 0x4a4a58, skin: 0xe0c8b0, hair: 0xd8d0c0, lantern: 0xc8e0ff };
      else ch = { base: female ? "woman" : /smith|guard|captain|sergeant|warden|marshal|knight/i.test(nm) ? "soldier" : "man", cloth, cloth2: shade(cloth, 0.6).getHex(), hood: shade(cloth, 0.75).getHex(), legs: 0x3a2e24, hair, skin: [0xd8b090, 0xb88a68, 0x8a5a3a, 0xc89a78][Math.floor(rand() * 4)], metal: 0x8a8e94, weapon: /smith/i.test(nm) ? "axe" : null, scale: n.small ? 0.68 : 0.94 + rand() * 0.1 };
      const f = figure(kit, { ch, cloth: ch.cloth, cloth2: ch.cloth2, skin: ch.skin }); f.position.set(x, 0, z); f.rotation.y = rand() * 0.6 - 0.3; scene.add(f); o.obj = f; o.fig = f;
    }
    npcs.push(o);
  });
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
  const beacon = new THREE.Mesh(st.track(new THREE.CylinderGeometry(0.3, 0.55, 22, 10, 1, true)), new THREE.MeshBasicMaterial({ color: 0xffe0a0, transparent: true, opacity: 0.08, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, fog: false }));
  beacon.position.y = 11; beacon.visible = false; scene.add(beacon);
  let beaconLab = labelSprite(st, " ", ""), beaconTxt = " "; beaconLab.visible = false; scene.add(beaconLab);

  // particles (ash, snow, motes) and the Void glow on the horizon
  const fx = cave ? particles(st, "dust", 120, 40, 6) : particles(st, P.fx, info.realm === "frost" ? 400 : 200, 70, info.realm === "storm" ? 18 : 12, P.fxc); scene.add(fx);
  if (!cave && info.voidNear > 0.15) { const vs = new THREE.Sprite(new THREE.SpriteMaterial({ map: kit.coldTex, color: VOIDC, transparent: true, opacity: 0.5 * info.voidNear, depthWrite: false, blending: THREE.AdditiveBlending, fog: false })); vs.scale.set(120, 60, 1); vs.position.set(W * T / 2 - 40, 20, -150); scene.add(vs); }
  // grass tufts on High
  if (!cave && st.gfx !== "low") {
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
  const top = st.$(".v3-top");
  top.innerHTML = '<button data-v="run">Run</button><button data-v="auto">Auto-run</button>' + (info.siteId ? '<button data-v="menu">' + esc(info.menuLabel || "Town menu") + "</button>" : "");
  st.gfxButton();
  setTimeout(() => { const kk = st.$(".v3-keys"); if (kk) kk.style.cssText += ";transition:opacity 1s;opacity:0"; }, 14000);
  st.$(".v3-keys").innerHTML = "WASD move · Shift run · drag or arrows: look<br>E talk / open · Space strike · K shoot · L cast · Esc: map";
  let running = false, autoRun = false, useAct = null, hintShown = false;
  try { hintShown = localStorage.getItem("vh3d-hint-area") === "1"; } catch (e) {}
  st.listen(root, "click", (e) => {
    const b = e.target.closest("[data-v]"); if (!b) return; const v = b.getAttribute("data-v"); e.stopPropagation();
    if (v === "run") { running = !running; b.classList.toggle("on", running); }
    else if (v === "auto") { autoRun = !autoRun; b.classList.toggle("on", autoRun); if (autoRun) st.msg("Auto-run: steer with the camera. Touch the stick to take over.", 2.6); }
    else if (v === "menu") api.openPlace(null);
  });
  st.listen(useBtn, "pointerdown", (e) => { e.stopPropagation(); e.preventDefault(); doUse(); });
  function doUse() { if (!useAct) return; if (useAct.door) { api.sfx("door"); inp.keys = {}; api.openPlace(useAct.door.key); } else api.use(); }
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

  st.start((dt, t) => {
    frameN++;
    const p = A.p, inDlg = api.inDlg(), paused = api.sheetOpen() || inDlg;
    if (st.onFrame) st.onFrame(t);
    torches.forEach((x) => x.tick(t)); kit.tickStatics(dt);
    fx.userData.tick(dt, me.position.x, me.position.z); if (L.sky) L.sky.userData.tick(dt, camera.position.x, camera.position.z);
    for (const k of sparks) if (k.s.visible) { k.t -= dt; k.s.scale.setScalar(0.5 + (0.28 - k.t) * 3); k.s.material.opacity = k.t * 3.5; if (k.t <= 0) k.s.visible = false; }

    // input: camera-relative intent becomes the sim's move vector
    yaw -= inp.turn * 0.006; inp.turn = 0; pitch = clamp(pitch + inp.pitch * 0.003, 0.1, 1.05); inp.pitch = 0;
    const k = inp.keys; if (k.arrowleft || k.q) yaw += dt * 2.2; if (k.arrowright || k.r) yaw -= dt * 2.2;
    let mv = moveIntent(inp, yaw);
    if (autoRun && mv.amt < 0.05) mv = { x: -Math.sin(yaw), z: -Math.cos(yaw), amt: 1 };
    if (inp.stick.on && autoRun) { autoRun = false; const b = st.root.querySelector("[data-v=auto]"); if (b) b.classList.remove("on"); }
    const sprint = (k.shift || running) ? 1.35 : 1;
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
    if (lantern) lantern.position.set(hx, 2.2, hz);

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
      if (o.mark) { o.mark.position.set(o.x, (n.small ? 2.3 : 2.95) + Math.sin(t * 3 + o.x) * 0.12, o.z); o.mark.visible = vis; }
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
    // names over the nearest three people
    byD.length = 0; for (const o of npcs) if (o.d < 8) byD.push(o); byD.sort((a, b) => a.d - b.d);
    for (let i = 0; i < nameEls.length; i++) {
      const el = nameEls[i], o = byD[i];
      if (!o || paused) { el.hidden = true; continue; }
      if (el._o !== o) { el._o = o; el.textContent = o.n.name; }
      if (proj(o.x, o.n.small ? 1.75 : 2.25, o.z, el)) { el.style.transform += " translate(-50%,-100%)"; el.style.opacity = clamp(1.6 - o.d / 6, 0.35, 1).toFixed(2); }
    }
    // foes (create lazily near the player), items, missiles, effects
    syncFoes(dt, t, hx, hz);
    syncItems(t); syncProj(); syncFx();
    // exits: soft pulse; locked ones dim
    if (frameN % 15 === 0) for (const o of exits) { let lk = ""; try { lk = o.e.lock ? o.e.lock() : ""; } catch (e) {} o.locked = !!lk; if (o.veil) o.veil.material.color.set(lk ? 0xff6a5a : 0xfff0c0); if (o.sign) o.sign.material.opacity = lk ? 0.45 : 1; }
    for (const o of exits) { if (o.veil) o.veil.material.opacity = (o.locked ? 0.06 : 0.1) + 0.06 * Math.sin(t * 3 + o.x); if (o.flag) o.flag.rotation.y = Math.sin(t * 1.7 + o.x) * 0.25; if (o.sign) { const d = Math.hypot(o.x - hx, o.z - hz); o.sign.visible = d < (over ? 70 : 40); } }
    for (const s of signs) { const d = Math.hypot(s.position.x - hx, s.position.z - hz); s.material.opacity = clamp(1.6 - d / 12, 0, 1); s.visible = s.material.opacity > 0.02; }

    // the Use button: talk / open / enter / parley from the sim, or a door into the town's menus
    if (frameN % 2 === 0) {
      const u = api.useInfo(); nearDoor = null;
      if (!u && doors.length) { let bd = 9; for (const dr of doors) { const d = Math.hypot(dr.x - hx, dr.z - hz); if (d < dr.r && d < bd) { bd = d; nearDoor = dr; } } }
      const act = u ? { l: u.l, n: u.n } : nearDoor ? { l: "Go in", n: nearDoor.label, door: nearDoor } : null;
      const key = act ? act.l + "|" + act.n : "";
      if (key !== (useBtn._k || "")) { useBtn._k = key; useBtn.innerHTML = act ? esc(act.l) + (act.n ? "<small>" + esc(act.n) + "</small>" : "") : ""; }
      useAct = act; useBtn.hidden = !act || paused;
    }
    // the objective beacon
    if (frameN % 20 === 1) {
      const tp = api.target();
      if (tp && !inDlg) {
        beacon.visible = true; beacon.position.set(tp.x * PX, 11, (tp.y + 8) * PX); const lab = tp.lab || "";
        if (lab !== beaconTxt) { beaconTxt = lab; scene.remove(beaconLab); const nl = labelSprite(st, lab || "Here", "your objective"); beaconLab = nl; scene.add(nl); }
        beaconLab.position.set(tp.x * PX, 3.9, (tp.y + 8) * PX); beaconLab.visible = !!lab;
      } else { beacon.visible = false; beaconLab.visible = false; }
    }
    if (beacon.visible) { const d = Math.hypot(beacon.position.x - hx, beacon.position.z - hz); beacon.material.opacity = 0.02 + 0.07 * clamp((d - 4) / 14, 0, 1); beaconLab.material.opacity = clamp((d - 3) / 4, 0, 1); }

    // culling: far chunks off
    if (!small && frameN % 8 === 0) for (const c of chunks) c.grp.visible = Math.hypot(c.x - hx, c.z - hz) < 72;

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
    state: () => ({ x: A.p.x, y: A.p.y, hp: A.p.hp, foes: foes.size, npcs: npcs.length, marks: npcs.filter((o) => o.mark).length, beacon: beacon.visible, chunks: chunks.length, doors: doors.length, use: useAct ? useAct.l + "|" + (useAct.n || "") : "", frames: st.frames, dlg: api.inDlg() })
  };
}
