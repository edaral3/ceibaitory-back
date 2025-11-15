import { Schema } from 'mongoose'

const getSchema = (company: string): Schema => {
  const storeItem = new Schema({
    productId: {
      type: Schema.Types.ObjectId,
      ref: `product_${company}`,
      required: true
    },
    amount: {
      type: Number,
      required: true
    },
    ubication: {
      type: Schema.Types.ObjectId,
      ref: `store_${company}`,
      required: true
    }
  })

  storeItem.index({ ubication: 1, productId: 1 }, { unique: true })
  storeItem.index({ ubication: 1 })
  return storeItem
}

export default getSchema
