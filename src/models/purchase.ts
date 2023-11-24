import Mongoose from 'mongoose'
import trade from './trade'

const schema = Mongoose.Schema

const getSchema = (company: string) => {
  const purchase = new Mongoose.Schema({
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
    supplier: {
      type: schema.Types.ObjectId,
      ref: `supplier_${company}`,
      required: false
    },
    products: [trade]
  })

  return purchase
}

export default getSchema
