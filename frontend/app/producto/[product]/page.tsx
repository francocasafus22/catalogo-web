import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ProductDetails from "@/components/product-details";
import { getCatalogProduct } from "@/lib/catalog-data";

type ProductPageProps = {
  params: Promise<{ product: string }>;
};

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { product: slug } = await params;
  const product = await getCatalogProduct(slug);

  return product
    ? { title: `${product.name} | Mariana Duran` }
    : { title: "Producto | Mariana Duran" };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { product: slug } = await params;
  const product = await getCatalogProduct(slug);

  if (!product) notFound();

  return (
    <main className="flex-1 bg-background px-5 py-8 sm:px-8 sm:py-12">
      <div className="mx-auto max-w-6xl">
        <nav aria-label="Migas de pan" className="mb-8 text-sm text-muted-foreground">
          <Link href="/" className="transition-colors hover:text-foreground">Inicio</Link>
          <span className="mx-2">/</span>
          <Link href="/catalogo" className="transition-colors hover:text-foreground">Catálogo</Link>
          <span className="mx-2">/</span>
          <span className="text-foreground">{product.name}</span>
        </nav>

        <ProductDetails product={product} />
        <Link href="/catalogo" className="text-sm text-muted-foreground underline-offset-4 hover:underline">
          Volver al catálogo
        </Link>
      </div>
    </main>
  );
}
