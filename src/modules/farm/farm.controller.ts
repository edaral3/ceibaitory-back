import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
  Res
} from '@nestjs/common'
import { FastifyReply } from 'fastify'
import { FarmService } from './farm.service'
import { JwtAuthGuard } from '../../core/auth/jwt-auth.guard'
import { Roles } from '../../core/auth/roles.decorator'
import { UseCollection } from '../../core/decorators/collection.decorator'
import { CreateBatchDto } from './dto/create-batch.dto'
import { UpdateBatchDto } from './dto/update-batch.dto'
import { CreateConcentrateTypeDto } from './dto/create-concentrate-type.dto'
import { CreateEggTypeDto } from './dto/create-egg-type.dto'
import { CreateShedDto } from './dto/create-shed.dto'
import { UpdateShedDto } from './dto/update-shed.dto'
import { DeleteShedDto } from './dto/delete-shed.dto'
import { CreateConcentrateStoreDto } from './dto/create-concentrate-store.dto'
import { UpdateEggPriceDto } from './dto/update-egg-price.dto'
import { EggSalesBetweenDto } from './dto/egg-sales-between.dto'
import { UpdateClientPriceDto } from './dto/update-client-price.dto'
import { CreateEggSaleDto } from './dto/create-egg-sale.dto'
import { MakeActionDto } from './dto/make-action.dto'
import { CreateChickenSaleDto } from './dto/create-chicken-sale.dto'
import { DeleteActionDto } from './dto/delete-action.dto'

@Controller('farm')
@UseGuards(JwtAuthGuard)
@UseCollection('farm')
export class FarmController {
  constructor (private readonly farmService: FarmService) {}

  @Get('users')
  @Roles('owner', 'admin')
  getUsers (): Promise<any> {
    return this.farmService.getUsers()
  }

  @Post('action')
  @Roles('owner', 'admin', 'worker')
  makeAction (@Body() body: MakeActionDto): Promise<{ message: string }> {
    return this.farmService.makeAction(body)
  }

  @Post('action-owner')
  @Roles('owner', 'admin', 'worker')
  makeActionOwner (@Body() body: MakeActionDto): Promise<{ message: string }> {
    return this.farmService.makeAction(body)
  }

  @Post('addConcentrate')
  @Roles('owner', 'admin', 'worker')
  addConcentrate (@Body() body: any): Promise<any> {
    return this.farmService.addConcentrate(body)
  }

  @Post('batch')
  @Roles('owner', 'admin', 'worker')
  createBatch (@Body() body: CreateBatchDto): Promise<{ message: string }> {
    return this.farmService.createBatch(body)
  }

  @Get('activeBatches')
  @Roles('owner', 'admin', 'worker')
  getActiveBatches (): Promise<any> {
    return this.farmService.getActiveBatches()
  }

  @Get('batches')
  @Roles('owner', 'admin', 'worker')
  getBatches (): Promise<any> {
    return this.farmService.getBatches()
  }

  @Get('sheds')
  @Roles('owner', 'admin', 'worker')
  getSheds (): Promise<any> {
    return this.farmService.getSheds()
  }

  @Get('sales-egg-between')
  @Roles('owner', 'admin', 'worker')
  eggSalesBetween (@Query() query: EggSalesBetweenDto): Promise<any> {
    return this.farmService.eggSalesBetween(query)
  }

  @Get('stores')
  @Roles('owner', 'admin', 'worker')
  getStores (): Promise<any> {
    return this.farmService.getStores()
  }

  @Put('batch')
  @Roles('owner', 'admin', 'worker')
  updateBatch (@Body() body: UpdateBatchDto): Promise<{ message: string }> {
    return this.farmService.updateBatch(body)
  }

  @Get('clients')
  @Roles('owner', 'admin', 'worker')
  getClients (): Promise<any> {
    return this.farmService.getClients()
  }

  @Post('sale-chicken')
  @Roles('owner', 'admin', 'worker')
  async chickenSale (
    @Body() body: CreateChickenSaleDto,
    @Res() res: FastifyReply
  ): Promise<void> {
    const { buffer, fileName } = await this.farmService.chickenSale(body)
    res
      .header('Content-Type', 'application/pdf')
      .header('Content-Disposition', `inline; filename=${fileName}`)
      .send(buffer)
  }

  @Put('sale-chicken/:billId')
  @Roles('owner', 'admin', 'worker')
  updateChickenBill (
    @Param('billId') billId: string
  ): Promise<{ message: string }> {
    return this.farmService.updateChickenBillState(billId)
  }

  @Get('sales-chicken')
  @Roles('owner', 'admin', 'worker')
  chickenSales (): Promise<any> {
    return this.farmService.chickenSales()
  }

  @Get('sale-chicken-bill/:billId')
  @Roles('owner', 'admin', 'worker')
  async getChickenBill (
    @Param('billId') billId: string,
    @Res() res: FastifyReply
  ): Promise<void> {
    const { buffer, fileName } = await this.farmService.getChickenBill(billId)
    res
      .header('Content-Type', 'application/pdf')
      .header('Content-Disposition', `inline; filename=${fileName}`)
      .send(buffer)
  }

  @Get('batch-info/:batchId')
  @Roles('owner', 'admin', 'worker')
  getBatchInfo (@Param('batchId') batchId: string): Promise<any> {
    return this.farmService.getBatchInfo(batchId)
  }

  @Post('sale-egg')
  @Roles('owner', 'admin', 'worker')
  async eggSale (
    @Body() body: CreateEggSaleDto,
    @Res() res: FastifyReply
  ): Promise<void> {
    const { buffer, fileName } = await this.farmService.eggSale(body)
    res
      .header('Content-Type', 'application/pdf')
      .header('Content-Disposition', `inline; filename=${fileName}`)
      .send(buffer)
  }

  @Get('sales-egg')
  @Roles('owner', 'admin', 'worker')
  eggSales (): Promise<any> {
    return this.farmService.eggSales()
  }

  @Put('update-egg-price')
  @Roles('owner', 'admin', 'worker')
  updateEggPrice (@Body() body: UpdateEggPriceDto): Promise<any> {
    return this.farmService.updateEggPrice(body)
  }

  @Put('sale-egg/:billId')
  @Roles('owner', 'admin', 'worker')
  updateEggBill (@Param('billId') billId: string): Promise<{ message: string }> {
    return this.farmService.updateEggBillState(billId)
  }

  @Get('sale-egg-bill/:billId')
  @Roles('owner', 'admin', 'worker')
  async getEggBill (
    @Param('billId') billId: string,
    @Res() res: FastifyReply
  ): Promise<void> {
    const { buffer, fileName } = await this.farmService.getEggBill(billId)
    res
      .header('Content-Type', 'application/pdf')
      .header('Content-Disposition', `inline; filename=${fileName}`)
      .send(buffer)
  }

  @Get('egg-price')
  @Roles('owner', 'admin', 'worker')
  getEggPrice (): Promise<any> {
    return this.farmService.getEggPrice()
  }

  @Put('update-client-price')
  @Roles('owner', 'admin')
  updateClientPrice (@Body() body: UpdateClientPriceDto): Promise<any> {
    return this.farmService.updateClientPrice(body)
  }

  @Post('sheds')
  @Roles('owner', 'admin')
  createShed (@Body() body: CreateShedDto): Promise<{ message: string }> {
    return this.farmService.createShed(body)
  }

  @Delete('sheds')
  @Roles('owner', 'admin')
  deleteShed (@Body() body: DeleteShedDto): Promise<{ message: string }> {
    return this.farmService.deleteShed(body)
  }

  @Put('sheds/:id')
  @Roles('owner', 'admin')
  updateShed (
    @Param('id') id: string,
    @Body() body: UpdateShedDto
  ): Promise<any> {
    return this.farmService.updateShed(id, body)
  }

  @Post('concentrate-store')
  @Roles('owner', 'admin')
  createConcentrateStore (@Body() body: CreateConcentrateStoreDto): Promise<{ message: string }> {
    return this.farmService.createConcentrateStore(body)
  }

  @Delete('delete-action')
  @Roles('owner', 'admin')
  deleteAction (@Query() query: DeleteActionDto): Promise<{ message: string }> {
    return this.farmService.deleteAction(query)
  }

  @Post('concentrate-type')
  @Roles('owner', 'admin')
  createConcentrateType (@Body() body: CreateConcentrateTypeDto): Promise<any> {
    return this.farmService.createConcentrateType(body)
  }

  @Delete('concentrate-type/:id')
  @Roles('owner', 'admin')
  deleteConcentrateType (@Param('id') id: string): Promise<any> {
    return this.farmService.deleteConcentrateType(id)
  }

  @Post('egg-type')
  @Roles('owner', 'admin')
  createEggType (@Body() body: CreateEggTypeDto): Promise<any> {
    return this.farmService.createEggType(body)
  }

  @Delete('egg-type/:id')
  @Roles('owner', 'admin')
  deleteEggType (@Param('id') id: string): Promise<any> {
    return this.farmService.deleteEggType(id)
  }

  @Get('concentrate-types')
  @Roles('owner', 'admin', 'worker')
  getConcentrateTypes (): Promise<any> {
    return this.farmService.getConcentrateTypes()
  }

  @Get('egg-types')
  @Roles('owner', 'admin', 'worker')
  getEggTypes (): Promise<any> {
    return this.farmService.getEggTypes()
  }
}
