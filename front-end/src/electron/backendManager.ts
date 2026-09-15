import { spawn, type ChildProcess } from "node:child_process";
import { createWriteStream, mkdirSync, type WriteStream } from "node:fs";
import { createServer } from "node:net";
import path from "node:path";
import { app } from "electron";
import { getBackendDir, getBackendExePath } from "./pathResolver.js";
import { logMain, rotateLog } from "./logger.js";

/**
 * The port the OAuth redirect URIs are registered against, so it is worth
 * fighting for. Anything else on it (another install, a dev server, AirPlay
 * Receiver on macOS) makes us fall back to an ephemeral port instead of failing.
 */
const PREFERRED_PORT = 5000;
const POLL_INTERVAL_MS = 500;

/**
 * Generous on purpose: the first launch after an install unpacks a ~300MB
 * onedir bundle while the antivirus reads every byte of it, which on a slow
 * laptop runs well past a minute. Giving up early and killing the backend used
 * to leave the app permanently broken for exactly the users least able to
 * diagnose it. The wait ends the moment the process dies, so a genuinely broken
 * build still reports in seconds.
 */
const BOOT_TIMEOUT_MS = 240_000;

/** Log lines kept in memory to show in the failure dialog — the full log is on disk. */
const TAIL_LINES = 20;

/** How long SIGTERM gets before the forced kill, and how long quit waits in total. */
const ESCALATE_AFTER_MS = 1_500;
const KILL_TIMEOUT_MS = 3_000;

export type BackendStartResult =
  /** `child` is null in dev, where the developer runs the backend themselves. */
  | { ok: true; child: ChildProcess | null; baseUrl: string }
  | { ok: false; reason: string; detail: string; logPath: string };

let logTail: string[] = [];
let logStream: WriteStream | null = null;

/** Where the backend's stdout/stderr goes — surfaced to the user on failure. */
function getBackendLogPath(): string {
  return path.join(app.getPath("userData"), "logs", "backend.log");
}

function isPortFree(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const probe = createServer();
    probe.once("error", () => resolve(false));
    probe.once("listening", () => probe.close(() => resolve(true)));
    probe.listen(port, "127.0.0.1");
  });
}

/** An OS-assigned free port, used when PREFERRED_PORT is taken. */
function ephemeralPort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const probe = createServer();
    probe.once("error", reject);
    probe.once("listening", () => {
      const address = probe.address();
      const port = typeof address === "object" && address ? address.port : 0;
      probe.close(() => (port ? resolve(port) : reject(new Error("no free port"))));
    });
    probe.listen(0, "127.0.0.1");
  });
}

async function choosePort(): Promise<number> {
  if (await isPortFree(PREFERRED_PORT)) return PREFERRED_PORT;
  const fallback = await ephemeralPort();
  // Worth a log line rather than a console warning nobody sees: the usual reason
  // 5000 is taken is a backend left over from the previous run, and two backends
  // on one SQLite file is its own class of bug.
  logMain(`port ${PREFERRED_PORT} is taken; backend will use ${fallback}`);
  return fallback;
}

/**
 * Resolves true when the backend answers, false when it dies or the deadline
 * passes. `child` is watched so a crashed backend reports immediately instead
 * of holding the splash for the full timeout.
 */
function waitForBackend(baseUrl: string, child: ChildProcess): Promise<boolean> {
  return new Promise((resolve) => {
    let settled = false;
    const finish = (value: boolean) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      child.off("exit", onExit);
      resolve(value);
    };

    const onExit = () => finish(false);
    child.once("exit", onExit);
    const timer = setTimeout(() => finish(false), BOOT_TIMEOUT_MS);

    const poll = async () => {
      if (settled) return;
      try {
        const res = await fetch(`${baseUrl}/api/health`, {
          signal: AbortSignal.timeout(3000),
        });
        if (res.ok) return finish(true);
      } catch {
        // not listening yet
      }
      if (!settled) setTimeout(poll, POLL_INTERVAL_MS);
    };
    void poll();
  });
}

function openLogSink(): { write: (chunk: Buffer) => void; path: string } {
  const logPath = getBackendLogPath();
  mkdirSync(path.dirname(logPath), { recursive: true });
  // One file per launch, but the previous launch is rolled aside rather than
  // overwritten: a user only reports a freeze after closing and reopening the
  // app, and truncating here erased the very run they were reporting. Rotate on
  // the first sink of this launch only, so a Retry in the failure dialog does
  // not push that run's own output out of reach.
  if (!logStream) rotateLog(logPath);
  // A retry closes the previous stream rather than leaving two writers on one file.
  logStream?.end();
  const stream = createWriteStream(logPath, { flags: "w" });
  // A backend that is being killed can emit one last chunk; losing a log line is
  // never worth taking the main process down with it.
  stream.on("error", (err) => console.error("Backend log write failed:", err));
  logStream = stream;
  return {
    path: logPath,
    write: (chunk) => {
      if (!stream.writableEnded) stream.write(chunk);
      const lines = chunk.toString().split(/\r?\n/).filter(Boolean);
      logTail = [...logTail, ...lines].slice(-TAIL_LINES);
    },
  };
}

/**
 * Start the bundled backend (packaged builds only). Sets USER_DATA_PATH so the
 * DB, uploads and vector store live in the app's userData directory, and pins
 * the OAuth redirect base to whatever port we ended up on.
 *
 * Returns null-equivalent `{ ok: false }` rather than throwing so the caller can
 * show the user what went wrong; in dev it returns the plain default URL because
 * the developer runs `python app.py` themselves.
 */
export async function startBackend(): Promise<BackendStartResult> {
  const exePath = getBackendExePath();
  const backendDir = getBackendDir();
  if (!exePath || !backendDir) {
    return { ok: true, child: null, baseUrl: defaultBaseUrl() };
  }

  logTail = [];
  const sink = openLogSink();
  const port = await choosePort();
  const baseUrl = `http://127.0.0.1:${port}`;

  const child = spawn(exePath, [], {
    cwd: backendDir,
    env: {
      ...process.env,
      USER_DATA_PATH: app.getPath("userData"),
      PORT: String(port),
      OAUTH_REDIRECT_BASE: baseUrl,
    },
    stdio: "pipe",
  });

  let spawnError = "";
  child.on("error", (err) => {
    spawnError = err.message;
    console.error("Backend process error:", err);
  });
  // Both streams are drained: an unread pipe fills its buffer and would wedge
  // the very process we are waiting on.
  child.stdout?.on("data", sink.write);
  child.stderr?.on("data", sink.write);

  const ready = await waitForBackend(baseUrl, child);
  if (ready) return { ok: true, child, baseUrl };

  const exited = child.exitCode !== null || child.signalCode !== null;
  void killBackend(child);
  return {
    ok: false,
    reason: spawnError
      ? `Could not launch the backend: ${spawnError}`
      : exited
        ? `The backend stopped on its own (exit code ${child.exitCode}).`
        : `The backend did not answer on port ${port} within ${BOOT_TIMEOUT_MS / 1000}s.`,
    detail: logTail.join("\n") || "(the backend produced no output)",
    logPath: sink.path,
  };
}

/** Dev builds talk to the developer's own `python app.py`. */
export function defaultBaseUrl(): string {
  return `http://localhost:${PREFERRED_PORT}`;
}

/**
 * Stop the backend, resolving once it is actually gone.
 *
 * The escalation was unreachable: `child.killed` means "a signal was delivered",
 * so it is already true the instant `kill()` returns, and the `if (!child.killed)`
 * guard around the force-kill therefore never passed. SIGTERM alone does happen
 * to stop the current onedir bundle — measured: it exits and releases the port,
 * and it spawns no child processes — so the escalation was never missed. It is
 * still the only thing that would cover a build that stops exiting cleanly, and
 * `taskkill /T` is the only form of it that reaches a process tree on Windows.
 *
 * SIGTERM first rather than straight to /F: a forced kill gives SQLite and
 * ChromaDB no chance to close their files.
 *
 * Resolves on exit or after KILL_TIMEOUT_MS — a quit that cannot finish is worse
 * than a leaked process.
 */
export function killBackend(child: ChildProcess | null): Promise<void> {
  if (!child) return Promise.resolve();
  if (child.exitCode !== null || child.signalCode !== null) return Promise.resolve();

  const exited = new Promise<void>((resolve) => child.once("exit", () => resolve()));
  child.kill("SIGTERM");

  const escalate = setTimeout(() => {
    if (child.exitCode !== null || child.signalCode !== null) return;
    if (process.platform === "win32" && child.pid) {
      spawn("taskkill", ["/pid", String(child.pid), "/T", "/F"], { stdio: "ignore" });
    } else {
      child.kill("SIGKILL");
    }
  }, ESCALATE_AFTER_MS);

  const deadline = new Promise<void>((resolve) => setTimeout(resolve, KILL_TIMEOUT_MS));
  return Promise.race([exited, deadline]).finally(() => clearTimeout(escalate));
}
