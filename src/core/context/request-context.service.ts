import { Injectable, Scope } from '@nestjs/common'

export type BranchAccess = {
  id: string
  name: string
}

export type AuthContext = {
  userId: string
  companyId: string
  companyName: string
  role: string
  companyType?: string
  branches: BranchAccess[]
  branchId?: string
}

@Injectable({ scope: Scope.REQUEST })
export class RequestContextService {
  private authContext?: AuthContext

  setAuthContext (context: AuthContext): void {
    this.authContext = context
  }

  get userId (): string | undefined {
    return this.authContext?.userId
  }

  get companyId (): string | undefined {
    return this.authContext?.companyId
  }

  get companyName (): string | undefined {
    return this.authContext?.companyName
  }

  get companySlug (): string {
    const name = this.authContext?.companyName ?? ''
    return name.trim().toLowerCase().replaceAll(' ', '-')
  }

  get role (): string | undefined {
    return this.authContext?.role
  }

  get branches (): BranchAccess[] {
    return this.authContext?.branches ?? []
  }

  get branchId (): string | undefined {
    return this.authContext?.branchId
  }

  updateBranch (branchId?: string): void {
    if (!this.authContext) {
      return
    }
    this.authContext.branchId = branchId
  }
}
