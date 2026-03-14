import { useState } from "react";
import { Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "./ModeToggle";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";
import { SettingsContent } from "@/ui/pages/SettingsPage";

export function FloatingToolbar() {
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <>
      <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-full border border-border bg-card/80 px-2 py-1.5 shadow-lg backdrop-blur-md">
        <Button
          variant={settingsOpen ? "secondary" : "ghost"}
          size="icon"
          className="size-8 rounded-full"
          onClick={() => setSettingsOpen(true)}
        >
          <Settings className="size-4" />
        </Button>
        <ModeToggle />
      </div>

      <Drawer
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        direction="right"
      >
        <DrawerContent className="h-full w-full sm:max-w-2xl">
          <DrawerHeader>
            <DrawerTitle>Cài đặt API Keys</DrawerTitle>
            <DrawerDescription>
              Quản lý các Gemini API key dùng để tạo quiz.
            </DrawerDescription>
          </DrawerHeader>
          <div className="flex-1 overflow-hidden">
            <SettingsContent />
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}
