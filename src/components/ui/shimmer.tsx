import { memo, type ElementType, type ComponentPropsWithoutRef } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

type ShimmerProps<T extends ElementType = "p"> = {
  as?: T;
  duration?: number;
  spread?: number;
  className?: string;
  children: string;
} & Omit<ComponentPropsWithoutRef<T>, "as" | "children" | "className">;

const Shimmer = memo(
  <T extends ElementType = "p">({
    as,
    children,
    className,
    duration = 2,
    spread = 2,
    ...props
  }: ShimmerProps<T>) => {
    const Tag = (as ?? "p") as ElementType;
    const spreadPx = children.length * spread;

    return (
      <Tag className={cn("relative inline-block", className)} {...props}>
        <span className="invisible">{children}</span>

        <motion.span
          aria-hidden
          className="absolute inset-0 bg-clip-text text-transparent"
          style={{
            backgroundImage: `linear-gradient(90deg, currentColor calc(50% - ${spreadPx}px), hsl(var(--accent)) 50%, currentColor calc(50% + ${spreadPx}px))`,
            backgroundSize: "200% 100%",
          }}
          animate={{ backgroundPositionX: ["100%", "-100%"] }}
          transition={{
            duration,
            ease: "linear",
            repeat: Infinity,
          }}
        >
          {children}
        </motion.span>
      </Tag>
    );
  }
);

Shimmer.displayName = "Shimmer";

export { Shimmer };
