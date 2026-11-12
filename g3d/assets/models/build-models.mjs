// Build the g3d/assets/models/*.glb bundles from Quaternius CC0 packs (see ../CREDITS.md).
// Static models: every part is baked into world space, welded, simplified (meshoptimizer) and turned into ONE primitive
// with vertex colours (each source material's colour), so the game can instance a whole tree or cottage in one draw call.
// A per-vertex _ROLE byte (0 other, 1 wood, 2 plaster, 3 roof, 4 stone, 5 window, 6 foliage, 7 cloth, 8 fire) lets the
// game recolour roofs, walls and leaves to each Realm's canon palette. Each model is normalised: base at y = 0, centred
// on x/z. Trees and plants are scaled to 1 m tall (the game scales by the height it wants); buildings and props keep
// their proportions, scaled so the larger footprint side is 1 m. Positions are quantised and the files meshopt-compressed.
// The animals (horse, deer, stag, wolf, fox, cow) keep their rigs and the clips the game uses (Idle, Walk, Gallop, Eating,
// Death, Attack); each animal's parts are joined into one skinned primitive. dungeon.glb holds the Modular Dungeon and
// Survival props (columns, arches, skulls, cobwebs, torches, gold, tents, campfires, traps).
// Usage (needs @gltf-transform/core, extensions, functions 4.x and meshoptimizer 0.21):
//   node build-models.mjs <quaternius-showcase/public/glb> <out dir>
// Debug: NOSIMP=1 skips simplification, RAW=1 writes uncompressed files (to compare against the sources).
import { NodeIO, Document } from '@gltf-transform/core';
import { ALL_EXTENSIONS, EXTMeshoptCompression } from '@gltf-transform/extensions';
import { quantize, reorder, prune, dedup } from '@gltf-transform/functions';
import { MeshoptSimplifier, MeshoptEncoder } from 'meshoptimizer';
import { readFileSync } from 'fs';
await MeshoptSimplifier.ready; await MeshoptEncoder.ready;
const [SRC, OUT] = process.argv.slice(2);
// 13 Nov 2026: twice the triangles of the first build (smooth shading shows the extra detail); DETAIL=1 for the old budget
const DETAIL = +(process.env.DETAIL || 2);
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.encoder': MeshoptEncoder });

// [key, pack/file, target triangles, kind]   kind: 'plant' (1 m tall) or 'prop' (footprint 1 m)
const BUNDLES = {
  nature: [
    ['broad1', 'nature_pack/CommonTree_1', 336, 'plant'], ['broad2', 'nature_pack/CommonTree_2', 336, 'plant'], ['broad3', 'nature_pack/CommonTree_3', 299, 'plant'],
    ['autumn1', 'nature_pack/CommonTree_Autumn_1', 336, 'plant'], ['autumn2', 'nature_pack/CommonTree_Autumn_3', 299, 'plant'],
    ['pine1', 'nature_pack/PineTree_1', 261, 'plant'], ['pine2', 'nature_pack/PineTree_3', 299, 'plant'], ['pine3', 'nature_pack/PineTree_5', 261, 'plant'],
    ['birch1', 'nature_pack/BirchTree_1', 299, 'plant'], ['birch2', 'nature_pack/BirchTree_3', 299, 'plant'],
    ['willow1', 'nature_pack/Willow_1', 299, 'plant'], ['willow2', 'nature_pack/Willow_4', 299, 'plant'],
    ['snowpine1', 'nature_pack/PineTree_Snow_1', 261, 'plant'], ['snowpine2', 'nature_pack/PineTree_Snow_3', 299, 'plant'], ['snowbirch', 'nature_pack/BirchTree_Snow_1', 299, 'plant'],
    ['dead1', 'nature_pack/CommonTree_Dead_1', 330, 'plant'], ['dead2', 'nature_pack/BirchTree_Dead_2', 275, 'plant'], ['deadsnow', 'nature_pack/CommonTree_Dead_Snow_1', 330, 'plant'],
    ['bush1', 'nature_pack/Bush_1', 170, 'plant'], ['bush2', 'nature_pack/BushBerries_1', 170, 'plant'], ['bushsnow', 'nature_pack/Bush_Snow_1', 170, 'plant'],
    ['rock1', 'nature_pack/Rock_1', 80, 'prop'], ['rock2', 'nature_pack/Rock_4', 80, 'prop'], ['rockmoss', 'nature_pack/Rock_Moss_2', 80, 'prop'], ['rocksnow', 'nature_pack/Rock_Snow_3', 80, 'prop'],
    ['grass', 'nature_pack/Grass', 120, 'plant'], ['flowers', 'nature_pack/Flowers', 240, 'plant'], ['fern', 'nature_pack/Plant_1', 200, 'plant'],
    ['stump', 'nature_pack/TreeStump_Moss', 160, 'prop'], ['log', 'nature_pack/WoodLog_Moss', 260, 'prop']
  ],
  village: [
    ['house1', 'medieval_village_pack/House_1', 2600, 'prop'], ['house2', 'medieval_village_pack/House_2', 2800, 'prop'], ['house3', 'medieval_village_pack/House_3', 2000, 'prop'],
    ['inn', 'medieval_village_pack/Inn', 3200, 'prop'], ['smithy', 'medieval_village_pack/Blacksmith', 3200, 'prop'], ['stable', 'medieval_village_pack/Stable', 2600, 'prop'],
    ['mill', 'medieval_village_pack/Mill', 3000, 'prop'], ['sawmill', 'medieval_village_pack/Sawmill', 2200, 'prop'],
    ['well', 'medieval_village_pack/Well', 700, 'prop'], ['stall1', 'medieval_village_pack/MarketStand_1', 700, 'prop'], ['stall2', 'medieval_village_pack/MarketStand_2', 520, 'prop'],
    ['cart', 'medieval_village_pack/Cart', 900, 'prop'], ['barrel', 'medieval_village_pack/Barrel', 300, 'prop'], ['crate', 'medieval_village_pack/Crate', 200, 'prop'],
    ['fence', 'medieval_village_pack/Fence', 200, 'prop'], ['bonfire', 'medieval_village_pack/Bonfire_Lit', 500, 'prop'], ['hay', 'medieval_village_pack/Hay', 200, 'prop'],
    ['bench', 'medieval_village_pack/Bench_1', 200, 'prop'], ['bags', 'medieval_village_pack/Bags', 300, 'prop'], ['cauldron', 'medieval_village_pack/Cauldron', 400, 'prop']
  ],
  dungeon: [
    ['column', 'modular_dungeon_1/Column', 600, 'prop'], ['column2', 'modular_dungeon_1/Column2', 600, 'prop'], ['arch', 'modular_dungeon_1/Arch', 900, 'prop'],
    ['skull', 'modular_dungeon_1/Skull', 200, 'prop'], ['cobweb', 'modular_dungeon_1/Cobweb', 120, 'prop'], ['cobweb2', 'modular_dungeon_1/Cobweb2', 120, 'prop'],
    ['dtorch', 'modular_dungeon_1/Torch', 200, 'prop'], ['chestgold', 'modular_dungeon_1/Chest_Gold', 500, 'prop'], ['coins', 'modular_dungeon_1/Coin_Pile', 300, 'prop'],
    ['barrel2', 'modular_dungeon_1/Barrel2', 300, 'prop'], ['vase', 'modular_dungeon_1/Vase', 250, 'prop'], ['spikes', 'modular_dungeon_1/Spikes', 300, 'prop'],
    ['wbanner', 'modular_dungeon_1/Banner_wall', 200, 'prop'], ['woodfire', 'modular_dungeon_1/Woodfire', 400, 'prop'], ['coinbag', 'modular_dungeon_1/Bag_Coins', 200, 'prop'],
    ['tent', 'survival_pack/Tent', 700, 'prop'], ['campfire', 'survival_pack/Bonfire_Fire', 500, 'prop'], ['woodlog', 'survival_pack/WoodLog', 160, 'prop'],
    ['beartrap', 'survival_pack/BearTrap_Open', 300, 'prop'], ['wtorch', 'survival_pack/WoodenTorch_Fire', 200, 'prop'], ['axe', 'survival_pack/Axe', 160, 'prop']
  ],
  castle: [
    ['wall', 'modular_medieval_buildings_pack/WallBricks', 900, 'prop'], ['wallgate', 'modular_medieval_buildings_pack/WallEntranceBricks', 1400, 'prop'],
    ['tower', 'modular_medieval_buildings_pack/SmallSquareTowerBricks', 1400, 'prop'], ['towerbig', 'modular_medieval_buildings_pack/LargeSquareTowerBricks', 1800, 'prop'],
    ['banner', 'modular_medieval_buildings_pack/Banner', 300, 'prop']
  ]
};
const ROLE = (name) => {
  const n = name.toLowerCase();
  if (/fire|flame|orange/.test(n)) return 8;
  if (/window|glass/.test(n)) return 5;
  if (/roof/.test(n)) return 3;
  if (/plaster|beige|white/.test(n) && !/birch/.test(n)) return 2;
  if (/stone|rock|brick/.test(n)) return 4;
  if (/green|leaf|leaves|grass|hay|wheat/.test(n)) return 6;
  if (/wood|log|plank/.test(n)) return 1;
  if (/banner|cloth|red|bag|blue/.test(n)) return 7;
  return 0;
};

function bake(doc) {
  const P = [], C = [], R = [];
  for (const node of doc.getRoot().listNodes()) {
    const mesh = node.getMesh(); if (!mesh) continue; const M = node.getWorldMatrix();
    for (const prim of mesh.listPrimitives()) {
      const pos = prim.getAttribute('POSITION'), idx = prim.getIndices(), mat = prim.getMaterial();
      const bc = mat ? mat.getBaseColorFactor() : [1, 1, 1, 1], role = ROLE(mat ? mat.getName() : '');
      const vc = prim.getAttribute('COLOR_0');
      const n = idx ? idx.getCount() : pos.getCount(), e = [0, 0, 0], c = [1, 1, 1, 1];
      for (let i = 0; i < n; i++) {
        const k = idx ? idx.getScalar(i) : i; pos.getElement(k, e);
        const x = M[0] * e[0] + M[4] * e[1] + M[8] * e[2] + M[12], y = M[1] * e[0] + M[5] * e[1] + M[9] * e[2] + M[13], z = M[2] * e[0] + M[6] * e[1] + M[10] * e[2] + M[14];
        P.push(x, y, z); if (vc) vc.getElement(k, c); else c[0] = c[1] = c[2] = 1;
        C.push(bc[0] * c[0], bc[1] * c[1], bc[2] * c[2]); R.push(role);
      }
    }
  }
  return { P, C, R };
}
// weld identical (position, colour) corners, so the simplifier sees connected surfaces
function weldTris({ P, C, R }) {
  const map = new Map(), pos = [], col = [], role = [], ind = [];
  for (let i = 0; i < P.length / 3; i++) {
    const key = [P[i * 3], P[i * 3 + 1], P[i * 3 + 2]].map((v) => Math.round(v * 1e4)).join(',') + '|' + Math.round(C[i * 3] * 255) + ',' + Math.round(C[i * 3 + 1] * 255) + ',' + Math.round(C[i * 3 + 2] * 255);
    let j = map.get(key);
    if (j === undefined) { j = pos.length / 3; map.set(key, j); pos.push(P[i * 3], P[i * 3 + 1], P[i * 3 + 2]); col.push(C[i * 3], C[i * 3 + 1], C[i * 3 + 2]); role.push(R[i]); }
    ind.push(j);
  }
  // drop degenerate triangles
  const out = []; for (let t = 0; t < ind.length; t += 3) { const a = ind[t], b = ind[t + 1], c = ind[t + 2]; if (a !== b && b !== c && a !== c) out.push(a, b, c); }
  return { pos: new Float32Array(pos), col: new Float32Array(col), role: new Uint8Array(role), ind: new Uint32Array(out) };
}
function simplify(g, target) {
  if (process.env.NOSIMP) return g;
  const tris = g.ind.length / 3; if (tris <= target) return g;
  // colour seams are borders between welded islands; keep them so leaves never bleed into bark
  let [ind] = MeshoptSimplifier.simplify(g.ind, g.pos, 3, target * 3, 0.02, ['LockBorder']);
  return Object.assign({}, g, { ind: new Uint32Array(ind) });
}
function compact(g) {
  const used = new Int32Array(g.pos.length / 3).fill(-1), pos = [], col = [], role = []; const ind = new Uint32Array(g.ind.length);
  for (let i = 0; i < g.ind.length; i++) { const v = g.ind[i]; if (used[v] < 0) { used[v] = pos.length / 3; pos.push(g.pos[v * 3], g.pos[v * 3 + 1], g.pos[v * 3 + 2]); col.push(g.col[v * 3], g.col[v * 3 + 1], g.col[v * 3 + 2]); role.push(g.role[v]); } ind[i] = used[v]; }
  return { pos: new Float32Array(pos), col: new Float32Array(col), role: new Uint8Array(role), ind };
}
function normalise(g, kind) {
  let x0 = 1e9, y0 = 1e9, z0 = 1e9, x1 = -1e9, y1 = -1e9, z1 = -1e9;
  for (let i = 0; i < g.pos.length; i += 3) { x0 = Math.min(x0, g.pos[i]); x1 = Math.max(x1, g.pos[i]); y0 = Math.min(y0, g.pos[i + 1]); y1 = Math.max(y1, g.pos[i + 1]); z0 = Math.min(z0, g.pos[i + 2]); z1 = Math.max(z1, g.pos[i + 2]); }
  const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2, s = kind === 'plant' ? 1 / (y1 - y0) : 1 / Math.max(x1 - x0, z1 - z0);
  for (let i = 0; i < g.pos.length; i += 3) { g.pos[i] = (g.pos[i] - cx) * s; g.pos[i + 1] = (g.pos[i + 1] - y0) * s; g.pos[i + 2] = (g.pos[i + 2] - cz) * s; }
  return { w: +((x1 - x0) * s).toFixed(3), h: +((y1 - y0) * s).toFixed(3), d: +((z1 - z0) * s).toFixed(3) };
}

async function buildStatic(name, list) {
  const doc = new Document(), buf = doc.createBuffer(), scene = doc.createScene(name), mat = doc.createMaterial('vc').setBaseColorFactor([1, 1, 1, 1]).setRoughnessFactor(0.9).setMetallicFactor(0);
  let report = [];
  for (const [key, file, target, kind] of list) {
    const src = await io.read(SRC + '/' + file + '.glb');
    let g = compact(simplify(weldTris(bake(src)), Math.round(target * DETAIL)));
    const dims = normalise(g, kind);
    const prim = doc.createPrimitive().setMaterial(mat)
      .setAttribute('POSITION', doc.createAccessor().setType('VEC3').setArray(g.pos).setBuffer(buf))
      .setAttribute('COLOR_0', doc.createAccessor().setType('VEC3').setArray(g.col).setBuffer(buf))
      .setAttribute('_ROLE', doc.createAccessor().setType('SCALAR').setArray(g.role).setBuffer(buf))
      .setIndices(doc.createAccessor().setType('SCALAR').setArray(g.pos.length / 3 > 65535 ? g.ind : new Uint16Array(g.ind)).setBuffer(buf));
    const mesh = doc.createMesh(key).addPrimitive(prim);
    scene.addChild(doc.createNode(key).setMesh(mesh).setExtras(Object.assign({ src: file, kind }, dims)));
    report.push(key + ' ' + g.ind.length / 3);
  }
  await finish(doc, name);
  console.log(name + ': ' + report.join(', '));
}

function mul(a, b) { const o = new Array(16); for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) { let v = 0; for (let k = 0; k < 4; k++) v += a[k * 4 + r] * b[c * 4 + k]; o[c * 4 + r] = v; } return o; }
function invert(m) { const [a00,a01,a02,a03,a10,a11,a12,a13,a20,a21,a22,a23,a30,a31,a32,a33] = m;
  const b00=a00*a11-a01*a10,b01=a00*a12-a02*a10,b02=a00*a13-a03*a10,b03=a01*a12-a02*a11,b04=a01*a13-a03*a11,b05=a02*a13-a03*a12,b06=a20*a31-a21*a30,b07=a20*a32-a22*a30,b08=a20*a33-a23*a30,b09=a21*a32-a22*a31,b10=a21*a33-a23*a31,b11=a22*a33-a23*a32;
  let d=b00*b11-b01*b10+b02*b09+b03*b08-b04*b07+b05*b06; d = d ? 1 / d : 0;
  return [(a11*b11-a12*b10+a13*b09)*d,(a02*b10-a01*b11-a03*b09)*d,(a31*b05-a32*b04+a33*b03)*d,(a22*b04-a21*b05-a23*b03)*d,(a12*b08-a10*b11-a13*b07)*d,(a00*b11-a02*b08+a03*b07)*d,(a32*b02-a30*b05-a33*b01)*d,(a20*b05-a22*b02+a23*b01)*d,(a10*b10-a11*b08+a13*b06)*d,(a01*b08-a00*b10-a03*b06)*d,(a30*b04-a31*b02+a33*b00)*d,(a21*b02-a20*b04-a23*b00)*d,(a11*b07-a10*b09-a12*b06)*d,(a00*b09-a01*b07+a02*b06)*d,(a31*b01-a30*b03-a32*b00)*d,(a20*b03-a21*b01+a22*b00)*d]; }
async function buildAnimal(name, file) {
  const doc = await io.read(SRC + '/animals_pack/' + file + '.glb'), root = doc.getRoot();
  const keep = /\|(Idle|Walk|Gallop|Death|Eating|Attack|Attack_Headbutt)$/;
  for (const a of root.listAnimations()) { if (!keep.test(a.getName())) a.dispose(); else a.setName(a.getName().split('|')[1]); }
  // join every part of every mesh by hand into one skinned primitive with vertex colours
  const one = doc.createMaterial('vc').setBaseColorFactor([1, 1, 1, 1]).setRoughnessFactor(0.85).setMetallicFactor(0);
  const buf = root.listBuffers()[0], meshes = root.listMeshes(), mesh = meshes[0];
  const SEM = ['POSITION', 'NORMAL', 'JOINTS_0', 'WEIGHTS_0'], acc = { POSITION: [], NORMAL: [], JOINTS_0: [], WEIGHTS_0: [], COLOR_0: [] }, ind = [];
  let base = 0; const e = [0, 0, 0, 0];
  // rigid parts (e.g. the stag's antlers) hang off a bone: bake them into the skinned mesh's space, bound to that bone
  const skin = root.listSkins()[0], joints = skin.listJoints(), nodeOf = (ms) => root.listNodes().find((nd) => nd.getMesh() === ms);
  const skNode = root.listNodes().find((nd) => nd.getSkin && nd.getSkin()), inv = invert(skNode ? skNode.getWorldMatrix() : [1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]);
  for (const ms of meshes) for (const prim of ms.listPrimitives()) {
    const m = prim.getMaterial(), bc = m ? m.getBaseColorFactor() : [1, 1, 1, 1], n = prim.getAttribute('POSITION').getCount();
    if (!prim.getAttribute('JOINTS_0')) {
      const nd = nodeOf(ms); let par = nd && nd.getParentNode ? nd.getParentNode() : null; let ji = 0;
      while (par && joints.indexOf(par) < 0) par = par.getParentNode ? par.getParentNode() : null; if (par) ji = joints.indexOf(par);
      const M = mul(inv, nd.getWorldMatrix()), pa = prim.getAttribute('POSITION'), na = prim.getAttribute('NORMAL');
      for (let i = 0; i < n; i++) { pa.getElement(i, e); acc.POSITION.push(M[0]*e[0]+M[4]*e[1]+M[8]*e[2]+M[12], M[1]*e[0]+M[5]*e[1]+M[9]*e[2]+M[13], M[2]*e[0]+M[6]*e[1]+M[10]*e[2]+M[14]);
        if (na) { na.getElement(i, e); const x = M[0]*e[0]+M[4]*e[1]+M[8]*e[2], y = M[1]*e[0]+M[5]*e[1]+M[9]*e[2], z = M[2]*e[0]+M[6]*e[1]+M[10]*e[2], L = Math.hypot(x, y, z) || 1; acc.NORMAL.push(x / L, y / L, z / L); } else acc.NORMAL.push(0, 1, 0);
        acc.JOINTS_0.push(ji, 0, 0, 0); acc.WEIGHTS_0.push(1, 0, 0, 0); }
    } else for (const sm of SEM) { const a = prim.getAttribute(sm), w = a.getElementSize(); for (let i = 0; i < n; i++) { a.getElement(i, e); for (let k = 0; k < w; k++) acc[sm].push(e[k]); } }
    for (let i = 0; i < n; i++) acc.COLOR_0.push(bc[0], bc[1], bc[2]);
    const ix = prim.getIndices(); for (let i = 0; i < ix.getCount(); i++) ind.push(ix.getScalar(i) + base);
    base += n;
  }
  const np = doc.createPrimitive().setMaterial(one)
    .setAttribute('POSITION', doc.createAccessor().setType('VEC3').setArray(new Float32Array(acc.POSITION)).setBuffer(buf))
    .setAttribute('NORMAL', doc.createAccessor().setType('VEC3').setArray(new Float32Array(acc.NORMAL)).setBuffer(buf))
    .setAttribute('JOINTS_0', doc.createAccessor().setType('VEC4').setArray(new Uint16Array(acc.JOINTS_0)).setBuffer(buf))
    .setAttribute('WEIGHTS_0', doc.createAccessor().setType('VEC4').setArray(new Float32Array(acc.WEIGHTS_0)).setBuffer(buf))
    .setAttribute('COLOR_0', doc.createAccessor().setType('VEC3').setArray(new Float32Array(acc.COLOR_0)).setBuffer(buf))
    .setIndices(doc.createAccessor().setType('SCALAR').setArray(base > 65535 ? new Uint32Array(ind) : new Uint16Array(ind)).setBuffer(buf));
  for (const ms of meshes) ms.listPrimitives().forEach((p) => { ms.removePrimitive(p); p.dispose(); });
  mesh.addPrimitive(np);
  // the other meshes are now empty: drop their nodes
  for (const node of root.listNodes()) { const m2 = node.getMesh(); if (m2 && m2 !== mesh) { node.setMesh(null); } }
  for (const m2 of meshes.slice(1)) m2.dispose();
  await finish(doc, name);
  console.log(name + ': ' + base + ' verts, clips ' + root.listAnimations().map((a) => a.getName()).join(','));
}

async function finish(doc, name) {
  if (process.env.RAW) { await doc.transform(prune(), dedup()); await io.write(OUT + '/' + name + '.glb', doc); return; }
  await doc.transform(prune(), dedup(), reorder({ encoder: MeshoptEncoder }), quantize({ quantizePosition: 14, quantizeColor: 8, quantizeNormal: 8 }));
  doc.createExtension(EXTMeshoptCompression).setRequired(true).setEncoderOptions({ method: EXTMeshoptCompression.EncoderMethod.FILTER });
  await io.write(OUT + '/' + name + '.glb', doc);
}

for (const [name, list] of Object.entries(BUNDLES)) if (!process.env.ONLY || process.env.ONLY.split(',').includes(name)) await buildStatic(name, list);
const ONLY = process.env.ONLY ? process.env.ONLY.split(',') : null;
for (const [name, file] of [['horse', 'Horse'], ['deer', 'Deer'], ['stag', 'Stag'], ['wolf', 'Wolf'], ['fox', 'Fox'], ['cow', 'Cow']]) if (!ONLY || ONLY.includes(name)) await buildAnimal(name, file);
