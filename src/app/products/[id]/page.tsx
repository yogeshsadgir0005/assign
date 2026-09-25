import { Suspense } from "react";
import { ProductDetail } from "@/components/products/ProductDetail";

export const metadata = { title: "Product · Products admin" };

export default async function ProductPage({ params }: PageProps<"/products/[id]">) {
  const { id } = await params;

  return (
    <Suspense fallback={null}>
      <ProductDetail rawId={id} />
    </Suspense>
  );
}
