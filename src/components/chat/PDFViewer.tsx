import { useState, useEffect, useCallback, useMemo } from "react";
import { Document, Page } from "react-pdf";
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
import { ExerciseHighlighter } from "./ExerciseHighlighter";
import type { ActiveExercise } from "@/types/chat";

const DOCUMENT_BASE =
    import.meta.env.VITE_DOCUMENT_API_URL ?? "http://localhost:8083";

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
  const [numPages, setNumPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [pageHeight, setPageHeight] = useState(0);
  const [pdfData, setPdfData] = useState<Uint8Array | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [renderError, setRenderError] = useState<string | null>(null);

  // ======================================================
  // Reset cuando cambia documento
  // ======================================================

  useEffect(() => {
    setCurrentPage(1);
    setNumPages(0);
    setPageHeight(0);
  }, [documentId]);

  useEffect(() => {
    const controller = new AbortController();

    setPdfData(null);
    setLoadError(null);
    setRenderError(null);

    const loadPdf = async () => {
      try {
        const response = await fetch(
          `${DOCUMENT_BASE}/documents/${documentId}/download`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            signal: controller.signal,
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const buffer = await response.arrayBuffer();
        if (buffer.byteLength === 0) {
          throw new Error("El documento está vacío.");
        }

        const bytes = new Uint8Array(buffer);
        const header = new TextDecoder("ascii").decode(bytes.slice(0, 5));
        if (header !== "%PDF-") {
          throw new Error(`Respuesta inválida (${header || "sin cabecera PDF"})`);
        }

        setPdfData(bytes);
      } catch (error) {
        if (controller.signal.aborted) return;
        const message =
          error instanceof Error
            ? error.message
            : "No se pudo cargar el documento.";
        setLoadError(message);
      }
    };

    loadPdf();

    return () => {
      controller.abort();
    };
  }, [documentId, token]);

  // ======================================================
  // Navegar automáticamente al ejercicio
  // ======================================================

  useEffect(() => {
    if (
        activeExercise?.page &&
        activeExercise.page !== currentPage
    ) {
      setCurrentPage(activeExercise.page);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeExercise?.page]);

  // ======================================================
  // Callbacks PDF
  // ======================================================

  const handleDocumentLoad = useCallback(
      ({ numPages }: { numPages: number }) => {
        setNumPages(numPages);
      },
      []
  );

  const handlePageLoad = useCallback(
      (page: {
        getViewport: (opts: {
          scale: number;
        }) => { height: number };
      }) => {
        setPageHeight(
            page.getViewport({ scale: 1 }).height
        );
      },
      []
  );

  const showBannerHighlight =
      activeExercise && !activeExercise.bbox;

  const showBboxHighlight =
      activeExercise?.bbox &&
      pageHeight > 0 &&
      activeExercise.page === currentPage;

  const pdfFile = useMemo(() => {
    if (!pdfData) return null;

    return {
      data: pdfData.slice(),
    };
  }, [pdfData]);

  // ======================================================

  return (
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* ====================================================== */}
        {/* Toolbar */}
        {/* ====================================================== */}

        <div className="flex shrink-0 items-center gap-2 border-b bg-muted/30 px-3 py-1.5">
          {/* Navegación */}

          <div className="flex items-center gap-0.5">
            <button
                type="button"
                onClick={() =>
                    setCurrentPage((p) =>
                        Math.max(1, p - 1)
                    )
                }
                disabled={currentPage <= 1}
                aria-label="Página anterior"
                className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:bg-muted disabled:opacity-40"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>

            <span className="min-w-[60px] text-center text-xs text-muted-foreground">
            {currentPage} / {numPages || "?"}
          </span>

            <button
                type="button"
                onClick={() =>
                    setCurrentPage((p) =>
                        Math.min(numPages, p + 1)
                    )
                }
                disabled={currentPage >= numPages}
                aria-label="Página siguiente"
                className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:bg-muted disabled:opacity-40"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Zoom */}

          <div className="flex items-center gap-0.5">
            <button
                type="button"
                onClick={() =>
                    setScale((s) =>
                        Math.max(
                            0.5,
                            parseFloat((s - 0.25).toFixed(2))
                        )
                    )
                }
                aria-label="Reducir zoom"
                className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:bg-muted"
            >
              <ZoomOut className="h-3.5 w-3.5" />
            </button>

            <span className="min-w-[40px] text-center text-xs text-muted-foreground">
            {Math.round(scale * 100)}%
          </span>

            <button
                type="button"
                onClick={() =>
                    setScale((s) =>
                        Math.min(
                            3,
                            parseFloat((s + 0.25).toFixed(2))
                        )
                    )
                }
                aria-label="Aumentar zoom"
                className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:bg-muted"
            >
              <ZoomIn className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="flex-1" />

          {/* Sidebar */}

          <button
              type="button"
              onClick={onToggleSidebar}
              aria-label="Lista de ejercicios"
              className={cn(
                  "flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:bg-muted",
                  sidebarOpen &&
                  "bg-muted text-foreground"
              )}
          >
            <BookOpen className="h-3.5 w-3.5" />
          </button>

          {/* Close */}

          <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar visor"
              className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:bg-muted"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* ====================================================== */}
        {/* Banner */}
        {/* ====================================================== */}

        {showBannerHighlight && (
            <div className="sticky top-0 z-10 shrink-0 border-b border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-800 dark:border-amber-700 dark:bg-amber-900/30 dark:text-amber-200">
              Ejercicio {activeExercise.number} — Página{" "}
              {activeExercise.page}
            </div>
        )}

        {/* ====================================================== */}
        {/* PDF */}
        {/* ====================================================== */}

        <div className="flex-1 overflow-auto bg-muted/20">
          <div className="flex justify-center p-2">
            <div
                style={{
                  position: "relative",
                  display: "inline-block",
                  lineHeight: 0,
                }}
            >
              {loadError ? (
                  <div className="flex h-48 w-64 items-center justify-center text-center text-xs text-destructive">
                    Error al cargar el PDF: {loadError}
                  </div>
              ) : !pdfFile ? (
                  <div className="flex h-48 w-48 items-center justify-center">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  </div>
              ) : (
                  <Document
                      file={pdfFile}
                      onLoadSuccess={handleDocumentLoad}
                      onLoadError={(error) => {
                        const message =
                            error instanceof Error
                                ? error.message
                                : "No se pudo interpretar el PDF.";
                        setRenderError(message);
                        console.error(
                            "[PDFViewer] Error cargando PDF:",
                            error
                        );

                        console.error(
                            "[PDFViewer] Details:",
                            {
                              documentId,
                              currentPage,
                              scale,
                              pdfUrl: `${DOCUMENT_BASE}/documents/${documentId}/download`,
                            }
                        );
                      }}
                      loading={
                        <div className="flex h-48 w-48 items-center justify-center">
                          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                        </div>
                      }
                      error={
                        <div className="flex h-48 w-72 items-center justify-center text-center text-xs text-destructive">
                          Error al renderizar el PDF{renderError ? `: ${renderError}` : "."}
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

              {/* Highlight */}

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
