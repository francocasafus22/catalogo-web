import { Button } from "@/components/ui/button";
import { products } from "@/data/products"
import { MessageCircle } from "lucide-react";
import { notFound } from "next/navigation";
import Image from "next/image";

export default async function page({params}: {params: {product: string}}){

    const {product} = await params
    

    const productSelected = products.find(p=>p.slug == product)

    if(!productSelected) notFound()

    const whatsappMessage = encodeURIComponent(
    `Hola! Me interesa el producto: ${productSelected.name}`
    );

    return (
        <div className="container mx-auto px-4 py-10">
        <div className="grid md:grid-cols-2 gap-10">
            
            {/* IMAGE */}
            <div className="relative h-[750px] overflow-hidden rounded-3xl border">
            <Image
                src={productSelected.image}
                alt={productSelected.name}
                fill
                className="object-cover"
            />
            </div>

            {/* INFO */}
            <div className="flex flex-col gap-5">
            
            <div>
                <h1 className="text-4xl font-bold">
                {productSelected.name}
                </h1>

                <p className="text-muted-foreground mt-3">
                {productSelected.description}
                </p>
            </div>

            {/* COLORS */}
            <div className="flex gap-2 flex-wrap">
                {productSelected.colors.map(
                (color: string, index: number) => (
                    <span
                    key={index}
                    className="bg-muted px-3 py-1 rounded-full text-sm"
                    >
                    {color}
                    </span>
                )
                )}
            </div>

            {/* PRICE */}
            <span className="text-3xl font-bold text-brand-red">
                ${productSelected.price}
            </span>

            {/* BUTTON */}
            <a
                href={`https://wa.me/549XXXXXXXXXX?text=${whatsappMessage}`}
                target="_blank"
            >
                <Button className="w-full text-base py-6 cursor-pointer">
                <MessageCircle />
                Consultar por WhatsApp
                </Button>
            </a>
            </div>
        </div>
        </div>
    );
}