/* Brightness setting: a slider in the Save game sheet. Stored on this device; scene3d reads window.__vhBright every frame. */
(function () {
  var KEY = "vh_bright";
  function get() { try { var v = parseFloat(localStorage.getItem(KEY)); return v >= 0.6 && v <= 2 ? v : 1; } catch (e) { return 1; } }
  function set(v) { window.__vhBright = v; try { localStorage.setItem(KEY, String(v)); } catch (e) {} }
  window.__vhBright = get();
  var css = document.createElement("style");
  css.textContent = ".vhbr{margin:.6rem 0 .2rem}.vhbr label{display:flex;justify-content:space-between;font-size:.9rem}.vhbr input{width:100%;accent-color:#c8863a;margin:.4rem 0}.vhbr .dim-t{margin:0}.vhbr a{color:#e8b070}";
  document.head.appendChild(css);
  function pct(v) { return Math.round(v * 100) + "%"; }
  var mo = new MutationObserver(function () {
    var sb = document.getElementById("sbody"); if (!sb || sb.querySelector(".vhbr")) return;
    var h2 = sb.querySelector("h2"); if (!h2 || h2.textContent.trim() !== "Save game") return;
    var w = document.createElement("div"); w.className = "vhbr";
    w.innerHTML = '<div class="sec">Display</div><label for="vhbrr"><span>Brightness</span><span id="vhbrv">' + pct(get()) + '</span></label>' +
      '<input id="vhbrr" type="range" min="0.7" max="1.8" step="0.05" value="' + get() + '" aria-label="Brightness">' +
      '<p class="dim-t">Turn it up if caves and nights are too dark on your screen. <a href="#" id="vhbrx">Reset</a></p>';
    var sub = sb.querySelector(".sub"); (sub || h2).insertAdjacentElement("afterend", w);
    var r = w.querySelector("#vhbrr"), out = w.querySelector("#vhbrv");
    r.addEventListener("input", function () { var v = parseFloat(r.value); set(v); out.textContent = pct(v); });
    w.querySelector("#vhbrx").addEventListener("click", function (e) { e.preventDefault(); r.value = 1; set(1); out.textContent = pct(1); });
  });
  function arm() { var sb = document.getElementById("sbody"); if (sb) mo.observe(sb, { childList: true, subtree: true }); else setTimeout(arm, 500); }
  arm();
})();
