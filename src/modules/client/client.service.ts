import {
  Injectable,
  InternalServerErrorException,
  BadRequestException,
  NotFoundException
} from '@nestjs/common'
import { CollectionsService } from '../../core/context/collections.service'
import { RequestContextService } from '../../core/context/request-context.service'
import { existValueError } from '../../common/CRUD/errors'
import { ensureValidObjectId } from '../../utils/object-id.util'

@Injectable()
export class ClientService {
  constructor (
    private readonly collections: CollectionsService,
    private readonly requestContext: RequestContextService
  ) {}

  async create (payload: any): Promise<any> {
    const model = this.collections.get('crud')
    try {
      const doc = new model(payload)
      const item = await doc.save()
      return {
        item,
        message: `${model.modelName} created`
      }
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
      const item = await model.findByIdAndUpdate(
        id,
        { $set: payload },
        { new: true }
      )
      if (!item) {
        throw new NotFoundException(`${model.modelName} not found`)
      }
      return {
        item,
        message: `${model.modelName} updated`
      }
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
    await model.findByIdAndDelete(id)
    return `${model.modelName} deleted`
  }

  async getOne (id: string): Promise<any> {
    ensureValidObjectId(id)
    const model = this.collections.get('crud')
    const item = await model.findById(id)
    if (!item) {
      throw new NotFoundException(`${model.modelName} not found`)
    }
    return item
  }

  async getAll (): Promise<any[]> {
    const model = this.collections.get('crud')
    const query =
      this.requestContext.branchId != null
        ? { branch: this.requestContext.branchId }
        : {}
    return model.find(query)
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
