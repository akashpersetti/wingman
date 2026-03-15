"use client";

import { AnimatePresence, motion } from "framer-motion";
import { T, MONO } from "@/lib/theme";

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
            style={{ position: "fixed", inset: 0, zIndex: 40, background: "rgba(0,0,0,0.6)" }}
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.12 }}
            style={{ position: "fixed", top: "20%", left: "50%", transform: "translateX(-50%)", zIndex: 50, width: 460, background: T.surface, border: `1px solid ${T.border}`, padding: 22, ...MONO }}
          >
            <div style={{ color: T.text, fontSize: "13px", marginBottom: 4 }}>$ load session</div>
            <div style={{ color: T.muted, fontSize: "11px", marginBottom: 14 }}>
              paste a session id to reconnect to an existing conversation
            </div>
            <input
              autoFocus
              value={loadInput}
              onChange={e => setLoadInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && onConnect()}
              placeholder="session id..."
              style={{ ...MONO, width: "100%", background: T.bg, border: `1px solid ${T.border}`, color: T.text, padding: "8px 10px", fontSize: "12px", outline: "none", boxSizing: "border-box", caretColor: T.blue }}
            />
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 14 }}>
              <button
                onClick={onClose}
                style={{ ...MONO, background: "transparent", border: `1px solid ${T.border}`, color: T.muted, padding: "5px 14px", fontSize: "12px" }}
              >
                cancel
              </button>
              <button
                onClick={onConnect}
                disabled={!loadInput.trim()}
                style={{ ...MONO, background: "transparent", border: `1px solid ${T.blue}`, color: T.blue, padding: "5px 14px", fontSize: "12px", opacity: loadInput.trim() ? 1 : 0.4 }}
              >
                connect
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
