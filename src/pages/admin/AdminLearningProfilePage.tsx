import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, BrainCircuit, Loader2, ShieldAlert } from "lucide-react";
import { useAuth } from "@/auth/useAuth";
import AdminConsoleNav from "@/components/admin/AdminConsoleNav";
import { LearningProfileLoading, LearningProfileOverview } from "@/components/learning/LearningProfileOverview";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
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
      <div className="mx-auto max-w-6xl px-4 pb-16 pt-6 sm:px-6">
        <AdminConsoleNav current="users" variant="surface" />

        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <Badge className="border-accent/30 bg-accent/10 text-accent hover:bg-accent/10">
                <BrainCircuit className="mr-1.5 h-3.5 w-3.5" />
                Perfil inspeccionado por admin
              </Badge>
              <Badge variant="outline" className="border-border bg-muted/20 text-muted-foreground">
                {decodedEmail}
              </Badge>
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              Perfil de aprendizaje del usuario
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
              Vista administrativa del dashboard de aprendizaje generado a partir de documentos, ejercicios detectados e interacciones reales.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button
              asChild
              variant="outline"
              className="border-border bg-background text-foreground hover:bg-muted"
            >
              <Link to="/admin/users">
                <ArrowLeft className="h-4 w-4" />
                Volver a usuarios
              </Link>
            </Button>
            <Button
              variant="outline"
              className="border-border bg-background text-foreground hover:bg-muted"
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

        <Separator className="mb-6" />

        {profileQuery.isLoading ? (
          <LearningProfileLoading />
        ) : profileQuery.isError ? (
          <Alert className="border-rose-500/30 bg-rose-500/10 text-rose-100">
            <ShieldAlert className="h-4 w-4" />
            <AlertTitle>No se pudo cargar el perfil</AlertTitle>
            <AlertDescription className="text-rose-50/90">
              {profileQuery.error instanceof Error ? profileQuery.error.message : "Ocurrió un error inesperado."}
            </AlertDescription>
          </Alert>
        ) : profileQuery.data ? (
          <LearningProfileOverview profile={profileQuery.data} />
        ) : null}
      </div>
    </div>
  );
}
