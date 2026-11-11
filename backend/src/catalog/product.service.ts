import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { DatabaseService } from "../database.service";
import { CreateProductDto, ProductVariantDto, UpdateProductDto } from "./product.dto";

type ProductVariant = ProductVariantDto;

function summarizeVariants(variants: ProductVariant[]) {
  if (!variants.length) throw new ConflictException("Cada producto debe tener al menos una variante");
  if (!variants.some((variant) => variant.images?.length)) throw new ConflictException("Agregá al menos una foto a una variante del producto");
  const variantKeys = new Set<string>();
  for (const variant of variants) {
    const variantKey = `${variant.name.trim().toLowerCase()}:${variant.value.trim().toLowerCase()}`;
    if (variantKeys.has(variantKey)) throw new ConflictException("No repitas el mismo tipo y valor de variante");
    variantKeys.add(variantKey);
    const sizeKeys = new Set<string>();
    for (const item of variant.sizes) {
      const sizeKey = item.size.trim().toLowerCase();
      if (sizeKeys.has(sizeKey)) throw new ConflictException(`El talle ${item.size} está repetido en ${variant.value}`);
      sizeKeys.add(sizeKey);
    }
  }
  const colors = [...new Set(variants.filter((variant) => variant.name.toLowerCase() === "color").map((variant) => variant.value))];
  const sizes = [...new Set(variants.flatMap((variant) => variant.sizes.map((item) => item.size)))];
  const stock = variants.reduce((total, variant) => total + variant.sizes.reduce((sum, item) => sum + item.stock, 0), 0);
  return { colors, sizes, stock };
}

function toSlug(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

const SELECT_PRODUCTS = `
  SELECT p.id, p.name, p.slug, p.description, p.price, p.cost_price, p.colors, p.sizes,
    p.stock, p.variants, p.category_id, p.tags, p.visible, p.created_at, p.updated_at,
    c.name AS category_name, c.slug AS category_slug
  FROM products p JOIN categories c ON c.id = p.category_id
`;

@Injectable()
export class ProductService {
  constructor(private readonly db: DatabaseService) {}

  async publicList() {
    const { rows } = await this.db.query(`${SELECT_PRODUCTS} WHERE p.visible = TRUE AND p.stock > 0 ORDER BY p.created_at DESC, p.id DESC`);
    return rows.map((row) => ({
      id: Number(row.id), name: row.name, slug: row.slug, description: row.description,
      price: Number(row.price), colors: row.colors, sizes: row.sizes,
      stock: Number(row.stock), variants: row.variants, categories: [row.category_slug], tags: row.tags, visible: row.visible,
    }));
  }

  async publicBySlug(slug: string) {
    const { rows } = await this.db.query(`${SELECT_PRODUCTS} WHERE p.slug = $1 AND p.visible = TRUE AND p.stock > 0`, [slug]);
    if (!rows[0]) throw new NotFoundException("Producto no encontrado");
    const row = rows[0];
    return {
      id: Number(row.id), name: row.name, slug: row.slug, description: row.description,
      price: Number(row.price), colors: row.colors, sizes: row.sizes,
      stock: Number(row.stock), variants: row.variants, categories: [row.category_slug], tags: row.tags, visible: row.visible,
    };
  }

  async adminList() {
    const { rows } = await this.db.query(`${SELECT_PRODUCTS} ORDER BY p.created_at DESC, p.id DESC`);
    return rows.map((row) => ({ ...row, id: Number(row.id), categoryId: Number(row.category_id), price: Number(row.price), costPrice: Number(row.cost_price), stock: Number(row.stock) }));
  }

  async create(input: CreateProductDto) {
    const slug = await this.uniqueSlug(toSlug(input.name));
    const summary = summarizeVariants(input.variants);
    const { rows } = await this.db.query(
      `INSERT INTO products (name, slug, description, price, cost_price, colors, sizes, stock, category_id, tags, variants, visible)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11::jsonb,$12) RETURNING id`,
      [input.name.trim(), slug, input.description.trim(), input.price, input.costPrice, summary.colors, summary.sizes, summary.stock, input.categoryId, input.tags ?? [], JSON.stringify(input.variants), input.visible ?? false],
    ).catch((error) => this.mapWriteError(error));
    return this.adminById(Number(rows[0].id));
  }

  async adminById(id: number) {
    const { rows } = await this.db.query(`${SELECT_PRODUCTS} WHERE p.id = $1`, [id]);
    if (!rows[0]) throw new NotFoundException("Producto no encontrado");
    const row = rows[0];
    return { ...row, id: Number(row.id), categoryId: Number(row.category_id), price: Number(row.price), costPrice: Number(row.cost_price), stock: Number(row.stock) };
  }

  async update(id: number, input: UpdateProductDto) {
    const current = await this.adminById(id);
    const nextName = input.name?.trim() ?? current.name;
    let slug = current.slug;
    if (input.name && toSlug(nextName) !== current.slug) slug = await this.uniqueSlug(toSlug(nextName), id);
    const variants = input.variants ?? current.variants;
    const summary = summarizeVariants(variants);
    await this.db.query(
      `UPDATE products SET name=$1, slug=$2, description=$3, price=$4, cost_price=$5,
       colors=$6, sizes=$7, stock=$8, category_id=$9, tags=$10, variants=$11::jsonb, visible=$12, updated_at=NOW() WHERE id=$13`,
      [nextName, slug, input.description?.trim() ?? current.description, input.price ?? current.price,
        input.costPrice ?? current.cost_price, summary.colors, summary.sizes, summary.stock,
        input.categoryId ?? current.categoryId, input.tags ?? current.tags, JSON.stringify(variants), input.visible ?? current.visible, id],
    ).catch((error) => this.mapWriteError(error));
    return this.adminById(id);
  }

  async remove(id: number) {
    const result = await this.db.query("DELETE FROM products WHERE id=$1 RETURNING id", [id]);
    if (!result.rowCount) throw new NotFoundException("Producto no encontrado");
    return { success: true };
  }

  private async uniqueSlug(base: string, excludeId?: number) {
    if (!base) throw new ConflictException("El nombre debe incluir letras o números");
    let candidate = base;
    let suffix = 2;
    for (;;) {
      const { rows } = await this.db.query("SELECT id FROM products WHERE slug=$1", [candidate]);
      if (!rows[0] || Number(rows[0].id) === excludeId) return candidate;
      candidate = `${base}-${suffix++}`;
    }
  }

  private mapWriteError(error: { code?: string; message?: string }): never {
    if (error.code === "23503") throw new ConflictException("La categoría seleccionada no existe");
    if (error.code === "23505") throw new ConflictException("Ya existe un producto con esos datos");
    throw error;
  }
}
