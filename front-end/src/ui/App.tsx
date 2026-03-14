import { Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { Header } from "./components/Header";
import { HomePage } from "./pages/HomePage";
import { QuizPage } from "./pages/QuizPage";
import { FolderDetailPage } from "./pages/FolderDetailPage";
import { SettingsPage } from "./pages/SettingsPage";

function App() {
  return (
    <div className="flex h-screen flex-col bg-background text-foreground">
      <Header />
      <main className="flex min-h-0 flex-1 overflow-hidden">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/folder/:id" element={<FolderDetailPage />} />
          <Route path="/quiz" element={<QuizPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </main>
      <Toaster />
    </div>
  );
}

export default App;
