"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { forwardRef } from "react";

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  glow?: boolean;
  glowColor?: string;
  animate?: boolean;
}

const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
  ({ className, glow = false, glowColor = "rgba(139,92,246,0.3)", animate = false, children, ...props }, ref) => {
    const base = cn(
      "rounded-2xl",
      "bg-white/60 dark:bg-white/[0.04]",
      "backdrop-blur-xl",
      "border border-white/70 dark:border-white/[0.08]",
      "shadow-sm dark:shadow-none",
      glow && "shadow-lg",
      className
    );

    if (animate) {
      return (
        <motion.div
          ref={ref as React.Ref<HTMLDivElement>}
          className={base}
          style={glow ? { boxShadow: `0 0 24px ${glowColor}` } : undefined}
          whileHover={glow ? { boxShadow: `0 0 40px ${glowColor}` } : undefined}
          transition={{ duration: 0.2 }}
          {...(props as React.ComponentProps<typeof motion.div>)}
        >
          {children}
        </motion.div>
      );
    }

    return (
      <div
        ref={ref}
        className={base}
        style={glow ? { boxShadow: `0 0 24px ${glowColor}` } : undefined}
        {...props}
      >
        {children}
      </div>
    );
  }
);

GlassCard.displayName = "GlassCard";
export default GlassCard;
