import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
  UsePipes
} from '@nestjs/common'
import { PurchaseService } from './purchase.service'
import { JwtAuthGuard } from '../../core/auth/jwt-auth.guard'
import { Roles } from '../../core/auth/roles.decorator'
import { UseCollection } from '../../core/decorators/collection.decorator'
import { CreatePurchaseDto } from '../../dto/purchase/create-purchase.dto'

@Controller('purchase')
@UseGuards(JwtAuthGuard)
@UseCollection('purchase')
export class PurchaseController {
  constructor (private readonly purchaseService: PurchaseService) {}

  @Post()
  @Roles('owner', 'admin')
  create (@Body() body: CreatePurchaseDto): Promise<string> {
    return this.purchaseService.createPurchase(body)
  }

  @Delete(':id')
  @Roles('owner', 'admin')
  cancel (@Param('id') id: string): Promise<string> {
    return this.purchaseService.cancelPurchase(id)
  }

  @Get(':id')
  @Roles('owner', 'admin')
  findOne (@Param('id') id: string): Promise<any> {
    return this.purchaseService.getPurchase(id)
  }

  @Get()
  @Roles('owner', 'admin')
  findAll (): Promise<any[]> {
    return this.purchaseService.getPurchases()
  }
}
