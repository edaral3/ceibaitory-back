import { Module } from '@nestjs/common'
import { CreditController } from './credit.controller'
import { CreditService } from './credit.service'
import { RequestContextModule } from '../../core/context/context.module'

@Module({
  imports: [RequestContextModule],
  controllers: [CreditController],
  providers: [CreditService]
})
export class CreditModule {}
