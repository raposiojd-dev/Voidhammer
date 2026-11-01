// VOIDHAMMER premium front door (game/premium-v1): boot splash, cinematic title, canon character creation with a 3D
// preview, the opening cinematic, screen transitions, UI sound cues, settings and credits, and the save migration.
// The game talks to this file through one marked bridge block near the end of index.html (search "PREMIUM FRONT DOOR").
// If this file fails to load, the bridge does nothing and the old title, creator and intro run unchanged.
(function () {
  "use strict";
  var C = window.VH_CANON;
  var B = null;                       // the bridge into the game, set by attach()
  var PKEY = "vh-fd-prefs-v1";
  var prefs = { sfx: true, motion: "auto" };
  try { Object.assign(prefs, JSON.parse(localStorage.getItem(PKEY) || "{}")); } catch (e) {}
  function savePrefs() { try { localStorage.setItem(PKEY, JSON.stringify(prefs)); } catch (e) {} applyMotion(); }
  function applyMotion() { document.documentElement.classList.toggle("fd-rm", prefs.motion === "reduce"); }
  function still() { return prefs.motion === "reduce" || (window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches); }
  function $(s, r) { return (r || document).querySelector(s); }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  var uid = 0;

  // =========================================================== ART: sigil, crests, icons (inline SVG, no assets)
  function sigil(cls) {
    // the nine-scored ring with the ninth score missing (the Unstable Shard), split by a thin void crack
    var s = "", i, r = 40, c = 50;
    for (i = 0; i < 9; i++) {
      if (i === 8) continue;
      var a0 = (i / 9) * Math.PI * 2 - Math.PI / 2 + 0.08, a1 = ((i + 1) / 9) * Math.PI * 2 - Math.PI / 2 - 0.08;
      s += '<path d="M' + (c + r * Math.cos(a0)).toFixed(2) + " " + (c + r * Math.sin(a0)).toFixed(2) + " A" + r + " " + r + " 0 0 1 " + (c + r * Math.cos(a1)).toFixed(2) + " " + (c + r * Math.sin(a1)).toFixed(2) + '"/>';
    }
    var id = "fdsg" + (++uid);
    return '<svg class="' + (cls || "fd-sigil") + '" viewBox="0 0 100 100" aria-hidden="true"><defs><linearGradient id="' + id + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff0c8"/><stop offset=".5" stop-color="#c9953f"/><stop offset="1" stop-color="#6e4c1e"/></linearGradient></defs>' +
      '<g fill="none" stroke="url(#' + id + ')" stroke-width="5" stroke-linecap="round">' + s + '</g>' +
      '<circle cx="50" cy="50" r="27" fill="none" stroke="rgba(232,199,126,.35)" stroke-width="1"/>' +
      '<path d="M52 18 L47 34 L54 44 L46 58 L53 70 L49 84" fill="none" stroke="#8e5cff" stroke-width="5" stroke-linecap="round" opacity=".55" filter="blur(1.5px)"/>' +
      '<path d="M52 18 L47 34 L54 44 L46 58 L53 70 L49 84" fill="none" stroke="#efe6ff" stroke-width="1.4" stroke-linecap="round"/></svg>';
  }
  var SHIELD = "M50 4 L94 14 L94 58 C94 92 72 114 50 126 C28 114 6 92 6 58 L6 14 Z";
  function crest(id, cls, initials) {
    var r = C.realm(id), g = "fdcr" + (++uid), p = r.pal, inner = "";
    if (id === "light") {
      var rays = ""; for (var i = 0; i < 16; i++) { var a = i / 16 * Math.PI * 2; rays += '<line x1="' + (50 + Math.cos(a) * 25).toFixed(1) + '" y1="' + (62 + Math.sin(a) * 25).toFixed(1) + '" x2="' + (50 + Math.cos(a) * (i % 2 ? 31 : 35)).toFixed(1) + '" y2="' + (62 + Math.sin(a) * (i % 2 ? 31 : 35)).toFixed(1) + '"/>'; }
      inner = '<g stroke="#C9A13B" stroke-width="2.4" stroke-linecap="round">' + rays + '</g><circle cx="50" cy="62" r="22" fill="#C9A13B"/><circle cx="50" cy="62" r="19" fill="none" stroke="#f2dc9a" stroke-width="1"/>' +
        '<path d="M33 62 Q50 48 67 62 Q50 76 33 62 Z" fill="#FAFAF5" stroke="#5a4214" stroke-width="1.2"/><circle cx="50" cy="62" r="6" fill="#3a2a10"/><circle cx="48" cy="60" r="1.6" fill="#fff"/>';
    } else if (id === "shadow") {
      inner = '<path d="M14 24 L86 24" stroke="rgba(255,255,255,.04)" stroke-width="30"/><g stroke="#8E5CFF" stroke-width="2.2" stroke-linecap="round"><path d="M24 98 L36 88"/><path d="M27 89 L31 94"/><path d="M31 86 L35 91"/></g>';
    } else if (id === "storm") {
      inner = '<circle cx="50" cy="56" r="26" fill="#4F6A8A" stroke="#d8cdb5" stroke-width="1.5"/><path d="M56 26 L42 56 L53 56 L42 88 L64 50 L52 50 L62 26 Z" fill="#F2F4F7" stroke="#1f2e4a" stroke-width="1"/>' +
        '<path d="M50 84 L50 112" stroke="#D8CDB5" stroke-width="2.4"/><circle cx="50" cy="92" r="3" fill="#D8CDB5"/><circle cx="50" cy="101" r="3" fill="#D8CDB5"/><circle cx="50" cy="110" r="3" fill="#D8CDB5"/>';
    } else if (id === "frost") {
      var knots = ""; for (var k = 0; k < 9; k++) { var b = k / 9 * Math.PI * 2; knots += '<circle cx="' + (50 + Math.cos(b) * 24).toFixed(1) + '" cy="' + (62 + Math.sin(b) * 24).toFixed(1) + '" r="3.2" fill="#fff"/>'; }
      inner = '<circle cx="50" cy="62" r="24" fill="none" stroke="#fff" stroke-width="2.6"/>' + knots + '<circle cx="50" cy="62" r="15" fill="#F1F3F2" stroke="#3E5568" stroke-width="1.2"/><circle cx="50" cy="62" r="9" fill="none" stroke="rgba(62,85,104,.35)" stroke-width="1"/>';
    } else if (id === "stone") {
      var ini = esc((initials || "").slice(0, 2).toUpperCase()) || "&#183;&#183;";
      inner = '<path d="M34 86 L34 44 Q34 30 50 30 Q66 30 66 44 L66 86 Z" fill="#B5893A" stroke="#4a3412" stroke-width="1.6"/><path d="M38 84 L38 46 Q38 35 50 35" fill="none" stroke="#f0d08a" stroke-width="1.2" opacity=".7"/>' +
        '<rect x="30" y="86" width="40" height="7" fill="#7a5a24" stroke="#4a3412" stroke-width="1.2"/><text x="50" y="62" text-anchor="middle" font-family="Cinzel,serif" font-weight="900" font-size="11" fill="#4a3412">I</text>' +
        '<text x="50" y="110" text-anchor="middle" font-family="Cinzel,serif" font-weight="900" font-size="13" letter-spacing="2" fill="#d8c8a0">' + ini + '</text>';
    } else if (id === "ember") {
      var fl = ""; for (var f = 0; f < 12; f++) { var c2 = f / 12 * Math.PI * 2, x0 = 50 + Math.cos(c2) * 19, y0 = 62 + Math.sin(c2) * 19, x1 = 50 + Math.cos(c2) * 31, y1 = 62 + Math.sin(c2) * 31, xl = 50 + Math.cos(c2 - 0.22) * 20, yl = 62 + Math.sin(c2 - 0.22) * 20, xr = 50 + Math.cos(c2 + 0.22) * 20, yr = 62 + Math.sin(c2 + 0.22) * 20; fl += '<path d="M' + xl.toFixed(1) + " " + yl.toFixed(1) + " Q" + x1.toFixed(1) + " " + y1.toFixed(1) + " " + x1.toFixed(1) + " " + y1.toFixed(1) + " Q" + x0.toFixed(1) + " " + y0.toFixed(1) + " " + xr.toFixed(1) + " " + yr.toFixed(1) + ' Z"/>'; }
      inner = '<g fill="#FF7A1A" stroke="#ffcf7a" stroke-width=".6">' + fl + '</g><circle cx="50" cy="62" r="19" fill="#ff9a3a" opacity=".35"/><path d="M38 60 L45 48 L58 47 L64 58 L60 72 L46 75 Z" fill="#1a1210" stroke="#3a2a22" stroke-width="1.2"/><path d="M45 52 L52 50" stroke="#ff7a1a" stroke-width="1.4" opacity=".8"/>';
    } else if (id === "spirit") {
      inner = '<rect x="10" y="88" width="80" height="26" fill="#141416"/><path d="M20 96 Q30 93 40 96 T60 96 T80 96" fill="none" stroke="#C0C4C8" stroke-width="1.2"/><path d="M26 104 Q36 101 46 104 T66 104" fill="none" stroke="#C0C4C8" stroke-width="1" opacity=".6"/>' +
        '<path d="M50 24 L50 32" stroke="#C0C4C8" stroke-width="2"/><path d="M40 40 L60 40 L57 34 L43 34 Z" fill="#C0C4C8"/><rect x="40" y="40" width="20" height="30" rx="2" fill="rgba(232,240,255,.25)" stroke="#E6EAF0" stroke-width="2"/>' +
        '<path d="M50 46 Q56 54 50 62 Q44 54 50 46 Z" fill="#E8F0FF"/><path d="M38 70 L62 70 L58 76 L42 76 Z" fill="#C0C4C8"/><path d="M50 78 L50 90" stroke="rgba(232,240,255,.5)" stroke-width="3"/>';
    } else if (id === "march") {
      // per pale, fire and stone: a Flameborne flame and a Stonehold hearthstone set side by side on the Warm Rock
      inner = '<rect x="0" y="0" width="50" height="130" fill="#9E2B25"/><path d="M50 4 V126" stroke="#B87333" stroke-width="1.6"/>' +
        '<path d="M32 76 Q22 62 30 50 Q32 58 36 58 Q34 46 42 36 Q42 50 48 56 Q52 66 46 76 Z" fill="#FF7A1A" stroke="#ffcf7a" stroke-width=".8"/>' +
        '<rect x="54" y="50" width="22" height="26" fill="#9a9a94" stroke="#3a3a36" stroke-width="1.4"/><path d="M54 63 H76 M65 50 V63" stroke="#3a3a36" stroke-width="1"/>' +
        '<path d="M18 80 Q50 72 82 80 L84 92 Q50 98 16 92 Z" fill="#141210" stroke="#3a2a22" stroke-width="1.4"/><path d="M30 84 Q50 80 70 84" stroke="#ff7a1a" stroke-width="1" opacity=".55" fill="none"/>';
    } else if (id === "metal") {
      inner = '<path d="M26 74 L26 52 L33 58 L38 44 L44 56 L50 40 L56 56 L62 44 L67 58 L74 52 L74 74 Z" fill="#1B1B1C" stroke="#B08D57" stroke-width="1.4"/><rect x="26" y="74" width="48" height="9" fill="#1B1B1C" stroke="#B08D57" stroke-width="1.4"/>' +
        '<g fill="#B08D57"><circle cx="32" cy="78.5" r="1.6"/><circle cx="41" cy="78.5" r="1.6"/><circle cx="50" cy="78.5" r="1.6"/><circle cx="59" cy="78.5" r="1.6"/><circle cx="68" cy="78.5" r="1.6"/></g><circle cx="50" cy="51" r="2.6" fill="#FF6A13"/><circle cx="50" cy="51" r="6" fill="#FF6A13" opacity=".3"/>';
    }
    var field = { light: "#F4EFE3", shadow: "#2E2F33", storm: "#1F2E4A", frost: "#A9C9DB", stone: "#6E6E6A", ember: "#9E2B25", spirit: "#C9CCCB", metal: "#8E3B2A", march: "#6E6E6A" }[id] || p.a;
    return '<svg class="' + (cls || "") + '" viewBox="0 0 100 130" aria-hidden="true"><defs><linearGradient id="' + g + 'f" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff0c8"/><stop offset=".35" stop-color="#b98a40"/><stop offset=".6" stop-color="#4a3416"/><stop offset="1" stop-color="#e3c27a"/></linearGradient>' +
      '<linearGradient id="' + g + 's" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="rgba(255,255,255,.22)"/><stop offset=".5" stop-color="rgba(255,255,255,0)"/><stop offset="1" stop-color="rgba(0,0,0,.35)"/></linearGradient>' +
      '<clipPath id="' + g + 'c"><path d="' + SHIELD + '"/></clipPath></defs>' +
      '<path d="' + SHIELD + '" fill="' + field + '"/><g clip-path="url(#' + g + 'c)">' + inner + '<rect width="100" height="130" fill="url(#' + g + 's)"/></g>' +
      '<path d="' + SHIELD + '" fill="none" stroke="url(#' + g + 'f)" stroke-width="5"/><path d="' + SHIELD + '" fill="none" stroke="rgba(0,0,0,.55)" stroke-width="1" transform="translate(50 65) scale(.9) translate(-50 -65)"/></svg>';
  }
  var ICON = {
    spear: '<path d="M4 20 L18 6"/><path d="M15 4 L20 4 L20 9 L17 7 Z" fill="currentColor"/><path d="M6 15 L9 18"/>',
    scales: '<path d="M12 4 V20"/><path d="M7 20 H17"/><path d="M5 7 H19"/><path d="M5 7 L2.5 13 H7.5 Z"/><path d="M19 7 L16.5 13 H21.5 Z"/>',
    anvil: '<path d="M3 8 H16 C18 8 20 9 21 11 H15 L13 14 V16 H17 V19 H6 V16 H10 V14 L7 11 C5 11 3 10 3 8 Z"/>',
    lamp: '<path d="M12 2 V5"/><path d="M8 7 H16 L15 5 H9 Z"/><rect x="8" y="7" width="8" height="10" rx="1"/><path d="M12 9.5 Q14 12 12 14.5 Q10 12 12 9.5 Z" fill="currentColor"/><path d="M7 17 H17 L16 20 H8 Z"/>',
    sheaf: '<path d="M12 21 V9"/><path d="M12 13 L7 6"/><path d="M12 13 L17 6"/><path d="M12 11 L9 4"/><path d="M12 11 L15 4"/><path d="M8 16 H16"/>',
    mask: '<path d="M3 9 C3 7 5 6 12 6 C19 6 21 7 21 9 C21 14 18 17 15 17 C13.5 17 13 15 12 15 C11 15 10.5 17 9 17 C6 17 3 14 3 9 Z"/><path d="M6.5 10.5 H10"/><path d="M14 10.5 H17.5"/>',
    banner: '<path d="M6 21 V3"/><path d="M6 4 H18 L15 8 L18 12 H6"/>',
    crack: '<path d="M13 2 L10 8 L14 12 L9 17 L12 22"/><path d="M14 12 L18 13"/><path d="M10 8 L6 7"/>',
    spark: '<path d="M12 2 L13.5 10.5 L22 12 L13.5 13.5 L12 22 L10.5 13.5 L2 12 L10.5 10.5 Z"/>',
    gift: '<rect x="4" y="9" width="16" height="11" rx="1"/><path d="M3 9 H21 V6 H3 Z"/><path d="M12 6 V20"/><path d="M12 6 C10 2 6 3 7 6"/><path d="M12 6 C14 2 18 3 17 6"/>',
    compass: '<circle cx="12" cy="12" r="9"/><path d="M15.5 8.5 L13.5 13.5 L8.5 15.5 L10.5 10.5 Z" fill="currentColor"/>',
    quote: '<path d="M5 18 C5 12 7 9 10 7"/><path d="M13 18 C13 12 15 9 18 7"/>',
    dice: '<rect x="4" y="4" width="16" height="16" rx="3"/><circle cx="9" cy="9" r="1.3" fill="currentColor"/><circle cx="15" cy="15" r="1.3" fill="currentColor"/><circle cx="15" cy="9" r="1.3" fill="currentColor"/><circle cx="9" cy="15" r="1.3" fill="currentColor"/>',
    left: '<path d="M15 4 L7 12 L15 20"/>', right: '<path d="M9 4 L17 12 L9 20"/>', x: '<path d="M6 6 L18 18 M18 6 L6 18"/>'
  };
  function icon(n, cls) { return '<svg class="' + (cls || "") + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (ICON[n] || "") + "</svg>"; }

  function logoSvg() {
    var g = "fdlg" + (++uid);
    // The wordmark: forged gold Cinzel, extruded, cracked between the D and the H by a vein of void light.
    return '<svg class="fd-logo" viewBox="0 0 1000 200" role="img" aria-label="Voidhammer"><defs>' +
      '<linearGradient id="' + g + 'm" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff6d8"/><stop offset=".32" stop-color="#f1d08a"/><stop offset=".5" stop-color="#b98232"/><stop offset=".53" stop-color="#5e3c14"/><stop offset=".7" stop-color="#b9833a"/><stop offset="1" stop-color="#f6dc9c"/></linearGradient>' +
      '<linearGradient id="' + g + 'w" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="rgba(255,255,255,0)"/><stop offset=".5" stop-color="rgba(255,250,235,.85)"/><stop offset="1" stop-color="rgba(255,255,255,0)"/></linearGradient>' +
      '<filter id="' + g + 'b" x="-10%" y="-40%" width="120%" height="180%"><feGaussianBlur stdDeviation="14"/></filter>' +
      '<filter id="' + g + 'v" x="-50%" y="-10%" width="200%" height="120%"><feGaussianBlur stdDeviation="4"/></filter>' +
      '<mask id="' + g + 'k"><rect width="1000" height="200" fill="#fff"/><path d="M505 8 L494 52 L510 84 L492 120 L508 150 L498 196" stroke="#000" stroke-width="7" fill="none"/></mask>' +
      '<clipPath id="' + g + 'c"><text x="500" y="150" text-anchor="middle" font-family="Cinzel,serif" font-weight="900" font-size="148" textLength="960" lengthAdjust="spacingAndGlyphs">VOIDHAMMER</text></clipPath></defs>' +
      '<text x="500" y="150" text-anchor="middle" font-family="Cinzel,serif" font-weight="900" font-size="148" textLength="960" lengthAdjust="spacingAndGlyphs" fill="#ff6a13" opacity=".55" filter="url(#' + g + 'b)">VOIDHAMMER</text>' +
      '<g mask="url(#' + g + 'k)">' +
      '<text x="500" y="157" text-anchor="middle" font-family="Cinzel,serif" font-weight="900" font-size="148" textLength="960" lengthAdjust="spacingAndGlyphs" fill="#1a0d04">VOIDHAMMER</text>' +
      '<text x="500" y="150" text-anchor="middle" font-family="Cinzel,serif" font-weight="900" font-size="148" textLength="960" lengthAdjust="spacingAndGlyphs" fill="url(#' + g + 'm)" stroke="#2a1606" stroke-width="2.5" paint-order="stroke">VOIDHAMMER</text>' +
      '<g clip-path="url(#' + g + 'c)"><rect class="fd-sweep" x="0" y="0" width="260" height="200" fill="url(#' + g + 'w)" transform="translate(-420 0)" style="mix-blend-mode:overlay"/></g></g>' +
      '<g class="fd-crackline"><path d="M505 8 L494 52 L510 84 L492 120 L508 150 L498 196" stroke="#8e5cff" stroke-width="10" fill="none" filter="url(#' + g + 'v)"/>' +
      '<path d="M505 8 L494 52 L510 84 L492 120 L508 150 L498 196" stroke="#f1eaff" stroke-width="2" fill="none" stroke-linecap="round"/></g></svg>';
  }
  function skyCrack() {
    return '<svg class="fd-crack" viewBox="0 0 600 400" aria-hidden="true">' +
      '<path class="glow" d="M590 10 L520 70 L540 110 L470 160 L490 200 L420 250 L440 290 L380 330 L395 360 L350 395"/>' +
      '<path class="glow2" d="M590 10 L520 70 L540 110 L470 160 L490 200 L420 250 L440 290 L380 330 L395 360 L350 395 M470 160 L430 150 L400 170 M420 250 L470 270"/>' +
      '<path class="core" d="M590 10 L520 70 L540 110 L470 160 L490 200 L420 250 L440 290 L380 330 L395 360 L350 395 M470 160 L430 150 L400 170 M420 250 L470 270"/></svg>';
  }

  // =========================================================== SOUND: synthesised UI cues (no files), own context
  var AU = { ctx: null, out: null, nb: null };
  function au() {
    if (!prefs.sfx) return null;
    try {
      if (!AU.ctx) { var Ctx = window.AudioContext || window.webkitAudioContext; if (!Ctx) return null; AU.ctx = new Ctx(); AU.out = AU.ctx.createGain(); AU.out.gain.value = 0.42; AU.out.connect(AU.ctx.destination); }
      if (AU.ctx.state === "suspended") AU.ctx.resume();
    } catch (e) { return null; }
    return AU.ctx;
  }
  function tone(t, f0, f1, dur, vol, type) {
    var c = AU.ctx, o = c.createOscillator(), g = c.createGain(); o.type = type || "sine"; o.frequency.setValueAtTime(f0, t); if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + 0.004); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); o.connect(g); g.connect(AU.out); o.start(t); o.stop(t + dur + 0.05);
  }
  function hiss(t, dur, vol, fc, type, fc2) {
    var c = AU.ctx; if (!AU.nb) { var n = c.sampleRate, b = c.createBuffer(1, n, n), d = b.getChannelData(0); for (var i = 0; i < n; i++) d[i] = Math.random() * 2 - 1; AU.nb = b; }
    var s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain(); s.buffer = AU.nb; s.loop = true; f.type = type || "bandpass"; f.frequency.setValueAtTime(fc, t); if (fc2) f.frequency.exponentialRampToValueAtTime(fc2, t + dur); f.Q.value = 0.9;
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); s.connect(f); f.connect(g); g.connect(AU.out); s.start(t, Math.random()); s.stop(t + dur + 0.05);
  }
  var SFX = {
    tick: function (t) { tone(t, 2400, 1900, 0.03, 0.035, "triangle"); },
    press: function (t) { tone(t, 1180, 1180, 0.22, 0.09, "sine"); tone(t, 1770, 1760, 0.16, 0.05, "sine"); tone(t, 140, 70, 0.12, 0.16, "sine"); hiss(t, 0.05, 0.05, 4200, "highpass"); },
    back: function (t) { tone(t, 760, 740, 0.18, 0.08, "sine"); tone(t, 110, 60, 0.12, 0.12, "sine"); },
    select: function (t, i) { var f = 392 * Math.pow(2, ((i || 0) % 8) / 12 * 2); tone(t, f, f, 0.5, 0.06, "sine"); tone(t + 0.04, f * 1.5, f * 1.5, 0.45, 0.035, "sine"); hiss(t, 0.35, 0.05, 900, "bandpass", 3200); },
    whoosh: function (t) { hiss(t, 0.55, 0.12, 300, "bandpass", 2400); },
    boom: function (t) { tone(t, 90, 38, 1.6, 0.32, "sine"); tone(t, 180, 60, 0.6, 0.12, "triangle"); hiss(t, 1.4, 0.08, 1800, "lowpass", 200); tone(t + 0.12, 1568, 1560, 1.8, 0.025, "sine"); tone(t + 0.2, 2349, 2340, 1.6, 0.018, "sine"); },
    forge: function (t) { tone(t, 1320, 1310, 0.9, 0.11, "sine"); tone(t, 1980, 1975, 0.7, 0.06, "sine"); tone(t, 2640, 2630, 0.5, 0.03, "sine"); tone(t, 110, 48, 0.5, 0.25, "sine"); hiss(t, 0.08, 0.12, 5000, "highpass"); hiss(t + 0.05, 1.2, 0.05, 2600, "bandpass", 400); },
    card: function (t) { hiss(t, 0.9, 0.035, 500, "bandpass", 1600); tone(t, 196, 196, 1.2, 0.03, "sine"); }
  };
  function cue(n, arg) { var c = au(); if (!c || c.state !== "running") return; try { SFX[n](c.currentTime + 0.005, arg); } catch (e) {} }
  // unlock on the first touch (iOS needs this inside a gesture), for our cues and for the game's music
  function unlock() {
    var c = au(); if (c) { try { var b = c.createBuffer(1, 1, 22050), s = c.createBufferSource(); s.buffer = b; s.connect(c.destination); s.start(0); } catch (e) {} }
    if (B && B.audioUnlock) try { B.audioUnlock(); } catch (e) {}
  }
  ["pointerdown", "touchend", "keydown"].forEach(function (ev) { document.addEventListener(ev, function once() { unlock(); }, { capture: true, passive: true }); });

  // =========================================================== TRANSITIONS: the ember wipe
  var wiping = false;
  function wipe(mid, x, y) {
    if (still()) { mid(); return; }
    if (wiping) { mid(); return; }
    wiping = true;
    var w = el("div", "fd-wipe"), r = el("div", "fd-wipe-ring");
    var px = x == null ? "50%" : x + "px", py = y == null ? "50%" : y + "px";
    [w, r].forEach(function (e) { e.style.setProperty("--x", px); e.style.setProperty("--y", py); document.body.appendChild(e); });
    cue("whoosh");
    requestAnimationFrame(function () { requestAnimationFrame(function () { w.classList.add("in"); r.classList.add("in"); }); });
    setTimeout(function () {
      try { mid(); } catch (e) { console.error(e); }
      w.classList.remove("in"); w.classList.add("out");
      setTimeout(function () { w.remove(); r.remove(); wiping = false; }, 560);
    }, 540);
  }
  var lastTap = { x: null, y: null };
  document.addEventListener("pointerdown", function (e) { lastTap = { x: e.clientX, y: e.clientY }; }, true);

  // =========================================================== FX: embers, bokeh and void motes on a canvas
  function sprite(r, stops) { var c = document.createElement("canvas"); c.width = c.height = r * 2; var g = c.getContext("2d"), gr = g.createRadialGradient(r, r, 0, r, r, r); stops.forEach(function (s) { gr.addColorStop(s[0], s[1]); }); g.fillStyle = gr; g.fillRect(0, 0, r * 2, r * 2); return c; }
  function makeFx(cv, opt) {
    opt = opt || {};
    var g = cv.getContext("2d"), P = [], on = false, last = 0, W = 0, H = 0, D = Math.min(window.devicePixelRatio || 1, 1.5), mx = 0, my = 0;
    var SPR = { ember: sprite(16, [[0, "rgba(255,236,190,1)"], [0.25, "rgba(255,160,70,.9)"], [0.6, "rgba(255,90,20,.25)"], [1, "rgba(255,60,10,0)"]]),
      bokeh: sprite(48, [[0, "rgba(255,170,90,.35)"], [0.6, "rgba(255,120,40,.12)"], [1, "rgba(255,100,30,0)"]]),
      void: sprite(20, [[0, "rgba(240,230,255,1)"], [0.3, "rgba(170,130,255,.75)"], [1, "rgba(120,80,255,0)"]]) };
    var n = opt.n || 90;
    function spawn(p, fresh) {
      var layer = Math.random(); p.z = layer < 0.55 ? 0 : layer < 0.9 ? 1 : 2; p.k = Math.random() < (opt.voidK || 0.1) ? "void" : p.z === 2 ? "bokeh" : "ember";
      p.x = Math.random(); p.y = fresh ? Math.random() : 1.05 + Math.random() * 0.1; p.vy = (0.012 + Math.random() * 0.03) * (p.z + 1) * (p.k === "void" ? 0.5 : 1); p.vx = (Math.random() - 0.5) * 0.01;
      p.s = (p.z === 0 ? 1.2 + Math.random() * 1.6 : p.z === 1 ? 2.4 + Math.random() * 2.6 : 16 + Math.random() * 26) * (p.k === "void" ? 1.3 : 1); p.ph = Math.random() * 6.28; p.a = 0.35 + Math.random() * 0.6;
      return p;
    }
    for (var i = 0; i < n; i++) P.push(spawn({}, true));
    function size() { var w = cv.clientWidth, h = cv.clientHeight; if (w !== W || h !== H) { W = w; H = h; cv.width = Math.round(w * D); cv.height = Math.round(h * D); } }
    function loop(t) {
      if (!on) return; requestAnimationFrame(loop);
      var dt = Math.min(0.05, (t - (last || t)) / 1000); last = t;
      if (document.hidden || cv.offsetParent === null) return;
      size(); g.setTransform(D, 0, 0, D, 0, 0); g.clearRect(0, 0, W, H); g.globalCompositeOperation = "lighter";
      for (var i = 0; i < P.length; i++) {
        var p = P[i]; p.y -= p.vy * dt * 1.6; p.x += (p.vx + Math.sin(t / 1400 + p.ph) * 0.006 * (p.z + 1)) * dt;
        if (p.y < -0.08 || p.x < -0.1 || p.x > 1.1) spawn(p, false);
        var tw = 0.55 + 0.45 * Math.sin(t / (p.k === "void" ? 300 : 520) + p.ph), sz = p.s * (p.k === "bokeh" ? 1 : (0.7 + tw * 0.5));
        var px = p.x * W + mx * (p.z + 1) * 6, py = p.y * H + my * (p.z + 1) * 4;
        g.globalAlpha = p.a * (p.k === "bokeh" ? 0.6 : tw) * Math.min(1, (1.05 - p.y) * 4);
        g.drawImage(SPR[p.k], px - sz, py - sz, sz * 2, sz * 2);
      }
      g.globalAlpha = 1;
    }
    return {
      start: function () { if (on) return; on = true; last = 0; requestAnimationFrame(loop); },
      stop: function () { on = false; },
      look: function (x, y) { mx = x; my = y; }
    };
  }

  // =========================================================== BOOT SPLASH (until the game is ready)
  function bootSplash() {
    if (B || $("#fd-boot")) return;
    var b = el("div", null, '<div class="fd-boot-in">' + sigil("fd-sigil") + '<div class="fd-boot-word">VOIDHAMMER</div><div class="fd-boot-bar"><i></i></div></div>');
    b.id = "fd-boot"; document.body.appendChild(b);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", bootSplash); else bootSplash();

  // =========================================================== TITLE
  var T = { built: false, fx: null, tapped: false };
  function buildTitle() {
    var t = $("#title"); if (!t) return false;
    t.classList.add("fd-on");
    ["tcont", "tnew"].forEach(function (id) { var o = t.querySelector(".tcol #" + id); if (o) o.id = id + "-old"; });
    var w = el("div", "fd-title"); w.id = "fd-title";
    w.innerHTML = '<div class="fd-rays"></div><div class="fd-fog"></div><canvas class="fd-fx"></canvas>' + skyCrack() +
      '<div class="fd-logo-wrap fd-reveal d1">' + sigil("fd-sigil") + logoSvg() + '<div class="fd-subtitle">The Shattered Realms</div>' +
      '<p class="fd-tagline fd-reveal d2">Nine Realms. One fractured world.<br>And the Void that hungers for all of it.</p></div>' +
      '<nav class="fd-menu" aria-label="Main menu">' +
      '<button id="tcont" data-act="tcont" class="fd-btn fd-btn--primary fd-reveal d3">Continue<small id="fd-cont-sub"></small></button>' +
      '<button id="tnew" data-act="tnew" class="fd-btn fd-reveal d4">New Game</button>' +
      '<button data-fd="settings" class="fd-btn fd-reveal d5">Settings</button>' +
      '<button data-fd="credits" class="fd-btn fd-reveal d6">Credits</button></nav>' +
      '<div class="fd-foot fd-reveal d7"><span>A saga by John Raposio</span><span>The Concord&#8217;s last season</span></div>' +
      '<div class="fd-grain"></div>' +
      '<button class="fd-tap" id="fd-tap" aria-label="Tap to begin"><div><span>Tap to begin</span><small>Best with sound</small></div></button>';
    t.appendChild(w);
    T.fx = makeFx(w.querySelector(".fd-fx"), { n: 95, voidK: 0.08 });
    w.querySelector("#fd-tap").addEventListener("click", function (e) { tapBegin(e.clientX, e.clientY); });
    w.addEventListener("click", function (e) {
      var b = e.target.closest && e.target.closest("[data-fd]"); if (!b) return;
      var k = b.getAttribute("data-fd"); cue("press");
      if (k === "settings") openSettings(); else if (k === "credits") openCredits();
    });
    menuSounds(w);
    // pointer parallax (mouse only; phones keep still)
    if (window.matchMedia && matchMedia("(pointer:fine)").matches) w.addEventListener("pointermove", function (e) { var x = e.clientX / innerWidth - 0.5, y = e.clientY / innerHeight - 0.5; T.fx.look(x, y); var lw = w.querySelector(".fd-logo-wrap"); if (lw && !still()) lw.style.translate = (-x * 8).toFixed(1) + "px " + (-y * 5).toFixed(1) + "px"; });
    T.built = true; return true;
  }
  function menuSounds(root) {
    root.addEventListener("pointerover", function (e) { var b = e.target.closest && e.target.closest(".fd-btn,.fd-chip-realm,.fd-road,.fd-swatch"); if (b && b !== root._hov && e.pointerType === "mouse") { root._hov = b; cue("tick"); } });
  }
  function tapBegin(x, y) {
    if (T.tapped) return; T.tapped = true; unlock();
    var w = $("#fd-title"); if (!w) return;
    cue("boom");
    var tap = w.querySelector("#fd-tap"); tap.classList.add("out"); setTimeout(function () { tap.hidden = true; }, 650);
    if (!still()) { var r = el("div", "fd-wipe-ring"); r.style.setProperty("--x", x + "px"); r.style.setProperty("--y", y + "px"); document.body.appendChild(r); requestAnimationFrame(function () { r.classList.add("burst"); }); setTimeout(function () { r.remove(); }, 900); }
    w.classList.add("go");
  }
  function onTitle() {
    if (!T.built && !buildTitle()) return;
    var w = $("#fd-title"), has = B.hasSave(), cont = $("#tcont"), nw = $("#tnew");
    cont.hidden = !has; cont.className = "fd-btn fd-btn--primary fd-reveal d3"; nw.className = "fd-btn fd-reveal d4" + (has ? "" : " fd-btn--primary");
    var sub = $("#fd-cont-sub"); if (sub) { var l = ""; try { l = (B.slotLabel() || "").split(" · ").slice(0, 2).join(" · "); } catch (e) {} sub.textContent = l; }
    if (T.tapped) { w.classList.add("go"); var tp = $("#fd-tap"); if (tp) tp.hidden = true; }
    T.fx.start();
    watchTitle();
  }
  function watchTitle() { var t = $("#title"); if (!t || T.mo) return; T.mo = new MutationObserver(function () { if (t.hidden) T.fx.stop(); else T.fx.start(); }); T.mo.observe(t, { attributes: true, attributeFilter: ["hidden"] }); }

  // =========================================================== MODALS: settings, credits
  function modal(html, onClick) {
    var s = el("div", "fd-modal-scrim"); s.innerHTML = '<div class="fd-modal fd-panel" role="dialog" aria-modal="true">' + html + "</div>";
    document.body.appendChild(s);
    function close() { cue("back"); s.remove(); document.removeEventListener("keydown", key, true); }
    function key(e) { if (e.key === "Escape") { e.stopPropagation(); close(); } }
    document.addEventListener("keydown", key, true);
    s.addEventListener("click", function (e) { if (e.target === s || (e.target.closest && e.target.closest("[data-close]"))) { close(); return; } if (onClick) onClick(e, close, s); });
    menuSounds(s);
    return { el: s, close: close };
  }
  function sw(on, k) { return '<button class="fd-switch" role="switch" aria-checked="' + (on ? "true" : "false") + '" data-k="' + k + '"></button>'; }
  function openSettings() {
    var mus = true; try { mus = B.music(); } catch (e) {}
    modal('<h3>Settings</h3><div class="fd-orn"><i></i></div>' +
      '<div class="fd-row"><div>Music<small>The score on the title, the map and in battle</small></div>' + sw(mus, "music") + '</div>' +
      '<div class="fd-row"><div>Interface sounds<small>Forge strikes, ticks and the ember wipe</small></div>' + sw(prefs.sfx, "sfx") + '</div>' +
      '<div class="fd-row"><div>Reduce motion<small>Stills the drifting light, embers and wipes</small></div>' + sw(prefs.motion === "reduce", "motion") + '</div>' +
      '<div class="fd-actions"><button class="fd-btn" data-go="tsaves">Save slots and backup</button><button class="fd-btn" data-go="ttut">How to play</button><button class="fd-btn fd-btn--ghost" data-close>Close</button></div>',
      function (e, close) {
        var t = e.target.closest && e.target.closest(".fd-switch");
        if (t) {
          var v = t.getAttribute("aria-checked") !== "true", k = t.getAttribute("data-k"); t.setAttribute("aria-checked", v ? "true" : "false");
          if (k === "music") { try { B.music(v); } catch (er) {} } else if (k === "sfx") { prefs.sfx = v; savePrefs(); } else if (k === "motion") { prefs.motion = v ? "reduce" : "auto"; savePrefs(); }
          cue("tick"); return;
        }
        var g = e.target.closest && e.target.closest("[data-go]");
        if (g) { cue("press"); close(); B.act(g.getAttribute("data-go")); }
      });
  }
  function openCredits() {
    modal('<h3>Credits</h3><div class="fd-orn"><i></i></div><dl class="fd-credits">' +
      '<dt>Created by</dt><dd>John Raposio, creator and showrunner of the Voidhammer saga</dd>' +
      '<dt>Built by</dt><dd>The Voidhammer studio, working with Claude</dd>' +
      '<dt>People</dt><dd>Characters and animation by Quaternius, CC0</dd>' +
      '<dt>Engine</dt><dd>three.js, MIT licence</dd>' +
      '<dt>Type</dt><dd>Cinzel, Cormorant Garamond, Inter, IM Fell English and IBM Plex Mono, under the SIL Open Font Licence</dd>' +
      '<dt>Art, music and voice</dt><dd>Made for Voidhammer with AI tools, directed by John Raposio</dd>' +
      '</dl><div class="fd-actions"><button class="fd-btn fd-btn--ghost" data-close>Close</button></div>');
  }
  function toast(msg) { var t = el("div", "fd-toast", esc(msg)); document.body.appendChild(t); setTimeout(function () { t.style.transition = "opacity .4s"; t.style.opacity = "0"; setTimeout(function () { t.remove(); }, 420); }, 2200); }

  // =========================================================== CHARACTER CREATION
  var CC = null;
  function realmVars(r, root) {
    var s = (root || document.documentElement).style;
    s.setProperty("--fd-r-a", r.pal.a); s.setProperty("--fd-r-b", r.pal.b); s.setProperty("--fd-r-c", r.pal.c); s.setProperty("--fd-r-glow", r.pal.glow); s.setProperty("--fd-r-ink", r.pal.ink);
  }
  function initials(n) { return String(n || "").trim().split(/\s+/).map(function (w) { return w.charAt(0); }).join("").slice(0, 2); }
  function openCreator() {
    var NG = B.NG(); if (!NG) NG = B.NG(Object.assign({}, B.OPT()));
    CC = {
      step: 0, people: NG.people || "ember", road: NG.road || "soldier", pname: NG.pname || "",
      bname: NG.bname === undefined ? "The Free Company" : NG.bname, bcol: NG.bcol || "#c8873a", diff: NG.diff || "normal", pv: null
    };
    var root = $("#fd-cc");
    if (!root) {
      root = el("div", "fd-screen"); root.id = "fd-cc";
      root.innerHTML = '<header class="fd-cc-top"><button class="fd-btn fd-btn--icon" data-cc="back" aria-label="Back">' + icon("left") + '</button><div class="fd-steps" id="fd-steps"></div><span style="width:2.6rem"></span></header>' +
        '<div class="fd-cc-main"><section class="fd-stage"><div class="fd-water" id="fd-water"></div><div class="fd-pv" id="fd-pv"></div><div class="fd-pv-wait">Forging</div>' +
        '<div class="fd-crest-hero" id="fd-crest-hero"></div><div class="fd-dragtip">Drag to turn</div>' +
        '<button class="fd-btn fd-btn--icon fd-arrow l" data-cc="prev" aria-label="Previous Realm">' + icon("left") + '</button><button class="fd-btn fd-btn--icon fd-arrow r" data-cc="next-realm" aria-label="Next Realm">' + icon("right") + '</button>' +
        '<div class="fd-plate"><b id="fd-plate-name"></b><span id="fd-plate-sub"></span></div></section>' +
        '<section class="fd-pane" id="fd-pane"></section></div>' +
        '<footer class="fd-cc-foot"><button class="fd-btn" data-cc="back" id="fd-back">Back</button><button class="fd-btn fd-btn--primary" data-cc="next" id="fd-next">Next</button></footer>';
      document.body.appendChild(root);
      root.addEventListener("click", ccClick);
      root.addEventListener("input", ccInput);
      root.addEventListener("keydown", function (e) { if (e.key === "Enter" && e.target.classList.contains("fd-input")) { e.target.blur(); } });
      menuSounds(root);
      document.addEventListener("keydown", function (e) {
        if (!CC || root.hidden || (e.target && e.target.tagName === "INPUT")) return;
        if (e.key === "Escape") { e.preventDefault(); ccBack(); } else if (CC.step === 0 && (e.key === "ArrowRight" || e.key === "ArrowLeft")) { e.preventDefault(); stepRealm(e.key === "ArrowRight" ? 1 : -1); }
      });
    }
    root.hidden = false;
    renderCC(true);
    loadPreview();
  }
  function loadPreview() {
    var host = $("#fd-pv"); if (!host || CC.pv) { updatePreview(); return; }
    var url = new URL("premium/preview3d.js", document.baseURI).href;
    import(url).then(function (m) {
      if (!CC || CC.pv) return;
      var pv = m.createPreview(host);
      if (!pv) { previewFailed(); return; }
      CC.pv = pv; updatePreview();
    }).catch(function (e) { console.warn("preview", e); previewFailed(); });
  }
  function previewFailed() { var w = $("#fd-water"); if (w) w.style.opacity = ".9"; var p = $(".fd-pv-wait"); if (p) p.hidden = true; }
  function updatePreview() { if (!CC || !CC.pv) return; var r = C.realm(CC.people); CC.pv.setLook(r.look, r.pal); }
  function stepRealm(d) {
    var ids = C.REALMS.map(function (r) { return r.id; }), i = ids.indexOf(CC.people);
    CC.people = ids[(i + d + ids.length) % ids.length]; cue("select", ids.indexOf(CC.people)); renderCC(); updatePreview();
    var b = $('.fd-chip-realm[data-realm="' + CC.people + '"]'); if (b && b.scrollIntoView) b.scrollIntoView({ block: "nearest", inline: "center", behavior: still() ? "auto" : "smooth" });
  }
  function kitFor(roadId, realmId) {
    var road = C.road(roadId), r = C.realm(realmId), k;
    try { k = B.kitOf(road.upb); } catch (e) { k = { crowns: 0, grain: 0, from: {}, loot: {}, gear: {}, sk: {}, pwar: [], burn: 0 }; }
    var out = { skills: [], carry: [], warn: [] }, men = 0, sell = 0;
    Object.keys(k.sk || {}).forEach(function (q) { out.skills.push(B.skName(q) + (k.sk[q] > 1 ? " ×" + k.sk[q] : "")); });
    Object.keys(k.from || {}).forEach(function (q) { men += k.from[q]; if (q === "merc") sell += k.from[q]; });
    out.carry.push(k.crowns + " crowns"); if (k.grain) out.carry.push(k.grain + " grain");
    if (men) out.carry.push(men + " followers" + (sell ? " (" + sell + " sellswords)" : ""));
    var gear = [];
    Object.keys(k.loot || {}).forEach(function (q) { gear.push(k.loot[q] + " " + lname(q)); });
    Object.keys(k.gear || {}).forEach(function (q) { gear.push(k.gear[q] + " " + lname(q) + " in hand"); });
    if (gear.length) out.carry.push(gear.join(", "));
    (k.pwar || []).forEach(function (f) { out.warn.push((f === "ember" ? "Flameborne" : f === "stone" ? "Stonehold" : f) + " lords hunt you"); });
    if (k.burn) out.warn.push("one memory already burned");
    out.gift = r.gift.text;
    return out;
  }
  function lname(q) { var n = ""; try { n = B.lootName(q); } catch (e) {} return (n || q).toLowerCase(); }
  function stepsHtml() {
    var L = [["I", "Your people"], ["II", "Your road"], ["III", "Your name"]];
    return L.map(function (s, i) { return '<b class="' + (i === CC.step ? "on" : i < CC.step ? "done" : "") + '"><i>' + s[0] + "</i><span>" + s[1] + "</span></b>"; }).join("");
  }
  function renderCC(first) {
    var r = C.realm(CC.people), road = C.road(CC.road), root = $("#fd-cc");
    realmVars(r, root);
    $("#fd-steps").innerHTML = stepsHtml();
    $("#fd-water").innerHTML = crest(r.id, "", initials(CC.pname));
    $("#fd-crest-hero").innerHTML = crest(r.id, "", initials(CC.pname));
    $("#fd-plate-name").textContent = CC.step === 2 && CC.pname.trim() ? CC.pname.trim() : r.name;
    $("#fd-plate-sub").textContent = CC.step === 0 ? r.people + " · " + r.art : CC.step === 1 ? r.name + " · " + road.name : r.name + " · " + road.name;
    root.querySelectorAll(".fd-arrow").forEach(function (a) { a.hidden = CC.step !== 0; });
    $("#fd-next").innerHTML = CC.step < 2 ? "Next" : "Begin your story";
    $("#fd-back").textContent = CC.step === 0 ? "Title" : "Back";
    var h = "";
    if (CC.step === 0) {
      h += '<div class="fd-strip" role="listbox" aria-label="Realms">' + C.REALMS.map(function (q) { return '<button class="fd-chip-realm" data-realm="' + q.id + '" aria-pressed="' + (q.id === r.id) + '" style="--c:' + q.pal.a + ";--g:" + q.pal.glow + '">' + crest(q.id, "", "") + "<span>" + q.name + "</span></button>"; }).join("") + "</div>";
      h += '<div class="fd-pane-in"><div class="fd-over">Your people</div><h1 class="fd-h1">' + r.name + '</h1><p class="fd-meta"><b>' + r.people + "</b> · " + r.art + " · " + r.home + '</p>' +
        '<p class="fd-oneline">' + esc(r.line) + '</p><p class="fd-blurb">' + esc(r.blurb) + '</p><p class="fd-motto">' + esc(r.motto) + "</p>" +
        '<dl class="fd-facts">' + fact("crack", "The price of " + r.art, r.price, "price") + fact("gift", "Realm gift", r.gift.text, "gift") + fact("compass", "Start", r.start) + "</dl></div>";
    } else if (CC.step === 1) {
      h += '<div class="fd-pane-in"><div class="fd-over">Your road</div><h1 class="fd-h1">What brought you to Ashford</h1><p class="fd-meta">Each road sets your starting skills and what you carry</p><div class="fd-roads">';
      C.ROADS.forEach(function (q) {
        var on = q.id === road.id;
        h += '<button class="fd-road" data-road="' + q.id + '" aria-pressed="' + on + '">' + icon(q.icon) + "<b>" + q.name + "</b><span>" + esc(q.line) + "</span>";
        if (on) {
          var k = kitFor(q.id, r.id);
          h += '<div class="fd-road-more"><p>' + esc(q.blurb) + '</p><div class="fd-kit">' + k.skills.map(function (s) { return '<i class="sk">' + esc(s) + "</i>"; }).join("") + "</div>" +
            '<div class="fd-kit">' + k.carry.map(function (s) { return "<i>" + esc(s) + "</i>"; }).join("") + k.warn.map(function (s) { return '<i class="warn">' + esc(s) + "</i>"; }).join("") + "</div>" +
            '<div class="fd-start">Plus your Realm gift: ' + esc(k.gift) + '</div><div class="fd-start"><b>Start:</b> ' + esc(q.start) + "</div></div>";
        }
        h += "</button>";
      });
      h += "</div></div>";
    } else {
      var df = { easy: "Weaker enemies, richer loot, cheaper upkeep, and 60 crowns more to start.", normal: "The intended game.", hard: "Stronger enemies, thinner loot, dearer upkeep." };
      h += '<div class="fd-pane-in"><div class="fd-over">Your name</div><h1 class="fd-h1">Who the book will remember</h1>' +
        '<div class="fd-field"><label for="fd-pname">Name</label><div class="fd-input-row"><input class="fd-input" id="fd-pname" maxlength="16" autocomplete="off" autocapitalize="words" spellcheck="false" placeholder="' + esc(r.names[0]) + '" value="' + esc(CC.pname) + '"><button class="fd-btn fd-btn--icon fd-tip" data-cc="suggest" data-tip="A ' + r.name + ' name" aria-label="Suggest a name">' + icon("dice") + "</button></div></div>" +
        '<div class="fd-field"><label for="fd-bname">Banner</label><input class="fd-input" id="fd-bname" maxlength="22" autocomplete="off" autocapitalize="words" spellcheck="false" placeholder="Name your banner" value="' + esc(CC.bname) + '"></div>' +
        '<div class="fd-field"><label>Banner colour</label><div class="fd-swatches">' + (B.BCOLS || ["#c8873a"]).map(function (c) { return '<button class="fd-swatch" data-col="' + c + '" style="background:' + c + '" aria-label="Banner colour ' + c + '" aria-pressed="' + (c === CC.bcol) + '"></button>'; }).join("") + "</div></div>" +
        '<div class="fd-field"><label>Difficulty</label><div class="fd-tabs" role="tablist">' + [["easy", "Easy"], ["normal", "Normal"], ["hard", "Hard"]].map(function (d) { return '<button class="fd-tab" role="tab" data-diff="' + d[0] + '" aria-selected="' + (CC.diff === d[0]) + '">' + d[1] + "</button>"; }).join("") + '</div><p class="fd-diffnote">' + df[CC.diff] + "</p></div>" +
        '<div class="fd-summary fd-panel">' + bannerSvg() + "<div><b id=\"fd-sum-name\">" + esc(sumName()) + "</b><span>" + esc(r.name + " by birth. " + road.name + ".") + "</span><span>" + esc(CC.bname.trim() || "Your banner") + "</span></div></div></div>";
    }
    var pane = $("#fd-pane"); pane.innerHTML = h; if (!first) pane.scrollTop = 0;
  }
  function sumName() { return (CC.pname.trim() || "Unnamed") + " of " + C.realm(CC.people).home; }
  function bannerSvg() {
    var r = C.realm(CC.people);
    return '<svg viewBox="0 0 56 76" aria-hidden="true"><path d="M6 2 V74" stroke="#b98a40" stroke-width="2.4"/><circle cx="6" cy="3" r="2.6" fill="#e8c77e"/><path d="M8 6 H52 V58 L30 70 L8 58 Z" fill="' + CC.bcol + '" stroke="#2a1606" stroke-width="1.2"/>' +
      '<path d="M8 6 H52 V14 H8 Z" fill="rgba(0,0,0,.25)"/><g transform="translate(17 18) scale(.26)">' + crest(r.id, "", initials(CC.pname)).replace(/^<svg[^>]*>/, "").replace(/<\/svg>$/, "") + "</g></svg>";
  }
  function fact(ic, dt, dd, cls) { return '<div class="fd-fact ' + (cls || "") + '">' + icon(ic) + "<div><dt>" + esc(dt) + "</dt><dd>" + esc(dd) + "</dd></div></div>"; }
  function ccClick(e) {
    var t = e.target;
    var rb = t.closest(".fd-chip-realm"); if (rb) { CC.people = rb.getAttribute("data-realm"); cue("select", C.REALMS.map(function (q) { return q.id; }).indexOf(CC.people)); renderCCKeepScroll(); updatePreview(); return; }
    var ro = t.closest(".fd-road"); if (ro) { CC.road = ro.getAttribute("data-road"); cue("select", 3); renderCCKeepScroll(); var on = $('.fd-road[aria-pressed="true"]'); if (on && on.scrollIntoView) on.scrollIntoView({ block: "nearest", behavior: still() ? "auto" : "smooth" }); return; }
    var sw2 = t.closest(".fd-swatch"); if (sw2) { CC.bcol = sw2.getAttribute("data-col"); cue("tick"); renderCCKeepScroll(); return; }
    var df = t.closest(".fd-tab"); if (df) { CC.diff = df.getAttribute("data-diff"); cue("tick"); renderCCKeepScroll(); return; }
    var b = t.closest("[data-cc]"); if (!b) return;
    var k = b.getAttribute("data-cc");
    if (k === "next") { if (CC.step < 2) { CC.step++; cue("press"); renderCC(); } else ccBegin(); }
    else if (k === "back") ccBack();
    else if (k === "prev") stepRealm(-1);
    else if (k === "next-realm") stepRealm(1);
    else if (k === "suggest") { var pool = C.realm(CC.people).names, n = pool[Math.floor(Math.random() * pool.length)]; if (n === CC.pname) n = pool[(pool.indexOf(n) + 1) % pool.length]; CC.pname = n; cue("tick"); renderCCKeepScroll(); }
  }
  function renderCCKeepScroll() { var p = $("#fd-pane"), s = p ? p.scrollTop : 0, x = $(".fd-strip"), sx = x ? x.scrollLeft : 0; renderCC(true); if (p) p.scrollTop = s; x = $(".fd-strip"); if (x) x.scrollLeft = sx; }
  function ccInput(e) {
    if (e.target.id === "fd-pname") { CC.pname = e.target.value.slice(0, 16); var s = $("#fd-sum-name"); if (s) s.textContent = sumName(); $("#fd-plate-name").textContent = CC.pname.trim() || C.realm(CC.people).name; var r = C.realm(CC.people); if (r.id === "stone") { $("#fd-crest-hero").innerHTML = crest(r.id, "", initials(CC.pname)); $("#fd-water").innerHTML = crest(r.id, "", initials(CC.pname)); } }
    else if (e.target.id === "fd-bname") { CC.bname = e.target.value.slice(0, 22); var sp = $(".fd-summary span:last-child"); if (sp) sp.textContent = CC.bname.trim() || "Your banner"; }
  }
  function ccBack() {
    if (CC.step > 0) { CC.step--; cue("back"); renderCC(); return; }
    cue("back");
    wipe(function () { closeCreator(); B.act("mainmenu"); }, lastTap.x, lastTap.y);
  }
  function closeCreator() { var r = $("#fd-cc"); if (r) r.hidden = true; if (CC && CC.pv) { CC.pv.dispose(); CC.pv = null; } }
  function ccBegin() {
    var NG = B.NG() || B.NG(Object.assign({}, B.OPT()));
    var road = C.road(CC.road);
    // the same world settings the game's own new-game sheet fixes (one world, one size; only difficulty is asked)
    Object.assign(NG, {
      origin: "wanderer", upb: { c: road.upb.c, a: road.upb.a, y: road.upb.y }, people: CC.people, road: CC.road, fdv: 1,
      pname: CC.pname.trim().slice(0, 16), bname: CC.bname.slice(0, 22), bcol: CC.bcol, diff: CC.diff,
      void: "slow", dom: "slow", map: "shattered", mode: "campaign", story: "on", size: "large"
    });
    if (NG.len === undefined || NG.len === 180) NG.len = 0;
    delete NG.fdMig;
    B.NG(NG);
    cue("forge");
    wipe(function () { closeCreator(); B.act("startnew"); }, lastTap.x, lastTap.y);
  }

  // =========================================================== THE OPENING (replaces the text-box intro)
  var IN = null;
  function words(txt, base) {
    var i = 0, d0 = base || 0;
    return txt.split(/(\s+)/).map(function (w) { if (/^\s+$/.test(w)) return w; var s = '<span class="w" style="animation-delay:' + (d0 + (i++) * 55) + 'ms">' + w + "</span>"; return s; }).join("");
  }
  function wordsHtml(html, base) {
    // like words(), but keeps <span class="fd-name">..</span> runs intact
    var out = "", i = 0, d0 = base || 0, parts = html.split(/(<span class="fd-name">[^<]*<\/span>)/);
    parts.forEach(function (p) {
      if (/^<span class="fd-name">/.test(p)) { out += '<span class="w fd-name" style="animation-delay:' + (d0 + (i++) * 55) + 'ms">' + p.replace(/<[^>]+>/g, "") + "</span>"; return; }
      p.split(/(\s+)/).forEach(function (w) { if (!w) return; if (/^\s+$/.test(w)) { out += w; return; } out += '<span class="w" style="animation-delay:' + (d0 + (i++) * 55) + 'ms">' + w + "</span>"; });
    });
    return { html: out, n: i };
  }
  function cards() {
    var S = B.S(), o = (S && S.opt) || B.OPT() || {}, r = C.realm(o.people || "ember"), road = C.road(o.road || C.roadFromUpb(o.upb)), O = C.OPENING;
    var nm = String((S && S.pname) || o.pname || "").trim();
    var L = [];
    L.push({ kind: "title", k: "The Concord Reckoning", big: "The Last Season", sub: "Nine Realms. One fractured world." });
    O.world.forEach(function (t) { L.push({ kind: "narr", text: esc(t) }); });
    L.push({ kind: "realm", realm: r.id, k: r.name + " · " + r.people, text: esc(r.open) });
    L.push({ kind: "narr", k: road.name, text: esc(road.blurb) });
    L.push({ kind: "narr", k: O.place, text: esc(O.archivist + " " + r.arrive) + (nm ? " " + esc("Her book now holds one more name:") + ' <span class="fd-name">' + esc(nm) + "</span>." : "") });
    L.push({ kind: "place", big: O.place, sub: O.where, last: true });
    return L;
  }
  function onIntro() {
    if (!B) return false;
    var root = el("div", "fd-screen"); root.id = "fd-intro";
    root.innerHTML = '<canvas class="fd-fx"></canvas><div class="fd-bars"></div><div id="fd-card-host"></div><button class="fd-btn fd-skip" id="fd-skip">Skip</button><div class="fd-prog" id="fd-prog"></div><div class="fd-hint">Tap to continue</div>';
    document.body.appendChild(root);
    var S = B.S(), o = (S && S.opt) || {}; realmVars(C.realm(o.people || "ember"), root);
    var fx = makeFx(root.querySelector(".fd-fx"), { n: 60, voidK: 0.12 }); fx.start();
    IN = { root: root, fx: fx, list: cards(), i: -1, timer: 0, done: false, card: null };
    $("#fd-prog", root).innerHTML = IN.list.map(function () { return "<i></i>"; }).join("");
    root.addEventListener("click", function (e) { if (e.target.closest("#fd-skip")) { e.stopPropagation(); cue("back"); endIntro(); return; } advance(); });
    IN.key = function (e) { if (!IN) return; if (e.key === "Escape") { endIntro(); } else if (e.key === " " || e.key === "Enter" || e.key === "ArrowRight") { e.preventDefault(); advance(); } };
    document.addEventListener("keydown", IN.key, true);
    next();
    return true;
  }
  function next() {
    if (!IN) return;
    clearTimeout(IN.timer);
    IN.i++;
    if (IN.i >= IN.list.length) { endIntro(); return; }
    var c = IN.list[IN.i], host = $("#fd-card-host", IN.root), prev = IN.card;
    if (prev) { prev.classList.add("leave"); setTimeout(function () { prev.remove(); }, 620); }
    var d = el("div", "fd-card"), n = 0, h = "", base = 300;
    if (c.kind === "title") { h = sigil("fd-sigil-big") + '<div class="fd-k">' + esc(c.k) + '</div><div class="fd-big">' + esc(c.big) + '</div><div class="fd-sub">' + esc(c.sub) + "</div>"; n = 8; }
    else if (c.kind === "place") { h = '<div class="fd-big">' + esc(c.big) + '</div><div class="fd-sub">' + esc(c.sub) + "</div>"; n = 6; }
    else {
      if (c.kind === "realm") { h += crest(c.realm, "fd-crest-big", initials(B.S() && B.S().pname)); base = 900; }
      if (c.k) h += '<div class="fd-k" style="margin-bottom:1rem">' + esc(c.k) + "</div>";
      var wh = wordsHtml(c.text, base + (c.k ? 400 : 0)); n = wh.n; h += '<p class="fd-narr">' + wh.html + "</p>";
    }
    d.innerHTML = h; host.appendChild(d); IN.card = d;
    $("#fd-prog", IN.root).querySelectorAll("i").forEach(function (b, i) { b.classList.toggle("on", i <= IN.i); });
    cue(c.kind === "title" || c.kind === "place" ? "boom" : "card");
    IN.reveal = still() ? 0 : base + (c.k ? 400 : 0) + n * 55 + 700;
    if (still()) d.classList.add("done");
    var read = c.kind === "title" ? 2600 : c.kind === "place" ? 2400 : Math.max(2400, n * 240);
    IN.timer = setTimeout(next, IN.reveal + read);
    IN.shownAt = performance.now();
  }
  function advance() {
    if (!IN || !IN.card) return;
    if (!IN.card.classList.contains("done") && performance.now() - IN.shownAt < IN.reveal) {
      IN.card.classList.add("done"); clearTimeout(IN.timer);
      var c = IN.list[IN.i]; IN.timer = setTimeout(next, c.last ? 1800 : 4200); return;
    }
    next();
  }
  function endIntro() {
    if (!IN || IN.ending) return; IN.ending = true;
    clearTimeout(IN.timer); document.removeEventListener("keydown", IN.key, true);
    var root = IN.root, fx = IN.fx;
    cue("forge");
    wipe(function () { fx.stop(); root.remove(); IN = null; B.act("begin"); });
  }

  // =========================================================== GAME HOOKS
  function idLabel(o) { if (!o || !o.people) return ""; return C.realm(o.people).name + " · " + C.road(o.road).name; }
  function onOrigin(NS, OPT) {
    if (!OPT || !OPT.people || !OPT.fdv) return;
    var r = C.realm(OPT.people), road = C.road(OPT.road), g = r.gift;
    if (g.crowns) NS.crowns = (NS.crowns || 0) + g.crowns;
    if (g.grain) NS.grain = (NS.grain || 0) + g.grain;
    [["loot", g.loot], ["gear", g.gear], ["from", g.from]].forEach(function (p) {
      if (!p[1]) return; var tgt = NS[p[0]] = Object.assign({}, NS[p[0]] || {});
      Object.keys(p[1]).forEach(function (k) { tgt[k] = (tgt[k] || 0) + p[1][k]; });
    });
    NS.journal = [{ d: 1, k: "e", text: r.name + " by birth. " + road.line + " You walk into Ashford, and a Lantern archivist from Spiritveil writes your name in her book." }];
    try { B.setWho(idLabel(OPT)); } catch (e) {}
  }
  function migrate(S) {
    if (!S || !S.opt) return false;
    var changed = C.migrateOpt(S.opt);
    try { B.setWho(idLabel(S.opt)); } catch (e) {}
    return changed;
  }
  function onAct(a) {
    if (a === "tnew" || a === "newgame") {
      cue("press");
      var go = function () { B.hideTitle(); B.NG(Object.assign({}, B.OPT())); openCreator(); };
      if (a === "tnew") wipe(go, lastTap.x, lastTap.y); else go();
      return true;
    }
    if (a === "tcont") { cue("press"); wipe(function () { B.act("tcont"); }, lastTap.x, lastTap.y); return true; }
    return false;
  }
  function ensureCssLast() {
    var link = document.querySelector('link[data-fd-css]');
    if (!link) { link = document.createElement("link"); link.rel = "stylesheet"; link.href = "premium/premium.css"; link.setAttribute("data-fd-css", ""); }
    document.head.appendChild(link); // moving it to the end makes it win over the game's injected styles
  }
  function attach(bridge) {
    B = bridge; applyMotion(); ensureCssLast();
    var b = $("#fd-boot"); if (b) { b.classList.add("out"); setTimeout(function () { b.remove(); }, 800); }
  }

  window.VHFD = {
    attach: attach, onAct: onAct, onTitle: onTitle, onIntro: onIntro, onOrigin: onOrigin, migrate: migrate,
    idLabel: idLabel, openCreator: openCreator, toast: toast, crest: crest,
    _cc: function () { return CC; }, _in: function () { return IN; }, _skip: function () { endIntro(); }, _tap: function () { tapBegin(innerWidth / 2, innerHeight / 2); }
  };
})();
