"use client";

import { useCallback, useEffect, useState } from "react";
import { listProducts, type ListQuery } from "@/api/products";
import type { ProductPage } from "@/types/product";
import { ApiError, isCanceled } from "@/lib/api-error";
import { serializeListQuery } from "@/lib/query";

type Result = {
  key: string;
  page: ProductPage | null;
  error: ApiError | null;
};

const NOTHING_YET: Result = { key: "", page: null, error: null };

/**
 * Fetches one page of the list. Three things keep fast typing honest: the
 * previous request is aborted, its cleanup marks the in-flight call stale so a
 * response that lost the race is dropped, and the stored result carries the key
 * it was fetched for. Status is derived by comparing that key with the current
 * one, so nothing has to be flipped to "loading" by hand.
 */
export function useProductList(query: ListQuery) {
  const [result, setResult] = useState<Result>(NOTHING_YET);
  const [attempt, setAttempt] = useState(0);

  const key = `${serializeListQuery(query)}#${attempt}`;

  const retry = useCallback(() => setAttempt((value) => value + 1), []);

  useEffect(() => {
    const controller = new AbortController();
    let current = true;

    listProducts(query, { signal: controller.signal })
      .then((page) => {
        if (!current) return;
        setResult({ key, page, error: null });
      })
      .catch((error: ApiError) => {
        if (!current || isCanceled(error)) return;
        setResult((previous) => ({ key, page: previous.page, error }));
      });

    return () => {
      current = false;
      controller.abort();
    };
    // `key` is the serialized form of `query`; re-running on the object identity
    // would refetch on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const settled = result.key === key;
  const status: "loading" | "refreshing" | "ready" | "error" = settled
    ? result.error
      ? "error"
      : "ready"
    : result.page
      ? "refreshing"
      : "loading";

  return { status, page: result.page, error: result.error, retry };
}
