import { APP_CONFIG } from "@/config/app";
import type {
  QuizAttemptRecord,
  SaveAttemptPayload,
  FolderDetailStats,
} from "./types";

const API_URL = APP_CONFIG.API_URL;

/** POST /api/stats/attempts - Save a quiz attempt */
export async function saveAttemptApi(
  payload: SaveAttemptPayload,
): Promise<QuizAttemptRecord> {
  const res = await fetch(`${API_URL}/api/stats/attempts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `Failed to save attempt (${res.status})`);
  }
  return res.json();
}

/** GET /api/stats/folder/:folderId */
export async function getFolderDetailStatsApi(
  folderId: string,
): Promise<FolderDetailStats> {
  const res = await fetch(`${API_URL}/api/stats/folder/${folderId}`);
  if (!res.ok) throw new Error(`Failed to fetch folder stats (${res.status})`);
  return res.json();
}
