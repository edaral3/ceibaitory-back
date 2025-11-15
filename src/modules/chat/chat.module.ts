import { Module } from '@nestjs/common'
import { ChatController } from './chat.controller'
import { ChatService } from './chat.service'
import { RequestContextModule } from '../../core/context/context.module'
import { AppConfigModule } from '../../core/config/config.module'

@Module({
  imports: [RequestContextModule, AppConfigModule],
  controllers: [ChatController],
  providers: [ChatService]
})
export class ChatModule {}
