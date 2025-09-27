import Mongoose, { type ClientSession } from 'mongoose'
import BatchInfoTypeEnum from '../../enum/batch-info-type.enum'
import ConcentrateStoreInfoEnum from '../../enum/concentrate-store-info.enum'

const makeAnAction = async (req: any, res: any): Promise<void> => {
  const session = await Mongoose.startSession()
  session.startTransaction()
  try {
    const { batchId, action } = req.body

    const foundBatch = await req.CollectionBatch.findById(batchId)

    if (!foundBatch) {
      throw { type: 400, message: 'Batch not found' }
    }


    switch (action) {
      case BatchInfoTypeEnum.CONCENTRATE:
        await concentrateStoreAction(req, foundBatch, session)
        break;
      case BatchInfoTypeEnum.MORTALITY:
      case BatchInfoTypeEnum.OBASERVATION:
      case BatchInfoTypeEnum.DISCARDED:
      case BatchInfoTypeEnum.DAILY_PRODUCTION:
      case BatchInfoTypeEnum.WASTED:
        await simpleAction(req, foundBatch, action, session)
        break;
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

const concentrateStoreAction = async (req: any, batch, session: ClientSession): Promise<void> => {
  const { amount } = req.body

  const newAction = {
    batchId: batch._id,
    action: BatchInfoTypeEnum.CONCENTRATE,
    amount,
  }

  const newDoc = new req.CollectionBatchInfo(newAction);
  await newDoc.save({ session });

  const concentrate = await req.CollectionConcentrateStore.findById(batch.concentrateStore._id)

  let newPrices: number[] = []
  let newAmounts: number[] = []
  let difference = amount;

  let pricesInfo: number[] = []
  let amountsInfo: number[] = []

  let discountedAll = false


  for (let i = 0; i < concentrate.price.length; i++) {
    if (discountedAll) {
      newPrices.push(concentrate.price[i])
      newAmounts.push(concentrate.amount[i])
      continue
    }
    difference = concentrate.amount[i] - difference
    if (difference < 0) {
      pricesInfo.push(concentrate.price[i])
      amountsInfo.push(concentrate.amount[i])
      newAmounts.push(0)
      newPrices.push(0)
      difference = Math.abs(difference)
    } else {
      if (difference !== 0) {
        pricesInfo.push(concentrate.price[i])
        amountsInfo.push(concentrate.amount[i] - difference)
      }

      newAmounts.push(difference)
      newPrices.push(concentrate.price[i])
      discountedAll = true
      difference = 0
    }
  }

  if (difference > 0) {
    throw { type: 400, message: 'Not enough concentrate in store' }
  }

  newPrices = newPrices.filter(price => price > 0)
  newAmounts = newAmounts.filter(amount => amount > 0)

  const newConcentrateStoreInfo = new req.CollectionBatchInfo({ 
    concentrateStore: batch.concentrateStore, 
    type: ConcentrateStoreInfoEnum.OUTPUT, 
    amount: amountsInfo.reduce((a, b) => a + b, 0) , 
    price: pricesInfo.reduce((a, b) => a + b, 0)/ pricesInfo.length });

  await newConcentrateStoreInfo.save({ session });
  await req.CollectionConcentrateStore.findByIdAndUpdate(batch.concentrateStore._id, { $set: { amount: newAmounts, price: newPrices } }, { session })

}

const simpleAction = async (req: any, batch, action: BatchInfoTypeEnum, session: ClientSession): Promise<void> => {
  const newAction = {
    batchId: batch._id,
    ...req.body,
  }

  const newDoc = new req.CollectionBatchInfo(newAction);
  await newDoc.save({ session });
}

const addConcentrate = async (req: any, res: any): Promise<void> => {
  const session = await Mongoose.startSession()
  session.startTransaction()
  try {
    const { owner, price, amount } = req.body

    const store = await req.CollectionConcentrateStore.findOne({ owner })

    let addedFlag = false

    let newAmounts = [...store.amount]
    let newPrices = [...store.price]

    for (let i = 0; i < newPrices.length; i++) {
      if (newPrices[i] === price) {
        newAmounts[i] += amount
        addedFlag = true
        break
      }
    }

    if (!addedFlag) {
      newAmounts.push(amount)
      newPrices.push(price)
    }


    const newDoc = new req.CollectionConcentrateStoreInfo({ concentrateStore: store._id, type: ConcentrateStoreInfoEnum.BUY, amount: [amount], price: [price] });
    await newDoc.save({ session });

    await req.CollectionConcentrateStore.findByIdAndUpdate(store._id, { $set: { amount: newAmounts, price: newPrices } }, { session })

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

const createBatch = async (req: any, res: any): Promise<void> => {
  try {
    const { shedId, startDate, concentrateStoreId, employeeId, initialChickenAmount } = req.body

    const foundShed = await req.CollectionShed.findById(shedId)

    if (!foundShed) {
      throw { type: 400, message: 'Shed not found' }
    }

    const foundBatch = await req.CollectionBatch.findOne({ shed: foundShed, state: true })

    if (foundBatch) {
      throw { type: 400, message: 'Ya hay un lote activo en este galpón' }
    }
    const newBatch = {
      shed: foundShed._id,
      birdType: foundShed.birdType,
      inCharge: employeeId,
      concentrateStore: concentrateStoreId,
      amount: initialChickenAmount,
      startDate: startDate
    }

    await req.CollectionBatch.create(newBatch)
    res.send({ message: 'OK' })
  } catch (error: any) {
    throw { type: 400, message: 'Error creating batch' }
  }
}

const getActiveBatches = async (req: any, res: any): Promise<void> => {
  try {
    const batches = await req.CollectionBatch.find({ state: true }).populate('shed').populate('inCharge').populate('concentrateStore')

    res.send(batches)
  } catch (error) {
    res.status(400).json({ message: 'Error getting batches' })
  }
}

const getSheds = async (req: any, res: any): Promise<void> => {
  try {
    const sheds = await req.CollectionShed.find()

    res.send(sheds)
  } catch (error) {
    res.status(400).json({ message: 'Error getting sheds' })
  }
}

const getStores = async (req: any, res: any): Promise<void> => {
  try {
    const stores = await req.CollectionConcentrateStore.find()

    res.send(stores)
  } catch (error) {
    res.status(400).json({ message: 'Error getting stores' })
  }
}

const updateBatch = async (req: any, res: any): Promise<void> => {
  try {
    const { batchId, shedNumber: shedId, startDate, concentrateStore: concentrateStoreId, employees, initialChickenAmount, state } = req.body

    const foundShed = await req.CollectionShed.findById(shedId)

    if (!foundShed) {
      throw { type: 400, message: 'Shed not found' }
    }

    const foundBatch = await req.CollectionBatch.findById(batchId)

    if (!foundBatch) {
      throw { type: 400, message: 'Batch not found' }
    }

    if (foundBatch.shed.toString() !== shedId) {
      const anotherBatch = await req.CollectionBatch.findOne({ shed: foundShed, state: true })

      if (anotherBatch) {
        throw { type: 400, message: 'Ya hay un lote activo en este galpón' }
      }
    }

    const updatedBatch = {
      shed: foundShed._id,
      birdType: foundShed.birdType,
      inCharge: employees,
      concentrateStore: concentrateStoreId,
      amount: initialChickenAmount,
      startDate,
      state
    }

    await req.CollectionBatch.findByIdAndUpdate(batchId, updatedBatch)

    res.send({ message: 'OK' })
  } catch (error: any) {
    if (error.type === 400) {
      res.status(400).json({ message: error.message })
    } else {
      res.status(500).json({ message: 'Error updating batch' })
    }
  }
}


const chickenSale = async (req: any, res: any): Promise<void> => {
  try {
    const { batchId, shedNumber: shedId, startDate, concentrateStore: concentrateStoreId, employees, initialChickenAmount } = req.body

    const foundShed = await req.CollectionShed.findById(shedId)

    if (!foundShed) {
      throw { type: 400, message: 'Shed not found' }
    }

    const foundBatch = await req.CollectionBatch.findById(batchId)

    if (!foundBatch) {
      throw { type: 400, message: 'Batch not found' }
    }

    if (foundBatch.shed.toString() !== shedId) {
      const anotherBatch = await req.CollectionBatch.findOne({ shed: foundShed, state: true })

      if (anotherBatch) {
        throw { type: 400, message: 'Ya hay un lote activo en este galpón' }
      }
    }

    const updatedBatch = {
      shed: foundShed._id,
      birdType: foundShed.birdType,
      inCharge: employees,
      concentrateStore: concentrateStoreId,
      amount: initialChickenAmount,
      startDate
    }

    await req.CollectionBatch.findByIdAndUpdate(batchId, updatedBatch)

    res.send({ message: 'OK' })
  } catch (error: any) {
    if (error.type === 400) {
      res.status(400).json({ message: error.message })
    } else {
      res.status(500).json({ message: 'Error updating batch' })
    }
  }
}


export default {
  makeAnAction,
  addConcentrate,
  createBatch,
  getActiveBatches,
  getSheds,
  getStores,
  updateBatch,
  chickenSale
}
