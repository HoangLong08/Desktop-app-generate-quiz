import { app, BrowserWindow, globalShortcut, Menu } from "electron";
import { ipcMainHandle, isDev } from "./util.js";
import { getStationData, pollResource } from "./resourceManager.js";
import { getPreloadPath, getUIPath } from "./pathResolver.js";
import { createTray } from "./tray.js";
import { killBackend, startBackend } from "./backendManager.js";
import type { ChildProcess } from "node:child_process";

let backendProcess: ChildProcess | null = null;

app.on("ready", async () => {
  if (!isDev()) {
    backendProcess = await startBackend();
    if (!backendProcess) {
      console.error("Failed to start backend; UI may show connection errors.");
    }
  }

  Menu.setApplicationMenu(null);

  const mainWindow = new BrowserWindow({
    title: "Generate Quiz",
    autoHideMenuBar: true,
    webPreferences: {
      preload: getPreloadPath(),
    },
  });

  if (isDev()) {
    mainWindow.loadURL("http://localhost:5123");
  } else {
    mainWindow.loadFile(getUIPath());
  }

  pollResource(mainWindow);

  ipcMainHandle("getStaticData", () => {
    return getStationData();
  });

  createTray(mainWindow);

  // DevTools, reload, hard reload shortcuts
  globalShortcut.register("F12", () => {
    mainWindow.webContents.toggleDevTools();
  });
  globalShortcut.register("F5", () => {
    mainWindow.webContents.reload();
  });
  globalShortcut.register("CommandOrControl+Shift+R", () => {
    mainWindow.webContents.reloadIgnoringCache();
  });

  handleCloseEvents(mainWindow);
});

app.on("before-quit", () => {
  killBackend(backendProcess);
});

function handleCloseEvents(mainWindow: BrowserWindow) {
  let willClose = false;

  mainWindow.on("close", (e) => {
    if (willClose) {
      return;
    }
    e.preventDefault();
    mainWindow.hide();
    if (app.dock) {
      app.dock.hide();
    }
  });

  app.on("before-quit", () => {
    willClose = true;
  });

  mainWindow.on("show", () => {
    willClose = false;
  });
}
