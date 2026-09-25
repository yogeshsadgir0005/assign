"use client";

import { useRef, useState } from "react";
import type { Category, Product, ProductDraft } from "@/types/product";
import { createProduct, updateProduct } from "@/api/products";
import type { ApiError } from "@/lib/api-error";
import { isLocalId, nextLocalId, recordCreate, recordUpdate } from "@/lib/overrides";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Field, controlClass } from "@/components/ui/Field";

type FormValues = {
  title: string;
  category: string;
  price: string;
  stock: string;
  brand: string;
  thumbnail: string;
  description: string;
};

type FieldName = keyof FormValues;
type Errors = Partial<Record<FieldName, string>>;

type Props = {
  product: Product | null;
  categories: Category[];
  onClose: () => void;
  onSaved: (product: Product, mode: "created" | "updated") => void;
};

const EMPTY_VALUES: FormValues = {
  title: "",
  category: "",
  price: "",
  stock: "",
  brand: "",
  thumbnail: "",
  description: "",
};

function toValues(product: Product | null): FormValues {
  if (!product) return EMPTY_VALUES;
  return {
    title: product.title,
    category: product.category,
    price: String(product.price),
    stock: String(product.stock),
    brand: product.brand ?? "",
    thumbnail: product.thumbnail ?? "",
    description: product.description ?? "",
  };
}

function validate(values: FormValues): Errors {
  const errors: Errors = {};

  const title = values.title.trim();
  if (!title) errors.title = "Give the product a title.";
  else if (title.length < 2) errors.title = "Use at least 2 characters.";
  else if (title.length > 120) errors.title = "Keep the title under 120 characters.";

  if (!values.category) errors.category = "Pick a category.";

  const price = Number(values.price);
  if (values.price.trim() === "") errors.price = "Enter a price.";
  else if (!Number.isFinite(price)) errors.price = "Price must be a number.";
  else if (price <= 0) errors.price = "Price must be more than 0.";
  else if (Math.round(price * 100) !== price * 100) errors.price = "Use at most 2 decimal places.";

  const stock = Number(values.stock);
  if (values.stock.trim() === "") errors.stock = "Enter a stock count.";
  else if (!Number.isInteger(stock)) errors.stock = "Stock must be a whole number.";
  else if (stock < 0) errors.stock = "Stock can't be negative.";

  if (values.brand.length > 60) errors.brand = "Keep the brand under 60 characters.";
  if (values.description.length > 600) errors.description = "Keep this under 600 characters.";

  if (values.thumbnail.trim() && !/^https?:\/\/\S+$/i.test(values.thumbnail.trim())) {
    errors.thumbnail = "Use a full http:// or https:// URL, or leave it empty.";
  }

  return errors;
}

const FIELD_ORDER: FieldName[] = [
  "title",
  "category",
  "price",
  "stock",
  "brand",
  "thumbnail",
  "description",
];

export function ProductFormDialog({ product, categories, onClose, onSaved }: Props) {
  const editing = Boolean(product);
  const [values, setValues] = useState(() => toValues(product));
  const [touched, setTouched] = useState<Set<FieldName>>(new Set());
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const refs = useRef<Partial<Record<FieldName, HTMLElement | null>>>({});
  const titleRef = useRef<HTMLInputElement>(null);

  const errors = validate(values);
  const shown = (name: FieldName) =>
    submitted || touched.has(name) ? (errors[name] ?? null) : null;

  function set(name: FieldName, value: string) {
    setValues((previous) => ({ ...previous, [name]: value }));
  }

  function blur(name: FieldName) {
    setTouched((previous) => new Set(previous).add(name));
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (saving) return;

    setSubmitted(true);
    const firstInvalid = FIELD_ORDER.find((name) => errors[name]);
    if (firstInvalid) {
      refs.current[firstInvalid]?.focus();
      return;
    }

    const draft: ProductDraft = {
      title: values.title.trim(),
      category: values.category,
      price: Number(values.price),
      stock: Number(values.stock),
      brand: values.brand.trim(),
      description: values.description.trim(),
      thumbnail: values.thumbnail.trim(),
    };

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

  const headingId = "product-form-title";

  return (
    <Modal labelledBy={headingId} onClose={onClose} initialFocus={titleRef} width="max-w-xl">
      <form onSubmit={onSubmit} noValidate>
        <div className="border-b border-line px-4 py-3">
          <h2 id={headingId} className="text-sm font-semibold text-ink">
            {editing ? `Edit “${product?.title}”` : "Add a product"}
          </h2>
          <p className="mt-0.5 text-[13px] text-ink-2">
            DummyJSON accepts the request but doesn&apos;t store it, so the change stays on this
            device.
          </p>
        </div>

        <div className="grid gap-3.5 px-4 py-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Field id="title" label="Title" error={shown("title")} required>
              <input
                id="title"
                ref={(node) => {
                  refs.current.title = node;
                  titleRef.current = node;
                }}
                className={`${controlClass} h-9`}
                value={values.title}
                aria-invalid={Boolean(shown("title"))}
                onChange={(event) => set("title", event.target.value)}
                onBlur={() => blur("title")}
              />
            </Field>
          </div>

          <Field id="category" label="Category" error={shown("category")} required>
            <select
              id="category"
              ref={(node) => {
                refs.current.category = node;
              }}
              className={`${controlClass} h-9`}
              value={values.category}
              aria-invalid={Boolean(shown("category"))}
              onChange={(event) => set("category", event.target.value)}
              onBlur={() => blur("category")}
            >
              <option value="">Choose one</option>
              {categories.map((category) => (
                <option key={category.slug} value={category.slug}>
                  {category.name}
                </option>
              ))}
            </select>
          </Field>

          <Field id="brand" label="Brand" error={shown("brand")} hint="Optional">
            <input
              id="brand"
              ref={(node) => {
                refs.current.brand = node;
              }}
              className={`${controlClass} h-9`}
              value={values.brand}
              aria-invalid={Boolean(shown("brand"))}
              onChange={(event) => set("brand", event.target.value)}
              onBlur={() => blur("brand")}
            />
          </Field>

          <Field id="price" label="Price in USD" error={shown("price")} required>
            <input
              id="price"
              ref={(node) => {
                refs.current.price = node;
              }}
              type="number"
              min="0.01"
              step="0.01"
              inputMode="decimal"
              className={`${controlClass} num h-9`}
              value={values.price}
              aria-invalid={Boolean(shown("price"))}
              onChange={(event) => set("price", event.target.value)}
              onBlur={() => blur("price")}
            />
          </Field>

          <Field id="stock" label="Stock" error={shown("stock")} required>
            <input
              id="stock"
              ref={(node) => {
                refs.current.stock = node;
              }}
              type="number"
              min="0"
              step="1"
              inputMode="numeric"
              className={`${controlClass} num h-9`}
              value={values.stock}
              aria-invalid={Boolean(shown("stock"))}
              onChange={(event) => set("stock", event.target.value)}
              onBlur={() => blur("stock")}
            />
          </Field>

          <div className="sm:col-span-2">
            <Field
              id="thumbnail"
              label="Image URL"
              error={shown("thumbnail")}
              hint="Optional. Leave empty to show a letter tile instead."
            >
              <input
                id="thumbnail"
                ref={(node) => {
                  refs.current.thumbnail = node;
                }}
                type="url"
                className={`${controlClass} h-9 font-mono text-[13px]`}
                value={values.thumbnail}
                aria-invalid={Boolean(shown("thumbnail"))}
                onChange={(event) => set("thumbnail", event.target.value)}
                onBlur={() => blur("thumbnail")}
              />
            </Field>
          </div>

          <div className="sm:col-span-2">
            <Field
              id="description"
              label="Description"
              error={shown("description")}
              hint={`${values.description.length}/600`}
            >
              <textarea
                id="description"
                ref={(node) => {
                  refs.current.description = node;
                }}
                rows={3}
                className={`${controlClass} resize-y py-2`}
                value={values.description}
                aria-invalid={Boolean(shown("description"))}
                onChange={(event) => set("description", event.target.value)}
                onBlur={() => blur("description")}
              />
            </Field>
          </div>
        </div>

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
