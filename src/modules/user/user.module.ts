import { Module } from '@nestjs/common'
import { UserController } from './user.controller'
import { UserService } from './user.service'
import { RequestContextModule } from '../../core/context/context.module'

@Module({
  imports: [RequestContextModule],
  controllers: [UserController],
  providers: [UserService]
})
export class UserModule {}
