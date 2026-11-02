// Premium Phase 2 screenshots: the world map, a settlement sheet, a 3D battle and its result card.
// Serve the repo root, then: VPS=390x844 TAG=after URL=http://localhost:8796/Voidhammer/index.html node tests/p2-shots.js
// Env: VPS (default 390x844), TAG (filename prefix, default "after"), SHOTS (default docs/screens/premium-p2), NOBATTLE=1, PW.
const { chromium } = require(process.env.PW || "playwright");
const path = require("path");
const URL = process.env.URL || "http://localhost:8796/Voidhammer/index.html";
const SHOTS = process.env.SHOTS || "docs/screens/premium-p2";
const TAG = process.env.TAG || "after";
const [VW, VH] = (process.env.VPS || "390x844").split("x").map(Number);
const vp = VW + "x" + VH;
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: VW, height: VH }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
  await p.addInitScript(() => { try { sessionStorage.setItem("vh-rot-ok", "1"); } catch (e) {} });
  const errs = []; p.on("pageerror", (e) => errs.push(e.message));
  const js = (f, a) => p.evaluate(f, a), wait = (ms) => p.waitForTimeout(ms);
  const until = async (f, ms) => { const t = Date.now(); while (Date.now() - t < ms) { if (await js(f)) return true; await wait(400); } return false; };
  const shot = async (n) => { await p.screenshot({ path: path.join(SHOTS, TAG + "-" + n + "-" + vp + ".png"), timeout: 120000 }).catch((e) => console.log("skip " + n + ": " + String(e.message).split("\n")[0])); console.log("shot " + n); };
  await p.goto(URL); await wait(4000);
  await p.click("#fd-tap"); await wait(800); await p.click("#tnew"); await wait(900);
  // pick Stormreach so the Realm tint is easy to see
  await p.click('.fd-chip-realm[data-realm="storm"]').catch(() => {}); await wait(300);
  for (let i = 0; i < 3; i++) { await p.click("#fd-next"); await wait(400); }
  await until(() => !!document.getElementById("fd-intro"), 8000); await js(() => VHFD._skip()); await wait(1500);
  await js(() => { for (let i = 0; i < 12 && __vh.sheet(); i++) { const b = document.querySelector("[data-act=tutdone]") || document.querySelector("#sbody button.solid") || document.querySelector("#sx:not([hidden])"); if (!b) break; b.click(); } });
  await until(() => !!(__vh.area3d() && __vh.area3d().ready && __vh.AR() && __vh.AR().id === "ashford"), 60000); await wait(2500);
  await shot("walk");
  await js(() => { const b = document.querySelector("[data-act=aleave]"); if (b) b.click(); }); await until(() => !__vh.AR(), 15000);
  await js(() => { for (let i = 0; i < 6 && __vh.sheet(); i++) { const x = document.querySelector("#sx:not([hidden])"); if (!x) break; x.click(); } }); await wait(2500);
  await shot("map");
  // a settlement sheet: the nearest town
  await js(() => { const S = __vh.S(); const t = S.sites.filter((s) => s.type === "town").sort((a, c) => Math.hypot(a.x - S.px, a.y - S.py) - Math.hypot(c.x - S.px, c.y - S.py))[0]; if (window.VHP2 && VHP2.focus) VHP2.focus(t); window.__shotSite = t.id; }); await wait(1200);
  await shot("map-focus");
  await js(() => { try { __vh.openSheet ? __vh.openSheet("site", window.__shotSite) : openSheet("site", window.__shotSite); } catch (e) { console.log(e.message); } }); await wait(1200);
  await shot("town");
  await js(() => { const x = document.querySelector("#sx:not([hidden])"); if (x) x.click(); }); await wait(700);
  if (!process.env.NOBATTLE) {
    await js(() => { __vh.give(30); return __vh.battleWith(16, "bandit"); }); await wait(500); await js(() => __vh.startFight());
    await until(() => !!(__vh.scene() && __vh.scene().ctl && __vh.scene().ctl.ready), 60000); await wait(3000);
    await shot("battle");
    // the stinger: end the fight here so the "They break!" card is on screen for the picture
    await js(() => __vh.scene().ctl._finish("win")); await wait(1100);
    await shot("stinger"); await until(() => !__vh.scene(), 240000); await wait(1800);
    await shot("result");
  }
  console.log(errs.length ? "errors: " + errs.join(" | ") : "no page errors");
  await b.close();
})().catch((e) => { console.error(e); process.exit(2); });
