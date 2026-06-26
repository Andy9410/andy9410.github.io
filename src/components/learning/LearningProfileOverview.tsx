import { useMemo } from "react";
import {
  ArrowRight,
  BookOpen,
  BrainCircuit,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Compass,
  GraduationCap,
  Lightbulb,
  MessageSquareMore,
  Route,
  ShieldAlert,
  Sparkles,
  TrendingUp,
} from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AutomationCard,
  CompactMetricPill,
  CompactSummaryCard,
  EvidenceCard,
  KPICard,
  PrimaryFeatureCard,
  ProgressCard,
  SectionTitle,
  StatusBadge,
  UniformInfoCard,
} from "@/components/learning/LearningProfilePrimitives";
import { cn } from "@/lib/utils";
import type {
  LearningProfile,
  LearningRecommendation,
  ProfileMaturity,
  WeeklyStudyPlanItem,
} from "@/types/learningProfile";

const RELIABLE_TARGETS = {
  documents: 3,
  exercises: 5,
  interactions: 15,
} as const;

const maturityMeta: Record<
  ProfileMaturity,
  {
    label: string;
    confidence: string;
    accentBadge: string;
    accentBorder: string;
    stateTone: string;
    description: string;
  }
> = {
  PERFIL_INSUFICIENTE: {
    label: "Perfil en construccion",
    confidence: "Sin confianza suficiente",
    accentBadge: "border-amber-200/80 bg-amber-500/10 text-amber-700 dark:border-amber-500/25 dark:bg-amber-500/10 dark:text-amber-100",
    accentBorder: "border-amber-200/80 bg-amber-500/5 dark:border-amber-500/20 dark:bg-amber-500/10",
    stateTone: "bg-amber-500",
    description:
      "Todavia no hay evidencia suficiente para inferir patrones estables sin correr riesgo de ruido.",
  },
  PERFIL_INICIAL: {
    label: "Perfil inicial",
    confidence: "Confianza baja",
    accentBadge: "border-cyan-200/80 bg-cyan-500/10 text-cyan-700 dark:border-cyan-500/25 dark:bg-cyan-500/10 dark:text-cyan-100",
    accentBorder: "border-cyan-200/80 bg-cyan-500/5 dark:border-cyan-500/20 dark:bg-cyan-500/10",
    stateTone: "bg-cyan-500",
    description:
      "Ya existe una base minima para habilitar recomendaciones iniciales, pero el perfil aun puede cambiar con facilidad.",
  },
  PERFIL_CONFIABLE: {
    label: "Perfil confiable",
    confidence: "Confianza media",
    accentBadge: "border-emerald-200/80 bg-emerald-500/10 text-emerald-700 dark:border-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-100",
    accentBorder: "border-emerald-200/80 bg-emerald-500/5 dark:border-emerald-500/20 dark:bg-emerald-500/10",
    stateTone: "bg-emerald-500",
    description:
      "La evidencia ya es suficiente para detectar patrones utiles y habilitar automatizaciones con menor riesgo de inferencias debiles.",
  },
  PERFIL_AVANZADO: {
    label: "Perfil avanzado",
    confidence: "Confianza alta",
    accentBadge: "border-violet-200/80 bg-violet-500/10 text-violet-700 dark:border-violet-500/25 dark:bg-violet-500/10 dark:text-violet-100",
    accentBorder: "border-violet-200/80 bg-violet-500/5 dark:border-violet-500/20 dark:bg-violet-500/10",
    stateTone: "bg-violet-500",
    description:
      "La senal de aprendizaje es sostenida y permite trabajar con mayor precision en recomendaciones y planificacion.",
  },
};

const iconTones = {
  cyan: "border-cyan-200/80 bg-cyan-500/10 text-cyan-700 dark:border-cyan-500/25 dark:bg-cyan-500/10 dark:text-cyan-100",
  emerald: "border-emerald-200/80 bg-emerald-500/10 text-emerald-700 dark:border-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-100",
  violet: "border-violet-200/80 bg-violet-500/10 text-violet-700 dark:border-violet-500/25 dark:bg-violet-500/10 dark:text-violet-100",
  amber: "border-amber-200/80 bg-amber-500/10 text-amber-700 dark:border-amber-500/25 dark:bg-amber-500/10 dark:text-amber-100",
  slate: "border-slate-200/80 bg-slate-50/90 text-slate-700 dark:border-slate-700/80 dark:bg-slate-900 dark:text-slate-200",
} as const;

function parseIsoDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(Date.UTC(year, (month ?? 1) - 1, day ?? 1));
}

function diffCalendarDays(fromIso: string, toIso: string) {
  const from = parseIsoDate(fromIso);
  const to = parseIsoDate(toIso);
  const millisecondsPerDay = 24 * 60 * 60 * 1000;
  return Math.round((to.getTime() - from.getTime()) / millisecondsPerDay);
}

function capitalize(value: string) {
  if (!value) return value;
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function formatFriendlyDate(dateIso: string, firstDateIso: string) {
  const diff = diffCalendarDays(firstDateIso, dateIso);
  if (diff === 0) {
    return "Hoy";
  }
  if (diff === 1) {
    return "Manana";
  }

  return capitalize(
    new Intl.DateTimeFormat("es-UY", {
      weekday: "long",
      day: "numeric",
      month: "long",
    }).format(parseIsoDate(dateIso)),
  );
}

function formatFullDate(dateIso: string) {
  return capitalize(
    new Intl.DateTimeFormat("es-UY", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(parseIsoDate(dateIso)),
  );
}

function clampProgress(current: number, target: number) {
  return Math.min(100, Math.round((current / target) * 100));
}

function formatTarget(current: number, target: number) {
  if (current >= target) return `${target}+ / ${target}`;
  return `${current} / ${target}`;
}

function computeStatus(current: number, target: number) {
  if (current >= target) return "Completado";
  if (current >= Math.ceil(target * 0.6)) return "En progreso";
  return "Base inicial";
}

function ListBlock({
  title,
  description,
  items,
  emptyText,
}: {
  title: string;
  description: string;
  items: string[];
  emptyText: string;
}) {
  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <p className="text-sm font-medium text-slate-950 dark:text-slate-50">{title}</p>
        <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">{description}</p>
      </div>
      {items.length > 0 ? (
        <div className="space-y-2.5">
          {items.map((item) => (
            <div
              key={item}
              className="rounded-2xl border border-slate-200/80 bg-slate-50/80 px-4 py-3 text-sm leading-6 text-slate-800 transition-all duration-200 hover:bg-slate-100/80 dark:border-slate-800/70 dark:bg-slate-900/80 dark:text-slate-100 dark:hover:bg-slate-900"
            >
              {item}
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-300/90 bg-slate-50/60 px-4 py-6 text-sm text-slate-500 dark:border-slate-700/90 dark:bg-slate-900/60 dark:text-slate-400">
          {emptyText}
        </div>
      )}
    </div>
  );
}

function RecommendationsList({ items }: { items: LearningRecommendation[] }) {
  return (
    <PrimaryFeatureCard
      icon={BrainCircuit}
      iconTone={iconTones.cyan}
      title="Recomendaciones"
      description="Que conviene estudiar y practicar a partir de la evidencia observada."
    >
      <div className="space-y-3">
        {items.map((item) => (
          <div
            key={item.title}
            className="rounded-[24px] border border-slate-200/80 bg-slate-50/70 p-4 transition-all duration-200 hover:border-slate-300 hover:bg-slate-100/80 dark:border-slate-800/70 dark:bg-slate-900/75 dark:hover:bg-slate-900"
          >
            <div className="flex items-start gap-3">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-cyan-200/80 bg-cyan-500/10 text-cyan-700 dark:border-cyan-500/25 dark:bg-cyan-500/10 dark:text-cyan-100">
                  <Lightbulb className="h-4.5 w-4.5" />
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-slate-950 dark:text-slate-50">{item.title}</p>
                    <ArrowRight className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
                  </div>
                  <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">{item.description}</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </PrimaryFeatureCard>
  );
}

function WeeklyPlan({ items }: { items: WeeklyStudyPlanItem[] }) {
  const firstDateIso = items[0]?.date ?? "";

  return (
    <PrimaryFeatureCard
      icon={CalendarDays}
      iconTone={iconTones.violet}
      title="Plan semanal"
      description="Siguiente secuencia de trabajo para avanzar con ritmo y foco."
    >
      <div className="space-y-3">
        {items.map((item) => (
          <div
            key={`${item.dayLabel}-${item.date}-${item.title}`}
            className="rounded-[24px] border border-slate-200/80 bg-slate-50/70 p-4 transition-all duration-200 hover:border-slate-300 hover:bg-slate-100/80 dark:border-slate-800/70 dark:bg-slate-900/75 dark:hover:bg-slate-900"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-violet-200/80 bg-violet-500/10 text-violet-700 dark:border-violet-500/25 dark:bg-violet-500/10 dark:text-violet-100">
                  <Route className="h-4.5 w-4.5" />
                </div>
                <div className="space-y-1.5">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-medium text-slate-950 dark:text-slate-50">
                        {item.dayLabel} · {formatFriendlyDate(item.date, firstDateIso)}
                      </p>
                      <span className="text-xs text-slate-500 dark:text-slate-400">{item.title}</span>
                      <Compass className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{formatFullDate(item.date)}</p>
                  </div>
                  <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">{item.activity}</p>
                </div>
              </div>
              <StatusBadge className="border-slate-200/80 bg-white/90 text-slate-700 dark:border-slate-700/80 dark:bg-slate-900 dark:text-slate-200">
                {item.focus}
              </StatusBadge>
            </div>
          </div>
        ))}
      </div>
    </PrimaryFeatureCard>
  );
}

export function LearningProfileLoading() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <Skeleton className="h-[220px] rounded-[28px] bg-muted" />
        <Skeleton className="h-[220px] rounded-[28px] bg-muted" />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Skeleton className="h-[360px] rounded-[28px] bg-muted" />
        <Skeleton className="h-[360px] rounded-[28px] bg-muted" />
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <Skeleton className="h-[420px] rounded-[28px] bg-muted" />
        <Skeleton className="h-[420px] rounded-[28px] bg-muted" />
      </div>
    </div>
  );
}

export function LearningProfileOverview({ profile }: { profile: LearningProfile }) {
  const meta = maturityMeta[profile.maturity];
  const isInsufficient = profile.maturity === "PERFIL_INSUFICIENTE";

  const automationState = useMemo(
    () => [
      {
        label: "Recomendaciones",
        value: profile.canGenerateRecommendations ? "Disponible" : "Bloqueado",
        description: profile.canGenerateRecommendations
          ? "Las recomendaciones ya pueden apoyarse en evidencia real del uso de TutorIA y del material trabajado."
          : "Todavia no hay base suficiente para recomendar sin riesgo de inferencias debiles.",
        positive: profile.canGenerateRecommendations,
      },
      {
        label: "Plan semanal",
        value: profile.canGenerateStudyPlan ? "Disponible" : "Aun no disponible",
        description: profile.canGenerateStudyPlan
          ? "La base actual ya permite planificar secuencias semanales sin depender de supuestos fragiles."
          : "El plan semanal se habilita a partir de un perfil confiable.",
        positive: profile.canGenerateStudyPlan,
      },
    ],
    [profile.canGenerateRecommendations, profile.canGenerateStudyPlan]
  );

  return (
    <div className="space-y-5">
      <section className="space-y-3">
        <SectionTitle
          eyebrow="Prioridad"
          title="Qué estudiar ahora"
          description="Este es el contenido principal de la pantalla: próximos pasos y plan sugerido."
        />
        <div className="grid gap-6 lg:grid-cols-2">
          {profile.recommendations.length > 0 ? (
            <RecommendationsList items={profile.recommendations} />
          ) : (
            <PrimaryFeatureCard
              icon={BrainCircuit}
              iconTone={iconTones.cyan}
              title="Recomendaciones"
              description="Todavia no hay recomendaciones publicadas para este perfil."
            >
              <div className="rounded-[24px] border border-dashed border-slate-300/90 bg-slate-50/60 px-4 py-8 text-sm text-slate-500 dark:border-slate-700/90 dark:bg-slate-900/60 dark:text-slate-400">
                Cuando aparezcan recomendaciones, se mostraran aca con su nivel de confianza.
              </div>
            </PrimaryFeatureCard>
          )}

          {profile.weeklyStudyPlan.length > 0 ? (
            <WeeklyPlan items={profile.weeklyStudyPlan} />
          ) : (
            <PrimaryFeatureCard
              icon={CalendarDays}
              iconTone={iconTones.violet}
              title="Plan semanal"
              description="Todavia no hay un plan semanal habilitado para este perfil."
            >
              <div className="rounded-[24px] border border-dashed border-slate-300/90 bg-slate-50/60 px-4 py-8 text-sm text-slate-500 dark:border-slate-700/90 dark:bg-slate-900/60 dark:text-slate-400">
                El plan semanal aparecera cuando la madurez del perfil permita planificar con mas precision.
              </div>
            </PrimaryFeatureCard>
          )}
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <CompactSummaryCard
          title="Resumen del perfil"
          description={profile.progressPercentage >= 100 ? "Perfil listo para generar recomendaciones." : "Perfil en consolidacion."}
          status={
            <StatusBadge className={meta.accentBadge}>
              <GraduationCap className="h-3.5 w-3.5" />
              {meta.label}
            </StatusBadge>
          }
        >
          <div className="grid gap-3 lg:grid-cols-[0.95fr_1.05fr]">
            <ProgressCard
              value={profile.progressPercentage}
              title="Madurez"
              state={profile.progressPercentage >= 100 ? "Perfil completamente confiable" : meta.confidence}
              description="Listo para recomendaciones cuando la señal es estable."
            />
            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
              <CompactMetricPill
                icon={BookOpen}
                iconTone={iconTones.cyan}
                label="Documentos"
                value={formatTarget(profile.documentsAnalyzed, RELIABLE_TARGETS.documents)}
                status={computeStatus(profile.documentsAnalyzed, RELIABLE_TARGETS.documents)}
              />
              <CompactMetricPill
                icon={CheckCircle2}
                iconTone={iconTones.emerald}
                label="Practica"
                value={profile.exercisesDetected >= RELIABLE_TARGETS.exercises ? "Suficiente" : "En crecimiento"}
                status={computeStatus(profile.exercisesDetected, RELIABLE_TARGETS.exercises)}
              />
              <CompactMetricPill
                icon={MessageSquareMore}
                iconTone={iconTones.violet}
                label="Interacciones"
                value={formatTarget(profile.interactions, RELIABLE_TARGETS.interactions)}
                status={computeStatus(profile.interactions, RELIABLE_TARGETS.interactions)}
              />
            </div>
          </div>
        </CompactSummaryCard>

        <CompactSummaryCard
          title="Resumen operativo"
          description="Estado breve del sistema y automatizaciones habilitadas."
          status={
            <StatusBadge className="border-slate-200/80 bg-slate-50/90 text-slate-700 dark:border-slate-700/80 dark:bg-slate-900 dark:text-slate-200">
              Estado actual
            </StatusBadge>
          }
        >
          <div className="grid gap-3">
            <div className={cn("rounded-2xl border px-4 py-3", meta.accentBorder)}>
              <p className="text-sm font-medium text-slate-950 dark:text-slate-50">Estado actual</p>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                {profile.progressPercentage >= 100 ? "Perfil listo para generar recomendaciones." : "Todavia necesita mas evidencia."}
              </p>
            </div>
            {automationState.map((item) => (
              <div
                key={item.label}
                className="rounded-2xl border border-slate-200/80 bg-slate-50/75 px-4 py-3 dark:border-slate-800/70 dark:bg-slate-900/75"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium text-slate-950 dark:text-slate-50">{item.label}</p>
                  <StatusBadge className={item.positive ? meta.accentBadge : "border-slate-200/80 bg-white/90 text-slate-700 dark:border-slate-700/80 dark:bg-slate-900 dark:text-slate-200"}>
                    {item.value}
                  </StatusBadge>
                </div>
              </div>
            ))}
          </div>
        </CompactSummaryCard>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <UniformInfoCard
          icon={Sparkles}
          iconTone={iconTones.cyan}
          title="Evidencia usada"
          description="Senales activas hoy y preparadas para crecer con futuras fuentes de evidencia."
        >
          <div className="space-y-3">
            <EvidenceCard
              icon={BookOpen}
              iconTone={iconTones.cyan}
              title="Documentos analizados"
              description="Cuenta documentos listos del usuario, sin duplicar registros ni inventar estados paralelos."
              badge={`${profile.documentsAnalyzed} activos`}
              state="Fuente consolidada"
            />
            <EvidenceCard
              icon={CheckCircle2}
              iconTone={iconTones.emerald}
              title="Practica detectada"
              description="Cuenta actividad practica real por documento y evita inflar la senal con repeticiones."
              badge={profile.exercisesDetected >= RELIABLE_TARGETS.exercises ? "Suficiente" : `${profile.exercisesDetected} en curso`}
              state={profile.exercisesDetected >= RELIABLE_TARGETS.exercises ? "Senal estable" : "Aun creciendo"}
            />
            <EvidenceCard
              icon={MessageSquareMore}
              iconTone={iconTones.violet}
              title="Interacciones relevantes"
              description="Cuenta mensajes del usuario en conversaciones reales con TutorIA, no respuestas sinteticas ni artefactos auxiliares."
              badge={`${profile.interactions} mensajes`}
              state="Seguimiento activo"
            />
          </div>
        </UniformInfoCard>

        <UniformInfoCard
          icon={ClipboardList}
          iconTone={iconTones.slate}
          title="Estado de automatizacion"
          description="Detalle secundario de lo que ya esta habilitado y como se interpreta la señal."
        >
          <div className="space-y-5">
            {automationState.map((item) => (
              <AutomationCard
                key={item.label}
                title={item.label}
                description={item.positive ? "Disponible con la evidencia actual." : "Todavia en segundo plano hasta consolidar mas señal."}
                badge={item.value}
                positive={item.positive}
              />
            ))}
            <details className="group rounded-[24px] border border-slate-200/80 bg-slate-50/70 p-4 dark:border-slate-800/70 dark:bg-slate-900/75">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-medium text-slate-950 outline-none marker:hidden dark:text-slate-50">
                Fortalezas y debilidades detectadas
                <span className="text-xs text-slate-500 transition-transform duration-200 group-open:rotate-180 dark:text-slate-400">
                  ▼
                </span>
              </summary>
              <div className="mt-4 space-y-5">
                <ListBlock
                  title="Fortalezas visibles"
                  description="Patrones consistentes que el sistema ya puede sostener."
                  items={profile.strengths}
                  emptyText="Todavia no hay fortalezas visibles publicadas para este perfil."
                />

                <ListBlock
                  title="Debilidades visibles"
                  description="Zonas donde todavia hay friccion o señal insuficiente."
                  items={profile.weaknesses}
                  emptyText="Todavia no hay debilidades visibles publicadas para este perfil."
                />
              </div>
            </details>
          </div>
        </UniformInfoCard>
      </section>

      {isInsufficient ? (
        <Alert className="rounded-[28px] border-amber-200/80 bg-amber-500/10 text-amber-950 dark:border-amber-500/25 dark:bg-amber-500/10 dark:text-amber-100">
          <ShieldAlert className="h-4 w-4" />
          <AlertTitle>Perfil insuficiente</AlertTitle>
          <AlertDescription className="text-sm leading-6 text-amber-900/80 dark:text-amber-50/90">
            Se necesita mas actividad para obtener recomendaciones precisas. Mientras falte evidencia,
            LearnSoftUY no expone fortalezas, debilidades ni planes automaticos.
          </AlertDescription>
        </Alert>
      ) : null}
    </div>
  );
}
