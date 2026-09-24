import { notFound } from "next/navigation";
import { ProductPageClient } from "@/components/product/ProductPageClient";
import { getProducts } from "@/lib/products";

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [p] = await getProducts([decodeURIComponent(id)]);
  if (!p) notFound();
  return (
    <div className="mx-auto max-w-2xl">
      <ProductPageClient p={p} />
    </div>
  );
}
