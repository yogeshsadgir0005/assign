"use client";

import { useSyncExternalStore } from "react";
import type { Product } from "@/types/product";

/**
 * DummyJSON acknowledges writes but never stores them: POST /products/add
 * always answers with id 195, and the next GET returns the untouched
 * catalogue. Rather than pretend, we keep the result of every accepted write
 * here, merge it over API responses, and mark those rows as local in the UI.
 */
export type Overrides = {
  created: Product[];
  updated: Record<number, Product>;
  deleted: number[];
};

const STORAGE_KEY = "padmin.local-changes";
const LOCAL_ID_BASE = 1_000_000;

const EMPTY: Overrides = { created: [], updated: {}, deleted: [] };

let state: Overrides = EMPTY;
let hydrated = false;
const listeners = new Set<() => void>();

function hydrate() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (raw) state = { ...EMPTY, ...(JSON.parse(raw) as Overrides) };
  } catch {
    state = EMPTY;
  }
}

function commit(next: Overrides) {
  state = next;
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Storage is a convenience here; the in-memory copy still works.
  }
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  hydrate();
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  hydrate();
  return state;
}

export function useOverrides() {
  return useSyncExternalStore(subscribe, getSnapshot, () => EMPTY);
}

export function nextLocalId() {
  hydrate();
  const used = state.created.map((product) => product.id);
  return used.length ? Math.max(...used) + 1 : LOCAL_ID_BASE + 1;
}

export function isLocalId(id: number) {
  return id > LOCAL_ID_BASE;
}

export function recordCreate(product: Product) {
  commit({ ...state, created: [product, ...state.created] });
}

export function recordUpdate(product: Product) {
  if (isLocalId(product.id)) {
    commit({
      ...state,
      created: state.created.map((item) => (item.id === product.id ? product : item)),
    });
    return;
  }
  commit({ ...state, updated: { ...state.updated, [product.id]: product } });
}

export function recordDelete(id: number) {
  if (isLocalId(id)) {
    commit({ ...state, created: state.created.filter((item) => item.id !== id) });
    return;
  }
  commit({ ...state, deleted: [...state.deleted, id] });
}

export function resetOverrides() {
  commit(EMPTY);
}

export function countOverrides(overrides: Overrides) {
  return overrides.created.length + Object.keys(overrides.updated).length + overrides.deleted.length;
}

export function findLocalProduct(overrides: Overrides, id: number) {
  return overrides.created.find((product) => product.id === id) ?? null;
}

/** Merge local writes over one page of API results. */
export function mergePage(
  products: Product[],
  overrides: Overrides,
  options: { includeCreated: boolean; q: string; category: string },
) {
  const merged = products
    .filter((product) => !overrides.deleted.includes(product.id))
    .map((product) => {
      const edited = overrides.updated[product.id];
      // The list endpoint returns a narrow field set; keep those fields and
      // overlay only what the form can change.
      return edited ? { ...product, ...edited } : product;
    });

  if (!options.includeCreated) return merged;

  const needle = options.q.toLowerCase();
  const locals = overrides.created.filter((product) => {
    const matchesQuery = !needle || product.title.toLowerCase().includes(needle);
    const matchesCategory = !options.category || product.category === options.category;
    return matchesQuery && matchesCategory;
  });

  return [...locals, ...merged];
}
