import { useState } from "react";
import { RefreshCw, PenLine, AlignLeft, Sigma } from "lucide-react";

interface Props {
  expression: string;
  onRetry?: () => void;
  onOpenWhiteboard?: (expression: string) => void;
  onRequestSimplified?: (expression: string) => void;
}

const GraphErrorCard = ({ expression, onRetry, onOpenWhiteboard, onRequestSimplified }: Props) => {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div className="my-3 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm">
      <p className="font-medium text-destructive">No pude generar la gráfica automáticamente.</p>
      {expression && (
        <div className="mt-2 flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Función:</span>
          <code className="rounded bg-background/80 px-2 py-0.5 text-[11px] text-foreground">
            {expression}
          </code>
        </div>
      )}
      <div className="mt-3 flex flex-wrap gap-2">
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-secondary"
          >
            <RefreshCw className="h-3 w-3" />
            Reintentar
          </button>
        )}
        {onOpenWhiteboard && (
          <button
            type="button"
            onClick={() => onOpenWhiteboard(expression)}
            className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-secondary"
          >
            <PenLine className="h-3 w-3" />
            Abrir en pizarra
          </button>
        )}
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-secondary"
        >
          <AlignLeft className="h-3 w-3" />
          Ver explicación textual
        </button>
        {onRequestSimplified && (
          <button
            type="button"
            onClick={() => onRequestSimplified(expression)}
            className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-secondary"
          >
            <Sigma className="h-3 w-3" />
            Generar versión simplificada
          </button>
        )}
      </div>
    </div>
  );
};

export default GraphErrorCard;
