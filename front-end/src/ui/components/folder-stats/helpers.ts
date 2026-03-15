import i18n from "@/config/i18n";

export function getScoreColor(score: number): string {
  if (score >= 80) return "hsl(152 60% 52%)";
  if (score >= 60) return "hsl(45 80% 58%)";
  if (score >= 40) return "hsl(25 75% 55%)";
  return "hsl(0 55% 55%)";
}

export function getScoreLabel(score: number): string {
  if (score >= 80) return i18n.t("folderStats.score.excellent");
  if (score >= 60) return i18n.t("folderStats.score.good");
  if (score >= 40) return i18n.t("folderStats.score.average");
  return i18n.t("folderStats.score.needsImprovement");
}

export function getScoreBadgeClass(score: number): string {
  if (score >= 80)
    return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
  if (score >= 60) return "bg-amber-500/10 text-amber-400 border-amber-500/20";
  if (score >= 40)
    return "bg-orange-500/10 text-orange-400 border-orange-500/20";
  return "bg-red-500/10 text-red-400 border-red-500/20";
}

export function formatTime(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  const min = i18n.t("folderStats.timeMin");
  return s > 0 ? `${m}${min} ${s}s` : `${m}${min}`;
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  const locale = i18n.language === "vi" ? "vi-VN" : "en-US";
  return d.toLocaleString(locale, {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function getDifficultyLabels(): Record<string, string> {
  return {
    easy: i18n.t("folderStats.difficulty.easy"),
    medium: i18n.t("folderStats.difficulty.medium"),
    hard: i18n.t("folderStats.difficulty.hard"),
    mixed: i18n.t("folderStats.difficulty.mixed"),
  };
}

export function getQtypeLabels(): Record<string, string> {
  return {
    "multiple-choice": i18n.t("folderStats.qtype.multiple-choice"),
    "true-false": i18n.t("folderStats.qtype.true-false"),
    "fill-blank": i18n.t("folderStats.qtype.fill-blank"),
    mixed: i18n.t("folderStats.qtype.mixed"),
  };
}
