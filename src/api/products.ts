import { http } from "@/lib/http";
import type { Category, Product, ProductDraft, ProductPage } from "@/types/product";

export type SortField = "title" | "price" | "rating";
export type SortOrder = "asc" | "desc";

export type ListQuery = {
  page: number;
  limit: number;
  q: string;
  category: string;
  sortBy: SortField | null;
  order: SortOrder;
};

type RequestOptions = { signal?: AbortSignal };

const LIST_FIELDS = "id,title,category,price,rating,stock,thumbnail,brand";

/**
 * DummyJSON exposes search and category as separate endpoints — there is no
 * endpoint that applies both. Search wins when a query is present; the UI says
 * so rather than dropping the category silently.
 */
export function listProducts(query: ListQuery, options: RequestOptions = {}) {
  const params: Record<string, string | number> = {
    limit: query.limit,
    skip: (query.page - 1) * query.limit,
    select: LIST_FIELDS,
  };

  if (query.sortBy) {
    params.sortBy = query.sortBy;
    params.order = query.order;
  }

  if (query.q) {
    params.q = query.q;
    return get("/products/search", params, options);
  }

  if (query.category) {
    return get(`/products/category/${encodeURIComponent(query.category)}`, params, options);
  }

  return get("/products", params, options);
}

async function get(url: string, params: Record<string, string | number>, options: RequestOptions) {
  const { data } = await http.get<ProductPage>(url, { params, signal: options.signal });
  return data;
}

export async function fetchCategories(options: RequestOptions = {}) {
  const { data } = await http.get<Category[]>("/products/categories", { signal: options.signal });
  return data;
}

export async function fetchProduct(id: number, options: RequestOptions = {}) {
  const { data } = await http.get<Product>(`/products/${id}`, { signal: options.signal });
  return data;
}

export async function createProduct(draft: ProductDraft) {
  const { data } = await http.post<Product>("/products/add", draft);
  return data;
}

export async function updateProduct(id: number, draft: ProductDraft) {
  const { data } = await http.put<Product>(`/products/${id}`, draft);
  return data;
}

export async function deleteProduct(id: number) {
  const { data } = await http.delete<Product & { isDeleted: boolean }>(`/products/${id}`);
  return data;
}
