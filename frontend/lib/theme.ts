import React from "react";

export const T = {
  bg: "#ffffff",
  panel: "#f7fafa",
  surface: "#ffffff",
  surfaceTint: "#ccfbf1",
  border: "#e2e8f0",
  text: "#0f172a",
  muted: "#475569",
  dim: "#64748b",
  accent: "#0d9488",
  accentHover: "#0f766e",
  accentSoft: "#5eead4",
  accentWash: "#0d948814",
  blue: "#0d9488",
  teal: "#0d9488",
  yellow: "#0f766e",
  red: "#be123c",
  orange: "#d97706",
} as const;

export const UI_FONT: React.CSSProperties = {
  fontFamily: 'var(--font-inter), "Inter", "Inter Fallback", ui-sans-serif, system-ui, sans-serif',
};

export const SPIN = ["⠋","⠙","⠹","⠸","⠼","⠴","⠦","⠧","⠇","⠏"];

export const EVALUATOR_PREFIX = "Evaluator Feedback on this answer:";

export function nowHMS(): string {
  const d = new Date();
  return [d.getHours(), d.getMinutes(), d.getSeconds()]
    .map(n => String(n).padStart(2, "0"))
    .join(":");
}
