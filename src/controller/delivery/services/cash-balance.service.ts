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
