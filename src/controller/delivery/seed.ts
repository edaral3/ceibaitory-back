import mongoose from 'mongoose'
import config from '../../config/config'
import { getCollection } from '../../models'

const normalizeCompany = (companyName: string): string => {
  return companyName.trim().toLowerCase().replaceAll(' ', '-')
}

const seed = async (): Promise<void> => {
  const rawCompany = process.env.SEED_COMPANY_NAME
  if (!rawCompany) {
    throw new Error('SEED_COMPANY_NAME is required')
  }
  const companyName = normalizeCompany(rawCompany)

  const mongoUrl = config.db.mongo.host
  if (!mongoUrl) {
    throw new Error('DB_MONGO_HOST is required')
  }

  await mongoose.connect(mongoUrl)

  const Client = getCollection('deliveryClient', companyName)
  const Sale = getCollection('deliverySale', companyName)

  const existing = await Client.countDocuments()
  if (existing > 0) {
    console.log('Seed skipped: delivery clients already exist')
    await mongoose.connection.close()
    return
  }

  const client1 = await Client.create({
    name: 'Tienda El Progreso',
    description: 'Cliente minorista',
    addressText: 'Barrio El Centro, Guastatoya, El Progreso, Guatemala',
    phone: '+50255550101',
    mapUrl: 'https://www.google.com/maps?q=14.85417,-90.06944',
    lat: 14.85417,
    lng: -90.06944,
    visitFrequency: 'weekly',
    visitDays: ['mon', 'thu']
  })

  const client2 = await Client.create({
    name: 'Abarrotes La Ceiba',
    addressText: 'Barrio El Porvenir, Guastatoya, El Progreso, Guatemala',
    phone: '+50255550102',
    mapUrl: 'https://www.google.com/maps?q=14.85840,-90.06220',
    lat: 14.8584,
    lng: -90.0622,
    visitFrequency: 'biweekly',
    visitDays: ['wed']
  })

  await Sale.create({
    clientId: client1.id ?? client1._id,
    eggType: 'caja',
    quantity: 12,
    total: 120
  })

  await Sale.create({
    clientId: client2.id ?? client2._id,
    eggType: 'carton',
    quantity: 30,
    total: 300
  })

  await mongoose.connection.close()
  console.log('Seed completed')
}

seed().catch((error) => {
  console.error(error)
  process.exit(1)
})
