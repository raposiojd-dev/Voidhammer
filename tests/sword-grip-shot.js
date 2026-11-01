// Close-up of the hero's sword grip (idle, running, mid-swing), to check the blade leaves the fist forward and up.
// Serve the repo root, then: OUT=docs/screens/skills-v2 node tests/sword-grip-shot.js
const { chromium } = require(process.env.PW || "playwright");
const path = require("path");
const URL = process.env.URL || "http://localhost:8765/index.html", OUT = process.env.OUT || "docs/screens/skills-v2";
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 900, height: 700 } });
  const js = (f, a) => p.evaluate(f, a), wait = (ms) => p.waitForTimeout(ms);
  await p.goto(URL); await wait(4000);
  await p.click("#tnew"); await wait(600);
  for (let i = 0; i < 3; i++) { await p.click(".mkcard >> nth=0"); await p.click("#mknext"); }
  await wait(300); await p.click("#csgo"); await wait(600); await p.click("[data-act=startnew]"); await wait(2500);
  await js(() => { for (let i = 0; i < 12 && __vh.sheet(); i++) { const b = document.querySelector("[data-act=tutdone]") || document.querySelector("#sbody button.solid") || document.querySelector("#sx:not([hidden])"); if (!b) break; b.click(); } });
  for (let i = 0; i < 60 && !(await js(() => __vh.area3d() && __vh.area3d().ready)); i++) await wait(500);
  await wait(1500);
  // pin the camera beside the sword hand (the follow camera calls lookAt every frame; we take that call over)
  const dir = await js(() => {
    const A = __vh.area3d(), me = A.me(), cam = A.st.camera, V = me.position.constructor, orig = Object.getPrototypeOf(Object.getPrototypeOf(cam)).lookAt;
    cam.lookAt = function () { const w = new V(); me.getObjectByName("WristR").getWorldPosition(w); const yaw = me.rotation.y, side = new V(Math.cos(yaw), 0, -Math.sin(yaw)), fwd = new V(Math.sin(yaw), 0, Math.cos(yaw));
      this.position.copy(w).addScaledVector(side, 1.15).addScaledVector(fwd, 0.55).add(new V(0, 0.25, 0)); orig.call(this, w.x + fwd.x * 0.35, w.y + 0.15, w.z + fwd.z * 0.35); };
    const mesh = me.getObjectByName("WristR").children.find((c) => c.isMesh), o = new V(), tip = mesh.localToWorld(new V(1, 0, 0)); mesh.getWorldPosition(o);
    const f = new V(Math.sin(me.rotation.y), 0, Math.cos(me.rotation.y)), d = tip.sub(o).normalize();
    return { forward: +d.dot(f).toFixed(2), up: +d.y.toFixed(2) };
  });
  console.log("blade direction vs facing (idle): forward " + dir.forward + ", up " + dir.up + (dir.forward > 0 ? "  -> normal grip" : "  -> REVERSE grip"));
  await wait(800); await p.screenshot({ path: path.join(OUT, "sword-grip.png") });
  await p.keyboard.down("w"); await wait(900); await p.screenshot({ path: path.join(OUT, "sword-grip-run.png") }); await p.keyboard.up("w");
  await wait(600); await p.keyboard.press(" "); await wait(180); await p.screenshot({ path: path.join(OUT, "sword-grip-attack.png") });
  await b.close();
  process.exit(dir.forward > 0 ? 0 : 1);
})().catch((e) => { console.error(e); process.exit(2); });
