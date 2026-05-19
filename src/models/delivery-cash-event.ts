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
      eventType: {
        type: String,
        enum: [
          'driver_cash_received',
          'driver_cash_reversal',
          'cash_received',
          'egg_payment',
          'egg_payment_reversal',
          'daily_reset'
        ],
        required: true
      },
      dateKey: {
        type: String,
        required: true
      },
      amount: {
        type: Number,
        default: 0
      },
      deliveryBalance: {
        type: Number,
        default: 0
      },
      driverReceivedCash: {
        type: Number,
        default: 0
      },
      adminReceivedCash: {
        type: Number,
        default: 0
      },
      receivedCash: {
        type: Number,
        default: 0
      },
      difference: {
        type: Number,
        default: 0
      },
      cashBefore: {
        type: Number,
        default: 0
      },
      cashAfter: {
        type: Number,
        default: 0
      },
      eggSaleId: {
        type: String,
        default: null
      },
      eggSaleTotal: {
        type: Number,
        default: null
      },
      note: {
        type: String,
        default: ''
      }
    },
    { timestamps: true }
  )

  schema.index({ dateKey: -1, createdAt: -1 })
  schema.index({ eventType: 1, createdAt: -1 })
  withIdTransform(schema)

  return schema
}

export default getSchema
