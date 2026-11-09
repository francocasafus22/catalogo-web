import { LayoutDashboard } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { cookies } from "next/headers";
import { ModeToggle } from "@/components/mode-toggle";

const apiUrl = process.env.BACKEND_API_URL ?? "http://localhost:4000/api";

async function hasAdminSession() {
  const token = (await cookies()).get("admin_token")?.value;
  if (!token) return false;

  try {
    const response = await fetch(`${apiUrl}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    return response.ok;
  } catch {
    return false;
  }
}

export default async function Navbar() {
  const isAdmin = await hasAdminSession();

  return (
    <nav className="sticky top-0 z-50 border-b border-border/40 bg-background/70 backdrop-blur-xl">
  <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">

    {/* LOGO */}
    <Link href="/">
      <h1 className="text-2xl md:text-3xl font-black tracking-tight text-[#df0909] transition-opacity hover:opacity-80">
        Mariana
      </h1>
    </Link>

    <div className="flex items-center gap-3">
      <ModeToggle />
      {isAdmin && (
        <Link
          href="/dashboard"
          className="inline-flex min-h-11 items-center gap-2 rounded-full border border-brand-red/20 bg-primary/70 px-4 text-sm font-semibold text-brand-red transition-colors hover:bg-brand-red hover:text-white"
        >
          <LayoutDashboard className="h-4 w-4" aria-hidden="true" />
          Dashboard
        </Link>
      )}

      <Link
        href="https://wa.me/54911XXXXXXXX"
        target="_blank"
        className="transition-transform duration-300 hover:scale-110"
      >
        <Image
          src="/whatsapp-logo.png"
          alt="WhatsApp"
          width={52}
          height={52}
          priority
          className="object-contain"
        />
      </Link>
    </div>
  </div>
</nav>
  );
}
