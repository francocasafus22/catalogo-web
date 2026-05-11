import Image from "next/image"
import { Button } from "./ui/button"
import { MessageCircle } from "lucide-react"

export default function ProductCard() {
  return ( 
    <article className="group overflow-hidden rounded-3xl border bg-card transition-all hover:scale-102 cursor-pointer duration-250 hover:shadow-2xl ">

        {/* IMAGE */}
        <div className="relative h-[350px] overflow-hidden">
          
          <Image
            src="/campera.png"
            alt="Campera Boxi con Piel"
            fill
            className="object-cover"
          />

          {/* BADGE */}
          <span className="absolute left-4 top-4 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-white">
            NUEVO
          </span>
        </div>

        {/* CONTENT */}
        <div className="p-5">

          <div className="mb-2 flex items-start justify-between gap-4">
            <h3 className="text-lg font-semibold">
              Campera Boxi con Piel Venice
            </h3>            
          </div>
          <p className="text-sm mb-2 text-muted-foreground">
            Campera con Piel · Boxi fit
          </p>
            <span className="font-bold text-xl text-brand-red">
              $45.000
            </span>
          <Button className="w-full mt-2 hover:bg-primary/80 transition-colors duration-150 cursor-pointer">
            <MessageCircle />
            Comprar por WhatsApp
          </Button>
        </div>
      </article>
  )
}
