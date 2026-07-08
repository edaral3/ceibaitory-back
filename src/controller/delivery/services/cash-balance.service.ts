const toMoney = (value: number): number => Math.round((value + Number.EPSILON) * 100) / 100
const GT_TIME_ZONE = 'America/Guatemala'
const DAY_MS = 24 * 60 * 60 * 1000

const getGuatemalaDateKey = (date = new Date()): string =>
  new Intl.DateTimeFormat('en-CA', { timeZone: GT_TIME_ZONE }).format(date)

const getPreviousGuatemalaDateKey = (date = new Date()): string =>
  getGuatemalaDateKey(new Date(date.getTime() - DAY_MS))

type CashEventInput = {
  eventType:
    | 'driver_cash_received'
    | 'driver_cash_reversal'
    | 'cash_received'
    | 'egg_payment'
    | 'egg_payment_reversal'
    | 'daily_reset'
  amount?: number
  deliveryBalance?: number
  driverReceivedCash?: number
  adminReceivedCash?: number
  receivedCash?: number
  difference?: number
  cashBefore?: number
  cashAfter?: number
  eggSaleId?: string | null
  eggSaleTotal?: number | null
  note?: string
  dateKey?: string
}

const ensureBalanceDoc = async (BalanceModel: any) => {
  let doc = await BalanceModel.findOne({ key: 'default' })
  if (!doc) {
    doc = await BalanceModel.create({ key: 'default', balance: 0 })
  }
  return doc
}

const getAdminReceivedCash = (doc: any): number => {
  const adminReceivedCash = Number(doc?.adminReceivedCash)
  if (Number.isFinite(adminReceivedCash) && adminReceivedCash > 0) {
    return toMoney(adminReceivedCash)
  }
  return toMoney(Number(doc?.receivedCash) || 0)
}

const getDriverReceivedCash = (doc: any): number => toMoney(Number(doc?.driverReceivedCash) || 0)

const createCashEvent = async (CashEventModel: any, event: CashEventInput) => {
  if (!CashEventModel) return null
  return CashEventModel.create({
    dateKey: event.dateKey ?? getGuatemalaDateKey(),
    eventType: event.eventType,
    amount: toMoney(Number(event.amount) || 0),
    deliveryBalance: toMoney(Number(event.deliveryBalance) || 0),
    driverReceivedCash: toMoney(Number(event.driverReceivedCash) || 0),
    adminReceivedCash: toMoney(Number(event.adminReceivedCash) || 0),
    receivedCash: toMoney(Number(event.receivedCash) || 0),
    difference: toMoney(Number(event.difference) || 0),
    cashBefore: toMoney(Number(event.cashBefore) || 0),
    cashAfter: toMoney(Number(event.cashAfter) || 0),
    eggSaleId: event.eggSaleId ?? null,
    eggSaleTotal: event.eggSaleTotal ?? null,
    note: event.note ?? ''
  })
}

const getAdminReceivedCashForDate = async (CashEventModel: any, dateKey: string): Promise<number> => {
  if (!CashEventModel) return 0
  const result = await CashEventModel.aggregate([
    { $match: { dateKey, eventType: 'cash_received' } },
    { $group: { _id: null, total: { $sum: '$amount' } } }
  ])
  return toMoney(Number(result?.[0]?.total) || 0)
}

export const getCashBalance = async (BalanceModel: any) => {
  const doc = await ensureBalanceDoc(BalanceModel)
  return doc
}

export const addAdminReceivedCashBalance = async (
  BalanceModel: any,
  CashEventModel: any,
  amount: number,
  DeliverySaleModel?: any,
  EggSaleModel?: any,
  note?: string
) => {
  const doc = DeliverySaleModel && EggSaleModel
    ? await reconcileCashBalance(BalanceModel, DeliverySaleModel, EggSaleModel)
    : await ensureBalanceDoc(BalanceModel)
  const amountToAdd = toMoney(Number(amount) || 0)
  const driverReceivedCash = getDriverReceivedCash(doc)
  const cashBefore = getAdminReceivedCash(doc)
  const adminReceivedCash = toMoney(cashBefore + amountToAdd)
  const deliveryBalance = toMoney(Number(doc.balance) || 0)
  const dateKey = getGuatemalaDateKey()
  const previousDailyAdminCash = await getAdminReceivedCashForDate(CashEventModel, dateKey)
  const dailyAdminCash = toMoney(previousDailyAdminCash + amountToAdd)

  doc.adminReceivedCash = adminReceivedCash
  doc.adminReceivedCashUpdatedAt = new Date()
  doc.adminReceivedCashDateKey = dateKey
  doc.receivedCash = adminReceivedCash
  doc.receivedCashUpdatedAt = doc.adminReceivedCashUpdatedAt
  doc.receivedCashDateKey = dateKey
  await doc.save()

  await createCashEvent(CashEventModel, {
    eventType: 'cash_received',
    dateKey,
    amount: amountToAdd,
    deliveryBalance,
    driverReceivedCash,
    adminReceivedCash: dailyAdminCash,
    receivedCash: dailyAdminCash,
    difference: toMoney(dailyAdminCash - driverReceivedCash),
    cashBefore: previousDailyAdminCash,
    cashAfter: dailyAdminCash,
    note
  })

  return doc
}

export const decreaseReceivedCashBalance = async (
  BalanceModel: any,
  CashEventModel: any,
  amount: number,
  event: Partial<CashEventInput> = {}
) => {
  const delta = toMoney(Number(amount) || 0)
  const doc = await ensureBalanceDoc(BalanceModel)
  if (delta <= 0) return doc

  const cashBefore = getAdminReceivedCash(doc)
  const cashAfter = toMoney(Math.max(cashBefore - delta, 0))
  doc.adminReceivedCash = cashAfter
  doc.adminReceivedCashUpdatedAt = new Date()
  doc.adminReceivedCashDateKey = getGuatemalaDateKey()
  doc.receivedCash = cashAfter
  doc.receivedCashUpdatedAt = doc.adminReceivedCashUpdatedAt
  doc.receivedCashDateKey = doc.adminReceivedCashDateKey
  await doc.save()

  await createCashEvent(CashEventModel, {
    eventType: 'egg_payment',
    amount: delta,
    deliveryBalance: toMoney(Number(doc.balance) || 0),
    driverReceivedCash: getDriverReceivedCash(doc),
    adminReceivedCash: cashBefore,
    receivedCash: cashBefore,
    difference: toMoney(cashBefore - getDriverReceivedCash(doc)),
    cashBefore,
    cashAfter,
    ...event
  })

  return doc
}

export const increaseReceivedCashBalance = async (
  BalanceModel: any,
  CashEventModel: any,
  amount: number,
  event: Partial<CashEventInput> = {}
) => {
  const delta = toMoney(Number(amount) || 0)
  const doc = await ensureBalanceDoc(BalanceModel)
  if (delta <= 0) return doc

  const cashBefore = getAdminReceivedCash(doc)
  const cashAfter = toMoney(cashBefore + delta)
  doc.adminReceivedCash = cashAfter
  doc.adminReceivedCashUpdatedAt = new Date()
  doc.adminReceivedCashDateKey = getGuatemalaDateKey()
  doc.receivedCash = cashAfter
  doc.receivedCashUpdatedAt = doc.adminReceivedCashUpdatedAt
  doc.receivedCashDateKey = doc.adminReceivedCashDateKey
  await doc.save()

  await createCashEvent(CashEventModel, {
    eventType: 'egg_payment_reversal',
    amount: delta,
    deliveryBalance: toMoney(Number(doc.balance) || 0),
    driverReceivedCash: getDriverReceivedCash(doc),
    adminReceivedCash: cashAfter,
    receivedCash: cashBefore,
    difference: toMoney(cashAfter - getDriverReceivedCash(doc)),
    cashBefore,
    cashAfter,
    ...event
  })

  return doc
}

export const resetDriverReceivedCashBalance = async (
  BalanceModel: any,
  CashEventModel: any,
  resetAt = new Date()
) => {
  const doc = await ensureBalanceDoc(BalanceModel)
  const driverCashBefore = getDriverReceivedCash(doc)
  const dateKey = getPreviousGuatemalaDateKey(resetAt)
  const adminCash = await getAdminReceivedCashForDate(CashEventModel, dateKey)

  doc.driverReceivedCash = 0
  doc.driverReceivedCashUpdatedAt = resetAt
  doc.driverReceivedCashDateKey = dateKey
  doc.lastReceivedCashResetAt = resetAt
  await doc.save()

  if (driverCashBefore > 0 || adminCash > 0) {
    await createCashEvent(CashEventModel, {
      eventType: 'daily_reset',
      dateKey,
      amount: driverCashBefore,
      deliveryBalance: toMoney(Number(doc.balance) || 0),
      driverReceivedCash: driverCashBefore,
      adminReceivedCash: adminCash,
      receivedCash: adminCash,
      difference: toMoney(adminCash - driverCashBefore),
      cashBefore: driverCashBefore,
      cashAfter: 0,
      note: 'Cierre diario de efectivo recolectado por delivery'
    })
  }

  return doc
}

export const increaseDriverReceivedCashBalance = async (
  BalanceModel: any,
  CashEventModel: any,
  amount: number,
  note?: string
) => {
  const delta = toMoney(Number(amount) || 0)
  const doc = await ensureBalanceDoc(BalanceModel)
  if (delta <= 0) return doc

  const cashBefore = getDriverReceivedCash(doc)
  const cashAfter = toMoney(cashBefore + delta)
  const dateKey = getGuatemalaDateKey()
  doc.driverReceivedCash = cashAfter
  doc.driverReceivedCashUpdatedAt = new Date()
  doc.driverReceivedCashDateKey = dateKey
  await doc.save()

  await createCashEvent(CashEventModel, {
    eventType: 'driver_cash_received',
    dateKey,
    amount: delta,
    deliveryBalance: toMoney(Number(doc.balance) || 0),
    driverReceivedCash: cashAfter,
    adminReceivedCash: getAdminReceivedCash(doc),
    receivedCash: getAdminReceivedCash(doc),
    difference: toMoney(getAdminReceivedCash(doc) - cashAfter),
    cashBefore,
    cashAfter,
    note
  })

  return doc
}

export const decreaseDriverReceivedCashBalance = async (
  BalanceModel: any,
  CashEventModel: any,
  amount: number,
  note?: string
) => {
  const delta = toMoney(Number(amount) || 0)
  const doc = await ensureBalanceDoc(BalanceModel)
  if (delta <= 0) return doc

  const cashBefore = getDriverReceivedCash(doc)
  const cashAfter = toMoney(Math.max(cashBefore - delta, 0))
  const dateKey = getGuatemalaDateKey()
  doc.driverReceivedCash = cashAfter
  doc.driverReceivedCashUpdatedAt = new Date()
  doc.driverReceivedCashDateKey = dateKey
  await doc.save()

  await createCashEvent(CashEventModel, {
    eventType: 'driver_cash_reversal',
    dateKey,
    amount: delta,
    deliveryBalance: toMoney(Number(doc.balance) || 0),
    driverReceivedCash: cashAfter,
    adminReceivedCash: getAdminReceivedCash(doc),
    receivedCash: getAdminReceivedCash(doc),
    difference: toMoney(getAdminReceivedCash(doc) - cashAfter),
    cashBefore,
    cashAfter,
    note
  })

  return doc
}

export const listCashEvents = async (CashEventModel: any, limit = 50, dateKey?: string) => {
  if (!CashEventModel) return []
  const safeLimit = Math.min(Math.max(Math.trunc(Number(limit) || 50), 1), 200)
  const filter = dateKey ? { dateKey } : {}
  return CashEventModel.find(filter).sort({ createdAt: -1 }).limit(safeLimit)
}

export const reconcileCashBalance = async (
  BalanceModel: any,
  DeliverySaleModel?: any,
  EggSaleModel?: any
) => {
  const doc = await ensureBalanceDoc(BalanceModel)
  if (!DeliverySaleModel || !EggSaleModel) return doc

  const [deliverySales, eggSales] = await Promise.all([
    DeliverySaleModel.find(
      { status: { $ne: 'cancelled' } },
      'payments paidAmount paid status total'
    ).lean(),
    EggSaleModel.find(
      { cancelled: { $ne: true } },
      'paidAmount paid total'
    ).lean()
  ])

  const deliveryCash = deliverySales.reduce((sum: number, sale: any) => {
    const payments = Array.isArray(sale?.payments) ? sale.payments : []
    if (payments.length > 0) {
      return sum + payments.reduce((paymentSum: number, payment: any) => (
        paymentSum + (Number(payment?.amount) || 0)
      ), 0)
    }
    const paidAmount = Number(sale?.paidAmount)
    if (Number.isFinite(paidAmount) && paidAmount > 0) {
      return sum + paidAmount
    }
    if (sale?.status === 'paid' || sale?.paid === true) {
      return sum + (Number(sale?.total) || 0)
    }
    return sum
  }, 0)

  const eggPayments = eggSales.reduce((sum: number, sale: any) => {
    const paidAmount = Number(sale?.paidAmount)
    if (Number.isFinite(paidAmount) && paidAmount > 0) {
      return sum + paidAmount
    }
    if (sale?.paid === true) {
      return sum + (Number(sale?.total) || 0)
    }
    return sum
  }, 0)

  const nextBalance = toMoney(Math.max(deliveryCash - eggPayments, 0))
  if (toMoney(Number(doc.balance) || 0) !== nextBalance) {
    doc.balance = nextBalance
    await doc.save()
  }
  return doc
}

export const increaseCashBalance = async (BalanceModel: any, amount: number) => {
  const delta = toMoney(Number(amount) || 0)
  const doc = await ensureBalanceDoc(BalanceModel)
  if (delta <= 0) return doc
  const current = toMoney(Number(doc.balance) || 0)
  doc.balance = toMoney(current + delta)
  await doc.save()
  return doc
}

export const decreaseCashBalance = async (BalanceModel: any, amount: number) => {
  const delta = toMoney(Number(amount) || 0)
  const doc = await ensureBalanceDoc(BalanceModel)
  if (delta <= 0) return doc
  const current = toMoney(Number(doc.balance) || 0)
  doc.balance = toMoney(Math.max(current - delta, 0))
  await doc.save()
  return doc
}
