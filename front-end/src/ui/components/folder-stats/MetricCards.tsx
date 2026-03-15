import { Target, Clock, Award, CheckCircle2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { FolderStatsSummary } from "@/features/stats";
import { getScoreColor, getScoreLabel, formatTime } from "./helpers";
import { BentoCell } from "./BentoCell";

export function MetricCards({ summary }: { summary: FolderStatsSummary }) {
  const { t } = useTranslation();
  const metrics = [
    {
      label: t("folderStats.metrics.avgScore"),
      value: `${summary.avgScore}%`,
      icon: Target,
      color: getScoreColor(summary.avgScore),
      sub: getScoreLabel(summary.avgScore),
    },
    {
      label: t("folderStats.metrics.bestScore"),
      value: `${summary.bestScore}%`,
      icon: Award,
      color: "hsl(152 60% 52%)",
      sub: t("folderStats.metrics.lowestScore", { score: summary.worstScore }),
    },
    {
      label: t("folderStats.metrics.accuracy"),
      value: `${summary.accuracy}%`,
      icon: CheckCircle2,
      color: getScoreColor(summary.accuracy),
      sub: t("folderStats.metrics.accuracyDetail", { correct: summary.totalCorrect, total: summary.totalQuestions }),
    },
    {
      label: t("folderStats.metrics.avgTime"),
      value: formatTime(summary.avgTimeTaken),
      icon: Clock,
      color: "hsl(217 70% 60%)",
      sub: t("folderStats.metrics.totalAttempts", { count: summary.totalAttempts }),
    },
  ];

  return (
    <>
      {metrics.map((m) => (
        <BentoCell key={m.label} glowColor={m.color}>
          <div className="flex items-center gap-2 text-muted-foreground mb-3">
            <m.icon className="size-3.5" style={{ color: m.color }} />
            <span className="text-[11px] uppercase tracking-wider font-medium">
              {m.label}
            </span>
          </div>
          <span
            className="text-3xl font-bold tracking-tight block transition-transform duration-300 group-hover/bento:translate-x-1"
            style={{ color: m.color }}
          >
            {m.value}
          </span>
          <span className="text-xs text-muted-foreground mt-1 block">
            {m.sub}
          </span>
          {/* Decorative accent bar */}
          <div
            className="mt-3 h-1 w-12 rounded-full opacity-30 transition-all duration-500 group-hover/bento:w-20 group-hover/bento:opacity-50"
            style={{ background: m.color }}
          />
        </BentoCell>
      ))}
    </>
  );
}
