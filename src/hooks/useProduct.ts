"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchProduct } from "@/api/products";
import type { Product } from "@/types/product";
import { ApiError, isCanceled } from "@/lib/api-error";
import { findLocalProduct, isLocalId, useOverrides } from "@/lib/overrides";

type State = {
  status: "loading" | "ready" | "error";
  product: Product | null;
  error: ApiError | null;
};

const NOT_A_PRODUCT = new ApiError("not-found", "That product id isn't a number.", 404);
const LOCAL_GONE = new ApiError("not-found", "This locally added product was removed.", 404);

export function useProduct(id: number) {
  const overrides = useOverrides();
  const [state, setState] = useState<State>({ status: "loading", product: null, error: null });
  const [attempt, setAttempt] = useState(0);

  const retry = useCallback(() => setAttempt((value) => value + 1), []);

  const valid = Number.isInteger(id) && id >= 1;
  const local = valid && isLocalId(id);

  useEffect(() => {
    // Products added in this session exist only locally — the API would 404.
    if (!valid || local) return;

    const controller = new AbortController();
    setState({ status: "loading", product: null, error: null });

    fetchProduct(id, { signal: controller.signal })
      .then((product) => setState({ status: "ready", product, error: null }))
      .catch((error: ApiError) => {
        if (isCanceled(error)) return;
        setState({ status: "error", product: null, error });
      });

    return () => controller.abort();
  }, [id, attempt, valid, local]);

  if (!valid) {
    return { status: "error" as const, product: null, error: NOT_A_PRODUCT, deleted: false, edited: false, retry };
  }

  if (local) {
    const found = findLocalProduct(overrides, id);
    return {
      status: found ? ("ready" as const) : ("error" as const),
      product: found,
      error: found ? null : LOCAL_GONE,
      deleted: !found,
      edited: true,
      retry,
    };
  }

  const edited = overrides.updated[id];
  return {
    ...state,
    product: state.product && edited ? { ...state.product, ...edited } : state.product,
    deleted: overrides.deleted.includes(id),
    edited: Boolean(edited),
    retry,
  };
}
