import { Request, Response, NextFunction } from 'express'
import { ok } from '../utils/response'
import { getPagination } from '../utils/pagination'
import {
  createSale,
  deleteSale,
  getSale,
  listSales,
  updateSale
} from '../services/sales.service'
import { increaseCashBalance } from '../services/cash-balance.service'
import { listVisitClients, toggleVisit } from '../services/visits.service'
import { AppError } from '../utils/errors'
import { generateDeliveryReceipt } from '../utils/receipt'

const mapSale = (sale: any): any => {
  const json = sale?.toJSON ? sale.toJSON() : sale
  const clientDoc = sale?.clientId && typeof sale.clientId === 'object' ? sale.clientId : null
  if (clientDoc) {
    json.client = {
      id: clientDoc.id ?? clientDoc._id,
      name: clientDoc.name,
      phone: clientDoc.phone
    }
    json.clientId = clientDoc.id ?? clientDoc._id
  }
  return json
}

const parseDate = (value: unknown, label: string): Date | undefined => {
  if (typeof value !== 'string' || value.trim().length === 0) {
    return undefined
  }
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    throw new AppError('VALIDATION_ERROR', `Invalid ${label} date`, 400)
  }
  return date
}

const formatDateKey = (value: Date): string => {
  const year = value.getFullYear()
  const month = String(value.getMonth() + 1).padStart(2, '0')
  const day = String(value.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export const create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const clientModel = (req as any).CollectionDeliveryClient
    const saleModel = (req as any).CollectionDeliverySale
    const balanceModel = (req as any).CollectionDeliveryCashBalance
    const visitModel = (req as any).CollectionDeliveryVisit
    const assignmentModel = (req as any).CollectionDeliveryVisitAssignment
    const carryoverModel = (req as any).CollectionDeliveryVisitCarryover
    const sale = await createSale(clientModel, saleModel, req.body)
    if (balanceModel && Array.isArray(sale?.payments) && sale.payments.length > 0) {
      const paidAmount = sale.payments.reduce(
        (sum: number, payment: any) => sum + (Number(payment?.amount) || 0),
        0
      )
      if (paidAmount > 0) {
        await increaseCashBalance(balanceModel, paidAmount)
      }
    }
    try {
      if (sale?.clientId && visitModel && assignmentModel && carryoverModel) {
        const soldAt = sale?.soldAt ? new Date(sale.soldAt) : new Date()
        const dateKey = formatDateKey(soldAt)
        const visitClients = await listVisitClients(
          clientModel,
          visitModel,
          assignmentModel,
          carryoverModel,
          dateKey
        )
        const clientId = String(sale.clientId)
        const matched = visitClients.find((item: any) => {
          const itemId = item?.client?._id ?? item?.client?.id
          return String(itemId) === clientId
        })
        if (matched && !matched.visited) {
          await toggleVisit(clientModel, visitModel, carryoverModel, {
            clientId,
            date: dateKey,
            visited: true
          })
        }
      }
    } catch {
      // best-effort: do not block sale creation
    }
    res.status(201).json(ok(sale))
  } catch (error) {
    next(error)
  }
}

export const list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { page, pageSize, skip, take } = getPagination(req.query.page, req.query.pageSize)
    const clientId = typeof req.query.clientId === 'string' ? req.query.clientId : undefined
    const from = parseDate(req.query.from, 'from')
    const to = parseDate(req.query.to, 'to')

    const saleModel = (req as any).CollectionDeliverySale
    const { total, items } = await listSales(saleModel, {
      clientId,
      from,
      to,
      skip,
      take
    })

    const data = items.map(mapSale)
    res.json(ok(data, { page, pageSize, total }))
  } catch (error) {
    next(error)
  }
}

export const getOne = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const saleModel = (req as any).CollectionDeliverySale
    const sale = await getSale(saleModel, req.params.id)
    res.json(ok(mapSale(sale)))
  } catch (error) {
    next(error)
  }
}

export const update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const saleModel = (req as any).CollectionDeliverySale
    const balanceModel = (req as any).CollectionDeliveryCashBalance
    const sale = await updateSale(saleModel, req.params.id, req.body)
    const paymentAmount = Number(req.body?.payment?.amount)
    if (balanceModel && Number.isFinite(paymentAmount) && paymentAmount > 0) {
      await increaseCashBalance(balanceModel, paymentAmount)
    }
    res.json(ok(sale))
  } catch (error) {
    next(error)
  }
}

export const receipt = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const saleModel = (req as any).CollectionDeliverySale
    const sale = await getSale(saleModel, req.params.id)
    const soldAt = sale?.soldAt ? new Date(sale.soldAt) : new Date()
    const saleDateFormatted = soldAt.toLocaleDateString('es-GT')
    generateDeliveryReceipt(res, sale, saleDateFormatted)
  } catch (error) {
    next(error)
  }
}

export const remove = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const saleModel = (req as any).CollectionDeliverySale
    const result = await deleteSale(saleModel, req.params.id)
    res.json(ok(result))
  } catch (error) {
    next(error)
  }
}
