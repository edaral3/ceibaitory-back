import { Schema } from 'mongoose'
import trade from './trade'

const getSchema = (company: string): Schema => {
  const purchase = new Schema({
    date: {
      type: Date,
      required: true
    },
    total: {
      type: Number,
      required: true
    },
    description: {
      type: String,
      required: false
    },
    cancellationDate: {
      type: Date,
      default: null
    },
    canceled: {
      type: Boolean,
      default: false
    },
    supplier: {
      type: Schema.Types.ObjectId,
      ref: `supplier_${company}`,
      required: false
    },
    branch: {
      type: Schema.Types.ObjectId,
      ref: `branch_${company}`,
      default: null
    },
    products: [trade]
  })

  purchase.index({ date: -1 })
  purchase.index({ supplier: 1, date: -1 })
  return purchase
}

export default getSchema
