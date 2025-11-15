import 'reflect-metadata'
import { ValidationPipe } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import {
  FastifyAdapter,
  NestFastifyApplication
} from '@nestjs/platform-fastify'
import fastifyCors from '@fastify/cors'
import { AppModule } from './app.module'
import { AppConfigService } from './core/config/app-config.service'
import { mongoConnection } from './mongodb/mongoConnection'

async function bootstrap (): Promise<void> {
  await mongoConnection()

  const fastifyAdapter = new FastifyAdapter({
    ignoreTrailingSlash: true
  })
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    fastifyAdapter
  )

  const configService = app.get(AppConfigService)

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true }
    })
  )

  await app.register(fastifyCors as any, {
    origin: configService.corsOrigins,
    methods: configService.corsMethods,
    allowedHeaders: configService.corsHeaders,
    credentials: true
  })

  await app.listen({ port: configService.port, host: '0.0.0.0' })
  const url = await app.getUrl()
  console.log(`🚀 Application running on ${url}`)
}

bootstrap().catch((error) => {
  console.error('Error starting application', error)
  process.exit(1)
})
