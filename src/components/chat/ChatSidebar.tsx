import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquarePlus, MessageSquare, Code2, X, LogOut, User, Loader2, PanelLeft, BarChart3, GraduationCap } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
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
  SidebarTrigger,
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
  const profileTarget = user?.role === "ROLE_ADMIN" ? "/admin/users" : "/learning-profile";
  const profileLabel = user?.role === "ROLE_ADMIN" ? "Ir a perfiles de usuarios" : "Ir al perfil de aprendizaje";

  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await logout();
    } catch {
      // Continue navigation even if the logout request has already expired.
    }
    navigate("/login", { replace: true });
  };

  return (
    <>
      {/* Expanded */}
      <div className="flex items-center gap-2 rounded-lg px-2 py-2 group-data-[collapsible=icon]:hidden">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
          <User className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-medium text-sidebar-foreground">{user?.name ?? "User"}</p>
          <p className="truncate text-[10px] text-muted-foreground/60">{user?.email}</p>
        </div>
        {user?.role === "ROLE_ADMIN" && (
          <Link
            to="/admin/metrics"
            aria-label="Ir a métricas"
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-cyan-700 transition-colors hover:bg-cyan-100 hover:text-cyan-900"
          >
            <BarChart3 className="h-3.5 w-3.5" />
          </Link>
        )}
        <Link
          to={profileTarget}
          aria-label={profileLabel}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-cyan-700 transition-colors hover:bg-cyan-100 hover:text-cyan-900"
        >
          <GraduationCap className="h-3.5 w-3.5" />
        </Link>
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          aria-label="Cerrar sesión"
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-muted-foreground/50 transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {loggingOut ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <LogOut className="h-3.5 w-3.5" />}
        </button>
      </div>

      {/* Collapsed */}
      <div className="hidden flex-col items-center group-data-[collapsible=icon]:flex">
        <Popover>
          <PopoverTrigger asChild>
            <button
              aria-label="Cuenta"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 transition-colors hover:bg-emerald-200"
            >
              <User className="h-4 w-4" />
            </button>
          </PopoverTrigger>
          <PopoverContent side="right" align="end" className="w-52 p-2">
            <div className="mb-2 px-2 py-1.5">
              <p className="truncate text-xs font-medium text-foreground">{user?.name ?? "User"}</p>
              <p className="truncate text-[10px] text-muted-foreground">{user?.email}</p>
            </div>
            {user?.role === "ROLE_ADMIN" && (
              <Link
                to="/admin/metrics"
                className="mb-1 flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs font-medium text-cyan-700 transition-colors hover:bg-cyan-50"
              >
                <BarChart3 className="h-3.5 w-3.5" />
                Métricas
              </Link>
            )}
            <Link
              to={profileTarget}
              className="mb-1 flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs font-medium text-cyan-700 transition-colors hover:bg-cyan-50"
            >
              <GraduationCap className="h-3.5 w-3.5" />
              {user?.role === "ROLE_ADMIN" ? "Perfiles de usuarios" : "Perfil de aprendizaje"}
            </Link>
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loggingOut ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <LogOut className="h-3.5 w-3.5" />}
              Cerrar sesión
            </button>
          </PopoverContent>
        </Popover>
      </div>
    </>
  );
}

const ChatSidebar = ({ conversations, activeId, onSelect, onNew, onDelete, isLoadingHistory }: Props) => {
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [logoHovered, setLogoHovered] = useState(false);
  const { state, setOpenMobile, toggleSidebar } = useSidebar();

  const handleSelect = (id: string) => {
    onSelect(id);
    setOpenMobile(false);
  };

  const handleNew = () => {
    if (state === "collapsed") toggleSidebar();
    onNew();
    setOpenMobile(false);
  };

  return (
    <>
      <Sidebar collapsible="icon">
        <SidebarHeader className="border-b border-sidebar-border flex-row items-center px-4 py-0 h-14 group-data-[collapsible=icon]:h-auto group-data-[collapsible=icon]:flex-col group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:gap-1 group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:py-3">
          {/* Logo ↔ Trigger swap — same 32×32 box, no layout shift */}
          <div
            className="relative flex h-8 w-8 shrink-0"
            onMouseEnter={() => setLogoHovered(true)}
            onMouseLeave={() => setLogoHovered(false)}
          >
            {/* Logo face */}
            <Link
              to="/"
              tabIndex={-1}
              aria-hidden
              className={cn(
                "absolute inset-0 flex items-center justify-center rounded-lg bg-primary transition-opacity duration-200",
                logoHovered ? "opacity-0 pointer-events-none" : "opacity-100"
              )}
            >
              <Code2 className="h-4 w-4 text-primary-foreground" />
            </Link>
            {/* Trigger face */}
            <button
              onClick={toggleSidebar}
              aria-label="Toggle sidebar"
              className={cn(
                "absolute inset-0 flex h-8 w-8 items-center justify-center rounded-lg bg-white text-slate-600 shadow-sm transition-opacity duration-200 hover:bg-slate-50",
                logoHovered ? "opacity-100" : "opacity-0 pointer-events-none"
              )}
            >
              <PanelLeft className="h-4 w-4" />
            </button>
          </div>
          <Link
              to="/"
              className="ml-2 text-sm font-bold text-primary transition-opacity hover:opacity-80 group-data-[collapsible=icon]:hidden"
          >
            LearnSoft
          </Link>
          <SidebarTrigger className="ml-auto text-muted-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground group-data-[collapsible=icon]:hidden" />
        </SidebarHeader>

        <div className="px-3 pt-3 group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-1.5">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={handleNew}
                className="flex w-full items-center gap-2 rounded-lg bg-teal-400 px-3 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-teal-500 active:scale-[0.98] group-data-[collapsible=icon]:w-9 group-data-[collapsible=icon]:h-9 group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:rounded-md"
              >
                <MessageSquarePlus className="h-4 w-4 shrink-0 group-data-[collapsible=icon]:h-[18px] group-data-[collapsible=icon]:w-[18px]" />
                <span className="group-data-[collapsible=icon]:hidden">Nuevo chat</span>
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" hidden={state !== "collapsed"}>
              Nuevo chat
            </TooltipContent>
          </Tooltip>
        </div>

        <SidebarContent className="mt-1 group-data-[collapsible=icon]:hidden">
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
                              tooltip={conv.title}
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

        <SidebarFooter className="mt-auto border-t border-sidebar-border px-3 py-3 group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:py-3">
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
