"use client";

import type { ApiError } from "@/lib/api-error";
import { Button } from "@/components/ui/Button";
import { formatCategory } from "@/lib/format";

/** Skeleton rows mirror the real row height so nothing shifts when data lands. */
export function TableSkeleton({ rows }: { rows: number }) {
  return (
    <div aria-hidden className="divide-y divide-line">
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="flex h-11 items-center gap-3 px-3">
          <div className="h-7 w-7 shrink-0 bg-sunken" />
          <div className="h-2.5 w-[28%] bg-sunken" />
          <div className="ml-auto h-2.5 w-14 bg-sunken" />
          <div className="h-2.5 w-10 bg-sunken" />
          <div className="h-2.5 w-10 bg-sunken" />
        </div>
      ))}
    </div>
  );
}

type ErrorProps = { error: ApiError; onRetry: () => void };

function errorCopy(error: ApiError) {
  switch (error.kind) {
    case "offline":
      return {
        title: "Can't reach the API",
        body: "The request never left the building. Check your connection and try again.",
      };
    case "timeout":
      return {
        title: "The API timed out",
        body: "dummyjson.com took longer than 20 seconds to answer.",
      };
    case "server":
      return {
        title: `The API returned ${error.status}`,
        body: "That's a fault on their side. Trying again usually clears it.",
      };
    case "not-found":
      return { title: "Nothing at that address", body: error.message };
    default:
      return { title: "The request was rejected", body: error.message };
  }
}

export function ErrorState({ error, onRetry }: ErrorProps) {
  const copy = errorCopy(error);
  return (
    <div className="px-4 py-10 text-center">
      <p className="text-sm font-semibold text-ink">{copy.title}</p>
      <p className="mx-auto mt-1 max-w-md text-[13px] text-ink-2">{copy.body}</p>
      {error.retryable ? (
        <Button className="mt-3" onClick={onRetry}>
          Retry
        </Button>
      ) : null}
    </div>
  );
}

type EmptyProps = {
  q: string;
  category: string;
  onClearSearch: () => void;
  onClearFilters: () => void;
};

export function EmptyState({ q, category, onClearSearch, onClearFilters }: EmptyProps) {
  const where = category ? ` in ${formatCategory(category)}` : "";
  const message = q
    ? `No products match “${q}”${where}.`
    : category
      ? `${formatCategory(category)} has no products right now.`
      : "The catalogue came back empty.";

  return (
    <div className="px-4 py-10 text-center">
      <p className="text-sm text-ink">{message}</p>
      <div className="mt-3 flex justify-center gap-2">
        {q ? <Button onClick={onClearSearch}>Clear search</Button> : null}
        {category ? <Button onClick={onClearFilters}>Clear all filters</Button> : null}
      </div>
    </div>
  );
}
