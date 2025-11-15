import { Body, Controller, Post, UseGuards } from '@nestjs/common'
import { ChatService } from './chat.service'
import { JwtAuthGuard } from '../../core/auth/jwt-auth.guard'
import { Roles } from '../../core/auth/roles.decorator'
import { UseCollection } from '../../core/decorators/collection.decorator'

@Controller('chat')
@UseGuards(JwtAuthGuard)
@UseCollection('product')
export class ChatController {
  constructor (private readonly chatService: ChatService) {}

  @Post()
  @Roles('owner', 'admin', 'vendedor', 'seller')
  chat (@Body() body: { messages: any[] }): Promise<any> {
    return this.chatService.createChatCompletion(body)
  }
}
