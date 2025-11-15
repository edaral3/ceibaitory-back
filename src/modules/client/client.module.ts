import { Module } from '@nestjs/common'
import { ClientController } from './client.controller'
import { ClientService } from './client.service'
import { RequestContextModule } from '../../core/context/context.module'

@Module({
  imports: [RequestContextModule],
  controllers: [ClientController],
  providers: [ClientService]
})
export class ClientModule {}
