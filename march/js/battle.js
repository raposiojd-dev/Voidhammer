// Voidhammer: The Ember March. Turn-based battles on a 9 x 5 board.
"use strict";
const BW = 9, BH = 5;
const B = { st: null, cv: null, ctx: null, raf: 0, busy: false, cell: 60, ox: 0, oy: 0, tok: {}, fx: [] };
const sleep = ms => new Promise(r => setTimeout(r, B.fast ? 0 : ms));
const bk = (x, y) => x + "," + y;
const man = (a, b) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
const cheb = (a, b) => Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y));

B.start = function (kind, onEnd) {
  const s = G.s, foes = G.foeList(kind);
  const ready = G.ready();
  const rank = u => u.type === "hero" ? 9 : D.UNITS[u.type].comp ? 8 : (D.UNITS[u.type].tier || 1) + u.xp / 100;
  const pick = ready.slice().sort((a, b) => rank(b) - rank(a)).slice(0, 8);
  const st = { kind, units: [], rocks: {}, haz: {}, fire: {}, turn: "player", round: 1, sel: null, mode: null, heat: 0, kills: {}, downed: [], startFoes: foes.length, over: false, onEnd, bg: D.TERRAIN[G.tile(s.pos[0], s.pos[1])].battle, log: "" };
  const place = (list, side) => {
    const melee = list.filter(u => D.UNITS[u.type].rng === 1), ranged = list.filter(u => D.UNITS[u.type].rng > 1);
    const rows = [2, 1, 3, 0, 4];
    const put = (arr, x, x2) => arr.forEach((u, i) => { const def = D.UNITS[u.type]; st.units.push({ id: st.units.length + 1, wid: u.id || 0, type: u.type, side, x: i < 5 ? x : x2, y: rows[i % 5], hp: side ? def.hp : Math.max(1, Math.min(u.hp, G.maxHp(u))), max: side ? def.hp : G.maxHp(u), ab: side ? 0 : G.atkBonus(u), lv: side ? 0 : G.lvl(u), acted: false, moved: false, name: side ? def.name : G.uName(u), art: side ? def.art : G.uArt(u), dx: 0, dy: 0, flash: 0 }); });
    if (side === 0) { put(melee, 1, 2); put(ranged, 0, 1); } else { put(melee, 7, 6); put(ranged, 8, 7); }
  };
  place(pick, 0); place(foes.map(t => ({ type: t })), 1);
  // fix any stacking from overflow rows
  const seen = {}; st.units.forEach(u => { while (seen[bk(u.x, u.y)]) { u.y = (u.y + 1) % BH; if (seen[bk(u.x, u.y)]) u.x += u.side ? -1 : 1; } seen[bk(u.x, u.y)] = 1; });
  [3, 4, 5].sort(() => G.rnd() - 0.5).slice(0, 2 + ri(2)).forEach(x => { st.rocks[bk(x, ri(BH))] = 1; });
  if (st.bg === "b_basalt") for (let i = 0; i < 2; i++) { const k = bk(3 + ri(3), ri(BH)); if (!st.rocks[k]) st.haz[k] = 1; }
  if (st.units.filter(u => u.side).length > st.units.filter(u => !u.side).length) st.heat = 2;
  B.st = st; B.fx = []; B.busy = false;
  B.resize(); cancelAnimationFrame(B.raf); B.loop();
  UI.battlePanel(); B.say(kind === "lair" ? "It comes up out of the rock." : "Your turn.");
  if (!G.s.flags.hintBattle) { G.s.flags.hintBattle = 1; UI.toast(D.HINTS.battle, 6000); }
};

B.resize = function () {
  const cv = B.cv; if (!cv) return; const box = cv.parentNode.getBoundingClientRect(); const dpr = Math.min(2, window.devicePixelRatio || 1);
  cv.width = Math.round(box.width * dpr); cv.height = Math.round(box.height * dpr); cv.style.width = box.width + "px"; cv.style.height = box.height + "px";
  B.dpr = dpr; B.w = box.width; B.h = box.height;
  B.cell = Math.floor(Math.min((box.width - 12) / BW, (box.height - 12) / BH));
  B.ox = Math.round((box.width - B.cell * BW) / 2); B.oy = Math.round((box.height - B.cell * BH) / 2); B.tok = {};
};

// ---------- queries ----------
B.at = (x, y) => B.st.units.find(u => u.hp > 0 && u.x === x && u.y === y);
B.live = side => B.st.units.filter(u => u.hp > 0 && u.side === side);
B.open = (x, y, u) => x >= 0 && y >= 0 && x < BW && y < BH && !B.st.rocks[bk(x, y)] && !(B.st.fire[bk(x, y)] && !(u && D.UNITS[u.type].fireproof));
B.reach = function (u, mv) { // cells reachable this turn -> { "x,y": [path] }
  const out = {}, q = [[u.x, u.y, []]]; const seen = {}; seen[bk(u.x, u.y)] = 1;
  while (q.length) { const c = q.shift(); if (c[2].length >= mv) continue;
    [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(d => { const x = c[0] + d[0], y = c[1] + d[1], k = bk(x, y); if (seen[k] || !B.open(x, y, u) || B.at(x, y)) return; seen[k] = 1; const p = c[2].concat([[x, y]]); out[k] = p; q.push([x, y, p]); }); }
  return out;
};
B.spCost = m => Math.max(1, D.SPELLS[m].cost - (G.s.flags.banked ? 1 : 0));
B.dmg = function (a, t, bonus) { // [min, max]
  const A = D.UNITS[a.type], T = D.UNITS[t.type]; let base = A.atk + (a.ab || 0) + (bonus || 0) - T.def;
  if (B.st.units.some(o => o.hp > 0 && o.side === a.side && o !== a && man(o, t) === 1)) base += 1;
  if (B.st.units.some(o => o.hp > 0 && o.side === t.side && o !== t && D.UNITS[o.type].guard && man(o, t) === 1)) base -= 1;
  if (A.fire && T.fireproof) base = Math.ceil(base / 2);
  return [Math.max(1, base), Math.max(1, base + 2)];
};
B.hero = () => B.st.units.find(u => u.type === "hero" && u.hp > 0);
B.say = function (t) { B.st.log = t; const el = document.getElementById("b-say"); if (el) el.textContent = t; };

// ---------- actions ----------
B.float = function (u, text, col) { B.fx.push({ x: u.x, y: u.y, text, col: col || "#fff", t: 0 }); };
B.hurt = async function (t, n, by) {
  t.hp = Math.max(0, t.hp - n); t.flash = 1; B.float(t, "-" + n, t.side ? "#ffd9a8" : "#ff8f7a");
  const st = B.st; if (t.type === "hero" || (by && by.type === "hero")) st.heat = Math.min(10, st.heat + 1);
  if (t.hp <= 0) { if (t.side === 0) st.downed.push(t.wid); else if (by && by.side === 0) st.kills[by.wid] = (st.kills[by.wid] || 0) + 1; B.say(t.name + (t.side ? " goes down." : " is down.")); }
  await sleep(260);
};
B.walk = async function (u, path) {
  for (const p of path) {
    const fx = u.x, fy = u.y; u.x = p[0]; u.y = p[1]; u.dx = fx - u.x; u.dy = fy - u.y;
    const t0 = performance.now(), dur = B.fast ? 0 : 95;
    await new Promise(res => { const step = () => { const k = dur ? Math.min(1, (performance.now() - t0) / dur) : 1; u.dx = (fx - u.x) * (1 - k); u.dy = (fy - u.y) * (1 - k); if (k < 1) requestAnimationFrame(step); else res(); }; step(); });
    if (B.st.haz[bk(u.x, u.y)] && !D.UNITS[u.type].fireproof) { await B.hurt(u, 3, null); if (u.hp <= 0) return; }
  }
};
B.strike = async function (a, t, bonus) {
  const r = B.dmg(a, t, bonus), n = r[0] + ri(r[1] - r[0] + 1);
  const ddx = Math.sign(t.x - a.x) * 0.25, ddy = Math.sign(t.y - a.y) * 0.25; a.dx = ddx; a.dy = ddy; await sleep(90); a.dx = 0; a.dy = 0;
  if (D.UNITS[a.type].rng > 1) B.fx.push({ line: [a.x, a.y, t.x, t.y], fire: D.UNITS[a.type].fire, t: 0 });
  await B.hurt(t, n, a);
};
B.checkEnd = function () {
  const st = B.st; if (st.over) return true;
  const foes = B.live(1), mine = B.live(0);
  if (!B.hero()) return B.finish({ won: false, heroDown: true });
  if (!foes.length) return B.finish({ won: true });
  if (st.startFoes >= 4 && foes.length <= Math.floor(st.startFoes / 4) && !foes.some(f => D.UNITS[f.type].boss)) { B.say("The rest of them run."); return B.finish({ won: true }); }
  if (!mine.length) return B.finish({ won: false, heroDown: true });
  return false;
};
B.finish = function (res) {
  const st = B.st; st.over = true; B.busy = true;
  st.units.forEach(u => { if (u.side === 0 && u.hp > 0) { const w = G.s.units.find(x => x.id === u.wid); if (w) w.hp = u.hp; } });
  res.downed = st.downed; res.kills = st.kills; res.casts = st.casts || 0; res.fled = !!res.fled; res.fought = st.units.filter(u => u.side === 0).map(u => u.wid);
  setTimeout(() => { cancelAnimationFrame(B.raf); st.onEnd(res); }, B.fast ? 0 : 700); return true;
};

// ---------- player input ----------
B.tap = async function (cx, cy) {
  const st = B.st; if (!st || B.busy || st.over || st.turn !== "player") return;
  const x = Math.floor((cx - B.ox) / B.cell), y = Math.floor((cy - B.oy) / B.cell);
  if (x < 0 || y < 0 || x >= BW || y >= BH) { st.sel = null; st.mode = null; UI.battlePanel(); return; }
  const hit = B.at(x, y), sel = st.sel;
  if (st.mode && sel) { await B.cast(st.mode, x, y); return; }
  if (hit && hit.side === 0) { st.sel = hit.acted ? null : hit; UI.battlePanel(); return; }
  if (!sel) return;
  const def = D.UNITS[sel.type];
  B.busy = true;
  if (hit && hit.side === 1) {
    if (man(sel, hit) > def.rng) {
      if (sel.moved) { B.busy = false; B.say("Too far to reach this turn."); return; }
      const rc = B.reach(sel, def.mv); let best = null;
      Object.keys(rc).forEach(k => { const p = k.split(",").map(Number); if (Math.abs(p[0] - hit.x) + Math.abs(p[1] - hit.y) <= def.rng && (!best || rc[k].length < best.length)) best = rc[k]; });
      if (!best) { B.busy = false; B.say("Too far to reach this turn."); return; }
      await B.walk(sel, best); sel.moved = true;
    }
    if (sel.hp > 0) await B.strike(sel, hit);
    sel.acted = true; st.sel = null;
  } else if (!hit) {
    const rc = B.reach(sel, def.mv);
    if (!sel.moved && rc[bk(x, y)]) { await B.walk(sel, rc[bk(x, y)]); sel.moved = true; if (sel.hp <= 0) st.sel = null; }
    else st.sel = null;
  }
  B.busy = false; UI.battlePanel();
  if (!B.checkEnd() && B.live(0).every(u => u.acted)) B.endTurn();
};
B.setMode = function (m) { const st = B.st; if (B.busy || !st.sel || st.sel.type !== "hero" || st.sel.acted) return; if (m === "flare") { B.cast("flare", st.sel.x, st.sel.y); return; } st.mode = st.mode === m ? null : m; B.say(st.mode ? (m === "lance" ? "Pick an enemy within 4." : "Pick where the wall goes, within 3.") : "Your turn."); UI.battlePanel(); };
B.cast = async function (m, x, y) {
  const st = B.st, h = st.sel; if (!h) return; const sp = D.SPELLS[m], t = B.at(x, y), pow = Math.floor(st.heat / 2);
  if (m === "lance") { if (!t || t.side !== 1 || man(h, t) > 4) { st.mode = null; B.say("No target there."); UI.battlePanel(); return; } }
  if (m === "wall") { if (Math.abs(x - h.x) + Math.abs(y - h.y) > 3 || !B.open(x, y)) { st.mode = null; B.say("Not there."); UI.battlePanel(); return; } }
  B.busy = true; st.mode = null;
  st.casts = (st.casts || 0) + 1; const entered = G.spend(B.spCost(m)); if (G.stage().id !== "toll") G.approve("dilys", -1);
  if (m === "lance") { B.fx.push({ line: [h.x, h.y, t.x, t.y], fire: 1, big: 1, t: 0 }); let n = 7 + pow + ri(2); if (D.UNITS[t.type].fireproof) n = Math.ceil(n / 2); await B.hurt(t, n, h); }
  if (m === "wall") { for (const yy of [y - 1, y, y + 1]) { if (yy < 0 || yy >= BH || st.rocks[bk(x, yy)]) continue; st.fire[bk(x, yy)] = 2; const o = B.at(x, yy); if (o && !D.UNITS[o.type].fireproof) await B.hurt(o, 4, h); } }
  if (m === "flare") { B.fx.push({ burst: [h.x, h.y], t: 0 }); for (const o of st.units.filter(o => o.hp > 0 && o !== h && cheb(o, h) <= 1)) { let n = 8 + pow; if (D.UNITS[o.type].fireproof) n = Math.ceil(n / 2); await B.hurt(o, n, h); } }
  h.acted = true; st.sel = null; B.busy = false; UI.battlePanel(); if (!st.over) B.say(sp.name + ". It cost you " + sp.cost + ".");
  if (entered) UI.stageNote(entered);
  if (!B.checkEnd() && B.live(0).every(u => u.acted)) B.endTurn();
};
B.fallBack = function () { if (B.busy || B.st.over) return; if (G.yieldLocked()) { B.say("You can't make yourself back down."); return; } B.finish({ won: false, fled: true }); };

// ---------- turn flow ----------
B.burn = async function (side) { for (const u of B.live(side)) if (B.st.fire[bk(u.x, u.y)] && !D.UNITS[u.type].fireproof) await B.hurt(u, 4, null); };
B.endTurn = async function () {
  const st = B.st; if (B.busy || st.over || st.turn !== "player") return;
  B.busy = true; st.sel = null; st.mode = null; st.turn = "enemy"; UI.battlePanel(); B.say("Their turn.");
  await sleep(350); await B.burn(1);
  if (!B.checkEnd()) for (const e of B.live(1)) { if (st.over) break; await B.foeAct(e); if (B.checkEnd()) break; }
  if (st.over) return;
  Object.keys(st.fire).forEach(k => { if (--st.fire[k] <= 0) delete st.fire[k]; });
  st.round++; st.turn = "player"; st.units.forEach(u => { u.acted = false; u.moved = false; });
  await B.burn(0); if (B.checkEnd()) return;
  B.busy = false; B.say("Your turn."); UI.battlePanel();
  await B.surge();
};
B.foeAct = async function (e) {
  const def = D.UNITS[e.type], mine = B.live(0); if (!mine.length) return;
  const inRange = () => mine.filter(m => m.hp > 0 && man(e, m) <= def.rng).sort((a, b) => a.hp - b.hp)[0];
  let t = inRange();
  if (!t) {
    // walk towards the nearest fighter: breadth-first over open cells, ignoring other units for the route
    const dist = {}; const q = []; mine.forEach(m => { dist[bk(m.x, m.y)] = 0; q.push([m.x, m.y]); });
    while (q.length) { const c = q.shift(); [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(d => { const x = c[0] + d[0], y = c[1] + d[1], k = bk(x, y); if (dist[k] !== undefined || !B.open(x, y, e)) return; dist[k] = dist[bk(c[0], c[1])] + 1; q.push([x, y]); }); }
    const rc = B.reach(e, def.mv); let best = null, bd = dist[bk(e.x, e.y)]; if (bd === undefined) bd = 99;
    Object.keys(rc).forEach(k => { const d = dist[k]; if (d !== undefined && d >= (def.rng > 1 ? 2 : 1) && d < bd) { bd = d; best = rc[k]; } });
    if (best) { await B.walk(e, best); if (e.hp <= 0) return; }
    t = inRange();
  }
  if (t) { await B.strike(e, t); if (e.type === "serpent") for (const o of mine.filter(m => m.hp > 0 && m !== t && man(e, m) === 1)) await B.hurt(o, 3, e); }
  await sleep(120);
};
B.surge = async function () {
  const st = B.st, h = B.hero(); if (!h || st.over) return;
  let p = G.stage().surge; if (!p) return;
  if (st.units.some(u => u.hp > 0 && u.type === "dilys" && cheb(u, h) <= 2)) p /= 2;
  if (G.rnd() >= p) return;
  B.busy = true; B.say("The fire takes your turn."); UI.toast("The fire takes your turn.", 2200); await sleep(700);
  const foes = B.live(1).sort((a, b) => man(a, h) - man(b, h)); const t = foes[0];
  if (t) {
    if (man(h, t) > 1) { const rc = B.reach(h, 4); let best = null, bd = man(h, t); Object.keys(rc).forEach(k => { const q = k.split(",").map(Number), d = Math.abs(q[0] - t.x) + Math.abs(q[1] - t.y); if (d < bd) { bd = d; best = rc[k]; } }); if (best) await B.walk(h, best); }
    if (h.hp > 0) {
      const hot = G.stage().id === "arrears" || G.stage().id === "reckoning";
      if (hot && st.units.some(o => o.hp > 0 && o !== h && cheb(o, h) <= 1)) { B.fx.push({ burst: [h.x, h.y], t: 0 }); for (const o of st.units.filter(o => o.hp > 0 && o !== h && cheb(o, h) <= 1)) await B.hurt(o, 5, h); }
      else if (man(h, t) === 1) await B.strike(h, t, 2);
    }
  }
  h.acted = true; h.moved = true; B.busy = false; UI.battlePanel(); B.checkEnd();
};

// ---------- drawing ----------
B.token = function (art, size) {
  const k = art + ":" + size; if (B.tok[k]) return B.tok[k];
  const c = document.createElement("canvas"), d = Math.round(size * (B.dpr || 1)); c.width = c.height = d; const x = c.getContext("2d");
  x.beginPath(); x.arc(d / 2, d / 2, d / 2, 0, 7); x.clip(); const im = IMG[art];
  if (im && im.width) x.drawImage(im, 0, 0, im.width, im.height, 0, 0, d, d); else { x.fillStyle = "#3a302c"; x.fillRect(0, 0, d, d); }
  B.tok[k] = c; return c;
};
B.loop = function () { B.draw(); B.raf = requestAnimationFrame(B.loop); };
B.draw = function () {
  const st = B.st, c = B.ctx; if (!st || !c) return; const S = B.cell, now = performance.now();
  c.setTransform(B.dpr, 0, 0, B.dpr, 0, 0); c.fillStyle = "#0e0b09"; c.fillRect(0, 0, B.w, B.h);
  const gx = B.ox, gy = B.oy, gw = S * BW, gh = S * BH, bg = IMG[st.bg];
  c.save(); B.rr(c, gx - 4, gy - 4, gw + 8, gh + 8, 10); c.clip();
  if (bg && bg.width) { const sc = Math.max((gw + 8) / bg.width, (gh + 8) / bg.height), dw = bg.width * sc, dh = bg.height * sc; c.drawImage(bg, gx - 4 + (gw + 8 - dw) / 2, gy - 4 + (gh + 8 - dh) / 2, dw, dh); }
  c.fillStyle = "rgba(10,7,5,.28)"; c.fillRect(gx - 4, gy - 4, gw + 8, gh + 8); c.restore();
  // grid
  c.strokeStyle = "rgba(243,210,180,.13)"; c.lineWidth = 1;
  for (let x = 0; x <= BW; x++) { c.beginPath(); c.moveTo(gx + x * S + .5, gy); c.lineTo(gx + x * S + .5, gy + gh); c.stroke(); }
  for (let y = 0; y <= BH; y++) { c.beginPath(); c.moveTo(gx, gy + y * S + .5); c.lineTo(gx + gw, gy + y * S + .5); c.stroke(); }
  const sel = st.sel, def = sel && D.UNITS[sel.type];
  // highlights
  if (sel && st.turn === "player" && !B.busy) {
    if (st.mode === "wall") { for (let x = 0; x < BW; x++) for (let y = 0; y < BH; y++) if (Math.abs(x - sel.x) + Math.abs(y - sel.y) <= 3 && B.open(x, y)) B.cellFill(x, y, "rgba(255,122,26,.20)"); }
    else if (!st.mode && !sel.moved) { const rc = B.reach(sel, def.mv); Object.keys(rc).forEach(k => { const p = k.split(",").map(Number); B.cellFill(p[0], p[1], "rgba(232,190,120,.20)"); }); }
  }
  // hazards, rocks, fire
  Object.keys(st.haz).forEach(k => { const p = k.split(",").map(Number), x = gx + p[0] * S, y = gy + p[1] * S; const g = c.createRadialGradient(x + S / 2, y + S / 2, 2, x + S / 2, y + S / 2, S * .5); g.addColorStop(0, "rgba(255,170,60," + (.55 + .15 * Math.sin(now / 300 + p[0])) + ")"); g.addColorStop(1, "rgba(255,90,10,0)"); c.fillStyle = g; c.fillRect(x, y, S, S); c.strokeStyle = "rgba(255,200,120,.8)"; c.lineWidth = 2; c.beginPath(); c.moveTo(x + S * .2, y + S * .3); c.lineTo(x + S * .45, y + S * .5); c.lineTo(x + S * .4, y + S * .7); c.moveTo(x + S * .45, y + S * .5); c.lineTo(x + S * .8, y + S * .55); c.stroke(); });
  Object.keys(st.rocks).forEach(k => { const p = k.split(",").map(Number), im = IMG[st.bg === "b_march" ? "rock2" : "rock1"], x = gx + p[0] * S, y = gy + p[1] * S; if (im && im.width) c.drawImage(im, x - S * .04, y - S * .08, S * 1.08, S * 1.08); else { c.fillStyle = "#1d1815"; c.beginPath(); c.arc(x + S / 2, y + S / 2, S * .36, 0, 7); c.fill(); } });
  Object.keys(st.fire).forEach(k => { const p = k.split(",").map(Number), x = gx + p[0] * S, y = gy + p[1] * S; for (let i = 0; i < 3; i++) { const fl = .5 + .5 * Math.sin(now / (110 + i * 37) + p[1] * 2 + i); const g = c.createRadialGradient(x + S * (.3 + i * .2), y + S * (.62 - fl * .12), 1, x + S * (.3 + i * .2), y + S * .55, S * (.34 + fl * .1)); g.addColorStop(0, "rgba(255,236,170,.95)"); g.addColorStop(.4, "rgba(255,122,26,.7)"); g.addColorStop(1, "rgba(158,43,37,0)"); c.fillStyle = g; c.fillRect(x - 6, y - 10, S + 12, S + 16); } });
  // units
  const order = st.units.filter(u => u.hp > 0).sort((a, b) => a.y - b.y);
  order.forEach(u => {
    const x = gx + (u.x + u.dx) * S + S / 2, y = gy + (u.y + u.dy) * S + S / 2, r = S * .40, ud = D.UNITS[u.type];
    c.fillStyle = "rgba(0,0,0,.5)"; c.beginPath(); c.ellipse(x, y + r * .92, r * .9, r * .28, 0, 0, 7); c.fill();
    if (sel === u) { c.strokeStyle = "rgba(255,200,120," + (.55 + .35 * Math.sin(now / 160)) + ")"; c.lineWidth = 5; c.beginPath(); c.arc(x, y, r + 4, 0, 7); c.stroke(); }
    c.drawImage(B.token(u.art, Math.round(r * 2)), x - r, y - r, r * 2, r * 2);
    if (u.side === 0 && u.acted && st.turn === "player") { c.fillStyle = "rgba(12,9,7,.55)"; c.beginPath(); c.arc(x, y, r, 0, 7); c.fill(); }
    if (u.flash > 0) { c.fillStyle = "rgba(255,240,220," + u.flash * .7 + ")"; c.beginPath(); c.arc(x, y, r, 0, 7); c.fill(); u.flash = Math.max(0, u.flash - .08); }
    c.lineWidth = ud.boss ? 4 : 3; c.strokeStyle = u.side ? (ud.boss ? "#d9e4ea" : "#8fa3ad") : (u.type === "hero" ? "#ffb061" : "#c98b4b"); c.beginPath(); c.arc(x, y, r, 0, 7); c.stroke();
    // health
    const bw = r * 1.7, bx = x - bw / 2, by = y + r + 3; c.fillStyle = "rgba(0,0,0,.7)"; B.rr(c, bx - 1, by - 1, bw + 2, 7, 3); c.fill();
    c.fillStyle = u.side ? "#a9bcc6" : (u.hp / u.max > .4 ? "#e0a25a" : "#e2553f"); B.rr(c, bx, by, Math.max(2, bw * u.hp / u.max), 5, 2.5); c.fill();
    // forecast on targets
    if (sel && u.side === 1 && st.turn === "player" && !B.busy && !st.mode) {
      let can = man(sel, u) <= def.rng; if (!can && !sel.moved) { const rc = B.reach(sel, def.mv); can = Object.keys(rc).some(k => { const p = k.split(",").map(Number); return Math.abs(p[0] - u.x) + Math.abs(p[1] - u.y) <= def.rng; }); }
      if (can && !sel.acted) { const d = B.dmg(sel, u); c.strokeStyle = "rgba(226,85,63,.95)"; c.lineWidth = 2.5; c.setLineDash([5, 4]); c.beginPath(); c.arc(x, y, r + 5, 0, 7); c.stroke(); c.setLineDash([]); B.tag(c, x, y - r - 9, d[0] + "–" + d[1], "#e2553f"); }
    }
    if (st.mode === "lance" && sel && u.side === 1 && man(sel, u) <= 4) { c.strokeStyle = "rgba(255,160,60,.95)"; c.lineWidth = 3; c.beginPath(); c.arc(x, y, r + 5, 0, 7); c.stroke(); }
  });
  // effects
  B.fx = B.fx.filter(f => { f.t += 1 / 60; return f.t < (f.text ? 1 : .35); });
  B.fx.forEach(f => {
    if (f.text) { const x = gx + f.x * S + S / 2, y = gy + f.y * S + S * .25 - f.t * 26; c.globalAlpha = Math.min(1, (1 - f.t) * 2); c.font = "700 " + Math.round(S * .34) + "px Cinzel, serif"; c.textAlign = "center"; c.lineWidth = 4; c.strokeStyle = "rgba(0,0,0,.85)"; c.strokeText(f.text, x, y); c.fillStyle = f.col; c.fillText(f.text, x, y); c.globalAlpha = 1; }
    if (f.line) { const k = 1 - f.t / .35; c.strokeStyle = f.fire ? "rgba(255,150,50," + k + ")" : "rgba(240,230,210," + k + ")"; c.lineWidth = f.big ? 7 : (f.fire ? 4 : 2); c.lineCap = "round"; c.beginPath(); c.moveTo(gx + f.line[0] * S + S / 2, gy + f.line[1] * S + S / 2); c.lineTo(gx + f.line[2] * S + S / 2, gy + f.line[3] * S + S / 2); c.stroke(); }
    if (f.burst) { const k = f.t / .35, x = gx + f.burst[0] * S + S / 2, y = gy + f.burst[1] * S + S / 2; const g = c.createRadialGradient(x, y, 2, x, y, S * 1.6 * k + 4); g.addColorStop(0, "rgba(255,236,170," + (1 - k) + ")"); g.addColorStop(.6, "rgba(255,122,26," + (1 - k) * .8 + ")"); g.addColorStop(1, "rgba(158,43,37,0)"); c.fillStyle = g; c.fillRect(x - S * 2, y - S * 2, S * 4, S * 4); }
  });
};
B.cellFill = function (x, y, col) { const c = B.ctx, S = B.cell; c.fillStyle = col; B.rr(c, B.ox + x * S + 3, B.oy + y * S + 3, S - 6, S - 6, 7); c.fill(); };
B.rr = function (c, x, y, w, h, r) { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); };
B.tag = function (c, x, y, t, col) { c.font = "700 12px Cinzel, serif"; const w = c.measureText(t).width + 10; c.fillStyle = "rgba(14,11,9,.9)"; B.rr(c, x - w / 2, y - 9, w, 17, 5); c.fill(); c.fillStyle = col; c.textAlign = "center"; c.fillText(t, x, y + 4); };
