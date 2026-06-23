import { useEffect, useRef } from "react";
import type { AnimatedBlock, WBPhase } from "@/hooks/useWhiteboardAnimation";
import { cn } from "@/lib/utils";
import { hasText } from "@/utils/whiteboardRenderGuards";

function blockStyle(author: string, type: string): string {
  if (author === "user") return "wb-block-user";
  return type === "AI_CORRECTION" ? "wb-block-ai-correction" : "wb-block-ai";
}

// ─── Single block ──────────────────────────────────────────────────────────

interface BlockProps {
  block: AnimatedBlock;
  isActive: boolean;
}

function AnimatedBlockView({ block, isActive }: BlockProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { entry, phase, visibleText } = block;
  const author = entry.author ?? "assistant";

  useEffect(() => {
    if (isActive && ref.current) {
      ref.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [isActive, visibleText]);

  if (!hasText(entry.content) && !hasText(visibleText)) return null;
  if (phase === "skeleton" || !hasText(visibleText)) return null;

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
      <span className={cn("wb-block-text", isBold && "wb-block-bold")}>
        {visibleText}
        {phase === "typing" && <span className="wb-cursor">|</span>}
      </span>
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
  const visibleBlocks = blocks.filter((block) => hasText(block.entry.content) || hasText(block.visibleText));

  return (
    <div className="wb-overlay-root">
      {(phase === "THINKING" || phase === "CREATING_BLOCK") && (
        <div className="wb-thinking-bar">
          <span className="wb-thinking-spinner" />
          <span className="wb-thinking-text">{thinkingMessage || "Preparando..."}</span>
        </div>
      )}

      {visibleBlocks.length > 0 && (
        <div className="wb-blocks-container">
          {visibleBlocks.map((block, i) => (
            <AnimatedBlockView
              key={block.entry.id}
              block={block}
              isActive={i === activeBlockIndex}
            />
          ))}
        </div>
      )}
    </div>
  );
}
