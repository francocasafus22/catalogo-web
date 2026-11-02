import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { CategoryDto } from "./category.dto";
import { CategoryService } from "./category.service";

@Controller("categories")
export class CategoriesController {
  constructor(private readonly categories: CategoryService) {}

  @Get()
  list() { return this.categories.list(); }
}

@Controller("admin/categories")
@UseGuards(AuthGuard("jwt"))
export class AdminCategoriesController {
  constructor(private readonly categories: CategoryService) {}

  @Get()
  list() { return this.categories.list(); }

  @Post()
  create(@Body() input: CategoryDto) { return this.categories.create(input); }

  @Patch(":id")
  update(@Param("id", ParseIntPipe) id: number, @Body() input: CategoryDto) {
    return this.categories.update(id, input);
  }

  @Delete(":id")
  remove(@Param("id", ParseIntPipe) id: number) { return this.categories.remove(id); }
}
