import type { ListQuery, SortField, SortOrder } from "@/api/products";

export const PAGE_SIZES = [10, 20, 50] as const;
export const DEFAULT_LIMIT = 20;

export const SORT_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "Default order" },
  { value: "price-asc", label: "Price, low to high" },
  { value: "price-desc", label: "Price, high to low" },
  { value: "rating-desc", label: "Rating, high to low" },
  { value: "rating-asc", label: "Rating, low to high" },
  { value: "title-asc", label: "Title, A to Z" },
  { value: "title-desc", label: "Title, Z to A" },
];

const SORT_FIELDS: SortField[] = ["title", "price", "rating"];

export const EMPTY_QUERY: ListQuery = {
  page: 1,
  limit: DEFAULT_LIMIT,
  q: "",
  category: "",
  sortBy: null,
  order: "asc",
};

/**
 * Nonsense in the URL is corrected rather than rejected: ?page=abc reads as
 * page 1, ?limit=17 falls back to the default. The caller replaces the URL with
 * `canonical` so the address bar matches what is on screen without adding a
 * history entry.
 */
export function parseListQuery(search: URLSearchParams): {
  query: ListQuery;
  canonical: string;
} {
  const pageRaw = Number(search.get("page"));
  const page = Number.isInteger(pageRaw) && pageRaw >= 1 ? pageRaw : 1;

  const limitRaw = Number(search.get("limit"));
  const limit = (PAGE_SIZES as readonly number[]).includes(limitRaw) ? limitRaw : DEFAULT_LIMIT;

  const q = (search.get("q") ?? "").trim();
  const category = (search.get("category") ?? "").trim();

  const [fieldRaw, orderRaw] = (search.get("sort") ?? "").split("-");
  const sortBy = SORT_FIELDS.includes(fieldRaw as SortField) ? (fieldRaw as SortField) : null;
  const order: SortOrder = orderRaw === "desc" ? "desc" : "asc";

  const query: ListQuery = { page, limit, q, category, sortBy, order };
  return { query, canonical: serializeListQuery(query) };
}

export function serializeListQuery(query: ListQuery): string {
  const params = new URLSearchParams();
  if (query.q) params.set("q", query.q);
  if (query.category) params.set("category", query.category);
  if (query.sortBy) params.set("sort", `${query.sortBy}-${query.order}`);
  if (query.limit !== DEFAULT_LIMIT) params.set("limit", String(query.limit));
  if (query.page > 1) params.set("page", String(query.page));
  const search = params.toString();
  return search ? `?${search}` : "";
}

export function sortValue(query: ListQuery) {
  return query.sortBy ? `${query.sortBy}-${query.order}` : "";
}

export function withSortValue(query: ListQuery, value: string): ListQuery {
  const [field, order] = value.split("-");
  return {
    ...query,
    sortBy: SORT_FIELDS.includes(field as SortField) ? (field as SortField) : null,
    order: order === "desc" ? "desc" : "asc",
  };
}

export function isFiltered(query: ListQuery) {
  return Boolean(query.q || query.category || query.sortBy);
}
