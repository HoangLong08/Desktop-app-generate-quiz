"use client";

import { useState, useEffect } from "react";
import { Workflow } from "lucide-react";

const codeExamples = {
  upload: `$ Upload: requirements-v2.pdf

✓ Format validated (PDF, 2.1 MB)
✓ Parsed 8 pages, 2,340 words
✓ RAG pipeline: summary + keywords extracted
✓ Assigned agent: Alex (Senior BA)`,

  requirements: `// Emma — Requirements Agent

✓ Found 24 requirements
✓ 3 duplicates detected (REQ-07, REQ-12, REQ-19)
✗ 2 missing acceptance criteria
✓ SMART validation: 91% pass rate

Recommendation: Review REQ-07 and REQ-19`,

  stakeholder: `// Sarah — Stakeholder Agent

✓ Identified 6 stakeholders
✓ Mapped 24 requirements → stakeholders
✗ 3 requirements have no stakeholder owner
✓ Influence/Interest matrix generated

Gap: Product Owner not linked to REQ-15`,

  compliance: `// David — Compliance Agent

✓ BABOK compliance score: 87%
✓ Documentation structure: valid
✗ Missing: Business Case artifact
✗ Missing: Impact Analysis section

Action: Add Business Case to section 3`,
};

const features = [
  { key: "upload", label: "Document upload & RAG" },
  { key: "requirements", label: "Requirements validation" },
  { key: "stakeholder", label: "Stakeholder mapping" },
  { key: "compliance", label: "BABOK compliance check" },
] as const;

export function CodeSection() {
  const [activeFeature, setActiveFeature] =
    useState<keyof typeof codeExamples>("upload");
  const [displayedText, setDisplayedText] = useState("");
  const [isTyping, setIsTyping] = useState(true);

  useEffect(() => {
    const fullText = codeExamples[activeFeature];
    setDisplayedText("");
    setIsTyping(true);

    let currentIndex = 0;
    const typingSpeed = 8; // milliseconds per character

    const typeInterval = setInterval(() => {
      if (currentIndex < fullText.length) {
        setDisplayedText(fullText.slice(0, currentIndex + 1));
        currentIndex++;
      } else {
        clearInterval(typeInterval);
        setIsTyping(false);
      }
    }, typingSpeed);

    return () => clearInterval(typeInterval);
  }, [activeFeature]);

  return (
    <section id="how-it-works" className="py-24 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl lg:text-center">
          <div className="flex items-center justify-center gap-2">
            <Workflow className="h-4 w-4 text-accent" />
            <p className="text-sm font-medium uppercase tracking-wider text-accent">
              How It Works
            </p>
          </div>
          <h2 className="mt-2 font-mono text-3xl font-bold tracking-tight sm:text-4xl text-balance">
            From document upload to actionable insights
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            BA Workspace processes your documents through a RAG pipeline,
            activates specialized AI agents, and delivers structured analysis
            with traceability.
          </p>
        </div>

        <div className="mx-auto mt-16 max-w-4xl">
          <div className="flex flex-col-reverse md:flex-row md:gap-8">
            {/* Menu buttons - left side on tablet+ */}
            <div className="mt-8 md:mt-0 md:w-48 flex flex-col gap-3">
              {features.map((feature) => (
                <button
                  key={feature.key}
                  onClick={() => setActiveFeature(feature.key)}
                  className={`rounded-xl border px-4 py-3 text-left text-sm transition-all duration-200 ${
                    activeFeature === feature.key
                      ? "border-accent bg-accent/10 text-accent"
                      : "border-border/60 bg-card/50 text-muted-foreground hover:border-accent/50 hover:text-foreground"
                  }`}
                >
                  {feature.label}
                </button>
              ))}
            </div>

            {/* Terminal - right side on tablet+ */}
            <div
              className="flex-1 overflow-hidden rounded-2xl border border-border/60"
              style={{ backgroundColor: "#141414" }}
            >
              <div
                className="flex h-10 items-center gap-2 border-b border-border/60 px-4"
                style={{ backgroundColor: "#1a1a1a" }}
              >
                <div className="h-3 w-3 rounded-full bg-red-500/80" />
                <div className="h-3 w-3 rounded-full bg-yellow-500/80" />
                <div className="h-3 w-3 rounded-full bg-green-500/80" />
                <span className="ml-2 text-xs text-muted-foreground">
                  terminal
                </span>
              </div>
              <pre
                className="overflow-x-auto overflow-y-auto p-6 h-[200px]"
                style={{ backgroundColor: "#0d0d0d" }}
              >
                <code className="font-mono text-sm text-muted-foreground">
                  {displayedText.split("\n").map((line, i) => (
                    <span key={i} className="block">
                      {line.startsWith("//") ? (
                        <span className="text-muted-foreground/60">{line}</span>
                      ) : line.startsWith("$") ? (
                        <span className="text-accent">{line}</span>
                      ) : line.startsWith("✓") ? (
                        <span className="text-green-400">{line}</span>
                      ) : line.includes(":") && !line.includes("//") ? (
                        <span className="text-foreground">{line}</span>
                      ) : (
                        <span className="text-foreground/80">{line}</span>
                      )}
                    </span>
                  ))}
                  {isTyping && (
                    <span className="inline-block w-2 h-4 bg-accent animate-pulse ml-0.5 align-middle" />
                  )}
                </code>
              </pre>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
