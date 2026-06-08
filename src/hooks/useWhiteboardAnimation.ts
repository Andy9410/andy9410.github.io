import { useCallback, useEffect, useRef, useState } from "react";
import type { WhiteboardEntry } from "@/types/whiteboard";
import { hasText } from "@/utils/whiteboardRenderGuards";

// ─── State Machine ────────────────────────────────────────────────────────────

export type WBPhase =
  | "IDLE"
  | "THINKING"
  | "CREATING_BLOCK"
  | "TYPING"
  | "COMPLETED"
  | "WAITING_NEXT_STEP";

export interface AnimatedBlock {
  entry: WhiteboardEntry;
  phase: "skeleton" | "typing" | "complete";
  visibleText: string;
}

export interface WhiteboardAnimState {
  phase: WBPhase;
  thinkingMessage: string;
  blocks: AnimatedBlock[];
  activeBlockIndex: number;
}

const THINKING_MESSAGES = [
  "Analizando el problema...",
  "Identificando datos relevantes...",
  "Planificando la resolución...",
  "Preparando la explicación...",
];

const THINKING_DURATION_MS = 1800;
const SKELETON_DURATION_MS  = 500;
const WORDS_PER_SECOND       = 6;   // typing speed
const WORD_DELAY_MS          = Math.round(1000 / WORDS_PER_SECOND);
const BETWEEN_BLOCKS_MS      = 300;

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useWhiteboardAnimation() {
  const [state, setState] = useState<WhiteboardAnimState>({
    phase: "IDLE",
    thinkingMessage: "",
    blocks: [],
    activeBlockIndex: -1,
  });

  const queueRef   = useRef<WhiteboardEntry[]>([]);
  const runningRef = useRef(false);
  const timerRef   = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = () => {
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
  };

  const delay = (ms: number) => new Promise<void>((res) => {
    timerRef.current = setTimeout(res, ms);
  });

  // Typewriter: reveal text word-by-word
  const typeText = useCallback(
    async (blockIndex: number, fullText: string, signal: { cancelled: boolean }) => {
      const words = fullText.split(" ");
      let visible = "";
      for (let i = 0; i < words.length; i++) {
        if (signal.cancelled) return;
        visible = words.slice(0, i + 1).join(" ");
        setState((prev) => ({
          ...prev,
          blocks: prev.blocks.map((b, idx) =>
            idx === blockIndex ? { ...b, phase: "typing", visibleText: visible } : b
          ),
        }));
        await delay(WORD_DELAY_MS);
      }
    },
    []
  );

  const runAnimation = useCallback(async (rawEntries: WhiteboardEntry[]) => {
    const entries = rawEntries.filter((entry) => hasText(entry.content));
    if (!entries.length) return;

    if (runningRef.current) return;
    runningRef.current = true;
    const signal = { cancelled: false };

    try {
      // ── Phase 1: THINKING ────────────────────────────────────────────
      for (let i = 0; i < THINKING_MESSAGES.length; i++) {
        setState((prev) => ({
          ...prev,
          phase: "THINKING",
          thinkingMessage: THINKING_MESSAGES[i],
        }));
        await delay(THINKING_DURATION_MS / THINKING_MESSAGES.length);
        if (signal.cancelled) return;
      }

      // ── Phase 2: Create skeleton blocks ─────────────────────────────
      const initialBlocks: AnimatedBlock[] = entries.map((e) => ({
        entry: e,
        phase: "skeleton",
        visibleText: "",
      }));
      setState((prev) => ({
        ...prev,
        phase: "CREATING_BLOCK",
        blocks: [...prev.blocks, ...initialBlocks],
        activeBlockIndex: prev.blocks.length,
      }));
      await delay(SKELETON_DURATION_MS);
      if (signal.cancelled) return;

      // ── Phase 3: Type each block ─────────────────────────────────────
      const startIdx = state.blocks.length; // offset if there were previous blocks

      for (let i = 0; i < entries.length; i++) {
        const blockIdx = startIdx + i;
        if (signal.cancelled) return;

        // Switch to TYPING state for this block
        setState((prev) => ({
          ...prev,
          phase: "TYPING",
          activeBlockIndex: blockIdx,
          blocks: prev.blocks.map((b, idx) =>
            idx === blockIdx ? { ...b, phase: "typing", visibleText: "" } : b
          ),
        }));

        const text = entries[i].content;
        await typeText(blockIdx, text, signal);
        if (signal.cancelled) return;

        // Mark block as complete
        setState((prev) => ({
          ...prev,
          blocks: prev.blocks.map((b, idx) =>
            idx === blockIdx ? { ...b, phase: "complete", visibleText: text } : b
          ),
        }));

        if (i < entries.length - 1) {
          await delay(BETWEEN_BLOCKS_MS);
        }
      }

      // ── Phase 4: COMPLETED ───────────────────────────────────────────
      setState((prev) => ({
        ...prev,
        phase: "COMPLETED",
        activeBlockIndex: -1,
        thinkingMessage: "",
      }));

    } finally {
      runningRef.current = false;
      queueRef.current = [];
    }
  }, [state.blocks.length, typeText]);

  /** Called when new teaching entries arrive */
  const animateEntries = useCallback(
    (rawEntries: WhiteboardEntry[]) => {
      const entries = rawEntries.filter((entry) => hasText(entry.content));
      if (!entries.length) return;
      clearTimer();
      runningRef.current = false; // force restart
      // Reset and animate fresh
      setState({
        phase: "IDLE",
        thinkingMessage: "",
        blocks: [],
        activeBlockIndex: -1,
      });
      // Small delay to allow state reset to render
      timerRef.current = setTimeout(() => {
        void runAnimation(entries);
      }, 50);
    },
    [runAnimation]
  );

  const clearAnimation = useCallback(() => {
    clearTimer();
    runningRef.current = false;
    setState({ phase: "IDLE", thinkingMessage: "", blocks: [], activeBlockIndex: -1 });
  }, []);

  // Cleanup
  useEffect(() => () => { clearTimer(); runningRef.current = false; }, []);

  return { state, animateEntries, clearAnimation };
}
