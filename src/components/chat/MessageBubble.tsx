import { useState, lazy, Suspense } from "react";
import { motion } from "framer-motion";
import { Bot, User, Copy, Check, WifiOff, Wifi, RefreshCw, FileText, BookOpenCheck } from "lucide-react";

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
  onOpenExerciseBreakdown?: () => void;
}

const MessageBubble = ({ message, isFirstInGroup = true, isLastAssistant = false, isStreaming = false, onRegenerate, onOpenExerciseBreakdown }: Props) => {
  const [copied, setCopied] = useState(false);
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
        "group flex items-start gap-3 px-4",
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
      <div className={cn("flex min-w-0 flex-col gap-1", !isUser && "w-full flex-1", isUser && "max-w-[78%] items-end")}>
        <div
          className={cn(
            "relative rounded-lg",
            isUser ? "px-3 py-1.5" : "px-4 py-2.5",
            !isUser && "w-full",
            !isUser && !isError && !isRestored && "pr-16",
            isUser
              ? "rounded-tr-none bg-slate-800 text-white"
              : isError
                ? "rounded-tl-none border border-destructive/30 bg-destructive/10 text-destructive"
                : isRestored
                  ? "rounded-tl-none border border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                  : "rounded-tl-none border border-slate-100 bg-slate-50/60 text-slate-700"
          )}
        >
          {/* Tail — CSS border triangle, perfectly flush with the rounded-tr/tl-none corner */}
          {isUser ? (
            /* Right-pointing solid triangle for user bubble */
            <span
              aria-hidden="true"
              className="pointer-events-none absolute left-full top-[7px] w-0 h-0
                border-t-[7px] border-t-transparent
                border-b-[7px] border-b-transparent
                border-r-[9px] border-r-slate-800"
            />
          ) : (
            /* Left-pointing outlined triangle for assistant bubble */
            <>
              <span
                aria-hidden="true"
                className={cn(
                  "pointer-events-none absolute right-full top-[7px] w-0 h-0",
                  "border-t-[7px] border-t-transparent border-b-[7px] border-b-transparent",
                  isError   ? "border-l-[9px] border-l-red-200"
                  : isRestored ? "border-l-[9px] border-l-emerald-200"
                  : "border-l-[9px] border-l-slate-200"
                )}
              />
              <span
                aria-hidden="true"
                className={cn(
                  "pointer-events-none absolute right-full top-[7px] w-0 h-0",
                  "border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent",
                  isError   ? "border-l-[8px] border-l-red-50"
                  : isRestored ? "border-l-[8px] border-l-emerald-50"
                  : "border-l-[8px] border-l-slate-50"
                )}
              />
            </>
          )}

          {!isError && !isRestored && !isUser && (
            <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
              {isLastAssistant && (
                <button
                  onClick={onRegenerate}
                  disabled={!onRegenerate}
                  aria-label="Regenerar respuesta"
                  className="flex h-7 w-7 items-center justify-center rounded-full border border-border bg-background shadow-sm hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <RefreshCw className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              )}
              <button
                onClick={copyToClipboard}
                aria-label={copied ? "Respuesta copiada" : "Copiar respuesta"}
                className="flex h-7 w-7 items-center justify-center rounded-full border border-border bg-background shadow-sm hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                {copied ? (
                  <Check className="h-3.5 w-3.5 text-accent" />
                ) : (
                  <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                )}
              </button>
            </div>
          )}

          {message.exerciseBreakdown ? (
            <button
              type="button"
              onClick={onOpenExerciseBreakdown}
              aria-label={`Abrir guía paso a paso: ${message.exerciseBreakdown.exerciseTitle}`}
              className="flex w-full items-center gap-3 rounded-md border border-teal-200 bg-teal-50 px-3 py-2 text-left transition-colors hover:bg-teal-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 dark:border-teal-500/30 dark:bg-teal-500/10 dark:hover:bg-teal-500/15"
            >
              <BookOpenCheck className="h-5 w-5 shrink-0 text-teal-600 dark:text-teal-300" />
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-slate-900 dark:text-slate-50">
                  {message.exerciseBreakdown.exerciseTitle}
                </span>
                <span className="block text-xs text-slate-600 dark:text-slate-300">
                  Guía interactiva de {message.exerciseBreakdown.steps.length} pasos
                </span>
              </span>
            </button>
          ) : isStreaming && !message.content ? (
            <TypingDots />
          ) : (
            <Suspense fallback={<span className="text-sm opacity-60">{message.content}</span>}>
              <MessageContent content={message.content} isUser={isUser} isStreaming={isStreaming && !!message.content} />
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

{!isUser && message.sources && message.sources.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 px-1 pt-0.5">
            <FileText className="h-3 w-3 shrink-0 text-cyan-400/70" />
            {message.sources.map((f) => (
              <span
                key={f}
                className="rounded-md bg-cyan-400/10 px-2 py-0.5 text-[10px] font-medium text-cyan-400/80"
              >
                {f}
              </span>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default MessageBubble;
