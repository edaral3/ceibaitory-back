const toMoney = (value: number): number => Math.round((value + Number.EPSILON) * 100) / 100

const ensureBalanceDoc = async (BalanceModel: any) => {
  let doc = await BalanceModel.findOne({ key: 'default' })
  if (!doc) {
    doc = await BalanceModel.create({ key: 'default', balance: 0 })
  }
  return doc
}

export const getCashBalance = async (BalanceModel: any) => {
  const doc = await ensureBalanceDoc(BalanceModel)
  return doc
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
