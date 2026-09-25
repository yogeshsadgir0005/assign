"use client";

import { useRef, useState } from "react";
import type { Category, Product } from "@/types/product";
import { createProduct, updateProduct } from "@/api/products";
import type { ApiError } from "@/lib/api-error";
import { isLocalId, nextLocalId, recordCreate, recordUpdate } from "@/lib/overrides";
import {
  FIELD_ORDER,
  toDraft,
  toValues,
  validate,
  type FieldName,
} from "@/lib/product-form";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { ProductFormFields } from "./ProductFormFields";

type Props = {
  product: Product | null;
  categories: Category[];
  onClose: () => void;
  onSaved: (product: Product, mode: "created" | "updated") => void;
};

const HEADING_ID = "product-form-title";

export function ProductFormDialog({ product, categories, onClose, onSaved }: Props) {
  const editing = Boolean(product);
  const [values, setValues] = useState(() => toValues(product));
  const [touched, setTouched] = useState<Set<FieldName>>(new Set());
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fieldRefs = useRef<Partial<Record<FieldName, HTMLElement | null>>>({});

  const errors = validate(values);
  const errorFor = (name: FieldName) =>
    submitted || touched.has(name) ? (errors[name] ?? null) : null;

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (saving) return;

    setSubmitted(true);
    const firstInvalid = FIELD_ORDER.find((name) => errors[name]);
    if (firstInvalid) {
      fieldRefs.current[firstInvalid]?.focus();
      return;
    }

    const draft = toDraft(values);
    setFormError(null);
    setSaving(true);

    try {
      if (product) {
        // A product that only exists in this session was never on the server,
        // so there is nothing to PUT to.
        const saved = isLocalId(product.id)
          ? { ...product, ...draft }
          : { ...product, ...(await updateProduct(product.id, draft)), ...draft };
        recordUpdate(saved);
        onSaved(saved, "updated");
      } else {
        const saved = await createProduct(draft);
        const local: Product = {
          ...saved,
          ...draft,
          id: nextLocalId(),
          rating: 0,
          reviews: [],
          images: draft.thumbnail ? [draft.thumbnail] : [],
        };
        recordCreate(local);
        onSaved(local, "created");
      }
    } catch (error) {
      setFormError((error as ApiError).message);
      setSaving(false);
    }
  }

  return (
    <Modal labelledBy={HEADING_ID} onClose={onClose} width="max-w-xl">
      <form onSubmit={onSubmit} noValidate>
        <div className="border-b border-line px-4 py-3">
          <h2 id={HEADING_ID} className="text-sm font-semibold text-ink">
            {editing ? `Edit “${product?.title}”` : "Add a product"}
          </h2>
          <p className="mt-0.5 text-[13px] text-ink-2">
            DummyJSON accepts the request but doesn&apos;t store it, so the change stays on this
            device.
          </p>
        </div>

        <ProductFormFields
          values={values}
          categories={categories}
          errorFor={errorFor}
          fieldRefs={fieldRefs}
          onChange={(name, value) => setValues((previous) => ({ ...previous, [name]: value }))}
          onBlur={(name) => setTouched((previous) => new Set(previous).add(name))}
        />

        {formError ? (
          <p
            role="alert"
            className="mx-4 mb-3 border-l-2 border-danger bg-danger-soft py-2 pl-2.5 text-[13px] text-ink"
          >
            {formError}
          </p>
        ) : null}

        <div className="flex justify-end gap-2 border-t border-line bg-sunken px-4 py-3">
          <Button type="button" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={saving}>
            {saving ? "Saving…" : editing ? "Save changes" : "Add product"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
