const config = {
  db: {
    mongo: {
      host: process.env.DB_MONGO_HOST ?? 'mongodb+srv://ceibai:ceibai@ceibai.qpabkx2.mongodb.net/ceibaitory'
    },
    redis: {
      host: process.env.DB_REDIS_HOST ?? 'redis-12268.c299.asia-northeast1-1.gce.cloud.redislabs.com',
      password: process.env.DB_REDIS_PASSWORD ?? 'MRNAr9AZpolMrqAQPH0lKNbUOZLemGyr',
      port: process.env.DB_REDIS_PORT ?? '12268'
    }
  },
  secret: process.env.SECRET ?? 'secret'
}

export default config
