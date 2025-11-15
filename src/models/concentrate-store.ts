import { Schema } from 'mongoose'

const getSchema = (): Schema => {
  const store = new Schema({
    amount: {
      type: [Number],
      required: true
    },
    price: {
      type: [Number],
      required: true
    },
    type: {
      type: [String]
    },
    owner: {
      type: String,
      required: true
    },
    deleted: {
      type: Boolean,
      default: false
    }
  })

  return store
}

export default getSchema
