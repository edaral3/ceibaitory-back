import { Type } from 'class-transformer'
import { IsDate } from 'class-validator'

export class EggSalesBetweenDto {
  @Type(() => Date)
  @IsDate()
  startDate!: Date

  @Type(() => Date)
  @IsDate()
  endDate!: Date
}
