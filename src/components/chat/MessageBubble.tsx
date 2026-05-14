import { useState, lazy, Suspense } from "react";
import { motion } from "framer-motion";
import { Bot, User, Copy, Check, WifiOff, Wifi, RefreshCw } from "lucide-react";

const dot = { initial: { y: 0 }, animate: { y: -4 } };

const TypingDots = () => (
  <div className="flex items-center gap-1.5 py-0.5">
    {[0, 1, 2].map((i) => (
      <motion.span
        key={i}
        className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60"
        variants={dot}
        initial="initial"
        animate="animate"
        transition={{ duration: 0.4, repeat: Infinity, repeatType: "reverse", delay: i * 0.12, ease: "easeInOut" }}
      />
    ))}
  </div>
);
import { cn } from "@/lib/utils";
import type { Message } from "@/types/chat";

const MessageContent = lazy(() => import("./MessageContent"));

interface Props {
  message: Message;
  isFirstInGroup?: boolean;
  isLastAssistant?: boolean;
  isStreaming?: boolean;
  onRegenerate?: () => void;
}

const MessageBubble = ({ message, isFirstInGroup = true, isLastAssistant = false, isStreaming = false, onRegenerate }: Props) => {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === "user";
  const isError = message.isError === true;
  const isRestored = message.isRestored === true;

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const time = message.timestamp.toLocaleTimeString("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className={cn(
        "group flex items-end gap-3 px-4",
        isFirstInGroup ? "pt-4 pb-1" : "pt-0.5 pb-1",
        isUser && "flex-row-reverse"
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
          isUser
            ? "bg-primary ring-2 ring-primary/20"
            : isError
              ? "bg-destructive/15 ring-1 ring-destructive/30"
              : isRestored
                ? "bg-emerald-500/15 ring-1 ring-emerald-500/30"
                : "bg-accent/15 ring-1 ring-accent/20"
        )}
      >
        {isUser ? (
          <User className="h-4 w-4 text-primary-foreground" />
        ) : isError ? (
          <WifiOff className="h-4 w-4 text-destructive" />
        ) : isRestored ? (
          <Wifi className="h-4 w-4 text-emerald-500" />
        ) : (
          <Bot className="h-4 w-4 text-accent" />
        )}
      </div>

      {/* Bubble */}
      <div className={cn("flex max-w-[85%] flex-col gap-1", isUser && "items-end")}>
        <div
          className={cn(
            "relative rounded-2xl px-4 py-3",
            isUser
              ? "rounded-br-none bg-primary text-primary-foreground"
              : isError
                ? "rounded-bl-none border border-destructive/30 bg-destructive/10 text-destructive"
                : isRestored
                  ? "rounded-bl-none border border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                  : "rounded-bl-none bg-section-alt text-foreground"
          )}
        >
          {!isError && !isRestored && !isUser && (
            <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
              {isLastAssistant && onRegenerate && (
                <button
                  onClick={onRegenerate}
                  aria-label="Regenerar respuesta"
                  className="flex h-7 w-7 items-center justify-center rounded-full border border-border bg-background shadow-sm hover:bg-secondary"
                >
                  <RefreshCw className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              )}
              <button
                onClick={copyToClipboard}
                aria-label="Copiar mensaje"
                className="flex h-7 w-7 items-center justify-center rounded-full border border-border bg-background shadow-sm hover:bg-secondary"
              >
                {copied ? (
                  <Check className="h-3.5 w-3.5 text-accent" />
                ) : (
                  <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                )}
              </button>
            </div>
          )}

          {isStreaming && !message.content ? (
            <TypingDots />
          ) : (
            <Suspense fallback={<span className="text-sm opacity-60">{message.content}</span>}>
              <MessageContent content={message.content} isUser={isUser} isStreaming={isStreaming && !!message.content} />
            </Suspense>
          )}

        </div>

        <span className="px-1 text-[11px] text-muted-foreground">{time}</span>
      </div>
    </motion.div>
  );
};

export default MessageBubble;
