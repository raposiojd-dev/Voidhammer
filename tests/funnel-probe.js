// Funnel links: "Read the book free" on the title, and the free chapter + Patreon links in the 3D pause menu and on the
// after-battle screen. Each opens a new tab with utm tags, never a popup inside the game, and the game keeps its place.
// Serve the repo, then: VPS=844x390 URL=http://localhost:8796/Voidhammer/index.html node tests/funnel-probe.js  (SHOTS=dir saves pictures)
const { chromium } = require(process.env.PW || "playwright");
const path = require("path");
const URL = process.env.URL || "http://localhost:8796/Voidhammer/index.html";
const [VW, VH] = (process.env.VPS || "844x390").split("x").map(Number);
let fails = 0; const ok = (c, m) => { console.log((c ? "PASS " : "FAIL ") + m); if (!c) fails++; };
const CH = /^https:\/\/voidhammersaga\.com\/chapter-one\?utm_source=game&utm_medium=/, PT = /^https:\/\/www\.patreon\.com\/voidhammerofficial\?utm_source=game&utm_medium=/;

(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: VW, height: VH }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
  // never leave the sandbox: the new tabs are counted, not loaded
  await ctx.route(/voidhammersaga\.com|patreon\.com/, (r) => r.fulfill({ status: 200, contentType: "text/html", body: "ok" }));
  const p = await ctx.newPage();
  await p.addInitScript(() => { try { sessionStorage.setItem("vh-rot-ok", "1"); } catch (e) {} });
  const errs = []; p.on("pageerror", (e) => errs.push(e.message));
  const js = (f, a) => p.evaluate(f, a), wait = (ms) => p.waitForTimeout(ms);
  const until = async (f, ms) => { const t = Date.now(); while (Date.now() - t < ms) { if (await js(f)) return true; await wait(400); } return false; };
  const shot = async (n) => { if (process.env.SHOTS) await p.screenshot({ path: path.join(process.env.SHOTS, "funnel-" + n + "-" + VW + "x" + VH + ".png"), timeout: 120000 }).catch(() => {}); };
  const links = (sel) => js((s) => [...document.querySelectorAll(s)].map((a) => { const r = a.getBoundingClientRect(); return { href: a.href, t: a.target, rel: a.rel, txt: a.textContent.trim(), w: r.width, h: r.height, l: r.left, r: r.right, top: r.top, b: r.bottom }; }), sel);
  const onScreen = (q) => q.w > 0 && q.l >= 0 && q.r <= VW + 0.5 && q.top >= 0 && q.b <= VH + 0.5;

  await p.goto(URL); await wait(4000);
  await p.click("#fd-tap"); await wait(2800);
  const t = await links(".fd-title .fd-read");
  ok(t.length === 1 && /Read the book free/.test(t[0].txt) && CH.test(t[0].href) && /utm_medium=title/.test(t[0].href) && t[0].t === "_blank" && /noopener/.test(t[0].rel), "title: Read the book free, new tab, utm title (" + (t[0] && t[0].href) + ")");
  ok(t.length === 1 && onScreen(t[0]) && t[0].h >= 44, "title: the link is on screen and 44px tall (" + (t[0] ? Math.round(t[0].w) + "x" + Math.round(t[0].h) : "") + ")");
  await shot("title");
  const [tab] = await Promise.all([ctx.waitForEvent("page", { timeout: 8000 }).catch(() => null), p.click(".fd-title .fd-read")]);
  ok(!!tab && CH.test(tab.url()), "title: tapping opens the chapter in a new tab");
  if (tab) await tab.close();
  ok(await js(() => !document.querySelector(".fd-modal") && !!document.getElementById("tnew").offsetParent), "title: no popup, the menu is still there");

  await p.click("#tnew"); await wait(900);
  for (let i = 0; i < 3; i++) { await p.click("#fd-next"); await wait(400); }
  await until(() => !!document.getElementById("fd-intro"), 8000); await js(() => VHFD._skip()); await wait(1500);
  await js(() => { for (let i = 0; i < 12 && __vh.sheet(); i++) { const b = document.querySelector("[data-act=tutdone]") || document.querySelector("#sbody button.solid") || document.querySelector("#sx:not([hidden])"); if (!b) break; b.click(); } });
  ok(await until(() => !!(__vh.area3d() && __vh.area3d().ready && __vh.AR() && __vh.AR().id === "ashford"), 60000), "Ashford opens in 3D");
  await wait(2000);
  ok((await links("#v3menu .vh-funnel a")).length === 0, "pause links stay inside the menu (none while playing)");
  await js(() => document.querySelector("#vh3d .v3-menu").click()); await wait(700);
  const m = await links("#v3menu.on .vh-funnel a");
  ok(m.length === 2 && CH.test(m[0].href) && /utm_medium=pause/.test(m[0].href) && /Chapter Two free/.test(m[0].txt) && PT.test(m[1].href) && /Patreon/.test(m[1].txt) && m.every((q) => q.t === "_blank"), "pause menu: chapter and Patreon links, new tab, utm pause");
  await js(() => { const s = document.querySelector("#v3menu .v3p-sheet"); s.scrollTop = s.scrollHeight; }); await wait(300);
  await shot("pause");
  const [tab2] = await Promise.all([ctx.waitForEvent("page", { timeout: 8000 }).catch(() => null), p.click("#v3menu.on .vh-funnel a >> nth=1")]);
  ok(!!tab2 && PT.test(tab2.url()), "pause menu: Patreon opens in a new tab");
  if (tab2) await tab2.close();
  ok(await js(() => !!__vh.AR() && !!document.querySelector("#v3menu.on")), "pause menu: still in Ashford, menu still open");
  await js(() => document.querySelector("#vh3d .v3-menu").click()); await wait(500);

  await js(() => { const b = document.querySelector("[data-act=aleave]"); if (b) b.click(); }); await until(() => !__vh.AR(), 15000);
  await js(() => { __vh.give(30); return __vh.battleWith(16, "bandit"); }); await wait(500); await js(() => __vh.startFight());
  ok(await until(() => !!(__vh.scene() && __vh.scene().ctl && __vh.scene().ctl.ready), 60000), "battle opens");
  await wait(1500);
  ok((await links("#sbody .vh-funnel a")).length === 0, "no funnel links during the fight");
  await js(() => __vh.scene() && __vh.scene().ctl.fast(12)); await until(() => !__vh.scene(), 240000);
  ok(await until(() => !!document.querySelector("#sbody .vh-funnel"), 10000), "after-battle screen shows the funnel");
  const v = await links("#sbody .vh-funnel a");
  ok(v.length === 2 && CH.test(v[0].href) && /utm_medium=(victory|after-battle)/.test(v[0].href) && PT.test(v[1].href) && v.every((q) => q.t === "_blank" && /noopener/.test(q.rel)), "after-battle: chapter + Patreon links, new tab (" + (v[0] && v[0].href) + ")");
  ok(await js(() => { const d = document.querySelector("#sbody [data-act=done]"), f = document.querySelector("#sbody .vh-funnel"); return !!d && !!f && (d.compareDocumentPosition(f) & Node.DOCUMENT_POSITION_FOLLOWING) > 0; }), "after-battle: Continue comes first, the links sit under it");
  await js(() => { const f = document.querySelector("#sbody .vh-funnel"); f.scrollIntoView({ block: "end" }); }); await wait(300);
  await shot("after-battle");
  const [tab3] = await Promise.all([ctx.waitForEvent("page", { timeout: 8000 }).catch(() => null), js(() => document.querySelector("#sbody .vh-funnel a").click())]);
  ok(!!tab3 && CH.test(tab3.url()), "after-battle: the chapter opens in a new tab");
  if (tab3) await tab3.close();
  ok(await js(() => __vh.sheet() && __vh.sheet().kind === "battle" && !!document.querySelector("#sbody [data-act=done]")), "after-battle: the result screen stays put");
  ok(errs.length === 0, "no page errors" + (errs.length ? ": " + errs.join(" | ") : ""));
  console.log(fails ? fails + " FAILED" : "ALL PASS"); await b.close(); process.exit(fails ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(2); });
