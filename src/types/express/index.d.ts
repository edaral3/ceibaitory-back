import 'express-serve-static-core'

declare module 'express-serve-static-core' {
  interface Request {
    id?: string
    user?: unknown
    file?: Express.Multer.File
    CollectionDeliveryClient?: any
    CollectionDeliverySale?: any
    CollectionDeliveryVisit?: any
    CollectionDeliveryVisitAssignment?: any
    CollectionDeliveryVisitCarryover?: any
    CollectionDeliveryCashBalance?: any
    CollectionDeliveryCashEvent?: any
    companyName?: string
  }
}
