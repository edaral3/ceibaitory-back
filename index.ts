// tird-party modules
import http from 'http'
import express from 'express'
import cors from 'cors'

// custom modules
import sale from './src/routes/sale'
import purchase from './src/routes/purchase'
import client from './src/routes/client'
import store from './src/routes/store'
import branch from './src/routes/branch'
import user from './src/routes/user'
import supplier from './src/routes/supplier'
import product from './src/routes/product'
import credit from './src/routes/credit'
import autenticacion from './src/routes/autenticacion'
import reports from './src/routes/reports'
import root from './src/routes/root'
import chat from './src/routes/chat'
import farm from './src/routes/farm'
import { mongoConnection } from './src/mongodb/mongoConnection'

const app = express()

const getCors = (): any => {
  const restrictedCors = {
    origin: [
      'https://ceibaitory.com',
      'https://ceibaitory.vercel.app',
      'http://localhost:3000',
    ],
    methods: ['GET', 'POST', 'DELETE', 'UPDATE', 'PUT'],
    headers: ['authorization', 'Content-Type', '*']
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
app.use('/chat', chat)
app.use('/farm', farm)

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
