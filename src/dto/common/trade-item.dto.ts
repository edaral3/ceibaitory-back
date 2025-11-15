import { Transform, Type } from 'class-transformer'
import {
  IsDate,
  IsMongoId,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength
} from 'class-validator'

export class TradeItemDto {
  @IsMongoId({ message: 'Producto inválido' })
  @Transform(({ obj }) => obj._id ?? obj.productId ?? obj.product ?? obj.id)
  _id!: string

  @IsString()
  @MaxLength(50)
  @MinLength(1)
  @Transform(({ value }) => value?.trim())
  name!: string

  @IsNumber()
  @Min(0)
  amount!: number

  @IsNumber()
  @Min(0)
  priceCost!: number

  @IsOptional()
  @IsNumber()
  @Min(0)
  salesPrice?: number

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  expirationDate?: Date
}
