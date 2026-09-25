export type Review = {
  rating: number;
  comment: string;
  date: string;
  reviewerName: string;
  reviewerEmail: string;
};

export type Product = {
  id: number;
  title: string;
  description: string;
  category: string;
  price: number;
  discountPercentage?: number;
  rating: number;
  stock: number;
  brand?: string;
  sku?: string;
  thumbnail: string;
  images: string[];
  reviews?: Review[];
  warrantyInformation?: string;
  shippingInformation?: string;
  returnPolicy?: string;
  availabilityStatus?: string;
};

export type ProductPage = {
  products: Product[];
  total: number;
  skip: number;
  limit: number;
};

export type Category = {
  slug: string;
  name: string;
};

export type ProductDraft = {
  title: string;
  category: string;
  price: number;
  stock: number;
  brand: string;
  description: string;
  thumbnail: string;
};
