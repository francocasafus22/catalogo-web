import Navbar from "@/components/Navbar";
import ProductCard from "@/components/product-card";
import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";
import Image from "next/image";

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

      <main className="flex-1 bg-background px-6 py-20">
  <section className="mx-auto max-w-7xl" id="products">

    {/* HEADER */}
    <div className="mb-12 flex flex-col ">
      <span className="mb-3 rounded-full w-fit bg-[#ffe2ec] px-4 py-1 text-sm font-medium text-[#df0909]">
        CATÁLOGO
      </span>

      <h2 className="text-4xl font-black tracking-tight md:text-5xl">
        Nuestros productos
      </h2>

      <p className="mt-4 max-w-2xl text-muted-foreground">
        Descubrí los nuevos ingresos, básicos y prendas más vendidas.
      </p>
    </div>

    {/* FILTERS */}
    <div className="mb-10 flex flex-wrap items-center justify-center gap-3">
      <Button variant="default">
        Todos
      </Button>

      <Button variant="secondary">
        Buzos
      </Button>

      <Button variant="secondary">
        Remeras
      </Button>

      <Button variant="secondary">
        Jeans
      </Button>
    </div>

    {/* PRODUCTS GRID */}
    <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">

      <ProductCard />

      {/* DUPLICAR CARDS */}
    </div>
  </section>
</main>
    </div>
  );
}