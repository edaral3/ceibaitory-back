import { Module } from '@nestjs/common'
import { StoreController } from './store.controller'
import { StoreService } from './store.service'
import { RequestContextModule } from '../../core/context/context.module'

@Module({
  imports: [RequestContextModule],
  controllers: [StoreController],
  providers: [StoreService]
})
export class StoreModule {}
