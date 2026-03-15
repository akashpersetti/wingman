"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface Props {
  children: ReactNode;
  className?: string;
  delay?: number;
  direction?: "up" | "down" | "left" | "right" | "fade";
}

export default function AnimatedSection({
  children,
  className,
  delay = 0,
  direction = "up",
}: Props) {
  const reducedMotion = useReducedMotion();

  const variants = {
    hidden: reducedMotion
      ? { opacity: 0 }
      : {
          opacity: 0,
          y: direction === "up" ? 16 : direction === "down" ? -16 : 0,
          x: direction === "left" ? 16 : direction === "right" ? -16 : 0,
        },
    visible: { opacity: 1, y: 0, x: 0 },
  };

  return (
    <motion.div
      className={cn(className)}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-40px" }}
      variants={variants}
      transition={{ duration: 0.35, delay, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}
