import { Module } from '@nestjs/common'
import { PurchaseController } from './purchase.controller'
import { PurchaseService } from './purchase.service'
import { RequestContextModule } from '../../core/context/context.module'

@Module({
  imports: [RequestContextModule],
  controllers: [PurchaseController],
  providers: [PurchaseService]
})
export class PurchaseModule {}
