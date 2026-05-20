import { useEffect, useLayoutEffect, useRef, useCallback } from "react";
import { AnimatePresence } from "framer-motion";
import MessageBubble from "./MessageBubble";
import EmptyState from "./EmptyState";
import type { Message } from "@/types/chat";

interface Props {
  messages: Message[];
  isTyping: boolean;
  onSuggestion: (text: string) => void;
  onRegenerate?: () => void;
  onLoadMore?: () => void;
  hasMore?: boolean;
  isLoadingMore?: boolean;
}

const MessageList = ({
  messages,
  isTyping,
  onSuggestion,
  onRegenerate,
  onLoadMore,
  hasMore,
  isLoadingMore,
}: Props) => {
  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const prevScrollHeightRef = useRef(0);
  const suppressScrollRef = useRef(false);
  const isLoadingMoreRef = useRef(isLoadingMore);

  useEffect(() => {
    isLoadingMoreRef.current = isLoadingMore;
  }, [isLoadingMore]);

  // Restore scroll position synchronously after prepending older messages
  useLayoutEffect(() => {
    if (!scrollRef.current) return;
    if (suppressScrollRef.current && prevScrollHeightRef.current > 0) {
      const newScrollHeight = scrollRef.current.scrollHeight;
      scrollRef.current.scrollTop = newScrollHeight - prevScrollHeightRef.current;
      suppressScrollRef.current = false;
      prevScrollHeightRef.current = 0;
    }
  }, [messages.length]);

  // Scroll to bottom for new messages and streaming
  useEffect(() => {
    if (suppressScrollRef.current) return;
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, isTyping]);

  const handleScroll = useCallback(() => {
    if (!scrollRef.current || !hasMore || isLoadingMoreRef.current) return;
    if (scrollRef.current.scrollTop < 120) {
      prevScrollHeightRef.current = scrollRef.current.scrollHeight;
      suppressScrollRef.current = true;
      onLoadMore?.();
    }
  }, [hasMore, onLoadMore]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener("scroll", handleScroll, { passive: true });
    return () => el.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

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
          {isLoadingMore && (
            <div className="flex justify-center py-3">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-muted-foreground" />
            </div>
          )}
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
