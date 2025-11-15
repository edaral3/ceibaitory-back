import { Transform } from 'class-transformer'
import { IsString, MaxLength, MinLength } from 'class-validator'

export class LoginDto {
  @IsString()
  @MaxLength(50)
  @Transform(({ value }) => value?.trim())
  user!: string

  @IsString()
  @MinLength(1)
  pwd!: string
}
