import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException
} from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { JwtService } from '@nestjs/jwt'
import { FastifyRequest } from 'fastify'
import { AppConfigService } from '../config/app-config.service'
import { RequestContextService } from '../context/request-context.service'
import { ROLES_KEY } from './roles.decorator'
import { getCollection } from '../../models'

type JwtPayload = {
  id: string
  user: string
  company: { name: string; _id: string }
  branches: Array<{ name: string; _id: string }>
  roles: string
  type?: string
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  private readonly jwtService: JwtService

  constructor (
    private readonly reflector: Reflector,
    private readonly configService: AppConfigService,
    private readonly context: RequestContextService
  ) {
    this.jwtService = new JwtService({
      secret: this.configService.jwtSecret
    })
  }

  async canActivate (context: ExecutionContext): Promise<boolean> {
    const requiredRoles =
      this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
        context.getHandler(),
        context.getClass()
      ]) ?? []

    const request = context
      .switchToHttp()
      .getRequest<FastifyRequest & { user?: JwtPayload }>()

    const token = this.extractToken(request)
    const payload = await this.verifyToken(token)
    if (
      requiredRoles.length > 0 &&
      !requiredRoles.includes(payload.roles)
    ) {
      throw new UnauthorizedException('Permissions error')
    }

    const companySlug =
      payload.company?.name?.trim().toLowerCase().replaceAll(' ', '-') ?? ''
    const userCollection = getCollection('user', companySlug)
    const user = await userCollection.findById(payload.id)
    if (!user) {
      throw new UnauthorizedException('Invalid user')
    }

    const branchHeader = this.normalizeHeader(
      request.headers['branch'] as string | string[] | undefined
    )
    const isOwner = user.type === 'owner' || user.type === 'owner-farm'
    if (!isOwner && !branchHeader) {
      throw new UnauthorizedException('Branch header required')
    }

    if (!isOwner && branchHeader) {
      const branchAccess = (user.branch ?? []).some((branch: any) => {
        if (typeof branch === 'string') {
          return branch === branchHeader
        }
        if (branch?._id) {
          return branch._id.toString() === branchHeader
        }
        return branch?.toString() === branchHeader
      })
      if (!branchAccess) {
        throw new UnauthorizedException('Permissions error')
      }
    }

    this.context.setAuthContext({
      userId: payload.id,
      companyId: payload.company?._id,
      companyName: payload.company?.name,
      role: payload.roles,
      companyType: payload.type,
      branches:
        (payload.branches ?? []).map((branch) => ({
          id: branch._id,
          name: branch.name
        })) ?? [],
      branchId: branchHeader
    })

    request.user = payload
    return true
  }

  private normalizeHeader (value?: string | string[]): string | undefined {
    if (Array.isArray(value)) {
      return value[0]
    }
    return value
  }

  private extractToken (request: FastifyRequest): string {
    const header = request.headers.authorization
    if (!header) {
      throw new UnauthorizedException('Missing token')
    }
    if (header.startsWith('Bearer ')) {
      return header.slice(7)
    }
    return header
  }

  private async verifyToken (token: string): Promise<JwtPayload> {
    try {
      return await this.jwtService.verifyAsync<JwtPayload>(token)
    } catch {
      throw new UnauthorizedException('Invalid token')
    }
  }
}
