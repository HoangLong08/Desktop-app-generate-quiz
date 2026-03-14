import { cn } from "@/lib/utils";
import { GraduationCap, Settings } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "./ModeToggle";

interface HeaderProps {
  className?: string;
}

export function Header({ className }: HeaderProps) {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <header
      className={cn(
        "flex items-center justify-between border-b border-border bg-card px-6 py-3",
        className,
      )}
    >
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-3 hover:opacity-80 transition-opacity"
        >
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary">
            <GraduationCap className="size-5 text-primary-foreground" />
          </div>
          <div className="text-left">
            <h1 className="text-lg font-bold leading-tight tracking-tight">
              QuizGen
            </h1>
            <p className="text-xs text-muted-foreground">
              Tạo quiz thông minh từ tài liệu
            </p>
          </div>
        </button>
      </div>
      <div className="flex items-center gap-3">
        <Button
          variant={location.pathname === "/settings" ? "secondary" : "ghost"}
          size="sm"
          onClick={() => navigate("/settings")}
          className="gap-1.5"
        >
          <Settings className="size-4" />
          <span className="hidden sm:inline">API Keys</span>
        </Button>
        <ModeToggle />
      </div>
    </header>
  );
}
