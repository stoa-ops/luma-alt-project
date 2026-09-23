import type { ReactNode } from "react";

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center rounded-xl border border-dashed bg-card/55 px-6 py-12 text-center">
      {icon ? (
        <div className="mb-5 flex size-11 items-center justify-center rounded-full bg-secondary text-primary">
          {icon}
        </div>
      ) : null}
      <h2 className="font-display text-2xl font-medium">{title}</h2>
      <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
        {description}
      </p>
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}
