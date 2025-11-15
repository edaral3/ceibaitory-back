import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UseGuards
} from '@nestjs/common'
import { UserService } from './user.service'
import { JwtAuthGuard } from '../../core/auth/jwt-auth.guard'
import { Roles } from '../../core/auth/roles.decorator'
import { UseCollection } from '../../core/decorators/collection.decorator'
import { CreateUserDto } from '../../dto/user/create-user.dto'
import { UpdateUserDto } from '../../dto/user/update-user.dto'
import { CreateOwnerUserDto } from '../../dto/user/create-owner-user.dto'

@Controller('user')
export class UserController {
  constructor (private readonly userService: UserService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @UseCollection('user')
  @Roles('owner')
  create (@Body() body: CreateUserDto): Promise<any> {
    return this.userService.create(body)
  }

  @Post('userOwner')
  @UseCollection('userOwner')
  createOwnerUser (@Body() body: CreateOwnerUserDto): Promise<{ message: string }> {
    return this.userService.createOwnerUser(body)
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @UseCollection('user')
  @Roles('owner')
  update (@Param('id') id: string, @Body() body: UpdateUserDto): Promise<any> {
    return this.userService.update(id, body)
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @UseCollection('user')
  @Roles('owner')
  delete (@Param('id') id: string): Promise<string> {
    return this.userService.delete(id)
  }

  @Get('billInformation/:nit')
  @UseGuards(JwtAuthGuard)
  @UseCollection('user')
  @Roles('owner', 'admin', 'vendedor', 'seller')
  getBillInformation (@Param('nit') nit: string): Promise<any> {
    return this.userService.getBillInformation(nit)
  }

  @Get('isBilling')
  @UseGuards(JwtAuthGuard)
  @UseCollection('user')
  @Roles('owner', 'admin', 'vendedor', 'seller')
  isBilling (): Promise<{ isBilling: boolean }> {
    return this.userService.isCompanyBilling()
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @UseCollection('user')
  @Roles('owner')
  findOne (@Param('id') id: string): Promise<any> {
    return this.userService.getOne(id)
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @UseCollection('user')
  @Roles('owner')
  findAll (): Promise<any[]> {
    return this.userService.getAll()
  }
}
