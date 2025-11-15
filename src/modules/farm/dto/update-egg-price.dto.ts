import { Transform } from 'class-transformer'
import { IsMongoId, IsNumber, Min } from 'class-validator'

export class UpdateEggPriceDto {
  @IsMongoId({ message: 'Identificador de huevo inválido' })
  @Transform(({ value }) => value?.trim())
  id!: string

  @IsNumber()
  @Min(0)
  price!: number
}
