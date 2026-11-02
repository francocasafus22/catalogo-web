"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Pencil, Plus, Trash2 } from "lucide-react";

type Category = { id: number; name: string; slug: string; productCount: number };
type VariantSize = { size: string; stock: number };
type ProductVariant = { name: string; value: string; sizes: VariantSize[]; images: string[] };
type Product = {
  id: number; name: string; slug: string; description: string; price: number; costPrice: number;
  image: string; variants: ProductVariant[]; sizes: string[]; stock: number;
  categoryId: number; category_name: string; tags: string[];
};
type ProductForm = {
  name: string; description: string; price: string; costPrice: string; image: string;
  variants: ProductVariant[]; categoryId: string; tags: string;
};
const emptyProduct: ProductForm = {
  name: "", description: "", price: "", costPrice: "", image: "", categoryId: "", tags: "",
  variants: [{ name: "Color", value: "", sizes: [{ size: "", stock: 0 }], images: [] }],
};
const splitList = (value: string) => value.split(",").map((item) => item.trim()).filter(Boolean);

export default function AdminCatalogManager() {
  const router = useRouter();
  const [section, setSection] = useState<"products" | "categories">("products");
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [editingProduct, setEditingProduct] = useState<number | null>(null);
  const [productForm, setProductForm] = useState<ProductForm>(emptyProduct);
  const [categoryName, setCategoryName] = useState("");
  const [editingCategory, setEditingCategory] = useState<number | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingVariant, setUploadingVariant] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [productsResponse, categoriesResponse] = await Promise.all([
        fetch("/api/admin/products", { cache: "no-store" }),
        fetch("/api/admin/categories", { cache: "no-store" }),
      ]);
      if ([productsResponse, categoriesResponse].some((response) => response.status === 401)) {
        router.replace("/login");
        router.refresh();
        return;
      }
      const [productData, categoryData] = await Promise.all([productsResponse.json(), categoriesResponse.json()]);
      if (!productsResponse.ok || !categoriesResponse.ok) throw new Error(productData.message ?? categoryData.message ?? "No se pudo cargar el catálogo.");
      setProducts(productData);
      setCategories(categoryData);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "No se pudo cargar el catálogo.");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => { void loadData(); }, [loadData]);

  function beginCreateProduct() {
    setEditingProduct(null);
    setProductForm({ ...emptyProduct, categoryId: categories[0] ? String(categories[0].id) : "" });
    setError("");
    setFormOpen(true);
  }

  function beginEditProduct(product: Product) {
    setEditingProduct(product.id);
    setProductForm({
      name: product.name, description: product.description, price: String(product.price), costPrice: String(product.costPrice), image: product.image,
      variants: product.variants.map((variant) => ({ ...variant, images: variant.images ?? [] })),
      categoryId: String(product.categoryId), tags: product.tags.join(", "),
    });
    setError("");
    setFormOpen(true);
  }

  function updateVariant(index: number, changes: Partial<ProductVariant>) {
    setProductForm((current) => ({
      ...current,
      variants: current.variants.map((variant, i) => i === index ? { ...variant, ...changes } : variant),
    }));
  }

  function updateVariantSize(variantIndex: number, sizeIndex: number, changes: Partial<VariantSize>) {
    setProductForm((current) => ({
      ...current,
      variants: current.variants.map((variant, i) => i === variantIndex
        ? { ...variant, sizes: variant.sizes.map((item, j) => j === sizeIndex ? { ...item, ...changes } : item) }
        : variant),
    }));
  }

  async function uploadVariantImages(variantIndex: number, fileList: FileList | null) {
    const files = Array.from(fileList ?? []);
    if (!files.length) return;
    if (files.some((file) => !file.type.startsWith("image/"))) {
      setError("Elegí archivos de imagen.");
      return;
    }
    if (files.some((file) => file.size > 10 * 1024 * 1024)) {
      setError("Cada imagen debe pesar hasta 10 MB.");
      return;
    }
    const currentImages = productForm.variants[variantIndex]?.images ?? [];
    if (currentImages.length + files.length > 8) {
      setError("Cada variante puede tener hasta 8 imágenes.");
      return;
    }

    setError("");
    setNotice("");
    setUploadingVariant(variantIndex);
    try {
      const signatureResponse = await fetch("/api/admin/uploads/signature", { method: "POST" });
      const signature = await signatureResponse.json();
      if (!signatureResponse.ok) throw new Error(signature.message ?? "No se pudo iniciar la subida.");

      const uploadedUrls: string[] = [];
      for (const file of files) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("api_key", signature.apiKey);
        formData.append("timestamp", String(signature.timestamp));
        formData.append("folder", signature.folder);
        formData.append("signature", signature.signature);
        const response = await fetch(`https://api.cloudinary.com/v1_1/${signature.cloudName}/image/upload`, {
          method: "POST",
          body: formData,
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error?.message ?? "Cloudinary no pudo subir una imagen.");
        uploadedUrls.push(result.secure_url);
      }

      updateVariant(variantIndex, { images: [...currentImages, ...uploadedUrls] });
      setNotice(`${uploadedUrls.length} ${uploadedUrls.length === 1 ? "imagen cargada" : "imágenes cargadas"}. Guardá el producto para conservar los cambios.`);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "No se pudieron subir las imágenes.");
    } finally {
      setUploadingVariant(null);
    }
  }

  async function submitProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");
    const payload = {
      name: productForm.name.trim(), description: productForm.description.trim(),
      price: Number(productForm.price), costPrice: Number(productForm.costPrice), image: productForm.image.trim(),
      variants: productForm.variants.map((variant) => ({
        name: variant.name.trim(), value: variant.value.trim(),
        sizes: variant.sizes.map((item) => ({ size: item.size.trim(), stock: Number(item.stock) })),
      })),
      categoryId: Number(productForm.categoryId), tags: splitList(productForm.tags),
    };
    try {
      const response = await fetch(editingProduct ? `/api/admin/products/${editingProduct}` : "/api/admin/products", {
        method: editingProduct ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(Array.isArray(result.message) ? result.message[0] : result.message ?? "No se pudo guardar el producto.");
      setFormOpen(false);
      setNotice(editingProduct ? "Producto actualizado." : "Producto creado.");
      await loadData();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "No se pudo guardar el producto.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteProduct(product: Product) {
    if (!window.confirm(`¿Eliminar “${product.name}”? Esta acción no se puede deshacer.`)) return;
    const response = await fetch(`/api/admin/products/${product.id}`, { method: "DELETE" });
    const result = await response.json();
    if (!response.ok) { setError(result.message ?? "No se pudo eliminar el producto."); return; }
    setNotice("Producto eliminado.");
    await loadData();
  }

  async function submitCategory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch(editingCategory ? `/api/admin/categories/${editingCategory}` : "/api/admin/categories", {
        method: editingCategory ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: categoryName.trim() }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message ?? "No se pudo guardar la categoría.");
      setCategoryName("");
      setEditingCategory(null);
      setNotice(editingCategory ? "Categoría actualizada." : "Categoría creada.");
      await loadData();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "No se pudo guardar la categoría.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteCategory(category: Category) {
    if (!window.confirm(`¿Eliminar la categoría “${category.name}”?`)) return;
    const response = await fetch(`/api/admin/categories/${category.id}`, { method: "DELETE" });
    const result = await response.json();
    if (!response.ok) { setError(result.message ?? "No se pudo eliminar la categoría."); return; }
    setNotice("Categoría eliminada.");
    await loadData();
  }

  const inputClass = "mt-1.5 h-11 w-full rounded-xl border border-input bg-background px-3 text-base outline-none focus:border-brand-red focus:ring-2 focus:ring-brand-red/20";

  return (
    <section className="mt-8 rounded-2xl border border-border bg-card p-4 sm:p-7">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold">Administrar catálogo</h2>
          <p className="mt-1 text-sm text-muted-foreground">Gestioná productos, stock y categorías.</p>
        </div>
        {section === "products" && (
          <button type="button" onClick={beginCreateProduct} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-brand-red px-4 text-sm font-semibold text-white hover:bg-[#c40808]">
            <Plus className="h-4 w-4" aria-hidden="true" /> Agregar producto
          </button>
        )}
      </div>

      <div className="mt-5 flex gap-2 border-b border-border" role="tablist" aria-label="Administrar catálogo">
        {([ ["products", "Productos"], ["categories", "Categorías"] ] as const).map(([key, label]) => (
          <button key={key} type="button" role="tab" aria-selected={section === key} onClick={() => { setSection(key); setFormOpen(false); setError(""); }} className={`min-h-11 border-b-2 px-4 text-sm font-semibold ${section === key ? "border-brand-red text-brand-red" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
            {label} <span className="ml-1 text-xs">{key === "products" ? products.length : categories.length}</span>
          </button>
        ))}
      </div>

      {error && <p role="alert" className="mt-4 rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</p>}
      {notice && <p role="status" className="mt-4 rounded-xl bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-300">{notice}</p>}
      {loading ? <p className="py-8 text-center text-sm text-muted-foreground">Cargando catálogo…</p> : (
        <>
          {section === "products" && formOpen && (
            <form onSubmit={submitProduct} className="mt-5 rounded-2xl border border-border bg-muted/30 p-4 sm:p-6">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h3 className="text-lg font-bold">{editingProduct ? "Editar producto" : "Nuevo producto"}</h3>
                <button type="button" onClick={() => setFormOpen(false)} className="min-h-10 px-3 text-sm text-muted-foreground hover:text-foreground">Cancelar</button>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="text-sm font-medium">Nombre<input required minLength={2} value={productForm.name} onChange={(event) => setProductForm({ ...productForm, name: event.target.value })} className={inputClass} /></label>
                <label className="text-sm font-medium">Categoría<select required value={productForm.categoryId} onChange={(event) => setProductForm({ ...productForm, categoryId: event.target.value })} className={inputClass}><option value="" disabled>Seleccioná una categoría</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
                <label className="text-sm font-medium">Precio (ARS)<input required type="number" min="0" step="1" value={productForm.price} onChange={(event) => setProductForm({ ...productForm, price: event.target.value })} className={inputClass} /></label>
                <label className="text-sm font-medium">Precio de costo (ARS)<input required type="number" min="0" step="1" value={productForm.costPrice} onChange={(event) => setProductForm({ ...productForm, costPrice: event.target.value })} className={inputClass} /></label>
                <label className="text-sm font-medium sm:col-span-2">Imagen (URL o ruta pública, por ejemplo /campera.png)<input required value={productForm.image} onChange={(event) => setProductForm({ ...productForm, image: event.target.value })} placeholder="/campera.png o https://…" className={inputClass} /></label>
                <label className="text-sm font-medium sm:col-span-2">Descripción<textarea required rows={2} value={productForm.description} onChange={(event) => setProductForm({ ...productForm, description: event.target.value })} className="mt-1.5 w-full rounded-xl border border-input bg-background p-3 text-base outline-none focus:border-brand-red focus:ring-2 focus:ring-brand-red/20" /></label>
                <div className="sm:col-span-2">
                  <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                    <div><h4 className="text-sm font-semibold">Variantes, talles y stock</h4><p className="mt-1 text-xs text-muted-foreground">Cada variante tiene sus propios talles y cantidades.</p></div>
                    <span className="text-sm font-semibold text-brand-red">Stock total: {productForm.variants.reduce((sum, variant) => sum + variant.sizes.reduce((sizeSum, item) => sizeSum + Number(item.stock || 0), 0), 0)}</span>
                  </div>
                  <div className="space-y-4">
                    {productForm.variants.map((variant, variantIndex) => (
                      <fieldset key={variantIndex} className="rounded-xl border border-border bg-background p-3 sm:p-4">
                        <legend className="sr-only">Variante {variantIndex + 1}</legend>
                        <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
                          <label className="text-sm font-medium">Tipo<input required value={variant.name} onChange={(event) => updateVariant(variantIndex, { name: event.target.value })} placeholder="Color, Estampa…" className={inputClass} /></label>
                          <label className="text-sm font-medium">Variante<input required value={variant.value} onChange={(event) => updateVariant(variantIndex, { value: event.target.value })} placeholder="Negro, Floral…" className={inputClass} /></label>
                          {productForm.variants.length > 1 && <button type="button" disabled={uploadingVariant === variantIndex} onClick={() => setProductForm((current) => ({ ...current, variants: current.variants.filter((_, index) => index !== variantIndex) }))} className="min-h-11 rounded-lg border border-border px-3 text-sm text-destructive hover:bg-destructive/10 disabled:opacity-40">Quitar variante</button>}
                        </div>
                        <div className="mt-4">
                          <p className="text-sm font-medium">Fotos de esta variante</p>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {variant.images.map((src, imageIndex) => (
                              <div key={`${src}-${imageIndex}`} className="relative h-20 w-20 overflow-hidden rounded-lg border border-border bg-muted">
                                <Image src={src} alt={`${variant.name} ${variant.value} ${imageIndex + 1}`} fill unoptimized sizes="80px" className="object-cover" />
                                <button type="button" onClick={() => updateVariant(variantIndex, { images: variant.images.filter((_, index) => index !== imageIndex) })} aria-label="Quitar foto" className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/70 text-white"><span aria-hidden="true">×</span></button>
                              </div>
                            ))}
                          </div>
                          <label className={`mt-3 inline-flex min-h-10 cursor-pointer items-center rounded-lg border border-border px-3 text-sm font-semibold hover:bg-muted ${uploadingVariant === variantIndex ? "pointer-events-none opacity-50" : ""}`}>
                            {uploadingVariant === variantIndex ? "Subiendo imágenes…" : "Subir fotos"}
                            <input type="file" accept="image/*" multiple className="sr-only" disabled={uploadingVariant !== null} onChange={(event) => { void uploadVariantImages(variantIndex, event.target.files); event.currentTarget.value = ""; }} />
                          </label>
                          <p className="mt-1 text-xs text-muted-foreground">Hasta 8 imágenes por variante, máximo 10 MB cada una.</p>
                        </div>
                        <div className="mt-4 space-y-2">
                          <div className="grid grid-cols-[1fr_110px_40px] gap-2 text-xs font-semibold text-muted-foreground"><span>Talle</span><span>Stock</span><span className="sr-only">Acción</span></div>
                          {variant.sizes.map((item, sizeIndex) => (
                            <div key={sizeIndex} className="grid grid-cols-[1fr_110px_40px] items-center gap-2">
                              <input required aria-label={`Talle de variante ${variant.value || variantIndex + 1}`} value={item.size} onChange={(event) => updateVariantSize(variantIndex, sizeIndex, { size: event.target.value })} placeholder="S, M, 38…" className="h-11 min-w-0 rounded-xl border border-input bg-background px-3 text-base outline-none focus:border-brand-red focus:ring-2 focus:ring-brand-red/20" />
                              <input required aria-label={`Stock del talle ${item.size || sizeIndex + 1}`} type="number" min="0" step="1" value={item.stock} onChange={(event) => updateVariantSize(variantIndex, sizeIndex, { stock: Number(event.target.value) })} className="h-11 min-w-0 rounded-xl border border-input bg-background px-3 text-base outline-none focus:border-brand-red focus:ring-2 focus:ring-brand-red/20" />
                              <button type="button" disabled={variant.sizes.length === 1} onClick={() => updateVariant(variantIndex, { sizes: variant.sizes.filter((_, index) => index !== sizeIndex) })} aria-label="Quitar talle" className="flex h-10 w-10 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted disabled:opacity-30"><Trash2 className="h-4 w-4" aria-hidden="true" /></button>
                            </div>
                          ))}
                          <button type="button" onClick={() => updateVariant(variantIndex, { sizes: [...variant.sizes, { size: "", stock: 0 }] })} className="min-h-10 px-2 text-sm font-medium text-brand-red hover:underline">+ Agregar talle</button>
                        </div>
                      </fieldset>
                    ))}
                  </div>
                  <button type="button" onClick={() => setProductForm((current) => ({ ...current, variants: [...current.variants, { name: "", value: "", sizes: [{ size: "", stock: 0 }], images: [] }] }))} className="mt-3 inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-border px-3 text-sm font-semibold hover:bg-muted"><Plus className="h-4 w-4" aria-hidden="true" /> Agregar variante</button>
                </div>
                <label className="text-sm font-medium sm:col-span-2">Etiquetas <span className="font-normal text-muted-foreground">(separadas por coma)</span><input value={productForm.tags} onChange={(event) => setProductForm({ ...productForm, tags: event.target.value })} placeholder="nuevo, destacado" className={inputClass} /></label>
              </div>
              <button disabled={saving || uploadingVariant !== null || categories.length === 0} type="submit" className="mt-5 min-h-11 w-full rounded-xl bg-brand-red px-5 font-semibold text-white hover:bg-[#c40808] disabled:opacity-50 sm:w-auto">{saving ? "Guardando…" : editingProduct ? "Guardar cambios" : "Crear producto"}</button>
              {categories.length === 0 && <p className="mt-3 text-sm text-destructive">Primero creá una categoría.</p>}
            </form>
          )}

          {section === "products" && (
            <div className="mt-4 divide-y divide-border">
              {products.length === 0 ? <p className="py-8 text-center text-sm text-muted-foreground">Todavía no hay productos. Agregá el primero.</p> : products.map((product) => (
                <article key={product.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="font-semibold">{product.name}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{product.category_name} · {product.variants.map((variant) => `${variant.name}: ${variant.value} (${variant.sizes.map((item) => `${item.size}: ${item.stock}`).join(", ")})`).join(" · ")}</p>
                    <p className="mt-1 text-xs font-medium text-muted-foreground">Stock total: {product.stock}</p>
                    <p className="mt-1 text-sm font-bold text-brand-red">Venta ${product.price.toLocaleString("es-AR")} · Costo ${product.costPrice.toLocaleString("es-AR")}</p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <button type="button" onClick={() => beginEditProduct(product)} className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-border px-3 text-sm font-medium hover:bg-muted"><Pencil className="h-4 w-4" aria-hidden="true" /> Editar</button>
                    <button type="button" onClick={() => void deleteProduct(product)} aria-label={`Eliminar ${product.name}`} className="inline-flex min-h-10 items-center justify-center rounded-lg border border-border px-3 text-destructive hover:bg-destructive/10"><Trash2 className="h-4 w-4" aria-hidden="true" /></button>
                  </div>
                </article>
              ))}
            </div>
          )}

          {section === "categories" && (
            <>
              <form onSubmit={submitCategory} className="mt-5 flex flex-col gap-3 sm:flex-row">
                <label className="flex-1 text-sm font-medium">{editingCategory ? "Editar categoría" : "Nueva categoría"}<input required minLength={2} value={categoryName} onChange={(event) => setCategoryName(event.target.value)} placeholder="Ej. Vestidos" className={inputClass} /></label>
                <div className="flex items-end gap-2"><button disabled={saving} type="submit" className="min-h-11 flex-1 rounded-xl bg-brand-red px-5 font-semibold text-white hover:bg-[#c40808] disabled:opacity-50 sm:flex-none">{saving ? "Guardando…" : editingCategory ? "Guardar" : "Agregar"}</button>{editingCategory && <button type="button" onClick={() => { setEditingCategory(null); setCategoryName(""); }} className="min-h-11 rounded-xl border border-border px-4 text-sm">Cancelar</button>}</div>
              </form>
              <div className="mt-4 divide-y divide-border">
                {categories.map((category) => (
                  <article key={category.id} className="flex items-center justify-between gap-3 py-4">
                    <div><p className="font-semibold">{category.name}</p><p className="mt-1 text-xs text-muted-foreground">{category.productCount} {category.productCount === 1 ? "producto" : "productos"}</p></div>
                    <div className="flex gap-2"><button type="button" onClick={() => { setEditingCategory(category.id); setCategoryName(category.name); setError(""); }} className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-border px-3 text-sm font-medium hover:bg-muted"><Pencil className="h-4 w-4" aria-hidden="true" /> Editar</button><button type="button" onClick={() => void deleteCategory(category)} aria-label={`Eliminar categoría ${category.name}`} className="inline-flex min-h-10 items-center justify-center rounded-lg border border-border px-3 text-destructive hover:bg-destructive/10"><Trash2 className="h-4 w-4" aria-hidden="true" /></button></div>
                  </article>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </section>
  );
}
