const config = {
	db: {
		mongo:{
			host: process.env.DB_MONGO_HOST || 'mongodb+srv://ceibai:ceibai@ceibai.qpabkx2.mongodb.net',
		},
		redis: {
			host: process.env.DB_REDIS_HOST || 'redis-16432.c299.asia-northeast1-1.gce.cloud.redislabs.com:16432',
			password: process.env.DB_REDIS_PASSWORD || 'Ceibai1@',
			port: process.env.DB_REDIS_PORT || '16432',
		}
	},
	secret: process.env.SECRET
}

export default config;