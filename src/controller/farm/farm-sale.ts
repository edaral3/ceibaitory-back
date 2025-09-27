import Mongoose, { type ClientSession } from 'mongoose'
import BatchInfoTypeEnum from '../../enum/batch-info-type.enum'

const chickenSale = async (req: any, res: any): Promise<void> => {
  const session = await Mongoose.startSession()
  session.startTransaction()
  try {
    const { client, chickenAmount, weight, total, batches, price } = req.body

    const sale = await req.CollectionShed.save({ 
      client: client.id,
      chickenAmount: chickenAmount.reduce((a: number, b: number) => a + b, 0),
      weight: weight.reduce((a: number, b: number) => a + b, 0),
      total,
      averageWeight: weight.reduce((a: number, b: number) => a + b, 0) / chickenAmount.reduce((a: number, b: number) => a + b, 0)
    }, { session })

    for (let i = 0; i < batches.length; i++) {
      req.CollectionBatch.findOneByIdAndUpdate(batches[i], { $dec: { chickenAmount } }, { session })
      req.CollectionBatchInfo.save({ 
        batchId: batches[i], 
        type: BatchInfoTypeEnum.SALE, 
        amount: chickenAmount[i],
        price: price[i],
        description: `Sale to client ${client.name}`,
        chikenSale: sale._id
      }, { session })
    }

    await session.commitTransaction()

    res.send({ message: 'OK' })
  } catch (error: any) {
    await session.abortTransaction()
    if (error.type === 400) {
      res.status(400).json({ message: error.message })
    } else {
      res.status(500).json({ message: 'Error creating sale' })
    }
  } finally {
    await session.endSession()
  }
}

const changeChickenSaleState = async (req: any, res: any): Promise<void> => {
  const session = await Mongoose.startSession()
  session.startTransaction()
  try {
    const { sale, state } = req.body

    await req.CollectionShed.findOneByIdAndUpdate(sale.id, { $set: { paid: state } }, { session })

    await session.commitTransaction()

    res.send({ message: 'OK' })
  } catch (error: any) {
    await session.abortTransaction()
    throw { type: 400, message: 'Error cancelling sale' }
  } finally {
    await session.endSession()
  }
}

const eggSale = async (req: any, res: any): Promise<void> => {
  const session = await Mongoose.startSession()
  session.startTransaction()
  try {
    const { client, chickenAmount, weight, total, batches, price } = req.body

    for (let i = 0; i < batches.length; i++) {
      req.CollectionBatch.findOneByIdAndUpdate(batches[i], { $dec: { chickenAmount } }, { session })
      req.CollectionBatchInfo.save({ 
        batchId: batches[i], 
        type: BatchInfoTypeEnum.SALE, 
        amount: chickenAmount[i],
        price: price[i],
        description: `Sale to client ${client.name}`
      }, { session })
    }

    await req.CollectionShed.save({ 
      client: client.id,
      chickenAmount: chickenAmount.reduce((a: number, b: number) => a + b, 0),
      weight: weight.reduce((a: number, b: number) => a + b, 0),
      total,
      averageWeight: weight.reduce((a: number, b: number) => a + b, 0) / chickenAmount.reduce((a: number, b: number) => a + b, 0)
    }, { session })

    await session.commitTransaction()

    res.send({ message: 'OK' })
  } catch (error: any) {
    await session.abortTransaction()
    if (error.type === 400) {
      res.status(400).json({ message: error.message })
    } else {
      res.status(500).json({ message: 'Error creating sale' })
    }
  } finally {
    await session.endSession()
  }
}

export default {
  chickenSale,
  eggSale,
  changeChickenSaleState
}
