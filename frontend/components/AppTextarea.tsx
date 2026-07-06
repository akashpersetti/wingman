"use client";

import { forwardRef } from "react";

interface Props {
  value: string;
  onChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onKeyDown?: (event: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  disabled?: boolean;
  placeholder?: string;
  rows?: number;
  style?: React.CSSProperties;
  ariaLabel?: string;
}

const AppTextarea = forwardRef<HTMLTextAreaElement, Props>(
  ({ value, onChange, onKeyDown, disabled, placeholder, rows = 2, style, ariaLabel }, ref) => (
    <textarea
      ref={ref}
      value={value}
      onChange={onChange}
      onKeyDown={onKeyDown}
      disabled={disabled}
      placeholder={placeholder}
      rows={rows}
      aria-label={ariaLabel}
      style={{
        width: "100%",
        minWidth: 0,
        padding: 0,
        margin: 0,
        border: 0,
        resize: "none",
        background: "transparent",
        color: disabled ? "#94a3b8" : "#0f172a",
        fontFamily: "inherit",
        fontSize: "14px",
        lineHeight: 1.55,
        ...style,
      }}
    />
  )
);

AppTextarea.displayName = "AppTextarea";
export default AppTextarea;
