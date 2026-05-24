import { useState, useEffect, useRef, useMemo, lazy, Suspense } from "react";
import { motion } from "framer-motion";
import MarkdownIt from "markdown-it";
import { Bot, User, Copy, Check, WifiOff, Wifi, RefreshCw, FileText } from "lucide-react";

const mdInline = new MarkdownIt({ html: false, typographer: true });

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

  // Typewriter effect
  const [displayed, setDisplayed] = useState(isStreaming ? "" : message.content);
  const pendingRef = useRef("");
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const prevContentRef = useRef(message.content);

  useEffect(() => {
    if (isStreaming) {
      const newChars = message.content.slice(prevContentRef.current.length);
      prevContentRef.current = message.content;
      pendingRef.current += newChars;
    } else {
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
      pendingRef.current = "";
      prevContentRef.current = message.content;
      setDisplayed(message.content);
    }
  }, [message.content, isStreaming]);

  useEffect(() => {
    if (!isStreaming) return;
    timerRef.current = setInterval(() => {
      if (pendingRef.current.length === 0) return;
      const batch = pendingRef.current.length > 120 ? 2 : 1;
      setDisplayed((prev) => prev + pendingRef.current.slice(0, batch));
      pendingRef.current = pendingRef.current.slice(batch);
    }, 70);
    return () => { if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; } };
  }, [isStreaming]);
  const isUser = message.role === "user";
  const isError = message.isError === true;
  const isRestored = message.isRestored === true;

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const time = message.timestamp.toLocaleString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
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
            ? "bg-slate-800"
            : isError
              ? "bg-destructive/15 ring-1 ring-destructive/30"
              : isRestored
                ? "bg-emerald-100"
                : "bg-teal-50"
        )}
      >
        {isUser ? (
          <User className="h-4 w-4 text-white" />
        ) : isError ? (
          <WifiOff className="h-4 w-4 text-destructive" />
        ) : isRestored ? (
          <Wifi className="h-4 w-4 text-emerald-500" />
        ) : (
          <Bot className="h-4 w-4 text-teal-500" />
        )}
      </div>

      {/* Bubble */}
      <div className={cn("flex min-w-0 max-w-[85%] flex-col gap-1", isUser && "items-end")}>
        <div
          className={cn(
            "relative rounded-2xl px-5 py-3",
            !isUser && !isError && !isRestored && "pr-20",
            isUser
              ? "rounded-tr-none bg-slate-800 text-white"
              : isError
                ? "rounded-bl-none border border-destructive/30 bg-destructive/10 text-destructive"
                : isRestored
                  ? "rounded-bl-none border border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                  : "rounded-bl-none border border-slate-100 bg-slate-50/60 text-slate-700"
          )}
        >
          {!isError && !isRestored && !isUser && (
            <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
              {isLastAssistant && (
                <button
                  onClick={onRegenerate}
                  disabled={!onRegenerate}
                  aria-label="Regenerar respuesta"
                  className="flex h-7 w-7 items-center justify-center rounded-full border border-border bg-background shadow-sm hover:bg-secondary disabled:opacity-40 disabled:cursor-not-allowed"
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

          {isStreaming && !displayed ? (
            <TypingDots />
          ) : (
            <Suspense fallback={<span className="text-sm opacity-60">{displayed}</span>}>
              <MessageContent content={displayed} isUser={isUser} isStreaming={isStreaming && !!displayed} />
            </Suspense>
          )}

        </div>

        {isUser && message.attachedFileName && (
          <div className="flex items-center gap-1.5 px-1 pt-0.5">
            <FileText className="h-3 w-3 shrink-0 text-cyan-400/70" />
            <span className="rounded-md bg-cyan-400/10 px-2 py-0.5 text-[10px] font-medium text-cyan-400/80">
              {message.attachedFileName}
            </span>
          </div>
        )}

        <span className="px-1 text-[11px] text-muted-foreground">{time}</span>

        {!isUser && !isStreaming && isLastAssistant && message.suggestions && message.suggestions.length > 0 && (
          <div className="flex flex-wrap gap-2 px-1 pt-2">
            {message.suggestions.map((q) => (
              <button
                key={q}
                onClick={() => onSuggestion?.(q)}
                className="rounded-2xl border border-teal-200 bg-teal-50 px-4 py-2 text-xs font-medium text-teal-700 shadow-sm transition-colors hover:bg-teal-100 hover:text-teal-900"
                dangerouslySetInnerHTML={{ __html: mdInline.renderInline(q) }}
              />
            ))}
          </div>
      </div>
    </motion.div>
  );
};

export default MessageBubble;
