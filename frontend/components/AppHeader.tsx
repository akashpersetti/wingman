"use client";

import type { CSSProperties } from "react";
import { Copy, Check, LogIn, Code2, LoaderCircle } from "lucide-react";
import { T, UI_FONT } from "@/lib/theme";

interface Props {
  sessionId:      string | null;
  isLoading:      boolean;
  copied:         boolean;
  onCopySession:  () => void;
  onOpenPalette:  () => void;
  onLoadSession:  () => void;
}

export default function AppHeader({
  sessionId, isLoading, copied,
  onCopySession, onOpenPalette, onLoadSession,
}: Props) {
  const actionStyle: CSSProperties = {
    ...UI_FONT,
    display: "flex",
    alignItems: "center",
    gap: 7,
    background: T.surface,
    border: `1px solid ${T.border}`,
    borderRadius: 8,
    color: T.text,
    padding: "8px 12px",
    fontSize: 13,
    lineHeight: 1,
    textDecoration: "none",
  };

  return (
    <header className="app-header">
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <button
          onClick={() => window.location.reload()}
          style={{ ...UI_FONT, border: 0, background: "transparent", color: T.text, fontWeight: 700, fontSize: 18, padding: 0 }}
          aria-label="Reload Wingman"
        >
          Wingman
        </button>
        <span style={{ color: T.muted, fontSize: 13 }}>Personal co-worker</span>
        {isLoading && (
          <span style={{ color: T.accentHover, fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}>
            <LoaderCircle className="app-spinner" size={15} aria-hidden="true" />
            Processing
          </span>
        )}
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 8, flexWrap: "wrap" }}>
        <a
          href="https://github.com/akashpersetti/wingman"
          target="_blank"
          rel="noopener noreferrer"
          style={actionStyle}
          title="View source on GitHub"
        >
          <Code2 size={15} aria-hidden="true" /> Source
        </a>

        <button
          onClick={onOpenPalette}
          style={actionStyle}
          title="Open command palette (⌘K)"
        >
          Commands
          <span style={{ color: T.muted, fontSize: 11 }}>⌘K</span>
        </button>

        <button
          onClick={onLoadSession}
          style={actionStyle}
        >
          <LogIn size={15} aria-hidden="true" /> Load session
        </button>

        {sessionId && (
          <div style={{ display: "flex", alignItems: "center", gap: 7, border: `1px solid ${T.accentSoft}`, borderRadius: 999, background: T.accentWash, padding: "7px 10px", fontSize: 12, color: T.text }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: isLoading ? T.orange : T.teal, display: "inline-block", flexShrink: 0 }} />
            <span style={{ color: T.muted }}>Session</span>
            <span>{sessionId}</span>
            <button
              onClick={onCopySession}
              style={{ background: "transparent", border: "none", color: copied ? T.accentHover : T.muted, padding: 2, display: "flex" }}
              aria-label={copied ? "Session ID copied" : "Copy session ID"}
            >
              {copied ? <Check size={14} aria-hidden="true" /> : <Copy size={14} aria-hidden="true" />}
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
