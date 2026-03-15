"use client";

import { useEffect, useRef, useState, useCallback } from "react";

export interface Command {
  id:       string;
  label:    string;
  hint?:    string;
  shortcut?: string;
  action:   () => void;
}

interface Props {
  commands: Command[];
  onClose:  () => void;
}

export default function CommandPalette({ commands, onClose }: Props) {
  const [query,      setQuery]      = useState("");
  const [selected,   setSelected]   = useState(0);
  const [cursorLeft, setCursorLeft] = useState<number | null>(null);
  const [inputFocused, setInputFocused] = useState(false);
  const inputRef   = useRef<HTMLInputElement>(null);
  const mirrorRef  = useRef<HTMLSpanElement>(null);
  const listRef    = useRef<HTMLDivElement>(null);
  const itemRefs   = useRef<(HTMLDivElement | null)[]>([]);

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

  function updateCursor() {
    const el     = inputRef.current;
    const mirror = mirrorRef.current;
    if (!el || !mirror) return;
    const sel      = el.selectionStart ?? query.length;
    mirror.textContent = query.slice(0, sel);
    const mRect  = mirror.getBoundingClientRect();
    const elRect = el.getBoundingClientRect();
    setCursorLeft(mRect.right - elRect.left);
  }

  /* Reset selection when filter changes */
  useEffect(() => { setSelected(0); }, [query]);

  /* Scroll selected item into view */
  useEffect(() => {
    itemRefs.current[selected]?.scrollIntoView({ block: "nearest" });
  }, [selected]);

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown")  { e.preventDefault(); setSelected(s => Math.min(s + 1, filtered.length - 1)); }
    if (e.key === "ArrowUp")    { e.preventDefault(); setSelected(s => Math.max(s - 1, 0)); }
    if (e.key === "Enter")      { e.preventDefault(); filtered[selected]?.action(); onClose(); }
    if (e.key === "Escape")     { e.preventDefault(); e.stopPropagation(); onClose(); }
  }

  const T = {
    bg:      "#1E1E1E",
    border:  "#3C3C3C",
    input:   "#252525",
    text:    "#E8E8E8",
    muted:   "#666666",
    active:  "#2A3F5C",
    blue:    "#5B9BD5",
    teal:    "#4EC9B0",
  };

  return (
    <>
      {/* Backdrop */}
      <div className="cmd-backdrop" onClick={onClose} />

      {/* Palette */}
      <div style={{
        position: "fixed", top: "20%", left: "50%", transform: "translateX(-50%)",
        zIndex: 61, width: 520,
        background: T.bg, border: `1px solid ${T.border}`,
        fontFamily: "'Menlo','Monaco','Courier New',monospace",
        boxShadow: "0 24px 64px rgba(0,0,0,0.6)",
      }}>
        {/* Header */}
        <div style={{ padding: "10px 14px", borderBottom: `1px solid ${T.border}`, display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ color: T.blue, fontSize: "12px" }}>❯</span>
          {/* Block-cursor input */}
          <div style={{ flex: 1, position: "relative" }}>
            {/* Hidden mirror for cursor measurement */}
            <span ref={mirrorRef} aria-hidden style={{
              position: "absolute", visibility: "hidden", whiteSpace: "pre",
              fontFamily: "inherit", fontSize: "13px", pointerEvents: "none",
            }} />
            <input
              ref={inputRef}
              value={query}
              onChange={e => { setQuery(e.target.value); updateCursor(); }}
              onKeyDown={e => { handleKey(e); updateCursor(); }}
              onKeyUp={updateCursor}
              onClick={updateCursor}
              onSelect={updateCursor}
              onFocus={() => { setInputFocused(true); updateCursor(); }}
              onBlur={() => setInputFocused(false)}
              placeholder={inputFocused ? "" : "search commands..."}
              style={{
                width: "100%", background: "transparent", border: "none", outline: "none",
                color: T.text, fontSize: "13px", caretColor: "transparent",
                fontFamily: "inherit",
              }}
            />
            {/* Block cursor */}
            {inputFocused && cursorLeft !== null && (
              <div style={{
                position: "absolute", top: "50%", transform: "translateY(-50%)",
                left: cursorLeft, width: 8, height: "1.1em",
                background: T.text, opacity: 0.85, pointerEvents: "none",
                mixBlendMode: "difference",
              }} />
            )}
          </div>
          <span style={{ color: T.muted, fontSize: "10px" }}>esc to close</span>
        </div>

        {/* Results */}
        <div ref={listRef} style={{ maxHeight: 320, overflowY: "auto" }}>
          {filtered.length === 0 ? (
            <div style={{ padding: "12px 16px", color: T.muted, fontSize: "12px" }}>
              no commands match
            </div>
          ) : (
            filtered.map((cmd, i) => (
              <div
                key={cmd.id}
                ref={el => { itemRefs.current[i] = el; }}
                onMouseEnter={() => setSelected(i)}
                onClick={() => { cmd.action(); onClose(); }}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "9px 16px",
                  background: i === selected ? T.active : "transparent",
                  borderLeft: i === selected ? `2px solid ${T.blue}` : "2px solid transparent",
                  transition: "background 0.08s",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ color: i === selected ? T.blue : T.muted, fontSize: "11px" }}>
                    {i === selected ? "▸" : " "}
                  </span>
                  <span style={{ color: T.text, fontSize: "13px" }}>{cmd.label}</span>
                  {cmd.hint && (
                    <span style={{ color: T.muted, fontSize: "11px" }}>{cmd.hint}</span>
                  )}
                </div>
                {cmd.shortcut && (
                  <span style={{
                    color: T.muted, fontSize: "10px",
                    border: `1px solid #3C3C3C`, padding: "1px 5px",
                  }}>
                    {cmd.shortcut}
                  </span>
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer hint */}
        <div style={{ padding: "7px 16px", borderTop: `1px solid ${T.border}`, display: "flex", gap: 16 }}>
          {[["↑↓", "navigate"], ["↵", "run"], ["esc", "close"]].map(([key, desc]) => (
            <span key={key} style={{ color: T.muted, fontSize: "10px" }}>
              <span style={{ border: `1px solid #3C3C3C`, padding: "0px 4px", marginRight: 4 }}>{key}</span>
              {desc}
            </span>
          ))}
        </div>
      </div>
    </>
  );
}
