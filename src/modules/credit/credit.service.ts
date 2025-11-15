import {
  Injectable,
  InternalServerErrorException
} from '@nestjs/common'
import Mongoose, { ClientSession } from 'mongoose'
import { CollectionsService } from '../../core/context/collections.service'
import { RequestContextService } from '../../core/context/request-context.service'
import {
  generateBill,
  cancelBill,
  getClientDetails
} from '../../controller/bill'

@Injectable()
export class CreditService {
  constructor (
    private readonly collections: CollectionsService,
    private readonly requestContext: RequestContextService
  ) {}

  async createCredit (payload: any): Promise<any> {
    const session = await Mongoose.startSession()
    session.startTransaction()
    try {
      const products = payload.products
      await this.updateProduct(products, session)
      const client = await this.collections
        .get('client')
        .findById(payload.client)
      const company = await this.collections
        .get('company')
        .findOne({ name: this.requestContext.companyName })
      let newBill: any = null
      if (company?.billingCompanyCredentials) {
        if (client?.nit && client.nit !== '') {
          if (client.nit && client.nit !== 'cf') {
            const billingInformation = await getClientDetails(
              this.collections.get('company'),
              this.requestContext.companyName ?? '',
              client.nit
            )
            payload.clientNit = client.nit.toUpperCase()
            payload.direction = billingInformation.direction
            payload.clientName = billingInformation.name
          } else {
            payload.clientNit = 'CF'
          }
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
      }
      const newCredit: any = {
        bill: newBill,
        total: payload.total,
        date: payload.date,
        products,
        client: payload.client,
        branch: payload.branch
      }
      const CreditModel = this.collections.get('credit')
      const credit = new CreditModel(newCredit)
      await credit.save({ session })
      await session.commitTransaction()
      return { message: 'OK', sale: newCredit }
    } catch (error) {
      await session.abortTransaction()
      throw new InternalServerErrorException('Error creating credit')
    } finally {
      await session.endSession()
    }
  }

  async payCredit (id: string, payload: any): Promise<any> {
    const session = await Mongoose.startSession()
    session.startTransaction()
    try {
      const credit = await this.collections.get('credit').findById(id)
      const paid = this.getTotalUntilDate(
        Number(payload.amount),
        credit.payments
      )
      const data = await this.collections.get('credit').findByIdAndUpdate(
        id,
        {
          $push: { payments: payload },
          $set: { state: paid >= credit.total ? 2 : 1, paid }
        },
        { session }
      )
      await session.commitTransaction()
      return data
    } catch (error) {
      await session.abortTransaction()
      throw new InternalServerErrorException('Error paying credit')
    } finally {
      await session.endSession()
    }
  }

  async getCredit (id: string): Promise<any> {
    try {
      return await this.collections
        .get('credit')
        .findById(id)
        .populate('client')
    } catch {
      throw new InternalServerErrorException('Error getting one credit')
    }
  }

  async cancelCredit (id: string): Promise<string> {
    const session = await Mongoose.startSession()
    session.startTransaction()
    try {
      const cancelDate = new Date()
      cancelDate.setHours(cancelDate.getHours() - 6)
      const data = await this.collections.get('credit').findByIdAndUpdate(
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
        throw new Error('Credit not found')
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
      throw new InternalServerErrorException('Error cancelling sale')
    } finally {
      await session.endSession()
    }
  }

  async markUnpaid (id: string): Promise<any> {
    try {
      return await this.collections.get('credit').findByIdAndUpdate(id, {
        $set: 4
      })
    } catch {
      throw new InternalServerErrorException('Error unpaying credit')
    }
  }

  async getCredits (): Promise<any[]> {
    try {
      return await this.collections
        .get('credit')
        .find()
        .populate('client')
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

  private getTotalUntilDate (amount: number, payments: any): number {
    let paid = amount
    for (const pay of payments) {
      paid += Number(pay.amount)
    }
    return paid
  }
}
