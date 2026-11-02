import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowUpRight, Package, ReceiptText, Shirt, Tags } from "lucide-react";
import AdminLogoutButton from "@/components/admin-logout-button";
import AdminCatalogManager from "@/components/admin-catalog-manager";
import AdminSalesPanel from "@/components/admin-sales-panel";

const apiUrl = process.env.BACKEND_API_URL ?? "http://localhost:4000/api";

async function getAdmin() {
  const token = (await cookies()).get("admin_token")?.value;
  if (!token) return null;
  try {
    const response = await fetch(`${apiUrl}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!response.ok) return null;
    const result = await response.json();
    return result.user as { id: string; email: string; role: string };
  } catch {
    return null;
  }
}

async function getCatalogSummary() {
  try {
    const [productsResponse, categoriesResponse] = await Promise.all([
      fetch(`${apiUrl}/products`, { cache: "no-store" }),
      fetch(`${apiUrl}/categories`, { cache: "no-store" }),
    ]);
    if (!productsResponse.ok || !categoriesResponse.ok) throw new Error("No se pudo cargar el resumen");
    const [products, categories] = await Promise.all([productsResponse.json(), categoriesResponse.json()]);
    return { products: products as Array<{ tags: string[] }>, categories: categories as unknown[] };
  } catch {
    return { products: [], categories: [] };
  }
}

export default async function DashboardPage() {
  const [admin, catalog] = await Promise.all([getAdmin(), getCatalogSummary()]);
  if (!admin) redirect("/login");

  return (
    <main className="flex-1 bg-background px-4 py-8 sm:px-6 sm:py-12">
      <div className="mx-auto max-w-6xl">
        <header className="flex flex-col gap-5 rounded-3xl bg-primary/60 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-9">
          <div>
            <span className="text-xs font-bold uppercase tracking-[0.18em] text-brand-red">Administración</span>
            <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">Hola, {admin.email.split("@")[0]}</h1>
            <p className="mt-2 text-sm text-foreground/70">Este es el resumen de tu catálogo.</p>
          </div>
          <AdminLogoutButton />
        </header>

        <section aria-label="Resumen del catálogo" className="mt-7 grid gap-4 sm:grid-cols-3">
          {[
            { label: "Productos", value: catalog.products.length, Icon: Package },
            { label: "Categorías", value: catalog.categories.length, Icon: Tags },
            { label: "Prendas destacadas", value: catalog.products.filter((product) => product.tags.includes("destacado")).length, Icon: Shirt },
          ].map(({ label, value, Icon }) => (
            <article key={label} className="rounded-2xl border border-border bg-card p-5 sm:p-6">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">{label}</span>
                <span className="rounded-xl bg-brand-pink p-2 text-brand-red"><Icon className="h-5 w-5" aria-hidden="true" /></span>
              </div>
              <p className="mt-4 text-3xl font-black">{value}</p>
            </article>
          ))}
        </section>

        <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-end">
          <Link href="#ventas" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-brand-red/30 px-5 text-sm font-semibold text-brand-red transition hover:bg-brand-pink">
            <ReceiptText className="h-4 w-4" aria-hidden="true" /> Ventas y ganancias
          </Link>
          <Link href="/catalogo" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-border px-5 text-sm font-semibold transition hover:bg-muted">
            Ver catálogo público <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
        <AdminCatalogManager />
        <AdminSalesPanel />
      </div>
    </main>
  );
}
