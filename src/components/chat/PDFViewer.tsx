// ===================================================================
// PDFViewer.tsx — Visor de PDF con descarga manual via fetch()
//
// 🛠️ FIXES:
// - Descarga manual del PDF usando fetch + Bearer token (evita CORS de pdfjs)
// - Worker de pdf.js via CDN en vez de import local (evita MIME type incorrecto en Fly.io)
// - Reintentos automáticos y safety reload si falla persistentemente
// - Cleanup correcto de blob URLs
// - onLoadError con logging detallado para debugging
// ===================================================================

import { useState, useEffect, useCallback, useMemo } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  X,
  BookOpen,
} from "lucide-react";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

import { cn } from "@/lib/utils";
import { tokenStorage } from "@/auth/authService";
import { ExerciseHighlighter } from "./ExerciseHighlighter";
import type { ActiveExercise } from "@/types/chat";

// Worker de pdf.js vía CDN (evita MIME type incorrecto en Fly.io)
pdfjs.GlobalWorkerOptions.workerSrc =
  `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

const DOCUMENT_BASE =
    import.meta.env.VITE_DOCUMENT_API_URL ?? "http://localhost:8083";

console.log(DOCUMENT_BASE);

interface Props {
  documentId: number;
  token: string;
  activeExercise: ActiveExercise | null;
  onClose: () => void;
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
}

export function PDFViewer({
  documentId,
  token,
  activeExercise,
  onClose,
  sidebarOpen,
  onToggleSidebar,
}: Props) {
  // Usar token de localStorage si el prop está expirado (pudo haber sido refrescado)
  const effectiveToken = useMemo(() => tokenStorage.getAccess() || token, [token]);
  const [numPages, setNumPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [pageHeight, setPageHeight] = useState(0);
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadAttempts, setLoadAttempts] = useState(0);
  const MAX_RETRIES = 3;

  // Descarga el PDF manualmente con fetch() y token Bearer
  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);

    async function loadPdf() {
      setPdfBlob(null);
      setFetchError(null);
      setCurrentPage(1);
      setNumPages(0);
      setPageHeight(0);

      if (!token) {
        setFetchError("No hay sesión activa");
        setIsLoading(false);
        return;
      }

      try {
        const res = await fetch(
            `${DOCUMENT_BASE}/documents/${documentId}/download`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
        );

        if (!res.ok) {
          const detail = res.status === 401
              ? "Sesión expirada. Recargá la página."
              : res.status === 404
                  ? "Documento no encontrado."
                  : `Error del servidor (${res.status})`;
          if (!cancelled) {
            setFetchError(detail);
            setIsLoading(false);
          }
          return;
        }

        const blob = await res.blob();

        if (blob.size === 0) {
          if (!cancelled) {
            setFetchError("Error de red al cargar el documento.");
            setIsLoading(false);
          }
          return;
        }

        if (!cancelled) {
          setPdfBlob(blob);
          setIsLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          console.error("[PDFViewer] Error en fetch:", err);
          setFetchError("Error de red al cargar el documento.");
          setIsLoading(false);
        }
      }
    }

    loadPdf();
    return () => { cancelled = true; };
  }, [documentId, token, loadAttempts]);

  // Reintento automático si falla — espera 3s y vuelve a intentar
  useEffect(() => {
    if (fetchError && loadAttempts < MAX_RETRIES) {
      const timer = setTimeout(() => {
        setLoadAttempts((prev) => prev + 1);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [fetchError, loadAttempts]);

  // Safety reload: si después de N reintentos sigue sin cargar, recarga la página
  useEffect(() => {
    if (loadAttempts >= MAX_RETRIES && fetchError) {
      const timer = setTimeout(() => {
        window.location.reload();
      }, 15000);
      return () => clearTimeout(timer);
    }
  }, [loadAttempts, fetchError]);

  // ======================================================
  // PDF callbacks
  // ======================================================

  const handleDocumentLoad = useCallback(
      ({ numPages }: { numPages: number }) => {
        setNumPages(numPages);
      },
      []
  );

  const handlePageLoad = useCallback(
      (page: { getViewport: (opts: { scale: number }) => { height: number } }) => {
        setPageHeight(page.getViewport({ scale: 1 }).height);
      },
      []
  );

  // ======================================================
  // Blob URL para react-pdf
  // ======================================================

  const pdfUrl = useMemo(() => {
    if (!pdfBlob) return null;
    return URL.createObjectURL(pdfBlob);
  }, [pdfBlob]);

  // Cleanup del blob URL al desmontar o cambiar
  useEffect(() => {
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [pdfUrl]);

  const showBboxHighlight =
      activeExercise?.bbox && pageHeight > 0 && activeExercise.page === currentPage;

  const showBannerHighlight =
      activeExercise && !activeExercise.bbox;

  return (
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* Controls bar */}
        <div className="flex shrink-0 items-center gap-2 border-b bg-muted/30 px-3 py-1.5">
          <div className="flex items-center gap-0.5">
            <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage <= 1 || isLoading}
                aria-label="Página anterior"
                className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:bg-muted disabled:opacity-40"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            <span className="min-w-[60px] text-center text-xs text-muted-foreground">
            {currentPage} / {numPages || "—"}
          </span>
            <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(numPages, p + 1))}
                disabled={currentPage >= numPages || isLoading}
                aria-label="Página siguiente"
                className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:bg-muted disabled:opacity-40"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="flex items-center gap-0.5">
            <button
                type="button"
                onClick={() => setScale((s) => Math.max(0.5, parseFloat((s - 0.25).toFixed(2))))}
                disabled={isLoading}
                aria-label="Reducir zoom"
                className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:bg-muted disabled:opacity-40"
            >
              <ZoomOut className="h-3.5 w-3.5" />
            </button>
            <span className="min-w-[40px] text-center text-xs text-muted-foreground">
            {Math.round(scale * 100)}%
          </span>
            <button
                type="button"
                onClick={() => setScale((s) => Math.min(3, parseFloat((s + 0.25).toFixed(2))))}
                disabled={isLoading}
                aria-label="Aumentar zoom"
                className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:bg-muted disabled:opacity-40"
            >
              <ZoomIn className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="flex-1" />

          <button
              type="button"
              onClick={onToggleSidebar}
              aria-label="Lista de ejercicios"
              className={cn(
                  "flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:bg-muted",
                  sidebarOpen && "bg-muted text-foreground"
              )}
          >
            <BookOpen className="h-3.5 w-3.5" />
          </button>

          <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar visor"
              className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:bg-muted"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Banner for exercises without bbox */}
        {showBannerHighlight && (
            <div className="sticky top-0 z-10 shrink-0 border-b border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-800 dark:border-amber-700 dark:bg-amber-900/30 dark:text-amber-200">
              Ejercicio {activeExercise.number} — Página {activeExercise.page}
            </div>
        )}

        {/* PDF content */}
        <div className="flex-1 overflow-auto bg-muted/20">
          <div className="flex justify-center p-2">
            <div className="relative inline-block" style={{ lineHeight: 0 }}>
              {fetchError ? (
                  <div className="flex h-48 w-48 items-center justify-center text-center text-xs text-destructive">
                    {fetchError}
                  </div>
              ) : !pdfUrl ? (
                  <div className="flex h-48 w-48 items-center justify-center">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  </div>
              ) : (
                  <Document
                      key={effectiveToken}
                      file={{ url: pdfUrl }}
                      onLoadSuccess={handleDocumentLoad}
                      onLoadError={(error) => {
                        console.error(
                            "[PDFViewer] Error al renderizar PDF:",
                            error
                        );

                        console.error(
                            "[PDFViewer] Detalles:",
                            JSON.stringify({
                              documentId,
                              numPages,
                              currentPage,
                              scale,
                              pdfUrl: pdfUrl?.substring(0, 50),
                            }, null, 2)
                        );

                        setFetchError(
                            "Error al renderizar el PDF."
                        );
                      }}
                      loading={
                        <div className="flex h-48 w-48 items-center justify-center">
                          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                        </div>
                      }
                      error={
                        <div className="flex h-48 w-48 items-center justify-center text-center text-xs text-destructive">
                          No se pudo renderizar el documento. Probá descargándolo.
                        </div>
                      }
                  >
                    <Page
                        pageNumber={currentPage}
                        scale={scale}
                        onLoadSuccess={handlePageLoad}
                        renderTextLayer={false}
                        renderAnnotationLayer={false}
                    />
                  </Document>
              )}
              {showBboxHighlight && (
                  <ExerciseHighlighter
                      bbox={activeExercise.bbox!}
                      scale={scale}
                      pageHeight={pageHeight}
                  />
              )}
            </div>
          </div>
        </div>
      </div>
  );
}
