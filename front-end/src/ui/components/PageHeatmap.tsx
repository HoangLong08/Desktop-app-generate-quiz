import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Loader2 } from "lucide-react";
import type { QuizQuestion } from "@/features/quizz";

// ─── Thermal palette (blue → cyan → yellow → orange → red) ───────────────────

const HEAT_STOPS: [number, number, number, number][] = [
  [0.0, 220, 80, 55],
  [0.25, 185, 85, 45],
  [0.5, 60, 100, 50],
  [0.75, 30, 100, 50],
  [1.0, 0, 90, 50],
];

function thermalColor(intensity: number): string {
  if (intensity <= 0) return "hsl(var(--muted))";
  const t = Math.max(0, Math.min(1, intensity));
  let lo = HEAT_STOPS[0];
  let hi = HEAT_STOPS[HEAT_STOPS.length - 1];
  for (let i = 0; i < HEAT_STOPS.length - 1; i++) {
    if (t >= HEAT_STOPS[i][0] && t <= HEAT_STOPS[i + 1][0]) {
      lo = HEAT_STOPS[i];
      hi = HEAT_STOPS[i + 1];
      break;
    }
  }
  const range = hi[0] - lo[0];
  const f = range === 0 ? 0 : (t - lo[0]) / range;
  const h = Math.round(lo[1] + f * (hi[1] - lo[1]));
  const s = Math.round(lo[2] + f * (hi[2] - lo[2]));
  const l = Math.round(lo[3] + f * (hi[3] - lo[3]));
  return `hsl(${h} ${s}% ${l}%)`;
}

const LEGEND_GRADIENT =
  "linear-gradient(to right, " +
  HEAT_STOPS.map(([, h, s, l]) => `hsl(${h} ${s}% ${l}%)`).join(", ") +
  ")";

// ─── Component ────────────────────────────────────────────────────────────────

interface PageHeatmapProps {
  distribution: Record<string, number>;
  totalPages: number;
  /** When provided, keywords are shown in page tooltips. */
  questions?: QuizQuestion[];
  /** Shows a spinner on tiles while questions are being fetched. */
  loadingQuestions?: boolean;
  /** Called on first mouse-enter — use to trigger lazy question loading. */
  onMouseEnter?: () => void;
  className?: string;
  /** Smaller tiles for embedding inside list rows. */
  compact?: boolean;
}

export function PageHeatmap({
  distribution,
  totalPages,
  questions,
  loadingQuestions,
  onMouseEnter,
  className,
  compact = false,
}: PageHeatmapProps) {
  const { t } = useTranslation();
  const maxCount = Math.max(
    ...Object.values(distribution).filter((v) => v > 0),
    1,
  );
  const totalQuestions = Object.values(distribution).reduce((a, b) => a + b, 0);

  // page → list of {questionNumber, keyword, questionText}
  const keywordMap = useMemo(() => {
    const map = new Map<
      number,
      { questionNumber: number; keyword: string; questionText: string }[]
    >();
    if (!questions) return map;
    questions.forEach((q) => {
      const kws = (q.sourceKeyword ?? []).filter(Boolean);
      const kw = kws.join(" · ");
      (q.sourcePages ?? []).forEach((p) => {
        if (!map.has(p)) map.set(p, []);
        map.get(p)!.push({
          questionNumber: q.questionNumber,
          keyword: kw,
          questionText: q.questionText,
        });
      });
    });
    return map;
  }, [questions]);

  if (totalPages === 0) return null;

  const hotspots = Object.entries(distribution)
    .filter(([, c]) => c > 0)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3);

  const tileSize = compact
    ? "h-5 w-5 text-[9px] rounded"
    : "h-7 w-7 text-[10px] rounded-sm";

  return (
    <TooltipProvider delayDuration={80}>
      <div className={cn("space-y-1.5", className)} onMouseEnter={onMouseEnter}>
        {/* Page tiles */}
        <div className="flex flex-wrap gap-0.5">
          {Array.from({ length: totalPages }, (_, i) => {
            const page = i + 1;
            const count = distribution[String(page)] ?? 0;
            const intensity = count / maxCount;
            const pageKws = keywordMap.get(page) ?? [];
            return (
              <Tooltip key={page}>
                <TooltipTrigger asChild>
                  <div
                    className={cn(
                      "flex shrink-0 cursor-default items-center justify-center font-semibold transition-transform hover:scale-110 hover:z-10 select-none",
                      tileSize,
                      count > 0 ? "text-white" : "text-muted-foreground",
                    )}
                    style={{ background: thermalColor(intensity) }}
                  >
                    {count > 0 ? (
                      count
                    ) : (
                      <span className="opacity-30 text-[8px]">{page}</span>
                    )}
                  </div>
                </TooltipTrigger>
                <TooltipContent
                  side="top"
                  className="max-w-[260px] space-y-1 text-xs"
                >
                  <p className="font-semibold">
                    {t("pageHeatmap.pageN", { n: page })}
                    {count > 0 && (
                      <span className="ml-1.5 font-normal text-muted-foreground">
                        · {count} {t("pageHeatmap.questionsCount")}
                        {totalQuestions > 0 &&
                          ` (${Math.round((count / totalQuestions) * 100)}%)`}
                      </span>
                    )}
                  </p>
                  {count === 0 ? (
                    <p className="text-muted-foreground">{t("pageHeatmap.noQuestions")}</p>
                  ) : loadingQuestions ? (
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Loader2 className="size-3 animate-spin" />
                      <span>{t("pageHeatmap.loadingKeywords")}</span>
                    </div>
                  ) : pageKws.length > 0 ? (
                    <ul className="space-y-1 pt-0.5">
                      {pageKws.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <span className="mt-0.5 flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full bg-primary/15 text-[8px] font-bold text-primary">
                            {item.questionNumber}
                          </span>
                          {item.keyword ? (
                            <span className="italic text-primary/90">
                              &ldquo;{item.keyword}&rdquo;
                            </span>
                          ) : (
                            <span className="text-muted-foreground line-clamp-2">
                              {item.questionText.slice(0, 72)}…
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-muted-foreground text-[10px]">
                      {t("pageHeatmap.hoverToLoad")}
                    </p>
                  )}
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>

        {/* Summary + hotspots (hidden in compact mode) */}
        {!compact && (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
            <span>
              <span className="font-medium text-foreground">{totalPages}</span>{" "}
              {t("pageHeatmap.page")} ·{" "}
              <span className="font-medium text-foreground">
                {totalQuestions}
              </span>{" "}
              {t("pageHeatmap.questions")}
            </span>
            {hotspots.length > 0 && (
              <span>
                {t("pageHeatmap.hotspot")}{" "}
                {hotspots.map(([page, count], idx) => (
                  <span key={page}>
                    {idx > 0 && ", "}
                    <span className="font-medium text-foreground">
                      tr.{page} ({count})
                    </span>
                  </span>
                ))}
              </span>
            )}
          </div>
        )}

        {/* Legend */}
        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
          <span>{t("pageHeatmap.low")}</span>
          <div
            className="h-1.5 w-16 rounded-sm"
            style={{ background: LEGEND_GRADIENT }}
          />
          <span>{t("pageHeatmap.high")}</span>
        </div>
      </div>
    </TooltipProvider>
  );
}
