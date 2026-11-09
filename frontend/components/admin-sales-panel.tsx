"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { BarChart3, CalendarDays, ChevronLeft, ChevronRight, Package, Plus, ReceiptText, Trash2 } from "lucide-react";

type Variant = { name: string; value: string; sizes: { size: string; stock: number }[] };
type Product = { id: number; name: string; price: number; costPrice: number; variants: Variant[] };
type DraftLine = { productId: number; variantIndex: number; size: string; quantity: number; productName: string; variantName: string; variantValue: string; unitPrice: number; unitCost: number };
type Sale = { id: number; createdAt: string; totalRevenue: number; totalCost: number; profit: number; items: Array<{ productId?: number | null; productName: string; variantName: string; variantValue: string; size: string; quantity: number; unitSalePrice: number; unitCostPrice: number; lineRevenue: number; lineCost: number }> };
type Period = "day" | "week" | "month";

const money = (amount: number) => `$${amount.toLocaleString("es-AR")}`;

function getPeriodRange(period: Period, offset: number) {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  if (period === "day") {
    start.setDate(start.getDate() + offset);
  } else if (period === "week") {
    start.setDate(start.getDate() - ((start.getDay() + 6) % 7) + offset * 7);
  } else {
    start.setDate(1);
    start.setMonth(start.getMonth() + offset);
  }
  const end = new Date(start);
  if (period === "day") end.setDate(end.getDate() + 1);
  else if (period === "week") end.setDate(end.getDate() + 7);
  else end.setMonth(end.getMonth() + 1);
  return { start, end };
}

function periodLabel(period: Period, offset: number, start: Date, end: Date) {
  const formatter = new Intl.DateTimeFormat("es-AR", { day: "numeric", month: "short" });
  if (period === "day") {
    if (offset === 0) return `Hoy · ${new Intl.DateTimeFormat("es-AR", { day: "numeric", month: "long", year: "numeric" }).format(start)}`;
    return new Intl.DateTimeFormat("es-AR", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(start);
  }
  if (period === "week") {
    const lastDay = new Date(end);
    lastDay.setDate(lastDay.getDate() - 1);
    return `${formatter.format(start)} – ${formatter.format(lastDay)}`;
  }
  return new Intl.DateTimeFormat("es-AR", { month: "long", year: "numeric" }).format(start);
}

export default function AdminSalesPanel({ mode = "sales" }: { mode?: "sales" | "statistics" }) {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [period, setPeriod] = useState<Period>("day");
  const [periodOffset, setPeriodOffset] = useState(0);
  const [productId, setProductId] = useState("");
  const [variantIndex, setVariantIndex] = useState("");
  const [size, setSize] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [draft, setDraft] = useState<DraftLine[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingSaleId, setDeletingSaleId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [productsResponse, salesResponse] = await Promise.all([
        fetch("/api/admin/products", { cache: "no-store" }),
        fetch("/api/admin/sales", { cache: "no-store" }),
      ]);
      if ([productsResponse, salesResponse].some((response) => response.status === 401)) {
        router.replace("/login");
        router.refresh();
        return;
      }
      const [productData, salesData] = await Promise.all([productsResponse.json(), salesResponse.json()]);
      if (!productsResponse.ok || !salesResponse.ok) throw new Error(productData.message ?? salesData.message ?? "No se pudo cargar ventas.");
      setProducts(productData);
      setSales(salesData);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "No se pudo cargar ventas.");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => { void loadData(); }, [loadData]);

  useEffect(() => {
    const refreshProducts = () => {
      setProductId("");
      setVariantIndex("");
      setSize("");
      setQuantity("1");
      void loadData();
    };
    window.addEventListener("admin-products-updated", refreshProducts);
    return () => window.removeEventListener("admin-products-updated", refreshProducts);
  }, [loadData]);

  const selectedProduct = products.find((product) => String(product.id) === productId);
  const selectedVariant = selectedProduct && variantIndex !== "" ? selectedProduct.variants[Number(variantIndex)] : undefined;
  const selectedSize = selectedVariant?.sizes.find((item) => item.size === size);
  const draftQuantityForSelection = draft
    .filter((item) => item.productId === selectedProduct?.id && item.variantIndex === Number(variantIndex) && item.size === size)
    .reduce((total, item) => total + item.quantity, 0);
  const availableToAdd = Math.max(0, (selectedSize?.stock ?? 0) - draftQuantityForSelection);

  const totals = useMemo(() => draft.reduce((total, item) => ({
    revenue: total.revenue + item.unitPrice * item.quantity,
    cost: total.cost + item.unitCost * item.quantity,
  }), { revenue: 0, cost: 0 }), [draft]);
  const range = getPeriodRange(period, periodOffset);
  const periodSales = useMemo(() => sales.filter((sale) => {
    const createdAt = new Date(sale.createdAt);
    return createdAt >= range.start && createdAt < range.end;
  }), [sales, range.start.getTime(), range.end.getTime()]);
  const salesSummary = useMemo(() => periodSales.reduce((total, sale) => ({
    revenue: total.revenue + sale.totalRevenue,
    cost: total.cost + sale.totalCost,
    profit: total.profit + sale.profit,
  }), { revenue: 0, cost: 0, profit: 0 }), [periodSales]);
  const productStats = useMemo(() => {
    const byProduct = new Map<string, {
      name: string; units: number; revenue: number; cost: number;
      variants: Map<string, { label: string; units: number; revenue: number }>;
    }>();
    for (const sale of periodSales) {
      for (const item of sale.items) {
        const key = item.productId ? String(item.productId) : item.productName;
        const product = byProduct.get(key) ?? { name: item.productName, units: 0, revenue: 0, cost: 0, variants: new Map() };
        product.units += item.quantity;
        product.revenue += item.lineRevenue;
        product.cost += item.lineCost;
        const variantLabel = `${item.variantName}: ${item.variantValue} · talle ${item.size}`;
        const variant = product.variants.get(variantLabel) ?? { label: variantLabel, units: 0, revenue: 0 };
        variant.units += item.quantity;
        variant.revenue += item.lineRevenue;
        product.variants.set(variantLabel, variant);
        byProduct.set(key, product);
      }
    }
    return [...byProduct.values()].map((product) => ({
      ...product,
      variants: [...product.variants.values()].sort((a, b) => b.units - a.units),
    })).sort((a, b) => b.units - a.units || b.revenue - a.revenue);
  }, [periodSales]);
  const unitsSold = productStats.reduce((sum, product) => sum + product.units, 0);
  const topProduct = productStats[0];
  const selectedPeriodLabel = periodLabel(period, periodOffset, range.start, range.end);

  function addItem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedProduct || !selectedVariant || !selectedSize) return;
    const amount = Number(quantity);
    if (!Number.isInteger(amount) || amount < 1 || amount > availableToAdd) {
      setError(`Cantidad inválida. Quedan ${availableToAdd} unidades para esta variante y talle.`);
      return;
    }

    const keyMatches = (item: DraftLine) => item.productId === selectedProduct.id && item.variantIndex === Number(variantIndex) && item.size === size;
    const currentLine = draft.find(keyMatches);
    const line: DraftLine = {
      productId: selectedProduct.id, variantIndex: Number(variantIndex), size, quantity: amount,
      productName: selectedProduct.name, variantName: selectedVariant.name, variantValue: selectedVariant.value,
      unitPrice: selectedProduct.price, unitCost: selectedProduct.costPrice,
    };
    setDraft(currentLine
      ? draft.map((item) => keyMatches(item) ? { ...item, quantity: item.quantity + amount } : item)
      : [...draft, line]);
    setError("");
    setNotice("");
    setQuantity("1");
  }

  async function saveSale() {
    if (!draft.length) return;
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/admin/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: draft.map(({ productId, variantIndex, size, quantity }) => ({ productId, variantIndex, size, quantity })) }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(Array.isArray(result.message) ? result.message[0] : result.message ?? "No se pudo registrar la venta.");
      setDraft([]);
      setProductId("");
      setVariantIndex("");
      setSize("");
      setNotice(`Venta #${result.id} registrada. Stock actualizado.`);
      await loadData();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "No se pudo registrar la venta.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteSale(sale: Sale) {
    if (!window.confirm(`¿Eliminar la venta #${sale.id}? Se descontará del historial y se devolverán las unidades al stock.`)) return;
    setDeletingSaleId(sale.id);
    setError("");
    setNotice("");
    try {
      const response = await fetch(`/api/admin/sales/${sale.id}`, { method: "DELETE" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message ?? "No se pudo eliminar la venta.");
      setNotice(`Venta #${sale.id} eliminada y stock restaurado.`);
      await loadData();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "No se pudo eliminar la venta.");
    } finally {
      setDeletingSaleId(null);
    }
  }

  const inputClass = "mt-1.5 h-11 w-full rounded-xl border border-input bg-background px-3 text-base outline-none focus:border-brand-red focus:ring-2 focus:ring-brand-red/20";

  return (
    <section id={mode === "sales" ? "ventas" : "estadisticas"} className="rounded-2xl border border-border bg-card p-4 sm:p-7">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <span className="text-xs font-bold uppercase tracking-[0.16em] text-brand-red">Caja</span>
          <h2 className="mt-1 text-xl font-bold">{mode === "sales" ? "Ventas" : "Estadísticas de ventas"}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{mode === "sales" ? "Registrá ventas y consultá el historial." : "Resumen del rendimiento de productos para el período elegido."}</p>
          {mode === "sales" && <p className="mt-1 text-xs text-muted-foreground">La ganancia se calcula con el precio de costo guardado en cada producto; cargalo antes de registrar ventas.</p>}
        </div>
        {mode === "sales" && <a href="#nueva-venta" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-brand-red px-4 text-sm font-semibold text-white hover:bg-[#c40808]">
          <Plus className="h-4 w-4" aria-hidden="true" /> Nueva venta
        </a>}
      </div>

      {error && <p role="alert" className="mt-4 rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</p>}
      {notice && <p role="status" className="mt-4 rounded-xl bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-300">{notice}</p>}

      <div className="mt-5 rounded-xl border border-border bg-muted/20 p-3 sm:p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-1 rounded-xl bg-background p-1" role="group" aria-label="Filtrar ventas por período">
            {([ ["day", "Día"], ["week", "Semana"], ["month", "Mes"] ] as const).map(([value, label]) => (
              <button key={value} type="button" aria-pressed={period === value} onClick={() => { setPeriod(value); setPeriodOffset(0); }} className={`min-h-10 flex-1 rounded-lg px-4 text-sm font-semibold transition-colors sm:flex-none ${period === value ? "bg-brand-red text-white" : "text-muted-foreground hover:bg-muted"}`}>
                {label}
              </button>
            ))}
          </div>
          <div className="flex items-center justify-between gap-3 sm:justify-end">
            <button type="button" onClick={() => setPeriodOffset((offset) => offset - 1)} aria-label="Ver período anterior" className="flex h-10 w-10 items-center justify-center rounded-lg border border-border hover:bg-background"><ChevronLeft className="h-4 w-4" aria-hidden="true" /></button>
            <p className="min-w-40 text-center text-sm font-semibold capitalize sm:min-w-52"><CalendarDays className="mr-2 inline h-4 w-4 text-brand-red" aria-hidden="true" />{selectedPeriodLabel}</p>
            <button type="button" onClick={() => setPeriodOffset((offset) => Math.min(0, offset + 1))} disabled={periodOffset === 0} aria-label="Ver período siguiente" className="flex h-10 w-10 items-center justify-center rounded-lg border border-border hover:bg-background disabled:cursor-not-allowed disabled:opacity-40"><ChevronRight className="h-4 w-4" aria-hidden="true" /></button>
          </div>
        </div>
        {mode === "statistics" && <div className="mt-3 grid grid-cols-2 gap-2 lg:grid-cols-4">
          <article className="rounded-lg border border-border bg-background p-3"><p className="text-xs font-medium text-muted-foreground">Ventas del período</p><p className="mt-1 text-xl font-black">{periodSales.length}</p></article>
          <article className="rounded-lg border border-border bg-background p-3"><p className="text-xs font-medium text-muted-foreground">Ingresos</p><p className="mt-1 text-xl font-black">{money(salesSummary.revenue)}</p></article>
          <article className="rounded-lg border border-border bg-background p-3"><p className="text-xs font-medium text-muted-foreground">Costo</p><p className="mt-1 text-xl font-black">{money(salesSummary.cost)}</p></article>
          <article className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3"><p className="text-xs font-medium text-muted-foreground">Ganancia bruta</p><p className="mt-1 text-xl font-black text-emerald-700 dark:text-emerald-300">{money(salesSummary.profit)}</p></article>
        </div>}
      </div>

      {mode === "statistics" && <div className="mt-4 rounded-xl border border-border bg-background p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-pink text-brand-red"><BarChart3 className="h-5 w-5" aria-hidden="true" /></span>
          <div><h3 className="font-bold">Estadísticas de productos</h3><p className="mt-1 text-sm text-muted-foreground">Unidades, variantes e ingresos para {selectedPeriodLabel.toLowerCase()}.</p></div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
          <article className="rounded-lg border border-border bg-muted/20 p-3"><p className="text-xs font-medium text-muted-foreground">Unidades vendidas</p><p className="mt-1 text-xl font-black">{unitsSold}</p></article>
          <article className="rounded-lg border border-border bg-muted/20 p-3"><p className="text-xs font-medium text-muted-foreground">Productos vendidos</p><p className="mt-1 text-xl font-black">{productStats.length}</p></article>
          <article className="col-span-2 rounded-lg border border-border bg-muted/20 p-3 sm:col-span-1"><p className="text-xs font-medium text-muted-foreground">Más vendido</p><p className="mt-1 truncate text-base font-black">{topProduct?.name ?? "—"}</p>{topProduct && <p className="text-xs text-muted-foreground">{topProduct.units} {topProduct.units === 1 ? "unidad" : "unidades"}</p>}</article>
        </div>
        {productStats.length === 0 ? <p className="py-6 text-center text-sm text-muted-foreground">No hay productos vendidos en este período.</p> : (
          <div className="mt-4 space-y-3">
            {productStats.map((product) => {
              const share = Math.round(product.units / unitsSold * 100);
              return <article key={product.name} className="rounded-xl border border-border p-3 sm:p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex min-w-0 items-start gap-2"><Package className="mt-0.5 h-4 w-4 shrink-0 text-brand-red" aria-hidden="true" /><div className="min-w-0"><h4 className="truncate text-sm font-bold">{product.name}</h4><p className="mt-1 text-xs text-muted-foreground">{product.units} {product.units === 1 ? "unidad" : "unidades"} · {share}% del total</p></div></div>
                  <div className="flex gap-4 pl-6 text-sm sm:pl-0"><span>Ingresos <strong>{money(product.revenue)}</strong></span><span className="text-emerald-700 dark:text-emerald-300">Margen <strong>{money(product.revenue - product.cost)}</strong></span></div>
                </div>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-brand-red" style={{ width: `${share}%` }} /></div>
                <div className="mt-3 flex flex-wrap gap-2">{product.variants.map((variant) => <span key={variant.label} className="rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">{variant.label} · {variant.units} u. · {money(variant.revenue)}</span>)}</div>
              </article>;
            })}
          </div>
        )}
      </div>}

      {mode === "sales" && <>
      <div id="nueva-venta" className="mt-6 scroll-mt-24 rounded-xl border border-border bg-muted/20 p-4 sm:p-5">
        <h3 className="font-bold">Registrar venta</h3>
        <form onSubmit={addItem} className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <label className="text-sm font-medium lg:col-span-2">Producto<select required value={productId} onChange={(event) => { setProductId(event.target.value); setVariantIndex(""); setSize(""); }} className={inputClass}><option value="">Elegir producto</option>{products.map((product) => <option key={product.id} value={product.id}>{product.name} · {money(product.price)}</option>)}</select></label>
          <label className="text-sm font-medium">Variante<select required disabled={!selectedProduct} value={variantIndex} onChange={(event) => { setVariantIndex(event.target.value); setSize(""); }} className={inputClass}><option value="">Elegir variante</option>{selectedProduct?.variants.map((variant, index) => <option key={`${variant.name}-${variant.value}-${index}`} value={index}>{variant.name}: {variant.value}</option>)}</select></label>
          <label className="text-sm font-medium">Talle<select required disabled={!selectedVariant} value={size} onChange={(event) => setSize(event.target.value)} className={inputClass}><option value="">Elegir talle</option>{selectedVariant?.sizes.map((item) => <option key={item.size} value={item.size} disabled={item.stock - draft.filter((draftItem) => draftItem.productId === selectedProduct?.id && draftItem.variantIndex === Number(variantIndex) && draftItem.size === item.size).reduce((sum, draftItem) => sum + draftItem.quantity, 0) < 1}>{item.size} · disponibles {Math.max(0, item.stock - draft.filter((draftItem) => draftItem.productId === selectedProduct?.id && draftItem.variantIndex === Number(variantIndex) && draftItem.size === item.size).reduce((sum, draftItem) => sum + draftItem.quantity, 0))}</option>)}</select></label>
          <label className="text-sm font-medium">Cantidad<input required type="number" min="1" max={availableToAdd} step="1" value={quantity} onChange={(event) => setQuantity(event.target.value)} className={inputClass} /></label>
          <div className="flex items-end lg:col-span-5"><button disabled={!selectedSize || availableToAdd < 1} type="submit" className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-brand-red px-4 text-sm font-semibold text-brand-red hover:bg-brand-pink disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"><Plus className="h-4 w-4" aria-hidden="true" /> Agregar a la venta</button></div>
        </form>

        {draft.length > 0 && (
          <div className="mt-5 rounded-xl border border-border bg-background p-3 sm:p-4">
            <h4 className="text-sm font-bold">Detalle de la venta</h4>
            <div className="mt-2 divide-y divide-border">
              {draft.map((item) => {
                const key = `${item.productId}:${item.variantIndex}:${item.size}`;
                return <div key={key} className="flex items-center justify-between gap-3 py-3"><div className="min-w-0"><p className="truncate text-sm font-semibold">{item.productName}</p><p className="text-xs text-muted-foreground">{item.variantName}: {item.variantValue} · talle {item.size} · {item.quantity} u.</p></div><div className="flex shrink-0 items-center gap-3"><span className="text-sm font-bold">{money(item.unitPrice * item.quantity)}</span><button type="button" onClick={() => setDraft(draft.filter((line) => line !== item))} aria-label={`Quitar ${item.productName}`} className="flex h-9 w-9 items-center justify-center rounded-lg text-destructive hover:bg-destructive/10"><Trash2 className="h-4 w-4" aria-hidden="true" /></button></div></div>;
              })}
            </div>
            <div className="mt-3 flex flex-col gap-2 border-t border-border pt-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm"><span className="font-semibold">Total: {money(totals.revenue)}</span><span className="ml-3 text-emerald-700 dark:text-emerald-300">Ganancia estimada: {money(totals.revenue - totals.cost)}</span></div>
              <button type="button" disabled={saving} onClick={() => void saveSale()} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-brand-red px-5 text-sm font-semibold text-white hover:bg-[#c40808] disabled:opacity-50"><ReceiptText className="h-4 w-4" aria-hidden="true" />{saving ? "Guardando…" : "Confirmar venta"}</button>
            </div>
          </div>
        )}
      </div>

      <div className="mt-7">
        <h3 className="font-bold">Historial de ventas</h3>
        {loading ? <p className="py-6 text-center text-sm text-muted-foreground">Cargando ventas…</p> : periodSales.length === 0 ? <p className="py-6 text-center text-sm text-muted-foreground">No hay ventas para este período.</p> : (
          <div className="mt-3 space-y-3">
            {periodSales.map((sale) => (
              <details key={sale.id} className="rounded-xl border border-border bg-background p-4">
                <summary className="flex cursor-pointer list-none flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <span className="font-semibold">Venta #{sale.id} <span className="ml-1 text-xs font-normal text-muted-foreground">{new Date(sale.createdAt).toLocaleString("es-AR")}</span></span>
                  <span className="flex flex-wrap gap-x-4 gap-y-1 text-sm"><span>Venta {money(sale.totalRevenue)}</span><span className="text-muted-foreground">Costo {money(sale.totalCost)}</span><span className="font-bold text-emerald-700 dark:text-emerald-300">Ganancia {money(sale.profit)}</span></span>
                </summary>
                <div className="mt-3 divide-y divide-border border-t border-border">
                  {sale.items.map((item, index) => <div key={`${sale.id}-${index}`} className="flex flex-wrap justify-between gap-x-4 gap-y-1 py-2 text-sm"><span>{item.productName} · {item.variantName}: {item.variantValue} · talle {item.size} × {item.quantity}</span><span className="font-medium">{money(item.lineRevenue)}</span></div>)}
                </div>
                <div className="mt-3 flex justify-end border-t border-border pt-3">
                  <button type="button" disabled={deletingSaleId !== null} onClick={() => void deleteSale(sale)} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-destructive/30 px-3 text-sm font-semibold text-destructive hover:bg-destructive/10 disabled:opacity-50">
                    <Trash2 className="h-4 w-4" aria-hidden="true" /> {deletingSaleId === sale.id ? "Eliminando…" : "Eliminar venta"}
                  </button>
                </div>
              </details>
            ))}
          </div>
        )}
      </div>
      </>}
    </section>
  );
}
