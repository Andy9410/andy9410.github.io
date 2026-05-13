import { useRef, useCallback, useState } from "react";
import { Send, Paperclip } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface Props {
  onSend: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

const ChatInput = ({ onSend, disabled = false, placeholder }: Props) => {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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

  const submit = useCallback(() => {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.focus();
    }
  }, [value, disabled, onSend]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  const canSend = value.trim().length > 0 && !disabled;

  return (
    <div className="bg-background pb-4 pt-3">
      <div className="mx-auto w-full max-w-3xl px-4">
        <div
          className={cn(
          "flex items-stretch overflow-hidden rounded-xl border bg-card pl-3 shadow-sm transition-shadow",
          disabled ? "border-border" : "border-border focus-within:border-cyan-400/60 focus-within:shadow-md focus-within:shadow-cyan-400/10"
          )}
        >
          {/* Attach file — reserved for future */}
          <button
            type="button"
            disabled
            aria-label="Adjuntar archivo (próximamente)"
            className="flex h-8 w-8 shrink-0 self-center items-center justify-center rounded-lg text-muted-foreground/40 transition-colors"
            title="Próximamente"
          >
            <Paperclip className="h-4 w-4" />
          </button>

          <textarea
            ref={textareaRef}
            value={value}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            rows={1}
            placeholder={placeholder ?? (disabled ? "El tutor está escribiendo…" : "Escribí tu pregunta aquí…")}
            aria-label="Mensaje"
            className="flex-1 resize-none bg-transparent py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
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
