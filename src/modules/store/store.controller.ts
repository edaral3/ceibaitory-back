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
import { StoreService } from './store.service'
import { JwtAuthGuard } from '../../core/auth/jwt-auth.guard'
import { Roles } from '../../core/auth/roles.decorator'
import { UseCollection } from '../../core/decorators/collection.decorator'

@Controller('store')
@UseGuards(JwtAuthGuard)
@UseCollection('store')
export class StoreController {
  constructor (private readonly storeService: StoreService) {}

  @Post()
  @Roles('owner', 'admin')
  create (@Body() body: any): Promise<any> {
    return this.storeService.create(body)
  }

  @Put(':id')
  @Roles('owner', 'admin')
  update (@Param('id') id: string, @Body() body: any): Promise<any> {
    return this.storeService.update(id, body)
  }

  @Delete(':id')
  @Roles('owner', 'admin')
  delete (@Param('id') id: string): Promise<{ message: string }> {
    return this.storeService.delete(id)
  }

  @Get(':id')
  @Roles('owner', 'admin')
  findOne (@Param('id') id: string): Promise<any> {
    return this.storeService.getOne(id)
  }

  @Get()
  @Roles('owner', 'admin')
  findAll (): Promise<any[]> {
    return this.storeService.getAll()
  }
}
