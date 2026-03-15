"use client";

import { useEffect, useState } from "react";

const CYCLE: Array<"worker" | "tools" | "evaluator"> = [
  "worker", "tools", "worker", "evaluator",
];

interface Props { isLoading: boolean; }

export default function GraphDiagram({ isLoading }: Props) {
  const [activeNode, setActiveNode] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading) { setActiveNode(null); return; }
    setActiveNode(CYCLE[0]);
    const id = setInterval(() => {
      setActiveNode(cur => {
        const i = CYCLE.indexOf(cur as "worker" | "tools" | "evaluator");
        return CYCLE[(i + 1) % CYCLE.length];
      });
    }, 800);
    return () => clearInterval(id);
  }, [isLoading]);

  /* colour helpers */
  const ACTIVE = "#4EC9B0"; /* teal  */
  const IDLE   = "#555555"; /* muted */
  const DIM    = "#2D2D2D"; /* borders / arrows */
  const TERM   = "#444444"; /* terminal nodes */

  function nc(name: string) { return activeNode === name ? ACTIVE : IDLE; }
  function fw(name: string): "bold" | "normal" { return activeNode === name ? "bold" : "normal"; }

  const s = (color: string, text: string, bold?: boolean) => (
    <span style={{ color, fontWeight: bold ? "bold" : "normal" }}>{text}</span>
  );

  return (
    <div style={{
      fontFamily: "Menlo, Monaco, 'Courier New', monospace",
      fontSize: "12px", lineHeight: "1.45",
      userSelect: "none", whiteSpace: "pre", overflowX: "auto",
    }}>
      <div>
        {s(TERM,       "  ┌───────────┐")}
        {s(DIM,        "     ")}
        {s(nc("worker"), "┌──────────┐")}
        {s(DIM,        "     ")}
        {s(nc("tools"),  "┌─────────┐")}
      </div>
      <div>
        {s(TERM,       "  │ ")}
        {s(TERM,       "__start__")}
        {s(TERM,       " │")}
        {s(DIM,        "────▶")}
        {s(nc("worker"), "│  ")}
        {s(nc("worker"), "worker", fw("worker") === "bold")}
        {s(nc("worker"), "  │")}
        {s(DIM,        "◀───▶")}
        {s(nc("tools"),  "│  ")}
        {s(nc("tools"),  "tools", fw("tools") === "bold")}
        {s(nc("tools"),  "  │")}
      </div>
      <div>
        {s(TERM,       "  └───────────┘")}
        {s(DIM,        "     ")}
        {s(nc("worker"), "└──────────┘")}
        {s(DIM,        "     ")}
        {s(nc("tools"),  "└─────────┘")}
      </div>

      <div>{s(DIM, "                         │")}</div>
      <div>{s(DIM, "                         ▼")}</div>

      <div>{s(nc("evaluator"), "                   ┌───────────┐")}</div>
      <div>
        {s(nc("evaluator"), "                   │ ")}
        {s(nc("evaluator"), "evaluator", fw("evaluator") === "bold")}
        {s(nc("evaluator"), " │")}
      </div>
      <div>{s(nc("evaluator"), "                   └───────────┘")}</div>

      <div>{s(DIM, "                      ╱         ╲")}</div>
      <div>{s(DIM, "                    ▼              ▼")}</div>

      <div>
        {s(nc("worker"), "              ┌──────────┐")}
        {s(DIM,          "    ")}
        {s(TERM,         "┌─────────┐")}
      </div>
      <div>
        {s(nc("worker"), "              │  ")}
        {s(nc("worker"), "worker")}
        {s(nc("worker"), "  │")}
        {s(DIM,          "    ")}
        {s(TERM,         "│ __end__ │")}
      </div>
      <div>
        {s(nc("worker"), "              │ (retry)  │")}
        {s(DIM,          "    ")}
        {s(TERM,         "└─────────┘")}
      </div>
      <div>{s(nc("worker"), "              └──────────┘")}</div>
    </div>
  );
}
