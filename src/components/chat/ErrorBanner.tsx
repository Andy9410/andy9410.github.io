import { WifiOff, RotateCcw } from "lucide-react";

interface Props {
  onRetry: () => void;
}

const ErrorBanner = ({ onRetry }: Props) => (
  <div className="flex items-center gap-3 border-b border-destructive/20 bg-destructive/10 px-4 py-2.5 text-sm text-destructive">
    <WifiOff className="h-4 w-4 shrink-0" />
    <span className="flex-1">No se pudo conectar con el servicio. Verificá tu conexión.</span>
    <button
      onClick={onRetry}
      className="flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors hover:bg-destructive/20"
    >
      <RotateCcw className="h-3 w-3" />
      Reintentar
    </button>
  </div>
);

export default ErrorBanner;
