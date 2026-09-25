"use client";

import { countOverrides, resetOverrides, type Overrides } from "@/lib/overrides";

function summarise(overrides: Overrides) {
  const parts: string[] = [];
  if (overrides.created.length) parts.push(`${overrides.created.length} added`);
  const edited = Object.keys(overrides.updated).length;
  if (edited) parts.push(`${edited} edited`);
  if (overrides.deleted.length) parts.push(`${overrides.deleted.length} deleted`);
  return parts.join(", ");
}

export function LocalChangesBanner({ overrides }: { overrides: Overrides }) {
  if (countOverrides(overrides) === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 border-l-2 border-warn bg-warn-soft py-2 pr-3 pl-2.5 text-[13px] text-ink-2">
      <span>
        <span className="font-medium text-ink">{summarise(overrides)}</span> in this session.
        DummyJSON accepts writes but never stores them, so these rows are merged in locally.
      </span>
      <button
        type="button"
        onClick={resetOverrides}
        className="underline underline-offset-2 hover:text-ink"
      >
        Clear local changes
      </button>
    </div>
  );
}
