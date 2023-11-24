import Mongoose from 'mongoose'
import config from '../config/config'

const mongoConnection = (): void => {
  Mongoose.Promise = global.Promise
  Mongoose.set('strictQuery', true)
  Mongoose.connect(config.db.mongo.host)
    .then(() => {
      console.log('Database succeeded connection')
    })
    .catch((error: any) => {
      console.log('Failed connection to databases', error)
      process.exit()
    })
}

export { mongoConnection }
