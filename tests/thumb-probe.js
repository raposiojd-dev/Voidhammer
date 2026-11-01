// Right-thumb cluster check: every visible action button has its own spot (no two bounding rects intersect, each >= 44px),
// in the 3D walk (with a bow and bread), a 3D battle (bow) and a siege.
// Serve the repo root, then: VPS=844x390 URL=http://localhost:8795/Voidhammer/index.html node tests/thumb-probe.js   (SHOTS=dir also saves pictures)
const { chromium } = require(process.env.PW || "playwright");
const URL = process.env.URL || "http://localhost:8791/Voidhammer/index.html";
const [VW, VH] = (process.env.VPS || "844x390").split("x").map(Number);
let fails = 0; const ok = (c, m) => { console.log((c ? "ok   " : "FAIL ") + m); if (!c) fails++; };
const measure = () => {
  const sel = ["#aatk", "#acast", "#abow", "#ause", "#askill", "#abread", "#asksw", "#vh3d .b3-btns button", "#vh3d .v3-use"];
  const out = [];
  for (const s of sel) for (const el of document.querySelectorAll(s)) {
    if (el.hidden) continue; const cs = getComputedStyle(el); if (cs.display === "none" || cs.visibility === "hidden" || +cs.opacity === 0) continue;
    let p = el, vis = true; while (p && p !== document.body) { const c = getComputedStyle(p); if (c.display === "none" || c.visibility === "hidden") { vis = false; break; } p = p.parentElement; }
    if (!vis) continue; const r = el.getBoundingClientRect(); if (r.width < 1 || r.height < 1) continue;
    // the painted button: the round art is the top square; the label pill sits under it inside the same box
    out.push({ id: (el.id || el.className || "") + (el.getAttribute("data-b") ? "[" + el.getAttribute("data-b") + "]" : ""), t: (el.textContent || "").trim().slice(0, 14), l: r.left, t0: r.top, r: r.right, b: r.bottom, w: r.width, h: r.height });
  }
  return out;
};
// iPhone insets (notch side in landscape, home bar): every button must count them the same way
const INSET = VW > VH ? { r: "47px", b: "21px" } : { r: "0px", b: "34px" };
async function checkAll(p, tag) {
  check(tag, await p.evaluate(measure));
  await p.evaluate((i) => { const s = document.documentElement.style; s.setProperty("--vh-sr", i.r); s.setProperty("--vh-sb", i.b); }, INSET); await p.waitForTimeout(400);
  check(tag + " + iPhone insets", await p.evaluate(measure));
  await p.evaluate(() => { const s = document.documentElement.style; s.removeProperty("--vh-sr"); s.removeProperty("--vh-sb"); });
}
function check(tag, list) {
  console.log(tag + ": " + list.map((q) => q.id + "(" + q.t + ") " + Math.round(q.l) + "," + Math.round(q.t0) + " " + Math.round(q.w) + "x" + Math.round(q.h)).join(" | "));
  const right = list.filter((q) => q.l > VW * 0.45 && q.id.indexOf("v3-use") < 0);
  ok(right.length >= 2, tag + ": the right-thumb cluster has " + right.length + " buttons");
  for (const q of right) ok(Math.min(q.w, q.h) >= 44, tag + ": " + q.id + " is at least 44px (" + Math.round(q.w) + "x" + Math.round(q.h) + ")");
  for (const q of right) ok(q.l >= 0 && q.r <= VW + 0.5 && q.t0 >= 0 && q.b <= VH + 0.5, tag + ": " + q.id + " is on screen");
  for (let i = 0; i < list.length; i++) for (let j = i + 1; j < list.length; j++) {
    const a = list[i], c = list[j]; const hit = a.l < c.r - 0.5 && a.r > c.l + 0.5 && a.t0 < c.b - 0.5 && a.b > c.t0 + 0.5;
    if (a.l > VW * 0.3 || c.l > VW * 0.3) ok(!hit, tag + ": " + a.id + " and " + c.id + " do not overlap");
  }
}
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: VW, height: VH }, hasTouch: true, isMobile: true, deviceScaleFactor: 1 });
  await p.addInitScript(() => { try { sessionStorage.setItem("vh-rot-ok", "1"); } catch (e) {} });
  const errs = []; p.on("pageerror", (e) => errs.push(e.message));
  const js = (f, a) => p.evaluate(f, a), wait = (ms) => p.waitForTimeout(ms);
  const until = async (f, ms) => { const t = Date.now(); while (Date.now() - t < ms) { if (await js(f)) return true; await wait(500); } return false; };
  const shot = async (n) => { if (process.env.SHOTS) await p.screenshot({ path: process.env.SHOTS + "/thumb-" + n + "-" + VW + "x" + VH + ".png", timeout: 120000 }).catch(() => {}); };
  await p.goto(URL); await wait(4000);
  await p.click("#fd-tap"); await wait(800); await p.click("#tnew"); await wait(900);
  for (let i = 0; i < 3; i++) { await p.click("#fd-next"); await wait(400); }
  await until(() => !!document.getElementById("fd-intro"), 8000); await js(() => VHFD._skip()); await wait(1500);
  await js(() => { for (let i = 0; i < 12 && __vh.sheet(); i++) { const b = document.querySelector("[data-act=tutdone]") || document.querySelector("#sbody button.solid") || document.querySelector("#sx:not([hidden])"); if (!b) break; b.click(); } });
  await until(() => !!(__vh.area3d() && __vh.area3d().ready && __vh.AR() && __vh.AR().id === "ashford"), 60000);
  await js(() => { const c = __vh.cp(); c.eq = c.eq || {}; c.eq.r = "bows"; c.arrows = 50; c.bread = 3; const S = __vh.S(); S.gear = S.gear || {}; S.gear.bows = Math.max(S.gear.bows || 0, 1); });
  await js(() => __vh.area3d().goTo("mara")); await wait(4000);
  // things are not people: plots, signs and chests get their own verb, never Talk; people still get Talk
  const verbs = await js(() => { const d = function () {}; const useLabel = __vh.useLabel; return [useLabel({ npc: { id: "plot2", name: "Plot", sign: 1, draw: d } }), useLabel({ npc: { id: "yardgate", name: "Builder's yard", draw: d } }), useLabel({ npc: { id: "homechest", name: "Home chest", draw: d } }), useLabel({ npc: { id: "sign9", name: "Old sign", draw: d } }), useLabel({ npc: { id: "mara", name: "Elder Mara" } })].join(","); });
  ok(verbs === "Build,Enter,Open,Look,Talk", "Use verbs fit the thing (" + verbs + ")");
  const ui = await js(() => __vh.area3d() && document.querySelector("#vh3d .v3-use") ? document.querySelector("#vh3d .v3-use").textContent : "");
  ok(/^Talk/.test(ui), "beside Elder Mara the pill still says Talk (" + ui + ")");
  await checkAll(p, "walk (bow, bread, Talk)"); await shot("walk");
  await js(() => { const A = __vh.AR(); A.p.x = 40; A.p.y = 40; }); await wait(2500);
  await checkAll(p, "walk (bow, bread, alone)");
  await js(() => { const b = document.querySelector("[data-act=aleave]"); if (b) b.click(); }); await until(() => !__vh.AR(), 15000);
  await js(() => { __vh.give(30); return __vh.battleWith(16, "bandit"); }); await wait(500); await js(() => __vh.startFight());
  await until(() => !!(__vh.scene() && __vh.scene().ctl && __vh.scene().ctl.ready), 60000); await wait(3000);
  await checkAll(p, "battle (bow)"); await shot("battle");
  await js(() => __vh.scene() && __vh.scene().ctl.fast(12)); await until(() => !__vh.scene(), 240000);
  await js(() => { const d = document.querySelector("#sbody [data-act=done]"); if (d) d.click(); }); await wait(800);
  await js(() => __vh.battleWith(26)); await wait(500); await js(() => __vh.startFight({ siege: true, defend: false }));
  await until(() => !!(__vh.scene() && __vh.scene().ctl && __vh.scene().ctl.ready), 60000); await wait(3000);
  await checkAll(p, "siege (bow)"); await shot("siege");
  ok(errs.length === 0, "no page errors" + (errs.length ? ": " + errs.join(" | ") : ""));
  console.log(fails ? fails + " FAILED" : "ALL PASS"); await b.close(); process.exit(fails ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(2); });
