import { getCollection } from '../../../models'
import { resetDriverReceivedCashBalance } from './cash-balance.service'

const GT_TIME_ZONE = 'America/Guatemala'
const RESET_HOUR = 1
const MINUTE_MS = 60 * 1000

const normalizeCompanyName = (value?: string | null): string =>
  String(value ?? '').trim().toLowerCase().replaceAll(' ', '-')

const msUntilNextGuatemalaReset = (now = new Date()): number => {
  const gtNow = new Date(now.toLocaleString('en-US', { timeZone: GT_TIME_ZONE }))
  const nextGtReset = new Date(gtNow)
  nextGtReset.setHours(RESET_HOUR, 0, 0, 0)
  if (gtNow >= nextGtReset) {
    nextGtReset.setDate(nextGtReset.getDate() + 1)
  }
  return Math.max(nextGtReset.getTime() - gtNow.getTime(), MINUTE_MS)
}

const resetDeliveryReceivedCashForAllCompanies = async (): Promise<void> => {
  const companyModel = getCollection('company', '')
  const companies = await companyModel.find({}, 'name').lean()
  const resetAt = new Date()

  await Promise.all(
    companies
      .map((company: any) => normalizeCompanyName(company?.name))
      .filter(Boolean)
      .map(async (companyName: string) => {
        const balanceModel = getCollection('deliveryCashBalance', companyName)
        const cashEventModel = getCollection('deliveryCashEvent', companyName)
        await resetDriverReceivedCashBalance(balanceModel, cashEventModel, resetAt)
      })
  )
}

export const startDeliveryCashResetScheduler = (): void => {
  const scheduleNextRun = () => {
    const delay = msUntilNextGuatemalaReset()
    setTimeout(() => {
      resetDeliveryReceivedCashForAllCompanies()
        .catch((error) => {
          console.error('[delivery-cash-reset] failed', error)
        })
        .finally(scheduleNextRun)
    }, delay)
  }

  scheduleNextRun()
}
