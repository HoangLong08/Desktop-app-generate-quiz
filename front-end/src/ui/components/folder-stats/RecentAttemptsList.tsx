import { Badge } from "@/components/ui/badge";
import { Clock } from "lucide-react";
import {
  getScoreColor,
  getScoreLabel,
  getScoreBadgeClass,
  formatTime,
  formatDate,
} from "./helpers";
import { BentoCell, CellHeader } from "./BentoCell";

export function RecentAttemptsList({
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
  if (attempts.length === 0) return null;

  return (
    <BentoCell glowColor="hsl(var(--primary))">
      <CellHeader icon={Clock} title="Lần làm gần đây" />
      <div className="space-y-1 -mx-1">
        {attempts.map((a, i) => (
          <div
            key={i}
            className="flex items-center gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-muted/20"
          >
            <div
              className="size-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
              style={{
                backgroundColor: getScoreColor(a.score) + "18",
                color: getScoreColor(a.score),
              }}
            >
              {Math.round(a.score)}
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{a.quizTitle}</p>
              <p className="text-xs text-muted-foreground">
                {a.correctCount}/{a.totalQuestions} câu ·{" "}
                {formatTime(a.timeTaken)}
              </p>
            </div>

            <div className="text-right shrink-0">
              <Badge
                className={`text-[10px] border ${getScoreBadgeClass(a.score)}`}
              >
                {getScoreLabel(a.score)}
              </Badge>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                {formatDate(a.createdAt)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </BentoCell>
  );
}
