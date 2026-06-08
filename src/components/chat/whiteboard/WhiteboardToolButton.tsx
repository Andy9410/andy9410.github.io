import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  label: string;
  active?: boolean;
  icon: LucideIcon;
  onClick: () => void;
}

export function WhiteboardToolButton({ label, active = false, icon: Icon, onClick }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={cn(
        "inline-flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-all duration-150",
        "hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        "active:scale-95",
        active
          ? "bg-accent/15 text-accent"
          : "bg-transparent"
      )}
    >
      <Icon className="h-4 w-4" aria-hidden="true" />
    </button>
  );
}
