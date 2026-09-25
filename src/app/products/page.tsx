import { Suspense } from "react";
import { ProductsScreen } from "@/components/products/ProductsScreen";

export const metadata = { title: "Products · Products admin" };

export default function ProductsPage() {
  return (
    <Suspense fallback={null}>
      <ProductsScreen />
    </Suspense>
  );
}
