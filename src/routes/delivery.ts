import express from 'express'
import multer from 'multer'
import swaggerUi from 'swagger-ui-express'
import { validateToken } from '../middleware/auth'
import { setCollection } from '../middleware/collection'
import { requestId } from '../controller/delivery/middleware/request-id'
import { requestLogger } from '../controller/delivery/middleware/request-logger'
import { errorHandler } from '../controller/delivery/middleware/error-handler'
import { validateBody } from '../controller/delivery/middleware/validate'
import { createClientSchema, updateClientSchema } from '../controller/delivery/validators/client'
import { createSaleSchema, updateSaleSchema } from '../controller/delivery/validators/sale'
import { toggleVisitSchema, assignVisitSchema } from '../controller/delivery/validators/visit'
import * as clientsController from '../controller/delivery/controllers/clients.controller'
import * as salesController from '../controller/delivery/controllers/sales.controller'
import * as visitsController from '../controller/delivery/controllers/visits.controller'
import * as cashBalanceController from '../controller/delivery/controllers/cash-balance.controller'
import { AppError } from '../controller/delivery/utils/errors'
import { openApiSpec } from '../controller/delivery/openapi'

const router = express.Router()

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp']
    if (!allowed.includes(file.mimetype)) {
      return cb(new AppError('VALIDATION_ERROR', 'Invalid file type', 400))
    }
    return cb(null, true)
  }
})

router.use(requestId)
router.use(requestLogger)

router.use('/docs', swaggerUi.serve, swaggerUi.setup(openApiSpec))

const authRoles = ['owner', 'admin', 'worker']

router.post(
  '/clients',
  validateToken(authRoles),
  setCollection('farm'),
  validateBody(createClientSchema),
  clientsController.create
)
router.get(
  '/clients',
  validateToken(authRoles),
  setCollection('farm'),
  clientsController.list
)
router.get(
  '/delivery/cash-balance',
  validateToken(authRoles),
  setCollection('farm'),
  cashBalanceController.get
)
router.get(
  '/clients/:id',
  validateToken(authRoles),
  setCollection('farm'),
  clientsController.getOne
)
router.put(
  '/clients/:id',
  validateToken(authRoles),
  setCollection('farm'),
  validateBody(updateClientSchema),
  clientsController.update
)
router.patch(
  '/clients/:id',
  validateToken(authRoles),
  setCollection('farm'),
  validateBody(updateClientSchema),
  clientsController.update
)
router.delete(
  '/clients/:id',
  validateToken(authRoles),
  setCollection('farm'),
  clientsController.remove
)
router.post(
  '/clients/:id/photo',
  validateToken(authRoles),
  setCollection('farm'),
  upload.single('photo'),
  clientsController.uploadPhoto
)

router.post(
  '/sales',
  validateToken(authRoles),
  setCollection('farm'),
  validateBody(createSaleSchema),
  salesController.create
)
router.get(
  '/sales',
  validateToken(authRoles),
  setCollection('farm'),
  salesController.list
)
router.get(
  '/sales/:id',
  validateToken(authRoles),
  setCollection('farm'),
  salesController.getOne
)
router.get(
  '/sales/:id/receipt',
  validateToken(authRoles),
  setCollection('farm'),
  salesController.receipt
)
router.put(
  '/sales/:id',
  validateToken(authRoles),
  setCollection('farm'),
  validateBody(updateSaleSchema),
  salesController.update
)
router.delete(
  '/sales/:id',
  validateToken(authRoles),
  setCollection('farm'),
  salesController.remove
)
router.patch(
  '/sales/:id/cancel',
  validateToken(authRoles),
  setCollection('farm'),
  salesController.cancel
)

router.get(
  '/delivery/visits',
  validateToken(authRoles),
  setCollection('farm'),
  visitsController.list
)
router.get(
  '/delivery/visits/today',
  validateToken(authRoles),
  setCollection('farm'),
  visitsController.listToday
)
router.post(
  '/delivery/visits/assign',
  validateToken(authRoles),
  setCollection('farm'),
  validateBody(assignVisitSchema),
  visitsController.assign
)
router.post(
  '/delivery/visits/toggle',
  validateToken(authRoles),
  setCollection('farm'),
  validateBody(toggleVisitSchema),
  visitsController.toggle
)

router.use(errorHandler)

export default router
