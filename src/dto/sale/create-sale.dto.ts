import { Transform, Type } from 'class-transformer'
import {
  ArrayMinSize,
  IsArray,
  IsDate,
  IsMongoId,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min
} from 'class-validator'
import { TradeItemDto } from '../common/trade-item.dto'

export class CreateSaleDto {
  @IsNumber()
  @Min(0)
  total!: number

  @IsOptional()
  @IsString()
  @MaxLength(500)
  @Transform(({ value }) => value?.trim())
  description?: string

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim())
  clientName?: string

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim())
  clientNit?: string

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  date?: Date

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim())
  direction?: string

  @IsArray()
  @ArrayMinSize(1)
  @Type(() => TradeItemDto)
  products!: TradeItemDto[]

  @IsOptional()
  @IsMongoId({ message: 'Branch inválida' })
  branch?: string
}
