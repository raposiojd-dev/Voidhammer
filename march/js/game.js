// Voidhammer: The Ember March. State, world, clock, economy.
"use strict";
const COLS = 26, ROWS = 15, SAVE_KEY = "vh_march_v1";
const G = { s: null };

function rngFrom(seed) { let a = seed >>> 0; return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
G.rnd = Math.random;
const ri = n => Math.floor(G.rnd() * n);
const key = (c, r) => c + "," + r;

// ---------- hex helpers (pointy-top, odd rows shifted right) ----------
function nbrs(c, r) {
  const o = r & 1;
  return [[c + 1, r], [c - 1, r], [c + o, r - 1], [c + o - 1, r - 1], [c + o, r + 1], [c + o - 1, r + 1]].filter(p => p[0] >= 0 && p[1] >= 0 && p[0] < COLS && p[1] < ROWS);
}
function cube(c, r) { const x = c - (r - (r & 1)) / 2; return [x, -x - r, r]; }
function hexDist(a, b) { const A = cube(a[0], a[1]), B = cube(b[0], b[1]); return Math.max(Math.abs(A[0] - B[0]), Math.abs(A[1] - B[1]), Math.abs(A[2] - B[2])); }

// ---------- world generation ----------
G.genWorld = function (seed) {
  const rnd = rngFrom(seed);
  const grid = (w, h) => { const g = []; for (let y = 0; y <= h; y++) { g.push([]); for (let x = 0; x <= w; x++) g[y].push(rnd()); } return g; };
  const sm = t => t * t * (3 - 2 * t);
  const noise = (g, x, y) => { const x0 = Math.floor(x), y0 = Math.floor(y), fx = sm(x - x0), fy = sm(y - y0); const a = g[y0][x0], b = g[y0][x0 + 1], c = g[y0 + 1][x0], d = g[y0 + 1][x0 + 1]; return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy; };
  const g1 = grid(7, 5), g2 = grid(13, 8), g3 = grid(9, 6);
  const tiles = [];
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
    const e = noise(g1, c / COLS * 6, r / ROWS * 4) * 0.65 + noise(g2, c / COLS * 12, r / ROWS * 7) * 0.35;
    const h = noise(g3, c / COLS * 8, r / ROWS * 5);
    const east = c / (COLS - 1);
    let t;
    if (east > 0.74 + (h - 0.5) * 0.16) t = e > 0.68 ? "hills" : "granite";
    else if (h > 0.71 && east < 0.7) t = "lava";
    else if (e > 0.66) t = "hills";
    else if (e < 0.36) t = "wood";
    else t = h > 0.5 ? "basalt" : "ash";
    tiles.push(t);
  }
  const T = (c, r) => tiles[r * COLS + c];
  const sites = D.SITES.map(s => ({ id: s.id, c: s.at[0], r: s.at[1] }));
  // sites sit on walkable ground with walkable neighbours
  sites.forEach(s => { tiles[s.r * COLS + s.c] = s.c > 18 ? "granite" : "ash"; nbrs(s.c, s.r).forEach(p => { if (T(p[0], p[1]) === "lava") tiles[p[1] * COLS + p[0]] = "basalt"; }); });
  // make sure every site can be reached from the hold: carve basalt along a straight line where needed
  const reach = () => { const seen = new Set([key(16, 7)]), q = [[16, 7]]; while (q.length) { const p = q.pop(); nbrs(p[0], p[1]).forEach(n => { const k = key(n[0], n[1]); if (!seen.has(k) && T(n[0], n[1]) !== "lava") { seen.add(k); q.push(n); } }); } return seen; };
  sites.forEach(s => {
    if (reach().has(key(s.c, s.r))) return;
    let c = s.c, r = s.r, guard = 0;
    while ((c !== 16 || r !== 7) && guard++ < 80) { if (T(c, r) === "lava") tiles[r * COLS + c] = "basalt"; const opts = nbrs(c, r); opts.sort((a, b) => hexDist(a, [16, 7]) - hexDist(b, [16, 7])); c = opts[0][0]; r = opts[0][1]; }
  });
  return tiles;
};

// ---------- new game / save ----------
G.newGame = function (opts) {
  const seed = (Date.now() % 100000) + 7;
  let uid = 1;
  const mk = (type, name) => ({ id: uid++, type, name: name || null, xp: 0, hp: D.UNITS[type].hp, wounded: 0 });
  const names = D.TROOP_NAMES.slice().sort(() => G.rnd() - 0.5);
  const s = {
    v: 1, seed, day: 1, q: 0, // q = quarter-days into the day
    name: opts.name, art: opts.art, holdName: opts.holdName || "Your hold",
    pos: [16, 7], res: { food: 34, coal: 12, iron: 4, crowns: 60 }, favour: 0,
    control: 100, ceiling: 100, stageSeen: { toll: 1 }, heroWounded: 0,
    units: [mk("hero", opts.name), mk("cadoc"), mk("levy", names[0]), mk("levy", names[1]), mk("levy", names[2]), mk("thrower", names[3])],
    comp: { cadoc: { ap: 0, with: 1 } }, uid: 10, names: names.slice(4),
    b: { hall: 1, field: 1, coal: 0, fire: 0, wall: 0, long: 0, forge: 0, store: 0 }, build: null,
    grey: [], greyNext: 8, beacons: {}, quiet: {}, done: {}, flags: {}, visited: { hold: 1 },
    lastFight: 1, nextRaid: 9, log: [], over: null
  };
  s.units[0].art = opts.art;
  G.s = s; G.tiles = G.genWorld(seed); G.save(); return s;
};
G.save = function () { try { localStorage.setItem(SAVE_KEY, JSON.stringify(G.s)); } catch (e) {} };
G.load = function () { try { const j = localStorage.getItem(SAVE_KEY); if (!j) return null; const s = JSON.parse(j); if (!s || s.v !== 1) return null; G.s = s; G.tiles = G.genWorld(s.seed); return s; } catch (e) { return null; } };
G.hasSave = function () { try { const j = localStorage.getItem(SAVE_KEY); return !!j && !JSON.parse(j).over; } catch (e) { return false; } };
G.wipe = function () { try { localStorage.removeItem(SAVE_KEY); } catch (e) {} };

G.tile = (c, r) => G.tiles[r * COLS + c];
G.siteAt = (c, r) => D.SITES.find(s => s.at[0] === c && s.at[1] === r) || null;
G.site = id => D.SITES.find(s => s.id === id);
G.isGrey = (c, r) => G.s.grey.indexOf(key(c, r)) >= 0;
G.siteName = s => s.id === "hold" ? G.s.holdName : s.name;
G.siteLive = s => !G.s.done[s.id] && !G.s.quiet[s.id];

// ---------- pathfinding (Dijkstra over quarter-day costs) ----------
G.stepCost = function (c, r) { const t = D.TERRAIN[G.tile(c, r)]; return t.cost >= 99 ? Infinity : t.cost * (G.isGrey(c, r) ? 2 : 1); };
G.path = function (from, to) {
  if (G.stepCost(to[0], to[1]) === Infinity) return null;
  const dist = {}, prev = {}, open = [[0, from[0], from[1]]]; dist[key(from[0], from[1])] = 0;
  while (open.length) {
    open.sort((a, b) => a[0] - b[0]); const cur = open.shift();
    if (cur[1] === to[0] && cur[2] === to[1]) break;
    if (cur[0] > dist[key(cur[1], cur[2])]) continue;
    nbrs(cur[1], cur[2]).forEach(n => { const sc = G.stepCost(n[0], n[1]); if (sc === Infinity) return; const nd = cur[0] + sc, k = key(n[0], n[1]); if (dist[k] === undefined || nd < dist[k]) { dist[k] = nd; prev[k] = [cur[1], cur[2]]; open.push([nd, n[0], n[1]]); } });
  }
  const tk = key(to[0], to[1]); if (dist[tk] === undefined) return null;
  const out = []; let p = to; while (p && !(p[0] === from[0] && p[1] === from[1])) { out.unshift(p); p = prev[key(p[0], p[1])]; }
  return { steps: out, q: dist[tk] };
};
G.daysText = function (q) { if (q < 4) return q === 1 ? "a few hours" : q === 2 ? "half a day" : "most of a day"; const w = Math.floor(q / 4), f = q % 4; if (f === 0) return w + (w === 1 ? " day" : " days"); if (f === 2) return w + "½ days"; return f === 1 ? "just over " + w + (w === 1 ? " day" : " days") : "nearly " + (w + 1) + " days"; };

// ---------- warband helpers ----------
G.alive = () => G.s.units;
G.cap = () => 6 + G.s.b.long * 2 + G.s.units.filter(u => u.type === "hero" || D.UNITS[u.type].comp).length; // companions and you don't take a bunk
G.hero = () => G.s.units.find(u => u.type === "hero");
G.uName = u => u.type === "hero" ? G.s.name : (u.name || D.UNITS[u.type].name);
G.uArt = u => u.type === "hero" ? G.s.art : D.UNITS[u.type].art;
G.addUnit = function (type) { const s = G.s; const n = D.UNITS[type].comp ? null : (s.names.length ? s.names.shift() : D.TROOP_NAMES[ri(D.TROOP_NAMES.length)]); const u = { id: s.uid++, type, name: n, xp: type === "shieldaxe" || type === "adept" ? 3 : 0, hp: D.UNITS[type].hp, wounded: 0 }; s.units.push(u); return u; };
G.joinCompanion = function (id) { const s = G.s; if (s.comp[id]) return; s.comp[id] = { ap: 0, with: 1 }; G.addUnit(id); };
G.approve = function (id, n) { const c = G.s.comp[id]; if (!c || !c.with) return; c.ap = Math.max(-5, Math.min(5, c.ap + n)); };
G.leaving = function () { // companions whose patience has run out
  const out = []; Object.keys(G.s.comp).forEach(id => { const c = G.s.comp[id]; if (c.with && c.ap <= -4) { c.with = 0; G.s.units = G.s.units.filter(u => u.type !== id); out.push(id); } }); return out;
};
G.can = cost => Object.keys(cost || {}).every(k => G.s.res[k] >= cost[k]);
G.pay = cost => Object.keys(cost || {}).forEach(k => { G.s.res[k] -= cost[k]; });
G.gain = get => Object.keys(get || {}).forEach(k => { if (k === "favour") G.s.favour += get[k]; else G.s.res[k] += get[k]; });

// ---------- control (the price of Embercraft) ----------
G.stage = function (v) { v = v === undefined ? G.s.control : v; return D.STAGES.find(st => v >= st.min); };
G.yieldLocked = () => G.stage().id !== "toll";
G.spend = function (n) { // returns the stage id if a new stage was entered
  const s = G.s; s.control = Math.max(0, s.control - n); const st = G.stage();
  if (!s.stageSeen[st.id]) { s.stageSeen[st.id] = 1; if (st.id === "debt") s.ceiling -= 5; if (st.id === "arrears") s.ceiling -= 10; if (st.id === "reckoning") s.ceiling -= 15; return st.id; }
  return null;
};
G.rest = function () { // a night at a hearth
  const s = G.s; const before = s.control; const st = G.stage().id;
  const top = (st === "arrears" || st === "reckoning") ? Math.min(s.ceiling, 69) : s.ceiling;
  s.control = Math.max(s.control, top);
  s.units.forEach(u => { u.hp = D.UNITS[u.type].hp; });
  G.approve("dilys", 1);
  return s.control - before;
};

// ---------- clock and economy ----------
G.income = function () { const b = G.s.b; return { food: b.field * 3, coal: b.coal * 2 - b.fire, crowns: b.store * 3 }; };
G.eats = () => Math.ceil(G.s.units.length / 2);
G.fireRadius = () => G.s.b.fire && G.s.res.coal > 0 ? G.s.b.fire + 1 : 0;
G.lit = function (c, r) { // is this hex inside firelight?
  const fr = G.fireRadius(); if (fr && hexDist([c, r], [16, 7]) <= fr) return true;
  return Object.keys(G.s.beacons).some(id => { const st = G.site(id); return hexDist([c, r], st.at) <= 1; });
};
// advance one quarter-day; returns a list of things that happened
G.tick = function () {
  const s = G.s, out = []; s.q++;
  if (s.q < 4) return out;
  s.q = 0; s.day++;
  const inc = G.income();
  s.res.food += inc.food; s.res.crowns += inc.crowns; s.res.coal = Math.max(0, s.res.coal + inc.coal);
  s.res.food -= G.eats();
  if (s.res.food < 0) { s.res.food = 0; s.hungry = (s.hungry || 0) + 1; if (s.hungry === 1) G.approve("cadoc", -1); if (s.hungry % 2 === 0) { const t = s.units.filter(u => !D.UNITS[u.type].comp && u.type !== "hero"); if (t.length) { const u = t[ri(t.length)]; s.units = s.units.filter(x => x !== u); out.push({ k: "desert", who: G.uName(u) }); } } out.push({ k: "hungry" }); } else s.hungry = 0;
  if (s.build) { s.build.left--; if (s.build.left <= 0) { s.b[s.build.id]++; out.push({ k: "built", id: s.build.id }); s.build = null; } }
  s.units.forEach(u => { if (u.wounded > 0) u.wounded--; });
  if (s.heroWounded > 0) s.heroWounded--;
  // the grey edge
  if (s.day >= s.greyNext) { s.greyNext = s.day + 3; if (G.spreadGrey()) out.push({ k: "grey" }); }
  // raids on the hold while you are away
  if (s.day >= s.nextRaid) {
    s.nextRaid = s.day + 7 + ri(5);
    const campsLeft = [1, 2, 3].filter(n => !s.done["camp" + n]).length;
    if (campsLeft && !(s.pos[0] === 16 && s.pos[1] === 7)) {
      const str = 1 + campsLeft + Math.floor(s.day / 18);
      if (s.b.wall * 2 >= str) { out.push({ k: "raidHeld" }); G.approve("cadoc", 1); }
      else { const lf = Math.min(s.res.food, 8 + str * 2), lc = Math.min(s.res.coal, 4 + str); s.res.food -= lf; s.res.coal -= lc; out.push({ k: "raid", food: lf, coal: lc }); G.approve("cadoc", -1); }
    }
  }
  if (s.day - s.lastFight === 12) G.approve("tavish", -1);
  if (s.b.wall >= 1 && s.b.field >= 2 && !s.flags.cadocGlad) { s.flags.cadocGlad = 1; G.approve("cadoc", 2); }
  if (G.isGrey(16, 7)) s.over = "grey";
  return out;
};
G.spreadGrey = function () {
  const s = G.s; let added = 0;
  if (!s.grey.length) { for (let r = 0; r < ROWS; r++) if (G.tile(COLS - 1, r) !== "lava" && G.rnd() < 0.6) { s.grey.push(key(COLS - 1, r)); added++; } if (!added) { s.grey.push(key(COLS - 1, 7)); added++; } return added; }
  const front = [];
  s.grey.forEach(k => { const p = k.split(",").map(Number); nbrs(p[0], p[1]).forEach(n => { const nk = key(n[0], n[1]); if (s.grey.indexOf(nk) < 0 && front.indexOf(nk) < 0 && G.tile(n[0], n[1]) !== "lava" && !G.lit(n[0], n[1])) front.push(nk); }); });
  // the grey leans west, towards the hold
  front.sort((a, b) => { const A = a.split(",").map(Number), B = b.split(","). map(Number); return (hexDist(A, [16, 7]) + G.rnd() * 3) - (hexDist(B, [16, 7]) + G.rnd() * 3); });
  const n = Math.min(front.length, 3 + Math.floor(s.day / 12));
  for (let i = 0; i < n; i++) { s.grey.push(front[i]); added++; const p = front[i].split(",").map(Number); const st = G.siteAt(p[0], p[1]); if (st && st.id !== "hold" && st.kind !== "camp" && st.kind !== "lair") s.quiet[st.id] = 1; }
  return added;
};
G.campsDone = () => [1, 2, 3].filter(n => G.s.done["camp" + n]).length;

// ---------- battles: set-up and aftermath ----------
G.foeList = function (kind) { const f = D.FOES[kind]; return typeof f === "function" ? f(G.s.day) : f.slice(); };
G.afterBattle = function (kind, res) {
  // res: { won, fled, downed: [unit ids], kills: {id: n}, heroDown }
  const s = G.s, out = { lost: [], hurt: [], loot: null, promoted: [] };
  s.lastFight = s.day;
  s.units.slice().forEach(u => {
    const down = res.downed.indexOf(u.id) >= 0;
    if (res.won && !down) u.xp += 1 + (res.kills[u.id] || 0);
    if (!down) return;
    const def = D.UNITS[u.type];
    if (u.type === "hero") { u.hp = Math.ceil(def.hp / 2); return; }
    if (def.comp) { if (u.wounded > 0) { s.units = s.units.filter(x => x !== u); s.comp[u.type].with = 0; s.comp[u.type].dead = 1; out.lost.push(G.uName(u)); } else { u.wounded = 6; u.hp = Math.ceil(def.hp / 2); out.hurt.push(G.uName(u)); } return; }
    if (G.rnd() < 0.5) { s.units = s.units.filter(x => x !== u); out.lost.push(G.uName(u)); } else { u.wounded = 4; u.hp = Math.ceil(def.hp / 2); out.hurt.push(G.uName(u)); }
  });
  // canon: "every fight burns a few out". Emberforged troops who fought may not come back from it.
  out.burnt = [];
  s.units.slice().forEach(u => { if (u.type === "adept" && res.downed.indexOf(u.id) < 0 && res.fought && res.fought.indexOf(u.id) >= 0 && G.rnd() < 0.15) { s.units = s.units.filter(x => x !== u); out.burnt.push(G.uName(u)); } });
  if (res.won) {
    out.loot = D.LOOT[kind] || {}; G.gain(out.loot);
    if (kind !== "patrol") G.approve("tavish", kind === "camp3" ? 2 : 1);
  } else {
    if (res.fled) G.approve("tavish", -1);
    if (res.heroDown) { if (s.heroWounded > 0) s.over = "dead"; else { s.heroWounded = 8; const lf = Math.floor(s.res.crowns / 3); s.res.crowns -= lf; out.robbed = lf; s.pos = [16, 7]; } }
  }
  if (G.campsDone() === 3) s.over = "won";
  return out;
};
G.canPromote = function (u, where) { // where: "hold" or a site id
  const def = D.UNITS[u.type]; if (!def.up) return null;
  const nt = D.UNITS[def.up].tier, rule = D.PROMOTE[nt];
  const forge = where === "hold" ? G.s.b.forge : (where === "hearthmount" ? 2 : (where === "smeltgate" || where === "slagford") ? 1 : 0);
  return { to: def.up, rule, okXp: u.xp >= rule.xp, okIron: G.s.res.iron >= rule.iron, okForge: forge >= rule.forge };
};
G.promote = function (u) { const def = D.UNITS[u.type]; const rule = D.PROMOTE[D.UNITS[def.up].tier]; G.s.res.iron -= rule.iron; u.type = def.up; u.hp = D.UNITS[u.type].hp; };
