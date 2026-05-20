import Image from "next/image"
import { Button } from "./ui/button"
import { MessageCircle } from "lucide-react"
import Link from "next/link"

export default function ProductCard({ product }: { product: any }) {
    return ( 
        <Link href={`/${product.slug}`} className="group overflow-hidden rounded-3xl border bg-card transition-all hover:scale-102 cursor-pointer duration-250 hover:shadow-2xl ">

            {/* IMAGE */}
            <div className="relative h-[400px] overflow-hidden">
            
            <Image
                src={product.image[0]}
                alt={product.name}
                fill
                className="object-cover"
            />

            {/* BADGE */}
            <span className="absolute left-4 top-4 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-white">
                {product.tags.includes("nuevo") ? "NUEVO" : ""}
            </span>
            </div>

            {/* CONTENT */}
            <div className="p-5 flex  flex-col gap-2">

            <div className="flex items-start justify-between gap-4">
                <h3 className="text-lg font-semibold">
                {product.name}
                </h3>            
            </div>

                <div className="flex">                
                {product.colors.map((color: string, index: number) => (
                    <span
                    key={index}
                    className="inline-block bg-muted text-muted-foreground px-2 py-1 text-xs font-medium rounded-full mr-2"
                    >
                    {color}
                    </span>
                ))}
                </div>

            <p className="text-sm text-muted-foreground">
                {product.description}
            </p>
                <span className="font-bold text-xl text-brand-red">
                ${product.price}
                </span>
            <Button className="w-full hover:bg-primary/80 transition-colors duration-150 cursor-pointer">
                
                Ver Producto
            </Button>
            </div>
        </Link>
    )
}
