import { Type, Transform } from 'class-transformer'
import {
  IsBoolean,
  IsMongoId,
  IsNumber,
  IsOptional,
  IsPositive,
  ValidateNested
} from 'class-validator'
import BirdTypeEnum from '../../../enum/bird-type.enum'

class BatchShedDto {
  @IsMongoId({ message: 'Shed inválido' })
  @Transform(({ value }) => value?.trim())
  _id!: string

  @IsOptional()
  birdType?: BirdTypeEnum
}

export class UpdateBatchDto {
  @IsMongoId({ message: 'Batch inválido' })
  @Transform(({ value }) => value?.trim())
  batchId!: string

  @ValidateNested()
  @Type(() => BatchShedDto)
  shed!: BatchShedDto

  @Type(() => Date)
  startDate!: Date

  @IsMongoId({ message: 'Bodega de concentrado inválida' })
  @Transform(({ value }) => value?.trim())
  concentrateStore!: string

  @IsMongoId({ message: 'Empleado inválido' })
  @Transform(({ value }) => value?.trim())
  employees!: string

  @IsNumber()
  @IsPositive()
  initialChickenAmount!: number

  @IsOptional()
  @IsBoolean()
  state?: boolean
}
