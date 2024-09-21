import Mongoose, { type ClientSession } from 'mongoose'
import { generateBill, cancelBill, getPDF } from './bill'

const updateProduct = async (
  CollectionProduct: any,
  products: any,
  session: ClientSession,
  incDes: 1 | -1 = -1
): Promise<void> => {
  for (const product of products) {
    const { _id, amount } = product
    const config = { $inc: { existence: amount * incDes } }
    const data = await CollectionProduct.findByIdAndUpdate(_id, config, {
      session
    })
    if (incDes === -1) {
      if (!data || data.existence - amount < 0) {
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
    const products = req.body.products
    await updateProduct(req.CollectionProduct, products, session)
    let newBill: any = null

    if (req.body.clientNit && req.body.clientNit !== '') {
      if (req.body.clientNit.toLowerCase() === 'cf') {
        req.body.clientNit = 'CF'
        req.body.direction = 'ciudad'
        req.body.clientName = 'Consumidor final'
      }
      req.body.clientNit = req.body.clientNit.toUpperCase()
      const bill = await generateBill(
        req.CollectionCompany,
        req.companyName,
        req.body
      )
      newBill = {
        name: req.body.clientName,
        nit: req.body.clientNit,
        direction: req.body.direction,
        uuid: bill.uuid,
        uuidEmision: bill.uuidEmision
      }
    }

    const newSale: any = {
      bill: newBill,
      total: req.body.total,
      date: req.body.date,
      products
    }
    const sale = new req.CollectionSale(newSale)
    await sale.save({ session })

    await session.commitTransaction()
    res.send({ message: 'OK', sale: newSale })
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

const getOneSale = async (req: any, res: any): Promise<any> => {
  try {
    const data = await req.CollectionSale.findById(req.params.id)
    res.send(data)
  } catch (error) {
    return res
      .status(500)
      .json({ message: `Error buscando la venta ${req.params.id}` })
  }
}

const getAllItems = async (req: any, res: any): Promise<any> => {
  try {
    const items = await req.CollectionSale.find().sort({ date: -1 })
    return res.send(items)
  } catch (error) {
    return res.status(500).json({ message: 'Error gettin all purchases' })
  }
}

const cancelSale = async (req: any, res: any): Promise<void> => {
  const session = await Mongoose.startSession()
  session.startTransaction()
  try {
    const cancelDate = new Date()
    cancelDate.setHours(cancelDate.getHours() - 6)
    const data = await req.CollectionSale.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          canceled: true,
          cancellationDate: cancelDate
        }
      },
      { session }
    )
    await updateProduct(req.CollectionProduct, data.products, session, 1)
    if (data.bill) {
      data.bill.createDate = data.date
      await cancelBill(req.CollectionCompany, req.companyName, data.bill)
    }
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
    const pdf = await getPDF(req.CollectionCompany, req.companyName, req.params.uuid)

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
