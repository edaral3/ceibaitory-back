import { Module } from '@nestjs/common'
import { RequestContextService } from './request-context.service'
import { CollectionsService } from './collections.service'

@Module({
  providers: [RequestContextService, CollectionsService],
  exports: [RequestContextService, CollectionsService]
})
export class RequestContextModule {}
