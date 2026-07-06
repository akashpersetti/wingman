"use client";

import { useEffect, useRef, useState } from "react";
import { T, UI_FONT } from "@/lib/theme";

export interface Command {
  id:        string;
  label:     string;
  hint?:     string;
  shortcut?: string;
  action:    () => void;
}

interface Props {
  commands: Command[];
  onClose:  () => void;
}

export default function CommandPalette({ commands, onClose }: Props) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

  const filtered = commands.filter(c =>
    c.label.toLowerCase().includes(query.toLowerCase()) ||
    (c.hint ?? "").toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    function onGlobalKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      }
    }
    window.addEventListener("keydown", onGlobalKey, { capture: true });
    return () => window.removeEventListener("keydown", onGlobalKey, { capture: true });
  }, [onClose]);

  useEffect(() => { setSelected(0); }, [query]);

  useEffect(() => {
    itemRefs.current[selected]?.scrollIntoView({ block: "nearest" });
  }, [selected]);

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") { e.preventDefault(); setSelected(s => Math.min(s + 1, filtered.length - 1)); }
    if (e.key === "ArrowUp") { e.preventDefault(); setSelected(s => Math.max(s - 1, 0)); }
    if (e.key === "Enter") { e.preventDefault(); filtered[selected]?.action(); onClose(); }
    if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); onClose(); }
  }

  return (
    <>
      <div className="cmd-backdrop" onClick={onClose} />

      <div style={{
        ...UI_FONT,
        position: "fixed", top: "20%", left: "50%", transform: "translateX(-50%)",
        zIndex: 61, width: "min(520px, calc(100vw - 32px))", overflow: "hidden",
        background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12,
        boxShadow: "0 24px 64px rgba(15, 23, 42, 0.2)",
      }}>
        <div style={{ padding: "12px 14px", borderBottom: `1px solid ${T.border}`, display: "flex", alignItems: "center", gap: 12 }}>
          <input
            ref={inputRef}
            type="search"
            aria-label="Search commands"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Search commands…"
            style={{
              flex: 1, minWidth: 0, background: "transparent", border: "none", outline: "none",
              color: T.text, fontSize: "13px", caretColor: T.accent,
              fontFamily: "inherit",
            }}
          />
          <span style={{ color: T.muted, fontSize: "10px", whiteSpace: "nowrap" }}>Esc to close</span>
        </div>

        <div style={{ maxHeight: 320, overflowY: "auto", padding: 6 }}>
          {filtered.length === 0 ? (
            <div style={{ padding: "12px 10px", color: T.muted, fontSize: "12px" }}>
              No commands match
            </div>
          ) : (
            filtered.map((cmd, i) => (
              <div
                key={cmd.id}
                ref={el => { itemRefs.current[i] = el; }}
                onMouseEnter={() => setSelected(i)}
                onClick={() => { cmd.action(); onClose(); }}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
                  padding: "9px 10px",
                  background: i === selected ? T.accentWash : "transparent",
                  border: `1px solid ${i === selected ? T.accent : "transparent"}`,
                  borderRadius: 8,
                  transition: "background 0.08s, border-color 0.08s",
                  cursor: "pointer",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                  <span style={{ color: T.text, fontSize: "13px", fontWeight: i === selected ? 600 : 400 }}>{cmd.label}</span>
                  {cmd.hint && (
                    <span style={{ color: T.muted, fontSize: "11px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{cmd.hint}</span>
                  )}
                </div>
                {cmd.shortcut && (
                  <span style={{
                    color: T.muted, fontSize: "10px", flexShrink: 0,
                    border: `1px solid ${T.border}`, borderRadius: 5, padding: "2px 6px",
                  }}>
                    {cmd.shortcut}
                  </span>
                )}
              </div>
            ))
          )}
        </div>

        <div style={{ padding: "8px 16px", borderTop: `1px solid ${T.border}`, display: "flex", flexWrap: "wrap", gap: 16 }}>
          {[["↑↓", "Navigate"], ["Enter", "Run"], ["Esc", "Close"]].map(([key, desc]) => (
            <span key={key} style={{ color: T.muted, fontSize: "10px" }}>
              <span style={{ border: `1px solid ${T.border}`, borderRadius: 4, padding: "1px 5px", marginRight: 5 }}>{key}</span>
              {desc}
            </span>
          ))}
        </div>
      </div>
    </>
  );
}
