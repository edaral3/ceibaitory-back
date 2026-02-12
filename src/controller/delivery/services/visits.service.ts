import { AppError } from '../utils/errors'

const dayKeys = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const

type VisitDay = typeof dayKeys[number]

const parseDateKey = (date: string): Date => {
  const [year, month, day] = date.split('-').map((value) => Number(value))
  if (!year || !month || !day) return new Date()
  return new Date(year, month - 1, day)
}

const formatDateKey = (date: Date): string => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const getDayKey = (date: Date): VisitDay => dayKeys[date.getDay()]

const toDateOnly = (date: Date): Date => new Date(date.getFullYear(), date.getMonth(), date.getDate())

const isClientScheduledForDate = (client: any, date: Date): boolean => {
  const dayKey = getDayKey(date)
  const visitDays: VisitDay[] = Array.isArray(client.visitDays) ? client.visitDays : []

  if (visitDays.length > 0) {
    return visitDays.includes(dayKey)
  }

  const visitFrequency = client.visitFrequency
  if (!visitFrequency) return false

  const anchorRaw = client.createdAt || client.updatedAt
  const anchor = anchorRaw ? new Date(anchorRaw) : null

  if (visitFrequency === 'on_demand') return false

  if (visitFrequency === 'weekly') {
    if (!anchor || Number.isNaN(anchor.getTime())) return true
    return getDayKey(anchor) === dayKey
  }

  if (visitFrequency === 'biweekly') {
    if (!anchor || Number.isNaN(anchor.getTime())) return true
    const anchorDate = toDateOnly(anchor)
    const targetDate = toDateOnly(date)
    const diffWeeks = Math.floor((targetDate.getTime() - anchorDate.getTime()) / (1000 * 60 * 60 * 24 * 7))
    return diffWeeks % 2 === 0
  }

  if (visitFrequency === 'monthly') {
    if (!anchor || Number.isNaN(anchor.getTime())) return date.getDate() === 1
    return anchor.getDate() === date.getDate()
  }

  return true
}

const updateCarryoverForPreviousDate = async (
  clients: any[],
  VisitModel: any,
  AssignmentModel: any,
  CarryoverModel: any,
  date: string
): Promise<void> => {
  const currentDate = parseDateKey(date)
  const prevDate = new Date(currentDate)
  prevDate.setDate(prevDate.getDate() - 1)
  const prevKey = formatDateKey(prevDate)

  const scheduledPrevIds = clients
    .filter((client) => isClientScheduledForDate(client, prevDate))
    .map((client) => client._id)

  if (scheduledPrevIds.length === 0) return

  const removedOverrides = await AssignmentModel.find({ date: prevKey, action: 'remove' })
  const removedSet = new Set(removedOverrides.map((item: any) => item.clientId))

  const scheduledVisible = scheduledPrevIds.filter((id) => !removedSet.has(id))

  if (scheduledVisible.length === 0) return

  const prevVisits = await VisitModel.find({ date: prevKey, visited: true })
  const visitedPrev = new Set(prevVisits.map((visit: any) => visit.clientId))

  if (visitedPrev.size > 0) {
    await CarryoverModel.deleteMany({ clientId: { $in: Array.from(visitedPrev) } })
  }

  const pendingIds = scheduledVisible.filter((id) => !visitedPrev.has(id))
  if (pendingIds.length === 0) return

  await Promise.all(
    pendingIds.map((clientId) =>
      CarryoverModel.updateOne(
        { clientId },
        { $setOnInsert: { clientId } },
        { upsert: true }
      )
    )
  )
}

export const listVisits = async (VisitModel: any, date: string) => {
  return VisitModel.find({ date })
}

export const listVisitClients = async (
  ClientModel: any,
  VisitModel: any,
  AssignmentModel: any,
  CarryoverModel: any,
  date: string
) => {
  const clients = await ClientModel.find({ deletedAt: null })

  await updateCarryoverForPreviousDate(clients, VisitModel, AssignmentModel, CarryoverModel, date)

  const dateObj = parseDateKey(date)
  const scheduled = clients.filter((client) => isClientScheduledForDate(client, dateObj))
  const scheduledMap = new Map(scheduled.map((client) => [String(client._id), client]))

  const overrides = await AssignmentModel.find({ date })
  const addedIds = overrides
    .filter((item: any) => item.action === 'add')
    .map((item: any) => String(item.clientId))
  const removedIds = new Set(
    overrides.filter((item: any) => item.action === 'remove').map((item: any) => String(item.clientId))
  )

  const carryovers = await CarryoverModel.find({})
  const carryIds = carryovers.map((item: any) => String(item.clientId))

  const clientsById = new Map(clients.map((client) => [String(client._id), client]))
  const visibleIds = new Set<string>()

  scheduledMap.forEach((_value, key) => visibleIds.add(String(key)))
  carryIds.forEach((id) => visibleIds.add(id))
  addedIds.forEach((id) => visibleIds.add(id))
  removedIds.forEach((id) => visibleIds.delete(id as string))

  const visits = await VisitModel.find({ date })
  const visitMap = new Map<string, any>(visits.map((visit: any) => [String(visit.clientId), visit]))

  const items = Array.from(visibleIds)
    .map((clientId) => {
      const client = clientsById.get(clientId)
      if (!client) return null
      const visit = visitMap.get(clientId)
      return {
        client,
        visited: Boolean(visit?.visited),
        visitedAt: visit?.visitedAt ?? null
      }
    })
    .filter(Boolean)

  return items
}

export const upsertVisitAssignment = async (
  ClientModel: any,
  AssignmentModel: any,
  CarryoverModel: any,
  { clientId, date, action }: { clientId: string; date: string; action: 'add' | 'remove' }
) => {
  const client = await ClientModel.findOne({ _id: clientId, deletedAt: null })
  if (!client) {
    throw new AppError('NOT_FOUND', 'Client not found', 404)
  }

  if (action === 'remove') {
    await CarryoverModel.deleteMany({ clientId })
  }

  const assignment = await AssignmentModel.findOneAndUpdate(
    { clientId, date },
    { clientId, date, action },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  )

  return assignment
}

export const toggleVisit = async (
  ClientModel: any,
  VisitModel: any,
  CarryoverModel: any,
  { clientId, date, visited }: { clientId: string; date: string; visited: boolean }
) => {
  const client = await ClientModel.findOne({ _id: clientId, deletedAt: null })
  if (!client) {
    throw new AppError('NOT_FOUND', 'Client not found', 404)
  }

  const visitedAt = visited ? new Date() : null

  const visit = await VisitModel.findOneAndUpdate(
    { clientId, date },
    { clientId, date, visited, visitedAt },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  )

  if (visited) {
    await CarryoverModel.deleteMany({ clientId })
  }

  return visit
}
