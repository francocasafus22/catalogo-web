import type { Metadata } from "next";
import CatalogGrid from "@/components/catalog-grid";
import { getCatalogProducts } from "@/lib/catalog-data";

export const metadata: Metadata = {
  title: "Catálogo | Mariana Duran",
  description: "Explorá la ropa de Mariana Duran por categoría y consultá cada producto por WhatsApp.",
};

export default async function CatalogPage() {
  const products = await getCatalogProducts();
  return (
    <main className="flex-1 bg-background px-4 py-8 sm:px-6 sm:py-12">
      <section className="mx-auto max-w-7xl">
        <header className="mb-8 rounded-3xl bg-primary/60 px-5 py-8 sm:mb-10 sm:px-10 sm:py-12">
          <span className="inline-flex rounded-full border border-brand-red/20 bg-white/70 px-3 py-1 text-xs font-semibold tracking-wide text-brand-red">
            MARIANA DURAN
          </span>
          <h1 className="mt-4 text-3xl font-black tracking-tight text-brand-red sm:text-5xl">
            Nuestro catálogo
          </h1>
          <p className="mt-3 max-w-xl text-sm text-foreground/75 sm:text-base">
            Encontrá tu próxima prenda favorita. Filtrá por categoría y consultá disponibilidad por WhatsApp.
          </p>
        </header>

        <CatalogGrid products={products} />
      </section>
    </main>
  );
}
