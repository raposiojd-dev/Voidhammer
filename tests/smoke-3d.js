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
  // a phone held upright gets the "turn your phone sideways" card in 3D; this run plays upright anyway (tested on its own below)
  if (phone) await p.addInitScript(() => { try { sessionStorage.setItem("vh-rot-ok", "1"); } catch (e) {} });
  const errs = [];
  p.on("pageerror", (e) => errs.push("pageerror: " + e.message));
  p.on("console", (m) => { if (m.type() === "error") errs.push("console: " + m.text()); });
  // a screenshot that times out on a loaded machine is noted, not a failure
  const shot = async (n) => { if (SHOTS) await p.screenshot({ path: path.join(SHOTS, n), timeout: 120000 }).catch((e) => console.log("  (screenshot " + n + " skipped: " + String(e.message).split("\n")[0] + ")")); };
  const js = (f, a) => p.evaluate(f, a);
  const wait = (ms) => p.waitForTimeout(ms);
  const until = async (f, ms, step) => { const t = Date.now(); while (Date.now() - t < ms) { if (await js(f)) return true; await wait(step || 500); } return false; };

  await p.goto(URL); await wait(4000);
  // new game through the premium front door (premium/frontdoor.js): tap to begin, the three creator steps, skip the opening
  await p.click("#fd-tap"); await wait(800);
  await p.click("#tnew"); await wait(900);
  for (let i = 0; i < 3; i++) { await p.click("#fd-next"); await wait(400); }
  await until(() => !!document.getElementById("fd-intro"), 8000); await js(() => VHFD._skip()); await wait(1500);
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
  const pl = await js(() => { const r = [...document.querySelectorAll("#vh3d .v3-nm")].filter((e) => !e.hidden).map((e) => { const b = e.getBoundingClientRect(); return { t: e.textContent, l: b.left, r: b.right, tp: b.top, b: b.bottom, o: +e.style.opacity }; });
    const ov = r.some((a, i) => r.some((b, j) => j > i && a.l < b.r && a.r > b.l && a.tp < b.b && a.b > b.tp)); return { r, ov }; });
  ok(pl.r.length >= 1 && pl.r.length <= 3 && !pl.ov && pl.r.some((q) => q.t === "Elder Mara" && q.o === 1), "name plates: Elder Mara (the Talk target) at full strength, no plates overlapping (" + pl.r.map((q) => q.t).join(", ") + ")");
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
  await js(() => __vh.area3d().goTo("v1"));
  ok(await until(() => { const b = document.querySelector("#vh3d .v3-bark"); return !!b && !b.hidden && b.textContent.length > 5; }, 50000, 300), "a villager passing by speaks a Realm bark");
  await shot("19-village-bark.png");
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
  await js(() => { const m = document.querySelector("#vh3d .v3-menu"); if (m) m.click(); }); await wait(600); // the corner menu holds Map
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
  const before = await js(() => { __vh.give(30); const S = __vh.S(); S.vets = S.vets || {}; S.vets[30] = 6; S.gear.bows = Math.max(S.gear.bows || 0, 10); return { T: __vh.T(), c: __vh.S().crowns, xp: __vh.S().xp }; });
  ok(await js(() => __vh.battleWith(14)), "battle started");
  await wait(600);
  ok(await js(() => !!document.querySelector("#sbody [data-act=vh3dfight]") && !document.querySelector("#sbody [data-act=field]")), "battle sheet: Fight in person (3D) replaces the 2D field");
  await shot("06-battle-sheet.png");
  await p.click("#sbody [data-act=vh3dfight]");
  ok(await until(() => !!(__vh.scene() && __vh.scene().ctl && __vh.scene().ctl.ready !== false), 15000), "3D battle opened");
  await wait(2500);
  await shot("07-battle-lines.png");
  // ---- v2 stage 2: formations by troop type, orders, volleys, cavalry, morale, the hero under your thumb ----
  const bs0 = await js(() => __vh.scene().ctl.state());
  ok(bs0.groups.inf > 0 && bs0.groups.arch > 0 && bs0.groups.cav > 0, "troops stand by type: " + bs0.groups.inf + " infantry, " + bs0.groups.arch + " archers, " + bs0.groups.cav + " cavalry (enemy " + bs0.groups.earch + " archers, " + bs0.groups.ecav + " horse)");
  ok(bs0.NP + bs0.NE >= 40, "both armies on the field (" + bs0.NP + " v " + bs0.NE + ")");
  await p.keyboard.press("5"); await wait(500);
  ok((await js(() => __vh.scene().ctl.state().orders.inf)) === "wall", "5 orders the infantry into a shield wall");
  await p.keyboard.press("1"); await wait(500);
  ok((await js(() => __vh.scene().ctl.state().orders.arch)) === "follow", "1 orders Follow me");
  await p.click(".b3-ordbtn"); await wait(400);
  ok(await js(() => document.querySelector(".b3-fan").classList.contains("on") && document.querySelectorAll(".b3-fan [data-o]").length === 6), "the Orders button opens the thumb order fan (6 orders)");
  await shot("07b-battle-orders.png");
  await p.click(".b3-fan [data-o=advance]"); await wait(400);
  ok((await js(() => __vh.scene().ctl.state().orders.inf)) === "advance", "Advance from the fan");
  const hx0 = await js(() => __vh.scene().ctl.hero.z);
  await p.keyboard.down("w"); await wait(2000); await p.keyboard.up("w");
  ok((await js(() => __vh.scene().ctl.hero.z)) < hx0 - 0.1, "the hero moves under direct control (no auto-fight)");
  await js(() => __vh.scene().ctl.fast(3));
  let maxArrows = 0; for (let i = 0; i < 24 && maxArrows === 0; i++) { maxArrows = Math.max(maxArrows, await js(() => __vh.scene() ? __vh.scene().ctl.state().arrows : 0)); await wait(500); }
  ok(maxArrows > 0, "archers loose arcing volleys (" + maxArrows + " arrows in the air)");
  await shot("07c-battle-volleys.png");
  await p.keyboard.press("3"); await wait(400);
  ok((await js(() => __vh.scene().ctl.state().orders.cav)) === "charge", "3 orders the charge");
  await p.mouse.click(VW / 2, VH / 2); await wait(300);
  await until(() => !__vh.scene() || __vh.scene().ctl.state().eW < 0.85, 90000, 500);
  await shot("08-battle-melee.png");
  ok(await js(() => !__vh.scene() || __vh.scene().ctl.state().eW < 1), "the enemy takes losses in the melee");
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

  // ---- skills v2: the Realm Arts (g3d/skills2.js) ----
  if (!process.env.NOSK2) {
    const K = "__vh.k2()";
    ok(await js(() => !!(__vh.k2() && __vh.S().sk2 && __vh.S().sk2.v === 1)), "Realm Arts installed; the save carries the new sk2 key");
    await js(() => { __vh.S().xp = 25 * 20 * 20; __vh.S().crowns = Math.max(__vh.S().crowns, 2000); });
    const pts0 = await js(() => __vh.k2().points());
    ok(pts0 >= 18, "points come from levels (" + pts0 + " at level " + (await js(() => Math.floor(Math.sqrt(__vh.S().xp / 25)) + 1)) + ")");
    // unlock through the sheet: pick a tree, a node, Learn, and the Recognition moment makes it your Spark
    await js(() => { const b = document.querySelector("[data-act=menu][data-a=skills]"); if (b) b.click(); }); await wait(700);
    ok(await js(() => __vh.sheet() && __vh.sheet().kind === "skills" && !!document.querySelector("#sbody .k2s") && document.querySelectorAll("#sbody .k2tr").length === 9), "the skill sheet shows the Realm Arts: Commander + eight Realm trees");
    await js(() => document.querySelector("[data-k2tree=ember]").click()); await wait(250);
    await js(() => document.querySelector("[data-k2sel=em_brand]").click()); await wait(250);
    ok(await js(() => /What it changes/.test(document.querySelector("#sbody .k2d").textContent) && /Temper/.test(document.querySelector("#sbody .k2d").textContent)), "detail panel shows the one-line fantasy, the price and the 'what changes' preview");
    await js(() => document.querySelector("[data-k2learn=em_brand]").click()); await wait(250);
    ok(await js(() => !!document.querySelector(".k2modal") && /Recognition/.test(document.querySelector(".k2modal").textContent)), "first Realm art: the Recognition choice appears");
    await shot("k2-01-recognition.png");
    await js(() => document.querySelector("[data-k2modal=yes]").click()); await wait(300);
    ok(await js(() => { const s = __vh.S().sk2; return s.r.em_brand === 1 && s.spark === "ember" && s.eq[0] === "em_brand"; }), "Brand unlocked; Embercraft is your Spark; Brand sits on button 1");
    // keystone exclusivity
    await js(() => { const k = __vh.k2(); ["em_hot", "em_hot", "em_hot", "em_cracks", "em_cracks", "em_cracks", "em_refusal", "em_refusal", "em_refusal"].forEach((id) => k.learn(id)); }); await wait(100);
    await js(() => { document.querySelector("[data-k2sel=em_ks_patient]").click(); }); await wait(200);
    await js(() => document.querySelector("[data-k2learn=em_ks_patient]").click()); await wait(250);
    ok(await js(() => !!document.querySelector(".k2modal .k2ksc") && document.querySelectorAll(".k2modal .k2ksb").length === 2), "keystone: the choose-who-you-become moment shows both roads");
    await shot("k2-02-keystone.png");
    await js(() => document.querySelector("[data-k2modal=yes]").click()); await wait(250);
    const ks = await js(() => { const k = __vh.k2(), N = window.VHSK2.NODE; return { a: k.R("em_ks_patient"), b: k.learn("em_ks_unbanked"), why: k.why(N.em_ks_unbanked) }; });
    ok(ks.a === 1 && ks.b === false && /chose Patient Fire/.test(ks.why), "keystones are exclusive: Patient Fire taken, Unbanked refused (" + ks.why + ")");
    await shot("k2-03-sheet.png");
    await js(() => { const b = document.querySelector("#sx"); if (b) b.click(); }); await wait(400);
    // battle: every tree's first active fires on the 3D field, with a price where there is magic
    ok(await js(() => __vh.battleWith(18, "bandit")), "Realm Arts battle started");
    await wait(500); await js(() => __vh.startFight());
    ok(await until(() => !!(__vh.scene() && __vh.scene().ctl && __vh.scene().ctl.ready && __vh.scene().ctl.k2 && __vh.scene().ctl.k2()), 20000), "3D battle opened with the Realm Arts controller");
    await wait(1500);
    ok(await js(() => !!document.querySelector("#vh3d [data-b=cast]") && document.querySelectorAll("#vh3d .k2ab").length === 3), "battle HUD: a Cast button and three ability buttons");
    await js(() => document.querySelector("#vh3d [data-b=cast]").dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }))); await wait(400);
    ok(await js(() => document.querySelectorAll("#vh3d .k2ab.on").length === 3 && !!document.querySelector("#vh3d .k2price .k2m")), "Cast opens the ability set; the price meter is on the HUD");
    const FIRST = ["cmd_rally", "em_brand", "fr_echo", "li_shield", "st_step", "sg_press", "vw_lantern", "sh_step", "mt_bolt"];
    const ART = { em_brand: "ember", fr_echo: "frost", li_shield: "light", st_step: "storm", sg_press: "stone", vw_lantern: "veil", sh_step: "shadow", mt_bolt: "metal" };
    const fired = [];
    for (const id of FIRST) {
      const r = await js((id) => {
        if (!__vh.scene()) return { gone: 1 };
        const c = __vh.scene().ctl, k2 = c.k2(), s = __vh.S().sk2, hero = c.hero;
        // the hero is put beside a foe nine times over; keep him on his feet so a slow machine can't end the test early
        if (hero.hp > 0) hero.hp = hero.hpm;
        c.units.forEach((u) => { if (u.side === "e" && !u.dead && !u.gone && u.hpm) u.hp = u.hpm; }); // and the bandits standing, so the battle outlasts nine casts
        const cs = c.state(); if (cs.over || cs.heroDown) return { ended: (cs.over ? "over " : "") + (cs.heroDown ? "hero down" : "") };
        s.r[id] = Math.max(1, s.r[id] || 0); s.eq[0] = id; __vh.k2().bump(); k2.core.cds = {}; k2.core.chg = {};
        // stand a few yards from the nearest living foe, facing it
        const foes = c.units.filter((u) => u.side === "e" && !u.dead && !u.gone); if (!foes.length) return { none: 1 };
        foes.sort((a, b) => Math.hypot(a.x - hero.x, a.z - hero.z) - Math.hypot(b.x - hero.x, b.z - hero.z)); const f = foes[0];
        const d = Math.hypot(f.x - hero.x, f.z - hero.z) || 1; hero.x = f.x - (f.x - hero.x) / d * 2.6; hero.z = f.z - (f.z - hero.z) / d * 2.6; hero.yaw = Math.atan2(f.x - hero.x, f.z - hero.z);
        const hp0 = foes.reduce((a, u) => a + u.hp, 0), st0 = k2.state(), m0 = Object.assign({}, s.m), x0 = hero.x, z0 = hero.z, t0 = k2.core.t;
        const okc = k2.cast(0); window.__k2t = t0;
        return { okc, hp0, x0, z0, st0, m0 };
      }, id);
      if (r.gone || r.ended) { ok(false, id + ": the battle had already ended " + (r.ended || "")); continue; }
      if (r.none) { ok(false, id + ": no foes left to test on"); continue; }
      // headless frames are slow: wait on the battle's own clock, not the wall clock
      await until(() => __vh.scene().ctl.k2().core.t > window.__k2t + 0.7, 30000, 100);
      const a = await js((id) => { const c = __vh.scene().ctl, k2 = c.k2(); return { hp1: c.units.filter((u) => u.side === "e" && !u.dead && !u.gone).reduce((s, u) => s + u.hp, 0) + c.units.filter((u) => u.side === "e" && u.dead).length * 0, dead: c.units.filter((u) => u.side === "e" && u.dead).length, st: k2.state(), m: Object.assign({}, __vh.S().sk2.m), again: k2.cast(0) }; }, id);
      const moved = Math.hypot(a.st.hero.x - r.x0, a.st.hero.z - r.z0) > 0.8, hit = a.hp1 < r.hp0 - 0.01, zone = a.st.zones > r.st0.zones, summon = a.st.summons > r.st0.summons, buff = a.st.buffs > r.st0.buffs || a.st.shield || a.st.ahead > 0;
      const art = ART[id], paid = !art || (a.m[art] || 0) > (r.m0[art] || 0);
      const did = moved || hit || zone || summon || buff;
      fired.push(id);
      ok(r.okc && did && paid && a.again === false, id + " fires in battle: " + [moved && "moved", hit && "hurt them", zone && "zone", summon && "summoned", buff && "buff/ward"].filter(Boolean).join(", ") + (art ? "; " + art + " price " + Math.round(r.m0[art] || 0) + " -> " + Math.round(a.m[art] || 0) : "; no price (Commander)") + "; on cooldown after");
      // the battle's clock is held while the picture is taken (it keeps drawing): how long a screenshot takes on this
      // machine must not decide whether the bandits outlast nine casts
      if (id === "em_brand" || id === "st_step" || id === "sg_press" || id === "li_shield") { await js(() => { __vh.scene().ctl.scene.substeps = 0; }); await shot("k2-b-" + id + ".png"); await js(() => { if (__vh.scene()) __vh.scene().ctl.scene.substeps = 1; }); }
      await js(() => { __vh.scene().ctl.k2().core.cds = {}; });
    }
    // the price: push Embercraft into the Arrears; it marks you and takes your Block
    // the price: push Radiance into the Arrears (the Clear); it marks you and you can no longer fall back.
    // (Embercraft is capped at the Debt here: the test took Patient Fire.)
    const pr = await js(() => { const k = __vh.k2(); k.pay("ember", 90); k.pay("light", 90); const s = __vh.S().sk2; return { e: s.m.ember, m: s.m.light, marks: s.marks.light || 0, st: __vh.scene().ctl.k2().state() }; });
    ok(pr.e <= 74, "Patient Fire holds Temper at the Debt (" + Math.round(pr.e) + ")");
    ok(pr.m >= 75 && pr.marks >= 1 && pr.st.noFlee, "Radiance at the Clear (" + Math.round(pr.m) + "): a mark that never walks back (" + pr.marks + "), and you cannot fall back");
    await shot("k2-b-price.png");
    await js(() => __vh.scene() && __vh.scene().ctl.fast(10));
    ok(await until(() => !__vh.scene(), 150000, 1000), "Realm Arts battle finished and the scene closed");
    ok(await js(() => !document.querySelector(".k2hud")), "battle HUD removed with the scene");
    await js(() => { const d = document.querySelector("#sbody [data-act=done]"); if (d) d.click(); }); await wait(600);
    // town and road fights: Cast opens the set, 1 casts, the price moves
    await js(() => __vh.startArea("millroad"));
    ok(await until(() => !!(__vh.area3d() && __vh.area3d().ready && __vh.AR() && __vh.AR().id === "millroad"), 30000), "Millbrook Road opens for an on-foot Realm Arts test");
    await wait(1500);
    await js(() => { const s = __vh.S().sk2; s.eq = ["em_brand", "cmd_rally", "em_refusal"]; s.m.ember = 0; s.marks.ember = 0; __vh.k2().bump(); });
    await js(() => { const A = __vh.AR(), e = A.en.find((q) => !q.dead && !q.gone); if (e) { A.p.x = e.x - 26; A.p.y = e.y; A.p.face = { x: 1, y: 0 }; } }); await wait(800);
    ok(await until(() => !!document.querySelector("#area .k2hud"), 3000), "on foot: the Realm Arts HUD is mounted beside Cast");
    await js(() => document.querySelector("#acast").dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }))); await wait(400);
    ok(await js(() => document.querySelectorAll("#area .k2ab.on").length === 3 && !__vh.dlg()), "Cast opens the ability set (not the old dialogue)");
    const fh0 = await js(() => __vh.AR().en.reduce((a, e) => a + Math.max(0, e.hp), 0));
    await js(() => { window.__k2t = __vh.k2a().t; }); await p.keyboard.press("1");
    await until(() => __vh.k2a().t > window.__k2t + 0.6, 30000, 100);
    const fa = await js(() => ({ hp: __vh.AR().en.reduce((a, e) => a + Math.max(0, e.hp), 0), m: __vh.S().sk2.m.ember || 0 }));
    ok(fa.hp < fh0 && fa.m > 0, "key 1 throws Brand on foot: foes " + fh0.toFixed(1) + " -> " + fa.hp.toFixed(1) + ", Temper " + fa.m.toFixed(0));
    await shot("k2-a-brand.png");
    await js(() => { __vh.k2a().cds = {}; __vh.k2a().cast(2); }); await wait(250);
    await shot("k2-a-refusal.png");
    // respec: the Contradiction (crowns), marks stay
    const rs = await js(() => { const k = __vh.k2(), s = __vh.S().sk2; s.marks.ember = 2; const c0 = __vh.S().crowns, cost = k.respecCost(), ok1 = k.respec(); return { ok1, paid: c0 - __vh.S().crowns === cost, spark: s.spark, spent: k.spent(), marks: s.marks.ember, contra: s.contra > __vh.S().day }; });
    ok(rs.ok1 && rs.paid && rs.spark === null && rs.spent === 0 && rs.marks === 2 && rs.contra, "unlearning costs crowns and five days of contradiction; marks stay");
    await js(() => { const b = document.querySelector("[data-act=aleave]"); if (b) b.click(); }); await until(() => !__vh.AR(), 15000);
  }

  // ---- v2 stage 3: sieges (walls, gate, towers, ladders, ram), both sides playable, ends feed finishBattle ----
  if (!process.env.NOSIEGE) {
    for (const defend of [false, true]) {
      ok(await js(() => __vh.battleWith(26)), (defend ? "defence" : "assault") + " battle started");
      await wait(500);
      await js((d) => __vh.startFight({ siege: true, defend: d }), defend);
      ok(await until(() => !!(__vh.scene() && __vh.scene().ctl && __vh.scene().ctl.ready), 20000), "3D siege opened (" + (defend ? "you hold the walls" : "you assault the walls") + ")");
      await wait(2000);
      const s0 = await js(() => __vh.scene().ctl.state().siege);
      ok(s0 && s0.ladders === 3 && s0.gate === 100 && s0.attacker === (defend ? "e" : "p") && s0.onWall > 0, "walls, gate, towers and ladders stand; defenders on the wall walk (" + JSON.stringify(s0) + ")");
      await shot(defend ? "21-siege-defence.png" : "20-siege-assault.png");
      if (!defend) await p.keyboard.press("3");
      await js(() => __vh.scene().ctl.fast(8));
      await js((o) => { window.__s0 = o; }, s0);
      const moved = await until(() => { const s = __vh.scene() && __vh.scene().ctl.state().siege, s0 = window.__s0; return !s || s.ramDist < s0.ramDist - 1 || s.gate < 100 || s.onWall > s0.onWall; }, 120000, 1000);
      ok(moved, "the ram rolls on the gate or men go up the ladders");
      await shot(defend ? "21b-siege-defence-fight.png" : "20b-siege-assault-fight.png");
      await js(() => __vh.scene() && __vh.scene().ctl.fast(12));
      ok(await until(() => !__vh.scene(), 240000, 1000), "siege finished and the scene closed");
      ok(await js(() => __vh.B() && __vh.B().stage === "result"), "finishBattle ran after the siege (" + (await js(() => __vh.B() && (__vh.B().out || [])[0])) + ")");
      await js(() => { const d = document.querySelector("#sbody [data-act=done]"); if (d) d.click(); }); await wait(600);
    }
  }

  // ---- skills v2: an old save (v1 skills, no sk2 key) loads, refunds its points and keeps story flags ----
  // ---- and landscape phone play: this page is a phone held sideways (844x390), then turned upright ----
  if (!process.env.NOSK2) {
    const old = await js(() => { const o = JSON.parse(JSON.stringify(__vh.S())); delete o.sk2; delete o.skLegacy; o.skills = { drill: 2, haggler: 1, sv_footwork: 3, ms_gate: 1 }; o.skStart = { haggler: 1 }; o.xp = 25 * 9 * 9; return JSON.stringify(o); });
    await p.close();
    const ctx = await b.newContext({ viewport: { width: 844, height: 390 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
    const p2 = await ctx.newPage();
    p2.on("pageerror", (e) => errs.push("pageerror(old save): " + e.message));
    p2.on("console", (m) => { if (m.type() === "error") errs.push("console(old save): " + m.text()); });
    await p2.addInitScript((o) => { if (!sessionStorage.getItem("k2mig")) { sessionStorage.setItem("k2mig", "1"); localStorage.setItem("voidhammer-campaign-v3", o); } }, old);
    await p2.goto(URL); await p2.waitForTimeout(4000);
    await p2.evaluate(() => { const b = document.getElementById("tcont"); if (b) b.click(); }); await p2.waitForTimeout(2500);
    const mig = await p2.evaluate(() => { const S = __vh.S(); __vh.k2().st(); return { sk2: !!S.sk2, ref: S.sk2 && S.sk2.refunded, skills: S.skills, legacy: S.skLegacy, pts: __vh.k2().points() }; });
    ok(mig.sk2 && mig.ref === 5 && mig.skills.ms_gate === 1 && mig.skills.haggler === 1 && !mig.skills.drill && !mig.skills.sv_footwork && mig.legacy && mig.legacy.drill === 2 && mig.pts >= 8,
      "old save migrates: 5 points refunded, Gatewalker and the upbringing's Haggler kept, old map kept as skLegacy, " + mig.pts + " points to spend");
    const j2 = (f, a) => p2.evaluate(f, a), shot2 = async (n) => { if (SHOTS) await p2.screenshot({ path: path.join(SHOTS, n), timeout: 120000 }).catch(() => {}); };
    const until2 = async (f, ms) => { const t = Date.now(); while (Date.now() - t < ms) { if (await j2(f)) return true; await p2.waitForTimeout(500); } return false; };
    await j2(() => { const s = __vh.S().sk2; ["em_brand", "cmd_rally", "st_step"].forEach((id) => { s.r[id] = 1; }); s.spark = "ember"; s.half = "storm"; s.eq = ["em_brand", "cmd_rally", "st_step"]; __vh.k2().bump(); });
    await j2(() => __vh.startArea("millroad"));
    ok(await until2(() => !!(__vh.area3d() && __vh.area3d().ready && __vh.AR() && __vh.AR().id === "millroad"), 40000), "landscape 844x390: Millbrook Road opens in 3D");
    await p2.waitForTimeout(1500);
    await j2(() => document.querySelector("#acast").dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }))); await p2.waitForTimeout(500);
    const La = await j2(() => { const r = (q) => { const e = document.querySelector(q); if (!e) return null; const b = e.getBoundingClientRect(); return { l: b.left, t: b.top, r: b.right, b: b.bottom, w: b.width, h: b.height }; }; const W = innerWidth, H = innerHeight;
      const ab = [...document.querySelectorAll("#area .k2ab.on")].map((e) => { const b = e.getBoundingClientRect(), w = e.offsetWidth, h = e.offsetHeight, cx = b.left + b.width / 2, cy = b.top + b.height / 2; return { left: cx - w / 2, top: cy - h / 2, width: w, height: h }; }), mb = document.querySelector("#vh3d .v3-menu"), mr = mb && mb.getBoundingClientRect(), topVis = [...document.querySelectorAll("#vh3d .v3-top button")].some((e) => e.getClientRects().length > 0), abVis = [...document.querySelectorAll("#ahud .abtns button")].some((e) => e.getClientRects().length > 0);
      mb && mb.click(); const tiles = [...document.querySelectorAll("#v3menu.on .v3p-t, #v3menu.on .v3p-r, #v3menu.on .v3p-seg button")].map((e) => { const b = e.getBoundingClientRect(); return { w: b.width, h: b.height, t: e.textContent.trim() }; }); mb && mb.click();
      return { W, H, atk: r("#aatk"), cast: r("#acast"), ab: ab.map((b) => ({ l: b.left, t: b.top, w: b.width, h: b.height })), menu: mr && { t: mr.top, r: mr.right, w: mr.width, h: mr.height }, topVis, abVis, tiles, rot: window.__vhRot.on() }; });
    const right = (b) => b && b.l > La.W * 0.55 && b.b > La.H * 0.4;
    ok(La.W > La.H && !La.rot && right(La.atk) && right(La.cast), "landscape: no turn-sideways card; Strike and Cast sit bottom-right (" + Math.round(La.atk.l) + "," + Math.round(La.atk.t) + ")");
    ok(La.ab.length === 3 && La.ab.every((b) => b.w >= 44 && b.h >= 44 && b.l > La.W * 0.5 && b.t >= 0 && b.t + b.h <= La.H), "landscape: the three ability buttons are in the right-thumb arc, on screen, 44px or more (" + La.ab.map((b) => Math.round(b.w)).join(",") + ")");
    ok(La.menu && La.menu.w >= 44 && La.menu.h >= 44 && La.menu.t < 30 && La.menu.r > La.W - 40 && !La.topVis && !La.abVis, "landscape: the top bars are hidden; one round menu button, 44px or more, top-right" + (La.menu ? "" : " (no button)"));
    const tl = La.tiles.map((x) => x.t).join("|");
    ok(La.tiles.length >= 9 && La.tiles.every((x) => x.h >= 44 && x.w >= 44) && ["Gear", "Quest", "Skills", "Build", "Wait", "Map", "Auto-run", "Graphics", "Music"].every((w) => tl.indexOf(w) >= 0) && !/^Run$/m.test(tl.replace(/\|/g, "\n")),
      "landscape: the menu panel holds Gear, Quest, Skills, Build, Wait, Map, Auto-run, Music and Graphics quality, every target 44px or more (" + La.tiles.length + ")");
    await shot2("k2-L-area.png");
    // a 3D battle in landscape
    await j2(() => { const b = document.querySelector("[data-act=aleave]"); if (b) b.click(); }); await until2(() => !__vh.AR(), 15000);
    await j2(() => { __vh.give(30); return __vh.battleWith(16, "bandit"); }); await p2.waitForTimeout(500); await j2(() => __vh.startFight());
    ok(await until2(() => !!(__vh.scene() && __vh.scene().ctl && __vh.scene().ctl.ready), 30000), "landscape: 3D battle opens");
    await p2.waitForTimeout(1500);
    await j2(() => document.querySelector("#vh3d [data-b=cast]").dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }))); await p2.waitForTimeout(500);
    const Lb = await j2(() => { const g = (q) => { const e = document.querySelector(q); return e ? e.getBoundingClientRect() : null; }; const W = innerWidth, H = innerHeight; const ab = [...document.querySelectorAll("#vh3d .k2ab.on")].map((e) => { const b = e.getBoundingClientRect(), w = e.offsetWidth, h = e.offsetHeight, cx = b.left + b.width / 2, cy = b.top + b.height / 2; return { left: cx - w / 2, top: cy - h / 2, width: w, height: h, right: cx + w / 2, bottom: cy + h / 2 }; });
      const atk = g("#vh3d [data-b=atk]"), blk = g("#vh3d [data-b=blk]"), cast = g("#vh3d [data-b=cast]"), hp = g("#vh3d .v3-hp"), ord = g("#vh3d .b3-ordbtn");
      return { W, H, atk, blk, cast, hp, ord, abl: ab, ok: [atk, blk, cast].every((b) => b && b.left > W * 0.55 && b.bottom > H * 0.45 && b.width >= 44), ab: ab.length === 3 && ab.every((b) => b.width >= 44 && b.left > W * 0.45 && b.top >= 0), hpTop: hp && hp.top < H * 0.25, ord: ord && ord.height >= 44 && ord.left > W * 0.2 && ord.right < W * 0.8 }; });
    ok(Lb.ok && Lb.ab && Lb.hpTop && Lb.ord, "landscape battle: Strike/Block/Cast and the ability arc bottom-right, health at the top, Orders between the thumbs" + (Lb.ok && Lb.ab && Lb.hpTop && Lb.ord ? "" : " " + JSON.stringify(Lb)));
    await shot2("k2-L-battle.png");
    // turned upright mid-fight: the card asks for sideways
    await p2.setViewportSize({ width: 390, height: 844 }); await p2.waitForTimeout(900);
    ok(await j2(() => window.__vhRot.on() && /sideways/i.test(document.getElementById("vhrot").textContent) && getComputedStyle(document.getElementById("vhrot")).display !== "none"), "portrait 390x844 during 3D play: the 'Turn your phone sideways' card appears");
    await shot2("k2-P-turn-sideways.png");
    await j2(() => document.querySelector("#vhrot [data-rot=stay]").click()); await p2.waitForTimeout(500);
    ok(await j2(() => !window.__vhRot.on()), "'Play upright anyway' dismisses it");
    await j2(() => __vh.scene() && __vh.scene().ctl.fast(10)); await until2(() => !__vh.scene(), 150000);
    await p2.close();
  } else await p.close();

  ok(errs.length === 0, "no console errors" + (errs.length ? ":\n  " + errs.join("\n  ") : ""));
  await b.close();
  console.log(fails ? fails + " FAILED" : "ALL PASSED");
  process.exit(fails ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(2); });
