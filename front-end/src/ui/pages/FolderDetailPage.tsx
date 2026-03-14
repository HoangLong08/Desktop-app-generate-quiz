import { useState, useEffect, type ElementType } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sparkles,
  ArrowRight,
  Loader2,
  Settings2,
  Upload,
  FlaskConical,
  ArrowLeft,
  Folder,
  Play,
  Trash2,
  History,
  BookOpen,
  FileUp,
  BarChart3,
  Brain,
  CheckCircle2,
  ScanText,
  BookOpenCheck,
} from "lucide-react";
import { PdfQuizViewer } from "../components/PdfQuizViewer";
import {
  useUploadsByQuizSet,
  useUploadsByIds,
  getUploadFileUrl,
} from "@/features/upload";
import { QuizConfigPanel } from "../components/QuizConfig";
import { MaterialsTab } from "../components/MaterialsTab";
import { MaterialSelectPanel } from "../components/MaterialSelectPanel";
import {
  useGenerateQuiz,
  useQuizSets,
  useDeleteQuizSet,
  getQuizSetApi,
} from "@/features/quizz";
import type {
  QuizConfig,
  QuizQuestion,
  InputMode,
  QuizSetSummary,
} from "@/features/quizz";
import { useFolders } from "../../features/folders";
import { useUploadRecords } from "@/features/upload";
import { FolderStatsSection } from "../components/folder-stats";
import { useFolderDetailStats } from "@/features/stats";

// ─── Error parsing ──────────────────────────────────────────────────────────

function parseQuizError(err: Error): {
  title: string;
  description: string;
  duration?: number;
} {
  const msg = err.message ?? "";

  // Quota / rate limit (HTTP 429)
  if (/429|quota exceeded|rate.?limit|free.?tier/i.test(msg)) {
    // All models exhausted in the fallback chain
    if (/all gemini models exhausted/i.test(msg)) {
      return {
        title: "Tất cả models đều hết quota",
        description:
          "Đã thử gemini-2.5-flash → gemini-2.5-flash-lite → gemini-2.0-flash, tất cả đều hết quota miễn phí hôm nay. Quota reset lúc 00:00 giờ Mỹ (khoảng 12:00-15:00 giờ Việt Nam). Thử lại sau!",
        duration: 12000,
      };
    }
    // Try to extract "retry in XX s" from the message
    const retryMatch =
      msg.match(/retry(?: in)? (\d+(?:\.\d+)?)\s*s/i) ??
      msg.match(/seconds: (\d+)/i);
    const retrySec = retryMatch ? Math.ceil(parseFloat(retryMatch[1])) : null;
    const retryNote = retrySec
      ? ` Vui lòng thử lại sau ${retrySec} giây.`
      : " Vui lòng thử lại sau ít phút.";
    return {
      title: "Vượt giới hạn Gemini API",
      description:
        "Tài khoản đã hết quota miễn phí cho model Gemini." +
        retryNote +
        " Kiểm tra billing tại ai.google.dev.",
      duration: 10000,
    };
  }

  // Gemini key missing
  if (/api key not configured|GEMINI_API_KEY|chưa có gemini/i.test(msg)) {
    return {
      title: "Chưa có API Key",
      description:
        "Vào trang API Keys (nút trên header) để thêm Gemini API key.",
      duration: 8000,
    };
  }

  // Invalid / wrong API key
  if (/401|invalid.?api.?key|api_key_invalid/i.test(msg)) {
    return {
      title: "API Key không hợp lệ",
      description:
        "Gemini API key sai hoặc đã hết hạn. Kiểm tra lại key trong trang API Keys.",
      duration: 8000,
    };
  }

  // No text extracted from files
  if (/could not extract any text|no text content/i.test(msg)) {
    return {
      title: "Không trích xuất được văn bản",
      description:
        "File tải lên không có nội dung văn bản có thể đọc được. Thử file khác hoặc nhập văn bản trực tiếp.",
      duration: 8000,
    };
  }

  // YouTube no transcript
  if (/no transcripts|transcripts disabled|captions disabled/i.test(msg)) {
    return {
      title: "Video không có phụ đề",
      description:
        "Video YouTube này không có subtitle/captions. Hãy chọn video khác hoặc chuyển sang nhập văn bản.",
      duration: 8000,
    };
  }

  // YouTube invalid URL
  if (/invalid youtube url/i.test(msg)) {
    return {
      title: "Link YouTube không hợp lệ",
      description: "URL không đúng định dạng YouTube. Kiểm tra lại đường dẫn.",
      duration: 6000,
    };
  }

  // Network / fetch errors
  if (/network|fetch|ECONNREFUSED|failed to fetch/i.test(msg)) {
    return {
      title: "Không kết nối được server",
      description: "Kiểm tra backend đang chạy tại http://localhost:5000.",
      duration: 8000,
    };
  }

  // Generic fallback
  return {
    title: "Tạo quiz thất bại",
    description:
      msg.length > 200 ? msg.slice(0, 200) + "…" : msg || "Lỗi không xác định.",
    duration: 8000,
  };
}

// ─────────────────────────────────────────────────────────────────────────────

const QUESTION_TYPE_LABELS: Record<string, string> = {
  "multiple-choice": "Trắc nghiệm",
  "true-false": "Đúng / Sai",
  "fill-blank": "Điền trống",
  mixed: "Hỗn hợp",
};

const DIFFICULTY_LABELS: Record<string, string> = {
  easy: "Dễ",
  medium: "Trung bình",
  hard: "Khó",
  mixed: "Hỗn hợp",
};

const DIFFICULTY_VARIANT: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  easy: "secondary",
  medium: "default",
  hard: "destructive",
  mixed: "outline",
};

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ─── Small count badge for the history tab ───────────────────────────────────

function QuizCountBadge({ folderId }: { folderId: string }) {
  const { data: quizSets } = useQuizSets(folderId);
  if (!quizSets || quizSets.length === 0) return null;
  return (
    <span className="ml-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary/15 px-1 text-[10px] font-semibold text-primary">
      {quizSets.length}
    </span>
  );
}

// ─── Small count badge for the uploads tab ─────────────────────────────────────

function UploadCountBadge({ folderId }: { folderId: string }) {
  const { data: records } = useUploadRecords(folderId);
  if (!records || records.length === 0) return null;
  return (
    <span className="ml-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary/15 px-1 text-[10px] font-semibold text-primary">
      {records.length}
    </span>
  );
}

// ─── Small count badge for the stats tab ────────────────────────────────────

function StatsCountBadge({ folderId }: { folderId: string }) {
  const { data } = useFolderDetailStats(folderId);
  if (!data || data.summary.totalAttempts === 0) return null;
  return (
    <span className="ml-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary/15 px-1 text-[10px] font-semibold text-primary">
      {data.summary.totalAttempts}
    </span>
  );
}

// ─── Quiz History Section ─────────────────────────────────────────────────────

interface QuizHistorySectionProps {
  folderId: string;
}

function QuizHistorySection({ folderId }: QuizHistorySectionProps) {
  const { data: quizSets, isLoading } = useQuizSets(folderId);
  const { data: folderStats } = useFolderDetailStats(folderId);
  const deleteQuizSet = useDeleteQuizSet();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [viewerQuizSetId, setViewerQuizSetId] = useState<string | null>(null);
  const navigate = useNavigate();

  // PDF viewer state — prefer sourceUploadIds (new flow), fall back to quiz_set FK (legacy)
  const viewerQuizSet = quizSets?.find((s) => s.id === viewerQuizSetId);
  const viewerSourceIds = viewerQuizSet?.sourceUploadIds;
  const { data: uploadsByIds } = useUploadsByIds(viewerSourceIds);
  const { data: uploadsByQuizSet } = useUploadsByQuizSet(
    !viewerSourceIds?.length ? (viewerQuizSetId ?? undefined) : undefined,
  );
  const viewerUploads = uploadsByIds ?? uploadsByQuizSet;
  const [_viewerQs, _setViewerQs] = useState<QuizQuestion[]>([]);
  const [viewerLoading, setViewerLoading] = useState(false);

  useEffect(() => {
    if (!viewerQuizSetId) {
      _setViewerQs([]);
      return;
    }
    setViewerLoading(true);
    getQuizSetApi(viewerQuizSetId)
      .then((d) => _setViewerQs(d.questions as QuizQuestion[]))
      .catch(() => _setViewerQs([]))
      .finally(() => setViewerLoading(false));
  }, [viewerQuizSetId]);

  const viewerPdfRecord = viewerUploads?.find(
    (r) => r.inputMode === "files" && r.fileType?.toLowerCase() === "pdf",
  );
  const viewerQuizTitle = viewerQuizSet?.title ?? "";

  // Build a lookup for quiz breakdown data
  const quizStatsMap = new Map(
    (folderStats?.quizBreakdown ?? []).map((q) => [q.quizSetId, q]),
  );

  const handleStart = async (set: QuizSetSummary) => {
    setLoadingId(set.id);
    try {
      const detail = await getQuizSetApi(set.id);
      navigate("/quiz", {
        state: {
          questions: detail.questions,
          config: detail.config,
          extractedText: "",
          filesProcessed: 0,
          folderId,
          quizSetId: set.id,
          sourceFiles: [],
        },
      });
    } catch {
      toast.error("Không tải được quiz", {
        description: "Vui lòng thử lại.",
      });
    } finally {
      setLoadingId(null);
    }
  };

  const handleDelete = (set: QuizSetSummary) => {
    deleteQuizSet.mutate(set.id, {
      onSuccess: () =>
        toast.success("Đã xóa", { description: `"${set.title}" đã được xóa.` }),
      onError: () =>
        toast.error("Xóa thất bại", { description: "Vui lòng thử lại." }),
    });
  };

  return (
    <>
      <Card className="flex flex-col h-full">
        <CardHeader className="shrink-0 pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <History className="size-4" />
            Lịch sử Quiz
          </CardTitle>
          <CardDescription>Các quiz đã tạo trong thư mục này</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 min-h-0 p-0">
          <ScrollArea className="h-full">
            {isLoading ? (
              <div className="space-y-2 px-6 pb-4">
                {[1, 2, 3].map((n) => (
                  <div
                    key={n}
                    className="h-10 w-full animate-pulse rounded-md bg-muted"
                  />
                ))}
              </div>
            ) : !quizSets || quizSets.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-8 text-muted-foreground">
                <BookOpen className="size-8 opacity-40" />
                <p className="text-sm">Chưa có quiz nào được tạo</p>
              </div>
            ) : (
              <div className="divide-y">
                {quizSets.map((set) => {
                  const qStats = quizStatsMap.get(set.id);
                  return (
                    <div
                      key={set.id}
                      className="px-6 py-3 hover:bg-muted/40 transition-colors space-y-1.5"
                    >
                      {/* Row 1: Title + actions */}
                      <div className="flex items-center gap-2">
                        <span className="flex-1 truncate text-sm font-medium min-w-0">
                          {set.title}
                        </span>
                        <div className="flex items-center gap-1 shrink-0">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 gap-1 text-xs text-muted-foreground hover:text-foreground"
                            onClick={() => setViewerQuizSetId(set.id)}
                            title="Xem tài liệu nguồn của quiz"
                          >
                            <BookOpenCheck className="size-3.5" />
                            <span className="hidden sm:inline">Xem nguồn</span>
                          </Button>
                          <Button
                            size="sm"
                            variant="default"
                            className="h-7 gap-1 text-xs"
                            disabled={loadingId === set.id}
                            onClick={() => handleStart(set)}
                          >
                            {loadingId === set.id ? (
                              <Loader2 className="size-3 animate-spin" />
                            ) : (
                              <Play className="size-3" />
                            )}
                            Bắt đầu
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                            disabled={deleteQuizSet.isPending}
                            onClick={() => handleDelete(set)}
                          >
                            <Trash2 className="size-3" />
                          </Button>
                        </div>
                      </div>

                      {/* Row 2: Meta + badges + score */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs text-muted-foreground">
                          {formatDate(set.createdAt)} · {set.questionCount} câu
                          {qStats && qStats.attemptCount > 0 && (
                            <> · {qStats.attemptCount} lần làm</>
                          )}
                        </span>
                        <Badge
                          variant="outline"
                          className="text-[10px] px-1.5 py-0 h-4"
                        >
                          {QUESTION_TYPE_LABELS[set.config?.questionType] ??
                            set.config?.questionType}
                        </Badge>
                        <Badge
                          variant={
                            DIFFICULTY_VARIANT[set.config?.difficulty] ??
                            "outline"
                          }
                          className="text-[10px] px-1.5 py-0 h-4"
                        >
                          {DIFFICULTY_LABELS[set.config?.difficulty] ??
                            set.config?.difficulty}
                        </Badge>
                        {qStats && qStats.lastScore !== null && (
                          <span
                            className="text-xs font-semibold ml-auto"
                            style={{
                              color:
                                qStats.lastScore >= 80
                                  ? "hsl(142 71% 45%)"
                                  : qStats.lastScore >= 60
                                    ? "hsl(48 96% 53%)"
                                    : qStats.lastScore >= 40
                                      ? "hsl(25 95% 53%)"
                                      : "hsl(0 72% 51%)",
                            }}
                          >
                            {qStats.lastScore}%
                            {qStats.bestScore !== null &&
                              qStats.bestScore !== qStats.lastScore && (
                                <span className="text-[10px] text-muted-foreground font-normal ml-1">
                                  (best {qStats.bestScore}%)
                                </span>
                              )}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* PDF source viewer dialog */}
      <QuizPdfViewerDialog
        quizSetId={viewerQuizSetId}
        viewerQuestions={_viewerQs}
        viewerLoading={viewerLoading}
        viewerPdfRecord={viewerPdfRecord}
        quizTitle={viewerQuizTitle}
        onClose={() => setViewerQuizSetId(null)}
      />
    </>
  );
}
function QuizPdfViewerDialog({
  quizSetId,
  viewerQuestions,
  viewerLoading,
  viewerPdfRecord,
  quizTitle,
  onClose,
}: {
  quizSetId: string | null;
  viewerQuestions: import("@/features/quizz").QuizQuestion[];
  viewerLoading: boolean;
  viewerPdfRecord: import("@/features/upload").UploadRecord | undefined;
  quizTitle: string;
  onClose: () => void;
}) {
  if (!quizSetId) return null;
  return (
    <>
      {viewerLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/60 backdrop-blur-sm">
          <Loader2 className="size-8 animate-spin text-primary" />
        </div>
      )}
      {!viewerLoading && viewerPdfRecord && (
        <PdfQuizViewer
          open
          onClose={onClose}
          pdfUrl={getUploadFileUrl(viewerPdfRecord.id)}
          pdfName={viewerPdfRecord.originalName}
          questions={viewerQuestions}
          quizTitle={quizTitle}
          quizSetId={quizSetId ?? undefined}
        />
      )}
      {!viewerLoading && !viewerPdfRecord && (
        <Dialog open onOpenChange={(v) => !v && onClose()}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Không có file PDF</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">
              Quiz này không có file PDF nguồn được lưu trên server (có thể đã
              tạo từ YouTube hoặc văn bản trực tiếp).
            </p>
            <Button variant="outline" onClick={onClose}>
              Đóng
            </Button>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

// ─── Generating Progress Modal ──────────────────────────────────────────────

interface GeneratingStage {
  icon: ElementType;
  label: string;
  detail: string;
}

const GENERATING_STAGES: Record<InputMode, GeneratingStage[]> = {
  files: [
    {
      icon: Upload,
      label: "Tải file lên server",
      detail: "Đang nhận dữ liệu từ trình duyệt...",
    },
    {
      icon: ScanText,
      label: "Trích xuất văn bản",
      detail: "OCR / PDF / DOCX đang được xử lý...",
    },
    {
      icon: Brain,
      label: "Phân tích nội dung",
      detail: "Làm sạch và chọn đoạn văn quan trọng...",
    },
    {
      icon: Sparkles,
      label: "AI tạo câu hỏi",
      detail: "Gemini đang soạn câu hỏi từ nội dung...",
    },
  ],
  youtube: [
    {
      icon: Play,
      label: "Tải transcript YouTube",
      detail: "Đang lấy phụ đề từ video...",
    },
    {
      icon: Brain,
      label: "AI tóm tắt transcript",
      detail: "Gemini đang xử lý và rút gọn nội dung...",
    },
    {
      icon: Sparkles,
      label: "AI tạo câu hỏi",
      detail: "Soạn câu hỏi từ nội dung video...",
    },
  ],
  text: [
    {
      icon: FileUp,
      label: "Phân tích văn bản",
      detail: "Đang làm sạch và phân đoạn nội dung...",
    },
    {
      icon: Sparkles,
      label: "AI tạo câu hỏi",
      detail: "Gemini đang soạn câu hỏi...",
    },
  ],
};

// Cumulative delay (ms) before advancing to each subsequent stage
const STAGE_DELAYS: Record<InputMode, number[]> = {
  files: [2500, 7000, 6000], // 2.5 s → 9.5 s → 15.5 s
  youtube: [5000, 12000], // 5 s → 17 s
  text: [2000], // 2 s
};

function GeneratingModal({
  open,
  inputMode,
}: {
  open: boolean;
  inputMode: InputMode;
}) {
  const stages = GENERATING_STAGES[inputMode];
  const [currentStage, setCurrentStage] = useState(0);

  useEffect(() => {
    if (!open) {
      setCurrentStage(0);
      return;
    }
    setCurrentStage(0);
    const stageDelays = STAGE_DELAYS[inputMode];
    const timers: ReturnType<typeof setTimeout>[] = [];
    let cumulative = 0;
    stageDelays.forEach((delay, i) => {
      cumulative += delay;
      const t = setTimeout(() => setCurrentStage(i + 1), cumulative);
      timers.push(t);
    });
    return () => timers.forEach(clearTimeout);
  }, [open, inputMode]);

  return (
    <Dialog open={open}>
      <DialogContent
        showCloseButton={false}
        className="sm:max-w-sm gap-0 overflow-hidden p-0"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle className="flex items-center gap-2 text-base">
            <Loader2 className="size-4 animate-spin text-primary" />
            Đang tạo quiz...
          </DialogTitle>
          <DialogDescription>
            Vui lòng chờ, không đóng cửa sổ này.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-1.5 px-6 pb-6 pt-3">
          {stages.map((stage, i) => {
            const status =
              i < currentStage
                ? "done"
                : i === currentStage
                  ? "active"
                  : "pending";
            const Icon = stage.icon;
            return (
              <div
                key={i}
                className={cn(
                  "flex items-start gap-3 rounded-lg p-3 transition-all duration-500",
                  status === "active" && "bg-primary/8 ring-1 ring-primary/20",
                  status === "done" && "opacity-60",
                  status === "pending" && "opacity-30",
                )}
              >
                <div
                  className={cn(
                    "mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full",
                    status === "done" && "bg-emerald-500/15 text-emerald-500",
                    status === "active" && "bg-primary/15 text-primary",
                    status === "pending" && "bg-muted text-muted-foreground",
                  )}
                >
                  {status === "done" ? (
                    <CheckCircle2 className="size-4" />
                  ) : status === "active" ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Icon className="size-4" />
                  )}
                </div>
                <div className="flex min-h-7 flex-col justify-center gap-0.5">
                  <span
                    className={cn(
                      "text-sm font-medium leading-tight",
                      status === "active"
                        ? "text-foreground"
                        : "text-muted-foreground",
                    )}
                  >
                    {stage.label}
                  </span>
                  {status === "active" && (
                    <span className="text-xs text-muted-foreground">
                      {stage.detail}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

const DEFAULT_CONFIG: QuizConfig = {
  numberOfQuestions: 5,
  questionType: "multiple-choice",
  difficulty: "medium",
  language: "vi",
  timePerQuestion: 30,
};

export function FolderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { folders } = useFolders();
  const folder = folders.find((f) => f.id === id);

  const [config, setConfig] = useState<QuizConfig>(DEFAULT_CONFIG);
  const [reusedFileIds, setReusedFileIds] = useState<string[]>([]);

  const generateQuiz = useGenerateQuiz();

  const inputReady = reusedFileIds.length > 0;

  const handleGenerate = () => {
    if (!inputReady) {
      toast.warning("Chưa chọn tài liệu", {
        description:
          "Vui lòng chọn ít nhất một tài liệu đã tải lên để tạo quiz.",
      });
      return;
    }

    generateQuiz.mutate(
      {
        options: {
          inputMode: "files",
          files: [],
          youtubeInput: { url: "", captionLang: "vi" },
          rawText: "",
          folderId: id,
          reusedFileIds,
        },
        config,
      },
      {
        onSuccess: (data) => {
          queryClient.invalidateQueries({ queryKey: ["quizSets", id] });
          queryClient.invalidateQueries({ queryKey: ["uploadRecords", id] });

          if (data.tokenUsage && data.tokenUsage.total_tokens > 0) {
            const t = data.tokenUsage;
            toast.info("Token usage", {
              description: `Input: ${t.input_tokens.toLocaleString()} · Output: ${t.output_tokens.toLocaleString()} · Tổng: ${t.total_tokens.toLocaleString()} tokens`,
              duration: 6000,
            });
          }

          navigate("/quiz", {
            state: {
              questions: data.questions,
              config,
              extractedText: data.extractedText,
              filesProcessed: data.filesProcessed,
              folderId: id,
              quizSetId: data.quizSetId,
              sourceFiles: [],
            },
          });
        },
        onError: (err) => {
          const { title, description, duration } = parseQuizError(err);
          toast.error(title, { description, duration: duration ?? 8000 });
        },
      },
    );
  };

  const handleMockQuiz = () => {
    const mockQuestions: QuizQuestion[] = Array.from({ length: 5 }, (_, i) => {
      const qNum = i + 1;
      return {
        id: `q${qNum}_mock${String(i + 1).padStart(2, "0")}`,
        questionNumber: qNum,
        questionText: `Câu hỏi số ${qNum}: Đây là câu hỏi mock số ${qNum}. Đáp án đúng là A.`,
        type: "multiple-choice",
        options: [
          { id: "a", text: `Đáp án A cho câu ${qNum}` },
          { id: "b", text: `Đáp án B cho câu ${qNum}` },
          { id: "c", text: `Đáp án C cho câu ${qNum}` },
          { id: "d", text: `Đáp án D cho câu ${qNum}` },
        ],
        correctAnswerId: "a",
        explanation: `Giải thích: Đáp án đúng cho câu ${qNum} là A. Đây là dữ liệu mock để kiểm tra UI quiz.`,
      };
    });

    navigate("/quiz", {
      state: {
        questions: mockQuestions,
        config,
        extractedText: "Đây là dữ liệu mock để kiểm tra giao diện.",
        filesProcessed: 0,
        folderId: id,
        sourceFiles: [],
      },
    });
  };

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 min-h-0 flex-col gap-4 p-6">
      <GeneratingModal open={generateQuiz.isPending} inputMode="files" />

      {/* Breadcrumb / Back */}
      <div className="flex items-center gap-3 shrink-0">
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5 px-2"
          onClick={() => navigate("/")}
        >
          <ArrowLeft className="size-4" />
          Thư mục
        </Button>
        <span className="text-muted-foreground">/</span>
        <div className="flex items-center gap-2">
          <Folder
            className="size-4"
            style={{ color: folder?.color ?? "hsl(var(--primary))" }}
          />
          <span className="font-medium text-sm">
            {folder?.name ?? "Thư mục"}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="materials" className="flex flex-col flex-1 min-h-0">
        <TabsList className="shrink-0 w-fit">
          <TabsTrigger value="materials" className="gap-1.5">
            <FileUp className="size-3.5" />
            Tài liệu
            {id && <UploadCountBadge folderId={id} />}
          </TabsTrigger>
          <TabsTrigger value="create" className="gap-1.5">
            <Sparkles className="size-3.5" />
            Tạo Quiz
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-1.5">
            <History className="size-3.5" />
            Lịch sử
            {id && <QuizCountBadge folderId={id} />}
          </TabsTrigger>
          <TabsTrigger value="stats" className="gap-1.5">
            <BarChart3 className="size-3.5" />
            Thống kê
            {id && <StatsCountBadge folderId={id} />}
          </TabsTrigger>
        </TabsList>

        {/* ── Materials tab ──────────────────────────────────────── */}
        <TabsContent
          value="materials"
          className="flex-1 min-h-0 overflow-hidden mt-0 pt-4"
        >
          {id && <MaterialsTab folderId={id} />}
        </TabsContent>

        {/* ── Create tab ─────────────────────────────────────────── */}
        <TabsContent
          value="create"
          className="flex-1 min-h-0 overflow-hidden mt-0 pt-4"
        >
          <div className="flex gap-6 h-full min-h-0">
            {/* Left Column - Select materials */}
            <div className="flex flex-1 flex-col gap-6 overflow-y-auto pr-1">
              <MaterialSelectPanel
                folderId={id!}
                selectedIds={reusedFileIds}
                onSelectedIdsChange={setReusedFileIds}
              />
            </div>

            {/* Right Column - Config + Actions (always visible) */}
            <div className="flex w-80 shrink-0 flex-col h-full">
              <Card className="flex flex-col h-full">
                <CardHeader className="shrink-0 pb-3">
                  <CardTitle className="flex items-center gap-2">
                    <Settings2 className="size-5" />
                    Cấu hình Quiz
                  </CardTitle>
                  <CardDescription>
                    Tùy chỉnh quiz theo nhu cầu của bạn
                  </CardDescription>
                </CardHeader>

                {/* Config body — scrolls internally so footer stays visible */}
                <CardContent className="flex-1 min-h-0 p-0">
                  <ScrollArea className="h-full">
                    <div className="px-6 pb-4">
                      <QuizConfigPanel
                        config={config}
                        onConfigChange={setConfig}
                      />
                    </div>
                  </ScrollArea>
                </CardContent>

                {/* Buttons always anchored at the bottom of the card */}
                <CardFooter className="flex flex-col gap-2 pt-4 border-t">
                  <Button
                    size="lg"
                    className={cn(
                      "w-full gap-2 text-base font-semibold transition-all",
                      inputReady
                        ? "bg-linear-to-r from-primary to-primary/80 shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30"
                        : "",
                    )}
                    disabled={!inputReady || generateQuiz.isPending}
                    onClick={handleGenerate}
                  >
                    {generateQuiz.isPending ? (
                      <>
                        <Loader2 className="size-5 animate-spin" />
                        Đang tạo quiz...
                      </>
                    ) : (
                      <>
                        <Sparkles className="size-5" />
                        Tạo Quiz
                        <ArrowRight className="size-4" />
                      </>
                    )}
                  </Button>

                  <Button
                    size="lg"
                    variant="outline"
                    className="w-full gap-2 border-dashed text-base"
                    onClick={handleMockQuiz}
                  >
                    <FlaskConical className="size-5" />
                    Mock Quiz (Test UI)
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* ── History tab ────────────────────────────────────────── */}
        <TabsContent
          value="history"
          className="flex-1 min-h-0 overflow-hidden mt-0 pt-4"
        >
          {id && <QuizHistorySection folderId={id} />}
        </TabsContent>

        {/* ── Stats tab ──────────────────────────────────────────── */}
        <TabsContent
          value="stats"
          className="flex-1 min-h-0 overflow-hidden mt-0 pt-4"
        >
          {id && <FolderStatsSection folderId={id} />}
        </TabsContent>
      </Tabs>
    </div>
  );
}
