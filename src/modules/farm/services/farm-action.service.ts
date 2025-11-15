import { HttpException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common'
import Mongoose, { ClientSession } from 'mongoose'
import BatchInfoTypeEnum from '../../../enum/batch-info-type.enum'
import ConcentrateStoreInfoEnum from '../../../enum/concentrate-store-info.enum'
import { CollectionsService } from '../../../core/context/collections.service'

@Injectable()
export class FarmActionService {
  constructor (private readonly collections: CollectionsService) {}

  async startTransactionalSession (): Promise<ClientSession> {
    const session = await Mongoose.startSession()
    session.startTransaction()
    return session
  }

  async handleConcentrateAction (
    batch: any,
    amount: number,
    typeConcentrate: string,
    session: ClientSession
  ): Promise<void> {
    const storeModel = this.collections.get('concentrateStore')
    const batchInfoModel = this.collections.get('batchInfo')
    const storeInfoModel = this.collections.get('concentrateStoreInfo')

    const storeId = batch.concentrateStore?._id ?? batch.concentrateStore
    const concentrate = await storeModel.findById(storeId)
    if (!concentrate) {
      throw new NotFoundException('Concentrate store not found')
    }

    const newPrices: number[] = []
    const newAmounts: number[] = []
    const newTypes: string[] = []

    const takenPrices: number[] = []
    const takenAmounts: number[] = []
    const takenTypes: string[] = []

    let remaining = amount
    let discountedAll = false

    for (let i = 0; i < concentrate.price.length; i++) {
      const cType = concentrate.type[i]
      const cAmount = concentrate.amount[i]
      const cPrice = concentrate.price[i]

      if (discountedAll || cType !== typeConcentrate) {
        newPrices.push(cPrice)
        newAmounts.push(cAmount)
        newTypes.push(cType)
        continue
      }

      if (remaining <= 0) {
        newPrices.push(cPrice)
        newAmounts.push(cAmount)
        newTypes.push(cType)
        continue
      }

      if (cAmount > remaining) {
        takenPrices.push(cPrice)
        takenAmounts.push(remaining)
        takenTypes.push(cType)

        newPrices.push(cPrice)
        newAmounts.push(cAmount - remaining)
        newTypes.push(cType)

        remaining = 0
        discountedAll = true
      } else {
        takenPrices.push(cPrice)
        takenAmounts.push(cAmount)
        takenTypes.push(cType)
        remaining -= cAmount
      }
    }

    if (remaining > 0) {
      throw new HttpException('No hay suficiente concentrado en la bodega', 400)
    }

    const totalCost = takenAmounts.reduce((acc, a, idx) => acc + a * takenPrices[idx], 0)
    const unitsTaken = takenAmounts.reduce((a, b) => a + b, 0)
    const avgPrice = unitsTaken > 0 ? totalCost / unitsTaken : 0

    const newAction = new batchInfoModel({
      batchId: batch._id,
      action: BatchInfoTypeEnum.CONCENTRATE,
      amount,
      price: avgPrice,
      typeConcentrate,
      concentrateStore: storeId
    })
    await newAction.save({ session })

    const storeInfo = new storeInfoModel({
      concentrateStore: storeId,
      type: ConcentrateStoreInfoEnum.OUTPUT,
      amount: takenAmounts,
      price: takenPrices,
      typeConcentrate: takenTypes
    })
    await storeInfo.save({ session })

    await storeModel.findByIdAndUpdate(
      storeId,
      { $set: { amount: newAmounts, price: newPrices, type: newTypes } },
      { session }
    )
  }

  async handleSimpleAction (
    batchId: string,
    payload: Record<string, any>,
    session: ClientSession
  ): Promise<void> {
    const batchInfoModel = this.collections.get('batchInfo')
    const data = {
      batchId,
      ...payload
    }
    const newDoc = new batchInfoModel(data)
    await newDoc.save({ session })
  }
}
