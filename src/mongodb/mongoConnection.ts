import Mongoose from 'mongoose'
import config from '../config/config'

export const mongoConnection = async (): Promise<void> => {
  const uri = config.db.mongo.host
  if (!uri) {
    throw new Error('Mongo connection string is not configured (DB_MONGO_HOST).')
  }

  Mongoose.Promise = global.Promise
  Mongoose.set('strictQuery', true)

  try {
    await Mongoose.connect(uri)
    console.log('Database succeeded connection')
  } catch (error) {
    console.error('Failed connection to databases', error)
    throw error
  }
}
