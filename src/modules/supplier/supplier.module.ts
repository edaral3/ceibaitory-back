import { Module } from '@nestjs/common'
import { SupplierController } from './supplier.controller'
import { SupplierService } from './supplier.service'
import { RequestContextModule } from '../../core/context/context.module'

@Module({
  imports: [RequestContextModule],
  controllers: [SupplierController],
  providers: [SupplierService]
})
export class SupplierModule {}
