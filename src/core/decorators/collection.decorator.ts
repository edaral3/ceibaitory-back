import { SetMetadata } from '@nestjs/common'
import { CollectionScope } from '../context/collection.types'

export const COLLECTION_SCOPE_KEY = 'collectionScope'
export const UseCollection = (scope: CollectionScope) =>
  SetMetadata(COLLECTION_SCOPE_KEY, scope)
