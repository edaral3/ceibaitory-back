import { IsIn, IsMongoId } from 'class-validator'

export class DeleteActionDto {
  @IsMongoId()
  id!: string

  @IsIn(['concentrado', 'venta'])
  action!: 'concentrado' | 'venta'
}
