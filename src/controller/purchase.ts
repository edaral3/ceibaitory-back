import Mongoose, { type ClientSession } from 'mongoose'

const updateProduct = async (
  collectionProduct: any,
  products: any,
  session: ClientSession,
  incDec: 1 | -1 = 1
) => {
  for (const product of products) {
    const { id, existence, priceCost, salesPrice, expirationDate } = product
    const config = {
      $inc: { existence: existence * incDec },
      $set: {
        priceCost,
        salesPrice,
        expirationDate
      }
    }
    const data = await collectionProduct.findByIdAndUpdate(id, config, {
      session
    })
    if (!data) {
      throw { message: 'Error updating product', product }
    }
  }
}

const createPurchase = async (req: any, res: any) => {
  const session = await Mongoose.startSession()
  session.startTransaction()
  try {
    const purchase = new req.collectionPurchase(req.body)
    await updateProduct(req.collectionProduct, req.body.products, session)
    await purchase.save({ session })
    await session.commitTransaction()
    res.send('OK')
  } catch (error) {
    await session.abortTransaction()
    return res.status(500).json({ message: 'Error in purchase' })
  }
  session.endSession()
}

const getOnePurchase = async (req: any, res: any) => {
  try {
    const purchase = await req.collectionPurchase
      .findById(req.params.id)
      .populate('supplier')
    return res.send(purchase)
  } catch (error) {
    return res.status(500).json({ message: 'Error getting one purchase' })
  }
}

const cancelPurchase = async (req: any, res: any) => {
  const session = await Mongoose.startSession()
  session.startTransaction()
  try {
    const data = await req.collectionPurchase.findByIdAndDelete(req.params.id)
    await updateProduct(req.collectionProduct, req.body.products, session, -1)
    await session.commitTransaction()
    return res.send(data)
  } catch (error) {
    await session.abortTransaction()
    return res.status(500).json({ message: 'Error deletting purchase' })
  }
}

const getAllPurchases = async (req: any, res: any): Promise<any> => {
  try {
    const items = await req.collectionPurchase.find()
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
