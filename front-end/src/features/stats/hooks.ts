import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { saveAttemptApi, getFolderDetailStatsApi } from "./api";
import type { SaveAttemptPayload } from "./types";

/** Save a quiz attempt result */
export function useSaveAttempt() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: SaveAttemptPayload) => saveAttemptApi(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["stats"] });
      qc.invalidateQueries({ queryKey: ["attempts"] });
    },
  });
}

/** Folder detail stats */
export function useFolderDetailStats(folderId: string) {
  return useQuery({
    queryKey: ["stats", "folder", folderId],
    queryFn: () => getFolderDetailStatsApi(folderId),
    enabled: !!folderId,
  });
}
