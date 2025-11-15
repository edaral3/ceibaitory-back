import {
  Injectable,
  InternalServerErrorException
} from '@nestjs/common'
import Mongoose, { ClientSession } from 'mongoose'
import { CollectionsService } from '../../core/context/collections.service'

@Injectable()
export class PurchaseService {
  constructor (private readonly collections: CollectionsService) {}

  async createPurchase (payload: any): Promise<string> {
    const session = await Mongoose.startSession()
    session.startTransaction()
    try {
      const PurchaseModel = this.collections.get('purchase')
      const purchase = new PurchaseModel(payload)
      await this.updateProduct(payload.products, session)
      await purchase.save({ session })
      await session.commitTransaction()
      return 'OK'
    } catch {
      await session.abortTransaction()
      throw new InternalServerErrorException('Error in purchase')
    } finally {
      await session.endSession()
    }
  }

  async getPurchase (id: string): Promise<any> {
    try {
      return await this.collections.get('purchase').findById(id)
    } catch {
      throw new InternalServerErrorException('Error getting one purchase')
    }
  }

  async cancelPurchase (id: string): Promise<string> {
    const session = await Mongoose.startSession()
    session.startTransaction()
    try {
      const data = await this.collections.get('purchase').findByIdAndUpdate(
        id,
        {
          $set: {
            canceled: true,
            cancellationDate: new Date()
          }
        },
        { session }
      )
      if (!data) {
        throw new Error('Purchase not found')
      }
      await this.updateProduct(data.products, session, 1)
      await session.commitTransaction()
      return 'OK'
    } catch {
      await session.abortTransaction()
      throw new InternalServerErrorException('Error cancelling sale')
    } finally {
      await session.endSession()
    }
  }

  async getPurchases (): Promise<any[]> {
    try {
      return await this.collections
        .get('purchase')
        .find()
        .sort({ date: -1 })
        .limit(200)
    } catch {
      throw new InternalServerErrorException(
        'Error gettin all purchases'
      )
    }
  }

  private async updateProduct (
    products: any[],
    session: ClientSession,
    incDec: 1 | -1 = 1
  ): Promise<void> {
    const productModel = this.collections.get('product')
    for (const product of products) {
      const { _id, amount, priceCost, salesPrice, expirationDate } = product
      const config = {
        $inc: { existence: amount * incDec },
        $set: {
          priceCost,
          salesPrice,
          expirationDate
        }
      }
      const data = await productModel.findByIdAndUpdate(_id, config, {
        session
      })
      if (!data) {
        throw {
          type: 400,
          message: `not enough "${product.name}" to delete purchase`
        }
      }
    }
  }
}
