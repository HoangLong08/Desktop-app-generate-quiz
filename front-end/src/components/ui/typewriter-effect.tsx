import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface TypewriterEffectProps {
  words: { text: string; className?: string }[];
  className?: string;
  cursorClassName?: string;
}

export function TypewriterEffect({
  words,
  className,
  cursorClassName,
}: TypewriterEffectProps) {
  const fullText = words.map((w) => w.text).join(" ");
  const [displayedCount, setDisplayedCount] = useState(0);
  const [showCursor, setShowCursor] = useState(true);

  useEffect(() => {
    if (displayedCount < fullText.length) {
      const timeout = setTimeout(() => {
        setDisplayedCount((prev) => prev + 1);
      }, 60);
      return () => clearTimeout(timeout);
    }
  }, [displayedCount, fullText.length]);

  useEffect(() => {
    const interval = setInterval(() => {
      setShowCursor((prev) => !prev);
    }, 500);
    return () => clearInterval(interval);
  }, []);

  // Build character spans with word-level className
  const chars: { char: string; className?: string }[] = [];
  words.forEach((word, wi) => {
    for (const ch of word.text) {
      chars.push({ char: ch, className: word.className });
    }
    if (wi < words.length - 1) {
      chars.push({ char: " " });
    }
  });

  return (
    <span className={cn("inline-flex items-center", className)}>
      <AnimatePresence>
        {chars.slice(0, displayedCount).map((c, i) => (
          <motion.span
            key={i}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.1 }}
            className={c.className}
          >
            {c.char === " " ? "\u00A0" : c.char}
          </motion.span>
        ))}
      </AnimatePresence>
      <motion.span
        animate={{ opacity: showCursor ? 1 : 0 }}
        transition={{ duration: 0.1 }}
        className={cn(
          "inline-block w-[2px] h-[1em] ml-0.5 bg-current rounded-full",
          cursorClassName,
        )}
      />
    </span>
  );
}
