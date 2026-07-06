"use client";

import { motion } from "framer-motion";
import GraphDiagram from "@/components/GraphDiagram";
import { T, EVALUATOR_PREFIX } from "@/lib/theme";
import { Message } from "@/lib/types";

interface Props {
  isLoading:    boolean;
  evalMessages: Message[];
  evalEndRef:   React.RefObject<HTMLDivElement>;
}

export default function AgentPanel({ isLoading, evalMessages, evalEndRef }: Props) {
  return (
    <div className="agent-panel">
      <div style={{
        height: "50%", borderBottom: `1px solid ${T.border}`,
        background: T.panel, padding: "14px 18px",
        overflow: "hidden", display: "flex", flexDirection: "column",
      }}>
        <div style={{ color: T.muted, fontSize: "11px", fontWeight: 600, marginBottom: 12, flexShrink: 0 }}>
          Agent workflow
        </div>
        <div style={{ flex: 1, minHeight: 0, overflow: "auto", display: "flex", alignItems: "center" }}>
          <GraphDiagram isLoading={isLoading} />
        </div>
      </div>

      <div style={{ height: "50%", background: T.panel, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ padding: "10px 18px", borderBottom: `1px solid ${T.border}`, flexShrink: 0 }}>
          <span style={{ color: T.text, fontSize: "11px", fontWeight: 600 }}>
            Evaluator
          </span>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "12px 18px" }}>
          {evalMessages.length === 0 ? (
            <div style={{ color: T.muted, fontSize: "12px", lineHeight: 1.6 }}>
              Evaluator feedback will appear here after a response.
            </div>
          ) : (
            evalMessages.map((msg, i) => {
              const feedback = msg.content.slice(EVALUATOR_PREFIX.length).trim();
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.15 }}
                  style={{
                    marginBottom: 12,
                    padding: "12px 14px",
                    background: T.surface,
                    border: `1px solid ${T.border}`,
                    borderLeft: `3px solid ${T.accent}`,
                    borderRadius: 10,
                    color: T.text,
                  }}
                >
                  <div style={{ display: "flex", gap: 8, marginBottom: 6 }}>
                    <span style={{ color: T.muted, fontSize: "11px", fontWeight: 600 }}>Turn {i + 1}</span>
                    {msg.timestamp && <span style={{ color: T.muted, fontSize: "11px" }}>{msg.timestamp}</span>}
                  </div>
                  <div style={{ color: T.text, fontSize: "12px", lineHeight: 1.6 }}>
                    {feedback}
                  </div>
                </motion.div>
              );
            })
          )}
          <div ref={evalEndRef} />
        </div>
      </div>
    </div>
  );
}
