"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowUpRight, BarChart3, LayoutDashboard, Package, ReceiptText, Shirt, Tags } from "lucide-react";
import AdminCatalogManager from "@/components/admin-catalog-manager";
import AdminSalesPanel from "@/components/admin-sales-panel";

type DashboardTab = "overview" | "products" | "sales" | "statistics";

export default function AdminDashboardTabs({ productCount, categoryCount, featuredCount }: {
  productCount: number;
  categoryCount: number;
  featuredCount: number;
}) {
  const [activeTab, setActiveTab] = useState<DashboardTab>("overview");
  const tabs = [
    { id: "overview", label: "Resumen", Icon: LayoutDashboard },
    { id: "products", label: "Productos", Icon: Package },
    { id: "sales", label: "Ventas", Icon: ReceiptText },
    { id: "statistics", label: "Estadísticas", Icon: BarChart3 },
  ] as const;

  return <>
    <div className="mt-7 overflow-x-auto rounded-2xl border border-border bg-card p-1.5">
      <div className="flex min-w-max gap-1" role="tablist" aria-label="Secciones del dashboard">
        {tabs.map(({ id, label, Icon }) => <button
          key={id}
          type="button"
          role="tab"
          aria-selected={activeTab === id}
          onClick={() => setActiveTab(id)}
          className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold transition-colors ${activeTab === id ? "bg-brand-red text-white" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}
        ><Icon className="h-4 w-4" aria-hidden="true" />{label}</button>)}
      </div>
    </div>

    <div className="mt-5" role="tabpanel">
      {activeTab === "overview" && <section aria-label="Resumen del catálogo" className="rounded-2xl border border-border bg-card p-4 sm:p-7">
        <div>
          <span className="text-xs font-bold uppercase tracking-[0.16em] text-brand-red">Resumen</span>
          <h2 className="mt-1 text-xl font-bold">Estado del catálogo</h2>
          <p className="mt-1 text-sm text-muted-foreground">Accedé a cada área desde las pestañas del dashboard.</p>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          {[
            { label: "Productos disponibles", value: productCount, Icon: Package },
            { label: "Categorías", value: categoryCount, Icon: Tags },
            { label: "Prendas destacadas", value: featuredCount, Icon: Shirt },
          ].map(({ label, value, Icon }) => <article key={label} className="rounded-xl border border-border bg-background p-4 sm:p-5">
            <div className="flex items-center justify-between"><span className="text-sm font-medium text-muted-foreground">{label}</span><span className="rounded-xl bg-brand-pink p-2 text-brand-red"><Icon className="h-5 w-5" aria-hidden="true" /></span></div>
            <p className="mt-4 text-3xl font-black">{value}</p>
          </article>)}
        </div>
        <Link href="/catalogo" className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-xl border border-border px-4 text-sm font-semibold transition hover:bg-muted">
          Ver catálogo público <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </section>}
      {activeTab === "products" && <AdminCatalogManager />}
      {activeTab === "sales" && <AdminSalesPanel mode="sales" />}
      {activeTab === "statistics" && <AdminSalesPanel mode="statistics" />}
    </div>
  </>;
}
