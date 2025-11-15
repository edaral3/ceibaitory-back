import { Schema } from 'mongoose'

const getSchema = (company: string): Schema => {
  const storeHistory = new Schema({
    products: [{
      type: Schema.Types.ObjectId,
      ref: `product_${company}`,
      required: true
    }],
    amount: [{
      type: Number,
      required: true
    }],
    ubication: {
      type: Schema.Types.ObjectId,
      ref: `store_${company}`,
      required: false
    },
    type: {
      type: String,
      enum: ['IN', 'OUT', 'MOVE'],
      required: true
    },
    destinyUbication: {
      type: Schema.Types.ObjectId,
      ref: `store_${company}`,
      required: false
    },
    branch: {
      type: Schema.Types.ObjectId,
      ref: `branch_${company}`,
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now,
      required: true
    }
  })

  return storeHistory
}

export default getSchema
