// Voidhammer: The Shattered Realms. Sieges (v2 stage 3), used by battle3d.js when B.siegeId is set.
// A curtain wall runs east-west at wallZ with a gatehouse in the middle, towers along it and stairs inside.
// Attackers come from +Z: ladders are already raised against the wall and a covered ram rolls on the gate when men
// push it. Defenders hold the wall walk with archers and keep a line behind the gate. It ends when the gate is broken
// and the attackers pour through, when the attackers take and hold the wall walk, or when one side breaks.
// Either side can be the player's: the bridge sets info.defend when the hold under siege is the player's own.
import * as THREE from "./three.module.min.js";
import { Merge } from "./art.js";

export function buildSiege(st, kit, art, P, info, H0, defendP) {
  const scene = st.scene, mStone = art.mat("stone"), mPlank = art.mat("planks", { roughness: 0.85 }), mBeam = art.mat("beam", { roughness: 0.85 }), mRoof = art.mat("slate", { roughness: 0.7 });
  const wallZ = -22, WH = 5.4, TH = 2.6, X0 = -34, X1 = 34, GATE = 3, innerZ = wallZ - 5;
  const sc = P.stone || 0x7c7870, dark = new THREE.Color(sc).multiplyScalar(0.8).getHex();
  const M = new Merge();
  // curtain wall with a gap for the gate, crenellations on both faces of the walk
  for (const [a, b] of [[X0, -GATE - 2], [GATE + 2, X1]]) {
    const w = b - a, cx = (a + b) / 2;
    M.box(mStone, cx, WH / 2, wallZ, w, WH, TH, 0, sc);
    for (let x = a + 0.6; x < b - 0.3; x += 1.5) { M.box(mStone, x, WH + 0.45, wallZ + TH / 2 - 0.2, 0.8, 0.9, 0.4, 0, sc); M.box(mStone, x, WH + 0.3, wallZ - TH / 2 + 0.2, 0.8, 0.6, 0.35, 0, dark); }
  }
  // gatehouse: two towers and the arch over the gate
  for (const s of [-1, 1]) { M.add("cyl", mStone, s * (GATE + 2.2), WH * 0.7, wallZ + 0.4, 4.4, WH * 1.4, 4.4, 0, dark); M.add("cone", mRoof, s * (GATE + 2.2), WH * 1.4 + 1.4, wallZ + 0.4, 5, 2.8, 5, 0, P.roof || 0x3a3a44); }
  M.box(mStone, 0, WH + 0.2, wallZ, GATE * 2 + 1.4, 1.6, TH + 0.4, 0, dark);
  // towers along the wall
  for (const x of [-20, 20, X0, X1]) { M.add("cyl", mStone, x, WH * 0.75, wallZ, 4, WH * 1.5, 4, 0, sc); M.add("cone", mRoof, x, WH * 1.5 + 1.3, wallZ, 4.6, 2.6, 4.6, 0, P.roof || 0x3a3a44); }
  // stairs up to the walk on the inside
  const stairs = [-9, 9];
  for (const x of stairs) for (let i = 0; i < 8; i++) M.box(mStone, x, (i + 0.5) * WH / 8, wallZ - TH / 2 - 0.6 - (7 - i) * 0.7, 1.8, WH / 8 * (i + 1), 0.7, 0, dark);
  // the hold beyond: a keep and roofs so the walls guard something
  M.box(mStone, 0, 7, wallZ - 34, 16, 14, 14, 0, sc); M.add("cone", mRoof, 0, 16, wallZ - 34, 13, 5, 13, 0.78, P.roof || 0x3a3a44);
  for (let i = 0; i < 9; i++) { const x = -30 + i * 7.5, z = wallZ - 14 - (i % 3) * 5; if (Math.abs(x) < 9) continue; M.box(art.mat("plaster"), x, 1.8, z, 5, 3.6, 4.2, 0, P.wall || 0xb8a890); M.add("prism", mRoof, x, 3.6, z, 4.2, 1.8, 5.4, Math.PI / 2, P.roof || 0x3a3a44); }
  M.build(scene, (g) => st.track(g));

  // the gate (its own mesh, so it can shudder and fall)
  const gate = new THREE.Group(), gm = new THREE.Mesh(kit.g.box, kit.mat(0x5a3c24)); gm.scale.set(GATE * 2, 4.4, 0.5); gm.position.y = 2.2; gm.castShadow = true; gate.add(gm);
  for (const y of [1, 2.4, 3.8]) { const band = new THREE.Mesh(kit.g.box, kit.mat(0x2a2a30, { metalness: 0.6, roughness: 0.5 })); band.scale.set(GATE * 2 + 0.1, 0.2, 0.56); band.position.y = y; gate.add(band); }
  gate.position.set(0, 0, wallZ); scene.add(gate);
  // ladders against the outer face
  const ladders = [-15, 11, 25].map((x) => {
    const g = new THREE.Group(), L = 6.6;
    for (const s of [-1, 1]) { const r = new THREE.Mesh(kit.g.box, kit.mat(0x6a4a2a)); r.scale.set(0.12, L, 0.12); r.position.set(s * 0.4, L / 2, 0); g.add(r); }
    for (let i = 1; i < 11; i++) { const r = new THREE.Mesh(kit.g.box, kit.mat(0x7a5a34)); r.scale.set(0.8, 0.07, 0.08); r.position.set(0, i * L / 11, 0); g.add(r); }
    g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
    g.position.set(x, 0, wallZ + TH / 2 + 2.2); g.rotation.x = -0.33; scene.add(g);
    return { x, footZ: wallZ + TH / 2 + 2.6 };
  });
  // the ram: a roofed frame on wheels with a swinging iron-capped log
  const ram = { x: 0, z: wallZ + 30, hit: 0, swing: 0 }, rg = new THREE.Group();
  { const f = new Merge(); f.box(mBeam, 0, 1.1, 0, 2.4, 0.2, 4.2, 0, 0x4a3422); for (const sx of [-1, 1]) for (const sz of [-1.6, 1.6]) f.box(mBeam, sx * 1.1, 1.3, sz, 0.18, 2.6, 0.18, 0, 0x4a3422); f.add("prism", mPlank, 0, 2.6, 0, 3, 1.3, 4.6, 0, 0x6a5038); f.build(rg, (g) => st.track(g));
    for (const sx of [-1, 1]) for (const sz of [-1.4, 1.4]) { const w = new THREE.Mesh(kit.g.cyl, kit.mat(0x3a2818)); w.scale.set(0.9, 0.2, 0.9); w.rotation.z = Math.PI / 2; w.position.set(sx * 1.25, 0.45, sz); rg.add(w); }
    const log = new THREE.Mesh(kit.g.cyl, kit.mat(0x5a3c24)); log.scale.set(0.45, 4.6, 0.45); log.rotation.x = Math.PI / 2; log.position.set(0, 1.6, 0); rg.add(log);
    const cap = new THREE.Mesh(kit.g.cone, kit.mat(0x3a3a40, { metalness: 0.6, roughness: 0.45 })); cap.scale.set(0.6, 0.6, 0.6); cap.rotation.x = -Math.PI / 2; cap.position.set(0, 1.6, -2.5); rg.add(cap); ram.log = log; ram.cap = cap; }
  rg.traverse((o) => { if (o.isMesh) o.castShadow = true; }); rg.position.set(ram.x, 0, ram.z); scene.add(rg);
  // torchlight in the gate passage and the yard, so the inside of the walls never goes black
  for (const x of [-4.5, 4.5]) { const f = new THREE.Mesh(kit.g.flame, kit.glow(0xff9a4a)); f.position.set(x, 3, wallZ - TH / 2 - 0.3); scene.add(f); }
  { const pl = new THREE.PointLight(0xffa860, 60, 26, 1.6); pl.position.set(0, 4, wallZ - 5); scene.add(pl); const h2 = new THREE.HemisphereLight(0xffd8b0, 0x2a2018, 0.35); scene.add(h2); }
  // braziers on the wall walk
  const glows = [];
  for (const x of [-26, -12, 12, 26]) { const f = new THREE.Mesh(kit.g.flame, kit.glow(0xff8a3a)); f.position.set(x, WH + 0.6, wallZ - 0.6); scene.add(f); glows.push(f); }

  let gateHP = 100, breached = false, breachT = 0, wallTaken = false, wallT = 0, crewPicked = false;
  const attacker = defendP ? "e" : "p";
  const SG = {
    wallZ, innerZ, wallW: (X1 - X0) - 6, WH,
    get breached() { return breached; }, get wallTaken() { return wallTaken; },
    height: (x, z, h) => h,
    yAt: (x, z, u) => (u && u.onWall ? WH + 0.05 : H0(x, z) * 0.35),
    inBand: (z) => z > wallZ - TH / 2 - 0.35 && z < wallZ + TH / 2 + 0.35,
    canStand(x, z, u) {
      if (u && u.onWall) return Math.abs(z - wallZ) < 0.95 && x > X0 + 1.5 && x < X1 - 1.5;
      if (SG.inBand(z)) return breached && Math.abs(x) < GATE - 0.4;
      if (z < wallZ - TH / 2 && (x < X0 || x > X1)) return false;
      return true;
    },
    blocks(a) { return SG.inBand(a.z) && a.y < WH + 0.2 && a.y > 0 && !(breached && Math.abs(a.x) < GATE && a.y < 4.4) && a.x > X0 && a.x < X1; },
    climb(u, dt) {
      const c = u.climb; c.t += dt; const k = Math.min(1, c.t / c.T);
      u.x = c.x0 + (c.x1 - c.x0) * k; u.y = c.y0 + (c.y1 - c.y0) * k; u.z = c.z0 + (c.z1 - c.z0) * k; u.yaw = c.yaw;
      if (k >= 1) { u.onWall = c.end === "wall"; u.climb = null; }
    },
    startClimb(u, x0, z0, x1, z1, up, T) { u.climb = { x0, z0, x1, z1, y0: up ? SG.yAt(x0, z0, {}) : WH, y1: up ? WH + 0.05 : SG.yAt(x1, z1, {}), t: 0, T, end: up ? "wall" : "ground", yaw: Math.atan2(x1 - x0, z1 - z0) }; },
    // route: true when the unit must walk somewhere other than straight at its foe (sets u.rx, u.rz)
    route(u, foe, ord) {
      if (u.climb) return false;
      const att = u.side === attacker;
      // the ram crew push until the gate breaks
      if (att && u.ramCrew && !breached) { u.rx = ram.x + u.ramOff; u.rz = ram.z + 2.6; return Math.hypot(u.rx - u.x, u.rz - u.z) > 0.4; }
      if (!foe) return false;
      const foeBeyond = att && (foe.onWall || foe.z < wallZ - TH / 2);
      if (u.cls === "arch") { if (u.onWall && ord !== "charge") return false; if (!u.onWall && !att) return false; }
      if (u.onWall) {
        // on the walk: fight along it; go down the stairs to fight below
        if (!foe.onWall && foe.z < wallZ && (!att || wallTaken || ord === "charge")) { const sx = nearest(stairs, u.x); if (Math.abs(u.x - sx) < 0.8) { SG.startClimb(u, sx, wallZ - 0.6, sx, wallZ - TH / 2 - 6, false, 1.8); return false; } u.rx = sx; u.rz = wallZ; return true; }
        return false;
      }
      if (att && foeBeyond && !u.hero) {
        if (breached && Math.abs(u.x) > GATE - 0.6 && u.z > wallZ) { u.rx = 0; u.rz = u.z > wallZ + TH ? wallZ + TH + 0.5 : wallZ - TH; return true; }
        if (breached) return false;
        if (ord !== "charge" && ord !== "advance" && u.side === "p") return false;
        const L = nearestLadder(u.x); if (Math.hypot(u.x - L.x, u.z - L.footZ) < 0.9) { SG.startClimb(u, L.x, L.footZ, L.x, wallZ + 0.3, true, 2.6); return false; }
        u.rx = L.x; u.rz = L.footZ; return true;
      }
      // defenders below: climb to the walk to meet men coming over it
      if (!att && !u.onWall && foe.onWall && u.cls !== "arch") { const sx = nearest(stairs, u.x), fz = wallZ - TH / 2 - 5.6; if (Math.hypot(u.x - sx, u.z - fz) < 0.9) { SG.startClimb(u, sx, fz, sx, wallZ - 0.5, true, 1.8); return false; } u.rx = sx; u.rz = fz; return true; }
      return false;
    },
    // the hero climbs a ladder or the stairs by walking into the foot of it
    heroClimb(h) {
      if (h.climb || h.onWall) return;
      for (const L of ladders) if (Math.hypot(h.x - L.x, h.z - L.footZ) < 0.8) { SG.startClimb(h, L.x, L.footZ, L.x, wallZ + 0.3, true, 1.6); return; }
      for (const sx of stairs) if (Math.hypot(h.x - sx, h.z - (wallZ - TH / 2 - 5.6)) < 0.8) { SG.startClimb(h, sx, wallZ - TH / 2 - 5.6, sx, wallZ - 0.5, true, 1.4); return; }
    },
    heroDown(h) { if (!h.onWall || h.climb) return; for (const sx of stairs) if (Math.abs(h.x - sx) < 0.7) { SG.startClimb(h, sx, wallZ - 0.6, sx, wallZ - TH / 2 - 6, false, 1.2); return; } },
    tick(dt) {
      if (!SG.units) return;
      if (!crewPicked) { crewPicked = true; const inf = SG.units.filter((u) => u.side === attacker && u.cls === "inf" && !u.hero && !u.kael).sort((a, b) => Math.hypot(a.x - ram.x, a.z - ram.z) - Math.hypot(b.x - ram.x, b.z - ram.z)).slice(0, 4); inf.forEach((u, i) => { u.ramCrew = true; u.ramOff = (i - 1.5) * 0.8; }); }
      let crew = 0; for (const u of SG.units) if (u.ramCrew && !u.dead && !u.gone && !u.rout && Math.hypot(u.x - ram.x, u.z - (ram.z + 2.6)) < 1.6) crew++;
      if (!breached) {
        if (ram.z > wallZ + TH / 2 + 2.7) { if (crew >= 2) ram.z -= 1.0 * dt * Math.min(1, crew / 3); }
        else if (crew >= 1) { ram.hit -= dt; ram.swing += dt * 4; if (ram.hit <= 0) { ram.hit = 2.2; gateHP -= 8 * Math.min(1.5, crew / 2); SG.onHit && SG.onHit(); gate.position.z = wallZ - 0.15; if (gateHP <= 0) { breached = true; SG.onBreach && SG.onBreach(); } } }
        gate.position.z += (wallZ - gate.position.z) * Math.min(1, dt * 6);
      } else { gate.rotation.x = Math.max(-1.45, gate.rotation.x - dt * 2.5); if (gate.position.y > -0.2) gate.position.y -= dt * 0.4; breachT += dt; }
      rg.position.set(ram.x, 0, ram.z); ram.log.position.z = Math.sin(ram.swing) * 0.6; ram.cap.position.z = -2.5 + Math.sin(ram.swing) * 0.6;
      for (const f of glows) f.scale.y = 0.9 + Math.random() * 0.25;
      // the wall walk: attackers on it, none of its defenders left there
      let aOn = 0, dOn = 0; for (const u of SG.units) if (u.onWall && !u.dead && !u.gone && !u.rout) { if (u.side === attacker) aOn++; else dOn++; }
      if (aOn >= 4 && dOn === 0) wallT += dt; else wallT = Math.max(0, wallT - dt * 0.5);
      if (wallT > 6) wallTaken = true;
    },
    outcome() {
      const attWin = (breached && breachT > 5) || wallTaken;
      if (!attWin) return null;
      return attacker === "p" ? "win" : "lose";
    },
    state: () => ({ gate: Math.max(0, Math.round(gateHP)), breached, wallTaken, ramDist: Math.max(0, ram.z - (wallZ + TH / 2 + 2.7)), onWall: SG.units ? SG.units.filter((u) => u.onWall && !u.dead && !u.gone).length : 0, ladders: ladders.length, attacker }),
    _ram: ram
  };
  function nearest(list, x) { let b = list[0]; for (const v of list) if (Math.abs(v - x) < Math.abs(b - x)) b = v; return b; }
  function nearestLadder(x) { let b = ladders[0]; for (const L of ladders) if (Math.abs(L.x - x) < Math.abs(b.x - x)) b = L; return b; }
  return SG;
}
