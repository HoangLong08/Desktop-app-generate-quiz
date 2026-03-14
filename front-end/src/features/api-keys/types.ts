export interface ModelUsageStats {
  requests: number;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
}

export interface ModelSummary {
  model: string;
  displayName: string;
  requests: number;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  limits: {
    rpd: number;
    rpm: number;
    tpm: number;
    tier: string;
  } | null;
}

export interface GeminiApiKey {
  id: string;
  label: string;
  key: string;
  status: "active" | "cooldown" | "disabled";
  usageCount: number;
  errorCount: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalTokens: number;
  modelUsage: Record<string, ModelUsageStats>;
  lastUsedAt: string | null;
  lastError: string;
  createdAt: string | null;
}

export interface KeyPoolSummary {
  totalKeys: number;
  activeKeys: number;
  cooldownKeys: number;
  disabledKeys: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalTokens: number;
  totalUsage: number;
  totalErrors: number;
  modelUsage: ModelSummary[];
}

export interface KeysResponse {
  keys: GeminiApiKey[];
  summary: KeyPoolSummary;
}
