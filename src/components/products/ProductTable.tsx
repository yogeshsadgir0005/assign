"use client";

import Link from "next/link";
import { Thumb } from "./Thumb";
import type { ListQuery, SortField } from "@/api/products";
import type { Product } from "@/types/product";
import { formatCategory, formatPrice, formatRating } from "@/lib/format";
import { isLocalId } from "@/lib/overrides";

type Props = {
  products: Product[];
  query: ListQuery;
  listSearch: string;
  busy: boolean;
  changedIds: number[];
  onSort: (field: SortField) => void;
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
};

export function StockValue({ stock }: { stock: number }) {
  const tone = stock === 0 ? "text-danger" : stock <= 10 ? "text-warn" : "text-ink-2";
  return <span className={`num ${tone}`}>{stock}</span>;
}

export function LocalTag({ label = "Local" }: { label?: string }) {
  return (
    <span className="ml-1.5 border border-line-strong bg-sunken px-1 align-middle text-[10px] font-medium tracking-wide text-ink-2 uppercase">
      {label}
    </span>
  );
}

function SortableHeader({
  field,
  label,
  query,
  onSort,
  className = "",
}: {
  field: SortField;
  label: string;
  query: ListQuery;
  onSort: (field: SortField) => void;
  className?: string;
}) {
  const active = query.sortBy === field;
  const direction = active ? (query.order === "asc" ? "↑" : "↓") : "";

  return (
    <th scope="col" className={className} aria-sort={active ? (query.order === "asc" ? "ascending" : "descending") : "none"}>
      <button
        type="button"
        onClick={() => onSort(field)}
        className={`inline-flex items-center gap-1 py-2 hover:text-ink ${active ? "text-accent" : ""}`}
      >
        {label}
        <span aria-hidden className="w-2 text-[11px]">
          {direction}
        </span>
      </button>
    </th>
  );
}

export function ProductTable({
  products,
  query,
  listSearch,
  busy,
  changedIds,
  onSort,
  onEdit,
  onDelete,
}: Props) {
  return (
    <table className="w-full border-collapse text-sm">
      <thead className="sticky top-12 z-10 bg-surface text-left text-[12px] font-medium tracking-wide text-ink-3 uppercase">
        <tr className="border-b border-line-strong">
          <th scope="col" className="w-16 px-3 py-2 text-right">
            Id
          </th>
          <SortableHeader field="title" label="Product" query={query} onSort={onSort} className="px-3" />
          <th scope="col" className="hidden w-40 px-3 py-2 lg:table-cell">
            Category
          </th>
          <SortableHeader
            field="price"
            label="Price"
            query={query}
            onSort={onSort}
            className="w-28 px-3 text-right [&>button]:flex-row-reverse [&>button]:justify-start"
          />
          <SortableHeader
            field="rating"
            label="Rating"
            query={query}
            onSort={onSort}
            className="w-24 px-3 text-right [&>button]:flex-row-reverse [&>button]:justify-start"
          />
          <th scope="col" className="w-20 px-3 py-2 text-right">
            Stock
          </th>
          <th scope="col" className="w-28 px-3 py-2 text-right">
            <span className="sr-only">Actions</span>
          </th>
        </tr>
      </thead>

      <tbody className={busy ? "opacity-55" : ""}>
        {products.map((product) => {
          const changed = changedIds.includes(product.id) || isLocalId(product.id);
          return (
            <tr key={product.id} className="border-b border-line last:border-0 hover:bg-sunken">
              <td className="num px-3 py-1.5 text-right font-mono text-[13px] text-ink-3">
                {isLocalId(product.id) ? "new" : product.id}
              </td>

              <td className="px-3 py-1.5">
                <div className="flex items-center gap-2.5">
                  <Thumb src={product.thumbnail} title={product.title} size={28} />
                  <div className="min-w-0">
                    <Link
                      href={`/products/${product.id}${listSearch}`}
                      title={product.title}
                      className="clamp-2 font-medium text-ink hover:text-accent hover:underline"
                    >
                      {product.title}
                    </Link>
                    {product.brand ? (
                      <span className="text-[12px] text-ink-3">{product.brand}</span>
                    ) : null}
                    {changed ? <LocalTag /> : null}
                  </div>
                </div>
              </td>

              <td className="hidden px-3 py-1.5 text-[13px] text-ink-2 lg:table-cell">
                {formatCategory(product.category)}
              </td>
              <td className="num px-3 py-1.5 text-right">{formatPrice(product.price)}</td>
              <td className="num px-3 py-1.5 text-right text-ink-2">{formatRating(product.rating)}</td>
              <td className="px-3 py-1.5 text-right">
                <StockValue stock={product.stock} />
              </td>

              <td className="px-3 py-1.5 text-right whitespace-nowrap">
                <button
                  type="button"
                  onClick={() => onEdit(product)}
                  className="rounded-xs px-1.5 py-1 text-[13px] text-ink-2 hover:bg-surface hover:text-accent hover:underline"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(product)}
                  className="rounded-xs px-1.5 py-1 text-[13px] text-ink-2 hover:bg-surface hover:text-danger hover:underline"
                >
                  Delete
                </button>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
