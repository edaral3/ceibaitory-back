import { Request, Response, NextFunction } from 'express'
import { ok } from '../utils/response'
import { getPagination } from '../utils/pagination'
import {
  createClient,
  deleteClient,
  getClient,
  listClients,
  updateClient
} from '../services/clients.service'
import { AppError } from '../utils/errors'
import { uploadToS3 } from '../utils/s3'

export const create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const clientModel = (req as any).CollectionDeliveryClient
    const client = await createClient(clientModel, req.body)
    res.status(201).json(ok(client))
  } catch (error) {
    next(error)
  }
}

export const list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { page, pageSize, skip, take } = getPagination(req.query.page, req.query.pageSize)
    const includeDeleted = req.query.includeDeleted === 'true'
    const q = typeof req.query.q === 'string' ? req.query.q : undefined

    const clientModel = (req as any).CollectionDeliveryClient
    const { total, items } = await listClients(clientModel, {
      q,
      includeDeleted,
      skip,
      take
    })

    res.json(ok(items, { page, pageSize, total }))
  } catch (error) {
    next(error)
  }
}

export const getOne = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const clientModel = (req as any).CollectionDeliveryClient
    const client = await getClient(clientModel, req.params.id)
    res.json(ok(client))
  } catch (error) {
    next(error)
  }
}

export const update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const clientModel = (req as any).CollectionDeliveryClient
    const client = await updateClient(clientModel, req.params.id, req.body)
    res.json(ok(client))
  } catch (error) {
    next(error)
  }
}

export const remove = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const clientModel = (req as any).CollectionDeliveryClient
    const client = await deleteClient(clientModel, req.params.id)
    res.json(ok(client))
  } catch (error) {
    next(error)
  }
}

export const uploadPhoto = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.file) {
      throw new AppError('VALIDATION_ERROR', 'Photo file is required', 400)
    }

    const clientModel = (req as any).CollectionDeliveryClient
    const photoUrl = await uploadToS3(req.file, {
      prefix: 'clients'
    })

    const client = await updateClient(clientModel, req.params.id, { photoUrl })
    res.json(ok(client))
  } catch (error) {
    next(error)
  }
}
