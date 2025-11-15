import {
  BadRequestException,
  Injectable,
  InternalServerErrorException
} from '@nestjs/common'
import Mongoose, { ClientSession } from 'mongoose'
import { CollectionsService } from '../../core/context/collections.service'
import { RequestContextService } from '../../core/context/request-context.service'
import { generateBill, cancelBill, getPDF } from '../../controller/bill'

@Injectable()
export class SaleService {
  constructor (
    private readonly collections: CollectionsService,
    private readonly requestContext: RequestContextService
  ) {}

  async createSale (payload: any): Promise<any> {
    const session = await Mongoose.startSession()
    session.startTransaction()
    try {
      const products = payload.products
      await this.updateProduct(products, session)
      let newBill: any = null
      const company = await this.collections
        .get('company')
        .findById(this.requestContext.companyId)
      if (
        payload.clientNit &&
        payload.clientNit !== '' &&
        company?.billingCompanyName
      ) {
        if (payload.clientNit.toLowerCase() === 'cf') {
          payload.clientNit = 'CF'
        }
        payload.clientNit = payload.clientNit.toUpperCase()
        const bill = await generateBill(
          this.collections.get('company'),
          this.requestContext.companyName ?? '',
          payload
        )
        newBill = {
          name: payload.clientName,
          nit: payload.clientNit,
          direction: payload.direction,
          uuid: bill.uuid,
          uuidEmision: bill.uuidEmision
        }
      }
      const newSale: any = {
        bill: newBill,
        total: payload.total,
        date: payload.date,
        products
      }
      const SaleModel = this.collections.get('sale')
      const sale = new SaleModel(newSale)
      await sale.save({ session })
      await session.commitTransaction()
      return { message: 'OK', sale: newSale }
    } catch (error: any) {
      await session.abortTransaction()
      if (error?.type === 400) {
        throw new BadRequestException(error.message)
      }
      throw new InternalServerErrorException('Error creating sale')
    } finally {
      await session.endSession()
    }
  }

  async cancelSale (id: string): Promise<string> {
    const session = await Mongoose.startSession()
    session.startTransaction()
    try {
      const cancelDate = new Date()
      cancelDate.setHours(cancelDate.getHours() - 6)
      const data = await this.collections.get('sale').findByIdAndUpdate(
        id,
        {
          $set: {
            canceled: true,
            cancellationDate: cancelDate
          }
        },
        { session }
      )
      if (!data) {
        throw new BadRequestException('Sale not found')
      }
      await this.updateProduct(data.products, session, 1)
      if (data.bill) {
        data.bill.createDate = data.date
        await cancelBill(
          this.collections.get('company'),
          this.requestContext.companyName ?? '',
          data.bill
        )
      }
      await session.commitTransaction()
      return 'OK'
    } catch (error) {
      await session.abortTransaction()
      if (error instanceof BadRequestException) {
        throw error
      }
      throw new InternalServerErrorException('Error cancelling sale')
    } finally {
      await session.endSession()
    }
  }

  async getSale (id: string): Promise<any> {
    try {
      return await this.collections.get('sale').findById(id)
    } catch {
      throw new InternalServerErrorException(
        `Error buscando la venta ${id}`
      )
    }
  }

  async getSales (): Promise<any[]> {
    try {
      return await this.collections
        .get('sale')
        .find()
        .sort({ date: -1 })
        .limit(200)
    } catch {
      throw new InternalServerErrorException(
        'Error gettin all purchases'
      )
    }
  }

  async getBillPdf (uuid: string): Promise<{ pdf: string }> {
    try {
      const pdf = await getPDF(
        this.collections.get('company'),
        this.requestContext.companyName ?? '',
        uuid
      )
      return { pdf }
    } catch {
      throw new InternalServerErrorException('Error getting bill')
    }
  }

  private async updateProduct (
    products: any[],
    session: ClientSession,
    incDes: 1 | -1 = -1
  ): Promise<void> {
    const productModel = this.collections.get('product')
    for (const product of products) {
      const { _id, amount } = product
      const config = { $inc: { existence: amount * incDes } }
      const data = await productModel.findByIdAndUpdate(_id, config, {
        session
      })
      if (incDes === -1) {
        if (!data || data.existence - amount < 0) {
          throw {
            type: 400,
            message: `No hay suficiente "${product.name}" para realizar un credito`
          }
        }
      }
    }
  }
}
