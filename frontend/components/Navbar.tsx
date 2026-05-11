import { Input } from "./ui/input";
import { MessageCircle } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function Navbar() {
  return (
    <nav className="sticky top-0 z-50 border-b border-border/40 bg-background/70 backdrop-blur-xl">
  <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">

    {/* LOGO */}
    <Link href="/">
      <h1 className="text-2xl md:text-3xl font-black tracking-tight text-[#df0909] transition-opacity hover:opacity-80">
        Mariana
      </h1>
    </Link>

    {/* WHATSAPP */}
    <Link
      href="https://wa.me/54911XXXXXXXX"
      target="_blank"
      className="transition-transform duration-300 hover:scale-110"
    >
      <Image
        src="/whatsapp-logo.png"
        alt="WhatsApp"
        width={60}
        height={60}
        priority
        className="object-contain"
      />
    </Link>
  </div>
</nav>
  );
}