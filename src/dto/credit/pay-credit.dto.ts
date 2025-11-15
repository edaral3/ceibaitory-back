import { Type } from 'class-transformer'
import { IsDate, IsNumber, Min } from 'class-validator'

export class PayCreditDto {
  @IsNumber()
  @Min(0)
  amount!: number

  @Type(() => Date)
  @IsDate()
  date!: Date
}
