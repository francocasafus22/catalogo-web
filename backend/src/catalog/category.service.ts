import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { DatabaseService } from "../database.service";
import { CategoryDto } from "./category.dto";

function toSlug(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

@Injectable()
export class CategoryService {
  constructor(private readonly db: DatabaseService) {}

  async list() {
    const { rows } = await this.db.query(`
      SELECT c.id, c.name, c.slug, COUNT(p.id)::int AS product_count
      FROM categories c LEFT JOIN products p ON p.category_id=c.id
      GROUP BY c.id ORDER BY c.name
    `);
    return rows.map((row) => ({ id: Number(row.id), name: row.name, slug: row.slug, productCount: row.product_count }));
  }

  async create({ name }: CategoryDto) {
    const cleanName = name.trim();
    const slug = toSlug(cleanName);
    if (!slug) throw new ConflictException("El nombre debe incluir letras o números");
    try {
      const { rows } = await this.db.query(
        "INSERT INTO categories (name, slug) VALUES ($1,$2) RETURNING id,name,slug",
        [cleanName, slug],
      );
      return { ...rows[0], id: Number(rows[0].id), productCount: 0 };
    } catch (error) {
      if ((error as { code?: string }).code === "23505") throw new ConflictException("Ya existe una categoría con ese nombre");
      throw error;
    }
  }

  async update(id: number, { name }: CategoryDto) {
    const cleanName = name.trim();
    const slug = toSlug(cleanName);
    if (!slug) throw new ConflictException("El nombre debe incluir letras o números");
    try {
      const { rows } = await this.db.query(
        "UPDATE categories SET name=$1, slug=$2 WHERE id=$3 RETURNING id,name,slug",
        [cleanName, slug, id],
      );
      if (!rows[0]) throw new NotFoundException("Categoría no encontrada");
      const { rows: countRows } = await this.db.query("SELECT COUNT(*)::int AS count FROM products WHERE category_id=$1", [id]);
      return { ...rows[0], id: Number(rows[0].id), productCount: countRows[0].count };
    } catch (error) {
      if ((error as { code?: string }).code === "23505") throw new ConflictException("Ya existe una categoría con ese nombre");
      throw error;
    }
  }

  async remove(id: number) {
    try {
      const result = await this.db.query("DELETE FROM categories WHERE id=$1", [id]);
      if (!result.rowCount) throw new NotFoundException("Categoría no encontrada");
      return { success: true };
    } catch (error) {
      if ((error as { code?: string }).code === "23503") {
        throw new ConflictException("No se puede eliminar una categoría que todavía tiene productos");
      }
      throw error;
    }
  }
}
