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
import { SaleService } from './sale.service'
import { JwtAuthGuard } from '../../core/auth/jwt-auth.guard'
import { Roles } from '../../core/auth/roles.decorator'
import { UseCollection } from '../../core/decorators/collection.decorator'
import { CreateSaleDto } from '../../dto/sale/create-sale.dto'

@Controller('sale')
@UseGuards(JwtAuthGuard)
@UseCollection('sale')
export class SaleController {
  constructor (private readonly saleService: SaleService) {}

  @Post()
  @Roles('owner', 'admin', 'vendedor', 'seller')
  create (@Body() body: CreateSaleDto): Promise<any> {
    return this.saleService.createSale(body)
  }

  @Delete(':id')
  @Roles('owner', 'admin')
  cancel (@Param('id') id: string): Promise<string> {
    return this.saleService.cancelSale(id)
  }

  @Get(':id')
  @Roles('owner', 'admin', 'vendedor', 'seller')
  findOne (@Param('id') id: string): Promise<any> {
    return this.saleService.getSale(id)
  }

  @Get()
  @Roles('owner', 'admin', 'vendedor', 'seller')
  findAll (): Promise<any[]> {
    return this.saleService.getSales()
  }

  @Get('bill/:uuid')
  @Roles('owner', 'admin', 'vendedor', 'seller')
  getBill (@Param('uuid') uuid: string): Promise<{ pdf: string }> {
    return this.saleService.getBillPdf(uuid)
  }
}
