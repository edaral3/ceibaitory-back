import { Transform } from 'class-transformer'
import {
  IsArray,
  IsBoolean,
  IsMongoId,
  IsOptional,
  IsString,
  MaxLength,
  MinLength
} from 'class-validator'

export class CreateUserDto {
  @IsString()
  @MaxLength(50)
  @Transform(({ value }) => value?.trim())
  user!: string

  @IsString()
  @MaxLength(50)
  @Transform(({ value }) => value?.trim())
  name!: string

  @IsString()
  @MinLength(1)
  pwd!: string

  @IsOptional()
  @IsString()
  type?: string

  @IsOptional()
  @IsString()
  @MaxLength(50)
  @Transform(({ value }) => value?.trim())
  phone?: string

  @IsMongoId({ message: 'Company inválida' })
  company!: string

  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true, message: 'Branch inválida' })
  branch?: string[]

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
