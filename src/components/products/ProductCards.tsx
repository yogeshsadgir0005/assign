"use client";

import Link from "next/link";
import { Thumb } from "./Thumb";
import type { Product } from "@/types/product";
import { formatCategory, formatPrice, formatRating } from "@/lib/format";
import { isLocalId } from "@/lib/overrides";
import { LocalTag, StockValue } from "./ProductTable";

type Props = {
  products: Product[];
  listSearch: string;
  busy: boolean;
  changedIds: number[];
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
};

export function ProductCards({ products, listSearch, busy, changedIds, onEdit, onDelete }: Props) {
  return (
    <ul className={`divide-y divide-line ${busy ? "opacity-55" : ""}`}>
      {products.map((product) => {
        const changed = changedIds.includes(product.id) || isLocalId(product.id);
        return (
          <li key={product.id} className="relative p-3">
            <div className="flex gap-3">
              <Thumb src={product.thumbnail} title={product.title} size={52} />
              <div className="min-w-0 flex-1">
                {/* The whole card opens the product; the buttons sit above it. */}
                <Link href={`/products/${product.id}${listSearch}`} className="font-medium text-ink">
                  <span className="absolute inset-0" aria-hidden />
                  {product.title}
                </Link>
                {changed ? <LocalTag /> : null}
                <p className="mt-0.5 text-[13px] text-ink-3">
                  {formatCategory(product.category)}
                  {product.brand ? ` · ${product.brand}` : ""}
                </p>
                <p className="num mt-1 text-[13px] text-ink-2">
                  <span className="font-medium text-ink">{formatPrice(product.price)}</span>
                  <span className="mx-2 text-line-strong">|</span>
                  {formatRating(product.rating)} rating
                  <span className="mx-2 text-line-strong">|</span>
                  <StockValue stock={product.stock} /> in stock
                </p>
              </div>
            </div>

            <div className="relative z-10 mt-2 flex justify-end gap-1">
              <button
                type="button"
                onClick={() => onEdit(product)}
                className="h-9 rounded-sm border border-line-strong bg-surface px-3 text-[13px] text-ink"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={() => onDelete(product)}
                className="h-9 rounded-sm border border-line-strong bg-surface px-3 text-[13px] text-danger"
              >
                Delete
              </button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
