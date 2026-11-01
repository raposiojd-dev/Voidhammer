// Screenshots for the detailed-models pass: Ashford walk, a village, a town, a 3D battle and a siege, at one graphics preset,
// plus a rough frame-time sample per scene (headless software GL, so compare runs relatively, not absolutely).
// Serve the repo root, then:
//   VPS=844x390 GFX=high TAG=after SHOTS=docs/screens/models-v1 URL=http://localhost:8795/Voidhammer/index.html node tests/models-shots.js
// Env: VPS (default 844x390), GFX (low | medium | high, default high), TAG (filename prefix), ONLY (comma list of scenes),
//      NOSHOT=1 (frame times only), PW (path to playwright).
const { chromium } = require(process.env.PW || "playwright");
const path = require("path");
const URL = process.env.URL || "http://localhost:8795/Voidhammer/index.html";
const SHOTS = process.env.SHOTS || "docs/screens/models-v1";
const TAG = process.env.TAG || "after", GFX = process.env.GFX || "high";
const [VW, VH] = (process.env.VPS || "844x390").split("x").map(Number);
const ONLY = process.env.ONLY ? process.env.ONLY.split(",") : null, want = (k) => !ONLY || ONLY.includes(k);
const vp = VW + "x" + VH;

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: VW, height: VH }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
  await p.addInitScript((g) => { try { sessionStorage.setItem("vh-rot-ok", "1"); localStorage.setItem("vh3d-gfx", g); } catch (e) {} }, GFX);
  const errs = []; p.on("pageerror", (e) => errs.push(e.message));
  const js = (f, a) => p.evaluate(f, a), wait = (ms) => p.waitForTimeout(ms);
  const until = async (f, ms) => { const t = Date.now(); while (Date.now() - t < ms) { if (await js(f)) return true; await wait(500); } return false; };
  const shot = async (n) => { if (process.env.NOSHOT) return; await p.screenshot({ path: path.join(SHOTS, TAG + "-" + GFX + "-" + n + "-" + vp + ".png"), timeout: 400000 }).catch((e) => console.log("skip " + n + ": " + String(e.message).split("\n")[0])); console.log("shot " + n); };
  // frame time: rAF intervals over a few seconds (the scene keeps running), median and 90th percentile
  const ft = async (n) => {
    const r = await js(() => new Promise((res) => { const d = []; let last = 0, t0 = performance.now(); const f = (t) => { if (last) d.push(t - last); last = t; if (t - t0 < 6000) requestAnimationFrame(f); else { d.sort((a, b) => a - b); res({ n: d.length, med: d[d.length >> 1], p90: d[Math.floor(d.length * 0.9)] }); } }; requestAnimationFrame(f); }));
    const info = await js(() => new Promise((res) => { const r = window.__vh3dRenderer; if (!r || !r.info) { res({}); return; } r.info.autoReset = false; requestAnimationFrame(() => { r.info.reset(); requestAnimationFrame(() => { const o = { calls: r.info.render.calls, tris: r.info.render.triangles }; r.info.autoReset = true; res(o); }); }); }));
    if (process.env.STATS) console.log("  top meshes: " + JSON.stringify(await js(() => { const r = window.__vh3dRenderer, out = {}; const sc = window.__vh3dScene; if (!sc) return {}; sc.traverseVisible((o) => { if (!o.isMesh) return; const g = o.geometry, t = (g.index ? g.index.count : g.attributes.position.count) / 3, n = o.isInstancedMesh ? o.count : 1, k = (o.isInstancedMesh ? "I:" : "") + (g.type || "g") + "/" + Math.round(t); out[k] = (out[k] || 0) + t * n; }); return Object.entries(out).sort((a, b) => b[1] - a[1]).slice(0, 12).map((e) => e[0] + "=" + Math.round(e[1] / 1000) + "k"); })));
    console.log("frame " + GFX + " " + n + " " + vp + ": median " + r.med.toFixed(1) + " ms, p90 " + r.p90.toFixed(1) + " ms over " + r.n + " frames" + (info.calls !== undefined ? ", " + info.calls + " draws, " + info.tris + " tris" : ""));
  };
  await p.goto(URL); await wait(4000);
  await p.click("#fd-tap"); await wait(800); await p.click("#tnew"); await wait(900);
  for (let i = 0; i < 3; i++) { await p.click("#fd-next"); await wait(400); }
  await until(() => !!document.getElementById("fd-intro"), 8000); await js(() => VHFD._skip()); await wait(1500);
  await js(() => { for (let i = 0; i < 12 && __vh.sheet(); i++) { const b = document.querySelector("[data-act=tutdone]") || document.querySelector("#sbody button.solid") || document.querySelector("#sx:not([hidden])"); if (!b) break; b.click(); } });
  await until(() => !!(__vh.area3d() && __vh.area3d().ready && __vh.AR() && __vh.AR().id === "ashford"), 60000);
  if (want("walk")) { await js(() => __vh.area3d().goTo("mara")); await wait(4000); await shot("walk"); await ft("walk"); }
  if (want("village")) {
    const vid = await js(() => { const s = __vh.S().sites.find((q) => q.type === "village" && q.id !== "ashford" && q.owner !== "metal"); return s && s.id; });
    await js((v) => __vh.startArea("g:" + v), vid); await wait(500); await until(() => !!(__vh.area3d() && __vh.area3d().ready && __vh.AR() && __vh.AR().id.indexOf("g:") === 0), 60000);
    await js(() => __vh.area3d().goTo("vqg")); await wait(4000); await shot("village"); await ft("village");
  }
  if (want("town")) {
    const tid = await js(() => { const s = __vh.S().sites.find((q) => q.type === "town" && q.owner !== "metal" && !["emberfall", "highmarch", "luminant"].includes(q.id)); return s && s.id; });
    await js((v) => __vh.startArea("g:" + v), tid); await wait(500); await until(() => !!(__vh.area3d() && __vh.area3d().ready && __vh.AR() && __vh.AR().id.indexOf("g:") === 0 && __vh.area3d().state().frames > 2), 60000);
    await js(() => __vh.area3d().goTo("tavern") || __vh.area3d().goTo("market") || __vh.area3d().goTo("smith")); await wait(4000); await shot("town"); await ft("town");
  }
  if (want("battle") || want("siege")) {
    await js(() => { const b = document.querySelector("[data-act=aleave]"); if (b) b.click(); else __vh.area3d() && __vh.area3d().stop && __vh.area3d().stop(); }); await until(() => !__vh.AR(), 15000);
  }
  if (want("battle")) {
    await js(() => { __vh.give(30); return __vh.battleWith(16, "bandit"); }); await wait(500); await js(() => __vh.startFight());
    await until(() => !!(__vh.scene() && __vh.scene().ctl && __vh.scene().ctl.ready), 60000); await wait(4000);
    await shot("battle"); await ft("battle");
    await js(() => __vh.scene() && __vh.scene().ctl.fast(12)); await until(() => !__vh.scene(), 240000);
    await js(() => { const d = document.querySelector("#sbody [data-act=done]"); if (d) d.click(); }); await wait(800);
  }
  if (want("siege")) {
    await js(() => __vh.battleWith(26)); await wait(500); await js(() => __vh.startFight({ siege: true, defend: false }));
    await until(() => !!(__vh.scene() && __vh.scene().ctl && __vh.scene().ctl.ready), 60000); await wait(4000);
    await shot("siege"); await ft("siege");
  }
  console.log(errs.length ? "errors: " + errs.join(" | ") : "no page errors");
  await b.close();
})().catch((e) => { console.error(e); process.exit(2); });
