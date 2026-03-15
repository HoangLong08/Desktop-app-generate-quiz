import { ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { useTranslation } from "react-i18next";
import { TrendingUp, TrendingDown, Minus, Percent } from "lucide-react";
import type { FolderProgress, FolderStatsSummary } from "@/features/stats";
import { BentoCell, CellHeader } from "./BentoCell";

const DONUT_COLORS = ["hsl(var(--primary))", "hsl(var(--muted))"];

export function CompletionDonut({
  progress,
  summary,
}: {
  progress: FolderProgress;
  summary: FolderStatsSummary;
}) {
  const { completedQuizSets, totalQuizSets, completionRate } = progress;
  const { t } = useTranslation();
  const donutData = [
    { name: t("folderStats.completionDonut.completed"), value: completedQuizSets },
    { name: t("folderStats.completionDonut.notAttempted"), value: totalQuizSets - completedQuizSets },
  ];

  const trendMsg =
    summary.improvementRate > 0
      ? {
          text: t("folderStats.completionDonut.improvement", { rate: summary.improvementRate }),
          icon: TrendingUp,
          color: "text-emerald-400",
        }
      : summary.improvementRate < 0
        ? {
            text: `${summary.improvementRate}%`,
            icon: TrendingDown,
            color: "text-orange-400",
          }
        : { text: "—", icon: Minus, color: "text-muted-foreground" };

  return (
    <BentoCell glowColor="hsl(var(--primary))">
      <CellHeader icon={Percent} title={t("folderStats.completionDonut.title")} />
      <div className="flex items-center gap-5">
        <div className="relative shrink-0">
          <ResponsiveContainer width={120} height={120}>
            <PieChart>
              <Pie
                data={donutData}
                cx="50%"
                cy="50%"
                innerRadius={38}
                outerRadius={52}
                paddingAngle={3}
                dataKey="value"
                strokeWidth={0}
              >
                {donutData.map((_, i) => (
                  <Cell key={i} fill={DONUT_COLORS[i]} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-xl font-bold">{completionRate}%</span>
          </div>
        </div>

        <div className="flex-1 space-y-2 min-w-0">
          <p className="text-sm font-medium">
            {t("folderStats.completionDonut.quizCount", { done: completedQuizSets, total: totalQuizSets })}
          </p>
          <p className="text-xs text-muted-foreground">
            {totalQuizSets - completedQuizSets > 0
              ? t("folderStats.completionDonut.remaining", { count: totalQuizSets - completedQuizSets })
              : t("folderStats.completionDonut.allDone")}
          </p>
          <div className={`flex items-center gap-1 text-xs ${trendMsg.color}`}>
            <trendMsg.icon className="size-3" />
            <span>{trendMsg.text}</span>
          </div>
        </div>
      </div>
    </BentoCell>
  );
}
