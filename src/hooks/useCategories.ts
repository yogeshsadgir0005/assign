"use client";

import { useEffect, useState } from "react";
import { fetchCategories } from "@/api/products";
import type { Category } from "@/types/product";
import { isCanceled } from "@/lib/api-error";

/** The category list never changes during a session, so one fetch is enough. */
export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    const controller = new AbortController();
    fetchCategories({ signal: controller.signal })
      .then(setCategories)
      .catch((error) => {
        // A missing filter list shouldn't take the table down with it.
        if (!isCanceled(error)) setCategories([]);
      });
    return () => controller.abort();
  }, []);

  return categories;
}
