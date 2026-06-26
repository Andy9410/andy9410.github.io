import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  BrainCircuit,
  Loader2,
  ShieldAlert,
  Sparkles,
  WandSparkles,
} from "lucide-react";

import { useAuth } from "@/auth/useAuth";
import { LearningHeader, StatusBadge, pageGlowClassName } from "@/components/learning/LearningProfilePrimitives";
import {
  LearningProfileLoading,
  LearningProfileOverview,
} from "@/components/learning/LearningProfileOverview";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { fetchLearningProfile } from "@/services/learningProfileApi";

export default function LearningProfilePage() {
  const { isAuthenticated, refreshAccessToken, user } = useAuth();

  const profileQuery = useQuery({
    queryKey: ["learning-profile", user?.email],
    queryFn: () => fetchLearningProfile(refreshAccessToken),
    enabled: isAuthenticated,
    staleTime: 30_000,
    retry: 1,
  });

  return (
    <div className={cn("min-h-screen bg-background text-foreground", pageGlowClassName)}>
      <div className="mx-auto max-w-7xl px-4 pb-12 pt-4 sm:px-6 lg:px-8">
        <LearningHeader
          title="Completar el perfil del estudiante"
          description="Usamos tu actividad real para mostrar recomendaciones, avances y un plan semanal claro."
          badges={
            <>
              <StatusBadge className="border-indigo-200/80 bg-indigo-500/10 text-indigo-700 dark:border-indigo-500/25 dark:bg-indigo-500/10 dark:text-indigo-100">
                <BrainCircuit className="h-3.5 w-3.5" />
                Perfil en progreso
              </StatusBadge>
              <StatusBadge className="border-emerald-200/80 bg-emerald-500/10 text-emerald-700 dark:border-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-100">
                <WandSparkles className="h-3.5 w-3.5" />
                Actividad real
              </StatusBadge>
            </>
          }
          actions={
            <>
              <Button
                asChild
                variant="outline"
                className="h-11 rounded-xl border-slate-200/80 bg-white/85 px-4 text-slate-900 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-slate-50 dark:border-slate-700/80 dark:bg-slate-950/80 dark:text-slate-100 dark:hover:bg-slate-900"
              >
                <Link to="/chat">
                  <ArrowLeft className="h-4 w-4" />
                  Volver a TutorIA
                </Link>
              </Button>
              <Button
                variant="outline"
                className="h-11 rounded-xl border-slate-200/80 bg-white/85 px-4 text-slate-900 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-slate-50 dark:border-slate-700/80 dark:bg-slate-950/80 dark:text-slate-100 dark:hover:bg-slate-900"
                onClick={() => void profileQuery.refetch()}
              >
                {profileQuery.isFetching ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
                Actualizar
              </Button>
            </>
          }
        />

        <div className="mt-5">
          {profileQuery.isLoading ? (
            <LearningProfileLoading />
          ) : profileQuery.isError ? (
            <Alert className="rounded-[28px] border-rose-200/80 bg-rose-500/10 text-rose-950 dark:border-rose-500/25 dark:bg-rose-500/10 dark:text-rose-100">
              <ShieldAlert className="h-4 w-4" />
              <AlertTitle>No se pudo cargar el perfil</AlertTitle>
              <AlertDescription className="text-sm leading-6 text-rose-900/80 dark:text-rose-50/90">
                {profileQuery.error instanceof Error
                  ? profileQuery.error.message
                  : "Ocurrio un error inesperado."}
              </AlertDescription>
            </Alert>
          ) : profileQuery.data ? (
            <LearningProfileOverview profile={profileQuery.data} />
          ) : null}
        </div>
      </div>
    </div>
  );
}
