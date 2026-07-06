"use client";

import { Copy, Check, LogIn, Code2, LoaderCircle } from "lucide-react";
import { T } from "@/lib/theme";

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
  return (
    <header className="app-header">
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <button
          onClick={() => window.location.reload()}
          className="control control--brand"
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

      <div className="app-header__actions">
        <a
          href="https://github.com/akashpersetti/wingman"
          target="_blank"
          rel="noopener noreferrer"
          className="control control--neutral"
          title="View source on GitHub"
        >
          <Code2 size={15} aria-hidden="true" /> Source
        </a>

        <button
          onClick={onOpenPalette}
          className="control control--neutral"
          title="Open command palette (⌘K)"
        >
          Commands
          <span style={{ color: T.muted, fontSize: 11 }}>⌘K</span>
        </button>

        <button
          onClick={onLoadSession}
          className="control control--neutral"
        >
          <LogIn size={15} aria-hidden="true" /> Load session
        </button>

        {sessionId && (
          <div className="session-pill">
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: isLoading ? T.orange : T.teal, display: "inline-block", flexShrink: 0 }} />
            <span className="session-pill__label">Session</span>
            <span className="session-pill__id">{sessionId}</span>
            <button
              onClick={onCopySession}
              className="control control--ghost control--icon"
              style={{ color: copied ? T.accentHover : T.muted }}
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
