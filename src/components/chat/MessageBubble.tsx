import { useState } from "react";
import { motion } from "framer-motion";
import { Bot, User, Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import MessageContent from "./MessageContent";
import type { Message } from "@/types/chat";

interface Props {
  message: Message;
}

const MessageBubble = ({ message }: Props) => {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === "user";

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
      className={cn("group flex items-end gap-3 px-4 py-1.5", isUser && "flex-row-reverse")}
    >
      {/* Avatar */}
      <div
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
          isUser
            ? "bg-primary ring-2 ring-primary/20"
            : "bg-accent/15 ring-1 ring-accent/20"
        )}
      >
        {isUser ? (
          <User className="h-4 w-4 text-primary-foreground" />
        ) : (
          <Bot className="h-4 w-4 text-accent" />
        )}
      </div>

      {/* Bubble */}
      <div className={cn("flex max-w-[75%] flex-col gap-1", isUser && "items-end")}>
        <div
          className={cn(
            "relative rounded-2xl px-4 py-3",
            isUser
              ? "rounded-br-sm bg-primary text-primary-foreground"
              : "rounded-bl-sm border border-border bg-section-alt text-foreground"
          )}
        >
          <MessageContent content={message.content} isUser={isUser} />

          {/* Copy button */}
          <button
            onClick={copyToClipboard}
            aria-label="Copiar mensaje"
            className={cn(
              "absolute -top-2 opacity-0 transition-opacity group-hover:opacity-100",
              isUser ? "-left-8" : "-right-8",
              "flex h-7 w-7 items-center justify-center rounded-full border border-border bg-background shadow-sm hover:bg-secondary"
            )}
          >
            {copied ? (
              <Check className="h-3.5 w-3.5 text-accent" />
            ) : (
              <Copy className="h-3.5 w-3.5 text-muted-foreground" />
            )}
          </button>
        </div>

        <span className="px-1 text-[11px] text-muted-foreground">{time}</span>
      </div>
    </motion.div>
  );
};

export default MessageBubble;
