import React, { useEffect, useRef } from "react";
import { AnimatePresence } from "framer-motion";
import MessageBubble from "./MessageBubble";
import SuggestionBubbles from "./SuggestionBubbles";
import EmptyState from "./EmptyState";
import type { Message } from "@/types/chat";

interface Props {
  messages: Message[];
  isTyping: boolean;
  onSuggestion: (text: string) => void;
  onRegenerate?: () => void;
}

const MessageList = ({ messages, isTyping, onSuggestion, onRegenerate }: Props) => {
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
        <EmptyState onSuggestion={onSuggestion} />
      ) : (
        <div className="mx-auto flex w-full max-w-5xl flex-col px-4 py-4">
          <AnimatePresence initial={false}>
            {messages.map((msg, i) => (
              <React.Fragment key={msg.id}>
                <MessageBubble
                  message={msg}
                  isFirstInGroup={i === 0 || messages[i - 1].role !== msg.role}
                  isLastAssistant={!isTyping && i === lastAssistantIndex}
                  isStreaming={isTyping && i === messages.length - 1 && msg.role === "assistant"}
                  onRegenerate={onRegenerate}
                />
                {!isTyping && i === lastAssistantIndex && userMessageCount >= 2 && msg.suggestions?.length ? (
                  <SuggestionBubbles suggestions={msg.suggestions} onSelect={onSuggestion} />
                ) : null}
              </React.Fragment>
            ))}
          </AnimatePresence>
        </div>
      )}
      <div ref={bottomRef} />
    </div>
  );
};

export default MessageList;
