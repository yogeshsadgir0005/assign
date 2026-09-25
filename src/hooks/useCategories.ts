"use client";

import { useEffect, useState } from "react";
import { fetchCategories } from "@/api/products";
import type { Category } from "@/types/product";
import { isCanceled } from "@/lib/api-error";

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    const controller = new AbortController();
    fetchCategories({ signal: controller.signal })
      .then(setCategories)
      .catch((error) => {
        if (!isCanceled(error)) setCategories([]);
      });
    return () => controller.abort();
  }, []);

  return categories;
}
