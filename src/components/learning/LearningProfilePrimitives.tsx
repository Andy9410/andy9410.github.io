import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import {
  ArrowUpRight,
  BadgeCheck,
  Binary,
  BrainCircuit,
  LineChart,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export const surfaceCardClassName =
  "rounded-[28px] border border-slate-200/80 bg-white/95 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_18px_50px_rgba(15,23,42,0.08)] backdrop-blur transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300/80 hover:shadow-[0_2px_8px_rgba(15,23,42,0.05),0_26px_60px_rgba(15,23,42,0.1)] dark:border-slate-800/70 dark:bg-slate-950/90 dark:shadow-[0_1px_2px_rgba(2,6,23,0.4),0_18px_50px_rgba(2,6,23,0.42)]";

export const pageGlowClassName =
  "bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.10),transparent_28%),radial-gradient(circle_at_top_right,rgba(16,185,129,0.08),transparent_22%),linear-gradient(180deg,rgba(248,250,252,0.98),rgba(255,255,255,1))] dark:bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.16),transparent_24%),radial-gradient(circle_at_top_right,rgba(16,185,129,0.12),transparent_20%),linear-gradient(180deg,rgba(2,6,23,1),rgba(2,6,23,0.98))]";

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

export function SectionTitle({
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
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
            {eyebrow}
          </p>
        ) : null}
        <div className="space-y-1.5">
          <h2 className="text-[1.35rem] font-semibold tracking-tight text-slate-950 dark:text-slate-50 sm:text-[1.5rem]">
            {title}
          </h2>
          {description ? (
            <p className="max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-300 sm:text-[15px]">
              {description}
            </p>
          ) : null}
        </div>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

export function LearningHeader({
  title,
  description,
  badges,
  actions,
}: {
  title: string;
  description: string;
  badges: ReactNode;
  actions: ReactNode;
}) {
  return (
    <section className={cn(surfaceCardClassName, pageGlowClassName, "overflow-hidden p-4 sm:p-5 lg:p-6")}>
      <div className="grid gap-4 xl:grid-cols-[1.55fr_0.45fr] xl:items-center">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">{badges}</div>

          <div className="space-y-2">
            <h1 className="max-w-4xl text-[1.85rem] font-semibold tracking-[-0.04em] text-slate-950 dark:text-slate-50 sm:text-[2.2rem] lg:text-[2.5rem]">
              {title}
            </h1>
            <p className="max-w-3xl text-[13px] leading-5 text-slate-600 dark:text-slate-300 sm:text-[14px]">
              {description}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-2 xl:items-end">
          <div className="flex w-full flex-col gap-3 sm:flex-row xl:w-auto">
            {actions}
          </div>

          <div className="hidden w-full gap-2 sm:grid-cols-3 xl:grid xl:max-w-[18rem] xl:grid-cols-1">
            <MiniInsightTile
              icon={BrainCircuit}
              title="Perfil adaptativo"
              detail="Analiza evidencia real para habilitar decisiones con contexto."
              tone="border-indigo-200/80 bg-indigo-500/5 text-indigo-700 dark:border-indigo-500/25 dark:bg-indigo-500/10 dark:text-indigo-200"
            />
            <MiniInsightTile
              icon={ShieldCheck}
              title="Umbral confiable"
              detail="Evita recomendaciones cuando la señal todavía es frágil."
              tone="border-emerald-200/80 bg-emerald-500/5 text-emerald-700 dark:border-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-200"
            />
            <MiniInsightTile
              icon={Binary}
              title="Datos observables"
              detail="Documentos, ejercicios e interacciones medibles."
              tone="border-slate-200/90 bg-white/80 text-slate-700 dark:border-slate-700/80 dark:bg-slate-900/80 dark:text-slate-200"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function MiniInsightTile({
  icon: Icon,
  title,
  detail,
  tone,
}: {
  icon: LucideIcon;
  title: string;
  detail: string;
  tone: string;
}) {
  return (
    <div className={cn("rounded-2xl border p-2.5 transition-all duration-200", tone)}>
      <div className="flex items-start gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-current/15 bg-white/70 dark:bg-slate-950/40">
          <Icon className="h-3.5 w-3.5" />
        </div>
        <div className="space-y-1">
          <p className="text-[13px] font-medium">{title}</p>
          <p className="text-[12px] leading-5 opacity-80">{detail}</p>
        </div>
      </div>
    </div>
  );
}

export function HeroMetric({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white/80 px-4 py-4 dark:border-slate-800/70 dark:bg-slate-950/70">
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
        {label}
      </p>
      <p className="mt-2 text-[1.7rem] font-semibold tracking-tight text-slate-950 dark:text-slate-50">
        {value}
      </p>
      <p className="mt-1 text-[13px] leading-5 text-slate-600 dark:text-slate-300">{detail}</p>
    </div>
  );
}

export function CompactMetricPill({
  icon: Icon,
  iconTone,
  label,
  value,
  status,
}: {
  icon: LucideIcon;
  iconTone: string;
  label: string;
  value: string;
  status: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white/80 px-3.5 py-3 dark:border-slate-800/70 dark:bg-slate-950/70">
      <div className="flex items-center gap-3">
        <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-full border", iconTone)}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
            {label}
          </p>
          <div className="mt-1 flex items-end gap-2">
            <p className="text-xl font-semibold tracking-tight text-slate-950 dark:text-slate-50">{value}</p>
            <span className="pb-0.5 text-[12px] text-slate-500 dark:text-slate-400">{status}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function CompactSummaryCard({
  title,
  status,
  description,
  children,
}: {
  title: string;
  status: ReactNode;
  description: string;
  children: ReactNode;
}) {
  return (
    <Card className={surfaceCardClassName}>
      <CardContent className="space-y-4 p-5 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1.5">
            <p className="text-lg font-semibold tracking-tight text-slate-950 dark:text-slate-50">{title}</p>
            <p className="text-sm text-slate-600 dark:text-slate-300">{description}</p>
          </div>
          <div className="shrink-0">{status}</div>
        </div>
        {children}
      </CardContent>
    </Card>
  );
}

export function ProfileCard({
  title,
  description,
  badges,
  children,
}: {
  title: string;
  description: string;
  badges: ReactNode;
  children: ReactNode;
}) {
  return (
    <Card className={cn(surfaceCardClassName, pageGlowClassName, "overflow-hidden")}>
      <CardHeader className="gap-5 p-6 sm:p-7">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">{badges}</div>
            <div className="space-y-2">
              <CardTitle className="text-[1.9rem] font-semibold tracking-tight text-slate-950 dark:text-slate-50 sm:text-[2.2rem]">
                {title}
              </CardTitle>
              <CardDescription className="max-w-3xl text-[15px] leading-7 text-slate-600 dark:text-slate-300">
                {description}
              </CardDescription>
            </div>
          </div>

          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[22px] border border-indigo-200/80 bg-indigo-500/10 text-indigo-700 shadow-sm dark:border-indigo-500/25 dark:bg-indigo-500/10 dark:text-indigo-200">
            <BrainCircuit className="h-7 w-7" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6 pt-0 sm:p-7 sm:pt-0">{children}</CardContent>
    </Card>
  );
}

export function ProgressCard({
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
    <div className="rounded-[26px] border border-slate-200/80 bg-white/90 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)] dark:border-slate-800/70 dark:bg-slate-950/75 sm:p-6">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div className="space-y-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
            {title}
          </p>
          <div className="flex flex-wrap items-end gap-3">
            <p className="text-5xl font-semibold tracking-[-0.04em] text-slate-950 dark:text-slate-50 sm:text-6xl">
              {value}%
            </p>
            <StatusBadge className="border-emerald-200/80 bg-emerald-500/10 text-emerald-700 dark:border-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-200">
              <BadgeCheck className="h-3.5 w-3.5" />
              {state}
            </StatusBadge>
          </div>
        </div>

        <div className="flex max-w-md items-start gap-3 rounded-2xl border border-slate-200/70 bg-slate-50/90 px-4 py-3 dark:border-slate-800/70 dark:bg-slate-900/80">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-500/10 text-indigo-700 dark:text-indigo-200">
            <LineChart className="h-4.5 w-4.5" />
          </div>
          <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">{description}</p>
        </div>
      </div>

      <div className="mt-6 space-y-3">
        <div className="h-4 overflow-hidden rounded-full bg-slate-100 ring-1 ring-slate-200/80 dark:bg-slate-900 dark:ring-slate-800/80">
          <div
            className="h-full rounded-full bg-[linear-gradient(90deg,rgba(59,130,246,0.95),rgba(99,102,241,0.82),rgba(16,185,129,0.95))] transition-all duration-500 ease-out motion-safe:animate-[pulse_3s_ease-in-out_infinite]"
            style={{ width: `${Math.max(8, Math.min(value, 100))}%` }}
          />
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 text-[13px] text-slate-500 dark:text-slate-400">
          <span>{value >= 100 ? "Perfil completamente confiable" : "Evidencia aun en consolidacion"}</span>
          <span>{value >= 100 ? "Objetivo cumplido" : `${100 - Math.min(value, 100)}% restante`}</span>
        </div>
      </div>
    </div>
  );
}

export function KPICard({
  icon: Icon,
  iconTone,
  title,
  value,
  target,
  description,
  status,
  progress,
}: {
  icon: LucideIcon;
  iconTone: string;
  title: string;
  value: string;
  target: string;
  description: string;
  status: string;
  progress: number;
}) {
  return (
    <Card className={surfaceCardClassName}>
      <CardContent className="flex h-full flex-col gap-5 p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
              {title}
            </p>
            <p className="text-[2.15rem] font-semibold tracking-[-0.04em] text-slate-950 dark:text-slate-50">
              {value}
            </p>
            <p className="text-[13px] text-slate-500 dark:text-slate-400">Objetivo {target}</p>
          </div>
          <div className={cn("flex h-12 w-12 shrink-0 items-center justify-center rounded-full border", iconTone)}>
            <Icon className="h-5 w-5" />
          </div>
        </div>

        <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">{description}</p>

        <div className="mt-auto space-y-3">
          <div className="flex items-center justify-between gap-3">
            <StatusBadge className="border-slate-200/80 bg-slate-50 text-slate-700 dark:border-slate-700/80 dark:bg-slate-900 dark:text-slate-200">
              {status}
            </StatusBadge>
            <span className="text-[13px] font-medium text-slate-500 dark:text-slate-400">{progress}%</span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-900">
            <div
              className={cn(
                "h-full rounded-full bg-gradient-to-r transition-all duration-300 ease-out",
                progress >= 100
                  ? "from-emerald-500 via-emerald-400 to-emerald-300"
                  : "from-sky-500 via-indigo-500 to-violet-500"
              )}
              style={{ width: `${Math.max(6, Math.min(progress, 100))}%` }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
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
    <div className="group rounded-[24px] border border-slate-200/80 bg-white/85 p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md dark:border-slate-800/70 dark:bg-slate-950/80">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3.5">
          <div className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-full border", iconTone)}>
            <Icon className="h-4.5 w-4.5" />
          </div>
          <div className="space-y-1.5">
            <p className="text-sm font-medium text-slate-950 dark:text-slate-50">{title}</p>
            <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">{description}</p>
          </div>
        </div>
        <StatusBadge className="border-slate-200/80 bg-slate-50 text-slate-700 dark:border-slate-700/80 dark:bg-slate-900 dark:text-slate-200">
          {badge}
        </StatusBadge>
      </div>
      <div className="mt-4 flex items-center gap-2 text-[13px] text-slate-500 dark:text-slate-400">
        <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500" />
        {state}
      </div>
    </div>
  );
}

export function AutomationCard({
  title,
  description,
  badge,
  positive,
}: {
  title: string;
  description: string;
  badge: string;
  positive: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-[26px] border p-5 transition-all duration-200",
        positive
          ? "border-emerald-200/80 bg-[linear-gradient(180deg,rgba(236,253,245,0.95),rgba(255,255,255,0.98))] dark:border-emerald-500/25 dark:bg-[linear-gradient(180deg,rgba(6,78,59,0.34),rgba(2,6,23,0.92))]"
          : "border-slate-200/80 bg-[linear-gradient(180deg,rgba(248,250,252,0.96),rgba(255,255,255,0.98))] dark:border-slate-800/70 dark:bg-[linear-gradient(180deg,rgba(15,23,42,0.92),rgba(2,6,23,0.98))]"
      )}
    >
      <div className="flex items-start gap-4">
        <div
          className={cn(
            "flex h-12 w-12 shrink-0 items-center justify-center rounded-full border",
            positive
              ? "border-emerald-200/90 bg-emerald-500/10 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-200"
              : "border-slate-200/90 bg-white/90 text-slate-700 dark:border-slate-700/70 dark:bg-slate-900 dark:text-slate-200"
          )}
        >
          {positive ? <Sparkles className="h-5 w-5" /> : <ArrowUpRight className="h-5 w-5" />}
        </div>
        <div className="min-w-0 flex-1 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-base font-semibold text-slate-950 dark:text-slate-50">{title}</p>
            <StatusBadge
              className={
                positive
                  ? "border-emerald-200/80 bg-emerald-500/10 text-emerald-700 dark:border-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-200"
                  : "border-slate-200/80 bg-white/80 text-slate-700 dark:border-slate-700/80 dark:bg-slate-900 dark:text-slate-200"
              }
            >
              {badge}
            </StatusBadge>
          </div>
          <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">{description}</p>
        </div>
      </div>
    </div>
  );
}

export function PrimaryFeatureCard({
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
    <Card className={cn(surfaceCardClassName, "border-slate-300/80 bg-[linear-gradient(180deg,rgba(255,255,255,1),rgba(248,250,252,0.96))] dark:border-slate-700/80 dark:bg-[linear-gradient(180deg,rgba(15,23,42,0.94),rgba(2,6,23,0.98))]")}>
      <CardHeader className="space-y-4 border-b border-slate-200/80 p-5 dark:border-slate-800/70 sm:p-6">
        <div className="flex items-start gap-4">
          <div className={cn("flex h-12 w-12 shrink-0 items-center justify-center rounded-full border", iconTone)}>
            <Icon className="h-5 w-5" />
          </div>
          <div className="space-y-1.5">
            <CardTitle className="text-[1.3rem] font-semibold tracking-tight text-slate-950 dark:text-slate-50">
              {title}
            </CardTitle>
            <CardDescription className="text-sm leading-6 text-slate-600 dark:text-slate-300">
              {description}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-5 sm:p-6">{children}</CardContent>
    </Card>
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
      <CardHeader className="space-y-4 border-b border-slate-200/80 p-5 dark:border-slate-800/70 sm:p-6">
        <div className="flex items-start gap-4">
          <div className={cn("flex h-12 w-12 shrink-0 items-center justify-center rounded-full border", iconTone)}>
            <Icon className="h-5 w-5" />
          </div>
          <div className="space-y-1.5">
            <CardTitle className="text-[1.15rem] font-semibold tracking-tight text-slate-950 dark:text-slate-50">
              {title}
            </CardTitle>
            <CardDescription className="text-sm leading-6 text-slate-600 dark:text-slate-300">
              {description}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-5 sm:p-6">{children}</CardContent>
    </Card>
  );
}
