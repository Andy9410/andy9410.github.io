import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export const surfaceCardClassName =
  "rounded-3xl border border-border/60 bg-background/95 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_18px_40px_rgba(15,23,42,0.06)] backdrop-blur transition-all duration-200 hover:border-border hover:shadow-[0_2px_8px_rgba(15,23,42,0.05),0_24px_48px_rgba(15,23,42,0.08)]";

export function StatusBadge({
  children,
  className,
  variant = "outline",
}: {
  children: ReactNode;
  className?: string;
  variant?: "default" | "outline" | "secondary" | "destructive";
}) {
  return (
    <Badge
      variant={variant}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-medium tracking-[0.01em]",
        className
      )}
    >
      {children}
    </Badge>
  );
}

export function SectionHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="space-y-2">
        {eyebrow ? (
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            {eyebrow}
          </p>
        ) : null}
        <div className="space-y-1.5">
          <h2 className="text-[1.35rem] font-semibold tracking-tight text-foreground sm:text-[1.5rem]">
            {title}
          </h2>
          {description ? (
            <p className="max-w-3xl text-sm leading-6 text-muted-foreground sm:text-[15px]">
              {description}
            </p>
          ) : null}
        </div>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

export function KPIStatCard({
  icon: Icon,
  iconTone,
  title,
  value,
  description,
  progress,
  progressLabel,
}: {
  icon: LucideIcon;
  iconTone: string;
  title: string;
  value: string;
  description: string;
  progress?: number;
  progressLabel?: string;
}) {
  return (
    <Card className={surfaceCardClassName}>
      <CardContent className="flex h-full flex-col gap-4 p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              {title}
            </p>
            <p className="text-3xl font-semibold tracking-tight text-foreground sm:text-[2.2rem]">
              {value}
            </p>
          </div>
          <div
            className={cn(
              "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border",
              iconTone
            )}
          >
            <Icon className="h-5 w-5" />
          </div>
        </div>

        <p className="text-sm leading-6 text-muted-foreground">{description}</p>

        {typeof progress === "number" ? (
          <div className="mt-auto space-y-2">
            <div className="h-2 overflow-hidden rounded-full bg-muted/80">
              <div
                className={cn(
                  "h-full rounded-full bg-gradient-to-r transition-all duration-300 ease-out",
                  progress >= 100
                    ? "from-emerald-400/90 via-emerald-400/75 to-emerald-300/80"
                    : "from-cyan-400/90 via-sky-400/75 to-violet-400/70"
                )}
                style={{ width: `${Math.max(6, Math.min(progress, 100))}%` }}
              />
            </div>
            {progressLabel ? (
              <p className="text-xs leading-5 text-muted-foreground">{progressLabel}</p>
            ) : null}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

export function MetricProgress({
  value,
  title,
  state,
  description,
}: {
  value: number;
  title: string;
  state: string;
  description: string;
}) {
  return (
    <div className="rounded-[28px] border border-border/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] p-5 sm:p-6">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            {title}
          </p>
          <div className="flex flex-wrap items-end gap-3">
            <p className="text-5xl font-semibold tracking-tight text-foreground sm:text-6xl">
              {value}%
            </p>
            <p className="pb-1 text-sm font-medium text-muted-foreground">{state}</p>
          </div>
        </div>
        <p className="max-w-md text-sm leading-6 text-muted-foreground">{description}</p>
      </div>

      <div className="mt-5 space-y-3">
        <div className="h-3 overflow-hidden rounded-full bg-muted/80 ring-1 ring-border/60">
          <div
            className="h-full rounded-full bg-[linear-gradient(90deg,rgba(56,189,248,0.95),rgba(99,102,241,0.72),rgba(16,185,129,0.9))] transition-all duration-500 ease-out"
            style={{ width: `${Math.max(8, Math.min(value, 100))}%` }}
          />
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
          <span>{value >= 100 ? "Perfil completamente confiable" : "Evidencia aún en consolidación"}</span>
          <span>{value >= 100 ? "Objetivo cumplido" : `${100 - Math.min(value, 100)}% restante`}</span>
        </div>
      </div>
    </div>
  );
}

export function EvidenceCard({
  icon: Icon,
  iconTone,
  title,
  description,
  badge,
  state,
}: {
  icon: LucideIcon;
  iconTone: string;
  title: string;
  description: string;
  badge: string;
  state: string;
}) {
  return (
    <div className="group rounded-2xl border border-border/60 bg-muted/25 p-4 transition-all duration-200 hover:border-border hover:bg-muted/35">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border", iconTone)}>
            <Icon className="h-4.5 w-4.5" />
          </div>
          <div className="space-y-1.5">
            <p className="text-sm font-medium text-foreground">{title}</p>
            <p className="text-sm leading-6 text-muted-foreground">{description}</p>
          </div>
        </div>
        <StatusBadge className="border-border/80 bg-background/80 text-muted-foreground">
          {badge}
        </StatusBadge>
      </div>
      <div className="mt-4 flex items-center gap-2 text-[13px] text-muted-foreground">
        <span className="inline-flex h-2 w-2 rounded-full bg-emerald-400/80" />
        {state}
      </div>
    </div>
  );
}

export function UniformInfoCard({
  icon: Icon,
  iconTone,
  title,
  description,
  children,
}: {
  icon: LucideIcon;
  iconTone: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <Card className={surfaceCardClassName}>
      <CardHeader className="space-y-4 border-b border-border/60 p-5 sm:p-6">
        <div className="flex items-start gap-4">
          <div className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border", iconTone)}>
            <Icon className="h-5 w-5" />
          </div>
          <div className="space-y-1.5">
            <CardTitle className="text-[1.05rem] font-semibold tracking-tight text-foreground">
              {title}
            </CardTitle>
            <CardDescription className="text-sm leading-6 text-muted-foreground">
              {description}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-5 sm:p-6">{children}</CardContent>
    </Card>
  );
}
