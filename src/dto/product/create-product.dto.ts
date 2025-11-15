import { Transform, Type } from 'class-transformer'
import {
  IsBoolean,
  IsDate,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
  Min
} from 'class-validator'

export class CreateProductDto {
  @IsString()
  @MaxLength(100)
  @Transform(({ value }) => value?.trim())
  name!: string

  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Transform(({ value }) => value?.trim())
  barcode?: string

  @IsNumber()
  @IsPositive()
  priceCost!: number

  @IsNumber()
  @IsPositive()
  salesPrice!: number

  @IsNumber()
  @Min(0)
  existence!: number

  @IsOptional()
  @IsNumber()
  @Min(0)
  minExistence?: number

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  expirationDate?: Date

  @IsOptional()
  @IsString()
  @MaxLength(200)
  @Transform(({ value }) => value?.trim())
  description?: string

  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Transform(({ value }) => value?.trim())
  ubication?: string

  @IsOptional()
  @IsMongoId({ message: 'Supplier inválido' })
  supplier?: string

  @IsOptional()
  @IsMongoId({ message: 'Branch inválido' })
  branch?: string

  @IsOptional()
  @IsBoolean()
  canModifyPrice?: boolean
}
