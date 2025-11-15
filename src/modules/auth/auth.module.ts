import { Module } from '@nestjs/common'
import { AuthController } from './auth.controller'
import { AuthService } from './auth.service'
import { RequestContextModule } from '../../core/context/context.module'
import { AppConfigModule } from '../../core/config/config.module'

@Module({
  imports: [RequestContextModule, AppConfigModule],
  controllers: [AuthController],
  providers: [AuthService]
})
export class AuthModule {}
