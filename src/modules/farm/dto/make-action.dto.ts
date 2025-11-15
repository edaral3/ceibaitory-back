import { Transform } from 'class-transformer'
import {
  IsEnum,
  IsMongoId,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength
} from 'class-validator'
import BatchInfoTypeEnum from '../../../enum/batch-info-type.enum'

export class MakeActionDto {
  @IsMongoId({ message: 'Batch inválido' })
  @Transform(({ value }) => value?.trim())
  batchId!: string

  @IsEnum(BatchInfoTypeEnum)
  action!: BatchInfoTypeEnum

  @IsOptional()
  @IsNumber()
  @Min(0)
  amount?: number

  @IsOptional()
  @IsNumber()
  price?: number

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string

  @IsOptional()
  @IsString()
  @MaxLength(50)
  @Transform(({ obj, value }) => value ?? obj.type)
  typeConcentrate?: string
}
