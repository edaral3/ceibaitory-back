import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

@Injectable()
export class AppConfigService {
  constructor (private readonly configService: ConfigService) {}

  get port (): number {
    return this.configService.get<number>('app.port', 3000)
  }

  get corsOrigins (): string[] {
    return this.configService.get<string[]>('app.corsOrigins', [])
  }

  get corsMethods (): string[] {
    return this.configService.get<string[]>('app.corsMethods', ['GET', 'POST'])
  }

  get corsHeaders (): string[] {
    return this.configService.get<string[]>('app.corsHeaders', ['authorization'])
  }

  get mongoUri (): string {
    return this.configService.get<string>('database.mongoUri', '')
  }

  get jwtSecret (): string {
    return this.configService.get<string>('security.jwtSecret', '')
  }

  get deepseekApiKey (): string {
    return this.configService.get<string>('integrations.deepseekApiKey', '')
  }
}
