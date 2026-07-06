"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { T, UI_FONT } from "@/lib/theme";

interface Props {
  open:       boolean;
  loadInput:  string;
  setLoadInput: (v: string) => void;
  onClose:    () => void;
  onConnect:  () => void;
}

export default function LoadSessionModal({ open, loadInput, setLoadInput, onClose, onConnect }: Props) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: "fixed", inset: 0, zIndex: 40, background: "rgba(15, 23, 42, 0.32)", backdropFilter: "blur(3px)" }}
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.12 }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="load-session-title"
            style={{ position: "fixed", top: "20%", left: "50%", transform: "translateX(-50%)", zIndex: 50, width: "min(460px, calc(100vw - 32px))", boxSizing: "border-box", background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, boxShadow: "0 24px 60px rgba(15, 23, 42, 0.2)", padding: 24, ...UI_FONT }}
          >
            <button
              onClick={onClose}
              aria-label="Close load session dialog"
              style={{ position: "absolute", top: 14, right: 14, display: "flex", background: "transparent", border: 0, color: T.muted, padding: 4 }}
            >
              <X size={18} aria-hidden="true" />
            </button>
            <h2 id="load-session-title" style={{ color: T.text, fontSize: 18, lineHeight: 1.3, margin: "0 36px 6px 0" }}>Load session</h2>
            <p style={{ color: T.muted, fontSize: 14, lineHeight: 1.5, margin: "0 0 18px" }}>
              Paste a session ID to reconnect to an existing conversation.
            </p>
            <input
              autoFocus
              value={loadInput}
              onChange={e => setLoadInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && onConnect()}
              placeholder="Session ID"
              aria-label="Session ID"
              style={{ ...UI_FONT, width: "100%", background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8, color: T.text, padding: "10px 12px", fontSize: 14, boxSizing: "border-box", caretColor: T.accent }}
            />
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 18 }}>
              <button
                onClick={onClose}
                style={{ ...UI_FONT, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, color: T.text, padding: "8px 14px", fontSize: 13 }}
              >
                Cancel
              </button>
              <button
                onClick={onConnect}
                disabled={!loadInput.trim()}
                style={{ ...UI_FONT, background: T.accent, border: `1px solid ${T.accent}`, borderRadius: 8, color: T.surface, padding: "8px 14px", fontSize: 13, fontWeight: 600, opacity: loadInput.trim() ? 1 : 0.5 }}
              >
                Connect
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
