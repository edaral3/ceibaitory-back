import { AppError } from '../utils/errors'

export interface ClientFilters {
  q?: string
  includeDeleted?: boolean
  skip?: number
  take?: number
}

export const createClient = async (ClientModel: any, data: any) => {
  return ClientModel.create(data)
}

export const listClients = async (
  ClientModel: any,
  { q, includeDeleted, skip, take }: ClientFilters
) => {
  const where: any = {}

  if (!includeDeleted) {
    where.deletedAt = null
  }

  if (q && q.trim().length > 0) {
    const term = q.trim()
    const regex = new RegExp(term, 'i')
    where.$or = [
      { name: regex },
      { phone: regex },
      { addressText: regex }
    ]
  }

  const query = ClientModel.find(where).sort({ createdAt: -1 })
  if (skip !== undefined) query.skip(skip)
  if (take !== undefined) query.limit(take)

  const [total, items] = await Promise.all([
    ClientModel.countDocuments(where),
    query,
  ])

  return { total, items }
}

export const getClient = async (ClientModel: any, id: string) => {
  const client = await ClientModel.findOne({ _id: id, deletedAt: null })
  if (!client) {
    throw new AppError('NOT_FOUND', 'Client not found', 404)
  }
  return client
}

export const updateClient = async (ClientModel: any, id: string, data: any) => {
  const existing = await ClientModel.findOne({ _id: id, deletedAt: null })
  if (!existing) {
    throw new AppError('NOT_FOUND', 'Client not found', 404)
  }
  return ClientModel.findOneAndUpdate({ _id: id }, data, { new: true, runValidators: true })
}

export const deleteClient = async (ClientModel: any, id: string) => {
  const existing = await ClientModel.findOne({ _id: id, deletedAt: null })
  if (!existing) {
    throw new AppError('NOT_FOUND', 'Client not found', 404)
  }
  return ClientModel.findOneAndUpdate(
    { _id: id },
    { deletedAt: new Date() },
    { new: true }
  )
}
