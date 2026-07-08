import type { Request, Response, NextFunction } from 'express'
import { ok } from '../utils/response'
import { AppError } from '../utils/errors'
import {
  addAdminReceivedCashBalance,
  listCashEvents,
  reconcileCashBalance
} from '../services/cash-balance.service'

const mapBalance = (balance: any) => ({
  id: balance.id ?? balance._id,
  balance: balance.balance ?? 0,
  driverReceivedCash: balance.driverReceivedCash ?? 0,
  driverReceivedCashUpdatedAt: balance.driverReceivedCashUpdatedAt ?? null,
  driverReceivedCashDateKey: balance.driverReceivedCashDateKey ?? null,
  adminReceivedCash: balance.adminReceivedCash ?? balance.receivedCash ?? 0,
  adminReceivedCashUpdatedAt: balance.adminReceivedCashUpdatedAt ?? balance.receivedCashUpdatedAt ?? null,
  adminReceivedCashDateKey: balance.adminReceivedCashDateKey ?? balance.receivedCashDateKey ?? null,
  receivedCash: balance.adminReceivedCash ?? balance.receivedCash ?? 0,
  receivedCashUpdatedAt: balance.adminReceivedCashUpdatedAt ?? balance.receivedCashUpdatedAt ?? null,
  receivedCashDateKey: balance.adminReceivedCashDateKey ?? balance.receivedCashDateKey ?? null,
  lastReceivedCashResetAt: balance.lastReceivedCashResetAt ?? null,
  updatedAt: balance.updatedAt,
  createdAt: balance.createdAt
})

export const get = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const balanceModel = (req as any).CollectionDeliveryCashBalance
    const saleModel = (req as any).CollectionDeliverySale
    const eggSaleModel = (req as any).CollectionEggSale
    const balance = await reconcileCashBalance(balanceModel, saleModel, eggSaleModel)
    res.json(ok(mapBalance(balance)))
  } catch (error) {
    next(error)
  }
}

export const setReceivedCash = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const amount = Number(req.body?.amount)
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new AppError('VALIDATION_ERROR', 'Received cash amount must be positive', 400)
    }

    const balanceModel = (req as any).CollectionDeliveryCashBalance
    const cashEventModel = (req as any).CollectionDeliveryCashEvent
    const saleModel = (req as any).CollectionDeliverySale
    const eggSaleModel = (req as any).CollectionEggSale
    const balance = await addAdminReceivedCashBalance(
      balanceModel,
      cashEventModel,
      amount,
      saleModel,
      eggSaleModel,
      req.body?.note
    )
    res.json(ok(mapBalance(balance)))
  } catch (error) {
    next(error)
  }
}

export const listEvents = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const cashEventModel = (req as any).CollectionDeliveryCashEvent
    const rawDateKey = req.query?.dateKey
    const dateKey = typeof rawDateKey === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(rawDateKey) ? rawDateKey : undefined
    const events = await listCashEvents(cashEventModel, Number(req.query?.pageSize) || 50, dateKey)
    res.json(ok(events))
  } catch (error) {
    next(error)
  }
}
