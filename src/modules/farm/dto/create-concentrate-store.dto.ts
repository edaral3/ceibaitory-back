import { Transform } from 'class-transformer'
import { IsNumber, IsOptional, IsString, MaxLength, Min } from 'class-validator'

export class CreateConcentrateStoreDto {
  @IsString()
  @MaxLength(100)
  @Transform(({ value }) => value?.trim())
  owner!: string

  @IsOptional()
  @IsNumber()
  @Min(0)
  amount!: number 

  @IsOptional()
  @IsNumber()
  @Min(0)
  price!: number

  @IsOptional()
  @IsString()
  @MaxLength(50)
  @Transform(({ value }) => value?.trim())
  type!: string
}
