// VOIDHAMMER premium front door: the character preview. One rigged person (the same Quaternius CC0 body the game uses
// for your hero) on a forged plinth, turning slowly, in your Realm's colours. Lightweight for phones: one draw call for
// the body, no shadow maps (a painted contact shadow instead), pixel ratio capped, paused when hidden.
import * as THREE from "../g3d/three.module.min.js";
import { loadChars, makeCharKit, makeChar } from "../g3d/chars.js";

function radial(inner, outer) {
  const c = document.createElement("canvas"); c.width = c.height = 128; const g = c.getContext("2d");
  const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, inner); gr.addColorStop(1, outer);
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

export function createPreview(host) {
  const disposables = [];
  const track = (o) => { disposables.push(o); return o; };
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: (window.devicePixelRatio || 1) < 2, alpha: true, powerPreference: "low-power" });
  } catch (e) { return null; }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.15;
  renderer.setClearColor(0x000000, 0);
  const cv = renderer.domElement; cv.className = "fd-pv-cv"; host.appendChild(cv);

  const scene = new THREE.Scene();
  const cam = new THREE.PerspectiveCamera(28, 1, 0.1, 50);
  const hemi = new THREE.HemisphereLight(0xffe6c8, 0x1a1210, 0.9); scene.add(hemi);
  const key = new THREE.DirectionalLight(0xfff0dc, 2.1); key.position.set(-2.2, 3.2, 3.4); scene.add(key);
  const rim = new THREE.DirectionalLight(0xff7a1a, 2.6); rim.position.set(2.4, 2.2, -3.2); scene.add(rim);
  const rim2 = new THREE.DirectionalLight(0xff7a1a, 1.2); rim2.position.set(-2.6, 1.4, -2.6); scene.add(rim2);
  const fill = new THREE.PointLight(0xff9a4a, 0.8, 6); fill.position.set(0, 0.25, 1.1); scene.add(fill);

  // forged plinth: an iron drum with a glowing ember seam
  const plinth = new THREE.Group(); scene.add(plinth);
  const iron = track(new THREE.MeshStandardMaterial({ color: 0x2a2420, roughness: 0.55, metalness: 0.7 }));
  const drum = new THREE.Mesh(track(new THREE.CylinderGeometry(0.62, 0.7, 0.16, 48)), iron); drum.position.y = -0.08; plinth.add(drum);
  const lip = new THREE.Mesh(track(new THREE.CylinderGeometry(0.66, 0.66, 0.025, 48)), track(new THREE.MeshStandardMaterial({ color: 0x5a4630, roughness: 0.4, metalness: 0.85 }))); lip.position.y = 0.002; plinth.add(lip);
  const seamMat = track(new THREE.MeshBasicMaterial({ color: 0xff7a1a, transparent: true, opacity: 0.9 }));
  const seam = new THREE.Mesh(track(new THREE.TorusGeometry(0.665, 0.008, 6, 64)), seamMat); seam.rotation.x = Math.PI / 2; seam.position.y = -0.05; plinth.add(seam);
  const shadow = new THREE.Mesh(track(new THREE.PlaneGeometry(1.4, 1.4)), track(new THREE.MeshBasicMaterial({ map: track(radial("rgba(0,0,0,0.75)", "rgba(0,0,0,0)")), transparent: true, depthWrite: false })));
  shadow.rotation.x = -Math.PI / 2; shadow.position.y = 0.016; plinth.add(shadow);
  const halo = new THREE.Mesh(track(new THREE.PlaneGeometry(3.2, 3.2)), track(new THREE.MeshBasicMaterial({ map: track(radial("rgba(255,122,26,0.35)", "rgba(255,122,26,0)")), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })));
  halo.rotation.x = -Math.PI / 2; halo.position.y = -0.17; plinth.add(halo);

  // embers rising round the figure
  const N = 70, pos = new Float32Array(N * 3), spd = new Float32Array(N);
  for (let i = 0; i < N; i++) { const a = Math.random() * 6.283, r = 0.35 + Math.random() * 0.6; pos[i * 3] = Math.cos(a) * r; pos[i * 3 + 1] = Math.random() * 2.2; pos[i * 3 + 2] = Math.sin(a) * r; spd[i] = 0.12 + Math.random() * 0.3; }
  const pg = track(new THREE.BufferGeometry()); pg.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  const pm = track(new THREE.PointsMaterial({ color: 0xff8a3a, size: 0.035, map: track(radial("rgba(255,255,255,1)", "rgba(255,255,255,0)")), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
  const pts = new THREE.Points(pg, pm); scene.add(pts);

  const holder = new THREE.Group(); scene.add(holder);
  let fig = null, kit = null, look = null, ready = false, alive = true, raf = 0, last = performance.now(), spin = 0.5, drag = null, vel = 0, intro = 0;

  function frame() {
    const w = host.clientWidth, h = host.clientHeight;
    if (w < 2 || h < 2) return;
    const s = renderer.getSize(new THREE.Vector2());
    if (s.x !== w || s.y !== h) { renderer.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix(); }
    // frame the whole body, a little higher on wide hosts so the plinth sits low
    const tall = h / w;
    // fit about 3 m of height (plinth to crown, plus room for the name plate) into the view
    const dist = tall > 1.1 ? 6.6 : 6.0;
    cam.position.set(0, 1.15, dist); cam.lookAt(0, 0.8, 0);
  }

  function setLook(l, pal) {
    look = l;
    if (pal) {
      const glow = new THREE.Color(pal.glow), acc = new THREE.Color(pal.a);
      rim.color.copy(glow).lerp(new THREE.Color(0xffffff), 0.1); rim2.color.copy(acc).lerp(glow, 0.5); fill.color.copy(glow);
      seamMat.color.copy(glow); pm.color.copy(glow).lerp(new THREE.Color(0xffd0a0), 0.3);
      halo.material.map.dispose(); halo.material.map = track(radial(hexA(pal.glow, 0.32), hexA(pal.glow, 0))); halo.material.needsUpdate = true;
    }
    if (!ready) return;
    if (fig) { holder.remove(fig); fig = null; }
    const base = Object.assign({ base: "soldier", helm: false, weapon: "sword", shieldKind: null }, l);
    fig = makeChar(kit, base);
    fig.rotation.y = holder.children.length ? fig.rotation.y : 0.35;
    holder.add(fig); intro = 0;
  }
  function hexA(hex, a) { const c = new THREE.Color(hex); return "rgba(" + Math.round(c.r * 255) + "," + Math.round(c.g * 255) + "," + Math.round(c.b * 255) + "," + a + ")"; }

  const p = loadChars().then(() => {
    if (!alive) return;
    kit = makeCharKit(track); ready = true;
    if (look) setLook(look);
    host.classList.add("ready");
  });

  function loop(t) {
    if (!alive) return;
    raf = requestAnimationFrame(loop);
    const dt = Math.min(0.05, (t - last) / 1000); last = t;
    if (document.hidden || !host.isConnected || host.offsetParent === null) return;
    frame();
    if (!drag) { vel *= 0.94; holder.rotation.y += (spin * 0.35 + vel) * dt; }
    intro = Math.min(1, intro + dt * 2.2);
    holder.position.y = (1 - intro) * -0.12; holder.scale.setScalar(0.94 + 0.06 * intro);
    if (fig && fig.userData.ch) fig.userData.ch.update(dt, 0, 0, false);
    const a = pg.attributes.position.array;
    for (let i = 0; i < N; i++) { a[i * 3 + 1] += spd[i] * dt; a[i * 3] += Math.sin(t / 900 + i) * 0.0009; if (a[i * 3 + 1] > 2.3) a[i * 3 + 1] = 0.02; }
    pg.attributes.position.needsUpdate = true;
    seamMat.opacity = 0.7 + 0.3 * Math.sin(t / 600);
    renderer.render(scene, cam);
  }
  raf = requestAnimationFrame(loop);

  // drag to turn
  const down = (e) => { drag = { x: e.clientX, r: holder.rotation.y, t: performance.now() }; cv.setPointerCapture && cv.setPointerCapture(e.pointerId); };
  const move = (e) => { if (!drag) return; const dx = e.clientX - drag.x; const nr = drag.r + dx * 0.012; vel = (nr - holder.rotation.y) * 20; holder.rotation.y = nr; };
  const up = () => { drag = null; };
  cv.addEventListener("pointerdown", down); cv.addEventListener("pointermove", move); cv.addEventListener("pointerup", up); cv.addEventListener("pointercancel", up);
  cv.style.touchAction = "pan-y";

  return {
    ready: p,
    setLook,
    state: () => ({ ready, hasFig: !!fig, look: look && look.cloth }),
    dispose() {
      alive = false; cancelAnimationFrame(raf);
      disposables.forEach((d) => { try { d.dispose && d.dispose(); } catch (e) {} });
      try { renderer.dispose(); renderer.forceContextLoss && renderer.forceContextLoss(); } catch (e) {}
      cv.remove();
    }
  };
}
