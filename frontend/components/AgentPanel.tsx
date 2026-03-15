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
    <div style={{ width: "50%", display: "flex", flexDirection: "column", borderRight: `1px solid ${T.border}` }}>

      {/* ── Graph ───────────────────────────────── */}
      <div style={{
        height: "50%", borderBottom: `1px solid ${T.border}`,
        background: T.panel, padding: "14px 18px",
        overflow: "hidden", display: "flex", flexDirection: "column",
      }}>
        <div style={{ color: T.dim, fontSize: "10px", letterSpacing: "0.18em", textTransform: "uppercase", marginBottom: 12, flexShrink: 0 }}>
          agent graph
        </div>
        <div style={{ flex: 1, overflow: "hidden", display: "flex", alignItems: "center" }}>
          <GraphDiagram isLoading={isLoading} />
        </div>
      </div>

      {/* ── Evaluator ───────────────────────────── */}
      <div style={{ height: "50%", background: T.panel, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ padding: "9px 18px 7px", borderBottom: `1px solid ${T.border}`, flexShrink: 0 }}>
          <span style={{ color: T.yellow, fontSize: "11px", letterSpacing: "0.12em", textTransform: "uppercase" }}>
            evaluator
          </span>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "12px 18px" }}>
          {evalMessages.length === 0 ? (
            <div style={{ color: T.dim, fontSize: "12px" }}>
              &gt; waiting for evaluator output...
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
                  style={{ marginBottom: 16 }}
                >
                  <div style={{ display: "flex", gap: 8, marginBottom: 4 }}>
                    <span style={{ color: T.dim, fontSize: "11px" }}>turn {i + 1}</span>
                    {msg.timestamp && <span style={{ color: T.dim, fontSize: "11px" }}>{msg.timestamp}</span>}
                  </div>
                  <div style={{ color: T.yellow, fontSize: "12px", lineHeight: 1.6, paddingLeft: 10, borderLeft: "1px solid #333300" }}>
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
