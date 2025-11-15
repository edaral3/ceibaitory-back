import { Module } from '@nestjs/common'
import { FarmController } from './farm.controller'
import { FarmService } from './farm.service'
import { RequestContextModule } from '../../core/context/context.module'
import { FarmPdfService } from './services/farm-pdf.service'
import { FarmActionService } from './services/farm-action.service'

@Module({
  imports: [RequestContextModule],
  controllers: [FarmController],
  providers: [FarmService, FarmPdfService, FarmActionService]
})
export class FarmModule {}
