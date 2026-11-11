import { Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Pool } from "pg";
import * as bcrypt from "bcryptjs";

@Injectable()
export class DatabaseService extends Pool implements OnModuleInit, OnModuleDestroy {
  constructor(config: ConfigService) {
    super({ connectionString: config.get<string>("DATABASE_URL") });
  }

  async onModuleInit() {
    await this.query(`
      CREATE TABLE IF NOT EXISTS admins (
        id BIGSERIAL PRIMARY KEY,
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await this.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id BIGSERIAL PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        slug TEXT NOT NULL UNIQUE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await this.query(`
      CREATE TABLE IF NOT EXISTS products (
        id BIGSERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        slug TEXT NOT NULL UNIQUE,
        description TEXT NOT NULL DEFAULT '',
        price INTEGER NOT NULL CHECK (price >= 0),
        cost_price INTEGER NOT NULL DEFAULT 0 CHECK (cost_price >= 0),
        colors TEXT[] NOT NULL DEFAULT '{}',
        sizes TEXT[] NOT NULL DEFAULT '{}',
        stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
        variants JSONB NOT NULL DEFAULT '[]'::jsonb,
        category_id BIGINT NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
        tags TEXT[] NOT NULL DEFAULT '{}',
        visible BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await this.query("ALTER TABLE products ADD COLUMN IF NOT EXISTS cost_price INTEGER NOT NULL DEFAULT 0 CHECK (cost_price >= 0)");
    await this.query("ALTER TABLE products ADD COLUMN IF NOT EXISTS variants JSONB NOT NULL DEFAULT '[]'::jsonb");
    await this.query("ALTER TABLE products ADD COLUMN IF NOT EXISTS visible BOOLEAN NOT NULL DEFAULT FALSE");
    await this.query(`
      CREATE TABLE IF NOT EXISTS app_migrations (
        name TEXT PRIMARY KEY,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    const visibilityMigration = await this.query("SELECT name FROM app_migrations WHERE name = $1", ["hide-existing-products"]);
    if (visibilityMigration.rowCount === 0) {
      await this.query("UPDATE products SET visible = FALSE");
      await this.query("INSERT INTO app_migrations (name) VALUES ($1)", ["hide-existing-products"]);
    }
    await this.query(`
      UPDATE products p
      SET variants = (
        SELECT COALESCE(jsonb_agg(jsonb_build_object(
          'name', 'Color',
          'value', color.value,
          'sizes', (
            SELECT COALESCE(jsonb_agg(jsonb_build_object('size', size.value, 'stock', 0)), '[]'::jsonb)
            FROM unnest(p.sizes) AS size(value)
          )
        )), '[]'::jsonb)
        FROM unnest(p.colors) AS color(value)
      )
      WHERE p.variants = '[]'::jsonb AND cardinality(p.colors) > 0
    `);
    await this.query(`
      DO $$ BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'products' AND column_name = 'image'
        ) THEN
          EXECUTE $migration$
            UPDATE products
            SET variants = jsonb_set(variants, '{0,images}', to_jsonb(ARRAY[image[1]]), TRUE)
            WHERE jsonb_array_length(variants) > 0
              AND COALESCE(jsonb_array_length(variants->0->'images'), 0) = 0
              AND cardinality(image) > 0
          $migration$;
        END IF;
      END $$
    `);
    await this.query("ALTER TABLE products DROP COLUMN IF EXISTS image");
    await this.query(`
      CREATE TABLE IF NOT EXISTS sales (
        id BIGSERIAL PRIMARY KEY,
        total_revenue BIGINT NOT NULL CHECK (total_revenue >= 0),
        total_cost BIGINT NOT NULL CHECK (total_cost >= 0),
        profit BIGINT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await this.query(`
      CREATE TABLE IF NOT EXISTS sale_items (
        id BIGSERIAL PRIMARY KEY,
        sale_id BIGINT NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
        product_id BIGINT REFERENCES products(id) ON DELETE SET NULL,
        product_name TEXT NOT NULL,
        variant_name TEXT NOT NULL,
        variant_value TEXT NOT NULL,
        size TEXT NOT NULL,
        quantity INTEGER NOT NULL CHECK (quantity > 0),
        unit_sale_price INTEGER NOT NULL CHECK (unit_sale_price >= 0),
        unit_cost_price INTEGER NOT NULL CHECK (unit_cost_price >= 0),
        line_revenue BIGINT NOT NULL,
        line_cost BIGINT NOT NULL
      )
    `);
    await this.query("CREATE INDEX IF NOT EXISTS sale_items_sale_id_idx ON sale_items(sale_id)");

    const initialCategories = ["camperas", "jeans", "calzas"];
    for (const name of initialCategories) {
      await this.query(
        "INSERT INTO categories (name, slug) VALUES ($1, $2) ON CONFLICT (slug) DO NOTHING",
        [name[0].toUpperCase() + name.slice(1), name],
      );
    }

    const initialProducts = [
      { name: "Campera Boxi con Piel Venice", slug: "campera-boxi-con-piel-venice", description: "Campera con Piel · Boxi fit", price: 45000, image: "/campera.png", colors: ["Negro", "Beige", "Gris"], sizes: ["S", "M", "L", "XL"], category: "camperas", tags: ["nuevo", "destacado"] },
      { name: "Jean Rigido Wide Leg", slug: "jean-rigido-wide-leg", description: "Jean rigido con corte wide leg", price: 35000, image: "/jean-wide-leg.JPEG", colors: ["Negro", "Azul", "Gris"], sizes: ["36", "38", "40", "42", "44"], category: "jeans", tags: ["nuevo", "destacado"] },
      { name: "Calza Lycra Chupin con Friza", slug: "calza-lycra-chupin-con-friza", description: "Calza chupin con friza y lycra", price: 15000, image: "/calza-chupin.JPEG", colors: ["Negro"], sizes: ["S", "M", "L", "XL"], category: "calzas", tags: ["nuevo", "destacado"] },
      { name: "Jean Elastizado Chupin", slug: "jean-elastizado-chupin", description: "Jean elastizado con corte chupin", price: 35000, image: "/jean-chupin-azul.JPEG", colors: ["Negro", "Beige", "Gris"], sizes: ["36", "38", "40", "42", "44"], category: "jeans", tags: ["nuevo", "destacado"] },
    ];
    for (const product of initialProducts) {
      const variants = product.colors.map((color) => ({
        name: "Color",
        value: color,
        sizes: product.sizes.map((size) => ({ size, stock: 0 })),
        images: color === product.colors[0] ? [product.image] : [],
      }));
      await this.query(
        `INSERT INTO products (name, slug, description, price, colors, sizes, category_id, tags)
         SELECT $1, $2, $3, $4, $5, $6, categories.id, $7
         FROM categories WHERE categories.slug = $8
         ON CONFLICT (slug) DO NOTHING`,
        [product.name, product.slug, product.description, product.price, product.colors, product.sizes, product.tags, product.category],
      );
      await this.query(
        "UPDATE products SET variants=$2::jsonb WHERE slug=$1 AND variants='[]'::jsonb",
        [product.slug, JSON.stringify(variants)],
      );
    }

    const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
    const password = process.env.ADMIN_PASSWORD;
    if (!email || !password || password.length < 12) {
      throw new Error("Configurá ADMIN_EMAIL y ADMIN_PASSWORD (mínimo 12 caracteres) en backend/.env");
    }

    const existing = await this.query("SELECT id FROM admins WHERE email = $1", [email]);
    if (existing.rowCount === 0) {
      const passwordHash = await bcrypt.hash(password, 12);
      await this.query(
        "INSERT INTO admins (email, password_hash) VALUES ($1, $2)",
        [email, passwordHash],
      );
      console.log(`Administrador inicial creado: ${email}`);
    }
  }

  async onModuleDestroy() {
    await this.end();
  }
}
