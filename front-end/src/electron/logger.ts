import { appendFileSync, mkdirSync, renameSync, rmSync, statSync } from "node:fs";
import path from "node:path";
import { app } from "electron";

/**
 * One rollover is kept. The point is that the run *before* the current one
 * survives: a user who hits a freeze has to close and reopen the app before they
 * can send anything, and until now that second launch erased the evidence.
 */
function previousPath(filePath: string): string {
  return `${filePath}.1`;
}

/**
 * Move an existing log aside so the caller can start a clean one. Called once
 * per launch, so each file still holds exactly one run — the property the
 * truncate-on-open behaviour was there to give.
 */
export function rotateLog(filePath: string): void {
  try {
    mkdirSync(path.dirname(filePath), { recursive: true });
    statSync(filePath);
  } catch {
    return; // Nothing there yet — first launch.
  }
  try {
    rmSync(previousPath(filePath), { force: true });
    renameSync(filePath, previousPath(filePath));
  } catch {
    // A locked file is not worth failing a launch over; the new run will just
    // append to the old one.
  }
}

function getMainLogPath(): string {
  return path.join(app.getPath("userData"), "logs", "main.log");
}

/**
 * Append one line to the main-process log.
 *
 * Synchronous on purpose, and safe to be: this is called for GPU/renderer
 * crashes and unresponsive windows — rare events, and precisely the ones where
 * an async write would still be queued when the process goes down.
 */
export function logMain(message: string): void {
  const line = `${new Date().toISOString()} ${message}\n`;
  console.log(line.trimEnd());
  try {
    const filePath = getMainLogPath();
    mkdirSync(path.dirname(filePath), { recursive: true });
    appendFileSync(filePath, line);
  } catch {
    // Losing a log line must never take the app down.
  }
}

/** Start a fresh main log for this launch, keeping the previous one. */
export function startMainLog(): void {
  rotateLog(getMainLogPath());
  logMain(
    `--- launch: Generate Quiz ${app.getVersion()}, electron ${process.versions.electron}, ${process.platform} ${process.arch} ---`,
  );
}
