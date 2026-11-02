"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import ProductCard from "@/components/product-card";
import type { CatalogProduct } from "@/lib/catalog-types";

const PAGE_SIZE = 3;

function categoryLabel(category: string) {
  return category.charAt(0).toUpperCase() + category.slice(1);
}

export default function CatalogGrid({ products }: { products: CatalogProduct[] }) {
  const [selectedCategory, setSelectedCategory] = useState("todas");
  const [currentPage, setCurrentPage] = useState(1);
  const categories = useMemo(
    () => ["todas", ...new Set(products.flatMap((product) => product.categories))],
    [products],
  );
  const filteredProducts = useMemo(
    () => selectedCategory === "todas"
      ? products
      : products.filter((product) => product.categories.includes(selectedCategory)),
    [selectedCategory],
  );
  const pageCount = Math.ceil(filteredProducts.length / PAGE_SIZE);
  const visibleProducts = filteredProducts.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );
  const firstItem = filteredProducts.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const lastItem = Math.min(currentPage * PAGE_SIZE, filteredProducts.length);

  function selectCategory(category: string) {
    setSelectedCategory(category);
    setCurrentPage(1);
  }

  function changePage(page: number) {
    setCurrentPage(page);
    document.getElementById("catalog-products")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <>
      <div className="mb-6">
        <h2 className="text-xl font-bold tracking-tight sm:text-2xl">Explorá las prendas</h2>
        <p className="mt-1 text-sm text-muted-foreground">Elegí una categoría para encontrar lo que buscás.</p>
      </div>

      <div className="-mx-4 mb-6 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0" aria-label="Filtrar por categoría">
        <div className="flex w-max gap-2" role="group" aria-label="Categorías de productos">
          {categories.map((category) => {
            const selected = selectedCategory === category;
            return (
              <button
                key={category}
                type="button"
                aria-pressed={selected}
                onClick={() => selectCategory(category)}
                className={`min-h-11 rounded-full border px-5 text-sm font-semibold transition-colors ${selected ? "border-brand-red bg-brand-red text-white" : "border-border bg-card text-foreground hover:border-brand-red/50"}`}
              >
                {category === "todas" ? "Todas" : categoryLabel(category)}
              </button>
            );
          })}
        </div>
      </div>

      <div id="catalog-products" className="scroll-mt-24">
        <div className="mb-4 flex items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground" aria-live="polite">
            {filteredProducts.length === 0
              ? "No hay productos en esta categoría."
              : `${firstItem}–${lastItem} de ${filteredProducts.length} ${filteredProducts.length === 1 ? "producto" : "productos"}`}
          </p>
          {pageCount > 1 && (
            <span className="text-xs font-medium text-muted-foreground">
              Página {currentPage} de {pageCount}
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4">
          {visibleProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>

      {pageCount > 1 && (
        <nav aria-label="Paginación del catálogo" className="mt-8 flex items-center justify-center gap-2 sm:mt-10">
          <button
            type="button"
            onClick={() => changePage(currentPage - 1)}
            disabled={currentPage === 1}
            className="inline-flex min-h-11 items-center gap-1 rounded-full border border-border px-4 text-sm font-medium transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            <span className="hidden sm:inline">Anterior</span>
          </button>

          <div className="flex items-center gap-1" aria-label="Páginas">
            {Array.from({ length: pageCount }, (_, index) => index + 1).map((page) => (
              <button
                key={page}
                type="button"
                aria-label={`Ir a la página ${page}`}
                aria-current={currentPage === page ? "page" : undefined}
                onClick={() => changePage(page)}
                className={`h-11 min-w-11 rounded-full text-sm font-semibold transition-colors ${currentPage === page ? "bg-brand-red text-white" : "border border-border hover:bg-muted"}`}
              >
                {page}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => changePage(currentPage + 1)}
            disabled={currentPage === pageCount}
            className="inline-flex min-h-11 items-center gap-1 rounded-full border border-border px-4 text-sm font-medium transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
          >
            <span className="hidden sm:inline">Siguiente</span>
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </nav>
      )}
    </>
  );
}
