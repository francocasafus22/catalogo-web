"use client";

import { useState } from "react";
import { products } from "@/data/products";
import ProductCard from "./product-card";
import { Button } from "./ui/button";
import { useMemo, useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Link from "next/link";

export default function ProductsSection() {
    const [selectedCategory, setSelectedCategory] = useState("Todas");
    gsap.registerPlugin(ScrollTrigger);
    const gridRef = useRef<HTMLDivElement>(null);
 const hasAnimated = useRef(false);
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

    useEffect(() => {
    if (!gridRef.current) return;

    const cards = gridRef.current.children;

    // Primera vez al hacer scroll
    if (!hasAnimated.current) {
        gsap.fromTo(
            cards,
            {
            opacity: 0,
            y: 25,
            },
            {
            opacity: 1,
            y: 0,
            duration: 0.5,
            stagger: 0.06,
            ease: "power2.out",
            scrollTrigger: {
                trigger: gridRef.current,
                start: "top 60%",               
                once: true,
                onEnter: () => {
                hasAnimated.current = true;
                },
            },
            }
        );

        return;
        }

        // Cambio de categoría
        gsap.killTweensOf(cards);

        gsap.fromTo(
        cards,
        {
            opacity: 0,
            y: 15,
        },
        {
            opacity: 1,
            y: 0,
            duration: 0.4,
            stagger: 0.04,
            ease: "power1.out",
        }
        );
    }, [filteredProducts]);

    return (
        <main className="flex-1 bg-background px-6 py-20">
        <section className="mx-auto max-w-7xl" id="products">

            <div className="mb-12">
            <span className="mb-3 inline-block rounded-full bg-[#ffe2ec] px-4 py-1 text-sm font-medium text-[#df0909]">
                CATÁLOGO
            </span>

            <h2 className="text-4xl font-black tracking-tight md:text-5xl">
                Más vendidos
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
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" ref={gridRef}>
            {filteredProducts.map((product) => (
                <ProductCard
                key={product.id}
                product={product}
                />
                
            ))}            
            </div>

            <Link href="/catalogo" className="mt-12 flex justify-center">
            <Button variant="outline" size="lg" className="text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-all duration-300 cursor-pointer bg-transparent border-primary border-3">
                Ver más productos
            </Button>
            </Link>
        </section>
        </main>
    );
}