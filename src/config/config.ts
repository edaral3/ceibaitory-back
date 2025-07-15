import * as dotenv from 'dotenv'
dotenv.config()

const config = {
  db: {
    mongo: {
      host: process.env.DB_MONGO_HOST || ""
    },
  },
  secret: process.env.SECRET || "",
  deepseekApiKey: process.env.DEEPSEEK_API_KEY || "",
}

export default config
