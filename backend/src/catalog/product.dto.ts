import { Type } from "class-transformer";
import {
  ArrayMinSize, IsArray, IsInt, IsOptional, IsString, Min, MinLength, ValidateNested,
} from "class-validator";

export class VariantSizeDto {
  @IsString() @MinLength(1) size!: string;
  @IsInt() @Min(0) stock!: number;
}

export class ProductVariantDto {
  @IsString() @MinLength(1) name!: string;
  @IsString() @MinLength(1) value!: string;
  @IsOptional() @IsArray() @IsString({ each: true }) images?: string[];
  @IsArray() @ArrayMinSize(1) @ValidateNested({ each: true }) @Type(() => VariantSizeDto)
  sizes!: VariantSizeDto[];
}

export class CreateProductDto {
  @IsString() @MinLength(2) name!: string;
  @IsString() description!: string;
  @IsInt() @Min(0) price!: number;
  @IsInt() @Min(0) costPrice!: number;
  @IsString() @MinLength(1) image!: string;
  @IsInt() @Min(1) categoryId!: number;
  @IsArray() @ArrayMinSize(1) @ValidateNested({ each: true }) @Type(() => ProductVariantDto)
  variants!: ProductVariantDto[];
  @IsOptional() @IsArray() @IsString({ each: true }) tags?: string[];
}

export class UpdateProductDto {
  @IsOptional() @IsString() @MinLength(2) name?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsInt() @Min(0) price?: number;
  @IsOptional() @IsInt() @Min(0) costPrice?: number;
  @IsOptional() @IsString() @MinLength(1) image?: string;
  @IsOptional() @IsInt() @Min(1) categoryId?: number;
  @IsOptional() @IsArray() @ArrayMinSize(1) @ValidateNested({ each: true }) @Type(() => ProductVariantDto)
  variants?: ProductVariantDto[];
  @IsOptional() @IsArray() @IsString({ each: true }) tags?: string[];
}
