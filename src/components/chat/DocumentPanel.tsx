import { useState, useCallback, useEffect, useRef } from "react";
import { FilePlus, FileText, Trash2, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { uploadDocuments, deleteDocumentApi } from "@/services/documentApi";
import type { UploadResult } from "@/services/documentApi";
import { tokenStorage, refreshTokens } from "@/auth/authService";
import { useDocuments } from "@/hooks/useDocuments";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  token: string;
  onUploadSuccess?: (documentId: number) => void;
  onDocumentOpen?: (id: number, name: string) => void;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

const isSuccess = (r: UploadResult) =>
  r.status === "ok" || r.status === "ready" || r.status === "duplicate";

const DocumentPanel = ({ isOpen, onClose, token, onUploadSuccess, onDocumentOpen }: Props) => {
  const { documents, refresh: fetchDocs, loading } = useDocuments(token);
  const [uploading, setUploading] = useState(false);
  const [uploadResults, setUploadResults] = useState<UploadResult[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      fetchDocs();
    } else {
      setUploadResults([]);
    }
  }, [isOpen, fetchDocs]);

  const refreshTokenIfNeeded = useCallback(async (currentToken: string): Promise<string> => {
    const rt = tokenStorage.getRefresh();
    if (tokenStorage.isExpired() && rt) {
      try {
        const resp = await refreshTokens(rt);
        tokenStorage.save(resp);
        return resp.accessToken;
      } catch {
        return currentToken;
      }
    }
    return currentToken;
  }, []);

  const handleFiles = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return;
      const arr = Array.from(files);
      setUploading(true);
      setUploadResults([]);

      // Refrescar token si está por expirar antes de intentar la subida
      const freshToken = await refreshTokenIfNeeded(token);

      const doUpload = (t: string) => uploadDocuments(arr, t);

      try {
        const results = await doUpload(freshToken).catch(async (err: Error) => {
          if (err.message === "401") {
            const rt = tokenStorage.getRefresh();
            if (!rt) throw err;
            const resp = await refreshTokens(rt);
            tokenStorage.save(resp);
            return doUpload(resp.accessToken);
          }
          throw err;
        });
        setUploadResults(results);
        await fetchDocs();
        const firstSuccess = results.find(isSuccess);
        if (firstSuccess?.document_id) onUploadSuccess?.(firstSuccess.document_id);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Error desconocido";
        const label =
          msg === "401" ? "Sesión expirada — recargá la página o volvé a iniciar sesión." :
          msg === "422" ? "Formato de archivo no aceptado." :
          msg === "500" ? "Error interno del servidor." :
          msg.startsWith("TypeError") ? "No se pudo conectar con el servidor." :
          `Error ${msg}`;
        setUploadResults(
          arr.map((f) => ({
            document_id: null,
            filename: f.name,
            chunk_count: 0,
            page_count: null,
            file_type: null,
            status: "error",
            message: label,
          }))
        );
      } finally {
        setUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    },
    [token, fetchDocs, refreshTokenIfNeeded, onUploadSuccess]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles]
  );

  const handleDelete = useCallback(
    async (id: number) => {
      setDeletingId(id);
      try {
        await deleteDocumentApi(id, token);
        await fetchDocs();
      } catch (error) {
        console.error("[DocumentPanel] Error eliminando documento:", error);
      } finally {
        setDeletingId(null);
      }
    },
    [token, fetchDocs]
  );

  return (
    <>
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="right"
        className="flex w-[360px] flex-col p-0 sm:w-[400px]"
      >
        <SheetHeader className="border-b border-border px-5 py-4">
          <SheetTitle className="text-sm font-semibold">Mis documentos</SheetTitle>
        </SheetHeader>

        <div className="flex flex-1 flex-col gap-4 overflow-hidden">
          {/* Upload zone */}
          <div className="px-5 pt-4">
            <div
              onDragOver={(e) => {
                e.preventDefault();
                if (!isDragging) setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => !uploading && fileInputRef.current?.click()}
              className={cn(
                "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-6 text-center transition-colors",
                isDragging
                  ? "border-cyan-400/60 bg-cyan-400/5"
                  : "border-border hover:border-muted-foreground/30 hover:bg-muted/30",
                uploading && "pointer-events-none opacity-60"
              )}
            >
              {uploading ? (
                <>
                  <Loader2 className="h-7 w-7 animate-spin text-cyan-400" />
                  <p className="text-xs text-muted-foreground">Procesando documentos…</p>
                </>
              ) : (
                <>
                  <FilePlus className="h-7 w-7 text-muted-foreground/50" />
                  <div>
                    <p className="text-xs font-medium text-foreground">Subir documentos</p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                      PDF · máx. 5 archivos · 20 MB c/u
                    </p>
                  </div>
                </>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,application/pdf"
              multiple
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
            />
          </div>

          {/* Upload results */}
          {uploadResults.length > 0 && (
            <div className="space-y-1.5 px-5">
              {uploadResults.map((r, i) => (
                <div
                  key={i}
                  className={cn(
                    "flex items-start gap-2.5 rounded-lg px-3 py-2 text-xs",
                    isSuccess(r)
                      ? "bg-teal-500/10 text-teal-400"
                      : "bg-destructive/10 text-destructive"
                  )}
                >
                  {isSuccess(r) ? (
                    <CheckCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  ) : (
                    <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  )}
                  <div className="min-w-0">
                    <p className="truncate font-medium">{r.filename}</p>
                    {r.status === "ok" || r.status === "ready" ? (
                      <p className="text-[11px] opacity-70">
                        {r.chunk_count} fragmentos · {r.page_count ?? "?"} págs
                      </p>
                    ) : r.status === "duplicate" ? (
                      <p className="text-[11px] opacity-70">Ya estaba subido — usando versión existente</p>
                    ) : (
                      <p className="text-[11px] opacity-70">{r.message}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          <Separator />

          {/* Document list */}
          <div className="flex min-h-0 flex-1 flex-col">
            <p className="px-5 pb-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground/60">
              {loading
                ? "Cargando…"
                : `${documents.length} documento${documents.length !== 1 ? "s" : ""}`}
            </p>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground/40" />
              </div>
            ) : documents.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-12 text-center">
                <FileText className="h-8 w-8 text-muted-foreground/20" />
                <p className="text-xs text-muted-foreground">
                  Todavía no subiste ningún documento
                </p>
              </div>
            ) : (
              <ScrollArea className="flex-1 px-5">
                <div className="space-y-1.5 pb-6">
                  {documents.map((doc) => {
                    const canOpen = onDocumentOpen && doc.download_available !== false;
                    return (
                    <div
                      key={doc.id}
                      onClick={() => { if (canOpen) { onDocumentOpen(doc.id, doc.filename); onClose(); } }}
                      className={cn(
                        "flex items-start gap-3 rounded-lg border border-border bg-card px-3 py-2.5 text-xs transition-colors",
                        canOpen && "cursor-pointer hover:border-cyan-400/40 hover:bg-cyan-400/5"
                      )}
                    >
                      <FileText className="mt-0.5 h-4 w-4 shrink-0 text-cyan-400/70" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-foreground">{doc.filename}</p>
                        <p className="mt-0.5 text-[10px] text-muted-foreground/60">
                          {formatDate(doc.upload_date)} · {doc.chunk_count} fragmentos
                          {doc.page_count ? ` · ${doc.page_count} págs` : ""}
                        </p>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); setPendingDeleteId(doc.id); }}
                        disabled={deletingId === doc.id}
                        aria-label="Eliminar documento"
                        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-destructive/60 transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-40"
                      >
                        {deletingId === doc.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Trash2 className="h-3 w-3" />
                        )}
                      </button>
                    </div>
                    );
                  })}
                </div>
              </ScrollArea>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>

      <AlertDialog open={pendingDeleteId !== null} onOpenChange={(open) => { if (!open) setPendingDeleteId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar documento?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El documento será eliminado permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (pendingDeleteId !== null) handleDelete(pendingDeleteId);
                setPendingDeleteId(null);
              }}
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default DocumentPanel;
