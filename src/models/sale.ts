import { Schema } from 'mongoose'
import trade from './trade'

const getSchema = (): Schema => {
  const sale = new Schema({
    uuid: {
      type: String,
      default: ''
    },
    name: {
      type: String,
      required: false
    },
    nit: {
      type: String,
      required: false
    },
    total: {
      type: Number,
      required: true
    },
    date: {
      type: Date,
      required: true
    },
    description: {
      type: String,
      required: false
    },
    salesType: {
      type: String,
      required: true
    },
    direction: {
      type: String,
      default: ''
    },
    cancellationDate: {
      type: Date,
      required: false
    },
    canceled: {
      type: Boolean,
      default: false
    },
    uuidEmission: {
      type: String,
      default: ''
    },
    uuidCanceled: {
      type: String,
      default: ''
    },
    products: [trade]
  })

  return sale
}

export default getSchema
