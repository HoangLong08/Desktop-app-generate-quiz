import Link from "next/link";

const footerLinks = {
  Product: ["Features", "AI Agents", "Enterprise", "Changelog"],
  Resources: ["Documentation", "BABOK Guide", "API Reference", "Community"],
  Company: ["About", "Blog", "Contact"],
  Legal: ["Privacy", "Terms", "Security"],
};

export function Footer() {
  return (
    <footer className="border-t border-border/40 bg-background">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-foreground">
                <span className="text-sm font-bold text-background">BA</span>
              </div>
              <span className="text-lg font-semibold tracking-tight font-mono">
                BA Workspace
              </span>
            </Link>
            <p className="mt-4 max-w-xs text-sm text-muted-foreground">
              An AI-powered workspace for Business Analysts that transforms
              scattered requirements into a traceable knowledge graph.
            </p>
          </div>

          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h3 className="text-sm font-semibold">{title}</h3>
              <ul className="mt-4 space-y-2">
                {links.map((link) => (
                  <li key={link}>
                    <Link
                      href="#"
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 border-t border-border/40 pt-8">
          <p className="text-center text-sm text-muted-foreground">
            © {new Date().getFullYear()} BA Workspace. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
