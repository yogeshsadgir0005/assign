import type { ReactNode } from "react";

export const controlClass =
  "w-full rounded-sm border border-line-strong bg-surface px-2.5 text-sm text-ink " +
  "placeholder:text-ink-3 focus:border-accent aria-[invalid=true]:border-danger";

type Props = {
  id: string;
  label: string;
  error?: string | null;
  hint?: string;
  required?: boolean;
  children: ReactNode;
};

export function Field({ id, label, error, hint, required, children }: Props) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-[13px] font-medium text-ink-2">
        {label}
        {required ? <span className="text-ink-3"> (required)</span> : null}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} role="alert" className="mt-1 text-[13px] text-danger">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="mt-1 text-[13px] text-ink-3">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
