export interface PaymentInput {
  amount: number
  paidAt?: Date
  note?: string
}

export interface PaymentSummary {
  paidAmount: number
  status: 'pending' | 'paid'
  paidAt: Date | null
}

export const toMoney = (value: number): number => Math.round((value + Number.EPSILON) * 100) / 100

export const normalizePayments = (payments: PaymentInput[] = []): PaymentInput[] => {
  return payments.map((payment) => ({
    amount: toMoney(Number(payment.amount) || 0),
    paidAt: payment.paidAt ?? new Date(),
    note: payment.note
  }))
}

export const getPaymentSummary = (total: number, payments: PaymentInput[]): PaymentSummary => {
  const paidAmount = toMoney(
    payments.reduce((sum, payment) => sum + (Number(payment?.amount) || 0), 0)
  )
  const totalValue = toMoney(Number(total) || 0)
  if (paidAmount >= totalValue) {
    const lastPayment = payments[payments.length - 1]
    return {
      paidAmount,
      status: 'paid',
      paidAt: lastPayment?.paidAt ?? new Date()
    }
  }

  return {
    paidAmount,
    status: 'pending',
    paidAt: null
  }
}
