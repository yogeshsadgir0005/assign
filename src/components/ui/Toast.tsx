"use client";

import { useEffect } from "react";

export type ToastMessage = { id: number; text: string };

export function Toast({ message, onDismiss }: { message: ToastMessage; onDismiss: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 6000);
    return () => clearTimeout(timer);
  }, [message.id, onDismiss]);

  return (
    <div
      role="status"
      className="fixed right-4 bottom-4 z-40 flex max-w-sm items-start gap-3 rounded-sm border border-line-strong bg-surface px-3 py-2 text-[13px] text-ink shadow-[0_6px_20px_-10px_rgba(35,33,29,0.4)]"
    >
      <span>{message.text}</span>
      <button
        type="button"
        onClick={onDismiss}
        className="-mr-1 shrink-0 px-1 text-ink-3 hover:text-ink"
      >
        Dismiss
      </button>
    </div>
  );
}
