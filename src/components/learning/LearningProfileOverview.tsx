import { useMemo } from "react";
import {
  BookOpen,
  BrainCircuit,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  GraduationCap,
  MessageSquareMore,
  ShieldAlert,
  Sparkles,
  TrendingUp,
} from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import {
  EvidenceCard,
  KPIStatCard,
  MetricProgress,
  SectionHeader,
  StatusBadge,
  UniformInfoCard,
  surfaceCardClassName,
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
  exercises: 10,
  interactions: 15,
} as const;

function parseIsoDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(Date.UTC(year, (month ?? 1) - 1, day ?? 1));
}

function capitalize(value: string) {
  if (!value) return value;
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function formatFriendlyDate(dateIso: string, firstDateIso: string) {
  const millisecondsPerDay = 24 * 60 * 60 * 1000;
  const diff = Math.round(
    (parseIsoDate(dateIso).getTime() - parseIsoDate(firstDateIso).getTime()) / millisecondsPerDay,
  );

  if (diff === 0) return "Hoy";
  if (diff === 1) return "Mañana";

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

const maturityMeta: Record<
  ProfileMaturity,
  {
    label: string;
    confidence: string;
    accentBadge: string;
    stateTone: string;
    description: string;
  }
> = {
  PERFIL_INSUFICIENTE: {
    label: "Perfil en construcción",
    confidence: "Sin confianza suficiente",
    accentBadge: "border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-100",
    stateTone: "bg-amber-400/90",
    description:
      "Todavía no hay evidencia suficiente para inferir patrones estables sin correr riesgo de ruido.",
  },
  PERFIL_INICIAL: {
    label: "Perfil inicial",
    confidence: "Confianza baja",
    accentBadge: "border-cyan-500/25 bg-cyan-500/10 text-cyan-700 dark:text-cyan-100",
    stateTone: "bg-cyan-400/90",
    description:
      "Ya existe una base mínima para habilitar recomendaciones iniciales, pero el perfil aún puede cambiar con facilidad.",
  },
  PERFIL_CONFIABLE: {
    label: "Perfil confiable",
    confidence: "Confianza media",
    accentBadge: "border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-100",
    stateTone: "bg-emerald-400/90",
    description:
      "La evidencia ya es suficiente para detectar patrones utiles y habilitar automatizaciones con menor riesgo de inferencias debiles.",
  },
  PERFIL_AVANZADO: {
    label: "Perfil avanzado",
    confidence: "Confianza alta",
    accentBadge: "border-violet-500/25 bg-violet-500/10 text-violet-700 dark:text-violet-100",
    stateTone: "bg-violet-400/90",
    description:
      "La senal de aprendizaje es sostenida y permite trabajar con mayor precision en recomendaciones y planificacion.",
  },
};

const iconTones = {
  cyan: "border-cyan-500/20 bg-cyan-500/10 text-cyan-700 dark:text-cyan-100",
  emerald: "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-100",
  violet: "border-violet-500/20 bg-violet-500/10 text-violet-700 dark:text-violet-100",
  amber: "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-100",
  slate: "border-border/70 bg-muted/50 text-muted-foreground",
} as const;

function clampProgress(progress: number, target: number) {
  return Math.min(100, Math.round((progress / target) * 100));
}

function formatTarget(current: number, target: number) {
  if (current >= target) return `${target}+ / ${target}`;
  return `${current} / ${target}`;
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
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="text-sm leading-6 text-muted-foreground">{description}</p>
      </div>
      {items.length > 0 ? (
        <div className="space-y-2">
          {items.map((item) => (
            <div
              key={item}
              className="rounded-2xl border border-border/60 bg-muted/25 px-4 py-3 text-sm leading-6 text-foreground transition-colors duration-200 hover:bg-muted/35"
            >
              {item}
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-border/70 bg-muted/15 px-4 py-6 text-sm text-muted-foreground">
          {emptyText}
        </div>
      )}
    </div>
  );
}

function RecommendationsList({ items }: { items: LearningRecommendation[] }) {
  return (
    <UniformInfoCard
      icon={BrainCircuit}
      iconTone={iconTones.cyan}
      title="Recomendaciones"
      description="Acciones sugeridas a partir de la evidencia actual del perfil."
    >
      <div className="space-y-3">
        {items.map((item) => (
          <div
            key={item.title}
            className="rounded-2xl border border-border/60 bg-muted/20 p-4 transition-all duration-200 hover:border-border hover:bg-muted/30"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-1.5">
                <p className="text-sm font-medium text-foreground">{item.title}</p>
                <p className="text-sm leading-6 text-muted-foreground">{item.description}</p>
              </div>
              <StatusBadge className="border-border/70 bg-background/80 text-muted-foreground">
                {item.confidence}
              </StatusBadge>
            </div>
          </div>
        ))}
      </div>
    </UniformInfoCard>
  );
}

function WeeklyPlan({ items }: { items: WeeklyStudyPlanItem[] }) {
  const firstDateIso = items[0]?.date ?? "";

  return (
    <UniformInfoCard
      icon={CalendarDays}
      iconTone={iconTones.violet}
      title="Plan semanal"
      description="Secuencia sugerida para mantener practica, repaso y validacion durante la semana."
    >
      <div className="space-y-3">
        {items.map((item) => (
          <div
            key={`${item.dayLabel}-${item.date}-${item.title}`}
            className="rounded-2xl border border-border/60 bg-muted/20 p-4 transition-all duration-200 hover:border-border hover:bg-muted/30"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-foreground">
                    {item.dayLabel} · {formatFriendlyDate(item.date, firstDateIso)}
                  </p>
                  <span className="text-xs text-muted-foreground">{item.title}</span>
                </div>
                <p className="text-xs text-muted-foreground">{formatFullDate(item.date)}</p>
                <p className="text-sm leading-6 text-muted-foreground">{item.activity}</p>
              </div>
              <StatusBadge className="border-border/70 bg-background/80 text-muted-foreground">
                {item.focus}
              </StatusBadge>
            </div>
          </div>
        ))}
      </div>
    </UniformInfoCard>
  );
}

export function LearningProfileLoading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-[180px] rounded-[28px] bg-muted" />
      <div className="grid gap-4 lg:grid-cols-3">
        <Skeleton className="h-[190px] rounded-[28px] bg-muted" />
        <Skeleton className="h-[190px] rounded-[28px] bg-muted" />
        <Skeleton className="h-[190px] rounded-[28px] bg-muted" />
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.35fr_0.95fr]">
        <Skeleton className="h-[420px] rounded-[28px] bg-muted" />
        <Skeleton className="h-[420px] rounded-[28px] bg-muted" />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Skeleton className="h-[280px] rounded-[28px] bg-muted" />
        <Skeleton className="h-[280px] rounded-[28px] bg-muted" />
      </div>
    </div>
  );
}

export function LearningProfileOverview({ profile }: { profile: LearningProfile }) {
  const meta = maturityMeta[profile.maturity];
  const isInsufficient = profile.maturity === "PERFIL_INSUFICIENTE";
  const displayedConfidence =
    profile.progressPercentage >= 100 ? "Confianza alta" : meta.confidence;

  const automationState = useMemo(
    () => [
      {
        label: "Recomendaciones",
        value: profile.canGenerateRecommendations ? displayedConfidence : "Bloqueado",
        description: profile.canGenerateRecommendations
          ? "Las recomendaciones ya pueden apoyarse en evidencia real del uso de TutorIA y del material trabajado."
          : "Todavia no hay base suficiente para recomendar sin riesgo de inferencias debiles.",
        icon: BrainCircuit,
      },
      {
        label: "Plan semanal",
        value: profile.canGenerateStudyPlan ? displayedConfidence : "Aun no disponible",
        description: profile.canGenerateStudyPlan
          ? "La base actual ya permite planificar secuencias semanales sin depender de supuestos fragiles."
          : "El plan semanal se habilita a partir de un perfil confiable.",
        icon: ClipboardList,
      },
    ],
    [displayedConfidence, profile.canGenerateRecommendations, profile.canGenerateStudyPlan]
  );

  return (
    <div className="space-y-6">
      <section className={cn(surfaceCardClassName, "overflow-hidden p-5 sm:p-6 lg:p-7")}>
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge className={meta.accentBadge}>
                <GraduationCap className="h-3.5 w-3.5" />
                {meta.label}
              </StatusBadge>
              <StatusBadge className="border-border/70 bg-muted/40 text-muted-foreground">
                {displayedConfidence}
              </StatusBadge>
            </div>

            <div className="space-y-2">
              <h2 className="text-[2rem] font-semibold tracking-tight text-foreground sm:text-[2.35rem]">
                Perfil de aprendizaje
              </h2>
              <p className="max-w-3xl text-sm leading-7 text-muted-foreground sm:text-[15px]">
                {meta.description}
              </p>
            </div>
          </div>

          <div className="grid min-w-0 gap-3 sm:grid-cols-2 lg:max-w-sm lg:grid-cols-1">
            {automationState.map((item) => {
              const Icon = item.icon;
              const isReady =
                item.value !== "Bloqueado" && item.value !== "Aun no disponible";

              return (
                <div
                  key={item.label}
                  className="rounded-2xl border border-border/60 bg-muted/20 p-4 transition-colors duration-200 hover:bg-muted/30"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div
                        className={cn(
                          "flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border",
                          isReady ? meta.accentBadge : iconTones.slate
                        )}
                      >
                        <Icon className="h-4.5 w-4.5" />
                      </div>
                      <div className="space-y-1.5">
                        <p className="text-sm font-medium text-foreground">{item.label}</p>
                        <p className="text-[13px] leading-5 text-muted-foreground">
                          {item.description}
                        </p>
                      </div>
                    </div>
                    <StatusBadge
                      className={
                        isReady
                          ? meta.accentBadge
                          : "border-border/70 bg-background/70 text-muted-foreground"
                      }
                    >
                      {item.value}
                    </StatusBadge>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-6">
          <MetricProgress
            value={profile.progressPercentage}
            title="Madurez global"
            state={profile.progressPercentage >= 100 ? "Perfil completamente confiable" : meta.confidence}
            description="El porcentaje representa que tan cerca esta el perfil de alcanzar una base confiable para automatizaciones academicas."
          />
        </div>
      </section>

      <section className="space-y-4">
        <SectionHeader
          eyebrow="Indicadores clave"
          title="Lectura rapida del perfil"
          description="Estas metricas condensan la evidencia util que LearnSoftUY ya pudo observar en documentos, practica e interacciones."
        />

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <KPIStatCard
            icon={BookOpen}
            iconTone={iconTones.cyan}
            title="Documentos"
            value={formatTarget(profile.documentsAnalyzed, RELIABLE_TARGETS.documents)}
            description="Todos los documentos listos se incorporan al perfil sin duplicar registros ni estados paralelos."
            progress={clampProgress(profile.documentsAnalyzed, RELIABLE_TARGETS.documents)}
            progressLabel="Objetivo minimo para mejorar variedad y contexto."
          />
          <KPIStatCard
            icon={CheckCircle2}
            iconTone={iconTones.emerald}
            title="Ejercicios"
            value={formatTarget(profile.exercisesDetected, RELIABLE_TARGETS.exercises)}
            description="Los ejercicios unicos detectados permiten reconocer practica repetida y consolidacion de temas."
            progress={clampProgress(profile.exercisesDetected, RELIABLE_TARGETS.exercises)}
            progressLabel="Objetivo minimo para detectar patrones de practica."
          />
          <KPIStatCard
            icon={MessageSquareMore}
            iconTone={iconTones.violet}
            title="Interacciones"
            value={formatTarget(profile.interactions, RELIABLE_TARGETS.interactions)}
            description="Los mensajes reales con TutorIA revelan habitos de consulta y profundidad de acompanamiento."
            progress={clampProgress(profile.interactions, RELIABLE_TARGETS.interactions)}
            progressLabel="Objetivo minimo para estabilizar seguimiento."
          />
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.35fr_0.95fr]">
        <UniformInfoCard
          icon={Sparkles}
          iconTone={iconTones.cyan}
          title="Evidencia usada"
          description="Senales activas hoy y preparadas para crecer con futuras fuentes de evidencia."
        >
          <div className="grid gap-3">
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
              title="Ejercicios detectados"
              description="Cuenta ejercicios unicos por documento a partir de exercise_ref y evita inflar la senal por chunk repetido."
              badge={`${profile.exercisesDetected} relevantes`}
              state="Senal estable"
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
          icon={TrendingUp}
          iconTone={iconTones.slate}
          title="Lectura de fortaleza del perfil"
          description="Resumen de lo que hoy esta habilitado y de la calidad de la senal observada."
        >
          <div className="space-y-5">
            <div className="rounded-2xl border border-border/60 bg-muted/20 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-foreground">Estado actual</p>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    {meta.description}
                  </p>
                </div>
                <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <span className={cn("inline-flex h-2.5 w-2.5 rounded-full", meta.stateTone)} />
                  {meta.label}
                </div>
              </div>
            </div>

            <ListBlock
              title="Fortalezas visibles"
              description="Patrones consistentes que el sistema ya puede sostener con evidencia suficiente."
              items={profile.strengths}
              emptyText="Todavia no hay fortalezas visibles publicadas para este perfil."
            />

            <ListBlock
              title="Debilidades visibles"
              description="Zonas donde todavia hay friccion, falta de practica o senal insuficiente."
              items={profile.weaknesses}
              emptyText="Todavia no hay debilidades visibles publicadas para este perfil."
            />
          </div>
        </UniformInfoCard>
      </section>

      {isInsufficient ? (
        <Alert className="rounded-3xl border-amber-500/25 bg-amber-500/10 text-amber-950 dark:text-amber-100">
          <ShieldAlert className="h-4 w-4" />
          <AlertTitle>Perfil insuficiente</AlertTitle>
          <AlertDescription className="text-sm leading-6 text-amber-900/80 dark:text-amber-50/90">
            Se necesita mas actividad para obtener recomendaciones precisas. Mientras falte evidencia,
            LearnSoftUY no expone fortalezas, debilidades ni planes automaticos.
          </AlertDescription>
        </Alert>
      ) : (
        <section className="grid gap-6 lg:grid-cols-2">
          {profile.recommendations.length > 0 ? (
            <RecommendationsList items={profile.recommendations} />
          ) : (
            <UniformInfoCard
              icon={BrainCircuit}
              iconTone={iconTones.cyan}
              title="Recomendaciones"
              description="Todavia no hay recomendaciones publicadas para este perfil."
            >
              <div className="rounded-2xl border border-dashed border-border/70 bg-muted/15 px-4 py-8 text-sm text-muted-foreground">
                Cuando aparezcan recomendaciones, se mostraran aca con su nivel de confianza.
              </div>
            </UniformInfoCard>
          )}

          {profile.weeklyStudyPlan.length > 0 ? (
            <WeeklyPlan items={profile.weeklyStudyPlan} />
          ) : (
            <UniformInfoCard
              icon={CalendarDays}
              iconTone={iconTones.violet}
              title="Plan semanal"
              description="Todavia no hay un plan semanal habilitado para este perfil."
            >
              <div className="rounded-2xl border border-dashed border-border/70 bg-muted/15 px-4 py-8 text-sm text-muted-foreground">
                El plan semanal aparecera cuando la madurez del perfil permita planificar con mas precision.
              </div>
            </UniformInfoCard>
          )}
        </section>
      )}
    </div>
  );
}
