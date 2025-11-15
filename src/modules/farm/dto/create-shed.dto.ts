import { Transform } from 'class-transformer'
import { IsEnum, IsString, MaxLength } from 'class-validator'
import BirdTypeEnum from '../../../enum/bird-type.enum'

export class CreateShedDto {
  @IsString()
  @MaxLength(50)
  @Transform(({ value }) => value?.trim())
  shedNumber!: string

  @IsEnum(BirdTypeEnum, {
    message: `birdType debe ser uno de: ${Object.values(BirdTypeEnum).join(', ')}`
  })
  birdType!: BirdTypeEnum
}
