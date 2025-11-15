import { Transform } from 'class-transformer'
import {
  IsBoolean,
  IsOptional,
  IsString,
  MaxLength,
  MinLength
} from 'class-validator'

export class CreateOwnerUserDto {
  @IsString()
  @MaxLength(50)
  @Transform(({ value }) => value?.trim())
  user!: string

  @IsString()
  @MaxLength(50)
  @Transform(({ value }) => value?.trim())
  name!: string

  @IsString()
  @MaxLength(50)
  @Transform(({ value }) => value?.trim())
  companyName!: string

  @IsString()
  @MinLength(1)
  pwd!: string

  @IsOptional()
  @IsString()
  @MaxLength(50)
  @Transform(({ value }) => value?.trim())
  phone?: string

  @IsOptional()
  @IsString()
  @MaxLength(50)
  @Transform(({ value }) => value?.trim())
  phoneCompany?: string

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim())
  direction?: string

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value === 'true'
    }
    return value
  })
  isFarm?: boolean
}
