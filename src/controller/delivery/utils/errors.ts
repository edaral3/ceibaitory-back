export type ErrorCode =
  | 'VALIDATION_ERROR'
  | 'NOT_FOUND'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'BAD_REQUEST'
  | 'INTERNAL_ERROR'

export class AppError extends Error {
  public status: number
  public code: ErrorCode
  public details?: unknown

  constructor(code: ErrorCode, message: string, status = 400, details?: unknown) {
    super(message)
    this.code = code
    this.status = status
    this.details = details
  }
}
