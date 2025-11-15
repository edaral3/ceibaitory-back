import { Module } from '@nestjs/common'
import { BranchController } from './branch.controller'
import { BranchService } from './branch.service'
import { RequestContextModule } from '../../core/context/context.module'

@Module({
  imports: [RequestContextModule],
  controllers: [BranchController],
  providers: [BranchService]
})
export class BranchModule {}
