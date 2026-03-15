import { useState } from "react";
import { useTranslation } from "react-i18next";
import i18n from "@/config/i18n";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import { BookOpen } from "lucide-react";
import type { QuizBreakdown } from "@/features/stats";
import { cn } from "@/lib/utils";
import { getScoreColor, getScoreLabel } from "./helpers";

// ─── Treemap Layout Algorithm ─────────────────────────────────────────────────

interface TNode {
  id: string;
  value: number;
}

interface TCell {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

function treemapSlice(
  nodes: TNode[],
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  vertical: boolean,
  gap: number,
): TCell[] {
  if (nodes.length === 0) return [];
  if (nodes.length === 1) {
    return [{ id: nodes[0].id, x: x0, y: y0, w: x1 - x0, h: y1 - y0 }];
  }

  const total = nodes.reduce((s, n) => s + n.value, 0);
  if (total === 0)
    return nodes.map((n) => ({ id: n.id, x: x0, y: y0, w: 0, h: 0 }));

  let bestIdx = 1;
  let bestDiff = Infinity;
  let acc = 0;
  for (let i = 0; i < nodes.length - 1; i++) {
    acc += nodes[i].value;
    const diff = Math.abs(2 * acc - total);
    if (diff < bestDiff) {
      bestDiff = diff;
      bestIdx = i + 1;
    }
  }

  const left = nodes.slice(0, bestIdx);
  const right = nodes.slice(bestIdx);
  const leftSum = left.reduce((s, n) => s + n.value, 0);
  const r = leftSum / total;
  const g = gap / 2;

  if (vertical) {
    const mid = x0 + (x1 - x0) * r;
    return [
      ...treemapSlice(left, x0, y0, mid - g, y1, !vertical, gap),
      ...treemapSlice(right, mid + g, y0, x1, y1, !vertical, gap),
    ];
  }
  const mid = y0 + (y1 - y0) * r;
  return [
    ...treemapSlice(left, x0, y0, x1, mid - g, !vertical, gap),
    ...treemapSlice(right, x0, mid + g, x1, y1, !vertical, gap),
  ];
}

function computeTreemap(
  nodes: TNode[],
  W: number,
  H: number,
  gap: number,
): TCell[] {
  if (nodes.length === 0) return [];
  const sorted = [...nodes].sort((a, b) => b.value - a.value);
  return treemapSlice(sorted, 0, 0, W, H, W >= H, gap);
}

// ─── Mode Types & Config ──────────────────────────────────────────────────────

type TreemapMode = "score" | "activity" | "difficulty";

const MODES: { key: TreemapMode; labelKey: string; legendKey: string }[] = [
  {
    key: "score",
    labelKey: "folderStats.quizTreemap.modeScore",
    legendKey: "folderStats.quizTreemap.legendScore",
  },
  {
    key: "activity",
    labelKey: "folderStats.quizTreemap.modeActivity",
    legendKey: "folderStats.quizTreemap.legendActivity",
  },
  {
    key: "difficulty",
    labelKey: "folderStats.quizTreemap.modeDifficulty",
    legendKey: "folderStats.quizTreemap.legendDifficulty",
  },
];

// ─── Score Mode Colors ────────────────────────────────────────────────────────

function getScoreGradient(score: number): string {
  if (score >= 80)
    return "linear-gradient(135deg, hsl(152 60% 52% / 0.18) 0%, hsl(152 60% 52% / 0.06) 100%)";
  if (score >= 60)
    return "linear-gradient(135deg, hsl(217 70% 60% / 0.18) 0%, hsl(217 70% 60% / 0.06) 100%)";
  if (score >= 40)
    return "linear-gradient(135deg, hsl(45 80% 58% / 0.18) 0%, hsl(45 80% 58% / 0.06) 100%)";
  return "linear-gradient(135deg, hsl(0 55% 55% / 0.18) 0%, hsl(0 55% 55% / 0.06) 100%)";
}

// ─── Activity Mode Colors (normalized 0-1) ────────────────────────────────────

function getActivityColor(n: number): string {
  if (n >= 0.75) return "hsl(15 80% 55%)";
  if (n >= 0.5) return "hsl(35 80% 55%)";
  if (n >= 0.25) return "hsl(200 60% 55%)";
  return "hsl(215 40% 60%)";
}

function getActivityGradient(n: number): string {
  if (n >= 0.75)
    return "linear-gradient(135deg, hsl(15 80% 55% / 0.22) 0%, hsl(15 80% 55% / 0.06) 100%)";
  if (n >= 0.5)
    return "linear-gradient(135deg, hsl(35 80% 55% / 0.20) 0%, hsl(35 80% 55% / 0.06) 100%)";
  if (n >= 0.25)
    return "linear-gradient(135deg, hsl(200 60% 55% / 0.18) 0%, hsl(200 60% 55% / 0.06) 100%)";
  return "linear-gradient(135deg, hsl(215 40% 60% / 0.15) 0%, hsl(215 40% 60% / 0.06) 100%)";
}

function getActivityLabel(n: number): string {
  if (n >= 0.75) return i18n.t("folderStats.quizTreemap.veryActive");
  if (n >= 0.5) return i18n.t("folderStats.quizTreemap.active");
  if (n >= 0.25) return i18n.t("folderStats.quizTreemap.moderate");
  return i18n.t("folderStats.quizTreemap.inactive");
}

// ─── Difficulty Mode Colors (lower avgScore = harder = warmer) ─────────────────

function getDifficultyColor(avg: number): string {
  if (avg >= 80) return "hsl(152 60% 52%)";
  if (avg >= 60) return "hsl(45 80% 58%)";
  if (avg >= 40) return "hsl(25 75% 55%)";
  return "hsl(0 65% 50%)";
}

function getDifficultyGradient(avg: number): string {
  if (avg >= 80)
    return "linear-gradient(135deg, hsl(152 60% 52% / 0.15) 0%, hsl(152 60% 52% / 0.05) 100%)";
  if (avg >= 60)
    return "linear-gradient(135deg, hsl(45 80% 58% / 0.18) 0%, hsl(45 80% 58% / 0.06) 100%)";
  if (avg >= 40)
    return "linear-gradient(135deg, hsl(25 75% 55% / 0.20) 0%, hsl(25 75% 55% / 0.06) 100%)";
  return "linear-gradient(135deg, hsl(0 65% 50% / 0.22) 0%, hsl(0 65% 50% / 0.06) 100%)";
}

function getDifficultyLabel(avg: number): string {
  if (avg >= 80) return i18n.t("folderStats.quizTreemap.diffEasy");
  if (avg >= 60) return i18n.t("folderStats.quizTreemap.diffMedium");
  if (avg >= 40) return i18n.t("folderStats.quizTreemap.diffHard");
  return i18n.t("folderStats.quizTreemap.diffVeryHard");
}

// ─── Mode Helpers ─────────────────────────────────────────────────────────────

function getModeSize(mode: TreemapMode, q: QuizBreakdown): number {
  if (mode === "activity") return Math.max(q.questionCount, 1);
  return Math.max(q.attemptCount, 1);
}

function getModeCellColor(
  mode: TreemapMode,
  q: QuizBreakdown,
  maxAttempts: number,
): string {
  if (mode === "score") return getScoreColor(q.bestScore ?? 0);
  if (mode === "activity")
    return getActivityColor(maxAttempts > 0 ? q.attemptCount / maxAttempts : 0);
  return getDifficultyColor(q.avgScore ?? 0);
}

function getModeCellGradient(
  mode: TreemapMode,
  q: QuizBreakdown,
  maxAttempts: number,
): string {
  if (mode === "score") return getScoreGradient(q.bestScore ?? 0);
  if (mode === "activity")
    return getActivityGradient(
      maxAttempts > 0 ? q.attemptCount / maxAttempts : 0,
    );
  return getDifficultyGradient(q.avgScore ?? 0);
}

// ─── Treemap Component ───────────────────────────────────────────────────────

export function QuizTreemap({ quizzes }: { quizzes: QuizBreakdown[] }) {
  const [mode, setMode] = useState<TreemapMode>("score");
  const { t } = useTranslation();
  const attempted = quizzes.filter((q) => q.attemptCount > 0);
  const notAttempted = quizzes.filter((q) => q.attemptCount === 0);

  if (quizzes.length === 0) return null;

  const totalAttempts = attempted.reduce((s, q) => s + q.attemptCount, 0);
  const maxAttempts = Math.max(...attempted.map((q) => q.attemptCount), 1);
  const modeConfig = MODES.find((m) => m.key === mode)!;

  const nodes: TNode[] = attempted.map((q) => ({
    id: q.quizSetId,
    value: getModeSize(mode, q),
  }));
  const cells = computeTreemap(nodes, 100, 100, 1.2);
  const quizMap = new Map(attempted.map((q) => [q.quizSetId, q]));

  return (
    <div className="col-span-full space-y-3">
      {/* Header + Mode Switch */}
      <div className="flex items-center gap-2 px-1 flex-wrap">
        <BookOpen className="size-4 text-muted-foreground" />
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {t("folderStats.quizTreemap.title")}
        </span>

        {/* ── Mode Toggle ── */}
        <div className="relative flex items-center rounded-lg border border-border/60 bg-muted/30 p-0.5">
          {MODES.map((m) => (
            <button
              key={m.key}
              onClick={() => setMode(m.key)}
              className={cn(
                "relative z-10 px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors",
                mode === m.key
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {mode === m.key && (
                <motion.div
                  layoutId="treemap-mode-pill"
                  className="absolute inset-0 bg-background shadow-sm rounded-md"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <span className="relative z-10">{t(m.labelKey)}</span>
            </button>
          ))}
        </div>

        <span className="ml-auto text-[10px] text-muted-foreground">
          {attempted.length} {t("folderStats.quizTreemap.attempted")} · {notAttempted.length} {t("folderStats.quizTreemap.notAttempted")} ·
          <span className="italic"> {t(modeConfig.legendKey)}</span>
        </span>
      </div>

      {attempted.length > 0 && (
        <TooltipProvider delayDuration={200}>
          <LayoutGroup>
            <div
              className="group/treemap relative w-full rounded-2xl border border-border/60 bg-card overflow-hidden"
              style={{
                aspectRatio:
                  attempted.length <= 2
                    ? "3 / 1"
                    : attempted.length <= 4
                      ? "2 / 1"
                      : "5 / 3",
              }}
            >
              {cells.map((cell) => {
                const quiz = quizMap.get(cell.id);
                if (!quiz) return null;
                const best = quiz.bestScore ?? 0;
                const avg = quiz.avgScore ?? 0;
                const last = quiz.lastScore ?? 0;
                const pct =
                  totalAttempts > 0
                    ? Math.round((quiz.attemptCount / totalAttempts) * 100)
                    : 0;
                const areaRatio = (cell.w * cell.h) / 10000;
                const isLarge = areaRatio > 0.08;
                const isMedium = areaRatio > 0.03;
                const borderRadius = Math.min(Math.max(areaRatio * 200, 8), 18);

                const cellColor = getModeCellColor(mode, quiz, maxAttempts);
                const cellGradient = getModeCellGradient(
                  mode,
                  quiz,
                  maxAttempts,
                );
                const actNorm =
                  maxAttempts > 0 ? quiz.attemptCount / maxAttempts : 0;

                return (
                  <Tooltip key={cell.id}>
                    <TooltipTrigger asChild>
                      <motion.div
                        layout
                        layoutId={`treemap-cell-${cell.id}`}
                        className="absolute overflow-hidden border border-border/30 hover:border-border/70 hover:brightness-110 hover:z-10 hover:shadow-lg"
                        animate={{
                          left: `${cell.x}%`,
                          top: `${cell.y}%`,
                          width: `${cell.w}%`,
                          height: `${cell.h}%`,
                          borderRadius,
                          background: cellGradient,
                        }}
                        transition={{
                          type: "spring",
                          stiffness: 200,
                          damping: 25,
                          mass: 0.8,
                        }}
                      >
                        <div className="flex flex-col justify-between h-full p-3">
                          {/* Top badge */}
                          <div className="flex justify-between items-start">
                            <motion.div
                              key={`badge-${mode}`}
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ duration: 0.2, delay: 0.1 }}
                              className="font-bold rounded-full px-1.5 py-0.5"
                              style={{
                                backgroundColor: cellColor + "20",
                                color: cellColor,
                                fontSize: isMedium ? 10 : 8,
                              }}
                            >
                              {mode === "score" && `${best.toFixed(0)}%`}
                              {mode === "activity" &&
                                `${quiz.attemptCount} ${t("folderStats.quizTreemap.times")}`}
                              {mode === "difficulty" && getDifficultyLabel(avg)}
                            </motion.div>
                            {isMedium && (
                              <motion.span
                                key={`sub-${mode}`}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 0.2, delay: 0.15 }}
                                className="text-[9px] font-semibold bg-muted/40 px-1.5 py-0.5 rounded-full text-muted-foreground"
                              >
                                {mode === "score" && `${pct}%`}
                                {mode === "activity" &&
                                  `${quiz.questionCount} ${t("folderStats.quizTreemap.questionsUnit")}`}
                                {mode === "difficulty" &&
                                  `${t("folderStats.quizTreemap.avg")}: ${avg.toFixed(0)}%`}
                              </motion.span>
                            )}
                          </div>

                          {/* Bottom: title + stats */}
                          <div className="min-w-0 mt-auto">
                            <p
                              className="font-bold text-foreground truncate leading-tight"
                              style={{
                                fontSize: isLarge ? 14 : isMedium ? 11 : 9,
                              }}
                            >
                              {quiz.title}
                            </p>
                            <AnimatePresence mode="wait">
                              {isLarge && (
                                <motion.div
                                  key={`big-${mode}`}
                                  initial={{ opacity: 0, y: 6 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={{ opacity: 0, y: -6 }}
                                  transition={{ duration: 0.2 }}
                                  className="flex items-baseline gap-1 mt-0.5"
                                >
                                  <span
                                    className="font-black tracking-tight leading-none"
                                    style={{ fontSize: 22, color: cellColor }}
                                  >
                                    {mode === "score" && best.toFixed(0)}
                                    {mode === "activity" && quiz.attemptCount}
                                    {mode === "difficulty" && avg.toFixed(0)}
                                  </span>
                                  <span className="text-[10px] text-muted-foreground">
                                    {mode === "score" && t("folderStats.quizTreemap.bestScore")}
                                    {mode === "activity" && t("folderStats.quizTreemap.timesLabel")}
                                    {mode === "difficulty" && t("folderStats.quizTreemap.avgScore")}
                                  </span>
                                </motion.div>
                              )}
                            </AnimatePresence>
                            <AnimatePresence mode="wait">
                              {isMedium && (
                                <motion.p
                                  key={`stat-${mode}`}
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: 1 }}
                                  exit={{ opacity: 0 }}
                                  transition={{ duration: 0.15 }}
                                  className="text-muted-foreground mt-0.5 truncate"
                                  style={{ fontSize: isLarge ? 10 : 9 }}
                                >
                                  {mode === "score" &&
                                    `${quiz.attemptCount} ${t("folderStats.quizTreemap.times")} · ${t("folderStats.quizTreemap.avg")}: ${avg.toFixed(0)}% · ${t("folderStats.quizTreemap.last")}: ${last.toFixed(0)}%`}
                                  {mode === "activity" &&
                                    `${t("folderStats.quizTreemap.avg")}: ${avg.toFixed(0)}% · ${t("folderStats.quizTreemap.highest")}: ${best.toFixed(0)}%`}
                                  {mode === "difficulty" &&
                                    `${quiz.attemptCount} ${t("folderStats.quizTreemap.times")} · ${t("folderStats.quizTreemap.highest")}: ${best.toFixed(0)}%`}
                                </motion.p>
                              )}
                            </AnimatePresence>
                          </div>
                        </div>
                      </motion.div>
                    </TooltipTrigger>
                    <TooltipContent
                      side="top"
                      className="max-w-56 bg-popover text-popover-foreground border border-border shadow-xl p-3 space-y-1.5"
                    >
                      <p className="font-semibold text-sm leading-tight">
                        {quiz.title}
                      </p>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                        {mode === "score" && (
                          <>
                            <span className="text-muted-foreground">
                              {t("folderStats.quizTreemap.highest")}
                            </span>
                            <span
                              className="font-bold text-right"
                              style={{ color: getScoreColor(best) }}
                            >
                              {best.toFixed(0)}% · {getScoreLabel(best)}
                            </span>
                          </>
                        )}
                        {mode === "activity" && (
                          <>
                            <span className="text-muted-foreground">
                              {t("folderStats.quizTreemap.activity")}
                            </span>
                            <span
                              className="font-bold text-right"
                              style={{ color: getActivityColor(actNorm) }}
                            >
                              {quiz.attemptCount} {t("folderStats.quizTreemap.times")} ·{" "}
                              {getActivityLabel(actNorm)}
                            </span>
                          </>
                        )}
                        {mode === "difficulty" && (
                          <>
                            <span className="text-muted-foreground">
                              {t("folderStats.quizTreemap.difficulty")}
                            </span>
                            <span
                              className="font-bold text-right"
                              style={{ color: getDifficultyColor(avg) }}
                            >
                              {getDifficultyLabel(avg)} · {t("folderStats.quizTreemap.avg")} {avg.toFixed(0)}%
                            </span>
                          </>
                        )}
                        <span className="text-muted-foreground">{t("folderStats.quizTreemap.highest")}</span>
                        <span className="font-medium text-right">
                          {best.toFixed(0)}%
                        </span>
                        <span className="text-muted-foreground">
                          {t("folderStats.quizTreemap.average")}
                        </span>
                        <span className="font-medium text-right">
                          {avg.toFixed(0)}%
                        </span>
                        <span className="text-muted-foreground">{t("folderStats.quizTreemap.lastAttempt")}</span>
                        <span className="font-medium text-right">
                          {last.toFixed(0)}%
                        </span>
                        <span className="text-muted-foreground">
                          {t("folderStats.quizTreemap.attemptCount")}
                        </span>
                        <span className="font-medium text-right">
                          {quiz.attemptCount} ({pct}%)
                        </span>
                        <span className="text-muted-foreground">{t("folderStats.quizTreemap.questionCount")}</span>
                        <span className="font-medium text-right">
                          {quiz.questionCount}
                        </span>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </div>
          </LayoutGroup>
        </TooltipProvider>
      )}

      {notAttempted.length > 0 && (
        <div className="flex flex-wrap gap-1.5 px-1">
          <span className="text-[10px] text-muted-foreground mr-1">
            {t("folderStats.quizTreemap.notAttemptedLabel")}:
          </span>
          {notAttempted.map((q) => (
            <Badge
              key={q.quizSetId}
              variant="outline"
              className="text-[10px] border-dashed"
            >
              {q.title} · {q.questionCount} {t("folderStats.quizTreemap.questionsUnit")}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
