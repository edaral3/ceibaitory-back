export interface Pagination {
  page: number
  pageSize: number
  skip: number
  take: number
}

const toInt = (value: unknown, fallback: number): number => {
  if (typeof value === 'string') {
    const parsed = Number.parseInt(value, 10)
    return Number.isNaN(parsed) ? fallback : parsed
  }
  if (typeof value === 'number') {
    return Number.isNaN(value) ? fallback : Math.trunc(value)
  }
  return fallback
}

export const getPagination = (pageValue: unknown, pageSizeValue: unknown): Pagination => {
  const page = Math.max(1, toInt(pageValue, 1))
  const pageSizeRaw = Math.max(1, toInt(pageSizeValue, 20))
  const pageSize = Math.min(pageSizeRaw, 100)
  return {
    page,
    pageSize,
    skip: (page - 1) * pageSize,
    take: pageSize
  }
}
