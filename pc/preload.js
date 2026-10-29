// Tells the game it is running as the desktop app.
const { contextBridge } = require("electron");
contextBridge.exposeInMainWorld("vhDesktop", { platform: process.platform });
