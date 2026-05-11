import Navbar from "@/components/Navbar";
import ProductCard from "@/components/product-card";
import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";
import Image from "next/image";
import { products } from "@/data/products";
import ProductsSection from "@/components/products-sections";

export default function Home() {
  return (
    <div className="flex flex-col flex-1 bg-background">
      <Navbar />

      <section className="relative w-full min-h-[80vh] overflow-hidden bg-primary  text-primary-foreground">    

        <div className="relative mx-auto flex min-h-[80vh] justify-center text-center items-center gap-16 px-6 py-12">
                    
          <div className="flex flex-col items-center">
            
            <span className="mb-4 w-fit rounded-full border border-[#df0909]/20 bg-white/70 px-4 py-1 text-sm font-medium text-[#df0909] backdrop-blur-sm">
              NUEVA COLECCIÓN
            </span>

            <h1 className="mb-6 text-5xl font-black tracking-tight text-[#df0909] md:text-7xl">
              Mariana Duran
            </h1>

            <p className="mb-8 max-w-xl text-lg text-foreground/80 md:text-xl">
              Descubrí nuestros nuevos ingresos y comprá directo por WhatsApp.
            </p>

            <div className="flex justify-center items-center gap-4">
              
              <Button
                size="lg"
                className="bg-[#df0909] text-white hover:bg-[#c40808]"
              >
                <a href="#products">Ver catálogo</a>
              </Button>

              <Button
                variant="secondary"
                size="lg"
                className="border border-border bg-white/80 backdrop-blur-sm"
              >
                <MessageCircle />
                WhatsApp
              </Button>
            </div>
          </div>
          
        </div>
      </section>

      <ProductsSection/>
    </div>
  );
}