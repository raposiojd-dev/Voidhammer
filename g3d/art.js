// Art kit for the third-person scenes: procedural surface textures (stone, plaster, timber, thatch, slate,
// cobbles, dirt, grass, cloth), a merged-geometry builder with world-scale UVs, a painted sky with drifting
// cloud, and scattered grass. Everything is generated in the browser, so it adds no download.
// Textures are near-neutral; the Realm colour comes from vertex colours, so one set serves every Realm.
import * as THREE from "./three.module.min.js";
import { mergeGeometries } from "./lib/BufferGeometryUtils.js";

// ---------- graphics setting (Low / Medium / High), kept per device ----------
// Low: no shadows, grass or post, lower resolution. Medium: shadows, grass, height fog, rim light, sway (the old High).
// High: Medium plus post-processing (bloom, FXAA, the Realm's colour grade; g3d/post.js).
const GFX_KEY = "vh3d-gfx";
// High by default everywhere, phones included (John, 1 Nov); a stored choice wins, and Low stays the manual fallback
export function gfxGet(touch) { try { const v = localStorage.getItem(GFX_KEY); if (v === "low" || v === "medium" || v === "high") return v; } catch (e) {} return "high"; }
export function gfxSet(v) { try { localStorage.setItem(GFX_KEY, v); } catch (e) {} }

// ---------- shader patches, applied once to three's built-in mesh shaders ----------
// Every lit or basic mesh gets its world position (vVhW) and, where fog is on, a low ground mist that thickens with distance
// (height fog on top of the scene's distance haze). Opt-in by define: VH_MACRO breaks up flat colour and tiling with a
// large-scale world-space tone and roughness variation; VH_RIM gives figures a warm rim so they read against the background.
// Grass sways with VH_TIME (driven by the stage loop). All of it is a few ALU ops per pixel; no extra textures or passes.
export const VH_TIME = { value: 0 };
let patched = false;
export function patchShaders() {
  if (patched) return; patched = true;
  const L = THREE.ShaderLib;
  const noise = "varying vec3 vVhW;\nfloat vhH(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }\nfloat vhN(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(vhH(i), vhH(i + vec2(1.0, 0.0)), f.x), mix(vhH(i + vec2(0.0, 1.0)), vhH(i + vec2(1.0, 1.0)), f.x), f.y); }\n";
  const vcode = "#include <fog_vertex>\n  { vec4 vhw = vec4(transformed, 1.0);\n  #ifdef USE_INSTANCING\n  vhw = instanceMatrix * vhw;\n  #endif\n  vVhW = (modelMatrix * vhw).xyz; }";
  const hfog = "#include <fog_fragment>\n#ifdef USE_FOG\n  { float vhf = exp(-max(vVhW.y, 0.0) * 0.42) * (1.0 - exp(-vFogDepth * 0.028)) * 0.5; gl_FragColor.rgb = mix(gl_FragColor.rgb, fogColor, clamp(vhf, 0.0, 0.5)); }\n#endif";
  const macro = "#include <map_fragment>\n#ifdef VH_MACRO\n  { vec2 mp = vVhW.xz * 0.09 + vVhW.y * 0.06; float mn = vhN(mp) * 0.6 + vhN(mp * 3.7 + 1.7) * 0.4; diffuseColor.rgb *= 0.86 + 0.28 * mn; }\n#endif";
  const rough = "#include <roughnessmap_fragment>\n#ifdef VH_MACRO\n  roughnessFactor = clamp(roughnessFactor * (0.84 + 0.32 * vhN(vVhW.xz * 0.43 + 3.1)), 0.05, 1.0);\n#endif";
  const rim = "#ifdef VH_RIM\n  { float vr = 1.0 - clamp(dot(normal, normalize(vViewPosition)), 0.0, 1.0); outgoingLight += vec3(1.0, 0.86, 0.66) * (vr * vr * vr * vr) * 0.16 * (0.4 + 0.6 * clamp(dot(outgoingLight, vec3(0.33)) * 3.0, 0.0, 1.0)); }\n#endif\n#include <opaque_fragment>";
  for (const k of ["standard", "physical", "lambert", "phong", "basic"]) {
    const sh = L[k]; if (!sh || sh.vertexShader.indexOf("vVhW") >= 0) continue;
    sh.vertexShader = "varying vec3 vVhW;\n" + sh.vertexShader.replace("#include <fog_vertex>", vcode);
    let f = noise + sh.fragmentShader.replace("#include <fog_fragment>", hfog).replace("#include <map_fragment>", macro);
    if (k === "standard" || k === "physical") f = f.replace("#include <roughnessmap_fragment>", rough).replace("#include <opaque_fragment>", rim);
    sh.fragmentShader = f;
  }
}
patchShaders();

// ---------- tiny noise ----------
function hash2(x, y, s) { let h = Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(s, 2147483647); h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; }
function vn(x, y, s, p) { // tileable value noise, period p
  const ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy, u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
  const w = (a) => ((a % p) + p) % p;
  const a = hash2(w(ix), w(iy), s), b = hash2(w(ix + 1), w(iy), s), c = hash2(w(ix), w(iy + 1), s), d = hash2(w(ix + 1), w(iy + 1), s);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
function fbm(x, y, s, p, oct) { let t = 0, a = 0.5, f = 1, n = 0; for (let i = 0; i < (oct || 4); i++) { t += vn(x * f, y * f, s + i * 17, p * f) * a; n += a; a *= 0.5; f *= 2; } return t / n; }

function canvas(n) { const c = document.createElement("canvas"); c.width = c.height = n; return c; }
// paint per pixel: fn(u, v) -> [r, g, b] in 0..255 (u, v in 0..1)
function paint(n, fn) {
  const c = canvas(n), x = c.getContext("2d"), d = x.createImageData(n, n), p = d.data;
  for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) { const r = fn(i / n, j / n), k = (j * n + i) * 4; p[k] = r[0]; p[k + 1] = r[1]; p[k + 2] = r[2]; p[k + 3] = r[3] === undefined ? 255 : r[3]; }
  x.putImageData(d, 0, 0); return c;
}
const cl = (v) => v < 0 ? 0 : v > 255 ? 255 : v;
const grey = (v, tint) => [cl(v * (tint ? tint[0] : 1)), cl(v * (tint ? tint[1] : 1)), cl(v * (tint ? tint[2] : 1))];

// each texture: one tile covering `size` metres
const MAKERS = {
  stone: [2.4, (n) => paint(n, (u, v) => { // coursed blocks, staggered, with mortar
    const rows = 6, rv = v * rows, row = Math.floor(rv), fv = rv - row, off = (row % 2) * 0.5, cols = 3 + (hash2(row, 0, 3) > 0.5 ? 1 : 0), ru = u * cols + off, col = Math.floor(ru), fu = ru - col;
    const m = Math.min(fu, 1 - fu) * cols * 1.4, mv = Math.min(fv, 1 - fv) * 1.6, mortar = Math.min(m, mv) < 0.06;
    const bk = 0.78 + hash2(col % cols, row, 7) * 0.22, n = fbm(u * 8, v * 8, 2, 8) * 0.35 + fbm(u * 32, v * 32, 4, 32) * 0.15;
    const edge = Math.min(1, Math.min(m, mv) * 6);
    return mortar ? grey(150 + n * 40, [1, 0.98, 0.93]) : grey((150 + 105 * n) * bk * (0.86 + 0.14 * edge), [1, 0.98, 0.95]);
  })],
  ashlar: [3, (n) => paint(n, (u, v) => { // smooth dressed stone, fine joints
    const rows = 4, rv = v * rows, row = Math.floor(rv), fv = rv - row, ru = u * 2 + (row % 2) * 0.5, fu = ru - Math.floor(ru);
    const j = Math.min(fu, 1 - fu) < 0.012 || Math.min(fv, 1 - fv) < 0.02, n = fbm(u * 6, v * 6, 9, 6) * 0.5 + fbm(u * 40, v * 40, 3, 40) * 0.12;
    return grey(j ? 175 : 205 + n * 50, [1, 0.99, 0.96]);
  })],
  brick: [1.6, (n) => paint(n, (u, v) => {
    const rows = 10, rv = v * rows, row = Math.floor(rv), fv = rv - row, ru = u * 4 + (row % 2) * 0.5, col = Math.floor(ru), fu = ru - col;
    const j = Math.min(fu, 1 - fu) < 0.05 || Math.min(fv, 1 - fv) < 0.09, k = 0.8 + hash2(col % 4, row, 5) * 0.25, nn = fbm(u * 16, v * 16, 6, 16) * 0.3;
    return j ? grey(120 + nn * 30) : grey((170 + nn * 80) * k, [1, 0.9, 0.84]);
  })],
  plaster: [3, (n) => paint(n, (u, v) => { const a = fbm(u * 4, v * 4, 11, 4), b = fbm(u * 24, v * 24, 12, 24), s = fbm(u * 3, v * 9 + a, 13, 3); return grey(196 + a * 40 + b * 18 - Math.max(0, s - 0.62) * 120, [1, 0.97, 0.9]); })],
  planks: [1.8, (n) => paint(n, (u, v) => { // vertical boards with grain
    const b = 5, bu = u * b, i = Math.floor(bu), fu = bu - i, gap = Math.min(fu, 1 - fu) < 0.04, k = 0.82 + hash2(i, 1, 21) * 0.25;
    const grain = Math.sin((v * 22 + fbm(u * 10, v * 2, 22 + i, 10) * 6) * Math.PI) * 0.5 + 0.5, knot = fbm(u * 18, v * 6, 23, 18);
    return gap ? grey(60, [1, 0.85, 0.7]) : grey((150 + grain * 40 - Math.max(0, knot - 0.7) * 200) * k, [1, 0.8, 0.6]);
  })],
  beam: [1.2, (n) => paint(n, (u, v) => { const g = Math.sin((u * 30 + fbm(u * 4, v * 12, 31, 4) * 5) * Math.PI) * 0.5 + 0.5; return grey(150 + g * 50 + fbm(u * 30, v * 30, 32, 30) * 30, [1, 0.82, 0.65]); })],
  thatch: [1.6, (n) => paint(n, (u, v) => { // straw strands running down the slope, in rows
    const rows = 5, fv = v * rows - Math.floor(v * rows), s = fbm(u * 64, v * 4, 41, 64), t = fbm(u * 120, v * 2, 42, 120);
    return grey(140 + s * 70 + t * 40 - fv * 55, [1, 0.88, 0.62]);
  })],
  slate: [1.4, (n) => paint(n, (u, v) => { // overlapping slates in rows, each a little different
    const rows = 7, rv = v * rows, row = Math.floor(rv), fv = rv - row, ru = u * 5 + (row % 2) * 0.5, col = Math.floor(ru), fu = ru - col;
    const k = 0.75 + hash2(col % 5, row, 51) * 0.35, gap = Math.min(fu, 1 - fu) < 0.035, sh = 1 - fv * 0.35;
    return grey(gap ? 70 : (150 + fbm(u * 30, v * 30, 52, 30) * 50) * k * sh, [0.95, 0.98, 1]);
  })],
  tile: [1.4, (n) => paint(n, (u, v) => { // curved clay tiles
    const rows = 7, fv = v * rows - Math.floor(v * rows), ru = u * 6 + (Math.floor(v * rows) % 2) * 0.5, fu = ru - Math.floor(ru), c = Math.sin(fu * Math.PI);
    return grey((110 + c * 110) * (1 - fv * 0.3) + fbm(u * 20, v * 20, 61, 20) * 30, [1, 0.78, 0.62]);
  })],
  cobble: [2.4, (n) => paint(n, (u, v) => { // rounded setts via cell noise
    const g = 7, x = u * g, y = v * g, ix = Math.floor(x), iy = Math.floor(y); let d1 = 9, d2 = 9, id = 0;
    for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) { const cx = ix + i, cy = iy + j, wx = ((cx % g) + g) % g, wy = ((cy % g) + g) % g, px = cx + 0.2 + hash2(wx, wy, 71) * 0.6, py = cy + 0.2 + hash2(wx, wy, 72) * 0.6, d = Math.hypot(x - px, y - py); if (d < d1) { d2 = d1; d1 = d; id = hash2(wx, wy, 73); } else if (d < d2) d2 = d; }
    const e = d2 - d1, joint = e < 0.08, n2 = fbm(u * 30, v * 30, 74, 30);
    return joint ? grey(70 + n2 * 30, [1, 0.95, 0.85]) : grey((135 + id * 60 + n2 * 30) * (0.8 + Math.min(1, e * 3) * 0.2), [1, 0.97, 0.92]);
  })],
  dirt: [4, (n) => paint(n, (u, v) => { const a = fbm(u * 5, v * 5, 81, 5), b = fbm(u * 40, v * 40, 82, 40), pb = hash2(Math.floor(u * 90), Math.floor(v * 90), 83) > 0.97 ? 30 : 0; return grey(150 + a * 60 + b * 30 + pb, [1, 0.9, 0.75]); })],
  grass: [6, (n) => paint(n, (u, v) => { // grass with bare patches; tinted per Realm by vertex colour
    const a = fbm(u * 4, v * 4, 91, 4), b = fbm(u * 48, v * 48, 92, 48), c = fbm(u * 96, v * 12, 93, 96), bare = Math.max(0, a - 0.6) * 2.2;
    const gcol = [0.86 + b * 0.2, 1.0 + c * 0.15, 0.62], dcol = [1.05, 0.92, 0.72], t = Math.min(1, bare);
    const l = 150 + b * 60 + c * 30;
    return [cl(l * (gcol[0] * (1 - t) + dcol[0] * t)), cl(l * (gcol[1] * (1 - t) + dcol[1] * t)), cl(l * (gcol[2] * (1 - t) + dcol[2] * t))];
  })],
  cloth: [1, (n) => paint(n, (u, v) => { const w = (Math.sin(u * n * 0.9) * Math.sin(v * n * 0.9)) * 6, s = Math.floor(u * 6) % 2 ? 1 : 0.86, f = fbm(u * 6, v * 6, 101, 6) * 25; return grey(200 * s + w + f); })]
};

export function makeArt(track, quality) {
  const N = quality === "low" ? 256 : 512, cache = {};
  function tex(name) {
    if (cache[name]) return cache[name];
    const [size, mk] = MAKERS[name];
    const cv = mk(name === "cloth" ? 128 : N);
    const t = track(new THREE.CanvasTexture(cv));
    // average brightness in linear light, so materials can undo the darkening and keep the Realm colours true
    { const d = cv.getContext("2d").getImageData(0, 0, cv.width, cv.height).data; let sum = 0, n = 0; for (let i = 0; i < d.length; i += 64) { const l = (d[i] * 0.3 + d[i + 1] * 0.59 + d[i + 2] * 0.11) / 255; sum += Math.pow(l, 2.2); n++; } t.userData.gain = Math.min(2.6, 0.95 / Math.max(0.05, sum / n)); }
    t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = quality === "low" ? 1 : 4;
    t.userData.size = size; cache[name] = t; return t;
  }
  const mats = {};
  // a vertex-coloured, textured material; UVs are in metres so one tile covers `size` metres
  function mat(name, o) {
    const key = name + JSON.stringify(o || {});
    if (mats[key]) return mats[key];
    const m = track(new THREE.MeshStandardMaterial(Object.assign({ map: tex(name), vertexColors: true, roughness: 0.92, metalness: 0 }, o || {})));
    m.defines = { VH_MACRO: "" };
    m.color.setScalar(tex(name).userData.gain); m.userData.size = tex(name).userData.size; mats[key] = m; return m;
  }
  return { tex, mat };
}

// ---------- ground: two textures blended by noise and a per-vertex aBlend (paths, yards), with optional puddles ----------
export function groundMat(art, a, b, puddles) {
  const tA = art.tex(a), tB = art.tex(b);
  const m = new THREE.MeshStandardMaterial({ map: tA, vertexColors: true, roughness: 1, metalness: 0 });
  m.defines = { VH_MACRO: "" };
  m.color.setScalar(tA.userData.gain);
  m.onBeforeCompile = (sh) => {
    sh.uniforms.mapB = { value: tB }; sh.uniforms.gainB = { value: tB.userData.gain / tA.userData.gain }; sh.uniforms.pud = { value: puddles ? 1 : 0 };
    sh.vertexShader = "attribute float aBlend;\nvarying float vBlend;\n" + sh.vertexShader.replace("#include <uv_vertex>", "#include <uv_vertex>\n  vBlend = aBlend;");
    sh.fragmentShader = "uniform sampler2D mapB;\nuniform float gainB, pud;\nvarying float vBlend;\nfloat gh(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }\nfloat gn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(gh(i), gh(i + vec2(1.0, 0.0)), f.x), mix(gh(i + vec2(0.0, 1.0)), gh(i + vec2(1.0, 1.0)), f.x), f.y); }\n" + sh.fragmentShader
      .replace("#include <map_fragment>", `
  vec4 gA = texture2D(map, vMapUv); vec4 gB = texture2D(mapB, vMapUv * 0.83 + 0.37) * gainB;
  float gnz = gn(vMapUv * 0.8) * 0.6 + gn(vMapUv * 3.3) * 0.4;
  float gk = clamp(smoothstep(0.5, 0.78, gnz) * 0.75 + vBlend, 0.0, 1.0);
  diffuseColor *= mix(gA, gB, gk);
  float pd = pud * smoothstep(0.8, 0.86, gn(vMapUv * 1.1 + 7.3)) * clamp(gk * 1.5, 0.0, 1.0);
  diffuseColor.rgb *= 1.0 - pd * 0.5;`)
      .replace("#include <roughnessmap_fragment>", "#include <roughnessmap_fragment>\n  roughnessFactor = mix(roughnessFactor, 0.15, pd);");
  };
  m.customProgramCacheKey = () => "vh-ground-" + (puddles ? 1 : 0);
  return m;
}

// ---------- film grain (a small noise tile the CSS shifts every frame or so) ----------
let GRAIN = null;
export function grainURL() {
  if (GRAIN) return GRAIN;
  const c = canvas(128), x = c.getContext("2d"), d = x.createImageData(128, 128);
  for (let i = 0; i < d.data.length; i += 4) { const v = Math.random() * 255; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 255; }
  x.putImageData(d, 0, 0); GRAIN = c.toDataURL("image/png"); return GRAIN;
}

// ---------- merged geometry with world-scale UVs ----------
const UNIT = {};
function unitGeo(kind) {
  if (UNIT[kind]) return UNIT[kind];
  let g;
  if (kind === "box") g = new THREE.BoxGeometry(1, 1, 1);
  else if (kind === "cyl") g = new THREE.CylinderGeometry(0.5, 0.5, 1, 12);
  else if (kind === "cyl6") g = new THREE.CylinderGeometry(0.5, 0.5, 1, 6);
  else if (kind === "cyl24") g = new THREE.CylinderGeometry(0.5, 0.5, 1, 24);
  else if (kind === "cone") g = new THREE.ConeGeometry(0.5, 1, 10);
  else if (kind === "prism") { // x in [-0.5, 0.5], y in [0, 1], ridge along z
    const v = [-0.5, 0, 0.5, 0.5, 0, 0.5, 0, 1, 0.5, -0.5, 0, -0.5, 0, 1, -0.5, 0.5, 0, -0.5];
    const idx = [0, 1, 2, 5, 3, 4, 3, 0, 2, 3, 2, 4, 1, 5, 4, 1, 4, 2, 3, 5, 1, 3, 1, 0];
    g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(v, 3)); g.setIndex(idx);
  }
  g = g.index ? g.toNonIndexed() : g; g.computeVertexNormals();
  UNIT[kind] = g; return g;
}
export class Merge {
  constructor() { this.groups = new Map(); }
  // kind: unit shape; m: material from art.mat (or any material with userData.size); position, size, yaw, extra x tilt, colour
  add(kind, m, x, y, z, sx, sy, sz, ry, col, rx, opts) {
    const g = unitGeo(kind).clone();
    g.scale(sx, sy, sz);
    // box-projected UVs from scaled local coordinates, so texture density matches across sizes
    const pos = g.attributes.position, nor = g.attributes.normal, n = pos.count, uv = new Float32Array(n * 2), ts = (m.userData && m.userData.size) || 2, ou = (opts && opts.u) || 0, ov = (opts && opts.v) || 0;
    for (let i = 0; i < n; i++) {
      const px = pos.getX(i), py = pos.getY(i), pz = pos.getZ(i), ax = Math.abs(nor.getX(i)), ay = Math.abs(nor.getY(i)), az = Math.abs(nor.getZ(i));
      let u, v;
      if (opts && opts.slope) { u = px; v = -pz; } // roofs: rows run along the eave
      else if (ay >= ax && ay >= az) { u = px; v = pz; } else if (ax >= az) { u = pz; v = py; } else { u = px; v = py; }
      uv[i * 2] = u / ts + ou; uv[i * 2 + 1] = v / ts + ov;
    }
    g.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
    if (rx) g.rotateX(rx);
    if (opts && opts.rz) g.rotateZ(opts.rz);
    if (ry) g.rotateY(ry);
    g.translate(x, y, z);
    const c = new THREE.Color(col === undefined || col === null ? 0xffffff : col), ca = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) { ca[i * 3] = c.r; ca[i * 3 + 1] = c.g; ca[i * 3 + 2] = c.b; }
    g.setAttribute("color", new THREE.BufferAttribute(ca, 3));
    const key = m.uuid + ((opts && opts.noShadow) ? "|ns" : "");
    if (!this.groups.has(key)) this.groups.set(key, { m, list: [], ns: opts && opts.noShadow });
    this.groups.get(key).list.push(g);
  }
  box(m, x, y, z, sx, sy, sz, ry, col, opts) { this.add("box", m, x, y, z, sx, sy, sz, ry, col, 0, opts); }
  build(scene, track) {
    for (const gr of this.groups.values()) {
      const merged = mergeGeometries(gr.list, false); gr.list.forEach((g) => g.dispose());
      if (!merged) continue;
      if (track) track(merged);
      const mesh = new THREE.Mesh(merged, gr.m); mesh.castShadow = !gr.ns; mesh.receiveShadow = true; scene.add(mesh);
    }
    this.groups.clear();
  }
}

// ---------- sky: gradient, sun glow and drifting cloud, drawn behind everything ----------
export function paintedSky(top, horizon, sunDir, sunCol, voidAmt, voidCol, cloudAmt) {
  const geo = new THREE.SphereGeometry(330, 32, 16);
  const m = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: { top: { value: new THREE.Color(top) }, hor: { value: new THREE.Color(horizon) }, sunD: { value: sunDir.clone().normalize() }, sunC: { value: new THREE.Color(sunCol) }, vAmt: { value: voidAmt || 0 }, vCol: { value: new THREE.Color(voidCol) }, t: { value: 0 }, cAmt: { value: cloudAmt == null ? 0.6 : cloudAmt } },
    vertexShader: "varying vec3 vD; void main(){ vD = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }",
    fragmentShader: `
      uniform vec3 top, hor, sunC, vCol, sunD; uniform float vAmt, t, cAmt; varying vec3 vD;
      float h(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }
      float n(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f); return mix(mix(h(i), h(i+vec2(1,0)), f.x), mix(h(i+vec2(0,1)), h(i+vec2(1,1)), f.x), f.y); }
      float fbm(vec2 p){ float s = 0.0, a = 0.5; for (int i = 0; i < 5; i++){ s += n(p) * a; p *= 2.03; a *= 0.5; } return s; }
      void main(){
        vec3 d = normalize(vD); float y = d.y;
        vec3 c = mix(hor, top, smoothstep(-0.02, 0.55, y));
        c = mix(c, hor * 0.8, smoothstep(0.0, -0.25, y));
        float sd = max(dot(d, sunD), 0.0);
        c = mix(c, hor * 1.12 + sunC * 0.06, smoothstep(0.22, 0.0, abs(y)) * 0.55);
        c += sunC * (pow(sd, 6.0) * 0.2 + pow(sd, 90.0) * 0.6 + smoothstep(0.9993, 0.9997, sd) * 1.2);
        if (y > 0.0) {
          vec2 uv = d.xz / (y + 0.18) * 1.6 + vec2(t * 0.012, t * 0.004);
          float k = fbm(uv) * 0.75 + fbm(uv * 3.1) * 0.25;
          float cov = smoothstep(0.62 - cAmt * 0.28, 0.9, k) * smoothstep(0.0, 0.22, y);
          vec3 cc = mix(hor * 1.08, mix(hor, vec3(1.0), 0.35), smoothstep(0.55, 0.95, k)) + sunC * pow(sd, 4.0) * 0.25;
          c = mix(c, cc, cov * 0.75);
        }
        if (vAmt > 0.0) c = mix(c, vCol, vAmt * 0.55 * smoothstep(0.35, 0.0, abs(y - 0.06)) * smoothstep(0.1, -0.9, d.z));
        gl_FragColor = vec4(c, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`
  });
  const s = new THREE.Mesh(geo, m); s.renderOrder = -1; s.frustumCulled = false;
  s.userData.tick = (dt, cx, cz) => { m.uniforms.t.value += dt; s.position.set(cx, 0, cz); };
  return s;
}

// ---------- image-based light from the painted sky (High only): the dome, prefiltered into an environment map ----------
// No HDRI download: the sky that is already drawn (with its time of day and sun) is prefiltered (PMREM) and given to the
// people and horses (materials flagged userData.vhEnv), so armour, blades and cloth pick up the sky's colour. Not set as
// scene.environment: sampling it on every surface (ground, walls, trees) cost High about half its frame rate in testing.
export function skyEnv(renderer, sky) {
  const pm = new THREE.PMREMGenerator(renderer), sc = new THREE.Scene(), m = new THREE.Mesh(sky.geometry, sky.material);
  m.frustumCulled = false; sc.add(m);
  const rt = pm.fromScene(sc, 0.035, 1, 1000); pm.dispose(); return rt;
}
// attach (and keep up to date) the sky environment on a stage; people spawned later are picked up every couple of seconds
export function useSkyEnv(st, scene, sky) {
  let rt = null, on = false, iv = 0; const h0 = { k: 1 };
  const apply = () => { const tex = on && rt ? rt.texture : null; scene.traverse((o) => { const ms = o.material ? (Array.isArray(o.material) ? o.material : [o.material]) : []; for (const m of ms) if (m.userData && m.userData.vhEnv && m.envMap !== tex) { m.envMap = tex; m.envMapIntensity = 0.7; m.needsUpdate = true; } }); };
  const build = () => { try { const n = skyEnv(st.renderer, sky); if (rt) rt.dispose(); rt = n; apply(); } catch (e) { rt = null; } };
  const set = (q) => { const want = q === "high"; if (want === on) return; on = want; if (on && !rt) build(); apply(); };
  if (window.__vhNoEnv) return { k: h0, refresh() {}, dispose() {} };
  set(st.gfx); st.onGfx.push(set); iv = setInterval(() => { if (on) apply(); }, 2000);
  return { k: h0, refresh() { if (on) build(); }, dispose() { clearInterval(iv); if (rt) rt.dispose(); rt = null; } };
}

// ---------- painted horizon: the Realm's 2D poster art as a faint, distant band behind the 3D world ----------
// The upper part of each poster (sky and far silhouettes) is wrapped around a ring inside the sky dome, mirrored so the
// seams never show, blended into the fog colour and faded out at the top and bottom. Loaded lazily, one small webp per scene.
const BACKDROP = { ember: 1, stone: 1, storm: 1, light: 1, frost: 1, spirit: 1, shadow: 1, metal: 1, march: 1 };
export function backdropURL(realm) { return new URL("./assets/backdrops/" + (BACKDROP[realm] ? realm : "march") + ".webp", import.meta.url).href; }
export function horizonBand(realm, fogCol, track, opts) {
  opts = opts || {};
  const R = opts.r || 300, Hh = opts.h || 120, reps = opts.reps || 6;
  const geo = track(new THREE.CylinderGeometry(R, R, Hh, 64, 1, true));
  const uni = { map: { value: null }, fogC: { value: new THREE.Color(fogCol) }, amt: { value: opts.amt || 0.5 }, reps: { value: reps }, ready: { value: 0 } };
  const m = track(new THREE.ShaderMaterial({
    side: THREE.BackSide, transparent: true, depthWrite: false, fog: false, uniforms: uni,
    vertexShader: "varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
    fragmentShader: `uniform sampler2D map; uniform vec3 fogC; uniform float amt, reps, ready; varying vec2 vUv;
      void main(){
        float u = vUv.x * reps; u = abs(mod(u, 2.0) - 1.0);           // mirrored repeat
        vec3 c = texture2D(map, vec2(u, 0.42 + vUv.y * 0.56)).rgb;     // the poster's upper part: sky and far shapes
        c = mix(fogC, c, 0.55);
        float a = smoothstep(0.0, 0.22, vUv.y) * (1.0 - smoothstep(0.62, 1.0, vUv.y)) * amt * ready;
        gl_FragColor = vec4(c, a);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`
  }));
  const mesh = new THREE.Mesh(geo, m); mesh.renderOrder = -0.5; mesh.frustumCulled = false; mesh.position.y = Hh / 2 - 14;
  new THREE.TextureLoader().load(backdropURL(realm), (t) => { t.colorSpace = THREE.SRGBColorSpace; track(t); uni.map.value = t; uni.ready.value = 1; }, undefined, () => {});
  mesh.userData.tick = (cx, cz) => { mesh.position.x = cx; mesh.position.z = cz; };
  return mesh;
}

// the loading card shows the Realm's painted poster (one small webp, loaded only now)
export function loadArt(st, realm) { try { const l = st.$(".v3-load"); l.style.backgroundImage = "linear-gradient(rgba(11,9,7,.35),rgba(11,9,7,.82)),url(" + backdropURL(realm) + ")"; l.style.backgroundSize = "cover"; l.style.backgroundPosition = "center"; l.style.alignItems = "end"; l.style.paddingBottom = "12vh"; l.style.textShadow = "0 2px 8px #000"; } catch (e) {} }

// ---------- scattered grass tufts (instanced crossed cards) ----------
export function grassField(track, count, place, tint, tint2) {
  if (count <= 0) return null;
  const c = canvas(128), x = c.getContext("2d");
  for (let i = 0; i < 46; i++) {
    const bx = 8 + Math.random() * 112, lean = (Math.random() - 0.5) * 34, h = 60 + Math.random() * 64, w = 3 + Math.random() * 3, l = 0.65 + Math.random() * 0.35;
    const g = x.createLinearGradient(0, 128, 0, 128 - h); g.addColorStop(0, "rgb(" + (90 * l | 0) + "," + (110 * l | 0) + "," + (60 * l | 0) + ")"); g.addColorStop(1, "rgb(" + (220 * l | 0) + "," + (235 * l | 0) + "," + (170 * l | 0) + ")");
    x.fillStyle = g; x.beginPath(); x.moveTo(bx - w, 128); x.quadraticCurveTo(bx + lean * 0.3, 128 - h * 0.6, bx + lean, 128 - h); x.quadraticCurveTo(bx + lean * 0.3 + w * 0.4, 128 - h * 0.6, bx + w, 128); x.fill();
  }
  const t = track(new THREE.CanvasTexture(c)); t.colorSpace = THREE.SRGBColorSpace;
  // four one-sided cards (two crossed planes, both faces), so no back face gets a flipped, dark normal
  const parts = [0, 1, 2, 3].map((k) => new THREE.PlaneGeometry(1, 1).translate(0, 0.5, 0).rotateY(k * Math.PI / 2));
  const geo = track(mergeGeometries(parts)); parts.forEach((g) => g.dispose());
  // normals point up, so tufts take the same light as the ground they stand on
  { const nr = geo.attributes.normal; for (let i = 0; i < nr.count; i++) nr.setXYZ(i, 0, 1, 0); }
  const m = track(new THREE.MeshStandardMaterial({ map: t, alphaTest: 0.45, roughness: 1, color: tint }));
  // the tufts sway in the wind: tips move, roots stay; each tuft has its own phase from where it stands
  m.onBeforeCompile = (sh) => {
    sh.uniforms.vhT = VH_TIME;
    sh.vertexShader = "uniform float vhT;\n" + sh.vertexShader.replace("#include <begin_vertex>", "#include <begin_vertex>\n#ifdef USE_INSTANCING\n  { float ph = instanceMatrix[3].x * 0.7 + instanceMatrix[3].z * 0.45; float k = position.y * position.y; transformed.x += (sin(vhT * 1.7 + ph) * 0.11 + sin(vhT * 3.9 + ph * 2.3) * 0.03) * k; transformed.z += cos(vhT * 1.3 + ph) * 0.07 * k; }\n#endif");
  };
  m.customProgramCacheKey = () => "vh-grass-sway";
  const im = new THREE.InstancedMesh(geo, m, count);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), p = new THREE.Vector3(), s = new THREE.Vector3(), col = new THREE.Color(), c1 = new THREE.Color(tint), c2 = new THREE.Color(tint2 || tint);
  let n = 0;
  for (let i = 0; i < count * 4 && n < count; i++) {
    const r = place(); if (!r) continue;
    const sc = 0.28 + Math.random() * 0.34;
    p.set(r[0], r[1], r[2]); q.setFromEuler(e.set(0, Math.random() * Math.PI, 0)); s.set(sc * (0.8 + Math.random() * 0.6), sc, sc); m4.compose(p, q, s);
    im.setMatrixAt(n, m4); im.setColorAt(n, col.copy(c1).lerp(c2, Math.random()).multiplyScalar(1.7 + Math.random() * 0.6)); n++;
  }
  im.count = n; m.color.set(0xffffff);
  if (im.instanceColor) im.instanceColor.needsUpdate = true;
  im.castShadow = false; im.receiveShadow = true;
  return im;
}
