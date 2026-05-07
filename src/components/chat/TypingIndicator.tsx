import { motion } from "framer-motion";
import { Bot } from "lucide-react";

const dot = {
  initial: { y: 0 },
  animate: { y: -4 },
};

const TypingIndicator = () => (
  <div className="flex items-end gap-3 px-4 py-2">
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent/15 ring-1 ring-accent/20">
      <Bot className="h-4 w-4 text-accent" />
    </div>

    <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-sm border border-border bg-section-alt px-4 py-3">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60"
          variants={dot}
          initial="initial"
          animate="animate"
          transition={{
            duration: 0.4,
            repeat: Infinity,
            repeatType: "reverse",
            delay: i * 0.12,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  </div>
);

export default TypingIndicator;
