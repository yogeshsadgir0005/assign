"use client";

import { useEffect, useRef, type ReactNode, type RefObject } from "react";

type Props = {
  labelledBy: string;
  onClose: () => void;
  children: ReactNode;
  dismissOnBackdrop?: boolean;
  initialFocus?: RefObject<HTMLElement | null>;
  width?: string;
};

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function Modal({
  labelledBy,
  onClose,
  children,
  dismissOnBackdrop = false,
  initialFocus,
  width = "max-w-lg",
}: Props) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const panel = panelRef.current;

    const target =
      initialFocus?.current ?? panel?.querySelector<HTMLElement>(FOCUSABLE) ?? panel;
    target?.focus();

    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.stopPropagation();
        onClose();
        return;
      }
      if (event.key !== "Tab" || !panel) return;

      const focusable = [...panel.querySelectorAll<HTMLElement>(FOCUSABLE)];
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;

      if (event.shiftKey && (active === first || active === panel)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown, true);
    return () => {
      document.removeEventListener("keydown", onKeyDown, true);
      document.body.style.overflow = overflow;
      previouslyFocused?.focus();
    };
  }, [onClose, initialFocus]);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink/25 p-4 sm:p-8">
      <button
        type="button"
        aria-hidden
        tabIndex={-1}
        onClick={dismissOnBackdrop ? onClose : undefined}
        className="absolute inset-0 cursor-default"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        tabIndex={-1}
        className={`relative w-full ${width} rounded-sm border border-line-strong bg-surface shadow-[0_8px_28px_-12px_rgba(35,33,29,0.35)]`}
      >
        {children}
      </div>
    </div>
  );
}
