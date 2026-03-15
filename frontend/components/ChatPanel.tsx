"use client";

import { motion } from "framer-motion";
import { RotateCcw, ChevronDown } from "lucide-react";
import ChatMessage from "@/components/ChatMessage";
import BlockCursorTextarea from "@/components/BlockCursorTextarea";
import { T, MONO, SPIN } from "@/lib/theme";
import { Message } from "@/lib/types";

interface Props {
  isInitializing:     boolean;
  isLoading:          boolean;
  error:              string | null;
  spinIdx:            number;
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
  isInitializing, isLoading, error, spinIdx,
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
    <div style={{ width: "50%", display: "flex", flexDirection: "column", overflow: "hidden" }}>

      {/* ── Messages ──────────────────────────────── */}
      <div
        ref={chatScrollRef}
        style={{ flex: 1, overflowY: "auto", padding: "16px 18px", display: "flex", flexDirection: "column", gap: 16 }}
      >
        {isInitializing ? (
          <div style={{ color: T.muted, fontSize: "12px" }}>
            {SPIN[spinIdx]} initializing...
          </div>
        ) : mainMessages.length === 0 ? (
          <div style={{ color: T.muted, fontSize: "12px", lineHeight: 2 }}>
            <div><span style={{ color: T.teal }}>$</span> wingman ready</div>
            <div><span style={{ color: T.dim }}>$</span> type a message and press <span style={{ color: T.blue }}>enter</span></div>
            <div><span style={{ color: T.dim }}>$</span> press <span style={{ color: T.blue }}>⌘K</span> to open the command palette</div>
          </div>
        ) : (
          mainMessages.map((msg, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.15 }}>
              <ChatMessage message={msg} />
            </motion.div>
          ))
        )}

        {isLoading && (
          <div style={{ color: T.muted, fontSize: "12px", display: "flex", gap: 6 }}>
            <span style={{ color: T.teal }}>$</span>
            <span>{SPIN[spinIdx]} wingman is working...</span>
          </div>
        )}

        {error && (
          <div style={{ color: T.red, fontSize: "12px" }}>
            <span style={{ color: "#661A1A" }}>! </span>{error}
          </div>
        )}

        <div ref={mainEndRef} />
      </div>

      {/* ── Input area ────────────────────────────── */}
      <div style={{ borderTop: `1px solid ${T.border}`, flexShrink: 0 }}>

        {/* Success criteria accordion */}
        <div style={{ borderBottom: `1px solid ${T.border}` }}>
          <button
            onClick={() => setShowCriteria(c => !c)}
            disabled={inputDisabled}
            style={{ ...MONO, background: "transparent", border: "none", color: showCriteria ? T.blue : T.dim, fontSize: "11px", padding: "6px 18px", display: "flex", alignItems: "center", gap: 6, width: "100%", opacity: inputDisabled ? 0.4 : 1 }}
          >
            <ChevronDown size={11} style={{ transform: showCriteria ? "rotate(180deg)" : "none", transition: "transform 0.15s" }} />
            success criteria
            {successCriteria && <span style={{ width: 5, height: 5, borderRadius: "50%", background: T.teal, display: "inline-block" }} />}
          </button>

          {showCriteria && (
            <div style={{ display: "flex", gap: 8, padding: "4px 18px 8px", alignItems: "flex-start" }}>
              <span style={{ color: T.dim, fontSize: "12px", paddingTop: 2, flexShrink: 0 }}>#</span>
              <BlockCursorTextarea
                ref={criteriaRef}
                value={successCriteria}
                onChange={e => setSuccessCriteria(e.target.value)}
                placeholder="describe what success looks like..."
                rows={2}
                disabled={inputDisabled}
                style={{ color: T.yellow }}
              />
            </div>
          )}
        </div>

        {/* Prompt row */}
        <div style={{ padding: "10px 18px", display: "flex", alignItems: "flex-start", gap: 10 }}>
          <span style={{ color: T.blue, fontSize: "14px", paddingTop: 1, flexShrink: 0, fontWeight: "bold" }}>❯</span>
          <BlockCursorTextarea
            ref={inputRef}
            value={message}
            onChange={e => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="type a message...  (shift+enter for newline)"
            rows={2}
            disabled={inputDisabled}
            style={{ color: T.text }}
          />
          <div style={{ display: "flex", gap: 8, flexShrink: 0, paddingTop: 1 }}>
            <button
              onClick={onReset}
              disabled={inputDisabled}
              style={{ ...MONO, background: "transparent", border: `1px solid ${T.border}`, color: T.muted, padding: "4px 10px", fontSize: "11px", display: "flex", alignItems: "center", gap: 5, opacity: inputDisabled ? 0.4 : 1 }}
            >
              <RotateCcw size={10} /> reset
            </button>
            <button
              onClick={onSend}
              disabled={sendDisabled}
              style={{ ...MONO, background: "transparent", border: `1px solid ${sendDisabled ? T.border : T.blue}`, color: sendDisabled ? T.muted : T.blue, padding: "4px 14px", fontSize: "11px", opacity: sendDisabled ? 0.4 : 1 }}
            >
              {isLoading ? `${SPIN[spinIdx]} working` : "send  [↵]"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
