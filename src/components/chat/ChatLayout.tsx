import { useState, useCallback, useEffect, useRef, lazy, Suspense } from "react";
import { WifiOff, ServerCrash, Clock } from "lucide-react";
import ChatSidebar from "./ChatSidebar";
import ChatHeader from "./ChatHeader";
import MessageList from "./MessageList";
import ChatInput from "./ChatInput";
import DocumentPanel from "./DocumentPanel";
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
import { useWhiteboardAnimation } from "@/hooks/useWhiteboardAnimation";
import { useWhiteboardTeaching } from "@/hooks/useWhiteboardTeaching";
import { useExerciseDetection } from "@/hooks/useExerciseDetection";
import { useAuth } from "@/auth/useAuth";
import type { InterpretMode, WhiteboardElement, WhiteboardEntry, WhiteboardQuestionResponsePair } from "@/types/whiteboard";
import { createWhiteboard, getReasoningTree, getWhiteboardEntries, injectWhiteboardContent, interpretWhiteboard } from "@/services/whiteboardApi";
import { renderWhiteboardToPng } from "@/utils/renderWhiteboardImage";
import { hasText } from "@/utils/whiteboardRenderGuards";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { SidebarProvider } from "@/components/ui/sidebar";
import type { Message } from "@/types/chat";

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
    if (/^(\d+[.)]|[Pp]aso\s*\d+[:.]|[Ss]tep\s*\d+[:.])\s/.test(line)) {
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

function whiteboardElementSignature(element: WhiteboardElement): string {
  return JSON.stringify({
    type: element.type,
    x: Math.round(element.x),
    y: Math.round(element.y),
    width: element.width ? Math.round(element.width) : undefined,
    height: element.height ? Math.round(element.height) : undefined,
    text: element.text?.trim() ?? "",
    points: element.points?.map((point) => [Math.round(point.x), Math.round(point.y)]),
  });
}

function describeCanvasElement(element: WhiteboardElement): string {
  const text = element.text?.trim();

  if (element.type === "text" && text) return `Texto escrito por el alumno: ${text}`;
  if (element.type === "equation" && text) return `Fórmula escrita por el alumno: ${text}`;
  if ((element.type === "rect" || element.type === "circle" || element.type === "diamond") && text) {
    return `Elemento ${element.type} con texto del alumno: ${text}`;
  }
  if (element.type === "path" && element.points && element.points.length > 1) {
    return "El alumno dibujó un trazo en el lienzo.";
  }
  if (element.type === "arrow") return "El alumno dibujó una flecha en el lienzo.";
  return "";
}

function buildCanvasTeachingAnswer(
  elements: WhiteboardElement[],
  baseline: Map<string, string>
): string {
  return elements
    .filter((element) => baseline.get(element.id) !== whiteboardElementSignature(element))
    .map(describeCanvasElement)
    .filter(Boolean)
    .join("\n");
}

function normalizeWhiteboardEntries(
  entries: Array<Partial<WhiteboardEntry>>,
  conversationId: number,
  whiteboardId: string
): WhiteboardEntry[] {
  const seed = Date.now();

  return entries
    .filter((entry) => typeof entry.content === "string" && entry.content.trim().length > 0)
    .map((entry, index) => ({
      id: typeof entry.id === "number" ? entry.id : -(seed + index + 1),
      whiteboardId: entry.whiteboardId ?? whiteboardId,
      conversationId: entry.conversationId ?? conversationId,
      type: (entry.type ?? "TEXT") as WhiteboardEntry["type"],
      author: entry.author === "user" ? "user" : "assistant",
      content: entry.content!.trim(),
      orderIndex: entry.orderIndex ?? index + 1,
      metadata: entry.metadata ?? null,
    }));
}

function isGuidedResolutionRequest(message?: Message): boolean {
  if (!message || message.role !== "user") return false;
  const content = String(message.content ?? "").toLowerCase();
  if (!content.trim()) return false;

  const wantsWorkspace =
    content.includes("pizarra") ||
    content.includes("whiteboard") ||
    content.includes("resolución guiada") ||
    content.includes("resolucion guiada");
  const wantsResolution =
    content.includes("resolv") ||
    content.includes("paso a paso") ||
    content.includes("desarroll") ||
    content.includes("explicame") ||
    content.includes("explícame") ||
    content.includes("mostrame");
  const hasEquation = /\d[^=]*=.*/.test(content) || /=.*\d/.test(content);

  return wantsWorkspace || wantsResolution || hasEquation;
}

const PDF_LAYOUT_STORAGE_KEY = "learnsoft.pdfLayout";
const EXERCISE_PANEL_STORAGE_KEY = "learnsoft.exerciseStepsPanel";
const NARROW_LAYOUT_QUERY = "(max-width: 900px)";
const WHITEBOARD_INJECTION_PLANNING_MS = 1350;
const WHITEBOARD_INJECTION_SETTLE_MS = 420;
const WHITEBOARD_INJECTION_BLOCK_PAUSE_MS = 220;
const WHITEBOARD_INJECTION_FRAME_MS = 64;
const WHITEBOARD_INJECTION_MAX_FRAMES = 24;

function buildWritingFrames(text: string): string[] {
  const trimmed = text.trim();
  if (!trimmed) return [];

  const tokens = trimmed.match(/\S+\s*/g) ?? [trimmed];
  const baseFrames =
    tokens.length > 1
      ? tokens.reduce<{ frames: string[]; value: string }>((acc, token) => {
          const value = `${acc.value}${token}`;
          acc.frames.push(value);
          acc.value = value;
          return acc;
        }, { frames: [], value: "" }).frames.map((frame, index, frames) => {
          // Keep inter-word spaces while typing. Only the final frame is trimmed so the
          // persisted visual value matches the original content exactly.
          if (index === frames.length - 1) return frame.trimEnd();
          return frame;
        })
      : Array.from(trimmed).map((_, index, chars) => chars.slice(0, index + 1).join(""));

  if (baseFrames[baseFrames.length - 1] !== trimmed) {
    baseFrames[baseFrames.length - 1] = trimmed;
  }

  if (baseFrames.length <= WHITEBOARD_INJECTION_MAX_FRAMES) return baseFrames;

  const stride = Math.ceil(baseFrames.length / WHITEBOARD_INJECTION_MAX_FRAMES);
  const compactFrames = baseFrames.filter((_, index) => index % stride === stride - 1);
  const lastFrame = baseFrames[baseFrames.length - 1];
  if (compactFrames[compactFrames.length - 1] !== lastFrame) compactFrames.push(lastFrame);
  return compactFrames;
}

function normalizeVisibleWhiteboardText(entry: WhiteboardEntry, content: string): string {
  if (entry.type === "FORMULA") return content.trim();
  return content
    .replace(/([a-záéíóúñü])([A-ZÁÉÍÓÚÑÜ])/g, "$1 $2")
    .replace(/([a-záéíóúñü])(\d)/gi, "$1 $2")
    .replace(/(\d)([a-wy-záéíóúñü]{2,})/gi, "$1 $2")
    .replace(/\s+/g, " ")
    .trim();
}

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
  const [questionPairs, setQuestionPairs] = useState<WhiteboardQuestionResponsePair[]>([]);
  const [activeQuestionId, setActiveQuestionId] = useState<string | null>(null);
  const activeQuestionIdRef = useRef<string | null>(null);
  const questionSequenceRef = useRef(0);
  const resetQuestionPairs = useCallback(() => {
    setQuestionPairs([]);
    setActiveQuestionId(null);
    activeQuestionIdRef.current = null;
    questionSequenceRef.current = 0;
  }, []);
  const wbAnimation = useWhiteboardAnimation();

  const teaching = useWhiteboardTeaching({
    conversationId: activeConversation?.backendId ?? null,
    whiteboardId: whiteboard.activeWhiteboard?.id ?? null,
    token: accessToken,
    onEntries: (entries) => {
      const visibleEntries = entries.filter((entry) => hasText(entry.content));
      if (visibleEntries.length === 0) return;

      setTeachingEntries((prev) => {
        const ids = new Set(prev.map((e) => e.id));
        const fresh = visibleEntries.filter((e) => !ids.has(e.id));
        if (fresh.length === 0) return prev;
        // Append-only: el contenido viejo queda; lo nuevo se suma. Render estático + scroll.
        return [...prev, ...fresh].sort((a, b) => a.orderIndex - b.orderIndex);
      });
    },
  });
  const teachingPhase = teaching.phase;
  const teachingPauseQuestion = teaching.pauseQuestion;
  const teachingSubmitResponse = teaching.submitResponse;
  const teachingContinueWithout = teaching.continueWithout;
  const teachingOnAnimationComplete = teaching.onAnimationComplete;

  const [docPanelOpen, setDocPanelOpen] = useState(false);
  const [viewerRetryKey, setViewerRetryKey] = useState(0);
  const [whiteboardAskActive, setWhiteboardAskActive] = useState(false);
  const [whiteboardInjecting, setWhiteboardInjecting] = useState(false);
  const [whiteboardInterpretMode, setWhiteboardInterpretMode] = useState<InterpretMode>("auto");
  const teachingRef = useRef(teaching);
  teachingRef.current = teaching;
  const wbAnimationRef = useRef(wbAnimation);
  wbAnimationRef.current = wbAnimation;
  const teachingEntriesRef = useRef(teachingEntries);
  teachingEntriesRef.current = teachingEntries;
  const whiteboardElements = whiteboard.activeWhiteboard?.data.elements ?? [];
  const whiteboardElementsRef = useRef<WhiteboardElement[]>(whiteboardElements);
  whiteboardElementsRef.current = whiteboardElements;
  const teachingCanvasBaselineRef = useRef<Map<string, string>>(new Map());
  const previousTeachingPhaseRef = useRef(teachingPhase);
  const whiteboardInjectionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const whiteboardInjectionCommitTimersRef = useRef<Set<ReturnType<typeof setTimeout>>>(new Set());
  const queuedWhiteboardEntryIdsRef = useRef<Set<number>>(new Set());
  const whiteboardInjectionAvailableAtRef = useRef(0);
  const [, setTeachingCanvasBaselineVersion] = useState(0);

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
        structuredElements: "No se pudo ejecutar la interpretación de la resolución guiada.",
        semanticSummary: "No se pudo interpretar claramente la resolución guiada.",
        confidence: 0,
      }));
      await sendMessage(
        "¿Qué ves en mi resolución?",
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
  const latestMessage = activeConversation?.messages?.[activeConversation.messages.length - 1];
  const pendingWhiteboardInjection =
    status === "loading" &&
    Boolean(whiteboard.panelOpen || whiteboard.activeWhiteboard) &&
    isGuidedResolutionRequest(latestMessage);
  const showWhiteboardInjection = whiteboardInjecting || pendingWhiteboardInjection;
  const teachingSessionActive = teachingPhase !== "IDLE" && teachingPhase !== "COMPLETED";
  const teachingWaitingForAnswer = teachingPhase === "WAITING_USER_INPUT" || teachingPhase === "USER_WRITING";

  // Auto-evaluate whiteboard when user adds new elements (3s debounce)
  useAutoWhiteboardEval({
    whiteboard: whiteboard.activeWhiteboard,
    panelOpen: whiteboard.panelOpen,
    chatIdle: status !== "loading" && !isOffline && !teachingSessionActive,
    onEvaluate: askAboutWhiteboard,
  });

  // Avance progresivo "de a poco": el contenido se muestra estático (sin animación que
  // resetee/borre). Tras escribir un fragmento, esperamos un momento y avanzamos al siguiente.
  useEffect(() => {
    if (teachingPhase !== "WRITING_FRAGMENT") return;
    const t = setTimeout(() => teachingOnAnimationComplete(), 1200);
    return () => clearTimeout(t);
  }, [teachingPhase, teaching.stepIndex, teachingOnAnimationComplete]);

  const clearWhiteboardInjectionTimers = useCallback((updateState = true) => {
    if (whiteboardInjectionTimerRef.current) {
      clearTimeout(whiteboardInjectionTimerRef.current);
      whiteboardInjectionTimerRef.current = null;
    }
    whiteboardInjectionCommitTimersRef.current.forEach((timer) => clearTimeout(timer));
    whiteboardInjectionCommitTimersRef.current.clear();
    queuedWhiteboardEntryIdsRef.current.clear();
    whiteboardInjectionAvailableAtRef.current = 0;
    if (updateState) setWhiteboardInjecting(false);
  }, []);

  const scheduleWhiteboardInjection = useCallback((
    entries: WhiteboardEntry[],
    targetWhiteboardId: string,
    source: string
  ) => {
    const existingIds = new Set(teachingEntriesRef.current.map((entry) => entry.id));
    const queuedIds = queuedWhiteboardEntryIdsRef.current;
    const freshEntries = entries
      .filter((entry) => hasText(entry.content))
      .filter((entry) => !existingIds.has(entry.id) && !queuedIds.has(entry.id));

    if (freshEntries.length === 0) return;

    freshEntries.forEach((entry) => queuedIds.add(entry.id));
    setWhiteboardInjecting(true);
    if (whiteboardInjectionTimerRef.current) {
      clearTimeout(whiteboardInjectionTimerRef.current);
      whiteboardInjectionTimerRef.current = null;
    }

    const now = Date.now();
    let cursorDelay = Math.max(
      WHITEBOARD_INJECTION_PLANNING_MS,
      whiteboardInjectionAvailableAtRef.current > now
        ? whiteboardInjectionAvailableAtRef.current - now + WHITEBOARD_INJECTION_BLOCK_PAUSE_MS
        : WHITEBOARD_INJECTION_PLANNING_MS
    );

    const registerTimer = (callback: () => void, delay: number) => {
      const timer = setTimeout(() => {
        whiteboardInjectionCommitTimersRef.current.delete(timer);
        callback();
      }, delay);
      whiteboardInjectionCommitTimersRef.current.add(timer);
    };

    let writtenCount = 0;
    freshEntries.forEach((entry) => {
      const fullContent = entry.content.trim();
      const frames = buildWritingFrames(fullContent);
      if (frames.length === 0) {
        queuedIds.delete(entry.id);
        return;
      }

      frames.forEach((frame, frameIndex) => {
        registerTimer(() => {
          setTeachingEntries((prev) => {
            const nextEntry = { ...entry, content: normalizeVisibleWhiteboardText(entry, frame) };
            const exists = prev.some((current) => current.id === entry.id);
            const next = exists
              ? prev.map((current) => current.id === entry.id ? nextEntry : current)
              : [...prev, nextEntry];

            return next.sort((a, b) => a.orderIndex - b.orderIndex);
          });

          if (frameIndex === frames.length - 1) {
            queuedIds.delete(entry.id);
            writtenCount += 1;
          }
        }, cursorDelay);
        cursorDelay += WHITEBOARD_INJECTION_FRAME_MS;
      });

      cursorDelay += WHITEBOARD_INJECTION_BLOCK_PAUSE_MS;
    });

    registerTimer(() => {
      console.info("[WS] Workspace escrito progresivamente", {
        whiteboardId: targetWhiteboardId,
        source,
        nuevos: writtenCount,
      });
      whiteboardInjectionTimerRef.current = setTimeout(() => {
        setWhiteboardInjecting(false);
        whiteboardInjectionTimerRef.current = null;
      }, WHITEBOARD_INJECTION_SETTLE_MS);
    }, cursorDelay);

    whiteboardInjectionAvailableAtRef.current = now + cursorDelay + WHITEBOARD_INJECTION_SETTLE_MS;
  }, []);

  useEffect(() => () => {
    clearWhiteboardInjectionTimers(false);
  }, [clearWhiteboardInjectionTimers]);

  useEffect(() => {
    const wasWaiting =
      previousTeachingPhaseRef.current === "WAITING_USER_INPUT" ||
      previousTeachingPhaseRef.current === "USER_WRITING";
    const isWaiting = teachingWaitingForAnswer;

    if (isWaiting && !wasWaiting) {
      teachingCanvasBaselineRef.current = new Map(
        whiteboardElementsRef.current.map((element) => [
          element.id,
          whiteboardElementSignature(element),
        ])
      );
      setTeachingCanvasBaselineVersion((version) => version + 1);
    }

    previousTeachingPhaseRef.current = teachingPhase;
  }, [teachingPhase, teachingWaitingForAnswer]);

  useEffect(() => {
    const question = teachingPauseQuestion?.trim();
    if (!teachingWaitingForAnswer || !hasText(question)) return;

    setQuestionPairs((prev) => {
      const currentId = activeQuestionIdRef.current;
      const currentPair = currentId ? prev.find((pair) => pair.questionId === currentId) : null;

      if (currentPair && currentPair.question === question && currentPair.status !== "answered") {
        return prev;
      }

      const reusablePair = [...prev]
        .reverse()
        .find((pair) => pair.question === question && pair.status !== "answered");

      if (reusablePair) {
        activeQuestionIdRef.current = reusablePair.questionId;
        setActiveQuestionId(reusablePair.questionId);
        return prev;
      }

      const questionId = `q${++questionSequenceRef.current}`;
      activeQuestionIdRef.current = questionId;
      setActiveQuestionId(questionId);

      return [
        ...prev,
        {
          questionId,
          question,
          answer: "",
          status: "waiting",
        },
      ];
    });
  }, [teachingPauseQuestion, teachingWaitingForAnswer]);

  const teachingCanvasAnswer =
    teachingWaitingForAnswer
      ? buildCanvasTeachingAnswer(whiteboardElements, teachingCanvasBaselineRef.current)
      : "";

  useEffect(() => {
    const questionId = activeQuestionIdRef.current;
    if (!questionId || !teachingWaitingForAnswer) return;

    const answer = teachingCanvasAnswer.trim();
    setQuestionPairs((prev) =>
      prev.map((pair) =>
        pair.questionId === questionId
          ? { ...pair, answer, status: answer ? "writing" : "waiting" }
          : pair
      )
    );
  }, [teachingCanvasAnswer, teachingWaitingForAnswer]);

  const handleTeachingSubmitFromCanvas = useCallback(() => {
    const answer = buildCanvasTeachingAnswer(whiteboardElementsRef.current, teachingCanvasBaselineRef.current);
    const questionId = activeQuestionIdRef.current;

    if (questionId && answer.trim()) {
      setQuestionPairs((prev) =>
        prev.map((pair) =>
          pair.questionId === questionId
            ? { ...pair, answer: answer.trim(), status: "answered" }
            : pair
        )
      );
    }

    teachingSubmitResponse(answer);
  }, [teachingSubmitResponse]);

  // La invocación explícita ("Explicar en pizarra") fue eliminada: el modelo abre/usa la
  // "Resolución guiada" automáticamente vía la acción SSE OPEN_WHITEBOARD según la intención.

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

  // Switching conversations: drop stale workspace state so content from another
  // conversation never bleeds in. The persisted blocks are reloaded below.
  const loadedEntriesConvRef = useRef<number | null>(null);
  useEffect(() => {
    clearWhiteboardInjectionTimers();
    setTeachingEntries([]);
    resetQuestionPairs();
    teachingRef.current.reset();
    wbAnimationRef.current.clearAnimation();
    loadedEntriesConvRef.current = null;
  }, [activeConversation?.backendId, clearWhiteboardInjectionTimers, resetQuestionPairs]);

  // Restore the guided-resolution workspace blocks for the active conversation from the
  // backend, so content persists across conversation switches and page reloads.
  useEffect(() => {
    const conversationId = activeConversation?.backendId;
    const board = whiteboard.activeWhiteboard;
    if (!conversationId || !board?.id || !accessToken) return;
    if (whiteboardInjecting || whiteboardInjectionCommitTimersRef.current.size > 0) return;
    // Durante el cambio de conversación, useWhiteboard recarga la pizarra de forma asíncrona,
    // así que activeWhiteboard puede quedar momentáneamente desfasada (la de la conversación
    // anterior). Solo restauramos cuando la pizarra activa pertenece a ESTA conversación,
    // para no cargar la pizarra de otra conversación (no se comparten).
    if (board.conversationId !== conversationId) return;
    if (loadedEntriesConvRef.current === conversationId) return;
    loadedEntriesConvRef.current = conversationId;

    let cancelled = false;
    void getWhiteboardEntries(conversationId, board.id, accessToken)
      .then((entries) => {
        if (cancelled) return;
        const fresh = entries.filter((e) => hasText(e.content));
        if (fresh.length === 0) return;
        setTeachingEntries((prev) => {
          const ids = new Set(prev.map((e) => e.id));
          return [...prev, ...fresh.filter((e) => !ids.has(e.id))]
            .sort((a, b) => a.orderIndex - b.orderIndex);
        });
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [activeConversation?.backendId, whiteboard.activeWhiteboard?.id, whiteboard.activeWhiteboard?.conversationId, accessToken, whiteboardInjecting]);

  // La "Resolución guiada" es de solo lectura: el estudiante no edita bloques manualmente.

  // Handle backend whiteboard actions (OPEN_WHITEBOARD, UPDATE_WHITEBOARD)
  useEffect(() => {
    if (!activeWhiteboardAction) return;

    const action = activeWhiteboardAction;
    setActiveWhiteboardAction(null);

    if (action.type === "OPEN_WHITEBOARD") {
      // Open-or-reuse: only reset when the workspace is genuinely empty. If it already
      // has content, keep it and merge the incoming blocks — never erase what's accumulated.
      const hasExistingContent = teachingEntriesRef.current.length > 0;
      if (!hasExistingContent) {
        setTeachingEntries([]);
        resetQuestionPairs();
        teachingRef.current.reset();
        wbAnimationRef.current.clearAnimation();
      }
      whiteboard.setPanelOpen(true);
      const conversationId = action.payload.conversationId ?? activeConversation?.backendId;
      const incoming = action.payload.blocks ?? action.payload.entries ?? [];
      console.info("[WS] Frontend recibió OPEN_WHITEBOARD", {
        whiteboardId: action.payload.whiteboardId, conversationId, bloques: incoming.length,
      });
      if (conversationId && accessToken) {
        void whiteboard.openConversationWhiteboard(conversationId).then((board) => {
          const targetWhiteboardId = board?.id ?? action.payload.whiteboardId;
          if (!targetWhiteboardId) return;

          const incomingEntries = normalizeWhiteboardEntries(incoming, conversationId, targetWhiteboardId);
          if (incomingEntries.length > 0) {
            scheduleWhiteboardInjection(incomingEntries, targetWhiteboardId, "OPEN_WHITEBOARD");
            return;
          }

          // Solo iniciar la resolución progresiva si el workspace está VACÍO y no hay una
          // sesión en curso. Si ya hay contenido, reutilizamos (no regeneramos ni borramos):
          // open_whiteboard sin bloques sobre un workspace con contenido solo reabre el panel.
          if (hasExistingContent || teachingRef.current.isActive) return;

          // Topic comes from the last user message in the conversation
          const msgs = activeConversation?.messages ?? [];
          const lastUserMsg = [...msgs].reverse().find((m) => m.role === "user");
          teachingRef.current.start(lastUserMsg?.content ?? undefined, targetWhiteboardId);
        });
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
    } else if (action.type === "UPDATE_WHITEBOARD") {
      // Direct update (non-teaching): show entries with animation
      const incoming = action.payload.blocks ?? action.payload.entries ?? [];
      const conversationId = action.payload.conversationId ?? activeConversation?.backendId;
      const targetWhiteboardId = action.payload.whiteboardId ?? whiteboard.activeWhiteboard?.id;
      console.info("[WS] Frontend recibió UPDATE_WHITEBOARD", {
        whiteboardId: targetWhiteboardId, conversationId, bloques: incoming.length,
      });
      whiteboard.setPanelOpen(true);
      if (conversationId && accessToken) {
        void whiteboard.openConversationWhiteboard(conversationId);
      }
      if (incoming.length > 0 && conversationId && targetWhiteboardId) {
        const incomingEntries = normalizeWhiteboardEntries(incoming, conversationId, targetWhiteboardId);
        scheduleWhiteboardInjection(incomingEntries, targetWhiteboardId, "UPDATE_WHITEBOARD");
      }
    } else if (action.type === "INJECT_WHITEBOARD_CONTENT") {
      // Teaching session is active — ignore SSE injection (teaching hook manages content)
      // If teaching is idle (e.g. SSE-only flow), fall back to regular injection
      if (!teachingRef.current.isActive) {
        const incoming = action.payload.blocks ?? action.payload.entries ?? [];
        const conversationId = action.payload.conversationId ?? activeConversation?.backendId;
        const targetWhiteboardId = action.payload.whiteboardId ?? whiteboard.activeWhiteboard?.id;
        console.info("[WS] Frontend recibió INJECT_WHITEBOARD_CONTENT", {
          whiteboardId: targetWhiteboardId, conversationId, bloques: incoming.length,
        });
        whiteboard.setPanelOpen(true);
        if (conversationId && accessToken) {
          void whiteboard.openConversationWhiteboard(conversationId);
        }
        if (incoming.length > 0 && conversationId && targetWhiteboardId) {
          const incomingEntries = normalizeWhiteboardEntries(incoming, conversationId, targetWhiteboardId);
          scheduleWhiteboardInjection(incomingEntries, targetWhiteboardId, "INJECT_WHITEBOARD_CONTENT");
        }
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeWhiteboardAction, setActiveWhiteboardAction]);

  // "Guía del ejercicio" (break_down_exercise / ExerciseStepsPanel) fue eliminada.

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
              onOpenExerciseWhiteboard={async (exercise) => {
                whiteboard.openPendingPanel();
                const conversationId = activeConversation?.backendId ?? await ensureBackendConversation("Resolución guiada").catch((error) => {
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
                const conversationId = activeConversation?.backendId ?? await ensureBackendConversation("Resolución guiada").catch((error) => {
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
                    <ErrorBoundary>
                    <WhiteboardPanel
                        whiteboard={whiteboard.activeWhiteboard}
                        token={accessToken}
                        suggestion={activeWhiteboardSuggestion}
                        askStatus={whiteboardAskStatus}
                        loading={whiteboard.loading}
                        error={whiteboard.error}
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
                        injectionLoading={showWhiteboardInjection}
                        conversationId={activeConversation?.backendId ?? null}
                        animState={wbAnimation.state}
                        onClearTeachingEntries={() => {
                          setTeachingEntries([]);
                          resetQuestionPairs();
                          teaching.reset();
                        }}
                        onEraseTeachingEntry={(id) => setTeachingEntries((prev) => prev.filter((e) => e.id !== id))}
                        reasoningNodes={reasoningNodes}
                        teachingPhase={teachingPhase}
                        questionPairs={questionPairs}
                        activeQuestionId={activeQuestionId}
                        onTeachingSubmit={handleTeachingSubmitFromCanvas}
                        onTeachingContinue={teachingContinueWithout}
                    />
                    </ErrorBoundary>
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
