import { useRef, useCallback, useState } from "react";
import { Send, Paperclip, FileText, X, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface Props {
  onSend: (message: string, files: File[]) => void;
  disabled?: boolean;
  placeholder?: string;
}

interface AttachedFile {
  id: string;
  file: File;
}

const VISIBLE_THRESHOLD = 2;

function formatSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function FileChip({
  af,
  onRemove,
  disabled,
}: {
  af: AttachedFile;
  onRemove: () => void;
  disabled: boolean;
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.88 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.88 }}
      transition={{ duration: 0.14 }}
      className="flex shrink-0 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-2 py-1.5 shadow-sm transition-colors hover:bg-slate-50"
    >
      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-rose-50">
        <FileText className="h-3.5 w-3.5 text-rose-500" />
      </div>
      <div className="min-w-0">
        <p className="max-w-[130px] truncate text-xs font-medium text-slate-700">
          {af.file.name}
        </p>
        <p className="text-[10px] leading-none text-slate-400">{formatSize(af.file.size)}</p>
      </div>
      {!disabled && (
        <button
          type="button"
          onClick={onRemove}
          aria-label="Quitar archivo"
          className="ml-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-200 hover:text-slate-600"
        >
          <X className="h-2.5 w-2.5" />
        </button>
      )}
    </motion.div>
  );
}

const ChatInput = ({ onSend, disabled = false, placeholder }: Props) => {
  const [value, setValue] = useState("");
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const [expanded, setExpanded] = useState(false);
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
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setAttachedFiles((prev) => [
      ...prev,
      ...files.map((file) => ({ id: `${Date.now()}-${Math.random()}`, file })),
    ]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeFile = useCallback((id: string) => {
    setAttachedFiles((prev) => {
      const next = prev.filter((f) => f.id !== id);
      if (next.length <= VISIBLE_THRESHOLD) setExpanded(false);
      return next;
    });
  }, []);

  const submit = useCallback(() => {
    const trimmed = value.trim();
    if ((!trimmed && attachedFiles.length === 0) || disabled) return;
    onSend(trimmed, attachedFiles.map((af) => af.file));
    setValue("");
    setAttachedFiles([]);
    setExpanded(false);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.focus();
    }
  }, [value, disabled, onSend, attachedFiles]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  const canSend = (value.trim().length > 0 || attachedFiles.length > 0) && !disabled;
  const visibleFiles = expanded ? attachedFiles : attachedFiles.slice(0, VISIBLE_THRESHOLD);
  const hiddenCount = attachedFiles.length - VISIBLE_THRESHOLD;

  return (
    <div className="bg-background py-3">
      <div className="mx-auto w-full max-w-3xl px-4">

        {/* Attachment chips */}
        <AnimatePresence>
          {attachedFiles.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.18 }}
              className="mb-2 overflow-hidden px-1"
            >
              <div className="flex flex-wrap items-center gap-1.5">
                <AnimatePresence initial={false}>
                  {visibleFiles.map((af) => (
                    <FileChip
                      key={af.id}
                      af={af}
                      onRemove={() => removeFile(af.id)}
                      disabled={disabled}
                    />
                  ))}
                </AnimatePresence>

                {/* Collapse / expand toggle */}
                <AnimatePresence mode="wait">
                  {!expanded && hiddenCount > 0 && (
                    <motion.button
                      key="expand"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.12 }}
                      type="button"
                      onClick={() => setExpanded(true)}
                      className="flex shrink-0 items-center gap-1 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-slate-500 transition-colors hover:border-slate-400 hover:bg-slate-100 hover:text-slate-700"
                    >
                      <ChevronRight className="h-3 w-3" />
                      +{hiddenCount} más
                    </motion.button>
                  )}
                  {expanded && hiddenCount > 0 && (
                    <motion.button
                      key="collapse"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.12 }}
                      type="button"
                      onClick={() => setExpanded(false)}
                      className="flex shrink-0 items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
                    >
                      <ChevronRight className="h-3 w-3 rotate-90" />
                      Ver menos
                    </motion.button>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Input bar */}
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
                aria-label="Adjuntar documentos"
                className={cn(
                  "flex h-8 w-8 shrink-0 self-center items-center justify-center rounded-lg transition-colors",
                  disabled
                    ? "text-muted-foreground/40 cursor-not-allowed"
                    : attachedFiles.length > 0
                      ? "text-cyan-400 hover:bg-cyan-400/10 cursor-pointer"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer"
                )}
              >
                <Paperclip className="h-4 w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="top">
              {attachedFiles.length > 0
                ? `${attachedFiles.length} archivo${attachedFiles.length > 1 ? "s" : ""} adjunto${attachedFiles.length > 1 ? "s" : ""}`
                : "Adjuntar PDF"}
            </TooltipContent>
          </Tooltip>

          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,application/pdf"
            multiple
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
