import { Body, Controller, Get, Param, Post } from '@nestjs/common'
import { AuthService } from './auth.service'
import { UseCollection } from '../../core/decorators/collection.decorator'
import { LoginDto } from '../../dto/auth/login.dto'

@Controller('login')
export class AuthController {
  constructor (private readonly authService: AuthService) {}

  @Post()
  @UseCollection('user')
  login (@Body() body: LoginDto): Promise<any> {
    return this.authService.login(body)
  }

  @Get(':jwt')
  @UseCollection('user')
  validate (@Param('jwt') token: string): Promise<any> {
    return this.authService.validateToken(token)
  }
}
