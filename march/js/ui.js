// Voidhammer: The Ember March. Map view, screens and game flow.
"use strict";
const IMG = {};
const ART = ["bg_title","bg_hold","bg_camp","b_ash","b_basalt","b_march","t_ash","t_basalt","t_wood","t_hills","t_lava","t_granite","t_grey",
  "hero_f","hero_m","dilys","cadoc","tavish","levy","shieldaxe","emberclad","thrower","firejav","adept","r_axe","r_archer","r_brute","r_captain","serpent",
  "bd_hall","bd_field","bd_coal","bd_forge","bd_long","bd_wall","bd_fire","bd_store","s_city","s_forge","s_village","s_keep","s_camp","s_caves","s_hold","rock1","rock2"];
const $ = id => document.getElementById(id);
const esc = t => String(t).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const src = n => "img/" + n + ".webp";
const ICON = {
  food: '<svg viewBox="0 0 16 16"><path d="M8 1c1.5 2 1.5 3.5 0 5-1.500-1.500-1.500-3 0-5zM3.500 5c2 .5 3 1.500 3.300 3.500C4.800 8.200 3.800 7 3.500 5zm9 0c-2 .5-3 1.500-3.300 3.500 2-.3 3-1.500 3.300-3.500zM7.300 9h1.400v6H7.300z" fill="#e0a25a"/></svg>',
  coal: '<svg viewBox="0 0 16 16"><path d="M2 10l2-5 4-2 5 3 1 5-4 3H5z" fill="#4a3d36" stroke="#b89e88" stroke-width=".8"/><path d="M6 6l3 1-1 3" fill="none" stroke="#ff7a1a" stroke-width="1"/></svg>',
  iron: '<svg viewBox="0 0 16 16"><path d="M2 11l2-5h8l2 5z" fill="#8fa3ad"/><path d="M4 6l1.500-2h5L12 6z" fill="#c7d3d9"/></svg>',
  crowns: '<svg viewBox="0 0 16 16"><circle cx="8" cy="8" r="6" fill="#d9a441" stroke="#7a5a1c"/><path d="M5 10V6.500l1.500 1.500L8 6l1.500 2L11 6.500V10z" fill="#7a5a1c"/></svg>',
  men: '<svg viewBox="0 0 16 16"><circle cx="8" cy="8" r="6" fill="#9e2b25" stroke="#e0a25a"/><circle cx="8" cy="8" r="2" fill="#e0a25a"/></svg>'
};

const UI = { toastT: null };
const M = { R: 30, pad: 34, cx: 0, cy: 0, sel: null, path: null, dirty: true, moving: false, t: 0 };
M.W = Math.sqrt(3) * M.R;
M.center = (c, r) => [M.pad + M.W * (c + 0.5 * (r & 1)) + M.W / 2, M.pad + M.R * 1.5 * r + M.R];
M.size = () => [M.pad * 2 + M.W * (COLS + 0.5), M.pad * 2 + M.R * 1.5 * (ROWS - 1) + M.R * 2];
M.hexPath = function (c, x, y, R) { c.beginPath(); for (let i = 0; i < 6; i++) { const a = Math.PI / 180 * (60 * i - 30); c[i ? "lineTo" : "moveTo"](x + R * Math.cos(a), y + R * Math.sin(a)); } c.closePath(); };

// ---------- music ----------
const MUS = { on: true, ok: false, want: null, cur: null, el: {}, vol: 0.55,
  files: { title: "std_title", map: "std_frost", hold: "rv_ember_1", fight: "std_frost_fight", boss: "std_tremor_boss" } };
try { if (localStorage.getItem("vh_march_music") === "off") MUS.on = false; } catch (e) {}
MUS.get = function (k) { if (!MUS.el[k]) { const a = new Audio("../mus/" + MUS.files[k] + ".mp3"); a.loop = true; a.preload = "none"; a.volume = 0; MUS.el[k] = a; } return MUS.el[k]; };
MUS.play = function (k) {
  MUS.want = k; if (!MUS.on || !MUS.ok || UI.fast) return;
  // only ever one track: stop every other one outright (iPhones ignore volume, so a fade-out never ends there)
  Object.keys(MUS.el).forEach(o => { if (o !== k && !MUS.el[o].paused) MUS.el[o].pause(); });
  const a = MUS.get(k); MUS.cur = k; a.volume = MUS.vol; if (!a.paused) return;
  const pr = a.play(); if (pr && pr.catch) pr.catch(() => {});
};
MUS.stop = function () { Object.keys(MUS.el).forEach(k => MUS.el[k].pause()); MUS.cur = null; };
MUS.set = function (on) { MUS.on = on; try { localStorage.setItem("vh_march_music", on ? "on" : "off"); } catch (e) {} if (on) MUS.play(MUS.want || "map"); else MUS.stop(); };
addEventListener("pointerdown", () => { if (MUS.ok) return; MUS.ok = true; if (MUS.want) MUS.play(MUS.want); }, true);
document.addEventListener("visibilitychange", () => { if (document.hidden) MUS.stop(); else if (MUS.want) MUS.play(MUS.want); });

// ---------- boot ----------
UI.boot = function () {
  let left = ART.length; const done = () => { if (--left <= 0) { $("boot").hidden = true; UI.title(); } };
  ART.forEach(n => { const im = new Image(); im.onload = done; im.onerror = done; im.src = src(n); IMG[n] = im; });
  M.cv = $("map"); M.ctx = M.cv.getContext("2d"); B.cv = $("b-cv"); B.ctx = B.cv.getContext("2d");
  addEventListener("resize", () => { M.resize(); if (B.st && !$("battle").hidden) B.resize(); });
  M.bind(); M.resize();
  B.cv.addEventListener("pointerdown", e => { const r = B.cv.getBoundingClientRect(); B.tap(e.clientX - r.left, e.clientY - r.top); });
  (function loop() { M.t++; if (G.s && $("screen").hidden && $("battle").hidden && (M.dirty || M.moving || M.t % 6 === 0)) M.draw(); requestAnimationFrame(loop); })();
};

// ---------- title and new game ----------
UI.title = function () {
  const sc = $("screen"); MUS.play("title"); sc.className = "title"; sc.style.backgroundImage = "url(" + src("bg_title") + ")"; sc.hidden = false;
  ["hud", "dock", "goal", "travel"].forEach(i => $(i).hidden = true);
  const cont = G.hasSave();
  sc.innerHTML = '<div class="in"><div><h1><span>VOIDHAMMER</span>The Ember March</h1><p class="sub">Hold a hall on the border. Lead a warband. Decide how much of yourself the fire gets.</p></div><div class="btns">' +
    (cont ? '<button class="go" id="t-cont">Continue</button><button id="t-new">New game</button>' : '<button class="go" id="t-new">New game</button>') + '</div></div>';
  if (cont) $("t-cont").onclick = () => { G.load(); UI.enterMap(); };
  $("t-new").onclick = UI.create;
};
UI.create = function () {
  const sc = $("screen"); sc.className = ""; sc.style.backgroundImage = "url(" + src("bg_hold") + ")";
  const nm = D.NAMES[ri(D.NAMES.length)];
  sc.innerHTML = '<div class="bar"><h2>Who holds the March?</h2></div><div class="body"><div class="cols"><div class="col"><p class="lede">You are Emberforged: you throw fire, and it costs you your self-control, a little each time and for good.\n\nThe Hearth Court has given you one hall on the Stonehold border.</p></div><div class="col">' +
    '<div class="pick"><label><input type="radio" name="art" value="hero_f" checked><img src="' + src("hero_f") + '" alt="A woman with ember-cracks up her forearms"></label><label><input type="radio" name="art" value="hero_m"><img src="' + src("hero_m") + '" alt="A bearded man with ember-cracks across his hands"></label></div>' +
    '<div class="field"><span>Your name</span><input id="c-name" maxlength="14" value="' + nm + '" autocomplete="off"></div><div class="field"><span>Your hold</span><input id="c-hold" maxlength="16" value="Marchfire" autocomplete="off"></div>' +
    '<div class="field"><button class="go" id="c-go">Take the hall</button><button class="quiet" id="c-back">Back</button></div></div></div></div>';
  $("c-back").onclick = UI.title;
  $("c-go").onclick = () => { const art = document.querySelector('input[name=art]:checked').value; G.newGame({ name: ($("c-name").value || nm).trim().slice(0, 14) || nm, art, holdName: ($("c-hold").value || "Marchfire").trim().slice(0, 16) || "Marchfire" }); UI.enterMap(); UI.event("open"); };
};
UI.enterMap = function () {
  IMG.hero = IMG[G.s.art]; B.tok = {}; MUS.play("map");
  $("screen").hidden = true; $("battle").hidden = true; $("modal").hidden = true;
  ["hud", "dock", "goal"].forEach(i => $(i).hidden = false);
  M.buildBase(); const p = M.center(G.s.pos[0], G.s.pos[1]); M.cx = p[0]; M.cy = p[1]; M.sel = null; M.path = null; M.clamp(); UI.hud(); M.dirty = true;
  if (G.s.over) UI.ending();
};

// ---------- map ----------
M.resize = function () { const dpr = Math.min(2, devicePixelRatio || 1); M.dpr = dpr; M.vw = innerWidth; M.vh = innerHeight; M.cv.width = Math.round(M.vw * dpr); M.cv.height = Math.round(M.vh * dpr); M.clamp(); M.dirty = true; };
M.clamp = function () { const s = M.size(); M.cx = Math.max(Math.min(M.vw / 2, s[0] / 2), Math.min(Math.max(s[0] - M.vw / 2, s[0] / 2), M.cx)); M.cy = Math.max(Math.min(M.vh / 2 - 30, s[1] / 2), Math.min(Math.max(s[1] - M.vh / 2 + 40, s[1] / 2), M.cy)); };
M.pattern = function (ctx, name) { const im = IMG[name], t = 230, c = document.createElement("canvas"); c.width = c.height = t * 2; const x = c.getContext("2d"); if (im && im.width) { for (let i = 0; i < 4; i++) { x.save(); x.translate(i % 2 ? t * 2 : 0, i > 1 ? t * 2 : 0); x.scale(i % 2 ? -1 : 1, i > 1 ? -1 : 1); x.drawImage(im, 0, 0, t, t); x.restore(); } } else { x.fillStyle = "#2b2523"; x.fillRect(0, 0, t * 2, t * 2); } return ctx.createPattern(c, "repeat"); };
M.buildBase = function () {
  const s = M.size(), sc = 1.5, c = document.createElement("canvas"); c.width = Math.ceil(s[0] * sc); c.height = Math.ceil(s[1] * sc); const x = c.getContext("2d"); x.scale(sc, sc);
  x.fillStyle = "#0d0a08"; x.fillRect(0, 0, s[0], s[1]);
  const pat = {}; Object.keys(D.TERRAIN).forEach(k => { pat[k] = M.pattern(x, D.TERRAIN[k].tex); });
  for (let r = 0; r < ROWS; r++) for (let q = 0; q < COLS; q++) { const p = M.center(q, r), t = G.tile(q, r); M.hexPath(x, p[0], p[1], M.R + 0.6); x.fillStyle = pat[t]; x.fill(); }
  // soften the joins between hexes, and let lava glow onto its neighbours
  for (let r = 0; r < ROWS; r++) for (let q = 0; q < COLS; q++) { const p = M.center(q, r), t = G.tile(q, r); M.hexPath(x, p[0], p[1], M.R); x.strokeStyle = "rgba(10,7,5,.22)"; x.lineWidth = 1.2; x.stroke(); if (t === "lava") { const g = x.createRadialGradient(p[0], p[1], M.R * .4, p[0], p[1], M.R * 1.9); g.addColorStop(0, "rgba(255,122,26,.22)"); g.addColorStop(1, "rgba(255,122,26,0)"); x.fillStyle = g; x.fillRect(p[0] - M.R * 2, p[1] - M.R * 2, M.R * 4, M.R * 4); } }
  const eg = x.createLinearGradient(0, 0, 0, s[1]); eg.addColorStop(0, "rgba(13,10,8,.55)"); eg.addColorStop(.12, "rgba(13,10,8,0)"); eg.addColorStop(.9, "rgba(13,10,8,0)"); eg.addColorStop(1, "rgba(13,10,8,.6)"); x.fillStyle = eg; x.fillRect(0, 0, s[0], s[1]);
  M.base = c; M.greyPat = M.pattern(M.ctx, "t_grey");
};
M.toMap = (px, py) => [px + M.cx - M.vw / 2, py + M.cy - M.vh / 2];
M.pick = function (px, py) { const m = M.toMap(px, py); let best = null, bd = 1e9; for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) { const p = M.center(c, r), d = (p[0] - m[0]) ** 2 + (p[1] - m[1]) ** 2; if (d < bd) { bd = d; best = [c, r]; } } return bd < M.R * M.R * 1.1 ? best : null; };
M.bind = function () {
  let down = null;
  M.cv.addEventListener("pointerdown", e => { down = { x: e.clientX, y: e.clientY, cx: M.cx, cy: M.cy, moved: false }; M.cv.setPointerCapture(e.pointerId); });
  M.cv.addEventListener("pointermove", e => { if (!down) return; const dx = e.clientX - down.x, dy = e.clientY - down.y; if (Math.abs(dx) + Math.abs(dy) > 8) down.moved = true; if (down.moved) { M.cx = down.cx - dx; M.cy = down.cy - dy; M.clamp(); M.dirty = true; } });
  const up = e => { if (!down) return; const d = down; down = null; if (!d.moved && G.s && !M.moving) M.tapHex(M.pick(e.clientX, e.clientY)); };
  M.cv.addEventListener("pointerup", up); M.cv.addEventListener("pointercancel", () => { down = null; });
};
M.tapHex = function (h) {
  const s = G.s; if (!h || s.over) { M.sel = null; M.path = null; UI.travel(); M.dirty = true; return; }
  if (M.sel && M.sel[0] === h[0] && M.sel[1] === h[1] && M.path) { UI.go(); return; }
  if (h[0] === s.pos[0] && h[1] === s.pos[1]) { M.sel = null; M.path = null; UI.travel(); const st = G.siteAt(h[0], h[1]); if (st) UI.arrive(st, true); M.dirty = true; return; }
  M.sel = h; M.path = G.path(s.pos, h); UI.travel(); M.dirty = true;
};
M.draw = function () {
  const c = M.ctx, s = G.s; if (!M.base || !s) return; M.dirty = false;
  c.setTransform(M.dpr, 0, 0, M.dpr, 0, 0); c.fillStyle = "#0d0a08"; c.fillRect(0, 0, M.vw, M.vh);
  const ox = M.vw / 2 - M.cx, oy = M.vh / 2 - M.cy, ms = M.size(); c.drawImage(M.base, ox, oy, ms[0], ms[1]);
  c.save(); c.translate(ox, oy);
  // the grey edge
  if (s.grey.length) { c.fillStyle = M.greyPat; s.grey.forEach(k => { const h = k.split(",").map(Number), p = M.center(h[0], h[1]); M.hexPath(c, p[0], p[1], M.R + 2); c.globalAlpha = .93; c.fill(); }); c.globalAlpha = 1; }
  // firelight
  const glow = (h, rad) => { const p = M.center(h[0], h[1]), R = M.W * (rad + .55), k = .5 + .5 * Math.sin(M.t / 22); const g = c.createRadialGradient(p[0], p[1], 4, p[0], p[1], R); g.addColorStop(0, "rgba(255,150,60," + (.20 + .05 * k) + ")"); g.addColorStop(.75, "rgba(255,122,26,.07)"); g.addColorStop(1, "rgba(255,122,26,0)"); c.fillStyle = g; c.beginPath(); c.arc(p[0], p[1], R, 0, 7); c.fill(); c.strokeStyle = "rgba(255,176,97,.35)"; c.setLineDash([3, 6]); c.lineWidth = 1.2; c.beginPath(); c.arc(p[0], p[1], R - 3, 0, 7); c.stroke(); c.setLineDash([]); };
  if (G.fireRadius()) glow([16, 7], G.fireRadius()); Object.keys(s.beacons).forEach(id => glow(G.site(id).at, 1));
  // route
  if (M.path && M.path.steps.length) { c.strokeStyle = "rgba(255,217,168,.95)"; c.lineWidth = 3; c.lineCap = "round"; c.setLineDash([2, 9]); c.beginPath(); const a = M.center(s.pos[0], s.pos[1]); c.moveTo(a[0], a[1]); M.path.steps.forEach(h => { const p = M.center(h[0], h[1]); c.lineTo(p[0], p[1]); }); c.stroke(); c.setLineDash([]); }
  if (M.sel) { const p = M.center(M.sel[0], M.sel[1]); M.hexPath(c, p[0], p[1], M.R - 2); c.strokeStyle = M.path ? "#ffd9a8" : "#e2553f"; c.lineWidth = 2.5; c.stroke(); }
  // places
  c.textAlign = "center";
  D.SITES.forEach(st => {
    if (st.camp === 3 && G.campsDone() < 2 && !s.flags.seen3) return;
    const p = M.center(st.at[0], st.at[1]), im = IMG[st.art], gone = s.done[st.id] || s.quiet[st.id], z = st.kind === "city" ? 78 : st.kind === "hold" ? 64 : 56;
    c.globalAlpha = gone ? .38 : 1; if (im && im.width) c.drawImage(im, p[0] - z / 2, p[1] - z * .62, z, z); c.globalAlpha = 1;
    const label = G.siteName(st) + (s.done[st.id] ? " (broken)" : "");
    c.font = (st.kind === "city" || st.kind === "hold" ? "700 12.5px" : "700 11px") + " Cinzel, serif"; c.lineWidth = 3.5; c.strokeStyle = "rgba(10,7,5,.92)"; c.strokeText(label, p[0], p[1] + z * .46 + 4); c.fillStyle = st.kind === "camp" || st.kind === "lair" ? "#c7d3d9" : "#f3d2b4"; c.fillText(label, p[0], p[1] + z * .46 + 4);
  });
  // the warband
  const pp = M.pp || M.center(s.pos[0], s.pos[1]), r = 17; c.fillStyle = "rgba(0,0,0,.55)"; c.beginPath(); c.ellipse(pp[0], pp[1] + r, r * .9, r * .3, 0, 0, 7); c.fill();
  c.drawImage(B.token(s.art, 40), pp[0] - r, pp[1] - r - 4, r * 2, r * 2); c.strokeStyle = "#ffb061"; c.lineWidth = 2.5; c.beginPath(); c.arc(pp[0], pp[1] - 4, r, 0, 7); c.stroke();
  c.fillStyle = "#9e2b25"; c.beginPath(); c.moveTo(pp[0] + r - 3, pp[1] - r - 16); c.lineTo(pp[0] + r + 12, pp[1] - r - 11); c.lineTo(pp[0] + r - 3, pp[1] - r - 5); c.closePath(); c.fill(); c.strokeStyle = "#e0a25a"; c.lineWidth = 1.5; c.beginPath(); c.moveTo(pp[0] + r - 3, pp[1] - r - 17); c.lineTo(pp[0] + r - 3, pp[1] - 6); c.stroke();
  c.restore();
};

// ---------- HUD ----------
UI.hud = function () {
  const s = G.s, inc = G.income(), eat = G.eats(), st = G.stage();
  const chip = (k, v, d, low) => '<div class="chip' + (low ? " low" : "") + '">' + ICON[k] + '<span class="num">' + v + '</span>' + (d !== null ? '<small>' + (d >= 0 ? "+" : "") + d + '</small>' : "") + '</div>';
  $("hud").innerHTML = '<div class="chip day"><span class="num">Day ' + s.day + '</span></div>' + chip("food", s.res.food, inc.food - eat, s.res.food < eat * 3) + chip("coal", s.res.coal, inc.coal, s.b.fire && s.res.coal < 4) + chip("iron", s.res.iron, null) + chip("crowns", s.res.crowns, inc.crowns - G.wages(), s.res.crowns < G.wages() * 2) +
    '<div class="sp"></div><div class="chip">' + ICON.men + '<span class="num">' + s.units.length + '/' + G.cap() + '</span></div><div class="chip flame" id="h-ctl"><small>Self-control</small><i><b style="width:' + s.control + '%"></b></i></div>';
  $("h-ctl").onclick = UI.warband;
  const left = 3 - G.campsDone();
  $("goal").innerHTML = UI.goalHtml() + (s.flags.moved ? "" : "<br>Tap a place on the map to travel there") + (s.raided ? "<br>Raiders have hit your hold " + s.raided + (s.raided === 1 ? " time" : " times") + ". A third time and it burns" + (s.b.wall ? "" : ", and there is no palisade") : "");
  const here = G.siteAt(s.pos[0], s.pos[1]);
  $("dock").innerHTML = (here && G.siteLive(here) ? '<button class="go" id="d-here">' + (here.kind === "camp" ? "Attack" : here.kind === "lair" ? "Look closer" : "Enter " + esc(G.siteName(here))) + '</button>' : "") + '<button id="d-jour">Journal</button><button id="d-band">Warband' + (G.pointsWaiting() ? '<i class="dot"></i>' : "") + '</button>' + (here && here.id === "hold" ? "" : '<button id="d-hold">Find hold</button>') + '<button class="quiet" id="d-menu">Menu</button>';
  if ($("d-here")) $("d-here").onclick = () => UI.arrive(here, true);
  $("d-band").onclick = UI.warband; $("d-jour").onclick = UI.journal; $("d-menu").onclick = UI.menu;
  if ($("d-hold")) $("d-hold").onclick = () => { const p = M.center(16, 7); M.cx = p[0]; M.cy = p[1]; M.clamp(); M.tapHex([16, 7]); };
};
UI.travel = function () {
  const el = $("travel"), s = G.s; if (!M.sel) { el.hidden = true; return; }
  const st = G.siteAt(M.sel[0], M.sel[1]), name = st && !(st.camp === 3 && G.campsDone() < 2 && !s.flags.seen3) ? G.siteName(st) : (G.isGrey(M.sel[0], M.sel[1]) ? "The grey edge" : D.TERRAIN[G.tile(M.sel[0], M.sel[1])].name);
  el.hidden = false;
  if (!M.path) { el.innerHTML = '<div><h3>' + esc(name) + '</h3><p>No way across.</p></div>'; return; }
  const food = Math.round(G.eats() * M.path.q / 4);
  el.innerHTML = '<div><h3>' + esc(name) + '</h3><p>' + G.daysText(M.path.q) + (M.path.q >= 4 ? ", eats about " + food + " food" : "") + '</p></div><button class="go" id="tv-go">Travel</button>';
  $("tv-go").onclick = UI.go;
};
UI.toast = function (t, ms) { const el = document.createElement("div"); el.className = "toast"; el.textContent = t; $("toasts").appendChild(el); while ($("toasts").children.length > 3) $("toasts").firstChild.remove(); setTimeout(() => el.remove(), ms || 3200); };
UI.news = function (list) {
  list.forEach(n => {
    if (n.k === "built") UI.toast(D.BUILDINGS[n.id].name + " is finished at " + G.s.holdName + ".");
    if (n.k === "unpaid") UI.toast("The crowns have run out. Hired fighters won't stay long unpaid.");
    if (n.k === "quit") UI.toast(n.who + " left. Nobody had paid them.");
    if (n.k === "dark") UI.toast("The coal has run out. The watchfire at " + G.s.holdName + " has gone dark.", 4500);
    if (n.k === "hungry") UI.toast("The food has run out. People will start leaving.");
    if (n.k === "desert") UI.toast(n.who + " left in the night. Nobody fights hungry for long.");
    if (n.k === "raid") UI.toast("Raiders hit " + G.s.holdName + " while you were away: " + n.food + " food and " + n.coal + " coal gone." + (n.n === 2 ? " Once more and they burn it." : ""), 4500);
    if (n.k === "raidHeld") UI.toast("Raiders came to " + G.s.holdName + " and the palisade turned them away.", 4000);
    if (n.k === "grey") { if (!G.s.flags.greySeen) { G.s.flags.greySeen = 1; UI.queue.push("grey"); } }
  });
};
UI.queue = [];

// ---------- travelling ----------
UI.go = async function () {
  const s = G.s; if (!M.path || M.moving || s.over) return;
  const steps = M.path.steps.slice(); M.moving = true; s.bounty = null; s.flags.moved = 1; M.sel = null; M.path = null; $("travel").hidden = true; $("dock").hidden = true;
  let stop = null;
  for (const h of steps) {
    const a = M.center(s.pos[0], s.pos[1]), b = M.center(h[0], h[1]), cost = G.stepCost(h[0], h[1]), dur = UI.fast ? 0 : 150 + cost * 40, t0 = performance.now();
    await new Promise(res => { const step = () => { const k = dur ? Math.min(1, (performance.now() - t0) / dur) : 1; M.pp = [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k]; M.cx += (M.pp[0] - M.cx) * .12; M.cy += (M.pp[1] - M.cy) * .12; M.clamp(); if (k < 1) requestAnimationFrame(step); else res(); }; step(); });
    s.pos = h; M.pp = null;
    for (let i = 0; i < cost; i++) UI.news(G.tick());
    UI.hud(); $("dock").hidden = true;
    if (s.over) break;
    if (G.isGrey(h[0], h[1]) && !s.flags.greyWalk) { s.flags.greyWalk = 1; s.flags.greySeen = 1; stop = "grey"; break; }
    if (UI.queue.length) { stop = UI.queue.shift(); break; }
    const st = G.siteAt(h[0], h[1]); if (st && h !== steps[steps.length - 1] && st.kind === "camp" && G.siteLive(st)) { stop = "site"; break; }
    // trouble on the road
    if (h !== steps[steps.length - 1] && !st && G.campsDone() < 3 && hexDist(h, [16, 7]) > 2) {
      const t = G.tile(h[0], h[1]), p = (t === "wood" || t === "hills") ? .07 : .03;
      if (G.rnd() < p) { if (!s.flags.toll && s.day > 4) { s.flags.toll = 1; stop = "toll"; } else if (!s.flags.carters && s.grey.length) { s.flags.carters = 1; stop = "carters"; } else stop = "ambush"; break; }
    }
  }
  M.moving = false; $("dock").hidden = false; M.dirty = true; G.save(); UI.hud();
  if (s.over) return UI.ending();
  const gone = G.leaving(); if (gone.length) { await UI.farewell(gone); }
  UI.storyPush(); if (!stop && UI.queue.length) stop = UI.queue.shift();
  if (stop === "ambush") return UI.fightIntro("patrol", "Raiders on the road", "They were waiting in the " + (G.tile(s.pos[0], s.pos[1]) === "wood" ? "charwood" : "rocks") + ".");
  if (stop && stop !== "site") return UI.event(stop);
  const st = G.siteAt(s.pos[0], s.pos[1]); if (st) UI.arrive(st, false);
};
UI.farewell = function (ids) { return new Promise(res => { const id = ids[0], c = D.COMPANIONS[id]; UI.modal({ art: id, title: c.name + " leaves", text: c.leave, opts: [{ t: "Let them go", fn: () => { UI.hud(); if (ids.length > 1) UI.farewell(ids.slice(1)).then(res); else res(); } }] }); }); };

// ---------- arriving ----------
UI.arrive = function (st, asked) {
  const s = G.s; if (!G.siteLive(st)) { if (asked) UI.toast("Nothing left here but ash and tent pegs."); return; }
  if (st.kind === "camp") { if (st.camp === 3) { s.flags.seen3 = 1; if (!s.flags.offer) { s.flags.offer = 1; return UI.event("offer"); } } return UI.fightIntro(st.id, G.siteName(st), st.camp === 3 ? "He has more men than you were told." : "Tents, a stake fence, and too many cookfires for honest travellers."); }
  if (st.kind === "lair") return UI.event("lair");
  if (st.id === "ashford" && !s.comp.tavish && !s.visited.ashford) { s.visited.ashford = 1; UI.storyPush(); return UI.event("tavish"); }
  if (st.id === "bellows" && !s.comp.dilys) { s.visited.bellows = 1; return UI.event("dilys"); }
  s.visited[st.id] = 1;
  const beat = G.storyArrive(st); UI.storyPush(); if (beat) UI.queue.unshift(beat);
  if (UI.queue.length) { UI.hud(); return UI.event(UI.queue.shift()); }
  if (st.id === "hold") { if (!s.flags.hintHold) { s.flags.hintHold = 1; UI.toast(D.HINTS.hold, 5500); } return UI.hold(); }
  UI.site(st);
};

// ---------- modal and events ----------
UI.modal = function (o) {
  const m = $("modal"); m.hidden = false; const im = o.art === "hero" ? G.s.art : o.art;
  const artCss = o.art ? '<div class="art' + (/^(s_|bd_)/.test(im) ? " icon" : "") + '" style="background-image:url(' + src(im) + ')"></div>' : "";
  m.innerHTML = '<div class="card' + (o.art ? "" : " plain") + '">' + artCss + '<div class="txt"><h2>' + esc(o.title) + '</h2><p class="lede">' + esc(o.text) + '</p>' + (o.html || "") + '<div class="opts">' +
    o.opts.map((b, i) => '<button data-i="' + i + '"' + (b.off ? " disabled" : "") + (i === 0 && !b.off ? ' class="go"' : "") + '>' + esc(b.t) + (b.why ? "<small>" + esc(b.why) + "</small>" : "") + '</button>').join("") + '</div></div></div>';
  m.querySelectorAll("button").forEach(btn => { btn.onclick = () => { const b = o.opts[+btn.dataset.i]; m.hidden = true; if (b.fn) b.fn(); }; });
};
UI.event = function (id) {
  const ev = typeof id === "string" ? D.EVENTS[id] : id, s = G.s;
  const opts = ev.opts.map(o => {
    const b = { t: o.t };
    if (o.yield && G.yieldLocked()) { b.off = true; b.why = "You can't make yourself back down."; }
    else if (o.need && !G.can(o.need)) { b.off = true; b.why = "You are " + G.short(o.need).join(" and ") + " short."; }
    b.fn = () => {
      if (o.fx) o.fx(s);
      G.save(); UI.hud(); M.dirty = true;
      const next = () => { if (o.fight) UI.startFight(o.fight === "camp3" ? "camp3" : o.fight); else { const gone = G.leaving(); const more = () => { if (UI.queue.length) UI.event(UI.queue.shift()); }; if (gone.length) UI.farewell(gone).then(more); else more(); } };
      if (o.say) UI.modal({ art: ev.art, title: ev.title, text: o.say, opts: [{ t: "Go on", fn: next }] }); else next();
    };
    return b;
  });
  UI.modal({ art: ev.art, title: ev.title, text: ev.text(s), opts });
};
UI.stageNote = function (id) { const st = D.STAGES.find(x => x.id === id); UI.toast(st.name + ". " + st.line, 5000); if (id === "debt") UI.queue.push("debt"); };

// ---------- fights ----------
UI.fightIntro = function (kind, title, line) {
  const foes = G.foeList(kind.indexOf("camp") === 0 ? kind : kind), ready = G.ready().length, n = {};
  foes.forEach(f => { n[D.UNITS[f].name] = (n[D.UNITS[f].name] || 0) + 1; });
  const html = '<p class="lede"><em>' + Object.keys(n).map(k => n[k] + " × " + k).join(", ") + ". You can field " + Math.min(8, ready) + ".</em></p>";
  const lock = G.yieldLocked();
  UI.modal({ art: kind === "patrol" ? "r_axe" : "s_camp", title, text: line, html, opts: [{ t: "Fight", fn: () => UI.startFight(kind) }, kind === "patrol" ? { t: "Give ground and go round", off: lock, why: lock ? "You can't make yourself back down." : "", fn: () => { G.approve("tavish", -1); UI.toast("You go the long way. Tavish says nothing, loudly."); UI.hud(); } } : { t: "Not yet", fn: () => {} }] });
};
UI.startFight = function (kind) {
  const key = kind.indexOf("camp") === 0 || kind === "patrol" ? kind : kind;
  ["hud", "dock", "goal", "travel"].forEach(i => $(i).hidden = true); $("battle").hidden = false; $("toasts").innerHTML = "";
  MUS.play(/^lair/.test(kind) || kind === "camp3" ? "boss" : "fight");
  B.start(key, res => UI.afterFight(kind, res));
};
UI.battlePanel = function () {
  const st = B.st, el = $("b-side"); if (!st) return; const u = st.sel, s = G.s, stage = G.stage();
  let h = "";
  if (u) {
    const d = D.UNITS[u.type]; h += '<div class="who"><img src="' + src(u.art) + '" alt=""><div><h3>' + esc(u.name) + '</h3><p>' + (u.lv ? "Level " + u.lv + ". " : "") + u.hp + ' of ' + u.max + ' health</p></div></div><p>Hits for ' + (d.atk + (u.ab || 0)) + '–' + (d.atk + (u.ab || 0) + 2) + (d.rng > 1 ? ", reach " + d.rng : "") + (d.guard ? ". Shields whoever stands beside them" : "") + '.</p>';
    if (u.type === "hero" && !u.acted) {
      h += Object.keys(D.SPELLS).map(k => '<button class="sp' + (st.mode === k ? " on" : "") + '" data-sp="' + k + '">' + D.SPELLS[k].name + '<span>−' + B.spCost(k) + '</span></button>').join("");
      h += '<p>' + (st.mode ? D.SPELLS[st.mode].text : "Fire costs self-control. Some of it never comes back.") + '</p>';
    }
  } else h += '<p class="sec">' + (st.turn === "player" ? "Your turn" : "Their turn") + '</p><p>Tap one of yours. Gold cells are where they can go. A red ring is who they can hit.</p>';
  h += '<div class="stat"><span>Heat</span><div class="heat">' + Array.from({ length: 10 }, (_, i) => '<i class="' + (i < st.heat ? "on" : "") + '"></i>').join("") + '</div><span>' + stage.name + '</span><div class="mini"><b style="width:' + s.control + '%"></b></div></div>';
  h += '<div class="end"><button class="go" id="b-end"' + (st.turn !== "player" ? " disabled" : "") + '>End turn</button><button class="quiet" id="b-flee">Fall back</button></div>';
  el.innerHTML = h;
  el.querySelectorAll("[data-sp]").forEach(b => b.onclick = () => B.setMode(b.dataset.sp));
  $("b-end").onclick = () => B.endTurn(); $("b-flee").onclick = () => B.fallBack();
};
UI.afterFight = function (kind, res) {
  const s = G.s, site = G.siteAt(s.pos[0], s.pos[1]);
  if (res.won && site && (site.kind === "camp" || site.kind === "lair") && kind !== "patrol") s.done[site.id] = 1;
  const out = G.afterBattle(kind, res); let bountyPay = 0; if (s.bounty) { if (res.won) { bountyPay = s.bounty.pay; G.gain({ crowns: bountyPay }); s.board[s.bounty.site] = null; } s.bounty = null; } G.save();
  MUS.play("map");
  $("battle").hidden = true; ["hud", "dock", "goal"].forEach(i => $(i).hidden = false); UI.hud(); M.dirty = true;
  if (s.over === "dead") return UI.ending();
  let text, html = "";
  if (res.won) { text = kind === "camp3" ? "The Coin-Captain's men scatter. In his tent there is a strongbox of silver with no face on it, and nothing to say who sent it." : kind === "lair" ? "The serpent cools where it fell, and cracks. There is more iron under it than you can carry in one trip." : kind === "patrol" ? "The road is yours again." : "The camp burns. That's one less.";
    const l = out.loot; html = '<div class="loot">' + Object.keys(l).filter(k => k !== "favour").map(k => "<span>+" + l[k] + " " + k + "</span>").join("") + (l.favour ? "<span>The Hearth Court hears of it</span>" : "") + "</div>";
  } else if (res.fled) text = "You pull them back in good order. It costs you nothing but the ground.";
  else text = "You go down. When you come round you are in your own hall, on a door somebody carried you home on, and a third of the crowns are gone." + (s.heroWounded ? "\n\nYou won't survive that twice before it heals." : "");
  if (out.levelled && out.levelled.length) html += '<p class="lede"><em>Up a level: ' + esc(out.levelled.join(", ")) + '.</em></p>';
  if (out.fallen && out.fallen.length) html += '<p class="lede"><em>Down: ' + esc(out.fallen.join(", ")) + '. A night at your own hearth or a town healer will get them up.</em></p>';
  if (bountyPay) html += '<p class="lede"><em>The town pays the bounty: +' + bountyPay + ' crowns.</em></p>';
  UI.storyPush();
  if (out.lost.length) html += '<p class="lede"><em>Lost: ' + esc(out.lost.join(", ")) + '.</em></p>';
  if (out.hurt.length) html += '<p class="lede"><em>Hurt and out of the next fights: ' + esc(out.hurt.join(", ")) + '.</em></p>';
  if (out.burnt && out.burnt.length) html += '<p class="lede"><em>Burnt out: ' + esc(out.burnt.join(", ")) + '. Every fight burns a few.</em></p>';
  if (!res.won && res.heroDown) { const p = M.center(16, 7); M.cx = p[0]; M.cy = p[1]; M.clamp(); }
  UI.modal({ art: res.won ? "bg_camp" : null, title: res.won ? "Won" : res.fled ? "Fell back" : "Beaten", text, html, opts: [{ t: "Go on", fn: () => { if (s.over) return UI.ending(); const gone = G.leaving(); const nx = () => { if (UI.queue.length) UI.event(UI.queue.shift()); }; if (gone.length) UI.farewell(gone).then(nx); else nx(); } }] });
};

// what you have, shown on every screen where anything can be bought
UI.costText = c => RES.filter(k => c && c[k] > 0).map(k => c[k] + " " + k).join(", ") || "Free";
UI.purse = function () {
  const r = G.s.res, n = G.net(), d = v => '<small>' + (v >= 0 ? "+" : "") + v + '</small>';
  return '<div class="purse">' + RES.map(k => '<span' + (r[k] <= 0 ? ' class="out"' : "") + '>' + ICON[k] + '<b>' + r[k] + '</b>' + (k in n ? d(n[k]) : "") + '</span>').join("") + '</div>';
};
UI.ledger = function () {
  const s = G.s, b = s.b, line = (t, v) => '<div class="lg"><span>' + t + '</span><b>' + (v >= 0 ? "+" : "") + v + '</b></div>', n = G.net();
  const html = '<div class="lgs"><div><p class="sec">Food</p>' + line("Emberseed plot", b.field * 3) + line(s.units.length + " mouths", -G.eats()) + line("Each day", n.food) +
    '</div><div><p class="sec">Coal</p>' + (b.coal ? line("Coal pit", b.coal * 2) : line("No coal pit", 0)) + (b.fire ? line("Watchfire", -b.fire) : "") + line("Each day", n.coal) +
    '</div><div><p class="sec">Crowns</p>' + line("Hearth-dues", b.hall * 2) + (b.store ? line("Storehouse", b.store * 3) : "") + line("Wages, " + G.hired() + " hired", -G.wages()) + line("Each day", n.crowns) +
    '</div></div><p class="lede"><em>Every two hired fighters cost a crown a day; companions take no pay. Iron only comes from trade and from what you take. Coal sells in the forge-towns.</em></p>';
  UI.modal({ title: "What comes in and goes out", text: "A day at " + s.holdName + ".", html, opts: [{ t: "Right", fn: () => {} }] });
};

// ---------- places ----------
UI.screen = function (bg, bar, body, foot) { $("toasts").innerHTML = ""; const sc = $("screen"); sc.className = ""; sc.style.backgroundImage = "url(" + src(bg) + ")"; sc.hidden = false; sc.innerHTML = '<div class="bar">' + bar + '<div class="sp"></div>' + UI.purse() + '<button id="s-x">Back to the map</button></div><div class="body">' + body + '</div>' + (foot ? '<div class="foot">' + foot + '</div>' : ""); $("s-x").onclick = UI.closeScreen; };
UI.closeScreen = function () { MUS.play("map"); $("screen").hidden = true; UI.storyPush(); UI.hud(); M.dirty = true; G.save(); if (G.s.over) return UI.ending(); if (UI.queue.length) UI.event(UI.queue.shift()); };
UI.passDay = function (after) { for (let i = 0; i < 4; i++) UI.news(G.tick()); const gone = G.leaving(); if (gone.length) { $("screen").hidden = true; UI.hud(); return UI.farewell(gone); } if (G.s.over) { $("screen").hidden = true; return UI.ending(); } after(); };
UI.recruitRows = function (id) {
  const s = G.s, list = (D.RECRUIT[id] || []).filter(t => !(id === "hold" && !s.b.long)); if (!list.length) return "";
  return '<p class="sec">Hire</p><div class="rows">' + list.map(t => { const d = D.UNITS[t], full = s.units.length >= G.cap(), poor = !G.can({ crowns: d.cost }), court = t === "adept" && s.favour < 1;
    return '<div class="row"><img src="' + src(d.art) + '" alt=""><div class="t"><h3>' + d.name + '</h3><p>' + (court ? "The Court only lends these to people it has heard of." : full ? "No room. Build the longhouse." : poor ? "You are " + G.short({ crowns: d.cost }).join("") + " short." : d.hp + " health, hits for " + d.atk + (d.rng > 1 ? ", throws " + d.rng : "")) + '</p></div><button data-hire="' + t + '"' + (full || poor || court ? " disabled" : "") + '>' + d.cost + ' crowns</button></div>'; }).join("") + '</div>';
};
UI.wire = function (redo, where) {
  const s = G.s, sc = $("screen");
  sc.querySelectorAll("[data-hire]").forEach(b => b.onclick = () => { const t = b.dataset.hire; if (s.units.length >= G.cap() || !G.pay({ crowns: D.UNITS[t].cost })) return redo(); const u = G.addUnit(t); UI.toast(G.uName(u) + " joins the warband."); redo(); });
  sc.querySelectorAll("[data-trade]").forEach(b => b.onclick = () => { const tr = D.TRADE[where][+b.dataset.trade]; if (G.pay(tr.pay)) G.gain(tr.get); redo(); });
  sc.querySelectorAll("[data-up]").forEach(b => b.onclick = () => { const u = s.units.find(x => x.id === +b.dataset.up); if (!G.promote(u)) return redo(); UI.toast(G.uName(u) + " is now " + D.UNITS[u.type].name + "."); redo(); });
};
UI.promoRows = function (where) {
  const s = G.s, rows = s.units.map(u => ({ u, p: G.canPromote(u, where) })).filter(x => x.p && x.p.okXp);
  if (!rows.length) return "";
  return '<p class="sec">Promote</p><div class="rows">' + rows.map(x => '<div class="row"><img src="' + src(G.uArt(x.u)) + '" alt=""><div class="t"><h3>' + esc(G.uName(x.u)) + '</h3><p>' + (!x.p.okForge ? "Needs a better forge than this" : x.p.okIron ? "To " + D.UNITS[x.p.to].name : "You are " + G.short({ iron: x.p.rule.iron, coal: x.p.rule.coal }).join(" and ") + " short.") + '</p></div><button data-up="' + x.u.id + '"' + (x.p.okForge && x.p.okIron ? "" : " disabled") + '>' + x.p.rule.iron + ' iron, ' + x.p.rule.coal + ' coal</button></div>').join("") + '</div>';
};
UI.site = function (st) {
  const s = G.s, redo = () => UI.site(st), tr = D.TRADE[st.id] || [];
  const left = '<img class="place" src="' + src(st.art) + '" alt=""><p class="lede">' + esc(D.SITE_LINE[st.id] || "") + '</p>' + (st.id === "hearthmount" && s.favour ? '<p class="lede"><em>The Hearth Court knows your name' + (s.favour > 2 ? " well" : "") + '.</em></p>' : "");
  let right = "";
  if (tr.length) right += '<p class="sec">Trade</p><div class="rows">' + tr.map((t, i) => '<div class="row"><div class="t"><h3>' + t.t + '</h3><p>' + (G.can(t.pay) ? (t.pay.crowns ? "Costs " + t.pay.crowns + " crowns" : "They pay " + t.get.crowns + " crowns") : (t.pay.crowns ? "You are " + G.short(t.pay).join("") + " short." : "You only have " + s.res[Object.keys(t.pay)[0]] + " " + Object.keys(t.pay)[0] + ".")) + '</p></div><button data-trade="' + i + '"' + (G.can(t.pay) ? "" : " disabled") + '>' + (t.pay.crowns ? "Buy" : "Sell") + '</button></div>').join("") + '</div>';
  right = UI.questRows(st.id) + UI.healRows(st.id) + right + UI.recruitRows(st.id) + UI.promoRows(st.id);
  const canBeacon = !s.beacons[st.id] && st.kind !== "caves";
  const foot = '<p>' + (s.beacons[st.id] ? "Your beacon burns here. The grey won't cross it." : "") + '</p>' + (canBeacon ? '<button id="s-beacon"' + (G.can({ coal: 10 }) ? "" : " disabled") + '>Light a beacon, 10 coal</button>' : "") + '<button id="s-rest">Rest a day</button>';
  UI.screen(st.id === "hearthmount" ? "bg_title" : "bg_camp", '<h2>' + esc(G.siteName(st)) + '</h2>', '<div class="cols"><div class="col">' + left + '</div><div class="col">' + (right || '<p class="lede"><em>Nothing to buy and nobody to hire.</em></p>') + '</div></div>', foot);
  UI.wire(redo, st.id); UI.wireWork(redo);
  if ($("s-beacon")) $("s-beacon").onclick = () => { if (!G.pay({ coal: 10 })) return redo(); s.beacons[st.id] = 1; UI.toast("The beacon catches. " + G.siteName(st) + " will hold."); redo(); };
  $("s-rest").onclick = () => UI.passDay(() => { s.units.forEach(u => { if (!u.down) u.hp = G.maxHp(u); }); UI.toast("A day's rest. Wounds are dressed. Your self-control only comes back at your own hearth."); redo(); });
};
UI.hold = function () {
  MUS.play("hold"); const s = G.s, inc = G.income(), redo = UI.hold;
  const cards = Object.keys(D.BUILDINGS).map(id => { const b = D.BUILDINGS[id], l = s.b[id], busy = s.build && s.build.id === id;
    return '<div class="bld' + (l ? "" : " none") + (busy ? " busy" : "") + '" data-b="' + id + '"><img src="' + src(b.art) + '" alt=""><h3>' + b.name + '</h3><div class="pips">' + Array.from({ length: b.max }, (_, i) => '<i class="' + (i < l ? "on" : "") + '"></i>').join("") + '</div><p>' + (busy ? "Building, " + s.build.left + (s.build.left === 1 ? " day" : " days") + " left" : b.eff(l)) + '</p></div>'; }).join("");
  const side = UI.questRows("hold") + UI.recruitRows("hold") + UI.promoRows("hold"), nf = G.fallen().length;
  UI.screen("bg_hold", '<h2>' + esc(s.holdName) + '</h2><button class="quiet" id="h-led">Ledger</button>',
    '<div class="grid">' + cards + '</div>' + side, '<p>' + (s.build ? D.BUILDINGS[s.build.id].name + " is going up." : (nf ? nf + (nf === 1 ? " fighter is down. " : " fighters are down. ") + "A night at your hearth gets one back up." : "Tap a building to raise it.")) + '</p><button id="h-drill"' + (G.canDrill() ? "" : " disabled") + '>Drill a day</button><button id="h-rest" class="go">Rest a night at your hearth</button>');
  UI.wire(redo, "hold"); UI.wireWork(redo); $("h-led").onclick = UI.ledger;
  $("h-drill").onclick = () => UI.passDay(() => { const up = G.drill(); UI.toast(up.length ? "A day at drill. Up a level: " + up.join(", ") + "." : "A day at drill. They are sharper for it."); redo(); });
  $("screen").querySelectorAll("[data-b]").forEach(el => el.onclick = () => UI.building(el.dataset.b));
  $("h-rest").onclick = () => UI.passDay(() => { const g = G.rest(); const st = G.stage(); UI.toast(g > 0 ? "You sleep at your own hearth. Self-control back to " + s.control + (s.control < 100 ? ". That's as high as it goes now." : ".") : "You sleep at your own hearth. " + (st.id === "toll" ? "Nothing to mend." : "It doesn't come back any further than this.")); if (s.lastUp) UI.toast(s.lastUp + " is back on their feet."); redo(); });
};
UI.building = function (id) {
  const s = G.s, b = D.BUILDINGS[id], l = s.b[id], next = l + 1, cost = next <= b.max ? D.BUILD_COST(next, id) : null;
  let why = "", off = false;
  if (!cost) { off = true; why = "As good as it gets."; }
  else if (s.build) { off = true; why = "The builders are busy with the " + D.BUILDINGS[s.build.id].name.toLowerCase() + "."; }
  else if (id !== "hall" && next > s.b.hall) { off = true; why = "Raise the hearth hall first."; }
  else if (!G.can(cost)) { off = true; why = "You are " + G.short(cost).join(" and ") + " short."; }
  const warn = id === "fire" && cost && !s.b.coal ? "\n\nYou have no coal pit. Without one this fire burns through what you carry and goes out." : "";
  UI.modal({ art: b.art, title: b.name, text: b.what + "\n\nNow: " + b.eff(l) + "." + (cost ? "\nNext: " + b.eff(next) + "." : "") + warn, html: UI.purse(),
    opts: [{ t: cost ? "Build: " + UI.costText(cost) + ", " + cost.days + " days" : "Finished", off, why, fn: () => { if (!cost || s.build || !G.pay(cost)) return UI.hold(); s.build = { id, left: cost.days }; UI.hold(); } }, { t: "Close", fn: () => {} }] });
};
UI.warband = function () {
  const s = G.s, st = G.stage(), mood = ap => ap >= 2 ? "Glad to be here" : ap >= -1 ? "Steady" : ap >= -3 ? "Uneasy" : "About to leave";
  const cards = s.units.map(u => { const d = D.UNITS[u.type], c = D.COMPANIONS[u.type], hurt = u.wounded > 0 || (u.type === "hero" && s.heroWounded > 0), lv = G.lvl(u), nx = G.toNext(u), lvt = "Level " + lv + (nx ? ", " + nx + " to next" : ", top"); let sub;
    if (u.type === "hero") sub = "Emberforged" + (s.heroWounded ? ". Hurt: another beating in the next " + s.heroWounded + " days will kill you" : "");
    else if (c) sub = c.role + ". " + mood(s.comp[u.type].ap) + ". " + c.wants;
    else { const p = G.canPromote(u, "x"); sub = d.name + (p ? ". " + (p.okXp ? "Ready to promote at a forge" : "Promotes after " + (p.rule.xp - u.xp) + " more experience") : ". Top rank"); }
    return '<div class="unit' + (hurt ? " hurt" : "") + (G.skillPts(u) > 0 ? " pts" : "") + '" data-u="' + u.id + '"><img src="' + src(G.uArt(u)) + '" alt=""><div><h3>' + esc(G.uName(u)) + '</h3><div class="hpb"><b style="width:' + Math.round(u.hp / G.maxHp(u) * 100) + '%"></b></div><p><b class="lv">' + lvt + '</b><br>' + esc(sub) + (G.skillPts(u) > 0 ? ". Tap to teach a skill" : "") + (u.down ? ". Down: needs your hearth or a healer" : u.wounded > 0 ? ". Out for " + u.wounded + (u.wounded === 1 ? " day" : " days") : "") + '</p></div></div>'; }).join("");
  UI.screen("bg_camp", '<h2>Warband</h2><p>' + s.units.length + " of " + G.cap() + ". Eats " + G.eats() + " food a day. Eight can take the field. Tap a fighter to see them and teach skills.</p>",
    '<div class="ctl"><h3>Self-control: ' + st.name + '</h3><div class="meter"><b style="width:' + s.control + '%"></b><u style="width:' + (100 - s.ceiling) + '%"></u></div><p>' + st.line + (s.ceiling < 100 ? " The hatched part is gone for good." : " Every spell spends it. Spend deep enough and some never comes back.") + (st.surge ? " In a fight there is a " + Math.round(st.surge * 100) + "% chance each turn that the fire moves you instead." : "") + '</p></div><div class="band">' + cards + '</div>');
  $("screen").querySelectorAll("[data-u]").forEach(el => el.onclick = () => UI.soldier(+el.dataset.u));
};
UI.menu = function () { UI.modal({ title: "The Ember March", text: "Day " + G.s.day + ". The game saves itself as you go.", opts: [{ t: "Keep playing", fn: () => {} }, { t: MUS.on ? "Turn the music off" : "Turn the music on", fn: () => MUS.set(!MUS.on) }, { t: "How to play", fn: () => UI.modal({ title: "How to play", text: "Tap the map to travel. Time only passes when you move, rest or build.\n\nFollow the chapters in your Journal, and take on work in the towns. Break the three raider camps. Keep the hold fed, and keep a watchfire lit: the grey edge will not cross firelight.\n\nCrowns come from hearth-dues, the storehouse, trade and what you take. Hired fighters draw wages every day and leave if you can't pay. Coal feeds the watchfire and the forge. You can't buy what you can't pay for.\n\nFighters gain levels from fights they win, drill at your hold and hauling jobs. Every level after the first gives a skill point: open the Warband and tap a fighter to teach them. Each town has a notice board with fresh work. One who loses all their health goes down: a night at your own hearth gets one back up, or a town healer will for crowns.\n\nYour spells win fights and cost self-control. Rest at your own hearth to get it back, up to whatever is left.", opts: [{ t: "Right", fn: () => {} }] }) }, { t: "Quit to the title", fn: () => { G.save(); UI.title(); } }] }); };
UI.ending = function () {
  const s = G.s, o = s.over; G.save();
  const t = { won: ["The March holds", "Three camps broken. The road to Hearthward is open and the carters are using it.\n\nThe silver had no face on it. Somebody is still paying, and you still don't know who.\n\n" + (s.ceiling < 100 ? "You held the March. You are not quite the person the Court sent out here: " + (100 - s.ceiling) + " parts in a hundred of your self-control are gone and will not grow back." : "You held the March and kept yourself whole doing it. Nobody at the Court expected both.")],
    raided: ["The hold burns", "Raiders came to " + s.holdName + " a third time, and nothing stood in their way. They took the last of the stores and fired the hall behind them.\n\nA palisade, built up before you rode out, would have turned them back."],
    dead: ["You fall", "You were already hurt, and you went back in. They burn you where you fell on the March, and someone carries a coal home to your hall."] }[o];
  UI.modal({ art: o === "won" ? "bg_title" : "bg_camp", title: t[0], text: t[1] + "\n\nDay " + s.day + ". Camps broken: " + G.campsDone() + " of 3.", opts: [{ t: "Play again", fn: () => { G.wipe(); UI.title(); } }] });
};
addEventListener("DOMContentLoaded", UI.boot);
