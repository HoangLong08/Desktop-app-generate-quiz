import { useState, useCallback, useEffect } from "react";
import type { GeminiApiKey, KeyPoolSummary } from "./types";
import { getKeysApi, addKeyApi, updateKeyApi, deleteKeyApi } from "./api";

const emptySummary: KeyPoolSummary = {
  totalKeys: 0,
  activeKeys: 0,
  cooldownKeys: 0,
  disabledKeys: 0,
  totalInputTokens: 0,
  totalOutputTokens: 0,
  totalTokens: 0,
  totalUsage: 0,
  totalErrors: 0,
  modelUsage: [],
};

export function useApiKeys() {
  const [keys, setKeys] = useState<GeminiApiKey[]>([]);
  const [summary, setSummary] = useState<KeyPoolSummary>(emptySummary);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getKeysApi();
      setKeys(data.keys);
      setSummary(data.summary);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load keys");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addKey = useCallback(
    async (key: string, label?: string) => {
      const newKey = await addKeyApi(key, label);
      await refresh();
      return newKey;
    },
    [refresh],
  );

  const toggleKey = useCallback(
    async (id: string, currentStatus: string) => {
      const newStatus: "active" | "disabled" = currentStatus === "disabled" ? "active" : "disabled";
      await updateKeyApi(id, { status: newStatus });
      await refresh();
    },
    [refresh],
  );

  const updateLabel = useCallback(
    async (id: string, label: string) => {
      await updateKeyApi(id, { label });
      await refresh();
    },
    [refresh],
  );

  const removeKey = useCallback(
    async (id: string) => {
      await deleteKeyApi(id);
      await refresh();
    },
    [refresh],
  );

  return {
    keys,
    summary,
    loading,
    error,
    refresh,
    addKey,
    toggleKey,
    updateLabel,
    removeKey,
  };
}
