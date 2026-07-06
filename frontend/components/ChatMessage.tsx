"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Message } from "@/lib/types";
import { T, EVALUATOR_PREFIX } from "@/lib/theme";

export default function ChatMessage({ message }: { message: Message }) {
  const isUser      = message.role === "user";
  const isEvaluator = message.content.startsWith(EVALUATOR_PREFIX);
  const ts          = message.timestamp;

  if (isUser) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 3 }}>
        <div style={{
          background: T.accentWash,
          border: `1px solid ${T.accentSoft}`,
          borderRadius: 12,
          padding: "10px 14px",
          maxWidth: "82%",
          color: T.text,
          fontFamily: "inherit",
          fontSize: 14,
          lineHeight: "1.55",
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
        }}>
          {message.content}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {ts && <span style={{ color: T.muted, fontSize: "10px" }}>{ts}</span>}
          <span style={{ color: T.accentHover, fontSize: 11, fontWeight: 600 }}>You</span>
        </div>
      </div>
    );
  }

  if (isEvaluator) return null;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 3 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
        <span style={{ color: T.accentHover, fontSize: 12, fontWeight: 600 }}>Wingman</span>
        {ts && <span style={{ color: T.muted, fontSize: 11 }}>{ts}</span>}
      </div>
      <div className="ai-prose" style={{ maxWidth: "82%", wordBreak: "break-word" }}>
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
      </div>
    </div>
  );
}
