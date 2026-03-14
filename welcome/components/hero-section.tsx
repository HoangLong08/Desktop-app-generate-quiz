"use client";

import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  FileText,
  CheckCircle2,
  Zap,
  TrendingUp,
  Users,
  Brain,
  Globe,
  Clock,
  Activity,
  Search,
  Shield,
  Link2,
} from "lucide-react";

export function HeroSection() {
  const [codeLineIndex, setCodeLineIndex] = useState(0);
  const [displayedText1, setDisplayedText1] = useState("");
  const [displayedText2, setDisplayedText2] = useState("");
  const [isTypingDone, setIsTypingDone] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const text1 = "Analyze smarter.";
  const text2 = "Trace everything.";

  const codeLines = [
    "# Alex — Senior Business Analyst (Orchestrator)",
    "agent:",
    "  metadata:",
    "    name: Alex",
    "    title: Senior Business Analyst",
    '    icon: "\ud83c\udfaf"',
    "",
    "  persona:",
    "    role: Main coordinator and decision maker",
    "    identity: 10+ years BA experience",
    "",
    "# Emma — Requirements Agent",
    "agent:",
    "  metadata:",
    "    name: Emma",
    "    title: Requirements Agent",
    '    icon: "\ud83d\udccb"',
    "",
    "  persona:",
    "    role: Requirements Analysis Specialist",
    "    principles:",
    "      - Check consistency and clarity",
    "      - Flag duplicates and conflicts",
    "",
    "# Sarah — Stakeholder Agent",
    "agent:",
    "  metadata:",
    "    name: Sarah",
    "    title: Stakeholder Agent",
    '    icon: "\ud83d\udc65"',
  ];

  useEffect(() => {
    let currentIndex = 0;
    const fullText = text1 + "|" + text2; // Use | as separator

    const typeInterval = setInterval(() => {
      if (currentIndex <= fullText.length) {
        const currentChar = fullText.substring(0, currentIndex);
        const parts = currentChar.split("|");
        setDisplayedText1(parts[0] || "");
        setDisplayedText2(parts[1] || "");
        currentIndex++;
      } else {
        clearInterval(typeInterval);
        setIsTypingDone(true);
      }
    }, 80);

    return () => clearInterval(typeInterval);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCodeLineIndex((prev) => (prev + 1) % codeLines.length);
    }, 800);
    return () => clearInterval(interval);
  }, [codeLines.length]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    interface GridDot {
      x: number;
      y: number;
      direction: "horizontal" | "vertical";
      speed: number;
      size: number;
      opacity: number;
      color: string;
      targetX: number;
      targetY: number;
      trail: { x: number; y: number }[];
    }

    const colors = ["rgba(255, 255, 255, 0.5)"]; // Changed colors array to white with 0.5 opacity
    const gridSize = 64; // 4rem = 64px to match the grid background
    const dotCount = 30; // Increased dot count from 12 to 30

    const snapToGrid = (value: number) =>
      Math.round(value / gridSize) * gridSize;

    const gridDots: GridDot[] = [];

    for (let i = 0; i < dotCount; i++) {
      const isHorizontal = Math.random() > 0.5;
      const x = snapToGrid(Math.random() * canvas.offsetWidth);
      const y = snapToGrid(Math.random() * canvas.offsetHeight);

      gridDots.push({
        x,
        y,
        direction: isHorizontal ? "horizontal" : "vertical",
        speed: Math.random() * 9 + 7.5,
        size: Math.random() * 2 + 2,
        opacity: Math.random() * 0.5 + 0.3,
        color: colors[Math.floor(Math.random() * colors.length)],
        targetX: x,
        targetY: y,
        trail: [],
      });
    }

    let animationId: number;
    let lastTime = 0;
    const frameInterval = 1000 / 30;

    const animate = (currentTime: number) => {
      animationId = requestAnimationFrame(animate);

      const deltaTime = currentTime - lastTime;
      if (deltaTime < frameInterval) return;
      lastTime = currentTime - (deltaTime % frameInterval);

      ctx.clearRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);

      gridDots.forEach((dot) => {
        dot.trail.unshift({ x: dot.x, y: dot.y });
        if (dot.trail.length > 10) dot.trail.pop();

        if (dot.direction === "horizontal") {
          if (Math.abs(dot.x - dot.targetX) < dot.speed) {
            dot.x = dot.targetX;
            if (Math.random() > 0.7) {
              dot.direction = "vertical";
              const steps = Math.floor(Math.random() * 5) + 1;
              dot.targetY =
                dot.y + (Math.random() > 0.5 ? 1 : -1) * steps * gridSize;
            } else {
              const steps = Math.floor(Math.random() * 8) + 2;
              dot.targetX =
                dot.x + (Math.random() > 0.5 ? 1 : -1) * steps * gridSize;
            }
          } else {
            dot.x += dot.x < dot.targetX ? dot.speed : -dot.speed;
          }
        } else {
          if (Math.abs(dot.y - dot.targetY) < dot.speed) {
            dot.y = dot.targetY;
            if (Math.random() > 0.7) {
              dot.direction = "horizontal";
              const steps = Math.floor(Math.random() * 8) + 2;
              dot.targetX =
                dot.x + (Math.random() > 0.5 ? 1 : -1) * steps * gridSize;
            } else {
              const steps = Math.floor(Math.random() * 5) + 1;
              dot.targetY =
                dot.y + (Math.random() > 0.5 ? 1 : -1) * steps * gridSize;
            }
          } else {
            dot.y += dot.y < dot.targetY ? dot.speed : -dot.speed;
          }
        }

        if (dot.x < -gridSize) {
          dot.x = canvas.offsetWidth + gridSize;
          dot.targetX = dot.x;
          dot.trail = [];
        }
        if (dot.x > canvas.offsetWidth + gridSize) {
          dot.x = -gridSize;
          dot.targetX = dot.x;
          dot.trail = [];
        }
        if (dot.y < -gridSize) {
          dot.y = canvas.offsetHeight + gridSize;
          dot.targetY = dot.y;
          dot.trail = [];
        }
        if (dot.y > canvas.offsetHeight + gridSize) {
          dot.y = -gridSize;
          dot.targetY = dot.y;
          dot.trail = [];
        }

        if (dot.trail.length > 1) {
          ctx.beginPath();
          ctx.moveTo(dot.x, dot.y);
          for (let i = 0; i < dot.trail.length; i++) {
            ctx.lineTo(dot.trail[i].x, dot.trail[i].y);
          }
          ctx.strokeStyle = dot.color;
          ctx.globalAlpha = dot.opacity * 0.4;
          ctx.lineWidth = dot.size;
          ctx.lineCap = "round";
          ctx.stroke();
        }

        ctx.beginPath();
        ctx.arc(dot.x, dot.y, dot.size * 4, 0, Math.PI * 2);
        ctx.fillStyle = dot.color;
        ctx.globalAlpha = dot.opacity * 0.15;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(dot.x, dot.y, dot.size, 0, Math.PI * 2);
        ctx.fillStyle = dot.color;
        ctx.globalAlpha = dot.opacity;
        ctx.fill();
      });

      ctx.globalAlpha = 1;
    };

    animationId = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      cancelAnimationFrame(animationId);
    };
  }, []);

  const chartData = [
    { label: "Requirements", value: 45, color: "#10b981" },
    { label: "Stakeholders", value: 30, color: "#3b82f6" },
    { label: "Compliance", value: 25, color: "#a855f7" },
  ];

  const total = chartData.reduce((sum, item) => sum + item.value, 0);
  let cumulativePercent = 0;

  return (
    <section className="relative overflow-hidden pt-20 pb-10 sm:pt-28 sm:pb-16 lg:pt-36">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1a1a1a_1px,transparent_1px),linear-gradient(to_bottom,#1a1a1a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_110%)]" />

      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none [mask-image:radial-gradient(ellipse_80%_60%_at_50%_20%,#000_40%,transparent_100%)]"
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border/60 bg-secondary/50 px-4 py-1.5 text-sm text-muted-foreground">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
            </span>
            Now in early access — Powered by Gemini AI
          </div>

          <h1 className="font-mono text-4xl font-bold tracking-tight sm:text-6xl lg:text-7xl relative">
            <span className="invisible" aria-hidden="true">
              <span className="text-balance">Analyze smarter.</span>
              <br />
              <span className="text-balance">Trace everything.</span>
            </span>

            <span className="absolute inset-0 flex flex-col items-center">
              <span className="text-balance bg-gradient-to-r from-[#FFEFBA] to-[#FFFFFF] bg-clip-text text-transparent">
                {displayedText1}
                {displayedText2 === "" && (
                  <span className="inline-block w-[3px] h-[0.9em] bg-accent ml-1 animate-pulse" />
                )}
              </span>
              <span className="text-balance bg-gradient-to-r from-[#E44D26] to-[#F16529] bg-clip-text text-transparent">
                {displayedText2}
                {displayedText2 !== "" && (
                  <span
                    className={`inline-block w-[3px] h-[0.9em] bg-accent ml-1 ${
                      isTypingDone ? "animate-blink" : "animate-pulse"
                    }`}
                  />
                )}
              </span>
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground sm:text-xl lg:text-2xl">
            An AI-powered workspace that transforms scattered requirements,
            interviews, and stakeholder conversations into a traceable,
            structured knowledge graph.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button size="lg" className="w-full sm:w-auto">
              Get started
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="w-full sm:w-auto bg-transparent"
            >
              View documentation
            </Button>
          </div>
        </div>

        <div className="mt-20 relative">
          <div className="absolute -inset-4 bg-gradient-to-r from-accent/20 via-accent/10 to-accent/20 blur-3xl opacity-50" />

          <div className="relative overflow-x-auto pb-4 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:mx-0 lg:px-0">
            <div className="relative rounded-xl border border-border/60 bg-[#141414] backdrop-blur-sm overflow-hidden shadow-2xl min-w-[900px] lg:min-w-0">
              <div className="flex items-center justify-between border-b border-border/60 px-4 py-3 bg-[#1a1a1a]">
                <div className="flex items-center gap-3">
                  <div className="flex gap-1.5">
                    <div className="h-3 w-3 rounded-full bg-red-500/80" />
                    <div className="h-3 w-3 rounded-full bg-yellow-500/80" />
                    <div className="h-3 w-3 rounded-full bg-green-500/80" />
                  </div>
                  <span className="text-xs text-muted-foreground font-mono">
                    ba workspace — analysis dashboard
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Globe className="h-3 w-3" />
                    <span>Project: CRM v2</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>5 agents active</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-accent animate-pulse" />
                    <span className="text-xs text-accent">Live</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4 p-4 border-b border-border/60 bg-[#181818]">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-[#1c1c1c] border border-border/40">
                  <div className="p-2 rounded-lg bg-green-500/10">
                    <Activity className="h-4 w-4 text-green-400" />
                  </div>
                  <div>
                    <span className="text-lg font-mono font-bold">24</span>
                    <p className="text-[10px] text-muted-foreground">
                      Requirements
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-[#1c1c1c] border border-border/40">
                  <div className="p-2 rounded-lg bg-blue-500/10">
                    <Users className="h-4 w-4 text-blue-400" />
                  </div>
                  <div>
                    <span className="text-lg font-mono font-bold">6</span>
                    <p className="text-[10px] text-muted-foreground">
                      Stakeholders
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-[#1c1c1c] border border-border/40">
                  <div className="p-2 rounded-lg bg-purple-500/10">
                    <Shield className="h-4 w-4 text-purple-400" />
                  </div>
                  <div>
                    <span className="text-lg font-mono font-bold">87%</span>
                    <p className="text-[10px] text-muted-foreground">
                      BABOK Score
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-[#1c1c1c] border border-border/40">
                  <div className="p-2 rounded-lg bg-accent/10">
                    <Link2 className="h-4 w-4 text-accent" />
                  </div>
                  <div>
                    <span className="text-lg font-mono font-bold">3</span>
                    <p className="text-[10px] text-muted-foreground">
                      Missing Links
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-4 divide-x divide-border/60 min-h-[420px]">
                <div className="p-5">
                  <h3 className="text-sm font-medium text-muted-foreground mb-4">
                    Recent Analyses
                  </h3>
                  <div className="space-y-2">
                    {[
                      {
                        doc: "requirements-v2.pdf",
                        status: "success",
                        time: "2m ago",
                        agent: "Alex",
                        pages: "12 pages",
                      },
                      {
                        doc: "stakeholder-notes.docx",
                        status: "success",
                        time: "15m ago",
                        agent: "Sarah",
                        pages: "8 pages",
                      },
                      {
                        doc: "compliance-review.pdf",
                        status: "building",
                        time: "Just now",
                        agent: "David",
                        pages: "6 pages",
                      },
                      {
                        doc: "user-stories.txt",
                        status: "success",
                        time: "1h ago",
                        agent: "Emma",
                        pages: "4 pages",
                      },
                      {
                        doc: "rtm-matrix.xlsx",
                        status: "success",
                        time: "2h ago",
                        agent: "Paul",
                        pages: "3 pages",
                      },
                      {
                        doc: "interview-notes.docx",
                        status: "success",
                        time: "3h ago",
                        agent: "Alex",
                        pages: "10 pages",
                      },
                    ].map((analysis, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between p-2.5 rounded-lg bg-[#1c1c1c] border border-border/40"
                      >
                        <div className="flex items-center gap-2">
                          {analysis.status === "success" ? (
                            <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                          ) : (
                            <div className="h-3.5 w-3.5 rounded-full border-2 border-accent border-t-transparent animate-spin" />
                          )}
                          <div>
                            <div className="flex items-center gap-1.5">
                              <FileText className="h-3 w-3 text-muted-foreground" />
                              <span className="text-xs font-mono">
                                {analysis.doc}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-muted-foreground">
                                {analysis.agent}
                              </span>
                              <span className="text-[10px] text-muted-foreground/60 font-mono">
                                {analysis.pages}
                              </span>
                            </div>
                          </div>
                        </div>
                        <span className="text-[10px] text-muted-foreground">
                          {analysis.time}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-5">
                  <h3 className="text-sm font-medium text-muted-foreground mb-4">
                    Agent Coverage
                  </h3>
                  <div className="flex flex-col items-center">
                    <div className="relative w-36 h-36">
                      <svg
                        viewBox="0 0 100 100"
                        className="w-full h-full -rotate-90"
                      >
                        {chartData.map((item, index) => {
                          const percent = (item.value / total) * 100;
                          const dashArray = `${percent * 2.51327} ${251.327 - percent * 2.51327}`;
                          const dashOffset = -cumulativePercent * 2.51327;
                          cumulativePercent += percent;
                          return (
                            <circle
                              key={index}
                              cx="50"
                              cy="50"
                              r="40"
                              fill="none"
                              stroke={item.color}
                              strokeWidth="12"
                              strokeDasharray={dashArray}
                              strokeDashoffset={dashOffset}
                              className="transition-all duration-1000"
                            />
                          );
                        })}
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-2xl font-mono font-bold">48</span>
                        <span className="text-[10px] text-muted-foreground">
                          findings
                        </span>
                      </div>
                    </div>
                    <div className="mt-4 flex flex-wrap justify-center gap-3">
                      {chartData.map((item, index) => (
                        <div key={index} className="flex items-center gap-1.5">
                          <div
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: item.color }}
                          />
                          <span className="text-[10px] text-muted-foreground">
                            {item.label}
                          </span>
                          <span className="text-[10px] font-mono text-foreground">
                            {item.value}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="mt-6 space-y-3">
                    <h4 className="text-xs font-medium text-muted-foreground">
                      Analysis Progress
                    </h4>
                    {[
                      {
                        label: "Requirements",
                        value: 92,
                        color: "bg-green-500",
                      },
                      {
                        label: "Stakeholders",
                        value: 78,
                        color: "bg-blue-500",
                      },
                      {
                        label: "Compliance",
                        value: 65,
                        color: "bg-purple-500",
                      },
                    ].map((item, i) => (
                      <div key={i} className="space-y-1">
                        <div className="flex justify-between text-[10px]">
                          <span className="text-muted-foreground">
                            {item.label}
                          </span>
                          <span className="font-mono">{item.value}%</span>
                        </div>
                        <div className="h-1.5 bg-[#1c1c1c] rounded-full overflow-hidden">
                          <div
                            className={`h-full ${item.color} rounded-full transition-all duration-1000`}
                            style={{ width: `${item.value}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-5">
                  <h3 className="text-sm font-medium text-muted-foreground mb-4">
                    Document Insights
                  </h3>
                  <div className="space-y-3">
                    <div className="p-3 rounded-lg bg-[#1c1c1c] border border-border/40">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-blue-400" />
                          <span className="text-xs text-muted-foreground">
                            Documents
                          </span>
                        </div>
                        <span className="text-xs text-green-400 flex items-center gap-1">
                          <TrendingUp className="h-3 w-3" />
                          +3 new
                        </span>
                      </div>
                      <span className="text-xl font-mono font-bold">14</span>
                    </div>
                    <div className="p-3 rounded-lg bg-[#1c1c1c] border border-border/40">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Search className="h-4 w-4 text-purple-400" />
                          <span className="text-xs text-muted-foreground">
                            Issues Found
                          </span>
                        </div>
                        <span className="text-xs text-yellow-400 flex items-center gap-1">
                          7 open
                        </span>
                      </div>
                      <span className="text-xl font-mono font-bold">23</span>
                    </div>
                    <div className="p-3 rounded-lg bg-[#1c1c1c] border border-border/40">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Zap className="h-4 w-4 text-accent" />
                          <span className="text-xs text-muted-foreground">
                            AI Conversations
                          </span>
                        </div>
                        <span className="text-xs text-green-400 flex items-center gap-1">
                          <TrendingUp className="h-3 w-3" />
                          +12%
                        </span>
                      </div>
                      <span className="text-xl font-mono font-bold">156</span>
                    </div>
                    <div className="p-3 rounded-lg bg-[#1c1c1c] border border-border/40">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-cyan-400" />
                          <span className="text-xs text-muted-foreground">
                            Stakeholders Mapped
                          </span>
                        </div>
                      </div>
                      <span className="text-xl font-mono font-bold">18</span>
                    </div>
                    <div className="p-3 rounded-lg bg-[#1c1c1c] border border-border/40">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Brain className="h-4 w-4 text-orange-400" />
                          <span className="text-xs text-muted-foreground">
                            SMART Score
                          </span>
                        </div>
                      </div>
                      <span className="text-xl font-mono font-bold">91%</span>
                    </div>
                  </div>
                </div>

                <div className="p-5">
                  <h3 className="text-sm font-medium text-muted-foreground mb-4">
                    Agent Configuration
                  </h3>
                  <div className="rounded-lg bg-[#0d0d0d] border border-border/40 p-3 font-mono text-[11px] h-[340px] overflow-hidden">
                    <div
                      className="transition-transform duration-300 ease-out"
                      style={{
                        transform: `translateY(-${codeLineIndex * 22}px)`,
                      }}
                    >
                      {[...codeLines, ...codeLines].map((line, i) => (
                        <div
                          key={i}
                          className={`h-[22px] leading-[22px] ${
                            line.startsWith("#")
                              ? "text-green-400 italic"
                              : line.startsWith("agent:")
                                ? "text-blue-400"
                                : line.includes("name:")
                                  ? "text-accent"
                                  : line.includes("title:")
                                    ? "text-pink-400"
                                    : line.includes("icon:")
                                      ? "text-yellow-400"
                                      : line.includes("role:") ||
                                          line.includes("identity:")
                                        ? "text-purple-400"
                                        : line.startsWith("    -")
                                          ? "text-cyan-400"
                                          : "text-muted-foreground"
                          }`}
                        >
                          {line || " "}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:hidden flex justify-center mt-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>Scroll to explore</span>
              <ArrowRight className="h-3 w-3 animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
