import type { Metadata } from "next";
import { Geist, Geist_Mono, Outfit } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { ThemeProvider } from "@/components/theme-provider";
import Navbar from "@/components/Navbar";

const outfit = Outfit({subsets:['latin'],variable:'--font-sans'});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Mariana Duran | Catalogo Online Ropa Mujer",
  description: "Catalogo online de la tienda de ropa femenina Mariana Duran. Descubrí nuestras últimas colecciones, tendencias de moda y ofertas exclusivas. Compra ropa de calidad para mujer con envío rápido y seguro o puntos de encuentro. ¡Explorá nuestro catálogo ahora y encontrá tu estilo perfecto!",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={cn("h-full", "antialiased", geistSans.variable, geistMono.variable, "font-sans", outfit.variable)}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">

        <ThemeProvider attribute="class" defaultTheme="system" enableSystem={false} disableTransitionOnChange>
          <div className="flex flex-col flex-1 bg-background">
            <Navbar />
            {children}
          </div>
          
        </ThemeProvider>

      </body>
    </html>
  );
}
