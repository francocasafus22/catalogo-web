import { products as fallbackProducts } from "@/data/products";
import type { CatalogProduct } from "@/lib/catalog-types";

const apiUrl = process.env.BACKEND_API_URL ?? "http://localhost:4000/api";

export async function getCatalogProducts(): Promise<CatalogProduct[]> {
  try {
    const response = await fetch(`${apiUrl}/products`, { cache: "no-store" });
    if (!response.ok) throw new Error("Catalog API unavailable");
    return await response.json() as CatalogProduct[];
  } catch {
    return fallbackProducts.map((product) => ({
      ...product,
      stock: 0,
      variants: product.colors.map((color) => ({
        name: "Color", value: color,
        sizes: product.sizes.map((size) => ({ size, stock: 0 })),
      })),
    }));
  }
}

export async function getCatalogProduct(slug: string): Promise<CatalogProduct | undefined> {
  try {
    const response = await fetch(`${apiUrl}/products/${encodeURIComponent(slug)}`, { cache: "no-store" });
    if (response.status === 404) return undefined;
    if (!response.ok) throw new Error("Catalog API unavailable");
    return await response.json() as CatalogProduct;
  } catch {
    return fallbackProducts.find((product) => product.slug === slug);
  }
}
