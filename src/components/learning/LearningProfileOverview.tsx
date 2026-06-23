import { useMemo } from "react";
import {
  BookOpen,
  BrainCircuit,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  GraduationCap,
  MessageSquareMore,
  PanelTopOpen,
  ShieldAlert,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import type { LearningProfile, ProfileMaturity, LearningRecommendation, WeeklyStudyPlanItem } from "@/types/learningProfile";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";

const RELIABLE_TARGETS = {
  documents: 3,
  exercises: 10,
  interactions: 15,
} as const;

const maturityMeta: Record<ProfileMaturity, {
  label: string;
  confidence: string;
  accent: string;
  badge: string;
  description: string;
}> = {
  PERFIL_INSUFICIENTE: {
    label: "Perfil en construcción",
    confidence: "Sin confianza suficiente",
    accent: "text-amber-200",
    badge: "border-amber-500/30 bg-amber-500/10 text-amber-100",
    description: "Todavía no hay evidencia suficiente para inferir patrones estables sin correr riesgo de ruido.",
  },
  PERFIL_INICIAL: {
    label: "Perfil inicial",
    confidence: "Confianza baja",
    accent: "text-cyan-200",
    badge: "border-cyan-500/30 bg-cyan-500/10 text-cyan-100",
    description: "Ya existe una base mínima para habilitar recomendaciones iniciales, pero el perfil aún puede cambiar con facilidad.",
  },
  PERFIL_CONFIABLE: {
    label: "Perfil confiable",
    confidence: "Confianza media",
    accent: "text-emerald-200",
    badge: "border-emerald-500/30 bg-emerald-500/10 text-emerald-100",
    description: "La evidencia ya es suficiente para detectar patrones útiles y habilitar automatizaciones con menor riesgo de inferencias débiles.",
  },
  PERFIL_AVANZADO: {
    label: "Perfil avanzado",
    confidence: "Confianza alta",
    accent: "text-fuchsia-200",
    badge: "border-fuchsia-500/30 bg-fuchsia-500/10 text-fuchsia-100",
    description: "La señal de aprendizaje es sostenida y permite trabajar con mayor precisión en recomendaciones y planificación.",
  },
};

function formatTarget(current: number, target: number) {
  if (current >= target) return `${target}+ / ${target}`;
  return `${current} / ${target}`;
}

export function LearningProfileLoading() {
  return (
    <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
      <Skeleton className="h-[340px] rounded-2xl bg-muted" />
      <Skeleton className="h-[340px] rounded-2xl bg-muted" />
      <Skeleton className="h-[220px] rounded-2xl bg-muted lg:col-span-2" />
    </div>
  );
}

function EvidenceRow({
  label,
  value,
  helper,
}: {
  label: string;
  value: string;
  helper: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-background px-4 py-3">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-foreground">{label}</p>
          <p className="mt-1 text-xs text-muted-foreground">{helper}</p>
        </div>
        <p className="text-sm font-semibold text-foreground">{value}</p>
      </div>
    </div>
  );
}

function InsightList({
  title,
  icon: Icon,
  items,
}: {
  title: string;
  icon: typeof Sparkles;
  items: string[];
}) {
  return (
    <Card className="border-border bg-background shadow-sm">
      <CardHeader className="border-b border-border pb-4">
        <CardTitle className="flex items-center gap-2 text-lg text-foreground">
          <Icon className="h-4 w-4 text-cyan-200" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 p-5">
        {items.map((item) => (
          <div key={item} className="rounded-xl border border-border bg-muted/30 px-4 py-3 text-sm leading-6 text-foreground">
            {item}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function RecommendationsList({ items }: { items: LearningRecommendation[] }) {
  return (
    <Card className="border-border bg-background shadow-sm">
      <CardHeader className="border-b border-border pb-4">
        <CardTitle className="flex items-center gap-2 text-lg text-foreground">
          <PanelTopOpen className="h-4 w-4 text-accent" />
          Recomendaciones
        </CardTitle>
        <CardDescription className="text-muted-foreground">
          Acciones sugeridas a partir de la evidencia actual del perfil.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 p-5">
        {items.map((item) => (
          <div key={item.title} className="rounded-xl border border-border bg-muted/20 px-4 py-3">
            <div className="mb-2 flex items-center justify-between gap-3">
              <p className="text-sm font-medium text-foreground">{item.title}</p>
              <Badge variant="outline" className="border-border bg-background text-muted-foreground">
                {item.confidence}
              </Badge>
            </div>
            <p className="text-sm leading-6 text-muted-foreground">{item.description}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function WeeklyPlan({ items }: { items: WeeklyStudyPlanItem[] }) {
  return (
    <Card className="border-border bg-background shadow-sm">
      <CardHeader className="border-b border-border pb-4">
        <CardTitle className="flex items-center gap-2 text-lg text-foreground">
          <CalendarDays className="h-4 w-4 text-accent" />
          Plan semanal
        </CardTitle>
        <CardDescription className="text-muted-foreground">
          Secuencia sugerida para mantener práctica, repaso y validación durante la semana.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 p-5">
        {items.map((item) => (
          <div key={item.day} className="rounded-xl border border-border bg-muted/20 px-4 py-3">
            <div className="mb-2 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-foreground">{item.day}</p>
                <p className="text-xs text-muted-foreground">{item.title}</p>
              </div>
              <Badge variant="outline" className="border-border bg-background text-muted-foreground">
                {item.focus}
              </Badge>
            </div>
            <p className="text-sm leading-6 text-muted-foreground">{item.activity}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export function LearningProfileOverview({ profile }: { profile: LearningProfile }) {
  const meta = maturityMeta[profile.maturity];
  const isInsufficient = profile.maturity === "PERFIL_INSUFICIENTE";
  const canShowInsights = !isInsufficient;
  const canShowStudyPlanState = !isInsufficient;
  const displayedConfidence = profile.progressPercentage >= 100 ? "Confianza alta" : meta.confidence;

  const automationState = useMemo(() => ([
    {
      label: "Recomendaciones",
      value: profile.canGenerateRecommendations ? displayedConfidence : "Bloqueado",
      description: profile.canGenerateRecommendations
        ? "Las recomendaciones ya pueden apoyarse en evidencia real del uso de TutorIA y del material trabajado."
        : "Todavía no hay base suficiente para recomendar sin riesgo de inferencias débiles.",
      icon: BrainCircuit,
    },
    {
      label: "Plan semanal",
      value: profile.canGenerateStudyPlan ? displayedConfidence : "Aún no disponible",
      description: profile.canGenerateStudyPlan
        ? "La base actual ya permite planificar secuencias semanales sin depender de supuestos frágiles."
        : "El plan semanal se habilita a partir de un perfil confiable.",
      icon: ClipboardList,
    },
  ]), [displayedConfidence, profile.canGenerateRecommendations, profile.canGenerateStudyPlan]);

  return (
    <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
      <Card className="border-border bg-background shadow-sm">
        <CardHeader className="border-b border-border pb-5">
          <div className="flex flex-wrap items-center gap-3">
            <Badge className={meta.badge}>
              <GraduationCap className="mr-1.5 h-3.5 w-3.5" />
              {meta.label}
            </Badge>
            <Badge variant="outline" className="border-border bg-muted/30 text-muted-foreground">
              {displayedConfidence}
            </Badge>
          </div>
          <CardTitle className="mt-4 text-2xl font-semibold tracking-tight text-foreground">
            Perfil de aprendizaje
          </CardTitle>
          <CardDescription className="max-w-2xl text-sm leading-6 text-muted-foreground">
            {meta.description}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 p-5">
          <div className="rounded-2xl border border-border bg-muted/20 p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">Madurez global</p>
                <p className={`mt-2 text-3xl font-semibold tracking-tight ${meta.accent}`}>
                  {profile.progressPercentage}%
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-muted-foreground" />
            </div>
            <Progress value={profile.progressPercentage} className="h-3 bg-muted" />
            <p className="mt-4 text-sm leading-6 text-muted-foreground">
              El porcentaje representa qué tan cerca está el perfil de alcanzar una base confiable para automatizaciones académicas.
            </p>
          </div>

          <div className="grid gap-3">
            <EvidenceRow
              label="Documentos analizados"
              value={formatTarget(profile.documentsAnalyzed, RELIABLE_TARGETS.documents)}
              helper="Objetivo mínimo para perfilar mejor variedad y contexto."
            />
            <EvidenceRow
              label="Ejercicios practicados"
              value={formatTarget(profile.exercisesDetected, RELIABLE_TARGETS.exercises)}
              helper="Objetivo mínimo para detectar patrones repetidos en la práctica."
            />
            <EvidenceRow
              label="Interacciones con TutorIA"
              value={formatTarget(profile.interactions, RELIABLE_TARGETS.interactions)}
              helper="Objetivo mínimo para estabilizar hábitos de consulta y seguimiento."
            />
          </div>

          {isInsufficient && (
            <Alert className="border-amber-500/30 bg-amber-500/10 text-amber-100">
              <ShieldAlert className="h-4 w-4" />
              <AlertTitle>Perfil insuficiente</AlertTitle>
              <AlertDescription className="text-amber-50/90">
                Necesitás más actividad para obtener recomendaciones precisas. Mientras falte evidencia, LearnSoftUY no expone fortalezas, debilidades ni planes automáticos.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6">
        <Card className="border-border bg-background shadow-sm">
          <CardHeader className="border-b border-border pb-4">
            <CardTitle className="text-lg text-foreground">Evidencia usada</CardTitle>
            <CardDescription className="text-muted-foreground">
              Señales activas hoy y preparadas para crecer con futuras fuentes de evidencia.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 p-5 text-sm text-foreground">
            <div className="flex items-start gap-3 rounded-xl border border-border bg-muted/20 px-4 py-3">
              <BookOpen className="mt-0.5 h-4 w-4 text-cyan-200" />
              <div>
                <p className="font-medium text-foreground">Documentos analizados</p>
                <p className="mt-1 text-muted-foreground">Cuenta documentos listos del usuario, sin duplicar registros ni inventar estados paralelos.</p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-xl border border-border bg-muted/20 px-4 py-3">
              <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-200" />
              <div>
                <p className="font-medium text-foreground">Ejercicios detectados</p>
                <p className="mt-1 text-muted-foreground">Cuenta ejercicios únicos por documento a partir de `exercise_ref`, evitando inflar la señal por chunk repetido.</p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-xl border border-border bg-muted/20 px-4 py-3">
              <MessageSquareMore className="mt-0.5 h-4 w-4 text-fuchsia-200" />
              <div>
                <p className="font-medium text-foreground">Interacciones relevantes</p>
                <p className="mt-1 text-muted-foreground">Cuenta mensajes del usuario en conversaciones reales con TutorIA, no respuestas sintéticas ni artefactos auxiliares.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {canShowStudyPlanState && (
          <Card className="border-border bg-background shadow-sm">
            <CardHeader className="border-b border-border pb-4">
              <CardTitle className="text-lg text-foreground">Estado de automatización</CardTitle>
              <CardDescription className="text-muted-foreground">
                Qué partes del perfil ya están habilitadas sin depender de información débil.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 p-5">
              {automationState.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.label} className="rounded-xl border border-border bg-muted/20 px-4 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="rounded-lg border border-border bg-background p-2 text-muted-foreground">
                          <Icon className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">{item.label}</p>
                          <p className="mt-1 text-xs leading-5 text-muted-foreground">{item.description}</p>
                        </div>
                      </div>
                      <Badge
                        className={item.value === "Bloqueado" || item.value === "Aún no disponible"
                          ? "border-border bg-muted/30 text-muted-foreground"
                          : meta.badge}
                      >
                        {item.value}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}
      </div>

      {canShowInsights && (
        <div className="grid gap-6 lg:col-span-2 lg:grid-cols-2">
          {profile.recommendations.length > 0 && (
            <RecommendationsList items={profile.recommendations} />
          )}
          {profile.weeklyStudyPlan.length > 0 && (
            <WeeklyPlan items={profile.weeklyStudyPlan} />
          )}
          {profile.strengths.length > 0 && (
            <InsightList title="Fortalezas visibles" icon={Sparkles} items={profile.strengths} />
          )}
          {profile.weaknesses.length > 0 && (
            <InsightList title="Debilidades visibles" icon={ShieldAlert} items={profile.weaknesses} />
          )}
        </div>
      )}
    </div>
  );
}
