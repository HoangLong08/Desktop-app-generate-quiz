import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";
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
  labelKey: string;
  icon: React.ReactNode;
}[] = [
  {
    value: "multiple-choice",
    labelKey: "quizConfig.types.multiple-choice",
    icon: <ListChecks className="size-4" />,
  },
  {
    value: "multiple-answer",
    labelKey: "quizConfig.types.multiple-answer",
    icon: <CheckSquare className="size-4" />,
  },
  {
    value: "true-false",
    labelKey: "quizConfig.types.true-false",
    icon: <CheckCircle2 className="size-4" />,
  },
  {
    value: "fill-blank",
    labelKey: "quizConfig.types.fill-blank",
    icon: <PenLine className="size-4" />,
  },
  {
    value: "mixed",
    labelKey: "quizConfig.types.mixed",
    icon: <Shuffle className="size-4" />,
  },
];

const difficultyOptions: {
  value: Difficulty;
  labelKey: string;
  color: string;
}[] = [
  {
    value: "easy",
    labelKey: "quizConfig.difficulties.easy",
    color: "text-green-400",
  },
  {
    value: "medium",
    labelKey: "quizConfig.difficulties.medium",
    color: "text-yellow-400",
  },
  {
    value: "hard",
    labelKey: "quizConfig.difficulties.hard",
    color: "text-red-400",
  },
  {
    value: "mixed",
    labelKey: "quizConfig.difficulties.mixed",
    color: "text-purple-400",
  },
];

export function QuizConfigPanel({
  config,
  onConfigChange,
  className,
}: QuizConfigProps) {
  const { t } = useTranslation();
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
          {t("quizConfig.questionCount")}
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
                {t("quizConfig.questionCountUnit", { n })}
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
          {t("quizConfig.questionType")}
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
                  {t(opt.labelKey)}
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
          {t("quizConfig.difficulty")}
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
                  {t(opt.labelKey)}
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
          {t("quizConfig.language")}
        </Label>
        <Select
          value={config.language}
          onValueChange={(val) => updateConfig("language", val as "vi" | "en")}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="vi">{t("quizConfig.languages.vi")}</SelectItem>
            <SelectItem value="en">{t("quizConfig.languages.en")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Separator />

      {/* Time per Question */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">
          <Clock className="size-3.5" />
          {t("quizConfig.timePerQuestion")}
        </Label>
        <Select
          value={String(config.timePerQuestion)}
          onValueChange={(val) => updateConfig("timePerQuestion", Number(val))}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="0">{t("quizConfig.timeOptions.0")}</SelectItem>
            <SelectItem value="15">{t("quizConfig.timeOptions.15")}</SelectItem>
            <SelectItem value="30">{t("quizConfig.timeOptions.30")}</SelectItem>
            <SelectItem value="60">{t("quizConfig.timeOptions.60")}</SelectItem>
            <SelectItem value="120">
              {t("quizConfig.timeOptions.120")}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
