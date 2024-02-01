import { Schema } from 'mongoose'
import trade from './trade'

const getSchema = (company: string): Schema => {
  const payments = new Schema({
    date: {
      type: Date,
      required: true
    },
    amount: {
      type: Number,
      required: true
    }
  })

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

  const credit = new Schema({
    bill: {
      type: Bill,
      required: false,
      default: null
    },
    state: {
      type: Number,
      default: 0
    },
    date: {
      type: Date,
      required: true
    },
    total: {
      type: Number,
      required: true
    },
    paid: {
      type: Number,
      default: 0
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
    reminder: {
      type: String,
      required: false
    },
    client: {
      type: Schema.Types.ObjectId,
      ref: `client_${company}`,
      require: true
    },
    branch: {
      type: Schema.Types.ObjectId,
      ref: `branch_${company}`,
      default: null
    },
    payments: [payments],
    products: [trade]
  })
  return credit
}

export default getSchema
