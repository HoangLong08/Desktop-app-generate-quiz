import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock,
  Flag,
  Send,
  Download,
  Eye,
  FileText,
  Image as ImageIcon,
} from "lucide-react";
import { DocxPreview } from "../components/DocxPreview";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { exportQuizToDocx } from "@/lib/export";
import { QuizQuestion } from "../components/QuizQuestion";
import type {
  QuizQuestion as QuizQuestionType,
  QuizResult,
} from "@/features/quizz";
import { useSaveAttempt } from "@/features/stats";

export function QuizPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [startTime] = useState(Date.now());
  const [elapsed, setElapsed] = useState(0);

  // Get questions from route state (passed from HomePage after API call)
  const routeState = location.state as {
    questions?: QuizQuestionType[];
    config?: Record<string, unknown>;
    extractedText?: string;
    filesProcessed?: number;
    folderId?: string;
    quizSetId?: string;
    sourceFiles?: {
      id: string;
      name: string;
      type: string;
      preview?: string;
    }[];
  } | null;

  const questions: QuizQuestionType[] = routeState?.questions ?? [];
  const sourceFiles = routeState?.sourceFiles ?? [];
  const quizSetId = routeState?.quizSetId;
  const folderId = routeState?.folderId;

  const saveAttempt = useSaveAttempt();

  // Redirect to home if no questions available
  useEffect(() => {
    if (questions.length === 0) {
      navigate("/", { replace: true });
    }
  }, [questions.length, navigate]);

  const currentQuestion = questions[currentIndex];

  // Timer
  useEffect(() => {
    if (isSubmitted) return;
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [startTime, isSubmitted]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const handleAnswerChange = useCallback(
    (questionId: string, answerId: string) => {
      if (isSubmitted) return;
      setAnswers((prev) => ({ ...prev, [questionId]: answerId }));
    },
    [isSubmitted],
  );

  const answeredCount = Object.keys(answers).length;
  const progressPercent = (answeredCount / questions.length) * 100;

  const result: QuizResult | null = useMemo(() => {
    if (!isSubmitted) return null;

    const questionResults = questions.map((q) => {
      const isMulti = q.type === "multiple-answer";
      const selectedRaw = answers[q.id] || null;
      const selectedIdsArr = isMulti
        ? (selectedRaw || "").split(",").filter(Boolean).sort()
        : [];
      const correctIdsArr = isMulti
        ? (q.correctAnswerIds ?? []).slice().sort()
        : [];
      const isCorrect = isMulti
        ? selectedIdsArr.join(",") === correctIdsArr.join(",")
        : selectedRaw === q.correctAnswerId;
      return {
        questionId: q.id,
        questionText: q.questionText,
        selectedAnswerId: isMulti ? null : selectedRaw,
        selectedAnswerIds: isMulti ? selectedIdsArr : undefined,
        correctAnswerId: q.correctAnswerId,
        correctAnswerIds: isMulti ? correctIdsArr : undefined,
        isCorrect,
      };
    });

    const correct = questionResults.filter((r) => r.isCorrect).length;
    const skipped = questionResults.filter(
      (r) => r.selectedAnswerId === null && !r.selectedAnswerIds?.length,
    ).length;

    return {
      totalQuestions: questions.length,
      correctAnswers: correct,
      wrongAnswers: questions.length - correct - skipped,
      skippedQuestions: skipped,
      score: (correct / questions.length) * 100,
      timeTaken: elapsed,
      questionResults,
    };
  }, [isSubmitted, questions, answers, elapsed]);

  const handleSubmit = useCallback(() => {
    setIsSubmitted(true);

    // Save attempt to backend (fire-and-forget)
    if (quizSetId) {
      const questionResults = questions.map((q) => {
        const isMulti = q.type === "multiple-answer";
        const selectedRaw = answers[q.id] || null;
        const selectedIdsArr = isMulti
          ? (selectedRaw || "").split(",").filter(Boolean).sort()
          : [];
        const correctIdsArr = isMulti
          ? (q.correctAnswerIds ?? []).slice().sort()
          : [];
        const isCorrect = isMulti
          ? selectedIdsArr.join(",") === correctIdsArr.join(",")
          : selectedRaw === q.correctAnswerId;
        return {
          questionId: q.id,
          questionText: q.questionText,
          selectedAnswerId: isMulti ? null : selectedRaw,
          selectedAnswerIds: isMulti ? selectedIdsArr : undefined,
          correctAnswerId: q.correctAnswerId,
          correctAnswerIds: isMulti ? correctIdsArr : undefined,
          isCorrect,
        };
      });
      const correct = questionResults.filter((r) => r.isCorrect).length;
      const skipped = questionResults.filter(
        (r) => r.selectedAnswerId === null && !r.selectedAnswerIds?.length,
      ).length;
      saveAttempt.mutate({
        quizSetId,
        folderId: folderId || undefined,
        score: (correct / questions.length) * 100,
        correctCount: correct,
        wrongCount: questions.length - correct - skipped,
        skippedCount: skipped,
        totalQuestions: questions.length,
        timeTaken: Math.floor((Date.now() - startTime) / 1000),
        questionResults,
      });
    }
  }, [quizSetId, folderId, questions, answers, startTime, saveAttempt]);

  const handleRetry = () => {
    setAnswers({});
    setCurrentIndex(0);
    setIsSubmitted(false);
  };

  // Keyboard shortcuts
  useEffect(() => {
    if (isSubmitted) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept when user is typing
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      )
        return;
      // Don't intercept modifier combos
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      switch (e.key) {
        case "ArrowLeft":
          e.preventDefault();
          setCurrentIndex((i) => Math.max(0, i - 1));
          break;
        case "ArrowRight":
          e.preventDefault();
          setCurrentIndex((i) => Math.min(questions.length - 1, i + 1));
          break;
        case "Enter": {
          e.preventDefault();
          if (currentIndex === questions.length - 1) {
            handleSubmit();
          } else {
            setCurrentIndex((i) => Math.min(questions.length - 1, i + 1));
          }
          break;
        }
        default: {
          if (!currentQuestion) break;
          const key = e.key.toUpperCase();
          let optionIndex = -1;
          if (key.length === 1 && key >= "A" && key <= "D") {
            optionIndex = key.charCodeAt(0) - 65;
          } else if (key.length === 1 && key >= "1" && key <= "4") {
            optionIndex = parseInt(key) - 1;
          }
          if (
            optionIndex >= 0 &&
            currentQuestion.type !== "fill-blank" &&
            currentQuestion.options[optionIndex]
          ) {
            e.preventDefault();
            const optId = currentQuestion.options[optionIndex].id;
            if (currentQuestion.type === "multiple-answer") {
              // Toggle the selected option
              const current = answers[currentQuestion.id] || "";
              const currentSet = new Set(current.split(",").filter(Boolean));
              if (currentSet.has(optId)) currentSet.delete(optId);
              else currentSet.add(optId);
              handleAnswerChange(
                currentQuestion.id,
                [...currentSet].sort().join(","),
              );
            } else {
              handleAnswerChange(currentQuestion.id, optId);
            }
          }
          break;
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    isSubmitted,
    currentIndex,
    questions.length,
    currentQuestion,
    handleAnswerChange,
    handleSubmit,
  ]);

  // Don't render if no questions (will redirect via useEffect)
  if (questions.length === 0 || !currentQuestion) {
    return null;
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 min-h-0 gap-6 overflow-hidden p-6">
      {/* Main quiz area */}
      <div className="flex min-h-0 flex-1 flex-col gap-4">
        {/* Top bar */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/")}
            className="gap-1.5"
          >
            <ArrowLeft className="size-4" />
            Quay lại
          </Button>
          <div className="flex items-center gap-3">
            {sourceFiles.length > 0 && (
              <Dialog>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 hidden sm:flex text-muted-foreground hover:text-foreground"
                  >
                    <Eye className="size-4" />
                    Xem tài liệu
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col p-0 overflow-hidden">
                  <DialogHeader className="px-6 py-4 border-b shrink-0">
                    <DialogTitle>Tài liệu gốc</DialogTitle>
                  </DialogHeader>
                  <ScrollArea className="flex-1">
                    <div className="p-6 space-y-8">
                      {sourceFiles.map((f) => (
                        <div key={f.id} className="space-y-3">
                          <h3 className="font-medium flex items-center gap-2 text-primary">
                            {f.type === "application/pdf" ? (
                              <FileText className="size-5 text-red-500" />
                            ) : (
                              <ImageIcon className="size-5 text-blue-500" />
                            )}
                            {f.name}
                          </h3>
                          {f.preview ? (
                            f.type === "application/pdf" ? (
                              <iframe
                                src={`${f.preview}#toolbar=0`}
                                className="w-full h-[65vh] border rounded-lg bg-muted/30"
                              />
                            ) : f.type.includes("wordprocessingml") ||
                              f.type.includes("msword") ? (
                              <DocxPreview url={f.preview} />
                            ) : (
                              <img
                                src={f.preview}
                                alt={f.name}
                                className="w-full rounded-lg object-contain bg-muted/30 max-h-[65vh]"
                              />
                            )
                          ) : (
                            <p className="text-sm text-muted-foreground italic">
                              Không có bản xem trước.
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </DialogContent>
              </Dialog>
            )}

            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => {
                exportQuizToDocx(questions, "Bài Kiểm Tra Trắc Nghiệm");
              }}
            >
              <Download className="size-4" />
              Tải DOCX
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => window.print()}
            >
              <Download className="size-4" />
              Tải PDF
            </Button>

            <Badge
              variant="outline"
              className="gap-1.5 px-3 py-1 hidden lg:flex"
            >
              <Clock className="size-3.5" />
              {formatTime(elapsed)}
            </Badge>
            <Badge variant="secondary" className="px-3 py-1">
              {answeredCount}/{questions.length} đã trả lời
            </Badge>
          </div>
        </div>

        {/* Progress */}
        <div className="space-y-1.5">
          <Progress value={progressPercent} className="h-2" />
          <p className="text-xs text-muted-foreground text-right">
            {Math.round(progressPercent)}% hoàn thành
          </p>
        </div>

        {/* Question card */}
        <Card className="flex min-h-0 flex-1 flex-col">
          <CardContent className="min-h-0 flex-1 p-0">
            <ScrollArea className="h-full">
              <div className="p-6">
                {isSubmitted ? (
                  // Show all questions with results
                  <div className="space-y-6 pr-4">
                    {questions.map((q) => (
                      <div key={q.id}>
                        <QuizQuestion
                          question={q}
                          selectedAnswer={answers[q.id]}
                          onAnswerChange={handleAnswerChange}
                          showResult
                        />
                        {q.id !== questions[questions.length - 1].id && (
                          <Separator className="mt-6" />
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  // Show current question
                  <QuizQuestion
                    question={currentQuestion}
                    selectedAnswer={answers[currentQuestion.id]}
                    onAnswerChange={handleAnswerChange}
                  />
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Navigation buttons */}
        {!isSubmitted && (
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
                disabled={currentIndex === 0}
                className="gap-1.5"
              >
                <ArrowLeft className="size-4" />
                Câu trước
              </Button>

              <div className="flex-1 flex justify-center mx-4">
                <span className="text-sm font-medium text-muted-foreground">
                  Câu {currentIndex + 1} / {questions.length}
                </span>
              </div>

              {currentIndex < questions.length - 1 ? (
                <Button
                  onClick={() =>
                    setCurrentIndex((i) =>
                      Math.min(questions.length - 1, i + 1),
                    )
                  }
                  className="gap-1.5"
                >
                  Câu tiếp
                  <ArrowRight className="size-4" />
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  className="gap-1.5 bg-green-600 hover:bg-green-700"
                >
                  <Send className="size-4" />
                  Nộp bài
                </Button>
              )}
            </div>
            {/* Keyboard hint */}
            <p className="text-center text-[11px] text-muted-foreground/60 select-none hidden sm:block">
              <kbd className="font-mono">←</kbd>
              <kbd className="font-mono">→</kbd> điều hướng &nbsp;·&nbsp;
              <kbd className="font-mono">A</kbd>
              <kbd className="font-mono">B</kbd>
              <kbd className="font-mono">C</kbd>
              <kbd className="font-mono">D</kbd> chọn đáp án &nbsp;·&nbsp;
              <kbd className="font-mono">Enter</kbd> tiếp theo / nộp bài
            </p>
          </div>
        )}
      </div>

      {/* Right sidebar - Score / Question map */}
      <div className="flex min-h-0 w-72 shrink-0 flex-col space-y-4 overflow-y-auto">
        {isSubmitted && result ? (
          // Result panel
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Flag className="size-5" />
                Kết quả
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Score circle */}
              <div className="flex flex-col items-center gap-2 py-4">
                <div
                  className={cn(
                    "flex size-24 items-center justify-center rounded-full border-4",
                    result.score >= 80
                      ? "border-green-500 text-green-500"
                      : result.score >= 50
                        ? "border-yellow-500 text-yellow-500"
                        : "border-red-500 text-red-500",
                  )}
                >
                  <span className="text-3xl font-bold">
                    {Math.round(result.score)}%
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {result.score >= 80
                    ? "Xuất sắc! 🎉"
                    : result.score >= 50
                      ? "Khá tốt! 👍"
                      : "Cần cố gắng thêm 💪"}
                </p>
              </div>

              <Separator />

              {/* Stats */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Đúng</span>
                  <span className="font-medium text-green-500">
                    {result.correctAnswers}/{result.totalQuestions}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Sai</span>
                  <span className="font-medium text-red-500">
                    {result.wrongAnswers}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Bỏ qua</span>
                  <span className="font-medium text-muted-foreground">
                    {result.skippedQuestions}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Thời gian</span>
                  <span className="font-medium">
                    {formatTime(result.timeTaken)}
                  </span>
                </div>
              </div>

              <Separator />

              {/* Actions */}
              <div className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full gap-2"
                  onClick={handleRetry}
                >
                  Làm lại
                </Button>
                <Button className="w-full gap-2" onClick={() => navigate("/")}>
                  Tạo quiz mới
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Question navigator */}
            <div className="flex min-h-0 flex-1 flex-col gap-4">
              <Card className="flex min-h-0 flex-1 flex-col">
                <CardHeader className="pb-3 shrink-0">
                  <CardTitle className="text-sm font-medium">
                    Danh sách câu hỏi
                  </CardTitle>
                </CardHeader>
                <CardContent className="min-h-0 flex-1 p-0">
                  <ScrollArea className="h-full">
                    <div className="px-6 pb-6">
                      <div className="grid grid-cols-5 gap-2">
                        {questions.map((q, i) => (
                          <button
                            key={q.id}
                            onClick={() => setCurrentIndex(i)}
                            className={cn(
                              "flex size-10 items-center justify-center rounded-md text-sm font-medium transition-all",
                              i === currentIndex
                                ? "bg-primary text-primary-foreground ring-2 ring-primary/30"
                                : answers[q.id]
                                  ? "bg-green-500/15 text-green-500 border border-green-500/30"
                                  : "bg-muted text-muted-foreground hover:bg-muted/80",
                            )}
                          >
                            {i + 1}
                          </button>
                        ))}
                      </div>

                      <Separator className="my-4" />

                      <div className="space-y-2 text-xs text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <div className="size-3 rounded-sm bg-primary" />
                          <span>Đang xem</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="size-3 rounded-sm bg-green-500/15 border border-green-500/30" />
                          <span>Đã trả lời</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="size-3 rounded-sm bg-muted" />
                          <span>Chưa trả lời</span>
                        </div>
                      </div>
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>

              <Button
                onClick={handleSubmit}
                disabled={answeredCount === 0}
                className="w-full shrink-0 gap-2"
                size="lg"
              >
                <CheckCircle2 className="size-5" />
                Nộp bài ({answeredCount}/{questions.length})
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
