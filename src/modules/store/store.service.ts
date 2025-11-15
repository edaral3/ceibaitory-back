import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException
} from '@nestjs/common'
import { CollectionsService } from '../../core/context/collections.service'

const formatStore = (store: any) =>
  typeof store?.toObject === 'function' ? store.toObject() : store

const toMapKey = (value: any) => value?.toString()

@Injectable()
export class StoreService {
  constructor (private readonly collections: CollectionsService) {}

  private get storeModel (): any {
    return this.collections.get('store')
  }

  private get storeItemModel (): any {
    return this.collections.get('storeItem')
  }

  async create (payload: any): Promise<any> {
    try {
      const ubication = payload?.ubication?.trim()
      if (!ubication) {
        throw new BadRequestException("El campo 'ubication' es obligatorio.")
      }
      const store = await this.storeModel.create({ ubication })
      const itemsMap = await this.buildStoreItemsMap([store._id?.toString()])
      return {
        message: 'Store created',
        store: this.attachItems(store, itemsMap)
      }
    } catch (error: any) {
      this.handleStoreError(error, 'Error creando la bodega')
    }
  }

  async update (id: string, payload: any): Promise<any> {
    try {
      const updates: Record<string, any> = {}
      if (typeof payload?.ubication === 'string') {
        updates.ubication = payload.ubication.trim()
      }

      const store = await this.storeModel.findByIdAndUpdate(
        id,
        { $set: updates },
        { new: true, runValidators: true }
      )

      if (!store) {
        throw new NotFoundException('Store not found')
      }

      const itemsMap = await this.buildStoreItemsMap([store._id?.toString()])
      return {
        message: 'Store updated',
        store: this.attachItems(store, itemsMap)
      }
    } catch (error: any) {
      this.handleStoreError(error, 'Error actualizando la bodega')
    }
  }

  async delete (id: string): Promise<{ message: string }> {
    try {
      const store = await this.storeModel.findById(id)
      if (!store) {
        throw new NotFoundException('Store not found')
      }
      await this.storeItemModel?.deleteMany({ ubication: id })
      await store.deleteOne()
      return { message: 'Store deleted' }
    } catch (error: any) {
      this.handleStoreError(error, 'Error eliminando la bodega')
    }
  }

  async getOne (id: string): Promise<any> {
    try {
      const store = await this.storeModel.findById(id).lean()
      if (!store) {
        throw new NotFoundException('Store not found')
      }
      const itemsMap = await this.buildStoreItemsMap([store._id?.toString()])
      return this.attachItems(store, itemsMap)
    } catch (error: any) {
      this.handleStoreError(error, 'Error obteniendo la bodega')
    }
  }

  async getAll (): Promise<any[]> {
    try {
      const stores = await this.storeModel.find().lean()
      const ids = stores
        .map((store: any) => store._id?.toString())
        .filter(Boolean)
      const itemsMap = await this.buildStoreItemsMap(ids)
      return stores.map((store: any) => this.attachItems(store, itemsMap))
    } catch (error: any) {
      this.handleStoreError(error, 'Error obteniendo las bodegas')
    }
  }

  private async buildStoreItemsMap (storeIds?: string[]) {
    if (!this.storeItemModel) {
      return new Map<string, any[]>()
    }
    const query =
      storeIds && storeIds.length > 0 ? { ubication: { $in: storeIds } } : {}
    const items = await this.storeItemModel
      .find(query)
      .populate(
        'productId',
        'name code barcode salesPrice priceCost existence'
      )
      .lean()

    const map = new Map<string, any[]>()
    items.forEach((item: any) => {
      const key = toMapKey(item.ubication)
      if (!key) {
        return
      }
      if (!map.has(key)) {
        map.set(key, [])
      }
      map.get(key)!.push({
        _id: item._id,
        amount: item.amount,
        product: item.productId
      })
    })
    return map
  }

  private attachItems (store: any, itemsMap: Map<string, any[]>) {
    if (!store) {
      return null
    }
    const plain = formatStore(store)
    const key = toMapKey(plain?._id)
    return {
      ...plain,
      items: (key && itemsMap.get(key)) ?? []
    }
  }

  private handleStoreError (error: any, message: string): never {
    if (error instanceof BadRequestException || error instanceof NotFoundException) {
      throw error
    }
    if (error?.code === 11000) {
      throw new BadRequestException(
        'Ya existe un registro con los valores enviados.'
      )
    }
    throw new InternalServerErrorException(message)
  }
}
