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
import { StoreItemsService } from './store-items.service'
import { JwtAuthGuard } from '../../core/auth/jwt-auth.guard'
import { Roles } from '../../core/auth/roles.decorator'
import { UseCollection } from '../../core/decorators/collection.decorator'

@Controller('store-items')
@UseGuards(JwtAuthGuard)
@UseCollection('storeItem')
export class StoreItemsController {
  constructor (private readonly storeItemsService: StoreItemsService) {}

  @Post('bulk')
  @Roles('owner', 'admin')
  addItemsBulk (@Body() body: any): Promise<any> {
    return this.storeItemsService.addItemsBulk(body)
  }

  @Post('transfer-to-products')
  @Roles('owner', 'admin', 'worker')
  moveItems (@Body() body: any): Promise<any> {
    return this.storeItemsService.moveItemsToProducts(body)
  }

  @Post()
  @Roles('owner', 'admin')
  create (@Body() body: any): Promise<any> {
    return this.storeItemsService.create(body)
  }

  @Put(':id/quantity')
  @Roles('owner', 'admin')
  updateQuantity (
    @Param('id') id: string,
    @Body() body: any
  ): Promise<any> {
    return this.storeItemsService.updateItemsQuantity(id, body)
  }

  @Put(':id')
  @Roles('owner', 'admin')
  update (@Param('id') id: string, @Body() body: any): Promise<any> {
    return this.storeItemsService.updateItemsQuantity(id, body)
  }

  @Delete(':id')
  @Roles('owner', 'admin')
  delete (@Param('id') id: string): Promise<string> {
    return this.storeItemsService.delete(id)
  }

  @Get(':id')
  @Roles('owner', 'admin')
  findOne (@Param('id') id: string): Promise<any> {
    return this.storeItemsService.getOne(id)
  }

  @Get()
  @Roles('owner', 'admin')
  findAll (): Promise<any[]> {
    return this.storeItemsService.getAll()
  }

  @Get('history/all')
  @Roles('owner', 'admin', 'worker')
  getHistory (): Promise<any[]> {
    return this.storeItemsService.getStoreHistory()
  }
}
