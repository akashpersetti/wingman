"use client";

import { RefObject, useCallback, useEffect, useRef } from "react";

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

interface DialogFocusOptions {
  open: boolean;
  onClose: () => void;
  initialFocusRef?: RefObject<HTMLElement>;
}

export function useDialogFocus<T extends HTMLElement>({
  open,
  onClose,
  initialFocusRef,
}: DialogFocusOptions) {
  const dialogRef = useRef<T>(null);
  const onCloseRef = useRef(onClose);
  const initialFocusRefRef = useRef(initialFocusRef);
  const restoreFocusRef = useRef(true);

  onCloseRef.current = onClose;
  initialFocusRefRef.current = initialFocusRef;

  const skipFocusRestore = useCallback(() => {
    restoreFocusRef.current = false;
  }, []);

  useEffect(() => {
    if (!open) return;

    const previouslyFocused = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
    restoreFocusRef.current = true;

    const focusFrame = window.requestAnimationFrame(() => {
      const dialog = dialogRef.current;
      const initialTarget = initialFocusRefRef.current?.current
        ?? dialog?.querySelector<HTMLElement>(FOCUSABLE_SELECTOR)
        ?? dialog;
      initialTarget?.focus();
    });

    function handleDialogKeyDown(event: KeyboardEvent) {
      const dialog = dialogRef.current;
      if (!dialog) return;

      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        onCloseRef.current();
        return;
      }

      if (event.key !== "Tab") return;

      const focusable = Array.from(dialog.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (!first || !last) {
        event.preventDefault();
        dialog.focus();
      } else if (event.shiftKey && (document.activeElement === first || !dialog.contains(document.activeElement))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (document.activeElement === last || !dialog.contains(document.activeElement))) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleDialogKeyDown, true);
    return () => {
      window.cancelAnimationFrame(focusFrame);
      document.removeEventListener("keydown", handleDialogKeyDown, true);
      if (restoreFocusRef.current && previouslyFocused?.isConnected) {
        previouslyFocused.focus();
      }
    };
  }, [open]);

  return { dialogRef, skipFocusRestore };
}
