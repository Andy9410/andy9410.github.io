import {
  Bot,
  FolderOpen,
  Presentation,
  PanelBottom,
  PanelRight,
  SlidersHorizontal,
} from "lucide-react";

import { Link } from "react-router-dom";

import type { Conversation } from "@/types/chat";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import { cn } from "@/lib/utils";

type PdfLayoutMode = "side" | "bottom";

const LEVELS = [
  { value: 5, label: "Experto" },
  { value: 4, label: "Avanzado" },
  { value: 3, label: "Intermedio" },
  { value: 2, label: "Simple" },
  { value: 1, label: "Básico" },
] as const;

interface Props {
  conversation: Conversation | null;
  onOpenDocuments?: () => void;
  onOpenWhiteboard?: () => void;
  explanationLevel: number;
  onExplanationLevelChange: (level: number) => void;
  pdfLayout?: PdfLayoutMode;
  onTogglePdfLayout?: () => void;
  pdfLayoutLocked?: boolean;
}

function ExplanationLevelPopover({
                                  level,
                                  onLevelChange,
                                }: {
  level: number;
  onLevelChange: (level: number) => void;
}) {
  const currentLevel = LEVELS.find((item) => item.value === level);
  const horizontalLevels = [...LEVELS].reverse();

  return (
      <Popover>
        <PopoverTrigger asChild>
          <button
              type="button"
              aria-label="Nivel de explicación"
              className="flex h-8 items-center gap-1.5 rounded-lg border border-border px-3 text-xs font-medium text-muted-foreground transition-colors hover:border-accent/40 hover:text-foreground"
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Explicación</span>
          </button>
        </PopoverTrigger>
        <PopoverContent side="bottom" align="end" className="w-72 p-4">
          <div className="mb-3 flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-teal-400/10 text-teal-500">
              <SlidersHorizontal className="h-3.5 w-3.5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-foreground">Nivel de explicación</p>
              <p className="text-[11px] text-muted-foreground">{currentLevel?.label}</p>
            </div>
          </div>

          <input
              type="range"
              min={1}
              max={5}
              step={1}
              value={level}
              onChange={(event) => onLevelChange(Number(event.target.value))}
              className="w-full cursor-pointer"
              style={{ accentColor: "#2dd4bf" }}
          />

          <div className="mt-2 flex justify-between gap-2">
            {horizontalLevels.map((lvl) => (
                <button
                    key={lvl.value}
                    type="button"
                    onClick={() => onLevelChange(lvl.value)}
                    className={cn(
                        "text-[10px] font-bold uppercase tracking-tighter transition-colors",
                        level === lvl.value
                            ? "text-teal-500"
                            : "text-slate-400 hover:text-slate-600",
                    )}
                >
                  {lvl.label}
                </button>
            ))}
          </div>
        </PopoverContent>
      </Popover>
  );
}

const ChatHeader = ({
                      conversation,
                      onOpenDocuments,
                      onOpenWhiteboard,
                      explanationLevel,
                      onExplanationLevelChange,
                      pdfLayout,
                      onTogglePdfLayout,
                      pdfLayoutLocked = false,
                    }: Props) => (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="flex items-center gap-3">
        <Link
            to="/"
            className="group flex items-center gap-2 rounded-lg transition-opacity hover:opacity-80"
        >
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent/15 transition-colors group-hover:bg-accent/20">
            <Bot className="h-4 w-4 text-accent" />
          </div>

          <div>
            <p className="text-sm font-semibold leading-none text-primary">
              {conversation
                  ? conversation.title
                  : "Tutor LearnSoft"}
            </p>

            <p className="mt-0.5 text-[11px] leading-none text-muted-foreground">
              IA Asistente
            </p>
          </div>
        </Link>
      </div>

      <div className="flex items-center gap-2">
        {pdfLayout && onTogglePdfLayout && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                    type="button"
                    onClick={onTogglePdfLayout}
                    disabled={pdfLayoutLocked}
                    aria-label={
                      pdfLayout === "side"
                          ? "PDF lateral"
                          : "PDF abajo"
                    }
                    className={cn(
                        "flex h-8 items-center gap-1.5 rounded-lg border border-border px-3 text-xs font-medium text-muted-foreground transition-colors hover:border-accent/40 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50",
                        pdfLayout === "side" &&
                        "text-foreground",
                    )}
                >
                  {pdfLayout === "side" ? (
                      <PanelRight className="h-3.5 w-3.5" />
                  ) : (
                      <PanelBottom className="h-3.5 w-3.5" />
                  )}

                  <span className="hidden sm:inline">
                {pdfLayout === "side"
                    ? "PDF lateral"
                    : "PDF abajo"}
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

        <ExplanationLevelPopover
            level={explanationLevel}
            onLevelChange={onExplanationLevelChange}
        />

        {onOpenWhiteboard && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                    type="button"
                    onClick={onOpenWhiteboard}
                    aria-label="Abrir resolución guiada"
                    className="flex h-8 items-center gap-1.5 rounded-lg border border-border px-3 text-xs font-medium text-muted-foreground transition-colors hover:border-accent/40 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <Presentation className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Resolución guiada</span>
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                Abrir la hoja de trabajo compartida
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
                  <span>Documentos</span>
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                Ver y abrir documentos PDF
              </TooltipContent>
            </Tooltip>
        )}
      </div>
    </header>
);

export default ChatHeader;
