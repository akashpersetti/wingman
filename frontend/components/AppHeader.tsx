"use client";

import { Copy, Check, LogIn, Code2 } from "lucide-react";
import { T, MONO, SPIN } from "@/lib/theme";

interface Props {
  sessionId:      string | null;
  isLoading:      boolean;
  spinIdx:        number;
  copied:         boolean;
  onCopySession:  () => void;
  onOpenPalette:  () => void;
  onLoadSession:  () => void;
}

export default function AppHeader({
  sessionId, isLoading, spinIdx, copied,
  onCopySession, onOpenPalette, onLoadSession,
}: Props) {
  return (
    <header style={{
      background: T.panel,
      borderBottom: `1px solid ${T.border}`,
      padding: "9px 18px",
      display: "flex", alignItems: "center", justifyContent: "space-between",
      flexShrink: 0, zIndex: 20,
    }}>
      {/* Left */}
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <span
          onClick={() => window.location.reload()}
          style={{ color: T.text, fontWeight: "bold", letterSpacing: "0.2em", fontSize: "13px", cursor: "pointer" }}
        >
          WINGMAN
        </span>
        <span style={{ color: T.border }}>│</span>
        <span style={{ color: T.muted, fontSize: "11px" }}>personal co-worker</span>
        {isLoading && (
          <span style={{ color: T.teal, fontSize: "11px" }}>
            {SPIN[spinIdx]} processing
          </span>
        )}
      </div>

      {/* Right */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <a
          href="https://github.com/akashpersetti/wingman"
          target="_blank"
          rel="noopener noreferrer"
          style={{ ...MONO, display: "flex", alignItems: "center", gap: 5, border: `1px solid ${T.border}`, color: T.muted, padding: "3px 9px", fontSize: "11px", textDecoration: "none" }}
          title="View source on GitHub"
        >
          <Code2 size={11} /> source
        </a>

        <button
          onClick={onOpenPalette}
          style={{ ...MONO, background: "transparent", border: `1px solid ${T.border}`, color: T.muted, padding: "3px 9px", fontSize: "11px", display: "flex", alignItems: "center", gap: 5 }}
          title="Open command palette (⌘K)"
        >
          <span>⌘K</span>
          <span style={{ color: T.dim }}>commands</span>
        </button>

        <button
          onClick={onLoadSession}
          style={{ ...MONO, background: "transparent", border: `1px solid ${T.border}`, color: T.muted, padding: "3px 9px", fontSize: "11px", display: "flex", alignItems: "center", gap: 5 }}
        >
          <LogIn size={11} /> load session
        </button>

        {sessionId && (
          <div style={{ display: "flex", alignItems: "center", gap: 7, border: `1px solid ${T.border}`, padding: "3px 9px", fontSize: "11px", color: T.muted }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: isLoading ? T.orange : T.teal, display: "inline-block", flexShrink: 0 }} />
            <span style={{ color: T.dim }}>session:</span>
            <span style={{ color: T.muted }}>{sessionId}</span>
            <button
              onClick={onCopySession}
              style={{ background: "transparent", border: "none", color: copied ? T.teal : T.dim, padding: 0, display: "flex" }}
            >
              {copied ? <Check size={11} /> : <Copy size={11} />}
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
