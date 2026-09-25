"use client";

import { useEffect, useRef, useState } from "react";
import type { ListQuery } from "@/api/products";
import type { Category } from "@/types/product";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { PAGE_SIZES, SORT_OPTIONS, isFiltered, sortValue, withSortValue } from "@/lib/query";
import { formatCategory } from "@/lib/format";
import { controlClass } from "@/components/ui/Field";

type Props = {
  query: ListQuery;
  categories: Category[];
  onChange: (query: ListQuery) => void;
};

const selectBase = `${controlClass} h-8 w-auto pr-1.5 text-[13px]`;
const activeSelect = "border-accent bg-accent-soft text-ink";

export function ListToolbar({ query, categories, onChange }: Props) {
  const [text, setText] = useState(query.q);
  const debounced = useDebouncedValue(text, 400);
  // Remembers what this input last wrote so URL changes from elsewhere
  // (Back button, Clear search) can flow back in without a feedback loop.
  const ownValue = useRef(query.q);

  useEffect(() => {
    if (debounced === ownValue.current) return;
    ownValue.current = debounced;
    onChange({ ...query, q: debounced, page: 1 });
    // The query object is rebuilt on every URL change; reacting to it here
    // would re-fire the search. This effect only cares about typed input.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced]);

  useEffect(() => {
    if (query.q === ownValue.current) return;
    ownValue.current = query.q;
    setText(query.q);
  }, [query.q]);

  return (
    <div className="flex flex-wrap items-end gap-2">
      <div className="relative min-w-0 grow sm:max-w-xs">
        <label htmlFor="search" className="mb-1 block text-[13px] font-medium text-ink-2">
          Search
        </label>
        <input
          id="search"
          type="search"
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="Title or description"
          className={`${controlClass} h-8 text-[13px] ${query.q ? activeSelect : ""}`}
          autoComplete="off"
        />
      </div>

      <div>
        <label htmlFor="category" className="mb-1 block text-[13px] font-medium text-ink-2">
          Category
        </label>
        <select
          id="category"
          value={query.category}
          onChange={(event) => onChange({ ...query, category: event.target.value, page: 1 })}
          className={`${selectBase} ${query.category ? activeSelect : ""}`}
        >
          <option value="">All categories</option>
          {query.category && !categories.some((item) => item.slug === query.category) ? (
            <option value={query.category}>{formatCategory(query.category)}</option>
          ) : null}
          {categories.map((category) => (
            <option key={category.slug} value={category.slug}>
              {category.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="sort" className="mb-1 block text-[13px] font-medium text-ink-2">
          Sort
        </label>
        <select
          id="sort"
          value={sortValue(query)}
          onChange={(event) => onChange({ ...withSortValue(query, event.target.value), page: 1 })}
          className={`${selectBase} ${query.sortBy ? activeSelect : ""}`}
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="limit" className="mb-1 block text-[13px] font-medium text-ink-2">
          Per page
        </label>
        <select
          id="limit"
          value={query.limit}
          onChange={(event) =>
            onChange({ ...query, limit: Number(event.target.value), page: 1 })
          }
          className={selectBase}
        >
          {PAGE_SIZES.map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>
      </div>

      {isFiltered(query) ? (
        <button
          type="button"
          onClick={() =>
            onChange({ ...query, q: "", category: "", sortBy: null, order: "asc", page: 1 })
          }
          className="h-8 rounded-sm px-2 text-[13px] text-ink-2 underline underline-offset-2 hover:text-ink"
        >
          Reset search, filter and sort
        </button>
      ) : null}
    </div>
  );
}
