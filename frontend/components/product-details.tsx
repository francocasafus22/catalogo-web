"use client";

import { useState } from "react";
import Image from "next/image";
import { MessageCircle } from "lucide-react";
import type { CatalogProduct } from "@/lib/catalog-types";

export default function ProductDetails({ product }: { product: CatalogProduct }) {
  const variants = product.variants ?? [];
  const [selectedVariantIndex, setSelectedVariantIndex] = useState<number | null>(variants.length ? 0 : null);
  const [selectedSize, setSelectedSize] = useState("");
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const selectedVariant = selectedVariantIndex === null ? undefined : variants[selectedVariantIndex];
  const selectedInventory = selectedVariant?.sizes.find((item) => item.size === selectedSize);
  const images = selectedVariant?.images?.length ? selectedVariant.images : product.image;
  const activeImage = images[activeImageIndex] ?? images[0];
  const hasSelection = Boolean(selectedVariant && selectedInventory);
  const variantLabel = selectedVariant ? `${selectedVariant.name}: ${selectedVariant.value}` : "";
  const message = encodeURIComponent(
    `Hola! Quiero consultar por ${product.name}. ${variantLabel}. Talle: ${selectedSize}. Stock publicado: ${selectedInventory?.stock ?? 0}. ¿Me confirman disponibilidad y cómo comprar?`,
  );

  function selectVariant(index: number) {
    setSelectedVariantIndex(index);
    setSelectedSize("");
    setActiveImageIndex(0);
  }

  return (
    <div className="grid items-start gap-8 pb-12 md:grid-cols-2 md:gap-14">
      <div>
        <div className="relative mx-auto aspect-[4/5] w-full max-w-xl overflow-hidden rounded-3xl bg-muted">
          {activeImage && (
            <Image
              src={activeImage}
              alt={selectedVariant ? `${product.name} · ${variantLabel}` : product.name}
              fill
              priority
              unoptimized
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover"
            />
          )}
        </div>
        {images.length > 1 && (
          <div className="mx-auto mt-3 flex max-w-xl gap-2 overflow-x-auto pb-1" aria-label="Fotos de la variante">
            {images.map((image, index) => (
              <button
                key={`${image}-${index}`}
                type="button"
                onClick={() => setActiveImageIndex(index)}
                aria-label={`Ver foto ${index + 1}`}
                aria-pressed={activeImageIndex === index}
                className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 ${activeImageIndex === index ? "border-brand-red" : "border-transparent"}`}
              >
                <Image src={image} alt="" fill unoptimized sizes="64px" className="object-cover" />
              </button>
            ))}
          </div>
        )}
        {selectedVariant && !selectedVariant.images?.length && (
          <p className="mt-2 text-center text-xs text-muted-foreground">Esta variante usa las fotos generales del producto.</p>
        )}
      </div>

      <section className="flex flex-col items-start pt-2 md:pt-8">
        {product.categories[0] && (
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-brand-red">{product.categories[0]}</p>
        )}
        <h1 className="text-3xl font-black leading-tight tracking-tight sm:text-4xl">{product.name}</h1>
        <p className="mt-3 text-muted-foreground">{product.description}</p>
        <p className="mt-7 text-3xl font-bold text-brand-red">${product.price.toLocaleString("es-AR")}</p>

        <fieldset className="mt-8 w-full border-t border-border pt-6">
          <legend className="text-sm font-semibold">Elegí una variante</legend>
          {variants.length ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {variants.map((variant, index) => {
                const selected = selectedVariantIndex === index;
                const inStock = variant.sizes.some((item) => item.stock > 0);
                return (
                  <button
                    key={`${variant.name}-${variant.value}-${index}`}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => selectVariant(index)}
                    className={`rounded-full border px-4 py-2 text-sm transition-colors ${selected ? "border-brand-red bg-brand-red text-white" : "border-border bg-card hover:border-brand-red"} ${!inStock ? "opacity-65" : ""}`}
                  >
                    <span className="font-medium">{variant.name}:</span> {variant.value}
                    {!inStock && <span className="ml-1 text-xs">(sin stock)</span>}
                  </button>
                );
              })}
            </div>
          ) : (
            <p className="mt-2 text-sm text-muted-foreground">Todavía no hay variantes cargadas.</p>
          )}
        </fieldset>

        {selectedVariant && (
          <fieldset className="mt-6 w-full border-t border-border pt-6">
            <legend className="text-sm font-semibold">Talle · {selectedVariant.value}</legend>
            <div className="mt-3 flex flex-wrap gap-2">
              {selectedVariant.sizes.map((item) => {
                const selected = selectedSize === item.size;
                const outOfStock = item.stock < 1;
                return (
                  <button
                    key={item.size}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => setSelectedSize(item.size)}
                    className={`min-w-14 rounded-lg border px-3 py-2 text-center text-sm font-medium transition-colors ${selected ? "border-brand-red bg-brand-red text-white" : "border-border bg-card hover:border-brand-red"} ${outOfStock ? "opacity-65" : ""}`}
                  >
                    <span>{item.size}</span>
                    {item.stock > 0 && <span className="block text-[10px] font-normal">{item.stock} disp.</span>}
                    {outOfStock && <span className="block text-[10px] font-normal">sin stock</span>}
                  </button>
                );
              })}
            </div>
          </fieldset>
        )}

        <a
          href={hasSelection ? `https://wa.me/5491151605505?text=${message}` : undefined}
          target={hasSelection ? "_blank" : undefined}
          rel={hasSelection ? "noopener noreferrer" : undefined}
          aria-disabled={!hasSelection}
          className={`mt-8 inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-xl px-6 font-semibold text-white transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#25D366] ${hasSelection ? "bg-[#25D366] hover:bg-[#1ebe5d]" : "cursor-not-allowed bg-muted text-muted-foreground"}`}
        >
          <MessageCircle className="h-5 w-5" aria-hidden="true" />
          Consultar por WhatsApp
        </a>
        {!hasSelection && <p className="mt-2 text-sm text-muted-foreground">Elegí una variante y un talle para consultar.</p>}
        {hasSelection && selectedInventory?.stock === 0 && <p className="mt-2 text-sm text-muted-foreground">Este talle figura sin stock; podés consultar por reposición.</p>}
      </section>
    </div>
  );
}
