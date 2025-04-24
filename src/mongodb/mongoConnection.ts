import Mongoose from 'mongoose'
import config from '../config/config.js'

const mongoConnection = (): void => {
  console.log('Connecting to MongoDB...', config.db.mongo.host)
  Mongoose.Promise = global.Promise
  Mongoose.set('strictQuery', true)
  Mongoose.connect(config.db.mongo.host||"")
    .then(() => {
      console.log('Database succeeded connection')
    })
    .catch((error: any) => {
      console.log('Failed connection to databases', error)
      process.exit()
    })
}

export { mongoConnection }
