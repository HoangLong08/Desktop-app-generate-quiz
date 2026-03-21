import { Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { FloatingToolbar } from "./components/Header";
import { HomePage } from "./pages/HomePage";
import { QuizPage } from "./pages/QuizPage";
import { FolderDetailPage } from "./pages/FolderDetailPage";
import { EditQuizPage } from "./pages/EditQuizPage";

function App() {
  return (
    <div className="flex h-screen flex-col bg-background text-foreground">
      <main className="flex min-h-0 flex-1 overflow-hidden">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/folder/:id" element={<FolderDetailPage />} />
          <Route path="/quiz" element={<QuizPage />} />
          <Route path="/quiz/:id/edit" element={<EditQuizPage />} />
        </Routes>
      </main>
      <FloatingToolbar />
      <Toaster />
    </div>
  );
}

export default App;
