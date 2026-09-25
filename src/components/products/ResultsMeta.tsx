import type { ProductPage } from "@/types/product";

type Props = {
  page: ProductPage | null;
  loading: boolean;
  refreshing: boolean;
  hiddenLocally: number;
};

export function ResultsMeta({ page, loading, refreshing, hiddenLocally }: Props) {
  const range =
    page && page.total > 0
      ? `Showing ${page.skip + 1}–${page.skip + page.products.length} of ${page.total}`
      : loading
        ? "Loading the catalogue…"
        : "";

  return (
    <div className="mt-4 flex h-6 items-center justify-between gap-3 text-[13px] text-ink-2">
      <p aria-live="polite" className="num">
        {range}
        {hiddenLocally > 0 ? (
          <span className="text-ink-3"> · {hiddenLocally} hidden by local deletes</span>
        ) : null}
      </p>
      {refreshing ? <span className="text-ink-3">Updating…</span> : null}
    </div>
  );
}
