"use client";

import type React from "react";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  const handleSmoothScroll = (
    e: React.MouseEvent<HTMLAnchorElement>,
    href: string,
  ) => {
    e.preventDefault();
    const targetId = href.replace("#", "");
    const element = document.getElementById(targetId);
    if (element) {
      element.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
    setIsOpen(false);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-foreground">
              <span className="text-sm font-bold text-background">BA</span>
            </div>
            <span className="text-lg font-semibold tracking-tight font-mono">
              BA Workspace
            </span>
          </Link>
          <nav className="hidden items-center gap-6 md:flex">
            <a
              href="#features"
              onClick={(e) => handleSmoothScroll(e, "#features")}
              className="text-sm text-muted-foreground transition-colors hover:text-foreground cursor-pointer"
            >
              Features
            </a>
            <a
              href="#ai-agents"
              onClick={(e) => handleSmoothScroll(e, "#ai-agents")}
              className="text-sm text-muted-foreground transition-colors hover:text-foreground cursor-pointer"
            >
              AI Agents
            </a>
            <a
              href="#how-it-works"
              onClick={(e) => handleSmoothScroll(e, "#how-it-works")}
              className="text-sm text-muted-foreground transition-colors hover:text-foreground cursor-pointer"
            >
              How It Works
            </a>
            <a
              href="#resources"
              onClick={(e) => handleSmoothScroll(e, "#resources")}
              className="text-sm text-muted-foreground transition-colors hover:text-foreground cursor-pointer"
            >
              Resources
            </a>
            <a
              href="#enterprise"
              onClick={(e) => handleSmoothScroll(e, "#enterprise")}
              className="text-sm text-muted-foreground transition-colors hover:text-foreground cursor-pointer"
            >
              Enterprise
            </a>
          </nav>
        </div>
        <div className="hidden items-center gap-4 md:flex">
          {/* <Button variant="ghost" size="sm">
            Sign in
          </Button> */}
          <Button size="sm">Get Started</Button>
        </div>
        <button
          className="md:hidden"
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Toggle menu"
        >
          {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>
      {isOpen && (
        <div className="border-t border-border/40 bg-background md:hidden">
          <nav className="flex flex-col gap-4 px-4 py-6">
            <a
              href="#features"
              onClick={(e) => handleSmoothScroll(e, "#features")}
              className="text-sm text-muted-foreground cursor-pointer"
            >
              Features
            </a>
            <a
              href="#ai-agents"
              onClick={(e) => handleSmoothScroll(e, "#ai-agents")}
              className="text-sm text-muted-foreground cursor-pointer"
            >
              AI Agents
            </a>
            <a
              href="#how-it-works"
              onClick={(e) => handleSmoothScroll(e, "#how-it-works")}
              className="text-sm text-muted-foreground cursor-pointer"
            >
              How It Works
            </a>
            <a
              href="#resources"
              onClick={(e) => handleSmoothScroll(e, "#resources")}
              className="text-sm text-muted-foreground cursor-pointer"
            >
              Resources
            </a>
            <a
              href="#enterprise"
              onClick={(e) => handleSmoothScroll(e, "#enterprise")}
              className="text-sm text-muted-foreground cursor-pointer"
            >
              Enterprise
            </a>
            <div className="flex flex-col gap-2 pt-4">
              {/* <Button variant="ghost" size="sm">
                Sign in
              </Button> */}
              <Button size="sm">Get Started</Button>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
