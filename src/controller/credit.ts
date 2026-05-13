import Mongoose, { type ClientSession } from 'mongoose'
import { generateBill, cancelBill, getClientDetails } from './bill'

const MONEY_TOLERANCE = 0.01

const toMoney = (value: number): number => Math.round((value + Number.EPSILON) * 100) / 100

const sendError = (res: any, error: any, defaultMessage: string): void => {
  if ([400, 401, 403, 404].includes(error?.type)) {
    res.status(error.type).json({ message: error.message })
    return
  }
  res.status(500).json({ message: defaultMessage })
}

const updateProduct = async (
  ControllerProduct: any,
  products: any,
  session: ClientSession,
  incDes: 1 | -1 = -1
): Promise<void> => {
  if (!Array.isArray(products) || products.length === 0) {
    throw { type: 400, message: 'Debe agregar al menos un producto al crédito' }
  }

  for (const product of products) {
    const { _id } = product
    const amount = Number(product.amount)
    if (!_id || !Number.isFinite(amount) || amount <= 0) {
      throw { type: 400, message: 'Producto inválido en el crédito' }
    }
    const config = { $inc: { existence: amount * incDes } }
    if (incDes === -1) {
      const data = await ControllerProduct.findOneAndUpdate(
        { _id, existence: { $gte: amount } },
        config,
        { session, new: false }
      )
      if (!data) {
        throw {
          type: 400,
          message: `No hay suficiente "${product.name}" para realizar un credito`
        }
      }
    } else {
      await ControllerProduct.findByIdAndUpdate(_id, config, { session })
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
    if (!client) throw { type: 400, message: 'Cliente no encontrado' }
    const company = await req.CollectionCompany.findOne({
      name: req.companyName
    })
    if (!company) throw { type: 400, message: 'Empresa no encontrada' }
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
          uuidEmission: bill.uuidEmision
        }
      }
    }
    const newCredit: any = {
      bill: newBill,
      total: toMoney(Number(req.body.total) || 0),
      date: req.body.date,
      products,
      client: req.body.client,
      branch: req.body.branch
    }
    const credit = new req.CollectionCredit(newCredit)
    await credit.save({ session })
    await session.commitTransaction()
    res.send({ message: 'OK', sale: newCredit })
  } catch (error: any) {
    await session.abortTransaction()
    sendError(res, error, 'Error creating credit')
  } finally {
    await session.endSession()
  }
}

const payCredit = async (req: any, res: any): Promise<void> => {
  const session = await Mongoose.startSession()
  session.startTransaction()
  try {
    const credit = await req.CollectionCredit.findById(req.params.id)
    if (!credit) throw { type: 404, message: 'Crédito no encontrado' }
    if (credit.canceled === true) throw { type: 400, message: 'No se puede cobrar un crédito cancelado' }

    const amount = toMoney(Number(req.body.amount))
    if (!Number.isFinite(amount) || amount <= 0) {
      throw { type: 400, message: 'Monto inválido' }
    }

    const total = toMoney(Number(credit.total) || 0)
    const currentPaid = toMoney(Number(credit.paid) || 0)
    const remaining = toMoney(Math.max(total - currentPaid, 0))
    if (remaining <= MONEY_TOLERANCE) {
      throw { type: 400, message: 'El crédito ya está pagado' }
    }
    if (amount - remaining > MONEY_TOLERANCE) {
      throw { type: 400, message: `El pago no puede exceder el saldo pendiente Q${remaining.toFixed(2)}` }
    }

    const appliedAmount = toMoney(Math.min(amount, remaining))
    const paid = toMoney(currentPaid + appliedAmount)
    const nextState = total - paid <= MONEY_TOLERANCE ? 2 : 1
    const data = await req.CollectionCredit.findByIdAndUpdate(
      req.params.id,
      {
        $push: { payments: { ...req.body, amount: appliedAmount } },
        $set: { state: nextState, paid }
      },
      { session, new: true }
    ).populate('client')
    await session.commitTransaction()
    res.send(data)
  } catch (error: any) {
    await session.abortTransaction()
    sendError(res, error, 'Error paying credit')
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
    const existing = await req.CollectionCredit.findById(req.params.id).session(session)
    if (!existing) throw { type: 404, message: 'Crédito no encontrado' }
    if (existing.canceled === true) throw { type: 400, message: 'El crédito ya está cancelado' }

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
      { session, new: true }
    )
    await updateProduct(req.CollectionProduct, existing.products, session, 1)
    if (data.bill) {
      data.bill.createDate = data.date
      await cancelBill(req.CollectionCompany, req.companyName, data.bill)
    }
    await session.commitTransaction()
    res.send('OK')
  } catch (error: any) {
    await session.abortTransaction()
    sendError(res, error, 'Error cancelling credit')
  } finally {
    await session.endSession()
  }
}

const unpaidCredit = async (req: any, res: any): Promise<void> => {
  const session = await Mongoose.startSession()
  session.startTransaction()
  try {
    const credit = await req.CollectionCredit.findById(req.params.id).session(session)
    if (!credit) throw { type: 404, message: 'Crédito no encontrado' }
    if (credit.canceled === true) throw { type: 400, message: 'No se puede revertir un crédito cancelado' }
    const data = await req.CollectionCredit.findByIdAndUpdate(
      req.params.id,
      { $set: { state: 0, paid: 0, payments: [] } },
      { session, new: true }
    ).populate('client')
    await session.commitTransaction()
    res.send(data)
  } catch (error: any) {
    await session.abortTransaction()
    sendError(res, error, 'Error unpaying credit')
  } finally {
    await session.endSession()
  }
}

const getAllCredits = async (req: any, res: any): Promise<any> => {
  try {
    const items = await req.CollectionCredit.find()
      .populate('client')
      .sort({ date: -1 })
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
