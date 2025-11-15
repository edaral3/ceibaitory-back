import { Module } from '@nestjs/common'
import { SaleController } from './sale.controller'
import { SaleService } from './sale.service'
import { RequestContextModule } from '../../core/context/context.module'

@Module({
  imports: [RequestContextModule],
  controllers: [SaleController],
  providers: [SaleService]
})
export class SaleModule {}
