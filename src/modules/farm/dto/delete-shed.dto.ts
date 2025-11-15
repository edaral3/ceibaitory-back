import { Transform } from 'class-transformer'
import { IsMongoId } from 'class-validator'

export class DeleteShedDto {
  @IsMongoId({ message: 'Identificador de galera inválido' })
  @Transform(({ value }) => value?.trim())
  id!: string
}
