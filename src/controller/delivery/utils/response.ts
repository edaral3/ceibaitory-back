export interface ApiError {
  code: string
  message: string
  details?: unknown
}

export interface ApiResponse<T> {
  data: T | null
  meta: unknown | null
  error: ApiError | null
}

export const ok = <T>(data: T, meta: unknown | null = null): ApiResponse<T> => ({
  data,
  meta,
  error: null
})

export const fail = (code: string, message: string, details?: unknown): ApiResponse<null> => ({
  data: null,
  meta: null,
  error: {
    code,
    message,
    details
  }
})
