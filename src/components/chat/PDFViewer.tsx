import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Document, Page } from "react-pdf";
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  X,
  BookOpen,
  PanelBottom,
  PanelRight,
} from "lucide-react";

import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group";

import { configurePdfWorker } from "@/lib/pdfWorker";
import {
  mergeDetectedExercises,
  detectExercisesFromPdf,
} from "@/lib/pdfExerciseDetection";

import { cn } from "@/lib/utils";

import { ExerciseHighlighter } from "./ExerciseHighlighter";
import { ExerciseSidebar } from "./ExerciseSidebar";

import type { ActiveExercise } from "@/types/chat";
import type { DetectedExercise } from "@/types/pdfExercises";

configurePdfWorker();

const DOCUMENT_BASE =
    import.meta.env.VITE_DOCUMENT_API_URL ?? "http://localhost:8083";

type PdfLayoutMode = "horizontal" | "vertical";

interface Props {
  documentId: number;
  token: string;
  activeExercise: ActiveExercise | null;
  onClose: () => void;

  exercises: DetectedExercise[];
  loadingExercises?: boolean;

  onExerciseSelect: (exercise: ActiveExercise) => void;
  onExercisesDetected?: (exercises: DetectedExercise[]) => void;

  docName?: string;

  pdfLayoutMode?: PdfLayoutMode;
  onPdfLayoutModeChange?: (mode: PdfLayoutMode) => void;
}

function toActiveExercise(
    exercise: DetectedExercise,
): ActiveExercise {
  return {
    number: exercise.id,
    page: exercise.pageNumber,
    bbox: exercise.boundingBox,
    title: exercise.title,
  };
}

export function PDFViewer({
                            documentId,
                            token,
                            activeExercise,
                            onClose,

                            exercises,
                            loadingExercises = false,

                            onExerciseSelect,
                            onExercisesDetected,

                            docName,

                            pdfLayoutMode = "vertical",
                            onPdfLayoutModeChange,
                          }: Props) {
  const [numPages, setNumPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

  const [scale, setScale] = useState(1.0);

  const [pageHeights, setPageHeights] = useState<
      Record<number, number>
  >({});

  const [pageWidths, setPageWidths] = useState<
      Record<number, number>
  >({});

  const [containerWidth, setContainerWidth] = useState(0);

  const [pdfData, setPdfData] =
      useState<Uint8Array | null>(null);

  const [loadError, setLoadError] = useState<string | null>(
      null,
  );

  const [renderError, setRenderError] =
      useState<string | null>(null);

  const [detectedExercises, setDetectedExercises] =
      useState<DetectedExercise[]>([]);

  const [detectingExercises, setDetectingExercises] =
      useState(false);

  const [sidebarCollapsed, setSidebarCollapsed] =
      useState(false);

  const scrollRef = useRef<HTMLDivElement | null>(null);

  const pageRefs = useRef<
      Record<number, HTMLDivElement | null>
  >({});

  const suppressScrollSyncRef = useRef(false);

  const autoCollapsedSidebarRef = useRef(false);

  const allExercises = useMemo(
      () =>
          mergeDetectedExercises(
              detectedExercises,
              exercises,
          ),
      [detectedExercises, exercises],
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
    const container = scrollRef.current;

    if (!container) return;

    const observer = new ResizeObserver(([entry]) => {
      setContainerWidth(entry.contentRect.width);
    });

    observer.observe(container);

    setContainerWidth(container.clientWidth);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    setPdfData(null);
    setLoadError(null);
    setRenderError(null);

    const loadPdf = async () => {
      try {
        if (!token) {
          throw new Error("No hay sesión activa");
        }

        const response = await fetch(
            `${DOCUMENT_BASE}/documents/${documentId}/download`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
              signal: controller.signal,
            },
        );

        if (response.status === 404) {
          throw new Error(
              "Documento no encontrado.",
          );
        }

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const buffer = await response.arrayBuffer();

        if (buffer.byteLength === 0) {
          throw new Error("Documento vacío.");
        }

        const bytes = new Uint8Array(buffer);

        const header = new TextDecoder("ascii").decode(
            bytes.slice(0, 5),
        );

        if (header !== "%PDF-") {
          throw new Error(
              `Respuesta inválida (${header})`,
          );
        }

        setPdfData(bytes);
      } catch (error) {
        if (controller.signal.aborted) return;

        setLoadError(
            error instanceof Error
                ? error.message
                : "No se pudo cargar el PDF",
        );
      }
    };

    loadPdf();

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

          if (!cancelled) {
            setDetectedExercises([]);
          }
        })
        .finally(() => {
          if (!cancelled) {
            setDetectingExercises(false);
          }
        });

    return () => {
      cancelled = true;
    };
  }, [pdfData, onExercisesDetected]);

  const handleDocumentLoad = useCallback(
      ({ numPages }: { numPages: number }) => {
        setNumPages(numPages);
        setRenderError(null);
      },
      [],
  );

  const handleDocumentError = useCallback((error: Error) => {
    console.error("[PDFViewer] Error cargando PDF:", error);
    setRenderError(error.message);
  }, []);

  const handlePageLoad = useCallback(
      (
          pageNumber: number,
          page: {
            getViewport: (opts: {
              scale: number;
            }) => {
              height: number;
              width: number;
            };
          },
      ) => {
        const viewport = page.getViewport({
          scale: 1,
        });

        setPageHeights((current) => ({
          ...current,
          [pageNumber]: viewport.height,
        }));

        setPageWidths((current) => ({
          ...current,
          [pageNumber]: viewport.width,
        }));
      },
      [],
  );

  const basePageWidth =
      pageWidths[currentPage] ??
      Object.values(pageWidths)[0] ??
      0;

  const reservedSidebarWidth = sidebarCollapsed
      ? 0
      : 252;

  const availablePageWidth = Math.max(
      220,
      containerWidth - reservedSidebarWidth - 32,
  );

  const fitScale =
      basePageWidth > 0
          ? Math.min(
              1,
              Math.max(
                  0.35,
                  availablePageWidth / basePageWidth,
              ),
          )
          : 1;

  const renderedScale = parseFloat(
      (scale * fitScale).toFixed(3),
  );

  useEffect(() => {
    if (
        autoCollapsedSidebarRef.current ||
        containerWidth === 0
    ) {
      return;
    }

    if (containerWidth < 760) {
      setSidebarCollapsed(true);
      autoCollapsedSidebarRef.current = true;
    }
  }, [containerWidth]);

  const scrollToPage = useCallback(
      (pageNumber: number, topOffset = 0) => {
        const container = scrollRef.current;

        const page = pageRefs.current[pageNumber];

        if (!container || !page) return;

        suppressScrollSyncRef.current = true;

        container.scrollTo({
          top: Math.max(
              0,
              page.offsetTop + topOffset,
          ),
          behavior: "smooth",
        });

        window.setTimeout(() => {
          suppressScrollSyncRef.current = false;
        }, 800);
      },
      [],
  );

  const scrollToExercise = useCallback(
      (exercise: ActiveExercise) => {
        const height =
            pageHeights[exercise.page] ?? 0;

        const bboxOffset =
            exercise.bbox && height > 0
                ? (height - exercise.bbox.y1) *
                renderedScale -
                56
                : 0;

        setCurrentPage(exercise.page);

        scrollToPage(
            exercise.page,
            bboxOffset,
        );
      },
      [
        pageHeights,
        renderedScale,
        scrollToPage,
      ],
  );

  useEffect(() => {
    if (
        !activeExercise?.number ||
        !activeExercise?.page
    ) {
      return;
    }

    scrollToExercise(activeExercise);
  }, [activeExercise, scrollToExercise]);

  const pdfFile = useMemo(() => {
    if (!pdfData) return null;

    return {
      data: pdfData.slice(),
    };
  }, [pdfData]);

  const exerciseLoading =
      loadingExercises ||
      detectingExercises;

  const isPdfRight =
      pdfLayoutMode === "horizontal";

  return (
      <div className="flex h-full min-w-0 flex-1 flex-col overflow-hidden">
        <div className="relative flex shrink-0 items-center gap-2 border-b bg-muted/30 px-3 py-1.5">
          <div className="flex items-center gap-0.5">
            <button
                type="button"
                onClick={() =>
                    scrollToPage(
                        Math.max(
                            1,
                            currentPage - 1,
                        ),
                    )
                }
                disabled={currentPage <= 1}
                className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:bg-muted disabled:opacity-40"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>

            <span className="min-w-[60px] text-center text-xs text-muted-foreground">
            {currentPage} /{" "}
              {numPages || "?"}
          </span>

            <button
                type="button"
                onClick={() =>
                    scrollToPage(
                        Math.min(
                            numPages || 1,
                            currentPage + 1,
                        ),
                    )
                }
                disabled={
                    currentPage >= numPages
                }
                className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:bg-muted disabled:opacity-40"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="flex items-center gap-0.5">
            <button
                type="button"
                onClick={() =>
                    setScale((s) =>
                        Math.max(
                            0.5,
                            parseFloat(
                                (
                                    s - 0.25
                                ).toFixed(2),
                            ),
                        ),
                    )
                }
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
                            parseFloat(
                                (
                                    s + 0.25
                                ).toFixed(2),
                            ),
                        ),
                    )
                }
                className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:bg-muted"
            >
              <ZoomIn className="h-3.5 w-3.5" />
            </button>
          </div>

          <button
              type="button"
              onClick={() =>
                  setSidebarCollapsed(
                      (value) => !value,
                  )
              }
              className={cn(
                  "flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:bg-muted",
                  !sidebarCollapsed &&
                  "bg-muted text-foreground",
              )}
          >
            <BookOpen className="h-3.5 w-3.5" />
          </button>

          {docName && (
              <p className="pointer-events-none absolute inset-x-0 truncate px-56 text-center text-xs font-medium text-muted-foreground">
                {docName}
              </p>
          )}

          <div className="flex-1" />

          <div className="flex items-center">
            <ToggleGroup
                type="single"
                value={
                  isPdfRight
                      ? "horizontal"
                      : "vertical"
                }
                onValueChange={(value) => {
                  if (!value) return;

                  onPdfLayoutModeChange?.(
                      value === "horizontal"
                          ? "horizontal"
                          : "vertical",
                  );
                }}
                className="rounded-lg border bg-background shadow-sm"
            >
              <ToggleGroupItem
                  value="vertical"
                  className="flex items-center gap-1.5 px-3"
                  aria-label="PDF abajo"
              >
                <PanelBottom className="h-3.5 w-3.5" />
              </ToggleGroupItem>

              <ToggleGroupItem
                  value="horizontal"
                  className="flex items-center gap-1.5 px-3"
                  aria-label="PDF lateral"
              >
                <PanelRight className="h-3.5 w-3.5" />
              </ToggleGroupItem>
            </ToggleGroup>
          </div>

          <button
              type="button"
              aria-label="Cerrar visor"
              onClick={onClose}
              className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:bg-muted"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="relative flex-1 overflow-hidden bg-muted/20">
          <ExerciseSidebar
              exercises={allExercises}
              loading={exerciseLoading}
              collapsed={sidebarCollapsed}
              activeExercise={
                activeExercise
              }
              onExerciseSelect={
                onExerciseSelect
              }
              onToggle={() =>
                  setSidebarCollapsed(
                      (value) => !value,
                  )
              }
          />

          <div
              ref={scrollRef}
              className="absolute inset-0 overflow-auto bg-muted/30"
          >
            <div className="flex min-h-full flex-col items-center px-6 py-6">
              {activeExercise &&
                  !activeExercise.bbox && (
                      <div className="mb-4 rounded-md border border-primary/20 bg-primary/10 px-3 py-2 text-xs text-primary">
                        Ejercicio{" "}
                        {
                          activeExercise.number
                        }{" "}
                        activo · Página{" "}
                        {
                          activeExercise.page
                        }
                      </div>
                  )}

              {loadError || renderError ? (
                  <div className="flex h-48 w-64 items-center justify-center text-center text-xs text-destructive">
                    {loadError
                        ? "Error al cargar el PDF:"
                        : "Error al renderizar el PDF:"}
                    {" "}
                    {loadError || renderError}
                  </div>
              ) : !pdfFile ? (
                  <div className="flex h-48 w-48 items-center justify-center">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  </div>
              ) : (
                  <Document
                      file={pdfFile}
                      onLoadSuccess={
                        handleDocumentLoad
                      }
                      onLoadError={
                        handleDocumentError
                      }
                      error={
                        <div className="flex h-48 w-64 items-center justify-center text-center text-xs text-destructive">
                          Error al renderizar el PDF:
                          {" "}
                          {renderError ||
                              "No se pudo renderizar el PDF"}
                        </div>
                      }
                  >
                    <div className="mx-auto flex w-fit flex-col items-center gap-6">
                      {Array.from(
                          {
                            length: numPages,
                          },
                          (_, index) => {
                            const pageNumber =
                                index + 1;

                            const pageHeight =
                                pageHeights[
                                    pageNumber
                                    ] ?? 0;

                            const isActivePage =
                                activeExercise?.page ===
                                pageNumber;

                            return (
                                <div
                                    key={pageNumber}
                                    ref={(node) => {
                                      pageRefs.current[
                                          pageNumber
                                          ] = node;
                                    }}
                                    className="relative overflow-hidden rounded-lg bg-white shadow-lg ring-1 ring-border/60"
                                >
                                  <Page
                                      pageNumber={
                                        pageNumber
                                      }
                                      scale={
                                        renderedScale
                                      }
                                      onLoadSuccess={(
                                          page,
                                      ) =>
                                          handlePageLoad(
                                              pageNumber,
                                              page,
                                          )
                                      }
                                      renderTextLayer={
                                        false
                                      }
                                      renderAnnotationLayer={
                                        false
                                      }
                                  />

                                  {isActivePage &&
                                      activeExercise?.bbox &&
                                      pageHeight >
                                      0 && (
                                          <ExerciseHighlighter
                                              bbox={
                                                activeExercise.bbox
                                              }
                                              scale={
                                                renderedScale
                                              }
                                              pageHeight={
                                                pageHeight
                                              }
                                          />
                                      )}
                                </div>
                            );
                          },
                      )}
                    </div>
                  </Document>
              )}
            </div>
          </div>
        </div>
      </div>
  );
}
