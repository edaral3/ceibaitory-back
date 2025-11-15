import { Transform } from 'class-transformer'
import {
  IsMongoId,
  IsOptional,
  IsString
} from 'class-validator'

export class ObjectIdDto {
  @IsString()
  @IsMongoId({ message: 'El identificador enviado no es válido' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  id!: string
}
