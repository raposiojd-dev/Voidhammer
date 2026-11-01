// Screenshots of the 3D HUD on phones: walk view (Ashford, beside Elder Mara), the open menu panel, a 3D battle and a siege.
// Serve the repo root, then: VPS=844x390 TAG=after SHOTS=docs/screens/hud-v3 URL=http://localhost:8791/Voidhammer/index.html node tests/hud-shots.js
// Env: VPS (default 844x390), TAG (filename prefix, default "after"), NOBATTLE=1 skips battle and siege, PW (path to playwright).
const { chromium } = require(process.env.PW || "playwright");
const path = require("path");
const URL = process.env.URL || "http://localhost:8791/Voidhammer/index.html";
const SHOTS = process.env.SHOTS || "docs/screens/hud-v3";
const TAG = process.env.TAG || "after";
const [VW, VH] = (process.env.VPS || "844x390").split("x").map(Number);
const vp = VW + "x" + VH;

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: VW, height: VH }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
  await p.addInitScript(() => { try { sessionStorage.setItem("vh-rot-ok", "1"); } catch (e) {} });
  const errs = []; p.on("pageerror", (e) => errs.push(e.message));
  const js = (f, a) => p.evaluate(f, a), wait = (ms) => p.waitForTimeout(ms);
  const until = async (f, ms) => { const t = Date.now(); while (Date.now() - t < ms) { if (await js(f)) return true; await wait(500); } return false; };
  const shot = async (n) => { await p.screenshot({ path: path.join(SHOTS, TAG + "-" + n + "-" + vp + ".png"), timeout: 120000 }).catch((e) => console.log("skip " + n + ": " + String(e.message).split("\n")[0])); console.log("shot " + n); };
  await p.goto(URL); await wait(4000);
  await p.click("#fd-tap"); await wait(800); await p.click("#tnew"); await wait(900);
  for (let i = 0; i < 3; i++) { await p.click("#fd-next"); await wait(400); }
  await until(() => !!document.getElementById("fd-intro"), 8000); await js(() => VHFD._skip()); await wait(1500);
  await js(() => { for (let i = 0; i < 12 && __vh.sheet(); i++) { const b = document.querySelector("[data-act=tutdone]") || document.querySelector("#sbody button.solid") || document.querySelector("#sx:not([hidden])"); if (!b) break; b.click(); } });
  await until(() => !!(__vh.area3d() && __vh.area3d().ready && __vh.AR() && __vh.AR().id === "ashford"), 40000);
  await js(() => __vh.area3d().goTo("mara")); await wait(3500);
  // tap the hearts corner: the objective tracker comes back
  await js(() => document.getElementById("ahearts").dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }))); await wait(600);
  await shot("walk");
  // a few seconds on, the objective tracker has faded
  await wait(6000); await shot("walk-settled");
  const mb = await js(() => !!document.querySelector("#vh3d .v3-menu"));
  if (mb) { await js(() => document.querySelector("#vh3d .v3-menu").click()); await wait(700); await shot("menu"); await js(() => document.querySelector("#vh3d .v3-menu").click()); await wait(500); }
  if (!process.env.NOBATTLE) {
    await js(() => { const b = document.querySelector("[data-act=aleave]"); if (b) b.click(); }); await until(() => !__vh.AR(), 15000);
    await js(() => { __vh.give(30); return __vh.battleWith(16, "bandit"); }); await wait(500); await js(() => __vh.startFight());
    await until(() => !!(__vh.scene() && __vh.scene().ctl && __vh.scene().ctl.ready), 40000); await wait(3000);
    await shot("battle");
    if (mb) { await js(() => document.querySelector("#vh3d .v3-menu").click()); await wait(700); await shot("battle-menu"); await js(() => document.querySelector("#vh3d .v3-menu").click()); }
    await js(() => __vh.scene() && __vh.scene().ctl.fast(12)); await until(() => !__vh.scene(), 200000);
    await js(() => { const d = document.querySelector("#sbody [data-act=done]"); if (d) d.click(); }); await wait(800);
    await js(() => __vh.battleWith(26)); await wait(500); await js(() => __vh.startFight({ siege: true, defend: false }));
    await until(() => !!(__vh.scene() && __vh.scene().ctl && __vh.scene().ctl.ready), 40000); await wait(3000);
    await shot("siege");
  }
  console.log(errs.length ? "errors: " + errs.join(" | ") : "no page errors");
  await b.close();
})().catch((e) => { console.error(e); process.exit(2); });
