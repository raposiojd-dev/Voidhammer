// Smoke test for the premium front door: title -> tap to begin -> character creation (every canon Realm, every Road)
// -> begin -> opening cinematic -> play, then the old-save migration, then the first map view.
// Serve the repo (see smoke-3d.js), then: URL=http://localhost:8765/index.html node tests/smoke-frontdoor.js
// Env: VPS=390x844 (default) or 844x390, SHOTS=folder for screenshots, PW=path to playwright.
const { chromium } = require(process.env.PW || "playwright");
const path = require("path");
const URL = process.env.URL || "http://localhost:8765/index.html";
const SHOTS = process.env.SHOTS || "";
const [VW, VH] = (process.env.VPS || "390x844").split("x").map(Number);
let fails = 0;
const ok = (c, m) => { console.log((c ? "PASS " : "FAIL ") + m); if (!c) fails++; };

(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: VW, height: VH }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
  const p = await ctx.newPage();
  const errs = [];
  p.on("pageerror", (e) => errs.push("pageerror: " + e.message));
  p.on("console", (m) => { if (m.type() === "error") errs.push("console: " + m.text()); });
  const shot = async (n) => { if (SHOTS) await p.screenshot({ path: path.join(SHOTS, n.replace(/\.png$/, ".jpg")), type: "jpeg", quality: 84 }); };
  const js = (f, a) => p.evaluate(f, a);
  const wait = (ms) => p.waitForTimeout(ms);
  const until = async (f, ms, step) => { const t = Date.now(); while (Date.now() - t < ms) { if (await js(f)) return true; await wait(step || 300); } return false; };

  await p.goto(URL);
  ok(await until(() => !!document.getElementById("fd-boot") || !!document.getElementById("fd-title"), 4000, 100), "boot splash shows while the game loads");
  ok(await until(() => !!document.getElementById("fd-title") && !document.getElementById("title").hidden, 15000), "premium title is up");
  await wait(1500);
  ok(await js(() => !!document.querySelector("#fd-tap:not([hidden])")), "tap to begin waits on first open");
  await shot("01-title-tap.png");
  await p.click("#fd-tap"); await wait(2600);
  ok(await js(() => document.getElementById("fd-title").classList.contains("go")), "tap reveals the logo and menu");
  ok(await js(() => ["tnew"].every((id) => { const e = document.getElementById(id); return e && e.offsetParent && e.closest(".fd-menu"); }) && [...document.querySelectorAll(".fd-menu .fd-btn")].map((x) => x.textContent.trim().split("\n")[0]).join("|").includes("Settings")), "menu: New Game, Settings, Credits (Continue when a save exists)");
  await shot("02-title.png");
  // settings and credits open and close
  await p.click(".fd-menu [data-fd=settings]"); await wait(500);
  ok(await js(() => !!document.querySelector(".fd-modal .fd-switch[data-k=music]") && !!document.querySelector(".fd-modal [data-go=tsaves]")), "Settings: music, sounds, motion, saves, how to play");
  await shot("03-settings.png");
  await p.click(".fd-modal [data-close]"); await wait(300);
  await p.click(".fd-menu [data-fd=credits]"); await wait(400);
  ok(await js(() => /Quaternius/.test(document.querySelector(".fd-modal").textContent) && /Open Font/.test(document.querySelector(".fd-modal").textContent)), "Credits list the CC0 people, three.js and OFL fonts");
  await p.click(".fd-modal [data-close]"); await wait(300);

  const C = await js(() => ({ realms: VH_CANON.REALMS.map((r) => r.id), roads: VH_CANON.ROADS.map((r) => r.id) }));
  ok(C.realms.length === 8 && C.roads.length === 8, "canon choices: 8 Realms (" + C.realms.join(",") + ") and 8 Roads (" + C.roads.join(",") + ")");
  // canon guard: no god words, no sealed names, Australian "towards" only, in every display string of the front door
  const leak = await js(() => {
    const txt = JSON.stringify(VH_CANON) + document.getElementById("fd-title").textContent;
    const bad = [/\bgods?\b/i, /goddess|deity|divine|heaven|\bhell\b/i, /Eternal Voyager|Soulforged|Unwritten|Harrowed|Valek|Dalen/i, /\btoward\b/i, /\bcolor\b|\bhonor\b|\barmor\b/i];
    return bad.filter((r) => r.test(txt)).map(String);
  });
  ok(leak.length === 0, "front-door text has no god words, sealed names or US spellings" + (leak.length ? ": " + leak.join(" ") : ""));

  for (let i = 0; i < C.realms.length; i++) {
    const realm = C.realms[i], road = C.roads[i];
    // from the title into the creator
    await until(() => !document.getElementById("title").hidden && document.getElementById("tnew").offsetParent, 8000);
    await p.click("#tnew");
    ok(await until(() => { const c = document.getElementById("fd-cc"); return c && !c.hidden; }, 4000), realm + ": creator opens");
    await p.click('.fd-chip-realm[data-realm="' + realm + '"]'); await wait(300);
    const card = await js(() => ({ h: document.querySelector(".fd-h1").textContent, price: (document.querySelector(".fd-fact.price dd") || {}).textContent || "", gift: (document.querySelector(".fd-fact.gift dd") || {}).textContent || "", crest: !!document.querySelector("#fd-crest-hero svg"), line: (document.querySelector(".fd-oneline") || {}).textContent || "" }));
    ok(card.h && card.price.length > 20 && card.gift.length > 5 && card.crest && card.line.length > 10, realm + ": hero card shows name, one-line identity, price, gift and crest (" + card.h + ")");
    if (i === 0) {
      ok(await until(() => { const s = VHFD._cc() && VHFD._cc().pv && VHFD._cc().pv.state(); return s && s.ready && s.hasFig; }, 30000), "3D preview: the rigged person stands on the plinth in Realm colours");
      await wait(1200);
    }
    if (i < 3 || realm === "spirit" || realm === "metal") { await wait(900); await shot("1" + i + "-people-" + realm + ".png"); }
    await p.click("#fd-next"); await wait(300);
    await p.click('.fd-road[data-road="' + road + '"]'); await wait(300);
    const kit = await js(() => [...document.querySelectorAll('.fd-road[aria-pressed="true"] .fd-kit i')].map((x) => x.textContent));
    ok(kit.length >= 2 && kit.some((t) => /crowns/.test(t)), realm + "/" + road + ": road card shows the exact starting kit (" + kit.slice(0, 4).join(", ") + ")");
    if (i === 1) await shot("20-road.png");
    await p.click("#fd-next"); await wait(300);
    await p.click("[data-cc=suggest]"); await wait(150);
    const nm = await js(() => document.getElementById("fd-pname").value);
    ok(nm.length >= 2, realm + ": a Realm name is suggested (" + nm + ")");
    if (i === 0) { await p.click(".fd-swatch >> nth=1"); await p.click('.fd-tab[data-diff="normal"]'); await wait(200); await shot("21-name.png"); }
    const expect = await js((r) => ({ gift: VH_CANON.realm(r).gift }), realm);
    await p.click("#fd-next");
    ok(await until(() => !!document.getElementById("fd-intro"), 6000), realm + ": Begin opens the opening cinematic");
    if (i === 0 || i === 6) {
      await wait(2600); await shot(i ? "31-intro-title-" + realm + ".png" : "30-intro-title.png");
      // tap through to the Realm card
      for (let k = 0; k < 8 && (await js(() => VHFD._in() && VHFD._in().list[VHFD._in().i].kind !== "realm")); k++) { await p.mouse.click(VW / 2, VH / 2); await wait(250); }
      await wait(i ? 3500 : 3500); await shot(i ? "33-intro-realm-" + realm + ".png" : "32-intro-realm.png");
      for (let k = 0; k < 12 && (await js(() => VHFD._in() && VHFD._in().list[VHFD._in().i].kind !== "place")); k++) { await p.mouse.click(VW / 2, VH / 2); await wait(250); }
      if (i === 0) { await wait(2200); await shot("34-intro-ashford.png"); }
    }
    await js(() => { const s = document.getElementById("fd-skip"); if (s) s.click(); });
    ok(await until(() => !document.getElementById("fd-intro") && __vh.S() && __vh.S().intro === false, 6000), realm + ": the opening hands off into play");
    const st = await js(() => { const S = __vh.S(); return { people: S.opt.people, road: S.opt.road, upb: S.opt.upb, pname: S.pname, j: S.journal[0].text, crowns: S.crowns, grain: S.grain, loot: S.loot, gear: S.gear, from: S.from }; });
    const rd = await js((r) => VH_CANON.road(r).upb, road);
    ok(st.people === realm && st.road === road && st.upb.y === rd.y && st.upb.c === rd.c && st.upb.a === rd.a, realm + "/" + road + ": the save records the canon choice and the mapped upbringing");
    ok(st.pname === nm && st.j.indexOf(await js((r) => VH_CANON.realm(r).name, realm)) === 0, realm + ": name and journal opening are set (" + st.j.slice(0, 60) + "...)");
    const g = expect.gift;
    const giftOk = (g.crowns ? st.crowns >= g.crowns : true) && (g.grain ? st.grain >= g.grain : true) && (!g.loot || Object.keys(g.loot).every((k) => (st.loot[k] || 0) >= g.loot[k])) && (!g.gear || Object.keys(g.gear).every((k) => (st.gear[k] || 0) >= g.gear[k])) && (!g.from || Object.keys(g.from).every((k) => (st.from[k] || 0) >= g.from[k]));
    ok(giftOk, realm + ": the Realm gift is in the starting kit");
    if (i < C.realms.length - 1) { await until(() => !!__vh.AR() || !!__vh.sheet(), 6000); await js(() => { if (__vh.AR()) { const b = document.querySelector("#ahud [data-act=aleave]"); if (b) b.click(); } }); await until(() => !__vh.AR(), 15000); await js(() => { const b = document.createElement("button"); b.setAttribute("data-act", "mainmenu"); document.body.appendChild(b); b.click(); b.remove(); }); await wait(700); }
  }

  // the last game: finish the tutorial, open in Ashford, then the world map
  await js(() => { for (let i = 0; i < 12 && __vh.sheet(); i++) { const b = document.querySelector("[data-act=tutdone]") || document.querySelector("#sbody button.solid") || document.querySelector("#sx:not([hidden])"); if (!b) break; b.click(); } });
  ok(await until(() => !!(__vh.AR() && __vh.AR().id === "ashford"), 30000), "play begins in Ashford");
  await wait(2500);
  await js(() => { const bs = [...document.querySelectorAll("button")].filter((x) => x.offsetParent && x.textContent.trim() === "Map"); if (bs[0]) bs[0].click(); });
  ok(await until(() => !__vh.AR(), 15000), "Map leaves Ashford for the world map");
  await wait(2500);
  await shot("40-first-map.png");
  // the global polish layer on the most-seen sheet and the menu
  await js(() => { const b = document.createElement("button"); b.setAttribute("data-act", "menu"); b.setAttribute("data-a", "party"); document.body.appendChild(b); b.click(); b.remove(); });
  await wait(800);
  ok(await js(() => { const s = document.getElementById("sheet"); return s && !s.hidden && getComputedStyle(s).backgroundImage.indexOf("gradient") >= 0; }), "sheets wear the forged frame");
  await shot("41-sheet.png");
  await js(() => { const x = document.getElementById("sx"); if (x) x.click(); }); await wait(500);

  // ---- old saves: every old origin and upbringing maps to a canon Road, the save loads, Continue plays it ----
  const cases = [{ origin: "noble", upb: null, road: "retainer" }, { origin: "voidtouched", upb: null, road: "greyedge" }, { origin: "wanderer", upb: { c: "archive", a: "acolyte", y: "pilgrim" }, road: "reader", people: "spirit" }, { origin: "wanderer", upb: { c: "keep", a: "levy", y: "sellsword" }, road: "soldier", people: "ember" }];
  const base = await js(() => JSON.stringify(__vh.S()));
  const blank = new globalThis.URL("privacy.html", URL).href; // a quiet page on the same origin, so the game cannot autosave over the test save
  for (const c of cases) {
    await p.goto(blank);
    await js((a) => {
      const S = JSON.parse(a[0]), c = a[1]; delete S.opt.people; delete S.opt.road; delete S.opt.fdv; S.opt.origin = c.origin; if (c.upb) S.opt.upb = c.upb; else delete S.opt.upb;
      localStorage.setItem("voidhammer-campaign-v3", JSON.stringify(S)); localStorage.setItem("voidhammer-opts-v1", JSON.stringify(S.opt));
    }, [base, c]);
    await p.goto(URL + (URL.indexOf("?") > 0 ? "&" : "?") + "m=" + c.road);
    ok(await until(() => !!(window.__vh && __vh.S()), 15000), "old save (" + c.origin + (c.upb ? "/" + c.upb.y : "") + ") loads");
    const m = await js(() => ({ people: __vh.S().opt.people, road: __vh.S().opt.road, mig: __vh.S().opt.fdMig, day: __vh.S().day }));
    ok(m.road === c.road && (!c.people || m.people === c.people) && m.mig === 1, "old save migrates to the canon Road " + m.road + " (" + m.people + ")");
    await until(() => !document.getElementById("title").hidden, 8000);
    await p.click("#fd-tap"); await wait(1800);
    ok(await js(() => !document.getElementById("tcont").hidden && /Day/.test(document.getElementById("fd-cont-sub").textContent)), "Continue shows the save (" + (await js(() => document.getElementById("fd-cont-sub").textContent)) + ")");
    if (c === cases[0]) await shot("05-title-continue.png");
    await p.click("#tcont");
    ok(await until(() => document.getElementById("title").hidden, 4000), "Continue plays the migrated save");
    await wait(600);
  }

  ok(errs.length === 0, "no console errors" + (errs.length ? ":\n  " + errs.join("\n  ") : ""));
  await b.close();
  console.log(fails ? fails + " FAILED" : "ALL PASSED");
  process.exit(fails ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(2); });
