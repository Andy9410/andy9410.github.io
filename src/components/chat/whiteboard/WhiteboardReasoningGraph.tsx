import type { ReasoningNode, ReasoningNodeStatus, ReasoningNodeType } from "@/types/whiteboard";
import { cn } from "@/lib/utils";

interface Props {
  nodes: ReasoningNode[];
}

const STATUS_DOT: Record<ReasoningNodeStatus, string> = {
  PENDING:     "bg-muted-foreground/40",
  IN_PROGRESS: "bg-amber-400 animate-pulse",
  COMPLETED:   "bg-emerald-400",
  FAILED:      "bg-destructive",
};

const TYPE_BADGE: Record<ReasoningNodeType, { label: string; style: string }> = {
  PROBLEM:             { label: "PROBLEMA",    style: "bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300" },
  PLAN:                { label: "PLAN",         style: "bg-sky-100 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300" },
  DECOMPOSITION:       { label: "DESCOMP.",     style: "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300" },
  SUBPROBLEM:          { label: "SUBPROBLEMA",  style: "bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300" },
  SUBPROBLEM_SOLUTION: { label: "SOLUCIÓN",     style: "bg-teal-100 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300" },
  PARTIAL_RESULT:      { label: "PARCIAL",      style: "bg-yellow-100 text-yellow-700 dark:bg-yellow-950/40 dark:text-yellow-300" },
  FINAL_INTEGRATION:   { label: "INTEGRACIÓN",  style: "bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300" },
  FINAL_ANSWER:        { label: "RESPUESTA",    style: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300" },
  USER_QUESTION:       { label: "PREGUNTA",     style: "bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300" },
};

export function WhiteboardReasoningGraph({ nodes }: Props) {
  if (nodes.length === 0) return null;

  return (
    <div className="shrink-0 border-t border-border bg-background px-3 py-2.5 max-h-64 overflow-y-auto">
      <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        Reasoning Graph
      </p>
      <ol className="flex flex-col gap-1">
        {nodes.map((node) => {
          const badge = TYPE_BADGE[node.nodeType] ?? { label: node.nodeType, style: "bg-muted text-muted-foreground" };
          const dot = STATUS_DOT[node.status] ?? STATUS_DOT.PENDING;
          return (
            <li
              key={node.nodeId}
              className="flex items-start gap-2"
              style={{ paddingLeft: `${node.level * 14}px` }}
            >
              {node.level > 0 && (
                <span className="mt-1.5 text-muted-foreground/40 select-none text-[10px]">└</span>
              )}
              <span className={cn(
                "inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[9px] font-bold uppercase shrink-0",
                badge.style
              )}>
                {badge.label}
              </span>
              <span className="min-w-0 flex-1 text-[11px] leading-relaxed text-foreground">
                {node.title}
              </span>
              <span className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", dot)} title={node.status} />
            </li>
          );
        })}
      </ol>
    </div>
  );
}
