import { useState, useCallback, useEffect, lazy, Suspense } from "react";
import { WifiOff, ServerCrash, Clock } from "lucide-react";
import ChatSidebar from "./ChatSidebar";
import ChatHeader from "./ChatHeader";
import MessageList from "./MessageList";
import ChatInput from "./ChatInput";
import DocumentPanel from "./DocumentPanel";

const PDFViewer = lazy(() =>
  import("./PDFViewer").then((m) => ({ default: m.PDFViewer }))
);
import ErrorBoundary from "@/components/ErrorBoundary";
import { useChat } from "@/hooks/useChat";
import { usePDFViewer } from "@/hooks/usePDFViewer";
import { useExerciseDetection } from "@/hooks/useExerciseDetection";
import { useAuth } from "@/auth/useAuth";
import { SidebarProvider } from "@/components/ui/sidebar";

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

  const handleSend = useCallback(
    (content: string, files: File[]) => {
      let exerciseNum = pdfViewer.activeExercise?.number;
      if (pdfViewer.activeDocId) {
        const detected = detectExercise(content);
        if (detected) {
          const ex = pdfViewer.exercises.find((e) => e.number === detected);
          pdfViewer.selectExercise({
            number: detected,
            page: ex?.page ?? 1,
            bbox: ex?.bbox,
          });
          exerciseNum = detected;
        } else if (isClosing(content)) {
          pdfViewer.clearExercise();
          exerciseNum = undefined;
        }
      }
      sendMessage(content, files, exerciseNum, pdfViewer.activeDocId ?? undefined);
    },
    [pdfViewer, sendMessage, detectExercise, isClosing]
  );

  if (!connectionReady && isOffline) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4 bg-background text-center px-6">
        <ServerCrash className="h-12 w-12 text-destructive/60" />
        <div>
          <p className="text-lg font-semibold text-foreground">Servicio no disponible</p>
          <p className="mt-1 text-sm text-muted-foreground">
            No se puede conectar con el servidor del chat.<br />Verificá tu conexión o intentá más tarde.
          </p>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="mt-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
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

  const contextBadge = pdfViewer.activeDocId
    ? {
        docName: pdfViewer.activeDocName ?? "Documento",
        exerciseNumber: pdfViewer.activeExercise?.number,
        onClear: pdfViewer.clearAll,
      }
    : null;

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

      <main className="flex min-w-0 flex-1 flex-col h-screen overflow-hidden">
        {isOffline && (
          <div className="flex items-center justify-center gap-2 bg-destructive/10 px-4 py-2 text-xs font-medium text-destructive">
            <WifiOff className="h-3.5 w-3.5" />
            Sin conexión con el servidor — reconectando…
          </div>
        )}

        {rateLimitSecondsLeft > 0 && (
          <div className="flex items-center justify-center gap-2 bg-amber-500/10 px-4 py-2 text-xs font-medium text-amber-600 dark:text-amber-400">
            <Clock className="h-3.5 w-3.5" />
            Límite de mensajes alcanzado — podés enviar más en {rateLimitSecondsLeft}s
          </div>
        )}

        <ChatHeader
          conversation={activeConversation}
          onOpenDocuments={() => setDocPanelOpen(true)}
        />

        <ErrorBoundary>
          <MessageList
            messages={messages}
            isTyping={status === "loading"}
            onSuggestion={sendMessage}
            onRegenerate={status === "loading" || isOffline ? undefined : regenerateLastMessage}
            isLoadingHistory={isLoadingHistory}
          />
        </ErrorBoundary>

        {pdfViewer.viewerOpen && pdfViewer.activeDocId && accessToken && (
          <ErrorBoundary
            key={`${viewerRetryKey}-${pdfViewer.activeDocId}`}
            fallback={
              <div className="flex h-[350px] shrink-0 flex-col items-center justify-center gap-3 border-t bg-muted/10 px-4 text-center">
                <div className="text-xs text-destructive/80">Error al cargar el visor PDF</div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setViewerRetryKey(k => k + 1)}
                    className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                  >
                    Reintentar
                  </button>
                  <button
                    onClick={() => pdfViewer.closeViewer()}
                    className="rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Cerrar visor
                  </button>
                </div>
              </div>
            }
          >
          <div className="flex h-[350px] shrink-0 border-t">
            <Suspense
              fallback={
                <div className="flex flex-1 items-center justify-center">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                </div>
              }
            >
              <PDFViewer
                documentId={pdfViewer.activeDocId}
                token={accessToken}
                activeExercise={pdfViewer.activeExercise}
                onClose={pdfViewer.closeViewer}
                exercises={pdfViewer.exercises}
                onExerciseSelect={pdfViewer.selectExercise}
                docName={pdfViewer.activeDocName ?? undefined}
              />
            </Suspense>
          </div>
          </ErrorBoundary>
        )}

        {accessToken && (
          <DocumentPanel
            isOpen={docPanelOpen}
            onClose={() => setDocPanelOpen(false)}
            token={accessToken}
            onUploadSuccess={(docId) => setActiveDocument(docId)}
            onDocumentOpen={(id, name) => {
              pdfViewer.openDocument(id, name);
              setActiveDocument(id);
              setDocPanelOpen(false);
            }}
          />
        )}

        <ChatInput
          onSend={handleSend}
          disabled={status === "loading" || isOffline || isLoadingHistory || rateLimitSecondsLeft > 0}
          placeholder={
            rateLimitSecondsLeft > 0
              ? `Esperá ${rateLimitSecondsLeft}s para seguir enviando…`
              : isLoadingHistory
              ? "Cargando historial…"
              : undefined
          }
          contextBadge={contextBadge}
        />
      </main>
    </SidebarProvider>
  );
};

export default ChatLayout;
