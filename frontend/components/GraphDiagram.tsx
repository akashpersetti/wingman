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

  function Node({ id, label, detail }: { id: string; label: string; detail?: string }) {
    const active = activeNode === id;
    const content = (
      <>
        <span>{label}</span>
        {detail && <small>{detail}</small>}
      </>
    );

    if (active) {
      return (
        <div className="graph-node graph-node--active" aria-current="step">
          {content}
        </div>
      );
    }

    return (
      <div className="graph-node">
        {content}
      </div>
    );
  }

  return (
    <div className="agent-graph" aria-label="Agent workflow">
      <div className="graph-row">
        <Node id="start" label="Start" />
        <span className="graph-arrow">→</span>
        <Node id="worker" label="Worker" />
        <span className="graph-arrow">↔</span>
        <Node id="tools" label="Tools" />
      </div>
      <span className="graph-arrow graph-arrow--down">↓</span>
      <div className="graph-row"><Node id="evaluator" label="Evaluator" /></div>
      <span className="graph-arrow graph-arrow--down">↓</span>
      <div className="graph-row">
        <Node id="worker" label="Worker" detail="Retry" />
        <span className="graph-arrow">or</span>
        <Node id="end" label="End" />
      </div>
    </div>
  );
}
