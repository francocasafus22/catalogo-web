"use client";

import { useState } from "react";
import { products } from "@/data/products";
import ProductCard from "./product-card";
import { Button } from "./ui/button";

export default function ProductsSection() {
    const [selectedCategory, setSelectedCategory] = useState("Todas");

    const categories = [
        "Todas",
        ...new Set(products.flatMap((product) => product.categories)),
    ];

    const filteredProducts =
        selectedCategory === "Todas"
        ? products
        : products.filter((product) =>
            product.categories.includes(selectedCategory)
            );

    return (
        <main className="flex-1 bg-background px-6 py-20">
        <section className="mx-auto max-w-7xl" id="products">

            <div className="mb-12">
            <span className="mb-3 inline-block rounded-full bg-[#ffe2ec] px-4 py-1 text-sm font-medium text-[#df0909]">
                CATÁLOGO
            </span>

            <h2 className="text-4xl font-black tracking-tight md:text-5xl">
                Nuestros productos
            </h2>

            <p className="mt-4 max-w-2xl text-muted-foreground">
                Descubrí los nuevos ingresos y prendas más vendidas.
            </p>
            </div>

            {/* FILTERS */}
            <div className="mb-10 flex flex-wrap items-center justify-center gap-3">
            {categories.map((category) => (
                <Button
                key={category}
                size="sm"
                variant={
                    selectedCategory === category
                    ? "default"
                    : "outline"
                }
                onClick={() => setSelectedCategory(category)}
                className={
                    selectedCategory === category
                    ? "bg-[#df0909] hover:bg-[#c40808] text-white"
                    : "border-muted text-muted-foreground hover:bg-muted/50"
                }
                >
                {category.toUpperCase()}
                </Button>
            ))}
            </div>

            {/* GRID */}
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredProducts.map((product) => (
                <ProductCard
                key={product.id}
                product={product}
                />
            ))}
            </div>
        </section>
        </main>
    );
}