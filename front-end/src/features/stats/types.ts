// Stats feature types

export interface QuizAttemptRecord {
  id: string;
  quizSetId: string;
  folderId: string | null;
  score: number;
  correctCount: number;
  wrongCount: number;
  skippedCount: number;
  totalQuestions: number;
  timeTaken: number;
  createdAt: string;
}

export interface SaveAttemptPayload {
  quizSetId: string;
  folderId?: string;
  score: number;
  correctCount: number;
  wrongCount: number;
  skippedCount: number;
  totalQuestions: number;
  timeTaken: number;
  questionResults: {
    questionId: string;
    questionText: string;
    selectedAnswerId: string | null;
    correctAnswerId: string;
    isCorrect: boolean;
  }[];
}

export interface FolderStatsSummary {
  avgScore: number;
  bestScore: number;
  worstScore: number;
  totalAttempts: number;
  totalCorrect: number;
  totalQuestions: number;
  accuracy: number;
  avgTimeTaken: number;
  improvementRate: number;
}

export interface QuizBreakdown {
  quizSetId: string;
  title: string;
  questionCount: number;
  attemptCount: number;
  bestScore: number | null;
  avgScore: number | null;
  lastScore: number | null;
  lastAttemptAt: string | null;
}

export interface FolderProgress {
  completedQuizSets: number;
  totalQuizSets: number;
  completionRate: number;
}

export interface Badge {
  id: string;
  name: string;
  icon: string;
  description: string;
}

export interface Gamification {
  level: number;
  currentXP: number;
  xpToNextLevel: number;
  totalXP: number;
  streakDays: number;
  dailyGoal: number;
  dailyCompleted: number;
  badges: Badge[];
}

export interface CategoryStat {
  attempts: number;
  avgScore: number;
  accuracy: number;
}

export interface CategoryAnalysis {
  byDifficulty: Record<string, CategoryStat>;
  byQuestionType: Record<string, CategoryStat>;
}

export interface FolderDetailStats {
  summary: FolderStatsSummary;
  progress: FolderProgress;
  gamification: Gamification;
  categoryAnalysis: CategoryAnalysis;
  quizBreakdown: QuizBreakdown[];
  recentAttempts: (QuizAttemptRecord & { quizTitle: string })[];
}
