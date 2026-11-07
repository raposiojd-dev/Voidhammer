/* Full-game unlock (iOS app only) + "Follow the saga" links.
   Free: the first 60 days (up to the Void's arrival). Then one purchase (A$9.99, product below) unlocks everything for good.
   The web build stays free. Patreon is linked only on the web build (Apple does not allow links to outside payment inside the app). */
(function () {
  var PID = "com.voidhammer.shatteredrealms.fullgame", FREE_DAYS = 60, KEY = "voidhammer_unlock";
  var C = window.Capacitor, native = !!(C && C.isNativePlatform && C.isNativePlatform());
  var NP = null, price = "A$9.99", busy = false, ov = null, productOK = false, lastS = null, lastDay = 0; /* the gate only appears once the App Store actually offers the unlock */
  var LINKS = [["Website", "https://voidhammersaga.com"], ["Instagram", "https://www.instagram.com/voidhammersaga"], ["TikTok", "https://www.tiktok.com/@voidhammersaga"],
    ["YouTube", "https://www.youtube.com/@voidhammersaga"], ["Threads", "https://www.threads.com/@voidhammersaga"]];
  if (!native) LINKS.push(["Patreon", "https://www.patreon.com/voidhammerofficial"]);
  function S() { try { return window.__vh && window.__vh.S(); } catch (e) { return null; } }
  function unlocked() { try { return localStorage.getItem(KEY) === "1"; } catch (e) { return false; } }
  function setUnlocked() { try { localStorage.setItem(KEY, "1"); } catch (e) {} }
  function open(u) { try { window.open(u, "_blank"); } catch (e) { location.href = u; } }

  var css = document.createElement("style");
  css.textContent = "#vhfollow{display:flex;flex-wrap:wrap;gap:.35rem;justify-content:center;margin-top:.9rem}#vhfollow small{width:100%;text-align:center;font:600 .6rem/1 var(--sans,system-ui);letter-spacing:.18em;text-transform:uppercase;color:#b89a60;opacity:.8}#vhfollow a{font:.78rem/1 var(--sans,system-ui);color:#e9dcc0;text-decoration:none;border:1px solid #5a4422;border-radius:999px;padding:.38rem .7rem;background:rgba(0,0,0,.25)}#vhfollow a.pat{border-color:#c8783a;color:#f0b080}" +
    "#vhul{position:fixed;inset:0;z-index:60;display:flex;align-items:center;justify-content:center;background:rgba(6,5,4,.88);padding:16px}#vhul .bx{width:min(94vw,440px);background:linear-gradient(180deg,#1a130c,#0e0a07);border:1px solid #8a6a32;border-radius:14px;padding:1.2rem 1.1rem 1rem;color:#e9dcc0;text-align:center;font:.95rem/1.45 var(--serif,Georgia,serif)}#vhul h3{margin:.1rem 0 .4rem;font:600 1.25rem/1.2 var(--serif,Georgia,serif);letter-spacing:.06em;color:#f0c070;text-transform:uppercase}#vhul p{margin:.45rem 0}#vhul .buy{display:block;width:100%;margin:.8rem 0 .4rem;padding:.8rem;border-radius:10px;border:1px solid #d8a050;background:linear-gradient(180deg,#c8863a,#8a5420);color:#fff6e0;font:600 1rem/1 var(--sans,system-ui);letter-spacing:.04em}#vhul .sm{background:none;border:0;color:#c8b088;font:.82rem/1 var(--sans,system-ui);padding:.5rem;text-decoration:underline}#vhul .msg{min-height:1.2em;font-size:.82rem;color:#f0b080}#vhul .lk{display:flex;flex-wrap:wrap;gap:.3rem;justify-content:center;margin-top:.6rem}#vhul .lk a{font:.72rem/1 var(--sans,system-ui);color:#c8b088;text-decoration:none;border:1px solid #4a3820;border-radius:999px;padding:.3rem .55rem}";
  document.head.appendChild(css);

  function linksHtml(cls) { return LINKS.map(function (l) { return '<a href="' + l[1] + '" target="_blank" rel="noopener"' + (l[0] === "Patreon" ? ' class="pat"' : "") + ">" + l[0] + "</a>"; }).join(""); }
  function addFollow() {
    var t = document.querySelector("#title .tcol"); if (!t || document.getElementById("vhfollow")) return;
    var d = document.createElement("div"); d.id = "vhfollow"; d.innerHTML = "<small>Follow the saga</small>" + linksHtml() + (native && !unlocked() ? '<a href="#" data-r="1">Restore purchase</a>' : "");
    d.addEventListener("click", function (e) { var a = e.target.closest("a"); if (!a) return; e.preventDefault(); if (a.getAttribute("data-r")) restore(a); else open(a.href); });
    t.appendChild(d);
  }

  function getNP() {
    if (NP || !native) return NP;
    try { NP = (C.Plugins && C.Plugins.NativePurchases) || (C.registerPlugin && C.registerPlugin("NativePurchases")); } catch (e) { NP = null; }
    return NP;
  }
  function owns(list) { return (list || []).some(function (t) { return t && t.productIdentifier === PID; }); }
  function check() {
    var np = getNP(); if (!np || !np.getPurchases) return;
    np.getPurchases({ productType: "inapp" }).then(function (r) { if (owns(r && r.purchases)) { setUnlocked(); close(); refreshFollow(); } }).catch(function () {});
    if (np.getProducts) np.getProducts({ productIdentifiers: [PID], productType: "inapp" }).then(function (r) { var p = r && r.products && r.products[0]; if (p && (p.priceString || p.identifier)) { productOK = true; if (p.priceString) price = p.priceString; var b = ov && ov.querySelector(".buy"); if (b) b.textContent = "Unlock the full game · " + price; } }).catch(function () {});
  }
  function refreshFollow() { var f = document.getElementById("vhfollow"); if (f) { f.remove(); addFollow(); } }
  function msg(t) { var m = ov && ov.querySelector(".msg"); if (m) m.textContent = t || ""; }
  function buy() {
    var np = getNP(); if (busy) return; if (!np) { msg("The App Store isn't reachable right now. Try again in a moment."); return; }
    busy = true; msg("Opening the App Store…");
    np.purchaseProduct({ productIdentifier: PID, productType: "inapp", quantity: 1 }).then(function (t) {
      busy = false; if (t && (t.productIdentifier === PID || t.transactionId)) { setUnlocked(); msg(""); close(); refreshFollow(); toast("The whole of the Nine Realms is open. Thank you."); } else msg("");
    }).catch(function (e) { busy = false; var s = String((e && (e.message || e.code)) || ""); msg(/cancel/i.test(s) ? "" : "That didn't go through. Nothing was charged."); });
  }
  function restore(el) {
    var np = getNP(); if (!np) return; if (ov) msg("Checking your purchases…");
    var done = function () { np.getPurchases({ productType: "inapp" }).then(function (r) { if (owns(r && r.purchases)) { setUnlocked(); close(); refreshFollow(); toast("Purchase restored. Welcome back."); } else { if (ov) msg("No purchase found on this Apple ID."); else toast("No purchase found on this Apple ID."); } }).catch(function () { if (ov) msg("Couldn't reach the App Store."); }); };
    (np.restorePurchases ? np.restorePurchases() : Promise.resolve()).then(done, done);
  }
  function toast(t) { var el = document.getElementById("toast"); if (!el) return; el.textContent = t; el.hidden = false; clearTimeout(toast.t); toast.t = setTimeout(function () { el.hidden = true; }, 4000); }
  function close() { if (ov) { ov.remove(); ov = null; } }
  function showGate() {
    if (ov) return; ov = document.createElement("div"); ov.id = "vhul";
    ov.innerHTML = '<div class="bx"><h3>The Void has come</h3><p>Sixty days in, the first grey edge has opened on the map. Your free road ends here.</p><p>Unlock the full game once and keep it for good: all Nine Realms, every quest, every boss, the war that\'s coming and whatever you build against it. No ads, no loot boxes, nothing else to buy.</p>' +
      '<button class="buy">Unlock the full game · ' + price + '</button><div class="msg"></div><button class="sm" data-k="restore">Restore purchase</button> <button class="sm" data-k="title">Back to title</button>' +
      '<div class="lk">' + linksHtml() + "</div></div>";
    ov.addEventListener("click", function (e) {
      var a = e.target.closest("a"); if (a) { e.preventDefault(); open(a.href); return; }
      if (e.target.closest(".buy")) buy(); else if (e.target.closest('[data-k="restore"]')) restore(); else if (e.target.closest('[data-k="title"]')) { close(); try { location.reload(); } catch (er) {} }
    });
    document.body.appendChild(ov); check();
  }
  setInterval(function () {
    addFollow();
    if (!native || unlocked()) return;
    var s = S(); if (!s || typeof s.day !== "number") return;
    var t = document.getElementById("title"); if (t && !t.hidden) { close(); return; }
    var live = (s === lastS && s.day > lastDay); lastS = s; lastDay = s.day; /* only gate a game whose clock is actually running (not a stale save behind the intro) */
    if (s.day >= FREE_DAYS && productOK && (live || ov)) { s.speed = 0; showGate(); }
  }, 400);
  if (native) { setTimeout(check, 1500); setInterval(function () { if (!productOK && !unlocked()) check(); }, 60000); }
  window.__vhUnlock = { owned: unlocked, show: showGate, pid: PID };
})();
