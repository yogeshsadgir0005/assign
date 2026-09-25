import type { Product, ProductDraft } from "@/types/product";

export type FormValues = {
  title: string;
  category: string;
  price: string;
  stock: string;
  brand: string;
  thumbnail: string;
  description: string;
};

export type FieldName = keyof FormValues;
export type FormErrors = Partial<Record<FieldName, string>>;

/** Submit focuses the first invalid field, which means order matters. */
export const FIELD_ORDER: FieldName[] = [
  "title",
  "category",
  "price",
  "stock",
  "brand",
  "thumbnail",
  "description",
];

const EMPTY_VALUES: FormValues = {
  title: "",
  category: "",
  price: "",
  stock: "",
  brand: "",
  thumbnail: "",
  description: "",
};

export function toValues(product: Product | null): FormValues {
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

export function toDraft(values: FormValues): ProductDraft {
  return {
    title: values.title.trim(),
    category: values.category,
    price: Number(values.price),
    stock: Number(values.stock),
    brand: values.brand.trim(),
    description: values.description.trim(),
    thumbnail: values.thumbnail.trim(),
  };
}

export function validate(values: FormValues): FormErrors {
  const errors: FormErrors = {};

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
