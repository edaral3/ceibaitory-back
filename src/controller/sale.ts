import Mongoose, { type ClientSession } from 'mongoose'
import { generateBill, cancelBill, getPDF } from './bill'

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

const createSale = async (req: any, res: any): Promise<void> => {
  const session = await Mongoose.startSession()
  session.startTransaction()
  try {
    const products = req.body.products.map((item) => {
      item.total = item.cantidad * item.precioVenta
      return item
    })
    const collections = {
      collectionBillingToken: req.collectionBillingToken,
      CollectionCompany: req.CollectionCompany
    }
    await updateProduct(req.controllerProduct, products, session)

    const bill = await generateBill(
      collections,
      req.companyName,
      req.body.products
    )

    const newSale = req.body
    newSale.bill.uuid = bill.uuid
    newSale.bill.uuidEmision = bill.uuidEmision

    const sale = new req.CollectionSale(newSale)
    await sale.save({ session })

    await session.commitTransaction()
    res.send('OK')
  } catch (error) {
    await session.abortTransaction()
    res.status(500).json({ message: 'Error creating sale' })
  } finally {
    await session.endSession()
  }
}

const getOneSale = async (req: any, res: any): Promise<any> => {
  try {
    const data = await req.controllerSale.findById(req.params.id)
    res.send(data)
  } catch (error) {
    return res
      .status(500)
      .json({ message: `Error buscando la venta ${req.params.id}` })
  }
}

const getAllItems = async (req: any, res: any): Promise<any> => {
  try {
    const items = await req.CollectionSale.find()
    return res.send(items)
  } catch (error) {
    return res.status(500).json({ message: 'Error gettin all purchases' })
  }
}

const cancelSale = async (req: any, res: any): Promise<void> => {
  const session = await Mongoose.startSession()
  session.startTransaction()
  try {
    const { id, products } = req.body
    await updateProduct(req.controllerProduct, products, session, 1)
    await req.controllerSale.findByIdAndUpdate(
      id,
      {
        $set: {
          anulado: true
        }
      },
      { session }
    )
    await cancelBill(req.collections, req.companyName, req.body.products)
    await session.commitTransaction()
    res.send('OK')
  } catch (error) {
    await session.abortTransaction()
    res.status(500).json({ message: 'Error cancelling sale' })
  } finally {
    await session.endSession()
  }
}

const getPdfBill = async (req: any, res: any): Promise<void> => {
  try {
    const pdf = await getPDF(
      req.collections,
      req.companyName,
      req.params.uuid
    )

    res.send({ pdf })
  } catch (error) {
    res.status(500).json({ message: 'Error getting bill' })
  }
}

export default {
  create: createSale,
  cancel: cancelSale,
  getOne: getOneSale,
  getAll: getAllItems,
  getBill: getPdfBill
}
