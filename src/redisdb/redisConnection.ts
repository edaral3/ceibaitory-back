const { createClient } = require( 'redis')

let redisClient: any
const redisConnection = async () => {
  if (redisClient) return redisClient
  const {db} = require( '../config/config')

  const redisConfig = db.redis || ""
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
