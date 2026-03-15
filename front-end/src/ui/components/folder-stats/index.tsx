import { ScrollArea } from "@/components/ui/scroll-area";
import { useTranslation } from "react-i18next";
import { Loader2, BarChart3, AlertTriangle } from "lucide-react";
import { useFolderDetailStats } from "@/features/stats";
import { MetricCards } from "./MetricCards";
import { CompletionDonut } from "./CompletionDonut";
import { CategoryRadar } from "./CategoryRadar";
import { DifficultyBarChart } from "./DifficultyBarChart";
import { QuizTreemap } from "./QuizTreemap";
import { ScoreTrendArea } from "./ScoreTrendArea";
import { RecentAttemptsList } from "./RecentAttemptsList";

export function FolderStatsSection({ folderId }: { folderId: string }) {
  const { t } = useTranslation();
  const { data, isLoading, error } = useFolderDetailStats(folderId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-3 py-16">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">{t("folderStats.loading")}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-2 py-16 text-muted-foreground">
          <AlertTriangle className="size-5 opacity-40" />
          <p className="text-sm">{t("folderStats.loadError")}</p>
        </div>
      </div>
    );
  }

  if (!data || data.summary.totalAttempts === 0) {
    const hasQuizSets = data && data.progress.totalQuizSets > 0;
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-4 py-16 text-muted-foreground max-w-xs text-center">
          <div className="size-14 rounded-full bg-muted/30 flex items-center justify-center">
            <BarChart3 className="size-6 opacity-40" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">
              {t("folderStats.noData")}
            </p>
            <p className="text-xs mt-1.5 leading-relaxed">
              {hasQuizSets
                ? t("folderStats.hasQuizSets", { count: data!.progress.totalQuizSets })
                : t("folderStats.createFirst")}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const hasRadar =
    Object.keys(data.categoryAnalysis.byDifficulty).length > 0 ||
    Object.keys(data.categoryAnalysis.byQuestionType).length > 0;
  const hasDifficultyBar =
    Object.keys(data.categoryAnalysis.byDifficulty).length > 0;
  const hasTrend = data.recentAttempts.length >= 2;

  return (
    <ScrollArea className="h-full">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pb-6 pr-1">
        {/* Row 1 – 4 metric cards */}
        <MetricCards summary={data.summary} />

        {/* Row 2 – Donut + Radar (2 cols each) */}
        <div className="col-span-2">
          <CompletionDonut progress={data.progress} summary={data.summary} />
        </div>
        {hasRadar && (
          <div className="col-span-2">
            <CategoryRadar analysis={data.categoryAnalysis} />
          </div>
        )}

        {/* Row 3 – Difficulty bar + Score trend (or full width) */}
        {hasDifficultyBar && hasTrend ? (
          <>
            <div className="col-span-2">
              <DifficultyBarChart analysis={data.categoryAnalysis} />
            </div>
            <div className="col-span-2">
              <ScoreTrendArea attempts={data.recentAttempts} />
            </div>
          </>
        ) : hasDifficultyBar ? (
          <div className="col-span-full">
            <DifficultyBarChart analysis={data.categoryAnalysis} />
          </div>
        ) : hasTrend ? (
          <div className="col-span-full">
            <ScoreTrendArea attempts={data.recentAttempts} />
          </div>
        ) : null}

        {/* Row 4 – Quiz treemap (full width) */}
        <QuizTreemap quizzes={data.quizBreakdown} />

        {/* Row 5 – Recent attempts (full width) */}
        <div className="col-span-full">
          <RecentAttemptsList attempts={data.recentAttempts} />
        </div>
      </div>
    </ScrollArea>
  );
}
