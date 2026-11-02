import { Type } from "class-transformer";
import { ArrayMinSize, IsArray, IsInt, IsString, Min, MinLength, ValidateNested } from "class-validator";

export class SaleLineDto {
  @IsInt() @Min(1) productId!: number;
  @IsInt() @Min(0) variantIndex!: number;
  @IsString() @MinLength(1) size!: string;
  @IsInt() @Min(1) quantity!: number;
}

export class CreateSaleDto {
  @IsArray() @ArrayMinSize(1) @ValidateNested({ each: true }) @Type(() => SaleLineDto)
  items!: SaleLineDto[];
}
