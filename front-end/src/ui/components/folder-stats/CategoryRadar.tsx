import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  Tooltip,
} from "recharts";
import { Activity } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { CategoryAnalysis } from "@/features/stats";
import { getDifficultyLabels, getQtypeLabels } from "./helpers";
import { BentoCell, CellHeader } from "./BentoCell";

export function CategoryRadar({ analysis }: { analysis: CategoryAnalysis }) {
  const difficulties = Object.entries(analysis.byDifficulty);
  const questionTypes = Object.entries(analysis.byQuestionType);

  const radarData = [
    ...difficulties.map(([key, stat]) => ({
      subject: getDifficultyLabels()[key] ?? key,
      score: stat.avgScore,
      accuracy: stat.accuracy,
    })),
    ...questionTypes.map(([key, stat]) => ({
      subject: getQtypeLabels()[key] ?? key,
      score: stat.avgScore,
      accuracy: stat.accuracy,
    })),
  ];

  if (radarData.length === 0) return null;

  const { t } = useTranslation();

  // Need at least 3 points for a radar
  while (radarData.length < 3) {
    radarData.push({ subject: "—", score: 0, accuracy: 0 });
  }

  return (
    <BentoCell glowColor="hsl(217 70% 60%)">
      <CellHeader icon={Activity} title={t("folderStats.categoryRadar.title")} />
      <ResponsiveContainer width="100%" height={220}>
        <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="72%">
          <PolarGrid stroke="hsl(var(--border))" strokeOpacity={0.4} />
          <PolarAngleAxis
            dataKey="subject"
            tick={{ fontSize: 10, fill: "currentColor" }}
            className="text-muted-foreground"
          />
          <Radar
            name={t("folderStats.categoryRadar.avgScore")}
            dataKey="score"
            stroke="hsl(217 70% 60%)"
            fill="hsl(217 70% 60%)"
            fillOpacity={0.2}
            strokeWidth={2}
          />
          <Radar
            name={t("folderStats.categoryRadar.accuracy")}
            dataKey="accuracy"
            stroke="hsl(152 60% 52%)"
            fill="hsl(152 60% 52%)"
            fillOpacity={0.1}
            strokeWidth={2}
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
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            formatter={(v: any, name: any) => [`${v}%`, name]}
          />
        </RadarChart>
      </ResponsiveContainer>
      <div className="flex items-center justify-center gap-5 mt-1 text-[10px] text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <div
            className="size-2 rounded-full"
            style={{ backgroundColor: "hsl(217 70% 60%)" }}
          />
          {t("folderStats.categoryRadar.avgScore")}
        </div>
        <div className="flex items-center gap-1.5">
          <div
            className="size-2 rounded-full"
            style={{ backgroundColor: "hsl(152 60% 52%)" }}
          />
          {t("folderStats.categoryRadar.accuracy")}
        </div>
      </div>
    </BentoCell>
  );
}
