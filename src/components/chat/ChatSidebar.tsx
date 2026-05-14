import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, MessageSquare, Code2, X, LogOut, User, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/auth/useAuth";
import { useNavigate, Link } from "react-router-dom";
import type { Conversation } from "@/types/chat";
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuAction,
  useSidebar,
} from "@/components/ui/sidebar";
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

function UserFooter() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await logout();
    } catch {}
    navigate("/login", { replace: true });
  };

  return (
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
        aria-label="Cerrar sesión"
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-muted-foreground/50 transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {loggingOut ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <LogOut className="h-3.5 w-3.5" />}
      </button>
    </div>
  );
}

const ChatSidebar = ({ conversations, activeId, onSelect, onNew, onDelete, isLoadingHistory }: Props) => {
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const { setOpenMobile } = useSidebar();

  const handleSelect = (id: string) => {
    onSelect(id);
    setOpenMobile(false);
  };

  const handleNew = () => {
    onNew();
    setOpenMobile(false);
  };

  return (
    <>
      <Sidebar collapsible="offcanvas">
        <SidebarHeader className="border-b border-sidebar-border px-4 py-0 h-14 flex-row items-center justify-between">
          <Link to="/" className="flex items-center gap-2 transition-opacity hover:opacity-80">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Code2 className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="text-sm font-bold text-primary">LearnSoft</span>
          </Link>
        </SidebarHeader>

        <div className="px-3 pt-3">
          <button
            onClick={handleNew}
            className="flex w-full items-center gap-2 rounded-lg bg-accent px-3 py-2.5 text-sm font-semibold text-accent-foreground transition-all hover:bg-accent/90 active:scale-[0.98]"
          >
            <Plus className="h-4 w-4" />
            Nuevo chat
          </button>
        </div>

        <SidebarContent className="mt-1">
          {isLoadingHistory ? (
            <div className="mt-2 space-y-1">
              <div className="flex items-center gap-1.5 px-5 pb-1">
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
            <SidebarGroup>
              <SidebarGroupLabel>Recientes</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
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
                        >
                          <SidebarMenuItem>
                            <SidebarMenuButton
                              isActive={isActive}
                              size="lg"
                              onClick={() => handleSelect(conv.id)}
                              className="h-auto py-2"
                            >
                              <MessageSquare className={cn("h-3.5 w-3.5 shrink-0", isActive ? "text-accent" : "text-muted-foreground/60")} />
                              <div className="min-w-0 flex-1 pr-1">
                                <p className="truncate text-xs font-medium">{conv.title}</p>
                                <p className="text-[10px] text-muted-foreground/70">
                                  {relativeTime(conv.updatedAt)} · {conv.messageCount ?? conv.messages.length} mensajes
                                </p>
                              </div>
                            </SidebarMenuButton>
                            <SidebarMenuAction
                              showOnHover
                              onClick={(e) => { e.stopPropagation(); setPendingDeleteId(conv.id); }}
                              aria-label="Eliminar conversación"
                              className="text-muted-foreground/50 hover:bg-destructive/10 hover:text-destructive"
                            >
                              <X className="h-3.5 w-3.5" />
                            </SidebarMenuAction>
                          </SidebarMenuItem>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          )}
        </SidebarContent>

        <SidebarFooter className="border-t border-sidebar-border px-3 py-3">
          <UserFooter />
        </SidebarFooter>
      </Sidebar>

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

export default ChatSidebar;
