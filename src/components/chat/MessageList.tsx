import { useEffect, useRef } from "react";
import { AnimatePresence } from "framer-motion";
import MessageBubble from "./MessageBubble";
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

  return (
    <div className="flex min-w-0 flex-1 flex-col overflow-x-hidden overflow-y-auto">
      {messages.length === 0 && !isTyping ? (
        <EmptyState onSuggestion={onSuggestion} />
      ) : (
        <div className="mx-auto flex w-full max-w-3xl flex-col px-4 py-4">
          <AnimatePresence initial={false}>
            {messages.map((msg, i) => (
              <MessageBubble
                key={msg.id}
                message={msg}
                isFirstInGroup={i === 0 || messages[i - 1].role !== msg.role}
                isLastAssistant={!isTyping && i === lastAssistantIndex}
                isStreaming={isTyping && i === messages.length - 1 && msg.role === "assistant"}
                onRegenerate={onRegenerate}
              />
            ))}
          </AnimatePresence>
        </div>
      )}
      <div ref={bottomRef} />
    </div>
  );
};

export default MessageList;
