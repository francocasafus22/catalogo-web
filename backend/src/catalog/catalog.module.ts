import { Module } from "@nestjs/common";
import { DatabaseModule } from "../database.module";
import { ProductService } from "./product.service";
import { ProductsController, AdminProductsController } from "./products.controller";
import { CategoryService } from "./category.service";
import { CategoriesController, AdminCategoriesController } from "./categories.controller";
import { CloudinaryController } from "./cloudinary.controller";
import { CloudinaryService } from "./cloudinary.service";
import { SalesController } from "./sales.controller";
import { SaleService } from "./sale.service";

@Module({
  imports: [DatabaseModule],
  controllers: [ProductsController, AdminProductsController, CategoriesController, AdminCategoriesController, CloudinaryController, SalesController],
  providers: [ProductService, CategoryService, CloudinaryService, SaleService],
})
export class CatalogModule {}
