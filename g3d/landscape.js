// Voidhammer: landscape-first phone play. The 3D views (walk, battle, siege, town and road) are laid out for a phone held
// sideways: the movement stick bottom-left, Strike / Block / Cast and the ability arc bottom-right, the HUD along the top
// edges, every inset (notch, home bar) respected and no tap target under 44px. Held upright during 3D play, a phone shows a
// "Turn your phone sideways" card (with a way to play upright anyway). Entering fullscreen tries screen.orientation.lock,
// which iOS Safari does not support, so the card is the fallback. Map and menus stay usable either way.
(function () {
  "use strict";
  var LAND = "@media (orientation:landscape) and (max-height:520px)";
  var css = [
    // ---- the portrait card ----
    "#vhrot{position:fixed;inset:0;z-index:99990;display:none;flex-direction:column;align-items:center;justify-content:center;gap:1rem;padding:calc(1.5rem + env(safe-area-inset-top,0px)) 1.5rem calc(1.5rem + env(safe-area-inset-bottom,0px));background:radial-gradient(120% 80% at 50% 40%,#2a1d0e,#0a0806 70%);color:#efe2bf;text-align:center;font-family:'Cormorant Garamond',Georgia,serif}",
    "#vhrot.on{display:flex}#vhrot h2{margin:0;font:600 1.6rem 'Cinzel',Georgia,serif;letter-spacing:.04em;color:#f2d38a}#vhrot p{margin:0;max-width:20rem;font-size:1.05rem;line-height:1.4;color:#d8c8a0}",
    "#vhrot .ph{width:84px;height:140px;border:4px solid #e3c27a;border-radius:16px;position:relative;box-shadow:0 0 30px rgba(227,194,122,.35);animation:vhrot 2.4s ease-in-out infinite}#vhrot .ph::after{content:'';position:absolute;left:50%;bottom:8px;width:18px;height:4px;margin-left:-9px;border-radius:2px;background:#e3c27a}",
    "#vhrot .ar{font-size:2rem;color:#e3c27a;line-height:1}",
    "@keyframes vhrot{0%,25%{transform:rotate(0)}55%,85%{transform:rotate(-90deg)}100%{transform:rotate(0)}}",
    "#vhrot .bt{display:flex;flex-direction:column;gap:.6rem;margin-top:.4rem}#vhrot button{min-height:48px;min-width:14rem;padding:.7rem 1rem;border-radius:6px;border:1px solid #8a6a30;background:#1a130a;color:#efe2bf;font:600 .8rem 'IBM Plex Mono',monospace;letter-spacing:.1em;text-transform:uppercase}#vhrot button.solid{background:linear-gradient(#c8873a,#8a5a20);color:#1a1208;border-color:#f2d38a}",
    // ---- landscape phones in 3D ----
    LAND + "{",
    // the HUD hugs the top edges, inside the notch
    " #vh3d .v3-hud{padding-left:env(safe-area-inset-left,0px);padding-right:env(safe-area-inset-right,0px)}",
    // the top bars are gone: one round menu button sits in the top-right corner (scene3d.js), clear of the notch
    " #vh3d .v3-menu{top:calc(.5rem + env(safe-area-inset-top,0px));right:calc(.6rem + env(safe-area-inset-right,0px))}",
    " #ahud .abtns button{min-height:44px}",
    // battle: health top-left, morale under it; the stick has the whole bottom-left; Orders sits between the thumbs
    " #vh3d .v3-hp{top:calc(.6rem + env(safe-area-inset-top,0px));bottom:auto!important;left:calc(.9rem + env(safe-area-inset-left,0px));width:min(13rem,26vw)}",
    " #vh3d .b3-groups{top:calc(3.4rem + env(safe-area-inset-top,0px))!important;left:calc(.9rem + env(safe-area-inset-left,0px))}",
    " #vh3d .b3-ordbtn,#vh3d .b3-ordbtn.k2left{left:50%!important;transform:translateX(-50%)!important;bottom:calc(.7rem + env(safe-area-inset-bottom,0px))!important;padding:.55rem 1.2rem;font-size:.8rem;min-height:48px}",
    " #vh3d .b3-fan{bottom:calc(4.4rem + env(safe-area-inset-bottom,0px))!important;max-height:70vh;overflow:auto}",
    " #vh3d .b3-fan button{min-height:44px}",
    // the thumb arc: action buttons bottom-right, clear of the home bar and the notch
    " #vh3d .b3-btns{right:calc(.8rem + var(--vh-sr,env(safe-area-inset-right,0px)));bottom:calc(.7rem + var(--vh-sb,env(safe-area-inset-bottom,0px)))}",
    " #vh3d .b3-btns [data-b=atk]{width:5rem;height:5rem}#vh3d .b3-btns [data-b=blk]{width:4rem;height:4rem}#vh3d .b3-btns [data-b=shoot],#vh3d .b3-btns [data-b=cast]{width:3.6rem;height:3.6rem}",
    " #aatk,#acast,#abow,#ause{margin-right:env(safe-area-inset-right,0px)}",
    " #vh3d .v3-use{bottom:calc(.9rem + env(safe-area-inset-bottom,0px))!important;min-width:9rem;max-width:34vw}",
    " #vh3d .v3-keys{display:none}",
    // where the left thumb goes: a faint ring bottom-left (the stick still appears wherever you touch on the left)
    " #vh3d.touch::before{content:'';position:absolute;z-index:3;left:calc(2.2rem + env(safe-area-inset-left,0px));bottom:calc(1.6rem + env(safe-area-inset-bottom,0px));width:104px;height:104px;border-radius:50%;border:2px solid rgba(232,216,176,.18);box-shadow:inset 0 0 0 30px rgba(232,216,176,.04);pointer-events:none}",
    " #vh3d .v3-msg{top:calc(4.2rem + env(safe-area-inset-top,0px))}",
    "}"
  ].join("\n");
  function boot() {
    var st = document.createElement("style"); st.id = "vh-land"; st.textContent = css; document.head.appendChild(st);
    var el = document.createElement("div"); el.id = "vhrot"; el.setAttribute("role", "dialog"); el.setAttribute("aria-label", "Turn your phone sideways");
    el.innerHTML = '<div class="ph" aria-hidden="true"></div><div class="ar" aria-hidden="true">⟲</div><h2>Turn your phone sideways</h2><p>The Shattered Realms is played with the phone held on its side: the left thumb walks, the right thumb fights.</p>' +
      '<div class="bt"><button class="solid" data-rot="full">Go fullscreen</button><button data-rot="stay">Play upright anyway</button></div>';
    document.body.appendChild(el);
    var dismissed = false;
    try { dismissed = sessionStorage.getItem("vh-rot-ok") === "1"; } catch (e) {}
    function lock() { try { if (screen.orientation && screen.orientation.lock) { var p = screen.orientation.lock("landscape"); if (p && p.catch) p.catch(function () {}); } } catch (e) {} }
    el.addEventListener("click", function (e) {
      var b = e.target.closest && e.target.closest("[data-rot]"); if (!b) return; e.stopPropagation();
      if (b.getAttribute("data-rot") === "stay") { dismissed = true; try { sessionStorage.setItem("vh-rot-ok", "1"); } catch (x) {} check(); return; }
      try { var d = document.documentElement, rq = d.requestFullscreen || d.webkitRequestFullscreen; if (rq) { var p = rq.call(d); if (p && p.then) p.then(lock, function () {}); else lock(); } else lock(); } catch (x) {}
    });
    document.addEventListener("fullscreenchange", function () { if (document.fullscreenElement) lock(); });
    var touch = function () { try { return matchMedia("(pointer:coarse)").matches || (navigator.maxTouchPoints > 0 && !matchMedia("(pointer:fine)").matches); } catch (e) { return false; } };
    function playing3d() { return !!document.getElementById("vh3d"); }
    function check() {
      var on = !dismissed && touch() && playing3d() && innerHeight > innerWidth * 1.05;
      if (el.classList.contains("on") !== on) el.classList.toggle("on", on);
    }
    window.addEventListener("resize", check); window.addEventListener("orientationchange", check);
    setInterval(check, 400);
    window.__vhRot = { check: check, on: function () { return el.classList.contains("on"); }, reset: function () { dismissed = false; try { sessionStorage.removeItem("vh-rot-ok"); } catch (e) {} check(); } };
  }
  if (document.body) boot(); else document.addEventListener("DOMContentLoaded", boot);
})();
