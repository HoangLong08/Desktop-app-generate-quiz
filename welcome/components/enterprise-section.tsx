import {
  Building2,
  Shield,
  Users,
  Headphones,
  Globe,
  Lock,
  BarChart3,
  Workflow,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const enterpriseFeatures = [
  {
    icon: Shield,
    title: "Data Privacy",
    description:
      "All documents stay on your infrastructure. No data leaves your environment.",
  },
  {
    icon: Users,
    title: "Team Collaboration",
    description:
      "Multiple BAs can work on the same project with shared conversations and documents.",
  },
  {
    icon: Headphones,
    title: "Dedicated Support",
    description:
      "Priority support with onboarding assistance for your BA team.",
  },
  {
    icon: Globe,
    title: "Multi-project Management",
    description:
      "Manage unlimited projects with isolated document stores and analysis outputs.",
  },
  {
    icon: Lock,
    title: "BABOK & GDPR Ready",
    description:
      "Built-in compliance checks for BABOK standards and GDPR-aware data handling.",
  },
  {
    icon: BarChart3,
    title: "Analysis Reports",
    description:
      "Export structured analysis reports with traceability matrices and compliance scores.",
  },
  {
    icon: Workflow,
    title: "Custom Agent Workflows",
    description:
      "Configure agent pipelines and analysis workflows for your team's needs.",
  },
  {
    icon: Building2,
    title: "Self-hosted Option",
    description:
      "Deploy BA Workspace on your own infrastructure for maximum control.",
  },
];

const logos = [
  "FPT Software",
  "Viettel",
  "VNG",
  "Rikkeisoft",
  "KMS Technology",
  "TMA Solutions",
];

export function EnterpriseSection() {
  return (
    <section
      id="enterprise"
      className="py-24 border-t border-border/40 sm:py-24"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <div className="flex items-center justify-center gap-2 text-sm text-accent">
            <Building2 className="h-4 w-4" />
            <span className="font-mono uppercase tracking-wider">
              Enterprise
            </span>
          </div>
          <h2 className="mt-4 font-mono text-3xl font-bold tracking-tight sm:text-4xl">
            Built for enterprise BA teams
          </h2>
          <p className="mt-4 text-muted-foreground">
            Trusted by BA teams at leading technology companies. Get
            enterprise-grade features, privacy, and support for your
            organization.
          </p>
        </div>

        {/* Trusted by logos */}
        <div className="mx-auto mt-12 max-w-3xl">
          <p className="text-center text-sm text-muted-foreground mb-6">
            Trusted by industry leaders
          </p>
          <div className="flex flex-wrap items-center justify-center gap-8">
            {logos.map((logo, index) => (
              <div
                key={index}
                className="font-mono text-lg font-semibold text-muted-foreground/60"
              >
                {logo}
              </div>
            ))}
          </div>
        </div>

        <div className="mx-auto mt-16 grid max-w-5xl gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {enterpriseFeatures.map((feature, index) => (
            <div
              key={index}
              className="rounded-xl border border-border/60 bg-[#141414] p-6 transition-all duration-300 scale-100 hover:scale-105 hover:border-accent/40"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 text-accent">
                <feature.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-mono text-sm font-semibold">
                {feature.title}
              </h3>
              <p className="mt-2 text-xs text-muted-foreground">
                {feature.description}
              </p>
            </div>
          ))}
        </div>

        <div className="mx-auto mt-16 max-w-2xl rounded-2xl border border-accent/40 bg-gradient-to-b from-accent/10 to-transparent p-8 text-center sm:p-12">
          <h3 className="font-mono text-xl font-bold">
            Ready to empower your BA team?
          </h3>
          <p className="mt-4 text-muted-foreground">
            Talk to our team to learn how BA Workspace can streamline your
            enterprise requirements management.
          </p>
          <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:justify-center">
            <Button size="lg">Contact Us</Button>
            <Button size="lg" variant="outline">
              Book a Demo
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
