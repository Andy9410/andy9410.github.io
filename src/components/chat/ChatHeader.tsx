import { Menu, Bot, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import type { Conversation } from "@/types/chat";

interface Props {
  conversation: Conversation | null;
  onToggleSidebar: () => void;
  isMobile: boolean;
}

const ChatHeader = ({ conversation, onToggleSidebar, isMobile }: Props) => (
  <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/80">
    <div className="flex items-center gap-3">
      {isMobile && (
        <button
          onClick={onToggleSidebar}
          aria-label="Abrir menú"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        >
          <Menu className="h-5 w-5" />
        </button>
      )}

      <div className="flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent/15">
          <Bot className="h-4 w-4 text-accent" />
        </div>
        <div>
          <p className="text-sm font-semibold leading-none text-primary">
            {conversation ? conversation.title : "Tutor LearnSoft"}
          </p>
          <p className="mt-0.5 text-[11px] leading-none text-muted-foreground">IA Asistente</p>
        </div>
      </div>
    </div>

    <div className="flex items-center gap-2">
      <span
        className={cn(
          "inline-flex items-center gap-1 rounded-full border border-accent-border bg-accent-soft px-2.5 py-1 text-[11px] font-semibold text-accent"
        )}
      >
        <Sparkles className="h-3 w-3" />
        Beta
      </span>

      <Link
        to="/"
        className="hidden rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-accent/40 hover:text-foreground sm:inline-flex"
      >
        Volver al sitio
      </Link>
    </div>
  </header>
);

export default ChatHeader;
