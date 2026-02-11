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

const getSchema = (): Schema => {
  const schema = new Schema(
    {
      _id: {
        type: String,
        default: uuid
      },
      key: {
        type: String,
        default: 'default'
      },
      balance: {
        type: Number,
        default: 0
      }
    },
    { timestamps: true }
  )

  schema.index({ key: 1 }, { unique: true })
  withIdTransform(schema)

  return schema
}

export default getSchema
