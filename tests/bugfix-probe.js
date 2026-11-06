// Regression probe for two bugs John found on his phone (Nov 2026):
//   1. chests in the Writs (and elsewhere) could be opened again and again, and paid out every time;
//   2. a Writ's boss could be hit to nothing and never died, so the Writ could never be honoured.
// Every Writ on every board this week is entered through the board's own Go button path (writGo). In each one, every
// chest is opened twice (one reward, then "Empty"), and the boss is struck down through the game's damage path: it
// must die, honour the Writ once, pay once, and stay honoured. Then every other area with chests (story areas, quest
// zones, every settlement), dungeon re-entry, a lair, the Deep and the Hollow's strongbox, and a save and reload.
// Serve the repo root (python3 -m http.server 8765), then: node tests/bugfix-probe.js
// Env: URL (default http://localhost:8765/index.html), PW (path to playwright), LIMIT (only the first N writs and areas, for a quick run).
const { chromium } = require(process.env.PW || "playwright");
const URL = process.env.URL || "http://localhost:8765/index.html";
const LIMIT = +process.env.LIMIT || 0;
let fails = 0;
const ok = (c, m) => { console.log((c ? "PASS " : "FAIL ") + m); if (!c) fails++; };

// runs in the page: open every chest in the current area twice; returns what each opening paid
const CHESTS = () => {
  const A = __vh.AR(), c = __vh.cp(), S = __vh.S(), out = [];
  const snap = () => ({ cr: S.crowns, it: A.items.length + (c.items || []).length, sh: S.loot.shards || 0, ar: c.arrows || 0, br: c.bread || 0 });
  const same = (a, b) => a.cr === b.cr && a.it === b.it && a.sh === b.sh && a.ar === b.ar && a.br === b.br;
  const pick = () => { const b = document.querySelector("#adlg [data-act=adc]"); if (b) b.click(); };
  A.npcs.filter((n) => /^chest\d+$/.test(n.id)).forEach((n) => {
    const r = { id: n.id, ok: true, why: "" };
    const d0 = n.d(); if (d0 === "chest_empty") { r.ok = false; r.why = "already empty before opening"; out.push(r); return; }
    const s0 = snap(); __vh.talk(n.id); const dl = __vh.dlg(); pick(); const s1 = snap();
    if (!/^chestloot:/.test(dl || "")) { r.ok = false; r.why = "first open showed " + dl; }
    else if (s1.cr <= s0.cr) { r.ok = false; r.why = "first open paid nothing"; }
    if (n.d() !== "chest_empty") { r.ok = false; r.why += " / not marked opened (" + n.d() + ")"; }
    __vh.talk(n.id); const dl2 = __vh.dlg(), tx = (document.querySelector("#adlg .tx") || {}).textContent || ""; pick(); const s2 = snap();
    if (dl2 !== "chest_empty" || !/^Empty/.test(tx)) { r.ok = false; r.why += " / second open showed " + dl2 + " '" + tx.slice(0, 30) + "'"; }
    if (!same(s1, s2)) { r.ok = false; r.why += " / second open paid again (" + JSON.stringify(s1) + " -> " + JSON.stringify(s2) + ")"; }
    // a stale chestloot id (a double tap, a slow screen) must not pay either
    const key = /^chestloot:(.*)$/.exec(dl || ""); if (key) { __vh.talk(n.id); const s3 = snap(); if (!same(s2, s3)) { r.ok = false; r.why += " / third open paid"; } pick(); }
    out.push(r);
  });
  return out;
};
// runs in the page: strike every boss down (non-yielding ones) with blows a tenth of its health; report each one
const BOSSES = () => {
  const A = __vh.AR(), out = [];
  A.en.filter((e) => e.d && e.d.boss && !e.dead && !e.gone && !e.d.yieldAt).forEach((e) => {
    const r = { type: e.type, name: e.d.name || e.type, hp: e.hp, hpm: e.hpm, finite: Number.isFinite(e.hp) && e.hp > 0, blows: 0 };
    const blow = e.hpm / 10;
    for (let i = 0; i < 60 && !e.dead; i++) { __vh.hit(e, Number.isFinite(blow) && blow > 0 ? blow : 1); r.blows++; }
    r.dead = e.dead; r.hp1 = e.hp;
    const k0 = __vh.cp().kills, c0 = __vh.S().crowns; r.again = __vh.hit(e, 5); r.paidAgain = __vh.S().crowns !== c0 || __vh.cp().kills !== k0;
    out.push(r);
  });
  return out;
};

(async () => {
  const errs = [];
  let b = null, ctx = null, p = null, tag = "";
  // with WebGL switched off (the fast run) three.js reports that it has no context; that is the switch, not a bug
  const hook = (pg) => { pg.on("pageerror", (e) => errs.push(tag + "pageerror: " + e.message)); pg.on("console", (m) => { if (m.type() === "error" && !(tag === "" && /WebGL/.test(m.text()))) errs.push(tag + "console: " + m.text()); }); };
  const js = (f, a) => p.evaluate(f, a);
  const wait = (ms) => p.waitForTimeout(ms);
  const until = async (f, ms, step) => { const t = Date.now(); while (Date.now() - t < ms) { if (await js(f)) return true; await wait(step || 300); } return false; };
  const leave = async () => { await js(() => { if (__vh.AR()) __vh.leave(); }); };
  // a new game on a phone held sideways; no3d turns WebGL off so the game runs its 2D view (the same simulation, many times faster)
  const boot = async (no3d) => {
    tag = no3d ? "" : "(3D) ";
    b = await chromium.launch(no3d ? { args: ["--disable-3d-apis"] } : {});
    ctx = await b.newContext({ viewport: { width: 844, height: 390 }, hasTouch: true, isMobile: true, deviceScaleFactor: 1 });
    await ctx.addInitScript(() => { try { sessionStorage.setItem("vh-rot-ok", "1"); } catch (e) {} });
    p = await ctx.newPage(); hook(p);
    await p.goto(URL); await wait(4000);
    await p.click("#fd-tap"); await wait(800);
    await p.click("#tnew"); await wait(900);
    for (let i = 0; i < 3; i++) { await p.click("#fd-next"); await wait(400); }
    await until(() => !!document.getElementById("fd-intro"), 8000); await js(() => VHFD._skip()); await wait(1500);
    await js(() => { for (let i = 0; i < 12 && __vh.sheet(); i++) { const b = document.querySelector("[data-act=tutdone]") || document.querySelector("#sbody button.solid") || document.querySelector("#sx:not([hidden])"); if (!b) break; b.click(); } });
    ok(await until(() => !!(__vh.AR() && __vh.AR().id === "ashford"), 30000), tag + "new game started in Ashford");
    await wait(1500);
    await js(() => { __vh.S().crowns += 5000; });
  };
  const allWrits = () => js(() => { const o = []; __vh.S().sites.forEach((s) => __vh.writList(s.id).forEach((w) => o.push({ id: w.id, hub: s.id, title: w.title, nm: w.nm, cr: w.cr, lv: w.lv }))); return o; });
  // enter each writ from its board, open every chest twice, strike the boss down, check the writ is honoured once and stays done
  const runWrits = async (writs, in3d) => {
    const wBad = { enter: [], chests: [], boss: [], honour: [], again: [] };
    let nChests = 0, nBoss = 0;
    for (let i = 0; i < writs.length; i++) {
      const w = writs[i];
      await leave();
      const entered = await js((id) => __vh.writGo(id), w.id);
      if (!entered) { wBad.enter.push(w.id); continue; }
      if (in3d) { if (!(await until(() => !!(__vh.area3d() && __vh.area3d().ready && __vh.AR() && __vh.AR().sp.writ), 30000))) wBad.enter.push(w.id + " (no 3D view)"); await wait(1200); }
      const ch = await js(CHESTS); nChests += ch.length;
      ch.filter((r) => !r.ok).forEach((r) => wBad.chests.push(w.id + " " + r.id + ": " + r.why));
      const n0 = await js(() => (__vh.S().writs && __vh.S().writs.n) || 0);
      const bs = await js(BOSSES); nBoss += bs.length;
      if (bs.length !== 1) wBad.boss.push(w.id + ": " + bs.length + " bosses");
      bs.forEach((r) => { if (!r.finite || !r.dead || r.again || r.paidAgain) wBad.boss.push(w.id + " " + r.name + ": hp " + r.hp + "/" + r.hpm + ", dead " + r.dead + " after " + r.blows + " blows, hp now " + r.hp1 + (r.again ? ", took a blow after death" : "") + (r.paidAgain ? ", paid again" : "")); });
      const hon = await js((a) => { const S = __vh.S(), c0 = S.crowns, n1 = (S.writs && S.writs.n) || 0; __vh.writTick(); __vh.writTick(); return { done: !!(S.writs && S.writs.done[a.id]), dn: n1 - a.n0, paidOnTick: S.crowns - c0, nowN: ((S.writs && S.writs.n) || 0) - n1 }; }, { id: w.id, n0 });
      if (!hon.done || hon.dn !== 1) wBad.honour.push(w.id + ": done " + hon.done + ", honoured " + hon.dn + " times");
      if (hon.paidOnTick !== 0 || hon.nowN !== 0) wBad.honour.push(w.id + ": paid again on a later tick (" + hon.paidOnTick + " crowns)");
      if (in3d) {
        // in 3D the fallen boss plays its death and drops out of the health bars; the opened chests show their lids up
        await wait(1500);
        const v = await js(() => ({ st: __vh.area3d() && __vh.area3d().state(), bars: [...document.querySelectorAll("#vh3d .v3-hb.boss")].filter((e) => !e.hidden && e.style.display !== "none").length }));
        if (!v.st) wBad.boss.push(w.id + ": 3D view lost after the kill"); else if (v.bars) wBad.boss.push(w.id + ": boss health bar still shown after death");
      }
      await leave();
      const again = await js((id) => ({ board: (__vh.writList(id.split(":")[1]).find((x) => x.id === id) || {}).done, go: __vh.writGo(id) }), w.id);
      if (!again.board || again.go) wBad.again.push(w.id + ": board done " + again.board + ", re-entered " + again.go);
    }
    const T = in3d ? "(3D) " : "";
    ok(wBad.enter.length === 0, T + "every writ opens from its board (" + (writs.length - wBad.enter.length) + "/" + writs.length + ")" + (wBad.enter.length ? ": " + wBad.enter.slice(0, 5).join(", ") : ""));
    ok(nChests >= writs.length && wBad.chests.length === 0, T + "every writ chest opens once, then says Empty and pays nothing (" + nChests + " chests)" + (wBad.chests.length ? ":\n  " + wBad.chests.slice(0, 8).join("\n  ") : ""));
    ok(nBoss === writs.length && wBad.boss.length === 0, T + "every writ boss has real health and dies at 0, once (" + nBoss + " bosses)" + (wBad.boss.length ? ":\n  " + wBad.boss.slice(0, 8).join("\n  ") : ""));
    ok(wBad.honour.length === 0, T + "every writ is honoured when its boss dies, and pays once" + (wBad.honour.length ? ":\n  " + wBad.honour.slice(0, 8).join("\n  ") : ""));
    ok(wBad.again.length === 0, T + "an honoured writ shows Done on its board and cannot be run again" + (wBad.again.length ? ":\n  " + wBad.again.slice(0, 8).join("\n  ") : ""));
  };

  // ---------------- 0. as John plays it: two writs in the 3D view ----------------
  await boot(false);
  await runWrits((await allWrits()).slice(0, 2), true);
  await b.close();

  // ---------------- 1. every Writ on every board ----------------
  await boot(true);
  let writs = await allWrits();
  if (LIMIT) writs = writs.slice(0, LIMIT);
  const nBoards = new Set(writs.map((w) => w.hub)).size;
  ok(LIMIT ? writs.length === LIMIT : writs.length >= 3 * 20, "writ boards found: " + writs.length + " writs across " + nBoards + " boards");
  await runWrits(writs, false);

  // ---------------- 2. every other area with chests: story areas, quest zones, every settlement ----------------
  let areas = await js(() => { const ids = __vh.areaIds().filter((id) => !/^(writ:|cave\d|deep\d|overland|yard:)/.test(id)); __vh.S().sites.forEach((s) => { if (ids.indexOf("g:" + s.id) < 0 && __vh.spec("g:" + s.id)) ids.push("g:" + s.id); }); return ids.filter((id) => { const sp = __vh.spec(id); return sp && ((sp.chests || []).length || (sp.enemies || []).some((q) => q[0] && /./.test(q[0]))); }); });
  if (LIMIT) areas.splice(LIMIT);
  const aBad = { chests: [], boss: [], back: [] }; let aChests = 0, aBoss = 0; const bossAreas = [];
  if (process.env.DEBUG) console.log("  areas: " + areas.join(" "));
  for (const id of areas) {
    await leave(); if (process.env.DEBUG) console.log("  area " + id);
    if (!(await js((i) => __vh.startArea(i), id))) { aBad.chests.push(id + ": would not open"); continue; }
    const ch = await js(CHESTS); aChests += ch.length; ch.filter((r) => !r.ok).forEach((r) => aBad.chests.push(id + " " + r.id + ": " + r.why));
    const bs = await js(BOSSES); aBoss += bs.length; if (bs.length) bossAreas.push(id);
    bs.forEach((r) => { if (!r.finite || !r.dead || r.again || r.paidAgain) aBad.boss.push(id + " " + r.name + ": hp " + r.hp + "/" + r.hpm + ", dead " + r.dead + (r.paidAgain ? ", paid again" : "")); });
  }
  await wait(1200); // story bosses open their scenes a moment after they fall
  // come back to each one: chests still opened, beaten bosses still beaten
  for (const id of areas) {
    await leave();
    const r = await js((i) => { __vh.startArea(i); const A = __vh.AR(); return { full: A.npcs.filter((n) => /^chest\d+$/.test(n.id) && n.d() !== "chest_empty").length, boss: A.en.filter((e) => e.d && e.d.boss && !e.dead && !e.d.yieldAt).map((e) => e.type) }; }, id);
    if (r.full) aBad.back.push(id + ": " + r.full + " chests full again");
    if (bossAreas.indexOf(id) >= 0 && r.boss.length) aBad.back.push(id + ": boss back (" + r.boss.join(",") + ")");
  }
  ok(aChests > (LIMIT ? 0 : 50) && aBad.chests.length === 0, "every chest in " + areas.length + " story areas, quest zones and settlements opens once (" + aChests + " chests)" + (aBad.chests.length ? ":\n  " + aBad.chests.slice(0, 8).join("\n  ") : ""));
  ok(aBoss >= (LIMIT ? 0 : 10) && aBad.boss.length === 0, "every story and zone boss dies at 0 health (" + aBoss + " bosses in " + bossAreas.length + " areas)" + (aBad.boss.length ? ":\n  " + aBad.boss.slice(0, 8).join("\n  ") : ""));
  ok(aBad.back.length === 0, "going back in: chests still opened, beaten bosses still beaten" + (aBad.back.length ? ":\n  " + aBad.back.slice(0, 8).join("\n  ") : ""));

  // ---------------- 3. the Hollow's strongbox (the writ in the story) ----------------
  await leave();
  const hol = await js(() => {
    const c = __vh.cp(), S = __vh.S(); delete c.f.writ; delete c.f.grathdead; delete c.cleared.hollow; if (c.bdown) Object.keys(c.bdown).forEach((k) => { if (k.indexOf("hollow:") === 0) delete c.bdown[k]; });
    __vh.startArea("hollow"); const A = __vh.AR(), ch = A.npcs.find((n) => n.id === "chest"), out = { locked: ch.d() };
    const g = A.en.find((e) => e.type === "grath"); for (let i = 0; i < 60 && !g.dead; i++) __vh.hit(g, g.hpm / 10); out.grath = g.dead && !!c.f.grathdead;
    out.open = ch.d(); const c0 = S.crowns; __vh.talk("chest"); document.querySelector("#adlg [data-act=adc]").click(); out.paid = S.crowns - c0; out.writ = !!c.f.writ;
    const c1 = S.crowns; __vh.talk("chest"); out.after = __vh.dlg(); out.tx = document.querySelector("#adlg .tx").textContent; document.querySelector("#adlg [data-act=adc]").click(); out.paid2 = S.crowns - c1;
    return out;
  });
  ok(hol.locked === "chest_locked" && hol.grath && hol.open === "chest_open" && hol.paid === 60 && hol.writ && hol.after === "chest_empty" && /^Empty/.test(hol.tx) && hol.paid2 === 0,
    "the Hollow: locked until Grath dies, then the writ and 60 crowns once, then Empty (" + JSON.stringify(hol) + ")");

  // ---------------- 4. dungeon re-entry, a lair, the Deep ----------------
  await leave();
  const caves = await js(() => __vh.caves().map((c) => ({ id: c.id, lair: __vh.spec(c.id) && __vh.spec(c.id).lair !== undefined })));
  const cave = caves.find((c) => !c.lair), lair = caves.find((c) => c.lair);
  if (cave) {
    const r = await js((id) => {
      __vh.startArea(id); const A = __vh.AR(), ch = (() => { const o = []; A.npcs.filter((n) => /^chest\d+$/.test(n.id)).forEach((n) => { __vh.talk(n.id); document.querySelector("#adlg [data-act=adc]").click(); o.push(n.d()); }); return o; })();
      A.en.forEach((e) => { for (let i = 0; i < 60 && !e.dead && !e.gone && !e.yield; i++) __vh.hit(e, Math.max(1, e.hpm / 5)); });
      const cleared = !!__vh.cp().cleared[id]; __vh.leave();
      const c = __vh.cp(); c.rs = c.rs || {}; c.rs[id] = { l: 0, d: -99 }; // as if a week had passed and you had levelled
      __vh.startArea(id); const B = __vh.AR();
      return { n: ch.length, opened: ch.every((d) => d === "chest_empty"), cleared, back: B.en.filter((e) => !e.dead).length, full: B.npcs.filter((n) => /^chest\d+$/.test(n.id) && n.d() !== "chest_empty").length };
    }, cave.id);
    ok(r.n >= 1 && r.opened && r.cleared && r.back > 0 && r.full === 0, "a cleared cave refills with foes after a week, but its " + r.n + " chests stay opened (" + JSON.stringify(r) + ")");
  } else ok(false, "no ordinary cave found on the map");
  await leave();
  if (lair) {
    const r = await js((id) => {
      const S = __vh.S(); S.lairSeen = S.lairSeen || {}; __vh.caves().forEach((c) => { S.lairSeen[c.name] = 1; }); // the first-visit story video is not under test
      const fl1 = id; __vh.startArea(fl1); let A = __vh.AR(); const n0 = A.npcs.filter((n) => /^chest\d+$/.test(n.id)).length;
      A.npcs.filter((n) => /^chest\d+$/.test(n.id)).forEach((n) => { __vh.talk(n.id); document.querySelector("#adlg [data-act=adc]").click(); });
      __vh.leave(); __vh.startArea(fl1); A = __vh.AR(); const fullAfterWalk = A.npcs.filter((n) => /^chest\d+$/.test(n.id) && n.d() !== "chest_empty").length;
      // the lair's master falls on the top floor; the hoard may then fill again for the next run, and only then
      const st = A.lair.st, nBefore = st.n, top = id + "f" + (A.sp.nf || 2); __vh.leave(); __vh.startArea(top); const T = __vh.AR();
      const boss = T.en.find((e) => e.d && e.d.lb); let dead = false; if (boss) { for (let i = 0; i < 80 && !boss.dead; i++) __vh.hit(boss, boss.hpm / 10); dead = boss.dead; }
      __vh.leave(); __vh.startArea(fl1); A = __vh.AR(); const fullAfterClear = A.npcs.filter((n) => /^chest\d+$/.test(n.id) && n.d() !== "chest_empty").length;
      return { n0, fullAfterWalk, boss: !!boss, dead, cleared: st.n - nBefore, fullAfterClear };
    }, lair.id);
    ok(r.n0 >= 1 && r.fullAfterWalk === 0, "a lair's chests stay opened when you walk out and back in (" + r.n0 + " chests)");
    ok(r.boss && r.dead && r.cleared === 1 && r.fullAfterClear === r.n0, "the lair's master dies at 0 health; only a new clear fills the hoard again (" + JSON.stringify(r) + ")");
  } else ok(false, "no lair found on the map");
  await leave();
  const deep = await js(() => {
    const go = () => { const b = document.createElement("button"); b.setAttribute("data-act", "deepgo"); b.setAttribute("data-a", "1"); document.body.appendChild(b); b.click(); b.remove(); };
    go(); let A = __vh.AR(); if (!A || A.id !== "deep1") return { err: "no deep1" };
    const ids = A.npcs.filter((n) => /^chest\d+$/.test(n.id)).map((n) => n.id); ids.forEach((i) => { __vh.talk(i); document.querySelector("#adlg [data-act=adc]").click(); });
    __vh.leave(); go(); A = __vh.AR();
    return { n: ids.length, full: A.npcs.filter((n) => /^chest\d+$/.test(n.id) && n.d() !== "chest_empty").length };
  });
  ok(!deep.err && deep.n >= 1 && deep.full === 0, "the Deep: floor chests stay opened on the next descent (" + JSON.stringify(deep) + ")");

  // a writ left half done: its chests stay opened and its boss waits, even after the story moves on (the writ keeps its level)
  await leave();
  const hw = await js(() => {
    const S = __vh.S(), open = () => { let w = null; S.sites.some((s) => { w = __vh.writList(s.id).find((x) => !x.done); return !!w; }); return w; };
    const day0 = S.day; let w = open(); if (!w) { S.day = (S.day || 1) + 7; w = open(); } // every board honoured above: take one of next week's
    if (!w) return { err: "no open writ" };
    __vh.writGo(w.id); let A = __vh.AR();
    const n = A.npcs.filter((q) => /^chest\d+$/.test(q.id)); n.forEach((q) => { __vh.talk(q.id); document.querySelector("#adlg [data-act=adc]").click(); });
    __vh.leave(); const c = __vh.cp(); c.f.q7done = 1; c.f.domRule = 1; c.f.q5done = 1; c.f.q4done = 1; c.f.q3done = 1; // the story moves on: later Acts raise new writs' level
    __vh.writGo(w.id); A = __vh.AR();
    const r = { n: n.length, full: A.npcs.filter((q) => /^chest\d+$/.test(q.id) && q.d() !== "chest_empty").length, boss: A.en.filter((e) => e.d && e.d.boss && !e.dead).length, lv: A.sp.lv === w.lv };
    __vh.leave(); S.day = day0; return r; // back to this week, so the honoured writs above are still on their boards
  });
  ok(hw.n >= 1 && hw.full === 0 && hw.boss === 1 && hw.lv, "a writ left half done: chests stay opened, the boss still waits, the writ keeps its level (" + JSON.stringify(hw) + ")");
  // the overland walk: its chests (a different set in every map cell) open once each
  await leave();
  await js(() => window.__walk()); await until(() => !!(__vh.AR() && __vh.AR().sp.over), 15000);
  const ov = await js(CHESTS);
  await leave(); await js(() => window.__walk()); await until(() => !!(__vh.AR() && __vh.AR().sp.over), 15000);
  const ov2 = await js(() => __vh.AR().npcs.filter((n) => /^chest\d+$/.test(n.id) && n.d() !== "chest_empty").length);
  ok(ov.length >= 5 && ov.every((r) => r.ok) && ov2 === 0, "the overland walk: " + ov.length + " chests open once each and stay opened" + (ov.some((r) => !r.ok) ? ": " + ov.filter((r) => !r.ok).slice(0, 4).map((r) => r.id + " " + r.why).join("; ") : ""));

  // ---------------- 5. save, reload, continue: all of it holds ----------------
  await leave();
  const before = await js(() => ({ chests: Object.keys(__vh.cp().f).filter((k) => k.indexOf("chest:") === 0).length, writs: Object.keys((__vh.S().writs || {}).done || {}).length, bdown: Object.keys(__vh.cp().bdown || {}).length }));
  await js(() => __vh.save());
  await p.close(); p = await ctx.newPage(); hook(p);
  await p.goto(URL); await wait(4000);
  await js(() => { const b = document.getElementById("tcont"); if (b) b.click(); }); await wait(2500);
  ok(await until(() => !!(window.__vh && __vh.S() && document.getElementById("title").hidden), 15000), "the save continues after a reload");
  const after = await js((w) => {
    const c = __vh.cp(), S = __vh.S(), o = { chests: Object.keys(c.f).filter((k) => k.indexOf("chest:") === 0).length, writs: Object.keys((S.writs || {}).done || {}).length, bdown: Object.keys(c.bdown || {}).length };
    if (__vh.AR()) __vh.leave(); o.reGo = __vh.writGo(w); if (__vh.AR()) __vh.leave();
    __vh.startArea(w); const A = __vh.AR(); o.full = A.npcs.filter((n) => /^chest\d+$/.test(n.id) && n.d() !== "chest_empty").length; o.boss = A.en.filter((e) => e.d && e.d.boss && !e.dead).length; __vh.leave();
    return o;
  }, writs[0].id);
  ok(after.chests === before.chests && after.writs === before.writs && after.bdown === before.bdown, "after reload: " + after.chests + " opened chests, " + after.writs + " honoured writs, " + after.bdown + " beaten bosses kept (" + JSON.stringify(before) + ")");
  ok(!after.reGo && after.full === 0 && after.boss === 0, "after reload: an honoured writ will not run again, and its chests and boss stay as you left them (" + JSON.stringify(after) + ")");

  ok(errs.length === 0, "no console errors" + (errs.length ? ":\n  " + [...new Set(errs)].slice(0, 10).join("\n  ") : ""));
  await b.close();
  console.log(fails ? fails + " FAILED" : "ALL PASSED");
  process.exit(fails ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
