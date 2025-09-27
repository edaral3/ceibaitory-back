import { Schema } from 'mongoose'

import mongoose from 'mongoose'
import mongooseSequence from 'mongoose-sequence'

const AutoIncrement = mongooseSequence(mongoose);
const getSchema = (): Schema => {
  const store = new Schema({
    storeId: {
      type: Number,
      unique: true
    },
    amount: {
      type: [Number],
      required: true
    },
    price: {
      type: [Number],
      required: true
    },
    owner: {
      type: String,
      required: true
    }
  })

  store.plugin(AutoIncrement, { inc_field: 'storeId' });

  return store
}

export default getSchema
