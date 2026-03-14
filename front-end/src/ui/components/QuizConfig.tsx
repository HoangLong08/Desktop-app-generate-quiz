import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  ListChecks,
  CheckCircle2,
  PenLine,
  Brain,
  Clock,
  Globe,
  Hash,
  Shuffle,
  CheckSquare,
} from "lucide-react";
import type {
  QuizConfig as QuizConfigType,
  QuestionType,
  Difficulty,
} from "@/features/quizz";

interface QuizConfigProps {
  config: QuizConfigType;
  onConfigChange: (config: QuizConfigType) => void;
  className?: string;
}

const questionTypeOptions: {
  value: QuestionType;
  label: string;
  icon: React.ReactNode;
}[] = [
  {
    value: "multiple-choice",
    label: "Trắc nghiệm (1 đáp án)",
    icon: <ListChecks className="size-4" />,
  },
  {
    value: "multiple-answer",
    label: "Chọn nhiều đáp án",
    icon: <CheckSquare className="size-4" />,
  },
  {
    value: "true-false",
    label: "Đúng / Sai",
    icon: <CheckCircle2 className="size-4" />,
  },
  {
    value: "fill-blank",
    label: "Điền vào chỗ trống",
    icon: <PenLine className="size-4" />,
  },
  {
    value: "mixed",
    label: "Hỗn hợp",
    icon: <Shuffle className="size-4" />,
  },
];

const difficultyOptions: { value: Difficulty; label: string; color: string }[] =
  [
    { value: "easy", label: "Dễ", color: "text-green-400" },
    { value: "medium", label: "Trung bình", color: "text-yellow-400" },
    { value: "hard", label: "Khó", color: "text-red-400" },
    { value: "mixed", label: "Hỗn hợp", color: "text-purple-400" },
  ];

export function QuizConfigPanel({
  config,
  onConfigChange,
  className,
}: QuizConfigProps) {
  const updateConfig = <K extends keyof QuizConfigType>(
    key: K,
    value: QuizConfigType[K],
  ) => {
    onConfigChange({ ...config, [key]: value });
  };

  return (
    <div className={cn("space-y-5", className)}>
      {/* Number of Questions */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">
          <Hash className="size-3.5" />
          Số lượng câu hỏi
        </Label>
        <Select
          value={String(config.numberOfQuestions)}
          onValueChange={(val) =>
            updateConfig("numberOfQuestions", Number(val))
          }
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {[5, 10, 15, 20, 25, 30, 40, 45, 50].map((n) => (
              <SelectItem key={n} value={String(n)}>
                {n} câu
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Separator />

      {/* Question Type */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">
          <ListChecks className="size-3.5" />
          Loại câu hỏi
        </Label>
        <Select
          value={config.questionType}
          onValueChange={(val) =>
            updateConfig("questionType", val as QuestionType)
          }
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {questionTypeOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                <span className="flex items-center gap-2">
                  {opt.icon}
                  {opt.label}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Separator />

      {/* Difficulty */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">
          <Brain className="size-3.5" />
          Độ khó
        </Label>
        <Select
          value={config.difficulty}
          onValueChange={(val) => updateConfig("difficulty", val as Difficulty)}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {difficultyOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                <span className={cn("flex items-center gap-2", opt.color)}>
                  {opt.label}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Separator />

      {/* Language */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">
          <Globe className="size-3.5" />
          Ngôn ngữ
        </Label>
        <Select
          value={config.language}
          onValueChange={(val) => updateConfig("language", val as "vi" | "en")}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="vi">🇻🇳 Tiếng Việt</SelectItem>
            <SelectItem value="en">🇺🇸 English</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Separator />

      {/* Time per Question */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">
          <Clock className="size-3.5" />
          Thời gian mỗi câu
        </Label>
        <Select
          value={String(config.timePerQuestion)}
          onValueChange={(val) => updateConfig("timePerQuestion", Number(val))}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="0">Không giới hạn</SelectItem>
            <SelectItem value="15">15 giây</SelectItem>
            <SelectItem value="30">30 giây</SelectItem>
            <SelectItem value="60">1 phút</SelectItem>
            <SelectItem value="120">2 phút</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
