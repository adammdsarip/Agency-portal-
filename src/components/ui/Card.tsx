import { cn } from "@/lib/utils/cn";

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("rounded-2xl border border-line/70 bg-surface shadow-card", className)} {...props} />;
}

export function CardHeader({
  title,
  action,
  icon: Icon,
}: {
  title: string;
  action?: React.ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="flex items-center justify-between gap-3 px-5 pt-4 pb-2">
      <h2 className="flex items-center gap-2 text-sm font-semibold text-ink">
        {Icon && <Icon className="size-4 text-muted" />}
        {title}
      </h2>
      {action}
    </div>
  );
}

export function Badge({
  children,
  className,
  tone = "neutral",
}: {
  children: React.ReactNode;
  className?: string;
  tone?: "neutral" | "amber" | "blue" | "green" | "violet" | "red";
}) {
  const tones = {
    neutral: "bg-subtle text-muted",
    amber: "bg-amber-50 text-amber-800 ring-amber-200/60",
    blue: "bg-sky-50 text-sky-800 ring-sky-200/60",
    green: "bg-emerald-50 text-emerald-800 ring-emerald-200/60",
    violet: "bg-accent-soft text-accent ring-accent/15",
    red: "bg-danger-soft text-danger ring-danger/15",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap ring-1 ring-transparent ring-inset",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        <h1 className="text-2xl font-semibold tracking-tight text-ink sm:text-[28px]">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted">{description}</p>}
      </div>
      {action}
    </div>
  );
}
