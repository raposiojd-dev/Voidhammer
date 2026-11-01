// Voidhammer: The Shattered Realms. Field battles and sieges you fight yourself, Bannerlord-style.
// You control your hero directly (stick, look, Strike / Block / Shoot with light auto-target); your men stand in
// formations by troop type (infantry line, shield wall, archers, cavalry) and take orders from a thumb-sized order fan:
// Follow me, Hold, Charge, Advance, Shield wall, Fire at will / Hold fire. Archers loose arcing volleys you can see,
// cavalry charge home with impact and knockback, morale breaks lines, and Kaelren fights at your side (his vow is
// unchanged: wounded, never killed). Sieges add walls, a gate, towers, ladders and a ram (siege3d.js builds the walls).
// The scene never touches game numbers: it reports how much of each side is left, and the bridge feeds that to
// finishBattle exactly as the 2D field does.
import { K3 } from "./scene3d.js";
import { Merge, paintedSky, grassField, groundMat, horizonBand, loadArt } from "./art.js";
import { buildSiege } from "./siege3d.js";
const { THREE, REALMS, VOIDC, GROUND_TEX, GRASS_TINT, GRASS_N, CLOUD, COLD, tree, rng, vnoise, clamp, lerp, angLerp, shade, mix,
  makeStage, makeKit, whenChars, heroLook, kaelLook, figure, animFigure, Batch, lights, particles, followCam, moveIntent, esc } = K3;

const G = 9.8;
const ORD = { follow: "Follow me", hold: "Hold", charge: "Charge!", advance: "Advance", wall: "Shield wall" };
let styled = false;
function styleOnce() {
  if (styled) return; styled = true;
  const st = document.createElement("style");
  st.textContent = `
#vh3d .b3-btns{position:absolute;right:calc(.7rem + var(--vh-sr,0px));bottom:calc(1rem + var(--vh-sb,env(safe-area-inset-bottom,0px)));display:grid;grid-template-columns:auto auto;grid-template-rows:auto auto;gap:.55rem;align-items:end;justify-items:center}
#vh3d .b3-btns button{border-radius:50%;border:2px solid #c8a060;color:#fff2cf;font:700 .74rem 'Cinzel',Georgia,serif;letter-spacing:.06em;text-shadow:0 1px 2px #000;box-shadow:0 4px 14px #000a;touch-action:none;cursor:pointer;padding:0}
#vh3d .b3-btns [data-b=atk]{grid-column:2;grid-row:2;width:5.6rem;height:5.6rem;background:radial-gradient(circle at 40% 30%,#c23a2a,#5a120c 70%)}
#vh3d .b3-btns [data-b=blk]{grid-column:1;grid-row:2;width:4.4rem;height:4.4rem;background:radial-gradient(circle at 40% 30%,#6a7a8a,#1e2630 70%)}
#vh3d .b3-btns [data-b=shoot]{grid-column:2;grid-row:1;width:4.2rem;height:4.2rem;background:radial-gradient(circle at 40% 30%,#8a7a3a,#2a240c 70%)}
#vh3d .b3-btns button.on{filter:brightness(1.5);transform:scale(.95)}
#vh3d .b3-ordbtn{position:absolute;left:50%;transform:translateX(-50%);bottom:calc(1rem + env(safe-area-inset-bottom,0px));padding:.85rem 1.5rem;border-radius:999px;border:2px solid #e3c27a;background:radial-gradient(circle at 50% 30%,#4a3214,#1a1208 70%);color:#fff2cf;font:700 .95rem 'Cinzel',Georgia,serif;letter-spacing:.08em;box-shadow:0 0 18px #c8873a66,0 6px 16px #000;touch-action:none;cursor:pointer}
#vh3d .b3-ordbtn small{display:block;font:500 .6rem 'IBM Plex Mono',monospace;letter-spacing:.12em;color:#e8d8a8;text-transform:uppercase}
#vh3d .b3-fan{position:absolute;left:50%;bottom:calc(5.6rem + env(safe-area-inset-bottom,0px));transform:translateX(-50%);display:none;flex-direction:column;align-items:center;gap:.45rem;padding:.6rem;background:#0c0906e6;border:1px solid #8a6a30;border-radius:8px;box-shadow:0 10px 30px #000c;max-width:94vw}
#vh3d .b3-fan.on{display:flex}
#vh3d .b3-fan .row{display:flex;gap:.35rem;flex-wrap:wrap;justify-content:center}
#vh3d .b3-fan button{min-width:5.6rem;padding:.75rem .6rem;border-radius:6px;border:1px solid #6a5535;background:#1a1610;color:#efe6cf;font:600 .78rem 'Cinzel',Georgia,serif;cursor:pointer;touch-action:none}
#vh3d .b3-fan button small{display:block;font:500 .55rem 'IBM Plex Mono',monospace;color:#b8a07a;margin-top:.15rem}
#vh3d .b3-fan .grp button{min-width:4.4rem;padding:.5rem .4rem;font-size:.66rem}
#vh3d .b3-fan button.on{background:#c8873a;color:#1a1208;border-color:#ffd884}
#vh3d .b3-groups{position:absolute;left:.8rem;top:calc(5.2rem + env(safe-area-inset-top,0px));pointer-events:none;font:500 .62rem 'IBM Plex Mono',monospace;color:#e8d8b0;text-shadow:0 1px 2px #000;line-height:1.6;letter-spacing:.06em}
#vh3d .b3-groups b{color:#ffd884;font-weight:600}
#vh3d .v3-keys.b3k{bottom:auto;top:calc(3.6rem + env(safe-area-inset-top,0px));right:1rem;transition:opacity 1s}
@media (max-width:600px){#vh3d .b3-groups{top:calc(7.4rem + env(safe-area-inset-top,0px))}#vh3d .b3-ordbtn{bottom:calc(7.2rem + env(safe-area-inset-bottom,0px));padding:.7rem 1.1rem;font-size:.85rem}#vh3d .b3-fan{bottom:calc(11.6rem + env(safe-area-inset-bottom,0px))}#vh3d .b3-fan button{min-width:4.6rem;padding:.65rem .4rem;font-size:.7rem}}
`;
  document.head.appendChild(st);
}

export function battle(api, info, done) {
  styleOnce();
  let st;
  try { st = makeStage(info.siege ? "The walls are manned…" : "The lines are forming…", { keys: ["w", "a", "s", "d", "q", "e", "f", "c", "h", "r", "v", "b", "x", "g", "1", "2", "3", "4", "5", "6", "7", "8", "9", "l", " ", "shift", "control", "arrowup", "arrowdown", "arrowleft", "arrowright", "escape"] }); }
  catch (e) { api.fail(e); setTimeout(() => done({ how: "fail" }), 0); return null; }
  loadArt(st, info.realm);
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
  const white = kit.mat(0xffffff), art = kit.art;
  const fogC = isVoid ? mix(P.fog, 0x2a2040, 0.6) : new THREE.Color(P.fog);
  scene.fog = new THREE.FogExp2(fogC, isVoid ? 0.018 : 0.011);
  const L = lights(st, P, new THREE.Vector3(0, 0, 0), 32, { dim: isVoid, cold: isVoid || COLD[info.realm] });
  const sky = paintedSky(isVoid ? mix(P.sky, 0x1a1030, 0.6) : P.sky, mix(fogC, 0xffffff, 0.1), L.sun.position.clone(), L.sun.color, Math.max(info.voidNear, isVoid ? 1 : 0), VOIDC, isVoid ? 0.8 : CLOUD[info.realm]); scene.add(sky);
  // the Realm's painted horizon behind the field (not in the Void), and its colour grade on High
  const band = isVoid ? null : horizonBand(info.realm, fogC, (x) => st.track(x), { amt: 0.42 }); if (band) scene.add(band);
  st.setGrade(isVoid ? "shadow" : info.realm);
  if (isVoid) { L.sun.color = mix(P.sun, 0xb8a8ff, 0.5); const vl = new THREE.PointLight(VOIDC, 80, 70, 1.4); vl.position.set(0, 10, -34); scene.add(vl); }

  // ---------- terrain (flat where the lines meet, hills beyond; a siege flattens the approach to the walls) ----------
  let siegeOn = !!info.siege;
  const H0 = (x, z) => { const e = clamp((Math.max(Math.abs(x) - 30, Math.abs(z) - 38, 0)) / 30, 0, 1); return (vnoise(x * 0.05, z * 0.05) - 0.5) * (1.0 + e * 10) + (vnoise(x * 0.18 + 9, z * 0.18) - 0.5) * 0.3 + e * e * 6; };
  let SG = null; // the siege layout (walls, gate, ladders) once built
  const H = (x, z) => { const h = H0(x, z) * (siegeOn ? 0.35 : 1); return SG ? SG.height(x, z, h) : h; };
  const tg = new THREE.PlaneGeometry(260, 260, 96, 96); tg.rotateX(-Math.PI / 2);
  { const pos = tg.attributes.position, uv = tg.attributes.uv, col = [], c0 = new THREE.Color(isVoid ? mix(P.ground, 0x3a2a4a, 0.4) : P.ground), c = new THREE.Color(), cv = new THREE.Color(0x4a2a6a), cd = shade(P.path, 0.9);
    for (let i = 0; i < pos.count; i++) { const x = pos.getX(i), z = pos.getZ(i), y = H0(x, z) * (siegeOn ? 0.35 : 1); pos.setY(i, y); uv.setXY(i, x / 6, z / 6); const n = vnoise(x * 0.1, z * 0.1); c.copy(c0).multiplyScalar(0.8 + n * 0.32 + y * 0.012); if (!isVoid && vnoise(x * 0.06 + 7, z * 0.06) > 0.66) c.lerp(cd, 0.45); if (isVoid && vnoise(x * 0.07 + 3, z * 0.07) > 0.62) c.lerp(cv, 0.5); col.push(c.r, c.g, c.b); }
    tg.setAttribute("color", new THREE.Float32BufferAttribute(col, 3)); tg.setAttribute("aBlend", new THREE.BufferAttribute(new Float32Array(pos.count), 1)); tg.computeVertexNormals(); }
  const BGT = isVoid ? "dirt" : GROUND_TEX[info.realm] || "grass";
  const terr = new THREE.Mesh(tg, groundMat(art, BGT, BGT === "grass" || BGT === "plaster" ? "dirt" : "grass", !isVoid && info.realm !== "frost" && info.realm !== "light")); terr.receiveShadow = true; scene.add(terr); st.track(tg);
  const B = new Batch(kit), M = new Merge();
  const tc = info.realm === "frost" ? 0x3a5048 : info.realm === "light" ? 0x7a8a3a : isVoid ? 0x2a2434 : 0x2e4a2a;
  for (let i = 0; i < 150; i++) { const x = (rand() - 0.5) * 220, z = (rand() - 0.5) * 220; if (Math.abs(x) < 34 && Math.abs(z) < (siegeOn ? 62 : 42) && rand() < 0.94) continue; tree(B, white, x, H0(x, z) * (siegeOn ? 0.35 : 1), z, 3 + rand() * 5, tc, rand); }
  for (let i = 0; i < 36; i++) { const x = (rand() - 0.5) * 120, z = (rand() - 0.5) * 140; if (siegeOn && z < -20) continue; const s = 0.6 + rand() * 1.6; B.add("rock", white, x, H0(x, z) * (siegeOn ? 0.35 : 1) + s * 0.25, z, s, s * 0.8, s, rand() * 6, shade(P.stone, 0.75 + rand() * 0.3)); }
  if (isVoid) for (let i = 0; i < 14; i++) { const a = rand() * Math.PI * 2, r = 16 + rand() * 40, x = Math.cos(a) * r, z = Math.sin(a) * r - 10; const m = new THREE.Mesh(kit.g.cone, kit.mat(0x6a4aa0, { emissive: VOIDC, emissiveIntensity: 0.8, roughness: 0.3 })); const s = 0.6 + rand() * 1.4; m.scale.set(s, s * 3, s); m.position.set(x, H0(x, z) + s * 1.2, z); m.rotation.set(rand() - 0.5, 0, rand() - 0.5); m.castShadow = true; scene.add(m); }
  for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2, r = 175 + rand() * 30; B.add("cone", white, Math.cos(a) * r, 16, Math.sin(a) * r, 70 + rand() * 50, 40 + rand() * 40, 70 + rand() * 50, rand(), shade(P.ground, 0.5), { noShadow: true }); }
  B.build(scene); M.build(scene, (g) => st.track(g));
  { const tint = isVoid ? [0x3a3048, 0x5a4a6a] : GRASS_TINT[info.realm] || [0x6a8a3a, 0x9aa84a];
    const n = Math.round((st.gfx === "low" ? 0 : st.coarse ? 1800 : 4000) * (isVoid ? 0.5 : GRASS_N[info.realm] || 1));
    const gf = grassField((x) => st.track(x), n, () => { const x = (rand() - 0.5) * 110, z = (rand() - 0.5) * 120; if (siegeOn && z < -26) return null; return [x, H0(x, z) * (siegeOn ? 0.35 : 1), z]; }, tint[0], tint[1]);
    if (gf) { scene.add(gf); st.onGfx.push((q) => { gf.visible = q !== "low"; }); } }
  const fx = particles(st, isVoid ? "void" : P.fx, isVoid ? 240 : info.realm === "frost" ? 380 : 180, 80, 14, isVoid ? null : P.fxc); scene.add(fx);

  // ---------- sides and who is attacking (sieges) ----------
  // In a siege the defenders hold the walls at -Z. info.defend: the player holds the walls (their own hold is attacked).
  let defendP = siegeOn && !!info.defend;
  if (siegeOn) { SG = buildSiege(st, kit, art, P, info, H0, defendP); if (!SG) { siegeOn = false; defendP = false; } }
  const pDir = defendP ? -1 : 1; // the player's side starts at +Z (attacking or open field) or behind the walls at -Z (defending)

  // ---------- forces ----------
  const cap = st.coarse ? 44 : 70;
  const allyN = info.allies.reduce((a, h) => a + Math.max(2, Math.round(h.s)), 0);
  const nAllyU = info.allyS > 0 ? clamp(Math.min(16, allyN), 1, 16) : 0;
  const nOwnU = clamp(Math.round(info.t0), 1, cap - nAllyU), NE = clamp(Math.round(info.en0), 3, cap);
  const units = [], groups = { p: {}, e: {} };
  const ec = new THREE.Color(info.ecol), bc = new THREE.Color(info.banner), ecol2 = Math.abs(ec.r - bc.r) + Math.abs(ec.g - bc.g) + Math.abs(ec.b - bc.b) < 0.35 ? shade(info.ecol, 0.5).getHex() : info.ecol;
  // troop types: own from the roster mix (bridge), enemies by kind
  const ownMix = info.mix || { inf: 1 }, mm = info.mult || {};
  const eMix = isVoid ? { inf: 1 } : info.kind === "bandit" ? { inf: 0.72, arch: 0.28 } : siegeOn ? { inf: 0.5, spear: 0.12, arch: 0.3, cav: 0.08 } : { inf: 0.5, spear: 0.1, arch: 0.25, cav: 0.15 };
  function split(n, fr) { const keys = ["cav", "arch", "spear", "inf"], out = {}; let left = n; keys.forEach((k, i) => { const v = i === keys.length - 1 ? left : Math.min(left, Math.round(n * (fr[k] || 0))); out[k] = v; left -= v; }); return out; }
  const ownSplit = split(nOwnU, ownMix), eSplit = split(NE, eMix);
  if (siegeOn) { /* no horses on the walls: defenders' cavalry fight as infantry */ if (!defendP) { eSplit.inf += eSplit.cav; eSplit.cav = 0; } else { ownSplit.inf += ownSplit.cav; ownSplit.cav = 0; } }
  const sumMult = ["inf", "spear", "arch", "cav"].reduce((a, k) => a + (ownSplit[k] || 0) * (mm[k] || 1), 0) || 1;
  const ownBase = (info.p0 - (info.allyS || 0)) / sumMult;
  const enemyLook = (cls) => {
    const wpn = cls === "arch" ? "bow" : cls === "spear" ? "spear" : rand() < 0.3 ? "spear" : "sword";
    if (isVoid) return { cloth: 0x1e1828, cloth2: 0x141018, skin: 0x3a2a4a, helm: "hood", hoodc: 0x16121e, eyes: VOIDC, weapon: wpn === "bow" ? null : wpn, cloak: 0x241a34 };
    if (info.fac) { const r = REALMS[info.fac] || P; return { cloth: r.cloth[0], cloth2: r.cloth[3] || 0x2a2420, armour: cls !== "arch", metal: info.fac === "metal" ? 0x2c2c30 : info.fac === "light" ? 0xd0b050 : info.fac === "frost" ? 0x6a7a8a : 0x8a8e94, tabard: ecol2, helm: info.fac === "metal" ? "spike" : info.fac === "shadow" ? "hood" : "cap", weapon: wpn, shield: cls === "arch" || info.fac === "shadow" ? null : ecol2 }; }
    return { cloth: [0x6a4a2a, 0x4a3a2a, 0x5a3a24, 0x3a3020][Math.floor(rand() * 4)], cloth2: 0x2a2018, skin: [0xc89a78, 0x9a6a48, 0xd8b090][Math.floor(rand() * 3)], helm: rand() < 0.5 ? "hood" : rand() < 0.5 ? "cap" : "bare", hoodc: 0x3a2a1c, weapon: wpn, shield: cls !== "arch" && rand() < 0.4 ? 0x6a4a2a : null, armour: rand() < 0.2 };
  };
  const ownLook = (cls, ally) => {
    const wpn = cls === "arch" ? "bow" : cls === "spear" ? "spear" : rand() < 0.3 ? "spear" : "sword";
    if (ally) return { cloth: 0x3a3428, cloth2: 0x2a2420, armour: cls !== "arch", tabard: ally.col, helm: "cap", weapon: wpn, shield: cls === "arch" ? null : ally.col };
    return { cloth: 0x4a3e30, cloth2: 0x2a2420, armour: cls !== "arch" && rand() < 0.65, tabard: info.banner, helm: rand() < 0.7 ? "cap" : "bare", weapon: wpn, shield: cls === "arch" ? null : rand() < 0.75 ? info.banner : null };
  };
  const ringGeo = st.track(new THREE.RingGeometry(0.3, 0.42, 16));
  const ringMat = (c, o) => st.track(new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: o, depthWrite: false }));
  const ringP = ringMat(0xffd884, 0.5), ringHero = ringMat(0xffffff, 0.9), ringE = ringMat(isVoid ? 0xb89cff : 0xff3a2a, 0.55), ringSel = ringMat(0x9fe8ff, 0.75);
  // a horse: a few boxes and four swinging legs (no extra download); the rider sits on it
  const horseMat = [kit.mat(0x5a3c24), kit.mat(0x3a2818), kit.mat(0x2a1e14), kit.mat(0x7a5a3a)];
  function horse(col) {
    const g = new THREE.Group(), m = horseMat[col % horseMat.length], dark = horseMat[2];
    const body = new THREE.Mesh(kit.g.box, m); body.scale.set(0.62, 0.62, 1.55); body.position.y = 1.18; g.add(body);
    const neck = new THREE.Mesh(kit.g.box, m); neck.scale.set(0.32, 0.75, 0.38); neck.position.set(0, 1.62, 0.72); neck.rotation.x = 0.55; g.add(neck);
    const head = new THREE.Mesh(kit.g.box, m); head.scale.set(0.26, 0.28, 0.58); head.position.set(0, 1.98, 1.02); head.rotation.x = 0.35; g.add(head);
    const tail = new THREE.Mesh(kit.g.box, dark); tail.scale.set(0.1, 0.55, 0.1); tail.position.set(0, 1.15, -0.85); tail.rotation.x = -0.4; g.add(tail);
    const legs = [];
    for (const [lx, lz] of [[-0.2, 0.6], [0.2, 0.6], [-0.2, -0.6], [0.2, -0.6]]) { const pv = new THREE.Group(); pv.position.set(lx, 0.98, lz); const lg = new THREE.Mesh(kit.g.box, dark); lg.scale.set(0.14, 0.98, 0.16); lg.position.y = -0.49; pv.add(lg); g.add(pv); legs.push(pv); }
    g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
    g.userData.legs = legs; return g;
  }
  function addUnit(side, cls, w, look, extra) {
    const root = new THREE.Group(); scene.add(root);
    let f, hs = null;
    if (cls === "cav") { hs = horse(units.length); root.add(hs); f = figure(kit, look); f.position.y = 0.98; f.scale.multiplyScalar(0.92); root.add(f); }
    else { f = figure(kit, look); root.add(f); }
    const ring = new THREE.Mesh(ringGeo, side === "p" ? (extra && extra.hero ? ringHero : ringP) : ringE); ring.rotation.x = -Math.PI / 2; ring.position.y = 0.05; if (cls === "cav") ring.scale.setScalar(1.8); root.add(ring);
    const hpm = w * 3.2 * (cls === "cav" ? 1.3 : cls === "arch" ? 0.85 : 1);
    const u = Object.assign({ root, f, hs, ring, side, cls, w, hp: hpm, hpm, x: 0, z: 0, y: 0, yaw: side === "p" ? Math.PI : 0, tgt: null, cd: 0.4 + rand() * 0.8, atk: 0, rout: false, dead: false, gone: false, deadT: 0, t: rand() * 10, mv: 0, retarget: rand() * 0.3,
      reach: look.weapon === "spear" ? 1.8 : 1.35, shot: 1 + rand() * 2, kx: 0, kz: 0, stag: 0, cs: "form", csT: 0, morale: 1, sx: 0, sz: 0, slot: -1, onWall: false, climb: null }, extra || {});
    units.push(u); return u;
  }
  // own troops
  for (const k of ["inf", "spear", "arch", "cav"]) for (let i = 0; i < (ownSplit[k] || 0); i++) addUnit("p", k === "spear" ? "inf" : k, ownBase * (mm[k] || 1), ownLook(k), { spear: k === "spear" });
  info.allies.forEach((a) => { const n = Math.max(1, Math.round(nAllyU * a.s / Math.max(0.001, info.allyS))); for (let j = 0; j < n; j++) { const k = j % 4 === 3 ? "arch" : "inf"; addUnit("p", k, info.allyS / Math.max(1, nAllyU), ownLook(k, a), { ally: true }); } });
  const we = info.e0 / NE;
  for (const k of ["inf", "spear", "arch", "cav"]) for (let i = 0; i < (eSplit[k] || 0); i++) addUnit("e", k === "spear" ? "inf" : k, we, enemyLook(k), { spear: k === "spear" });
  const sumW = (s) => units.filter((u) => u.side === s && !u.hero && !u.kael).reduce((a, u) => a + u.w, 0);
  const p0w = sumW("p"), e0w = sumW("e");
  const hero = addUnit("p", "hero", info.heroW, { ch: heroLook(info.banner, true) }, { hero: true });
  hero.hp = hero.hpm = info.heroHp; hero.reach = 1.9;
  let kael = null;
  if (info.kaelAlive) { kael = addUnit("p", "kael", info.hb * 3, { ch: kaelLook(true) }, { kael: true }); kael.hp = kael.hpm = info.hb * 3 * 3.2 * 1.6; }

  // ---------- formations ----------
  // a group: its order, anchor, facing and layout; units take slots in rows
  const order = { p: { inf: "hold", arch: "hold", cav: "hold" }, e: { inf: "hold", arch: "hold", cav: "hold" } };
  const fire = { p: true, e: true };
  const anchor = { p: {}, e: {} };
  const front = (s) => (s === "p" ? pDir : -pDir); // +1: deployed at +Z facing -Z
  function deploy() {
    for (const s of ["p", "e"]) {
      const d = front(s), fy = d > 0 ? Math.PI : 0;
      if (siegeOn && ((s === "p") === defendP)) {
        // defenders: archers and a line of infantry on the wall walk, the rest behind the gate
        anchor[s].inf = { x: 0, z: SG.innerZ - 4, yaw: 0 }; anchor[s].arch = { x: 0, z: SG.wallZ - 0.2, yaw: 0, wall: true }; anchor[s].cav = { x: 10, z: SG.innerZ - 8, yaw: 0 };
      } else {
        const z0 = siegeOn ? (SG.wallZ + 26) : 15 * d;
        anchor[s].inf = { x: 0, z: z0, yaw: fy }; anchor[s].arch = { x: 0, z: z0 + 5 * (siegeOn ? 1 : d), yaw: fy }; anchor[s].cav = { x: 15 * (s === "p" ? 1 : -1), z: z0 + 1 * d, yaw: fy };
      }
    }
  }
  deploy();
  function layout(s, g) {
    const list = units.filter((u) => u.side === s && u.cls === g && !u.dead && !u.gone && !u.rout && !u.climb && !u.k2echo);
    const A = anchor[s][g]; if (!A || !list.length) return;
    const ord = order[s][g], wall = ord === "wall", n = list.length;
    let cols, sp, sr;
    if (g === "arch") { cols = A.wall ? Math.min(n, Math.ceil(SG.wallW / 1.6)) : Math.ceil(Math.sqrt(n * 4)); sp = A.wall ? Math.min(1.8, SG.wallW / Math.max(1, cols)) : 1.8; sr = 1.6; }
    else if (g === "cav") { cols = Math.ceil(Math.sqrt(n * 1.5)); sp = 2.0; sr = 2.6; }
    else { cols = wall ? Math.ceil(Math.sqrt(n * 2.2)) : Math.ceil(Math.sqrt(n * 3.2)); sp = wall ? 0.95 : 1.35; sr = wall ? 1.0 : 1.5; }
    // spears in the front rank against horse; the rest behind
    if (g === "inf") list.sort((a, b) => (b.spear ? 1 : 0) - (a.spear ? 1 : 0));
    const fx = Math.sin(A.yaw), fz = Math.cos(A.yaw), rx = Math.cos(A.yaw), rz = -Math.sin(A.yaw);
    list.forEach((u, i) => { const row = Math.floor(i / cols), col = i % cols, inRow = Math.min(cols, n - row * cols), off = (col - (inRow - 1) / 2) * sp; u.sx = A.x + rx * off - fx * row * sr; u.sz = A.z + rz * off - fz * row * sr; u.slot = i; u.slotYaw = A.yaw; u.onWallSlot = !!A.wall; });
  }
  function layoutAll() { for (const s of ["p", "e"]) for (const g of ["inf", "arch", "cav"]) layout(s, g); }
  layoutAll();
  for (const u of units) { if (u.hero) { u.x = 0; u.z = (siegeOn ? (defendP ? SG.innerZ - 1 : SG.wallZ + 21) : 11.5 * pDir); } else if (u.kael) { u.x = -2.2; u.z = hero.z + 0.9 * pDir; } else { u.x = u.sx; u.z = u.sz; } u.yaw = u.slotYaw !== undefined ? u.slotYaw : (pDir > 0 ? Math.PI : 0); u.y = H(u.x, u.z); u.root.position.set(u.x, u.y, u.z); u.root.rotation.y = u.yaw; }
  hero.yaw = defendP ? 0 : Math.PI;

  // ---------- arrows (pooled, visible arcs) ----------
  const NAR = st.coarse ? 70 : 110, arrows = [];
  const arGeo = st.track(new THREE.BoxGeometry(0.035, 0.035, 0.8)), arMat = kit.mat(0xe8dcc0), arMatE = kit.mat(0xd8c8a0);
  for (let i = 0; i < NAR; i++) { const m = new THREE.Mesh(arGeo, arMat); m.visible = false; m.rotation.order = "YXZ"; scene.add(m); arrows.push({ m, on: false, x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, side: "p", w: 0, life: 0, stuck: 0 }); }
  let ari = 0, flying = 0;
  function shoot(from, tx, ty, tz, w) {
    let a = null; for (let k = 0; k < NAR; k++) { const c = arrows[(ari + k) % NAR]; if (!c.on && c.stuck <= 0) { a = c; ari = (ari + k + 1) % NAR; break; } }
    if (!a) { a = arrows[ari]; ari = (ari + 1) % NAR; }
    const sx = from.x, sy = from.y + 1.5, sz = from.z, dx = tx - sx, dz = tz - sz, d = Math.hypot(dx, dz), T = clamp(d / 24, 0.7, 2.4);
    a.x = sx; a.y = sy; a.z = sz; a.vx = dx / T + (rand() - 0.5) * 1.2; a.vz = dz / T + (rand() - 0.5) * 1.2; a.vy = (ty + 1.1 - sy + 0.5 * G * T * T) / T; a.side = from.side; a.w = w; a.on = true; a.life = T + 1.2; a.stuck = 0; a.from = from;
    a.m.material = from.side === "p" ? arMat : arMatE; a.m.visible = true;
  }

  // ---------- sparks, dust ----------
  const sparks = []; for (let i = 0; i < 24; i++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: kit.glowTex, color: 0xffd8a0, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })); s.visible = false; s.scale.setScalar(0.7); scene.add(s); sparks.push({ s, t: 0 }); }
  let spi = 0; const spark = (x, y, z, col, big) => { const k = sparks[spi++ % sparks.length]; k.s.position.set(x, y, z); k.s.material.color.set(col || 0xffd8a0); k.s.visible = true; k.t = big ? 0.45 : 0.25; k.big = big; };

  // ---------- standards ----------
  const flags = [];
  const standard = (x, z, col) => { const y = H(x, z); const pole = new THREE.Mesh(kit.g.cyl, kit.mat(0x4a3420)); pole.scale.set(0.12, 5, 0.12); pole.position.set(x, y + 2.5, z); pole.castShadow = true; scene.add(pole); const fl = new THREE.Mesh(kit.g.box, kit.mat(col, { side: THREE.DoubleSide })); fl.scale.set(1.4, 0.9, 0.04); fl.position.set(x + 0.72, y + 4.4, z); fl.castShadow = true; scene.add(fl); flags.push(fl); };
  if (siegeOn) { standard(-3, (defendP ? SG.innerZ - 9 : SG.wallZ + 34), info.banner); standard(4, (defendP ? SG.wallZ + 34 : SG.innerZ - 9), info.ecol); }
  else { standard(-3, 25 * pDir, info.banner); standard(3, -25 * pDir, info.ecol); }

  // ---------- HUD and controls ----------
  st.$(".v3-hud").innerHTML = '<h3 style="text-align:center">' + esc(info.title) + '</h3><div class="v3-bars"><div class="v3-bar"><i id="v3p" style="width:100%;background:linear-gradient(90deg,#8a5a24,' + info.banner + ')"></i></div><div class="v3-ord" id="v3o">Hold</div><div class="v3-bar e"><i id="v3e" style="width:100%;background:linear-gradient(90deg,' + (isVoid ? "#9a7cd0" : info.ecol) + ',#4a2a1a)"></i></div></div>';
  const hpEl = st.$(".v3-hp"); hpEl.hidden = false; hpEl.innerHTML = 'YOU<div class="v3-bar"><i id="v3h" style="width:100%;background:linear-gradient(90deg,#8a2a1a,#d8643a)"></i></div>' + (kael ? '<div style="margin-top:6px">KAELREN</div><div class="v3-bar"><i id="v3k" style="width:100%;background:linear-gradient(90deg,#6a2a10,#d4562c)"></i></div>' : "");
  st.$(".v3-keys").innerHTML = "WASD move · drag / Q E look · Space or click: strike · right-click / Ctrl: block · R shoot<br>Orders: 1 Follow · 2 Hold · 3 Charge · 4 Advance · 5 Shield wall · 6 Fire / hold fire · G group · F fall back";
  st.$(".v3-keys").classList.add("b3k"); setTimeout(() => { const kk = st.$(".v3-keys"); if (kk) kk.style.opacity = "0"; }, 15000);
  st.$(".v3-top").innerHTML = '<button data-v="flee">Fall back</button>';
  st.$(".v3-act").innerHTML = "";
  st.gfxButton();
  const root = st.root;
  const btns = document.createElement("div"); btns.className = "b3-btns"; btns.innerHTML = '<button data-b="shoot"' + (info.hasBow ? "" : " hidden") + '>Shoot</button><button data-b="blk">Block</button><button data-b="atk">Strike</button>' + (api.sk2 ? '<button data-b="cast">✦ Cast</button>' : ""); root.appendChild(btns);
  const ordBtn = document.createElement("button"); ordBtn.className = "b3-ordbtn" + (api.sk2 ? " k2left" : ""); ordBtn.innerHTML = 'Orders<small id="b3og">all · hold</small>'; root.appendChild(ordBtn);
  const fan = document.createElement("div"); fan.className = "b3-fan";
  fan.innerHTML = '<div class="row grp"><button data-g="all" class="on">All</button><button data-g="inf">Infantry</button><button data-g="arch">Archers</button><button data-g="cav">Cavalry</button></div>' +
    '<div class="row"><button data-o="follow">Follow me<small>1</small></button><button data-o="hold">Hold<small>2</small></button><button data-o="charge">Charge<small>3</small></button></div>' +
    '<div class="row"><button data-o="advance">Advance<small>4</small></button><button data-o="wall">Shield wall<small>5</small></button><button data-o="fire">Hold fire<small>6</small></button></div>';
  root.appendChild(fan);
  const grpEl = document.createElement("div"); grpEl.className = "b3-groups"; root.appendChild(grpEl);
  const elP = st.$("#v3p"), elE = st.$("#v3e"), elO = st.$("#v3o"), elH = st.$("#v3h"), elK = st.$("#v3k"), elOG = st.$("#b3og");
  let K2 = null;
  let sel = "all", t0 = 0, over = null, overT = 0, paused = false, fleeAsk = 0, blockHeld = false, kdead = false, vowDone = !info.kael, heroDown = false, speedK = 1, yaw = defendP ? Math.PI : 0, pitch = 0.45, ended = false, enemyPlan = 0;
  const grpName = { all: "all", inf: "infantry", arch: "archers", cav: "cavalry" };
  function giveOrder(o, g, late) {
    g = g || sel;
    if (K2 && !late && K2.orderDelay()) { const d = K2.orderDelay(); later(d, () => giveOrder(o, g, true)); st.msg("Your name does not land. The order reaches them late.", 1.4); fan.classList.remove("on"); return; } const gs = g === "all" ? ["inf", "arch", "cav"] : [g];
    if (o === "fire") { fire.p = !fire.p; st.msg(fire.p ? "Archers: fire at will!" : "Archers: hold your fire!", 1.4); fan.querySelector("[data-o=fire]").firstChild.textContent = fire.p ? "Hold fire" : "Fire at will"; return; }
    for (const k of gs) {
      if (o === "wall" && k !== "inf") continue;
      order.p[k] = o;
      const A = anchor.p[k], ga = groupCentre("p", k);
      if (siegeOn && defendP && A && A.wall && (o === "hold" || o === "wall")) continue;
      if (o === "hold" || o === "wall") { if (ga) { A.x = ga.x; A.z = ga.z; } A.yaw = facingToEnemy(A); }
      if (o === "advance" && ga) { A.x = ga.x; A.z = ga.z; A.yaw = facingToEnemy(A); }
      if (A) A.wall = A.wall && (o === "hold" || o === "wall");
    }
    layoutAll();
    elO.textContent = (g === "all" ? "" : grpName[g] + ": ") + ORD[o]; elOG.textContent = grpName[g] + " · " + ORD[o].toLowerCase().replace("!", "");
    if (o === "charge") { api.sfx && api.sfx("horn"); st.msg("Charge!", 1.4); } else st.msg(ORD[o] + (g === "all" ? "" : " (" + grpName[g] + ")"), 1.3);
    fan.classList.remove("on");
  }
  function setSel(g) { sel = g; fan.querySelectorAll("[data-g]").forEach((b) => b.classList.toggle("on", b.getAttribute("data-g") === g)); elOG.textContent = grpName[g] + " · " + (g === "all" ? ORD[order.p.inf] : ORD[order.p[g]]).toLowerCase().replace("!", ""); for (const u of units) if (u.side === "p" && !u.hero && !u.kael) u.ring.material = (g !== "all" && u.cls === g) ? ringSel : ringP; }
  st.listen(root, "click", (e) => {
    const b = e.target.closest("[data-v],[data-o],[data-g]"); if (!b) return; e.stopPropagation();
    if (b.hasAttribute("data-o")) giveOrder(b.getAttribute("data-o"));
    else if (b.hasAttribute("data-g")) setSel(b.getAttribute("data-g"));
    else if (b.getAttribute("data-v") === "flee") askFlee();
  });
  st.listen(ordBtn, "click", (e) => { e.stopPropagation(); fan.classList.toggle("on"); });
  st.listen(btns, "pointerdown", (e) => { const b = e.target.closest("[data-b]"); if (!b) return; e.stopPropagation(); e.preventDefault(); const k = b.getAttribute("data-b"); if (k === "atk") strike(); else if (k === "shoot") heroShoot(); else if (k === "cast") return; else if (k === "blk") { blockHeld = true; b.classList.add("on"); } });
  const blkUp = () => { blockHeld = false; const b = btns.querySelector("[data-b=blk]"); if (b) b.classList.remove("on"); };
  st.listen(btns, "pointerup", blkUp); st.listen(btns, "pointercancel", blkUp); st.listen(btns, "pointerleave", blkUp);
  inp.onKey = (k) => {
    if (paused || over) return;
    if (k === "1") giveOrder("follow"); else if (k === "2" || k === "h") giveOrder("hold"); else if (k === "3" || k === "c") giveOrder("charge"); else if (k === "4" || k === "v") giveOrder("advance"); else if (k === "5" || k === "b") giveOrder("wall"); else if (k === "6" || k === "x") giveOrder("fire");
    else if (k === "g") setSel(sel === "all" ? "inf" : sel === "inf" ? "arch" : sel === "arch" ? "cav" : "all");
    else if (k === " ") strike(); else if (k === "r") heroShoot(); else if (k === "f" || k === "escape") askFlee();
    else if (K2 && (k === "7" || k === "8" || k === "9")) K2.cast(+k - 7); else if (K2 && k === "l") K2.toggle();
  };
  function askFlee() { if (over) return; if (K2) { const nf = K2.noFlee(); if (nf) { st.msg(nf, 2.4); return; } } if (fleeAsk > 0) { finish("flee"); return; } fleeAsk = 2.2; st.msg("Fall back? Press again to pull your men off the field.", 2.2); }
  let hinted = false; try { hinted = localStorage.getItem("vh3d-hint-battle2") === "1"; localStorage.setItem("vh3d-hint-battle2", "1"); } catch (e) {}
  st.msg(info.allies.length ? info.allies.map((a) => a.name).join(" and ") + " fight beside you." : siegeOn ? (defendP ? "They are coming for the walls. Hold them." : "Take the wall or break the gate.") : "Your line holds. Give the order.", 3.2);
  if (!hinted) setTimeout(() => st.msg(st.coarse ? "Left thumb moves you. Orders sends your men. Strike, Block and Shoot are yours." : "You fight in person. Number keys give orders: 2 Hold, 3 Charge, 5 Shield wall.", 5), 3400);
  api.sfx && api.sfx("horn");

  // ---------- helpers ----------
  const alive = (u) => !u.dead && !u.gone;
  const fighting = (u) => alive(u) && !u.rout;
  function sideW(s, fightOnly) { let w = 0; for (const u of units) if (u.side === s && !u.hero && !u.kael && !u.k2echo && (fightOnly ? fighting(u) : alive(u))) w += u.w; return w; }
  function groupCentre(s, g) { let x = 0, z = 0, n = 0; for (const u of units) if (u.side === s && u.cls === g && fighting(u)) { x += u.x; z += u.z; n++; } return n ? { x: x / n, z: z / n, n } : null; }
  function enemyCentre(s) { let x = 0, z = 0, n = 0; for (const u of units) if (u.side !== s && fighting(u) && !u.hero) { x += u.x; z += u.z; n++; } return n ? { x: x / n, z: z / n } : { x: 0, z: -front(s) * 20 }; }
  function facingToEnemy(A) { const c = enemyCentre(A === anchor.p.inf || A === anchor.p.arch || A === anchor.p.cav ? "p" : "e"); return Math.atan2(c.x - A.x, c.z - A.z); }
  function nearestFoe(u, maxD) {
    let best = null, bd = (maxD || 1e4) ** 2;
    for (const o of units) { if (o.side === u.side || !fighting(o) || o.climb) continue; const d = (o.x - u.x) ** 2 + (o.z - u.z) ** 2 - (o.hero ? 2 : 0) + (Math.abs((o.y || 0) - (u.y || 0)) > 2.5 ? 400 : 0); if (d < bd) { bd = d; best = o; } }
    return best;
  }
  function frontal(v, from, cone) { let d = Math.atan2(from.x - v.x, from.z - v.z) - v.yaw; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI; return Math.abs(d) < (cone || 1.2); }
  function hurt(v, dmg, from, kind) {
    if (!alive(v)) return;
    if (v.hero) {
      dmg = info.hb * (0.8 + Math.random() * 0.4) * Math.min(1.6, (from ? from.w : info.hb) / info.hb) * (kind === "arrow" ? 0.6 : kind === "cav" ? 2 : 1);
      const blocking = (inp.rmb || inp.keys.control || blockHeld) && !(K2 && K2.noBlock());
      if (blocking && from && frontal(v, from, 1.3)) { dmg *= kind === "cav" ? 0.5 : 0.2; spark(v.x, v.y + 1.3, v.z, 0xfff0c0); }
      if (K2) { dmg = K2.heroHurt(dmg, from, !from || frontal(v, from, 1.4)); if (dmg <= 0) return; }
      api.sfx && Math.random() < 0.5 && api.sfx("hurt");
    } else if (from && v.cls === "inf" && order[v.side].inf === "wall" && frontal(v, from, 1.2)) dmg *= kind === "arrow" ? 0.25 : 0.45;
    if (K2 && !v.hero) { if (from && from.side === "p" && !from.hero) dmg *= K2.allyMul(); if (v.side === "p") dmg *= 1 - K2.allyRed(); }
    else if (kind === "arrow" && v.onWall) dmg *= 0.55; // the battlements cover the men on the walk
    v.hp -= dmg;
    if (v.hp <= 0) {
      if (v.hero) { v.hp = 0; heroDown = true; v.dead = true; v.deadT = 0; v.ring.visible = false; st.msg("You are struck down. Your sergeants drag you behind the line. The men fight on.", 4); speedK = 2; return; }
      v.dead = true; v.deadT = 0;
      if (v.kael) { kdead = true; st.msg("Kaelren is down. Four men carry him back on a shield.", 3.5); }
      if (from && from.hero && api.sfx) api.sfx("kill");
    }
  }
  function strike() {
    if (heroDown || paused || over || hero.cd > 0) return;
    hero.cd = 0.55; hero.atk = 1; api.sfx && api.sfx("swing");
    // light auto-target: turn to the nearest foe in front within reach
    const t = nearestFoe(hero, 3.2); if (t && frontal(hero, t, 1.6)) hero.yaw = Math.atan2(t.x - hero.x, t.z - hero.z);
    later(0.16, () => {
      let n = 0;
      for (const o of units) {
        if (o.side !== "e" || !fighting(o)) continue; const d = Math.hypot(o.x - hero.x, o.z - hero.z); if (d > hero.reach + 0.6 || Math.abs(o.y - hero.y) > 2) continue;
        if (!frontal(hero, o, 1.0)) continue;
        hurt(o, info.heroW * (0.9 + Math.random() * 0.3) * (K2 ? K2.strikeMul(o) : 1), hero); spark(o.x, o.y + 1.2, o.z); if (K2) K2.onStrikeHit(o); o.kx += Math.sin(hero.yaw) * 2.2; o.kz += Math.cos(hero.yaw) * 2.2; o.stag = Math.max(o.stag, 0.25);
        if (++n >= 3) break;
      }
      if (n && api.sfx) api.sfx("hit");
    });
  }
  let heroShotCd = 0;
  function heroShoot() {
    if (!info.hasBow || heroDown || paused || over || heroShotCd > 0) return;
    heroShotCd = 1.1; hero.atk = 0.8; api.sfx && api.sfx("swing");
    // aim assist: the foe nearest the camera's line of sight
    const fx = -Math.sin(yaw), fz = -Math.cos(yaw); let best = null, bs = 1e9;
    for (const o of units) { if (o.side !== "e" || !fighting(o)) continue; const dx = o.x - hero.x, dz = o.z - hero.z, d = Math.hypot(dx, dz); if (d < 2 || d > 60) continue; const c = (dx * fx + dz * fz) / d; if (c < 0.9) continue; const sc = d * (1.2 - c) * 4 + d * 0.1; if (sc < bs) { bs = sc; best = o; } }
    if (best) { hero.yaw = Math.atan2(best.x - hero.x, best.z - hero.z); shoot(hero, best.x + best.vx * 0.8, best.y, best.z + best.vz * 0.8, info.heroW * 0.8); }
    else shoot(hero, hero.x + fx * 30, hero.y, hero.z + fz * 30, info.heroW * 0.8);
  }
  function finish(how) {
    if (over) return; over = how; overT = 0;
    const end = st.$(".v3-end");
    end.innerHTML = how === "win" ? (siegeOn ? (defendP ? "The walls hold!<small>they fall back from the gate</small>" : SG.breached ? "The gate is down!<small>the hold is yours</small>" : "The wall is taken!<small>the hold is yours</small>") : "They break!<small>the field is yours</small>")
      : how === "lose" ? (siegeOn && defendP ? "The walls are lost<small>fall back to the keep</small>" : "Your line breaks<small>fall back, fall back</small>") : "You pull back<small>the men follow your banner off the field</small>";
    end.classList.add("on"); if (how === "win" && api.sfx) api.sfx("horn"); fan.classList.remove("on");
  }
  function report() {
    if (ended) return; ended = true;
    const pf = clamp(sideW("p", false) / Math.max(1e-6, p0w), 0, 1), ef = clamp(sideW("e", false) / Math.max(1e-6, e0w), 0, 1);
    st.root.style.transition = "opacity .4s"; st.root.style.opacity = "0";
    if (K2) K2.dispose();
    setTimeout(() => { st.dispose(); done({ how: over, pf, ef, kdead, breach: SG ? (SG.breached ? "gate" : SG.wallTaken ? "wall" : "") : "" }); }, 420);
  }
  // Kaelren's vow, as on the battle sheet: the line is breaking and he is about to ride
  function vowModal() {
    paused = true; vowDone = true; inp.keys = {}; fan.classList.remove("on");
    const m = document.createElement("div"); m.className = "v3-modal";
    m.innerHTML = '<div><p><b style="font-weight:400;color:#c8873a">Kaelren’s horse screams.</b> The line is breaking. He has seen a man go down, and no one is closer. In three seconds he will ride.</p>' + api.vowChoices().map((c) => '<button data-vow="' + c.id + '">' + esc(c.t) + "</button>").join("") + "</div>";
    st.root.appendChild(m);
    m.addEventListener("click", (e) => {
      const b = e.target.closest("[data-vow]"); if (!b) return; const id = b.getAttribute("data-vow"); m.remove();
      const r = api.vow(id, sideW("p", true) / Math.max(1e-6, p0w));
      if (r.end) { over = "done"; ended = true; if (K2) K2.dispose(); st.root.style.transition = "opacity .4s"; st.root.style.opacity = "0"; setTimeout(() => { st.dispose(); done({ how: "done" }); }, 420); return; }
      paused = false;
      if (kael && id === "hold") kael.pinned = true;
      if (r.lost) { const k = Math.min(Math.round(r.lost * units.filter((u) => u.side === "p" && !u.hero && !u.kael).length / Math.max(1, info.t0)), 12); units.filter((u) => u.side === "p" && fighting(u) && !u.hero && !u.kael && !u.ally).sort((a, b) => b.x - a.x).slice(0, k).forEach((u) => { u.dead = true; u.deadT = 0; }); st.msg("The right flank never heard the order.", 3); }
      if (r.ride && kael && alive(kael)) {
        st.msg("Kaelren rides. The line breaks around him.", 3.5);
        const foes = units.filter((u) => u.side === "e" && fighting(u)); let w = 0; const half = foes.reduce((a, u) => a + u.w, 0) / 2;
        foes.sort((a, b) => Math.hypot(a.x - kael.x, a.z - kael.z) - Math.hypot(b.x - kael.x, b.z - kael.z));
        let delay = 0; for (const u of foes) { if (w >= half) break; w += u.w; const uu = u; delay += 0.12; later(delay, () => { if (alive(uu)) { uu.dead = true; uu.deadT = 0; spark(uu.x, uu.y + 1.2, uu.z, 0xff8a3a); } }); }
        kael.ride = true; kael.rideT = 2.6;
      }
    });
  }

  const pend = [];
  function later(s, fn) { pend.push({ t: t0 + s, fn }); }
  followCam(camera, hero.x, hero.y, hero.z, yaw, 0.5, 8 * st.distK, 0.7, 0, true);
  let relayT = 0, moraleT = 0, sideM = { p: 1, e: 1 };

  // ---------- enemy plan: bandits rush; armies advance the line, loose volleys, then send the horse round a flank ----------
  function enemyThink() {
    const t = t0, atk = siegeOn ? defendP : true; // in a siege the enemy attacks only when the player holds the walls
    if (siegeOn && !atk) { // enemy defends the walls: hold; their infantry sally if you are through the gate
      if (enemyPlan < 1) { enemyPlan = 1; order.e.inf = "hold"; order.e.arch = "hold"; }
      if (SG.breached && enemyPlan < 2) { enemyPlan = 2; order.e.inf = "charge"; }
      return;
    }
    if (isVoid || info.kind === "bandit") { if (t > 2.5 && enemyPlan < 1) { enemyPlan = 1; order.e.inf = "charge"; order.e.cav = "charge"; order.e.arch = siegeOn ? "advance" : "hold"; } return; }
    if (t > 3 && enemyPlan < 1) { enemyPlan = 1; order.e.inf = "advance"; order.e.arch = "advance"; }
    if (t > 7 && enemyPlan < 2) { enemyPlan = 2; order.e.cav = "charge"; }
    const pc = enemyCentre("e"), ec2 = groupCentre("e", "inf");
    if (enemyPlan < 3 && ec2 && Math.hypot(pc.x - ec2.x, pc.z - ec2.z) < 10) { enemyPlan = 3; order.e.inf = "charge"; }
    if (enemyPlan < 4 && t > 40) { enemyPlan = 4; order.e.inf = "charge"; order.e.arch = "charge"; }
  }

  // ---------- the Realm Arts (g3d/skills2.js): three ability buttons behind Cast, the price meter, pooled VFX ----------
  try {
    if (api.sk2) K2 = api.sk2.battle({ THREE, scene, camera, root: st.root, kit, hero, units, H: (x, z) => H(x, z), hurt, spark, giveOrder, addUnit, look: () => ownLook(rand() < 0.5 ? "inf" : "spear"), info, arrows,
      msg: (t, s) => st.msg(t, s), sfx: (n) => api.sfx && api.sfx(n), gfx: () => st.gfx, castBtn: btns.querySelector("[data-b=cast]"), isVoid, fac: info.fac, heroDown: () => heroDown, over: () => !!over,
      canStand: (x, z, u) => !SG || SG.canStand(x, z, u) });
  } catch (e) { K2 = null; api.fail && api.fail(e); }
  st.start((dt, time) => {
    if (K2) K2.pre();
    for (const k of sparks) if (k.s.visible) { k.t -= dt; k.s.scale.setScalar((k.big ? 1.2 : 0.5) + ((k.big ? 0.45 : 0.25) - k.t) * 3); k.s.material.opacity = k.t * 4; if (k.t <= 0) k.s.visible = false; }
    fx.userData.tick(dt, hero.x, hero.z); sky.userData.tick(dt, camera.position.x, camera.position.z); if (band) band.userData.tick(camera.position.x, camera.position.z); flags.forEach((f, i) => { f.rotation.y = Math.sin(time * 2 + i) * 0.25; });
    if (paused) return;
    if (SG) SG.tick(dt * speedK, time);
    if (fleeAsk > 0) fleeAsk -= dt;
    const sdt = dt * speedK; t0 += sdt; if (heroShotCd > 0) heroShotCd -= dt;
    for (let i = pend.length - 1; i >= 0; i--) if (pend[i].t <= t0) { const p = pend.splice(i, 1)[0]; p.fn(); }

    // the hero
    if (!heroDown && !over && hero.climb) { SG.climb(hero, dt); hero.mv = 1; inp.turn = 0; }
    else if (!heroDown && !over) {
      const k = inp.keys;
      yaw -= inp.turn * 0.006; inp.turn = 0; pitch = clamp(pitch + inp.pitch * 0.003, 0.12, 0.95); inp.pitch = 0;
      if (k.q || k.arrowleft) yaw += dt * 2.4; if (k.e || k.arrowright) yaw -= dt * 2.4;
      const blocking = (inp.rmb || k.control || blockHeld) && !(K2 && K2.noBlock());
      const mv = moveIntent(inp, yaw), run = (k.shift || (st.coarse && mv.amt > 0.92)) && !blocking, sp = (blocking ? 1.8 : run ? 6.2 : 4.0) * mv.amt * (K2 ? K2.speedMul() : 1);
      if (mv.amt > 0.05) { const nx = hero.x + mv.x * sp * dt, nz = hero.z + mv.z * sp * dt; if (SG) { SG.heroClimb(hero); if (hero.onWall && mv.z < -0.5) SG.heroDown(hero); } if (!SG || SG.canStand(nx, nz, hero)) { hero.x = nx; hero.z = nz; } hero.mv = mv.amt * (run ? 1.6 : 1.2); if (hero.atk <= 0) hero.yaw = angLerp(hero.yaw, Math.atan2(mv.x, mv.z), 1 - Math.exp(-dt * 12)); }
      else { hero.mv = 0; if (blocking) hero.yaw = angLerp(hero.yaw, yaw + Math.PI, 1 - Math.exp(-dt * 10)); }
      if (inp.click) { inp.click = 0; if (!st.coarse) { hero.yaw = yaw + Math.PI; strike(); } }
      hero.block = blocking;
      hero.x = clamp(hero.x, -75, 75); hero.z = clamp(hero.z, -75, 75);
    }
    if (hero.cd > 0) hero.cd -= dt;
    if (frameOK()) enemyThink();
    relayT -= sdt; if (relayT <= 0) { relayT = 1; for (const s of ["p", "e"]) for (const g of ["inf", "arch", "cav"]) { const o = order[s][g], A = anchor[s][g]; if (!A) continue; if (o === "follow" && s === "p") { const bx = -Math.sin(hero.yaw), bz = -Math.cos(hero.yaw); A.x = hero.x + bx * (g === "arch" ? 7 : g === "cav" ? 5 : 3.5) + (g === "cav" ? 5 : 0); A.z = hero.z + bz * (g === "arch" ? 7 : 3.5); A.yaw = hero.yaw; } if (o === "advance") { const c = enemyCentre(s), dx = c.x - A.x, dz = c.z - A.z, d = Math.hypot(dx, dz) || 1, stop = g === "arch" ? 26 : 7; if (d > stop) { A.x += dx / d * Math.min(2.6, d - stop); A.z += dz / d * Math.min(2.6, d - stop); } A.yaw = Math.atan2(dx, dz); } } layoutAll(); }

    // morale: each side weighs what is left against what it started with; frightened men run
    moraleT -= sdt;
    const pW = sideW("p", true), eW = sideW("e", true);
    if (moraleT <= 0) {
      moraleT = 0.5;
      sideM.p = clamp(0.25 + 0.75 * pW / p0w + 0.25 * (pW / p0w - eW / e0w) + (K2 ? K2.moraleAdd("p") : 0), K2 ? K2.moraleFloor() : 0, 1); sideM.e = clamp(0.25 + 0.75 * eW / e0w + 0.25 * (eW / e0w - pW / p0w) + (K2 ? K2.moraleAdd("e") : 0), 0, 1);
      for (const u of units) {
        if (!fighting(u) || u.hero || u.kael || u.climb || u.k2echo || (K2 && K2.noRout(u))) continue;
        const M = sideM[u.side], near = u.side === "p" && Math.hypot(u.x - hero.x, u.z - hero.z) < 9 && !heroDown;
        let pr = (u.hp / u.hpm < 0.35 ? 0.12 : 0) + (M < 0.4 ? (0.4 - M) * 0.9 : 0) - (near ? 0.12 : 0) - (order[u.side].inf === "wall" && u.cls === "inf" ? 0.05 : 0);
        if (pr > 0 && Math.random() < pr * 0.35) { u.rout = true; if (u.side === "e" && Math.random() < 0.3) spark(u.x, u.y + 2, u.z, 0xffffff); }
      }
    }
    // Kaelren's vow
    if (!vowDone && !over && kael && fighting(kael) && (pW / p0w < 0.62 || kael.hp < kael.hpm * 0.4)) { vowModal(); return; }

    // ---- every soldier ----
    for (const u of units) {
      if (u.hero) continue;
      u.t += sdt;
      if (u.dead) {
        u.ring.visible = false;
        if (u.f.userData.ch) { if (u.deadT === 0) { u.f.userData.ch.die(); u.deadT = 0.001; if (u.hs) u.hs.rotation.z = 1.4; } u.f.userData.ch.update(sdt, 0, 0, false); continue; }
        if (u.deadT < 1) { u.deadT += sdt * 2.2; u.root.rotation.x = -Math.PI / 2 * Math.min(1, u.deadT); } continue;
      }
      if (u.gone) continue;
      if (u.ride) { u.rideT -= sdt; u.z -= sdt * 9 * pDir; u.x += Math.sin(u.t * 2) * sdt * 2; u.mv = 1.6; if (u.rideT <= 0) { u.gone = true; u.root.visible = false; } u.root.position.set(u.x, H(u.x, u.z), u.z); u.root.rotation.y = pDir > 0 ? Math.PI : 0; animFigure(u.f, u.t, 1.6, 0, false, sdt); continue; }
      const k2s = K2 ? K2.slowK(u) : 1;
      if (u.cd > 0) u.cd -= sdt * k2s; if (u.atk > 0) u.atk = Math.max(0, u.atk - sdt * 2.4);
      // knocked back and staggered
      if (u.stag > 0) { u.stag -= sdt; u.x += u.kx * sdt; u.z += u.kz * sdt; u.kx *= 0.9; u.kz *= 0.9; u.mv = 0; continue; }
      const sideRatio = u.side === "p" ? pW / p0w : eW / e0w;
      if (!u.rout && !u.kael && !u.k2echo && sideRatio < 0.3 && Math.random() < sdt * 0.6 && !(K2 && K2.noRout(u))) u.rout = true;
      if (u.decoy) { u.mv = 0; continue; }
      // siege climbing (ladders) is handled by the siege layout
      if (u.climb) { SG.climb(u, sdt); u.root.position.set(u.x, u.y, u.z); u.root.rotation.y = u.yaw; animFigure(u.f, u.t, 1, 0, false, sdt); continue; }
      let tx = u.x, tz = u.z, want = false, sp = 3.2;
      const g = u.cls === "kael" ? "inf" : u.cls, ord = u.kael ? "kael" : u.k2echo ? "charge" : order[u.side][g];
      if (u.rout) {
        const c = enemyCentre(u.side), dx = u.x - c.x, dz = u.z - c.z, d = Math.hypot(dx, dz) || 1;
        tx = u.x + dx / d * 10; tz = u.z + dz / d * 10; want = true; sp = u.cls === "cav" ? 7 : 4.3;
        if (Math.abs(u.z) > 66 || Math.abs(u.x) > 66) { u.gone = true; u.root.visible = false; continue; }
      } else {
        u.retarget -= sdt;
        if (u.retarget <= 0 || !u.tgt || !fighting(u.tgt)) { u.tgt = nearestFoe(u); u.retarget = 0.35 + Math.random() * 0.3; if (K2 && u.side === "e") { const dc = K2.decoyFor(u); if (dc) u.tgt = dc; } }
        const foe = u.tgt, fd = foe ? Math.hypot(foe.x - u.x, foe.z - u.z) : 1e9, dy = foe ? Math.abs((foe.y || 0) - (u.y || 0)) : 0;
        if (u.cls === "cav") { if (cavalry(u, foe, fd, ord, sdt)) continue; }
        // siege attackers head for a ladder or the breach before they can reach the wall's defenders
        if (SG && SG.route(u, foe, ord)) { tx = u.rx; tz = u.rz; want = true; sp = 3.4; }
        else {
          const engageR = ord === "charge" ? 1e9 : ord === "kael" ? 7 : ord === "advance" ? 5 : u.cls === "arch" ? 3.2 : ord === "wall" ? 2.2 : 3.2;
          const melee = foe && dy < 2.2 && (fd < engageR || (u.kael && Math.hypot(foe.x - hero.x, foe.z - hero.z) < 7)) && !(u.pinned && fd > 1.6);
          if (u.cls === "arch" && !melee && foe && fire[u.side] && ord !== "charge" && !(K2 && u.side === "e" && K2.silenced(u))) {
            // archers loose from their place when the enemy is in range, staggered into volleys
            u.shot -= sdt; if (fd < 52 && u.shot <= 0) { u.shot = 2.6 + Math.random() * 1.6; u.atk = 1; const lead = Math.min(1.5, fd / 24); shoot(u, foe.x + (foe.vx || 0) * lead, foe.y || 0, foe.z + (foe.vz || 0) * lead, u.w * 0.75); u.yaw = Math.atan2(foe.x - u.x, foe.z - u.z); }
          }
          if (melee) {
            if (fd > u.reach) { tx = foe.x; tz = foe.z; want = true; sp = ord === "charge" ? 4.2 : 3.4; }
            else {
              u.yaw = angLerp(u.yaw, Math.atan2(foe.x - u.x, foe.z - u.z), 0.2);
              if (u.cd <= 0) { u.cd = 0.85 + Math.random() * 0.5; u.atk = 1; const ff = foe, uu = u; later(0.18, () => { if (fighting(uu) && alive(ff) && Math.hypot(ff.x - uu.x, ff.z - uu.z) < uu.reach + 0.6) { hurt(ff, uu.w * (0.8 + Math.random() * 0.4) * (uu.cls === "arch" ? 0.6 : 1) * (uu.spear && ff.cls === "cav" ? 1.8 : 1), uu); if (Math.random() < 0.35) spark((ff.x + uu.x) / 2, (ff.y || 0) + 1.2, (ff.z + uu.z) / 2); } }); }
            }
          } else if (u.kael) { tx = hero.x - 2 * Math.cos(hero.yaw); tz = hero.z + 2 * Math.sin(hero.yaw); want = Math.hypot(tx - u.x, tz - u.z) > 1.5; sp = 4.4; }
          else if (ord === "charge" && foe) { tx = foe.x; tz = foe.z; want = true; sp = 4.2; }
          else { tx = u.sx; tz = u.sz; const d = Math.hypot(tx - u.x, tz - u.z); want = d > 0.35; sp = d > 4 ? 4.0 : ord === "wall" ? 1.6 : 2.6; if (!want) u.yaw = angLerp(u.yaw, u.slotYaw, 0.1); }
        }
      }
      if (want) {
        sp *= k2s;
        const dx = tx - u.x, dz = tz - u.z, d = Math.hypot(dx, dz) || 1, step = Math.min(d, sp * sdt);
        const nx = u.x + dx / d * step, nz = u.z + dz / d * step;
        if (!SG || SG.canStand(nx, nz, u)) { u.vx = (nx - u.x) / Math.max(sdt, 1e-3); u.vz = (nz - u.z) / Math.max(sdt, 1e-3); u.x = nx; u.z = nz; } else { u.vx = u.vz = 0; }
        u.mv = sp > 3.6 ? 1.5 : 1;
        u.yaw = angLerp(u.yaw, Math.atan2(dx, dz), 0.15);
      } else { u.mv = Math.max(0, u.mv - sdt * 4); u.vx = u.vz = 0; }
    }
    // cavalry: charge home, burst through with impact and knockback, ride out, wheel, charge again
    function cavalry(u, foe, fd, ord, dt2) {
      if (ord !== "charge" || !foe) { u.cs = "form"; return false; }
      if (u.cs === "form") u.cs = "charge";
      let dirx, dirz;
      if (u.cs === "charge") {
        const dx = foe.x - u.x, dz = foe.z - u.z, d = Math.hypot(dx, dz) || 1; dirx = dx / d; dirz = dz / d;
        if (d < 1.6) {
          // impact: the target and anyone beside it are hit and thrown back; braced spears answer
          const braced = foe.spear && (order[foe.side].inf === "hold" || order[foe.side].inf === "wall") && frontal(foe, u, 1.0);
          if (braced) { hurt(u, foe.w * 2.6, foe); u.stag = 0.8; u.kx = -dirx * 3; u.kz = -dirz * 3; spark(u.x, 1.6, u.z, 0xffffff, true); u.cs = "wheel"; u.csT = 2.5; return true; }
          for (const o of units) { if (o.side === u.side || !fighting(o)) continue; const od = Math.hypot(o.x - foe.x, o.z - foe.z); if (od > 1.7) continue; hurt(o, u.w * (o === foe ? 2.2 : 1.1), u, "cav"); if (!o.hero) { o.kx = dirx * 6; o.kz = dirz * 6; o.stag = 0.7; } else { hero.x += dirx * 1.2; hero.z += dirz * 1.2; } }
          spark(foe.x, 1.2, foe.z, 0xffe0b0, true); api.sfx && api.sfx("hit"); u.atk = 1;
          u.cs = "through"; u.csT = 1.1; u.dx = dirx; u.dz = dirz;
        }
      } else if (u.cs === "through") { dirx = u.dx; dirz = u.dz; u.csT -= dt2; if (u.csT <= 0) { u.cs = "wheel"; u.csT = 2.2; } }
      else { // wheel: ride out wide and come round
        u.csT -= dt2; const a = Math.atan2(u.dx || 0, u.dz || 1) + 1.6; dirx = Math.sin(a); dirz = Math.cos(a); if (u.csT <= 0) u.cs = "charge";
      }
      const spd = u.cs === "charge" ? 9 : 7.5, nx = u.x + dirx * spd * dt2, nz = u.z + dirz * spd * dt2;
      if (!SG || SG.canStand(nx, nz, u)) { u.vx = dirx * spd; u.vz = dirz * spd; u.x = clamp(nx, -70, 70); u.z = clamp(nz, -70, 70); } else { u.cs = "wheel"; u.csT = 1.5; u.dx = -dirx; u.dz = -dirz; }
      u.mv = 1.6; u.yaw = angLerp(u.yaw, Math.atan2(dirx, dirz), 0.2);
      return true;
    }
    // keep bodies apart (spatial hash keeps it cheap with 140 men)
    sepGrid();
    // arrows: fly, fall, hit, stick
    flying = 0;
    for (const a of arrows) {
      if (a.stuck > 0) { a.stuck -= sdt; if (a.stuck <= 0) a.m.visible = false; continue; }
      if (!a.on) continue; flying++;
      a.vy -= G * sdt; a.x += a.vx * sdt; a.y += a.vy * sdt; a.z += a.vz * sdt; a.life -= sdt;
      a.m.position.set(a.x, a.y, a.z); a.m.rotation.y = Math.atan2(a.vx, a.vz); a.m.rotation.x = -Math.atan2(a.vy, Math.hypot(a.vx, a.vz));
      const gy = H(a.x, a.z);
      if (a.vy < 0 && a.y < gy + 2.1) {
        let hit = null;
        for (const o of units) { if (o.side === a.side || !fighting(o)) continue; if (a.y < (o.y || 0) || a.y > (o.y || 0) + 2.1) continue; const dx = o.x - a.x, dz = o.z - a.z; if (dx * dx + dz * dz < (o.cls === "cav" ? 0.8 : 0.36)) { hit = o; break; } }
        if (hit) { hurt(hit, a.w * (0.7 + Math.random() * 0.5), a.from, "arrow"); a.on = false; a.stuck = 0.01; a.m.visible = false; continue; }
      }
      if ((SG && SG.blocks(a)) || a.y <= gy + 0.05 || a.life <= 0) { a.on = false; a.stuck = 3.5; a.y = Math.max(a.y, gy + 0.1); a.m.position.y = a.y; }
    }
    // pose everyone
    const cpx = camera.position.x, cpz = camera.position.z;
    for (const u of units) {
      if (u.dead || u.gone || u.ride || u.hero) continue;
      if (!u.climb) u.y = SG ? SG.yAt(u.x, u.z, u) : H(u.x, u.z);
      u.root.position.set(u.x, u.y, u.z); u.root.rotation.y = u.yaw;
      const cd = Math.hypot(u.x - cpx, u.z - cpz), skip = cd > 50 ? 4 : cd > 28 ? 2 : 0;
      if (u.hs) { const sw = Math.sin(u.t * (u.mv > 1.2 ? 13 : 7)) * Math.min(1, u.mv) * 0.7, L4 = u.hs.userData.legs; L4[0].rotation.x = sw; L4[3].rotation.x = sw; L4[1].rotation.x = -sw; L4[2].rotation.x = -sw; animFigure(u.f, u.t, 0, u.atk, false, sdt, skip); }
      else animFigure(u.f, u.t, u.mv, u.atk, order[u.side].inf === "wall" && u.cls === "inf" && u.mv < 0.5, sdt, skip);
    }
    if (!heroDown && SG && !hero.climb) hero.y = SG.yAt(hero.x, hero.z, hero); else if (!heroDown && !SG) hero.y = H(hero.x, hero.z);
    hero.root.position.set(hero.x, hero.y, hero.z); hero.root.rotation.y = hero.yaw;
    if (hero.atk > 0) hero.atk = Math.max(0, hero.atk - dt * 3);
    hero.t += dt; if (!heroDown) animFigure(hero.f, hero.t, hero.mv, hero.atk, hero.block, dt);
    else if (hero.f.userData.ch) { if (hero.deadT === 0) { hero.f.userData.ch.die(); hero.deadT = 0.001; } hero.f.userData.ch.update(dt, 0, 0, false); }

    // the outcome (a siege also ends when the gate is broken or the wall is taken and held)
    if (!over) {
      const pf = pW / p0w, ef = eW / e0w;
      if (SG) { const r = SG.outcome(units, defendP); if (r) finish(r); }
      if (!over) { if (ef < 0.2 || eW <= 0) finish("win"); else if (pf < 0.2 || pW <= 0) finish("lose"); else if (t0 > 300) finish(pf / Math.max(0.01, ef) >= 1 ? (siegeOn && !defendP ? "lose" : "win") : "lose"); }
    } else { overT += dt; if (overT > 2.2) report(); }
    if (over === "win") for (const u of units) if (u.side === "e" && fighting(u)) u.rout = true;
    if (over === "lose") for (const u of units) if (u.side === "p" && fighting(u) && !u.hero) u.rout = true;
    elP.style.width = Math.round(100 * clamp(pW / p0w, 0, 1)) + "%"; elE.style.width = Math.round(100 * clamp(eW / e0w, 0, 1)) + "%";
    elH.style.width = Math.round(100 * clamp(hero.hp / hero.hpm, 0, 1)) + "%"; if (elK && kael) elK.style.width = Math.round(100 * clamp(kael.dead ? 0 : kael.hp / kael.hpm, 0, 1)) + "%";
    if (st.frames % 15 === 0) { const c = (g) => units.filter((u) => u.side === "p" && u.cls === g && fighting(u)).length; grpEl.innerHTML = "<b>INF</b> " + c("inf") + " · " + ORD[order.p.inf] + "<br><b>ARCH</b> " + c("arch") + " · " + ORD[order.p.arch] + (fire.p ? "" : " · hold fire") + (c("cav") ? "<br><b>CAV</b> " + c("cav") + " · " + ORD[order.p.cav] : "") + "<br><b>MORALE</b> " + Math.round(sideM.p * 100) + "% · them " + Math.round(sideM.e * 100) + "%"; }
    // camera: over the shoulder, or a slow look over the field once you are down
    if (!heroDown) followCam(camera, hero.x, hero.y, hero.z, yaw, pitch, 8 * st.distK, 0.7, dt);
    else { let cx = 0, cz = 0, n = 0; for (const u of units) if (fighting(u)) { cx += u.x; cz += u.z; n++; } if (n) { cx /= n; cz /= n; } yaw += dt * 0.15; followCam(camera, cx, H(cx, cz), cz, yaw, 0.6, 24, 0, dt); }
    L.sun.position.set(hero.x + 30, 42, hero.z + 22); L.sun.target.position.set(hero.x, 0, hero.z);
    if (K2 && !paused) K2.tick(dt);
  });
  function frameOK() { return true; }
  // spatial hash separation
  const cell = 1.6, grid = new Map();
  function sepGrid() {
    grid.clear();
    for (const u of units) { if (!alive(u) || u.climb) continue; const k = Math.floor(u.x / cell) + "," + Math.floor(u.z / cell); let a = grid.get(k); if (!a) { a = []; grid.set(k, a); } a.push(u); }
    for (const u of units) {
      if (!alive(u) || u.climb) continue; const cx = Math.floor(u.x / cell), cz = Math.floor(u.z / cell);
      for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) { const a = grid.get((cx + i) + "," + (cz + j)); if (!a) continue; for (const o of a) { if (o === u || o.id < u.id) continue; const r = (u.cls === "cav" || o.cls === "cav") ? 1.25 : 0.82, dx = o.x - u.x, dz = o.z - u.z, d2 = dx * dx + dz * dz; if (d2 >= r * r || d2 < 1e-6 || Math.abs((o.y || 0) - (u.y || 0)) > 1.5) continue; const mu = u.hero ? 0 : 1, mo = o.hero ? 0 : 1; if (!mu && !mo) continue; const d = Math.sqrt(d2), push = (r - d) / (mu + mo), nx = dx / d, nz = dz / d; u.x -= nx * push * mu; u.z -= nz * push * mu; o.x += nx * push * mo; o.z += nz * push * mo; } }
    }
  }
  if (SG && defendP) { hero.onWall = true; hero.x = 4; hero.z = SG.wallZ; hero.y = SG.yAt(hero.x, hero.z, hero); if (kael) { kael.onWall = true; kael.x = 6; kael.z = SG.wallZ; } }
  units.forEach((u, i) => { u.id = i; u.vx = 0; u.vz = 0; if (u.onWallSlot && SG) { u.onWall = true; u.y = SG.yAt(u.x, u.z, u); u.root.position.y = u.y; } });
  if (SG) {
    SG.units = units;
    SG.onHit = () => { spark(0, 2, SG.wallZ + 1.5, 0xffd8a0, true); api.sfx && api.sfx("hit"); if (Math.random() < 0.4) st.msg("The ram strikes the gate.", 1.2); };
    SG.onBreach = () => { st.msg("The gate breaks!", 2.6); api.sfx && api.sfx("horn"); spark(0, 2.5, SG.wallZ, 0xffffff, true); };
  }
  return {
    stop: () => finish("flee"), fast(n) { st.substeps = Math.max(1, n | 0); }, hero, scene: st, info, units, order: giveOrder, siege: SG,
    state: () => ({ over, t: t0, order: order.p.inf, orders: Object.assign({}, order.p), fire: fire.p, pW: sideW("p", true) / p0w, eW: sideW("e", true) / e0w, heroDown, NP: units.filter((u) => u.side === "p" && !u.hero && !u.kael).length, NE,
      groups: { inf: units.filter((u) => u.side === "p" && u.cls === "inf").length, arch: units.filter((u) => u.side === "p" && u.cls === "arch").length, cav: units.filter((u) => u.side === "p" && u.cls === "cav").length, earch: units.filter((u) => u.side === "e" && u.cls === "arch").length, ecav: units.filter((u) => u.side === "e" && u.cls === "cav").length },
      arrows: flying, routed: units.filter((u) => u.rout && !u.gone).length + units.filter((u) => u.gone && !u.ride).length, morale: Object.assign({}, sideM), kael: !!kael, kdead,
      siege: SG ? SG.state() : null, k2: K2 ? K2.state() : null }),
    _finish: finish, k2: () => K2
  };
}
