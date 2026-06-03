import React, { useEffect, useRef } from "react";
import { AnimatePresence } from "framer-motion";
import MessageBubble from "./MessageBubble";
import SuggestionBubbles from "./SuggestionBubbles";
import EmptyState from "./EmptyState";
import type { Message } from "@/types/chat";

interface Props {
  messages: Message[];
  isTyping: boolean;
  onSuggestion: (messageId: string, text: string) => void;
  onRegenerate?: () => void;
  onOpenExerciseBreakdown?: (message: Message) => void;
  onExplainInWhiteboard?: (message: Message) => void;
  isLoadingHistory?: boolean;
}

const MessageList = ({ messages, isTyping, onSuggestion, onRegenerate, onOpenExerciseBreakdown, onExplainInWhiteboard, isLoadingHistory = false }: Props) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, isTyping]);

  const lastAssistantIndex = messages.reduceRight(
    (found, msg, i) => (found === -1 && msg.role === "assistant" ? i : found),
    -1
  );

  const userMessageCount = messages.filter((m) => m.role === "user").length;

  return (
    <div className="flex min-w-0 flex-1 flex-col overflow-x-hidden overflow-y-auto">
      {messages.length === 0 && !isTyping ? (
        <EmptyState onSuggestion={(text) => onSuggestion("", text)} isLoadingHistory={isLoadingHistory} />
      ) : (
        <div className="mx-auto flex w-full max-w-5xl flex-col px-4 py-4">
          <AnimatePresence initial={false}>
            {messages.map((msg, i) => {
              const canShowActiveSuggestions =
                !isTyping && i === lastAssistantIndex && userMessageCount >= 1;
              const shouldShowSuggestions =
                msg.suggestions?.length && (canShowActiveSuggestions || msg.suggestionsLocked);

              return (
                <React.Fragment key={msg.id}>
                  <MessageBubble
                    message={msg}
                    isFirstInGroup={i === 0 || messages[i - 1].role !== msg.role}
                    isLastAssistant={!isTyping && i === lastAssistantIndex}
                    isStreaming={isTyping && i === messages.length - 1 && msg.role === "assistant"}
                    onRegenerate={onRegenerate}
                    onOpenExerciseBreakdown={
                      msg.exerciseBreakdown ? () => onOpenExerciseBreakdown?.(msg) : undefined
                    }
                    onExplainInWhiteboard={
                      msg.role === "assistant" && !msg.isError
                        ? () => onExplainInWhiteboard?.(msg)
                        : undefined
                    }
                  />
                  {shouldShowSuggestions ? (
                    <SuggestionBubbles
                      suggestions={msg.suggestions!}
                      selectedSuggestion={msg.selectedSuggestion}
                      disabled={Boolean(msg.suggestionsLocked)}
                      onSelect={(text) => onSuggestion(msg.id, text)}
                    />
                  ) : null}
                </React.Fragment>
              );
            })}
          </AnimatePresence>
        </div>
      )}
      <div ref={bottomRef} />
    </div>
  );
};

export default MessageList;
