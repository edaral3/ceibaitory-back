import Mongoose, { type ClientSession } from 'mongoose'

const updateProduct = async (
  CollectionProduct: any,
  products: any,
  session: ClientSession,
  incDec: 1 | -1 = 1
): Promise<void> => {
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
    const data = await CollectionProduct.findByIdAndUpdate(_id, config, {
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

const createPurchase = async (req: any, res: any): Promise<void> => {
  const session = await Mongoose.startSession()
  session.startTransaction()
  try {
    const purchase = new req.CollectionPurchase(req.body)
    await updateProduct(req.CollectionProduct, req.body.products, session)
    await purchase.save({ session })
    await session.commitTransaction()
    res.send('OK')
  } catch (error) {
    await session.abortTransaction()
    res.status(500).json({ message: 'Error in purchase' })
  } finally {
    await session.endSession()
  }
}

const getOnePurchase = async (req: any, res: any): Promise<void> => {
  try {
    const purchase = await req.CollectionPurchase.findById(
      req.params.id
    )
    res.send(purchase)
  } catch (error) {
    res.status(500).json({ message: 'Error getting one purchase' })
  }
}

const cancelPurchase = async (req: any, res: any): Promise<void> => {
  const session = await Mongoose.startSession()
  session.startTransaction()
  try {
    const data = await req.CollectionPurchase.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          canceled: true,
          cancellationDate: new Date()
        }
      },
      { session }
    )
    await updateProduct(req.CollectionProduct, data.products, session, 1)
    await session.commitTransaction()
    res.send('OK')
  } catch (error) {
    await session.abortTransaction()
    res.status(500).json({ message: 'Error cancelling sale' })
  } finally {
    await session.endSession()
  }
}

const getAllPurchases = async (req: any, res: any): Promise<any> => {
  try {
    const items = await req.CollectionPurchase.find().sort({ date: -1 }).limit(50);
    return res.send(items)
  } catch (error) {
    return res.status(500).json({ message: 'Error gettin all purchases' })
  }
}

export default {
  create: createPurchase,
  cancel: cancelPurchase,
  getOne: getOnePurchase,
  getAll: getAllPurchases
}
