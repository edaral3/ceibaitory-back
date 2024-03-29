const { Schema } = require( 'mongoose')
const trade = require('./trade')

const getSchema = (company: string): any => {
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

  return purchase
}

export default getSchema
