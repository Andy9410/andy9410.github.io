import { useRef, useCallback, useState } from "react";
import { Send, Paperclip, FileText, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface Props {
  onSend: (message: string, file?: File) => void;
  disabled?: boolean;
  placeholder?: string;
}

const ChatInput = ({ onSend, disabled = false, placeholder }: Props) => {
  const [value, setValue] = useState("");
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const adjustHeight = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 200) + "px";
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value);
    adjustHeight();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setAttachedFile(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const submit = useCallback(() => {
    const trimmed = value.trim();
    if ((!trimmed && !attachedFile) || disabled) return;
    onSend(trimmed, attachedFile ?? undefined);
    setValue("");
    setAttachedFile(null);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.focus();
    }
  }, [value, disabled, onSend, attachedFile]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  const canSend = (value.trim().length > 0 || attachedFile !== null) && !disabled;

  return (
    <div className="bg-background py-3">
      <div className="mx-auto w-full max-w-3xl px-4">

        {attachedFile && (
          <div className="mb-2 flex items-center gap-2 px-1">
            <div className="flex items-center gap-1.5 rounded-lg border border-cyan-400/30 bg-cyan-400/10 px-2.5 py-1 text-xs text-cyan-400">
              <FileText className="h-3 w-3 shrink-0" />
              <span className="max-w-[220px] truncate font-medium">{attachedFile.name}</span>
              <button
                type="button"
                onClick={() => setAttachedFile(null)}
                className="ml-0.5 rounded hover:text-cyan-300"
                aria-label="Quitar archivo"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          </div>
        )}

        <div
          className={cn(
            "flex items-stretch overflow-hidden rounded-xl border bg-transparent pl-3 shadow-sm transition-shadow",
            disabled
              ? "border-border"
              : "border-border focus-within:border-cyan-400/60 focus-within:shadow-md focus-within:shadow-cyan-400/10"
          )}
        >
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={() => !disabled && fileInputRef.current?.click()}
                disabled={disabled}
                aria-label="Adjuntar documento"
                className={cn(
                  "flex h-8 w-8 shrink-0 self-center items-center justify-center rounded-lg transition-colors",
                  disabled
                    ? "text-muted-foreground/40 cursor-not-allowed"
                    : attachedFile
                      ? "text-cyan-400 hover:bg-cyan-400/10 cursor-pointer"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer"
                )}
              >
                <Paperclip className="h-4 w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="top">
              {attachedFile ? "Cambiar documento adjunto" : "Adjuntar PDF"}
            </TooltipContent>
          </Tooltip>

          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,application/pdf"
            className="hidden"
            onChange={handleFileChange}
          />

          <textarea
            ref={textareaRef}
            value={value}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            rows={1}
            placeholder={
              placeholder ?? (disabled ? "El tutor está procesando…" : "Escribí tu pregunta aquí…")
            }
            aria-label="Mensaje"
            className="flex-1 resize-none bg-transparent py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 placeholder:text-center focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
            style={{ minHeight: "44px", maxHeight: "200px" }}
          />

          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={submit}
                disabled={!canSend}
                aria-label="Enviar mensaje"
                className={cn(
                  "flex w-14 shrink-0 items-center justify-center rounded-xl m-1.5 transition-all cursor-pointer disabled:cursor-not-allowed",
                  canSend
                    ? "bg-teal-400 text-white hover:bg-teal-300 active:brightness-95"
                    : "bg-teal-400/30 text-teal-400/60"
                )}
              >
                <Send className="h-4 w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="top">
              Enter para enviar · Shift+Enter para nueva línea
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </div>
  );
};

export default ChatInput;
