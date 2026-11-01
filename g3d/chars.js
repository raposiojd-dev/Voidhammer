// Rigged, animated people for the third-person scenes.
// Bodies and clips: KayKit Adventurers 1.0 by Kay Lousberg (CC0), trimmed by assets/chars/build-chars.mjs.
// One shared clip file drives every body (they share one rig). Each look gets its own recoloured copy of the
// tiny palette texture, so Realm cloth, banners, skin and hair change without new downloads.
// Proportions are nudged away from the chibi default: smaller head, longer legs.
import * as THREE from "./three.module.min.js";
import { GLTFLoader } from "./lib/GLTFLoader.js";
import { clone as skClone } from "./lib/SkeletonUtils.js";
import { mergeGeometries } from "./lib/BufferGeometryUtils.js";

const FILES = { knight: "knight.glb", barbarian: "barbarian.glb", rogue: "rogue.glb", hood: "rogue_hooded.glb", mage: "mage.glb" };
// palette cells ("col,row" on the 8 x 4 grid) that carry each part of the outfit, per body
const SLOTS = {
  knight: { cloth: ["0,1", "2,2"], metal: ["3,0", "1,1", "2,1"], dark: ["4,0", "7,1"], leather: ["5,0", "6,0", "7,0"], skin: ["0,0"], hair: ["1,0"], shield: ["6,1"] },
  barbarian: { cloth: ["0,1", "1,1", "2,2"], fur: ["2,1", "0,2"], legs: ["3,2"], leather: ["5,0", "6,0", "7,0", "7,1"], metal: ["3,0", "4,0"], skin: ["0,0"], hair: ["1,0"], shield: ["4,1"] },
  rogue: { cloth: ["1,1", "1,2"], cloth2: ["0,1"], legs: ["3,2"], gloves: ["5,2"], leather: ["5,0", "6,0", "7,0", "7,1"], metal: ["3,0"], skin: ["0,0"], hair: ["1,0"] },
  mage: { cloth: ["0,1", "1,1"], cloth2: ["7,1"], cape: ["2,1", "1,2"], metal: ["3,0", "4,0"], leather: ["5,0", "6,0", "7,0"], legs: ["3,2"], skin: ["0,0"], hair: ["1,0"] }
};
SLOTS.hood = SLOTS.rogue;
const METAL_CELLS = ["3,0", "4,0", "1,1", "2,1", "3,1"];
const ACC = { helm: ["Knight_Helmet", "Barbarian_Hat", "Mage_Hat"], cape: ["Knight_Cape", "Barbarian_Cape", "Rogue_Cape", "Mage_Cape"], shields: ["Round_Shield", "Badge_Shield", "Rectangle_Shield", "Barbarian_Round_Shield"], weapons: ["1H_Sword", "1H_Axe", "Knife", "Mug"] };

let loading = null, LIB = null;
export function loadChars() {
  if (loading) return loading;
  const url = (f) => new URL("./assets/chars/" + f, import.meta.url).href;
  const loader = new GLTFLoader();
  const get = (f) => loader.loadAsync(url(f));
  const names = Object.keys(FILES);
  loading = Promise.all([get("anims.glb"), ...names.map((k) => get(FILES[k]))]).then(([an, ...gl]) => {
    const clips = {}; an.animations.forEach((c) => { clips[c.name] = c; });
    const tpl = {};
    names.forEach((k, i) => { tpl[k] = prepTemplate(gl[i].scene); });
    LIB = { clips, tpl };
    return LIB;
  });
  return loading;
}
export function charsReady() { return !!LIB; }

// merge the skinned body parts into one draw call; keep rigid bits (helmets, shields, weapons) as their own meshes
function prepTemplate(root) {
  const skinned = []; let rig = null;
  root.traverse((o) => { if (o.isSkinnedMesh) skinned.push(o); });
  const base = skinned[0], mat = base.material, img = mat.map && mat.map.image;
  rig = base.parent;
  const geos = skinned.map((m) => { const g = m.geometry.clone(); for (const k of Object.keys(g.attributes)) if (!["position", "normal", "uv", "skinIndex", "skinWeight"].includes(k)) g.deleteAttribute(k); return g.index ? g.toNonIndexed() : g; });
  const merged = mergeGeometries(geos, false);
  const body = new THREE.SkinnedMesh(merged, mat); body.name = "Body";
  body.bind(base.skeleton, base.bindMatrix);
  skinned.forEach((m) => m.parent.remove(m));
  rig.add(body);
  geos.forEach((g) => g.dispose());
  const acc = {}; root.traverse((o) => { if (o.isMesh && !o.isSkinnedMesh) acc[o.name] = o; });
  return { root, img, mat, acc, handR: root.getObjectByName("handslot.r"), handL: root.getObjectByName("handslot.l") };
}

// ---------- recoloured palette textures and materials (cached per scene kit) ----------
function cellsOf(c) { const [x, y] = c.split(",").map(Number); return [x, y]; }
function recolour(img, base, look, S) {
  const N = 256, cv = document.createElement("canvas"); cv.width = cv.height = N;
  const x = cv.getContext("2d"); x.drawImage(img, 0, 0, N, N);
  const slots = SLOTS[base]; const cw = N / 8, ch = N / 4;
  const want = [];
  for (const k of Object.keys(slots)) if (look[k] !== undefined && look[k] !== null) for (const c of slots[k]) want.push([c, new THREE.Color(look[k])]);
  if (!want.length) return cv;
  const d = x.getImageData(0, 0, N, N), px = d.data;
  for (const [c, col] of want) {
    const [cx, cy] = cellsOf(c), x0 = cx * cw, y0 = cy * ch;
    let sum = 0, n = 0;
    for (let yy = y0; yy < y0 + ch; yy++) for (let xx = x0; xx < x0 + cw; xx++) { const i = (yy * N + xx) * 4; sum += px[i] * 0.3 + px[i + 1] * 0.59 + px[i + 2] * 0.11; n++; }
    const mean = Math.max(8, sum / n);
    // target in sRGB 0..255
    const tr = col.r * 255, tg = col.g * 255, tb = col.b * 255;
    for (let yy = y0; yy < y0 + ch; yy++) for (let xx = x0; xx < x0 + cw; xx++) {
      const i = (yy * N + xx) * 4, l = (px[i] * 0.3 + px[i + 1] * 0.59 + px[i + 2] * 0.11) / mean, k = 0.55 + 0.45 * l;
      px[i] = Math.min(255, tr * k); px[i + 1] = Math.min(255, tg * k); px[i + 2] = Math.min(255, tb * k);
    }
  }
  x.putImageData(d, 0, 0);
  return cv;
}
function metalRough() {
  // G = roughness, B = metalness on the same 8 x 4 grid
  const N = 32, cv = document.createElement("canvas"); cv.width = cv.height = N; const x = cv.getContext("2d");
  x.fillStyle = "rgb(0,205,0)"; x.fillRect(0, 0, N, N);
  x.fillStyle = "rgb(0,125,32)"; for (const c of METAL_CELLS) { const [cx, cy] = cellsOf(c); x.fillRect(cx * N / 8, cy * N / 4, N / 8, N / 4); }
  return cv;
}

export function makeCharKit(track) {
  const mats = new Map(); let mr = null, spearGeo = null, spearMat = null;
  const getMR = () => { if (!mr) { mr = track(new THREE.CanvasTexture(metalRough())); mr.flipY = false; mr.magFilter = THREE.NearestFilter; } return mr; };
  function matFor(base, look) {
    const slots = SLOTS[base], key = base + "|" + Object.keys(slots).map((k) => look[k] == null ? "" : new THREE.Color(look[k]).getHexString()).join(",");
    if (mats.has(key)) return mats.get(key);
    const t = LIB.tpl[base];
    const tex = track(new THREE.CanvasTexture(recolour(t.img, base, look)));
    tex.flipY = false; tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 2;
    const m = track(new THREE.MeshStandardMaterial({ map: tex, roughnessMap: getMR(), metalnessMap: getMR(), roughness: 1, metalness: 1, envMapIntensity: 0.6 }));
    mats.set(key, m); return m;
  }
  function spear() {
    if (!spearGeo) {
      const shaft = new THREE.CylinderGeometry(0.035, 0.04, 2.5, 6).translate(0, 0.35, 0);
      const tip = new THREE.ConeGeometry(0.07, 0.32, 6).translate(0, 1.76, 0);
      const cs = (g, c) => { const n = g.attributes.position.count, a = new Float32Array(n * 3), cc = new THREE.Color(c); for (let i = 0; i < n; i++) { a[i * 3] = cc.r; a[i * 3 + 1] = cc.g; a[i * 3 + 2] = cc.b; } g.setAttribute("color", new THREE.BufferAttribute(a, 3)); g.deleteAttribute("uv"); return g.index ? g.toNonIndexed() : g; };
      spearGeo = track(mergeGeometries([cs(shaft, 0x5a3e24), cs(tip, 0xb8bcc0)]));
      spearMat = track(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.6, metalness: 0.3 }));
    }
    return new THREE.Mesh(spearGeo, spearMat);
  }
  return { matFor, spear };
}

// look: { base, cloth, cloth2, cape, skin, hair, metal, dark, leather, legs, gloves, fur, shield: hex, helm: bool, capeOn: bool,
//         weapon: "sword"|"axe"|"knife"|"spear"|"mug"|null, shieldKind: "round"|"badge"|"rect"|null, scale }
export function makeChar(ck, look) {
  const base = look.base || "rogue", T = LIB.tpl[base];
  const o = skClone(T.root);
  const mat = ck.matFor(base, look);
  const wantW = { sword: "1H_Sword", axe: "1H_Axe", knife: "Knife", mug: "Mug" }[look.weapon] || null;
  const wantS = look.shieldKind ? (base === "barbarian" ? "Barbarian_Round_Shield" : { round: "Round_Shield", badge: "Badge_Shield", rect: "Rectangle_Shield" }[look.shieldKind]) : null;
  const meshes = [];
  o.traverse((m) => {
    if (!m.isMesh) return;
    m.material = mat; m.castShadow = true; m.receiveShadow = false;
    if (m.isSkinnedMesh) { meshes.push(m); return; }
    const n = m.name;
    if (ACC.helm.includes(n)) m.visible = !!look.helm;
    else if (ACC.cape.includes(n)) m.visible = !!look.capeOn;
    else if (ACC.shields.includes(n)) m.visible = n === wantS;
    else if (ACC.weapons.includes(n)) m.visible = n === wantW;
    meshes.push(m);
  });
  const hand = o.getObjectByName("handslot.r"), handL = o.getObjectByName("handslot.l");
  // borrow a weapon or shield from another body when this one has none
  if (wantW && !o.getObjectByName(wantW)) {
    const src = Object.values(LIB.tpl).map((t) => t.acc[wantW]).find(Boolean);
    if (src && hand) { const w = new THREE.Mesh(src.geometry, look.weaponMat || ck.matFor(src === LIB.tpl.knight.acc[wantW] ? "knight" : base, {})); w.position.copy(src.position); w.quaternion.copy(src.quaternion); w.castShadow = true; hand.add(w); }
  }
  if (wantS && !o.getObjectByName(wantS)) {
    const src = LIB.tpl.knight.acc[wantS] || LIB.tpl.knight.acc.Round_Shield;
    if (src && handL) { const s = new THREE.Mesh(src.geometry, ck.matFor("knight", { shield: look.shield, metal: look.metal })); s.position.copy(src.position); s.quaternion.copy(src.quaternion); s.castShadow = true; handL.add(s); }
  }
  if (look.weapon === "spear" && hand) { const s = ck.spear(); s.castShadow = true; hand.add(s); }
  // proportions: smaller head, longer legs, overall about 1.8 m
  const head = o.getObjectByName("head"); if (head) head.scale.setScalar(0.7);
  for (const nm of ["upperleg.l", "upperleg.r"]) { const b = o.getObjectByName(nm); if (b) b.scale.setScalar(1.24); }
  const wrap = new THREE.Group(); wrap.rotation.order = "YXZ";
  o.position.y = 0.1; wrap.add(o);
  o.scale.setScalar(0.86 * (look.scale || 1) * (look.squat || 1));
  const mixer = new THREE.AnimationMixer(o);
  const ch = new CharAnim(mixer, LIB.clips, look);
  wrap.userData.ch = ch; wrap.userData.meshes = meshes;
  ch.set("idle", 0);
  mixer.update(Math.random() * 1.2);
  return wrap;
}

class CharAnim {
  constructor(mixer, clips, look) {
    this.m = mixer; this.clips = clips; this.acts = {}; this.cur = null; this.state = ""; this.prevAtk = 0; this.dead = false; this.lock = 0; this.acc = 0; this.flip = Math.random() < 0.5;
    this.spear = look.weapon === "spear";
  }
  act(name) {
    if (!this.acts[name]) { const c = this.clips[name]; if (!c) return null; this.acts[name] = this.m.clipAction(c); }
    return this.acts[name];
  }
  set(state, fade, opts) {
    if (this.state === state && !(opts && opts.restart)) return;
    const name = { idle: "Idle", walk: "Walking_A", run: "Running_A", block: "Blocking", hit: "Hit_A", cheer: "Cheer", use: "Interact", die: this.flip ? "Death_A" : "Death_B", atk: this.spear ? "1H_Melee_Attack_Stab" : this.flip ? "1H_Melee_Attack_Chop" : "1H_Melee_Attack_Slice_Horizontal" }[state];
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
    if (atk > 0 && (this.prevAtk <= 0 || atk > this.prevAtk + 0.05)) { const c = this.clips[this.spear ? "1H_Melee_Attack_Stab" : "1H_Melee_Attack_Chop"]; this.flip = !this.flip; this.set("atk", 0.06, { once: true, restart: true, ts: c ? c.duration / 0.62 : 1.6 }); this.lock = 0.6; }
    this.prevAtk = atk;
    if (this.lock > 0) this.lock -= dt;
    else if (block) this.set("block", 0.12);
    else if (move > 1.2) { this.set("run", 0.2); this.cur.timeScale = Math.min(1.4, 0.75 + move * 0.25); }
    else if (move > 0.08) { this.set("walk", 0.2); this.cur.timeScale = Math.min(1.6, 0.55 + move * 0.7); }
    else this.set("idle", 0.25);
    // far-away people update less often
    if (skip) { this.acc += dt; if (Math.random() < 1 / skip) { this.m.update(this.acc); this.acc = 0; } return; }
    this.m.update(dt);
  }
  die() { if (this.dead) return; this.set("die", 0.1, { once: true, ts: 1 }); this.dead = true; this.lock = 3; }
  cheer() { this.set("cheer", 0.2); }
}
