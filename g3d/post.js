// Voidhammer: post-processing for the High graphics preset only (Medium and Low draw straight to the screen).
// One HDR scene target, a quarter-resolution bloom (bright pass + two blur passes) and ONE full-resolution composite that
// does FXAA, adds the bloom, tone maps (ACES, as the renderer does), applies the Realm's colour grade and writes sRGB.
// So High costs one extra full-screen pass plus three tiny ones. The CSS vignette and grain stay on top, as before.
import * as THREE from "./three.module.min.js";

// per-Realm grade: gain (multiplies), lift (adds to the shadows), saturation, and a warm/cold split for highlights
export const GRADE = {
  ember:  { gain: [1.06, 0.98, 0.9],  lift: [0.018, 0.008, 0.0],  sat: 1.06, hi: [1.04, 0.98, 0.9] },
  stone:  { gain: [1.0, 0.99, 0.97],  lift: [0.008, 0.008, 0.012], sat: 0.94, hi: [1.02, 1.0, 0.96] },
  storm:  { gain: [0.95, 0.99, 1.06], lift: [0.0, 0.008, 0.02],   sat: 0.96, hi: [0.98, 1.0, 1.05] },
  light:  { gain: [1.05, 1.02, 0.94], lift: [0.02, 0.016, 0.006], sat: 1.04, hi: [1.04, 1.02, 0.94] },
  frost:  { gain: [0.94, 1.0, 1.07],  lift: [0.006, 0.012, 0.024], sat: 0.9, hi: [0.98, 1.01, 1.06] },
  spirit: { gain: [0.96, 1.0, 1.04],  lift: [0.01, 0.008, 0.026], sat: 0.92, hi: [1.0, 1.0, 1.04] },
  shadow: { gain: [0.94, 0.94, 1.04], lift: [0.012, 0.006, 0.03], sat: 0.86, hi: [0.98, 0.96, 1.06] },
  metal:  { gain: [1.04, 0.96, 0.96], lift: [0.016, 0.006, 0.008], sat: 0.98, hi: [1.04, 0.98, 0.96] },
  cave:   { gain: [0.98, 0.96, 1.02], lift: [0.008, 0.006, 0.016], sat: 0.9, hi: [1.04, 0.98, 0.92] },
  none:   { gain: [1, 1, 1], lift: [0, 0, 0], sat: 1, hi: [1, 1, 1] }
};

const VS = "varying vec2 vUv; void main(){ vUv = position.xy * 0.5 + 0.5; gl_Position = vec4(position.xy, 0.0, 1.0); }";
const BRIGHT = `uniform sampler2D tSrc; uniform vec2 px; uniform float thr; varying vec2 vUv;
void main(){
  vec3 c = texture2D(tSrc, vUv + px * vec2(-1.0, -1.0)).rgb + texture2D(tSrc, vUv + px * vec2(1.0, -1.0)).rgb
         + texture2D(tSrc, vUv + px * vec2(-1.0, 1.0)).rgb + texture2D(tSrc, vUv + px * vec2(1.0, 1.0)).rgb;
  c *= 0.25; float l = max(c.r, max(c.g, c.b));
  gl_FragColor = vec4(c * (max(l - thr, 0.0) / max(l, 1e-4)), 1.0);
}`;
const BLUR = `uniform sampler2D tSrc; uniform vec2 dir; varying vec2 vUv;
void main(){
  vec3 c = texture2D(tSrc, vUv).rgb * 0.227;
  c += (texture2D(tSrc, vUv + dir * 1.385).rgb + texture2D(tSrc, vUv - dir * 1.385).rgb) * 0.316;
  c += (texture2D(tSrc, vUv + dir * 3.231).rgb + texture2D(tSrc, vUv - dir * 3.231).rgb) * 0.07;
  gl_FragColor = vec4(c, 1.0);
}`;
const COMP = `uniform sampler2D tScene, tBloom; uniform vec2 px; uniform float exposure, bloomK, sat; uniform vec3 gain, lift, hi; varying vec2 vUv;
float lu(vec3 c){ c = c / (1.0 + c); return dot(c, vec3(0.299, 0.587, 0.114)); }
vec3 RRTAndODTFit(vec3 v){ vec3 a = v * (v + 0.0245786) - 0.000090537; vec3 b = v * (0.983729 * v + 0.4329510) + 0.238081; return a / b; }
vec3 aces(vec3 color){
  const mat3 I = mat3(vec3(0.59719, 0.07600, 0.02840), vec3(0.35458, 0.90834, 0.13383), vec3(0.04823, 0.01566, 0.83777));
  const mat3 O = mat3(vec3(1.60475, -0.10208, -0.00327), vec3(-0.53108, 1.10813, -0.07276), vec3(-0.07367, -0.00605, 1.07602));
  color *= exposure / 0.6; color = I * color; color = RRTAndODTFit(color); color = O * color; return clamp(color, 0.0, 1.0);
}
vec3 toSRGB(vec3 c){ return mix(c * 12.92, 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055, step(vec3(0.0031308), c)); }
void main(){
  // FXAA (the compact 3.x form), on the HDR image with luma taken after a soft tone curve
  vec3 nw = texture2D(tScene, vUv + px * vec2(-1.0, -1.0)).rgb, ne = texture2D(tScene, vUv + px * vec2(1.0, -1.0)).rgb;
  vec3 sw = texture2D(tScene, vUv + px * vec2(-1.0, 1.0)).rgb, se = texture2D(tScene, vUv + px * vec2(1.0, 1.0)).rgb, m = texture2D(tScene, vUv).rgb;
  float lNW = lu(nw), lNE = lu(ne), lSW = lu(sw), lSE = lu(se), lM = lu(m);
  float lMin = min(lM, min(min(lNW, lNE), min(lSW, lSE))), lMax = max(lM, max(max(lNW, lNE), max(lSW, lSE)));
  vec3 c = m;
  if (lMax - lMin > max(0.04, lMax * 0.12)) {
    vec2 d = vec2(-((lNW + lNE) - (lSW + lSE)), (lNW + lSW) - (lNE + lSE));
    float red = max((lNW + lNE + lSW + lSE) * 0.03125, 1.0 / 128.0), rcp = 1.0 / (min(abs(d.x), abs(d.y)) + red);
    d = clamp(d * rcp, -8.0, 8.0) * px;
    vec3 a = 0.5 * (texture2D(tScene, vUv + d * (1.0 / 3.0 - 0.5)).rgb + texture2D(tScene, vUv + d * (2.0 / 3.0 - 0.5)).rgb);
    vec3 b = a * 0.5 + 0.25 * (texture2D(tScene, vUv - d * 0.5).rgb + texture2D(tScene, vUv + d * 0.5).rgb);
    float lb = lu(b); c = (lb < lMin || lb > lMax) ? a : b;
  }
  c += texture2D(tBloom, vUv).rgb * bloomK;
  c = aces(c);
  // grade: lift the shadows, tint the highlights, gain, saturation
  float l = dot(c, vec3(0.2126, 0.7152, 0.0722));
  c = c * gain * mix(vec3(1.0), hi, smoothstep(0.35, 0.95, l)) + lift * (1.0 - l);
  c = mix(vec3(dot(c, vec3(0.2126, 0.7152, 0.0722))), c, sat);
  c = clamp(c, 0.0, 1.0); c = mix(c, c * c * (3.0 - 2.0 * c), 0.18); // a gentle S-curve: deeper shadows, cleaner mid contrast
  gl_FragColor = vec4(toSRGB(clamp(c, 0.0, 1.0)), 1.0);
}`;

export function makePost(renderer) {
  const ext = renderer.extensions;
  const hdr = renderer.capabilities.isWebGL2 && (ext.has("EXT_color_buffer_float") || ext.has("EXT_color_buffer_half_float"));
  const type = hdr ? THREE.HalfFloatType : THREE.UnsignedByteType;
  const rt = (w, h, depth) => new THREE.WebGLRenderTarget(w, h, { type, depthBuffer: !!depth, stencilBuffer: false, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, generateMipmaps: false });
  let W = 2, H = 2;
  const rS = rt(2, 2, true), rA = rt(1, 1), rB = rt(1, 1);
  const geo = new THREE.BufferGeometry(); geo.setAttribute("position", new THREE.Float32BufferAttribute([-1, -1, 0, 3, -1, 0, -1, 3, 0], 3));
  const cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1), sc = new THREE.Scene(), quad = new THREE.Mesh(geo); quad.frustumCulled = false; sc.add(quad);
  const mk = (fs, u) => new THREE.ShaderMaterial({ vertexShader: VS, fragmentShader: fs, uniforms: u, depthTest: false, depthWrite: false, toneMapped: false });
  const mBright = mk(BRIGHT, { tSrc: { value: rS.texture }, px: { value: new THREE.Vector2() }, thr: { value: hdr ? 0.95 : 0.8 } });
  const mBlur = mk(BLUR, { tSrc: { value: null }, dir: { value: new THREE.Vector2() } });
  const mComp = mk(COMP, { tScene: { value: rS.texture }, tBloom: { value: rA.texture }, px: { value: new THREE.Vector2() }, exposure: { value: 1 }, bloomK: { value: 0.4 }, sat: { value: 1 }, gain: { value: new THREE.Vector3(1, 1, 1) }, lift: { value: new THREE.Vector3() }, hi: { value: new THREE.Vector3(1, 1, 1) } });
  const v2 = new THREE.Vector2();
  function size() {
    renderer.getDrawingBufferSize(v2); const w = Math.max(2, v2.x | 0), h = Math.max(2, v2.y | 0); if (w === W && h === H) return;
    W = w; H = h; rS.setSize(W, H); const qw = Math.max(1, W >> 2), qh = Math.max(1, H >> 2); rA.setSize(qw, qh); rB.setSize(qw, qh);
    mBright.uniforms.px.value.set(1 / W, 1 / H); mComp.uniforms.px.value.set(1 / W, 1 / H); mBlur.userData.q = [qw, qh];
  }
  function pass(m, target) { quad.material = m; renderer.setRenderTarget(target); renderer.render(sc, cam); }
  const post = {
    hdr,
    // the tints are pulled 30% back towards neutral and the lift halved, so the blacks stay deep and figures read
    setGrade(key) { const g = GRADE[key] || GRADE.none, u = mComp.uniforms, k = (v) => v.map((x) => 1 + (x - 1) * 0.7); u.gain.value.fromArray(k(g.gain)); u.lift.value.fromArray(g.lift.map((x) => x * 0.5)); u.hi.value.fromArray(k(g.hi)); u.sat.value = 1 + (g.sat - 1) * 0.7; },
    render(scene, camera) {
      size();
      const ar = renderer.autoClear; renderer.autoClear = true;
      renderer.setRenderTarget(rS); renderer.render(scene, camera);
      pass(mBright, rA);
      const [qw, qh] = mBlur.userData.q;
      mBlur.uniforms.tSrc.value = rA.texture; mBlur.uniforms.dir.value.set(1 / qw, 0); pass(mBlur, rB);
      mBlur.uniforms.tSrc.value = rB.texture; mBlur.uniforms.dir.value.set(0, 1 / qh); pass(mBlur, rA);
      mComp.uniforms.exposure.value = renderer.toneMappingExposure;
      pass(mComp, null);
      renderer.autoClear = ar;
    },
    dispose() { [rS, rA, rB].forEach((r) => r.dispose()); [mBright, mBlur, mComp].forEach((m) => m.dispose()); geo.dispose(); }
  };
  return post;
}
