"use client";

import type { RefObject } from "react";
import type { Category } from "@/types/product";
import type { FieldName, FormValues } from "@/lib/product-form";
import { Field, controlClass } from "@/components/ui/Field";

type Props = {
  values: FormValues;
  categories: Category[];
  errorFor: (name: FieldName) => string | null;
  onChange: (name: FieldName, value: string) => void;
  onBlur: (name: FieldName) => void;
  fieldRefs: RefObject<Partial<Record<FieldName, HTMLElement | null>>>;
};

export function ProductFormFields({
  values,
  categories,
  errorFor,
  onChange,
  onBlur,
  fieldRefs,
}: Props) {
  const register = (name: FieldName) => (node: HTMLElement | null) => {
    fieldRefs.current[name] = node;
  };

  // The dialog renders over the list toolbar, which already owns id="category".
  // Ids must stay unique for the labels to point at the right controls.
  const domId = (name: FieldName) => `product-${name}`;

  const shared = (name: FieldName) => ({
    id: domId(name),
    value: values[name],
    "aria-invalid": Boolean(errorFor(name)),
    "aria-describedby": errorFor(name) ? `${domId(name)}-error` : undefined,
    onChange: (event: { target: { value: string } }) => onChange(name, event.target.value),
    onBlur: () => onBlur(name),
  });

  return (
    <div className="grid gap-3.5 px-4 py-4 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <Field id={domId("title")} label="Title" error={errorFor("title")} required>
          <input ref={register("title")} className={`${controlClass} h-9`} {...shared("title")} />
        </Field>
      </div>

      <Field id={domId("category")} label="Category" error={errorFor("category")} required>
        <select ref={register("category")} className={`${controlClass} h-9`} {...shared("category")}>
          <option value="">Choose one</option>
          {categories.map((category) => (
            <option key={category.slug} value={category.slug}>
              {category.name}
            </option>
          ))}
        </select>
      </Field>

      <Field id={domId("brand")} label="Brand" error={errorFor("brand")} hint="Optional">
        <input ref={register("brand")} className={`${controlClass} h-9`} {...shared("brand")} />
      </Field>

      <Field id={domId("price")} label="Price in USD" error={errorFor("price")} required>
        <input
          ref={register("price")}
          type="number"
          min="0.01"
          step="0.01"
          inputMode="decimal"
          className={`${controlClass} num h-9`}
          {...shared("price")}
        />
      </Field>

      <Field id={domId("stock")} label="Stock" error={errorFor("stock")} required>
        <input
          ref={register("stock")}
          type="number"
          min="0"
          step="1"
          inputMode="numeric"
          className={`${controlClass} num h-9`}
          {...shared("stock")}
        />
      </Field>

      <div className="sm:col-span-2">
        <Field
          id={domId("thumbnail")}
          label="Image URL"
          error={errorFor("thumbnail")}
          hint="Optional. Leave empty to show a letter tile instead."
        >
          <input
            ref={register("thumbnail")}
            type="url"
            className={`${controlClass} h-9 font-mono text-[13px]`}
            {...shared("thumbnail")}
          />
        </Field>
      </div>

      <div className="sm:col-span-2">
        <Field
          id={domId("description")}
          label="Description"
          error={errorFor("description")}
          hint={`${values.description.length}/600`}
        >
          <textarea
            ref={register("description")}
            rows={3}
            className={`${controlClass} resize-y py-2`}
            {...shared("description")}
          />
        </Field>
      </div>
    </div>
  );
}
