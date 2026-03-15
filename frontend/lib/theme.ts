import React from "react";

export const T = {
  bg:      "#1A1A1A",
  panel:   "#141414",
  surface: "#1E1E1E",
  border:  "#2D2D2D",
  text:    "#E8E8E8",
  muted:   "#666666",
  dim:     "#444444",
  blue:    "#5B9BD5",
  teal:    "#4EC9B0",
  yellow:  "#DCDCAA",
  red:     "#E74C3C",
  orange:  "#CE9178",
} as const;

export const MONO: React.CSSProperties = {
  fontFamily: "'Menlo','Monaco','Courier New',monospace",
};

export const SPIN = ["⠋","⠙","⠹","⠸","⠼","⠴","⠦","⠧","⠇","⠏"];

export const EVALUATOR_PREFIX = "Evaluator Feedback on this answer:";

export function nowHMS(): string {
  const d = new Date();
  return [d.getHours(), d.getMinutes(), d.getSeconds()]
    .map(n => String(n).padStart(2, "0"))
    .join(":");
}
