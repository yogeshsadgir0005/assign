"use client";

import { Button } from "@/components/ui/Button";

type Props = {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
};

/** 1 … 4 5 6 … 20 — never every page number. */
export function pageWindow(current: number, total: number): (number | "gap")[] {
  if (total <= 7) return Array.from({ length: total }, (_, index) => index + 1);

  const pages = new Set([1, total, current, current - 1, current + 1]);
  if (current <= 3) [2, 3, 4].forEach((page) => pages.add(page));
  if (current >= total - 2) [total - 3, total - 2, total - 1].forEach((page) => pages.add(page));

  const sorted = [...pages].filter((page) => page >= 1 && page <= total).sort((a, b) => a - b);

  const withGaps: (number | "gap")[] = [];
  sorted.forEach((page, index) => {
    if (index > 0 && page - sorted[index - 1] > 1) withGaps.push("gap");
    withGaps.push(page);
  });
  return withGaps;
}

export function Pagination({ page, totalPages, onChange }: Props) {
  if (totalPages <= 1) return null;

  return (
    <nav aria-label="Pagination" className="flex items-center gap-1">
      <Button size="sm" onClick={() => onChange(page - 1)} disabled={page <= 1}>
        Previous
      </Button>

      <ul className="flex items-center gap-1">
        {pageWindow(page, totalPages).map((entry, index) =>
          entry === "gap" ? (
            <li key={`gap-${index}`} aria-hidden className="px-1 text-[13px] text-ink-3">
              …
            </li>
          ) : (
            <li key={entry}>
              <button
                type="button"
                onClick={() => onChange(entry)}
                aria-current={entry === page ? "page" : undefined}
                className={`num h-7 min-w-7 rounded-sm border px-1.5 text-[13px] ${
                  entry === page
                    ? "border-accent bg-accent-soft font-medium text-accent"
                    : "border-transparent text-ink-2 hover:border-line-strong hover:bg-surface"
                }`}
              >
                {entry}
              </button>
            </li>
          ),
        )}
      </ul>

      <Button size="sm" onClick={() => onChange(page + 1)} disabled={page >= totalPages}>
        Next
      </Button>
    </nav>
  );
}
