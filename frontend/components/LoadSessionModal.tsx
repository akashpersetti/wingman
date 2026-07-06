"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useRef } from "react";
import { T, UI_FONT } from "@/lib/theme";
import { useDialogFocus } from "@/lib/useDialogFocus";

interface Props {
  open:       boolean;
  loadInput:  string;
  setLoadInput: (v: string) => void;
  onClose:    () => void;
  onConnect:  () => void;
}

export default function LoadSessionModal({ open, loadInput, setLoadInput, onClose, onConnect }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { dialogRef } = useDialogFocus<HTMLDivElement>({
    open,
    onClose,
    initialFocusRef: inputRef,
  });

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
            ref={dialogRef}
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.12 }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="load-session-title"
            tabIndex={-1}
            style={{ position: "fixed", top: "20%", left: "50%", transform: "translateX(-50%)", zIndex: 50, width: "min(460px, calc(100vw - 32px))", boxSizing: "border-box", background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, boxShadow: "0 24px 60px rgba(15, 23, 42, 0.2)", padding: 24, ...UI_FONT }}
          >
            <button
              onClick={onClose}
              aria-label="Close load session dialog"
              className="control control--ghost control--icon"
              style={{ position: "absolute", top: 14, right: 14 }}
            >
              <X size={18} aria-hidden="true" />
            </button>
            <h2 id="load-session-title" style={{ color: T.text, fontSize: 18, lineHeight: 1.3, margin: "0 36px 6px 0" }}>Load session</h2>
            <p style={{ color: T.muted, fontSize: 14, lineHeight: 1.5, margin: "0 0 18px" }}>
              Paste a session ID to reconnect to an existing conversation.
            </p>
            <input
              ref={inputRef}
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
                className="control control--neutral"
                style={{ ...UI_FONT, padding: "8px 14px", fontSize: 13 }}
              >
                Cancel
              </button>
              <button
                onClick={onConnect}
                disabled={!loadInput.trim()}
                className="control control--primary"
                style={{ ...UI_FONT, padding: "8px 14px", fontSize: 13, fontWeight: 600 }}
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
