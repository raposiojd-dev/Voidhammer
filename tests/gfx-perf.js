// Frame time in headless Chromium (software GL, so only the before/after ratio means anything), per graphics preset.
// Walk (Ashford, beside Elder Mara) and a 3D field battle, at 844x390 with touch, as on a phone held sideways.
// Env: URL, PRESETS (default "low,medium,high"), SECS (sample length, default 8), SHOTS (folder) + TAG for screenshots, VPS.
const { chromium } = require(process.env.PW || "playwright");
const path = require("path");
const URL = process.env.URL || "http://localhost:8791/Voidhammer/index.html";
const PRESETS = (process.env.PRESETS || "low,medium,high").split(",");
const SECS = +(process.env.SECS || 8);
const [VW, VH] = (process.env.VPS || "844x390").split("x").map(Number);

(async () => {
  const b = await chromium.launch();
  const out = {};
  for (const q of PRESETS) {
    const p = await b.newPage({ viewport: { width: VW, height: VH }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
    await p.addInitScript((q) => { try { sessionStorage.setItem("vh-rot-ok", "1"); localStorage.setItem("vh3d-gfx", q); } catch (e) {} }, q);
    const errs = []; p.on("pageerror", (e) => errs.push(e.message));
    const js = (f, a) => p.evaluate(f, a), wait = (ms) => p.waitForTimeout(ms);
    const until = async (f, ms) => { const t = Date.now(); while (Date.now() - t < ms) { if (await js(f)) return true; await wait(500); } return false; };
    const shot = async (n) => { if (process.env.SHOTS) await p.screenshot({ path: path.join(process.env.SHOTS, (process.env.TAG || "x") + "-" + n + "-" + q + "-" + VW + "x" + VH + ".png"), timeout: 120000 }).catch(() => {}); };
    await p.goto(URL); await wait(4000);
    await p.click("#fd-tap"); await wait(800); await p.click("#tnew"); await wait(900);
    for (let i = 0; i < 3; i++) { await p.click("#fd-next"); await wait(400); }
    await until(() => !!document.getElementById("fd-intro"), 8000); await js(() => VHFD._skip()); await wait(1500);
    await js(() => { for (let i = 0; i < 12 && __vh.sheet(); i++) { const b = document.querySelector("[data-act=tutdone]") || document.querySelector("#sbody button.solid") || document.querySelector("#sx:not([hidden])"); if (!b) break; b.click(); } });
    await until(() => !!(__vh.area3d() && __vh.area3d().ready && __vh.AR() && __vh.AR().id === "ashford"), 40000);
    await js(() => __vh.area3d().goTo("mara")); await wait(4000);
    const f0 = await js(() => __vh.area3d().state().frames); await wait(SECS * 1000); const f1 = await js(() => __vh.area3d().state().frames);
    const walk = (SECS * 1000) / Math.max(1, f1 - f0);
    await shot("walk");
    await js(() => { const b = document.querySelector("[data-act=aleave]"); if (b) b.click(); }); await until(() => !__vh.AR(), 15000);
    await js(() => { __vh.give(30); return __vh.battleWith(16, "bandit"); }); await wait(500); await js(() => __vh.startFight());
    await until(() => !!(__vh.scene() && __vh.scene().ctl && __vh.scene().ctl.ready), 40000); await wait(4000);
    const g0 = await js(() => __vh.scene().ctl.scene.frames); await wait(SECS * 1000); const g1 = await js(() => __vh.scene() ? __vh.scene().ctl.scene.frames : 0);
    const battle = g1 ? (SECS * 1000) / Math.max(1, g1 - g0) : NaN;
    await shot("battle");
    out[q] = { walkMs: +walk.toFixed(1), battleMs: +battle.toFixed(1), errors: errs.length };
    console.log(q, JSON.stringify(out[q]));
    await p.close();
  }
  console.log(JSON.stringify(out));
  await b.close();
})().catch((e) => { console.error(e); process.exit(2); });
