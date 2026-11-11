import Image from "next/image"
import Link from "next/link"

export default function ProductCard({ product }: { product: any }) {
    return ( 
        <Link href={`/producto/${product.slug}`} className="group flex h-full flex-col overflow-hidden rounded-2xl border bg-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl sm:rounded-3xl">

            {/* IMAGE */}
            <div className="relative aspect-[4/5] overflow-hidden bg-muted">
            
            <Image
                src={product.variants?.[0]?.images?.[0]}
                alt={product.name}
                fill
                unoptimized
                className="object-cover"
            />

            {/* BADGE */}
            {product.tags.includes("nuevo") && (
                <span className="absolute left-2 top-2 rounded-full bg-brand-red px-2.5 py-1 text-[10px] font-bold tracking-wide text-white sm:left-4 sm:top-4 sm:px-3 sm:text-xs">
                    NUEVO
                </span>
            )}
            </div>

            {/* CONTENT */}
            <div className="flex flex-1 flex-col gap-2 p-3 sm:gap-3 sm:p-5">

            <div className="flex items-start justify-between gap-4">
                <h3 className="text-sm font-semibold leading-snug sm:text-lg">
                {product.name}
                </h3>            
            </div>

                <div className="flex">                
                {product.colors.slice(0, 3).map((color: string, index: number) => (
                    <span
                    key={index}
                    className="inline-block rounded-full bg-muted px-2 py-1 text-[10px] font-medium text-muted-foreground sm:text-xs"
                    >
                    {color}
                    </span>
                ))}
                </div>

            <p className="hidden text-sm text-muted-foreground sm:block">
                {product.description}
            </p>
                <span className="mt-auto pt-1 text-base font-bold text-brand-red sm:text-xl">
                ${product.price.toLocaleString("es-AR")}
                </span>
            <span className="mt-1 flex min-h-10 w-full items-center justify-center rounded-lg bg-primary px-2 text-xs font-semibold text-primary-foreground transition-colors group-hover:bg-brand-red group-hover:text-white sm:mt-2 sm:min-h-11 sm:text-sm">
                Ver producto
            </span>
            </div>
        </Link>
    )
}
