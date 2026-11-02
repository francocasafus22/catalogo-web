import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { DatabaseService } from "../database.service";
import { CreateSaleDto } from "./sale.dto";

type StoredVariant = { name: string; value: string; sizes: { size: string; stock: number }[] };
type LockedProduct = {
  id: number;
  name: string;
  price: number;
  cost_price: number;
  variants: StoredVariant[];
};

@Injectable()
export class SaleService {
  constructor(private readonly db: DatabaseService) {}

  async list() {
    const { rows } = await this.db.query(`
      SELECT s.id, s.total_revenue, s.total_cost, s.profit, s.created_at,
        COALESCE(jsonb_agg(jsonb_build_object(
          'id', si.id, 'productId', si.product_id, 'productName', si.product_name,
          'variantName', si.variant_name, 'variantValue', si.variant_value, 'size', si.size,
          'quantity', si.quantity, 'unitSalePrice', si.unit_sale_price, 'unitCostPrice', si.unit_cost_price,
          'lineRevenue', si.line_revenue, 'lineCost', si.line_cost
        )) FILTER (WHERE si.id IS NOT NULL), '[]'::jsonb) AS items
      FROM sales s LEFT JOIN sale_items si ON si.sale_id=s.id
      GROUP BY s.id ORDER BY s.created_at DESC, s.id DESC
    `);

    return rows.map((row) => ({
      id: Number(row.id), totalRevenue: Number(row.total_revenue), totalCost: Number(row.total_cost),
      profit: Number(row.profit), createdAt: row.created_at, items: row.items,
    }));
  }

  async create(input: CreateSaleDto) {
    const groupedLines = new Map<string, { productId: number; variantIndex: number; size: string; quantity: number }>();
    for (const line of input.items) {
      const key = `${line.productId}:${line.variantIndex}:${line.size}`;
      const existing = groupedLines.get(key);
      if (existing) existing.quantity += line.quantity;
      else groupedLines.set(key, { ...line });
    }

    const client = await this.db.connect();
    try {
      await client.query("BEGIN");
      const products = new Map<number, LockedProduct>();
      const saleItems: Array<Record<string, string | number>> = [];

      const orderedLines = [...groupedLines.values()].sort(
        (left, right) => left.productId - right.productId || left.variantIndex - right.variantIndex || left.size.localeCompare(right.size),
      );
      for (const line of orderedLines) {
        let product = products.get(line.productId);
        if (!product) {
          const result = await client.query(
            "SELECT id, name, price, cost_price, variants FROM products WHERE id=$1 FOR UPDATE",
            [line.productId],
          );
          if (!result.rows[0]) throw new ConflictException("Uno de los productos ya no existe");
          const row = result.rows[0];
          product = {
            id: Number(row.id), name: row.name, price: Number(row.price), cost_price: Number(row.cost_price),
            variants: typeof row.variants === "string" ? JSON.parse(row.variants) : row.variants,
          };
          products.set(product.id, product);
        }

        const variant = product.variants[line.variantIndex];
        if (!variant) throw new ConflictException(`La variante seleccionada de ${product.name} ya no existe`);
        const size = variant.sizes.find((item) => item.size === line.size);
        if (!size) throw new ConflictException(`El talle ${line.size} ya no existe para ${variant.value}`);
        if (size.stock < line.quantity) {
          throw new ConflictException(`Stock insuficiente para ${product.name} · ${variant.name}: ${variant.value} · talle ${line.size}. Disponible: ${size.stock}`);
        }

        size.stock -= line.quantity;
        saleItems.push({
          productId: product.id, productName: product.name, variantName: variant.name,
          variantValue: variant.value, size: line.size, quantity: line.quantity,
          unitSalePrice: product.price, unitCostPrice: product.cost_price,
          lineRevenue: product.price * line.quantity, lineCost: product.cost_price * line.quantity,
        });
      }

      for (const product of products.values()) {
        const stock = product.variants.reduce(
          (total, variant) => total + variant.sizes.reduce((sum, item) => sum + item.stock, 0), 0,
        );
        await client.query(
          "UPDATE products SET variants=$1::jsonb, stock=$2, updated_at=NOW() WHERE id=$3",
          [JSON.stringify(product.variants), stock, product.id],
        );
      }

      const totalRevenue = saleItems.reduce((sum, item) => sum + Number(item.lineRevenue), 0);
      const totalCost = saleItems.reduce((sum, item) => sum + Number(item.lineCost), 0);
      const saleResult = await client.query(
        "INSERT INTO sales (total_revenue,total_cost,profit) VALUES ($1,$2,$3) RETURNING id,created_at",
        [totalRevenue, totalCost, totalRevenue - totalCost],
      );
      const saleId = Number(saleResult.rows[0].id);

      for (const item of saleItems) {
        await client.query(
          `INSERT INTO sale_items (sale_id,product_id,product_name,variant_name,variant_value,size,quantity,unit_sale_price,unit_cost_price,line_revenue,line_cost)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
          [saleId, item.productId, item.productName, item.variantName, item.variantValue, item.size, item.quantity, item.unitSalePrice, item.unitCostPrice, item.lineRevenue, item.lineCost],
        );
      }

      await client.query("COMMIT");
      return {
        id: saleId, totalRevenue, totalCost, profit: totalRevenue - totalCost,
        createdAt: saleResult.rows[0].created_at, items: saleItems,
      };
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async remove(id: number) {
    const client = await this.db.connect();
    try {
      await client.query("BEGIN");
      const sale = await client.query("SELECT id FROM sales WHERE id=$1 FOR UPDATE", [id]);
      if (!sale.rows[0]) throw new NotFoundException("Venta no encontrada");

      const { rows: saleItems } = await client.query(
        "SELECT product_id, variant_name, variant_value, size, quantity FROM sale_items WHERE sale_id=$1 ORDER BY product_id NULLS LAST",
        [id],
      );
      const productIds = [...new Set(
        saleItems.map((item) => item.product_id === null ? null : Number(item.product_id)).filter((value): value is number => value !== null),
      )].sort((left, right) => left - right);
      const products = new Map<number, { variants: StoredVariant[] }>();

      for (const productId of productIds) {
        const result = await client.query("SELECT id, variants FROM products WHERE id=$1 FOR UPDATE", [productId]);
        // If the product has since been deleted, there is no inventory left to restore.
        if (!result.rows[0]) continue;
        const rawVariants = result.rows[0].variants;
        products.set(productId, {
          variants: typeof rawVariants === "string" ? JSON.parse(rawVariants) : rawVariants,
        });
      }

      for (const item of saleItems) {
        if (item.product_id === null) continue;
        const productId = Number(item.product_id);
        const product = products.get(productId);
        if (!product) continue;
        const variant = product.variants.find(
          (candidate) => candidate.name === item.variant_name && candidate.value === item.variant_value,
        );
        if (!variant) {
          throw new ConflictException(`No se puede eliminar la venta: ya no existe la variante ${item.variant_name}: ${item.variant_value} del producto ${productId}`);
        }
        const size = variant.sizes.find((candidate) => candidate.size === item.size);
        if (!size) {
          throw new ConflictException(`No se puede eliminar la venta: ya no existe el talle ${item.size} de ${item.variant_value}`);
        }
        size.stock += Number(item.quantity);
      }

      for (const [productId, product] of products) {
        const stock = product.variants.reduce(
          (total, variant) => total + variant.sizes.reduce((sum, item) => sum + item.stock, 0), 0,
        );
        await client.query(
          "UPDATE products SET variants=$1::jsonb, stock=$2, updated_at=NOW() WHERE id=$3",
          [JSON.stringify(product.variants), stock, productId],
        );
      }

      await client.query("DELETE FROM sales WHERE id=$1", [id]);
      await client.query("COMMIT");
      return { success: true, restoredStock: true };
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }
}
