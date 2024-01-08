import { mongoConnection } from './mongodb/mongoConnection'
import { redisConnection } from './redisdb/redisConnection'
import http from 'http'
import express from 'express'
import cors from 'cors'

import sale from './routes/sale'
import purchase from './routes/purchase'
import client from './routes/client'
import store from './routes/store'
import branch from './routes/branch'
import user from './routes/user'
import supplier from './routes/supplier'
import product from './routes/product'
import credit from './routes/credit'
import autenticacion from './routes/autenticacion'
import reports from './routes/reports'
import root from './routes/root'

const app = express()

const getCors = (): any => {
  const restrictedCors = {
    origin: [
      '*'
    ],
    methods: ['GET', 'POST', 'DELETE', 'UPDATE', 'PUT'],
    headers: ['*']
    //headers: ['authorization', 'Content-Type']
  }

  return restrictedCors
}

app.use(cors(getCors()))

app.use(express.json())

// Mongodb
mongoConnection()

// Redis
redisConnection()

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

const PORT = process.env.PORT ?? '3005'
app.set('port', PORT)

const server = http.createServer(app)
server.listen(PORT)
server.on('listening', onListening)

function onListening (): void {
  server.address()
  console.log('Listening on ' + PORT)
}

module.exports = app
