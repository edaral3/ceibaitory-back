import { Type } from 'class-transformer'
import {
  ArrayNotEmpty,
  IsArray,
  IsDateString,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  Min,
  ValidateNested
} from 'class-validator'

class ChickenBatchItemDto {
  @IsMongoId()
  @IsNotEmpty()
  shed!: string

  @IsNumber()
  @Min(1)
  amount!: number

  @IsNumber()
  @Min(0)
  pound!: number
}

export class CreateChickenSaleDto {
  @IsMongoId()
  clientId!: string

  @IsDateString()
  saleDate!: string

  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => ChickenBatchItemDto)
  chickenBatch!: ChickenBatchItemDto[]
}
