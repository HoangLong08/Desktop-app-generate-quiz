import {
  app,
  BrowserWindow,
  dialog,
  globalShortcut,
  ipcMain,
  Menu,
  nativeTheme,
  session,
  shell,
} from "electron";
import path from "node:path";
import { ipcMainHandle, ipcMainHandleWithArg, isDev } from "./util.js";
import { logMain, startMainLog } from "./logger.js";
import {
  getAssetsPath,
  getPreloadPath,
  getSplashPath,
  getUIPath,
} from "./pathResolver.js";
import {
  defaultBaseUrl,
  killBackend,
  startBackend,
  type BackendStartResult,
} from "./backendManager.js";
import { checkForUpdate, isAllowedReleaseUrl } from "./updateChecker.js";
import type { ChildProcess } from "node:child_process";

let backendProcess: ChildProcess | null = null;
let mainWindowRef: BrowserWindow | null = null;

// A second copy would spawn a second backend against the same userData — two
// processes writing one SQLite file. Hand focus to the running copy instead.
const isPrimaryInstance = app.requestSingleInstanceLock();
if (!isPrimaryInstance) app.quit();

app.on("second-instance", () => {
  if (!mainWindowRef || mainWindowRef.isDestroyed()) return;
  if (mainWindowRef.isMinimized()) mainWindowRef.restore();
  mainWindowRef.focus();
});

// The YouTube source viewer embeds the player, and locally picked PDFs preview
// through a blob: URL. Without this both frames fall back to default-src and are
// blocked — in the packaged app only, where the header CSP is the strict one.
const FRAME_SRC = "frame-src https://www.youtube.com blob:";

function buildContentSecurityPolicy(apiOrigin: string): string {
  // Dev additionally needs Vite HMR over ws://localhost:5123 plus
  // 'unsafe-eval'/'unsafe-inline' for the Vite client and React Fast Refresh.
  if (isDev()) {
    return [
      `default-src 'self' ${apiOrigin} http://localhost:5123 ws://localhost:5123`,
      "script-src 'self' 'unsafe-eval' 'unsafe-inline' http://localhost:5123",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob:",
      "font-src 'self' data:",
      `connect-src 'self' ${apiOrigin} http://localhost:5123 ws://localhost:5123`,
      "worker-src 'self' blob:",
      FRAME_SRC,
      "object-src 'none'",
      "base-uri 'self'",
    ].join("; ");
  }
  return [
    "default-src 'self'",
    "script-src 'self'",
    // Tailwind v4 + shadcn ship some inline style attributes; allow inline styles.
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self' data:",
    `connect-src 'self' ${apiOrigin}`,
    // pdf.js loads its worker from a blob: URL.
    "worker-src 'self' blob:",
    FRAME_SRC,
    "object-src 'none'",
    "base-uri 'self'",
    "frame-ancestors 'none'",
  ].join("; ");
}

// Hosts the renderer may hand to the OS: the bundled backend, which serves the
// OAuth consent redirect and the Drive picker, plus the two provider consoles
// linked from the integrations setup dialog. Anything else is refused so this
// channel cannot become "open any link the page asks for".
const EXTERNAL_URL_ALLOWLIST = new Set([
  "localhost",
  "127.0.0.1",
  "console.cloud.google.com",
  "www.notion.so",
]);

function isAllowedExternalUrl(raw: string): boolean {
  try {
    const url = new URL(raw);
    if (url.protocol !== "http:" && url.protocol !== "https:") return false;
    return EXTERNAL_URL_ALLOWLIST.has(url.hostname);
  } catch {
    return false;
  }
}

// Matches --background in src/ui/index.css for the .light / .dark roots, so the
// native frame and the pre-paint window fill stay in step with the React theme.
const WINDOW_BACKGROUND = { light: "#ffffff", dark: "#0a0a0a" } as const;

function currentBackgroundColor(): string {
  return nativeTheme.shouldUseDarkColors
    ? WINDOW_BACKGROUND.dark
    : WINDOW_BACKGROUND.light;
}

/**
 * Bring the backend up, and when it will not come up, say so.
 *
 * A silent failure here is indistinguishable from a broken app: every screen
 * just fails to load and the only fix a user could find was running the backend
 * by hand. Returns the base URL to talk to, or null when the user gave up.
 */
async function ensureBackend(parent: BrowserWindow): Promise<string | null> {
  for (;;) {
    const result: BackendStartResult = await startBackend();
    if (result.ok) {
      backendProcess = result.child;
      return result.baseUrl;
    }
    if (parent.isDestroyed()) return null;

    console.error("Failed to start backend:", result.reason);
    const { response } = await dialog.showMessageBox(parent, {
      type: "error",
      title: "Generate Quiz",
      message: "Không khởi động được dịch vụ nền / Could not start the backend",
      detail: `${result.reason}\n\n${result.detail}\n\nLog: ${result.logPath}`,
      buttons: [
        "Thử lại / Retry",
        "Mở log / Open log",
        "Thoát / Quit",
      ],
      defaultId: 0,
      cancelId: 2,
      noLink: true,
    });

    if (response === 2) return null;
    // "Open log" shows the file and then falls through to another attempt —
    // the user can read it while the retry runs.
    if (response === 1) shell.showItemInFolder(result.logPath);
  }
}

/**
 * Give the main process a voice.
 *
 * A user reporting "the window froze" left nothing on disk to read: the backend
 * writes a log, this side wrote none. These are the three ways a freeze reaches
 * the main process — a GPU or utility child dying, the renderer dying, and the
 * window failing to pump messages — plus a one-off record of what Chromium
 * actually negotiated with the graphics driver, which is the first thing worth
 * knowing on a hybrid-graphics laptop. None of it costs anything until it fires.
 */
function watchForStalls(mainWindow: BrowserWindow): void {
  logMain(`gpu feature status: ${JSON.stringify(app.getGPUFeatureStatus())}`);

  // Which adapter Chromium actually settled on. On a hybrid-graphics laptop this
  // one line is the difference between guessing and knowing.
  void app
    .getGPUInfo("complete")
    .then((info) => {
      const detail = info as {
        gpuDevice?: unknown;
        auxAttributes?: { glRenderer?: string };
      };
      logMain(
        `gpu devices: ${JSON.stringify(detail.gpuDevice ?? null)} renderer=${detail.auxAttributes?.glRenderer ?? "unknown"}`,
      );
    })
    .catch((err: unknown) => logMain(`gpu info unavailable: ${String(err)}`));

  app.on("child-process-gone", (_event, details) => {
    const name = details.name ? ` name=${details.name}` : "";
    logMain(
      `child-process-gone type=${details.type} reason=${details.reason} exitCode=${details.exitCode}${name}`,
    );
  });

  app.on("render-process-gone", (_event, _contents, details) => {
    logMain(
      `render-process-gone reason=${details.reason} exitCode=${details.exitCode}`,
    );
  });

  let unresponsiveSince = 0;
  mainWindow.webContents.on("unresponsive", () => {
    unresponsiveSince = Date.now();
    logMain("window unresponsive");
  });
  mainWindow.webContents.on("responsive", () => {
    const heldFor = unresponsiveSince ? Date.now() - unresponsiveSince : 0;
    logMain(`window responsive again after ${heldFor}ms`);
  });
}

app.on("ready", async () => {
  if (!isPrimaryInstance) return;

  startMainLog();

  if (process.platform === "win32") {
    // Required so OS toast notifications show the app's name + icon instead of "electron.exe".
    app.setAppUserModelId("com.hoanglong.web-quizz");
  }

  // Read on every navigation by the preload script, so it must be a live value:
  // the real URL is only known once the backend has picked its port.
  let apiBaseUrl = defaultBaseUrl();
  ipcMain.on("apiBaseUrl", (event) => {
    event.returnValue = apiBaseUrl;
  });

  Menu.setApplicationMenu(null);

  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        "Content-Security-Policy": [buildContentSecurityPolicy(apiBaseUrl)],
      },
    });
  });

  const mainWindow = new BrowserWindow({
    title: "Generate Quiz",
    icon: path.join(getAssetsPath(), "trayIcon.png"),
    autoHideMenuBar: true,
    backgroundColor: currentBackgroundColor(),
    webPreferences: {
      preload: getPreloadPath(),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });
  mainWindowRef = mainWindow;

  watchForStalls(mainWindow);

  // Native folder picker for Smart Import
  ipcMainHandle("selectFolder", async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ["openDirectory"],
      title: "Select folder to import",
    });
    if (result.canceled || result.filePaths.length === 0) return null;
    return result.filePaths[0];
  });

  // The renderer owns the theme (localStorage `quizgen-theme`); mirror it onto
  // nativeTheme so Windows repaints the title bar light/dark to match.
  ipcMainHandleWithArg("setNativeTheme", (theme) => {
    nativeTheme.themeSource = theme;
    mainWindow.setBackgroundColor(currentBackgroundColor());
  });

  nativeTheme.on("updated", () => {
    mainWindow.setBackgroundColor(currentBackgroundColor());
  });

  // OAuth consent and the Google Picker must run in the system browser: Google
  // rejects embedded webviews, and their scripts would violate our CSP.
  ipcMainHandleWithArg("openExternalUrl", async (url) => {
    if (!isAllowedExternalUrl(url)) return false;
    await shell.openExternal(url);
    return true;
  });

  // Update checks live here, not in the renderer: api.github.com is outside the
  // renderer's connect-src allowlist.
  ipcMainHandleWithArg("checkForUpdate", (force) => checkForUpdate(force));

  ipcMainHandleWithArg("openReleasePage", async (url) => {
    if (!isAllowedReleaseUrl(url)) return false;
    await shell.openExternal(url);
    return true;
  });

  // Focus + restore the main window — invoked when the user clicks an OS notification.
  ipcMainHandle("focusWindow", () => {
    if (mainWindow.isMinimized()) mainWindow.restore();
    if (!mainWindow.isVisible()) mainWindow.show();
    mainWindow.focus();
  });

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

  // Loading comes last so the renderer cannot invoke a channel before its
  // handler above exists.
  if (isDev()) {
    await mainWindow.loadURL("http://localhost:5123");
    return;
  }

  // A window goes up before the backend is waited on: a cold first launch spends
  // up to a minute unpacking and scanning the bundle, and an app that shows
  // nothing for that long reads as one that failed to start.
  await mainWindow.loadFile(getSplashPath());
  const resolved = await ensureBackend(mainWindow);
  if (resolved === null || mainWindow.isDestroyed()) {
    app.quit();
    return;
  }
  apiBaseUrl = resolved;
  await mainWindow.loadFile(getUIPath());
});

// `before-quit` does not await anything, so the old one-liner let the app exit
// with the kill still in flight and the outcome unobserved. Hold the quit open
// for one pass, then leave regardless of how it went.
let isQuitting = false;
app.on("before-quit", (event) => {
  if (isQuitting) return;
  isQuitting = true;
  event.preventDefault();
  void killBackend(backendProcess).then(() => {
    logMain("backend stopped, exiting");
    app.exit(0);
  });
});
