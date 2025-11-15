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

export class CreateCreditDto {
  @IsNumber()
  @Min(0)
  total!: number

  @IsOptional()
  @IsString()
  @MaxLength(500)
  @Transform(({ value }) => value?.trim())
  description?: string

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  date?: Date

  @IsMongoId({ message: 'Cliente inválido' })
  client!: string

  @IsArray()
  @ArrayMinSize(1)
  @Type(() => TradeItemDto)
  products!: TradeItemDto[]

  @IsOptional()
  @IsMongoId({ message: 'Branch inválida' })
  branch?: string
}
