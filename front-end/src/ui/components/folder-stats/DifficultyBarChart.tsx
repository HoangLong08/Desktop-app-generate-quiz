import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { BarChart3 } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { CategoryAnalysis } from "@/features/stats";
import { getDifficultyLabels } from "./helpers";
import { BentoCell, CellHeader } from "./BentoCell";

export function DifficultyBarChart({
  analysis,
}: {
  analysis: CategoryAnalysis;
}) {
  const data = Object.entries(analysis.byDifficulty).map(([key, stat]) => ({
    name: getDifficultyLabels()[key] ?? key,
    avgScore: stat.avgScore,
    accuracy: stat.accuracy,
    attempts: stat.attempts,
  }));

  const { t } = useTranslation();

  if (data.length === 0) return null;

  return (
    <BentoCell glowColor="hsl(270 50% 60%)">
      <CellHeader
        icon={BarChart3}
        title={t("folderStats.difficultyChart.title")}
      />
      <ResponsiveContainer
        width="100%"
        height={Math.max(100, data.length * 52)}
      >
        <BarChart
          data={data}
          layout="vertical"
          margin={{ left: 0, right: 8, top: 0, bottom: 0 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="hsl(var(--border))"
            opacity={0.12}
            horizontal={false}
          />
          <XAxis
            type="number"
            domain={[0, 100]}
            tick={{ fontSize: 10, fill: "currentColor" }}
            className="text-muted-foreground"
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="name"
            width={80}
            tick={{ fontSize: 11, fill: "currentColor" }}
            className="text-muted-foreground"
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: 8,
              fontSize: 11,
              padding: "6px 10px",
              color: "hsl(var(--foreground))",
            }}
            cursor={{ fill: "hsl(var(--muted))", opacity: 0.1 }}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            formatter={(v: any, name: any) => {
              const labels: Record<string, string> = {
                avgScore: t("folderStats.difficultyChart.avgScore"),
                accuracy: t("folderStats.difficultyChart.accuracy"),
              };
              return [`${v}%`, labels[name] ?? name];
            }}
          />
          <Bar
            dataKey="avgScore"
            fill="hsl(270 50% 60%)"
            radius={[0, 4, 4, 0]}
            barSize={10}
            name="avgScore"
          />
          <Bar
            dataKey="accuracy"
            fill="hsl(45 80% 58%)"
            radius={[0, 4, 4, 0]}
            barSize={10}
            name="accuracy"
          />
        </BarChart>
      </ResponsiveContainer>
      <div className="flex items-center justify-center gap-5 mt-2 text-[10px] text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <div
            className="size-2 rounded-full"
            style={{ backgroundColor: "hsl(270 50% 60%)" }}
          />
          {t("folderStats.difficultyChart.avgScore")}
        </div>
        <div className="flex items-center gap-1.5">
          <div
            className="size-2 rounded-full"
            style={{ backgroundColor: "hsl(45 80% 58%)" }}
          />
          {t("folderStats.difficultyChart.accuracy")}
        </div>
      </div>
    </BentoCell>
  );
}
