import { Schema } from 'mongoose'

const getSchema = (company: string): Schema => {
  const store = new Schema({
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
      type: String,
      required: true
    }
  })

  return store
}

export default getSchema
