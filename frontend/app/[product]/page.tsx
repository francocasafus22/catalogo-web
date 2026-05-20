import { Button } from "@/components/ui/button";
import { products } from "@/data/products"
import { ChevronRight, CreditCard, Heart, MessageCircle, ShieldCheck, Truck } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import Image from "next/image";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export default async function page({params}: {params: {product: string}}){

    const {product} = await params
    const discount = 20
    
    const activeImage = 0
    const selectedColor = null
    const selectedSize = null
    const outOfStock: string[] = []
    const phoneNumber = "5491123456789"
    const isFav = false
    const talles = ["S", "M", "L", "XL", "XXL"]

    const productSelected = products.find(p=>p.slug == product)

    const breadcrumb = [       
        {
          href: `/camperas`,
          label: "Camperas",
        },
      ];

    if(!productSelected) notFound()

    const whatsappMessage = encodeURIComponent(
    `Hola! Me interesa el producto: ${productSelected.name}`
    );

    return (
        <div className="container mx-auto px-5">
            {/* ── BREADCRUMB ── */}
        <nav className="flex items-center gap-1.5 py-3 text-xs text-muted-foreground justify-center mb-10">
          <Link href="/" className="hover:text-foreground transition-colors">Inicio</Link>
          {breadcrumb.map((crumb) => (
            <span key={crumb.href} className="flex items-center gap-1.5">
              <ChevronRight className="h-3 w-3" />
              <Link href={crumb.href} className="hover:text-foreground transition-colors">
                {crumb.label}
              </Link>
            </span>
          ))}
          <ChevronRight className="h-3 w-3" />
          <span className="text-foreground truncate max-w-[180px]">{productSelected?.name}</span>
        </nav>

        {/* ── GRID PRINCIPAL ── */}
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-start pb-16">

          {/* ── GALERÍA ── */}
          <div className="flex flex-col gap-3">
            

            {/* Imagen principal */}            
              <Carousel className="relative w-full lg:w-[75%] mx-auto aspect-3/4 rounded-2xl overflow-hidden bg-muted">
                <CarouselContent>
                    {productSelected.image.map((_, index) => (
                    <CarouselItem key={index}>
                        <div className="p-1">
                        <Card>
                            <CardContent className="aspect-3/4 items-center justify-center p-6">
                            <Image
                                src={productSelected.image[index]}
                                alt={productSelected.name}
                                fill
                                className="object-cover rounded-2xl"
                            />
                            </CardContent>
                        </Card>
                        </div>
                    </CarouselItem>
                    ))}
                </CarouselContent>
                <CarouselPrevious />
                <CarouselNext />
            </Carousel>            

            {/* Dots móvil */}
            <div className="flex justify-center gap-1.5 lg:hidden">
              {productSelected.image.map((_, i) => (
                <button
                  key={i}
                  
                  className={cn(
                    "w-1.5 h-1.5 rounded-full transition-all",
                    activeImage === i ? "bg-foreground" : "bg-border"
                  )}
                />
              ))}
            </div>
          </div>

          {/* ── INFO ── */}
          <div className="flex flex-col gap-5">

            {/* Categoría + nombre + descripción */}
            <div>
              {productSelected.categories && (
                <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-1">
                  {productSelected.categories[0]}
                </p>
              )}
              <h1 className="text-2xl font-semibold leading-snug">{productSelected?.name}</h1>
              <p className="text-sm text-muted-foreground leading-relaxed mt-2">
                {productSelected?.description}
              </p>
            </div>

            <Separator />

            {/* Color */}
            {productSelected?.colors.length > 0 && (
              <div>
                <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-2">
                  Color
                  {selectedColor && (
                    <span className="ml-2 normal-case tracking-normal font-normal text-foreground">
                      — {selectedColor}
                    </span>
                  )}
                </p>
                <div className="flex flex-wrap gap-2">
                  {productSelected?.colors.map((color) => (
                    <button
                      key={color}                   
                      className={cn(
                        "px-3 py-1.5 rounded-full text-xs border transition-all",
                        selectedColor === color
                          ? "border-foreground text-foreground font-medium"
                          : "border-border text-muted-foreground bg-muted hover:border-foreground/40"
                      )}
                    >
                      {color}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Talle */}
            {productSelected && (
              <div>
                <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-2">
                  Talle
                </p>
                <div className="grid grid-cols-6 gap-1.5">
                  {talles.map((size) => {
                    const isOut = outOfStock.includes(size);
                    return (
                      <button
                        key={size}
                        disabled={isOut}
                        
                        className={cn(
                          "py-2 text-xs rounded-md border transition-all",
                          isOut
                            ? "opacity-30 line-through cursor-not-allowed border-border text-muted-foreground"
                            : selectedSize === size
                            ? "border-foreground text-foreground font-medium"
                            : "border-border text-muted-foreground bg-muted hover:border-foreground/40"
                        )}
                      >
                        {size}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <Separator />

            {/* Precio */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-1">
                  Precio
                </p>
                <div className="flex items-baseline gap-2 flex-wrap">
                  <span className="text-3xl font-semibold">
                    ${productSelected?.price.toLocaleString("es-AR")}
                  </span>
                  {productSelected?.price && (
                    <span className="text-sm text-muted-foreground line-through">
                      ${productSelected?.price.toLocaleString("es-AR")}
                    </span>
                  )}
                  {discount && (
                    <Badge variant="secondary" className="text-xs font-medium bg-amber-100 text-amber-800 border-0">
                      -{discount}%
                    </Badge>
                  )}
                </div>
              </div>

              {productSelected  && (
                <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                  Stock disponible
                </div>
              )}
            </div>

            {/* Acciones */}
            <div className="flex flex-col gap-2">
              <a
                href={`https://wa.me/${phoneNumber}?text=${whatsappMessage}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button
                  className="w-full py-6 text-sm font-medium bg-[#25D366] hover:bg-[#1ebe5d] text-white"
                  size="lg"
                >
                  <MessageCircle className="mr-2 h-4 w-4" />
                  Consultar por WhatsApp
                </Button>
              </a>

              <Button
                variant="outline"
                className="w-full py-6 text-sm"

              >
                <Heart
                  className={cn("mr-2 h-4 w-4", isFav && "fill-current text-rose-500")}
                />
                {isFav ? "Guardado en favoritos" : "Guardar en favoritos"}
              </Button>
            </div>

            {/* Envío / beneficios */}
            <div className="rounded-lg bg-muted/50 border p-3 flex flex-col gap-2.5">
              {[
                { Icon: Truck, text: "Envíos a todo el país" },
                { Icon: ShieldCheck, text: "Cambios y devoluciones sin costo" },
                { Icon: CreditCard, text: "Hasta 6 cuotas sin interés" },
              ].map(({ Icon, text }) => (
                <div key={text} className="flex items-center gap-2.5 text-xs text-muted-foreground">
                  <Icon className="h-4 w-4 flex-shrink-0" />
                  {text}
                </div>
              ))}
            </div>

          </div>
        </div>
        
        </div>
   

    );
}

/**
 * 
        {productSelected?.details && Object.keys(productSelected?.details).length > 0 && (
          <div className="border-t py-10">
            <h2 className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-4">
              Detalles del producto
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-px bg-border border rounded-xl overflow-hidden">
              {Object.entries(product.details).map(([key, value]) => (
                <div key={key} className="bg-background p-3.5">
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">{key}</p>
                  <p className="text-sm font-medium">{value}</p>
                </div>
              ))}
            </div>
          </div>
        )}
 */