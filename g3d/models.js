// Detailed models for the third-person scenes (Medium and High; Low keeps the built-in simple shapes).
// Quaternius CC0 packs, rebuilt by assets/models/build-models.mjs into small meshopt-compressed bundles:
//   nature.glb  trees for every biome, bushes, rocks, grass, flowers, ferns, stumps, logs
//   village.glb timber-framed cottages, inn, smithy, stable, mill, sawmill, well, market stalls, cart, barrels, crates,
//               fences, bonfire, hay, benches, sacks, cauldron
//   castle.glb  curtain wall, gatehouse, towers, banner
//   horse.glb   a rigged horse with Idle, Walk, Gallop and Death
// Every static model is ONE vertex-coloured primitive (so a whole tree or cottage is one instanced draw call). A per-vertex
// role (wood, plaster, roof, stone, window, foliage, cloth, fire) lets each Realm recolour roofs, walls and leaves to its
// canon palette. Bundles load lazily, only when a scene needs them; nothing here blocks if a file is missing.
import * as THREE from "./three.module.min.js";
import { GLTFLoader } from "./lib/GLTFLoader.js";
import { MeshoptDecoder } from "./lib/meshopt_decoder.module.js";
import { VH_TIME } from "./art.js";

const LOAD = {}, LIB = {};
let loader = null;
export function loadPack(name) {
  if (LOAD[name]) return LOAD[name];
  if (!loader) { loader = new GLTFLoader(); loader.setMeshoptDecoder(MeshoptDecoder); }
  const url = new URL("./assets/models/" + name + ".glb", import.meta.url).href;
  LOAD[name] = loader.loadAsync(url).then((g) => {
    const geo = {}, info = {};
    g.scene.updateMatrixWorld(true);
    g.scene.traverse((o) => {
      if (!o.isMesh || o.isSkinnedMesh) return;
      const s = o.geometry, out = new THREE.BufferGeometry();
      // quantised positions sit in [-1, 1] with the scale on the node: expand to floats before baking the node in
      const p = s.attributes.position, f = new Float32Array(p.count * 3);
      for (let i = 0; i < p.count; i++) { f[i * 3] = p.getX(i); f[i * 3 + 1] = p.getY(i); f[i * 3 + 2] = p.getZ(i); }
      out.setAttribute("position", new THREE.BufferAttribute(f, 3));
      const c = s.attributes.color, cf = new Float32Array(p.count * 3);
      for (let i = 0; i < p.count; i++) { cf[i * 3] = c ? c.getX(i) : 1; cf[i * 3 + 1] = c ? c.getY(i) : 1; cf[i * 3 + 2] = c ? c.getZ(i) : 1; }
      out.setAttribute("color", new THREE.BufferAttribute(cf, 3));
      if (s.attributes._role) {
        out.setAttribute("_role", s.attributes._role);
        // flames (the fire role) are white in the source: make them hot, so they glow under the bloom
        const ro = s.attributes._role; for (let i = 0; i < p.count; i++) if (ro.getX(i) === 8) { const k = 0.8 + cf[i * 3] * 0.6; cf[i * 3] = 1.9 * k; cf[i * 3 + 1] = 0.85 * k; cf[i * 3 + 2] = 0.25 * k; }
      }
      out.setIndex(s.index); out.applyMatrix4(o.matrixWorld); out.computeVertexNormals(); fixNormals(out); out.computeBoundingSphere(); out.computeBoundingBox();
      const k = o.name; geo[k] = out; info[k] = Object.assign({}, o.userData || {});
    });
    LIB[name] = { geo, info, gltf: g };
    return LIB[name];
  });
  LOAD[name].catch((e) => { if (window.console) console.log("vh3d: model pack " + name + " unavailable", e && e.message); });
  return LOAD[name];
}
// smooth shading reads the stored normals: a degenerate corner gives a zero or NaN normal, which turns black under the
// bloom; point those up instead
function fixNormals(g) {
  const n = g.attributes.normal; if (!n) return; const a = n.array;
  for (let i = 0; i < a.length; i += 3) { const L = Math.hypot(a[i], a[i + 1], a[i + 2]); if (!(L > 1e-6) || !isFinite(L)) { a[i] = 0; a[i + 1] = 1; a[i + 2] = 0; } }
  n.needsUpdate = true;
}
export function packReady(name) { return !!LIB[name]; }
export function pack(name) { return LIB[name] || null; }
// wait for several packs (or give up after ms); never rejects
export function loadPacks(names, ms) {
  return new Promise((res) => { let left = names.length; if (!left) { res(); return; } const done = () => { if (--left <= 0) res(); }; names.forEach((n) => loadPack(n).then(done, done)); setTimeout(res, ms || 12000); });
}

// ---------- Realm recolouring ----------
// role: 0 other, 1 wood, 2 plaster, 3 roof, 4 stone, 5 window, 6 foliage, 7 cloth, 8 fire.
// targets: { 1: hex, 2: hex, ... } — each vertex keeps its own light/dark detail relative to its role's average.
const RC = {};
export function recoloured(packName, key, targets, cacheKey) {
  const P = LIB[packName]; if (!P || !P.geo[key]) return null;
  const ck = packName + "|" + key + "|" + cacheKey; if (RC[ck]) return RC[ck];
  const src = P.geo[key], g = src.clone(), col = g.attributes.color, role = g.attributes._role;
  if (role && targets) {
    const sum = new Float32Array(9), n = new Float32Array(9);
    for (let i = 0; i < col.count; i++) { const r = role.getX(i), l = col.getX(i) * 0.3 + col.getY(i) * 0.59 + col.getZ(i) * 0.11; sum[r] += l; n[r]++; }
    const tc = {}, c = new THREE.Color(); for (const r in targets) if (targets[r] !== undefined && targets[r] !== null) tc[r] = c.set(targets[r]).clone();
    for (let i = 0; i < col.count; i++) {
      const r = role.getX(i), t = tc[r]; if (!t) continue;
      const l = col.getX(i) * 0.3 + col.getY(i) * 0.59 + col.getZ(i) * 0.11, k = Math.min(1.45, Math.max(0.55, n[r] ? l / (sum[r] / n[r]) : 1));
      col.setXYZ(i, t.r * k, t.g * k, t.b * k);
    }
    col.needsUpdate = true;
  }
  g.userData.info = P.info[key]; RC[ck] = g; return g;
}
// bake the fire role into a hot colour (it reads as a flame under bloom)
export const FIRE = 0xff8a2a;

// ---------- materials ----------
// one vertex-coloured material per scene; trees and plants get a gentle sway (tips move, roots stay), driven by VH_TIME
export function modelMats(track, gfx) {
  const base = { vertexColors: true, flatShading: false, roughness: 0.9, metalness: 0 };
  const solid = track(new THREE.MeshStandardMaterial(base)); solid.defines = { VH_MACRO: "" };
  const sway = track(new THREE.MeshStandardMaterial(base)); sway.defines = { VH_MACRO: "" };
  if (gfx !== "low") {
    sway.onBeforeCompile = (sh) => {
      sh.uniforms.vhT = VH_TIME;
      sh.vertexShader = "uniform float vhT;\n" + sh.vertexShader.replace("#include <begin_vertex>", "#include <begin_vertex>\n#ifdef USE_INSTANCING\n  { float ph = instanceMatrix[3].x * 0.37 + instanceMatrix[3].z * 0.23; float k = max(position.y - 0.25, 0.0); k *= k; transformed.x += (sin(vhT * 1.1 + ph) * 0.035 + sin(vhT * 2.7 + ph * 1.9) * 0.012) * k; transformed.z += cos(vhT * 0.9 + ph) * 0.025 * k; }\n#endif");
    };
    sway.customProgramCacheKey = () => "vh-model-sway";
  }
  const glow = track(new THREE.MeshStandardMaterial(Object.assign({}, base, { emissive: 0xffffff, emissiveIntensity: 0.0 })));
  return { solid, sway, glow };
}

// ---------- biomes: which trees grow in which Realm ----------
const BIOME = {
  ember: { trees: ["autumn1", "autumn2", "pine1", "dead1", "broad3"], w: [3, 3, 2, 1, 1], bush: ["bush1", "bush2"], rock: ["rock1", "rock2"], tint: 0xffe2c0 },
  stone: { trees: ["pine1", "pine2", "pine3", "broad2"], w: [3, 3, 2, 1], bush: ["bush1"], rock: ["rock1", "rock2", "rockmoss"], tint: 0xf0f2e8 },
  storm: { trees: ["pine2", "pine3", "broad1", "broad2"], w: [3, 2, 2, 2], bush: ["bush1", "bush2"], rock: ["rockmoss", "rock2"], tint: 0xe4f0e8 },
  light: { trees: ["birch1", "birch2", "broad1", "broad2"], w: [3, 2, 2, 2], bush: ["bush2", "bush1"], rock: ["rock1", "rock2"], tint: 0xfff4d0 },
  frost: { trees: ["snowpine1", "snowpine2", "snowbirch", "deadsnow"], w: [4, 3, 2, 1], bush: ["bushsnow"], rock: ["rocksnow"], tint: 0xffffff },
  spirit: { trees: ["willow1", "willow2", "birch1", "birch2"], w: [3, 2, 2, 2], bush: ["bush1"], rock: ["rockmoss"], tint: 0xdce8f0 },
  shadow: { trees: ["dead1", "dead2", "pine3", "willow2"], w: [3, 2, 2, 1], bush: ["bush1"], rock: ["rock2", "rockmoss"], tint: 0xb8b8d0 },
  metal: { trees: ["dead1", "pine1", "pine3", "autumn2"], w: [2, 3, 2, 1], bush: ["bush1"], rock: ["rock1", "rock2"], tint: 0xe8d8cc },
  march: { trees: ["broad1", "broad2", "broad3", "pine1", "pine2"], w: [3, 3, 2, 2, 2], bush: ["bush1", "bush2"], rock: ["rock1", "rockmoss"], tint: 0xffffff }
};
let biome = BIOME.march;
export function setBiome(realm) { biome = BIOME[realm] || BIOME.march; }
export function biomeOf() { return biome; }
export function pickW(list, w, r) { let t = 0; for (let i = 0; i < list.length; i++) t += (w ? w[i] : 1); let x = r * t; for (let i = 0; i < list.length; i++) { x -= (w ? w[i] : 1); if (x <= 0) return list[i]; } return list[list.length - 1]; }

// register the nature models as instanced geometries on a scene kit (kit.g["m:broad1"], ...) so Batch can use them
export function kitModels(kit, gfx, track) {
  if (gfx === "low" || kit.mm) return !!kit.mm;
  const N = LIB.nature; if (!N) return false;
  kit.mm = modelMats(track || ((x) => x), gfx);
  for (const pk of ["nature", "village", "castle", "dungeon"]) if (LIB[pk]) for (const k in LIB[pk].geo) kit.g["m:" + k] = LIB[pk].geo[k];
  return true;
}

// one model tree (instanced through Batch): h is the height wanted, tc the scene's tree colour (a light tint toward it)
export function modelTree(B, x, y, z, h, tc, rand) {
  const kit = B.kit, k = pickW(biome.trees, biome.w, rand()), info = LIB.nature.info[k] || {}, s = h * (0.85 + rand() * 0.3);
  const c = new THREE.Color(biome.tint); if (tc !== undefined && tc !== null) c.lerp(new THREE.Color(tc).multiplyScalar(2.2), 0.18);
  c.multiplyScalar(0.88 + rand() * 0.24);
  const wk = 0.78 + rand() * 0.16; B.add("m:" + k, kit.mm.sway, x, y, z, s * wk, s, s * wk, rand() * Math.PI * 2, c.getHex());
  return info;
}
// small plants never cast shadows (they would cost a second pass for specks nobody sees)
const NOSH = { grass: 1, flowers: 1, fern: 1, bush1: 1, bush2: 1, bushsnow: 1 };
export function modelProp(B, key, mat, x, y, z, s, ry, col) { B.add("m:" + key, mat || B.kit.mm.solid, x, y, z, s, s, s, ry || 0, col, NOSH[key] ? { noShadow: true } : undefined); }
