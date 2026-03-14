export function getScoreColor(score: number): string {
  if (score >= 80) return "hsl(152 60% 52%)";
  if (score >= 60) return "hsl(45 80% 58%)";
  if (score >= 40) return "hsl(25 75% 55%)";
  return "hsl(0 55% 55%)";
}

export function getScoreLabel(score: number): string {
  if (score >= 80) return "Xuất sắc";
  if (score >= 60) return "Khá";
  if (score >= 40) return "Trung bình";
  return "Cần cải thiện";
}

export function getScoreBadgeClass(score: number): string {
  if (score >= 80)
    return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
  if (score >= 60) return "bg-amber-500/10 text-amber-400 border-amber-500/20";
  if (score >= 40)
    return "bg-orange-500/10 text-orange-400 border-orange-500/20";
  return "bg-red-500/10 text-red-400 border-red-500/20";
}

export function formatTime(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s > 0 ? `${m}p ${s}s` : `${m}p`;
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export const DIFFICULTY_LABELS: Record<string, string> = {
  easy: "Dễ",
  medium: "Trung bình",
  hard: "Khó",
  mixed: "Hỗn hợp",
};

export const QTYPE_LABELS: Record<string, string> = {
  "multiple-choice": "Trắc nghiệm",
  "true-false": "Đúng / Sai",
  "fill-blank": "Điền trống",
  mixed: "Hỗn hợp",
};
