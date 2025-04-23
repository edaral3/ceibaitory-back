import { mongoConnection } from './mongodb/mongoConnection.js'
import http from 'http'
import express from 'express'
import cors from 'cors'

import sale from './routes/sale.js'
import purchase from './routes/purchase.js'
import client from './routes/client.js'
import store from './routes/store.js'
import branch from './routes/branch.js'
import user from './routes/user.js'
import supplier from './routes/supplier.js'
import product from './routes/product.js'
import credit from './routes/credit.js'
import autenticacion from './routes/autenticacion.js'
import reports from './routes/reports.js'
import root from './routes/root.js'

const app = express()

const getCors = (): any => {
  const restrictedCors = {
    origin: [
      '*'
    ],
    methods: ['GET', 'POST', 'DELETE', 'UPDATE', 'PUT'],
    headers: ['*']
    // headers: ['authorization', 'Content-Type']
  }

  return restrictedCors
}

app.use(cors(getCors()))

app.use(express.json())

// Mongodb
mongoConnection()

// Endpoints
app.use('/', root)
app.use('/client', client)
app.use('/user', user)
app.use('/supplier', supplier)
app.use('/product', product)
app.use('/purchase', purchase)
app.use('/branch', branch)
app.use('/store', store)
app.use('/sale', sale)
app.use('/credit', credit)
app.use('/login', autenticacion)
app.use('/reports', reports)

const PORT = process.env.PORT ?? '3000'
app.set('port', PORT)

const server = http.createServer(app)
server.listen(PORT)
server.on('listening', onListening)

function onListening (): void {
  server.address()
  console.log('Listening on ' + PORT)
}

export default app
