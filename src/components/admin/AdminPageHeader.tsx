import type { LucideIcon } from "lucide-react";

export function AdminPageHeader({
  icon: Icon,
  eyebrow,
  title,
  description,
  actions,
}: {
  icon: LucideIcon;
  eyebrow: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground sm:h-12 sm:w-12">
          <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
        </div>
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-primary sm:text-xs">
            {eyebrow}
          </p>
          <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">
            {title}
          </h1>
          {description && (
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          )}
        </div>
      </div>
      {actions && (
        <div className="flex flex-wrap gap-2 sm:shrink-0 [&>*]:flex-1 sm:[&>*]:flex-initial">
          {actions}
        </div>
      )}
    </div>
  );
}

export function AdminPlaceholder({ note }: { note: string }) {
  return (
    <div className="rounded-3xl border border-dashed border-border/60 bg-card/40 p-10 text-center">
      <p className="font-display text-lg font-semibold">Em construção</p>
      <p className="mt-2 text-sm text-muted-foreground">{note}</p>
    </div>
  );
}
