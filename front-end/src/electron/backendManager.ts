import { spawn, type ChildProcess } from "node:child_process";
import { app } from "electron";
import { getBackendDir, getBackendExePath } from "./pathResolver.js";

const HEALTH_URL = "http://127.0.0.1:5000/api/health";
const POLL_INTERVAL_MS = 1000;
const POLL_TIMEOUT_MS = 60000;

/**
 * Poll backend health until it responds or timeout.
 */
async function waitForBackend(): Promise<boolean> {
  const deadline = Date.now() + POLL_TIMEOUT_MS;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(HEALTH_URL, { signal: AbortSignal.timeout(3000) });
      if (res.ok) return true;
    } catch {
      // not ready yet
    }
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
  }
  return false;
}

/**
 * Start the bundled backend (when packaged). Sets USER_DATA_PATH so backend
 * stores DB and uploads in app userData. Returns the child process or null in dev.
 */
export async function startBackend(): Promise<ChildProcess | null> {
  const exePath = getBackendExePath();
  const backendDir = getBackendDir();
  if (!exePath || !backendDir) return null;

  const userData = app.getPath("userData");
  const env = {
    ...process.env,
    USER_DATA_PATH: userData,
  };

  const child = spawn(exePath, [], {
    cwd: backendDir,
    env,
    stdio: "pipe",
  });

  child.on("error", (err) => {
    console.error("Backend process error:", err);
  });
  child.stderr?.on("data", (data) => {
    console.error("[Backend]", data.toString().trim());
  });

  const ready = await waitForBackend();
  if (!ready) {
    console.error("Backend did not become ready in time");
    child.kill();
    return null;
  }
  return child;
}

/**
 * Kill the backend process when app quits.
 */
export function killBackend(child: ChildProcess | null): void {
  if (!child || child.killed) return;
  child.kill("SIGTERM");
  // Force kill after a short delay if still alive (optional; child.kill() often enough)
  setTimeout(() => {
    if (!child.killed) child.kill("SIGKILL");
  }, 2000);
}
