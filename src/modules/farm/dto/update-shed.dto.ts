import { PartialType } from '@nestjs/mapped-types'
import { CreateShedDto } from './create-shed.dto'

export class UpdateShedDto extends PartialType(CreateShedDto) {}
