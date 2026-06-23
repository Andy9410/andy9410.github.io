import { BarChart3, FileText, Lock, MessageSquareText, Users } from "lucide-react";
import { NavLink } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type Item = {
  key: string;
  label: string;
  to?: string;
  icon: typeof BarChart3;
  disabled?: boolean;
};

const items: Item[] = [
  { key: "dashboard", label: "Dashboard", to: "/admin/metrics", icon: BarChart3 },
  { key: "users", label: "Usuarios", to: "/admin/users", icon: Users },
  { key: "documents", label: "Documentos", to: "/admin/documents", icon: FileText },
  { key: "conversations", label: "Conversaciones", to: "/admin/conversations", icon: MessageSquareText },
];

export default function AdminConsoleNav({ current }: { current: string }) {
  return (
    <div className="mb-6 rounded-3xl border border-slate-800/80 bg-slate-950/70 p-4 shadow-2xl shadow-black/20">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">Panel admin</p>
          <p className="mt-1 text-sm text-slate-300">Operación, monitoreo y revisión de actividad real de TutorIA.</p>
        </div>
        <Badge variant="outline" className="border-cyan-500/30 bg-cyan-500/10 text-cyan-200">
          <Lock className="mr-1.5 h-3.5 w-3.5" />
          Acceso restringido
        </Badge>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        {items.map((item) => {
          const Icon = item.icon;
          const active = current === item.key;

          if (item.disabled || !item.to) {
            return (
              <div
                key={item.key}
                className="flex min-h-[72px] items-center justify-between rounded-2xl border border-slate-800/80 bg-slate-900/50 px-4 py-3 text-slate-500"
              >
                <div className="flex items-center gap-3">
                  <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-2">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold">{item.label}</div>
                    <div className="text-xs text-slate-500">Próximamente</div>
                  </div>
                </div>
                <Badge variant="outline" className="border-slate-700 text-slate-500">Soon</Badge>
              </div>
            );
          }

          return (
            <NavLink
              key={item.key}
              to={item.to}
              className={cn(
                "flex min-h-[72px] items-center justify-between rounded-2xl border px-4 py-3 transition-colors",
                active
                  ? "border-cyan-500/30 bg-cyan-500/10 text-slate-50"
                  : "border-slate-800/80 bg-slate-900/50 text-slate-300 hover:border-slate-700 hover:bg-slate-900"
              )}
            >
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "rounded-xl border p-2",
                    active
                      ? "border-cyan-400/30 bg-cyan-500/20 text-cyan-200"
                      : "border-slate-800 bg-slate-950/80 text-slate-400"
                  )}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-sm font-semibold">{item.label}</div>
                  <div className={cn("text-xs", active ? "text-cyan-200/80" : "text-slate-500")}>
                    {item.key === "dashboard" ? "Métricas y salud" : "Última actividad"}
                  </div>
                </div>
              </div>
              {active && <Badge className="border-cyan-400/30 bg-cyan-500/20 text-cyan-100 hover:bg-cyan-500/20">Activo</Badge>}
            </NavLink>
          );
        })}
      </div>
    </div>
  );
}
