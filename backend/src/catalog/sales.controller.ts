import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { CreateSaleDto } from "./sale.dto";
import { SaleService } from "./sale.service";

@Controller("admin/sales")
@UseGuards(AuthGuard("jwt"))
export class SalesController {
  constructor(private readonly sales: SaleService) {}

  @Get()
  list() { return this.sales.list(); }

  @Post()
  create(@Body() sale: CreateSaleDto) { return this.sales.create(sale); }

  @Delete(":id")
  remove(@Param("id", ParseIntPipe) id: number) { return this.sales.remove(id); }
}
