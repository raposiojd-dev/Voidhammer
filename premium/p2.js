// VOIDHAMMER premium Phase 2 (game/premium-p2): your Realm in play, the world map HUD and nav, settlement sheets,
// combat juice and UI sound. The game talks to this file through one marked block inside index.html (search
// "PREMIUM PHASE 2"), and battle3d.js asks it for hit flashes and stingers. If this file is missing, window.VHP2 is
// undefined, the block does nothing and the game runs exactly as before. No save keys, quest ids or numbers here.
// Australian spelling. No gods. Nothing sealed.
(function () {
  "use strict";
  var FD = function () { return window.VHFD || null; };
  var C = function () { return window.VH_CANON || null; };
  function still() { try { var f = FD(); if (f && f.still) return !!f.still(); } catch (e) {} return !!(window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches); }
  function cue(n, a) { try { var f = FD(); if (f && f.cue) f.cue(n, a); } catch (e) {} }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }

  // ------------------------------------------------------------------ the chosen people (premium/canon.js)
  var B = null; // the bridge from index.html
  function people() {
    try { var o = B && B.S() && B.S().opt, c = C(); if (!o || !o.people || !c) return null; var r = c.realm(o.people); return r && r.id === o.people ? r : null; } catch (e) { return null; }
  }
  function applyRealmVars() {
    var r = people(), s = document.documentElement.style;
    if (!r) { s.removeProperty("--p2-r-a"); s.removeProperty("--p2-r-c"); s.removeProperty("--p2-r-glow"); return; }
    s.setProperty("--p2-r-a", r.pal.a); s.setProperty("--p2-r-c", r.pal.c); s.setProperty("--p2-r-glow", r.pal.glow);
  }

  // crests as images for the canvas map (drawn once per Realm from the front door's SVG crests)
  var CREST = {};
  function crestImg(id) {
    if (CREST[id] !== undefined) return CREST[id];
    CREST[id] = null;
    try {
      var f = FD(); if (!f || !f.crest || !C() || !C().realm(id) || C().realm(id).id !== id) return null;
      var svg = f.crest(id, ""); if (svg.indexOf("xmlns") < 0) svg = svg.replace("<svg", '<svg xmlns="http://www.w3.org/2000/svg"');
      var im = new Image(); im.decoding = "async"; im.onload = function () { CREST[id] = im; }; im.onerror = function () { CREST[id] = false; };
      im.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
    } catch (e) { CREST[id] = false; }
    return null;
  }
  function crestSvg(id, cls) { try { var f = FD(); return f && f.crest && C().realm(id) && C().realm(id).id === id ? f.crest(id, cls || "") : ""; } catch (e) { return ""; } }

  // Realm-tinted copies of the painted map sprites (kept luminance, the people's hue): one canvas per sprite and Realm
  var TINT = {};
  function tinted(im, key, col, k) {
    if (!im || !im.naturalWidth) return im;
    var id = key + "|" + col; if (TINT[id]) return TINT[id];
    try {
      var c = document.createElement("canvas"); c.width = im.naturalWidth; c.height = im.naturalHeight; var g = c.getContext("2d");
      // keep the painted light, lift the shadows into the people's colour (the painted knight is nearly black)
      g.drawImage(im, 0, 0); g.globalCompositeOperation = "color"; g.globalAlpha = k || 0.5; g.fillStyle = col; g.fillRect(0, 0, c.width, c.height);
      g.globalCompositeOperation = "source-atop"; g.globalAlpha = (k || 0.5) * 0.55; g.fillRect(0, 0, c.width, c.height);
      g.globalAlpha = 1; g.globalCompositeOperation = "destination-in"; g.drawImage(im, 0, 0);
      TINT[id] = c; return c;
    } catch (e) { return im; }
  }

  // ------------------------------------------------------------------ UI sound: one consistent family with the front door
  function soundFor(t) {
    if (!t || !t.closest) return null;
    if (t.closest(".fd-modal-scrim,#fd-title,#fd-cc,#fd-intro,.p2-menu")) return null; // those surfaces cue themselves
    var b = t.closest("button,[data-act]"); if (!b) return null;
    if (!b.closest("#hud,#bar,#sheet,#enter,.zoom,#vh3d,#area,.p2-q")) return null;
    var a = b.getAttribute("data-act") || "", tx = (b.textContent || "").trim().toLowerCase();
    if (b.id === "sx" || a === "dim" || a === "backask" || /^(close|back|not today\.?|goodbye\.?|not yet|leave)$/.test(tx)) return "back";
    if (b.classList.contains("solid") || b.classList.contains("amber") || b.classList.contains("fd-btn--primary") || a === "done" || a === "vh3dfight" || a === "vh3dwalk") return "confirm";
    return "tick";
  }
  document.addEventListener("click", function (e) { var n = soundFor(e.target); if (n) cue(n); }, true);

  // ------------------------------------------------------------------ sheets: a smooth close (the open is in premium.css)
  function sheetClosing() {
    if (still()) return;
    try {
      var s = document.getElementById("sheet"); if (!s || s.hidden) return;
      var r = s.getBoundingClientRect(); if (r.height < 10) return;
      var g = s.cloneNode(true), body = s.querySelector("#sbody"), gb = g.querySelector("#sbody");
      g.removeAttribute("id"); g.classList.add("p2-ghost"); g.setAttribute("aria-hidden", "true");
      g.querySelectorAll("[id]").forEach(function (x) { x.removeAttribute("id"); });
      // the ghost is a picture only: nothing in it can act, even when a script clicks it
      g.querySelectorAll("[data-act],[data-a],button,input").forEach(function (x) { x.removeAttribute("data-act"); x.removeAttribute("data-a"); x.setAttribute("tabindex", "-1"); if (x.tagName === "BUTTON" || x.tagName === "INPUT") x.disabled = true; });
      g.inert = true;
      g.style.cssText += ";position:fixed;left:" + r.left + "px;top:" + r.top + "px;width:" + r.width + "px;height:" + r.height + "px;margin:0;bottom:auto;right:auto;max-height:none;pointer-events:none;";
      document.body.appendChild(g);
      if (body && gb) gb.scrollTop = body.scrollTop;
      var d = document.getElementById("dim"), dg = null;
      if (d && !d.hidden) { dg = d.cloneNode(false); dg.removeAttribute("id"); dg.removeAttribute("data-act"); dg.classList.add("p2-ghost-dim"); document.body.appendChild(dg); }
      requestAnimationFrame(function () { g.classList.add("out"); if (dg) dg.classList.add("out"); });
      setTimeout(function () { g.remove(); if (dg) dg.remove(); }, 320);
    } catch (e) {}
  }

  // ------------------------------------------------------------------ the map menu (☰): Walk, Save, Backup, Co-op, music folded in
  var menuEl = null;
  function closeMenu(sound) { if (!menuEl) return; if (sound) cue("back"); var m = menuEl; menuEl = null; m.classList.add("out"); setTimeout(function () { m.remove(); }, still() ? 0 : 220); }
  function edgeTab(label) { var bs = document.querySelectorAll("button"); for (var i = 0; i < bs.length; i++) if (bs[i].textContent === label && bs[i].style.position === "fixed") return bs[i]; return null; }
  function openMenu() {
    if (menuEl) { closeMenu(true); return; }
    var mus = true; try { mus = B.music(); } catch (e) {}
    var walk = document.getElementById("walkbtn"), bk = edgeTab("Backup"), co = edgeTab("Co-op");
    var it = function (k, icon, t, sub) { return '<button class="p2-mi" data-p2="' + k + '"><span class="p2-mi-i">' + icon + "</span><span><b>" + t + "</b>" + (sub ? "<small>" + sub + "</small>" : "") + "</span></button>"; };
    var I = {
      walk: '<svg viewBox="0 0 24 24"><path d="M13 4a1.6 1.6 0 1 0 0 .1M10 21l2-6 3 3v3M8 12l3-4 3 2 3 1M11 8l-1 5"/></svg>',
      save: '<svg viewBox="0 0 24 24"><path d="M5 4h11l3 3v13H5z"/><path d="M8 4v5h7V4M8 20v-6h8v6"/></svg>',
      key: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.5"/><path d="M12 7.5l1.6 4.4L12 16.5l-1.6-4.6z"/></svg>',
      backup: '<svg viewBox="0 0 24 24"><path d="M12 3v12M7 10l5 5 5-5M5 20h14"/></svg>',
      coop: '<svg viewBox="0 0 24 24"><circle cx="8.5" cy="9" r="2.6"/><circle cx="15.5" cy="9" r="2.6"/><path d="M3.5 19c.8-3.4 2.8-5 5-5s4.2 1.6 5 5M11 19c.8-3.4 2.4-5 4.5-5s3.9 1.6 4.5 5"/></svg>',
      gear: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1"/></svg>',
      title: '<svg viewBox="0 0 24 24"><path d="M4 11l8-7 8 7M6 10v10h12V10"/></svg>'
    };
    menuEl = el("div", "p2-menu", '<div class="p2-menu-card fd-panel" role="dialog" aria-label="Menu">' +
      '<div class="p2-menu-h">Menu<i></i></div>' +
      (walk ? it("walk", I.walk, "Walk the overland", "Leave the map and travel on foot") : "") +
      it("save", I.save, "Save now", "Saved on this phone") +
      '<div class="p2-mi p2-mi-sw"><span class="p2-mi-i"><svg viewBox="0 0 24 24"><path d="M9 18V5l11-2v13"/><circle cx="6.5" cy="18" r="2.5"/><circle cx="17.5" cy="16" r="2.5"/></svg></span><span><b>Music</b><small>The score on the map and in battle</small></span><button class="fd-switch" role="switch" data-p2="music" aria-checked="' + (mus ? "true" : "false") + '" aria-label="Music"></button></div>' +
      it("key", I.key, "Map key", "What the marks on the map mean") +
      (bk ? it("backup", I.backup, "Backup code", "Keep your save safe off this phone") : "") +
      (co ? it("coop", I.coop, "Co-op", "Ride with a friend") : "") +
      it("settings", I.gear, "Settings", "Sounds, motion, save slots") +
      it("title", I.title, "Main menu", "Back to the title") +
      '<button class="fd-btn fd-btn--ghost p2-menu-x" data-p2="x">Close</button></div>');
    document.body.appendChild(menuEl); cue("open");
    menuEl.addEventListener("click", function (e) {
      if (e.target === menuEl) { closeMenu(true); return; }
      var b = e.target.closest && e.target.closest("[data-p2]"); if (!b) return; var k = b.getAttribute("data-p2");
      if (k === "music") { var v = b.getAttribute("aria-checked") !== "true"; b.setAttribute("aria-checked", v ? "true" : "false"); try { B.music(v); } catch (er) {} cue("tick"); return; }
      if (k === "x") { closeMenu(true); return; }
      cue("confirm"); closeMenu(false);
      setTimeout(function () {
        try {
          if (k === "walk") { var w = document.getElementById("walkbtn"); if (w) w.click(); }
          else if (k === "save") { var s = document.getElementById("savebtn"); if (s) s.click(); else B.save(); }
          else if (k === "key") B.act("menu", "key");
          else if (k === "backup") { var t = edgeTab("Backup"); if (t) t.click(); }
          else if (k === "coop") { var c = edgeTab("Co-op"); if (c) c.click(); }
          else if (k === "settings") { var f = FD(); if (f && f.settings) f.settings(); }
          else if (k === "title") B.act("mainmenu");
        } catch (er) { console.error(er); }
      }, 30);
    });
  }
  document.addEventListener("keydown", function (e) { if (menuEl && e.key === "Escape") { e.stopPropagation(); closeMenu(true); } }, true);

  // ------------------------------------------------------------------ combat juice (battle3d.js calls these)
  // a screen-space impact burst at a 3D point: cheap DOM, pooled, never more than eight on screen
  var FL = [];
  function flash(root, x, y, kind) {
    if (!root || !isFinite(x) || !isFinite(y)) return;
    var f = null; for (var i = 0; i < FL.length; i++) if (!FL[i].busy && FL[i].el.parentNode === root) { f = FL[i]; break; }
    if (!f) { if (FL.length >= 8) { f = FL[0]; } else { f = { el: el("i", "p2-imp"), busy: false }; FL.push(f); } if (f.el.parentNode !== root) root.appendChild(f.el); }
    f.busy = true; var e = f.el; e.className = "p2-imp"; e.style.left = x + "px"; e.style.top = y + "px"; void e.offsetWidth; e.className = "p2-imp on " + (kind || "hit");
    clearTimeout(f.t); f.t = setTimeout(function () { f.busy = false; e.className = "p2-imp"; }, 420);
  }
  function hurtPulse(root) { if (!root) return; var v = root.querySelector(".p2-hurt"); if (!v) { v = el("i", "p2-hurt"); root.appendChild(v); } v.classList.remove("on"); void v.offsetWidth; v.classList.add("on"); }
  // the end-of-battle stinger: a forged title card over the field, then the summary card on the result sheet
  function stinger(endEl, how, title, sub) {
    if (!endEl) return;
    var win = how === "win", lose = how === "lose";
    endEl.classList.add("p2-sting", win ? "win" : lose ? "lose" : "flee");
    endEl.innerHTML = '<span class="p2-sting-k">' + (win ? "Victory" : lose ? "Defeat" : "Withdrawn") + '</span><b class="p2-sting-t">' + esc(title) + '</b><i class="p2-sting-r"></i><small>' + esc(sub) + "</small>";
    cue(win ? "victory" : lose ? "defeat" : "close");
  }

  // ------------------------------------------------------------------ public
  window.VHP2 = {
    attach: function (bridge) {
      B = bridge; applyRealmVars(); document.documentElement.classList.add("p2-on");
      var link = document.querySelector("link[data-p2-css]"); if (link) document.head.appendChild(link); // after the game's injected styles
      setInterval(applyRealmVars, 1500);
    },
    people: people, crestImg: crestImg, crestSvg: crestSvg, tinted: tinted, still: still, cue: cue, esc: esc,
    openMenu: openMenu, closeMenu: function () { closeMenu(false); }, menuOpen: function () { return !!menuEl; },
    sheetClosing: sheetClosing, flash: flash, hurtPulse: hurtPulse, stinger: stinger,
    focus: function (s) { if (B && B.focus) B.focus(s); }
  };
})();
