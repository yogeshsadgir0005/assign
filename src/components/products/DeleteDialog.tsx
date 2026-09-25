"use client";

import { useRef, useState } from "react";
import type { Product } from "@/types/product";
import { deleteProduct } from "@/api/products";
import type { ApiError } from "@/lib/api-error";
import { isLocalId, recordDelete } from "@/lib/overrides";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";

type Props = {
  product: Product;
  onClose: () => void;
  onDeleted: (product: Product) => void;
};

/** Keeps the button label naming the product without wrapping to three lines. */
function shorten(title: string) {
  return title.length > 28 ? `${title.slice(0, 27).trimEnd()}…` : title;
}

export function DeleteDialog({ product, onClose, onDeleted }: Props) {
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Cancel holds focus: the destructive button shouldn't be one Enter away.
  const cancelRef = useRef<HTMLButtonElement>(null);

  async function confirm() {
    if (working) return;
    setError(null);
    setWorking(true);
    try {
      if (!isLocalId(product.id)) await deleteProduct(product.id);
      recordDelete(product.id);
      onDeleted(product);
    } catch (caught) {
      setError((caught as ApiError).message);
      setWorking(false);
    }
  }

  const headingId = "delete-product-title";

  return (
    <Modal
      labelledBy={headingId}
      onClose={onClose}
      dismissOnBackdrop
      initialFocus={cancelRef}
      width="max-w-md"
    >
      <div className="px-4 py-4">
        <h2 id={headingId} className="text-sm font-semibold text-ink">
          Delete “{product.title}”?
        </h2>
        <p className="mt-1.5 text-[13px] text-ink-2">
          It leaves the list for the rest of this session. DummyJSON replies 200 but keeps the
          product, so clearing local changes brings it back.
        </p>

        {error ? (
          <p
            role="alert"
            className="mt-3 border-l-2 border-danger bg-danger-soft py-2 pl-2.5 text-[13px] text-ink"
          >
            {error}
          </p>
        ) : null}
      </div>

      <div className="flex justify-end gap-2 border-t border-line bg-sunken px-4 py-3">
        <Button ref={cancelRef} type="button" onClick={onClose} disabled={working}>
          Cancel
        </Button>
        <Button type="button" variant="danger" onClick={confirm} disabled={working}>
          {working ? "Deleting…" : `Delete “${shorten(product.title)}”`}
        </Button>
      </div>
    </Modal>
  );
}
