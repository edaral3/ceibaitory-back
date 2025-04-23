import { createClient } from 'redis'
import config from '../config/config.js'

const redisConfig = config.db.redis
let redisClient: any
const redisConnection = async () => {
  if (redisClient) return redisClient

  redisClient = createClient({
    password: redisConfig.password,
    socket: {
      host: redisConfig.host,
      port: Number(redisConfig.port)
    }
  })
  return await redisClient.connect()
}

export { redisConnection }
