import { Schema } from 'mongoose'
import trade from './trade'

const getSchema = (company: string): Schema => {
  const Bill = new Schema({
    name: {
      type: String,
      required: false
    },
    nit: {
      type: String,
      required: false
    },
    direction: {
      type: String,
      required: false,
      default: null
    },
    uuid: {
      type: String,
      default: '',
      required: false
    },
    uuidEmission: {
      type: String,
      required: false,
      default: null
    },
    uuidCanceled: {
      type: String,
      required: false,
      default: null
    }
  })

  const sale = new Schema({
    bill: {
      type: Bill,
      required: false,
      default: null
    },
    total: {
      type: Number,
      required: true
    },
    date: {
      type: Date,
      required: true
    },
    description: {
      type: String,
      default: null
    },
    salesType: {
      type: String,
      default: null
    },
    cancellationDate: {
      type: Date,
      default: null
    },
    canceled: {
      type: Boolean,
      default: false
    },
    branch: {
      type: Schema.Types.ObjectId,
      ref: `branch_${company}`,
      default: null
    },
    products: [trade]
  })

  sale.index({ date: -1 })
  sale.index({ branch: 1, date: -1 })
  return sale
}

export default getSchema
