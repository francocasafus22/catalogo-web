import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import AdminLogoutButton from "@/components/admin-logout-button";
import AdminDashboardTabs from "@/components/admin-dashboard-tabs";

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

        <AdminDashboardTabs
          productCount={catalog.products.length}
          categoryCount={catalog.categories.length}
          featuredCount={catalog.products.filter((product) => product.tags.includes("destacado")).length}
        />
      </div>
    </main>
  );
}
