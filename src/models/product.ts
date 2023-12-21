import { Schema } from 'mongoose'

const getSchema = (company: string): Schema => {
  const product = new Schema({
    name: {
      type: String,
      required: true
    },
    barcode: {
      type: String,
      required: false
    },
    priceCost: {
      type: Number,
      required: true
    },
    salesPrice: {
      type: Number,
      required: true
    },
    existence: {
      type: Number,
      required: true,
      min: 0
    },
    minExistence: {
      type: Number,
      default: 0,
      min: 0
    },
    expirationDate: {
      type: Date,
      default: null
    },
    description: {
      type: String,
      default: null
    },
    ubication: {
      type: String,
      required: false,
      default: false
    },
    supplier: {
      type: Schema.Types.ObjectId,
      ref: `supplier_${company}`,
      default: null
    },
    branch: {
      type: Schema.Types.ObjectId,
      ref: `branch_${company}`,
      default: null
    }
  })
  product.index({ barcode: 1 }, { unique: true, sparse: true })
  product.index({ name: 1 }, { unique: true })
  return product
}

export default getSchema
