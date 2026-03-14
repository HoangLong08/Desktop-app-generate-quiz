// Quiz types

export type QuestionType =
  | "multiple-choice"
  | "multiple-answer"
  | "true-false"
  | "fill-blank"
  | "mixed";

export type Difficulty = "easy" | "medium" | "hard" | "mixed";

export interface QuizConfig {
  numberOfQuestions: number;
  questionType: QuestionType;
  difficulty: Difficulty;
  language: "vi" | "en";
  timePerQuestion: number; // seconds, 0 = no limit
}

export interface QuizOption {
  id: string;
  text: string;
}

export interface QuizQuestion {
  id: string;
  questionNumber: number;
  questionText: string;
  type: QuestionType;
  options: QuizOption[];
  correctAnswerId: string;
  correctAnswerIds?: string[]; // multiple-answer type only
  explanation?: string;
  sourcePages?: number[];
  sourceKeyword?: string[];
}

export interface QuizState {
  questions: QuizQuestion[];
  answers: Record<string, string>; // questionId -> selectedOptionId
  currentQuestionIndex: number;
  startTime: number;
  endTime?: number;
}

export interface QuizResult {
  totalQuestions: number;
  correctAnswers: number;
  wrongAnswers: number;
  skippedQuestions: number;
  score: number; // percentage
  timeTaken: number; // seconds
  questionResults: {
    questionId: string;
    questionText: string;
    selectedAnswerId: string | null;
    selectedAnswerIds?: string[]; // multiple-answer type only
    correctAnswerId: string;
    correctAnswerIds?: string[]; // multiple-answer type only
    isCorrect: boolean;
  }[];
}

export interface QuizSetSummary {
  id: string;
  folderId: string | null;
  title: string;
  config: QuizConfig;
  createdAt: string;
  questionCount: number;
  pageDistribution?: {
    distribution: Record<string, number>; // page number (string) → question count
    totalPages: number;
  } | null;
  sourceUploadIds?: string[];
}

export interface QuizSetDetail extends QuizSetSummary {
  questions: QuizQuestion[];
}

export type InputMode = "files" | "youtube" | "text";

export interface YouTubeInput {
  url: string;
  captionLang: string;
}

export interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  file: File;
  preview?: string;
}
