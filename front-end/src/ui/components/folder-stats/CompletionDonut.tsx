import { ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
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
  const donutData = [
    { name: "Hoàn thành", value: completedQuizSets },
    { name: "Chưa thử", value: totalQuizSets - completedQuizSets },
  ];

  const trendMsg =
    summary.improvementRate > 0
      ? {
          text: `+${summary.improvementRate}% so với trước`,
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
      <CellHeader icon={Percent} title="Tiến độ hoàn thành" />
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
            {completedQuizSets}/{totalQuizSets} quiz
          </p>
          <p className="text-xs text-muted-foreground">
            {totalQuizSets - completedQuizSets > 0
              ? `Còn ${totalQuizSets - completedQuizSets} quiz chưa thử`
              : "Đã hoàn thành tất cả!"}
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
