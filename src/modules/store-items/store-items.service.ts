import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException
} from '@nestjs/common'
import Mongoose, { ClientSession } from 'mongoose'
import { CollectionsService } from '../../core/context/collections.service'
import { RequestContextService } from '../../core/context/request-context.service'
import { existValueError } from '../../common/CRUD/errors'
import { ensureValidObjectId } from '../../utils/object-id.util'

type NormalizedItem = {
  productId: string
  amount: number
}

class StoreItemValidationError extends Error {
  constructor (message: string) {
    super(message)
    this.name = 'StoreItemValidationError'
  }
}

const normalizeId = (value?: any): string => {
  if (!value) {
    return ''
  }
  return typeof value === 'string' ? value.trim() : String(value)
}

const parseItemsInput = (items: any): NormalizedItem[] => {
  if (!Array.isArray(items) || items.length === 0) {
    throw new StoreItemValidationError('Debes enviar al menos un item.')
  }
  return items.map((item, index) => {
    const productId = normalizeId(item?.productId ?? item?.product)
    const amount = Number(item?.amount)
    if (!productId) {
      throw new StoreItemValidationError(
        `El item en posición ${index + 1} no tiene productId.`
      )
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new StoreItemValidationError(
        `El item ${productId} debe tener una cantidad mayor a 0.`
      )
    }
    return { productId, amount }
  })
}

@Injectable()
export class StoreItemsService {
  constructor (
    private readonly collections: CollectionsService,
    private readonly requestContext: RequestContextService
  ) {}

  private get model (): any {
    return this.collections.get('crud')
  }

  async create (payload: any): Promise<any> {
    const model = this.model
    try {
      const doc = new model(payload)
      const item = await doc.save()
      return { item, message: `${model.modelName} created` }
    } catch (error: any) {
      this.handleDuplicateError(error)
      throw new InternalServerErrorException(
        `Error creating ${model.modelName}`
      )
    }
  }

  async update (id: string, payload: any): Promise<any> {
    ensureValidObjectId(id)
    const model = this.model
    try {
      const item = await model.findByIdAndUpdate(
        id,
        { $set: payload },
        { new: true }
      )
      if (!item) {
        throw new NotFoundException(`${model.modelName} not found`)
      }
      return { item, message: `${model.modelName} updated` }
    } catch (error: any) {
      this.handleDuplicateError(error)
      if (error instanceof NotFoundException) {
        throw error
      }
      throw new InternalServerErrorException(
        `Error updating ${model.modelName}`
      )
    }
  }

  async delete (id: string): Promise<string> {
    ensureValidObjectId(id)
    const model = this.model
    await model.findByIdAndDelete(id)
    return `${model.modelName} deleted`
  }

  async getOne (id: string): Promise<any> {
    ensureValidObjectId(id)
    const model = this.model
    const item = await model.findById(id)
    if (!item) {
      throw new NotFoundException(`${model.modelName} not found`)
    }
    return item
  }

  async getAll (): Promise<any[]> {
    return this.model
      .find()
      .populate(
        'productId',
        'name code barcode salesPrice priceCost existence minExistence'
      )
  }

  async addItemsBulk (payload: any): Promise<any> {
    const session = await this.startSession()
    try {
      const storeId = normalizeId(payload?.storeId)
      const items = parseItemsInput(payload?.items)
      if (!storeId) {
        throw new StoreItemValidationError(
          'Debes proporcionar el identificador de la bodega.'
        )
      }
      const { productIds } = await this.ensureStoreAndProducts(storeId, items)
      const historyBody = {
        products: [] as string[],
        amount: [] as number[],
        ubication: null,
        type: 'IN',
        destinyUbication: storeId,
        branch: this.requestContext.branchId
      }
      const operations = items.map((item) => {
        historyBody.products.push(item.productId)
        historyBody.amount.push(item.amount)
        return {
          updateOne: {
            filter: { ubication: storeId, productId: item.productId },
            update: { $inc: { amount: item.amount } },
            upsert: true
          }
        }
      })
      const StoreHistoryModel = this.collections.get('storeHistory')
      const history = new StoreHistoryModel(historyBody)
      await history.save({ session })
      await this.collections
        .get('storeItem')
        .bulkWrite(operations, { session })
      const updatedItems = await this.fetchStoreItems(storeId, productIds)
      await session.commitTransaction()
      return {
        message: 'Items agregados a la bodega',
        storeId,
        items: updatedItems
      }
    } catch (error: any) {
      await session.abortTransaction()
      this.handleStoreItemError(
        error,
        'Error agregando items a la bodega'
      )
    } finally {
      await session.endSession()
    }
  }

  async moveItemsToProducts (payload: any): Promise<any> {
    const session = await this.startSession()
    try {
      const storeId = normalizeId(payload?.storeId)
      const items = payload?.items.map((item: any) => ({
        productId: item.itemId,
        amount: Number(item?.amount)
      }))
      if (!storeId) {
        throw new StoreItemValidationError(
          'Debes proporcionar el identificador de la bodega.'
        )
      }
      const { productIds } = await this.ensureStoreAndProducts(
        storeId,
        items
      )
      const existingItems = await this.collections
        .get('storeItem')
        .find({
          ubication: storeId,
          productId: { $in: productIds }
        })
        .lean()
      const existingMap: Map<string, any> = new Map(
        existingItems.map((item: any) => [item.productId.toString(), item])
      )
      const historyBody = {
        products: [] as string[],
        amount: [] as number[],
        ubication: storeId,
        type: 'MOVE',
        destinyUbication: null,
        branch: this.requestContext.branchId
      }
      const missing: string[] = []
      const insufficient: string[] = []
      items.forEach((item: any) => {
        historyBody.products.push(item.productId)
        historyBody.amount.push(item.amount)
        const record = existingMap.get(item.productId)
        if (!record) {
          missing.push(item.productId)
          return
        }
        if (record.amount < item.amount) {
          insufficient.push(
            `${item.productId} (solicitado ${item.amount}, disponible ${record.amount})`
          )
        }
      })
      if (missing.length > 0) {
        throw new StoreItemValidationError(
          `No existe inventario en la bodega para los productos: ${missing.join(
            ', '
          )}`
        )
      }
      if (insufficient.length > 0) {
        throw new StoreItemValidationError(
          `Cantidad insuficiente en bodega para: ${insufficient.join(', ')}`
        )
      }
      for (const item of items) {
        await this.collections
          .get('storeItem')
          .updateOne(
            { ubication: storeId, productId: item.productId },
            { $inc: { amount: -item.amount } },
            { session }
          )
        await this.collections
          .get('product')
          .findByIdAndUpdate(
            item.productId,
            { $inc: { existence: item.amount } },
            { session }
          )
      }
      const StoreHistoryModel = this.collections.get('storeHistory')
      const history = new StoreHistoryModel(historyBody)
      await history.save({ session })
      await this.collections
        .get('storeItem')
        .deleteMany(
          { ubication: storeId, amount: { $lte: 0 } },
          { session }
        )
      const remainingInStore = await this.fetchStoreItems(storeId)
      const updatedProducts = await this.collections
        .get('product')
        .find({ _id: { $in: productIds } }, 'name code existence')
        .lean()
      await session.commitTransaction()
      return {
        message: 'Items transferidos al inventario de productos',
        storeId,
        transferred: items,
        remainingInStore,
        updatedProducts
      }
    } catch (error: any) {
      await session.abortTransaction()
      this.handleStoreItemError(
        error,
        'Error trasladando los items al inventario'
      )
    } finally {
      await session.endSession()
    }
  }

  async getStoreHistory (): Promise<any[]> {
    try {
      const history = await this.collections
        .get('storeHistory')
        .find()
        .sort({ createdAt: -1 })
        .limit(100)
        .populate('products', 'name _id')
        .populate('ubication')
        .populate('destinyUbication')
        .populate('branch', 'name _id')
        .lean()
      return history
    } catch (error) {
      throw new InternalServerErrorException(
        'Error obteniendo el historial de bodega'
      )
    }
  }

  async updateItemsQuantity (id: string, payload: any): Promise<any> {
    const session = await this.startSession()
    try {
      const storeItemId = normalizeId(id)
      const amountToSubtract = Number(payload?.amount)
      if (!storeItemId) {
        throw new StoreItemValidationError(
          'Debes proporcionar el identificador del item de bodega.'
        )
      }
      if (!Number.isFinite(amountToSubtract) || amountToSubtract <= 0) {
        throw new StoreItemValidationError(
          'La cantidad a restar debe ser un número mayor a 0.'
        )
      }
      const storeItem = await this.collections
        .get('storeItem')
        .findById(storeItemId)
        .session(session)
      if (!storeItem) {
        throw new StoreItemValidationError('El item de bodega no existe.')
      }
      if (storeItem.amount < amountToSubtract) {
        throw new StoreItemValidationError(
          `Cantidad insuficiente en bodega. Disponible: ${storeItem.amount}`
        )
      }
      storeItem.amount -= amountToSubtract
      await storeItem.save({ session })
      const StoreHistoryModel = this.collections.get('storeHistory')
      const history = new StoreHistoryModel({
        products: [storeItem.productId],
        amount: [amountToSubtract],
        ubication: storeItem.ubication,
        type: 'OUT',
        destinyUbication: null,
        branch: this.requestContext.branchId
      })
      await history.save({ session })
      await session.commitTransaction()
      return {
        message: 'Cantidad actualizada correctamente.',
        item: storeItem
      }
    } catch (error: any) {
      await session.abortTransaction()
      this.handleStoreItemError(error, 'Error actualizando las cantidades')
    } finally {
      await session.endSession()
    }
  }

  private async ensureStoreAndProducts (
    storeId: string,
    items: NormalizedItem[]
  ) {
    const store = await this.collections.get('store').findById(storeId)
    if (!store) {
      throw new StoreItemValidationError('La bodega indicada no existe.')
    }
    const productIds = Array.from(new Set(items.map((item) => item.productId)))
    const products = await this.collections
      .get('product')
      .find({ _id: { $in: productIds } }, 'name code')
      .lean()
    const existing = new Map(
      products.map((product: any) => [product._id.toString(), product])
    )
    const missing = productIds.filter((id) => !existing.has(id))
    if (missing.length > 0) {
      throw new StoreItemValidationError(
        `Los siguientes productos no existen: ${missing.join(', ')}`
      )
    }
    return { store, productIds, productsMap: existing }
  }

  private async fetchStoreItems (
    storeId: string,
    productIds?: string[]
  ) {
    const filter: Record<string, any> = { ubication: storeId }
    if (productIds && productIds.length > 0) {
      filter.productId = { $in: productIds }
    }
    return this.collections
      .get('storeItem')
      .find(filter)
      .populate(
        'productId',
        'name code barcode salesPrice priceCost existence minExistence'
      )
      .lean()
  }

  private async startSession (): Promise<ClientSession> {
    const session = await Mongoose.startSession()
    session.startTransaction()
    return session
  }

  private handleStoreItemError (error: any, fallback: string): never {
    if (error instanceof StoreItemValidationError) {
      throw new BadRequestException(error.message)
    }
    throw new InternalServerErrorException(fallback)
  }

  private handleDuplicateError (error: any): void {
    if (error?.code === 11000) {
      const message =
        existValueError(Object.keys(error.keyValue ?? {})[0]) ||
        'Ya existe un registro con los valores enviados.'
      throw new BadRequestException(message)
    }
  }
}
