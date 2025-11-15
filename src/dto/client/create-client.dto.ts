import { Transform } from 'class-transformer'
import {
  IsEmail,
  IsMongoId,
  IsOptional,
  IsString,
  MaxLength
} from 'class-validator'

export class CreateClientDto {
  @IsString()
  @MaxLength(50)
  @Transform(({ value }) => value?.trim())
  name!: string

  @IsOptional()
  @IsString()
  @MaxLength(50)
  @Transform(({ value }) => value?.trim())
  nit?: string

  @IsOptional()
  @IsString()
  @MaxLength(500)
  @Transform(({ value }) => value?.trim())
  direction?: string

  @IsString()
  @MaxLength(50)
  @Transform(({ value }) => value?.trim())
  phone!: string

  @IsOptional()
  @IsEmail()
  @MaxLength(50)
  @Transform(({ value }) => value?.trim())
  email?: string

  @IsOptional()
  @IsMongoId({ message: 'Branch inválida' })
  branch?: string
}
