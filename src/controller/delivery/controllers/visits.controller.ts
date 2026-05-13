import type { Request, Response, NextFunction } from 'express'
import { ok } from '../utils/response'
import { AppError } from '../utils/errors'
import { listVisits, listVisitClients, toggleVisit, upsertVisitAssignment } from '../services/visits.service'

const datePattern = /^\d{4}-\d{2}-\d{2}$/

export const list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const date = typeof req.query.date === 'string' ? req.query.date : ''
    if (!date || !datePattern.test(date)) {
      throw new AppError('VALIDATION_ERROR', 'Invalid date. Use YYYY-MM-DD', 400)
    }

    const visitModel = (req as any).CollectionDeliveryVisit
    const visits = await listVisits(visitModel, date)
    res.json(ok(visits))
  } catch (error) {
    next(error)
  }
}

export const listToday = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const date = typeof req.query.date === 'string' ? req.query.date : ''
    if (!date || !datePattern.test(date)) {
      throw new AppError('VALIDATION_ERROR', 'Invalid date. Use YYYY-MM-DD', 400)
    }

    const clientModel = (req as any).CollectionDeliveryClient
    const visitModel = (req as any).CollectionDeliveryVisit
    const assignmentModel = (req as any).CollectionDeliveryVisitAssignment
    const carryoverModel = (req as any).CollectionDeliveryVisitCarryover

    const items = await listVisitClients(clientModel, visitModel, assignmentModel, carryoverModel, date)
    res.json(ok(items))
  } catch (error) {
    next(error)
  }
}

export const assign = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const clientModel = (req as any).CollectionDeliveryClient
    const assignmentModel = (req as any).CollectionDeliveryVisitAssignment
    const carryoverModel = (req as any).CollectionDeliveryVisitCarryover

    const assignment = await upsertVisitAssignment(clientModel, assignmentModel, carryoverModel, req.body)
    res.json(ok(assignment))
  } catch (error) {
    next(error)
  }
}

export const toggle = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const clientModel = (req as any).CollectionDeliveryClient
    const visitModel = (req as any).CollectionDeliveryVisit
    const carryoverModel = (req as any).CollectionDeliveryVisitCarryover
    const visit = await toggleVisit(clientModel, visitModel, carryoverModel, req.body)
    res.json(ok(visit))
  } catch (error) {
    next(error)
  }
}
