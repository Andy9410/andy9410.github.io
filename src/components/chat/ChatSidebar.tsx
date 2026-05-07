import { motion, AnimatePresence } from "framer-motion";
import { Plus, MessageSquare, Trash2, Code2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Conversation } from "@/types/chat";

interface Props {
  conversations: Conversation[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
  open: boolean;
  onClose: () => void;
  isMobile: boolean;
}

function relativeTime(date: Date): string {
  const diff = (Date.now() - date.getTime()) / 1000;
  if (diff < 60) return "ahora";
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
}

const SidebarContent = ({
  conversations,
  activeId,
  onSelect,
  onNew,
  onDelete,
  onClose,
  isMobile,
}: Omit<Props, "open">) => (
  <div className="flex h-full flex-col bg-sidebar">
    {/* Brand + close */}
    <div className="flex h-14 shrink-0 items-center justify-between border-b border-sidebar-border px-4">
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
          <Code2 className="h-4 w-4 text-primary-foreground" />
        </div>
        <span className="text-sm font-bold text-primary">LearnSoft</span>
      </div>
      {isMobile && (
        <button
          onClick={onClose}
          aria-label="Cerrar menú"
          className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-sidebar-accent"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>

    {/* New chat button */}
    <div className="px-3 pt-3">
      <button
        onClick={onNew}
        className="flex w-full items-center gap-2 rounded-lg bg-accent px-3 py-2.5 text-sm font-semibold text-accent-foreground transition-all hover:bg-accent/90 active:scale-[0.98]"
      >
        <Plus className="h-4 w-4" />
        Nuevo chat
      </button>
    </div>

    {/* Conversations */}
    <div className="mt-3 flex-1 overflow-y-auto px-2 pb-4">
      {conversations.length === 0 ? (
        <div className="px-3 py-8 text-center text-xs text-muted-foreground">
          <MessageSquare className="mx-auto mb-2 h-6 w-6 opacity-30" />
          Sin conversaciones
        </div>
      ) : (
        <>
          <p className="mb-1.5 px-2 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/60">
            Recientes
          </p>
          <AnimatePresence initial={false}>
            {conversations.map((conv) => {
              const isActive = conv.id === activeId;
              return (
                <motion.div
                  key={conv.id}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.15 }}
                  className="group relative mb-0.5"
                >
                  <button
                    onClick={() => onSelect(conv.id)}
                    className={cn(
                      "flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left transition-colors",
                      isActive
                        ? "bg-accent-soft text-primary"
                        : "text-sidebar-foreground hover:bg-sidebar-accent"
                    )}
                  >
                    <MessageSquare
                      className={cn(
                        "h-3.5 w-3.5 shrink-0",
                        isActive ? "text-accent" : "text-muted-foreground/60"
                      )}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-medium">{conv.title}</p>
                      <p className="text-[10px] text-muted-foreground/70">
                        {relativeTime(conv.updatedAt)} · {conv.messages.length} msgs
                      </p>
                    </div>

                    {isActive && (
                      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                    )}
                  </button>

                  {/* Delete button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(conv.id);
                    }}
                    aria-label="Eliminar conversación"
                    className="absolute right-2 top-1/2 -translate-y-1/2 hidden h-6 w-6 items-center justify-center rounded-md text-muted-foreground/50 transition-colors hover:bg-destructive/10 hover:text-destructive group-hover:flex"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </>
      )}
    </div>

    {/* Footer */}
    <div className="shrink-0 border-t border-sidebar-border px-4 py-3">
      <p className="text-[10px] text-muted-foreground/50">
        Chat en modo demo · sin conexión a backend
      </p>
    </div>
  </div>
);

const ChatSidebar = (props: Props) => {
  const { open, onClose, isMobile, ...rest } = props;

  if (!isMobile) {
    return (
      <aside className="hidden w-64 shrink-0 border-r border-sidebar-border md:flex md:flex-col">
        <SidebarContent {...rest} onClose={onClose} isMobile={false} />
      </aside>
    );
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 z-30 bg-black/40 md:hidden"
          />

          {/* Drawer */}
          <motion.aside
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ type: "spring", damping: 28, stiffness: 280 }}
            className="fixed inset-y-0 left-0 z-40 w-64 md:hidden"
          >
            <SidebarContent {...rest} onClose={onClose} isMobile={true} />
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
};

export default ChatSidebar;
