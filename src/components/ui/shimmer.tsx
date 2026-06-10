import type { CSSProperties, ElementType, HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface ShimmerProps extends Omit<HTMLAttributes<HTMLElement>, "children"> {
  as?: ElementType;
  children?: string;
  duration?: number;
  spread?: number;
}

export function Shimmer({
  as: Component = "span",
  children = "",
  className,
  duration = 2,
  spread,
  style,
  ...props
}: ShimmerProps) {
  const resolvedSpread = spread ?? Math.max(56, Math.min(160, children.length * 4));

  return (
    <Component
      className={cn("ai-shimmer-text", className)}
      style={{
        "--shimmer-duration": `${duration}s`,
        "--shimmer-spread": `${resolvedSpread}px`,
        ...style,
      } as CSSProperties}
      {...props}
    >
      {children}
    </Component>
  );
}
