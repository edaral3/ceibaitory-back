import { Schema } from 'mongoose'

const getSchema = (): Schema => {
  const sale = new Schema({
    date: {
      type: Date,
      default: Date.now,
    },
    size: {
      type: [String],
      required: true
    },
    type: {
      type: [String],
      required: true
    },
    amount: {
      type: [Number],
      required: true
    },
    price: {
      type: [Number],
      required: true
    },
    total: {
      type: Number,
      required: true
    },
    paidAmount: {
      type: Number,
      default: 0
    },
    paid: {
      type: Boolean,
      default: false
    },
    paidAt: {
      type: Date,
      default: null
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  })

  return sale
}

export default getSchema
