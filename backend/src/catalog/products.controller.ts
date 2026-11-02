import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { CreateProductDto, UpdateProductDto } from "./product.dto";
import { ProductService } from "./product.service";

@Controller("products")
export class ProductsController {
  constructor(private readonly products: ProductService) {}

  @Get()
  list() { return this.products.publicList(); }

  @Get(":slug")
  bySlug(@Param("slug") slug: string) { return this.products.publicBySlug(slug); }
}

@Controller("admin/products")
@UseGuards(AuthGuard("jwt"))
export class AdminProductsController {
  constructor(private readonly products: ProductService) {}

  @Get()
  list() { return this.products.adminList(); }

  @Post()
  create(@Body() input: CreateProductDto) { return this.products.create(input); }

  @Patch(":id")
  update(@Param("id", ParseIntPipe) id: number, @Body() input: UpdateProductDto) {
    return this.products.update(id, input);
  }

  @Delete(":id")
  remove(@Param("id", ParseIntPipe) id: number) { return this.products.remove(id); }
}
