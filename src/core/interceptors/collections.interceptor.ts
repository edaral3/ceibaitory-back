import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  Scope
} from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { Observable } from 'rxjs'
import { CollectionsService } from '../context/collections.service'
import { COLLECTION_SCOPE_KEY } from '../decorators/collection.decorator'
import { CollectionScope } from '../context/collection.types'

@Injectable({ scope: Scope.REQUEST })
export class CollectionsInterceptor implements NestInterceptor {
  constructor (
    private readonly reflector: Reflector,
    private readonly collectionsService: CollectionsService
  ) {}

  intercept (
    context: ExecutionContext,
    next: CallHandler
  ): Observable<any> {
    const scope = this.reflector.getAllAndOverride<CollectionScope | undefined>(
      COLLECTION_SCOPE_KEY,
      [context.getHandler(), context.getClass()]
    )

    if (scope) {
      this.collectionsService.useScope(scope)
    }

    return next.handle()
  }
}
