import { Bot, FolderOpen, PanelBottom, PanelRight } from "lucide-react";
import { Link } from "react-router-dom";
import type { Conversation } from "@/types/chat";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

type PdfLayoutMode = "side" | "bottom";

interface Props {
  conversation: Conversation | null;
  onOpenDocuments?: () => void;
  pdfLayout?: PdfLayoutMode;
  onTogglePdfLayout?: () => void;
  pdfLayoutLocked?: boolean;
}

const ChatHeader = ({
  conversation,
  onOpenDocuments,
  pdfLayout,
  onTogglePdfLayout,
  pdfLayoutLocked = false,
}: Props) => (
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

    <div className="flex items-center gap-2">
      {pdfLayout && onTogglePdfLayout && (
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={onTogglePdfLayout}
              disabled={pdfLayoutLocked}
              aria-label={pdfLayout === "side" ? "PDF lateral" : "PDF abajo"}
              className={cn(
                "flex h-8 items-center gap-1.5 rounded-lg border border-border px-3 text-xs font-medium text-muted-foreground transition-colors hover:border-accent/40 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50",
                pdfLayout === "side" && "text-foreground",
              )}
            >
              {pdfLayout === "side" ? (
                <PanelRight className="h-3.5 w-3.5" />
              ) : (
                <PanelBottom className="h-3.5 w-3.5" />
              )}
              <span className="hidden sm:inline">
                {pdfLayout === "side" ? "PDF lateral" : "PDF abajo"}
              </span>
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            {pdfLayoutLocked
              ? "En pantallas chicas el PDF queda abajo"
              : "Cambiar orientación del PDF"}
          </TooltipContent>
        </Tooltip>
      )}

      {onOpenDocuments && (
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={onOpenDocuments}
              aria-label="Mis documentos"
              className="flex h-8 items-center gap-1.5 rounded-lg border border-border px-3 text-xs font-medium text-muted-foreground transition-colors hover:border-accent/40 hover:text-foreground"
            >
              <FolderOpen className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Mis documentos</span>
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom">Ver y abrir documentos PDF</TooltipContent>
        </Tooltip>
      )}
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
