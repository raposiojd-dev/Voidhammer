// Voidhammer: The Shattered Realms, desktop shell.
// Serves the game from app://game/ so fetch(), video, audio and localStorage saves all behave as on the web.
const { app, BrowserWindow, protocol, net, shell, Menu } = require("electron");
const path = require("path");
const { pathToFileURL } = require("url");

protocol.registerSchemesAsPrivileged([
  { scheme: "app", privileges: { standard: true, secure: true, supportFetchAPI: true, stream: true, corsEnabled: true } }
]);

const GAME_DIR = path.join(__dirname, "game");

function createWindow() {
  const win = new BrowserWindow({
    width: 1600, height: 900, minWidth: 1024, minHeight: 640,
    backgroundColor: "#0c0b09", title: "Voidhammer: The Shattered Realms",
    autoHideMenuBar: true, show: false,
    webPreferences: { preload: path.join(__dirname, "preload.js"), contextIsolation: true, sandbox: true, backgroundThrottling: false }
  });
  win.once("ready-to-show", () => win.show());
  // External links (Patreon, the website, the books) open in the player's browser.
  win.webContents.setWindowOpenHandler(({ url }) => { if (/^https?:/.test(url)) shell.openExternal(url); return { action: "deny" }; });
  win.webContents.on("will-navigate", (e, url) => { if (!url.startsWith("app://")) { e.preventDefault(); if (/^https?:/.test(url)) shell.openExternal(url); } });
  // F11 or Alt+Enter: fullscreen. F12 is left off in release builds.
  win.webContents.on("before-input-event", (e, input) => {
    if (input.type !== "keyDown") return;
    if (input.key === "F11" || (input.alt && input.key === "Enter")) { win.setFullScreen(!win.isFullScreen()); e.preventDefault(); }
  });
  win.loadURL("app://game/index.html");
  // Smoke test (developers only): VH_SMOKE=out.png captures the screen after load and quits.
  if (process.env.VH_SMOKE) {
    win.webContents.on("console-message", (_e, level, msg) => { if (level >= 2) console.log("[page]", msg); });
    win.webContents.once("did-finish-load", () => setTimeout(async () => {
      try {
        if (process.env.VH_SMOKE_JS) console.log("[eval]", await win.webContents.executeJavaScript(process.env.VH_SMOKE_JS));
        require("fs").writeFileSync(process.env.VH_SMOKE, (await win.webContents.capturePage()).toPNG());
      } catch (err) { console.log("[smoke error]", err && err.message); }
      app.quit();
    }, +(process.env.VH_SMOKE_WAIT || 9000)));
  }
}

app.whenReady().then(() => {
  Menu.setApplicationMenu(null);
  protocol.handle("app", (req) => {
    const u = new URL(req.url);
    const rel = decodeURIComponent(u.pathname).replace(/^\/+/, "") || "index.html";
    const file = path.normalize(path.join(GAME_DIR, rel));
    if (!file.startsWith(GAME_DIR)) return new Response("Not found", { status: 404 });
    return net.fetch(pathToFileURL(file).toString(), { headers: req.headers });
  });
  createWindow();
  app.on("activate", () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});

app.on("window-all-closed", () => { if (process.platform !== "darwin") app.quit(); });
