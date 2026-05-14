import { Bot } from "lucide-react";
import { Link } from "react-router-dom";
import type { Conversation } from "@/types/chat";

interface Props {
  conversation: Conversation | null;
}

const ChatHeader = ({ conversation }: Props) => (
  <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/80">
    <div className="flex items-center gap-3">
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

    <Link
      to="/"
      className="hidden rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-accent/40 hover:text-foreground sm:inline-flex"
    >
      Volver al sitio
    </Link>
  </header>
);

export default ChatHeader;
