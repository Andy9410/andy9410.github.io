import { motion, AnimatePresence } from "framer-motion";
import { Plus, MessageSquare, Code2, X, LogOut, User, Loader2, ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { useAuth } from "@/auth/useAuth";
import { useNavigate, Link } from "react-router-dom";
import type { Conversation } from "@/types/chat";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Props {
  conversations: Conversation[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
  isLoadingHistory: boolean;
  open: boolean;
  onClose: () => void;
  isMobile: boolean;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

function relativeTime(date: Date): string {
  const diff = (Date.now() - date.getTime()) / 1000;
  if (diff < 60) return "ahora";
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
}

function ConversationSkeleton() {
  return (
    <div className="space-y-1 px-2">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-center gap-2.5 rounded-lg px-3 py-2.5">
          <div className="h-3.5 w-3.5 shrink-0 rounded bg-muted-foreground/10 animate-pulse" />
          <div className="flex-1 space-y-1.5">
            <div className="h-2.5 w-3/4 rounded bg-muted-foreground/10 animate-pulse" />
            <div className="h-2 w-1/2 rounded bg-muted-foreground/10 animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
}

const SidebarContent = ({
  conversations,
  activeId,
  onSelect,
  onNew,
  onDelete,
  isLoadingHistory,
  onClose,
  isMobile,
  onToggleCollapse,
}: Omit<Props, "open" | "collapsed">) => {
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  return (
  <>
  <div className="flex h-full flex-col bg-sidebar">
    {/* Brand + close */}
    <div className="flex h-14 shrink-0 items-center justify-between border-b border-sidebar-border px-4">
      <Link to="/" className="flex items-center gap-2 transition-opacity hover:opacity-80">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
          <Code2 className="h-4 w-4 text-primary-foreground" />
        </div>
        <span className="text-sm font-bold text-primary">LearnSoft</span>
      </Link>
      {isMobile ? (
        <button
          onClick={onClose}
          aria-label="Cerrar menú"
          className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-sidebar-accent"
        >
          <X className="h-4 w-4" />
        </button>
      ) : (
        <button
          onClick={onToggleCollapse}
          aria-label="Colapsar barra lateral"
          className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-sidebar-accent"
        >
          <ChevronLeft className="h-4 w-4" />
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
      {isLoadingHistory ? (
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 px-3 pb-1">
            <Loader2 className="h-3 w-3 animate-spin text-muted-foreground/50" />
            <p className="text-[11px] text-muted-foreground/50">Cargando historial…</p>
          </div>
          <ConversationSkeleton />
        </div>
      ) : conversations.length === 0 ? (
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
                    <div className="min-w-0 flex-1 pr-5">
                      <p className="truncate text-xs font-medium">{conv.title}</p>
                      <p className="text-[10px] text-muted-foreground/70">
                        {relativeTime(conv.updatedAt)} · {(conv.messageCount ?? conv.messages.length)} mensajes
                      </p>
                    </div>
                  </button>

                  {/* Delete button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setPendingDeleteId(conv.id);
                    }}
                    aria-label="Eliminar conversación"
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 flex h-6 w-6 items-center justify-center rounded p-1 opacity-0 text-muted-foreground/50 transition-all hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </>
      )}
    </div>

    {/* Footer — user profile + logout */}
    <UserFooter />
  </div>

  <AlertDialog open={pendingDeleteId !== null} onOpenChange={(open) => { if (!open) setPendingDeleteId(null); }}>
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>¿Eliminar conversación?</AlertDialogTitle>
        <AlertDialogDescription>
          Esta acción no se puede deshacer. La conversación será eliminada del historial.
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel>Cancelar</AlertDialogCancel>
        <AlertDialogAction
          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          onClick={() => {
            if (pendingDeleteId) onDelete(pendingDeleteId);
            setPendingDeleteId(null);
          }}
        >
          Eliminar
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
  </>
  );
};

function UserFooter() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await logout();
    } catch {
      // navigate to login even if the API call fails
    }
    navigate("/login", { replace: true });
  };

  return (
    <div className="shrink-0 border-t border-sidebar-border px-3 py-3">
      <div className="flex items-center gap-2 rounded-lg px-2 py-2">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent/20 text-accent">
          <User className="h-3.5 w-3.5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-medium text-sidebar-foreground">{user?.name ?? "User"}</p>
          <p className="truncate text-[10px] text-muted-foreground/60">{user?.email}</p>
        </div>
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          aria-label="Sign out"
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-muted-foreground/50 transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {loggingOut ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <LogOut className="h-3.5 w-3.5" />}
        </button>
      </div>
    </div>
  );
}

const ChatSidebar = (props: Props) => {
  const { open, onClose, isMobile, collapsed, onToggleCollapse, ...rest } = props;

  if (!isMobile) {
    return (
      <motion.aside
        animate={{ width: collapsed ? 0 : 256 }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        className="hidden shrink-0 overflow-hidden border-r border-sidebar-border md:flex md:flex-col"
      >
        <div className="h-full w-64">
          <SidebarContent {...rest} onClose={onClose} isMobile={false} onToggleCollapse={onToggleCollapse} />
        </div>
      </motion.aside>
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
