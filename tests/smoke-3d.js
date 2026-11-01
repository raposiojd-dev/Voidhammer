// Smoke test for the third-person scenes and the map.
// Serve the repo root (python3 -m http.server 8765), then: node tests/smoke-3d.js
// The scene handle is filled in once the rigged people load, so waits check ctl.ready.
// Env: URL (default http://localhost:8765/index.html), SHOTS (folder for screenshots, optional), PW (path to playwright),
//      VP=phone runs at 390x844 with touch (Low graphics), as on an iPhone.
const { chromium } = require(process.env.PW || "playwright");
const path = require("path");
const URL = process.env.URL || "http://localhost:8765/index.html";
const SHOTS = process.env.SHOTS || "";
let fails = 0;
const ok = (c, m) => { console.log((c ? "PASS " : "FAIL ") + m); if (!c) fails++; };

(async () => {
  const b = await chromium.launch();
  const phone = process.env.VP === "phone", VW = phone ? 390 : 1280, VH = phone ? 844 : 720;
  const p = await b.newPage(phone ? { viewport: { width: VW, height: VH }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 } : { viewport: { width: VW, height: VH } });
  const errs = [];
  p.on("pageerror", (e) => errs.push("pageerror: " + e.message));
  p.on("console", (m) => { if (m.type() === "error") errs.push("console: " + m.text()); });
  const shot = async (n) => { if (SHOTS) await p.screenshot({ path: path.join(SHOTS, n) }); };
  const js = (f, a) => p.evaluate(f, a);
  const wait = (ms) => p.waitForTimeout(ms);
  const until = async (f, ms, step) => { const t = Date.now(); while (Date.now() - t < ms) { if (await js(f)) return true; await wait(step || 500); } return false; };

  await p.goto(URL); await wait(4000);
  // new game: three childhood steps, the summary, then the banner sheet
  await p.click("#tnew"); await wait(600);
  for (let i = 0; i < 3; i++) { await p.click(".mkcard >> nth=0"); await p.click("#mknext"); }
  await wait(300); await p.click("#csgo"); await wait(600); await p.click("[data-act=startnew]"); await wait(2500);
  ok(await js(() => !!(window.__vh && window.__vh.S())), "new game started");
  // close the intro and skip the tutorial
  await js(() => { for (let i = 0; i < 12 && __vh.sheet(); i++) { const b = document.querySelector("[data-act=tutdone]") || document.querySelector("#sbody button.solid") || document.querySelector("#sx:not([hidden])"); if (!b) break; b.click(); } });
  await wait(1500);
  // ---- v2 stage 1: the opening is Ashford in 3D, with its people, quest markers and dialogue ----
  const a3 = () => __vh.area3d() && __vh.area3d().ready && __vh.area3d().state();
  ok(await until(() => !!(__vh.area3d() && __vh.area3d().ready && __vh.AR() && __vh.AR().id === "ashford"), 30000), "new game opens in 3D Ashford");
  ok(await js(() => __vh.a3on() && getComputedStyle(document.getElementById("acv")).visibility === "hidden" && !!document.querySelector("#area #vh3d canvas")), "2D area view hidden, 3D canvas inside the area");
  await wait(2500);
  await shot("10-ashford-3d.png");
  const s0 = await js(a3);
  ok(s0.npcs >= 6 && s0.marks >= 1, "Ashford's people stand in 3D with quest markers (" + s0.npcs + " people, " + s0.marks + " markers)");
  ok(s0.beacon === true, "objective beacon shows the way");
  await js(() => __vh.area3d().goTo("mara")); await wait(1500);
  ok(/Talk\|Elder Mara/.test((await js(a3)).use), "the big Use button offers Talk · Elder Mara");
  await shot("11-ashford-mara.png");
  await p.keyboard.press("e"); await wait(1200);
  ok(await js(() => __vh.dlg() === "mara_1" && !document.getElementById("adlg").hidden), "E opens Mara's dialogue (dlgOpen)");
  await shot("12-ashford-dialogue.png");
  await js(() => { const b = document.querySelector("#adlg [data-act=adc]"); if (b) b.click(); }); await wait(600);
  for (let i = 0; i < 6 && await js(() => !!__vh.dlg()); i++) { await js(() => { const b = document.querySelector("#adlg [data-act=adc]"); if (b) b.click(); }); await wait(400); }
  ok(await js(() => !!__vh.cp().f.q1 && !__vh.dlg()), "the first quest is taken (flag q1 set by the same dialogue)");
  // the road: a combat area, struck from 3D
  await js(() => __vh.startArea("millroad"));
  ok(await until(() => !!(__vh.area3d() && __vh.area3d().ready && __vh.AR().id === "millroad"), 30000), "Millbrook Road opens in 3D");
  await js(() => { const A = __vh.AR(), e = A.en.find((q) => !q.dead); A.p.x = e.x - 18; A.p.y = e.y; }); await wait(1500);
  const hp0 = await js(() => __vh.AR().en.reduce((a, e) => a + Math.max(0, e.hp), 0));
  for (let i = 0; i < 5; i++) { await js(() => { const A = __vh.AR(), e = A.en.find((q) => !q.dead && !q.gone); if (e) { A.p.x = e.x - 14; A.p.y = e.y + 1; } }); await p.keyboard.press(" "); await wait(450); }
  const hp1 = await js(() => __vh.AR().en.reduce((a, e) => a + Math.max(0, e.hp), 0));
  ok(hp1 < hp0 && (await js(a3)).foes > 0, "bandits stand in 3D and Strike hurts them (" + hp0.toFixed(1) + " -> " + hp1.toFixed(1) + ")");
  await shot("13-road-fight.png");
  // a town area: its houses open the settlement sheet; Esc closes it, Esc again leaves for the map
  const tid = await js(() => { const s = __vh.S().sites.find((q) => q.type === "town" && q.owner !== "metal" && !["emberfall", "highmarch", "luminant"].includes(q.id)); return s && s.id; });
  await js((v) => __vh.startArea("g:" + v), tid); await wait(800);
  ok(await until(() => !!(__vh.area3d() && __vh.area3d().ready && __vh.AR().id.indexOf("g:") === 0), 30000), "town area opens in 3D (" + tid + ")");
  const st1 = await js(a3);
  ok(st1.doors >= 2, "town houses are doors into the menus (" + st1.doors + ")");
  await js(() => __vh.area3d().goTo("tavern") || __vh.area3d().goTo("market") || __vh.area3d().goTo("smith")); await wait(1500);
  await shot("14-town-3d.png");
  await p.keyboard.press("e"); await wait(1000);
  ok(await js(() => __vh.sheet() && __vh.sheet().kind === "site"), "Go in opens the settlement sheet over the 3D town");
  await p.keyboard.press("Escape"); await wait(600);
  ok(await js(() => !__vh.sheet() && !!__vh.AR()), "Esc closes the sheet, still in the town");
  // every village, town and castle has a quest giver with "!"; no settlement scene has a cave door; caves are map targets
  const qg = await js(() => { const out = { n: 0, miss: [] }; __vh.S().sites.forEach((s) => { const sp = __vh.spec("g:" + s.id); if (!sp) return; out.n++; const g = (sp.npcs || []).find((n) => n.id === "vqg"); if (!g || g.mk() !== 1) out.miss.push(s.id); }); return out; });
  ok(qg.n > 5 && qg.miss.length === 0, "every settlement has a local quest giver marked ! (" + qg.n + " settlements" + (qg.miss.length ? ", missing: " + qg.miss.join(",") : "") + ")");
  // build each hub and a village and look for cave doors (the filter runs when the area is built)
  const caveDoors = [];
  for (const id of ["highmarch", "emberfall", "g:" + (await js(() => __vh.S().sites.find((q) => q.type === "village" && q.id !== "ashford" && q.owner !== "metal").id))]) {
    await js((i) => __vh.startArea(i), id); await wait(300);
    const n = await js(() => (__vh.AR().sp.exits || []).filter((e) => __vh.caveTo(e)).length);
    if (n) caveDoors.push(id);
  }
  ok(caveDoors.length === 0, "no cave entrance inside a settlement scene" + (caveDoors.length ? ": " + caveDoors.join(",") : ""));
  ok((await js(() => __vh.caves().length)) > 0, "caves are their own targets on the world map (" + (await js(() => __vh.caves().map((c) => c.name).join(", "))) + ")");
  const vid = await js(() => __vh.AR().id);
  ok(await until(() => !!(__vh.area3d() && __vh.area3d().ready && __vh.AR().id.indexOf("g:") === 0), 30000), "village area opens in 3D (" + vid + ")");
  await js(() => __vh.area3d().goTo("vqg")); await wait(3000);
  const vs = await js(a3);
  ok(vs.marks >= 1 && /Talk\|(Reeve|Castellan|Watch Captain)/.test(vs.use), "the village quest giver stands in 3D with a ! (" + vs.use + ")");
  await shot("17-village-quest-giver.png");
  await p.keyboard.press("e"); await wait(1000);
  ok(await js(() => /^vhq:/.test(__vh.dlg() || "") && document.querySelectorAll("#adlg [data-act=adc]").length >= 2), "the quest giver offers the local jobs");
  await shot("18-village-quest-dialogue.png");
  await js(() => { const bs = document.querySelectorAll("#adlg [data-act=adc]"); bs[bs.length - 1].click(); }); await wait(500);
  // a cave and the overland walk build too
  await js(() => __vh.startArea("cave0")); await wait(800);
  ok(await until(() => !!(__vh.area3d() && __vh.area3d().ready && __vh.AR().id === "cave0"), 30000), "a cave opens in 3D");
  await wait(1500); await shot("15-cave-3d.png");
  await p.keyboard.press("Escape");
  ok(await until(() => !__vh.AR() && !__vh.area3d(), 15000), "Esc leaves the area and the 3D view is removed");
  await js(() => window.__walk());
  ok(await until(() => !!(__vh.area3d() && __vh.area3d().ready && __vh.AR() && __vh.AR().sp.over), 40000), "the overland walk opens in 3D");
  await wait(2000); await shot("16-overland-3d.png");
  await js(() => { const b = document.querySelector("[data-act=aleave]"); if (b) b.click(); });
  await until(() => !__vh.AR() && !__vh.area3d(), 15000);
  await js(() => __vh.startArea("ashford")); await until(() => !!(__vh.area3d() && __vh.area3d().ready), 30000);
  // leave the opening area for the world map
  await js(() => { const bs = [...document.querySelectorAll("button")].filter((x) => x.offsetParent && x.textContent.trim() === "Map"); if (bs[0]) bs[0].click(); });
  await wait(2500);
  await shot("01-map.png");

  // the settlement sheet offers the walk
  await js(() => { __vh.pref.walk = false; });
  await js(() => { const s = __vh.site("emberfall"); const S = __vh.S(); S.px = s.x; S.py = s.y; });
  await wait(600);
  await js(() => { const b = document.createElement("button"); b.setAttribute("data-act", "enter"); b.setAttribute("data-a", "emberfall"); document.body.appendChild(b); b.click(); b.remove(); });
  await wait(800);
  ok(await js(() => !!document.querySelector("#sbody [data-act=vh3dwalk]")), "settlement sheet shows Walk the streets");
  await shot("02-site-sheet.png");
  await p.click("#sbody [data-act=vh3dwalk]");
  ok(await until(() => !!(__vh.scene() && __vh.scene().ctl && __vh.scene().ctl.ready !== false), 15000), "town walk scene opened");
  await wait(2500);
  await shot("03-town-walk.png");
  // walk forward a little with the keyboard
  const z0 = await js(() => __vh.scene().ctl.me.position.z);
  await p.keyboard.down("w"); await wait(2500); await p.keyboard.up("w");
  const z1 = await js(() => __vh.scene().ctl.me.position.z);
  ok(z1 < z0 - 0.05, "player walks forward with W (" + z0.toFixed(2) + " -> " + z1.toFixed(2) + ")");
  // go to the market and press E: the existing site sheet opens at its Market section
  await js(() => __vh.scene().ctl.goTo("market")); await wait(1500);
  ok(await js(() => __vh.scene().ctl.near() === "market"), "standing at the market");
  await shot("04-town-market.png");
  await p.keyboard.press("e"); await wait(1200);
  ok(await js(() => __vh.sheet() && __vh.sheet().kind === "site" && __vh.sheet().id === "emberfall"), "E opens the Emberfall sheet");
  ok(await js(() => { const b = document.getElementById("sbody"); if (b.scrollTop > 0) return true; const h = [...b.querySelectorAll(".sec")].find((x) => /^(Market|Grain|Trade)/.test(x.textContent)); if (!h) return false; const r = h.getBoundingClientRect(); return r.top >= 0 && r.top < innerHeight; }), "sheet shows the market section");
  await p.keyboard.press("Escape"); await wait(800);
  ok(await js(() => !__vh.sheet() && !!__vh.scene()), "Esc closes the menu, still walking");
  await p.keyboard.press("Escape");
  ok(await until(() => !__vh.scene() && !document.getElementById("vh3d"), 15000), "Esc again returns to the map and the scene is removed");
  // a village and a castle build without errors
  for (const id of ["ashford", "keep"]) {
    const started = await js((i) => __vh.startWalk(i), id);
    ok(started && await until(() => !!(__vh.scene() && __vh.scene().ctl && __vh.scene().ctl.ready !== false), 15000), "walk opens at " + id);
    await wait(1500); if (id === "ashford") await shot("05-village-walk.png");
    await p.keyboard.press("Escape"); await until(() => !__vh.scene(), 15000);
  }

  // battle: fight in person to the end, and check finishBattle ran
  const before = await js(() => { __vh.give(30); return { T: __vh.T(), c: __vh.S().crowns, xp: __vh.S().xp }; });
  ok(await js(() => __vh.battleWith(14)), "battle started");
  await wait(600);
  ok(await js(() => !!document.querySelector("#sbody [data-act=vh3dfight]")), "battle sheet offers Fight in person");
  await shot("06-battle-sheet.png");
  await p.click("#sbody [data-act=vh3dfight]");
  ok(await until(() => !!(__vh.scene() && __vh.scene().ctl && __vh.scene().ctl.ready !== false), 15000), "3D battle opened");
  await wait(2500);
  await shot("07-battle-lines.png");
  await p.keyboard.press("c"); await wait(400);
  await p.mouse.click(VW / 2, VH / 2); await wait(300);
  await js(() => __vh.scene().ctl.fast(3));
  await until(() => !__vh.scene() || __vh.scene().ctl.state().eW < 0.85, 60000, 500);
  await shot("08-battle-melee.png");
  await js(() => __vh.scene() && __vh.scene().ctl.fast(10));
  ok(await until(() => !__vh.scene(), 150000, 1000), "battle finished and the scene closed");
  const after = await js(() => ({ stage: __vh.B() && __vh.B().stage, won: __vh.B() && __vh.B().won, T: __vh.T(), c: __vh.S().crowns, xp: __vh.S().xp, out: __vh.B() && __vh.B().out }));
  ok(after.stage === "result", "finishBattle ran (stage " + after.stage + ", won " + after.won + ")");
  ok(after.c !== before.c || after.xp !== before.xp || after.T !== before.T, "troops/crowns/xp changed: T " + before.T + "->" + after.T + ", crowns " + before.c + "->" + after.c + ", xp " + before.xp + "->" + after.xp);
  console.log("  result: " + (after.out || []).join(" "));
  await shot("09-battle-result.png");
  await js(() => { const d = document.querySelector("#sbody [data-act=done]"); if (d) d.click(); });
  await wait(800);
  // auto-resolve still works
  ok(await js(() => __vh.battleWith(6)), "second battle started");
  await wait(500);
  await js(() => document.querySelector("#sbody [data-act=fight]").click());
  ok(await until(() => __vh.B() && __vh.B().stage === "result", 30000), "auto-resolve still reaches a result");
  await js(() => { const d = document.querySelector("#sbody [data-act=done]"); if (d) d.click(); });

  ok(errs.length === 0, "no console errors" + (errs.length ? ":\n  " + errs.join("\n  ") : ""));
  await b.close();
  console.log(fails ? fails + " FAILED" : "ALL PASSED");
  process.exit(fails ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(2); });
