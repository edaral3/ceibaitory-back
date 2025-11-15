import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException
} from '@nestjs/common'
import Mongoose from 'mongoose'
import bcrypt from 'bcryptjs'
import { CollectionsService } from '../../core/context/collections.service'
import { RequestContextService } from '../../core/context/request-context.service'
import { getClientDetails } from '../../controller/bill'
import { getCollection } from '../../models'
import { existValueError } from '../../common/CRUD/errors'
import { ensureValidObjectId } from '../../utils/object-id.util'

@Injectable()
export class UserService {
  constructor (
    private readonly collections: CollectionsService,
    private readonly requestContext: RequestContextService
  ) {}

  async create (payload: any): Promise<any> {
    const model = this.collections.get('crud')
    try {
      const doc = new model({
        ...payload,
        pwd: bcrypt.hashSync(payload.pwd, 10)
      })
      const item = await doc.save()
      return { item, message: `${model.modelName} created` }
    } catch (error: any) {
      this.handleDuplicateError(error)
      throw new InternalServerErrorException(
        `Error creating ${model.modelName}`
      )
    }
  }

  async update (id: string, payload: any): Promise<any> {
    ensureValidObjectId(id)
    const model = this.collections.get('crud')
    try {
      const body = {
        ...payload,
        pwd: bcrypt.hashSync(payload.pwd, 10)
      }
      const item = await model
        .findByIdAndUpdate(id, { $set: body }, { new: true })
        .populate('branch')
      if (!item) {
        throw new NotFoundException(`${model.modelName} not found`)
      }
      return { item, message: `${model.modelName} updated` }
    } catch (error: any) {
      this.handleDuplicateError(error)
      if (error instanceof NotFoundException) {
        throw error
      }
      throw new InternalServerErrorException(
        `Error updating ${model.modelName}`
      )
    }
  }

  async delete (id: string): Promise<string> {
    ensureValidObjectId(id)
    const model = this.collections.get('crud')
    const user = await model.findById(id)
    if (user?.type === 'owner') {
      throw new BadRequestException(
        'No es posible elimiar usuarios propietarios'
      )
    }
    await model.findByIdAndDelete(id)
    return `${model.modelName} deleted`
  }

  async getOne (id: string): Promise<any> {
    ensureValidObjectId(id)
    const model = this.collections.get('crud')
    const item = await model.findById(id).populate('branch')
    if (!item) {
      throw new NotFoundException(`${model.modelName} not found`)
    }
    return item
  }

  async getAll (): Promise<any[]> {
    const model = this.collections.get('crud')
    return model
      .find({ company: this.requestContext.companyId }, '-pwd')
      .populate('branch')
  }

  async getBillInformation (nit: string): Promise<any> {
    try {
      const billingInformation = await getClientDetails(
        this.collections.get('company'),
        this.requestContext.companyName ?? '',
        nit.toUpperCase()
      )
      return billingInformation
    } catch (error: any) {
      if (error.message === 'El nit no existe') {
        throw new BadRequestException(error.message)
      }
      throw new InternalServerErrorException(error.message)
    }
  }

  async createOwnerUser (payload: any): Promise<{ message: string }> {
    const session = await Mongoose.startSession()
    session.startTransaction()
    let status = 'compañia'
    try {
      const { user, name, phone, pwd, companyName, phoneCompany, direction } =
        payload
      const schemaName = companyName.trim().toLowerCase().replaceAll(' ', '-')
      const companyBody = {
        name: companyName,
        schemaName,
        ownerName: name
      }
      const companyCollection = this.collections.get('company')
      const company = await companyCollection(companyBody)
      const companyData = await company.save({ session })
      status = 'sucursal'
      const branchBody = {
        name: 'Principal',
        direction,
        phone: phoneCompany
      }
      const branchCollection = getCollection('branch', schemaName)
      const branch = await branchCollection(branchBody)
      const branchData = await branch.save()
      status = 'usuario'
      const userBody = {
        user,
        name,
        pwd,
        type: 'owner',
        phone,
        company: companyData._id,
        branch: [branchData._id]
      }
      const userCollection = this.collections.get('crud')
      const userDoc = await userCollection(userBody)
      await userDoc.save({ session })
      await session.commitTransaction()
      return { message: 'Empresa creado con exito' }
    } catch (error: any) {
      await session.abortTransaction()
      if (error?.code === 11000) {
        throw new BadRequestException(
          `Ya existe el/la ${status}, ingresa otro nombre`
        )
      }
      throw new InternalServerErrorException('Error creating company')
    } finally {
      await session.endSession()
    }
  }

  async addFelInformation (payload: any): Promise<{ message: string }> {
    try {
      const { name, credentiasls, id } = payload
      await this.collections.get('company').findByIdAndUpdate(id, {
        billingCompanyName: name,
        billingCompanyCredentials: credentiasls
      })
      return { message: 'Informacion de facturacion agregada' }
    } catch {
      throw new InternalServerErrorException('Error creating company')
    }
  }

  async isCompanyBilling (): Promise<{ isBilling: boolean }> {
    try {
      const company = await this.collections
        .get('company')
        .findOne({ name: this.requestContext.companyName })
      const isBilling = !!company?.billingCompanyCredentials
      return { isBilling }
    } catch {
      throw new InternalServerErrorException('Error creating company')
    }
  }

  private handleDuplicateError (error: any): void {
    if (error?.code === 11000) {
      const message =
        existValueError(Object.keys(error.keyValue ?? {})[0]) ||
        'Ya existe un registro con los valores enviados.'
      throw new BadRequestException(message)
    }
  }
}
