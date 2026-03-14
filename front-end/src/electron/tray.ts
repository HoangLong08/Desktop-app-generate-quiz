import { app, BrowserWindow, Menu, Tray } from "electron";
import { getAssetsPath } from "./pathResolver.js";
import path from "path";

export function createTray(mainWindow: BrowserWindow) {
  const tray = new Tray(
    path.join(
      getAssetsPath(),
      process.platform === "darwin" ? "trayIconTemplate.png" : "trayIcon.png",
    ),
  );

  tray.setContextMenu(
    Menu.buildFromTemplate([
      {
        label: "Show",
        click: () => {
          mainWindow.show();
          if (app.dock) {
            app.dock.show();
          }
        },
        type: "normal",
      },
      {
        label: "Quit",
        click: () => {
          app.quit();
        },
      },
    ]),
  );
}
