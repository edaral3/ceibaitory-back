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
  const sale = new Schema(
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
      eggType: {
        type: String,
        enum: ['caja', 'carton'],
        required: true
      },
      eggSize: {
        type: String,
        required: false
      },
      unitPrice: {
        type: Number,
        required: false
      },
      items: [
        {
          eggType: {
            type: String,
            enum: ['caja', 'carton'],
            required: true
          },
          eggSize: {
            type: String,
            required: true
          },
          quantity: {
            type: Number,
            required: true
          },
          unitPrice: {
            type: Number,
            required: true
          },
          lineTotal: {
            type: Number,
            required: true
          }
        }
      ],
      quantity: {
        type: Number,
        required: false
      },
      total: {
        type: Number,
        required: true
      },
      soldAt: {
        type: Date,
        default: Date.now
      },
      payments: [
        {
          amount: {
            type: Number,
            required: true
          },
          paidAt: {
            type: Date,
            default: Date.now
          },
          note: {
            type: String,
            required: false
          }
        }
      ],
      status: {
        type: String,
        enum: ['pending', 'paid', 'cancelled'],
        default: 'pending'
      },
      paidAt: {
        type: Date,
        default: null
      }
    },
    {
      timestamps: true
    }
  )

  sale.index({ clientId: 1 })
  sale.index({ soldAt: 1 })
  withIdTransform(sale)

  return sale
}

export default getSchema
