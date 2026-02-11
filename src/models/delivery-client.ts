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
  const client = new Schema(
    {
      _id: {
        type: String,
        default: uuid
      },
      name: {
        type: String,
        required: true
      },
      description: {
        type: String,
        required: false
      },
      addressText: {
        type: String,
        required: true
      },
      phone: {
        type: String,
        required: true
      },
      mapUrl: {
        type: String,
        required: true
      },
      photoUrl: {
        type: String,
        required: false
      },
      lat: {
        type: Number,
        required: false
      },
      lng: {
        type: Number,
        required: false
      },
      visitDays: {
        type: [String],
        required: false,
        default: []
      },
      visitFrequency: {
        type: String,
        required: false
      },
      deletedAt: {
        type: Date,
        default: null
      }
    },
    {
      timestamps: true
    }
  )

  client.index({ name: 1 })
  client.index({ createdAt: 1 })
  withIdTransform(client)

  return client
}

export default getSchema
