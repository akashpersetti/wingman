"use client";

import { useEffect, useState } from "react";

const BOOT_LINES = [
  { text: "WINGMAN v1.0.0",        color: "#E8E8E8", bold: true,  delay: 0   },
  { text: "personal co-worker",    color: "#9E9E9E", bold: false, delay: 180 },
  { text: "─".repeat(30),          color: "#333333", bold: false, delay: 360 },
  { text: "loading agent graph...", color: "#5B9BD5", bold: false, delay: 540 },
  { text: "loading tools...",       color: "#5B9BD5", bold: false, delay: 720 },
  { text: "ready.",                 color: "#4EC9B0", bold: true,  delay: 950 },
];

export default function SplashScreen({ onComplete }: { onComplete: () => void }) {
  const [shown,    setShown]    = useState<Set<number>>(new Set());
  const [progress, setProgress] = useState(0);
  const [exiting,  setExiting]  = useState(false);

  useEffect(() => {
    BOOT_LINES.forEach((line, i) => {
      setTimeout(() => setShown(s => new Set(s).add(i)), line.delay);
    });
  }, []);

  useEffect(() => {
    // Stage timings: [targetPct, durationMs, pauseAfterMs]
    const stages: [number, number, number][] = [
      [70,  950,  900],   // run to 70%, pause 900ms
      [90,  280,  500],   // fast to 90%, pause 500ms
      [100, 220,  0  ],   // complete
    ];

    let current = 0;
    let raf: number;

    function runStage(stageIdx: number, from: number) {
      if (stageIdx >= stages.length) return;
      const [target, duration, pauseAfter] = stages[stageIdx];
      const start = performance.now();

      function tick(now: number) {
        const t   = Math.min((now - start) / duration, 1);
        // ease-out within each stage
        const eased = 1 - Math.pow(1 - t, 2);
        setProgress(from + (target - from) * eased);

        if (t < 1) {
          raf = requestAnimationFrame(tick);
        } else {
          setProgress(target);
          if (stageIdx === stages.length - 1) {
            // done
            setTimeout(() => { setExiting(true); setTimeout(onComplete, 350); }, 300);
          } else {
            setTimeout(() => runStage(stageIdx + 1, target), pauseAfter);
          }
        }
      }
      raf = requestAnimationFrame(tick);
    }

    runStage(0, 0);
    return () => cancelAnimationFrame(raf);
  }, [onComplete]);

  const filled = Math.round((progress / 100) * 30);
  const bar    = "█".repeat(filled) + "░".repeat(30 - filled);

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 50,
      background: "#111111",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "Menlo, Monaco, 'Courier New', monospace",
      opacity: exiting ? 0 : 1, transition: "opacity 0.35s",
    }}>
      <div style={{ width: 360 }}>
        {BOOT_LINES.map((line, i) => (
          <div key={i} style={{
            color:      line.color,
            fontWeight: line.bold ? "bold" : "normal",
            fontSize:   i === 0 ? "16px" : "12px",
            letterSpacing: i === 0 ? "0.2em" : "0.04em",
            marginBottom: "5px",
            opacity: shown.has(i) ? 1 : 0,
            transform: shown.has(i) ? "translateY(0)" : "translateY(4px)",
            transition: "opacity 0.2s, transform 0.2s",
          }}>
            {i !== 0 && i !== 2 && (
              <span style={{ color: "#444444", marginRight: 6 }}>&gt;</span>
            )}
            {line.text}
          </div>
        ))}

        <div style={{ marginTop: 22, fontSize: "12px" }}>
          <span style={{ color: "#444444" }}>[</span>
          <span style={{ color: "#4EC9B0" }}>{bar}</span>
          <span style={{ color: "#444444" }}>]</span>
          <span style={{ color: "#666666", marginLeft: 8 }}>{Math.round(progress)}%</span>
        </div>
      </div>
    </div>
  );
}
