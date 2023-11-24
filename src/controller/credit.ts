import Mongoose, { type ClientSession } from 'mongoose'

const updateProduct = async (
  controllerProduct: any,
  products: any,
  session: ClientSession,
  incDes: 1 | -1 = -1
): Promise<void> => {
  for (const product of products) {
    const { id, cantidad } = product
    const config = { $inc: { existencia: cantidad * incDes } }
    const data = await controllerProduct.findByIdAndUpdate(id, config, {
      session
    })
    if (incDes === -1) {
      if (!data || data.existencia - cantidad < 0) {
        throw {
          type: 400,
          message: `not enough "${product.name}" to create credit`
        }
      }
    }
  }
}

const createCredit = async (req: any, res: any): Promise<void> => {
  const session = await Mongoose.startSession()
  session.startTransaction()
  try {
    const credit = new req.ControllerCredit(req.body)
    await updateProduct(req.controllerProduct, req.body.productos, session)
    await credit.save({ session })
    await session.commitTransaction()
    res.send('OK')
  } catch (error) {
    await session.abortTransaction()
    res.status(500).json({ message: 'Error creating credit' })
  } finally {
    await session.endSession()
  }
}

const getTotalUntilDate = (payments: any): number => {
  let paid = 0
  for (const pay of payments) {
    paid += pay.amount
  }
  return paid
}

const payCredit = async (req: any, res: any): Promise<void> => {
  const session = await Mongoose.startSession()
  session.startTransaction()
  try {
    const credit = await req.ControllerCredit.findById(req.params.id)
    const paid = getTotalUntilDate(credit.payments)
    const data = await req.ControllerCredit.findByIdAndUpdate(
      req.params.id,
      {
        $push: { pagos: req.body },
        $set: { state: paid >= credit.total ? 2 : 1, paid }
      },
      { session }
    )
    res.send(data)
    await session.commitTransaction()
  } catch (error) {
    await session.abortTransaction()
    res.status(500).json({ message: 'Error paying credit' })
  } finally {
    await session.endSession()
  }
}

const getOneCredit = async (req: any, res: any): Promise<void> => {
  try {
    const data = await req.collectionCredit
      .findById(req.params.id)
      .populate('client')
    res.send(data)
  } catch (error) {
    res.status(500).json({ message: 'Error getting one credit' })
  }
}

const cancelCredit = async (req: any, res: any): Promise<void> => {
  const session = await Mongoose.startSession()
  session.startTransaction()

  try {
    const data = await req.collectionCredit.findByIdAndUpdate(
      req.query.id,
      { $set: { state: 3 } },
      { session }
    )
    await updateProduct(req.controllerProduct, data.products, session, 1)
    await session.commitTransaction()
    res.send(data)
  } catch (error) {
    await session.abortTransaction()
    res.status(500).json({ message: 'Error canceling credit' })
  } finally {
    await session.endSession()
  }
}

const unpaidCredit = async (req: any, res: any): Promise<void> => {
  try {
    const data = await req.collectionCredit.findByIdAndUpdate(req.query.id, {
      $set: 4
    })
    res.send(data)
  } catch (error) {
    res.status(500).json({ message: 'Error unpaying credit' })
  }
}

const getAllCredits = async (req: any, res: any): Promise<any> => {
  try {
    const items = await req.collectionCredit.find()
    res.send(items)
  } catch (error) {
    res.status(500).json({ message: 'Error gettin all purchases' })
  }
}

export default {
  create: createCredit,
  cancel: cancelCredit,
  getOne: getOneCredit,
  getAll: getAllCredits,
  unpaid: unpaidCredit,
  pay: payCredit
}
