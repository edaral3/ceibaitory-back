import { Transform } from 'class-transformer'
import {
  IsOptional,
  IsString,
  MaxLength
} from 'class-validator'

export class CreateBranchDto {
  @IsString()
  @MaxLength(50)
  @Transform(({ value }) => value?.trim())
  name!: string

  @IsOptional()
  @IsString()
  @MaxLength(500)
  @Transform(({ value }) => value?.trim())
  direction?: string

  @IsOptional()
  @IsString()
  @MaxLength(50)
  @Transform(({ value }) => value?.trim())
  phone?: string
}
