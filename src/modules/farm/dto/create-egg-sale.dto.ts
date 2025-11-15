import { Type, Transform } from 'class-transformer'
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsEnum,
  IsNumber,
  IsPositive,
  IsString,
  MaxLength,
  MinLength,
  ValidateNested
} from 'class-validator'

enum EggSaleType {
  CAJA = 'caja',
  CARTON = 'carton'
}

class EggSaleItemDto {
  @IsString()
  @MaxLength(50)
  @MinLength(1)
  @Transform(({ value }) => value?.trim())
  size!: string

  @IsString()
  @Transform(({ value }) => value?.trim())
  type!: string

  @IsNumber()
  @IsPositive()
  amount!: number
}

export class CreateEggSaleDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => EggSaleItemDto)
  data!: EggSaleItemDto[]

  @IsDateString()
  saleDate!: string
}
