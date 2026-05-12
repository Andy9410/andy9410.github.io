import { useEffect, useRef, useState } from "react";
import { Menu, Bot, Sparkles, LogOut, ChevronDown } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/auth/useAuth";
import type { Conversation } from "@/types/chat";

interface Props {
  conversation: Conversation | null;
  onToggleSidebar: () => void;
  isMobile: boolean;
}

function initials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

function UserMenu() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    setOpen(false);
    try {
      await logout();
    } catch {
      // ensure navigation happens even if API call fails
    }
    navigate("/login", { replace: true });
  };

  if (!user) return null;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Menú de sesión"
        className="flex items-center gap-1.5 rounded-lg px-1.5 py-1 transition-colors hover:bg-secondary"
      >
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-accent/20 text-[11px] font-bold text-accent">
          {initials(user.name)}
        </div>
        <ChevronDown className={cn("h-3 w-3 text-muted-foreground transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-1.5 w-52 rounded-xl border border-border bg-background shadow-lg">
          <div className="px-4 py-3">
            <p className="truncate text-xs font-semibold text-foreground">{user.name}</p>
            <p className="truncate text-[11px] text-muted-foreground">{user.email}</p>
          </div>
          <div className="border-t border-border px-2 py-2">
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-40"
            >
              <LogOut className="h-3.5 w-3.5" />
              {loggingOut ? "Cerrando sesión…" : "Cerrar sesión"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const ChatHeader = ({ conversation, onToggleSidebar, isMobile }: Props) => (
  <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/80">
    <div className="flex items-center gap-3">
      {isMobile && (
        <button
          onClick={onToggleSidebar}
          aria-label="Abrir menú"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        >
          <Menu className="h-5 w-5" />
        </button>
      )}

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
      <span
        className={cn(
          "inline-flex items-center gap-1 rounded-full border border-accent-border bg-accent-soft px-2.5 py-1 text-[11px] font-semibold text-accent"
        )}
      >
        <Sparkles className="h-3 w-3" />
        Beta
      </span>

      <Link
        to="/"
        className="hidden rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-accent/40 hover:text-foreground sm:inline-flex"
      >
        Volver al sitio
      </Link>

      <UserMenu />
    </div>
  </header>
);

export default ChatHeader;
