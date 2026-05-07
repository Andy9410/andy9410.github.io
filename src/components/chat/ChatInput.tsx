import { useRef, useCallback, useState } from "react";
import { Send, Paperclip } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  onSend: (message: string) => void;
  disabled?: boolean;
}

const ChatInput = ({ onSend, disabled = false }: Props) => {
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
    <div className="border-t border-border bg-background px-4 pb-4 pt-3">
      <div
        className={cn(
          "flex items-end gap-2 rounded-xl border bg-card px-3 py-2 shadow-sm transition-shadow",
          disabled ? "border-border" : "border-border focus-within:border-accent/50 focus-within:shadow-md focus-within:shadow-accent/10"
        )}
      >
        {/* Attach file — reserved for future */}
        <button
          type="button"
          disabled
          aria-label="Adjuntar archivo (próximamente)"
          className="mb-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground/40 transition-colors"
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
          placeholder={disabled ? "El tutor está escribiendo…" : "Escribí tu pregunta aquí…"}
          aria-label="Mensaje"
          className="flex-1 resize-none bg-transparent py-1.5 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
          style={{ minHeight: "36px", maxHeight: "200px" }}
        />

        <button
          type="button"
          onClick={submit}
          disabled={!canSend}
          aria-label="Enviar mensaje"
          className={cn(
            "mb-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-all",
            canSend
              ? "bg-accent text-accent-foreground shadow-sm hover:bg-accent/90 active:scale-95"
              : "bg-muted text-muted-foreground/40"
          )}
        >
          <Send className="h-4 w-4" />
        </button>
      </div>

      <p className="mt-1.5 text-center text-[11px] text-muted-foreground/50">
        Enter para enviar · Shift+Enter para nueva línea
      </p>
    </div>
  );
};

export default ChatInput;
