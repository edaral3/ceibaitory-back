import { Transform, Type } from 'class-transformer'
import {
  IsMongoId,
  IsNumber,
  IsPositive,
  IsString,
  MaxLength
} from 'class-validator'

export class CreateBatchDto {
  @IsMongoId({ message: 'Shed inválido' })
  @Transform(({ value }) => value?.trim())
  shedId!: string

  @Type(() => Date)
  startDate!: Date

  @IsMongoId({ message: 'Bodega de concentrado inválida' })
  @Transform(({ value }) => value?.trim())
  concentrateStoreId!: string

  @IsMongoId({ message: 'Empleado inválido' })
  @Transform(({ value }) => value?.trim())
  employeeId!: string

  @IsNumber()
  @IsPositive()
  initialChickenAmount!: number
}
