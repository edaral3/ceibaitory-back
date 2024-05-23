import Mongoose, { type ClientSession } from 'mongoose'
import { generateBill, cancelBill, getClientDetails } from './bill'

const updateProduct = async (
  ControllerProduct: any,
  products: any,
  session: ClientSession,
  incDes: 1 | -1 = -1
): Promise<void> => {
  for (const product of products) {
    const { _id, amount } = product
    const config = { $inc: { existence: amount * incDes } }
    const data = await ControllerProduct.findByIdAndUpdate(_id, config, {
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

const createCredit = async (req: any, res: any): Promise<void> => {
  const session = await Mongoose.startSession()
  session.startTransaction()
  try {
    const products = req.body.products
    await updateProduct(req.CollectionProduct, products, session)
    const client = await req.CollectionClient.findById(req.body.client)
    const company = await req.CollectionCompany.findOne({
      name: req.companyName
    })
    let newBill: any = null
    if (company.billingCompanyCredentials) {
      if (client.nit && client.nit !== '') {
        if (client.nit && client.nit !== 'cf') {
          const billingInformation = await getClientDetails(
            req.CollectionCompany,
            req.companyName,
            client.nit
          )
          req.body.clientNit = client.nit.toUpperCase()
          req.body.direction = billingInformation.direction
          req.body.clientName = billingInformation.name
        } else {
          req.body.clientNit = 'CF'
          req.body.direction = 'ciudad'
          req.body.clientName = 'Consumidor final'
        }
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
    }
    const newCredit: any = {
      bill: newBill,
      total: req.body.total,
      date: req.body.date,
      products,
      client: req.body.client,
      branch: req.body.branch
    }
    const credit = new req.CollectionCredit(newCredit)
    await credit.save({ session })
    await session.commitTransaction()
    res.send({ message: 'OK', sale: newCredit })
  } catch (error) {
    await session.abortTransaction()
    res.status(500).json({ message: 'Error creating credit' })
  } finally {
    await session.endSession()
  }
}

const getTotalUntilDate = (amount: number, payments: any): number => {
  let paid = amount
  for (const pay of payments) {
    paid += Number(pay.amount)
  }
  return paid
}

const payCredit = async (req: any, res: any): Promise<void> => {
  const session = await Mongoose.startSession()
  session.startTransaction()
  try {
    const credit = await req.CollectionCredit.findById(req.params.id)
    const paid = getTotalUntilDate(Number(req.body.amount), credit.payments)
    const data = await req.CollectionCredit.findByIdAndUpdate(
      req.params.id,
      {
        $push: { payments: req.body },
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
    const data = await req.CollectionCredit.findById(req.params.id).populate(
      'client'
    )
    res.send(data)
  } catch (error) {
    res.status(500).json({ message: 'Error getting one credit' })
  }
}

const cancelCredit = async (req: any, res: any): Promise<void> => {
  const session = await Mongoose.startSession()
  session.startTransaction()
  try {
    const cancelDate = new Date()
    cancelDate.setHours(cancelDate.getHours() - 6)
    const data = await req.CollectionCredit.findByIdAndUpdate(
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

const unpaidCredit = async (req: any, res: any): Promise<void> => {
  try {
    const data = await req.CollectionCredit.findByIdAndUpdate(req.query.id, {
      $set: 4
    })
    res.send(data)
  } catch (error) {
    res.status(500).json({ message: 'Error unpaying credit' })
  }
}

const getAllCredits = async (req: any, res: any): Promise<any> => {
  try {
    const items = await req.CollectionCredit.find()
      .populate('client')
      .sort({ date: -1 }).limit(50);
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
