import { useEffect, useRef } from "react";
import type { AnimatedBlock, WBPhase } from "@/hooks/useWhiteboardAnimation";
import { cn } from "@/lib/utils";

// ─── Icons per type ────────────────────────────────────────────────────────

const TYPE_ICON: Record<string, string> = {
  TITLE:             "📌",
  STEP:              "▶",
  FORMULA:           "∫",
  EXAMPLE:           "💡",
  WARNING:           "⚠",
  QUESTION:          "?",
  AI_NOTE:           "✦",   // AI observation
  AI_QUESTION:       "🎓",  // Socratic/teacher question
  AI_CORRECTION:     "⚑",  // Error hint
  TEXT:              "",
  SYSTEM_NOTE:       "•",
};

// ─── Styles per author + type ──────────────────────────────────────────────

function blockStyle(author: string, type: string): string {
  if (author === "user") {
    // Student content — white chalk
    return "wb-block-user";
  }
  // AI content styles by type
  switch (type) {
    case "AI_NOTE":       return "wb-block-ai-note";
    case "AI_QUESTION":   return "wb-block-ai-question";
    case "AI_CORRECTION": return "wb-block-ai-correction";
    default:              return "wb-block-ai";
  }
}

// ─── Single block ──────────────────────────────────────────────────────────

interface BlockProps {
  block: AnimatedBlock;
  isActive: boolean;
  index: number;
}

function AnimatedBlockView({ block, isActive, index }: BlockProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { entry, phase, visibleText } = block;
  const icon = TYPE_ICON[entry.type] ?? "";
  const author = entry.author ?? "assistant";

  useEffect(() => {
    if (isActive && ref.current) {
      ref.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [isActive, visibleText]);

  if (phase === "skeleton") {
    return (
      <div ref={ref} className="wb-skeleton-block" style={{ animationDelay: `${index * 0.08}s` }}>
        <div className="wb-shimmer" />
      </div>
    );
  }

  const isBold  = entry.type === "TITLE" || entry.type === "STEP";
  const style   = blockStyle(author, entry.type);

  return (
    <div
      ref={ref}
      className={cn(
        "wb-content-block",
        style,
        isActive && "wb-block-active",
        phase === "complete" && "wb-block-complete"
      )}
    >
      {icon && <span className="wb-block-icon">{icon}</span>}
      <span className={cn("wb-block-text", isBold && "wb-block-bold")}>
        {visibleText}
        {phase === "typing" && <span className="wb-cursor">|</span>}
      </span>
      {phase === "complete" && author === "assistant" && (
        <span className="wb-check" aria-hidden>✓</span>
      )}
    </div>
  );
}

// ─── Main overlay ──────────────────────────────────────────────────────────

interface Props {
  phase: WBPhase;
  thinkingMessage: string;
  blocks: AnimatedBlock[];
  activeBlockIndex: number;
}

export function WhiteboardAnimatedOverlay({ phase, thinkingMessage, blocks, activeBlockIndex }: Props) {
  if (phase === "IDLE") return null;

  return (
    <div className="wb-overlay-root">
      {(phase === "THINKING" || phase === "CREATING_BLOCK") && (
        <div className="wb-thinking-bar">
          <span className="wb-thinking-spinner" />
          <span className="wb-thinking-text">{thinkingMessage || "Preparando..."}</span>
        </div>
      )}

      {blocks.length > 0 && (
        <div className="wb-blocks-container">
          {blocks.map((block, i) => (
            <AnimatedBlockView
              key={block.entry.id}
              block={block}
              isActive={i === activeBlockIndex}
              index={i}
            />
          ))}
        </div>
      )}

      {phase === "COMPLETED" && blocks.length > 0 && (
        <div className="wb-completion-bar">✓ Listo</div>
      )}
    </div>
  );
}
