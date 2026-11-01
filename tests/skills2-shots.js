// Screenshots of the Realm Arts (skills v2): the skill sheet and abilities firing in a 3D battle and on foot.
// Serve the repo root (python3 -m http.server 8765), then: VP=phone|land|desktop OUT=docs/screens/skills-v2 node tests/skills2-shots.js
const { chromium } = require(process.env.PW || "playwright");
const path = require("path"), fs = require("fs");
const URL = process.env.URL || "http://localhost:8765/index.html", OUT = process.env.OUT || "docs/screens/skills-v2";
const land = process.env.VP === "land", phone = process.env.VP === "phone" || land, tag = land ? "landscape" : phone ? "phone" : "desktop";
fs.mkdirSync(OUT, { recursive: true });
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage(phone ? { viewport: land ? { width: 844, height: 390 } : { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 } : { viewport: { width: 1280, height: 720 } });
  // upright phone shots play upright anyway (the turn-sideways card is shot by the smoke test)
  if (phone && !land) await p.addInitScript(() => { try { sessionStorage.setItem("vh-rot-ok", "1"); } catch (e) {} });
  const errs = []; p.on("pageerror", (e) => errs.push(e.message)); p.on("console", (m) => { if (m.type() === "error") errs.push(m.text()); });
  const js = (f, a) => p.evaluate(f, a), wait = (ms) => p.waitForTimeout(ms), shot = (n) => p.screenshot({ path: path.join(OUT, tag + "-" + n + ".png"), timeout: 120000 }).catch((e) => console.log("shot " + n + " skipped: " + e.message.split("\n")[0]));
  await p.goto(URL); await wait(4000);
  await p.click("#tnew"); await wait(600);
  for (let i = 0; i < 3; i++) { await p.click(".mkcard >> nth=0"); await p.click("#mknext"); }
  await wait(300); await p.click("#csgo"); await wait(600); await p.click("[data-act=startnew]"); await wait(2500);
  await js(() => { for (let i = 0; i < 12 && __vh.sheet(); i++) { const b = document.querySelector("[data-act=tutdone]") || document.querySelector("#sbody button.solid") || document.querySelector("#sx:not([hidden])"); if (!b) break; b.click(); } });
  await wait(1500);
  // a level-24 Flameborne Spark with a Tempest Half-Spark and a Commander core
  await js(() => { __vh.S().xp = 25 * 23 * 23; const K = __vh.k2();
    ["em_brand", "em_hot", "em_hot", "em_cracks", "em_refusal", "em_refusal", "em_kindling", "em_firebreak", "em_bank", "em_unmake", "cmd_rally", "cmd_muster", "cmd_drill", "cmd_wall"].forEach((id) => K.learn(id, true));
    ["st_step", "st_feet", "st_pressure", "st_squall"].forEach((id) => K.learn(id, true)); K.equip("em_firebreak", 1); K.equip("st_squall", 2); });
  await js(() => { const b = document.querySelector("[data-act=menu][data-a=skills]"); if (b) b.click(); }); await wait(800);
  await js(() => { document.querySelector("[data-k2tree=ember]").click(); }); await wait(300);
  await js(() => { document.querySelector("[data-k2sel=em_firebreak]").click(); }); await wait(400);
  await shot("01-sheet-ember");
  await js(() => { document.getElementById("sheet").scrollTop = 0; document.querySelector("[data-k2sel=em_ks_unbanked]").click(); }); await wait(200);
  await js(() => { const s = document.getElementById("sheet"); s.scrollTop = s.scrollHeight; }); await wait(300);
  await shot("02-sheet-price");
  await js(() => { document.getElementById("sheet").scrollTop = 0; document.querySelector("[data-k2tree=frost]").click(); }); await wait(200);
  await js(() => { document.querySelector("[data-k2sel=fr_echo]").click(); document.querySelector("[data-k2learn=fr_echo]") && 0; }); await wait(200);
  await shot("03-sheet-locked-tree");
  await js(() => { document.querySelector("[data-k2tree=ember]").click(); }); await wait(200);
  // the keystone moment (shown, not taken)
  await js(() => { __vh.k2().learn("em_hot"); __vh.k2().learn("em_cracks"); __vh.k2().learn("em_cracks"); __vh.k2().bump(); document.querySelector("[data-k2tree=ember]").click(); }); await wait(200);
  await js(() => { document.querySelector("[data-k2sel=em_ks_patient]").click(); }); await wait(150);
  await js(() => { const b = document.querySelector("[data-k2learn=em_ks_patient]"); if (b && !b.disabled) b.click(); }); await wait(400);
  await shot("04-keystone-choice");
  await js(() => { const n = document.querySelector("[data-k2modal=no]"); if (n) n.click(); }); await wait(200);
  await js(() => { document.querySelector("#sx").click(); }); await wait(500);

  // battle
  await js(() => { const b = document.querySelector("[data-act=aleave]"); if (b) b.click(); });
  for (let i = 0; i < 40 && (await js(() => !!__vh.AR())); i++) await wait(500);
  await js(() => { __vh.give(4); }); await js(() => __vh.battleWith(45, "bandit")); await wait(600);
  await js(() => __vh.startFight());
  for (let i = 0; i < 120 && !(await js(() => __vh.scene() && __vh.scene().kind === "battle" && __vh.scene().ctl && __vh.scene().ctl.ready && __vh.scene().ctl.k2)); i++) await wait(500);
  await wait(2500);
  await js(() => document.querySelector("#vh3d [data-b=cast]").dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }))); await wait(300);
  const fire = async (id, name, delay) => {
    if (!(await js(() => !!(__vh.scene() && __vh.scene().kind === "battle")))) { console.log("battle over before " + name); return; }
    // keep the shot alive: the hero cannot fall, and the field keeps its foes
    await js(() => { const c = __vh.scene().ctl; c.hero.hp = c.hero.hpm = 1e6; c.units.forEach((u) => { if (u.side === "e" && !u.dead) { if (!u.k2tough) { u.k2tough = 1; u.hpm *= 8; } u.hp = u.hpm; u.rout = false; } }); });
    await js((id) => { const c = __vh.scene().ctl, k2 = c.k2(), s = __vh.S().sk2, hero = c.hero; s.r[id] = Math.max(1, s.r[id] || 0); s.eq[0] = id; __vh.k2().bump(); k2.core.cds = {};
      const foes = c.units.filter((u) => u.side === "e" && !u.dead && !u.gone); if (!foes.length) return; let cx = 0, cz = 0; foes.forEach((u) => { cx += u.x; cz += u.z; }); cx /= foes.length; cz /= foes.length;
      const d = Math.hypot(cx - hero.x, cz - hero.z) || 1, back = id === "st_step" || id === "sh_step" || id === "vw_lantern" ? 9 : 4.5; hero.x = cx - (cx - hero.x) / d * back; hero.z = cz - (cz - hero.z) / d * back; hero.yaw = Math.atan2(cx - hero.x, cz - hero.z);
      window.__k2t = k2.core.t; k2.cast(0); }, id);
    // wait on the battle's clock (headless frames are slow)
    for (let i = 0; i < 200 && (await js((d) => !!__vh.scene() && __vh.scene().kind === "battle" && __vh.scene().ctl.k2().core.t < window.__k2t + d, (delay || 220) / 1000)); i++) await wait(50);
    await shot(name);
  };
  await fire("em_refusal", "10-battle-refusal", 160);
  await fire("em_firebreak", "11-battle-firebreak", 500);
  await fire("st_squall", "12-battle-squall", 120);
  await fire("li_judgment", "13-battle-judgment", 1350);
  await fire("fr_hold", "14-battle-hold", 300);
  await fire("sg_well", "15-battle-well", 1200);
  await fire("vw_guard", "16-battle-echo-guard", 600);
  await fire("mt_vent", "17-battle-core-vent", 150);
  if (await js(() => !!(__vh.scene() && __vh.scene().kind === "battle"))) { await js(() => { __vh.k2().pay("ember", 80); }); await wait(500); await shot("18-battle-price-arrears"); }
  await js(() => __vh.scene() && __vh.scene().ctl.fast(10));
  for (let i = 0; i < 150 && (await js(() => !!__vh.scene())); i++) await wait(1000);
  await js(() => { const d = document.querySelector("#sbody [data-act=done]"); if (d) d.click(); }); await wait(600);
  // on foot
  await js(() => __vh.startArea("millroad"));
  for (let i = 0; i < 60 && !(await js(() => __vh.area3d() && __vh.area3d().ready)); i++) await wait(500);
  await wait(2000);
  await js(() => { const s = __vh.S().sk2; s.m = {}; s.marks = {}; s.eq = ["em_brand", "st_step", "em_refusal"]; __vh.k2().bump(); const A = __vh.AR(), e = A.en.find((q) => !q.dead && !q.gone); if (e) { A.p.x = e.x - 30; A.p.y = e.y + 2; A.p.face = { x: 1, y: 0 }; } }); await wait(1200);
  await js(() => document.querySelector("#acast").dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }))); await wait(400);
  await shot("20-foot-tray");
  await js(() => { window.__k2t = __vh.k2a().t; __vh.k2a().cast(0); }); for (let i = 0; i < 100 && (await js(() => __vh.k2a().t < window.__k2t + 0.2)); i++) await wait(50); await shot("21-foot-brand");
  await js(() => { const A = __vh.AR(), e = A.en.find((q) => !q.dead && !q.gone); if (e) { A.p.x = e.x - 12; A.p.y = e.y; } __vh.k2a().cds = {}; __vh.k2a().cast(2); }); await wait(150); await shot("22-foot-refusal");
  console.log(tag + " shots done" + (errs.length ? "; errors:\n" + errs.join("\n") : ", no errors"));
  await b.close();
  process.exit(errs.length ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(2); });
