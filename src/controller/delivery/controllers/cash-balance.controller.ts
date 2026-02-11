import { Request, Response, NextFunction } from 'express'
import { ok } from '../utils/response'
import { getCashBalance } from '../services/cash-balance.service'

export const get = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const balanceModel = (req as any).CollectionDeliveryCashBalance
    const balance = await getCashBalance(balanceModel)
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
