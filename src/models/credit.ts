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

  const credit = new Schema({
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
    reminder: {
      type: String,
      required: false
    },
    client: {
      type: Schema.Types.ObjectId,
      ref: `client_${company}`,
      require: true
    },
    payments: [payments],
    products: [trade]
  })
  return credit
}

export default getSchema
