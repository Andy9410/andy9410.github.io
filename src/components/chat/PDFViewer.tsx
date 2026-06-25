import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Document, Page } from "react-pdf";
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  PanelBottom,
  PanelRight,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-react";

import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { configurePdfWorker } from "@/lib/pdfWorker";
import { detectExercisesFromPdf, mergeDetectedExercises } from "@/lib/pdfExerciseDetection";
import { cn } from "@/lib/utils";

import { ExerciseHighlighter } from "./ExerciseHighlighter";
import { ExerciseSidebar } from "./ExerciseSidebar";

import type { ActiveExercise } from "@/types/chat";
import type { DetectedExercise } from "@/types/pdfExercises";

configurePdfWorker();

const DOCUMENT_BASE = import.meta.env.VITE_DOCUMENT_API_URL ?? "http://localhost:8083";
const DESKTOP_BREAKPOINT = 960;
const MOBILE_BREAKPOINT = 720;

type PdfLayoutMode = "horizontal" | "vertical";

interface Props {
  documentId: number;
  token: string;
  activeExercise: ActiveExercise | null;
  onClose: () => void;
  exercises: DetectedExercise[];
  loadingExercises?: boolean;
  onExerciseSelect: (exercise: ActiveExercise) => void;
  onOpenExerciseWhiteboard?: (exercise: DetectedExercise) => void;
  onExercisesDetected?: (exercises: DetectedExercise[]) => void;
  docName?: string;
  pdfLayoutMode?: PdfLayoutMode;
  onPdfLayoutModeChange?: (mode: PdfLayoutMode) => void;
}

export function PDFViewer({
  documentId,
  token,
  activeExercise,
  onClose,
  exercises,
  loadingExercises = false,
  onExerciseSelect,
  onOpenExerciseWhiteboard,
  onExercisesDetected,
  docName,
  pdfLayoutMode = "vertical",
  onPdfLayoutModeChange,
}: Props) {
  const [numPages, setNumPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [scale, setScale] = useState(1);
  const [pageHeights, setPageHeights] = useState<Record<number, number>>({});
  const [pageWidths, setPageWidths] = useState<Record<number, number>>({});
  const [viewerWidth, setViewerWidth] = useState(0);
  const [pdfData, setPdfData] = useState<Uint8Array | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [renderError, setRenderError] = useState<string | null>(null);
  const [detectedExercises, setDetectedExercises] = useState<DetectedExercise[]>([]);
  const [detectingExercises, setDetectingExercises] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const shellRef = useRef<HTMLDivElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const pageRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const suppressScrollSyncRef = useRef(false);
  const autoCollapsedSidebarRef = useRef(false);

  const allExercises = useMemo(
    () => mergeDetectedExercises(detectedExercises, exercises),
    [detectedExercises, exercises]
  );

  useEffect(() => {
    setCurrentPage(1);
    setNumPages(0);
    setPageHeights({});
    setPageWidths({});
    setDetectedExercises([]);
    setSidebarCollapsed(false);
    autoCollapsedSidebarRef.current = false;
  }, [documentId]);

  useEffect(() => {
    const container = shellRef.current;
    if (!container) return;

    const observer = new ResizeObserver(([entry]) => {
      setViewerWidth(entry.contentRect.width);
    });

    observer.observe(container);
    setViewerWidth(container.clientWidth);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (viewerWidth === 0 || autoCollapsedSidebarRef.current) return;
    if (viewerWidth < MOBILE_BREAKPOINT) {
      setSidebarCollapsed(true);
      autoCollapsedSidebarRef.current = true;
    }
  }, [viewerWidth]);

  const isCompactLayout = viewerWidth > 0 && viewerWidth < DESKTOP_BREAKPOINT;
  const sidebarVisible = !sidebarCollapsed;
  const sidebarOverlay = isCompactLayout;
  const sidebarWidth = !sidebarOverlay && sidebarVisible ? 288 : 0;

  useEffect(() => {
    const controller = new AbortController();

    setPdfData(null);
    setLoadError(null);
    setRenderError(null);

    const loadPdf = async () => {
      try {
        if (!token) throw new Error("No hay sesión activa");

        const response = await fetch(`${DOCUMENT_BASE}/documents/${documentId}/download`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          signal: controller.signal,
        });

        if (response.status === 404) throw new Error("Documento no encontrado.");
        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const buffer = await response.arrayBuffer();
        if (buffer.byteLength === 0) throw new Error("Documento vacío.");

        const bytes = new Uint8Array(buffer);
        const header = new TextDecoder("ascii").decode(bytes.slice(0, 5));
        if (header !== "%PDF-") throw new Error(`Respuesta inválida (${header})`);

        setPdfData(bytes);
      } catch (error) {
        if (controller.signal.aborted) return;
        setLoadError(error instanceof Error ? error.message : "No se pudo cargar el PDF");
      }
    };

    void loadPdf();

    return () => controller.abort();
  }, [documentId, token]);

  useEffect(() => {
    if (!pdfData) return;

    let cancelled = false;
    setDetectingExercises(true);

    detectExercisesFromPdf(pdfData)
      .then((items) => {
        if (cancelled) return;
        setDetectedExercises(items);
        onExercisesDetected?.(items);
      })
      .catch((error) => {
        console.warn(error);
        if (!cancelled) setDetectedExercises([]);
      })
      .finally(() => {
        if (!cancelled) setDetectingExercises(false);
      });

    return () => {
      cancelled = true;
    };
  }, [pdfData, onExercisesDetected]);

  const handleDocumentLoad = useCallback(({ numPages: totalPages }: { numPages: number }) => {
    setNumPages(totalPages);
    setRenderError(null);
  }, []);

  const handleDocumentError = useCallback((error: Error) => {
    console.error("[PDFViewer] Error cargando PDF:", error);
    setRenderError(error.message);
  }, []);

  const handlePageLoad = useCallback(
    (
      pageNumber: number,
      page: {
        getViewport: (opts: { scale: number }) => { height: number; width: number };
      }
    ) => {
      const viewport = page.getViewport({ scale: 1 });

      setPageHeights((current) => ({ ...current, [pageNumber]: viewport.height }));
      setPageWidths((current) => ({ ...current, [pageNumber]: viewport.width }));
    },
    []
  );

  const basePageWidth = pageWidths[currentPage] ?? Object.values(pageWidths)[0] ?? 0;
  const horizontalPadding = isCompactLayout ? 32 : 48;
  const availablePageWidth = Math.max(220, viewerWidth - sidebarWidth - horizontalPadding);
  const fitScale =
    basePageWidth > 0 ? Math.min(1, Math.max(0.35, availablePageWidth / basePageWidth)) : 1;
  const renderedScale = parseFloat((scale * fitScale).toFixed(3));

  const scrollToPage = useCallback((pageNumber: number, topOffset = 0) => {
    const container = scrollRef.current;
    const page = pageRefs.current[pageNumber];
    if (!container || !page) return;

    suppressScrollSyncRef.current = true;
    container.scrollTo({
      top: Math.max(0, page.offsetTop + topOffset - 12),
      behavior: "smooth",
    });

    window.setTimeout(() => {
      suppressScrollSyncRef.current = false;
    }, 700);
  }, []);

  const scrollToExercise = useCallback(
    (exercise: ActiveExercise) => {
      const pageHeight = pageHeights[exercise.page] ?? 0;
      const bboxOffset =
        exercise.bbox && pageHeight > 0 ? (pageHeight - exercise.bbox.y1) * renderedScale - 72 : 0;

      setCurrentPage(exercise.page);
      scrollToPage(exercise.page, bboxOffset);
    },
    [pageHeights, renderedScale, scrollToPage]
  );

  useEffect(() => {
    if (!activeExercise?.number || !activeExercise?.page) return;
    scrollToExercise(activeExercise);
  }, [activeExercise, scrollToExercise]);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    const updateCurrentPage = () => {
      if (suppressScrollSyncRef.current) return;

      const scrollTop = container.scrollTop;
      const viewportCenter = scrollTop + container.clientHeight * 0.35;

      let bestPage = currentPage;
      let smallestDistance = Number.POSITIVE_INFINITY;

      for (let pageNumber = 1; pageNumber <= numPages; pageNumber += 1) {
        const page = pageRefs.current[pageNumber];
        if (!page) continue;

        const pageCenter = page.offsetTop + page.clientHeight / 2;
        const distance = Math.abs(pageCenter - viewportCenter);

        if (distance < smallestDistance) {
          smallestDistance = distance;
          bestPage = pageNumber;
        }
      }

      if (bestPage !== currentPage) {
        setCurrentPage(bestPage);
      }
    };

    container.addEventListener("scroll", updateCurrentPage, { passive: true });
    updateCurrentPage();

    return () => container.removeEventListener("scroll", updateCurrentPage);
  }, [currentPage, numPages, renderedScale]);

  const pdfFile = useMemo(() => {
    if (!pdfData) return null;
    return { data: pdfData.slice() };
  }, [pdfData]);

  const exerciseLoading = loadingExercises || detectingExercises;

  const handleExerciseSelect = useCallback(
    (exercise: ActiveExercise) => {
      onExerciseSelect(exercise);
      if (sidebarOverlay) setSidebarCollapsed(true);
    },
    [onExerciseSelect, sidebarOverlay]
  );

  const isPdfRight = pdfLayoutMode === "horizontal";

  return (
    <div className="flex h-full min-w-0 flex-1 flex-col overflow-hidden">
      <div className="flex shrink-0 items-center gap-2 border-b bg-muted/30 px-3 py-2">
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            onClick={() => scrollToPage(Math.max(1, currentPage - 1))}
            disabled={currentPage <= 1}
            className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted disabled:opacity-40"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          <span className="min-w-[60px] text-center text-xs text-muted-foreground">
            {currentPage} / {numPages || "?"}
          </span>

          <button
            type="button"
            onClick={() => scrollToPage(Math.min(numPages || 1, currentPage + 1))}
            disabled={currentPage >= numPages}
            className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted disabled:opacity-40"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        <div className="flex items-center gap-0.5">
          <button
            type="button"
            onClick={() => setScale((value) => Math.max(0.5, parseFloat((value - 0.25).toFixed(2))))}
            className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted"
          >
            <ZoomOut className="h-4 w-4" />
          </button>

          <span className="min-w-[44px] text-center text-xs text-muted-foreground">
            {Math.round(scale * 100)}%
          </span>

          <button
            type="button"
            onClick={() => setScale((value) => Math.min(3, parseFloat((value + 0.25).toFixed(2))))}
            className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted"
          >
            <ZoomIn className="h-4 w-4" />
          </button>
        </div>

        <button
          type="button"
          onClick={() => setSidebarCollapsed((value) => !value)}
          aria-label={sidebarCollapsed ? "Mostrar índice" : "Ocultar índice"}
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-md border border-transparent text-muted-foreground transition-colors hover:bg-muted",
            !sidebarCollapsed && "border-border/70 bg-background text-foreground shadow-sm"
          )}
        >
          <BookOpen className="h-4 w-4" />
        </button>

        <div className="min-w-0 flex-1">
          {docName && (
            <p className="truncate text-center text-xs font-medium text-muted-foreground">
              {docName}
            </p>
          )}
        </div>

        <ToggleGroup
          type="single"
          value={isPdfRight ? "horizontal" : "vertical"}
          onValueChange={(value) => {
            if (!value) return;
            onPdfLayoutModeChange?.(value === "horizontal" ? "horizontal" : "vertical");
          }}
          className="rounded-lg border bg-background shadow-sm"
        >
          <ToggleGroupItem value="vertical" className="flex items-center gap-1.5 px-3" aria-label="PDF abajo">
            <PanelBottom className="h-3.5 w-3.5" />
          </ToggleGroupItem>

          <ToggleGroupItem value="horizontal" className="flex items-center gap-1.5 px-3" aria-label="PDF lateral">
            <PanelRight className="h-3.5 w-3.5" />
          </ToggleGroupItem>
        </ToggleGroup>

        <button
          type="button"
          aria-label="Cerrar visor"
          onClick={onClose}
          className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div ref={shellRef} className="relative flex min-h-0 flex-1 overflow-hidden bg-muted/20">
        {sidebarOverlay && sidebarVisible && (
          <>
            <div
              className="absolute inset-0 z-20 bg-background/35 backdrop-blur-[1px]"
              onClick={() => setSidebarCollapsed(true)}
            />
            <ExerciseSidebar
              exercises={allExercises}
              loading={exerciseLoading}
              collapsed={false}
              compact
              activeExercise={activeExercise}
              onExerciseSelect={handleExerciseSelect}
              onOpenWhiteboard={onOpenExerciseWhiteboard}
              onToggle={() => setSidebarCollapsed(true)}
            />
          </>
        )}

        {!sidebarVisible && (
          <button
            type="button"
            onClick={() => setSidebarCollapsed(false)}
            aria-label="Mostrar índice de ejercicios"
            className="absolute right-3 top-3 z-20 inline-flex h-9 w-9 items-center justify-center rounded-full border border-border/70 bg-background/95 text-muted-foreground shadow-sm backdrop-blur transition-colors hover:bg-muted hover:text-foreground"
          >
            <BookOpen className="h-4 w-4" />
          </button>
        )}

        <div className="relative min-w-0 flex-1 overflow-hidden">
          <div ref={scrollRef} className="absolute inset-0 overflow-auto bg-muted/30">
            <div className="flex min-h-full flex-col items-center px-4 py-5 sm:px-6">
              {activeExercise && !activeExercise.bbox && (
                <div className="mb-4 rounded-md border border-primary/20 bg-primary/10 px-3 py-2 text-xs text-primary">
                  Ejercicio {activeExercise.number} activo · Página {activeExercise.page}
                </div>
              )}

              {loadError || renderError ? (
                <div className="flex h-48 w-64 items-center justify-center text-center text-xs text-destructive">
                  {loadError ? "Error al cargar el PDF:" : "Error al renderizar el PDF:"}{" "}
                  {loadError || renderError}
                </div>
              ) : !pdfFile ? (
                <div className="flex h-48 w-48 items-center justify-center">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                </div>
              ) : (
                <Document
                  file={pdfFile}
                  onLoadSuccess={handleDocumentLoad}
                  onLoadError={handleDocumentError}
                  error={
                    <div className="flex h-48 w-64 items-center justify-center text-center text-xs text-destructive">
                      Error al renderizar el PDF: {renderError || "No se pudo renderizar el PDF"}
                    </div>
                  }
                >
                  <div className="mx-auto flex w-fit flex-col items-center gap-5">
                    {Array.from({ length: numPages }, (_, index) => {
                      const pageNumber = index + 1;
                      const pageHeight = pageHeights[pageNumber] ?? 0;
                      const isActivePage = activeExercise?.page === pageNumber;

                      return (
                        <div
                          key={pageNumber}
                          ref={(node) => {
                            pageRefs.current[pageNumber] = node;
                          }}
                          className={cn(
                            "relative overflow-hidden rounded-lg bg-white shadow-lg ring-1 ring-border/60 transition-shadow",
                            isActivePage && "shadow-xl ring-primary/20"
                          )}
                        >
                          <Page
                            pageNumber={pageNumber}
                            scale={renderedScale}
                            onLoadSuccess={(page) => handlePageLoad(pageNumber, page)}
                            renderTextLayer={false}
                            renderAnnotationLayer={false}
                          />

                          {isActivePage && activeExercise?.bbox && pageHeight > 0 && (
                            <ExerciseHighlighter
                              bbox={activeExercise.bbox}
                              scale={renderedScale}
                              pageHeight={pageHeight}
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </Document>
              )}
            </div>
          </div>
        </div>

        {!sidebarOverlay && (
          <ExerciseSidebar
            exercises={allExercises}
            loading={exerciseLoading}
            collapsed={sidebarCollapsed}
            compact={false}
            activeExercise={activeExercise}
            onExerciseSelect={handleExerciseSelect}
            onOpenWhiteboard={onOpenExerciseWhiteboard}
            onToggle={() => setSidebarCollapsed(true)}
          />
        )}
      </div>
    </div>
  );
}
