export function BentoCell({
  children,
  className = "",
  glowColor,
}: {
  children: React.ReactNode;
  className?: string;
  glowColor?: string;
}) {
  return (
    <div
      className={`group/bento relative overflow-hidden rounded-2xl border border-border/60 bg-card p-5 transition-all duration-300 hover:border-border hover:shadow-lg hover:shadow-primary/5 ${className}`}
    >
      {/* Dot grid pattern */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03] dark:opacity-[0.06]"
        style={{
          backgroundImage:
            "radial-gradient(circle, currentColor 1px, transparent 1px)",
          backgroundSize: "16px 16px",
        }}
      />
      {/* Corner gradient glow */}
      {glowColor && (
        <div
          className="pointer-events-none absolute -right-10 -top-10 size-32 rounded-full opacity-20 blur-3xl transition-opacity duration-500 group-hover/bento:opacity-35"
          style={{ background: glowColor }}
        />
      )}
      <div className="relative z-10">{children}</div>
    </div>
  );
}

export function CellHeader({
  icon: Icon,
  title,
  sub,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  sub?: string;
}) {
  return (
    <div className="flex items-center gap-2 mb-4 transition-transform duration-300 group-hover/bento:translate-x-1">
      <Icon className="size-4 text-muted-foreground" />
      <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {title}
      </span>
      {sub && (
        <span className="ml-auto text-[10px] text-muted-foreground">{sub}</span>
      )}
    </div>
  );
}
