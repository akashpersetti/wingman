"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Message } from "@/lib/types";

const EVALUATOR_PREFIX = "Evaluator Feedback on this answer:";

export default function ChatMessage({ message }: { message: Message }) {
  const isUser      = message.role === "user";
  const isEvaluator = message.content.startsWith(EVALUATOR_PREFIX);
  const ts          = message.timestamp;

  const T = {
    border:  "#2D2D2D",
    muted:   "#555555",
    blue:    "#5B9BD5",
    teal:    "#4EC9B0",
    text:    "#E8E8E8",
  };

  /* ── User message (right-aligned) ──────────────────── */
  if (isUser) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 3 }}>
        <div style={{
          background: "#252525",
          border: `1px solid ${T.border}`,
          padding: "8px 14px",
          maxWidth: "78%",
          color: T.text,
          fontFamily: "Menlo, Monaco, 'Courier New', monospace",
          fontSize: "13px",
          lineHeight: "1.55",
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
        }}>
          {message.content}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {ts && <span style={{ color: T.muted, fontSize: "10px" }}>{ts}</span>}
          <span style={{ color: T.blue, fontSize: "10px" }}>you ❯</span>
        </div>
      </div>
    );
  }

  /* ── Evaluator message — rendered in sidebar, skip here */
  if (isEvaluator) return null;

  /* ── AI message (left-aligned) ─────────────────────── */
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 3 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
        <span style={{ color: T.teal, fontSize: "11px" }}>$ wingman</span>
        {ts && <span style={{ color: T.muted, fontSize: "10px" }}>{ts}</span>}
      </div>
      <div className="ai-prose" style={{ maxWidth: "78%", wordBreak: "break-word" }}>
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
      </div>
    </div>
  );
}
