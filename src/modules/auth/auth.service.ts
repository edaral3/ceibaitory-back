import {
  Injectable,
  UnauthorizedException
} from '@nestjs/common'
import bcrypt from 'bcryptjs'
import { JwtService } from '@nestjs/jwt'
import { CollectionsService } from '../../core/context/collections.service'
import { AppConfigService } from '../../core/config/app-config.service'
import { getCollection } from '../../models'

@Injectable()
export class AuthService {
  private readonly jwtService: JwtService

  constructor (
    private readonly collections: CollectionsService,
    private readonly config: AppConfigService
  ) {
    this.jwtService = new JwtService({
      secret: this.config.jwtSecret
    })
  }

  async login (payload: { user: string; pwd: string }): Promise<any> {
    const userModel = this.collections.get('crud')
    const user = await userModel
      .findOne({ user: payload.user })
      .populate('company')
    const msj = 'Usuario o contraseña incorrecto'
    if (!user) {
      throw new UnauthorizedException(msj)
    }
    const passwordMatch = bcrypt.compareSync(payload.pwd, user.pwd)
    if (!passwordMatch) {
      throw new UnauthorizedException(msj)
    }
    const companyName = user.company?.schemaName
      ?.trim()
      .toLowerCase()
      .replaceAll(' ', '-')
    const branchCollection = getCollection('branch', companyName ?? '')
    const branches: Array<{ name: string; _id: string }> = []
    if (user.type === 'owner') {
      const branchesAux = await branchCollection.find()
      for (const branch of branchesAux) {
        branches.push({ name: branch.name, _id: branch._id })
      }
    } else {
      for (const branch of user.branch ?? []) {
        const item = await branchCollection.findById(branch)
        if (item) {
          branches.push({ name: item.name, _id: item._id })
        }
      }
    }
    const newToken = {
      id: user._id,
      user: user.user,
      company: { name: user.company.name, _id: user.company._id },
      branches,
      roles: user.type,
      type: user.company.type
    }
    const jwt = await this.jwtService.signAsync(newToken)
    return { jwt }
  }

  async validateToken (token: string): Promise<any> {
    try {
      const decoded = await this.jwtService.verifyAsync(token)
      return { user: decoded }
    } catch (error) {
      throw new UnauthorizedException('Error with jwt')
    }
  }
}
