import Mongoose, { type ClientSession } from 'mongoose'

const updateProduct = async (
  controllerProduct: any,
  products: any,
  session: ClientSession,
  incDes: 1 | -1 = -1
) => {
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

const createCredit = async (req: any, res: any) => {
  const session = await Mongoose.startSession()
  session.startTransaction()
  try {
    const credit = new req.controllerCredit(req.body)
    await updateProduct(req.controllerProduct, req.body.productos, session)
    await credit.save({ session })
    await session.commitTransaction()
    res.send('OK')
  } catch (error) {
    await session.abortTransaction()
    return res.status(500).json({ message: 'Error creating credit' })
  }
  session.endSession()
}

const getTotalUntilDate = (payments: any): number => {
  let paid = 0
  for (const pay of payments) {
    paid += pay.amount
  }
  return paid
}

const payCredit = async (req: any, res: any) => {
  const session = await Mongoose.startSession()
  session.startTransaction()
  try {
    const credit = await req.controllerCredit.findById(req.params.id)
    const paid = getTotalUntilDate(credit.payments)
    const data = await req.controllerCredit.findByIdAndUpdate(
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
  }
  session.endSession()
}

const getOneCredit = async (req: any, res: any) => {
  try {
    const data = await req.collectionCredit
      .findById(req.params.id)
      .populate('client')
    res.send(data)
  } catch (error) {
    return res.status(500).json({ message: 'Error getting one credit' })
  }
}

const cancelCredit = async (req: any, res: any) => {
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
  }
  session.endSession()
}

const unpaidCredit = async (req: any, res: any) => {
  try {
    const data = await req.collectionCredit.findByIdAndUpdate(req.query.id, {
      $set: 4
    })
    return res.send(data)
  } catch (error) {
    return res.status(500).json({ message: 'Error unpaying credit' })
  }
}

const getAllCredits = async (req: any, res: any): Promise<any> => {
  try {
    const items = await req.collectionCredit.find()
    return res.send(items)
  } catch (error) {
    return res.status(500).json({ message: 'Error gettin all purchases' })
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
