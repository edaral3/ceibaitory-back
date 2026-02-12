// tird-party modules
import http from 'http'
import express from 'express'
import cors from 'cors'

// custom modules
import sale from './src/routes/sale'
import purchase from './src/routes/purchase'
import client from './src/routes/client'
import store from './src/routes/store'
import storeItems from './src/routes/store-items'
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
import delivery from './src/routes/delivery'
import { mongoConnection } from './src/mongodb/mongoConnection'

const app = express()

app.use((req, res, next) => {
  const origin = typeof req.headers.origin === 'string' ? req.headers.origin : '*'
  res.header('Access-Control-Allow-Origin', origin)
  res.header('Vary', 'Origin')
  res.header('Access-Control-Allow-Methods', 'GET,POST,DELETE,UPDATE,PUT,PATCH,OPTIONS')
  res.header('Access-Control-Allow-Headers', 'authorization,content-type,user,pwd,branch')
  if (req.method === 'OPTIONS') {
    res.sendStatus(204)
    return
  }
  next()
})

const getCors = (): any => {
  const restrictedCors = {
    origin: [
      'https://ceibaitory.com/*',
      //'http://localhost:3000/*'
    ],
    methods: ['GET', 'POST', 'DELETE', 'UPDATE', 'PUT', 'PATCH', 'OPTIONS', '*'],
    allowedHeaders: ['authorization', 'content-type', 'user', 'pwd', 'branch'],
    optionsSuccessStatus: 204
  }

  return restrictedCors
}

app.use(cors(getCors()))
app.options('*', cors(getCors()))

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
app.use('/store-items', storeItems)
app.use('/api', delivery)


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
