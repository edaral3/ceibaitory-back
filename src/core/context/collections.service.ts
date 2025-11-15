import { Injectable, Scope } from '@nestjs/common'
import { getCollection } from '../../models'
import { RequestContextService } from './request-context.service'
import {
  CollectionRegistry,
  CollectionScope
} from './collection.types'

@Injectable({ scope: Scope.REQUEST })
export class CollectionsService {
  private registry: CollectionRegistry = {}
  private scope?: CollectionScope

  constructor (private readonly context: RequestContextService) {}

  useScope (scope: CollectionScope): void {
    this.scope = scope
    this.registry = this.buildRegistry(scope)
  }

  get<T extends keyof CollectionRegistry> (key: T): CollectionRegistry[T] {
    const value = this.registry[key]
    if (!value) {
      throw new Error(
        `Collection "${String(key)}" not available for scope "${this.scope}"`
      )
    }
    return value
  }

  tryGet<T extends keyof CollectionRegistry> (
    key: T
  ): CollectionRegistry[T] | undefined {
    return this.registry[key]
  }

  private buildRegistry (scope: CollectionScope): CollectionRegistry {
    const registry: CollectionRegistry = {}
    const companySlug = this.context.companySlug
    const normalizedScope = scope === 'userOwner' ? 'user' : scope

    if (scope === 'company') {
      registry.company = getCollection('company', '')
      return registry
    }

    if (scope !== 'report' && scope !== 'farm' && companySlug) {
      registry.crud = getCollection(normalizedScope, companySlug)
    }

    switch (scope) {
      case 'userOwner':
        registry.company = getCollection('company', '')
        registry.crud = getCollection('user', companySlug)
        break
      case 'user':
        registry.company = getCollection('company', '')
        registry.crud = getCollection('user', companySlug)
        if (companySlug) {
          registry.branch = getCollection('branch', companySlug)
        }
        break
      case 'purchase':
        registry.product = getCollection('product', companySlug)
        registry.purchase = getCollection('purchase', companySlug)
        break
      case 'sale':
        registry.product = getCollection('product', companySlug)
        registry.company = getCollection('company', '')
        registry.sale = getCollection('sale', companySlug)
        break
      case 'credit':
        registry.client = getCollection('client', companySlug)
        registry.product = getCollection('product', companySlug)
        registry.company = getCollection('company', '')
        registry.credit = getCollection('credit', companySlug)
        break
      case 'report':
        registry.product = getCollection('product', companySlug)
        registry.sale = getCollection('sale', companySlug)
        registry.storeItem = getCollection('storeItem', companySlug)
        registry.store = getCollection('store', companySlug)
        break
      case 'farm':
        registry.shed = getCollection('shed', companySlug)
        registry.concentrateStore = getCollection(
          'concentrateStore',
          companySlug
        )
        registry.batch = getCollection('batch', companySlug)
        registry.user = getCollection('user', '')
        registry.concentrateStoreInfo = getCollection(
          'concentrateStoreInfo',
          companySlug
        )
        registry.batchInfo = getCollection('batchInfo', companySlug)
        registry.chickenSale = getCollection('chickenSale', companySlug)
        registry.client = getCollection('client', companySlug)
        registry.eggSale = getCollection('eggSale', companySlug)
        registry.eggPrice = getCollection('eggPrice', companySlug)
        registry.concentrateType = getCollection(
          'concentrateType',
          companySlug
        )
        break
      case 'store':
      case 'storeItem':
        registry.supplier = getCollection('supplier', companySlug)
        registry.storeItem = getCollection('storeItem', companySlug)
        registry.store = getCollection('store', companySlug)
        registry.product = getCollection('product', companySlug)
        registry.storeHistory = getCollection('storeHistory', companySlug)
        registry.branch = getCollection('branch', companySlug)
        break
      default:
        registry.supplier = getCollection('supplier', companySlug)
        break
    }

    return registry
  }
}
