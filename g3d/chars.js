// Rigged, animated people for the third-person scenes, with realistic proportions.
// Bodies and clips: Quaternius (quaternius.com) CC0 characters: Adventurer, Monarch (body only) and Hooded Adventurer,
// merged by assets/people/build-people.mjs into one file: three bodies on one shared 62-bone rig and one clip set.
// Each body is a single draw call; its parts index a 4 x 4 colour palette, so every look (Realm cloth, banner colours,
// skin, hair, metal) is a recoloured 4 x 4 texture. Helmets, swords, spears and shields are small built meshes on the bones.
import * as THREE from "./three.module.min.js";
import { GLTFLoader } from "./lib/GLTFLoader.js";
import { clone as skClone } from "./lib/SkeletonUtils.js";
import { mergeGeometries } from "./lib/BufferGeometryUtils.js";

// palette cells: 0 skin, 1 hair, 2 eyes, 3 eye-white, 4 cloth, 5 cloth2, 6 legs, 7 legs2, 8 boots, 9 metal, 10 dark metal,
// 11 leather, 12 trim (buttons, buckles), 13 spare, 14 soles, 15 hood and cloak
const DEF = {
  man: [0xb99b78, 0x432d1b, 0x30251e, 0xb3b3b3, 0x403b26, 0x504b34, 0x534830, 0x695a3c, 0x252525, 0x595b5a, 0x484948, 0x453a33, 0x816835, 0, 0x3b3b3b, 0x34322f],
  soldier: [0xb99b78, 0x432d1b, 0x30251e, 0xb3b3b3, 0x3b4250, 0x8c876f, 0x534830, 0x695a3c, 0x252525, 0x6a6c6b, 0x484948, 0x453a33, 0x816835, 0, 0x3b3b3b, 0x34322f],
  woman: [0xcdac85, 0x352921, 0x30251e, 0xb3b3b3, 0x6e4729, 0x504b34, 0x534830, 0x695a3c, 0x252525, 0x737373, 0x505150, 0x4b321e, 0xae864a, 0, 0x3b3b3b, 0x34322f]
};
const SLOT0 = { skin: [0], hair: [1], cloth: [4], cloth2: [5], legs: [6, 7], boots: [8], metal: [9], dark: [10], leather: [11], trim: [12], hood: [15] };
// the hooded woman's parts sit in other cells: hood 1, hair 3, dark under-layers 15
const SLOTS = { man: SLOT0, soldier: SLOT0, woman: Object.assign({}, SLOT0, { hood: [1], hair: [3], cloth2: [15] }) };
const MESH = { man: "Man", soldier: "Soldier", woman: "Woman" };
const BONE = { hand: "WristR", handL: "WristL", head: "Head", armL: "UpperArmL", foreL: "LowerArmL" };

let loading = null, LIB = null;
export function loadChars() {
  if (loading) return loading;
  const url = new URL("./assets/people/people.glb", import.meta.url).href;
  loading = new GLTFLoader().loadAsync(url).then((g) => {
    const clips = {}; g.animations.forEach((c) => { clips[c.name] = c; });
    LIB = { clips, root: g.scene };
    return LIB;
  });
  return loading;
}
export function charsReady() { return !!LIB; }

function paletteCanvas(base, look) {
  const cv = document.createElement("canvas"); cv.width = cv.height = 4; const x = cv.getContext("2d"), cols = DEF[base].slice();
  const SLOT = SLOTS[base];
  for (const k of Object.keys(SLOT)) if (look[k] !== undefined && look[k] !== null) SLOT[k].forEach((i, j) => { cols[i] = j ? new THREE.Color(look[k]).multiplyScalar(0.8).getHex() : new THREE.Color(look[k]).getHex(); });
  cols.forEach((c, i) => { x.fillStyle = "#" + new THREE.Color(c).getHexString(); x.fillRect(i % 4, Math.floor(i / 4), 1, 1); });
  return { cv, key: base + cols.join(",") };
}
function mrCanvas() { // G roughness, B metalness: metal cells shine a little
  const cv = document.createElement("canvas"); cv.width = cv.height = 4; const x = cv.getContext("2d");
  x.fillStyle = "rgb(0,220,0)"; x.fillRect(0, 0, 4, 4); x.fillStyle = "rgb(0,120,70)"; for (const i of [9, 10, 12]) x.fillRect(i % 4, Math.floor(i / 4), 1, 1);
  x.fillStyle = "rgb(0,140,0)"; x.fillRect(2, 0, 2, 1);
  return cv;
}
function tex4(cv, srgb, track) { const t = track(new THREE.CanvasTexture(cv)); t.flipY = false; t.magFilter = t.minFilter = THREE.NearestFilter; t.generateMipmaps = false; if (srgb) t.colorSpace = THREE.SRGBColorSpace; return t; }

export function makeCharKit(track) {
  const mats = new Map(); let mr = null; const geos = {};
  function matFor(base, look) {
    const p = paletteCanvas(base, look);
    if (mats.has(p.key)) return mats.get(p.key);
    if (!mr) mr = tex4(mrCanvas(), false, track);
    const m = track(new THREE.MeshStandardMaterial({ map: tex4(p.cv, true, track), roughnessMap: mr, metalnessMap: mr, roughness: 1, metalness: 1, flatShading: true }));
    mats.set(p.key, m); return m;
  }
  // props are built along simple axes in metres; attach() puts them into bone space
  function geo(kind) {
    if (geos[kind]) return geos[kind];
    const vc = (g, c) => { g = g.index ? g.toNonIndexed() : g; const n = g.attributes.position.count, a = new Float32Array(n * 3), cc = new THREE.Color(c); for (let i = 0; i < n; i++) { a[i * 3] = cc.r; a[i * 3 + 1] = cc.g; a[i * 3 + 2] = cc.b; } g.setAttribute("color", new THREE.BufferAttribute(a, 3)); g.deleteAttribute("uv"); return g; };
    let g;
    if (kind === "sword") g = mergeGeometries([vc(new THREE.BoxGeometry(0.85, 0.05, 0.012).translate(0.52, 0, 0), 0xc8ccd0), vc(new THREE.ConeGeometry(0.025, 0.08, 4).rotateZ(-Math.PI / 2).translate(0.98, 0, 0), 0xc8ccd0), vc(new THREE.BoxGeometry(0.04, 0.2, 0.04).translate(0.09, 0, 0), 0x6a5028), vc(new THREE.BoxGeometry(0.16, 0.035, 0.035).translate(-0.02, 0, 0), 0x3a2a1a), vc(new THREE.SphereGeometry(0.03, 6, 4).translate(-0.12, 0, 0), 0x6a5028)]);
    else if (kind === "spear") g = mergeGeometries([vc(new THREE.CylinderGeometry(0.02, 0.022, 2.4, 6).rotateZ(-Math.PI / 2).translate(0.5, 0, 0), 0x5a3e24), vc(new THREE.ConeGeometry(0.045, 0.28, 5).rotateZ(-Math.PI / 2).translate(1.84, 0, 0), 0xb8bcc0)]);
    else if (kind === "knife") g = mergeGeometries([vc(new THREE.BoxGeometry(0.3, 0.035, 0.01).translate(0.22, 0, 0), 0xb8bcc0), vc(new THREE.BoxGeometry(0.12, 0.035, 0.035).translate(0.02, 0, 0), 0x3a2a1a)]);
    else if (kind === "axe") g = mergeGeometries([vc(new THREE.CylinderGeometry(0.02, 0.02, 0.75, 6).rotateZ(-Math.PI / 2).translate(0.3, 0, 0), 0x5a3e24), vc(new THREE.BoxGeometry(0.16, 0.2, 0.02).translate(0.62, 0.09, 0), 0xa8acb0)]);
    else if (kind === "shield") g = mergeGeometries([vc(new THREE.CylinderGeometry(0.32, 0.32, 0.04, 14).rotateX(Math.PI / 2), 0xffffff), vc(new THREE.CylinderGeometry(0.335, 0.335, 0.03, 14).rotateX(Math.PI / 2).translate(0, 0, -0.012), 0x707478), vc(new THREE.SphereGeometry(0.06, 8, 4, 0, Math.PI * 2, 0, Math.PI / 2).rotateX(Math.PI / 2).translate(0, 0, 0.02), 0x9a9ea2)]);
    else if (kind === "helm") g = mergeGeometries([vc(new THREE.SphereGeometry(0.142, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2).scale(1, 1.15, 1.1), 0xffffff), vc(new THREE.CylinderGeometry(0.146, 0.15, 0.03, 12).scale(1, 1, 1.1).translate(0, 0.01, 0), 0xdddddd), vc(new THREE.BoxGeometry(0.022, 0.1, 0.02).translate(0, -0.03, 0.15), 0xdddddd)]);
    else if (kind === "spike") g = mergeGeometries([geo("helm").clone(), vc(new THREE.ConeGeometry(0.05, 0.14, 6).translate(0, 0.21, 0), 0xffffff)]);
    else if (kind === "lantern") g = vc(new THREE.BoxGeometry(0.1, 0.14, 0.1), 0xffffff);
    geos[kind] = track(g); return g;
  }
  const vcMats = new Map();
  function vcMat(hex, metal) { const key = hex + "|" + metal; if (vcMats.has(key)) return vcMats.get(key); const m = track(new THREE.MeshStandardMaterial({ color: hex, vertexColors: true, roughness: metal ? 0.42 : 0.8, metalness: metal ? 0.4 : 0, flatShading: true })); vcMats.set(key, m); return m; }
  return { matFor, geo, vcMat };
}

// attach a prop to a bone; offsets are metres along the bone's own axes, whatever the rig's unit scale
function attach(bone, mesh, pos, rot) {
  bone.updateWorldMatrix(true, false);
  const s = new THREE.Vector3(); bone.matrixWorld.decompose(new THREE.Vector3(), new THREE.Quaternion(), s);
  const k = 1 / (s.x || 1);
  mesh.scale.setScalar(k); mesh.position.set(pos[0] * k, pos[1] * k, pos[2] * k);
  if (rot) mesh.rotation.set(rot[0], rot[1], rot[2]);
  mesh.castShadow = true; bone.add(mesh); return mesh;
}

// look: { base: "man"|"soldier"|"woman", cloth, cloth2, legs, boots, metal, dark, leather, trim, hood, skin, hair,
//         helm: bool|"spike", weapon: "sword"|"spear"|"knife"|"axe"|null, shieldKind, shield: hex, lantern: hex, scale }
export const PROP = { sword: [[0, 0.085, 0], [0, 0, 0]], shield: [[0, 0.06, 0.07], [0, 0, 0]], helm: [[0, 0.125, 0.008], [0, 0, 0]] };
export function makeChar(ck, look) {
  let base = look.base; if (!MESH[base]) base = base === "knight" ? "soldier" : base === "mage" || base === "hood" ? "woman" : "man";
  const src = LIB.root;
  const o = skClone(src);
  const mat = ck.matFor(base, look);
  const drop = [];
  o.traverse((m) => { if (m.isSkinnedMesh) { if (m.name !== MESH[base]) drop.push(m); else { m.material = mat; m.castShadow = true; m.receiveShadow = false; m.frustumCulled = false; } } });
  drop.forEach((m) => m.parent.remove(m));
  const wrap = new THREE.Group(); wrap.rotation.order = "YXZ";
  o.scale.multiplyScalar((look.scale || 1) * (base === "woman" ? 0.98 : 1.03)); wrap.add(o);
  o.updateMatrixWorld(true);
  const hand = o.getObjectByName(BONE.hand), handL = o.getObjectByName(BONE.handL), head = o.getObjectByName(BONE.head);
  if (look.weapon && look.weapon !== "mug" && hand) attach(hand, new THREE.Mesh(ck.geo(look.weapon), ck.vcMat(0xffffff, look.weapon !== "spear")), PROP.sword[0], PROP.sword[1]);
  if (look.shieldKind && handL) attach(handL, new THREE.Mesh(ck.geo("shield"), ck.vcMat(look.shield || 0x6a4a2a, false)), PROP.shield[0], PROP.shield[1]);
  if (look.helm && head) attach(head, new THREE.Mesh(ck.geo(look.helm === "spike" ? "spike" : "helm"), ck.vcMat(look.metal || 0x8a8e94, true)), [PROP.helm[0][0], PROP.helm[0][1] - (base === "woman" ? 0.012 : 0), PROP.helm[0][2]], PROP.helm[1]);
  if (look.lantern && handL) attach(handL, new THREE.Mesh(ck.geo("lantern"), new THREE.MeshBasicMaterial({ color: look.lantern })), [0, 0.12, 0], null);
  const mixer = new THREE.AnimationMixer(o);
  const ch = new CharAnim(mixer, LIB.clips, look, o);
  wrap.userData.ch = ch;
  ch.set("idle", 0);
  mixer.update(Math.random() * 1.5);
  return wrap;
}

const Q = new THREE.Quaternion(), E = new THREE.Euler();
class CharAnim {
  constructor(mixer, clips, look, root) {
    this.m = mixer; this.clips = clips; this.acts = {}; this.cur = null; this.state = ""; this.prevAtk = 0; this.dead = false; this.lock = 0; this.acc = 0;
    this.armed = !!look.weapon && look.weapon !== "mug"; this.blocking = 0;
    this.armL = root.getObjectByName(BONE.armL); this.foreL = root.getObjectByName(BONE.foreL);
  }
  act(name) {
    if (!this.acts[name]) { const c = this.clips[name]; if (!c) return null; this.acts[name] = this.m.clipAction(c); }
    return this.acts[name];
  }
  set(state, fade, opts) {
    if (this.state === state && !(opts && opts.restart)) return;
    const name = { idle: this.armed ? "Idle_Sword" : "Idle", walk: "Walk", run: "Run", block: "Idle_Sword", hit: "HitRecieve", cheer: "Wave", use: "Interact", die: "Death", atk: this.armed ? "Sword_Slash" : "Punch_Right" }[state];
    const a = this.act(name); if (!a) return;
    a.reset(); a.enabled = true; a.setEffectiveWeight(1);
    if (opts && opts.once) { a.setLoop(THREE.LoopOnce, 1); a.clampWhenFinished = true; } else a.setLoop(THREE.LoopRepeat, Infinity);
    a.timeScale = (opts && opts.ts) || 1;
    if (this.cur && this.cur !== a) a.crossFadeFrom(this.cur, fade == null ? 0.18 : fade, false);
    a.play();
    this.cur = a; this.state = state;
  }
  // move: 0 still, ~1 walk, >1.2 run; atk: 1 at the start of a swing falling to 0; block: bool
  update(dt, move, atk, block, skip) {
    if (this.dead) { if (this.lock > 0) { this.lock -= dt; this.m.update(dt); } return; }
    if (atk > 0 && (this.prevAtk <= 0 || atk > this.prevAtk + 0.05)) { const c = this.clips[this.armed ? "Sword_Slash" : "Punch_Right"]; this.set("atk", 0.06, { once: true, restart: true, ts: c ? c.duration / 0.6 : 1.6 }); this.lock = 0.55; }
    this.prevAtk = atk;
    if (this.lock > 0) this.lock -= dt;
    else if (block) this.set("block", 0.12);
    else if (move > 1.2) { this.set("run", 0.2); this.cur.timeScale = Math.min(1.35, 0.8 + move * 0.2); }
    else if (move > 0.08) { this.set("walk", 0.2); this.cur.timeScale = Math.min(1.7, 0.6 + move * 0.75); }
    else this.set("idle", 0.25);
    this.blocking += ((block ? 1 : 0) - this.blocking) * Math.min(1, dt * 12);
    if (skip) { this.acc += dt; if (Math.random() < 1 / skip) { this.m.update(this.acc); this.acc = 0; } }
    else this.m.update(dt);
    // there is no block clip: raise the shield arm across the chest on top of the idle
    if (this.blocking > 0.02 && this.armL && this.foreL) {
      this.armL.quaternion.multiply(Q.setFromEuler(E.set(BLOCK[0] * this.blocking, BLOCK[1] * this.blocking, BLOCK[2] * this.blocking)));
      this.foreL.quaternion.multiply(Q.setFromEuler(E.set(BLOCK[3] * this.blocking, BLOCK[4] * this.blocking, BLOCK[5] * this.blocking)));
    }
  }
  die() { if (this.dead) return; this.set("die", 0.1, { once: true, ts: 1 }); this.dead = true; this.lock = 2.5; }
  cheer() { this.set("cheer", 0.2); }
}
export const BLOCK = [-0.6, 0, -1.25, 0, 0, -1.3];
