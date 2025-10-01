import { Schema } from 'mongoose'

const getSchema = (): Schema => {
  const sale = new Schema({
    type: {
      type: String,
      required: true
    },
    price: {
      type: Number,
      required: true
    }
  })

  return sale
}

export default getSchema
