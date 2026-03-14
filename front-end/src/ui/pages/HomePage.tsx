import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  FolderPlus,
  Folder,
  LayoutGrid,
  List,
  Clock,
  Star,
} from "lucide-react";
import { useFolders } from "@/features/folders";
import { cn } from "@/lib/utils";
import {
  InteractiveFolder,
  CreateFolderCard,
  FolderListItem,
} from "../components/InteractiveFolder";

const FOLDER_COLORS = [
  "hsl(262 83% 58%)",
  "hsl(217 91% 60%)",
  "hsl(142 71% 45%)",
  "hsl(38 92% 50%)",
  "hsl(346 87% 58%)",
  "hsl(187 88% 40%)",
];

const gridItemVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring" as const, stiffness: 240, damping: 24 },
  },
  exit: {
    opacity: 0,
    scale: 0.9,
    transition: { duration: 0.2 },
  },
};

export function HomePage() {
  const navigate = useNavigate();
  const {
    folders,
    loading,
    error,
    createFolder,
    deleteFolder,
    toggleFavorite,
    recordAccess,
  } = useFolders();
  const [open, setOpen] = useState(false);
  const [folderName, setFolderName] = useState("");
  const [folderDesc, setFolderDesc] = useState("");
  const [selectedColor, setSelectedColor] = useState(FOLDER_COLORS[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [viewMode, setViewMode] = useState<"grid" | "list">(
    () =>
      (localStorage.getItem("folder-view-mode") as "grid" | "list") ?? "grid",
  );
  const [activeTab, setActiveTab] = useState<"all" | "recent" | "favorites">(
    "all",
  );

  const filteredFolders = useMemo(() => {
    if (activeTab === "favorites") return folders.filter((f) => f.isFavorite);
    if (activeTab === "recent")
      return [...folders]
        .filter((f) => f.lastAccessedAt !== null)
        .sort(
          (a, b) =>
            new Date(b.lastAccessedAt!).getTime() -
            new Date(a.lastAccessedAt!).getTime(),
        )
        .slice(0, 10);
    return folders;
  }, [folders, activeTab]);

  const changeViewMode = (mode: "grid" | "list") => {
    setViewMode(mode);
    localStorage.setItem("folder-view-mode", mode);
  };

  const handleCreate = async () => {
    if (!folderName.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const newFolder = await createFolder(
        folderName,
        folderDesc,
        selectedColor,
      );
      setFolderName("");
      setFolderDesc("");
      setSelectedColor(FOLDER_COLORS[0]);
      setOpen(false);
      navigate(`/folder/${newFolder.id}`);
    } catch (err) {
      console.error("Failed to create folder:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-muted-foreground"
        >
          Đang tải thư mục...
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-2">
        <p className="text-destructive font-medium">Lỗi: {error}</p>
        <Button variant="outline" onClick={() => window.location.reload()}>
          Thử lại
        </Button>
      </div>
    );
  }

  return (
    <ScrollArea className="flex-1 min-h-0">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-6">
        {/* Header row */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="flex items-center justify-between shrink-0"
        >
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Thư mục Quiz</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Quản lý và tổ chức các bộ Quiz của bạn
            </p>
          </div>

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <FolderPlus className="size-4" />
                Tạo thư mục
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[420px]">
              <DialogHeader>
                <DialogTitle>Tạo thư mục mới</DialogTitle>
                <DialogDescription>
                  Nhập tên và chọn màu cho thư mục của bạn.
                </DialogDescription>
              </DialogHeader>
              <div className="flex flex-col gap-4 py-2">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="folder-name">Tên thư mục</Label>
                  <Input
                    id="folder-name"
                    placeholder="Ví dụ: Toán học, Lịch sử..."
                    value={folderName}
                    onChange={(e) => setFolderName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                    autoFocus
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="folder-desc">Mô tả (tuỳ chọn)</Label>
                  <Input
                    id="folder-desc"
                    placeholder="Mô tả ngắn về thư mục..."
                    value={folderDesc}
                    onChange={(e) => setFolderDesc(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label>Màu thư mục</Label>
                  <div className="flex gap-2">
                    {FOLDER_COLORS.map((color) => (
                      <motion.button
                        key={color}
                        type="button"
                        whileHover={{ scale: 1.2 }}
                        whileTap={{ scale: 0.9 }}
                        className="size-7 rounded-full"
                        style={{
                          backgroundColor: color,
                          outline:
                            selectedColor === color
                              ? `3px solid ${color}`
                              : "3px solid transparent",
                          outlineOffset: "2px",
                        }}
                        onClick={() => setSelectedColor(color)}
                      />
                    ))}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>
                  Huỷ
                </Button>
                <Button onClick={handleCreate} disabled={!folderName.trim()}>
                  Tạo thư mục
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </motion.div>

        {/* ── Toolbar: tabs + view toggle ── */}
        <div className="flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-1 bg-muted/40 rounded-xl p-1">
            {(
              [
                { key: "all", label: "Tất cả", icon: Folder },
                { key: "recent", label: "Gần đây", icon: Clock },
                { key: "favorites", label: "Yêu thích", icon: Star },
              ] as const
            ).map(({ key, label, icon: Icon }) => {
              const count =
                key === "all"
                  ? folders.length
                  : key === "favorites"
                    ? folders.filter((f) => f.isFavorite).length
                    : folders.filter((f) => f.lastAccessedAt !== null).length;
              return (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg transition-all font-medium",
                    activeTab === key
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <Icon className="size-3.5" />
                  {label}
                  {count > 0 && (
                    <span
                      className={cn(
                        "text-[10px] font-semibold px-1.5 py-0.5 rounded-full",
                        activeTab === key
                          ? "bg-primary/10 text-primary"
                          : "bg-muted text-muted-foreground",
                      )}
                    >
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-1 bg-muted/40 rounded-xl p-1">
            <button
              onClick={() => changeViewMode("grid")}
              className={cn(
                "size-8 flex items-center justify-center rounded-lg transition-all",
                viewMode === "grid"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <LayoutGrid className="size-4" />
            </button>
            <button
              onClick={() => changeViewMode("list")}
              className={cn(
                "size-8 flex items-center justify-center rounded-lg transition-all",
                viewMode === "list"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <List className="size-4" />
            </button>
          </div>
        </div>

        {/* ── Content ── */}
        {folders.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 25 }}
            className="flex flex-1 flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-border py-20 text-center"
          >
            <motion.div
              animate={{ y: [0, -6, 0], rotate: [0, -3, 3, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="flex size-16 items-center justify-center rounded-full bg-muted"
            >
              <Folder className="size-8 text-muted-foreground" />
            </motion.div>
            <div>
              <p className="font-medium text-foreground">Chưa có thư mục nào</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Tạo thư mục đầu tiên để bắt đầu tổ chức Quiz của bạn.
              </p>
            </div>
            <Button
              variant="outline"
              className="gap-2 mt-2"
              onClick={() => setOpen(true)}
            >
              <FolderPlus className="size-4" />
              Tạo thư mục mới
            </Button>
          </motion.div>
        ) : filteredFolders.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center gap-3 py-16 text-center"
          >
            {activeTab === "favorites" ? (
              <>
                <Star className="size-10 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">
                  Chưa có thư mục yêu thích nào.
                </p>
              </>
            ) : (
              <>
                <Clock className="size-10 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">
                  Chưa có thư mục nào được mở gần đây.
                </p>
              </>
            )}
          </motion.div>
        ) : viewMode === "grid" ? (
          <AnimatePresence mode="wait">
            <motion.div
              key="grid"
              className="grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <AnimatePresence mode="popLayout">
                {activeTab === "all" && (
                  <motion.div
                    key="create-new"
                    layout
                    variants={gridItemVariants}
                    initial="hidden"
                    animate="visible"
                  >
                    <CreateFolderCard onClick={() => setOpen(true)} />
                  </motion.div>
                )}

                {filteredFolders.map((folder) => (
                  <motion.div
                    key={folder.id}
                    layout
                    variants={gridItemVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                  >
                    <InteractiveFolder
                      id={folder.id}
                      name={folder.name}
                      description={folder.description}
                      color={folder.color}
                      quizCount={folder.quizCount}
                      createdAt={folder.createdAt}
                      isFavorite={folder.isFavorite}
                      onClick={() => {
                        recordAccess(folder.id);
                        navigate(`/folder/${folder.id}`);
                      }}
                      onDelete={() => deleteFolder(folder.id)}
                      onToggleFavorite={() => toggleFavorite(folder.id)}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          </AnimatePresence>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key="list"
              className="flex flex-col gap-1"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              {activeTab === "all" && (
                <button
                  onClick={() => setOpen(true)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted/50 transition-colors border border-dashed border-border/40 text-muted-foreground/60 hover:text-muted-foreground mb-1"
                >
                  <div className="size-10 rounded-xl flex-shrink-0 flex items-center justify-center border border-dashed border-border/40">
                    <FolderPlus className="size-4" />
                  </div>
                  <span className="text-sm font-medium">Tạo thư mục mới</span>
                </button>
              )}

              <AnimatePresence mode="popLayout">
                {filteredFolders.map((folder) => (
                  <motion.div
                    key={folder.id}
                    layout
                    variants={gridItemVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                  >
                    <FolderListItem
                      id={folder.id}
                      name={folder.name}
                      description={folder.description}
                      color={folder.color}
                      quizCount={folder.quizCount}
                      createdAt={folder.createdAt}
                      isFavorite={folder.isFavorite}
                      onClick={() => {
                        recordAccess(folder.id);
                        navigate(`/folder/${folder.id}`);
                      }}
                      onDelete={() => deleteFolder(folder.id)}
                      onToggleFavorite={() => toggleFavorite(folder.id)}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </ScrollArea>
  );
}
