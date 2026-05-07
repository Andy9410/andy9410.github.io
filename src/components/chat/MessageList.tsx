import { useEffect, useRef } from "react";
import { AnimatePresence } from "framer-motion";
import MessageBubble from "./MessageBubble";
import TypingIndicator from "./TypingIndicator";
import EmptyState from "./EmptyState";
import type { Message } from "@/types/chat";

interface Props {
  messages: Message[];
  isTyping: boolean;
  onSuggestion: (text: string) => void;
}

const MessageList = ({ messages, isTyping, onSuggestion }: Props) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, isTyping]);

  return (
    <div className="flex flex-1 flex-col overflow-y-auto">
      {messages.length === 0 && !isTyping ? (
        <EmptyState onSuggestion={onSuggestion} />
      ) : (
        <div className="flex flex-col py-4">
          <AnimatePresence initial={false}>
            {messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} />
            ))}
          </AnimatePresence>

          {isTyping && <TypingIndicator />}
        </div>
      )}
      <div ref={bottomRef} className="h-4 shrink-0" />
    </div>
  );
};

export default MessageList;
