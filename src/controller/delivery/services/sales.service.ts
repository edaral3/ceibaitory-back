import { AppError } from '../utils/errors'
import { getPaymentSummary, normalizePayments, toMoney } from '../utils/payments'

export interface SaleFilters {
  clientId?: string
  from?: Date
  to?: Date
  paidFrom?: Date
  paidTo?: Date
  status?: string
  skip: number
  take: number
}

const normalizeSaleItems = (rawItems: any[] = []) => {
  const items = rawItems.map((item: any) => {
    const quantity = Number(item.quantity) || 0
    const unitPrice = Number(item.unitPrice) || 0
    return {
      eggType: item.eggType,
      eggSize: item.eggSize,
      quantity,
      unitPrice,
      lineTotal: toMoney(unitPrice * quantity)
    }
  })

  const total = toMoney(items.reduce((sum: number, item: any) => sum + item.lineTotal, 0))
  return { items, total }
}

export const createSale = async (ClientModel: any, SaleModel: any, data: any) => {
  const client = await ClientModel.findOne({ _id: data.clientId, deletedAt: null })
  if (!client) {
    throw new AppError('NOT_FOUND', 'Client not found', 404)
  }

  const normalizeItems = () => {
    let rawItems = Array.isArray(data.items) ? data.items : []

    if (rawItems.length === 0 && data.eggType && data.eggSize && data.quantity) {
      rawItems = [
        {
          eggType: data.eggType,
          eggSize: data.eggSize,
          quantity: data.quantity,
          unitPrice: data.unitPrice ?? 0
        }
      ]
    }

    return normalizeSaleItems(rawItems)
  }

  const { items, total } = normalizeItems()

  const paymentsInput = Array.isArray(data.payments) ? data.payments : []
  const payments = normalizePayments(paymentsInput)

  if (data.paid === true && payments.length === 0) {
    payments.push({ amount: total, paidAt: data.soldAt ?? new Date() })
  }

  const summary = getPaymentSummary(total, payments)
  if (summary.paidAmount > total) {
    throw new AppError('BAD_REQUEST', 'Payments exceed total', 400)
  }

  const payload = {
    ...data,
    items,
    total,
    eggType: data.eggType ?? items[0]?.eggType,
    eggSize: data.eggSize ?? items[0]?.eggSize,
    unitPrice: data.unitPrice ?? items[0]?.unitPrice,
    quantity: data.quantity ?? items.reduce((sum: number, item: any) => sum + (item.quantity ?? 0), 0),
    payments,
    status: summary.status,
    paidAt: summary.paidAt
  }
  delete payload.paid
  delete payload.paidAmount

  return SaleModel.create(payload)
}

export const listSales = async (
  SaleModel: any,
  { clientId, from, to, paidFrom, paidTo, status, skip, take }: SaleFilters
) => {
  const where: any = {}
  if (clientId) {
    where.clientId = clientId
  }
  if (status) {
    where.status = status
  }
  if (from || to) {
    where.soldAt = {}
    if (from) {
      where.soldAt.$gte = from
    }
    if (to) {
      where.soldAt.$lte = to
    }
  }
  if (paidFrom || paidTo) {
    where.paidAt = {}
    if (paidFrom) {
      where.paidAt.$gte = paidFrom
    }
    if (paidTo) {
      where.paidAt.$lte = paidTo
    }
  }

  const [total, items] = await Promise.all([
    SaleModel.countDocuments(where),
    SaleModel.find(where)
      .sort({ soldAt: -1 })
      .skip(skip)
      .limit(take)
      .populate('clientId', 'name phone')
  ])

  return { total, items }
}

export const getSale = async (SaleModel: any, id: string) => {
  const sale = await SaleModel.findOne({ _id: id }).populate('clientId', 'name phone')
  if (!sale) {
    throw new AppError('NOT_FOUND', 'Sale not found', 404)
  }
  return sale
}

export const updateSale = async (SaleModel: any, id: string, data: any) => {
  const existing = await SaleModel.findOne({ _id: id })
  if (!existing) {
    throw new AppError('NOT_FOUND', 'Sale not found', 404)
  }

  if (existing.status === 'paid') {
    throw new AppError('BAD_REQUEST', 'Cannot modify a paid sale', 400)
  }
  if (existing.status === 'cancelled') {
    throw new AppError('BAD_REQUEST', 'Cannot modify a cancelled sale', 400)
  }

  const hasItemUpdates = Array.isArray(data.items) && data.items.length > 0

  if (hasItemUpdates) {
    const { items, total } = normalizeSaleItems(data.items)
    existing.items = items
    existing.total = total
    existing.eggType = items[0]?.eggType ?? existing.eggType
    existing.eggSize = items[0]?.eggSize ?? existing.eggSize
    existing.unitPrice = items[0]?.unitPrice ?? existing.unitPrice
    existing.quantity = items.reduce((sum: number, item: any) => sum + (item.quantity ?? 0), 0)
  }

  if (data.eggType !== undefined) {
    existing.eggType = data.eggType
  }
  if (data.quantity !== undefined) {
    existing.quantity = data.quantity
  }
  if (data.soldAt !== undefined) {
    existing.soldAt = data.soldAt
  }
  if (data.total !== undefined && !hasItemUpdates) {
    existing.total = data.total
  }

  const previousPaidAmount = getPaymentSummary(Number(existing.total) || 0, existing.payments ?? []).paidAmount

  if (data.payment) {
    existing.payments = existing.payments ?? []
    const [payment] = normalizePayments([data.payment])
    if (!payment || payment.amount <= 0) {
      throw new AppError('BAD_REQUEST', 'Payment amount must be positive', 400)
    }
    existing.payments.push(payment)
  }

  const payments = existing.payments ?? []
  const roundedTotal = Math.round((Number(existing.total) + Number.EPSILON) * 100) / 100
  const summary = getPaymentSummary(roundedTotal, payments)
  if (summary.paidAmount > roundedTotal) {
    throw new AppError('BAD_REQUEST', 'Payments exceed total', 400)
  }
  existing.status = summary.status
  existing.paidAt = summary.paidAt

  await existing.save()
  return {
    sale: existing,
    paymentDelta: data.payment ? toMoney(Math.max(0, summary.paidAmount - previousPaidAmount)) : 0
  }
}

export const deleteSale = async (SaleModel: any, id: string) => {
  const existing = await SaleModel.findOne({ _id: id })
  if (!existing) {
    throw new AppError('NOT_FOUND', 'Sale not found', 404)
  }
  if (existing.status === 'cancelled') {
    throw new AppError('BAD_REQUEST', 'Sale is already cancelled', 400)
  }
  existing.status = 'cancelled'
  await existing.save()
  return { id }
}

export const cancelSale = async (SaleModel: any, id: string) => {
  const existing = await SaleModel.findOne({ _id: id })
  if (!existing) {
    throw new AppError('NOT_FOUND', 'Sale not found', 404)
  }
  if (existing.status === 'cancelled') {
    throw new AppError('BAD_REQUEST', 'Sale is already cancelled', 400)
  }
  existing.status = 'cancelled'
  await existing.save()
  return existing
}
