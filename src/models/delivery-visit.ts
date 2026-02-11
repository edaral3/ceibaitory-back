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
  const visit = new Schema(
    {
      _id: {
        type: String,
        default: uuid
      },
      clientId: {
        type: String,
        ref: `deliveryClient_${company}`,
        required: true
      },
      date: {
        type: String,
        required: true
      },
      visited: {
        type: Boolean,
        default: false
      },
      visitedAt: {
        type: Date,
        default: null
      }
    },
    {
      timestamps: true
    }
  )

  visit.index({ clientId: 1, date: 1 }, { unique: true })
  visit.index({ date: 1 })
  withIdTransform(visit)

  return visit
}

export default getSchema
