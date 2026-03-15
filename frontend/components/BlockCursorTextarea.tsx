"use client";

import { forwardRef, useImperativeHandle, useRef, useState } from "react";

interface Props {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  disabled?: boolean;
  placeholder?: string;
  rows?: number;
  style?: React.CSSProperties;
}

/* Shared text-layout CSS that must be identical between the
   hidden mirror div and the real textarea so positions match. */
const TEXT_CSS: React.CSSProperties = {
  fontFamily: "'Menlo', 'Monaco', 'Courier New', monospace",
  fontSize:   "13px",
  lineHeight: "1.55",
  padding:    0,
  margin:     0,
  border:     "none",
  outline:    "none",
  resize:     "none",
  whiteSpace: "pre-wrap",
  wordBreak:  "break-word",
  overflowWrap: "break-word",
  tabSize:    2,
};

const BlockCursorTextarea = forwardRef<HTMLTextAreaElement, Props>(
  ({ value, onChange, onKeyDown, disabled, placeholder, rows = 2, style }, ref) => {
    const innerRef  = useRef<HTMLTextAreaElement>(null);
    const mirrorRef = useRef<HTMLDivElement>(null);
    useImperativeHandle(ref, () => innerRef.current!);

    const [cursorStyle, setCursorStyle] = useState<React.CSSProperties | null>(null);
    const [focused, setFocused] = useState(false);

    function updateCursor() {
      const ta     = innerRef.current;
      const mirror = mirrorRef.current;
      if (!ta || !mirror) return;

      const sel = ta.selectionStart ?? value.length;
      /* Mirror must match textarea's client width */
      mirror.style.width = ta.clientWidth + "px";

      /* Build: text-before-cursor + zero-width marker span */
      mirror.innerHTML = "";
      const pre = document.createTextNode(value.slice(0, sel));
      mirror.appendChild(pre);
      const marker = document.createElement("span");
      marker.textContent = "\u200b";
      mirror.appendChild(marker);

      const mRect  = marker.getBoundingClientRect();
      const taRect = ta.getBoundingClientRect();

      setCursorStyle({
        top:  mRect.top  - taRect.top  + ta.scrollTop,
        left: mRect.left - taRect.left,
      });
    }

    function handleFocus(e: React.FocusEvent<HTMLTextAreaElement>) {
      setFocused(true);
      updateCursor();
    }

    return (
      <div style={{ position: "relative", flex: 1, ...style }}>
        {/* Hidden mirror div — same layout as textarea */}
        <div
          ref={mirrorRef}
          aria-hidden
          style={{
            ...TEXT_CSS,
            position:   "absolute",
            top: 0, left: 0,
            visibility: "hidden",
            height:     "auto",
            overflow:   "hidden",
            pointerEvents: "none",
          }}
        />

        {/* Real textarea — transparent caret */}
        <textarea
          ref={innerRef}
          value={value}
          onChange={e => { onChange(e); updateCursor(); }}
          onKeyDown={onKeyDown}
          onKeyUp={updateCursor}
          onClick={updateCursor}
          onSelect={updateCursor}
          onFocus={handleFocus}
          onBlur={() => { setFocused(false); setCursorStyle(null); }}
          disabled={disabled}
          placeholder={placeholder}
          rows={rows}
          style={{
            ...TEXT_CSS,
            caretColor: "transparent",
            color:      disabled ? "rgba(232,232,232,0.35)" : (style?.color ?? "#E8E8E8"),
            background: "transparent",
            display:    "block",
            width:      "100%",
          }}
        />

        {/* Block cursor overlay */}
        {focused && cursorStyle && (
          <div
            className="block-cursor-overlay"
            style={{ top: cursorStyle.top, left: cursorStyle.left }}
          />
        )}
      </div>
    );
  }
);

BlockCursorTextarea.displayName = "BlockCursorTextarea";
export default BlockCursorTextarea;
