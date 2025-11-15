import { Module } from '@nestjs/common'
import { StoreItemsController } from './store-items.controller'
import { StoreItemsService } from './store-items.service'
import { RequestContextModule } from '../../core/context/context.module'

@Module({
  imports: [RequestContextModule],
  controllers: [StoreItemsController],
  providers: [StoreItemsService]
})
export class StoreItemsModule {}
