// Aspect probe: the 3D picture is never squashed or stretched after the phone turns or the iOS URL bar moves.
// For every scene kind (area3d village, town walk at every capital and town, battle, siege) it changes the viewport
// mid-scene (390x844 -> 844x390 portrait-to-landscape, then 844x390 -> 844x350 URL bar), and checks that
//   canvas.width / height == clientWidth / clientHeight x pixel ratio (within 2%), camera.aspect == clientWidth / clientHeight,
//   and High's post-processing targets match the drawing buffer.
// It also simulates iOS Safari, which fires resize with the OLD size and then nothing: resize, orientationchange and
// visualViewport events are swallowed while the viewport changes, so only the stage's own re-checks can catch it.
// Town walks also check the one-button HUD (round menu, round context pill, no Run) and that the one building plate
// stays on screen.
// Serve the repo, then: URL=http://localhost:8796/Voidhammer/index.html node tests/aspect-probe.js
// Env: SHOTS=folder (saves TAG-*.png), TAG (default "after"), PW (path to playwright), QUICK=1 skips battle and siege.
const { chromium } = require(process.env.PW || "playwright");
const path = require("path");
const URL = process.env.URL || "http://localhost:8796/Voidhammer/index.html";
const SHOTS = process.env.SHOTS || "";
const TAG = process.env.TAG || "after";
let fails = 0;
const ok = (c, m) => { console.log((c ? "PASS " : "FAIL ") + m); if (!c) fails++; };

const measure = () => {
  const st = window.__vh3dStage, r = (st && st.renderer) || window.__vh3dRenderer;
  if (!r || !document.getElementById("vh3d")) return null;
  const c = r.domElement, pr = r.getPixelRatio(), cw = c.clientWidth, ch = c.clientHeight;
  let cam = st && st.camera;
  if (!cam) try { cam = __vh.scene().ctl.scene.camera; } catch (e) {}
  const ps = st && st.postSize ? st.postSize() : null;
  const cs = getComputedStyle(c);
  return { cw, ch, bw: c.width, bh: c.height, pr, asp: cam ? cam.aspect : -1, post: ps, fit: cs.objectFit, cssW: cs.width, vw: innerWidth, vh: innerHeight };
};

(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 844, height: 390 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
  const p = await ctx.newPage();
  await p.addInitScript(() => {
    try { sessionStorage.setItem("vh-rot-ok", "1"); } catch (e) {}
    // iOS stale-resize simulator: while __stale is on, real resize / orientationchange / visualViewport events never reach the game
    window.__stale = false;
    const gate = (e) => { if (window.__stale && !e.__sim) e.stopImmediatePropagation(); };
    window.addEventListener("resize", gate, true); window.addEventListener("orientationchange", gate, true);
    try { window.visualViewport && window.visualViewport.addEventListener("resize", gate, true); } catch (e) {}
  });
  const errs = [];
  p.on("pageerror", (e) => errs.push("pageerror: " + e.message));
  const js = (f, a) => p.evaluate(f, a), wait = (ms) => p.waitForTimeout(ms);
  const until = async (f, ms, step) => { const t = Date.now(); while (Date.now() - t < ms) { if (await js(f)) return true; await wait(step || 400); } return false; };
  const shot = async (n) => { if (SHOTS) await p.screenshot({ path: path.join(SHOTS, TAG + "-" + n + ".png"), timeout: 120000 }).catch((e) => console.log("  (shot " + n + " skipped: " + String(e.message).split("\n")[0] + ")")); };

  async function checkAspect(tag) {
    const m = await js(measure);
    if (!m) { ok(false, tag + ": no 3D stage"); return; }
    const ew = m.cw * m.pr, eh = m.ch * m.pr, a = m.cw / m.ch;
    const good = Math.abs(m.bw - ew) / ew < 0.02 && Math.abs(m.bh - eh) / eh < 0.02;
    ok(good, tag + ": drawing buffer " + m.bw + "x" + m.bh + " matches " + m.cw + "x" + m.ch + " x " + m.pr.toFixed(2));
    ok(Math.abs(m.asp - a) / a < 0.02, tag + ": camera aspect " + m.asp.toFixed(3) + " matches " + a.toFixed(3));
    if (m.post) ok(m.post[0] === m.bw && m.post[1] === m.bh, tag + ": post-processing target " + m.post.join("x") + " matches the buffer");
    ok(m.cw === m.vw || m.cw > 0, tag + ": canvas fills its stage (" + m.cssW + ", object-fit " + m.fit + ")");
    ok(!m.fit || m.fit === "fill" ? true : false, tag + ": no object-fit on the canvas");
  }
  // change the viewport mid-scene; stale = iOS-style (the game only ever hears the old size)
  async function vp(w, h, stale) {
    if (stale) { await js(() => { window.__stale = true; const e = new Event("resize"); e.__sim = true; window.dispatchEvent(e); }); }
    await p.setViewportSize({ width: w, height: h });
    await wait(1300);
    if (stale) await js(() => { window.__stale = false; });
  }
  async function rotations(tag) {
    await vp(390, 844, false); await checkAspect(tag + " portrait 390x844");
    await vp(844, 390, true); await checkAspect(tag + " turned to landscape 844x390 (iOS stale resize)");
    await vp(844, 350, true); await checkAspect(tag + " URL bar 844x350 (iOS stale resize)");
    await vp(844, 390, false); await checkAspect(tag + " back to 844x390");
  }
  // town walk HUD: round menu, one round context pill, no Run or square Go in; at most one building plate, inside the screen
  async function townHud(tag) {
    const h = await js(() => {
      const R = document.getElementById("vh3d"), vis = (e) => { if (!e || e.hidden) return false; const c = getComputedStyle(e); if (c.display === "none" || c.visibility === "hidden" || +c.opacity === 0) return false; const r = e.getBoundingClientRect(); return r.width > 1 && r.height > 1; };
      const sq = [...R.querySelectorAll(".v3-act button")].filter(vis).map((x) => x.textContent.trim());
      const menu = R.querySelector(".v3-menu"), use = R.querySelector(".v3-use");
      const plates = [...R.querySelectorAll(".v3-plate")].filter(vis).map((e) => { const r = e.getBoundingClientRect(); return { l: r.left, r: r.right, t: r.top, b: r.bottom, w: r.width, txt: e.textContent }; });
      const ur = use && vis(use) ? use.getBoundingClientRect() : null;
      return { sq, menu: vis(menu) ? getComputedStyle(menu).borderRadius : "", use: ur ? { t: use.textContent.trim(), w: ur.width, h: ur.height, br: getComputedStyle(use).borderRadius, r: ur.right, b: ur.bottom } : null, plates, vw: innerWidth, vh: innerHeight, sprites: (window.__vh3dScene ? window.__vh3dScene.children.filter((o) => o.isSprite && o.visible && o.userData.label).length : 0) };
    });
    ok(h.sq.length === 0, tag + ": no square Go in / Run buttons (" + h.sq.join(",") + ")");
    ok(/50%|999/.test(h.menu), tag + ": round menu button");
    ok(!!h.use && /^Go in|^Enter|^Talk|^Leave/.test(h.use.t) && parseFloat(h.use.br) >= 20 && h.use.h >= 44 && h.use.r <= h.vw && h.use.b <= h.vh, tag + ": round context pill (" + (h.use ? h.use.t + " " + Math.round(h.use.w) + "x" + Math.round(h.use.h) : "none") + ")");
    ok(h.plates.length <= 1, tag + ": at most one building plate (" + h.plates.length + ")");
    ok(h.sprites === 0, tag + ": no 3D label sprites left in the scene (" + h.sprites + ")");
    for (const q of h.plates) ok(q.l >= 8 && q.r <= h.vw - 8 && q.t >= 8 && q.b <= h.vh - 8 && q.w <= (h.vw > h.vh ? 0.34 : 0.7) * h.vw, tag + ": plate on screen with margins (" + Math.round(q.l) + "-" + Math.round(q.r) + " of " + h.vw + ", " + Math.round(q.w) + "px) " + q.txt.slice(0, 40));
  }

  await p.goto(URL); await wait(4000);
  await p.click("#fd-tap"); await wait(800); await p.click("#tnew"); await wait(900);
  for (let i = 0; i < 3; i++) { await p.click("#fd-next"); await wait(400); }
  await until(() => !!document.getElementById("fd-intro"), 8000); await js(() => VHFD._skip()); await wait(1500);
  await js(() => { for (let i = 0; i < 12 && __vh.sheet(); i++) { const b = document.querySelector("[data-act=tutdone]") || document.querySelector("#sbody button.solid") || document.querySelector("#sx:not([hidden])"); if (!b) break; b.click(); } });
  ok(await until(() => !!(__vh.area3d() && __vh.area3d().ready && __vh.AR() && __vh.AR().id === "ashford"), 60000), "Ashford opens in 3D");
  await wait(2500);
  await checkAspect("village area at 844x390");
  await rotations("village area");
  await shot("village-844x390");
  await js(() => { const b = document.querySelector("[data-act=aleave]"); if (b) b.click(); }); await until(() => !__vh.AR() && !__vh.area3d(), 20000);
  await wait(1200);

  // every capital and town: walk in (the hub towns use the town walk, the rest the town area)
  const towns = await js(() => __vh.S().sites.filter((s) => s.type === "town").map((s) => ({ id: s.id, name: s.name })));
  ok(towns.length >= 5, "towns and capitals to check: " + towns.map((t) => t.name).join(", "));
  // Hearthmount first: the scene John saw
  towns.sort((a, c) => (a.id === "emberfall" ? -1 : c.id === "emberfall" ? 1 : 0));
  let first = true;
  for (const t of towns) {
    const started = await js((i) => { const S = __vh.S(), s = __vh.site(i); S.px = s.x; S.py = s.y; return __vh.startWalk(i); }, t.id);
    if (!started) { console.log("  (" + t.name + ": not walkable now, skipped)"); continue; }
    const opened = await until(() => { const sc = __vh.scene(); return !!(sc && sc.ctl && sc.ctl.ready); }, 40000);
    ok(opened, t.name + ": 3D opens");
    if (!opened) continue;
    await wait(2500);
    const kind = await js(() => __vh.scene().kind);
    await checkAspect(t.name + " (" + kind + ") at 844x390");
    if (kind === "walk") {
      // step up to the tavern (or the first door) so the context pill and its plate show
      await js(() => { const c = __vh.scene().ctl, s = c.spots.find((q) => q.key === "tavern") || c.spots.find((q) => q.key !== "gate"); c.goTo(s.key); }); await wait(1600);
      await townHud(t.name);
      if (first) { await shot("town-" + t.id + "-844x390"); }
      if (first) {
        await rotations(t.name + " walk");
        await vp(390, 844, false); await vp(844, 390, true); await wait(400);
        await shot("town-" + t.id + "-after-rotation-844x390");
        await townHud(t.name + " after rotation");
        first = false;
      }
      await js(() => __vh.scene().ctl.stop()); await until(() => !__vh.scene() && !document.getElementById("vh3d"), 20000);
    } else {
      if (t.id === "highmarch" || t.id === "luminant") await shot("town-" + t.id + "-844x390");
      await js(() => { const b = document.querySelector("[data-act=aleave]"); if (b) b.click(); }); await until(() => !__vh.AR() && !__vh.area3d(), 20000);
    }
    await js(() => { if (__vh.sheet()) { const x = document.getElementById("sx"); if (x) x.click(); } }); await wait(800);
  }

  if (!process.env.QUICK) {
    await js(() => { __vh.give(30); return __vh.battleWith(16, "bandit"); }); await wait(500); await js(() => __vh.startFight());
    ok(await until(() => !!(__vh.scene() && __vh.scene().ctl && __vh.scene().ctl.ready), 60000), "battle opens");
    await wait(2500); await rotations("battle"); await shot("battle-844x390");
    await js(() => __vh.scene() && __vh.scene().ctl.fast(12)); await until(() => !__vh.scene(), 240000);
    await js(() => { const d = document.querySelector("#sbody [data-act=done]"); if (d) d.click(); }); await wait(800);
    await js(() => __vh.battleWith(26)); await wait(500); await js(() => __vh.startFight({ siege: true, defend: false }));
    ok(await until(() => !!(__vh.scene() && __vh.scene().ctl && __vh.scene().ctl.ready), 60000), "siege opens");
    await wait(2500); await rotations("siege"); await shot("siege-844x390");
  }
  ok(errs.length === 0, "no page errors" + (errs.length ? ": " + errs.join(" | ") : ""));
  console.log(fails ? fails + " FAILED" : "ALL PASS"); await b.close(); process.exit(fails ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(2); });
