import { BadRequestException } from '@nestjs/common'
import { isValidObjectId } from 'mongoose'

export const ensureValidObjectId = (
  id: string,
  message = 'El identificador enviado no es válido'
): void => {
  if (!isValidObjectId(id)) {
    throw new BadRequestException(message)
  }
}
