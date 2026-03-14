import { useState } from "react";
import { motion, type Transition } from "framer-motion";
import { Trash2, Star, Folder } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

// ─── Types ───────────────────────────────────────────────────────────────────

interface InteractiveFolderProps {
  id: string;
  name: string;
  description?: string;
  color: string;
  quizCount: number;
  createdAt: string;
  isFavorite?: boolean;
  onClick: () => void;
  onDelete: () => void;
  onToggleFavorite?: () => void;
}

interface PaperConfig {
  restRotate: number;
  restY: number;
  hoverY: number;
  hoverRotate: number;
  left: number;
  title: string;
}

// ─── Physics ─────────────────────────────────────────────────────────────────

const springHover: Transition = { type: "spring", stiffness: 200, damping: 20 };
const springGentle: Transition = {
  type: "spring",
  stiffness: 160,
  damping: 22,
};

// ─── Color util ──────────────────────────────────────────────────────────────

function withAlpha(hsl: string, alpha: number): string {
  if (hsl.includes("/")) return hsl;
  return hsl.replace(")", ` / ${alpha})`);
}

// ─── Paper configs ───────────────────────────────────────────────────────────

const PAPERS: PaperConfig[] = [
  {
    restRotate: -5,
    restY: -6,
    hoverY: -30,
    hoverRotate: -9,
    left: 12,
    title: "Quiz Set",
  },
  {
    restRotate: 2,
    restY: -12,
    hoverY: -40,
    hoverRotate: 4,
    left: 18,
    title: "Bài tập",
  },
  {
    restRotate: 7,
    restY: -4,
    hoverY: -24,
    hoverRotate: 11,
    left: 24,
    title: "Ôn tập",
  },
];

const FOLDER_BACK_PATH =
  "M 0 60 C 0 26.863 26.863 0 60 0 L 297.24 0 C 347.1 0 390.697 30.64 407.604 77.464 L 422.955 119.349 C 427.602 132.029 439.697 140.404 453.151 140.404 L 900 140.404 C 933.137 140.404 960 167.267 960 200.404 L 960 680.404 C 960 713.541 933.137 740.404 900 740.404 L 60 740.404 C 26.863 740.404 0 713.541 0 680.404 Z";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function InteractiveFolder({
  id,
  name,
  description,
  color,
  quizCount,
  createdAt,
  isFavorite = false,
  onClick,
  onDelete,
  onToggleFavorite,
}: InteractiveFolderProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      className="relative cursor-pointer select-none flex flex-col gap-3"
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      onClick={onClick}
    >
      <div className="relative w-full" style={{ aspectRatio: "1 / 0.82" }}>
        {/* ── BACK ── */}
        <div className="absolute inset-0 z-[1]">
          <svg
            style={{ width: "100%", height: "100%", overflow: "visible" }}
            preserveAspectRatio="none"
            viewBox="0 0 960 740"
          >
            <defs>
              <linearGradient
                id={`grad-${id}`}
                x1="0%"
                y1="0%"
                x2="0%"
                y2="100%"
              >
                <stop offset="0%" stopColor={withAlpha(color, 0.5)} />
                <stop offset="100%" stopColor={withAlpha(color, 0.28)} />
              </linearGradient>
            </defs>
            <path d={FOLDER_BACK_PATH} fill={`url(#grad-${id})`} />
          </svg>
        </div>

        {/* ── PAPERS ── */}
        {quizCount > 0 &&
          PAPERS.map((cfg) => (
            <motion.div
              key={cfg.title}
              className="absolute z-[5] rounded-lg overflow-hidden"
              style={{
                width: "62%",
                height: "48%",
                left: `${cfg.left}%`,
                top: "8%",
                transformOrigin: "50% 100%",
                background:
                  "linear-gradient(175deg, rgba(255,255,255,0.95) 0%, rgba(245,248,255,0.9) 100%)",
                boxShadow:
                  "0 2px 8px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)",
                border: "1px solid rgba(255,255,255,0.5)",
              }}
              animate={{
                y: isHovered ? cfg.hoverY : cfg.restY,
                rotate: isHovered ? cfg.hoverRotate : cfg.restRotate,
              }}
              transition={springHover}
            >
              <div className="p-2.5 pt-3 space-y-1.5">
                <p className="text-[9px] font-bold text-gray-600 truncate leading-none">
                  {cfg.title}
                </p>
                <div className="h-[2.5px] rounded-full bg-gray-300/60 w-full" />
                <div className="h-[2.5px] rounded-full bg-gray-200/50 w-[85%]" />
                <div className="h-[2.5px] rounded-full bg-gray-200/40 w-[65%]" />
                <div className="h-[2.5px] rounded-full bg-gray-100/40 w-[50%]" />
              </div>
            </motion.div>
          ))}

        {/* ── FRONT PIECE ── */}
        <div
          className="absolute z-[10] rounded-2xl overflow-hidden"
          style={{
            top: "38%",
            left: 0,
            right: 0,
            bottom: 0,
            background: `linear-gradient(180deg, 
              ${withAlpha(color, 0.72)} 0%, 
              ${withAlpha(color, 0.55)} 40%, 
              ${withAlpha(color, 0.48)} 100%)`,
            backdropFilter: "blur(12px) saturate(180%)",
            border: "1px solid rgba(255,255,255,0.18)",
            boxShadow: `
              0 8px 32px rgba(0,0,0,0.18),
              inset 0 2px 6px rgba(255,255,255,0.12),
              inset 0 -1px 3px rgba(0,0,0,0.04)
            `,
          }}
        >
          <div
            className="absolute inset-x-0 top-0 pointer-events-none"
            style={{
              height: "35%",
              background:
                "linear-gradient(180deg, rgba(255,255,255,0.1), transparent)",
              borderRadius: "inherit",
            }}
          />

          {/* ── Details ── */}
          <div className="absolute inset-x-0 bottom-0 flex flex-col items-center gap-1 px-2 pb-3">
            <p className="text-xs font-semibold text-white truncate w-full text-center drop-shadow-sm">
              {name}
            </p>
            <p className="text-[10px] text-white/60 text-center">
              {quizCount === 0 ? "Empty" : `${quizCount} Documents`}
            </p>
          </div>

          {/* ── Favorite ── */}
          {onToggleFavorite && (
            <motion.button
              className={cn(
                "absolute left-2 top-2 size-6 flex items-center justify-center rounded-md backdrop-blur-sm transition-colors",
                isFavorite
                  ? "bg-yellow-400/30 text-yellow-300"
                  : "bg-black/20 text-white/50 hover:text-yellow-300 hover:bg-yellow-400/20",
              )}
              animate={{ opacity: isHovered || isFavorite ? 1 : 0 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite();
              }}
            >
              <Star className={cn("size-3", isFavorite && "fill-current")} />
            </motion.button>
          )}

          {/* ── Delete ── */}
          <motion.button
            className="absolute right-2 top-2 size-6 flex items-center justify-center rounded-md bg-black/20 backdrop-blur-sm text-white/50 hover:text-white hover:bg-red-500/50 transition-colors"
            animate={{ opacity: isHovered ? 1 : 0 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
          >
            <Trash2 className="size-3" />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Folder List Item ────────────────────────────────────────────────────────

export function FolderListItem({
  id: _id,
  name,
  description,
  color,
  quizCount,
  createdAt,
  isFavorite = false,
  onClick,
  onDelete,
  onToggleFavorite,
}: InteractiveFolderProps) {
  return (
    <motion.div
      className="group flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer hover:bg-muted/50 transition-colors border border-transparent hover:border-border/40 select-none"
      onClick={onClick}
      whileHover={{ x: 2 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      {/* ── Color icon ── */}
      <div
        className="size-10 rounded-xl flex-shrink-0 flex items-center justify-center"
        style={{ background: withAlpha(color, 0.18) }}
      >
        <Folder className="size-5" style={{ color }} />
      </div>

      {/* ── Info ── */}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate leading-tight">{name}</p>
        {description ? (
          <p className="text-xs text-muted-foreground truncate">
            {description}
          </p>
        ) : (
          <p className="text-xs text-muted-foreground/50">
            {formatDate(createdAt)}
          </p>
        )}
      </div>

      {/* ── Meta ── */}
      <Badge variant="secondary" className="shrink-0 text-[10px] px-1.5 py-0">
        {quizCount === 0 ? "Empty" : `${quizCount} docs`}
      </Badge>
      {description && (
        <span className="text-xs text-muted-foreground hidden sm:block shrink-0 w-20 text-right">
          {formatDate(createdAt)}
        </span>
      )}

      {/* ── Actions ── */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        {onToggleFavorite && (
          <button
            className={cn(
              "size-7 flex items-center justify-center rounded-md transition-colors",
              isFavorite
                ? "text-yellow-400"
                : "text-muted-foreground hover:text-yellow-400 hover:bg-muted",
            )}
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite();
            }}
          >
            <Star className={cn("size-3.5", isFavorite && "fill-current")} />
          </button>
        )}
        <button
          className="size-7 flex items-center justify-center rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
        >
          <Trash2 className="size-3.5" />
        </button>
      </div>
    </motion.div>
  );
}

// ─── Create Folder Card ──────────────────────────────────────────────────────

export function CreateFolderCard({ onClick }: { onClick: () => void }) {
  return (
    <div className="relative cursor-pointer select-none" onClick={onClick}>
      <div className="relative w-full" style={{ aspectRatio: "1 / 0.82" }}>
        {/* ── BACK (folder shape, dashed) ── */}
        <div className="absolute inset-0 z-[1]">
          <svg
            style={{ width: "100%", height: "100%", overflow: "visible" }}
            preserveAspectRatio="none"
            viewBox="0 0 960 740"
          >
            <path
              d={FOLDER_BACK_PATH}
              fill="none"
              stroke="currentColor"
              strokeWidth="18"
              strokeDasharray="40 22"
              className="text-border/40"
            />
          </svg>
        </div>

        {/* ── Content ── */}
        <div
          className="absolute z-[10] flex flex-col items-center justify-center gap-3 text-muted-foreground/50"
          style={{ top: "38%", left: 0, right: 0, bottom: 0 }}
        >
          <motion.div
            whileHover={{ rotate: 90 }}
            transition={springGentle}
            className="flex size-12 items-center justify-center rounded-2xl bg-muted/20"
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 5v14M5 12h14" />
            </svg>
          </motion.div>
          <span className="text-sm font-medium">Tạo thư mục mới</span>
        </div>
      </div>
    </div>
  );
}
