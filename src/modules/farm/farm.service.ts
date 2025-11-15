import {
  HttpException,
  Injectable,
  InternalServerErrorException,
  NotFoundException
} from '@nestjs/common'
import Mongoose, { ClientSession } from 'mongoose'
import { CollectionsService } from '../../core/context/collections.service'
import { RequestContextService } from '../../core/context/request-context.service'
import { CreateBatchDto } from './dto/create-batch.dto'
import { UpdateBatchDto } from './dto/update-batch.dto'
import { CreateConcentrateTypeDto } from './dto/create-concentrate-type.dto'
import { CreateEggTypeDto } from './dto/create-egg-type.dto'
import { CreateShedDto } from './dto/create-shed.dto'
import { UpdateShedDto } from './dto/update-shed.dto'
import { CreateConcentrateStoreDto } from './dto/create-concentrate-store.dto'
import { DeleteShedDto } from './dto/delete-shed.dto'
import { UpdateEggPriceDto } from './dto/update-egg-price.dto'
import { EggSalesBetweenDto } from './dto/egg-sales-between.dto'
import { UpdateClientPriceDto } from './dto/update-client-price.dto'
import { FarmPdfService } from './services/farm-pdf.service'
import { FarmActionService } from './services/farm-action.service'
import { CreateEggSaleDto } from './dto/create-egg-sale.dto'
import { MakeActionDto } from './dto/make-action.dto'
import BatchInfoTypeEnum from '../../enum/batch-info-type.enum'
import { ensureValidObjectId } from '../../utils/object-id.util'
import { CreateChickenSaleDto } from './dto/create-chicken-sale.dto'
import { DeleteActionDto } from './dto/delete-action.dto'

type PdfResult = {
  buffer: Buffer
  fileName: string
}

@Injectable()
export class FarmService {
  constructor (
    private readonly collections: CollectionsService,
    private readonly context: RequestContextService,
    private readonly pdfService: FarmPdfService,
    private readonly actionService: FarmActionService
  ) {}

  async getUsers (): Promise<any[]> {
    try {
      const UserModel = this.collections.get('user')
      return await UserModel.find(
        { company: this.context.companyId },
        '-pwd'
      )
    } catch (error) {
      throw new InternalServerErrorException('Error getting users')
    }
  }

  async makeAction (body: MakeActionDto): Promise<{ message: string }> {
    const session = await this.actionService.startTransactionalSession()
    try {
      const BatchModel = this.collections.get('batch')
      const batch = await BatchModel.findById(body.batchId).populate(
        'concentrateStore'
      )
      if (!batch) {
        throw new NotFoundException('Batch not found')
      }

      if (body.action === BatchInfoTypeEnum.CONCENTRATE) {
        if (body.amount == null || body.amount <= 0) {
          throw new HttpException('Amount is required', 400)
        }
        if (!body.typeConcentrate) {
          throw new HttpException('typeConcentrate is required', 400)
        }
        await this.actionService.handleConcentrateAction(
          batch,
          body.amount,
          body.typeConcentrate.toLowerCase(),
          session
        )
      } else {
        const payload = {
          action: body.action,
          amount: body.amount,
          price: body.price,
          description: body.description
        }
        await this.actionService.handleSimpleAction(
          batch._id,
          payload,
          session
        )
      }

      await session.commitTransaction()
      return { message: 'OK' }
    } catch (error) {
      await session.abortTransaction()
      if (error instanceof HttpException || error instanceof NotFoundException) {
        throw error
      }
      throw new InternalServerErrorException('Error creating action')
    } finally {
      await session.endSession()
    }
  }

  async addConcentrate (body: CreateConcentrateStoreDto): Promise<{ message: string }> {
    const session = await Mongoose.startSession()
    session.startTransaction()
    try {
      const store = await this.collections
        .get('concentrateStore')
        .findOne({ owner: body.owner })
      if (!store) {
        throw new NotFoundException('Store not found')
      }

      store.amount.push(body.amount)
      store.price.push(body.price)
      store.type.push(body.type)
      await store.save({ session })

      const infoModel = this.collections.get('concentrateStoreInfo')
      const info = new infoModel({
        concentrateStore: store._id,
        type: 'BUY',
        amount: [body.amount],
        price: [body.price],
        typeConcentrate: [body.type]
      })
      await info.save({ session })

      await session.commitTransaction()
      return { message: 'OK' }
    } catch (error) {
      await session.abortTransaction()
      if (error instanceof NotFoundException) throw error
      throw new InternalServerErrorException('Error adding concentrate')
    } finally {
      await session.endSession()
    }
  }

  async createBatch (body: CreateBatchDto): Promise<{ message: string }> {
    try {
      const ShedModel = this.collections.get('shed')
      const BatchModel = this.collections.get('batch')

      const shed = await ShedModel.findById(body.shedId)
      if (!shed) {
        throw new NotFoundException('Shed not found')
      }

      const active = await BatchModel.findOne({
        shed: shed._id,
        state: true
      })
      if (active) {
        throw new HttpException(
          'Ya hay un lote activo en este galpón',
          400
        )
      }

      const newBatch = new BatchModel({
        shed: shed._id,
        birdType: shed.birdType,
        inCharge: body.employeeId,
        concentrateStore: body.concentrateStoreId,
        amount: body.initialChickenAmount,
        startDate: body.startDate
      })
      await newBatch.save()
      return { message: 'OK' }
    } catch (error) {
      if (error instanceof HttpException) {
        throw error
      }
      if (error instanceof NotFoundException) {
        throw error
      }
      throw new InternalServerErrorException('Error creating batch')
    }
  }

  async getActiveBatches (): Promise<any[]> {
    try {
      const BatchModel = this.collections.get('batch')
      return await BatchModel.find({ state: true })
        .populate('shed')
        .populate('inCharge')
        .populate('concentrateStore')
    } catch (error) {
      throw new InternalServerErrorException('Error getting batches')
    }
  }

  async getBatches (): Promise<any[]> {
    try {
      const BatchModel = this.collections.get('batch')
      return await BatchModel.find()
        .populate('shed')
        .populate('inCharge')
        .populate('concentrateStore')
    } catch (error) {
      throw new InternalServerErrorException('Error getting batches')
    }
  }

  async getSheds (): Promise<any[]> {
    try {
      return await this.collections.get('shed').find()
    } catch (error) {
      throw new InternalServerErrorException('Error getting sheds')
    }
  }

  async eggSalesBetween (query: EggSalesBetweenDto): Promise<any[]> {
    try {
      return await this.collections.get('eggSale').find({
        date: { $gte: query.startDate, $lte: query.endDate }
      })
    } catch (error) {
      throw new InternalServerErrorException(
        'Error getting sales between dates'
      )
    }
  }

  async getStores (): Promise<any[]> {
    try {
      return await this.collections.get('concentrateStore').find()
    } catch (error) {
      throw new InternalServerErrorException('Error getting stores')
    }
  }

  async updateBatch (body: UpdateBatchDto): Promise<{ message: string }> {
    ensureValidObjectId(body.batchId)
    try {
      const BatchModel = this.collections.get('batch')
      const ShedModel = this.collections.get('shed')

      const batch = await BatchModel.findById(body.batchId)
      if (!batch) {
        throw new NotFoundException('Batch not found')
      }

      let shedId = body.shed._id
      ensureValidObjectId(shedId)
      let shed = await ShedModel.findById(shedId)
      if (!shed) {
        throw new NotFoundException('Shed not found')
      }

      if (batch.shed?.toString() !== shed._id.toString()) {
        const active = await BatchModel.findOne({
          shed: shed._id,
          state: true
        })
        if (active) {
          throw new HttpException(
            'Ya hay un lote activo en este galpón',
            400
          )
        }
      }

      batch.shed = shed._id
      batch.birdType = shed.birdType
      batch.inCharge = body.employees
      batch.concentrateStore = body.concentrateStore
      batch.amount = body.initialChickenAmount
      batch.startDate = body.startDate
      if (typeof body.state === 'boolean') {
        batch.state = body.state
      }
      batch.updatedAt = new Date()

      await batch.save()
      return { message: 'OK' }
    } catch (error) {
      if (error instanceof HttpException) {
        throw error
      }
      if (error instanceof NotFoundException) {
        throw error
      }
      throw new InternalServerErrorException('Error updating batch')
    }
  }

  async getClients (): Promise<any[]> {
    try {
      return await this.collections.get('client').find()
    } catch (error) {
      throw new InternalServerErrorException('Error getting clients')
    }
  }

  async chickenSale (body: CreateChickenSaleDto): Promise<PdfResult> {
    ensureValidObjectId(body.clientId)
    body.chickenBatch.forEach((batch) => ensureValidObjectId(batch.shed))

    const session = await Mongoose.startSession()
    session.startTransaction()
    try {
      const ClientModel = this.collections.get('client')
      const ChickenSaleModel = this.collections.get('chickenSale')
      const BatchModel = this.collections.get('batch')
      const BatchInfoModel = this.collections.get('batchInfo')

      const client = await ClientModel.findById(body.clientId)
      if (!client) {
        throw new NotFoundException('Client not found')
      }

      const totalAmount = body.chickenBatch.reduce(
        (acc, batch) => acc + batch.amount,
        0
      )
      const totalWeight = body.chickenBatch.reduce(
        (acc, batch) => acc + batch.pound,
        0
      )
      const salePrice = client.salePrice ?? 0
      const totalSale = totalWeight * salePrice

      const sale = new ChickenSaleModel({
        client: client._id,
        date: body.saleDate,
        chickenAmount: totalAmount,
        weight: totalWeight,
        total: totalSale,
        averageWeight: totalAmount > 0 ? totalWeight / totalAmount : 0,
        paid: false
      })
      await sale.save({ session })

      for (const batchSale of body.chickenBatch) {
        const batch = await BatchModel.findOne({
          shed: batchSale.shed,
          state: true
        })
          .session(session)
        if (!batch) {
          throw new HttpException(
            'No se encontró un lote activo para el galpón seleccionado',
            400
          )
        }
        const newInfo = new BatchInfoModel({
          batchId: batch._id,
          action: BatchInfoTypeEnum.SALE,
          amount: batchSale.amount,
          price: salePrice,
          chikenSale: sale._id
        })
        await newInfo.save({ session })
      }

      await sale.populate('client')
      const formattedDate = this.formatSaleDate(sale.date)
      const buffer = await this.pdfService.generateChickenTicket(
        sale,
        formattedDate
      )
      await session.commitTransaction()
      return {
        buffer,
        fileName: `ticket-${sale._id}.pdf`
      }
    } catch (error) {
      await session.abortTransaction()
      if (
        error instanceof HttpException ||
        error instanceof NotFoundException
      ) {
        throw error
      }
      throw new InternalServerErrorException('Error creating chicken sale')
    } finally {
      await session.endSession()
    }
  }

  async updateChickenBillState (billId: string): Promise<{ message: string }> {
    ensureValidObjectId(billId)
    try {
      const ChickenSaleModel = this.collections.get('chickenSale')
      const sale = await ChickenSaleModel.findById(billId)
      if (!sale) {
        throw new NotFoundException('Bill not found')
      }
      if (!sale.paid) {
        sale.paid = true
        await sale.save()
      }
      return { message: 'OK' }
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error
      }
      throw new InternalServerErrorException('Error updating chicken bill')
    }
  }

  async chickenSales (): Promise<any[]> {
    try {
      return await this.collections
        .get('chickenSale')
        .find()
        .populate('client')
        .limit(50)
        .sort({ date: -1 })
    } catch (error) {
      throw new InternalServerErrorException('Error getting sales')
    }
  }

  async getChickenBill (billId: string): Promise<PdfResult> {
    ensureValidObjectId(billId)
    try {
      const ChickenSaleModel = this.collections.get('chickenSale')
      const sale = await ChickenSaleModel.findById(billId).populate('client')
      if (!sale) {
        throw new NotFoundException('Bill not found')
      }
      const formattedDate = this.formatSaleDate(sale.date)
      const buffer = await this.pdfService.generateChickenTicket(
        sale,
        formattedDate
      )
      return {
        buffer,
        fileName: `ticket-${sale._id}.pdf`
      }
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error
      }
      throw new InternalServerErrorException('Error getting chicken bill')
    }
  }

  async getBatchInfo (batchId: string): Promise<any[]> {
    ensureValidObjectId(batchId)
    try {
      return await this.collections
        .get('batchInfo')
        .find({ batchId })
        .populate('chikenSale')
    } catch (error) {
      throw new InternalServerErrorException('Error getting batch info')
    }
  }

  async eggSale (body: CreateEggSaleDto): Promise<PdfResult> {
    try {
      const EggPriceModel = this.collections.get('eggPrice')
      const EggSaleModel = this.collections.get('eggSale')

      const prices = await EggPriceModel.find()
      const size: string[] = []
      const type: string[] = []
      const amount: number[] = []
      const price: number[] = []
      let total = 0

      for (const item of body.data) {
        const priceItem = prices.find(
          (pr: any) => pr.type?.toLowerCase() === item.size.toLowerCase()
        )
        const itemPrice = priceItem?.price ?? 0
        size.push(item.size)
        type.push(item.type.toLowerCase())
        price.push(itemPrice)
        amount.push(item.amount)
        if (item.type.toLowerCase() === 'caja') {
          total += itemPrice * item.amount
        } else {
          total += (itemPrice / 12) * item.amount
        }
      }

      const sale = new EggSaleModel({
        size,
        type,
        amount,
        price,
        total,
        date: body.saleDate
      })
      await sale.save()

      const date = new Date(`${body.saleDate}T00:00:00`)
      const formattedDate = date.toLocaleDateString('es-GT')
      const buffer = await this.pdfService.generateEggTicket(
        sale,
        formattedDate
      )
      return {
        buffer,
        fileName: `ticket-${sale._id}.pdf`
      }
    } catch (error) {
      throw new InternalServerErrorException('Error creating egg sale')
    }
  }

  async eggSales (): Promise<any[]> {
    try {
      return await this.collections
        .get('eggSale')
        .find()
        .sort({ date: -1 })
        .limit(100)
    } catch (error) {
      throw new InternalServerErrorException('Error getting sales')
    }
  }

  async updateEggPrice (body: UpdateEggPriceDto): Promise<any> {
    ensureValidObjectId(body.id)
    try {
      const EggPriceModel = this.collections.get('eggPrice')
      const updated = await EggPriceModel.findByIdAndUpdate(
        body.id,
        { $set: { price: body.price } },
        { new: true }
      )
      if (!updated) {
        throw new NotFoundException('Egg price entry not found')
      }
      return updated
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error
      }
      throw new InternalServerErrorException('Error updating egg price')
    }
  }

  async updateEggBillState (billId: string): Promise<{ message: string }> {
    ensureValidObjectId(billId)
    try {
      const EggSaleModel = this.collections.get('eggSale')
      const sale = await EggSaleModel.findById(billId)
      if (!sale) {
        throw new NotFoundException('Bill not found')
      }
      sale.paid = true
      await sale.save()
      return { message: 'OK' }
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error
      }
      throw new InternalServerErrorException('Error updating bill')
    }
  }

  async getEggBill (billId: string): Promise<PdfResult> {
    ensureValidObjectId(billId)
    try {
      const sale = await this.collections
        .get('eggSale')
        .findById(billId)
      if (!sale) {
        throw new NotFoundException('Bill not found')
      }
      const saleDate = new Date(sale.date)
      saleDate.setHours(saleDate.getHours() + 6)
      const formattedDate = saleDate.toLocaleDateString('es-GT')
      const buffer = await this.pdfService.generateEggTicket(
        sale,
        formattedDate
      )
      return {
        buffer,
        fileName: `ticket-${sale._id}.pdf`
      }
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error
      }
      throw new InternalServerErrorException('Error getting bill')
    }
  }

  async getEggPrice (): Promise<any[]> {
    try {
      return await this.collections.get('eggPrice').find()
    } catch (error) {
      throw new InternalServerErrorException('Error getting egg prices')
    }
  }

  async updateClientPrice (body: UpdateClientPriceDto): Promise<any> {
    ensureValidObjectId(body.id)
    try {
      const updated = await this.collections
        .get('client')
        .findByIdAndUpdate(
          body.id,
          { $set: { salePrice: body.price } },
          { new: true }
        )
      if (!updated) {
        throw new NotFoundException('Client not found')
      }
      return updated
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error
      }
      throw new InternalServerErrorException('Error updating client price')
    }
  }

  async createShed (body: CreateShedDto): Promise<{ message: string }> {
    try {
      const ShedModel = this.collections.get('shed')
      const shed = new ShedModel(body)
      await shed.save()
      return { message: 'OK' }
    } catch (error) {
      throw new InternalServerErrorException('Error creating chicken shed')
    }
  }

  async deleteShed (body: DeleteShedDto): Promise<{ message: string }> {
    ensureValidObjectId(body.id)
    try {
      const ShedModel = this.collections.get('shed')
      const deleted = await ShedModel.findByIdAndDelete(body.id)
      if (!deleted) {
        throw new NotFoundException('Chicken shed not found')
      }
      return { message: 'OK' }
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error
      }
      throw new InternalServerErrorException('Error deleting chicken shed')
    }
  }

  async updateShed (id: string, body: UpdateShedDto): Promise<any> {
    ensureValidObjectId(id)
    try {
      const ShedModel = this.collections.get('shed')
      const update: Record<string, any> = {}
      if (body.shedNumber !== undefined) {
        update.shedNumber = body.shedNumber
      }
      if (body.birdType !== undefined) {
        update.birdType = body.birdType
      }
      const updated = await ShedModel.findByIdAndUpdate(
        id,
        { $set: update },
        { new: true }
      )
      if (!updated) {
        throw new NotFoundException('Chicken shed not found')
      }
      return updated
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error
      }
      throw new InternalServerErrorException('Error updating chicken shed')
    }
  }

  async createConcentrateStore (
    body: CreateConcentrateStoreDto
  ): Promise<{ message: string }> {
    try {
      const StoreModel = this.collections.get('concentrateStore')
      const store = new StoreModel({
        owner: body.owner,
        amount: [],
        price: [],
        type: []
      })
      await store.save()
      return { message: 'OK' }
    } catch (error) {
      throw new InternalServerErrorException(
        'Error creating concentrate store'
      )
    }
  }

  async deleteAction (query: DeleteActionDto): Promise<{ message: string }> {
    ensureValidObjectId(query.id)
    const session = await Mongoose.startSession()
    session.startTransaction()
    try {
      const BatchInfoModel = this.collections.get('batchInfo')
      const batchInfo = await BatchInfoModel.findById(query.id).session(session)
      if (!batchInfo) {
        throw new NotFoundException('Action not found')
      }

      if (query.action === 'concentrado') {
        await this.restoreConcentrateFromAction(batchInfo, session)
      } else if (query.action === 'venta') {
        await this.deleteChickenSaleFromAction(batchInfo, session)
      } else {
        throw new HttpException('Tipo de acción no soportado', 400)
      }

      await BatchInfoModel.findByIdAndDelete(query.id, { session })
      await session.commitTransaction()
      return { message: 'OK' }
    } catch (error) {
      await session.abortTransaction()
      if (
        error instanceof HttpException ||
        error instanceof NotFoundException
      ) {
        throw error
      }
      throw new InternalServerErrorException('Error deleting action')
    } finally {
      await session.endSession()
    }
  }

  createConcentrateType (body: CreateConcentrateTypeDto): Promise<{ message: string }> {
    return this.handleCreateConcentrateType(body)
  }

  deleteConcentrateType (id: string): Promise<{ message: string }> {
    return this.handleDeleteConcentrateType(id)
  }

  createEggType (body: CreateEggTypeDto): Promise<{ message: string }> {
    return this.handleCreateEggType(body)
  }

  deleteEggType (id: string): Promise<{ message: string }> {
    return this.handleDeleteEggType(id)
  }

  getConcentrateTypes (): Promise<any[]> {
    return this.handleGetConcentrateTypes()
  }

  getEggTypes (): Promise<any[]> {
    return this.handleGetEggTypes()
  }

  private async handleCreateConcentrateType (
    body: CreateConcentrateTypeDto
  ): Promise<{ message: string }> {
    try {
      const model = this.collections.get('concentrateType')
      const doc = new model({ name: body.name })
      await doc.save()
      return { message: 'OK' }
    } catch (error) {
      throw new InternalServerErrorException(
        'Error creating concentrate type'
      )
    }
  }

  private async handleGetConcentrateTypes (): Promise<any[]> {
    try {
      return await this.collections.get('concentrateType').find()
    } catch (error) {
      throw new InternalServerErrorException(
        'Error getting concentrate types'
      )
    }
  }

  private async handleDeleteConcentrateType (
    id: string
  ): Promise<{ message: string }> {
    ensureValidObjectId(id)
    try {
      const deleted = await this.collections
        .get('concentrateType')
        .findByIdAndDelete(id)
      if (!deleted) {
        throw new NotFoundException('Tipo de concentrado no encontrado')
      }
      return { message: 'OK' }
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error
      }
      throw new InternalServerErrorException(
        'Error deleting concentrate type'
      )
    }
  }

  private async handleCreateEggType (
    body: CreateEggTypeDto
  ): Promise<{ message: string }> {
    try {
      const model = this.collections.get('eggPrice')
      const doc = new model({ type: body.name, price: 0 })
      await doc.save()
      return { message: 'OK' }
    } catch (error) {
      throw new InternalServerErrorException('Error creating egg type')
    }
  }

  private async handleGetEggTypes (): Promise<any[]> {
    try {
      return await this.collections.get('eggPrice').find()
    } catch (error) {
      throw new InternalServerErrorException('Error getting egg types')
    }
  }

  private async handleDeleteEggType (
    id: string
  ): Promise<{ message: string }> {
    ensureValidObjectId(id)
    try {
      const deleted = await this.collections
        .get('eggPrice')
        .findByIdAndDelete(id)
      if (!deleted) {
        throw new NotFoundException('Tipo de huevo no encontrado')
      }
      return { message: 'OK' }
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error
      }
      throw new InternalServerErrorException('Error deleting egg type')
    }
  }

  private async restoreConcentrateFromAction (
    batchInfo: any,
    session: ClientSession
  ): Promise<void> {
    const storeId = batchInfo.concentrateStore?._id ?? batchInfo.concentrateStore
    if (!storeId) {
      throw new NotFoundException('No se encontró la bodega asociada a la acción')
    }
    ensureValidObjectId(String(storeId))

    const storeModel = this.collections.get('concentrateStore')
    const store = await storeModel.findById(storeId).session(session)
    if (!store) {
      throw new NotFoundException('Bodega no encontrada')
    }

    store.amount.push(batchInfo.amount ?? 0)
    store.price.push(batchInfo.price ?? 0)
    store.type.push(batchInfo.typeConcentrate ?? '')
    await store.save({ session })
  }

  private async deleteChickenSaleFromAction (
    batchInfo: any,
    session: ClientSession
  ): Promise<void> {
    const saleId = batchInfo.chikenSale?._id ?? batchInfo.chikenSale
    if (!saleId) {
      throw new NotFoundException('Factura de venta de pollo no encontrada')
    }
    ensureValidObjectId(String(saleId))

    const ChickenSaleModel = this.collections.get('chickenSale')
    await ChickenSaleModel.findByIdAndDelete(saleId, { session })
  }

  private formatSaleDate (dateInput: Date | string): string {
    const date = new Date(dateInput)
    if (!Number.isNaN(date.getTime())) {
      date.setHours(date.getHours() + 6)
    }
    return date.toLocaleDateString('es-GT')
  }
}
