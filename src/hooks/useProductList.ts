"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { listProducts, type ListQuery } from "@/api/products";
import type { ProductPage } from "@/types/product";
import { ApiError, isCanceled } from "@/lib/api-error";

type State = {
  status: "loading" | "refreshing" | "ready" | "error";
  page: ProductPage | null;
  error: ApiError | null;
};

/**
 * Fetches one page of the list. Two things keep fast typing honest: the
 * previous request is aborted, and every response carries the sequence number
 * it was issued with, so a slow answer that still arrives is dropped instead of
 * overwriting a newer one.
 */
export function useProductList(query: ListQuery) {
  const [state, setState] = useState<State>({ status: "loading", page: null, error: null });
  const [attempt, setAttempt] = useState(0);
  const latestRef = useRef(0);

  const retry = useCallback(() => setAttempt((value) => value + 1), []);

  useEffect(() => {
    const seq = ++latestRef.current;
    const controller = new AbortController();

    setState((previous) => ({
      status: previous.page ? "refreshing" : "loading",
      page: previous.page,
      error: null,
    }));

    listProducts(query, { signal: controller.signal })
      .then((page) => {
        if (seq !== latestRef.current) return;
        setState({ status: "ready", page, error: null });
      })
      .catch((error: ApiError) => {
        if (isCanceled(error) || seq !== latestRef.current) return;
        setState((previous) => ({ status: "error", page: previous.page, error }));
      });

    return () => controller.abort();
  }, [query, attempt]);

  return { ...state, retry };
}
