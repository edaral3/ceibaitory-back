import * as dotenv from 'dotenv'

dotenv.config()

const DEFAULT_CORS = [
  'https://ceibaitory.com',
  'https://ceibaitory.vercel.app',
  'http://localhost:3000'
]

const parseCorsOrigins = (value?: string | string[]): string[] => {
  if (Array.isArray(value)) {
    return value
  }
  if (typeof value === 'string' && value.trim() !== '') {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
  }
  return DEFAULT_CORS
}

export default () => ({
  app: {
    port: Number(process.env.PORT) || 3000,
    corsOrigins: parseCorsOrigins(process.env.CORS_ORIGINS),
    corsMethods: ['GET', 'POST', 'DELETE', 'UPDATE', 'PUT'],
    corsHeaders: ['authorization', 'Content-Type', 'user', 'pwd', '*']
  },
  database: {
    mongoUri: process.env.DB_MONGO_HOST ?? ''
  },
  security: {
    jwtSecret: process.env.SECRET ?? ''
  },
  integrations: {
    deepseekApiKey: process.env.DEEPSEEK_API_KEY ?? ''
  }
})
