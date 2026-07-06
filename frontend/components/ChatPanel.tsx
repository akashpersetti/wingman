"use client";

import { motion } from "framer-motion";
import { RotateCcw, ChevronDown, LoaderCircle } from "lucide-react";
import ChatMessage from "@/components/ChatMessage";
import AppTextarea from "@/components/AppTextarea";
import { T, UI_FONT } from "@/lib/theme";
import { Message } from "@/lib/types";

interface Props {
  isInitializing:     boolean;
  isLoading:          boolean;
  error:              string | null;
  mainMessages:       Message[];
  message:            string;
  setMessage:         (v: string) => void;
  successCriteria:    string;
  setSuccessCriteria: (v: string) => void;
  showCriteria:       boolean;
  setShowCriteria:    (fn: (c: boolean) => boolean) => void;
  inputDisabled:      boolean;
  inputRef:           React.RefObject<HTMLTextAreaElement>;
  criteriaRef:        React.RefObject<HTMLTextAreaElement>;
  chatScrollRef:      React.RefObject<HTMLDivElement>;
  mainEndRef:         React.RefObject<HTMLDivElement>;
  onSend:             () => void;
  onReset:            () => void;
}

export default function ChatPanel({
  isInitializing, isLoading, error,
  mainMessages,
  message, setMessage,
  successCriteria, setSuccessCriteria,
  showCriteria, setShowCriteria,
  inputDisabled,
  inputRef, criteriaRef, chatScrollRef, mainEndRef,
  onSend, onReset,
}: Props) {

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onSend(); }
  }

  const sendDisabled = inputDisabled || !message.trim();

  return (
    <div className="chat-panel">

      {/* ── Messages ──────────────────────────────── */}
      <div
        ref={chatScrollRef}
        style={{ flex: 1, overflowY: "auto", padding: "24px", display: "flex", flexDirection: "column", gap: 20, background: T.bg }}
      >
        {isInitializing ? (
          <div style={{ color: T.muted, fontSize: 14, display: "flex", alignItems: "center", gap: 8 }}>
            <LoaderCircle className="app-spinner" size={16} aria-hidden="true" />
            Connecting to Wingman
          </div>
        ) : mainMessages.length === 0 ? (
          <div style={{ maxWidth: 480, margin: "auto", textAlign: "center", color: T.muted }}>
            <h2 style={{ margin: "0 0 10px", color: T.text, fontSize: 20, lineHeight: 1.3 }}>Wingman is ready</h2>
            <p style={{ margin: "0 0 6px", fontSize: 14, lineHeight: 1.6 }}>Write a message below and press Enter to send it.</p>
            <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6 }}>Open Commands for shortcuts and session actions.</p>
          </div>
        ) : (
          mainMessages.map((msg, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.15 }}>
              <ChatMessage message={msg} />
            </motion.div>
          ))
        )}

        {isLoading && (
          <div style={{ color: T.muted, fontSize: 14, display: "flex", alignItems: "center", gap: 8 }}>
            <LoaderCircle className="app-spinner" size={16} color={T.accent} aria-hidden="true" />
            <span>Wingman is working</span>
          </div>
        )}

        {error && (
          <div role="alert" style={{ color: T.red, background: "#fff1f2", border: "1px solid #fecdd3", borderRadius: 10, padding: "10px 12px", fontSize: 13, lineHeight: 1.5 }}>
            {error}
          </div>
        )}

        <div ref={mainEndRef} />
      </div>

      {/* ── Input area ────────────────────────────── */}
      <div style={{ borderTop: `1px solid ${T.border}`, flexShrink: 0, background: T.surface, fontSize: 14 }}>

        {/* Success criteria accordion */}
        <div style={{ borderBottom: `1px solid ${T.border}` }}>
          <button
            onClick={() => setShowCriteria(c => !c)}
            disabled={inputDisabled}
            style={{ ...UI_FONT, background: "transparent", border: "none", color: showCriteria ? T.accentHover : T.muted, fontSize: 13, padding: "9px 18px", display: "flex", alignItems: "center", gap: 7, width: "100%", opacity: inputDisabled ? 0.5 : 1 }}
          >
            <ChevronDown size={14} style={{ transform: showCriteria ? "rotate(180deg)" : "none", transition: "transform 0.15s" }} aria-hidden="true" />
            Success criteria
            {successCriteria && <span style={{ width: 5, height: 5, borderRadius: "50%", background: T.teal, display: "inline-block" }} />}
          </button>

          {showCriteria && (
            <div style={{ display: "flex", gap: 8, padding: "4px 18px 8px", alignItems: "flex-start" }}>
              <AppTextarea
                ref={criteriaRef}
                value={successCriteria}
                onChange={e => setSuccessCriteria(e.target.value)}
                placeholder="Describe what success looks like..."
                rows={2}
                disabled={inputDisabled}
                ariaLabel="Success criteria"
                style={{ color: T.text }}
              />
            </div>
          )}
        </div>

        {/* Prompt row */}
        <div style={{ padding: "14px 18px", display: "flex", alignItems: "flex-start", gap: 12 }}>
          <AppTextarea
            ref={inputRef}
            value={message}
            onChange={e => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message... (Shift+Enter for a newline)"
            rows={2}
            disabled={inputDisabled}
            ariaLabel="Message"
            style={{ color: T.text }}
          />
          <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
            <button
              onClick={onReset}
              disabled={inputDisabled}
              style={{ ...UI_FONT, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, color: T.text, padding: "8px 12px", fontSize: 13, display: "flex", alignItems: "center", gap: 6, opacity: inputDisabled ? 0.5 : 1 }}
            >
              <RotateCcw size={14} aria-hidden="true" /> Reset
            </button>
            <button
              onClick={onSend}
              disabled={sendDisabled}
              style={{ ...UI_FONT, background: sendDisabled ? T.accentSoft : T.accent, border: `1px solid ${sendDisabled ? T.accentSoft : T.accent}`, borderRadius: 8, color: sendDisabled ? T.muted : T.surface, padding: "8px 16px", fontSize: 13, fontWeight: 600, opacity: sendDisabled ? 0.55 : 1 }}
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
