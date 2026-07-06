"use client";

import { useEffect, useState } from "react";

export default function SplashScreen({ onComplete }: { onComplete: () => void }) {
  const [progress, setProgress] = useState(0);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    // Stage timings: [targetPct, durationMs, pauseAfterMs]
    const stages: [number, number, number][] = [
      [70,  950,  900],
      [90,  280,  500],
      [100, 220,  0  ],
    ];

    let raf: number;

    function runStage(stageIdx: number, from: number) {
      if (stageIdx >= stages.length) return;
      const [target, duration, pauseAfter] = stages[stageIdx];
      const start = performance.now();

      function tick(now: number) {
        const t = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - t, 2);
        setProgress(from + (target - from) * eased);

        if (t < 1) {
          raf = requestAnimationFrame(tick);
        } else {
          setProgress(target);
          if (stageIdx === stages.length - 1) {
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

  return (
    <div className="splash" style={{ opacity: exiting ? 0 : 1 }}>
      <div className="splash__content">
        <div className="splash__mark">W</div>
        <h1>Wingman</h1>
        <p>Preparing your workspace</p>
        <div className="splash__track" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress)}>
          <div className="splash__fill" style={{ width: `${progress}%` }} />
        </div>
      </div>
    </div>
  );
}
