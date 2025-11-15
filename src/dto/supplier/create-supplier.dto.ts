import { Transform } from 'class-transformer'
import {
  IsOptional,
  IsString,
  MaxLength
} from 'class-validator'

export class CreateSupplierDto {
  @IsString()
  @MaxLength(50)
  @Transform(({ value }) => value?.trim())
  name!: string

  @IsOptional()
  @IsString()
  @MaxLength(50)
  @Transform(({ value }) => value?.trim())
  email?: string

  @IsString()
  @MaxLength(50)
  @Transform(({ value }) => value?.trim())
  phone!: string

  @IsOptional()
  @IsString()
  @MaxLength(50)
  @Transform(({ value }) => value?.trim())
  companyName?: string

  @IsOptional()
  @IsString()
  @MaxLength(500)
  @Transform(({ value }) => value?.trim())
  description?: string
}
