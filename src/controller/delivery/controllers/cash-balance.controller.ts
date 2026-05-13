import type { Request, Response, NextFunction } from 'express'
import { ok } from '../utils/response'
import { reconcileCashBalance } from '../services/cash-balance.service'

export const get = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const balanceModel = (req as any).CollectionDeliveryCashBalance
    const saleModel = (req as any).CollectionDeliverySale
    const eggSaleModel = (req as any).CollectionEggSale
    const balance = await reconcileCashBalance(balanceModel, saleModel, eggSaleModel)
    res.json(
      ok({
        id: balance.id ?? balance._id,
        balance: balance.balance ?? 0,
        updatedAt: balance.updatedAt,
        createdAt: balance.createdAt
      })
    )
  } catch (error) {
    next(error)
  }
}
