import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { TrendingUp } from "lucide-react";
import { useTranslation } from "react-i18next";
import { BentoCell, CellHeader } from "./BentoCell";

export function ScoreTrendArea({
  attempts,
}: {
  attempts: {
    quizTitle: string;
    score: number;
    correctCount: number;
    totalQuestions: number;
    timeTaken: number;
    createdAt: string;
  }[];
}) {
  const { t } = useTranslation();

  if (attempts.length < 2) return null;

  const trendData = [...attempts].reverse().map((a, i) => ({
    index: i + 1,
    score: Math.round(a.score),
    label: `#${i + 1}`,
  }));

  return (
    <BentoCell glowColor="hsl(217 70% 60%)">
      <CellHeader icon={TrendingUp} title={t("folderStats.scoreTrend.title")} />
      <ResponsiveContainer width="100%" height={180}>
        <AreaChart
          data={trendData}
          margin={{ left: -20, right: 8, top: 4, bottom: 0 }}
        >
          <defs>
            <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="0%"
                stopColor="hsl(217 70% 60%)"
                stopOpacity={0.3}
              />
              <stop
                offset="100%"
                stopColor="hsl(217 70% 60%)"
                stopOpacity={0}
              />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="hsl(var(--border))"
            opacity={0.12}
          />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 10, fill: "currentColor" }}
            className="text-muted-foreground"
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            domain={[0, 100]}
            tick={{ fontSize: 10, fill: "currentColor" }}
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
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            formatter={(v: any) => [`${v}%`, t("folderStats.scoreTrend.score")]}
            labelFormatter={(l) =>
              t("folderStats.scoreTrend.attempt", { n: l })
            }
          />
          <Area
            type="monotone"
            dataKey="score"
            stroke="hsl(217 70% 60%)"
            strokeWidth={2}
            fill="url(#scoreGrad)"
            dot={{ r: 3, fill: "hsl(217 70% 60%)", strokeWidth: 0 }}
            activeDot={{ r: 5, strokeWidth: 0 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </BentoCell>
  );
}
