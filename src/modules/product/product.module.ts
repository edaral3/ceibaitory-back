import { Module } from '@nestjs/common'
import { ProductController } from './product.controller'
import { ProductService } from './product.service'
import { RequestContextModule } from '../../core/context/context.module'

@Module({
  imports: [RequestContextModule],
  controllers: [ProductController],
  providers: [ProductService]
})
export class ProductModule {}
