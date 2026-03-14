import {
  Book,
  Code2,
  FileText,
  Brain,
  Zap,
  Users,
  Layers,
  Shield,
} from "lucide-react";
import Link from "next/link";

const docCategories = [
  {
    icon: Zap,
    title: "Getting Started",
    description:
      "Set up your workspace and run your first document analysis in minutes",
    links: ["Installation", "Quick Start", "First Analysis"],
  },
  {
    icon: Brain,
    title: "AI Agents Guide",
    description: "Learn how Alex, Emma, Sarah, David, and Paul work together",
    links: [
      "Alex (Orchestrator)",
      "Emma (Requirements)",
      "Sarah (Stakeholder)",
    ],
  },
  {
    icon: FileText,
    title: "Document Upload",
    description:
      "Supported formats, RAG pipeline, and document processing flow",
    links: ["Upload Flow", "RAG Pipeline", "Supported Formats"],
  },
  {
    icon: Users,
    title: "Stakeholder Analysis",
    description:
      "Map stakeholders, track influence/interest, and identify gaps",
    links: ["Stakeholder Mapping", "Gap Analysis", "RTM"],
  },
  {
    icon: Layers,
    title: "API Reference",
    description:
      "REST API for projects, documents, conversations, and messages",
    links: ["Projects API", "Documents API", "Conversations API"],
  },
  {
    icon: Shield,
    title: "BABOK Compliance",
    description: "Validate your BA artifacts against BABOK standards",
    links: ["Compliance Rules", "Scoring", "Best Practices"],
  },
];

export function DocsSection() {
  return (
    <section id="resources" className="py-24 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <div className="flex items-center justify-center gap-2 text-sm text-accent">
            <Book className="h-4 w-4" />
            <span className="font-mono uppercase tracking-wider">
              Documentation
            </span>
          </div>
          <h2 className="mt-4 font-mono text-3xl font-bold tracking-tight sm:text-4xl">
            Everything you need to know
          </h2>
          <p className="mt-4 text-muted-foreground">
            Comprehensive documentation to help you get started and master every
            feature of BA Workspace.
          </p>
        </div>

        <div className="mx-auto mt-16 grid max-w-5xl gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {docCategories.map((category, index) => (
            <div
              key={index}
              className="group relative rounded-xl border border-border/60 bg-[#141414] p-6 transition-all duration-300 hover:border-accent/40 hover:bg-[#1a1a1a] scale-100 hover:scale-105"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 text-accent">
                <category.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-mono font-semibold">{category.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {category.description}
              </p>
              <ul className="mt-4 space-y-2">
                {category.links.map((link, linkIndex) => (
                  <li key={linkIndex}>
                    <Link
                      href="#"
                      className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-accent"
                    >
                      <FileText className="h-3 w-3" />
                      {link}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <Link
            href="#"
            className="inline-flex items-center gap-2 font-mono text-sm text-accent hover:underline"
          >
            View full documentation
            <span>→</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
