import { createClient } from 'redis'
import config from '../config/config'

const redisConfig = config.db.redis
let redisClient: any
const redisConnection = (): any => {
  if (redisClient) return redisClient

  redisClient = createClient({
    password: redisConfig.password,
    socket: {
      host: redisConfig.host,
      port: Number(redisConfig.port)
    }
  })
  return redisClient
}

export { redisConnection }
