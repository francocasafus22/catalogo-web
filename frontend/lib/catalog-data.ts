import type { CatalogProduct } from "@/lib/catalog-types";

const apiUrl = process.env.BACKEND_API_URL ?? "http://localhost:4000/api";

export async function getCatalogProducts(): Promise<CatalogProduct[]> {
  try {
    const response = await fetch(`${apiUrl}/products`, { cache: "no-store" });
    if (!response.ok) throw new Error("Catalog API unavailable");
    const products = await response.json() as CatalogProduct[];
    return products.filter((product) => product.visible === true);
  } catch {
    return [];
  }
}

export async function getCatalogProduct(slug: string): Promise<CatalogProduct | undefined> {
  try {
    const response = await fetch(`${apiUrl}/products/${encodeURIComponent(slug)}`, { cache: "no-store" });
    if (response.status === 404) return undefined;
    if (!response.ok) throw new Error("Catalog API unavailable");
    const product = await response.json() as CatalogProduct;
    return product.visible === true ? product : undefined;
  } catch {
    return undefined;
  }
}
