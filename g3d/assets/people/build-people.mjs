// Build g3d/assets/people/people.glb from Quaternius CC0 characters (Adventurer, Monarch, Hooded Adventurer).
// All three share one 62-bone rig (same joint order and rest pose), so every body part is rebound to one skin and
// one clip set. Each body is merged to a single primitive; its original materials become cells of a 4 x 4 palette
// (TEXCOORD_0), so the game can recolour cloth, metal, skin and hair per look with one draw call per person.
// Usage: node build-people.mjs <dir with decoded adventurer.glb monarch.glb hooded.glb> <out.glb>
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { weld, simplify, prune, dedup, resample } from '@gltf-transform/functions';
import { MeshoptSimplifier } from 'meshoptimizer';
import { Matrix4, Vector3 } from '../../three.module.min.js';
await MeshoptSimplifier.ready;
const [DIR, OUT] = process.argv.slice(2);
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
const SLOT = {
  adventurer: { Black: 8, Grey: 14, Brown2: 6, Brown: 7, Green: 4, LightGreen: 5, Skin: 0, Eyebrows: 1, Eye: 2, Hair: 1, Gold: 12 },
  monarch: { Metal: 9, DarkBrown: 11, Metal_Dark: 10, Blue: 4, Beige: 5, Skin: 0 },
  hooded: { Black: 15, LightBrown: 4, DarkBrown: 11, Skin: 0, Gold: 12, Metal: 9, White: 3, Brown: 1 }
};
const BODIES = {
  Man: [['adventurer', 'Adventurer_Feet'], ['adventurer', 'Adventurer_Legs'], ['adventurer', 'Adventurer_Body'], ['adventurer', 'Adventurer_Head']],
  Soldier: [['monarch', 'King_Feet'], ['monarch', 'King_Legs'], ['monarch', 'King_Body'], ['adventurer', 'Adventurer_Head']],
  Woman: [['hooded', 'Medieval_Feet'], ['hooded', 'Medieval_Legs'], ['hooded', 'Medieval_Body'], ['hooded', 'Medieval_Head']]
};
const RATIO = { Adventurer_Head: 0.3, Medieval_Head: 0.4, King_Body: 0.45, Adventurer_Body: 0.5, Medieval_Body: 0.55, King_Legs: 0.6 };
const src = {}; for (const k of Object.keys(SLOT)) src[k] = await io.read(DIR + '/' + k + '.glb');
const doc = src.adventurer, root = doc.getRoot(), buf = root.listBuffers()[0];
// gltfpack folded each part's position dequantisation into that part's own skin, so bake every part into the
// space of one target skin (the Adventurer body's) before merging
const skinNode = root.listNodes().find((n) => n.getName() === 'Adventurer_Body');
const skin = skinNode.getSkin();
const ibm0 = (sk) => new Matrix4().fromArray(sk.getInverseBindMatrices().getElement(0, []));
const T0inv = ibm0(skin).invert();
const parent = root.listNodes().find((n) => n.listChildren().includes(skinNode)) || null;
// gather raw arrays for every part, simplified first in its own document
const parts = {};
for (const k of Object.keys(src)) {
  const d = src[k];
  for (const n of d.getRoot().listNodes()) {
    const m = n.getMesh(); if (!m || !n.getSkin()) continue;
    const r = RATIO[m.getName()] || 0.7;
    if (r < 1) { const tmp = m; /* simplify just this mesh by transforming a filtered doc is awkward; do per primitive below */ }
    parts[k + '/' + m.getName()] = { mesh: m, node: n, k, r, M: T0inv.clone().multiply(ibm0(n.getSkin())) };
  }
}
const out = [];
for (const [name, list] of Object.entries(BODIES)) {
  const P = [], N = [], J = [], W = [], UV = [], IDX = [];
  for (const [k, mn] of list) {
    const part = parts[k + '/' + mn]; if (!part) throw new Error('missing ' + k + '/' + mn);
    for (const p of part.mesh.listPrimitives()) {
      const slot = SLOT[k][p.getMaterial().getName()]; if (slot === undefined) throw new Error('no slot ' + k + ' ' + p.getMaterial().getName());
      const u = ((slot % 4) + 0.5) / 4, v = (Math.floor(slot / 4) + 0.5) / 4;
      const pos = p.getAttribute('POSITION'), nor = p.getAttribute('NORMAL'), jo = p.getAttribute('JOINTS_0'), we = p.getAttribute('WEIGHTS_0');
      const base = P.length / 3;
      const V = new Vector3(); for (let i = 0; i < pos.getCount(); i++) { V.fromArray(pos.getElement(i, [0, 0, 0])).applyMatrix4(part.M); P.push(V.x, V.y, V.z); N.push(...nor.getElement(i, [0, 0, 0])); J.push(...jo.getElement(i, [0, 0, 0, 0])); W.push(...we.getElement(i, [0, 0, 0, 0])); UV.push(u, v); }
      const ix = p.getIndices(); for (let i = 0; i < ix.getCount(); i++) IDX.push(base + ix.getScalar(i));
    }
  }
  const acc = (type, arr, T) => doc.createAccessor().setType(type).setArray(new T(arr)).setBuffer(buf);
  const prim = doc.createPrimitive()
    .setAttribute('POSITION', acc('VEC3', P, Float32Array))
    .setAttribute('JOINTS_0', acc('VEC4', J, Uint8Array)).setAttribute('WEIGHTS_0', acc('VEC4', W, Float32Array))
    .setAttribute('TEXCOORD_0', acc('VEC2', UV, Float32Array)).setIndices(acc('SCALAR', IDX, P.length / 3 > 65535 ? Uint32Array : Uint16Array));
  out.push([name, prim, P.length / 3, IDX.length / 3]);
}
// drop the old meshes, add the three bodies on the shared skin
for (const n of root.listNodes()) if (n.getMesh()) { n.getMesh().dispose(); n.dispose(); }
const mat = doc.createMaterial('People').setBaseColorFactor([1, 1, 1, 1]).setRoughnessFactor(0.85).setMetallicFactor(0);
for (const [name, prim, nv, nt] of out) {
  prim.setMaterial(mat);
  const node = doc.createNode(name).setMesh(doc.createMesh(name).addPrimitive(prim)).setSkin(skin).setRotation(skinNode.getRotation()).setScale(skinNode.getScale()).setTranslation(skinNode.getTranslation());
  (parent || root.listScenes()[0]).addChild(node);
  console.log(name, nv, 'verts', nt, 'tris');
}
// clips: keep what the game uses, strip the armature prefix, drop scale tracks
const KEEP = ['Idle', 'Idle_Sword', 'Walk', 'Run', 'Sword_Slash', 'Punch_Right', 'Death', 'HitRecieve', 'Interact', 'Wave'];
for (const a of root.listAnimations()) {
  const nm = a.getName().replace(/^.*\|/, '');
  if (!KEEP.includes(nm)) { a.listChannels().forEach((c) => c.dispose()); a.listSamplers().forEach((s) => s.dispose()); a.dispose(); continue; }
  a.setName(nm);
  for (const ch of a.listChannels()) if (ch.getTargetPath() === 'scale') { const s = ch.getSampler(); ch.dispose(); s.dispose(); }
}
await doc.transform(resample({ tolerance: 2e-4 }), prune({ keepLeaves: true, keepAttributes: true }), dedup(), weld(), simplify({ simplifier: MeshoptSimplifier, ratio: +(process.env.RATIO || 0.6), error: 0.003 }), prune({ keepLeaves: true, keepAttributes: true }));
for (const m of root.listMeshes()) { const p = m.listPrimitives()[0]; console.log('final', m.getName(), p.getAttribute('POSITION').getCount(), 'verts', p.getIndices().getCount() / 3, 'tris'); }
await io.write(OUT, doc);
