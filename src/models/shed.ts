import { Schema } from 'mongoose'
import BirdTypeEnum from '../enum/bird-type.enum'

const getSchema = (): Schema => {
  const shed = new Schema({
    shedNumber: {
      type: String,
      required: true
    },
    birdType: {
      type: String,
      enum: BirdTypeEnum,
      required: true
    },
    deleted: {
      type: Boolean,
      default: false
    }
  })

  return shed
}

export default getSchema
