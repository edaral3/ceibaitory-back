import { Schema } from 'mongoose'
import mongoose from 'mongoose'
import mongooseSequence from 'mongoose-sequence'
import ConcentrateStoreInfoEnum from '../enum/concentrate-store-info.enum';

const AutoIncrement = mongooseSequence(mongoose);

const getSchema = (company: string): Schema => {
  const store = new Schema({
    concentrateStore: {
      type: Schema.Types.ObjectId,
      ref: `concentrateStore_${company}`,
      default: null
    },
    type: {
      type: String,
      enum: ConcentrateStoreInfoEnum,
    },
    amount: {
      type: [Number]
    },
    price: {
      type: [Number]
    },
    date: {
      type: Date,
      default: Date.now
    }
  })

  return store
}

export default getSchema
