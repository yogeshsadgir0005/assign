"use client";

import { formatCategory } from "@/lib/format";

type Props = {
  category: string;
  onClearSearch: () => void;
  onDropFilter: () => void;
};

/**
 * DummyJSON can search or filter by category, never both. Saying so beats
 * dropping one of them behind the user's back.
 */
export function SearchFilterNotice({ category, onClearSearch, onDropFilter }: Props) {
  return (
    <p className="border-l-2 border-line-strong bg-sunken py-2 pr-3 pl-2.5 text-[13px] text-ink-2">
      Searching the whole catalogue. DummyJSON has no endpoint that searches inside a category, so
      the {formatCategory(category)} filter is paused until the search is cleared.{" "}
      <button
        type="button"
        onClick={onClearSearch}
        className="underline underline-offset-2 hover:text-ink"
      >
        Clear search
      </button>{" "}
      ·{" "}
      <button
        type="button"
        onClick={onDropFilter}
        className="underline underline-offset-2 hover:text-ink"
      >
        Drop the filter
      </button>
    </p>
  );
}
