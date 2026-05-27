import { useState, useCallback, useEffect, lazy, Suspense } from "react";
import { WifiOff, ServerCrash, Clock } from "lucide-react";
import ChatSidebar from "./ChatSidebar";
import ChatHeader from "./ChatHeader";
import MessageList from "./MessageList";
import ChatInput from "./ChatInput";
import DocumentPanel from "./DocumentPanel";

const PDFViewer = lazy(() =>
    import("./PDFViewer").then((m) => ({ default: m.PDFViewer })),
);

import ErrorBoundary from "@/components/ErrorBoundary";
import { useChat } from "@/hooks/useChat";
import { usePDFViewer } from "@/hooks/usePDFViewer";
import { useExerciseDetection } from "@/hooks/useExerciseDetection";
import { useAuth } from "@/auth/useAuth";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { SidebarProvider } from "@/components/ui/sidebar";

type PdfLayoutMode = "side" | "bottom";

const PDF_LAYOUT_STORAGE_KEY = "learnsoft.pdfLayout";
const NARROW_LAYOUT_QUERY = "(max-width: 900px)";

const ChatLayout = () => {
  const {
    conversations,
    activeConversation,
    activeId,
    status,
    isOffline,
    connectionReady,
    isLoadingHistory,
    rateLimitSecondsLeft,
    explanationLevel,
    setExplanationLevel,
    newConversation,
    sendMessage,
    setActiveDocument,
    selectConversation,
    deleteConversation,
    regenerateLastMessage,
  } = useChat();

  const { accessToken } = useAuth();
  const pdfViewer = usePDFViewer(accessToken);
  const { detectExercise, isClosing } = useExerciseDetection();

  const [docPanelOpen, setDocPanelOpen] = useState(false);
  const [viewerRetryKey, setViewerRetryKey] = useState(0);

  const [preferredPdfLayout, setPreferredPdfLayout] =
      useState<PdfLayoutMode>(() => {
        const saved = window.localStorage.getItem(PDF_LAYOUT_STORAGE_KEY);
        return saved === "bottom" ? "bottom" : "side";
      });

  const [isNarrowLayout, setIsNarrowLayout] = useState(() =>
      window.matchMedia(NARROW_LAYOUT_QUERY).matches,
  );

  useEffect(() => {
    const media = window.matchMedia(NARROW_LAYOUT_QUERY);
    const updateLayout = () => setIsNarrowLayout(media.matches);

    updateLayout();
    media.addEventListener("change", updateLayout);

    return () => media.removeEventListener("change", updateLayout);
  }, []);

  const effectivePdfLayout: PdfLayoutMode = isNarrowLayout
      ? "bottom"
      : preferredPdfLayout;

  const handlePdfLayoutModeChange = useCallback(
      (mode: "horizontal" | "vertical") => {
        const next: PdfLayoutMode =
            mode === "horizontal" ? "side" : "bottom";

        setPreferredPdfLayout(next);
        window.localStorage.setItem(PDF_LAYOUT_STORAGE_KEY, next);
      },
      [],
  );

  const handleSend = useCallback(
      (content: string, files: File[]) => {
        let exerciseNum = pdfViewer.activeExercise?.number;

        if (pdfViewer.activeDocId) {
          const detected = detectExercise(content);

          if (detected) {
            const ex = pdfViewer.exercises.find((e) => e.id === detected);

            pdfViewer.selectExercise({
              number: detected,
              page: ex?.pageNumber ?? 1,
              bbox: ex?.boundingBox,
              title: ex?.title,
            });

            exerciseNum = detected;
          } else if (isClosing(content)) {
            pdfViewer.clearExercise();
            exerciseNum = undefined;
          }
        }

        sendMessage(
            content,
            files,
            exerciseNum,
            pdfViewer.activeDocId ?? undefined,
        );
      },
      [pdfViewer, sendMessage, detectExercise, isClosing],
  );

  useEffect(() => {
    if (!pdfViewer.activeDocId || pdfViewer.exercises.length === 0) return;

    const lastMessage = activeConversation?.messages.at(-1);
    if (!lastMessage) return;

    const detected = detectExercise(lastMessage.content);
    if (!detected || detected === pdfViewer.activeExercise?.number) return;

    const exercise = pdfViewer.exercises.find((item) => item.id === detected);
    if (!exercise) return;

    pdfViewer.selectExercise({
      number: exercise.id,
      page: exercise.pageNumber,
      bbox: exercise.boundingBox,
      title: exercise.title,
    });
  }, [activeConversation?.messages, detectExercise, pdfViewer]);

  if (!connectionReady && isOffline) {
    return (
        <div className="flex h-screen flex-col items-center justify-center gap-4 bg-background px-6 text-center">
          <ServerCrash className="h-12 w-12 text-destructive/60" />

          <div>
            <p className="text-lg font-semibold text-foreground">
              Servicio no disponible
            </p>

            <p className="mt-1 text-sm text-muted-foreground">
              No se puede conectar con el servidor del chat.
              <br />
              Verificá tu conexión o intentá más tarde.
            </p>
          </div>

          <button
              onClick={() => window.location.reload()}
              className="mt-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Reintentar
          </button>
        </div>
    );
  }

  if (!connectionReady) {
    return (
        <div className="flex h-screen items-center justify-center bg-background">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
    );
  }

  const messages = activeConversation?.messages ?? [];
  const contextBadge = null;

  const pdfVisible =
      pdfViewer.viewerOpen && pdfViewer.activeDocId && accessToken;

  const chatPanel = (
      <div className="flex h-full min-h-0 flex-col">
        <ErrorBoundary>
          <MessageList
              messages={messages}
              isTyping={status === "loading"}
              onSuggestion={sendMessage}
              onRegenerate={
                status === "loading" || isOffline
                    ? undefined
                    : regenerateLastMessage
              }
              isLoadingHistory={isLoadingHistory}
          />
        </ErrorBoundary>

        <ChatInput
            onSend={handleSend}
            disabled={
                status === "loading" ||
                isOffline ||
                isLoadingHistory ||
                rateLimitSecondsLeft > 0
            }
            placeholder={
              rateLimitSecondsLeft > 0
                  ? `Esperá ${rateLimitSecondsLeft}s para seguir enviando`
                  : isLoadingHistory
                      ? "Cargando historial"
                      : undefined
            }
            contextBadge={contextBadge}
        />
      </div>
  );

  const pdfPanel = pdfVisible ? (
      <ErrorBoundary
          key={`${viewerRetryKey}-${pdfViewer.activeDocId}`}
          fallback={
            <div className="flex h-full min-h-[220px] flex-col items-center justify-center gap-3 bg-muted/10 px-4 text-center">
              <div className="text-xs text-destructive/80">
                Error al cargar el visor PDF
              </div>

              <div className="flex items-center gap-2">
                <button
                    onClick={() => setViewerRetryKey((k) => k + 1)}
                    className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  Reintentar
                </button>

                <button
                    onClick={() => pdfViewer.closeViewer()}
                    className="rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                  Cerrar visor
                </button>
              </div>
            </div>
          }
      >
        <Suspense
            fallback={
              <div className="flex h-full min-h-[220px] flex-1 items-center justify-center">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              </div>
            }
        >
          <PDFViewer
              documentId={pdfViewer.activeDocId!}
              token={accessToken!}
              activeExercise={pdfViewer.activeExercise}
              onClose={pdfViewer.closeViewer}
              exercises={pdfViewer.exercises}
              loadingExercises={pdfViewer.loadingExercises}
              onExerciseSelect={pdfViewer.selectExercise}
              onExercisesDetected={pdfViewer.syncDetectedExercises}
              docName={pdfViewer.activeDocName ?? undefined}
              pdfLayoutMode={
                effectivePdfLayout === "side" ? "horizontal" : "vertical"
              }
              onPdfLayoutModeChange={handlePdfLayoutModeChange}
          />
        </Suspense>
      </ErrorBoundary>
  ) : null;

  return (
      <SidebarProvider>
        <ChatSidebar
            conversations={conversations}
            activeId={activeId}
            onSelect={selectConversation}
            onNew={newConversation}
            onDelete={deleteConversation}
            isLoadingHistory={isLoadingHistory}
            level={explanationLevel}
            onLevelChange={setExplanationLevel}
        />

        <main className="flex h-screen min-w-0 flex-1 flex-col overflow-hidden">
          {isOffline && (
              <div className="flex items-center justify-center gap-2 bg-destructive/10 px-4 py-2 text-xs font-medium text-destructive">
                <WifiOff className="h-3.5 w-3.5" />
                Sin conexión con el servidor — reconectando
              </div>
          )}

          {rateLimitSecondsLeft > 0 && (
              <div className="flex items-center justify-center gap-2 bg-amber-500/10 px-4 py-2 text-xs font-medium text-amber-600 dark:text-amber-400">
                <Clock className="h-3.5 w-3.5" />
                Límite de mensajes alcanzado — podés enviar más en{" "}
                {rateLimitSecondsLeft}s
              </div>
          )}

          <ChatHeader
              conversation={activeConversation}
              onOpenDocuments={() => setDocPanelOpen(true)}
          />

          <div className="min-h-0 flex-1">
            {pdfPanel ? (
                <ResizablePanelGroup
                    key={effectivePdfLayout}
                    direction={
                      effectivePdfLayout === "side" ? "horizontal" : "vertical"
                    }
                    autoSaveId={`learnsoft-chat-pdf-${effectivePdfLayout}`}
                    className="h-full"
                >
                  <ResizablePanel
                      defaultSize={effectivePdfLayout === "side" ? 56 : 58}
                      minSize={effectivePdfLayout === "side" ? 34 : 28}
                      className="min-h-0 min-w-0"
                  >
                    {chatPanel}
                  </ResizablePanel>

                  <ResizableHandle withHandle />

                  <ResizablePanel
                      defaultSize={effectivePdfLayout === "side" ? 44 : 42}
                      minSize={effectivePdfLayout === "side" ? 28 : 24}
                      className={`min-h-0 min-w-0 border-border ${
                          effectivePdfLayout === "side" ? "border-l" : "border-t"
                      }`}
                  >
                    {pdfPanel}
                  </ResizablePanel>
                </ResizablePanelGroup>
            ) : (
                chatPanel
            )}
          </div>

          {pdfVisible && (
              <div className="sr-only" aria-live="polite">
                Vista de PDF en modo{" "}
                {effectivePdfLayout === "side" ? "lateral" : "inferior"}
              </div>
          )}

          {accessToken && (
              <DocumentPanel
                  isOpen={docPanelOpen}
                  onClose={() => setDocPanelOpen(false)}
                  token={accessToken}
                  onDocumentOpen={(id, name) => {
                    pdfViewer.openDocument(id, name);
                    setActiveDocument(id);
                    setDocPanelOpen(false);
                  }}
              />
          )}
        </main>
      </SidebarProvider>
  );
};

export default ChatLayout;