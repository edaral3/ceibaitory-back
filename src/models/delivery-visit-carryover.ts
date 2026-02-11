import { Schema } from 'mongoose'
import { v4 as uuid } from 'uuid'

const withIdTransform = (schema: Schema): void => {
  schema.set('toJSON', {
    virtuals: true,
    versionKey: false,
    transform: (_doc, ret) => {
      ret.id = ret._id
      delete ret._id
      return ret
    }
  })
  schema.set('toObject', {
    virtuals: true,
    versionKey: false,
    transform: (_doc, ret) => {
      ret.id = ret._id
      delete ret._id
      return ret
    }
  })
}

const getSchema = (company: string): Schema => {
  const carryover = new Schema(
    {
      _id: {
        type: String,
        default: uuid
      },
      clientId: {
        type: String,
        ref: `deliveryClient_${company}`,
        required: true
      }
    },
    {
      timestamps: true
    }
  )

  carryover.index({ clientId: 1 }, { unique: true })
  withIdTransform(carryover)

  return carryover
}

export default getSchema
