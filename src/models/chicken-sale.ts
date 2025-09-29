import { Schema } from 'mongoose'

const getSchema = (company: string): Schema => {
  const sale = new Schema({
    client: {
      type: Schema.Types.ObjectId,
      ref: `client_${company}`,
      require: true
    },
    date: {
      type: Date,
      default: Date.now,
    },
    chickenAmount: {
      type: Number,
      required: true
    },
    weight: {
      type: Number,
      required: true
    },
    total: {
      type: Number,
      required: true
    },
    averageWeight: {
      type: Number,
      required: true
    },
    paid: {
      type: Boolean,
      default: false
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  })

  return sale
}

export default getSchema
