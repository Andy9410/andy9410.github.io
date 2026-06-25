import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, BrainCircuit, Loader2, ShieldAlert, Sparkles } from "lucide-react";
import { useAuth } from "@/auth/useAuth";
import AdminConsoleNav from "@/components/admin/AdminConsoleNav";
import { LearningProfileLoading, LearningProfileOverview } from "@/components/learning/LearningProfileOverview";
import { StatusBadge, surfaceCardClassName } from "@/components/learning/LearningProfilePrimitives";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { fetchAdminLearningProfile } from "@/services/learningProfileApi";

export default function AdminLearningProfilePage() {
  const { email = "" } = useParams();
  const decodedEmail = decodeURIComponent(email);
  const { isAuthenticated, refreshAccessToken } = useAuth();

  const profileQuery = useQuery({
    queryKey: ["admin-learning-profile-page", decodedEmail],
    queryFn: () => fetchAdminLearningProfile(decodedEmail, refreshAccessToken),
    enabled: isAuthenticated && !!decodedEmail,
    staleTime: 30_000,
    retry: 1,
  });

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-7xl px-4 pb-16 pt-6 sm:px-6 lg:px-8">
        <AdminConsoleNav current="users" variant="surface" />

        <section className={cn(surfaceCardClassName, "mb-8 overflow-hidden p-5 sm:p-6 lg:p-8")}>
          <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-4xl space-y-5">
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge className="border-cyan-500/20 bg-cyan-500/10 text-cyan-700 dark:text-cyan-100">
                  <Sparkles className="h-3.5 w-3.5" />
                  Vista administrativa inteligente
                </StatusBadge>
                <StatusBadge className="border-border/70 bg-muted/35 text-muted-foreground">
                  <BrainCircuit className="h-3.5 w-3.5" />
                  Perfil inspeccionado por admin
                </StatusBadge>
              </div>

              <div className="space-y-3">
                <h1 className="text-[2.35rem] font-semibold tracking-[-0.03em] text-foreground sm:text-[3rem] lg:text-[3.4rem]">
                  Perfil de aprendizaje del usuario
                </h1>
                <p className="max-w-3xl text-sm leading-7 text-muted-foreground sm:text-base">
                  Vista administrativa del dashboard de aprendizaje generado a partir de documentos,
                  ejercicios detectados e interacciones reales. La lectura prioriza confianza,
                  madurez y capacidad de automatizacion.
                </p>
              </div>

              <div className="inline-flex max-w-full items-center gap-2 rounded-2xl border border-border/70 bg-muted/25 px-3 py-2 text-sm text-muted-foreground">
                <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-border/70 bg-background/80 text-foreground">
                  {decodedEmail.slice(0, 1).toUpperCase()}
                </span>
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                    Usuario inspeccionado
                  </p>
                  <p className="truncate text-sm font-medium text-foreground">{decodedEmail}</p>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row xl:justify-end">
              <Button
                asChild
                variant="outline"
                className="h-11 rounded-xl border-border/70 bg-background/80 px-4 text-foreground shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-muted"
              >
                <Link to="/admin/users">
                  <ArrowLeft className="h-4 w-4" />
                  Volver a usuarios
                </Link>
              </Button>
              <Button
                variant="outline"
                className="h-11 rounded-xl border-border/70 bg-background/80 px-4 text-foreground shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-muted"
                onClick={() => void profileQuery.refetch()}
              >
                {profileQuery.isFetching ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <BrainCircuit className="h-4 w-4" />
                )}
                Actualizar
              </Button>
            </div>
          </div>
        </section>

        {profileQuery.isLoading ? (
          <LearningProfileLoading />
        ) : profileQuery.isError ? (
          <Alert className="rounded-3xl border-rose-500/25 bg-rose-500/10 text-rose-950 dark:text-rose-100">
            <ShieldAlert className="h-4 w-4" />
            <AlertTitle>No se pudo cargar el perfil</AlertTitle>
            <AlertDescription className="text-sm leading-6 text-rose-900/80 dark:text-rose-50/90">
              {profileQuery.error instanceof Error ? profileQuery.error.message : "Ocurrio un error inesperado."}
            </AlertDescription>
          </Alert>
        ) : profileQuery.data ? (
          <LearningProfileOverview profile={profileQuery.data} />
        ) : null}
      </div>
    </div>
  );
}
