"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { ListQuery, SortField } from "@/api/products";
import type { Product } from "@/types/product";
import { useProductList } from "@/hooks/useProductList";
import { useCategories } from "@/hooks/useCategories";
import { mergePage, useOverrides } from "@/lib/overrides";
import { parseListQuery, serializeListQuery } from "@/lib/query";
import { setArtificialDelay } from "@/lib/http";
import { Button } from "@/components/ui/Button";
import { Toast, type ToastMessage } from "@/components/ui/Toast";
import { ListToolbar } from "./ListToolbar";
import { ProductTable } from "./ProductTable";
import { ProductCards } from "./ProductCards";
import { Pagination } from "./Pagination";
import { EmptyState, ErrorState, TableSkeleton } from "./ListStates";
import { LocalChangesBanner } from "./LocalChangesBanner";
import { SearchFilterNotice } from "./SearchFilterNotice";
import { ResultsMeta } from "./ResultsMeta";
import { ProductFormDialog } from "./ProductFormDialog";
import { DeleteDialog } from "./DeleteDialog";

type Dialog = { kind: "create" } | { kind: "edit"; product: Product } | null;

export function ProductsScreen() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = searchParams.toString();

  const { query, canonical } = useMemo(
    () => parseListQuery(new URLSearchParams(search)),
    [search],
  );

  const delay = searchParams.get("delay");
  setArtificialDelay(Number(delay));

  const keepDelay = useCallback(
    (target: string) => {
      if (!delay) return target;
      const params = new URLSearchParams(target.startsWith("?") ? target.slice(1) : target);
      params.set("delay", delay);
      return `?${params.toString()}`;
    },
    [delay],
  );

  const { status, page, error, retry } = useProductList(query);
  const categories = useCategories();
  const overrides = useOverrides();

  const [dialog, setDialog] = useState<Dialog>(null);
  const [pendingDelete, setPendingDelete] = useState<Product | null>(null);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  const navigate = useCallback(
    (next: ListQuery, replace: boolean) => {
      const href = `${pathname}${keepDelay(serializeListQuery(next))}`;
      if (replace) router.replace(href, { scroll: false });
      else router.push(href, { scroll: false });
    },
    [pathname, router, keepDelay],
  );

  useEffect(() => {
    const target = keepDelay(canonical);
    const current = search ? `?${search}` : "";
    if (target !== current) router.replace(`${pathname}${target}`, { scroll: false });
  }, [canonical, search, pathname, router, keepDelay]);

  const totalPages = page ? Math.max(1, Math.ceil(page.total / query.limit)) : 1;

  useEffect(() => {
    if (status === "ready" && page && query.page > totalPages) {
      navigate({ ...query, page: totalPages }, true);
    }
  }, [status, page, query, totalPages, navigate]);

  const applyQuery = useCallback(
    (next: ListQuery) => {
      const onlyTyping =
        next.q !== query.q &&
        next.category === query.category &&
        next.sortBy === query.sortBy &&
        next.limit === query.limit;
      navigate(next, onlyTyping);
    },
    [query, navigate],
  );

  const onSort = (field: SortField) => {
    const sameField = query.sortBy === field;
    applyQuery({
      ...query,
      sortBy: field,
      order: sameField && query.order === "asc" ? "desc" : "asc",
      page: 1,
    });
  };

  const rows = useMemo(
    () =>
      page
        ? mergePage(page.products, overrides, {
            includeCreated: query.page === 1,
            q: query.q,
            category: query.category,
          })
        : [],
    [page, overrides, query.page, query.q, query.category],
  );

  const listSearch = keepDelay(canonical);
  const changedIds = useMemo(() => Object.keys(overrides.updated).map(Number), [overrides.updated]);
  const hiddenHere = page
    ? page.products.filter((product) => overrides.deleted.includes(product.id)).length
    : 0;

  const showSkeleton = status === "loading" && !page;
  const showError = status === "error" && !page;
  const showEmpty = Boolean(page) && rows.length === 0 && status !== "error";

  function afterWrite(text: string) {
    setDialog(null);
    setPendingDelete(null);
    setToast({ id: Date.now(), text });
  }

  return (
    <main className="px-4 py-5 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-base font-semibold text-ink">Products</h1>
        <Button variant="primary" size="sm" onClick={() => setDialog({ kind: "create" })}>
          Add product
        </Button>
      </div>

      <div className="mt-4 space-y-3">
        <LocalChangesBanner overrides={overrides} />

        <ListToolbar query={query} categories={categories} onChange={applyQuery} />

        {query.q && query.category ? (
          <SearchFilterNotice
            category={query.category}
            onClearSearch={() => applyQuery({ ...query, q: "", page: 1 })}
            onDropFilter={() => applyQuery({ ...query, category: "", page: 1 })}
          />
        ) : null}
      </div>

      <ResultsMeta
        page={page}
        loading={showSkeleton}
        refreshing={status === "refreshing"}
        hiddenLocally={hiddenHere}
      />

      {status === "error" && page ? (
        <p className="mt-1 mb-2 flex items-center gap-2 border-l-2 border-danger bg-danger-soft py-2 pr-3 pl-2.5 text-[13px] text-ink">
          Couldn&apos;t load that page: {error?.message}
          <button type="button" onClick={retry} className="underline underline-offset-2">
            Retry
          </button>
        </p>
      ) : null}

      {/* No overflow-hidden here: it would trap the table's sticky header. */}
      <div className="mt-1 rounded-sm border border-line bg-surface">
        {showSkeleton ? (
          <TableSkeleton rows={query.limit} />
        ) : showError && error ? (
          <ErrorState error={error} onRetry={retry} />
        ) : showEmpty ? (
          <EmptyState
            q={query.q}
            category={query.category}
            onClearSearch={() => applyQuery({ ...query, q: "", page: 1 })}
            onClearFilters={() =>
              applyQuery({ ...query, q: "", category: "", sortBy: null, order: "asc", page: 1 })
            }
          />
        ) : (
          <>
            <div className="hidden md:block">
              <ProductTable
                products={rows}
                query={query}
                listSearch={listSearch}
                busy={status === "refreshing"}
                changedIds={changedIds}
                onSort={onSort}
                onEdit={(product) => setDialog({ kind: "edit", product })}
                onDelete={setPendingDelete}
              />
            </div>
            <div className="md:hidden">
              <ProductCards
                products={rows}
                listSearch={listSearch}
                busy={status === "refreshing"}
                changedIds={changedIds}
                onEdit={(product) => setDialog({ kind: "edit", product })}
                onDelete={setPendingDelete}
              />
            </div>
          </>
        )}
      </div>

      <div className="mt-3 flex min-h-8 justify-end">
        <Pagination
          page={query.page}
          totalPages={totalPages}
          onChange={(next) => applyQuery({ ...query, page: next })}
        />
      </div>

      {dialog ? (
        <ProductFormDialog
          product={dialog.kind === "edit" ? dialog.product : null}
          categories={categories}
          onClose={() => setDialog(null)}
          onSaved={(product, mode) =>
            afterWrite(
              mode === "created"
                ? `Added “${product.title}”. It sits at the top of page 1 until you clear local changes.`
                : `Saved “${product.title}” locally.`,
            )
          }
        />
      ) : null}

      {pendingDelete ? (
        <DeleteDialog
          product={pendingDelete}
          onClose={() => setPendingDelete(null)}
          onDeleted={(product) => afterWrite(`Removed “${product.title}” from this session.`)}
        />
      ) : null}

      {toast ? <Toast message={toast} onDismiss={() => setToast(null)} /> : null}
    </main>
  );
}
