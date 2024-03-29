const dotenv = require( 'dotenv')
dotenv.config()

const config = {
  db: {
    mongo: {
      host: process.env.DB_MONGO_HOST
    },
    redis: {
      host: process.env.DB_REDIS_HOST,
      password: process.env.DB_REDIS_PASSWORD,
      port: process.env.DB_REDIS_PORT
    }
  },
  secret: process.env.SECRET
}

export default config
