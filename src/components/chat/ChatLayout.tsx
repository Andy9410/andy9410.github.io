import { useState, useCallback, useEffect, useRef, lazy, Suspense } from "react";
import { WifiOff, ServerCrash, Clock } from "lucide-react";
import ChatSidebar from "./ChatSidebar";
import ChatHeader from "./ChatHeader";
import MessageList from "./MessageList";
import ChatInput from "./ChatInput";
import DocumentPanel from "./DocumentPanel";
import ExerciseStepsPanel from "./ExerciseStepsPanel";
import { WhiteboardPanel } from "./whiteboard/WhiteboardPanel";

const PDFViewer = lazy(() =>
    import("./PDFViewer").then((m) => ({ default: m.PDFViewer })),
);

import ErrorBoundary from "@/components/ErrorBoundary";
import { useChat } from "@/hooks/useChat";
import { usePDFViewer } from "@/hooks/usePDFViewer";
import { useWhiteboard } from "@/hooks/useWhiteboard";
import { useWhiteboardLesson } from "@/hooks/useWhiteboardLesson";
import { useAutoWhiteboardEval } from "@/hooks/useAutoWhiteboardEval";
import { useExerciseDetection } from "@/hooks/useExerciseDetection";
import { useAuth } from "@/auth/useAuth";
import type { InterpretMode } from "@/types/whiteboard";
import { createWhiteboard, getReasoningTree, injectWhiteboardContent, interpretWhiteboard } from "@/services/whiteboardApi";
import { renderWhiteboardToPng } from "@/utils/renderWhiteboardImage";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { SidebarProvider } from "@/components/ui/sidebar";
import type { ExerciseBreakdown, Message } from "@/types/chat";

type PdfLayoutMode = "side" | "bottom";

function parseMessageToBlocks(
  userQuestion: string,
  assistantContent: string
): Array<{ type: string; content: string; orderIndex: number }> {
  const blocks: Array<{ type: string; content: string; orderIndex: number }> = [];
  let order = 1;

  // Title from the user's question
  const title = userQuestion.trim().replace(/[?\n]/g, "").slice(0, 80);
  if (title) blocks.push({ type: "TITLE", content: title, orderIndex: order++ });

  // Strip markdown artifacts and split into lines
  const lines = assistantContent
    .replace(/\*\*/g, "")
    .replace(/\*/g, "")
    .replace(/#+\s/g, "")
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  for (const line of lines) {
    // Skip suggestion markers
    if (line.startsWith("|||")) break;

    // Numbered step: "1.", "2.", "Paso 1:", "Step 1:"
    if (/^(\d+[\.\)]|[Pp]aso\s*\d+[:\.]|[Ss]tep\s*\d+[:\.])\s/.test(line)) {
      blocks.push({ type: "STEP", content: line, orderIndex: order++ });
    }
    // Formula: short line with math operators and digits
    else if (line.length < 70 && /[=+\-*/^]/.test(line) && /\d/.test(line)) {
      blocks.push({ type: "FORMULA", content: line, orderIndex: order++ });
    }
    // Short standalone line without trailing period → treat as sub-title
    else if (line.length < 50 && !line.endsWith(".") && !line.endsWith(",")) {
      blocks.push({ type: "TITLE", content: line, orderIndex: order++ });
    }
    // Regular paragraph text
    else {
      blocks.push({ type: "TEXT", content: line, orderIndex: order++ });
    }
  }

  return blocks;
}

const PDF_LAYOUT_STORAGE_KEY = "learnsoft.pdfLayout";
const EXERCISE_PANEL_STORAGE_KEY = "learnsoft.exerciseStepsPanel";
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
    activeExerciseBreakdown,
    setActiveExerciseBreakdown,
    activeWhiteboardSuggestion,
    setActiveWhiteboardSuggestion,
    activeWhiteboardAction,
    setActiveWhiteboardAction,
    explanationLevel,
    setExplanationLevel,
    newConversation,
    sendMessage,
    sendSuggestion,
    setActiveDocument,
    ensureBackendConversation,
    selectConversation,
    deleteConversation,
    regenerateLastMessage,
  } = useChat();

  const { accessToken } = useAuth();
  const pdfViewer = usePDFViewer(accessToken);
  const whiteboard = useWhiteboard(accessToken, activeConversation?.backendId);
  const lesson = useWhiteboardLesson();
  const { detectExercise, isClosing } = useExerciseDetection();


  const [teachingEntries, setTeachingEntries] = useState<import("@/types/whiteboard").WhiteboardEntry[]>([]);
  const [reasoningNodes, setReasoningNodes] = useState<import("@/types/whiteboard").ReasoningNode[]>([]);

  const [docPanelOpen, setDocPanelOpen] = useState(false);
  const [viewerRetryKey, setViewerRetryKey] = useState(0);
  const [exercisePanelOpen, setExercisePanelOpen] = useState(false);
  const [activeBreakdown, setActiveBreakdown] = useState<ExerciseBreakdown | null>(null);
  const [activeBreakdownMessageId, setActiveBreakdownMessageId] = useState<string | null>(null);
  const [exercisePanelPreference, setExercisePanelPreference] =
      useState<"open" | "closed">(() =>
          window.localStorage.getItem(EXERCISE_PANEL_STORAGE_KEY) === "open"
              ? "open"
              : "closed",
      );
  const [whiteboardAskActive, setWhiteboardAskActive] = useState(false);
  const [whiteboardInterpretMode, setWhiteboardInterpretMode] = useState<InterpretMode>("auto");
  const latestStreamBreakdownRef = useRef<ExerciseBreakdown | null>(null);

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

  const openExercisePanel = useCallback(() => {
    setExercisePanelOpen(true);
    setExercisePanelPreference("open");
    window.localStorage.setItem(EXERCISE_PANEL_STORAGE_KEY, "open");
  }, []);

  const closeExercisePanel = useCallback(() => {
    setExercisePanelOpen(false);
    setExercisePanelPreference("closed");
    window.localStorage.setItem(EXERCISE_PANEL_STORAGE_KEY, "closed");
  }, []);

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

  const sendWhiteboardToChat = useCallback(async () => {
    const activeWhiteboard = whiteboard.activeWhiteboard;
    const activeWhiteboardId = activeWhiteboard?.id;
    const conversationId = activeConversation?.backendId;
    if (!activeWhiteboard || !activeWhiteboardId || !conversationId || !accessToken || status === "loading" || isOffline || isLoadingHistory) return;

    setWhiteboardAskActive(true);
    try {
      const imageBase64 = renderWhiteboardToPng(activeWhiteboard.data);
      const whiteboardInterpretation = await interpretWhiteboard(accessToken, {
        conversationId,
        whiteboardId: activeWhiteboardId,
        imageBase64,
        exerciseLabel: activeWhiteboard.exerciseLabel,
        interpretMode: whiteboardInterpretMode,
      }).catch(() => ({
        type: "unknown" as const,
        whiteboardId: activeWhiteboardId,
        title: activeWhiteboard.title,
        exerciseLabel: activeWhiteboard.exerciseLabel,
        documentId: activeWhiteboard.documentId,
        equation: null,
        ocrText: "",
        structuredElements: "No se pudo ejecutar la interpretación de la pizarra.",
        semanticSummary: "No se pudo interpretar claramente la pizarra.",
        confidence: 0,
      }));
      await sendMessage(
        "Analizá la pizarra actual y decime qué falta o qué mejorar.",
        [],
        pdfViewer.activeExercise?.number,
        pdfViewer.activeDocId ?? undefined,
        activeWhiteboardId,
        whiteboardInterpretation,
      );
    } finally {
      setWhiteboardAskActive(false);
    }
  }, [
    accessToken,
    activeConversation?.backendId,
    isLoadingHistory,
    isOffline,
    pdfViewer.activeDocId,
    pdfViewer.activeExercise?.number,
    sendMessage,
    status,
    whiteboard.activeWhiteboard,
    whiteboardInterpretMode,
  ]);

  const askAboutWhiteboard = useCallback(() => {
    void sendWhiteboardToChat();
  }, [sendWhiteboardToChat]);

  const whiteboardAskStatus = whiteboardAskActive
    ? status === "loading" ? "generating" : "sending"
    : "idle";

  // Auto-evaluate whiteboard when user adds new elements (3s debounce)
  useAutoWhiteboardEval({
    whiteboard: whiteboard.activeWhiteboard,
    panelOpen: whiteboard.panelOpen,
    chatIdle: status !== "loading" && !isOffline,
    onEvaluate: askAboutWhiteboard,
  });

  const handleExplainInWhiteboard = useCallback(async (msg: Message) => {
    if (!accessToken) return;

    const msgs = activeConversation?.messages ?? [];
    const idx = msgs.findIndex((m) => m.id === msg.id);
    const userMsg = [...msgs].slice(0, idx).reverse().find((m) => m.role === "user");

    whiteboard.openPendingPanel();
    const conversationId = activeConversation?.backendId
      ?? await ensureBackendConversation("Pizarra inteligente").catch((err) => {
        whiteboard.failPendingPanel(err instanceof Error ? err.message : "No se pudo crear la conversación.");
        return null;
      });
    if (!conversationId) return;

    // If there's already content on the whiteboard, create a fresh one
    const hasExistingContent =
      teachingEntries.length > 0 ||
      (whiteboard.activeWhiteboard?.data.elements?.length ?? 0) > 0;

    let wb = hasExistingContent ? null : await whiteboard.openConversationWhiteboard(conversationId);

    if (hasExistingContent) {
      setTeachingEntries([]);
      try {
        const fresh = await createWhiteboard(conversationId, accessToken, {
          title: "Pizarra de enseñanza",
          data: { version: 1, elements: [] },
        });
        whiteboard.setActiveWhiteboard(fresh);
        wb = fresh;
      } catch {
        wb = await whiteboard.openConversationWhiteboard(conversationId);
      }
    }

    if (!wb) return;

    // Parse assistant message into structured blocks and inject directly to canvas
    const blocks = parseMessageToBlocks(userMsg?.content ?? "", msg.content);
    if (blocks.length === 0) return;

    try {
      const saved = await injectWhiteboardContent(conversationId, wb.id, blocks, accessToken);
      if (saved.length > 0) {
        setTeachingEntries((prev) => {
          const existingIds = new Set(prev.map((e) => e.id));
          const fresh = saved.filter((e) => !existingIds.has(e.id));
          return [...prev, ...fresh].sort((a, b) => a.orderIndex - b.orderIndex);
        });
      }
    } catch {
      // silent — canvas stays empty but whiteboard is open
    }
  }, [accessToken, activeConversation, ensureBackendConversation, lesson, whiteboard]);

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

  useEffect(() => {
    if (activeWhiteboardSuggestion) {
      whiteboard.setPanelOpen(true);
    }
  }, [activeWhiteboardSuggestion, whiteboard.setPanelOpen]);

  // Load reasoning tree when switching conversations
  useEffect(() => {
    const conversationId = activeConversation?.backendId;
    if (!conversationId || !accessToken) return;

    setReasoningNodes([]);
    void getReasoningTree(conversationId, accessToken)
      .then((nodes) => {
        if (nodes.length > 0) setReasoningNodes(nodes);
      })
      .catch(() => {});
  }, [activeConversation?.backendId, accessToken]);

  // Handle backend whiteboard actions (OPEN_WHITEBOARD, UPDATE_WHITEBOARD)
  useEffect(() => {
    if (!activeWhiteboardAction) return;

    const action = activeWhiteboardAction;
    setActiveWhiteboardAction(null);

    if (action.type === "OPEN_WHITEBOARD") {
      // New whiteboard from backend — clear previous teaching entries
      setTeachingEntries([]);
      whiteboard.setPanelOpen(true);
      const conversationId = action.payload.conversationId ?? activeConversation?.backendId;
      if (conversationId && accessToken && !whiteboard.activeWhiteboard) {
        void whiteboard.openConversationWhiteboard(conversationId);
      }
    } else if (action.type === "CREATE_REASONING_NODE") {
      const node = action.payload as unknown as import("@/types/whiteboard").ReasoningNode;
      if (node?.nodeId) {
        setReasoningNodes((prev) => {
          const exists = prev.some((n) => n.nodeId === node.nodeId);
          if (exists) return prev.map((n) => n.nodeId === node.nodeId ? node : n);
          return [...prev, node].sort((a, b) =>
            a.level !== b.level ? a.level - b.level : a.orderIndex - b.orderIndex
          );
        });
      }
    } else if (action.type === "UPDATE_WHITEBOARD" || action.type === "INJECT_WHITEBOARD_CONTENT") {
      // Merge new entries/blocks from the action payload
      const incoming = action.payload.blocks ?? action.payload.entries ?? [];
      if (incoming.length > 0) {
        setTeachingEntries((prev) => {
          const existingIds = new Set(prev.map((e) => e.id));
          const fresh = incoming.filter((e) => !existingIds.has(e.id));
          return [...prev, ...fresh].sort((a, b) => a.orderIndex - b.orderIndex);
        });
      }
    }
  }, [activeWhiteboardAction, setActiveWhiteboardAction, whiteboard, activeConversation, accessToken]);

  useEffect(() => {
    if (activeExerciseBreakdown) {
      const isNewStreamBreakdown =
          latestStreamBreakdownRef.current !== activeExerciseBreakdown;

      latestStreamBreakdownRef.current = activeExerciseBreakdown;
      setActiveBreakdown(activeExerciseBreakdown);
      setActiveBreakdownMessageId(null);

      if (isNewStreamBreakdown && exercisePanelPreference === "open") {
        setExercisePanelOpen(true);
      }

      return;
    }

    const latestBreakdownMessage = [...(activeConversation?.messages ?? [])]
      .reverse()
      .find((message) => message.role === "assistant" && message.exerciseBreakdown);
    const latestBreakdown = latestBreakdownMessage?.exerciseBreakdown;

    if (!latestBreakdown) {
      setActiveBreakdown(null);
      setActiveBreakdownMessageId(null);
      setExercisePanelOpen(false);
      return;
    }
    setActiveBreakdown(latestBreakdown);
    setActiveBreakdownMessageId(latestBreakdownMessage?.id ?? null);

    if (exercisePanelPreference === "open") {
      setExercisePanelOpen(true);
    }
  }, [activeConversation?.messages, activeExerciseBreakdown, exercisePanelPreference]);

  const handleOpenExerciseBreakdown = useCallback((message: Message) => {
    if (!message.exerciseBreakdown) return;

    const sameBreakdown =
      activeBreakdownMessageId === message.id ||
      activeBreakdown === message.exerciseBreakdown ||
      (
        activeBreakdown?.exerciseTitle === message.exerciseBreakdown.exerciseTitle &&
        activeBreakdown?.steps.length === message.exerciseBreakdown.steps.length
      );

    if (exercisePanelOpen && sameBreakdown) {
      closeExercisePanel();
      return;
    }

    setActiveExerciseBreakdown(message.exerciseBreakdown);
    setActiveBreakdown(message.exerciseBreakdown);
    setActiveBreakdownMessageId(message.id);
    openExercisePanel();
  }, [activeBreakdown, activeBreakdownMessageId, closeExercisePanel, exercisePanelOpen, openExercisePanel, setActiveExerciseBreakdown]);

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
      <div className="relative flex h-full min-h-0 flex-col">
        <ErrorBoundary>
          <MessageList
              messages={messages}
              isTyping={status === "loading"}
              onSuggestion={sendSuggestion}
              onRegenerate={
                status === "loading" || isOffline
                    ? undefined
                    : regenerateLastMessage
              }
              onOpenExerciseBreakdown={handleOpenExerciseBreakdown}
              onExplainInWhiteboard={handleExplainInWhiteboard}
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

        <ExerciseStepsPanel
            breakdown={activeBreakdown}
            isOpen={exercisePanelOpen}
            isLoading={status === "loading" && !activeBreakdown}
            onOpen={openExercisePanel}
            onClose={closeExercisePanel}
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
              onOpenExerciseWhiteboard={async (exercise) => {
                whiteboard.openPendingPanel();
                const conversationId = activeConversation?.backendId ?? await ensureBackendConversation("Pizarra inteligente").catch((error) => {
                  whiteboard.failPendingPanel(error instanceof Error ? `No se pudo crear la conversación (${error.message}).` : "No se pudo crear la conversación.");
                  return null;
                });
                if (!conversationId) return;
                await whiteboard.openExerciseWhiteboard(exercise.title, pdfViewer.activeDocId ?? undefined, conversationId);
                pdfViewer.selectExercise({
                  number: exercise.id,
                  page: exercise.pageNumber,
                  bbox: exercise.boundingBox,
                  title: exercise.title,
                });
              }}
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
              onOpenWhiteboard={async () => {
                whiteboard.openPendingPanel();
                const conversationId = activeConversation?.backendId ?? await ensureBackendConversation("Pizarra inteligente").catch((error) => {
                  whiteboard.failPendingPanel(error instanceof Error ? `No se pudo crear la conversación (${error.message}).` : "No se pudo crear la conversación.");
                  return null;
                });
                if (!conversationId) return;
                await whiteboard.openConversationWhiteboard(conversationId);
              }}
              explanationLevel={explanationLevel}
              onExplanationLevelChange={setExplanationLevel}
          />

          <div className="min-h-0 flex-1">
            {whiteboard.panelOpen ? (
                <ResizablePanelGroup
                    direction="horizontal"
                    autoSaveId="learnsoft-chat-whiteboard"
                    className="h-full"
                >
                  <ResizablePanel defaultSize={62} minSize={36} className="min-h-0 min-w-0">
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
                  </ResizablePanel>

                  <ResizableHandle withHandle />

                  <ResizablePanel defaultSize={38} minSize={28} className="min-h-0 min-w-0 border-l border-border">
                    <WhiteboardPanel
                        whiteboard={whiteboard.activeWhiteboard}
                        token={accessToken}
                        suggestion={activeWhiteboardSuggestion}
                        askStatus={whiteboardAskStatus}
                        loading={whiteboard.loading}
                        error={whiteboard.error}
                        interpretMode={whiteboardInterpretMode}
                        onInterpretModeChange={setWhiteboardInterpretMode}
                        onChangeData={whiteboard.updateData}
                        onAskWhiteboard={askAboutWhiteboard}
                        onApplySuggestion={() => {
                          if (activeWhiteboardSuggestion) {
                            whiteboard.applySuggestion(activeWhiteboardSuggestion);
                            setActiveWhiteboardSuggestion(null);
                          }
                        }}
                        onIgnoreSuggestion={() => setActiveWhiteboardSuggestion(null)}
                        onClose={() => whiteboard.setPanelOpen(false)}
                        lesson={lesson.lesson}
                        lessonStepIndex={lesson.stepIndex}
                        lessonGenerating={lesson.isGenerating}
                        lessonError={lesson.error}
                        lessonOverlayElements={lesson.overlayElements}
                        onLessonNext={lesson.nextStep}
                        onLessonPrev={lesson.prevStep}
                        onLessonClose={lesson.close}
                        teachingEntries={teachingEntries}
                        reasoningNodes={reasoningNodes}
                    />
                  </ResizablePanel>
                </ResizablePanelGroup>
            ) : pdfPanel ? (
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
